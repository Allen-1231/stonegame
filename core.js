const $=id=>document.getElementById(id);
let cur='home',live=[];try{cur=location.hash.slice(1)||'home'}catch(e){}
function go(p){cur=p;try{location.hash='#'+p}catch(e){}route()}
function lk(p,a,...k){return h('a',{...a,href:'#'+p,onclick:e=>{e.preventDefault();go(p)}},...k)}
function h(t,a={},...k){const e=document.createElement(t);for(const x in a){if(x==='class')e.className=a[x];else if(x.startsWith('on'))e[x]=a[x];else e.setAttribute(x,a[x])}k.flat().forEach(c=>e.append(c instanceof Node?c:String(c)));return e}

/* ===== 遊戲註冊表：新增遊戲只要在這裡加一筆 ===== */
const GAMES=[
 {id:'archer',stone:'力量',c:'#a24bff',name:'寶石弓手',desc:'弓箭傳說式闖關：邊走邊躲、停下自動射擊，升級從三個技能中選一個。共 25 關，每 5 關一位魔王，途中還有中衛兵。',ready:true,mount:mountArcher},
 {id:'tunnel',stone:'空間',c:'#2f7bff',name:'螺旋隧道',desc:'在太空中的螺旋隧道裡高速飛行，換線閃開障礙，撿起六種寶石，每一種都有自己的能力。',ready:true,mount:mountTunnel},
 {id:'shooter',stone:'現實',c:'#ff3b3b',name:'寶石機鬥',desc:'駕駛你的戰機，闖過六位寶石守衛，取得寶石、解鎖專屬武器，最後直面瘋狂泰坦薩諾斯。',ready:true,mount:mountShooter},
 {id:'soul',stone:'靈魂',c:'#ff9a1f',name:'靈魂戰場',desc:'3D 鍵盤加滑鼠戰鬥：WASD 移動、滑鼠瞄準射擊，右鍵靈魂爆發、空白鍵衝刺。無限波次，每 5 波一位守魂魔王，升級時選強化。',ready:true,mount:mountSoulArena},
 {id:'typing',stone:'時間',c:'#2fe07a',name:'打字遊戲',desc:'仿 ZType 的打字空戰：敵艦帶著英文單字逼近，打完單字就能擊落。六種無限寶石艦各有特色，每 5 波薩諾斯降臨。',ready:true,mount:mountTyping},
 {id:'vault',stone:'心靈',c:'#ffd52e',name:'心靈密碼',desc:'只有一關的多層密室：由外而內破解六層寶石封印，每層都是不同的謎題，並留下通往最終密碼的線索。進度會自動保存，用時與提示越少分數越高。',ready:true,mount:mountVault}
];

