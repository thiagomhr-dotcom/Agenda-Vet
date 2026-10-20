(function(){
'use strict';
/* ---------- utilidades ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const uuid=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const pad=n=>String(n).padStart(2,'0');
const BRL=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const today=()=>ds(new Date());
const addDays=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ds(d)};
const WD=['dom','seg','ter','qua','qui','sex','sáb'];
const WDL=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MON=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fmtD=s=>{const d=pd(s);return WD[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]};
const fmtLong=s=>{const d=pd(s);return WDL[d.getDay()]+', '+d.getDate()+' de '+MON[d.getMonth()]};
const fmtAt=ms=>{const d=new Date(ms);return pad(d.getDate())+'/'+pad(d.getMonth()+1)+' '+pad(d.getHours())+':'+pad(d.getMinutes())};
const tm=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const hm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const byDT=(a,b)=>(a.date+a.time).localeCompare(b.date+b.time);
const digits=s=>String(s||'').replace(/\D/g,'');

const SK={clinica:'Clínica geral',imagem:'Imagem',cardio:'Cardiologia'};
const RT={consulta:'Consultório',imagem:'Imagem',laboratorio:'Coleta',cirurgia:'Cirurgia'};
const ST={pendente:['Solicitado','warn'],aguardando:['Aguardando tutor','info'],confirmado:['Confirmado','ok'],concluido:['Concluído','mute'],cancelado:['Cancelado','bad']};
const CH={email:'E-mail',push:'Push no app',telegram:'Telegram'};
const KIND={solicitacao:'Pedido recebido',pedido_confirmacao:'Confirme seu agendamento',confirmado:'Agendamento confirmado',cancelado:'Agendamento cancelado',cobranca:'Cobrança disponível',pago:'Pagamento recebido',lembrete:'Lembrete de atendimento'};

const IC={
 home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 inbox:'<path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5"/>',
 card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
 sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
 msg:'<path d="M4 5h16v11H9l-5 4z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 push:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
 send:'<path d="M21 3L3 11l7 3 3 7z"/><path d="M10 14L21 3"/>'
};
const icon=n=>'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+IC[n]+'</svg>';
const chIcon=c=>icon(c==='email'?'mail':c==='push'?'push':'send');
const MARK='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="10" r="2"/><circle cx="9.5" cy="5.5" r="2"/><circle cx="14.5" cy="5.5" r="2"/><circle cx="18.5" cy="10" r="2"/><path d="M12 11c-3 0-5.5 3-5.5 5.5 0 2 1.6 2.8 3 2.8 1 0 1.6-.4 2.5-.4s1.5.4 2.5.4c1.4 0 3-.8 3-2.8C17.5 14 15 11 12 11z"/></svg>';

/* ---------- configuração padrão do hospital (exemplo) ---------- */
const DEFAULT_CFG={
 hospital:{name:'Hospital Veterinário Modelo'},
 slotStep:30,
 channels:{email:true,push:true,telegram:true},
 templates:{
  pedido_confirmacao:'Olá, {tutor}! Podemos confirmar o atendimento de {pet} ({servico}) em {data}? Responda pelo app para garantir o horário.',
  lembrete:'Olá, {tutor}! Lembrete: {pet} tem {servico} em {data}. Chegue 10 minutos antes.'
 },
 rooms:[
  {id:'r1',name:'Consultório 1',type:'consulta'},
  {id:'r2',name:'Consultório 2',type:'consulta'},
  {id:'r3',name:'Sala de imagem',type:'imagem'},
  {id:'r5',name:'Sala de coleta',type:'laboratorio'}
 ],
 services:[
  {id:'s1',name:'Consulta clínica geral',dur:30,price:220,roomType:'consulta',skill:'clinica'},
  {id:'s2',name:'Vacinação',dur:30,price:120,roomType:'consulta',skill:'clinica'},
  {id:'s3',name:'Ultrassonografia',dur:60,price:380,roomType:'imagem',skill:'imagem'},
  {id:'s4',name:'Raio-X',dur:30,price:260,roomType:'imagem',skill:'imagem'},
  {id:'s5',name:'Coleta para exames de sangue',dur:30,price:150,roomType:'laboratorio',skill:'clinica'},
  {id:'s6',name:'Consulta cardiológica',dur:60,price:420,roomType:'consulta',skill:'cardio'}
 ],
 pros:[
  {id:'p1',name:'Dra. Helena Prado',role:'Clínica geral',skills:['clinica'],hours:{1:['08:00','17:00'],2:['08:00','17:00'],3:['08:00','17:00'],4:['08:00','17:00'],5:['08:00','17:00']}},
  {id:'p2',name:'Dr. Marcos Tavares',role:'Diagnóstico por imagem',skills:['imagem'],hours:{2:['09:00','16:00'],4:['09:00','16:00'],6:['08:00','12:00']}},
  {id:'p3',name:'Dra. Carolina Lins',role:'Cardiologia',skills:['cardio','clinica'],hours:{1:['13:00','18:00'],3:['13:00','18:00'],5:['13:00','18:00']}}
 ],
 blocked:[]
};
const mergeCfg=c=>{const o=clone(DEFAULT_CFG);if(c){for(const k in c){if(c[k]!=null)o[k]=clone(c[k]);}}return o};

/* ---------- agenda: cálculo de horários livres ---------- */
function slotsFor(cfg,appts,svc,date,proId,ignore){
 if(!svc||date<today()||cfg.blocked.includes(date))return [];
 const dow=pd(date).getDay(),step=cfg.slotStep||30;
 const pros=cfg.pros.filter(p=>p.skills.includes(svc.skill)&&(!proId||proId==='any'||p.id===proId));
 const rooms=cfg.rooms.filter(r=>r.type===svc.roomType);
 const act=appts.filter(a=>a.date===date&&a.status!=='cancelado'&&a.id!==ignore);
 const busy=(list,t,dur)=>list.some(a=>tm(a.time)<t+dur&&t<tm(a.time)+a.dur);
 const isToday=date===today(),now=new Date(),nowM=now.getHours()*60+now.getMinutes();
 const out=new Map();
 for(const p of pros){
  const h=p.hours&&p.hours[dow];if(!h)continue;
  const s=tm(h[0]),e=tm(h[1]),pa=act.filter(a=>a.proId===p.id);
  for(let t=s;t+svc.dur<=e;t+=step){
   if(isToday&&t<nowM+60)continue;
   const key=hm(t);if(out.has(key))continue;
   if(busy(pa,t,svc.dur))continue;
   const room=rooms.find(r=>!busy(act.filter(a=>a.roomId===r.id),t,svc.dur));
   if(!room)continue;
   out.set(key,{time:key,proId:p.id,roomId:room.id});
  }
 }
 return [...out.values()].sort((a,b)=>a.time<b.time?-1:1);
}

/* ---------- mensagens (simuladas) ---------- */
function msgBody(kind,a,cfg){
 const when=fmtLong(a.date)+' às '+a.time,t=cfg.templates||{};
 const v=s=>String(s).replace(/\{pet\}/g,a.pet).replace(/\{tutor\}/g,String(a.tutorName).split(' ')[0]).replace(/\{data\}/g,when).replace(/\{servico\}/g,a.svcName).replace(/\{hospital\}/g,cfg.hospital.name);
 switch(kind){
  case 'solicitacao':return v('Recebemos o pedido de {servico} para {pet} em {data}. A recepção vai confirmar em breve.');
  case 'pedido_confirmacao':return v(t.pedido_confirmacao||DEFAULT_CFG.templates.pedido_confirmacao);
  case 'confirmado':return v('Tudo certo! {servico} de {pet} confirmado para {data}.');
  case 'cancelado':return v('O agendamento de {servico} de {pet} em {data} foi cancelado.');
  case 'cobranca':return v('Há uma cobrança de '+BRL(a.pay&&a.pay.amount)+' referente a {servico} de {pet}. Pague por '+(a.pay&&a.pay.method==='pix'?'Pix':'boleto')+' no app.');
  case 'pago':return v('Recebemos o pagamento de '+BRL(a.pay&&a.pay.amount)+' referente a {servico} de {pet}. Obrigado!');
  case 'lembrete':return v(t.lembrete||DEFAULT_CFG.templates.lembrete);
 }
 return '';
}
function mkNotes(a,kind,cfg,at){
 return (a.channels||[]).filter(c=>cfg.channels[c]&&!(c==='email'&&!a.email)).map(c=>({
  id:uuid(),apptId:a.id,tutorId:a.tutorId,tutorName:a.tutorName,channel:c,kind,title:KIND[kind],
  body:msgBody(kind,a,cfg),at:at||Date.now(),dest:c==='email'?a.email:c==='telegram'?a.phone:'app instalado'
 }));
}

/* ---------- dados: Supabase ---------- */
const CFG=window.AGENDA_CONFIG||{};
const sb=(window.supabase&&CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY)?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}}):null;
const Store={ready:false,error:'',uid:null,cfg:mergeCfg(),appts:[],busy:[],notes:[]};
const iso=ms=>ms?new Date(ms).toISOString():null;
const rowToAppt=r=>({id:r.id,tutorId:r.tutor_id,tutorName:r.tutor_name,phone:r.phone,email:r.email||'',channels:r.channels||[],pet:r.pet,species:r.species,notes:r.notes||'',
 svcId:r.svc_id,svcName:r.svc_name,dur:r.dur,price:Number(r.price),proId:r.pro_id,roomId:r.room_id,date:r.appt_date,time:String(r.appt_time).slice(0,5),status:r.status,pay:r.pay||null,
 confirmSentAt:r.confirm_sent_at?Date.parse(r.confirm_sent_at):null,confirmedAt:r.confirmed_at?Date.parse(r.confirmed_at):null,cancelNote:r.cancel_note||'',createdAt:Date.parse(r.created_at)});
