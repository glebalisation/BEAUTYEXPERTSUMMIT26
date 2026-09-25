import Stripe from 'npm:stripe@^22';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const requiredEnv=(name:string)=>{const value=Deno.env.get(name);if(!value)throw new Error(`Missing ${name}`);return value;};

export const stripe = new Stripe(requiredEnv('STRIPE_SECRET_KEY'));
export const cryptoProvider = Stripe.createSubtleCryptoProvider();

type Ticket = { type:string; label:string; description:string };

const bytesToHex=(bytes:Uint8Array)=>Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
const sha256=async(value:string)=>bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));

async function registrationToken(sessionId:string) {
  const secret=requiredEnv('REGISTRATION_TOKEN_SECRET');
  if(secret.length<32)throw new Error('REGISTRATION_TOKEN_SECRET must be at least 32 characters');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return bytesToHex(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(sessionId))));
}

function ticketMap():Record<string,Ticket> {
  const parsed=JSON.parse(Deno.env.get('STRIPE_PRICE_MAP_JSON')||'{}');
  if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw new Error('Invalid STRIPE_PRICE_MAP_JSON');
  return parsed;
}

export async function paidSession(sessionId:string) {
  const session=await stripe.checkout.sessions.retrieve(sessionId,{expand:['line_items.data.price.product']});
  if(session.payment_status!=='paid')throw new Error('Checkout session is not paid');
  if(!session.customer_details?.email)throw new Error('Paid session has no customer email');
  const lines=session.line_items?.data||[];
  if(lines.length!==1||lines[0].quantity!==1)throw new Error('Expected exactly one ticket');
  const priceId=lines[0].price?.id;
  const ticket=priceId&&ticketMap()[priceId];
  if(!priceId||!ticket)throw new Error(`Unmapped Stripe price: ${priceId||'missing'}`);
  return {session,line:lines[0],priceId,ticket};
}

export async function ensureRegistration(sessionId:string) {
  const {session,line,priceId,ticket}=await paidSession(sessionId);
  const rawToken=await registrationToken(session.id);
  const supabase=createClient(requiredEnv('SUPABASE_URL'),requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
  const record={
    token_hash:await sha256(rawToken),stripe_checkout_session_id:session.id,
    stripe_payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:null,
    purchaser_name:session.customer_details?.name||session.customer_details!.email!,
    email:session.customer_details!.email!.trim().toLowerCase(),ticket_type:ticket.type,
    ticket_label:ticket.label,ticket_description:ticket.description
  };
  const {data,error}=await supabase.from('registrations').upsert(record,{onConflict:'stripe_checkout_session_id',ignoreDuplicates:true}).select('id').maybeSingle();
  if(error)throw error;
  return {
    id:data?.id,rawToken,session,line,priceId,ticket,
    formUrl:`${requiredEnv('REGISTRATION_URL')}?t=${encodeURIComponent(rawToken)}`
  };
}

export async function sendGaPurchase(result:Awaited<ReturnType<typeof ensureRegistration>>) {
  const secret=Deno.env.get('GA4_API_SECRET');
  const reference=result.session.client_reference_id||'';
  const match=reference.match(/^bes_[an]_(\d+)_(\d+)(?:_fb_\d+_\d+)?$/);
  // No analytics consent marker/client ID came through checkout: do not send GA.
  if(!secret||!match)return;
  const value=(result.session.amount_total||0)/100;
  const currency=(result.session.currency||'eur').toUpperCase();
  const clientId=`${match[1]}.${match[2]}`;
  const body={client_id:clientId,events:[{name:'purchase',params:{
    transaction_id:result.session.id,value,currency,
    items:[{item_id:result.priceId,item_name:result.ticket.label,price:(result.line.amount_total||0)/100,quantity:1}]
  }}]};
  const response=await fetch(`https://region1.google-analytics.com/mp/collect?measurement_id=G-9K6V46V6L0&api_secret=${encodeURIComponent(secret)}`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
  });
  if(!response.ok)throw new Error(`GA4 purchase delivery failed: ${response.status}`);
}

export async function sendMetaPurchase(result:Awaited<ReturnType<typeof ensureRegistration>>) {
  const token=Deno.env.get('META_CAPI_ACCESS_TOKEN');
  const version=Deno.env.get('META_GRAPH_API_VERSION');
  const reference=result.session.client_reference_id||'';
  const match=reference.match(/^bes_a_\d+_\d+(?:_fb_(\d+)_(\d+))?$/);
  // Advertising consent was not passed through checkout: do not send Meta CAPI.
  if(!token||!version||!match)return;
  const email=result.session.customer_details!.email!.trim().toLowerCase();
  const userData:Record<string,unknown>={em:[await sha256(email)]};
  if(match[1]&&match[2])userData.fbp=`fb.1.${match[1]}.${match[2]}`;
  const value=(result.session.amount_total||0)/100;
  const currency=(result.session.currency||'eur').toUpperCase();
  const payload={data:[{
    event_name:'Purchase',event_time:result.session.created,event_id:result.session.id,
    action_source:'website',event_source_url:'https://beautyexpertsummit.com/tickets',user_data:userData,
    custom_data:{value,currency,content_type:'product',content_ids:[result.priceId],contents:[{id:result.priceId,quantity:1,item_price:(result.line.amount_total||0)/100}]}
  }]};
  const response=await fetch(`https://graph.facebook.com/${encodeURIComponent(version)}/1843576903471823/events?access_token=${encodeURIComponent(token)}`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)
  });
  if(!response.ok)throw new Error(`Meta purchase delivery failed: ${response.status}`);
}
