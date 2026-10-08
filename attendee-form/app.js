(() => {
  const root = document.querySelector('#bes-registration');
  const form = root.querySelector('#bes-form');
  const option = new URLSearchParams(location.search).get('option');
  const submissionId=crypto.randomUUID();
  const base = window.BES_REGISTRATION_CONFIG?.functionsBaseUrl;
  let language = 'en';
  let step = 1;
  let registration = null;

  const text = {
    en:{heading:'Complete your registration',subtitle:'Confirm your details so we can prepare your event registration.',paid:'Confirmed by Stripe',approved:'Approved by the organiser',detailsTitle:'Your details',firstName:'First name',lastName:'Last name',email:'Email',phone:'Phone number',country:'Country of residence',specialty:'Professional specialty',institution:'Institution, clinic or university',badge:'Name exactly as it should appear on your badge',day:'Which day(s) will you attend?',eventTitle:'Event details',accessibility:'Accessibility or assistance needs',galaAttendance:'Will you attend the gala dinner?',yes:'Yes',no:'No',diet:'Dietary preference',allergies:'Food allergies or important dietary details',studentProof:'Proof of student status',jobTitle:'Professional title / position',talkTitle:'Presentation title',biography:'Short professional biography',portrait:'Speaker portrait',speakerConsent:'I approve the use of this information in the event programme and promotion.',reviewTitle:'Review and confirm',privacyConfirm:'I confirm these details are correct and accept the privacy notice.',back:'Back',continue:'Continue',submit:'Confirm registration',successTitle:'Registration complete',successText:'A confirmation will be sent by email.',error:'Please complete the required fields.',steps:['1 · Your details','2 · Event details','3 · Confirm'],specialties:['Select specialty','Ophthalmology','Plastic surgery','Aesthetic medicine','Dermatology / Cosmetology','Student / Resident','Other'],days:['Select attendance','Saturday, 28 November','Sunday, 29 November','Both days, 28–29 November'],diets:['No restrictions','Vegetarian','Vegan','Gluten-free','Lactose-free','Other']},
    es:{heading:'Complete su inscripción',subtitle:'Confirme sus datos para que podamos preparar su inscripción.',paid:'Confirmado por Stripe',approved:'Aprobado por la organización',detailsTitle:'Sus datos',firstName:'Nombre',lastName:'Apellidos',email:'Correo electrónico',phone:'Número de teléfono',country:'País de residencia',specialty:'Especialidad profesional',institution:'Institución, clínica o universidad',badge:'Nombre exacto para la acreditación',day:'¿Qué día o días asistirá?',eventTitle:'Datos del evento',accessibility:'Necesidades de accesibilidad o asistencia',galaAttendance:'¿Asistirá a la cena de gala?',yes:'Sí',no:'No',diet:'Preferencia alimentaria',allergies:'Alergias o información alimentaria importante',studentProof:'Comprobante de condición de estudiante',jobTitle:'Cargo profesional',talkTitle:'Título de la presentación',biography:'Biografía profesional breve',portrait:'Retrato del ponente',speakerConsent:'Autorizo el uso de esta información en el programa y promoción del evento.',reviewTitle:'Revisar y confirmar',privacyConfirm:'Confirmo que estos datos son correctos y acepto el aviso de privacidad.',back:'Atrás',continue:'Continuar',submit:'Confirmar inscripción',successTitle:'Inscripción completada',successText:'Recibirá una confirmación por correo electrónico.',error:'Complete los campos obligatorios.',steps:['1 · Sus datos','2 · Datos del evento','3 · Confirmar'],specialties:['Seleccione una especialidad','Oftalmología','Cirugía plástica','Medicina estética','Dermatología / Cosmetología','Estudiante / Residente','Otra'],days:['Seleccione la asistencia','Sábado, 28 de noviembre','Domingo, 29 de noviembre','Ambos días, 28–29 de noviembre'],diets:['Sin restricciones','Vegetariana','Vegana','Sin gluten','Sin lactosa','Otra']},
    uk:{heading:'Завершіть реєстрацію',subtitle:'Підтвердьте дані для підготовки вашої реєстрації.',paid:'Підтверджено Stripe',approved:'Підтверджено організатором',detailsTitle:'Ваші дані',firstName:'Ім’я',lastName:'Прізвище',email:'Електронна пошта',phone:'Номер телефону',country:'Країна проживання',specialty:'Професійна спеціальність',institution:'Установа, клініка або університет',badge:'Ім’я для бейджа',day:'Якого дня або днів ви будете присутні?',eventTitle:'Деталі події',accessibility:'Потреби в доступності або допомозі',galaAttendance:'Чи відвідаєте ви гала-вечерю?',yes:'Так',no:'Ні',diet:'Харчові побажання',allergies:'Алергії або важливі харчові деталі',studentProof:'Підтвердження статусу студента',jobTitle:'Професійна посада',talkTitle:'Назва доповіді',biography:'Коротка професійна біографія',portrait:'Портрет спікера',speakerConsent:'Дозволяю використовувати цю інформацію у програмі та промоції події.',reviewTitle:'Перевірка та підтвердження',privacyConfirm:'Підтверджую правильність даних і приймаю повідомлення про конфіденційність.',back:'Назад',continue:'Продовжити',submit:'Підтвердити реєстрацію',successTitle:'Реєстрацію завершено',successText:'Підтвердження буде надіслано електронною поштою.',error:'Заповніть обов’язкові поля.',steps:['1 · Ваші дані','2 · Деталі події','3 · Підтвердження'],specialties:['Оберіть спеціальність','Офтальмологія','Пластична хірургія','Естетична медицина','Дерматологія / Косметологія','Студент / Ординатор','Інше'],days:['Оберіть відвідування','Субота, 28 листопада','Неділя, 29 листопада','Обидва дні, 28–29 листопада'],diets:['Без обмежень','Вегетаріанське','Веганське','Без глютену','Без лактози','Інше']}
  };

  text.en.interestingTopic='Which topic are you most interested in at the summit?';
  text.es.interestingTopic='¿Qué tema le interesa más en el congreso?';
  text.uk.interestingTopic='Яка тема саміту вас найбільше цікавить?';
  text.en.studyStage='Stage of study (year / programme)';
  text.es.studyStage='Etapa de estudios (curso / programa)';
  text.uk.studyStage='Етап навчання (курс / програма)';
  Object.assign(text.en,{paid:'Registration details only',subtitle:'Share your details with the organising team. This form does not issue an admission ticket.',successText:'Your details have been saved and sent to the organising team. No ticket has been issued.'});
  Object.assign(text.es,{paid:'Solo datos de inscripción',subtitle:'Comparta sus datos con la organización. Este formulario no emite una entrada.',successText:'Sus datos se han guardado y enviado a la organización. No se ha emitido ninguna entrada.'});
  Object.assign(text.uk,{paid:'Лише реєстраційні дані',subtitle:'Надайте дані організаторам. Ця форма не видає вхідний квиток.',successText:'Ваші дані збережено та надіслано організаторам. Квиток не видано.'});

  const setOptions = (name, labels, values) => {
    const select = form.elements[name];
    const selected = select.value;
    select.innerHTML = labels.map((label,index)=>`<option value="${values?.[index] ?? (index ? label : '')}">${label}</option>`).join('');
    if ([...select.options].some(o=>o.value===selected)) select.value=selected;
  };

  const translate = () => {
    const t=text[language];
    root.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(t[key])el.textContent=t[key]});
    root.querySelectorAll('[data-step-label]').forEach((el,index)=>el.textContent=t.steps[index]);
    setOptions('specialty',t.specialties,['','ophthalmology','plastic_surgery','aesthetic_medicine','dermatology_cosmetology','student_resident','other']);
    setOptions('selected_day',registration?.ticket_type==='student'?t.days:t.days.slice(0,3),['','2026-11-28','2026-11-29','both']);
    setOptions('dietary_preference',t.diets,['none','vegetarian','vegan','gluten_free','lactose_free','other']);
    root.querySelector('#continue').textContent=step===3?t.submit:t.continue;
    root.querySelector('#confirmation-label').textContent=t.paid;
  };

  const configureTicket = () => {
    const type=registration.ticket_type;
    root.querySelector('#ticket-name').textContent=registration.ticket_label;
    root.querySelector('#ticket-description').textContent=registration.ticket_description;
    root.querySelector('#study-stage-field').classList.toggle('bes-hidden',type!=='student');
    form.elements.study_stage.required=type==='student';
    root.querySelector('#day-field').classList.toggle('bes-hidden',!registration.day_choice);
    form.elements.selected_day.required=registration.day_choice;
    root.querySelector('#gala-fields').classList.toggle('bes-hidden',!registration.gala);
    form.querySelectorAll('[name="gala_attending"]').forEach(el=>el.required=registration.gala);
    form.elements.dietary_preference.required=registration.gala;
    root.querySelector('#student-fields').classList.add('bes-hidden');
    form.elements.student_proof.required=false;
    root.querySelector('#speaker-fields').classList.toggle('bes-hidden',type!=='speaker');
    ['job_title','presentation_title','speaker_consent'].forEach(name=>form.elements[name].required=type==='speaker');
  };

  const activeRequired = () => [...root.querySelector(`.bes-step[data-step="${step}"]`).querySelectorAll('[required]')].filter(el=>!el.closest('.bes-hidden'));
  const validate = () => {root.querySelector('#continue').disabled=!activeRequired().every(el=>el.checkValidity())};
  const showStep = next => {step=next;root.querySelectorAll('.bes-step').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===step));root.querySelectorAll('.bes-progress span').forEach((el,index)=>el.classList.toggle('active',index===step-1));root.querySelector('#back').classList.toggle('bes-hidden',step===1);translate();validate()};
  const makeReview = () => {const data=new FormData(form);const t=text[language];const rows=[[t.detailsTitle,`${data.get('first_name')} ${data.get('last_name')}`],[t.email,data.get('email')],[t.phone,data.get('phone')],[t.country,data.get('country')],[t.institution,data.get('institution')]];if(registration.ticket_type==='student')rows.push([t.studyStage,data.get('study_stage')]);if(data.get('selected_day'))rows.push([t.day,form.elements.selected_day.selectedOptions[0].textContent]);rows.push([t.interestingTopic,data.get('interesting_topic')]);root.querySelector('#review').innerHTML=rows.map(([k,v])=>`<div><span>${k}</span><strong>${String(v||'—').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</strong></div>`).join('')};

  const load = async () => {
    const catalog=await (await fetch('./catalog.json')).json();
    if(!option||!catalog[option])throw new Error('Please use the registration link provided by the organising team.');
    registration=catalog[option];configureTicket();translate();root.querySelector('#bes-loading').classList.add('bes-hidden');form.classList.remove('bes-hidden');validate();
  };

  root.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.language;root.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));translate()}));
  form.addEventListener('input',validate);form.addEventListener('change',validate);
  root.querySelector('#back').addEventListener('click',()=>showStep(step-1));
  root.querySelector('#continue').addEventListener('click',async()=>{if(!activeRequired().every(el=>el.reportValidity()))return;if(step<3){if(step===2)makeReview();showStep(step+1);return}const button=root.querySelector('#continue');button.disabled=true;try{const body=new FormData(form);body.set('option',option);body.set('submission_id',submissionId);body.set('language',language);const response=await fetch(`${base}/public-registration`,{method:'POST',body});const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to save registration.');form.classList.add('bes-hidden');root.querySelector('#bes-success').classList.remove('bes-hidden')}catch(error){root.querySelector('#form-error').textContent=error.message;root.querySelector('#form-error').classList.remove('bes-hidden');validate()}});
  load().catch(error=>{root.querySelector('#bes-loading').classList.add('bes-hidden');const box=root.querySelector('#bes-link-error');box.textContent=error.message;box.classList.remove('bes-hidden')});
})();
