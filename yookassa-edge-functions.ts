/**
 * ЭТОТ ФАЙЛ СОДЕРЖИТ ГОТОВЫЙ КОД ДЛЯ SUPABASE EDGE FUNCTIONS.
 * Создайте в папке supabase/functions/ две директории: 'yookassa-pay' и 'yookassa-webhook'.
 */

/* 
================================================================================
1. ФУНКЦИЯ: yookassa-pay/index.ts
Назначение: Создание платежа и получение ссылки для редиректа.
================================================================================
*/

/**
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Обработка CORS preflight запроса
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, amount, description, return_url } = await req.json()
    
    const SHOP_ID = Deno.env.get('YOOKASSA_SHOP_ID')
    const SECRET_KEY = Deno.env.get('YOOKASSA_SECRET_KEY')

    if (!SHOP_ID || !SECRET_KEY) {
      throw new Error('YooKassa credentials are not configured in secrets.')
    }
    
    const auth = btoa(`${SHOP_ID}:${SECRET_KEY}`)
    
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': crypto.randomUUID(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: { value: amount.toFixed(2), currency: 'RUB' },
        confirmation: { type: 'redirect', return_url: return_url },
        capture: true,
        description: description,
        metadata: { order_id: orderId.toString() }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('YooKassa API Error:', data)
      return new Response(JSON.stringify({ error: data.description || 'API Error' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({
      confirmation_url: data.confirmation?.confirmation_url,
      payment_id: data.id
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
*/

/* 
================================================================================
2. ФУНКЦИЯ: yookassa-webhook/index.ts
Назначение: Обработка уведомлений от ЮKassa о статусе платежа.
================================================================================
*/

/**
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log('Webhook received:', payload.event)
    
    if (payload.event === 'payment.succeeded') {
      const payment = payload.object
      const orderId = payment.metadata.order_id
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      
      // 1. Обновляем статус платежа
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'succeeded',
          status: 'confirmed' // Опционально: сразу переводим в статус "Принят"
        })
        .eq('id', parseInt(orderId))
        
      if (updateError) throw updateError

      console.log(`Order #${orderId} marked as paid.`)
    }
    
    return new Response(JSON.stringify({ ok: true }), { 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
*/