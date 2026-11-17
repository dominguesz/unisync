/* UniSync - Recursos modulares, primeira versão. Nenhum dado de saúde é coletado. */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const minuteText = ms => { const s=Math.max(0,Math.ceil(ms/1000)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
const gyms=[
 {id:'smart-centro',name:'Smart Fit · Senador Flaquer',district:'Centro',address:'Rua Senador Fláquer, 380, Santo André, SP, Brasil',tag:'Musculação e cardio'},
 {id:'inova-jardim',name:'Inova · Bairro Jardim',district:'Jardim',address:'Rua das Figueiras, 1084, Santo André, SP, Brasil',tag:'Musculação e atividades'},
 {id:'bluefit-assuncao',name:'Bluefit · Fernando Prestes',district:'Vila Assunção',address:'Rua Cel. Fernando Prestes, 540, Santo André, SP, Brasil',tag:'Musculação e funcional'},
 {id:'gerson-doria',name:'Academia Gerson Doria',district:'Casa Branca',address:'Rua Alcídes de Queirós, 143, Santo André, SP, Brasil',tag:'Musculação e força'},
 {id:'panobianco-martim',name:'Panobianco · Martim Francisco',district:'Vila Alto de Santo André',address:'Av. Martim Francisco, 538, Santo André, SP, Brasil',tag:'Musculação e aulas'},
 {id:'smart-grand',name:'Smart Fit · Grand Plaza',district:'Jardim',address:'Av. Industrial, 700, Santo André, SP, Brasil',tag:'Musculação e cardio'}
];
export function createFeatures({root,context,saveAnnouncement,rerender,toast}) {
 const prefs=read('unisync_focus_settings_v1',{focus:25,break:5,cycles:4});
 let session=read('unisync_focus_session_v1',{mode:'idle',ends:0,completed:0});
 let gymSearch='';
 const gymKey=()=> 'unisync_gyms_v1_'+String(context().userId||'guest');
 const gymData=()=>read(gymKey(),{});
 const btn=(label,action,id,kind='soft')=>'<button class="btn sm '+kind+'" data-feature-action="'+action+'" data-id="'+esc(id||'')+'">'+label+'</button>';
 const title=(eyebrow,heading,lead)=>'<header class="feature-heading"><div class="section-eyebrow">'+eyebrow+'</div><h1>'+heading+'</h1><p class="hint">'+lead+'</p></header>';
 const isFemale=()=> context().me?.gender==='female';
 const sectionIcons={events:'🎉',jobs:'💼',focus:'⏱️',gyms:'🏋️',female:'🌸'};
 const shortcuts=()=>'<div class="feature-shortcuts">'+[['events','Festas'],['jobs','Estágios'],['focus','Modo foco'],['gyms','Academias']].concat(isFemale()?[['female','Saúde feminina']]:[]).map(([id,name])=>'<button class="feature-shortcut" data-action="navigate" data-id="'+id+'"><span>'+sectionIcons[id]+'</span><strong>'+name+'</strong><small>Abrir →</small></button>').join('')+'</div>';
 const postsFor=kind=>(context().posts||[]).filter(p=>(p.tags||[]).includes(kind==='events'?'Eventos UniSync':'Vagas UniSync') && (p.status==='aprovado'||!p.status||p.authorId===context().userId)).sort((a,b)=>{const t=v=>Number(v?.createdAt?.seconds||0)*1000||Number(v?.createdAt)||0;return t(b)-t(a);});
 function announcements(kind) {
   const party=kind==='events', label=party?'Festas e encontros':'Oportunidades de estágio', tag=party?'Eventos UniSync':'Vagas UniSync';
   const sample=party?{title:'Noite de Integração Universitária',desc:'Evento ilustrativo para mostrar como divulgar uma festa: música, encontro de estudantes e ingressos.',place:'Espaço Aurora (local fictício)',detail:'Data e horário a confirmar'}:{title:'Estágio em Engenharia · Empresa Exemplo',desc:'Vaga fictícia para exemplificar anúncios: apoio a projetos, análise de dados e aprendizado em equipe.',place:'Empresa Exemplo (fictícia)',detail:'Modelo híbrido · carga horária a confirmar'};
   const list=postsFor(kind);
   return title(party?'CONEXÕES E EVENTOS':'CARREIRA E OPORTUNIDADES',label,party?'Encontre atividades e compartilhe seus eventos com a comunidade.':'Divulgue oportunidades e acompanhe vagas publicadas por estudantes.')
   +'<section class="panel panel-pad feature-highlight"><div class="row between"><strong>✦ Exemplo de anúncio</strong><span class="pill">Fictício</span></div><h2>'+esc(sample.title)+'</h2><p>'+esc(sample.desc)+'</p><div class="feature-meta"><span>📍 '+esc(sample.place)+'</span><span>📅 '+esc(sample.detail)+'</span></div><small>Somente demonstração. Não é um evento ou vaga real.</small></section>'
   +'<section class="panel panel-pad feature-form-panel"><div class="row between"><h3>'+(party?'Divulgar uma festa':'Divulgar uma vaga')+'</h3><span class="pill">Publicação direta</span></div><form data-feature-form="'+kind+'"><label class="label">Título</label><input class="field" name="title" required maxlength="110" placeholder="'+(party?'Ex.: Encontro no campus':'Ex.: Estágio em automação')+'"><div class="feature-two"><div><label class="label">'+(party?'Data e horário':'Modalidade / carga horária')+'</label><input class="field" name="when" maxlength="80" required placeholder="'+(party?'Sábado, 19h':'Híbrido, 30h/semana')+'"></div><div><label class="label">'+(party?'Local':'Empresa / instituição')+'</label><input class="field" name="place" maxlength="95" required placeholder="'+(party?'Cidade, espaço':'Nome da empresa')+'"></div></div><label class="label">Descrição</label><textarea class="field field-area" name="body" required maxlength="2000" placeholder="Conte os detalhes, requisitos e orientações de contato."></textarea><button class="btn" type="submit">Publicar anúncio no Feed</button></form><p class="file-hint">Ao publicar, o anúncio aparece também no Feed, sem fila de aprovação. Verifique a veracidade dos dados antes de enviar.</p></section>'
   +'<div class="feature-list-head"><h3>Publicações da comunidade</h3><span class="pill">'+list.length+' anúncios</span></div>'
   +(list.length?list.map(p=>'<article class="panel panel-pad feature-post"><span class="pill">'+tag+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.body)+'</p><small>Compartilhado pela comunidade UniSync</small></article>').join(''):'<div class="panel panel-pad"><p class="hint">Ainda não há anúncios reais nesta categoria. Seja a primeira pessoa a divulgar.</p></div>');
 }
 function focus() {
   const active=session.mode==='focus'&&session.ends>Date.now(),brk=session.mode==='break'&&session.ends>Date.now();
   return title('TEMPO PARA VOCÊ','Modo foco','Organize blocos de concentração e pequenas pausas. Você decide quando começar e pode encerrar a qualquer momento.')
    +'<div class="panel panel-pad focus-dashboard"><div class="focus-icon">◎</div><h2>'+(active?'Sessão em andamento':brk?'Hora de descansar':'Preparado para se concentrar?')+'</h2><div class="focus-clock">'+(active||brk?minuteText(session.ends-Date.now()):String(prefs.focus).padStart(2,'0')+':00')+'</div><p class="hint">'+(active?'O aplicativo está temporariamente desfocado.':brk?'A navegação está liberada durante a pausa.':'A configuração padrão é 25 minutos de foco e 5 de descanso.')+'</p>'+(active||brk?btn('Encerrar sessão','focus-stop','','line'):'')+'</div>'
    +'<form class="panel panel-pad feature-form-panel" data-feature-form="focus-settings"><h3>Personalizar seu ciclo</h3><div class="feature-three"><div><label class="label">Foco (min)</label><input class="field" type="number" name="focus" min="1" max="180" value="'+prefs.focus+'" required></div><div><label class="label">Pausa (min)</label><input class="field" type="number" name="break" min="0" max="60" value="'+prefs.break+'" required></div><div><label class="label">Ciclos</label><input class="field" type="number" name="cycles" min="1" max="12" value="'+prefs.cycles+'" required></div></div><div class="focus-preset-row">'+btn('25 / 5','focus-preset','25|5')+btn('50 / 10','focus-preset','50|10')+btn('15 / 3','focus-preset','15|3')+'</div><div class="row feature-actions"><button class="btn" type="submit">Salvar configurações</button>'+(!active&&!brk?btn('▶ Iniciar foco','focus-start','','primary'):'')+'</div><p class="file-hint">O desfoque bloqueia os cliques na tela durante o foco, mas o botão “Encerrar agora” permanece disponível. Não impede o acesso a outros aplicativos ou abas.</p></form>'
    +'<section class="panel panel-pad"><h3>Seu ritmo</h3><p class="hint">Ciclos concluídos nesta sequência: '+Number(session.completed||0)+' de '+prefs.cycles+'. Após o tempo de foco, o bloqueio termina automaticamente e a pausa começa.</p></section>';
 }
 function gymsPage() {
   return title('SANTO ANDRÉ · SP','Academias perto de você','Explore academias da cidade, marque onde treina e compartilhe uma avaliação pessoal.')
    +'<section class="panel panel-pad feature-gym-intro"><div class="row between"><strong>📍 Catálogo inicial · Santo André</strong><span class="pill">'+gyms.length+' locais</span></div><label class="label" for="gym-search">Buscar por nome ou bairro</label><input class="field" id="gym-search" data-feature-search="gyms" placeholder="Centro, Jardim, Bluefit..." value="'+esc(gymSearch)+'"><p class="file-hint">Endereços referenciais; confirme funcionamento e planos antes de visitar. Avaliações e marcações ficam neste dispositivo por enquanto.</p></section>'
    +'<div id="gym-results">'+gymCards()+'</div>';
 }
 function gymCards(){
   const saved=gymData(),q=gymSearch.toLocaleLowerCase('pt-BR').trim();
   const items=gyms.filter(g=>(g.name+' '+g.district+' '+g.address).toLocaleLowerCase('pt-BR').includes(q));
   return items.map(g=>{const my=saved[g.id]||{},url='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(g.name+' '+g.address);return '<article class="panel panel-pad gym-card"><div class="row between"><div class="gym-icon">🏋️</div><span class="pill">'+esc(g.district)+'</span></div><h3>'+esc(g.name)+'</h3><p class="hint">'+esc(g.address)+'</p><small>'+esc(g.tag)+'</small><div class="gym-actions">'+btn(my.uses?'✓ Eu treino aqui':'Eu treino aqui','gym-uses',g.id,my.uses?'primary':'soft')+'<a class="btn sm line" href="'+url+'" target="_blank" rel="noopener noreferrer">Ver no mapa ↗</a></div><form data-feature-form="gym-review"><input type="hidden" name="gym" value="'+esc(g.id)+'"><label class="label">Sua nota</label><select class="field" name="rating"><option value="">Selecionar</option>'+[1,2,3,4,5].map(n=>'<option value="'+n+'" '+(Number(my.rating)===n?'selected':'')+'>'+n+' de 5 estrelas</option>').join('')+'</select><label class="label">Seu feedback</label><textarea class="field" name="feedback" maxlength="420" placeholder="Como foi sua experiência?">'+esc(my.feedback||'')+'</textarea><button type="submit" class="btn sm">Salvar avaliação</button></form>'+(my.feedback?'<div class="gym-feedback"><strong>Sua avaliação: '+Number(my.rating||0)+'/5</strong><p>'+esc(my.feedback)+'</p></div>':'')+'</article>';}).join('')||'<div class="panel panel-pad"><p>Nenhuma academia encontrada.</p></div>';
 }
 function female(){
   if(!isFemale())return '<section class="panel panel-pad"><h2>Área não disponível</h2><p>Esta seção aparece apenas quando o perfil pessoal está configurado como feminino. Altere essa opção em Editar perfil.</p></section>';
   return title('ESPAÇO DE CUIDADO','Saúde feminina','Informações gerais para apoiar o autocuidado, sem coleta de dados íntimos ou registros de saúde.')
     +'<section class="panel panel-pad"><div class="section-eyebrow">PRIMEIROS RECURSOS</div><div class="female-grid"><article><span>🌷</span><h3>Ciclo menstrual</h3><p>Conheça variações comuns do ciclo e os sinais que merecem avaliação profissional.</p></article><article><span>🩺</span><h3>Cuidados preventivos</h3><p>Converse com profissionais de saúde sobre exames, vacinação e acompanhamento indicado para você.</p></article><article><span>💜</span><h3>Bem-estar</h3><p>Descanso, movimento, saúde emocional e escolhas informadas fazem parte do cuidado.</p></article><article><span>🧭</span><h3>Onde buscar ajuda</h3><p>Procure a UBS de referência ou serviço de saúde da sua região em caso de dúvidas ou sintomas.</p></article></div></section><div class="panel panel-pad"><p class="hint">Esta é uma biblioteca informativa inicial, não um prontuário e não substitui orientação médica. A visibilidade por perfil é uma preferência de interface, não um controle de segurança para dados sensíveis.</p><a href="https://www.gov.br/saude/pt-br" class="btn sm soft" target="_blank" rel="noopener noreferrer">Ministério da Saúde ↗</a></div>';
 }
 function renderPage(key) {switch(key){case 'events':case 'jobs':return announcements(key);case 'focus':return focus();case 'gyms':return gymsPage();case 'female':return female();default:return '';}}
 function persistFocus(){store('unisync_focus_settings_v1',prefs);store('unisync_focus_session_v1',session);}
 function refreshOverlay(){
   const now=Date.now();let changed=false;
   if(session.mode!=='idle'&&session.ends<=now){
      if(session.mode==='focus'){session.completed=Number(session.completed||0)+1;session.mode=prefs.break>0?'break':'idle';session.ends=prefs.break>0?now+prefs.break*60000:0;toast(prefs.break>0?'Foco concluído! A pausa começou e a navegação está liberada.':'Foco concluído! Navegação liberada.');}
      else {session.mode='idle';session.ends=0;toast('Pausa concluída! Um novo ciclo pode começar.');}
      persistFocus();changed=true;
   }
   const locked=session.mode==='focus';
   document.body.classList.toggle('focus-locked',locked);
   let overlay=document.getElementById('focus-overlay');
   if(locked){
     if(!overlay){overlay=document.createElement('div');overlay.id='focus-overlay';overlay.className='focus-overlay';document.body.append(overlay);}
     overlay.innerHTML='<div class="focus-overlay-card"><div class="focus-overlay-dot">✦</div><div class="section-eyebrow">MODO FOCO ATIVADO</div><h2>É hora de se concentrar</h2><div class="focus-overlay-time" role="timer" aria-live="off">'+minuteText(session.ends-now)+'</div><p>Suas notificações e áreas do UniSync estão desfocadas até a sessão terminar.</p><button type="button" data-feature-action="focus-stop" class="btn line">Encerrar agora e liberar</button><small>Você está no controle. Pode finalizar quando quiser.</small></div>';
   }else if(overlay)overlay.remove();
   if(changed&&context().page==='focus')rerender();
   const time=document.querySelector('.focus-dashboard .focus-clock');
   if(time&&(session.mode==='focus'||session.mode==='break'))time.textContent=minuteText(session.ends-Date.now());
 }
 function startFocus(){
   if(session.mode==='focus')return;
   session={mode:'focus',ends:Date.now()+prefs.focus*60000,completed:Number(session.completed||0)};
   persistFocus();rerender();refreshOverlay();
 }
 function stopFocus(){session={mode:'idle',ends:0,completed:Number(session.completed||0)};persistFocus();refreshOverlay();rerender();toast('Sessão encerrada. Você pode usar o UniSync normalmente.');}
 document.addEventListener('click',e=>{
    const el=e.target.closest('[data-feature-action]');if(!el)return;
    e.preventDefault();const action=el.dataset.featureAction,id=el.dataset.id;
    if(action==='focus-start')return startFocus();
    if(action==='focus-stop')return stopFocus();
    if(action==='focus-preset'){const [f,b]=id.split('|').map(Number);prefs.focus=f;prefs.break=b;persistFocus();rerender();toast('Padrão de tempo aplicado.');return;}
    if(action==='gym-uses'){
       const saved=gymData();saved[id]={...(saved[id]||{}),uses:!(saved[id]?.uses)};store(gymKey(),saved);rerender();toast(saved[id].uses?'Academia marcada como sua.':'Marcação removida.');return;
    }
 });
 root.addEventListener('input',e=>{
    if(e.target.dataset.featureSearch!=='gyms')return;
    gymSearch=e.target.value;const target=root.querySelector('#gym-results');if(target)target.innerHTML=gymCards();
 });
 root.addEventListener('submit',async e=>{
    const form=e.target.closest('[data-feature-form]');if(!form)return;
    e.preventDefault();const type=form.dataset.featureForm,fd=new FormData(form),str=n=>String(fd.get(n)||'').trim();
    const submit=form.querySelector('[type="submit"]');if(submit)submit.disabled=true;
    try{
      if(type==='focus-settings'){
        const f=Number(str('focus')),b=Number(str('break')),c=Number(str('cycles'));
        if(!Number.isInteger(f)||f<1||f>180||!Number.isInteger(b)||b<0||b>60||!Number.isInteger(c)||c<1||c>12)throw Error('Confira os minutos e o total de ciclos.');
        prefs.focus=f;prefs.break=b;prefs.cycles=c;persistFocus();rerender();toast('Configurações de foco salvas.');return;
      }
      if(type==='gym-review'){
        const id=str('gym'),rating=Number(str('rating')),feedback=str('feedback');
        if(!gyms.some(g=>g.id===id)||!Number.isInteger(rating)||rating<1||rating>5)throw Error('Escolha uma nota de 1 a 5.');
        if(feedback.length<5)throw Error('Escreva pelo menos 5 caracteres.');
        const data=gymData();data[id]={...(data[id]||{}),rating,feedback:feedback.slice(0,420)};store(gymKey(),data);rerender();toast('Avaliação salva neste dispositivo.');return;
      }
      if(type==='events'||type==='jobs'){
        const name=str('title'),when=str('when'),place=str('place'),body=str('body');
        if(name.length<5||when.length<2||place.length<2||body.length<10)throw Error('Preencha o título, os detalhes e a descrição.');
        const tag=type==='events'?'Eventos UniSync':'Vagas UniSync';
        await saveAnnouncement({title:name.slice(0,110),body:(type==='events'?'🎉 Evento':'💼 Estágio')+'\n'+when.slice(0,80)+' · '+place.slice(0,95)+'\n\n'+body.slice(0,2000),tags:[tag],coverUrl:''});
        rerender();toast('Anúncio publicado no Feed, sem aprovação prévia.');return;
      }
    }catch(err){toast(err.message||'Não foi possível salvar.', 'error');}
    finally {if(submit&&submit.isConnected)submit.disabled=false;}
 });
 setInterval(refreshOverlay,1000);
 refreshOverlay();
 return {renderPage,shortcuts,isFemale,sync:refreshOverlay};
}
