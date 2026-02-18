
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Loader2, CheckCircle, Phone, AlertCircle, MapPin, Hash, Layers, DoorOpen, Key, Info, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../apiClient.ts';

const MIN_ORDER_AMOUNT = 1200;
const DELIVERY_FEE = 150;
const FREE_DELIVERY_THRESHOLD = 3000;

const Checkout: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'cart' | 'details'>('cart');
  
  // Детальные поля адреса
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');
  const [doorCode, setDoorCode] = useState('');
  
  const [phone, setPhone] = useState(user?.phone || '');
  const [comment, setValueComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMinAmountReached = totalAmount >= MIN_ORDER_AMOUNT;
  const deliveryCost = totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = totalAmount + deliveryCost;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in duration-500">
        <div className="bg-green-100 p-10 rounded-[4rem] text-green-600">
          <CheckCircle size={80} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-amber-950 italic tracking-tighter">Заказ принят!</h2>
          <p className="text-gray-500 font-medium">Мы уже начали готовить ваш плов. <br/> Следите за статусом в профиле.</p>
        </div>
        <button onClick={() => navigate('/profile')} className="px-12 py-6 bg-amber-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all">
          В мои заказы
        </button>
      </div>
    );
  }

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in duration-500">
      <div className="bg-amber-100/50 p-10 rounded-[3rem]"><ShoppingBag size={64} className="text-amber-900/20" /></div>
      <h2 className="text-3xl font-black text-amber-950 italic tracking-tighter">Корзина пуста</h2>
      <button onClick={() => navigate('/')} className="px-10 py-5 bg-amber-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl">В меню</button>
    </div>
  );

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/profile'); return; }
    if (!isMinAmountReached) { setError(`Минимальная сумма заказа — ${MIN_ORDER_AMOUNT} ₽`); return; }
    if (!phone || phone.replace(/\D/g, '').length < 10) { setError("Введите корректный номер телефона."); return; }
    if (step === 'details' && (!street || !house)) { setError("Укажите улицу и номер дома."); return; }
    
    setIsProcessing(true);
    setError(null);

    try {
      // Собираем адрес в одну строку
      const fullAddress = `ул. ${street}, д. ${house}${entrance ? `, под. ${entrance}` : ''}${floor ? `, эт. ${floor}` : ''}${apartment ? `, кв. ${apartment}` : ''}${doorCode ? `, код: ${doorCode}` : ''}`;

      const orderPayload: any = { 
        user_id: user.id, 
        items, 
        total_amount: grandTotal, // Используем итоговую сумму с учетом доставки
        delivery_address: fullAddress, 
        contact_phone: phone,
        comment, 
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'card'
      };

      await api.orders.create(orderPayload);
      
      setIsSuccess(true);
      clearCart();
    } catch (err: any) { 
      console.error("Checkout Error:", err);
      setError("Ошибка при оформлении заказа."); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val.replace(/[^\d+()\-\s]/g, ''));
  };

  const handleNumericChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value.replace(/\D/g, ''));
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

      {!isMinAmountReached && (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2rem] flex items-center gap-4 text-orange-700 animate-in slide-in-from-top-4">
          <Info size={24} />
          <div>
            <p className="font-black text-sm uppercase tracking-wider">Минимальный заказ от {MIN_ORDER_AMOUNT} ₽</p>
            <p className="text-xs font-medium opacity-80">Добавьте еще на {MIN_ORDER_AMOUNT - totalAmount} ₽, чтобы оформить доставку.</p>
          </div>
          <button onClick={() => navigate('/')} className="ml-auto px-6 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">В меню</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {step === 'cart' ? (
            <div className="bg-white rounded-[4rem] p-10 space-y-8 shadow-sm border border-amber-50">
              <h3 className="text-2xl font-black text-amber-950 italic tracking-tighter">Ваш выбор</h3>
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.dish.id} className="flex gap-6 items-center border-b border-amber-50 pb-6 last:border-0">
                    <img src={item.dish.image} alt={item.dish.name} className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                    <div className="flex-1">
                      <h3 className="font-black text-amber-950 text-lg">{item.dish.name}</h3>
                      <p className="text-orange-600 font-black">{item.dish.price} ₽</p>
                    </div>
                    <div className="flex items-center gap-4 bg-amber-50 p-2 rounded-2xl">
                      <button onClick={() => updateQuantity(item.dish.id, item.quantity - 1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-amber-900 hover:bg-orange-500 hover:text-white transition-colors"><Minus size={14} /></button>
                      <span className="font-black text-amber-950 w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.dish.id, item.quantity + 1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-amber-900 hover:bg-orange-500 hover:text-white transition-colors"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.dish.id)} className="p-4 text-red-200 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[4rem] p-10 space-y-10 shadow-sm border border-amber-50 animate-in slide-in-from-right-4 duration-500">
              <h3 className="text-2xl font-black text-amber-950 italic tracking-tighter">Детали доставки</h3>
              
              <div className="space-y-6">
                {/* Телефон */}
                <div className="relative group">
                   <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-950/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                   <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => handlePhoneChange(e.target.value)} 
                    placeholder="Ваш телефон" 
                    className="w-full p-6 pl-16 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner" 
                    required
                  />
                </div>

                {/* Адрес - Сетка */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group md:col-span-2">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-950/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={street} 
                      onChange={e => setStreet(e.target.value)} 
                      placeholder="Улица" 
                      className="w-full p-6 pl-16 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner" 
                      required
                    />
                  </div>
                  
                  <div className="relative group">
                    <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-950/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={house} 
                      onChange={e => setHouse(e.target.value)} 
                      placeholder="Дом / Корпус" 
                      className="w-full p-6 pl-16 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner" 
                      required
                    />
                  </div>

                  <div className="relative group">
                    <DoorOpen className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-950/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={entrance} 
                      onChange={handleNumericChange(setEntrance)} 
                      placeholder="Подъезд" 
                      className="w-full p-6 pl-16 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner" 
                    />
                  </div>

                  <div className="relative group">
                    <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-950/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={floor} 
                      onChange={handleNumericChange(setFloor)} 
                      placeholder="Этаж" 
                      className="w-full p-6 pl-16 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner" 
                    />
                  </div>

                  <div className="relative group">
                    <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-950/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={apartment} 
                      onChange={handleNumericChange(setApartment)} 
                      placeholder="Квартира" 
                      className="w-full p-6 pl-16 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner" 
                    />
                  </div>

                  <div className="relative group md:col-span-2">
                    <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-950/20 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={doorCode} 
                      onChange={e => setDoorCode(e.target.value)} 
                      placeholder="Код домофона" 
                      className="w-full p-6 pl-16 bg-amber-50 rounded-[2rem] outline-none font-bold text-amber-950 border-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner" 
                    />
                  </div>
                </div>

                <textarea 
                  value={comment} 
                  onChange={e => setValueComment(e.target.value)} 
                  placeholder="Комментарий для кухни или курьера" 
                  className="w-full p-8 bg-amber-50 rounded-[3rem] outline-none font-bold text-amber-950 h-32 border-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none shadow-inner" 
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-amber-950 text-white rounded-[4rem] p-10 sticky top-24 shadow-2xl space-y-8 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center text-white/60">
                <span className="text-[10px] font-black uppercase tracking-widest">Блюда</span>
                <span className="font-bold text-sm">{totalAmount} ₽</span>
              </div>
              <div className="flex justify-between items-center text-white/60 border-b border-white/10 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest">Доставка</span>
                <span className={`font-bold text-sm ${deliveryCost === 0 ? 'text-green-400' : ''}`}>
                  {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost} ₽`}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-black uppercase tracking-[0.2em] opacity-40">Итого</span>
                <div className="text-4xl font-black italic tracking-tighter text-orange-500">{grandTotal} ₽</div>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <button 
                onClick={() => step === 'cart' ? setStep('details') : handlePlaceOrder()} 
                disabled={isProcessing || !isMinAmountReached}
                className={`w-full py-8 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center ${
                  !isMinAmountReached 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : !isMinAmountReached ? (
                  `Минимум ${MIN_ORDER_AMOUNT} ₽`
                ) : step === 'cart' ? (
                  'Далее к деталям'
                ) : (
                  'Оформить заказ'
                )}
              </button>
              
              {step === 'details' && (
                <button 
                  onClick={() => setStep('cart')}
                  className="w-full py-4 text-white/40 font-black text-[9px] uppercase tracking-widest hover:text-white transition-colors"
                >
                  Вернуться в корзину
                </button>
              )}
            </div>

            <div className="relative z-10 pt-6 border-t border-white/10">
               <div className="flex items-center justify-center gap-3 text-white/40">
                  <Truck size={14} className={deliveryCost === 0 ? "text-green-400" : ""} />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {totalAmount < FREE_DELIVERY_THRESHOLD 
                      ? `Еще ${FREE_DELIVERY_THRESHOLD - totalAmount} ₽ до бесплатной доставки`
                      : 'Бесплатная доставка активна!'}
                  </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
