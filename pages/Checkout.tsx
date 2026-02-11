
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, CreditCard, Wallet, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createPayment } from '../services/paymentService';
import { supabase } from '../services/supabaseClient';

const Checkout: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'cart' | 'details' | 'payment'>('cart');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (items.length === 0 && !showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="bg-amber-100 p-6 rounded-full">
          <Trash2 size={48} className="text-amber-900 opacity-50" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Корзина пуста</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-8 py-3 bg-amber-900 text-white rounded-full font-semibold">Перейти в меню</button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("Пожалуйста, войдите в профиль, чтобы сделать заказ");
      navigate('/profile');
      return;
    }

    setIsProcessing(true);
    
    // 1. Сохраняем заказ в Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        items: items,
        total_amount: totalAmount,
        delivery_address: address,
        contact_phone: phone,
        comment: comment,
        payment_method: paymentMethod,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      alert('Ошибка при создании заказа: ' + error.message);
      setIsProcessing(false);
      return;
    }

    // 2. Обработка оплаты если картой
    if (paymentMethod === 'card') {
      const paymentResult = await createPayment(data.id, totalAmount, `Заказ #${data.id}`);
      if (!paymentResult.success) {
        alert(paymentResult.message);
        setIsProcessing(false);
        return;
      }
    }

    setIsProcessing(false);
    clearCart();
    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <ArrowRight size={40} className="text-green-600 -rotate-90" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Заказ принят!</h2>
        <p className="text-gray-500">Мы скоро свяжемся с вами.</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-amber-900 text-white rounded-xl font-semibold">Вернуться в меню</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <span className={step === 'cart' ? 'font-bold text-amber-900' : ''}>1. Корзина</span>
        <ArrowRight size={14} />
        <span className={step === 'details' ? 'font-bold text-amber-900' : ''}>2. Детали</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 'cart' ? (
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
              {items.map(item => (
                <div key={item.dish.id} className="flex gap-4 items-center">
                  <img src={item.dish.image} alt={item.dish.name} className="w-20 h-20 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.dish.name}</h3>
                    <p className="text-amber-700 font-medium">{item.dish.price} ₽</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.dish.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Minus size={14} /></button>
                    <span className="font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.dish.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
              <h3 className="text-xl font-bold text-gray-800">Данные доставки</h3>
              <div className="space-y-4">
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Адрес доставки" className="w-full p-3 border rounded-lg" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Телефон" className="w-full p-3 border rounded-lg" />
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Комментарий к заказу" className="w-full p-3 border rounded-lg h-24" />
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setPaymentMethod('card')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${paymentMethod === 'card' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'text-gray-500'}`}><CreditCard size={24} /> <span>Картой</span></button>
                  <button onClick={() => setPaymentMethod('cash')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${paymentMethod === 'cash' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'text-gray-500'}`}><Wallet size={24} /> <span>Наличными</span></button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Итого</h3>
            <div className="flex justify-between items-center mb-6">
              <span className="text-2xl font-bold text-amber-900">{totalAmount} ₽</span>
            </div>
            {step === 'cart' ? (
              <button onClick={() => setStep('details')} className="w-full bg-amber-900 text-white py-3.5 rounded-xl font-bold">Далее</button>
            ) : (
              <button onClick={handlePlaceOrder} disabled={!address || !phone || isProcessing} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50">
                {isProcessing ? 'Загрузка...' : `Оплатить ${totalAmount} ₽`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