const apptToRow=a=>({id:a.id,tutor_id:a.tutorId||null,tutor_name:a.tutorName,phone:a.phone,email:a.email||'',channels:a.channels,pet:a.pet,species:a.species,notes:a.notes||'',
 svc_id:a.svcId,svc_name:a.svcName,dur:a.dur,price:a.price,pro_id:a.proId,room_id:a.roomId,appt_date:a.date,appt_time:a.time,status:a.status,pay:a.pay||null,
 confirm_sent_at:iso(a.confirmSentAt),confirmed_at:iso(a.confirmedAt),cancel_note:a.cancelNote||null});
const rowToNote=r=>({id:r.id,apptId:r.appt_id,tutorId:r.tutor_id,tutorName:r.tutor_name,channel:r.channel,kind:r.kind,title:r.title,body:r.body,dest:r.dest,at:Date.parse(r.at)});
const noteToRow=n=>({id:n.id,appt_id:n.apptId,tutor_id:n.tutorId||null,tutor_name:n.tutorName,channel:n.channel,kind:n.kind,title:n.title,body:n.body,dest:n.dest||'',at:iso(n.at)});
const ck=r=>{if(r.error)throw r.error;return r.data;};
const DB={
 async session(){return ck(await sb.auth.getSession()).session;},
 async anon(){return ck(await sb.auth.signInAnonymously()).session;},
 async staffLogin(email,pw){return ck(await sb.auth.signInWithPassword({email,password:pw})).session;},
 async staffName(uid){const d=ck(await sb.from('staff').select('name').eq('user_id',uid).maybeSingle());return d?d.name:null;},
 async signOut(){await sb.auth.signOut();},
 async settings(){const d=ck(await sb.from('settings').select('data').eq('id',1).maybeSingle());return d?d.data:null;},
 async appts(){return ck(await sb.from('appointments').select('*').order('appt_date').order('appt_time')).map(rowToAppt);},
 async busy(){return ck(await sb.rpc('busy_slots',{p_from:today(),p_to:addDays(today(),60)})).map(r=>({id:r.id,date:r.appt_date,time:String(r.appt_time).slice(0,5),dur:r.dur,proId:r.pro_id,roomId:r.room_id,status:'ativo'}));},
 async notes(){return ck(await sb.from('notifications').select('*').order('at',{ascending:false}).limit(200)).map(rowToNote);},
 async insertAppt(a){ck(await sb.from('appointments').insert(apptToRow(a)));},
 async updateAppt(a){ck(await sb.from('appointments').update(apptToRow(a)).eq('id',a.id));},
 async insertNotes(ns){if(ns.length)ck(await sb.from('notifications').insert(ns.map(noteToRow)));},
 async saveSettings(c){ck(await sb.from('settings').upsert({id:1,data:c,updated_at:new Date().toISOString()}));},
 async rpc(name,id){ck(await sb.rpc(name,{p_id:id}));},
 subscribe(onChange){
  const ch=sb.channel('agenda');
  ['appointments','notifications','settings'].forEach(t=>ch.on('postgres_changes',{event:'*',schema:'public',table:t},onChange));
  ch.subscribe();return ()=>sb.removeChannel(ch);
 }
};
async function loadAll(){
 try{
  const r=await Promise.all([DB.settings(),DB.appts(),DB.busy(),DB.notes()]);
  Store.cfg=mergeCfg(r[0]);Store.appts=r[1];Store.busy=r[2];Store.notes=r[3];Store.error='';
 }catch(e){console.error(e);Store.error='Não foi possível carregar os dados.';}
 Store.ready=true;requestRender();
}
let reloadTimer;const reloadSoon=()=>{clearTimeout(reloadTimer);reloadTimer=setTimeout(loadAll,300);};
let unsub=null;
function startRealtime(){if(unsub)unsub();try{unsub=DB.subscribe(reloadSoon);}catch(e){console.error(e);}}
function stopRealtime(){if(unsub){unsub();unsub=null;}}
async function putAppt(a){if(Store.appts.some(x=>x.id===a.id))await DB.updateAppt(a);else await DB.insertAppt(a);}
async function notify(a,kind){const ns=mkNotes(a,kind,Store.cfg);await DB.insertNotes(ns);return ns;}
async function saveConfig(c){await DB.saveSettings(c);}
const findA=id=>Store.appts.find(a=>a.id===id);
const proName=id=>{const p=Store.cfg.pros.find(x=>x.id===id);return p?p.name:'—'};
const roomName=id=>{const r=Store.cfg.rooms.find(x=>x.id===id);return r?r.name:'—'};

/* ---------- estado da interface ---------- */
const ui={role:null,sess:null,tab:'inicio',stab:'agenda',sel:null,date:today(),calView:'pro',book:null,cfgDraft:null,
 ask:null,newBlock:'',payForm:{method:'pix',part:'total'},err:'',
 login:{role:'tutor',name:'',phone:'',email:'',channels:['email','push','telegram'],sEmail:'',password:''}};
let tt;function toast(m){const el=$('#toast');el.textContent=m;el.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('on'),3400);}
/* ---------- componentes comuns ---------- */
const pill=s=>'<span class="pill '+ST[s][1]+'">'+ST[s][0]+'</span>';
const payPill=p=>!p?'<span class="pill mute">Sem cobrança</span>':p.status==='pago'?'<span class="pill ok">Pago</span>':'<span class="pill warn">Cobrança em aberto</span>';
const chChips=(list,act)=>'<div class="chips">'+Object.keys(CH).map(k=>'<button type="button" class="chip '+(list.includes(k)?'on':'')+'" data-act="'+act+'" data-v="'+k+'">'+chIcon(k)+CH[k]+'</button>').join('')+'</div>';
const mine=()=>Store.appts.filter(a=>a.tutorId===Store.uid);
const modeChip=()=>sb?'<span class="modechip live" title="Os dados ficam na nuvem e são compartilhados">Na nuvem</span>':'<span class="modechip">Sem conexão</span>';

function header(){
 return '<header class="top"><div class="brand"><span class="mark">'+MARK+'</span>Agenda Vet</div><span class="hosp">'+esc(Store.cfg.hospital.name)+'</span><span class="grow"></span>'+modeChip()+
 (ui.role?'<span class="who">'+esc(ui.sess.name)+(ui.role==='staff'?' · recepção':'')+'</span><button class="btn ghost sm" data-act="logout">Sair</button>':'')+'</header>';
}

