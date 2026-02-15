
import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Instagram, Send } from 'lucide-react';

const Contacts: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-amber-950 italic tracking-tighter uppercase">Наши контакты</h1>
        <p className="text-amber-900/40 font-bold text-xs md:text-sm uppercase tracking-[0.3em]">Всегда рады видеть вас в гостях!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[3.5rem] shadow-sm border border-amber-50 space-y-10">
            <div className="space-y-6">
              <div className="flex gap-6 items-start">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-950">
                  <MapPin size={28} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Адрес</h4>
                  <p className="font-bold text-amber-950 text-lg">Москва, ул. Генерала Кузнецова, 14</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-950">
                  <Phone size={28} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Телефон</h4>
                  <a href="tel:+79000000000" className="font-bold text-amber-950 text-xl hover:text-orange-500 transition-colors">+7 (900) 000-00-00</a>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-950">
                  <Clock size={28} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Режим работы</h4>
                  <p className="font-bold text-amber-950 text-lg">Ежедневно: 10:00 — 23:00</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-amber-50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 text-center">Мы в соцсетях</h4>
              <div className="flex justify-center gap-6">
                <a href="#" className="p-4 bg-amber-50 rounded-full text-amber-950 hover:bg-orange-500 hover:text-white transition-all transform hover:-translate-y-1">
                  <Instagram size={24} />
                </a>
                <a href="#" className="p-4 bg-amber-50 rounded-full text-amber-950 hover:bg-blue-500 hover:text-white transition-all transform hover:-translate-y-1">
                  <Send size={24} />
                </a>
                <a href="#" className="p-4 bg-amber-50 rounded-full text-amber-950 hover:bg-green-500 hover:text-white transition-all transform hover:-translate-y-1">
                  <MessageCircle size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form / Map Placeholder */}
        <div className="bg-amber-950 text-white p-10 rounded-[4rem] shadow-2xl flex flex-col justify-center items-center text-center space-y-8 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
           <div className="relative z-10 space-y-6">
             <div className="bg-white/10 p-6 rounded-full inline-block backdrop-blur-md">
                <Mail size={40} className="text-orange-400" />
             </div>
             <div className="space-y-2">
               <h3 className="text-2xl font-black italic tracking-tighter">Напишите нам</h3>
               <p className="text-white/40 text-xs font-medium px-4">У вас есть вопросы или пожелания? Мы всегда на связи и готовы помочь!</p>
             </div>
             <a 
              href="mailto:info@zhulebino.ru" 
              className="inline-block bg-orange-500 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all"
             >
               Написать на почту
             </a>
           </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white p-2 rounded-[3rem] shadow-sm border border-amber-50 overflow-hidden h-80 md:h-[400px]">
        <div className="w-full h-full bg-amber-100/50 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 grayscale bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1600')] bg-center bg-cover" />
           <div className="relative z-10 flex flex-col items-center gap-4 bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl border border-white">
              <MapPin size={48} className="text-orange-500 animate-bounce" />
              <div className="text-center">
                <p className="font-black text-amber-950 text-sm uppercase tracking-widest">Мы находимся здесь</p>
                <p className="text-gray-500 text-[10px] font-bold mt-1">Жулебино, Генерала Кузнецова 14</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
