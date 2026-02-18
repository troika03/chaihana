import { supabase } from '../supabaseClient';

/**
 * Сервис интеграции с ЮKassa через Supabase Edge Functions.
 * Требует наличия развернутых функций 'yookassa-pay' и 'yookassa-webhook'.
 */

export const initiateYooKassaPayment = async (orderId: number, amount: number) => {
  console.log(`[Payment] Initiating payment for Order #${orderId}, Amount: ${amount}`);

  try {
    // Вызываем Edge Function 'yookassa-pay'
    const { data, error } = await supabase.functions.invoke('yookassa-pay', {
      body: { 
        orderId, 
        amount, 
        description: `Оплата заказа #${orderId} в Чайхана Жулебино`,
        return_url: `${window.location.origin}/#/profile`
      }
    });

    if (error) {
      console.error('[Supabase Function Error]', error);
      // Если функция не найдена (404), вероятно она не развернута
      if (error.message?.includes('404')) {
        throw new Error('Платежная система временно недоступна (Function not deployed).');
      }
      throw new Error(error.message || 'Ошибка связи с платежным шлюзом.');
    }

    if (!data || (!data.confirmation_url && !data.demo_success)) {
      throw new Error(data?.error || 'Ошибка платежной системы: ссылка на оплату не получена.');
    }

    // Сохраняем payment_id для отслеживания
    if (data.payment_id) {
      await supabase
        .from('orders')
        .update({ payment_id: data.payment_id, payment_status: 'pending' })
        .eq('id', orderId);
    }

    // Если мы получили URL — перенаправляем
    if (data.confirmation_url) {
      window.location.href = data.confirmation_url;
      return { success: true, message: 'Перенаправление на шлюз...' };
    }

    // Обработка демо-режима
    if (data.demo_success) {
      return { success: true, demo: true };
    }

    return { success: false, message: 'Неизвестный ответ от сервера.' };
  } catch (err: any) {
    console.error('[YooKassa Init Error]', err);
    return { 
      success: false, 
      message: err.message || 'Произошла ошибка при создании счета.' 
    };
  }
};