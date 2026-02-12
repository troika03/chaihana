
import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-amber-900 font-black uppercase text-[10px] tracking-widest mb-8 hover:text-orange-600 transition"
      >
        <ArrowLeft size={16} /> Назад
      </button>

      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-amber-50">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-amber-100 p-3 rounded-2xl text-amber-900">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-amber-950">Политика конфиденциальности</h1>
        </div>

        <div className="space-y-6 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-3">1. Сбор информации</h2>
            <p>Мы собираем персональные данные, такие как имя, номер телефона, адрес электронной почты и адрес доставки, исключительно для обеспечения качественного сервиса доставки еды из «Чайханы Жулебино».</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-3">2. Использование данных</h2>
            <p>Ваши данные используются для:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Обработки и доставки ваших заказов.</li>
              <li>Связи с вами для подтверждения деталей заказа.</li>
              <li>Улучшения качества наших блюд и сервиса.</li>
              <li>Предоставления информации об акциях (только с вашего согласия).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-3">3. Защита информации</h2>
            <p>Мы применяем современные средства шифрования и безопасные протоколы (SSL) для защиты ваших данных. Доступ к персональной информации имеют только сотрудники, участвующие в процессе обработки заказа.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-3">4. Передача третьим лицам</h2>
            <p>Мы не продаем и не передаем ваши личные данные сторонним организациям, за исключением случаев, предусмотренных законодательством РФ или необходимых для осуществления доставки (передача адреса курьеру).</p>
          </section>

          <p className="text-sm text-gray-400 italic pt-8 border-t border-amber-50">Последнее обновление: Март 2024 г.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
