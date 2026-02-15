
import React from 'react';
import { Truck, Clock, CreditCard, ShieldCheck, MapPin, PackageCheck } from 'lucide-react';

const Delivery: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-orange-100 rounded-full text-orange-600 mb-4">
          <Truck size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-amber-950 italic tracking-tighter uppercase">Доставка и оплата</h1>
        <p className="text-amber-900/40 font-bold text-xs md:text-sm uppercase tracking-[0.3em]">Быстро. Горячо. По-домашнему.</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-amber-50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-900">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-black text-amber-950 italic tracking-tight">Время работы</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            Мы принимаем заказы ежедневно с <span className="text-amber-950 font-bold">10:00 до 23:00</span>. 
            Среднее время доставки по Жулебино составляет <span className="text-orange-500 font-bold">45 минут</span>.
          </p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-amber-50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-900">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-black text-amber-950 italic tracking-tight">Оплата</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            Вы можете оплатить заказ картой на сайте через безопасную систему ЮKassa или наличными курьеру при получении.
          </p>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="bg-amber-950 text-white rounded-[4rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-10">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase">Зоны доставки</h3>
            <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest">Доставляем по Москве и МО</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="text-orange-500" size={20} />
                <h4 className="font-black uppercase text-xs tracking-widest">Зона 1: Жулебино</h4>
              </div>
              <ul className="space-y-2 text-white/60 text-sm font-medium">
                <li>• Минимальный заказ: 800 ₽</li>
                <li>• Доставка: <span className="text-white font-bold">Бесплатно от 1500 ₽</span></li>
                <li>• Платная доставка: 200 ₽</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="text-amber-500" size={20} />
                <h4 className="font-black uppercase text-xs tracking-widest">Зона 2: Люберцы / Котельники</h4>
              </div>
              <ul className="space-y-2 text-white/60 text-sm font-medium">
                <li>• Минимальный заказ: 1500 ₽</li>
                <li>• Доставка: <span className="text-white font-bold">Бесплатно от 3000 ₽</span></li>
                <li>• Платная доставка: 400 ₽</li>
              </ul>
            </div>
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
            <div className="text-orange-500 mx-auto">{item.icon}</div>
            <h4 className="font-black text-amber-950 text-[10px] uppercase tracking-widest">{item.title}</h4>
            <p className="text-gray-400 text-xs font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Delivery;
