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
let gymQuery='',femalePass='',femaleRecords=null,femaleOwner=null,notificationOn=false,femaleTab='home',calendarOffset=0;
const uid=()=>String(context().userId||'guest');
const focusPrefKey=()=> 'unisync_focus14_prefs_'+uid();
const focusSessionKey=()=> 'unisync_focus14_session_'+uid();
const focusHistoryKey=()=> 'unisync_focus14_history_'+uid();
const femKey=()=> 'unisync_female_encrypted14_'+uid();
const focusPrefs=()=>rd(focusPrefKey(),{focus:25,rest:5,cycles:4,auto:true,goal:60});
const focusSession=()=>rd(focusSessionKey(),{mode:'idle',ends:0,cycle:1,completed:0,started:0});
const focusHistory=()=>rd(focusHistoryKey(),[]);
const isFemale=()=>context().me?.gender==='female';
const shortcuts=()=>'<div class="feature-shortcuts">'+[['events','Festas','🎉'],['jobs','Estágios','💼'],['focus','Modo foco','⏱️'],['gyms','Academias','🏋️']].concat(isFemale()?[['female','UniSync Mulher','🌷']]:[]).map(([id,t,ico])=>'<button class="feature-shortcut" data-action="navigate" data-id="'+id+'"><span>'+ico+'</span><strong>'+t+'</strong><small>Abrir →</small></button>').join('')+'</div>';
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
const uwItems=[['cycle','Meu ciclo menstrual','calendar'],['health','Saúde e prevenção','heart'],['safety','Segurança da mulher','shield'],['wellness','Bem-estar mental','mind'],['support','Rede de apoio','pin'],['campaigns','Campanhas','flag']];
const uwPaths={calendar:'M4 6h16v15H4z M4 10h16 M8 3v6 M16 3v6 M8 14h2 M14 14h2 M8 18h2',heart:'M20.8 8.6c0 4.7-8.8 10-8.8 10S3.2 13.3 3.2 8.6C3.2 3.5 9 3 12 7c3-4 8.8-3.5 8.8 1.6z M6 11h3l2-3 2 6 2-3h3',shield:'M12 3 3.5 6v6c0 5 8.5 9 8.5 9s8.5-4 8.5-9V6z M8 12l3 3 5-6',mind:'M8 19v-3c-4-1-5-5-3-8 1-3 4-4 7-4s7 2 7 6c0 3-2 5-5 6v3 M9 9h.01 M15 9h.01 M9 13c2 1 4 1 6 0',pin:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',flag:'M4 12h4l11-5v12L8 14H4z M8 14l2 6 M21 10v6'};
const uwIcon=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+uwPaths[k]+'"/></svg>';
const uwArt=()=>'<svg class="uw-art" viewBox="0 0 140 130" aria-hidden="true"><circle cx="79" cy="63" r="56" fill="currentColor" opacity=".12"/><path d="M44 109c-9-14-10-36-5-56 6-25 30-35 52-25 20 10 23 29 20 48-2 13 9 22 10 33Z" fill="currentColor" opacity=".88"/><path d="M53 109c0-20 10-31 27-31s32 12 35 31v15H38Z" fill="currentColor" opacity=".55"/><path d="M59 56c4-18 19-26 35-14 10 7 9 27 3 36-6 9-22 11-30 1-5-6-9-15-8-23" fill="#f4c5b9"/><path d="M55 56c4-26 23-30 39-17l9 13c-13-3-19-9-23-15-5 12-13 16-25 19" fill="currentColor"/><path d="M68 63q3 4 7 0m13 0q4 4 7 0M77 73q5 4 10 0" fill="none" stroke="#583b50" stroke-width="1.6" stroke-linecap="round"/><path d="M79 114c-12-7-21-14-17-21 4-7 13-4 17 2 4-6 13-9 17-2 4 7-5 14-17 21Z" fill="#ef8fb5"/></svg>';
const selectFemale=id=>{femaleTab=['home',...uwItems.map(x=>x[0])].includes(id)?id:'home';if(femaleTab!=='cycle'){femalePass='';femaleRecords=null;}calendarOffset=0;};
const uwBtn=(id,label,ico,external)=>'<button type="button" class="uw-tile" '+(external?'data-action="female-open"':'data-feature-action="uw-tab"')+' data-id="'+id+'"><span class="uw-icon">'+uwIcon(ico)+'</span><strong>'+label+'</strong></button>';
const femaleHome=(external=true)=>'<section class="uw"><div class="uw-hero"><div><div class="section-eyebrow">SEU ESPAÇO DE CUIDADO</div><h1>UniSync <span>Mulher</span></h1><p>Cuidar de você também é conectar.</p></div>'+uwArt()+'</div><div class="uw-grid">'+uwItems.map(([id,label,ico])=>uwBtn(id,label,ico,external)).join('')+'</div><button class="uw-banner" '+(external?'data-action="female-open"':'data-feature-action="uw-tab"')+' data-id="campaigns"><span class="uw-icon">'+uwIcon('flag')+'</span><span><strong>Campanhas de cuidado</strong><small>Informação e prevenção o ano todo.</small></span><b>›</b></button></section>';
const femaleNav=()=>'<div class="uw-nav"><button type="button" class="btn sm soft" data-feature-action="uw-tab" data-id="home">← UniSync Mulher</button><button type="button" class="btn sm line" data-action="navigate" data-id="feed">Ir ao feed</button></div>';
const uwLink=(title,desc,url,ico)=>'<a class="uw-list" href="'+url+'" '+(url.startsWith('tel:')?'':'target="_blank" rel="noopener noreferrer"')+'><span class="uw-icon">'+uwIcon(ico)+'</span><span><strong>'+title+'</strong><small>'+desc+'</small></span><b aria-hidden="true">›</b></a>';
const uwMaps=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
function femalePage(){
 const item=uwItems.find(x=>x[0]===femaleTab);if(!item)return femaleHome(false);
 let title=item[1],intro='',body='';
 if(femaleTab==='health'){intro='Informação confiável para fazer escolhas de cuidado.';body='<div class="uw-feature"><h2>Vacinação contra HPV</h2><p>Confira as orientações de vacinação na rede de saúde.</p>'+uwLink('Ministério da Saúde','Informações oficiais','https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/h/hpv','shield')+'</div>'+uwLink('Saúde ginecológica','Orientação e acompanhamento','https://www.gov.br/saude/pt-br','heart')+uwLink('Métodos contraceptivos','Converse com a equipe de saúde','https://www.gov.br/saude/pt-br','calendar')+uwLink('Prevenção de ISTs','Informação e cuidados','https://www.gov.br/aids/pt-br','shield');}
 if(femaleTab==='safety'){intro='Você não está sozinha. Conheça seus direitos e canais de ajuda.';body=uwLink('Ligue 180','Orientação e denúncias de violência contra a mulher','tel:180','heart')+uwLink('190','Emergência policial · risco imediato','tel:190','shield')+uwLink('Direitos e canais de apoio','Ministério das Mulheres','https://www.gov.br/mulheres/pt-br','flag')+uwLink('Delegacias da Mulher','Pesquisar no mapa',uwMaps('Delegacia da Mulher'),'pin')+'<p class="hint">Se estiver em perigo imediato, procure um local seguro e acione a emergência quando puder fazê-lo com segurança.</p>';}
 if(femaleTab==='support'){intro='Encontre serviços de saúde e proteção próximos à sua região.';body='<div class="uw-feature"><h2>Explorar no mapa</h2><p>Abra uma busca de serviços reais no mapa. Confira endereço e horário antes de ir.</p></div>'+uwLink('Unidades Básicas de Saúde','Pesquisar UBS no mapa',uwMaps('Unidade Básica de Saúde perto de mim'),'pin')+uwLink('Centros de atendimento à mulher','Pesquisar no mapa',uwMaps('Centro de Referência da Mulher perto de mim'),'pin')+uwLink('CAPS','Pesquisar apoio em saúde mental',uwMaps('CAPS perto de mim'),'mind')+'<button class="uw-banner" data-action="navigate" data-id="rooms">Explorar comunidades <b>›</b></button><p class="hint">Nenhuma localização é coletada pelo UniSync neste recurso.</p>';}
 if(femaleTab==='wellness'){intro='Sua saúde mental também importa.';body='<div class="uw-feature"><h2>Um momento para você</h2><p>Respeite suas necessidades, faça pausas e procure apoio se precisar.</p></div>'+uwLink('CVV · 188','Apoio emocional gratuito','tel:188','heart')+uwLink('Saúde mental no SUS','Informações oficiais','https://www.gov.br/saude/pt-br','mind')+'<button class="uw-banner" data-action="navigate" data-id="focus">Experimentar modo foco <b>›</b></button><button class="uw-banner" data-action="navigate" data-id="rooms">Explorar comunidades <b>›</b></button>';}
 if(femaleTab==='campaigns'){intro='Prevenção, informação e conexão durante o ano.';body=uwLink('Outubro Rosa','Conscientização sobre câncer de mama · outubro','https://www.gov.br/inca/pt-br','heart')+uwLink('Março Lilás','Prevenção do câncer do colo do útero · março','https://www.gov.br/inca/pt-br','calendar')+uwLink('Agosto Lilás','Enfrentamento à violência contra a mulher · agosto','https://www.gov.br/mulheres/pt-br','shield')+'<button class="uw-banner" data-action="navigate" data-id="events">Consultar eventos da comunidade <b>›</b></button>';}
 return '<section class="uw">'+femaleNav()+'<div class="uw-hero uw-compact"><div><div class="section-eyebrow">UNISYNC MULHER</div><h1>'+title+'</h1><p>'+intro+'</p></div><span class="uw-icon uw-big">'+uwIcon(item[2])+'</span></div><div class="uw-stack">'+body+'</div></section>';
}
function calendarView(records){
 const now=new Date(),first=new Date(now.getFullYear(),now.getMonth()+calendarOffset,1,12),n=new Date(first.getFullYear(),first.getMonth()+1,0).getDate(),offset=first.getDay();
 const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const daynum=d=>Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
 const startNum=r=>daynum(new Date(r.date+'T12:00:00'));
 const symptoms=new Set(femaleRecords.filter(r=>r.kind==='symptom').map(r=>r.date));
 const starts=[...new Set(records.map(r=>r.date))].sort().reverse(),diffs=[];
 for(let j=1;j<starts.length;j++){let delta=daynum(new Date(starts[j-1]+'T12:00:00'))-daynum(new Date(starts[j]+'T12:00:00'));if(delta>=15&&delta<=60)diffs.push(delta);}
 const next=diffs.length?new Date(starts[0]+'T12:00:00'):null;if(next)next.setDate(next.getDate()+Math.round(diffs.reduce((x,y)=>x+y,0)/diffs.length));
 let days=['D','S','T','Q','Q','S','S'].map(x=>'<small>'+x+'</small>').join('')+'<span></span>'.repeat(offset);
 for(let d=1;d<=n;d++){const date=new Date(first.getFullYear(),first.getMonth(),d,12),k=key(date),v=daynum(date),period=records.some(r=>v>=startNum(r)&&v<startNum(r)+r.duration),pred=next&&k===key(next),sym=symptoms.has(k);days+='<span class="uw-day '+(period?'uw-period ':'')+(pred?'uw-estimate ':'')+(k===key(now)?'uw-today':'')+'" aria-label="'+k+(period?' período':'')+(pred?' estimativa':'')+(sym?' sintomas':'')+'">'+d+(sym?'<i></i>':'')+'</span>';}
 return '<div class="uw-cal"><div class="uw-cal-head">'+makeBtn('‹','uw-month','-1')+'<strong>'+first.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})+'</strong>'+makeBtn('›','uw-month','1')+'</div><div class="uw-calendar">'+days+'</div><div class="uw-legend"><span>● Período registrado</span><span>◌ Estimativa</span><span>• Sintomas</span></div><p class="hint">'+(next?'Próximo início estimado: '+next.toLocaleDateString('pt-BR')+'. Não é previsão confiável de fertilidade nem método contraceptivo.':'Registre pelo menos dois inícios para estimar o próximo período.')+'</p></div>';
}
function symptomView(){const list=femaleRecords.filter(r=>r.kind==='symptom').sort((a,b)=>b.date.localeCompare(a.date));return '<details class="uw-symptoms"><summary>Registrar sintomas ou bem-estar</summary><form data-feature-form="female-symptom"><label class="label">Data</label><input class="field" name="date" type="date" max="'+dateId()+'" required><label class="label">Como você se sentiu?</label><textarea class="field" name="note" maxlength="280" required></textarea><button class="btn" type="submit">Salvar registro privado</button></form>'+list.map(r=>'<div class="uw-list"><span><strong>'+esc(r.date)+'</strong><small>'+esc(r.note)+'</small></span>'+makeBtn('Remover','female-delete',r.id,'line')+'</div>').join('')+'</details>';}