/* ===== 共用音效引擎（Web Audio 合成，不需要音檔）：音效、背景音樂、靜音鈕 ===== */
const GA=(()=>{
  let ac=null,mg=null,nb=null,mu=false,vol=.7,mus=null;
  try{mu=localStorage.getItem('bi_mute')==='1'}catch(e){}
  const mtof=n=>440*Math.pow(2,(n-69)/12);
  function ctx(){
    if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)();const cp=ac.createDynamicsCompressor();mg=ac.createGain();mg.gain.value=mu?0:vol;mg.connect(cp);cp.connect(ac.destination);
      nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}catch(e){ac=null}}
    if(ac&&ac.state==='suspended'){try{ac.resume()}catch(e){}}
    return ac;
  }
  function tone(f,d,type,v,sl,t0,bus){
    const c=ctx();if(!c||mu)return;const t=c.currentTime+(t0||0),o=c.createOscillator(),g=c.createGain();
    o.type=type||'square';o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*sl),t+d);
    g.gain.setValueAtTime(v==null?.2:v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(bus||mg);o.start(t);o.stop(t+d+.03);
  }
  function noise(d,v,fr,t0,hp){
    const c=ctx();if(!c||mu)return;const t=c.currentTime+(t0||0),s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    s.buffer=nb;s.loop=true;f.type=hp?'highpass':'lowpass';f.frequency.setValueAtTime(fr||2000,t);if(!hp)f.frequency.exponentialRampToValueAtTime(Math.max(80,(fr||2000)*.2),t+d);
    g.gain.setValueAtTime(v==null?.2:v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(mg);s.start(t);s.stop(t+d+.03);
  }
  const last={};
  const gate=(k,ms)=>{const n=Date.now();if(last[k]&&n-last[k]<ms)return false;last[k]=n;return true};
  function setMute(m){mu=m;try{localStorage.setItem('bi_mute',m?'1':'0')}catch(e){}if(mg)mg.gain.value=m?0:vol;if(m)stopMusic()}
  /* —— 背景音樂：簡單的步進編曲器（低音＋琶音＋鼓） —— */
  const TRACKS={
    typing:{bpm:92,root:57,bass:[0,0,7,0,5,5,3,3],lead:[12,0,15,0,19,0,15,0,12,0,15,0,22,0,19,0],lt:'triangle',lv:.06,kick:1,hat:0},
    gold:{bpm:158,root:57,bass:[0,0,0,0,5,5,7,7],lead:[12,12,15,12,19,15,19,22,24,22,19,15,19,15,12,15],lt:'sawtooth',lv:.055,kick:1,hat:1},
    tunnel:{bpm:122,root:55,bass:[0,0,-2,-2,-4,-4,-5,-5],lead:[12,0,15,19,0,15,22,0,12,0,15,19,0,17,15,0],lt:'triangle',lv:.07,kick:1,hat:1},
    boss:{bpm:150,root:50,bass:[0,0,0,3,0,0,5,6],lead:[12,12,15,12,17,15,12,10,12,12,15,12,19,17,15,13],lt:'sawtooth',lv:.04,kick:1,hat:1},
    soul:{bpm:132,root:52,bass:[0,0,3,3,-2,-2,5,3],lead:[12,0,12,15,0,19,15,0,12,0,17,15,0,12,10,0],lt:'sawtooth',lv:.045,kick:1,hat:1},
    mind:{bpm:84,root:57,bass:[0,0,-3,-3,-5,-5,-7,-7],lead:[12,0,0,15,0,0,19,0,17,0,0,15,0,0,12,0],lt:'sine',lv:.08,kick:0,hat:0},
    archer:{bpm:112,root:52,bass:[0,0,5,5,3,3,7,7],lead:[12,0,15,0,19,0,15,0,12,0,14,0,17,0,14,0],lt:'triangle',lv:.07,kick:1,hat:0}
  };
  function stopMusic(){if(mus){clearInterval(mus.iv);mus=null}}
  function music(name,alive){
    stopMusic();const T=TRACKS[name];if(!T)return;
    mus={name,step:0,next:0,iv:0};
    const m=mus,sd=60/T.bpm/4;
    m.iv=setInterval(()=>{
      if((alive&&!alive())||mus!==m){if(mus===m)stopMusic();return}
      const c=ctx();if(!c||mu)return;if(!m.next)m.next=c.currentTime+.05;
      while(m.next<c.currentTime+.18){
        const i=m.step,t=m.next-c.currentTime,bar=Math.floor(i/16),bn=T.bass[bar%T.bass.length];
        if(i%4===0)tone(mtof(T.root+bn-12),sd*3.6,'triangle',.11,0,t);
        const ln=T.lead[i%16];if(ln)tone(mtof(T.root+bn+ln),sd*1.7,T.lt,T.lv,0,t);
        if(T.kick&&i%8===0)tone(130,.12,'sine',.22,.3,t);
        if(T.hat&&i%2===1)noise(.03,.025,7000,t,true);
        m.step++;m.next+=sd;
      }
    },40);
  }
  /* 靜音鈕（喇叭圖示） */
  const SPK='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/>';
  const ON=SPK+'<path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18.3 6.5a8.2 8.2 0 0 1 0 11"/></svg>',OFF=SPK+'<path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  function muteBtn(){
    const b=document.createElement('button');b.type='button';b.className='mutebtn';b.setAttribute('aria-label','音效開關');
    const up=()=>{b.innerHTML=mu?OFF:ON};up();
    b.onclick=()=>{ctx();setMute(!mu);up();b.blur()};return b;
  }
  return{ctx,tone,noise,gate,music,stopMusic,muteBtn,setMute,mtof,get muted(){return mu}};
})();

