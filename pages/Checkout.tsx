
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Loader2, ShieldCheck } from 'lucide-react';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../apiClient.ts';

const Checkout: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'cart' | 'details'>('cart');
  const [address, setAddress] = useState(user?.address || '');
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
    setIsProcessing(true);
    try {
      await api.orders.create({ 
        user_id: user.id, 
        items, 
        total_amount: totalAmount, 
        delivery_address: address, 
        comment, 
        payment_status: 'succeeded',
        status: 'pending'
      });
      clearCart(); setShowSuccess(true);
    } catch (err) { alert("Ошибка при оформлении"); } finally { setIsProcessing(false); }
  };

  if (showSuccess) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-700">
      <div className="w-32 h-32 bg-green-100 rounded-[3rem] flex items-center justify-center"><ShieldCheck size={56} className="text-green-600" /></div>
      <h2 className="text-4xl font-black text-amber-950 italic tracking-tighter">Заказ принят!</h2>
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
              <h3 className="text-2xl font-black text-amber-950 italic tracking-tighter">Куда доставить?</h3>
              <div className="space-y-6">
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  placeholder="Адрес доставки" 
                  className="w-full p-6 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950" 
                />
                <textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  placeholder="Комментарий курьеру" 
                  className="w-full p-6 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 h-32" 
                />
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <div className="bg-amber-950 text-white rounded-[4rem] p-10 sticky top-24 shadow-2xl space-y-8 text-center">
            <p className="text-xl font-black italic tracking-tighter opacity-60">Итого</p>
            <div className="text-5xl font-black italic tracking-tighter">{totalAmount} ₽</div>
            <button 
              onClick={() => step === 'cart' ? setStep('details') : handlePlaceOrder()} 
              disabled={isProcessing || (step === 'details' && !address)}
              className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 disabled:opacity-30 transition-all"
            >
              {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : step === 'cart' ? 'Оформить' : 'Заказать'}
            </button>
            {step === 'details' && (
              <button onClick={() => setStep('cart')} className="w-full text-[10px] font-black uppercase opacity-40 hover:opacity-100">Назад</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Checkout;
