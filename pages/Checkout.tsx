
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Loader2, CreditCard, Phone, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in duration-500">
      <div className="bg-amber-100/50 p-10 rounded-[3rem]"><ShoppingBag size={64} className="text-amber-900/20" /></div>
      <h2 className="text-3xl font-black text-amber-950 italic tracking-tighter">Корзина пуста</h2>
      <button onClick={() => navigate('/')} className="px-10 py-5 bg-amber-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl">В меню</button>
    </div>
  );

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/profile'); return; }
    if (!phone) { setError("Пожалуйста, введите номер телефона для связи."); return; }
    
    setIsProcessing(true);
    setError(null);

    try {
      const orderPayload: any = { 
        user_id: user.id, 
        items, 
        total_amount: totalAmount, 
        delivery_address: address, 
        contact_phone: phone,
        comment, 
        status: 'pending',
        payment_status: 'pending'
      };

      const order = await api.orders.create(orderPayload);
      setPaymentStep(true);
      
      const paymentResult = await initiateYooKassaPayment(order.id, totalAmount);

      if (paymentResult.success) {
        clearCart();
        // Если это демо-режим, просто переходим в профиль через небольшую паузу
        if ((paymentResult as any).demo) {
          setTimeout(() => navigate('/profile'), 1500);
        }
      } else {
        setError(paymentResult.message);
        setPaymentStep(false);
      }
    } catch (err: any) { 
      console.error("Checkout Error:", err);
      setError("Ошибка при создании заказа. Попробуйте еще раз."); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {error && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-center gap-4 text-red-600 animate-in slide-in-from-top-4">
          <AlertCircle size={24} />
          <p className="font-bold text-sm uppercase tracking-wider">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-xs font-black opacity-50 hover:opacity-100">ЗАКРЫТЬ</button>
        </div>
      )}

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
              <div className="py-10 space-y-6">
                <Loader2 className="animate-spin mx-auto text-orange-500" size={48} />
                <p className="font-black italic uppercase text-[10px] tracking-widest">Обработка платежа...</p>
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
                  {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : step === 'cart' ? 'Продолжить' : 'Оплатить'}
                </button>
                <div className="flex items-center justify-center gap-2 opacity-30 mt-4">
                   <CreditCard size={14} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Безопасная оплата через ЮKassa</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Checkout;
