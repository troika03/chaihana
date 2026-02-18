
import React from 'react';
import { Truck, Clock, ShieldCheck, MapPin, PackageCheck } from 'lucide-react';

const Delivery: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-orange-100 rounded-full text-orange-600 mb-4">
          <Truck size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-amber-950 italic tracking-tighter uppercase">Доставка</h1>
        <p className="text-amber-900/40 font-bold text-xs md:text-sm uppercase tracking-[0.3em]">Быстро. Горячо. По-домашнему.</p>
      </div>

      {/* Info Cards - Only Working Hours left */}
      <div className="flex justify-center">
        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-amber-50 space-y-6 w-full max-lg">
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-900">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-black text-amber-950 italic tracking-tight">Время работы</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed text-center">
            Мы принимаем заказы ежедневно с <span className="text-amber-950 font-bold">10:00 до 22:00</span>. 
            Среднее время доставки по Жулебино составляет <span className="text-orange-500 font-bold">45 минут</span>.
          </p>
        </div>
      </div>

      {/* Delivery Zones - Fully Centered */}
      <div className="bg-amber-950 text-white rounded-[4rem] p-10 md:p-20 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10 space-y-10 w-full max-w-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <MapPin className="text-orange-500" size={32} />
              <h3 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase">Условия доставки</h3>
            </div>
            <p className="text-orange-500 font-black text-[12px] md:text-[14px] uppercase tracking-[0.2em]">Район Жулебино</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-inner">
            <ul className="space-y-6 md:space-y-8 text-white/80 text-lg md:text-2xl font-medium">
              <li className="flex flex-col md:flex-row items-center justify-center gap-2">
                <span className="text-white/40 text-xs md:text-sm uppercase tracking-widest font-black">Минимальный заказ:</span>
                <span className="text-white font-black text-2xl md:text-3xl">1200 ₽</span>
              </li>
              <li className="flex flex-col md:flex-row items-center justify-center gap-2">
                <span className="text-white/40 text-xs md:text-sm uppercase tracking-widest font-black">Доставка:</span>
                <span className="text-orange-500 font-black text-2xl md:text-3xl underline decoration-orange-500/30 underline-offset-8">Бесплатно от 3000 ₽</span>
              </li>
              <li className="flex flex-col md:flex-row items-center justify-center gap-2">
                <span className="text-white/40 text-xs md:text-sm uppercase tracking-widest font-black">Стоимость доставки:</span>
                <span className="text-white font-black text-2xl md:text-3xl">150 ₽</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quality Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: <ShieldCheck size={24} />, title: "Свежесть", desc: "Готовим только под заказ из свежих продуктов" },
          { icon: <PackageCheck size={24} />, title: "Упаковка", desc: "Термосумки сохраняют блюда горячими" },
          { icon: <Clock size={24} />, title: "Пунктуальность", desc: "Ценим ваше время и не опаздываем" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] text-center space-y-3 border border-amber-50 shadow-sm">
            <div className="text-orange-500 mx-auto flex justify-center">{item.icon}</div>
            <h4 className="font-black text-amber-950 text-[10px] uppercase tracking-widest">{item.title}</h4>
            <p className="text-gray-400 text-xs font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Delivery;