/* ---------- identificação ---------- */
function viewLogin(){
 const L=ui.login,st=L.role==='staff';
 return '<main class="login"><section class="intro"><p class="eyebrow">Protótipo de validação</p><h1>Agenda Vet</h1>'+
 '<p class="lead">O tutor pede o horário pelo celular. A recepção organiza dias, salas e profissionais. Cada passo chega ao tutor por e-mail, push ou Telegram.</p>'+
 '<ul class="facts"><li><b>Tutor</b> escolhe serviço, profissional e um horário realmente livre.</li><li><b>Recepção</b> pede a confirmação pelo canal do tutor e gera a cobrança Pix ou boleto.</li><li><b>Nos dois lados</b> a mudança aparece na hora quando o app está compartilhado.</li></ul></section>'+
 '<form class="card stack login-card" data-form="login"><div class="seg"><button type="button" class="'+(!st?'on':'')+'" data-act="loginRole" data-v="tutor">Sou tutor</button><button type="button" class="'+(st?'on':'')+'" data-act="loginRole" data-v="staff">Sou da equipe</button></div>'+
 (st?
  '<label class="f"><span>E-mail da equipe</span><input type="email" data-bind="login.sEmail" value="'+esc(L.sEmail)+'" autocomplete="username"></label><label class="f"><span>Senha</span><input type="password" data-bind="login.password" value="'+esc(L.password)+'" autocomplete="current-password"></label>':
  '<label class="f"><span>Nome do tutor</span><input data-bind="login.name" value="'+esc(L.name)+'" autocomplete="name" placeholder="Maria Souza"></label><label class="f"><span>Celular (Telegram ou WhatsApp)</span><input data-bind="login.phone" value="'+esc(L.phone)+'" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000"></label><label class="f"><span>E-mail (opcional)</span><input type="email" data-bind="login.email" value="'+esc(L.email)+'" autocomplete="email" placeholder="maria@email.com"></label><div class="f"><span>Como prefere receber avisos</span>'+chChips(L.channels,'togLoginCh')+'</div>')+
 (ui.err?'<div class="err">'+esc(ui.err)+'</div>':'')+
 '<button class="btn block" type="submit">Entrar</button></form></main>';
}

/* ---------- visão do tutor ---------- */
function viewTutor(){
 const tabs=[['inicio','Início','home'],['agendar','Agendar','plus'],['consultas','Consultas','list'],['avisos','Avisos','bell']];
 const aw=mine().filter(a=>a.status==='aguardando').length;
 const body=ui.tab==='inicio'?tInicio():ui.tab==='agendar'?bookView(false):ui.tab==='consultas'?tConsultas():tAvisos();
 return '<div class="tutor">'+body+'</div><nav class="tabbar" aria-label="Seções"><div class="tabbar-in">'+tabs.map(t=>'<button class="tab '+(ui.tab===t[0]?'on':'')+'" data-act="tab" data-v="'+t[0]+'">'+icon(t[2])+t[1]+(t[0]==='consultas'&&aw?'<span class="badge">'+aw+'</span>':'')+'</button>').join('')+'</div></nav>';
}
function tInicio(){
 const m=mine(),up=m.filter(a=>a.status!=='cancelado'&&a.status!=='concluido'&&a.date>=today()).sort(byDT);
 const next=up[0],need=up.find(a=>a.status==='aguardando'),owe=m.find(a=>a.pay&&a.pay.status==='pendente'&&a.status!=='cancelado');
 let h='<div class="hello"><p class="muted">Olá,</p><h2>'+esc(ui.sess.name.split(' ')[0])+'</h2></div>';
 if(need)h+='<div class="callout info"><b>O hospital pede sua confirmação</b><span>'+esc(need.pet)+' · '+esc(need.svcName)+' · '+fmtD(need.date)+' às '+need.time+'</span><button class="btn" data-act="tutorConfirm" data-id="'+need.id+'">Confirmar presença</button></div>';
 if(owe)h+='<div class="callout warn"><b>Cobrança em aberto</b><span>'+BRL(owe.pay.amount)+' referente a '+esc(owe.svcName)+'</span><button class="btn ghost" data-act="tab" data-v="consultas">Ver como pagar</button></div>';
 h+=next?'<div class="card appt"><div class="when"><b>'+pd(next.date).getDate()+'</b><span>'+MON[pd(next.date).getMonth()]+'</span></div><div class="body"><div class="r1"><b>'+esc(next.svcName)+'</b>'+pill(next.status)+'</div><span class="muted">'+fmtLong(next.date)+' · '+next.time+'</span><span class="muted">'+esc(next.pet)+' · '+esc(proName(next.proId))+'</span></div></div>':
  '<div class="card empty">Nenhum atendimento marcado.<br>Escolha um serviço e um horário livre.</div>';
 return h+'<button class="btn block" data-act="startBook">Agendar atendimento</button>';
}

function payBlock(a){
 const p=a.pay;if(!p)return '';
 if(p.status==='pago')return '<div class="callout" style="background:var(--ok-soft);color:var(--ok)"><b>Pagamento de '+BRL(p.amount)+' recebido</b></div>';
 const code=p.method==='pix'?p.pix:p.boleto;
 return '<div class="callout warn"><b>'+BRL(p.amount)+(p.part==='sinal'?' (sinal de 30%)':'')+' · '+(p.method==='pix'?'Pix copia e cola':'Boleto')+'</b><span>Vence em '+fmtD(p.due)+'. Código simulado neste protótipo.</span><div class="code">'+esc(code)+'</div><button class="btn ghost sm" data-act="copy" data-t="'+esc(code)+'">Copiar código</button></div>';
}
function tConsultas(){
 const list=mine().sort((a,b)=>byDT(b,a));
 if(!list.length)return '<h2>Consultas</h2><div class="card empty">Você ainda não tem agendamentos.<br><br><button class="btn" data-act="startBook">Agendar agora</button></div>';
 const up=list.filter(a=>a.date>=today()&&a.status!=='cancelado'&&a.status!=='concluido').sort(byDT),rest=list.filter(a=>!up.includes(a));
 const card=a=>{
  const live=up.includes(a),asking=ui.ask&&ui.ask.id===a.id;
  let act='';
  if(a.status==='aguardando')act+='<button class="btn sm" data-act="tutorConfirm" data-id="'+a.id+'">Confirmar presença</button>';
  if(live)act+='<button class="btn ghost sm" data-act="reschedule" data-id="'+a.id+'">Remarcar</button>'+(asking?'<button class="btn danger sm" data-act="doCancel" data-id="'+a.id+'" data-by="tutor">Sim, cancelar</button><button class="btn ghost sm" data-act="askNo">Manter</button>':'<button class="btn ghost sm" data-act="askCancel" data-id="'+a.id+'">Cancelar</button>');
  return '<article class="card stack"><div class="appt"><div class="when"><b>'+pd(a.date).getDate()+'</b><span>'+MON[pd(a.date).getMonth()]+'</span></div><div class="body"><div class="r1"><b>'+esc(a.svcName)+'</b>'+pill(a.status)+'</div><span class="muted">'+fmtLong(a.date)+' · '+a.time+'</span><span class="muted">'+esc(a.pet)+' · '+esc(proName(a.proId))+'</span><span class="price">'+BRL(a.price)+'</span></div></div>'+
   (a.status==='cancelado'?'':payBlock(a))+(act?'<div class="row">'+act+'</div>':'')+'</article>';
 };
 return '<h2>Consultas</h2>'+(up.length?'<div class="stack">'+up.map(card).join('')+'</div>':'')+(rest.length?'<h3 class="muted">Anteriores e cancelados</h3><div class="stack">'+rest.map(card).join('')+'</div>':'');
}
function tAvisos(){
 const list=Store.notes.filter(n=>n.tutorId===Store.uid).sort((a,b)=>b.at-a.at);
 return '<h2>Avisos</h2><p class="muted">Prévia das mensagens que o hospital envia por e-mail, push e Telegram. Neste protótipo elas são simuladas.</p>'+
 (list.length?'<div class="stack">'+list.map(n=>'<div class="card note"><div class="ch">'+chIcon(n.channel)+'</div><div class="stack" style="gap:4px;min-width:0"><div class="row" style="justify-content:space-between"><b>'+esc(n.title)+'</b><span class="muted mono" style="font-size:12px">'+fmtAt(n.at)+'</span></div><span>'+esc(n.body)+'</span><span class="muted" style="font-size:12px">'+CH[n.channel]+' · '+esc(n.dest)+'</span></div></div>').join('')+'</div>':'<div class="card empty">Nenhum aviso por enquanto.</div>');
}

