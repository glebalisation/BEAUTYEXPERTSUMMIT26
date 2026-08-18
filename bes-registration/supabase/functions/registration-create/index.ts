import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');

Deno.serve(async req=>{
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  if(req.headers.get('x-n8n-secret')!==Deno.env.get('N8N_SHARED_SECRET'))return json({error:'Unauthorized'},401);
  const body=await req.json().catch(()=>null);
  const required=['stripe_checkout_session_id','purchaser_name','email','ticket_type','ticket_label','ticket_description'];
  if(!body||required.some(key=>!body[key]))return json({error:'Missing required payment data'},400);
  const allowed=['standard','one_day','gala','student','online','speaker'];
  if(!allowed.includes(body.ticket_type))return json({error:'Unknown ticket type'},400);
  const rawToken=crypto.randomUUID()+crypto.randomUUID().replaceAll('-','');
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data,error}=await supabase.from('registrations').insert({
    token_hash:await hash(rawToken),stripe_checkout_session_id:body.stripe_checkout_session_id,
    stripe_payment_intent_id:body.stripe_payment_intent_id||null,purchaser_name:body.purchaser_name,
    email:String(body.email).trim().toLowerCase(),ticket_type:body.ticket_type,
    ticket_label:body.ticket_label,ticket_description:body.ticket_description
  }).select('id').single();
  if(error){if(error.code==='23505')return json({error:'Registration already exists for this checkout'},409);return json({error:'Could not create registration'},500)}
  return json({registration_id:data.id,form_url:`${Deno.env.get('REGISTRATION_URL')}?t=${encodeURIComponent(rawToken)}`},201);
});

