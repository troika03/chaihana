
import { supabase } from '../supabaseClient';

/**
 * Проверка, настроен ли проект Supabase
 */
const isConfigured = () => {
  try {
    const url = (supabase as any).supabaseUrl;
    return !!url && !url.includes('YOUR_PROJECT_ID');
  } catch {
    return false;
  }
};

/**
 * Интеграция с ЮKassa через Supabase Edge Functions.
 */
export const initiateYooKassaPayment = async (orderId: number, amount: number) => {
  // Демонстрационный режим теперь включается только если URL вообще не задан
  if (!isConfigured()) {
    console.log('[Payment] Demo Mode: Simulating payment process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
      success: true, 
      message: 'Демо-режим: платеж успешно "создан". Перенаправляем в профиль...',
      demo: true 
    };
  }

  try {
    // Вызываем Edge Function 'yookassa-pay'
    const { data, error } = await supabase.functions.invoke('yookassa-pay', {
      body: { 
        orderId, 
        amount, 
        description: `Оплата заказа #${orderId} в Чайхана Жулебино` 
      }
    });

    if (error) {
      console.error('[Supabase Function Error]', error);
      throw new Error(`Ошибка вызова функции: ${error.message || 'Unknown error'}`);
    }

    if (!data || !data.confirmation?.confirmation_url) {
      console.error('[YooKassa API Error Response]', data);
      const detail = data?.description || data?.detail || 'Не удалось получить ссылку на оплату от ЮKassa';
      throw new Error(detail);
    }

    // Сохраняем статус в базу данных
    await supabase
      .from('orders')
      .update({ payment_status: 'pending' })
      .eq('id', orderId);

    // Перенаправляем пользователя на страницу оплаты ЮKassa
    window.location.href = data.confirmation.confirmation_url;

    return { success: true, message: 'Перенаправление на оплату...' };
  } catch (err: any) {
    console.error('[YooKassa Integration Error]', err);
    return { 
      success: false, 
      message: err.message || 'Внутренняя ошибка при создании платежа' 
    };
  }
};
