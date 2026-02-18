
import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

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
                  <p className="font-bold text-amber-950 text-lg">Москва, Жулебинский бульвар, д. 26</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-950">
                  <Phone size={28} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Телефон</h4>
                  <a href="tel:+79251116074" className="font-bold text-amber-950 text-xl hover:text-orange-500 transition-colors">+7 (925) 111-60-74</a>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-950">
                  <Clock size={28} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Режим работы</h4>
                  <p className="font-bold text-amber-950 text-lg">Ежедневно: 10:00 — 22:00</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-amber-50 flex items-center justify-center">
               <div className="flex items-center gap-2 text-amber-900/40">
                  <MessageCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Ждем вас в гости!</span>
               </div>
            </div>
          </div>
        </div>

        {/* Feedback CTA */}
        <div className="bg-amber-950 text-white p-10 rounded-[4rem] shadow-2xl flex flex-col justify-center items-center text-center space-y-8 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
           <div className="relative z-10 space-y-6">
             <div className="bg-white/10 p-6 rounded-full inline-block backdrop-blur-md">
                <Mail size={40} className="text-orange-400" />
             </div>
             <div className="space-y-2">
               <h3 className="text-2xl font-black italic tracking-tighter">Есть вопросы?</h3>
               <p className="text-white/40 text-xs font-medium px-4">Пишите нам на почту, мы обязательно ответим на все ваши предложения!</p>
             </div>
             <a 
              href="mailto:info@zhulebino.ru" 
              className="inline-block bg-orange-500 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all"
             >
               Написать письмо
             </a>
           </div>
        </div>
      </div>

      {/* Real Interactive Map Section */}
      <div className="bg-white p-2 rounded-[3rem] shadow-sm border border-amber-50 overflow-hidden h-80 md:h-[500px]">
        <iframe 
          src="https://yandex.ru/map-widget/v1/?ll=37.854611%2C55.688126&mode=search&ol=geo&ouri=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgg1NjY2NTQ4OBJC0KDQvtGB0YHQuNGPLCDQnNC-0YHQutCy0LAsINCW0YPQu9C10LHQvNC40L3RgdC60LjQuSDQsdGD0LvRjNCy0LDRgCwgMjYiCg2S9BlCFRYTX0I%2C&z=16" 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          allowFullScreen={true}
          style={{ position: 'relative' }}
          title="Карта Чайхана Жулебино"
        ></iframe>
      </div>
    </div>
  );
};

export default Contacts;