/* ---------- assistente de agendamento (tutor e recepção) ---------- */
function newBook(staff,from){
 const last=!staff&&mine().sort(byDT).pop();
 return {step:1,svcId:from?from.svcId:null,proId:'any',date:null,time:null,pet:from?from.pet:(last?last.pet:''),species:from?from.species:(last?last.species:'Cão'),
  notes:'',reschedule:from?from.id:null,staff:!!staff,status:'confirmado',
  tutor:staff?{name:'',phone:'',email:'',channels:['email','push','telegram']}:{name:ui.sess.name,phone:ui.sess.phone,email:ui.sess.email,channels:[...ui.sess.channels]}};
}
function bookView(staff){
 if(!ui.book)ui.book=newBook(staff);
 const b=ui.book,cfg=Store.cfg,svc=cfg.services.find(s=>s.id===b.svcId);
 const steps=['Serviço','Quando','Dados','Revisão'];
 let h='<div class="stack"><div class="stack" style="gap:8px"><div class="row" style="justify-content:space-between"><h2>'+(b.reschedule?'Remarcar atendimento':staff?'Novo agendamento':'Agendar')+'</h2><span class="muted" style="font-size:13px">Passo '+b.step+' de 4 · '+steps[b.step-1]+'</span></div><div class="prog">'+[1,2,3,4].map(i=>'<i class="'+(i<=b.step?'on':'')+'"></i>').join('')+'</div></div>';
 if(b.step===1){
  h+='<div class="stack" style="gap:8px">'+cfg.services.map(s=>'<button class="opt '+(b.svcId===s.id?'on':'')+'" data-act="pickSvc" data-id="'+s.id+'"><span class="n"><b>'+esc(s.name)+'</b><small>'+s.dur+' min</small></span><span class="price">'+BRL(s.price)+'</span></button>').join('')+'</div>';
 }
 if(b.step===2&&svc){
  const pros=cfg.pros.filter(p=>p.skills.includes(svc.skill));
  h+='<div class="f"><span>Profissional</span><div class="chips"><button class="chip '+(b.proId==='any'?'on':'')+'" data-act="pickPro" data-id="any">Qualquer disponível</button>'+pros.map(p=>'<button class="chip '+(b.proId===p.id?'on':'')+'" data-act="pickPro" data-id="'+p.id+'">'+esc(p.name)+'</button>').join('')+'</div></div>';
  const days=[];let any=false;
  for(let i=0;i<28;i++){const d=addDays(today(),i),n=slotsFor(cfg,Store.busy,svc,d,b.proId,b.reschedule).length;if(n)any=true;days.push([d,n]);}
  h+='<div class="f"><span>Dia</span><div class="strip" id="strip" data-scroll>'+days.map(x=>{const dt=pd(x[0]);return '<button class="day '+(b.date===x[0]?'on':'')+'" '+(x[1]?'':'disabled ')+'data-act="pickDate" data-d="'+x[0]+'"><small>'+WD[dt.getDay()]+'</small><b>'+dt.getDate()+'</b><small>'+MON[dt.getMonth()]+'</small></button>'}).join('')+'</div></div>';
  if(!any)h+='<div class="err">Sem horários livres nas próximas 4 semanas para essa escolha.</div>';
  if(b.date){const sl=slotsFor(cfg,Store.busy,svc,b.date,b.proId,b.reschedule);
   h+='<div class="f"><span>Horário · '+fmtLong(b.date)+'</span>'+(sl.length?'<div class="slots">'+sl.map(s=>'<button class="slot '+(b.time===s.time?'on':'')+'" data-act="pickTime" data-t="'+s.time+'">'+s.time+'</button>').join('')+'</div>':'<p class="muted">Sem horários neste dia.</p>')+'</div>';}
 }
 if(b.step===3){
  if(b.staff)h+='<div class="grid2"><label class="f"><span>Nome do tutor</span><input data-bind="book.tutor.name" value="'+esc(b.tutor.name)+'"></label><label class="f"><span>Celular</span><input inputmode="tel" data-bind="book.tutor.phone" value="'+esc(b.tutor.phone)+'"></label><label class="f"><span>E-mail (opcional)</span><input type="email" data-bind="book.tutor.email" value="'+esc(b.tutor.email)+'"></label></div><div class="f"><span>Canais de aviso</span>'+chChips(b.tutor.channels,'togBookCh')+'</div>';
  h+='<div class="grid2"><label class="f"><span>Nome do pet</span><input data-bind="book.pet" value="'+esc(b.pet)+'" placeholder="Thor"></label><label class="f"><span>Espécie</span><select data-bind="book.species">'+['Cão','Gato','Outro'].map(s=>'<option '+(b.species===s?'selected':'')+'>'+s+'</option>').join('')+'</select></label></div><label class="f"><span>Motivo ou observações</span><textarea data-bind="book.notes" placeholder="Ex.: tosse há dois dias">'+esc(b.notes)+'</textarea></label>';
 }
 if(b.step===4&&svc){
  const sl=slotsFor(cfg,Store.busy,svc,b.date,b.proId,b.reschedule).find(x=>x.time===b.time);
  h+='<dl class="card sum"><dt>Serviço</dt><dd>'+esc(svc.name)+'</dd><dt>Quando</dt><dd>'+fmtLong(b.date)+' · '+b.time+'</dd><dt>Pet</dt><dd>'+esc(b.pet)+' ('+esc(b.species)+')</dd><dt>Profissional</dt><dd>'+esc(sl?proName(sl.proId):'—')+'</dd>'+(b.staff?'<dt>Sala</dt><dd>'+esc(sl?roomName(sl.roomId):'—')+'</dd><dt>Tutor</dt><dd>'+esc(b.tutor.name)+'</dd>':'')+'<dt>Valor</dt><dd class="price">'+BRL(svc.price)+'</dd></dl>';
  if(!b.staff)h+='<div class="f"><span>Avisos por</span>'+chChips(b.tutor.channels,'togBookCh')+'</div><p class="muted" style="font-size:13px">O hospital vai pedir sua confirmação pelos canais escolhidos.</p>';
  else h+='<label class="f"><span>Situação inicial</span><select data-bind="book.status"><option value="confirmado" '+(b.status==='confirmado'?'selected':'')+'>Confirmado com o tutor</option><option value="pendente" '+(b.status==='pendente'?'selected':'')+'>Pendente de confirmação</option></select></label>';
 }
 const canNext=b.step===1?!!b.svcId:b.step===2?!!b.time:true;
 h+='<div class="row" style="justify-content:space-between"><button class="btn ghost" data-act="bookBack">'+(b.step===1?'Cancelar':'Voltar')+'</button>'+(b.step<4?'<button class="btn" data-act="bookNext" '+(canNext?'':'disabled')+'>Continuar</button>':'<button class="btn" data-act="bookSubmit">'+(b.reschedule?'Confirmar remarcação':b.staff?'Criar agendamento':'Solicitar agendamento')+'</button>')+'</div></div>';
 return h;
}
/* ---------- visão da recepção ---------- */
function viewStaff(){
 const pend=Store.appts.filter(a=>a.status==='pendente').length;
 const tabs=[['agenda','Agenda','cal'],['solic','Confirmações','inbox'],['cobr','Cobranças','card'],['disp','Disponibilidade','sliders'],['msg','Mensagens','msg']];
 const body=ui.stab==='agenda'?sAgenda():ui.stab==='solic'?sSolic():ui.stab==='cobr'?sCobr():ui.stab==='disp'?sDisp():sMsg();
 return '<div class="staff"><nav class="stabs" aria-label="Seções">'+tabs.map(t=>'<button class="stab '+(ui.stab===t[0]?'on':'')+'" data-act="stab" data-v="'+t[0]+'">'+icon(t[2])+t[1]+(t[0]==='solic'&&pend?'<span class="badge">'+pend+'</span>':'')+'</button>').join('')+'</nav>'+body+'</div>';
}
function calendar(){
 const cfg=Store.cfg,date=ui.date,view=ui.calView,cols=view==='pro'?cfg.pros:cfg.rooms,RH=34,START=7*60,END=19*60,H=(END-START)/30*RH;
 const dow=pd(date).getDay(),blocked=cfg.blocked.includes(date),appts=Store.appts.filter(a=>a.date===date&&a.status!=='cancelado');
 let gut='';for(let m=START;m<END;m+=60)gut+='<span style="top:'+(m-START)/30*RH+'px">'+hm(m)+'</span>';
 const colsHtml=cols.map(c=>{
  let off='';
  if(blocked)off='<div class="off" style="top:0;height:'+H+'px"></div>';
  else if(view==='pro'){const h=c.hours&&c.hours[dow];
   if(!h)off='<div class="off" style="top:0;height:'+H+'px"></div>';
   else{const s=Math.max(tm(h[0]),START),e=Math.min(tm(h[1]),END),y1=(s-START)/30*RH,y2=(e-START)/30*RH;off='<div class="off" style="top:0;height:'+y1+'px"></div><div class="off" style="top:'+y2+'px;height:'+Math.max(H-y2,0)+'px"></div>';}}
  const evs=appts.filter(a=>(view==='pro'?a.proId:a.roomId)===c.id).map(a=>{const top=(tm(a.time)-START)/30*RH,h=Math.max(a.dur/30*RH-2,24);
   return '<button class="ev st-'+a.status+'" style="top:'+top+'px;height:'+h+'px" data-act="openAppt" data-id="'+a.id+'"><span class="t">'+a.time+'</span> <b>'+esc(a.pet)+'</b><small>'+esc(a.svcName)+'</small></button>'}).join('');
  return '<div class="cal-col"><div class="cal-head"><b>'+esc(c.name)+'</b><small>'+esc(view==='pro'?c.role:RT[c.type])+'</small></div><div class="cal-body" style="height:'+H+'px">'+off+evs+'</div></div>';
 }).join('');
 return '<div class="cal" id="cal" data-scroll><div class="cal-time"><div class="cal-head"></div><div class="cal-body" style="height:'+H+'px">'+gut+'</div></div>'+colsHtml+'</div>';
}
function sAgenda(){
 const day=Store.appts.filter(a=>a.date===ui.date&&a.status!=='cancelado'),n=s=>day.filter(a=>a.status===s).length;
 const blocked=Store.cfg.blocked.includes(ui.date);
 return '<div class="tools"><button class="btn ghost sm" data-act="dateStep" data-n="-1" aria-label="Dia anterior">←</button><input type="date" id="datepick" data-bind="date" data-rerender value="'+ui.date+'" aria-label="Dia"><button class="btn ghost sm" data-act="dateStep" data-n="1" aria-label="Próximo dia">→</button><button class="btn ghost sm" data-act="dateToday">Hoje</button><strong>'+fmtLong(ui.date)+'</strong><span class="grow"></span>'+
 '<div class="seg" style="min-width:230px"><button class="'+(ui.calView==='pro'?'on':'')+'" data-act="calView" data-v="pro">Profissionais</button><button class="'+(ui.calView==='sala'?'on':'')+'" data-act="calView" data-v="sala">Salas</button></div><button class="btn" data-act="staffBook">Novo agendamento</button></div>'+
 (blocked?'<div class="err">Dia bloqueado na disponibilidade. Nenhum horário é oferecido aos tutores.</div>':'')+
 '<div class="tiles"><div class="tile"><b>'+day.length+'</b><span>no dia</span></div><div class="tile"><b>'+n('confirmado')+'</b><span>confirmados</span></div><div class="tile"><b>'+n('aguardando')+'</b><span>aguardando tutor</span></div><div class="tile"><b>'+n('pendente')+'</b><span>a confirmar</span></div></div>'+
 calendar()+'<div class="legend"><span><i style="background:var(--warn)"></i>Solicitado</span><span><i style="background:var(--info)"></i>Aguardando tutor</span><span><i style="background:var(--ok)"></i>Confirmado</span><span><i style="background:var(--ink2)"></i>Concluído</span><span><i style="background:var(--surface2);border:1px solid var(--line)"></i>Fora do expediente</span></div>';
}

