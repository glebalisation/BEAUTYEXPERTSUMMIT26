import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const origin=Deno.env.get('ALLOWED_ORIGIN')!;
const headers={'access-control-allow-origin':origin,'access-control-allow-methods':'GET,OPTIONS','access-control-allow-headers':'content-type','content-type':'application/json'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.headers.get('origin')!==origin)return json({error:'Origin not allowed'},403);
  const token=new URL(req.url).searchParams.get('t');
  if(!token||token.length<40)return json({error:'Invalid registration link'},400);
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data,error}=await supabase.from('registrations').select('email,ticket_type,ticket_label,ticket_description,status').eq('token_hash',await hash(token)).maybeSingle();
  if(error||!data)return json({error:'Registration link not found'},404);
  if(data.status!=='awaiting_form')return json({error:'This registration form has already been completed'},409);
  return json(data);
});

