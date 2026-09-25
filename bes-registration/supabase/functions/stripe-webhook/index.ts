import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cryptoProvider,ensureRegistration,sendGaPurchase,sendMetaPurchase,sendRegistrationEmail,stripe } from '../_shared/stripe-registration.ts';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

Deno.serve(async req=>{
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  const signature=req.headers.get('stripe-signature')||'';
  const rawBody=await req.text();
  let event;
  try {
    event=await stripe.webhooks.constructEventAsync(rawBody,signature,Deno.env.get('STRIPE_WEBHOOK_SECRET')!,undefined,cryptoProvider);
  } catch (error) {
    console.error('Stripe signature verification failed',error);
    return json({error:'Invalid signature'},400);
  }
  if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return json({received:true});
  const session=event.data.object;
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {error:ledgerError}=await supabase.from('stripe_events').insert({stripe_event_id:event.id,event_type:event.type,checkout_session_id:session.id});
  if(ledgerError?.code==='23505')return json({received:true,duplicate:true});
  if(ledgerError)return json({error:'Could not reserve event'},500);
  try {
    const result=await ensureRegistration(session.id);
    await sendRegistrationEmail(result);
    await sendGaPurchase(result);
    await sendMetaPurchase(result);
    return json({received:true});
  } catch (error) {
    await supabase.from('stripe_events').delete().eq('stripe_event_id',event.id);
    console.error('Stripe event processing failed',error);
    return json({error:'Processing failed'},500);
  }
});