/* ---------- detalhe do agendamento ---------- */
function apptModal(a){
 const asking=ui.ask&&ui.ask.id===a.id,live=a.status!=='cancelado'&&a.status!=='concluido';
 const notes=Store.notes.filter(n=>n.apptId===a.id).sort((x,y)=>y.at-x.at).slice(0,5);
 let act='';
 if(a.status==='pendente'||a.status==='aguardando')act+='<button class="btn" data-act="sendConfirm" data-id="'+a.id+'">'+(a.status==='pendente'?'Enviar pedido de confirmação':'Reenviar pedido')+'</button><button class="btn soft" data-act="staffConfirm" data-id="'+a.id+'">Confirmar direto</button>';
 if(a.status==='confirmado')act+='<button class="btn soft" data-act="remind" data-id="'+a.id+'">Enviar lembrete</button><button class="btn" data-act="finish" data-id="'+a.id+'">Marcar como concluído</button>';
 if(live)act+=asking?'<button class="btn danger" data-act="doCancel" data-id="'+a.id+'" data-by="staff">Sim, cancelar</button><button class="btn ghost" data-act="askNo">Manter</button>':'<button class="btn ghost" data-act="askCancel" data-id="'+a.id+'">Cancelar agendamento</button>';
 let pay='';
 if(a.status!=='cancelado'){
  if(!a.pay)pay='<div class="row"><select data-bind="payForm.method" style="width:auto"><option value="pix" '+(ui.payForm.method==='pix'?'selected':'')+'>Pix</option><option value="boleto" '+(ui.payForm.method==='boleto'?'selected':'')+'>Boleto</option></select><select data-bind="payForm.part" style="width:auto"><option value="total" '+(ui.payForm.part==='total'?'selected':'')+'>Valor total</option><option value="sinal" '+(ui.payForm.part==='sinal'?'selected':'')+'>Sinal de 30%</option></select><button class="btn soft" data-act="genPay" data-id="'+a.id+'">Gerar cobrança</button></div>';
  else pay='<div class="row">'+payPill(a.pay)+'<span>'+BRL(a.pay.amount)+' · '+(a.pay.method==='pix'?'Pix':'Boleto')+'</span>'+(a.pay.status==='pendente'?'<button class="btn ghost sm" data-act="simPay" data-id="'+a.id+'">Simular pagamento recebido</button>':'')+'</div>';
 }
 return '<div class="back" data-act="closeModal"><div class="modal" role="dialog" aria-modal="true"><div class="mh"><div><h2>'+esc(a.svcName)+'</h2><span class="muted">'+fmtLong(a.date)+' · '+a.time+' · '+a.dur+' min</span></div><button class="x" data-act="closeModal" aria-label="Fechar">×</button></div>'+
 '<div class="row">'+pill(a.status)+payPill(a.pay)+'</div>'+
 '<dl class="sum"><dt>Tutor</dt><dd>'+esc(a.tutorName)+'</dd><dt>Contato</dt><dd>'+esc(a.phone)+(a.email?' · '+esc(a.email):'')+'</dd><dt>Avisos por</dt><dd>'+(a.channels||[]).map(c=>CH[c]).join(', ')+'</dd><dt>Pet</dt><dd>'+esc(a.pet)+' ('+esc(a.species)+')</dd><dt>Profissional</dt><dd>'+esc(proName(a.proId))+'</dd><dt>Sala</dt><dd>'+esc(roomName(a.roomId))+'</dd><dt>Valor</dt><dd class="price">'+BRL(a.price)+'</dd>'+(a.notes?'<dt>Observações</dt><dd>'+esc(a.notes)+'</dd>':'')+'</dl>'+
 (act?'<div class="row">'+act+'</div>':'')+(pay?'<div class="stack" style="gap:8px"><h3>Cobrança</h3>'+pay+'</div>':'')+
 (notes.length?'<div class="stack" style="gap:6px"><h3>Mensagens enviadas</h3>'+notes.map(n=>'<div class="row muted" style="font-size:13px;gap:8px">'+chIcon(n.channel)+'<span>'+esc(n.title)+'</span><span class="grow"></span><span class="mono">'+fmtAt(n.at)+'</span></div>').join('')+'</div>':'')+'</div></div>';
}
function bookModal(){return '<div class="back"><div class="modal wide" role="dialog" aria-modal="true">'+bookView(true)+'</div></div>'}

/* ---------- confirmações ---------- */
function sSolic(){
 const pend=Store.appts.filter(a=>a.status==='pendente').sort(byDT),wait=Store.appts.filter(a=>a.status==='aguardando').sort(byDT);
 const row=(a,w)=>'<div class="card qrow"><div class="stack" style="gap:2px;min-width:0"><b>'+esc(a.tutorName)+' · '+esc(a.pet)+'</b><span class="muted">'+esc(a.svcName)+' · '+fmtD(a.date)+' às '+a.time+' · '+esc(proName(a.proId))+'</span><span class="muted" style="font-size:13px">'+(w?'Pedido enviado '+fmtAt(a.confirmSentAt||a.createdAt)+' por ':'Avisos por ')+(a.channels||[]).map(c=>CH[c]).join(', ')+'</span></div><div class="row"><button class="btn sm" data-act="sendConfirm" data-id="'+a.id+'">'+(w?'Reenviar':'Enviar pedido')+'</button><button class="btn soft sm" data-act="staffConfirm" data-id="'+a.id+'">Confirmar direto</button><button class="btn ghost sm" data-act="openAppt" data-id="'+a.id+'">Detalhes</button></div></div>';
 const soon=Store.appts.filter(a=>a.status==='confirmado'&&a.date>=today()&&a.date<=addDays(today(),2)).length;
 return '<div class="row" style="justify-content:space-between"><h2>Confirmações</h2><div class="row"><button class="btn sm" data-act="sendAll" '+(pend.length?'':'disabled')+'>Enviar pedido para todos ('+pend.length+')</button><button class="btn ghost sm" data-act="remindAll" '+(soon?'':'disabled')+'>Lembrar próximos 2 dias ('+soon+')</button></div></div>'+
 '<h3>A confirmar com o tutor</h3>'+(pend.length?'<div class="stack">'+pend.map(a=>row(a,false)).join('')+'</div>':'<div class="card empty">Nenhuma solicitação nova.</div>')+
 '<h3>Aguardando resposta do tutor</h3>'+(wait.length?'<div class="stack">'+wait.map(a=>row(a,true)).join('')+'</div>':'<div class="card empty">Ninguém aguardando resposta.</div>');
}

