
import { supabase } from '../supabaseClient';

export const createPayment = async (orderId: number, amount: number, description: string) => {
  console.log('Initiating payment for Order:', orderId);

  try {
    // В реальной системе здесь был бы вызов Edge Function или API ЮKassa
    return new Promise<{success: boolean, message: string}>((resolve) => {
      setTimeout(async () => {
        const isSuccess = Math.random() > 0.05;
        
        if (isSuccess) {
          await supabase
            .from('orders')
            .update({ payment_status: 'succeeded' })
            .eq('id', orderId);
            
          resolve({ success: true, message: 'Оплачено успешно' });
        } else {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', orderId);
            
          resolve({ success: false, message: 'Ошибка оплаты' });
        }
      }, 2000);
    });
  } catch (error) {
    console.error('Payment Error:', error);
    return { success: false, message: 'Ошибка связи с банком' };
  }
};
