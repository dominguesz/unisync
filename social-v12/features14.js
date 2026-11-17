/* UniSync 1.4 · Recursos da comunidade. Dados fictícios identificados. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rd=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const fmtTime=ms=>{const n=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
const fmtDate=v=>{let n=typeof v?.toMillis==='function'?v.toMillis():v?.seconds?v.seconds*1000:Number(v||0);return n?new Date(n).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}):'recentemente';};
const gyms=[
{id:'smart-centro',name:'Smart Fit · Senador Fláquer',area:'Centro',address:'Rua Senador Fláquer, 380, Santo André, SP, Brasil'},
{id:'inova-jardim',name:'Inova · Bairro Jardim',area:'Jardim',address:'Rua das Figueiras, 1084, Santo André, SP, Brasil'},
{id:'bluefit-assuncao',name:'Bluefit · Fernando Prestes',area:'Vila Assunção',address:'Rua Coronel Fernando Prestes, 540, Santo André, SP, Brasil'},
{id:'gerson-doria',name:'Academia Gerson Doria',area:'Casa Branca',address:'Rua Alcídes de Queirós, 143, Santo André, SP, Brasil'},
{id:'panobianco-martim',name:'Panobianco · Martim Francisco',area:'Vila Alto de Santo André',address:'Avenida Martim Francisco, 538, Santo André, SP, Brasil'},
{id:'smart-grand',name:'Smart Fit · Grand Plaza',area:'Jardim',address:'Avenida Industrial, 700, Santo André, SP, Brasil'}
];
const validGyms=new Set(gyms.map(g=>g.id));
const makeBtn=(label,action,id='',style='soft')=>'<button class="btn sm '+style+'" type="button" data-feature-action="'+action+'" data-id="'+esc(id)+'">'+label+'</button>';
const heading=(k,h,d)=>'<header class="feature-heading"><div class="section-eyebrow">'+k+'</div><h1>'+h+'</h1><p class="hint">'+d+'</p></header>';
const dateId=()=>new Date().toISOString().slice(0,10);
const b64=u=>btoa(String.fromCharCode(...new Uint8Array(u)));
const from64=v=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));
const cryptoKey=async(pass,salt)=>{const raw=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:170000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);};
async function encryptData(pass,data,oldSalt=null){const salt=oldSalt||crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await cryptoKey(pass,salt);const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));return {v:1,salt:b64(salt),iv:b64(iv),data:b64(cipher)};}
async function decryptData(pass,blob){const key=await cryptoKey(pass,from64(blob.salt));return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(blob.iv)},key,from64(blob.data))));}
export function createFeatures({root,context,saveAnnouncement,mutate,toast,rerender}){
let gymQuery='',femalePass='',femaleRecords=null,femaleOwner=null,notificationOn=false;
const uid=()=>String(context().userId||'guest');
const focusPrefKey=()=> 'unisync_focus14_prefs_'+uid();
const focusSessionKey=()=> 'unisync_focus14_session_'+uid();
const focusHistoryKey=()=> 'unisync_focus14_history_'+uid();
const femKey=()=> 'unisync_female_encrypted14_'+uid();
const focusPrefs=()=>rd(focusPrefKey(),{focus:25,rest:5,cycles:4,auto:true,goal:60});
const focusSession=()=>rd(focusSessionKey(),{mode:'idle',ends:0,cycle:1,completed:0,started:0});
const focusHistory=()=>rd(focusHistoryKey(),[]);
const isFemale=()=>context().me?.gender==='female';
const shortcuts=()=>'<div class="feature-shortcuts">'+[['events','Festas','🎉'],['jobs','Estágios','💼'],['focus','Modo foco','⏱️'],['gyms','Academias','🏋️']].concat(isFemale()?[['female','Saúde feminina','🌷']]:[]).map(([id,t,ico])=>'<button class="feature-shortcut" data-action="navigate" data-id="'+id+'"><span>'+ico+'</span><strong>'+t+'</strong><small>Abrir →</small></button>').join('')+'</div>';
const profileName=id=>context().profiles?.find(p=>p.id===id)?.name||'Membro da comunidade';
const evtList=kind=>(context().posts||[]).filter(p=>(p.tags||[]).includes(kind==='events'?'Eventos UniSync':'Vagas UniSync')&&(p.status==='aprovado'||p.authorId===uid())).sort((a,b)=>{const tv=x=>x?.createdAt?.seconds?x.createdAt.seconds*1000:Number(x?.createdAt)||0;return tv(b)-tv(a);});
function eventCard(post){
 const rsvps=(context().rsvps||[]).filter(r=>r.postId===post.id);
 const going=rsvps.filter(r=>r.choice==='going'),maybe=rsvps.filter(r=>r.choice==='maybe');
 const mine=rsvps.find(r=>r.userId===uid());
 const following=new Set((context().follows||[]).filter(f=>f.followerId===uid()).map(f=>f.followingId));
 const friends=going.filter(r=>r.visible&&following.has(r.userId));
 const visibleNames=going.filter(r=>r.visible&&r.userId!==uid()).slice(0,4).map(r=>profileName(r.userId));
 return '<article class="panel panel-pad v14-event"><div class="row between"><span class="pill">🎟 Evento da comunidade</span><small>'+fmtDate(post.createdAt)+'</small></div><h3>'+esc(post.title)+'</h3><p class="post-body">'+esc(post.body)+'</p><div class="v14-event-stats"><span>✅ '+going.length+' confirmados</span><span>⭐ '+maybe.length+' interessados</span></div>'
 +'<div class="v14-controls">'+makeBtn('Vou participar','rsvp',post.id+'|going',mine?.choice==='going'?'primary':'soft')+makeBtn('Talvez','rsvp',post.id+'|maybe',mine?.choice==='maybe'?'primary':'soft')+(mine?makeBtn('Cancelar presença','rsvp-remove',post.id,'line'):'')+'</div>'
 +'<label class="v14-tick"><input type="checkbox" data-feature-check="rsvp-visible" data-id="'+esc(post.id)+'" '+(mine?.visible?'checked':'')+'> Mostrar meu nome para outros participantes</label>'
 +(friends.length?'<p class="v14-meta"><strong>Seguindo você?</strong> Pessoas que você segue e confirmaram presença: '+friends.map(r=>esc(profileName(r.userId))).join(', ')+'</p>':'')
 +(visibleNames.length?'<p class="v14-meta">Participantes que compartilharam seus nomes: '+visibleNames.map(esc).join(', ')+'</p>':'')
 +'<small class="hint">Sua participação é opcional; você pode cancelar quando quiser.</small></article>';
}
function announcements(kind){
const party=kind==='events',tag=party?'Eventos UniSync':'Vagas UniSync',sample=party?{title:'Conexão Universitária — noite cultural',body:'Evento fictício para demonstrar como será um convite com programação, música e encontro entre estudantes.',detail:'Sábado, 19h (ilustrativo)',place:'Espaço Aurora (fictício)'}:{title:'Estágio multidisciplinar — Empresa Exemplo',body:'Vaga fictícia, com espaço para qualquer curso, projeto, área ou modalidade. A proposta é manter os anúncios abertos e simples.',detail:'Modalidade negociável',place:'Empresa Exemplo (fictícia)'};
const list=evtList(kind);
return heading(party?'CULTURA E CONEXÕES':'CARREIRA E OPORTUNIDADES',party?'Festas e encontros':'Vagas e oportunidades',party?'Explore encontros, organize eventos e confirme presença nas atividades da comunidade.':'Divulgue oportunidades livremente, sem filtros obrigatórios por curso ou tipo de vaga.')
+'<section class="panel panel-pad feature-highlight"><div class="row between"><strong>✦ Exemplo de anúncio</strong><span class="pill">Fictício</span></div><h2>'+esc(sample.title)+'</h2><p>'+esc(sample.body)+'</p><div class="feature-meta"><span>📍 '+esc(sample.place)+'</span><span>📅 '+esc(sample.detail)+'</span></div><small>Exclusivamente demonstração; não é evento ou vaga real.</small></section>'
+'<section class="panel panel-pad feature-form-panel"><div class="row between"><h3>'+(party?'Divulgar uma festa':'Divulgar uma oportunidade')+'</h3><span class="pill">Publicação direta</span></div><form data-feature-form="'+kind+'"><label class="label">Título</label><input class="field" required name="title" maxlength="110" placeholder="'+(party?'Encontro entre estudantes':'Vaga de estágio ou oportunidade')+'"><div class="feature-two"><div><label class="label">'+(party?'Dia e horário':'Modalidade e detalhes')+'</label><input class="field" required maxlength="80" name="when" placeholder="'+(party?'Ex.: 12/12, 19h':'Ex.: Horário flexível')+'"></div><div><label class="label">'+(party?'Local':'Organização / contato')+'</label><input class="field" required maxlength="95" name="place" placeholder="'+(party?'Cidade, espaço':'Empresa ou organização')+'"></div></div><label class="label">Descrição</label><textarea class="field field-area" name="body" required maxlength="2000" placeholder="Compartilhe o contexto, instruções e informações adicionais."></textarea><button class="btn" type="submit">Publicar no Feed</button></form><p class="file-hint">Anúncios públicos são visíveis imediatamente. Não publique dados privados ou oportunidades não verificadas.</p></section>'
+'<div class="feature-list-head"><h3>Publicações da comunidade</h3><span class="pill">'+list.length+' '+(party?'eventos':'oportunidades')+'</span></div>'
+(list.length?list.map(party?eventCard:p=>'<article class="panel panel-pad feature-post"><span class="pill">💼 Oportunidade</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.body)+'</p><small>Publicação aberta, sem filtros restritivos.</small></article>').join(''):'<div class="panel panel-pad"><p class="hint">Nenhum anúncio real nesta categoria. A demonstração acima não pode receber inscrições.</p></div>');
}
const getFocusInfo=()=>{
const h=focusHistory(),today=dateId();
const todayMin=h.filter(x=>x.date===today).reduce((a,b)=>a+b.minutes,0);
return {history:h,todayMin};
};
function focus(){
const prefs=focusPrefs(),s=focusSession(),active=s.mode==='focus',rest=s.mode==='break',waiting=s.mode==='waiting',done=s.mode==='finished',info=getFocusInfo(),pct=Math.min(100,Math.round(info.todayMin/prefs.goal*100));
return heading('AUTONOMIA E ROTINA','Modo foco','Defina o tempo de estudo, programe pausas e acompanhe a evolução de seus ciclos de concentração.')
+'<section class="panel panel-pad focus-dashboard"><div class="focus-icon">◉</div><div class="section-eyebrow">'+(active?'FOCO ATIVO':rest?'PAUSA AUTOMÁTICA':waiting?'AGUARDANDO PRÓXIMO FOCO':done?'SEQUÊNCIA FINALIZADA':'PRONTO PARA COMEÇAR')+'</div><h2>'+(active?'Seu tempo é prioridade':rest?'Descanse um pouco':waiting?'Pronto para o próximo bloco?':done?'Parabéns pela sequência!':'Vamos organizar sua rotina?')+'</h2><div class="focus-clock">'+(active||rest?fmtTime(s.ends-Date.now()):String(prefs.focus).padStart(2,'0')+':00')+'</div><p class="hint">Ciclo '+Math.min(s.cycle||1,prefs.cycles)+' de '+prefs.cycles+' · '+prefs.focus+' min de foco / '+prefs.rest+' min de pausa</p><div class="v14-controls">'+(active||rest?makeBtn('Encerrar ciclo','focus-stop','','line')+(rest?makeBtn('Iniciar foco agora','focus-next','','primary'):''):waiting?makeBtn('▶ Continuar sequência','focus-next','','primary'):makeBtn('▶ Começar uma sequência','focus-start','','primary'))+'</div></section>'
+'<section class="panel panel-pad v14-goal"><div class="row between"><strong>Meta de hoje</strong><strong>'+info.todayMin+' / '+prefs.goal+' min</strong></div><div class="v14-progress"><span style="width:'+pct+'%"></span></div><small>'+info.history.length+' blocos de foco concluídos neste navegador.</small></section>'
+'<section class="panel panel-pad feature-form-panel"><h3>Configurar o Pomodoro</h3><form data-feature-form="focus-settings"><div class="feature-three"><div><label class="label">Foco (min)</label><input class="field" type="number" name="focus" min="1" max="180" value="'+prefs.focus+'" required></div><div><label class="label">Pausa (min)</label><input class="field" type="number" name="rest" min="0" max="60" value="'+prefs.rest+'" required></div><div><label class="label">Ciclos</label><input class="field" type="number" name="cycles" min="1" max="12" value="'+prefs.cycles+'" required></div></div><div class="feature-two"><div><label class="label">Meta diária (min)</label><input class="field" type="number" name="goal" min="5" max="1440" value="'+prefs.goal+'" required></div><label class="v14-tick v14-auto"><input type="checkbox" name="auto" '+(prefs.auto?'checked':'')+'> Iniciar próximo foco automaticamente após a pausa</label></div><div class="focus-preset-row">'+makeBtn('25 / 5','focus-preset','25|5')+makeBtn('50 / 10','focus-preset','50|10')+makeBtn('15 / 3','focus-preset','15|3')+'</div><button class="btn" type="submit">Salvar configuração</button><button class="btn soft" type="button" data-feature-action="focus-notifications">Ativar avisos do navegador</button><p class="file-hint">O bloqueio desfoca apenas o UniSync, não outras abas ou aplicativos. É possível encerrar a qualquer momento. Alertas do navegador precisam de permissão explícita e não são garantidos com o site fechado.</p></form></section>'
+'<section class="panel panel-pad"><h3>Histórico recente</h3>'+(info.history.length?'<div class="v14-history">'+info.history.slice(-8).reverse().map(x=>'<div class="row between"><span>📚 '+esc(new Date(x.at).toLocaleDateString('pt-BR'))+'</span><strong>'+x.minutes+' min</strong></div>').join('')+'</div>':'<p class="hint">Conclua seu primeiro bloco de concentração para começar o histórico.</p>')+'</section>';
}
function gymsPage(){const n=(context().gymReviews||[]).length;return heading('SANTO ANDRÉ · SP','Academias da comunidade','Encontre academias, registre onde treina e ajude outros estudantes com avaliações compartilhadas.')+'<section class="panel panel-pad feature-gym-intro"><div class="row between"><strong>📍 Explorar Santo André</strong><span class="pill">'+n+' avaliações públicas</span></div><label class="label">Pesquisar academia ou bairro</label><input class="field" data-feature-search="gyms" placeholder="Centro, Jardim, Smart Fit..." value="'+esc(gymQuery)+'"><p class="file-hint">As avaliações são públicas para membros conectados. Nenhum dado sensível ou e-mail é compartilhado.</p></section><div id="gym-results">'+gymCards()+'</div>';}
function gymCards(){
const all=context().gymReviews||[],q=gymQuery.toLocaleLowerCase('pt-BR').trim(),myLocal=rd('unisync_gyms_v1_'+uid(),{});
return gyms.filter(g=>(g.name+' '+g.area+' '+g.address).toLocaleLowerCase('pt-BR').includes(q)).map(g=>{
const reviews=all.filter(r=>r.gymId===g.id),mine=reviews.find(r=>r.userId===uid()),local=myLocal[g.id]||{},avg=reviews.length?(reviews.reduce((a,b)=>a+b.rating,0)/reviews.length).toFixed(1):'—',mapUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(g.name+' '+g.address);
return '<article class="panel panel-pad gym-card"><div class="row between"><span class="gym-icon">🏋️</span><span class="pill">'+esc(g.area)+'</span></div><h3>'+esc(g.name)+'</h3><p class="hint">'+esc(g.address)+'</p><div class="v14-gym-summary"><strong>★ '+avg+'</strong><span>'+reviews.length+' avaliação(ões) públicas</span></div><div class="gym-actions">'+makeBtn(local.uses?'✓ Treino aqui':'Eu treino aqui','gym-uses',g.id,local.uses?'primary':'soft')+'<a class="btn sm line" target="_blank" rel="noopener noreferrer" href="'+mapUrl+'">Ver localização ↗</a></div><form data-feature-form="gym-review"><input type="hidden" name="gymId" value="'+esc(g.id)+'"><label class="label">Sua nota</label><select name="rating" class="field" required><option value="">Escolher nota</option>'+[1,2,3,4,5].map(x=>'<option value="'+x+'" '+(mine?.rating===x?'selected':'')+'>'+x+' estrela'+(x===1?'':'s')+'</option>').join('')+'</select><label class="label">Seu comentário público</label><textarea class="field" name="feedback" maxlength="400" minlength="5" required placeholder="O que os estudantes deveriam saber sobre esta academia?">'+esc(mine?.feedback||'')+'</textarea><div class="v14-controls"><button class="btn sm" type="submit">'+(mine?'Atualizar avaliação':'Publicar avaliação')+'</button>'+(mine?makeBtn('Excluir minha avaliação','gym-delete',g.id,'line'):'')+'</div></form><div class="v14-review-list">'+(reviews.length?reviews.slice(0,5).map(r=>'<div class="v14-review"><div class="row between"><strong>'+esc(profileName(r.userId))+'</strong><span>★ '+r.rating+'/5</span></div><p>'+esc(r.feedback)+'</p></div>').join(''):'<p class="hint">Ainda não há opiniões compartilhadas.</p>')+'</div>'+(local.feedback&&!mine?'<p class="file-hint">Você possui uma avaliação antiga salva apenas neste navegador. Para compartilhá-la, escreva sua opinião no campo acima.</p>':'')+'</article>';
}).join('')||'<div class="panel panel-pad">Não encontramos resultados para sua pesquisa.</div>';
}
function resetVaultIfChanged(){if(femaleOwner!==uid()){femaleOwner=uid();femalePass='';femaleRecords=null;}}
function female(){
resetVaultIfChanged();
if(!isFemale())return '<section class="panel panel-pad"><h2>Seção restrita por preferência de perfil</h2><p>Altere seu gênero para feminino em Editar perfil para visualizar esta seção. Isso é uma configuração de interface e não uma verificação de identidade.</p></section>';
const blob=rd(femKey(),null);
let tracker='';
if(!crypto?.subtle)tracker='<p>Este navegador não permite criptografia segura nesse contexto. O diário de saúde não está disponível.</p>';
else if(!femaleRecords)tracker='<div class="v14-lock"><span>🔒</span><h3>Diário privado protegido por senha</h3><p class="hint">Registros guardados apenas neste navegador, criptografados antes de serem salvos. A senha não é armazenada e não pode ser recuperada.</p><form data-feature-form="female-unlock"><label class="label">'+(blob?'Senha para abrir diário':'Criar senha do diário (mínimo 8 caracteres)')+'</label><input class="field" name="pass" type="password" autocomplete="off" minlength="8" required><button class="btn" type="submit">'+(blob?'Desbloquear diário':'Criar diário protegido')+'</button></form></div>';
else {
const records=femaleRecords.slice().sort((a,b)=>b.date.localeCompare(a.date));
let estimate='';
if(records.length>=2){const diffs=[];for(let i=0;i<records.length-1;i++){const delta=(new Date(records[i].date)-new Date(records[i+1].date))/86400000;if(delta>=15&&delta<=60)diffs.push(delta);}if(diffs.length){const cycle=Math.round(diffs.reduce((a,b)=>a+b,0)/diffs.length),d=new Date(records[0].date+'T12:00:00');d.setDate(d.getDate()+cycle);estimate='<p class="v14-cycle-hint">Intervalo médio observado: '+cycle+' dias · próximo período aproximado: '+d.toLocaleDateString('pt-BR')+'. <strong>Estimativa indicativa; não use para evitar gravidez.</strong></p>';}}
tracker='<div class="row between"><strong>Diário desbloqueado</strong>'+makeBtn('Bloquear agora','female-lock','','line')+'</div><form data-feature-form="female-record"><div class="feature-two"><div><label class="label">Início do período</label><input class="field" type="date" name="date" max="'+dateId()+'" required></div><div><label class="label">Duração (dias)</label><input class="field" type="number" name="duration" min="1" max="12" value="5" required></div></div><label class="label">Observação opcional</label><textarea class="field" name="note" maxlength="280" placeholder="Você pode registrar como se sentiu, se quiser."></textarea><button class="btn" type="submit">Adicionar período</button></form>'+estimate+'<h3>Seus registros</h3>'+(records.length?'<div class="v14-records">'+records.map(r=>'<div class="row between"><span>'+esc(new Date(r.date+'T12:00:00').toLocaleDateString('pt-BR'))+' · '+r.duration+' dias <small>'+esc(r.note||'')+'</small></span>'+makeBtn('Remover','female-delete',r.id,'line')+'</div>').join('')+'</div>':'<p class="hint">Seu histórico privado está vazio.</p>')+'<div class="v14-controls">'+makeBtn('Apagar todo o diário','female-wipe','','line')+'</div>';
}
return heading('BEM-ESTAR E INFORMAÇÃO','Saúde feminina','Recursos opcionais, informativos e privados para acompanhar seu bem-estar.')
+'<div class="female-grid"><article><span>🌷</span><h3>Ciclo e autocuidado</h3><p>O ciclo varia de pessoa para pessoa. Observe mudanças persistentes e procure orientação quando necessário.</p></article><article><span>🩺</span><h3>Prevenção</h3><p>A UBS pode ajudar com vacinação, exames de rastreamento e orientações adequadas à sua faixa etária.</p></article><article><span>💜</span><h3>Saúde emocional</h3><p>Sono, alimentação, movimento e apoio social fazem parte do cuidado.</p></article><article><span>📚</span><h3>Fonte confiável</h3><p><a href="https://www.gov.br/saude/pt-br" rel="noopener noreferrer" target="_blank">Ministério da Saúde ↗</a></p></article></div>'
+'<section class="panel panel-pad v14-female-vault"><div class="section-eyebrow">OPCIONAL · DADOS CRIPTOGRAFADOS</div><h2>Diário do ciclo</h2>'+tracker+'</section><p class="hint">Este recurso não é um serviço médico. Seus registros não são enviados ao Firebase. Em aparelhos compartilhados, mantenha sua senha privada. Limpar os dados do navegador pode apagar permanentemente o diário.</p>';
}
function renderPage(key){switch(key){case 'events':case 'jobs':return announcements(key);case 'gyms':return gymsPage();case 'female':return female();case 'focus':return focus();default:return '';}}
function saveHistory(minutes){const list=focusHistory();list.push({at:Date.now(),date:dateId(),minutes});wr(focusHistoryKey(),list.slice(-250));}
function transition(){
let s=focusSession(),p=focusPrefs(),now=Date.now(),changed=false,i=0;
while((s.mode==='focus'||s.mode==='break')&&s.ends<=now&&i++<24){
if(s.mode==='focus'){
saveHistory(p.focus);
s.completed=(s.completed||0)+1;
if(s.cycle>=p.cycles){s.mode='finished';s.ends=0;toast('Sequência completa! Você atingiu sua meta de ciclos.');notify('Sequência de foco finalizada');}
else if(p.rest>0){s.mode='break';s.ends+=p.rest*60000;toast('Foco concluído! Pausa liberada.');notify('Hora de descansar');}
else {s.cycle++;s.mode='focus';s.ends+=p.focus*60000;toast('Novo ciclo iniciado.');}
}else{
if(p.auto){s.cycle++;s.mode='focus';s.ends+=p.focus*60000;toast('Pausa finalizada! Próximo foco iniciado.');notify('Hora de voltar ao foco');}
else {s.mode='waiting';s.ends=0;toast('Pausa concluída. Continue a sequência quando quiser.');}
}
changed=true;
}
if(changed)wr(focusSessionKey(),s);
return {s,changed};
}
function notify(message){if(notificationOn&&typeof Notification!=='undefined'&&Notification.permission==='granted'){try{new Notification('UniSync · Modo Foco',{body:message});}catch{}}}
function sync(){
if(context().page!=='female'&&femalePass){femalePass='';femaleRecords=null;}
const {s,changed}=transition(),lock=s.mode==='focus';
document.body.classList.toggle('focus-locked',lock);
let overlay=document.getElementById('focus-overlay');
if(lock){
if(!overlay){overlay=document.createElement('div');overlay.id='focus-overlay';overlay.className='focus-overlay';document.body.append(overlay);}
overlay.innerHTML='<div class="focus-overlay-card"><div class="focus-overlay-dot">✦</div><div class="section-eyebrow">MODO FOCO · CICLO '+s.cycle+'/'+focusPrefs().cycles+'</div><h2>Você está em foco</h2><div class="focus-overlay-time" role="timer">'+fmtTime(s.ends-Date.now())+'</div><p>O UniSync está desfocado temporariamente. Desligue quando quiser.</p><button class="btn line" type="button" data-feature-action="focus-stop">Encerrar agora e liberar</button><small>Você mantém o controle do bloqueio.</small></div>';
}else if(overlay)overlay.remove();
const clock=root.querySelector('.focus-clock');
if(clock&&(s.mode==='focus'||s.mode==='break'))clock.textContent=fmtTime(s.ends-Date.now());
if(changed&&context().page==='focus')rerender();
}
function startFocus(){const p=focusPrefs();wr(focusSessionKey(),{mode:'focus',ends:Date.now()+p.focus*60000,cycle:1,completed:0,started:Date.now()});rerender();sync();}
function stopFocus(){wr(focusSessionKey(),{mode:'idle',ends:0,cycle:1,completed:0});sync();rerender();toast('Modo foco encerrado. Navegação liberada.');}
async function persistVault(){if(!femalePass||!Array.isArray(femaleRecords))throw Error('Desbloqueie o diário.');const old=rd(femKey(),null);wr(femKey(),await encryptData(femalePass,femaleRecords,old?from64(old.salt):null));}
async function rsvp(postId,choice,visible=null){
const mine=(context().rsvps||[]).find(r=>r.postId===postId&&r.userId===uid()),v=visible===null?Boolean(mine?.visible):Boolean(visible);
await mutate('rsvp',{postId,choice,visible:v});rerender();toast('Sua presença foi atualizada.');
}
root.addEventListener('input',e=>{if(e.target.dataset.featureSearch==='gyms'){gymQuery=e.target.value;const box=root.querySelector('#gym-results');if(box)box.innerHTML=gymCards();}});
root.addEventListener('change',async e=>{if(e.target.dataset.featureCheck!=='rsvp-visible')return;const id=e.target.dataset.id,mine=(context().rsvps||[]).find(r=>r.postId===id&&r.userId===uid());if(!mine){e.target.checked=false;toast('Primeiro confirme se pretende participar.','error');return;}try{await rsvp(id,mine.choice,e.target.checked);}catch(ex){toast(ex.message,'error');e.target.checked=!e.target.checked;}});
document.addEventListener('click',async e=>{
const el=e.target.closest('[data-feature-action]');if(!el)return;e.preventDefault();
const a=el.dataset.featureAction,id=el.dataset.id||'';
try {
if(a==='focus-start')return startFocus();
if(a==='focus-stop')return stopFocus();
if(a==='focus-next'){const p=focusPrefs(),s=focusSession();s.mode='focus';s.cycle=Math.min(p.cycles,(s.cycle||1)+1);s.ends=Date.now()+p.focus*60000;wr(focusSessionKey(),s);rerender();sync();return;}
if(a==='focus-preset'){const [focus,rest]=id.split('|').map(Number);wr(focusPrefKey(),{...focusPrefs(),focus,rest});rerender();toast('Padrão aplicado.');return;}
if(a==='focus-notifications'){if(typeof Notification==='undefined')throw Error('Navegador sem suporte a notificações.');const permission=await Notification.requestPermission();notificationOn=permission==='granted';toast(notificationOn?'Avisos ativados.':'Avisos não autorizados.');return;}
if(a==='gym-uses'){const data=rd('unisync_gyms_v1_'+uid(),{});data[id]={...(data[id]||{}),uses:!data[id]?.uses};wr('unisync_gyms_v1_'+uid(),data);rerender();toast(data[id].uses?'Academia marcada como frequentada.':'Marcação removida.');return;}
if(a==='gym-delete'){if(!confirm('Excluir sua avaliação pública desta academia?'))return;await mutate('gym-delete',{gymId:id});rerender();toast('Avaliação removida.');return;}
if(a==='rsvp'){const [postId,choice]=id.split('|');return await rsvp(postId,choice);}
if(a==='rsvp-remove'){await mutate('rsvp-delete',{postId:id});rerender();toast('Participação cancelada.');return;}
if(a==='female-lock'){femalePass='';femaleRecords=null;rerender();toast('Diário bloqueado.');return;}
if(a==='female-delete'){femaleRecords=femaleRecords.filter(r=>r.id!==id);await persistVault();rerender();return;}
if(a==='female-wipe'){if(!confirm('Excluir permanentemente todo o diário deste navegador? Esta ação não pode ser desfeita.'))return;localStorage.removeItem(femKey());femalePass='';femaleRecords=null;rerender();toast('Diário apagado deste navegador.');return;}
}catch(err){console.error(err);toast(err.message||'Não foi possível concluir.','error');}
});
root.addEventListener('submit',async e=>{
const form=e.target.closest('[data-feature-form]');if(!form)return;
e.preventDefault();const type=form.dataset.featureForm,fd=new FormData(form),str=name=>String(fd.get(name)||'').trim(),button=form.querySelector('[type="submit"]');if(button)button.disabled=true;
try{
if(type==='focus-settings'){
let focus=Number(str('focus')),rest=Number(str('rest')),cycles=Number(str('cycles')),goal=Number(str('goal'));
if(!Number.isInteger(focus)||focus<1||focus>180||!Number.isInteger(rest)||rest<0||rest>60||!Number.isInteger(cycles)||cycles<1||cycles>12||!Number.isInteger(goal)||goal<5||goal>1440)throw Error('Confira os limites de tempo e ciclos.');
wr(focusPrefKey(),{focus,rest,cycles,goal,auto:fd.has('auto')});rerender();toast('Configurações salvas.');return;
}
if(type==='gym-review'){
const gymId=str('gymId'),rating=Number(str('rating')),feedback=str('feedback');
if(!validGyms.has(gymId)||!Number.isInteger(rating)||rating<1||rating>5||feedback.length<5||feedback.length>400)throw Error('Informe nota de 1 a 5 e opinião de 5 a 400 caracteres.');
await mutate('gym-save',{gymId,rating,feedback});rerender();toast('Avaliação compartilhada com a comunidade.');return;
}
if(type==='female-unlock'){
resetVaultIfChanged();const pass=str('pass'),blob=rd(femKey(),null);if(pass.length<8)throw Error('A senha deve conter pelo menos 8 caracteres.');
let records=[];
if(blob){try{records=await decryptData(pass,blob);}catch{throw Error('Senha incorreta ou dados do diário inválidos.');}}
if(!Array.isArray(records))throw Error('Formato de diário inválido.');
femalePass=pass;femaleRecords=records;if(!blob)await persistVault();rerender();toast('Diário desbloqueado.');return;
}
if(type==='female-record'){
if(!femaleRecords)throw Error('Desbloqueie o diário primeiro.');
const date=str('date'),duration=Number(str('duration')),note=str('note');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>dateId()||!Number.isInteger(duration)||duration<1||duration>12)throw Error('Confira a data e a duração do período.');
femaleRecords.push({id:'period_'+Date.now()+'_'+Math.floor(Math.random()*1000),date,duration,note:note.slice(0,280)});await persistVault();rerender();toast('Período salvo de forma criptografada.');return;
}
if(type==='events'||type==='jobs'){
const title=str('title'),place=str('place'),when=str('when'),body=str('body');if(title.length<5||place.length<2||when.length<2||body.length<10)throw Error('Preencha todos os detalhes do anúncio.');
await saveAnnouncement({title:title.slice(0,110),body:(type==='events'?'🎉 Evento':'💼 Oportunidade')+'\n'+when.slice(0,80)+' · '+place.slice(0,95)+'\n\n'+body.slice(0,2000),tags:[type==='events'?'Eventos UniSync':'Vagas UniSync'],coverUrl:''});rerender();toast('Anúncio publicado diretamente no Feed.');return;
}
}catch(err){console.error(err);toast(err.message||'Não foi possível concluir.','error');}
finally{if(button&&button.isConnected)button.disabled=false;}
});
setInterval(sync,1000);
sync();
return {renderPage,shortcuts,isFemale,sync};
}