/* ---------- cobranças ---------- */
function sCobr(){
 const list=Store.appts.filter(a=>a.status!=='cancelado').sort(byDT),open=list.filter(a=>a.pay&&a.pay.status==='pendente'),paid=list.filter(a=>a.pay&&a.pay.status==='pago');
 const sum=l=>l.reduce((s,a)=>s+a.pay.amount,0),none=list.filter(a=>!a.pay).length,f=ui.payForm;
 return '<div class="row" style="justify-content:space-between"><h2>Cobranças</h2><div class="row"><span class="muted">Nova cobrança:</span><select data-bind="payForm.method" style="width:auto"><option value="pix" '+(f.method==='pix'?'selected':'')+'>Pix</option><option value="boleto" '+(f.method==='boleto'?'selected':'')+'>Boleto</option></select><select data-bind="payForm.part" style="width:auto"><option value="total" '+(f.part==='total'?'selected':'')+'>Valor total</option><option value="sinal" '+(f.part==='sinal'?'selected':'')+'>Sinal de 30%</option></select></div></div>'+
 '<div class="tiles"><div class="tile"><b>'+BRL(sum(open))+'</b><span>a receber ('+open.length+')</span></div><div class="tile"><b>'+BRL(sum(paid))+'</b><span>recebido ('+paid.length+')</span></div><div class="tile"><b>'+none+'</b><span>atendimentos sem cobrança</span></div></div>'+
 '<p class="muted" style="font-size:13px">Pix e boleto são simulados aqui. Na versão real, a cobrança é criada pela API do Asaas e o aviso de pagamento chega por webhook.</p>'+
 (list.length?'<div class="tablewrap"><table><thead><tr><th>Atendimento</th><th>Tutor / pet</th><th>Valor</th><th>Cobrança</th><th></th></tr></thead><tbody>'+list.map(a=>'<tr><td>'+esc(a.svcName)+'<br><span class="muted mono" style="font-size:12px">'+fmtD(a.date)+' '+a.time+'</span></td><td>'+esc(a.tutorName)+'<br><span class="muted" style="font-size:13px">'+esc(a.pet)+'</span></td><td class="price">'+BRL(a.pay?a.pay.amount:a.price)+'</td><td>'+payPill(a.pay)+'</td><td>'+(!a.pay?'<button class="btn soft sm" data-act="genPay" data-id="'+a.id+'">Cobrar</button>':a.pay.status==='pendente'?'<button class="btn ghost sm" data-act="simPay" data-id="'+a.id+'">Simular pagamento</button>':'')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="card empty">Sem atendimentos.</div>');
}

/* ---------- disponibilidade (rascunho editável) ---------- */
const draft=()=>ui.cfgDraft||(ui.cfgDraft=clone(Store.cfg));
const saveBar=()=>'<div class="savebar"><button class="btn ghost" data-act="discardCfg">Descartar alterações</button><button class="btn" data-act="saveCfg">Salvar alterações</button></div>';
function sDisp(){
 const c=draft(),ORDER=[1,2,3,4,5,6,0];
 const pros=c.pros.map((p,i)=>'<div class="card stack"><div class="grid2"><label class="f"><span>Profissional</span><input data-bind="cfgDraft.pros.'+i+'.name" value="'+esc(p.name)+'"></label><label class="f"><span>Especialidade</span><input data-bind="cfgDraft.pros.'+i+'.role" value="'+esc(p.role)+'"></label></div>'+
  '<div class="f"><span>Faz atendimentos de</span><div class="chips">'+Object.keys(SK).map(k=>'<button type="button" class="chip '+(p.skills.includes(k)?'on':'')+'" data-act="togSkill" data-i="'+i+'" data-k="'+k+'">'+SK[k]+'</button>').join('')+'</div></div>'+
  '<div class="hours">'+ORDER.map(d=>{const h=p.hours[d];return '<div class="hr"><button type="button" class="chip '+(h?'on':'')+'" data-act="togDay" data-i="'+i+'" data-d="'+d+'">'+WD[d]+'</button>'+(h?'<input type="time" data-bind="cfgDraft.pros.'+i+'.hours.'+d+'.0" value="'+h[0]+'"><span>às</span><input type="time" data-bind="cfgDraft.pros.'+i+'.hours.'+d+'.1" value="'+h[1]+'">':'<span class="muted">sem atendimento</span>')+'</div>'}).join('')+'</div></div>').join('');
 const rooms=c.rooms.map((r,i)=>'<div class="grid2"><label class="f"><span>Sala</span><input data-bind="cfgDraft.rooms.'+i+'.name" value="'+esc(r.name)+'"></label><label class="f"><span>Tipo</span><select data-bind="cfgDraft.rooms.'+i+'.type">'+Object.keys(RT).map(k=>'<option value="'+k+'" '+(r.type===k?'selected':'')+'>'+RT[k]+'</option>').join('')+'</select></label></div>').join('');
 const svcs=c.services.map((s,i)=>'<div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))"><label class="f" style="grid-column:1/-1"><span>Serviço</span><input data-bind="cfgDraft.services.'+i+'.name" value="'+esc(s.name)+'"></label><label class="f"><span>Duração (min)</span><input type="number" min="10" step="5" data-num data-bind="cfgDraft.services.'+i+'.dur" value="'+s.dur+'"></label><label class="f"><span>Preço (R$)</span><input type="number" min="0" step="10" data-num data-bind="cfgDraft.services.'+i+'.price" value="'+s.price+'"></label><label class="f"><span>Tipo de sala</span><select data-bind="cfgDraft.services.'+i+'.roomType">'+Object.keys(RT).map(k=>'<option value="'+k+'" '+(s.roomType===k?'selected':'')+'>'+RT[k]+'</option>').join('')+'</select></label><label class="f"><span>Profissional com</span><select data-bind="cfgDraft.services.'+i+'.skill">'+Object.keys(SK).map(k=>'<option value="'+k+'" '+(s.skill===k?'selected':'')+'>'+SK[k]+'</option>').join('')+'</select></label></div>').join('<hr style="border:0;border-top:1px solid var(--line);width:100%">');
 const blocked=c.blocked.slice().sort().map(d=>'<span class="chip on">'+fmtD(d)+' <button type="button" class="x" style="width:22px;height:22px;font-size:14px" data-act="rmBlock" data-d="'+d+'" aria-label="Remover bloqueio">×</button></span>').join('');
 return '<h2>Disponibilidade</h2><p class="muted">Defina expediente de cada profissional, salas, serviços e datas sem atendimento. Os tutores só veem horários que cabem nessas regras e que não conflitam com outro agendamento.</p>'+
 '<h3>Profissionais e expediente</h3><div class="stack">'+pros+'<button class="btn ghost" data-act="addPro">Adicionar profissional</button></div>'+
 '<h3>Salas</h3><div class="card stack">'+rooms+'<div><button class="btn ghost sm" data-act="addRoom">Adicionar sala</button></div></div>'+
 '<h3>Serviços</h3><div class="card stack">'+svcs+'<div><button class="btn ghost sm" data-act="addSvc">Adicionar serviço</button></div></div>'+
 '<h3>Datas sem atendimento</h3><div class="card stack"><div class="chips">'+(blocked||'<span class="muted">Nenhuma data bloqueada.</span>')+'</div><div class="row"><input type="date" data-bind="newBlock" value="'+esc(ui.newBlock)+'" style="width:auto"><button class="btn ghost sm" data-act="addBlock">Bloquear data</button></div></div>'+saveBar();
}

/* ---------- mensagens e canais ---------- */
function sMsg(){
 const c=draft(),log=Store.notes.slice().sort((a,b)=>b.at-a.at).slice(0,40);
 return '<h2>Mensagens</h2><p class="muted">Aqui ficam os canais de aviso e o registro do que foi enviado. Neste protótipo os envios são simulados e só aparecem no app.</p>'+
 '<div class="card stack"><h3>Canais ativos</h3><div class="chips">'+Object.keys(CH).map(k=>'<button type="button" class="chip '+(c.channels[k]?'on':'')+'" data-act="togChan" data-k="'+k+'">'+chIcon(k)+CH[k]+'</button>').join('')+'</div>'+
 '<label class="f"><span>Texto do pedido de confirmação</span><textarea data-bind="cfgDraft.templates.pedido_confirmacao">'+esc(c.templates.pedido_confirmacao)+'</textarea></label><label class="f"><span>Texto do lembrete</span><textarea data-bind="cfgDraft.templates.lembrete">'+esc(c.templates.lembrete)+'</textarea></label><p class="muted" style="font-size:13px">Campos disponíveis: {tutor} {pet} {servico} {data} {hospital}</p></div>'+
 '<h3>Registro de envios</h3>'+(log.length?'<div class="tablewrap"><table><thead><tr><th>Quando</th><th>Canal</th><th>Para</th><th>Mensagem</th></tr></thead><tbody>'+log.map(n=>'<tr><td class="mono" style="white-space:nowrap">'+fmtAt(n.at)+'</td><td>'+CH[n.channel]+'</td><td>'+esc(n.tutorName)+'</td><td><b>'+esc(n.title)+'</b><br><span class="muted" style="font-size:13px">'+esc(n.body)+'</span></td></tr>').join('')+'</tbody></table></div>':'<div class="card empty">Nenhum envio ainda.</div>')+saveBar();
}
/* ---------- renderização ---------- */
function render(){
 const keep={};document.querySelectorAll('[data-scroll]').forEach(el=>{keep[el.id]=[el.scrollLeft,el.scrollTop]});
 const y=window.scrollY;
 let h=header();
 if(!ui.role)h+=viewLogin();
 else{
  h+=ui.role==='tutor'?viewTutor():viewStaff();
  if(ui.role==='staff'){
   if(ui.book&&ui.book.staff)h+=bookModal();
   else if(ui.sel){const a=findA(ui.sel);if(a)h+=apptModal(a);}
  }
 }
 $('#app').innerHTML=h;
 document.querySelectorAll('[data-scroll]').forEach(el=>{const k=keep[el.id];if(k){el.scrollLeft=k[0];el.scrollTop=k[1];}});
 window.scrollTo(0,y);
}
let pendingRender=false;
const typing=()=>{const ae=document.activeElement;return ae&&ae.closest&&ae.closest('#app')&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)&&ae.type!=='checkbox'};
function requestRender(){if(typing()){pendingRender=true;return;}render();}
document.addEventListener('focusout',()=>{if(pendingRender)setTimeout(()=>{if(!typing()){pendingRender=false;render();}},0);});

/* ---------- ações ---------- */
function setPath(obj,path,val){const k=path.split('.');let o=obj;for(let i=0;i<k.length-1;i++){o=o[k[i]];if(o==null)return;}o[k[k.length-1]]=val;}
const tog=(arr,v)=>{const i=arr.indexOf(v);if(i>=0)arr.splice(i,1);else arr.push(v);};
function copyText(t){try{navigator.clipboard.writeText(t).then(()=>toast('Código copiado.')).catch(()=>toast('Não foi possível copiar. Selecione o código e copie.'));}catch(e){toast('Não foi possível copiar. Selecione o código e copie.');}}
const chNames=ns=>[...new Set(ns.map(n=>CH[n.channel]))].join(', ');
function genPay(a,method,part){
 const amount=Math.round(a.price*(part==='sinal'?0.3:1)*100)/100,code=uid().toUpperCase();
 return {status:'pendente',method,part,amount,createdAt:Date.now(),due:addDays(today(),3),ref:'cob_'+code,
  pix:method==='pix'?'PIX-SIMULADO-'+code+'-'+amount.toFixed(2):null,
  boleto:method==='boleto'?'SIMULADO 00000.00000 '+code.slice(0,5)+'.000000 00000.000000 0 '+String(Math.round(amount*100)).padStart(10,'0'):null};
}
async function setStatus(id,status,kind,extra){
 const a=findA(id);if(!a)return [];
 const n=Object.assign({},a,{status},extra||{});
 await putAppt(n);const ns=kind?await notify(n,kind):[];
 await loadAll();return ns;
}
const PROFILE_KEY='agendavet.profile';
const saveProfile=p=>{try{localStorage.setItem(PROFILE_KEY,JSON.stringify(p))}catch(e){}};
const readProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch(e){return null}};
function friendly(e){
 const m=String((e&&e.message)||e||'');
 if(/Invalid login credentials/i.test(m))return 'E-mail ou senha incorretos.';
 if(/anonymous sign-ins are disabled/i.test(m))return 'O login anônimo está desligado no Supabase. Veja o passo 3 do README.';
 if(/Failed to fetch|NetworkError/i.test(m))return 'Sem conexão com o Supabase. Confira o endereço em config.js.';
 return 'Não foi possível entrar. Tente de novo.';
}

