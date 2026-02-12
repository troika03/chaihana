
import { supabase } from '../supabaseClient';

/**
 * Инициализирует платеж через ЮKassa.
 * В реальном приложении эта функция вызывает Supabase Edge Function,
 * которая безопасно общается с API ЮKassa, используя ShopID и SecretKey.
 */
export const createPayment = async (orderId: number, amount: number, description: string) => {
  console.log('Initiating YooKassa payment for Order:', orderId, 'Amount:', amount);

  try {
    // В реальной интеграции:
    // const { data, error } = await supabase.functions.invoke('yookassa-payment', {
    //   body: { orderId, amount, description, return_url: window.location.href }
    // });
    // if (error) throw error;
    // window.location.href = data.confirmation_url; // Редирект на ЮKassa

    // --- ИМИТАЦИЯ ПРОЦЕССА ОПЛАТЫ ---
    return new Promise<{success: boolean, message: string}>((resolve) => {
      // Имитируем задержку на "редирект и ввод данных карты"
      setTimeout(async () => {
        const isSuccess = Math.random() > 0.05; // 95% успех
        
        if (isSuccess) {
          // Имитируем получение вебхука от ЮKassa бэкендом
          await supabase
            .from('orders')
            .update({ payment_status: 'succeeded' })
            .eq('id', orderId);
            
          resolve({ success: true, message: 'Платеж успешно подтвержден' });
        } else {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', orderId);
            
          resolve({ success: false, message: 'Платеж отклонен банком. Попробуйте другую карту.' });
        }
      }, 2500);
    });
  } catch (error) {
    console.error('Payment Error:', error);
    return { success: false, message: 'Ошибка связи с платежным шлюзом.' };
  }
};