function resetVaultIfChanged(){if(femaleOwner!==uid()){femaleOwner=uid();femalePass='';femaleRecords=null;}}
function female(){
resetVaultIfChanged();
if(!isFemale())return '<section class="panel panel-pad"><h2>Seção restrita por preferência de perfil</h2><p>Altere seu gênero para feminino em Editar perfil para visualizar esta seção. Isso é uma configuração de interface e não uma verificação de identidade.</p></section>';
const blob=rd(femKey(),null);
let tracker='';
if(!crypto?.subtle)tracker='<p>Este navegador não permite criptografia segura nesse contexto. O diário de saúde não está disponível.</p>';
else if(!femaleRecords)tracker='<div class="v14-lock"><span>🔒</span><h3>Diário privado protegido por senha</h3><p class="hint">Registros guardados apenas neste navegador, criptografados antes de serem salvos. A senha não é armazenada e não pode ser recuperada.</p><form data-feature-form="female-unlock"><label class="label">'+(blob?'Senha para abrir diário':'Criar senha do diário (mínimo 8 caracteres)')+'</label><input class="field" name="pass" type="password" autocomplete="off" minlength="8" required><button class="btn" type="submit">'+(blob?'Desbloquear diário':'Criar diário protegido')+'</button></form></div>';
else {
const records=femaleRecords.filter(r=>r.kind!=='symptom').slice().sort((a,b)=>b.date.localeCompare(a.date));
let estimate='';
if(records.length>=2){const diffs=[];for(let i=0;i<records.length-1;i++){const delta=(new Date(records[i].date)-new Date(records[i+1].date))/86400000;if(delta>=15&&delta<=60)diffs.push(delta);}if(diffs.length){const cycle=Math.round(diffs.reduce((a,b)=>a+b,0)/diffs.length),d=new Date(records[0].date+'T12:00:00');d.setDate(d.getDate()+cycle);estimate='<p class="v14-cycle-hint">Intervalo médio observado: '+cycle+' dias · próximo período aproximado: '+d.toLocaleDateString('pt-BR')+'. <strong>Estimativa indicativa; não use para evitar gravidez.</strong></p>';}}
tracker=calendarView(records)+symptomView()+'<div class="row between"><strong>Diário desbloqueado</strong>'+makeBtn('Bloquear agora','female-lock','','line')+'</div><form data-feature-form="female-record"><div class="feature-two"><div><label class="label">Início do período</label><input class="field" type="date" name="date" max="'+dateId()+'" required></div><div><label class="label">Duração (dias)</label><input class="field" type="number" name="duration" min="1" max="12" value="5" required></div></div><label class="label">Observação opcional</label><textarea class="field" name="note" maxlength="280" placeholder="Você pode registrar como se sentiu, se quiser."></textarea><button class="btn" type="submit">Adicionar período</button></form>'+estimate+'<h3>Seus registros</h3>'+(records.length?'<div class="v14-records">'+records.map(r=>'<div class="row between"><span>'+esc(new Date(r.date+'T12:00:00').toLocaleDateString('pt-BR'))+' · '+r.duration+' dias <small>'+esc(r.note||'')+'</small></span>'+makeBtn('Remover','female-delete',r.id,'line')+'</div>').join('')+'</div>':'<p class="hint">Seu histórico privado está vazio.</p>')+'<div class="v14-controls">'+makeBtn('Apagar todo o diário','female-wipe','','line')+'</div>';
}
return '<div class="uw">'+femaleNav()+'<section class="panel panel-pad v14-female-vault"><div class="section-eyebrow">OPCIONAL · DADOS CRIPTOGRAFADOS</div><h2>Meu ciclo menstrual</h2>'+tracker+'</section><p class="hint">Este recurso não é um serviço médico. Seus registros não são enviados ao Firebase. Em aparelhos compartilhados, mantenha sua senha privada. Limpar os dados do navegador pode apagar permanentemente o diário.</p></div>';
}

function renderPage(key){switch(key){case 'events':case 'jobs':return announcements(key);case 'gyms':return gymsPage();case 'female':return femaleTab==='cycle'?female():femalePage();case 'focus':return focus();default:return '';}}
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
if(a==='uw-tab'){selectFemale(id);rerender();return;}
if(a==='uw-month'){calendarOffset=Math.max(-120,Math.min(120,calendarOffset+Number(id)));rerender();return;}
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
if(type==='female-symptom'){if(!femaleRecords)throw Error('Desbloqueie o diário primeiro.');const date=str('date'),note=str('note');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>dateId()||!note||note.length>280)throw Error('Confira a data e a descrição.');femaleRecords.push({id:'symptom_'+crypto.randomUUID(),kind:'symptom',date,note});await persistVault();rerender();toast('Registro privado salvo.');return;}
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
return {renderPage,shortcuts,isFemale,sync,femaleHome,selectFemale};
}