const A={
 loginRole(d){ui.login.role=d.v;ui.err='';render();},
 togLoginCh(d){tog(ui.login.channels,d.v);render();},
 async doLogin(){
  const L=ui.login;ui.err='';
  if(!sb){ui.err='Falta configurar o Supabase em config.js (veja o README).';return render();}
  try{
   if(L.role==='staff'){
    if(!L.sEmail.trim()||!L.password){ui.err='Informe e-mail e senha.';return render();}
    const s=await DB.staffLogin(L.sEmail.trim(),L.password);
    const nm=await DB.staffName(s.user.id);
    if(nm==null){await DB.signOut();ui.err='Este usuário não está cadastrado como equipe (veja o passo 5 do README).';L.password='';return render();}
    L.password='';Store.uid=s.user.id;ui.role='staff';ui.sess={name:nm};ui.stab='agenda';
   }else{
    const dg=digits(L.phone);
    if(!L.name.trim()){ui.err='Informe o nome do tutor.';return render();}
    if(dg.length<10){ui.err='Informe o celular com DDD.';return render();}
    if(L.email.trim()&&!/^\S+@\S+\.\S+$/.test(L.email.trim())){ui.err='Esse e-mail parece incompleto.';return render();}
    if(!L.channels.length){ui.err='Escolha pelo menos um canal de aviso.';return render();}
    let s=await DB.session();
    if(s&&!s.user.is_anonymous){await DB.signOut();s=null;}
    if(!s)s=await DB.anon();
    Store.uid=s.user.id;
    ui.sess={name:L.name.trim(),phone:L.phone.trim(),email:L.email.trim(),channels:[...L.channels]};
    saveProfile(ui.sess);ui.role='tutor';ui.tab='inicio';
   }
  }catch(e){console.error(e);ui.err=friendly(e);return render();}
  render();await loadAll();startRealtime();
 },
 async logout(){
  const wasStaff=ui.role==='staff';
  stopRealtime();ui.role=null;ui.sess=null;ui.book=null;ui.sel=null;ui.cfgDraft=null;ui.err='';
  Store.appts=[];Store.notes=[];Store.busy=[];
  if(wasStaff){try{await DB.signOut();Store.uid=null;}catch(e){console.error(e);}}
  render();
 },
 tab(d){ui.tab=d.v;ui.ask=null;if(d.v!=='agendar')ui.book=null;render();},
 stab(d){ui.stab=d.v;ui.cfgDraft=null;ui.ask=null;render();},
 startBook(){ui.book=newBook(false);ui.tab='agendar';render();},
 staffBook(){ui.book=newBook(true);render();},
 reschedule(d){const a=findA(d.id);if(!a)return;ui.book=newBook(false,a);ui.book.step=2;ui.tab='agendar';render();},
 bookBack(){const b=ui.book;if(b.step===1){ui.book=null;if(ui.role==='tutor')ui.tab='inicio';}else b.step--;render();},
 bookNext(){
  const b=ui.book;
  if(b.step===3){
   if(!b.pet.trim())return toast('Informe o nome do pet.');
   if(b.staff){if(!b.tutor.name.trim())return toast('Informe o nome do tutor.');if(digits(b.tutor.phone).length<10)return toast('Informe o celular do tutor com DDD.');}
  }
  b.step++;render();
 },
 pickSvc(d){const b=ui.book;b.svcId=d.id;b.proId='any';b.date=null;b.time=null;render();},
 pickPro(d){const b=ui.book;b.proId=d.id;b.date=null;b.time=null;render();},
 pickDate(d){const b=ui.book;b.date=d.d;b.time=null;render();},
 pickTime(d){ui.book.time=d.t;render();},
 togBookCh(d){tog(ui.book.tutor.channels,d.v);render();},
 async bookSubmit(){
  const b=ui.book,cfg=Store.cfg,svc=cfg.services.find(s=>s.id===b.svcId);
  if(!b.tutor.channels.length)return toast('Escolha pelo menos um canal de aviso.');
  await loadAll();
  const sl=slotsFor(cfg,Store.busy,svc,b.date,b.proId,b.reschedule).find(x=>x.time===b.time);
  if(!sl){toast('Esse horário acabou de ser ocupado. Escolha outro.');b.step=2;b.time=null;return render();}
  const t=b.tutor,status=b.staff?b.status:'pendente';
  const a={id:uuid(),tutorId:b.staff?null:Store.uid,tutorName:t.name.trim(),phone:t.phone.trim(),email:(t.email||'').trim(),channels:[...t.channels],
   pet:b.pet.trim(),species:b.species,notes:b.notes.trim(),svcId:svc.id,svcName:svc.name,dur:svc.dur,price:svc.price,proId:sl.proId,roomId:sl.roomId,
   date:b.date,time:b.time,status,pay:null};
  try{await putAppt(a);}
  catch(e){
   console.error(e);
   if(e&&e.code==='23P01'){toast('Esse horário acabou de ser ocupado. Escolha outro.');b.step=2;b.time=null;await loadAll();return render();}
   return toast('Não foi possível salvar o agendamento. Tente de novo.');
  }
  if(b.reschedule){try{await DB.rpc('tutor_cancel',b.reschedule);}catch(e){console.error(e);}}
  await notify(a,status==='confirmado'?'confirmado':'solicitacao');
  ui.book=null;await loadAll();
  if(ui.role==='tutor'){ui.tab='consultas';toast('Pedido enviado. O hospital vai pedir sua confirmação.');}
  else{ui.date=a.date;ui.stab='agenda';toast('Agendamento criado.');}
  render();
 },
 askCancel(d){ui.ask={id:d.id};render();},
 askNo(){ui.ask=null;render();},
 async doCancel(d){
  if(d.by==='tutor'){await DB.rpc('tutor_cancel',d.id);await loadAll();const a=findA(d.id);if(a)await notify(a,'cancelado');}
  else await setStatus(d.id,'cancelado','cancelado',{cancelNote:'Cancelado pela recepção'});
  ui.ask=null;await loadAll();toast('Agendamento cancelado.');render();
 },
 async tutorConfirm(d){await DB.rpc('tutor_confirm',d.id);await loadAll();const a=findA(d.id);if(a)await notify(a,'confirmado');await loadAll();toast('Presença confirmada. Obrigado!');render();},
 async sendConfirm(d){const ns=await setStatus(d.id,'aguardando','pedido_confirmacao',{confirmSentAt:Date.now()});toast(ns.length?'Pedido enviado por '+chNames(ns)+'.':'Nenhum canal ativo para este tutor.');render();},
 async staffConfirm(d){await setStatus(d.id,'confirmado','confirmado',{confirmedAt:Date.now()});toast('Agendamento confirmado.');render();},
 async finish(d){await setStatus(d.id,'concluido',null);toast('Atendimento concluído.');render();},
 async remind(d){const a=findA(d.id);const ns=await notify(a,'lembrete');await loadAll();toast(ns.length?'Lembrete enviado por '+chNames(ns)+'.':'Nenhum canal ativo para este tutor.');},
 async sendAll(){const l=Store.appts.filter(a=>a.status==='pendente');for(const a of l)await setStatus(a.id,'aguardando','pedido_confirmacao',{confirmSentAt:Date.now()});toast('Pedidos enviados: '+l.length+'.');render();},
 async remindAll(){const l=Store.appts.filter(a=>a.status==='confirmado'&&a.date>=today()&&a.date<=addDays(today(),2));for(const a of l)await notify(a,'lembrete');await loadAll();toast('Lembretes enviados: '+l.length+'.');},
 async genPay(d){const a=findA(d.id);if(!a)return;const n=Object.assign({},a,{pay:genPay(a,ui.payForm.method,ui.payForm.part)});await putAppt(n);await notify(n,'cobranca');await loadAll();toast('Cobrança gerada e enviada ao tutor.');render();},
 async simPay(d){const a=findA(d.id);if(!a||!a.pay)return;const n=Object.assign({},a,{pay:Object.assign({},a.pay,{status:'pago',paidAt:Date.now()})});await putAppt(n);await notify(n,'pago');await loadAll();toast('Pagamento registrado (simulação de webhook).');render();},
 copy(d){copyText(d.t);},
 openAppt(d){ui.sel=d.id;ui.ask=null;render();},
 closeModal(d,el,ev){if(ev&&ev.target!==el)return;ui.sel=null;ui.ask=null;render();},
 dateStep(d){ui.date=addDays(ui.date,Number(d.n));render();},
 dateToday(){ui.date=today();render();},
 calView(d){ui.calView=d.v;render();},
 togSkill(d){const p=draft().pros[Number(d.i)];tog(p.skills,d.k);render();},
 togDay(d){const p=draft().pros[Number(d.i)];if(p.hours[d.d])delete p.hours[d.d];else p.hours[d.d]=['08:00','17:00'];render();},
 addPro(){draft().pros.push({id:'p'+uid(),name:'Novo profissional',role:'',skills:['clinica'],hours:{1:['08:00','17:00'],2:['08:00','17:00'],3:['08:00','17:00'],4:['08:00','17:00'],5:['08:00','17:00']}});render();},
 addRoom(){draft().rooms.push({id:'r'+uid(),name:'Nova sala',type:'consulta'});render();},
 addSvc(){draft().services.push({id:'s'+uid(),name:'Novo serviço',dur:30,price:0,roomType:'consulta',skill:'clinica'});render();},
 addBlock(){const v=ui.newBlock;if(!v||v<today())return toast('Escolha uma data a partir de hoje.');const c=draft();if(!c.blocked.includes(v))c.blocked.push(v);ui.newBlock='';render();},
 rmBlock(d){const c=draft();c.blocked=c.blocked.filter(x=>x!==d.d);render();},
 togChan(d){const c=draft();c.channels[d.k]=!c.channels[d.k];render();},
 discardCfg(){ui.cfgDraft=null;render();},
 async saveCfg(){
  const c=draft();
  for(const p of c.pros){for(const k in p.hours){if(tm(p.hours[k][0])>=tm(p.hours[k][1]))return toast('Horário inválido em '+p.name+' ('+WD[k]+'): o início precisa ser antes do fim.');}}
  for(const s of c.services){if(!s.name.trim()||s.dur<10)return toast('Confira nome e duração dos serviços (mínimo 10 min).');}
  await saveConfig(c);ui.cfgDraft=null;await loadAll();toast('Alterações salvas.');render();
 }
};

