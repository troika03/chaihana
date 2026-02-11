import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, CreditCard, Wallet, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createPayment } from '../services/paymentService';
import Modal from '../components/ui/Modal';

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
        <p className="text-gray-500">Добавьте вкусные блюда из меню</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-8 py-3 bg-amber-900 text-white rounded-full font-semibold hover:bg-amber-800 transition"
        >
          Перейти в меню
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // 1. Create Order Object (Mock ID generation)
    const orderId = Date.now();
    const orderDetails = {
      id: orderId,
      items,
      total: totalAmount,
      address,
      phone,
      comment,
      paymentMethod,
      date: new Date().toISOString()
    };

    // 2. Save to local history (Mock DB)
    const existingOrders = JSON.parse(localStorage.getItem('zhulebino_orders') || '[]');
    localStorage.setItem('zhulebino_orders', JSON.stringify([...existingOrders, orderDetails]));

    // 3. Process Payment if Card
    if (paymentMethod === 'card') {
      const paymentResult = await createPayment(orderId, totalAmount, `Заказ #${orderId}`);
      if (!paymentResult.success) {
        alert(paymentResult.message);
        setIsProcessing(false);
        return;
      }
    }

    // 4. Success
    setIsProcessing(false);
    clearCart();
    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <ArrowRight size={40} className="text-green-600 -rotate-90" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Заказ принят!</h2>
          <p className="text-gray-500">Оператор свяжется с вами в ближайшее время для подтверждения.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-amber-900 text-white rounded-xl font-semibold hover:bg-amber-800 transition shadow-lg"
        >
          Вернуться на главную
        </button>
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
        {/* Left Column: Form/Items */}
        <div className="lg:col-span-2 space-y-6">
          {step === 'cart' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 space-y-6">
                {items.map(item => (
                  <div key={item.dish.id} className="flex gap-4 items-center">
                    <img 
                      src={item.dish.image} 
                      alt={item.dish.name} 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{item.dish.name}</h3>
                      <p className="text-amber-700 font-medium">{item.dish.price} ₽</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-semibold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 animate-in slide-in-from-right duration-300">
              <h3 className="text-xl font-bold text-gray-800">Данные доставки</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес доставки</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Улица, дом, подъезд, этаж, квартира"
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Код домофона, пожелания к заказу"
                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-amber-500 outline-none h-24 resize-none"
                  />
                </div>

                <div className="pt-4">
                   <label className="block text-sm font-medium text-gray-700 mb-3">Способ оплаты</label>
                   <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'card' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-gray-100 text-gray-500'}`}
                     >
                       <CreditCard size={24} />
                       <span className="font-semibold">Картой (ЮKassa)</span>
                     </button>
                     <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'cash' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-gray-100 text-gray-500'}`}
                     >
                       <Wallet size={24} />
                       <span className="font-semibold">Наличными</span>
                     </button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Ваш заказ</h3>
            <div className="space-y-2 mb-4 text-sm text-gray-500">
               <div className="flex justify-between">
                 <span>Товары ({items.length})</span>
                 <span>{totalAmount} ₽</span>
               </div>
               <div className="flex justify-between">
                 <span>Доставка</span>
                 <span className="text-green-600 font-medium">Бесплатно</span>
               </div>
            </div>
            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Итого</span>
                <span className="text-2xl font-bold text-amber-900">{totalAmount} ₽</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button 
                onClick={() => setStep('details')}
                className="w-full bg-amber-900 text-white py-3.5 rounded-xl font-bold hover:bg-amber-800 transition"
              >
                Оформить заказ
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                 <button 
                  onClick={handlePlaceOrder}
                  disabled={!address || !phone || isProcessing}
                  className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Обработка...' : `Оплатить ${totalAmount} ₽`}
                </button>
                <button 
                  onClick={() => setStep('cart')}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Назад
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