/* ===== 本機成績：存在這台裝置的瀏覽器（localStorage），不需要伺服器 ===== */
const KEY='arcade_scores_v1';
let store={};
try{store=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){store={}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
function paintWho(){}
async function submitScore(g,score){
  if(!(score>0))return 'keep';
  const list=store[g]||[],rec={score,t:Date.now()};
  list.push(rec);list.sort((x,y)=>y.score-x.score||x.t-y.t);store[g]=list.slice(0,10);persist();
  return store[g].includes(rec)?'ok':'keep';
}
async function topScores(g){
  return (store[g]||[]).map(r=>({score:r.score,name:new Date(r.t).toLocaleString('zh-TW',{hour12:false}),me:false}));
}
function clearScores(){if(confirm('確定要清除這台裝置上的所有成績嗎？')){store={};persist();route()}}
function initServices(){}

/* ===== 頁面 ===== */
const NAV=[['home','首頁'],['games','遊戲'],['board','排行榜']];
function paintNav(p){const n=$('nav');n.textContent='';NAV.forEach(([k,t])=>n.append(lk(k,{class:p===k?'on':''},t)))}
function gameCard(g){return h('div',{class:'card'},h('h3',{},g.stone+'・'+g.name),g.ready?'':h('span',{class:'tag'},'即將推出'),h('p',{},g.desc),
  lk('game/'+g.id,{class:'btn'+(g.ready?'':' off')},g.ready?'開始遊戲':'敬請期待'))}
function pageHome(a){a.append(h('h1',{class:'sr'},'Beyond Infinity'),h('div',{class:'stones'},GAMES.map(stoneCard)))}
function pageGames(a){a.append(h('h1',{},'遊戲'),h('div',{class:'grid'},GAMES.map(gameCard)))}
function pageBoard(a,gid){
  gid=GAMES.some(g=>g.id===gid)?gid:GAMES[0].id;
  a.append(h('h1',{},'排行榜'),h('p',{class:'mut'},'成績只存在這台裝置的瀏覽器裡，換裝置或清除瀏覽資料就會消失。'),h('div',{class:'tabs'},GAMES.filter(g=>g.ready).map(g=>lk('board/'+g.id,{class:'btn',style:g.id===gid?'':'background:transparent'},g.name))));
  const box=h('div');a.append(box);
  topScores(gid).then(r=>{
    if(!r.length){box.append(h('p',{class:'mut'},'目前還沒有紀錄。'));return}
    box.after(h('button',{class:'btn',style:'margin-top:14px;background:transparent',onclick:clearScores},'清除成績'));
    box.append(h('table',{},h('tr',{},h('th',{},'名次'),h('th',{},'時間'),h('th',{},'最高分')),
      r.map((x,i)=>h('tr',{class:x.me?'me':''},h('td',{},i+1),h('td',{},x.name),h('td',{},x.score)))));
  }).catch(()=>box.append(h('p',{class:'mut'},'排行榜暫時無法讀取')));
}
function pageGame(a,gid){
  const g=GAMES.find(x=>x.id===gid);
  if(!g){a.append(h('h1',{},'找不到遊戲'),lk('home',{class:'btn'},'回首頁'));return}
  if(!g.ready){a.append(h('h1',{style:'background:none;color:'+g.c+';-webkit-text-fill-color:'+g.c},g.stone+'・'+g.name),h('p',{class:'mut'},g.desc),h('div',{class:'note'},'這款遊戲還在開發中，敬請期待。'),lk('home',{class:'btn'},'回首頁'));return}
  a.classList.add('play');const res=h('div',{class:'note',hidden:''});
  a.append(h('h1',{},g.name),h('p',{class:'mut'},g.desc));
  const stage=h('div',{class:'stg'});
  const fsb=h('button',{class:'btn fsbtn',type:'button'},'⛶ 全螢幕');
  const fsOn=()=>stage.classList.contains('fs');
  function fsSet(on){
    stage.classList.toggle('fs',on);document.documentElement.classList.toggle('fsl',on);fsb.textContent=on?'退出全螢幕':'⛶ 全螢幕';
    if(on){try{const q=stage.requestFullscreen||stage.webkitRequestFullscreen;if(q){const pr=q.call(stage);if(pr&&pr.catch)pr.catch(()=>{})}}catch(e){}}
    else if(document.fullscreenElement){try{document.exitFullscreen()}catch(e){}}
    setTimeout(()=>dispatchEvent(new Event('resize')),60);
  }
  fsb.onclick=()=>{fsSet(!fsOn());fsb.blur()};
  const fsKey=e=>{if(!stage.isConnected){removeEventListener('keydown',fsKey);document.removeEventListener('fullscreenchange',fsCh);document.documentElement.classList.remove('fsl');return}if(e.key==='Escape'&&fsOn()&&!document.fullscreenElement)fsSet(false)};
  const fsCh=()=>{if(!document.fullscreenElement&&fsOn())fsSet(false)};
  addEventListener('keydown',fsKey);document.addEventListener('fullscreenchange',fsCh);
  a.append(fsb,stage,res);
  g.mount(stage,async score=>{
    const r=await submitScore(g.id,score);
    res.hidden=false;res.textContent=`本場得分 ${score}。`+({ok:'已記錄到排行榜！',keep:'沒有進入前 10 名。'}[r]);
    res.append(' ',lk('board/'+g.id,{style:'color:var(--ac)'},'查看排行榜'));
  });
}
/* ===== 3D 水晶寶石：歪斜的菱形三十面體，自轉、折射、反光 ===== */
function shade(h,f){f=Math.max(-.92,Math.min(.92,f));const n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,t=f<0?0:255,k=Math.abs(f),m=v=>Math.round(v+(t-v)*k);return`rgb(${m(r)},${m(g)},${m(b)})`}
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* 菱形三十面體：12 個五向頂點（正二十面體頂點）+ 20 個三向頂點（二十面體面中心），30 個菱形面 */
const TOPO=(()=>{
  const p=(1+Math.sqrt(5))/2,nm=v=>{const l=Math.hypot(v[0],v[1],v[2]);return[v[0]/l,v[1]/l,v[2]/l]};
  const I=[];for(const a of[-1,1])for(const b of[-1,1])I.push(nm([0,a,b*p]),nm([a,b*p,0]),nm([b*p,0,a]));
  const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  let md=9;for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)md=Math.min(md,d(I[i],I[j]));
  const adj=(i,j)=>Math.abs(d(I[i],I[j])-md)<1e-6;
  const F=[];for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)if(adj(i,j))for(let k=j+1;k<12;k++)if(adj(i,k)&&adj(j,k))F.push([i,j,k]);
  const D=F.map(f=>nm([0,1,2].map(c=>I[f[0]][c]+I[f[1]][c]+I[f[2]][c])));
  const Q=[];
  for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)if(adj(i,j)){
    const fs=[];F.forEach((f,k)=>{if(f.includes(i)&&f.includes(j))fs.push(k)});
    Q.push([i,12+fs[0],j,12+fs[1]]);
  }
  const e=Q[0],M=nm([0,1,2].map(c=>I[e[0]][c]+I[e[2]][c])),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const r2=dot(I[e[0]],M)/dot(D[e[1]-12],M);
  return{V:I.concat(D.map(v=>v.map(x=>x*r2))),Q};
})();
/* 每顆寶石用不同種子把頂點推歪、再做不等比縮放與剪切，所以每顆都是歪歪的三十面體 */
function makeGem(seed){
  const r=rng(seed*7919+13),sc=[.86+r()*.3,.92+r()*.26,.86+r()*.3],sh=[(r()-.5)*.4,(r()-.5)*.3];
  let V=TOPO.V.map(v=>{
    const q=v.map(x=>x+(r()-.5)*.17),k=.92+r()*.16;
    let x=q[0]*k,y=q[1]*k,z=q[2]*k;x+=sh[0]*y;z+=sh[1]*y;
    return[x*sc[0],y*sc[1],z*sc[2]];
  });
  const mx=Math.max(...V.map(v=>Math.hypot(v[0],v[1],v[2])));V=V.map(v=>v.map(x=>x*1.15/mx));
  const faces=TOPO.Q.map((q,i)=>{
    let n=[0,0,0],c=[0,0,0];
    for(let k=0;k<4;k++){const a=V[q[k]],b=V[q[(k+1)%4]];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);c=c.map((x,j)=>x+a[j]/4)}
    const l=Math.hypot(n[0],n[1],n[2])||1;n=n.map(x=>x/l);
    if(n[0]*c[0]+n[1]*c[1]+n[2]*c[2]<0)n=n.map(x=>-x);
    return{q,n,v:((i*37)%11)/11-.5};
  });
  return{V,faces};
}
function renderGem(c,W,H,gem,col,t,an,seed){
  c.clearRect(0,0,W,H);
  const s=Math.min(W,H)*GEMK,cx=W/2,cy=H/2+Math.sin(t*1.6+seed)*H*.014;
  const tl=.45+.12*Math.sin(t*.6+seed),ca=Math.cos(an),sa=Math.sin(an),ct=Math.cos(tl),st=Math.sin(tl);
  const R=p=>{const x=p[0]*ca+p[2]*sa,z=-p[0]*sa+p[2]*ca;return[x,p[1]*ct-z*st,p[1]*st+z*ct]};
  const P=p=>{const f=4/(4-p[2]);return[cx+p[0]*s*f,cy-p[1]*s*f]};
  const RV=gem.V.map(R),PV=RV.map(P);
  const L=[-.45,.75,.5],ll=Math.hypot(L[0],L[1],L[2]),Hf=[L[0]/ll,L[1]/ll,L[2]/ll+1],hl=Math.hypot(Hf[0],Hf[1],Hf[2]);
  const fs=gem.faces.map(f=>({q:f.q,v:f.v,n:R(f.n),z:f.q.reduce((a,i)=>a+RV[i][2],0)/4})).sort((a,b)=>a.z-b.z);
  c.lineJoin='round';
  const pass=front=>fs.forEach(f=>{
    if((f.n[2]>0)!==front)return;
    const lam=Math.max(0,(f.n[0]*L[0]+f.n[1]*L[1]+f.n[2]*L[2])/ll);
    const sp=Math.pow(Math.max(0,(f.n[0]*Hf[0]+f.n[1]*Hf[1]+f.n[2]*Hf[2])/hl),24);
    const fr=Math.pow(1-Math.abs(f.n[2]),2),q=f.q.map(i=>PV[i]);
    c.beginPath();q.forEach((o,i)=>i?c.lineTo(o[0],o[1]):c.moveTo(o[0],o[1]));c.closePath();
    if(!front){c.globalAlpha=.42;c.fillStyle=shade(col,-.35+lam*.3);c.fill();c.globalAlpha=1;c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=1;c.stroke();return}
    c.globalAlpha=.8;c.fillStyle=shade(col,lam*.95-.5+fr*.2+f.v*.14);c.fill();c.globalAlpha=1;
    if(sp>.02){c.fillStyle='rgba(255,255,255,'+Math.min(.9,sp*.9)+')';c.fill()}
    c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.3;c.stroke();
    if(sp>.5){const m=q.reduce((a,o)=>[a[0]+o[0]/4,a[1]+o[1]/4],[0,0]),z=s*.16*sp;c.strokeStyle='#fff';c.lineWidth=1.6;c.beginPath();c.moveTo(m[0]-z,m[1]);c.lineTo(m[0]+z,m[1]);c.moveTo(m[0],m[1]-z);c.lineTo(m[0],m[1]+z);c.stroke()}
  });
  pass(false);pass(true);
}
const GEMK=0.42,GEO={},SPIN=[.55,.82,.66,.92,.6,.76];
function stoneCard(g){
  const idx=GAMES.indexOf(g),gem=GEO[idx]||(GEO[idx]=makeGem(idx*5+3));
  const cv=h('canvas',{width:480,height:416,style:'background:radial-gradient(closest-side,'+g.c+'55,'+g.c+'1c 55%,'+g.c+'00)'});
  const it={cv,ctx:cv.getContext('2d'),c:g.c,gem,seed:idx*1.7,ang:idx*1.1,sp:SPIN[idx%6],b:0,tb:0};live.push(it);
  const open=()=>go('game/'+g.id);
  return h('div',{class:'stone',style:'--c:'+g.c,tabindex:'0',role:'link','aria-label':g.stone+'・'+g.name,onclick:open,onkeydown:e=>{if(e.key==='Enter')open()},onmouseenter:()=>it.tb=2.2,onmouseleave:()=>it.tb=0},
    cv,h('b',{},g.stone),h('span',{},g.name));
}
let lastR=0,gapMs=15;
function frame(ms){
  requestAnimationFrame(frame);
  if(!live.length||ms-lastR<gapMs)return;
  const t=ms/1000,dt=Math.min(.08,(ms-lastR)/1000),t0=performance.now();lastR=ms;
  live.forEach(it=>{if(!it.cv.isConnected||!it.ctx)return;it.b+=(it.tb-it.b)*.12;it.ang+=dt*(it.sp+it.b);renderGem(it.ctx,it.cv.width,it.cv.height,it.gem,it.c,t,it.ang,it.seed)});
  {const cost=performance.now()-t0;gapMs=cost>18?90:cost>9?34:15}   /* 裝置較慢時自動降到約 30 fps，避免卡住操作 */
}
/* ===== 路由 ===== */
function route(){live=[];
  if(window.__stop){window.__stop();window.__stop=null}
  const [p,arg]=cur.split('/'),a=$('app');a.textContent='';a.className=(!p||p==='home'||!({games:1,board:1,game:1})[p])?'home':'';
  a.dataset.pg=a.className==='home'?'home':p;a.dataset.g=arg||'';paintNav(p==='game'?'games':p);
  ({home:pageHome,games:pageGames,board:pageBoard,game:pageGame}[p]||pageHome)(a,arg);
  try{scrollTo(0,0)}catch(e){}
}
addEventListener('hashchange',()=>{const n=location.hash.slice(1)||'home';if(n!==cur){cur=n;route()}});
$('logo').onclick=e=>{e.preventDefault();go('home')};
requestAnimationFrame(frame);paintWho();route();initServices();
