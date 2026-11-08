// UniSync 1.2 - Persistência. Demo isolada OU Firebase de desenvolvimento.
// Nunca use os dados de produção ao testar esta versão.
const KEY = 'unisync_v12_demo_state_v1';
const SESSION = 'unisync_v12_demo_user';
const now = Date.now();
const sample = () => ({
  profiles: [
    {id:'me',name:'Você',username:'seu.perfil',university:'UFABC',bio:'Conhecendo novas pessoas, ideias e comunidades pela universidade. ✨',avatarUrl:'',bannerUrl:'',tags:[{name:'Engenharia',color:'#6652d9'},{name:'Novas amizades',color:'#17a6a5'}]},
    {id:'lia',name:'Lia Martins',username:'lia.study',university:'UFABC',bio:'Entre café, códigos e boas conversas ☕',avatarUrl:'',bannerUrl:'',tags:[{name:'Tecnologia',color:'#6242d7'},{name:'Leitura',color:'#ed798f'}]},
    {id:'theo',name:'Theo Ribeiro',username:'theo.r',university:'USP',bio:'Fã de ciência, música e viagens.',avatarUrl:'',bannerUrl:'',tags:[{name:'Ciência',color:'#267ed7'}]},
    {id:'bruna',name:'Bruna Costa',username:'brunac',university:'Unifesp',bio:'Arte, comunicação e estudantes conectados!',avatarUrl:'',bannerUrl:'',tags:[{name:'Design',color:'#e78a3d'},{name:'Arte',color:'#d05ed9'}]}
  ],
  posts:[
    {id:'p1',authorId:'lia',title:'Como vocês organizam os estudos durante o quadrimestre?',body:'Entre projetos, provas e atividades, tenho experimentado o método Pomodoro e uma lista de prioridades. 📚\n\nQual estratégia funciona para vocês? Quero trocar ideias!',tags:['Estudos','Rotina'],coverUrl:'',createdAt:now-1000*60*47},
    {id:'p2',authorId:'theo',title:'Um espaço para trocar ideias sobre tecnologia 🚀',body:'Estou buscando pessoas para criar um pequeno grupo de estudos sobre programação e eletrônica. Se você também gosta de construir projetos, bora conversar!',tags:['Tecnologia','Projetos'],coverUrl:'',createdAt:now-1000*60*210},
    {id:'p3',authorId:'bruna',title:'Se apresentar também faz parte de fazer amigos',body:'Oi! Sou a Bruna e adoro conhecer projetos e histórias de outros estudantes. Conte algo que gosta de fazer fora da faculdade! 💜',tags:['Comunidade'],coverUrl:'',createdAt:now-1000*60*580}
  ],
  comments:[{id:'c1',postId:'p1',authorId:'theo',text:'Calendário visual e blocos curtos de foco ajudam bastante!',createdAt:now-1000*60*35}],
  likes:[{id:'p1_theo',postId:'p1',userId:'theo'},{id:'p1_bruna',postId:'p1',userId:'bruna'},{id:'p2_lia',postId:'p2',userId:'lia'}],
  rooms:[
    {id:'r1',name:'Café & Conversa',description:'Uma comunidade aberta para conhecer gente nova.',visibility:'public',kind:'group',ownerId:'lia',members:['lia','theo','bruna'],createdAt:now-1000*60*800},
    {id:'r2',name:'Projetos de Engenharia',description:'Espaço privado para trocar projetos e materiais.',visibility:'private',kind:'group',ownerId:'me',members:['me','theo'],createdAt:now-1000*60*600},
    {id:'r3',name:'Você e Lia',description:'',visibility:'direct',kind:'direct',ownerId:'me',members:['me','lia'],createdAt:now-1000*60*60}
  ],
  messages:[
    {id:'m1',roomId:'r1',authorId:'lia',text:'Sejam bem-vindos à comunidade! ✨',createdAt:now-1000*60*180},
    {id:'m2',roomId:'r2',authorId:'theo',text:'Podemos compartilhar nossos projetos por aqui.',createdAt:now-1000*60*120},
    {id:'m3',roomId:'r3',authorId:'lia',text:'Oi! Que bom encontrar você por aqui 👋',createdAt:now-1000*60*26}
  ]
});
const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now()+'_'+Math.random().toString(36).slice(2));
const clone = v => JSON.parse(JSON.stringify(v));
export async function createAdapter(onData,onAuth,onError){
  const config = window.UNISYNC_V12_FIREBASE_CONFIG;
  if (!config || !config.projectId) {
    let data;
    try { data = JSON.parse(localStorage.getItem(KEY)) || sample(); } catch { data = sample(); }
    let current = localStorage.getItem(SESSION) || 'me';
    const notify = () => { Object.keys(data).forEach(k=>onData(k,clone(data[k]))); onAuth({id:current,mode:'demo'}); };
    const save = () => { try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){onError('Armazenamento local cheio. Reduza o tamanho das imagens.');} notify(); };
    window.addEventListener('storage',e=>{if(e.key===KEY){try{data=JSON.parse(e.newValue)||sample();notify();}catch{}} if(e.key===SESSION){current=e.newValue||'me';notify();}});
    const api={mode:'demo',
      login:async()=>{},register:async()=>{},signInGoogle:async()=>{},logout:async()=>{},
      chooseDemoUser:async id=>{if(!data.profiles.some(x=>x.id===id))return;current=id;localStorage.setItem(SESSION,id);notify();},
      saveProfile:async updates=>{const i=data.profiles.findIndex(x=>x.id===current);if(i>=0){data.profiles[i]={...data.profiles[i],...updates};save();}},
      createPost:async x=>{data.posts.unshift({id:makeId(),authorId:current,...x,createdAt:Date.now()});save();},
      comment:async(postId,text)=>{data.comments.push({id:makeId(),postId,authorId:current,text,createdAt:Date.now()});save();},
      toggleLike:async postId=>{const id=postId+'_'+current; const i=data.likes.findIndex(x=>x.id===id);if(i>=0)data.likes.splice(i,1);else data.likes.push({id,postId,userId:current});save();},
      createRoom:async x=>{const id=makeId();data.rooms.push({id,...x,ownerId:current,members:[...new Set([current,...x.members])],createdAt:Date.now()});save();return id;},
      joinRoom:async id=>{const r=data.rooms.find(x=>x.id===id);if(!r||r.visibility!=='public')throw Error('Grupo não é público.');if(!r.members.includes(current))r.members.push(current);save();},
      addMember:async(id,uid)=>{const r=data.rooms.find(x=>x.id===id);if(!r||r.ownerId!==current||r.kind==='direct')throw Error('Somente o criador pode convidar participantes.');if(!r.members.includes(uid))r.members.push(uid);save();},
      startDirect:async uid=>{const ids=[current,uid].sort();let r=data.rooms.find(r=>r.kind==='direct'&&r.members.length===2&&ids.every(x=>r.members.includes(x)));if(!r){r={id:'dm_'+ids.join('_'),name:'Conversa privada',description:'',visibility:'direct',kind:'direct',ownerId:current,members:ids,createdAt:Date.now()};data.rooms.push(r);save();}return r.id;},
      sendMessage:async(roomId,text)=>{const r=data.rooms.find(x=>x.id===roomId);if(!r||!r.members.includes(current))throw Error('Entre no grupo antes de enviar mensagens.');data.messages.push({id:makeId(),roomId,authorId:current,text,createdAt:Date.now()});save();},
      watchMessages:()=>()=>{},
      uploadImage:async file=>resizeDataUrl(file),
      resetDemo:async()=>{data=sample();save();}
    };
    notify();return api;
  }
  const [{initializeApp},{getAuth,onAuthStateChanged,signInWithPopup,GoogleAuthProvider,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,signOut},{getFirestore,collection,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,onSnapshot,query,where,limit,serverTimestamp,arrayUnion},{getStorage,ref,uploadBytes,getDownloadURL}] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js')
  ]);
  const fb=initializeApp(config);const auth=getAuth(fb),db=getFirestore(fb),storage=getStorage(fb);
  const domains=['usp.br','unicamp.br','unesp.br','unifesp.br','ufscar.br','ufabc.edu.br','fatec.sp.gov.br','ifsp.edu.br','univesp.br'];
  const validEmail=email=>{const domain=String(email||'').toLowerCase().split('@')[1]||'';return domains.some(d=>domain===d||domain.endsWith('.'+d));};
  const col={profiles:'v12_profiles',posts:'v12_posts',comments:'v12_comments',likes:'v12_likes',rooms:'v12_rooms',messages:'v12_messages'};
  let user=null,unsubs=[],roomUnsub=()=>{},publicRooms=[],myRooms=[];
  const cleanup=()=>{unsubs.forEach(f=>f());unsubs=[];roomUnsub();roomUnsub=()=>{};};
  const listen=(name,q)=>unsubs.push(onSnapshot(q,s=>onData(name,s.docs.map(d=>({id:d.id,...d.data()}))),e=>onError('Erro de leitura em '+name+': '+e.message)));
  const notifyRooms=()=>onData('rooms',[...new Map([...publicRooms,...myRooms].map(r=>[r.id,r])).values()]);
  const roomListen=(q,which)=>unsubs.push(onSnapshot(q,s=>{const list=s.docs.map(d=>({id:d.id,...d.data()}));if(which==='public')publicRooms=list;else myRooms=list;notifyRooms();},e=>onError('Erro ao carregar grupos: '+e.message)));
  onAuthStateChanged(auth,async u=>{
    cleanup();user=null;
    if(!u||!u.emailVerified||!validEmail(u.email)){onAuth(null);return;}
    user=u;
    try{
      const p=doc(db,col.profiles,u.uid),existing=await getDoc(p);
      if(!existing.exists()){
        // Lê campos antigos apenas como origem para o NOVO perfil público; nunca edita users/{uid}.
        let legacy={};try{const old=await getDoc(doc(db,'users',u.uid));if(old.exists())legacy=old.data();}catch(e){console.warn('Perfil antigo indisponível',e);}
        await setDoc(p,{name:legacy.nome||u.displayName||u.email?.split('@')[0]||'Estudante',username:'aluno'+u.uid.slice(0,6),university:legacy.universidade||'Universidade',bio:'',avatarUrl:'',bannerUrl:'',tags:[],createdAt:serverTimestamp()});
      }
      if(user?.uid!==u.uid)return;
      onAuth({id:u.uid,mode:'firebase'});
      for (const name of ['profiles','posts','comments','likes']) listen(name,query(collection(db,col[name]),limit(300)));
      // Publicações antigas APROVADAS continuam visíveis no feed social em modo leitura.
      unsubs.push(onSnapshot(query(collection(db,'posts'),where('status','==','aprovado'),limit(150)),snap=>onData('legacyPosts',snap.docs.map(d=>{
        const o=d.data();return {id:'legacy_'+d.id,authorId:o.autorUid||'',legacy:true,legacyAuthorName:o.autorNome||'Estudante',legacyUni:o.autorUni||'',title:o.titulo||'Publicação',body:o.texto||'',tags:[o.cat||'Mural'],coverUrl:'',createdAt:o.data};
      })),e=>console.warn('Não foi possível mostrar o mural antigo nesta área',e)));
      roomListen(query(collection(db,col.rooms),where('visibility','==','public'),limit(100)),'public');
      roomListen(query(collection(db,col.rooms),where('members','array-contains',u.uid),limit(100)),'mine');
    }catch(e){onError('Erro na inicialização do Firebase: '+e.message);onAuth(null);}
  });
  const requireUser=()=>{if(!user)throw Error('Você precisa entrar na sua conta.');return user.uid;};
  return {mode:'firebase',
    login:async(e,p)=>{if(!validEmail(e))throw Error('Utilize seu e-mail institucional de uma universidade aceita.');await signInWithEmailAndPassword(auth,e,p);if(!auth.currentUser?.emailVerified){await signOut(auth);throw Error('Confirme seu e-mail antes de entrar.');}},
    register:async(e,p)=>{if(!validEmail(e))throw Error('Utilize seu e-mail institucional de uma universidade aceita.');const cred=await createUserWithEmailAndPassword(auth,e,p);await sendEmailVerification(cred.user);await signOut(auth);},
    signInGoogle:async()=>{const result=await signInWithPopup(auth,new GoogleAuthProvider());if(!validEmail(result.user.email)){await signOut(auth);throw Error('Utilize uma conta institucional de universidade aceita.');}},
    logout:async()=>signOut(auth),chooseDemoUser:async()=>{},resetDemo:async()=>{},
    saveProfile:async updates=>updateDoc(doc(db,col.profiles,requireUser()),updates),
    createPost:async x=>{await addDoc(collection(db,col.posts),{...x,authorId:requireUser(),createdAt:serverTimestamp()});},
    comment:async(postId,text)=>{await addDoc(collection(db,col.comments),{postId,text,authorId:requireUser(),createdAt:serverTimestamp()});},
    toggleLike:async postId=>{const uid=requireUser(),id=postId+'_'+uid,p=doc(db,col.likes,id);const snap=await getDoc(p);if(snap.exists())await deleteDoc(p);else await setDoc(p,{postId,userId:uid});},
    createRoom:async x=>{const uid=requireUser();const refRoom=await addDoc(collection(db,col.rooms),{...x,ownerId:uid,members:[...new Set([uid,...x.members])],createdAt:serverTimestamp()});return refRoom.id;},
    joinRoom:async id=>updateDoc(doc(db,col.rooms,id),{members:arrayUnion(requireUser())}),
    addMember:async(id,uid)=>updateDoc(doc(db,col.rooms,id),{members:arrayUnion(uid)}),
    startDirect:async uid=>{const mine=requireUser(),ids=[mine,uid].sort(),id='dm_'+ids.join('_'),r=doc(db,col.rooms,id);if([...publicRooms,...myRooms].some(x=>x.id===id))return id;await setDoc(r,{name:'Conversa privada',description:'',visibility:'direct',kind:'direct',ownerId:mine,members:ids,createdAt:serverTimestamp()});return id;},
    sendMessage:async(roomId,text)=>{await addDoc(collection(db,col.messages),{roomId,text,authorId:requireUser(),createdAt:serverTimestamp()});},
    watchMessages:id=>{roomUnsub();onData('messages',[]);if(!id){roomUnsub=()=>{};return;}roomUnsub=onSnapshot(query(collection(db,col.messages),where('roomId','==',id),limit(300)),s=>onData('messages',s.docs.map(d=>({id:d.id,...d.data()}))),e=>onError('Erro ao carregar mensagens: '+e.message));},
    uploadImage:async(file,kind)=>{const uid=requireUser();const blob=await compressImage(file,1500,.84);const path='v12/'+uid+'/'+kind+'/'+makeId()+'.jpg';const storageRef=ref(storage,path);await uploadBytes(storageRef,blob,{contentType:'image/jpeg'});return getDownloadURL(storageRef);}
  };
}
function compressImage(file,maxWidth=1500,quality=.8){
  if(!file.type.startsWith('image/'))throw Error('Selecione uma imagem válida.');
  if(file.size>6*1024*1024)throw Error('Imagem muito grande (máximo 6 MB).');
  return new Promise((resolve,reject)=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{const scale=Math.min(1,maxWidth/img.width),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);canvas.toBlob(b=>b?resolve(b):reject(Error('Não foi possível processar a imagem.')),'image/jpeg',quality);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Imagem inválida.'));};img.src=url;
  });
}
async function resizeDataUrl(file){
  const blob=await compressImage(file,750,.72);
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Falha ao ler a imagem.'));reader.readAsDataURL(blob);});
}
