
import React from 'react';
import { ArrowLeft, Gavel, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserAgreement: React.FC = () => {
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
            <Gavel size={32} />
          </div>
          <h1 className="text-3xl font-black text-amber-950 uppercase italic tracking-tighter">Пользовательское соглашение</h1>
        </div>

        <div className="bg-amber-50 rounded-2xl p-6 mb-8 border border-amber-100 flex gap-4 items-start">
          <Info className="text-amber-900 shrink-0" size={24} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-900/40 mb-1">Исполнитель</p>
            <p className="text-sm font-bold text-amber-950 leading-relaxed">
              Индивидуальный предприниматель Садыкова Махфуза Маъруфовна<br/>
              ИНН: 7707083893 | ОГРНИП: 325508100324129<br/>
              Адрес: г. Москва, Жулебинский бульвар, д. 26
            </p>
          </div>
        </div>

        <div className="space-y-8 text-gray-600 leading-relaxed font-medium text-sm md:text-base">
          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-4 border-b border-amber-50 pb-2">1. Общие положения</h2>
            <p>Настоящее Соглашение определяет условия использования материалов и сервисов сайта Чайхана Жулебино. Пользуясь сайтом, вы принимаете условия настоящего Соглашения в полном объеме. Сайт является официальным ресурсом ИП Садыкова М. М.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-4 border-b border-amber-50 pb-2">2. Оформление заказа</h2>
            <p>Заказы принимаются через интерфейс сайта от лиц, достигших 18 лет. При оформлении заказа пользователь обязуется предоставить достоверную информацию о своем местоположении и контактных данных.</p>
            <p className="mt-2 text-orange-600 font-bold">Внимание: Администрация (ИП Садыкова М. М.) оставляет за собой право отказать в обслуживании при предоставлении ложных данных.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-4 border-b border-amber-50 pb-2">3. Цены и оплата</h2>
            <p>Цены на товары указаны в рублях РФ. Оплата производится банковской картой онлайн или иными способами, доступными на момент оформления. Мы гарантируем безопасность платежей через сертифицированные шлюзы партнеров.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-4 border-b border-amber-50 pb-2">4. Условия доставки</h2>
            <p>Доставка осуществляется в пределах района Жулебино и близлежащих зон. Время доставки является ориентировочным и может меняться в зависимости от дорожной ситуации и загрузки кухни.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-4 border-b border-amber-50 pb-2">5. Возврат и претензии</h2>
            <p>В случае претензий к качеству блюд, Пользователь должен связаться с администрацией не позднее 1 часа после получения заказа по номеру +7 (925) 111-60-74. ИП Садыкова М. М. дорожит своей репутацией и всегда идет на встречу гостям в спорных ситуациях.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-900 mb-4 border-b border-amber-50 pb-2">6. Интеллектуальная собственность</h2>
            <p>Все материалы сайта (тексты, фотографии блюд, логотипы) являются собственностью ИП Садыкова М. М. Копирование и использование материалов без письменного разрешения запрещено.</p>
          </section>

          <div className="pt-8 border-t border-amber-100 text-center">
            <p className="text-[10px] text-gray-400 italic">Действующая редакция от 15 Марта 2024 года. Москва, Жулебинский б-р, 26.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAgreement;
