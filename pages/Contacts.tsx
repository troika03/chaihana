
import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, FileText, UserCheck } from 'lucide-react';

const Contacts: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-amber-950 italic tracking-tighter uppercase">Наши контакты</h1>
        <p className="text-amber-900/40 font-bold text-xs md:text-sm uppercase tracking-[0.3em]">Мы всегда на связи!</p>
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
                  <Mail size={28} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email</h4>
                  <a href="mailto:zhulebino.teahouse@gmail.com" className="font-bold text-amber-950 text-lg hover:text-orange-500 transition-colors break-all">zhulebino.teahouse@gmail.com</a>
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
          </div>
        </div>

        {/* Legal Info Block */}
        <div className="space-y-8">
          <div className="bg-amber-50 p-8 md:p-10 rounded-[3.5rem] border border-amber-100/50 space-y-8 h-full">
            <div className="flex items-center gap-4 border-b border-amber-200/30 pb-4">
              <FileText className="text-amber-900" size={32} />
              <h3 className="text-xl font-black text-amber-950 italic tracking-tight uppercase">Реквизиты</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <UserCheck className="text-amber-900/40 mt-1" size={18} />
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-900/40 mb-1">Индивидуальный предприниматель</h4>
                  <p className="font-bold text-amber-950 text-sm">Садыкова Махфуза Маъруфовна</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-900/40">ИНН</h4>
                  <p className="font-bold text-amber-950 text-sm">7707083893</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-900/40">ОГРНИП</h4>
                  <p className="font-bold text-amber-950 text-sm">325508100324129</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-amber-200/30">
                <p className="text-[10px] text-amber-900/50 leading-relaxed italic">
                  Юридический адрес совпадает с фактическим адресом заведения. Все расчеты производятся в соответствии с законодательством РФ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
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
