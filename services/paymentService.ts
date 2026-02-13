
import { supabase } from '../supabaseClient';

/**
 * Имитация интеграции с ЮKassa API.
 * В реальном приложении этот сервис вызывал бы бэкенд (Edge Functions), 
 * который создает платеж в ЮKassa и возвращает confirmation_url.
 */
export const initiateYooKassaPayment = async (orderId: number, amount: number) => {
  console.log(`[YooKassa] Создание платежа для заказа #${orderId} на сумму ${amount} ₽`);

  return new Promise<{ success: boolean; confirmationUrl?: string; message: string }>(async (resolve) => {
    // 1. Имитируем запрос к API ЮKassa через бэкенд
    setTimeout(async () => {
      // Имитируем успешное создание платежа в 95% случаев
      const isApiHealthy = Math.random() > 0.05;

      if (!isApiHealthy) {
        resolve({ success: false, message: 'Ошибка API ЮKassa. Попробуйте позже.' });
        return;
      }

      // В реальном сценарии здесь была бы ссылка на страницу оплаты ЮKassa
      const mockConfirmationUrl = `https://yookassa.ru/checkout/payments/v2/confirm?orderId=${orderId}`;
      
      console.log(`[YooKassa] Ссылка для оплаты сгенерирована: ${mockConfirmationUrl}`);
      
      // Имитируем процесс оплаты пользователем (через 2 секунды)
      setTimeout(async () => {
        const paymentSucceeded = Math.random() > 0.1; // 90% вероятность успешной оплаты

        if (paymentSucceeded) {
          await supabase
            .from('orders')
            .update({ payment_status: 'succeeded' })
            .eq('id', orderId);
          
          resolve({ success: true, confirmationUrl: mockConfirmationUrl, message: 'Оплачено через ЮKassa' });
        } else {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', orderId);
            
          resolve({ success: false, message: 'Платеж отклонен банком или отменен пользователем.' });
        }
      }, 2000);

    }, 1000);
  });
};
