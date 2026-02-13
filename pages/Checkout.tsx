
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Loader2, ShieldCheck, CreditCard, Phone } from 'lucide-react';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../apiClient.ts';
import { initiateYooKassaPayment } from '../services/paymentService.ts';

const Checkout: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'cart' | 'details'>('cart');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [comment, setValueComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (items.length === 0 && !showSuccess) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in duration-500">
      <div className="bg-amber-100/50 p-10 rounded-[3rem]"><ShoppingBag size={64} className="text-amber-900/20" /></div>
      <h2 className="text-3xl font-black text-amber-950 italic tracking-tighter">Корзина пуста</h2>
      <button onClick={() => navigate('/')} className="px-10 py-5 bg-amber-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl">В меню</button>
    </div>
  );

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/profile'); return; }
    if (!phone) { alert("Пожалуйста, введите номер телефона для связи."); return; }
    
    setIsProcessing(true);
    setPaymentStep(true);

    try {
      // Формируем данные заказа, исключая поля, которых может не быть в БД (payment_method, payment_status)
      // Оставляем только те, что подтверждены логами как существующие
      const orderPayload: any = { 
        user_id: user.id, 
        items, 
        total_amount: totalAmount, 
        delivery_address: address, 
        contact_phone: phone,
        comment, 
        status: 'pending'
      };

      // 1. Создаем заказ
      const order = await api.orders.create(orderPayload);

      // 2. Инициируем имитацию оплаты ЮKassa
      const paymentResult = await initiateYooKassaPayment(order.id, totalAmount);

      if (paymentResult.success) {
        clearCart();
        setShowSuccess(true);
      } else {
        alert(`Оплата не прошла: ${paymentResult.message}. Заказ создан, вы можете оплатить его позже.`);
        clearCart();
        navigate('/profile');
      }
    } catch (err: any) { 
      console.error("Checkout Error:", err);
      alert(err.message || "Ошибка при создании заказа. Проверьте правильность данных."); 
    } finally { 
      setIsProcessing(false); 
      setPaymentStep(false);
    }
  };

  if (showSuccess) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-700">
      <div className="w-32 h-32 bg-green-100 rounded-[3rem] flex items-center justify-center"><ShieldCheck size={56} className="text-green-600" /></div>
      <h2 className="text-4xl font-black text-amber-950 italic tracking-tighter">Заказ принят!</h2>
      <p className="text-gray-500 font-medium">Оплата успешно проведена через ЮKassa.<br/>Начинаем готовить ваш заказ.</p>
      <button onClick={() => navigate('/')} className="px-10 py-5 bg-amber-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl">В начало</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {step === 'cart' ? (
            <div className="bg-white rounded-[4rem] p-10 space-y-8 shadow-sm border border-amber-50">
              <h3 className="text-2xl font-black text-amber-950 italic tracking-tighter">Ваш выбор</h3>
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.dish.id} className="flex gap-6 items-center">
                    <img src={item.dish.image} alt={item.dish.name} className="w-20 h-20 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <h3 className="font-black text-amber-950">{item.dish.name}</h3>
                      <p className="text-orange-600 font-black text-sm">{item.dish.price} ₽</p>
                    </div>
                    <div className="flex items-center gap-4 bg-amber-50/50 p-2 rounded-xl">
                      <button onClick={() => updateQuantity(item.dish.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><Minus size={12} /></button>
                      <span className="font-black text-amber-950 text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.dish.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><Plus size={12} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.dish.id)} className="p-3 text-red-200 hover:text-red-500 transition"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[4rem] p-10 space-y-10 shadow-sm border border-amber-50">
              <h3 className="text-2xl font-black text-amber-950 italic tracking-tighter">Детали доставки</h3>
              <div className="space-y-6">
                <div className="relative">
                   <Phone className="absolute left-6 top-6 text-amber-900/20" size={20} />
                   <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="Ваш телефон (обязательно)" 
                    className="w-full p-6 pl-16 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-amber-100 transition-all" 
                    required
                  />
                </div>
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  placeholder="Адрес доставки" 
                  className="w-full p-6 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-amber-100 transition-all" 
                  required
                />
                <textarea 
                  value={comment} 
                  onChange={e => setValueComment(e.target.value)} 
                  placeholder="Комментарий курьеру" 
                  className="w-full p-6 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 h-32 border-none focus:ring-4 focus:ring-amber-100 transition-all resize-none" 
                />
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <div className="bg-amber-950 text-white rounded-[4rem] p-10 sticky top-24 shadow-2xl space-y-8 text-center">
            {paymentStep ? (
              <div className="py-10 space-y-6 animate-pulse">
                <CreditCard size={48} className="mx-auto text-orange-500" />
                <p className="font-black italic uppercase text-[10px] tracking-widest">Обработка через ЮKassa...</p>
                <Loader2 className="animate-spin mx-auto text-white/20" size={32} />
              </div>
            ) : (
              <>
                <p className="text-xl font-black italic tracking-tighter opacity-60">Итого</p>
                <div className="text-5xl font-black italic tracking-tighter">{totalAmount} ₽</div>
                <button 
                  onClick={() => step === 'cart' ? setStep('details') : handlePlaceOrder()} 
                  disabled={isProcessing || (step === 'details' && (!address || !phone))}
                  className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 disabled:opacity-30 transition-all"
                >
                  {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : step === 'cart' ? 'Оформить' : 'Заказать и Оплатить'}
                </button>
                <div className="flex items-center justify-center gap-2 opacity-30 mt-4">
                   <CreditCard size={14} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Безопасная оплата ЮKassa</span>
                </div>
                {step === 'details' && (
                  <button onClick={() => setStep('cart')} className="w-full text-[10px] font-black uppercase opacity-40 hover:opacity-100 mt-4">Назад в корзину</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Checkout;
