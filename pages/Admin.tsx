
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../apiClient';
import { Order, Dish } from './types';
import { Package, RefreshCw, ShieldAlert, BarChart3, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders'>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try { setOrders(await api.orders.getAll()); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const stats = useMemo(() => {
    const succeeded = orders.filter(o => o.status === 'delivered' || o.payment_status === 'succeeded');
    const total = succeeded.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return {
      revenue: total,
      count: orders.length,
      avg: orders.length ? Math.round(total / orders.length) : 0,
      pending: orders.filter(o => o.status === 'pending').length
    };
  }, [orders]);

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-40 gap-8 text-center">
      <ShieldAlert size={80} className="text-amber-900/10" />
      <h2 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter">Вход только для Персонала</h2>
      <button onClick={() => window.location.href = '#/'} className="bg-amber-950 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">Назад в меню</button>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter">Управление Чайханой</h1>
          <p className="text-amber-800/40 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Supabase Realtime Cloud</p>
        </div>
        <button onClick={load} className="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition shadow-sm">
           <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Синхронизировать
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Выручка', val: `${stats.revenue} ₽`, icon: <DollarSign className="text-green-500" /> },
          { label: 'Всего заказов', val: stats.count, icon: <Package className="text-blue-500" /> },
          { label: 'Средний чек', val: `${stats.avg} ₽`, icon: <BarChart3 className="text-orange-500" /> },
          { label: 'В очереди', val: stats.pending, icon: <Clock className="text-amber-500" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-amber-50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{s.label}</p>
              <div className="p-3 bg-amber-50 rounded-xl">{s.icon}</div>
            </div>
            <h4 className="text-4xl font-black text-amber-950 tracking-tighter">{s.val}</h4>
          </div>
        ))}
      </div>

      <div className="flex gap-3 p-2 bg-amber-100/30 rounded-[2rem] w-fit">
        {['stats', 'orders'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-amber-950 text-white shadow-xl scale-105' : 'text-amber-900/40 hover:bg-white'}`}>{tab === 'stats' ? 'Дашборд' : 'Активные заказы'}</button>
        ))}
      </div>

      {activeTab === 'orders' ? (
        <div className="bg-white rounded-[4rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-amber-50/50">
              <tr>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Заказ</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Адрес</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Сумма</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50/50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-amber-50/10 transition-colors">
                  <td className="p-8"><div className="font-black text-amber-950 text-sm">#{order.id.toString().slice(-4)}</div><div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(order.created_at).toLocaleTimeString()}</div></td>
                  <td className="p-8 max-w-xs font-bold text-amber-900 text-xs">{order.delivery_address}</td>
                  <td className="p-8 font-black text-amber-950 text-lg">{order.total_amount} ₽</td>
                  <td className="p-8">
                    <select value={order.status} onChange={(e) => api.orders.updateStatus(order.id, e.target.value as any).then(load)} className="text-[10px] font-black uppercase bg-amber-50 border-none rounded-xl p-4 outline-none cursor-pointer">
                      <option value="pending">Новый</option>
                      <option value="cooking">Готовится</option>
                      <option value="delivering">В пути</option>
                      <option value="delivered">Завершен</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-amber-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
          <h5 className="text-xl font-black italic mb-8 relative z-10">Последняя активность</h5>
          <div className="space-y-4 relative z-10">
             {orders.slice(0, 3).map(o => (
               <div key={o.id} className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black">Заказ #{o.id.toString().slice(-4)}</p>
                    <p className="text-[10px] text-white/40 uppercase font-bold mt-1">{o.delivery_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-orange-400">{o.total_amount} ₽</p>
                    <p className="text-[9px] uppercase font-bold">{o.status}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default Admin;
