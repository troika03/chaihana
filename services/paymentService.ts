import { supabase } from './supabaseClient';

/**
 * Initiates a payment via YooKassa.
 * 
 * SECURITY NOTE: 
 * You CANNOT create a payment directly from the browser using the Secret Key.
 * This function should call YOUR backend (Supabase Edge Function), which then calls YooKassa.
 */
export const createPayment = async (orderId: number, amount: number, description: string) => {
  console.log('Initiating YooKassa payment for Order:', orderId, 'Amount:', amount);

  try {
    // 1. Call Supabase Edge Function (Backend)
    // const { data, error } = await supabase.functions.invoke('create-payment', {
    //   body: { orderId, amount, description }
    // });
    
    // if (error) throw error;
    
    // 2. Redirect user to confirmation_url
    // window.location.href = data.confirmation_url;

    // --- MOCK SIMULATION START ---
    return new Promise<{success: boolean, message: string}>((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate
        const isSuccess = Math.random() > 0.1;
        if (isSuccess) {
           resolve({ success: true, message: 'Оплата успешно проведена (Тестовый режим)' });
        } else {
           resolve({ success: false, message: 'Ошибка оплаты. Попробуйте снова.' });
        }
      }, 2000);
    });
    // --- MOCK SIMULATION END ---

  } catch (error) {
    console.error('Payment Error:', error);
    return { success: false, message: 'System error during payment initialization.' };
  }
};
