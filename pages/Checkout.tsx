
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, CreditCard, Wallet, ArrowRight, Minus, Plus, ShoppingBag, MapPin, Phone as PhoneIcon, MessageSquare } from 'lucide-react';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { createPayment } from '../services/paymentService.ts';
import { supabase } from '../supabaseClient.ts';

const Checkout: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'cart' | 'details'>('cart');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (items.length === 0 && !showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-700">
        <div className="bg-amber-100/50 p-10 rounded-[3rem] shadow-inner">
          <ShoppingBag size={64} className="text-amber-900/20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-amber-950 italic tracking-tighter">Корзина пуста</h2>
          <p className="text-gray-400 text-sm font-medium">Самое время выбрать что-нибудь вкусное!</p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="px-10 py-5 bg-amber-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-amber-800 transition transform hover:scale-105"
        >
          Перейти в меню
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("Пожалуйста, войдите в профиль, чтобы сделать заказ");
      navigate('/profile');
      return;
    }

    if (!address || !phone) {
      alert("Пожалуйста, заполните адрес и телефон");
      return;
    }

    setIsProcessing(true);
    
    try {
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

      if (error) throw error;

      if (paymentMethod === 'card') {
        const paymentResult = await createPayment(data.id, totalAmount, `Заказ в Чайхана Жулебино #${data.id}`);
        if (!paymentResult.success) {
          alert(paymentResult.message);
          setIsProcessing(false);
          return;
        }
      }

      clearCart();
      setShowSuccess(true);
    } catch (err: any) {
      alert('Ошибка при создании заказа: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-32 h-32 bg-green-100 rounded-[3rem] flex items-center justify-center shadow-xl shadow-green-900/5">
          <ArrowRight size={56} className="text-green-600 -rotate-90" />
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-amber-950 italic tracking-tighter">Заказ принят!</h2>
          <p className="text-gray-500 font-medium">Скоро наш менеджер свяжется с вами для подтверждения.</p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="px-10 py-5 bg-amber-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-amber-800 transition"
        >
          Вернуться в меню
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em]">
        <button onClick={() => setStep('cart')} className={`pb-2 border-b-2 transition ${step === 'cart' ? 'border-orange-500 text-amber-950' : 'border-transparent text-gray-300'}`}>01. Ваша корзина</button>
        <span className="text-gray-200">/</span>
        <button onClick={() => items.length > 0 && setStep('details')} className={`pb-2 border-b-2 transition ${step === 'details' ? 'border-orange-500 text-amber-950' : 'border-transparent text-gray-300'}`}>02. Доставка и оплата</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {step === 'cart' ? (
            <div className="bg-white rounded-[4rem] shadow-sm border border-amber-50 p-10 space-y-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-amber-950 italic tracking-tighter">Выбранные блюда</h3>
                <span className="text-[10px] font-black text-amber-900/30 uppercase tracking-widest">{items.length} поз.</span>
              </div>
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.dish.id} className="flex gap-6 items-center group">
                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-inner flex-shrink-0">
                      <img src={item.dish.image} alt={item.dish.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-black text-amber-950 text-lg group-hover:text-orange-600 transition-colors">{item.dish.name}</h3>
                      <p className="text-orange-600 font-black text-sm">{item.dish.price} ₽</p>
                    </div>
                    <div className="flex items-center gap-4 bg-amber-50/50 p-2 rounded-2xl">
                      <button onClick={() => updateQuantity(item.dish.id, item.quantity - 1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-900 hover:bg-amber-900 hover:text-white transition shadow-sm"><Minus size={14} /></button>
                      <span className="font-black text-amber-950 w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.dish.id, item.quantity + 1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-900 hover:bg-amber-900 hover:text-white transition shadow-sm"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.dish.id)} className="p-3 text-red-200 hover:text-red-500 transition"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[4rem] shadow-sm border border-amber-50 p-10 space-y-10 animate-in slide-in-from-right-10 duration-500">
              <h3 className="text-2xl font-black text-amber-950 italic tracking-tighter">Детали доставки</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-amber-900/30 tracking-widest ml-4">Адрес доставки</label>
                  <div className="relative">
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Улица, дом, кв..." className="w-full pl-12 pr-6 py-4 bg-amber-50/30 rounded-2xl outline-none font-bold text-amber-950 focus:ring-2 ring-amber-900/10 transition" />
                    <MapPin className="absolute left-4 top-4 text-amber-900/20" size={20} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-amber-900/30 tracking-widest ml-4">Контактный телефон</label>
                  <div className="relative">
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className="w-full pl-12 pr-6 py-4 bg-amber-50/30 rounded-2xl outline-none font-bold text-amber-950 focus:ring-2 ring-amber-900/10 transition" />
                    <PhoneIcon className="absolute left-4 top-4 text-amber-900/20" size={20} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-amber-900/30 tracking-widest ml-4">Комментарий к заказу</label>
                  <div className="relative">
                    <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Домофон, предпочтения по остроте..." className="w-full pl-12 pr-6 py-4 bg-amber-50/30 rounded-2xl outline-none font-bold text-amber-950 focus:ring-2 ring-amber-900/10 transition h-32" />
                    <MessageSquare className="absolute left-4 top-4 text-amber-900/20" size={20} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-amber-900/30 tracking-widest ml-4">Способ оплаты</label>
                  <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => setPaymentMethod('card')} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'card' ? 'border-amber-900 bg-amber-50 text-amber-950 shadow-lg' : 'border-amber-50 text-gray-300 hover:border-amber-100'}`}>
                      <CreditCard size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Картой онлайн</span>
                    </button>
                    <button onClick={() => setPaymentMethod('cash')} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'cash' ? 'border-amber-900 bg-amber-50 text-amber-950 shadow-lg' : 'border-amber-50 text-gray-300 hover:border-amber-100'}`}>
                      <Wallet size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest">При получении</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-amber-950 text-white rounded-[4rem] p-10 sticky top-24 shadow-2xl shadow-amber-950/40 space-y-8">
            <h3 className="text-xl font-black italic tracking-tighter opacity-60">Ваш заказ</h3>
            
            <div className="space-y-4 border-b border-white/10 pb-8">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="opacity-40 uppercase tracking-widest text-[9px]">Блюда ({items.length})</span>
                <span>{totalAmount} ₽</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="opacity-40 uppercase tracking-widest text-[9px]">Доставка</span>
                <span className="text-green-400 uppercase text-[9px] tracking-widest font-black">Бесплатно</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">К оплате</p>
              <div className="text-5xl font-black italic tracking-tighter">{totalAmount} ₽</div>
            </div>

            <div className="pt-4">
              {step === 'cart' ? (
                <button 
                  onClick={() => setStep('details')} 
                  className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  Оформить <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handlePlaceOrder} 
                  disabled={!address || !phone || isProcessing} 
                  className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  {isProcessing ? 'Минутку...' : `Подтвердить заказ`}
                </button>
              )}
            </div>
            
            <p className="text-[9px] text-center opacity-30 font-bold uppercase tracking-widest leading-relaxed">
              Нажимая кнопку, вы соглашаетесь с условиями оферты и политикой конфиденциальности.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
