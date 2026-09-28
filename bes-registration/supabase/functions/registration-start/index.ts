import { ensureRegistration } from '../_shared/stripe-registration.ts';

Deno.serve(async req=>{
  if(req.method!=='GET')return new Response('Method not allowed',{status:405});
  const sessionId=new URL(req.url).searchParams.get('session_id')||'';
  if(!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId))return new Response('Invalid checkout session',{status:400});
  try {
    const result=await ensureRegistration(sessionId);
    return Response.redirect(result.formUrl,303);
  } catch (error) {
    console.error('Registration redirect failed',error);
    return new Response('We could not confirm this payment yet. Please contact the organiser with your Stripe receipt.',{status:409});
  }
});