/* ---------- eventos ---------- */
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el||el.disabled)return;
 const f=A[el.dataset.act];if(!f)return;
 e.preventDefault();
 try{const r=f(el.dataset,el,e);if(r&&r.catch)r.catch(err=>{console.error(err);toast('Não foi possível concluir. Tente de novo.');});}
 catch(err){console.error(err);toast('Algo deu errado. Tente de novo.');}
});
function onInput(e){
 const el=e.target,p=el.dataset&&el.dataset.bind;if(!p)return;
 let v=el.value;if('num' in el.dataset)v=Number(v)||0;
 if(p==='date'&&!v)return;
 setPath(ui,p,v);
 if('rerender' in el.dataset)render();
}
document.addEventListener('input',onInput);
document.addEventListener('change',onInput);
document.addEventListener('submit',e=>{e.preventDefault();if(e.target.dataset.form==='login')A.doLogin();});

/* ---------- início: recupera a sessão, se houver ---------- */
async function init(){
 if(!sb){Store.ready=true;render();return;}
 try{
  const s=await DB.session();
  if(s){
   const nm=await DB.staffName(s.user.id);
   if(nm!=null){Store.uid=s.user.id;ui.role='staff';ui.sess={name:nm};}
   else if(s.user.is_anonymous){const p=readProfile();if(p){Store.uid=s.user.id;ui.role='tutor';ui.sess=p;ui.tab='inicio';}}
  }
 }catch(e){console.error(e);}
 render();
 if(ui.role){await loadAll();startRealtime();}
}
render();
init();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
