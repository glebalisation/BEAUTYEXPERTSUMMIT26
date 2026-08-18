import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const origin=Deno.env.get('ALLOWED_ORIGIN')!;
const headers={'access-control-allow-origin':origin,'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','content-type':'application/json'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const field=(form:FormData,name:string)=>String(form.get(name)||'').trim();
const upload=async(supabase:any,registrationId:string,name:string,file:File)=>{
  if(file.size>5_242_880)throw new Error('File is larger than 5 MB');
  const allowed=['image/jpeg','image/png','application/pdf'];if(!allowed.includes(file.type))throw new Error('File type is not allowed');
  const ext=file.name.split('.').pop()?.toLowerCase()||'bin';const path=`${registrationId}/${crypto.randomUUID()}.${ext}`;
  const {error}=await supabase.storage.from('registration-private').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;return path;
};

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  if(req.headers.get('origin')!==origin)return json({error:'Origin not allowed'},403);
  try{
    const form=await req.formData();const token=field(form,'token');if(token.length<40)return json({error:'Invalid registration token'},400);
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data:registration}=await supabase.from('registrations').select('*').eq('token_hash',await hash(token)).eq('status','awaiting_form').maybeSingle();
    if(!registration)return json({error:'Registration is invalid or already completed'},409);
    const common=['first_name','last_name','phone','country','specialty','institution'];if(common.some(name=>!field(form,name)))return json({error:'Required information is missing'},400);
    const country=field(form,'country').toLocaleLowerCase();if(['russia','russian federation','россия','росія'].includes(country))return json({error:'Registration is not available for this country'},400);
    if(registration.ticket_type!=='online'&&!field(form,'badge_name'))return json({error:'Badge name is required'},400);
    if(registration.ticket_type==='one_day'&&!['2026-11-28','2026-11-29'].includes(field(form,'selected_day')))return json({error:'A valid attendance day is required'},400);

    let studentPath:string|null=null,speakerPath:string|null=null;
    if(registration.ticket_type==='student'){const file=form.get('student_proof');if(!(file instanceof File)||!file.size)return json({error:'Student proof is required'},400);studentPath=await upload(supabase,registration.id,'student_proof',file)}
    if(registration.ticket_type==='speaker'){for(const name of ['job_title','presentation_title'])if(!field(form,name))return json({error:'Speaker information is incomplete'},400);if(field(form,'speaker_consent')!=='on')return json({error:'Speaker consent is required'},400);const file=form.get('speaker_portrait');if(!(file instanceof File)||!file.size)return json({error:'Speaker portrait is required'},400);speakerPath=await upload(supabase,registration.id,'speaker_portrait',file)}

    const {error:updateError}=await supabase.from('registrations').update({first_name:field(form,'first_name'),last_name:field(form,'last_name'),phone:field(form,'phone'),country:field(form,'country'),specialty:field(form,'specialty'),institution:field(form,'institution'),badge_name:registration.ticket_type==='online'?null:field(form,'badge_name'),selected_day:registration.ticket_type==='one_day'?field(form,'selected_day'):null,accessibility_needs:field(form,'accessibility_needs')||null,language:field(form,'language')||'en',status:registration.ticket_type==='student'?'verification_pending':'completed',submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',registration.id).eq('status','awaiting_form');
    if(updateError)throw updateError;
    if(registration.ticket_type==='gala')await supabase.from('gala_details').insert({registration_id:registration.id,attending:field(form,'gala_attending')==='true',dietary_preference:field(form,'dietary_preference')||null,allergies:field(form,'allergies')||null});
    if(registration.ticket_type==='student')await supabase.from('student_verifications').insert({registration_id:registration.id,document_path:studentPath});
    if(registration.ticket_type==='speaker')await supabase.from('speaker_profiles').insert({registration_id:registration.id,job_title:field(form,'job_title'),presentation_title:field(form,'presentation_title'),biography:field(form,'biography')||null,portrait_path:speakerPath,promotional_consent:true});
    if(registration.ticket_type==='online')await supabase.from('online_access').insert({registration_id:registration.id});
    return json({ok:true,status:registration.ticket_type==='student'?'verification_pending':'completed'});
  }catch(error){console.error(error);return json({error:'We could not save the registration. Please try again.'},500)}
});

