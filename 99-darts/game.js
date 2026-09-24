const WS_URLS=["ws://127.0.0.1:3180/api/events?type=state","ws://localhost:3180/api/events?type=state"];
const ORDER=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
const COLORS={black:"#11131a",cream:"#eee9d4",red:"#f15b62",green:"#61b86f"};
const state={target:20,targetLabel:"20",player:"",darts:0,score:0,singles:0,doubles:0,triples:0,misses:0,running:false,connected:false,socket:null,urlIndex:0,latestNumThrows:null,baselineThrows:null,lastSignature:null,audio:null,history:loadHistory(),throws:[],sectorHits:{},ringHits:{single:0,double:0,triple:0,other:0},currentStreak:0,bestStreak:0,coordsExact:0};

const $=id=>document.getElementById(id);
function polar(cx,cy,r,a){a=(a-90)*Math.PI/180;return[cx+r*Math.cos(a),cy+r*Math.sin(a)]}
function wedge(cx,cy,r1,r2,a1,a2){const p1=polar(cx,cy,r2,a1),p2=polar(cx,cy,r2,a2),p3=polar(cx,cy,r1,a2),p4=polar(cx,cy,r1,a1),large=a2-a1>180?1:0;return`M ${p1[0]} ${p1[1]} A ${r2} ${r2} 0 ${large} 1 ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]} A ${r1} ${r1} 0 ${large} 0 ${p4[0]} ${p4[1]} Z`}

function buildBoard(){
  const svg=$("boardSvg"),ns="http://www.w3.org/2000/svg",cx=250,cy=250; svg.innerHTML="";
  const R={o:220,d:188,to:126,ti:110,bo:38,bi:17};
  const add=(num,bed,d,fill)=>{const p=document.createElementNS(ns,"path");p.setAttribute("d",d);p.setAttribute("fill",fill);p.setAttribute("stroke","#10131b");p.setAttribute("stroke-width","1.5");p.classList.add("board-segment");p.dataset.number=num;p.dataset.bed=bed;p.onclick=()=>selectTarget(num);svg.appendChild(p)};
  const bg=document.createElementNS(ns,"circle");bg.setAttribute("cx",cx);bg.setAttribute("cy",cy);bg.setAttribute("r",230);bg.setAttribute("fill","#070a12");bg.setAttribute("stroke","#34405f");bg.setAttribute("stroke-width",2);svg.appendChild(bg);
  ORDER.forEach((num,i)=>{const a1=i*18-8.3,a2=i*18+8.3,red=i%2;add(num,"single",wedge(cx,cy,R.ti,R.d,a1,a2),red?COLORS.red:COLORS.cream);add(num,"outer",wedge(cx,cy,R.d,R.o,a1,a2),red?COLORS.red:COLORS.green);add(num,"triple",wedge(cx,cy,R.to,R.ti,a1,a2),red?COLORS.red:COLORS.green);add(num,"inner",wedge(cx,cy,R.bo,R.to,a1,a2),red?COLORS.red:COLORS.cream);const[x,y]=polar(cx,cy,246,(a1+a2)/2),t=document.createElementNS(ns,"text");t.setAttribute("x",x);t.setAttribute("y",y);t.setAttribute("text-anchor","middle");t.setAttribute("dominant-baseline","middle");t.setAttribute("class","board-label");t.textContent=num;t.dataset.number=num;t.onclick=()=>selectTarget(num);svg.appendChild(t)});
  [[R.bo,COLORS.green],[R.bi,COLORS.red]].forEach(([r,fill],i)=>{const c=document.createElementNS(ns,"circle");c.setAttribute("cx",cx);c.setAttribute("cy",cy);c.setAttribute("r",r);c.setAttribute("fill",fill);c.setAttribute("stroke","#11131a");c.setAttribute("stroke-width",2);c.classList.add("board-segment");c.dataset.number=25;c.dataset.bed=i?"Bullseye":"Bull";c.onclick=()=>selectTarget(25);svg.appendChild(c)});
  const bt=document.createElementNS(ns,"text");bt.setAttribute("x",cx);bt.setAttribute("y",cy+3);bt.setAttribute("text-anchor","middle");bt.setAttribute("class","board-label");bt.setAttribute("font-size",10);bt.textContent="BULL";bt.style.pointerEvents="none";svg.appendChild(bt);highlightBoard();
}
function buildTargetButtons(){const box=$("targetButtons");box.innerHTML="";ORDER.slice().sort((a,b)=>a-b).forEach(n=>{const b=document.createElement("button");b.className="target-chip";b.textContent=n;b.dataset.target=n;b.onclick=()=>selectTarget(n);box.appendChild(b)});const b=document.createElement("button");b.className="target-chip bull";b.textContent="BULL";b.dataset.target=25;b.onclick=()=>selectTarget(25);box.appendChild(b)}
function selectTarget(n){state.target=n;state.targetLabel=n===25?"BULL":String(n);$("selectedBadge").textContent=state.targetLabel;$("targetDisplay").textContent=state.targetLabel;$("targetName").textContent=n===25?"🎯 BULL":`CIBLE ${n}`;document.querySelectorAll(".target-chip").forEach(b=>b.classList.toggle("selected",Number(b.dataset.target)===n));highlightBoard();$("startBtn").disabled=!state.connected;if(state.connected)$("setupMessage").textContent="Cible sélectionnée. Prêt à jouer."}
function highlightBoard(){document.querySelectorAll(".board-segment").forEach(e=>e.classList.toggle("selected",state.target!==null&&Number(e.dataset.number)===Number(state.target)))}
function setConnection(kind,text){$("connection").className="status "+kind;$("connection").innerHTML=`<span class="status-dot"></span><span>${text}</span>`}
function connect(){if(state.socket){try{state.socket.close()}catch(_){}}setConnection("connecting","Connexion à Autodarts…");const ws=new WebSocket(WS_URLS[state.urlIndex]);state.socket=ws;ws.onopen=()=>{state.connected=true;state.urlIndex=0;setConnection("online","Autodarts connecté");$("startBtn").disabled=state.target===null;$("setupMessage").textContent=state.target===null?"Autodarts détecté. Choisis une cible.":"Autodarts connecté. Prêt à jouer."};ws.onmessage=e=>{try{handleAutodarts(JSON.parse(e.data))}catch(err){console.warn(err)}};ws.onclose=()=>{state.connected=false;setConnection("offline","Autodarts non connecté");$("startBtn").disabled=true;if(!state.running)$("setupMessage").textContent="Autodarts non détecté. Vérifie que le Board Manager est ouvert.";state.urlIndex=(state.urlIndex+1)%WS_URLS.length;setTimeout(connect,2500)}}

function normalizeSegment(s){
  return {number:Number(s?.number??0),mult:Number(s?.multiplier??0),name:s?.name||"MISS",bed:(s?.bed||"Outside").toLowerCase()};
}
function ringFrom(mult,hit){if(!hit)return"other";return mult===3?"triple":mult===2?"double":"single"}
function extractCoords(t){const cs=[t?.coords,t?.coordinates,t?.position,t?.point,t?.hit?.coords,t?.dart?.coords];for(const c of cs){if(c!=null){const x=Number(c.x),y=Number(c.y);if(Number.isFinite(x)&&Number.isFinite(y))return{x,y}}}const x=Number(t?.x),y=Number(t?.y);return Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null}
function normalizeCoords(c){if(!c)return null;let x=Number(c.x),y=Number(c.y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;const m=Math.max(Math.abs(x),Math.abs(y));if(m>1.5){x/=m;y/=m}return{x,y}}
function handleAutodarts(msg){
  if(msg?.type!=="state"||!msg.data)return;
  const d=msg.data;if(d.event!=="Throw detected"||!Array.isArray(d.throws)||!d.throws.length)return;
  const rawThrow=d.throws[d.throws.length-1];
  const nt=Number(d.numThrows??0),s=normalizeSegment(rawThrow?.segment);if(!s)return;
  const coords=normalizeCoords(extractCoords(rawThrow));
  const sig=`${nt}|${s.name}|${s.number}|${s.mult}|${s.bed}|${coords?`${coords.x.toFixed(5)},${coords.y.toFixed(5)}`:"none"}`;
  if(nt!==state.latestNumThrows&&sig!==state.lastSignature){state.latestNumThrows=nt;state.lastSignature=sig}
  if(!state.running||state.baselineThrows!==null&&nt<=state.baselineThrows||state.darts>=99)return;

  const hit=state.target===25?s.number===25:s.number===state.target;
  const points=hit?Math.min(3,Math.max(0,s.mult)):0;
  state.darts++;state.score+=points;
  if(hit&&points===1)state.singles++;else if(hit&&points===2)state.doubles++;else if(hit&&points===3)state.triples++;else state.misses++;
  const ring=ringFrom(points,hit);state.ringHits[ring]=(state.ringHits[ring]||0)+1;
  state.sectorHits[s.number]=(state.sectorHits[s.number]||0)+1;
  state.currentStreak=hit?state.currentStreak+1:0;state.bestStreak=Math.max(state.bestStreak,state.currentStreak);
  if(coords) state.coordsExact++;
  state.throws.push({n:state.darts,name:s.name,number:s.number,mult:s.mult,bed:s.bed,hit,points,ring,coords});
  if(state.throws.length>99)state.throws.shift();
  addThrow(s.name,hit,points,s.mult);playDartSound(hit,s.mult);updateGameUI();renderHeatmap();
  if(state.darts>=99)finishGame();
}

function startGame(){
  if(!state.connected||state.target===null)return;
  state.player=(($("playerName").value||"Joueur").trim()||"Joueur").slice(0,24);localStorage.setItem("99darts.player",state.player);
  state.darts=state.score=state.singles=state.doubles=state.triples=state.misses=0;state.running=true;state.baselineThrows=state.latestNumThrows;state.lastSignature=null;
  state.throws=[];state.sectorHits={};state.ringHits={single:0,double:0,triple:0,other:0};state.currentStreak=0;state.bestStreak=0;state.coordsExact=0;
  $("gameTarget").textContent=state.targetLabel;$("gamePlayer").textContent=state.player.toUpperCase();$("throws").innerHTML="";
  $("setup").classList.add("hidden");$("finish").classList.add("hidden");$("game").classList.remove("hidden");updateGameUI();renderHeatmap();playStartSound();
}
function addThrow(name,good,points,mult){
  const row=document.createElement("div");row.className="throw "+(good?"good":"zero")+(good&&mult===3?" triple":"");
  row.innerHTML=`<div class="throw-left"><div class="throw-number">${state.darts}</div><div><div class="throw-name">${escapeHtml(name)}</div><div class="throw-detail">${good?(mult===3?"TRIPLE · +3":mult===2?"DOUBLE · +2":"SIMPLE · +1"):"Autre secteur · +0"}</div></div></div><div class="throw-points">${points>0?"+"+points:"+0"}</div>`;
  $("throws").prepend(row);while($("throws").children.length>30)$("throws").lastChild.remove();
}

function updateGameUI(){
  $("score").textContent=state.score;$("dartCount").textContent=state.darts;const p=Math.round(state.darts/99*100);$("percent").textContent=p+"%";$("progressBar").style.width=p+"%";
  $("singleCount").textContent=state.singles;$("doubleCount").textContent=state.doubles;$("tripleCount").textContent=state.triples;$("missCount").textContent=state.misses;
  const avg=state.darts?state.score/state.darts:0;const hits=state.singles+state.doubles+state.triples;const rate=state.darts?hits/state.darts*100:0;
  $("average").textContent=avg.toFixed(2);$("projected").textContent=Math.round(avg*99);$("hitRate").textContent=rate.toFixed(0)+"%";$("targetHits").textContent=hits;$("heatTargetRate").textContent=rate.toFixed(0)+"%";
  $("currentStreak").textContent=state.currentStreak;$("bestStreak").textContent=state.bestStreak;$("lastDart").textContent=state.throws.length?formatThrow(state.throws[state.throws.length-1]):"—";
  const a3=state.throws.slice(-3).reduce((a,x)=>a+x.points,0)/Math.min(3,state.throws.length||1),a9=state.throws.slice(-9).reduce((a,x)=>a+x.points,0)/Math.min(9,state.throws.length||1);
  $("avg3").textContent=state.throws.length?a3.toFixed(2):"0.00";$("avg9").textContent=state.throws.length?a9.toFixed(2):"0.00";
  $("bestDart").textContent=state.throws.length?Math.max(...state.throws.map(x=>x.points)):0;$("pace33").textContent=Math.round(avg*33);
}
function formatThrow(t){if(!t)return"—";return `${t.name} · +${t.points}`}
function finishGame(){
  state.running=false;const r={id:Date.now(),player:state.player,target:state.targetLabel,score:state.score,average:state.score/99,singles:state.singles,doubles:state.doubles,triples:state.triples,date:new Date().toISOString()};
  state.history.unshift(r);state.history=state.history.slice(0,20);saveHistory(state.history);
  $("finalScore").textContent=state.score;$("finishPlayer").textContent=state.player.toUpperCase();$("finalTarget").textContent="Cible : "+state.targetLabel;$("finalAverage").textContent=r.average.toFixed(2);$("finalSingles").textContent=state.singles;$("finalDoubles").textContent=state.doubles;$("finalTriples").textContent=state.triples;
  const best=getPersonalBest(state.player,state.targetLabel);$("bestMessage").textContent=best&&best.id===r.id?"🔥 Nouveau meilleur résultat local pour cette cible !":"";
  $("game").classList.add("hidden");$("finish").classList.remove("hidden");renderHistory();playFinishSound();
}
function resetToSetup(){state.running=false;$("game").classList.add("hidden");$("finish").classList.add("hidden");$("setup").classList.remove("hidden");$("startBtn").disabled=!state.connected||state.target===null;$("shareMessage").textContent=""}
function shareResult(){const text=`🎯 99 FLÉCHETTES\n${state.player} — cible ${state.targetLabel}\nScore : ${state.score} points\nMoyenne : ${(state.score/99).toFixed(2)} / fléchette\n99 fléchettes`;if(navigator.share){navigator.share({title:"99 Fléchettes",text,url:location.href}).catch(()=>{});return}if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>$("shareMessage").textContent="Résultat copié dans le presse-papiers !").catch(()=>fallbackCopy(text));else fallbackCopy(text)}
function fallbackCopy(text){const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");$("shareMessage").textContent="Résultat copié !"}catch(_){$("shareMessage").textContent=text}ta.remove()}
function loadHistory(){try{return JSON.parse(localStorage.getItem("99darts.history")||"[]")}catch(_){return[]}}function saveHistory(h){localStorage.setItem("99darts.history",JSON.stringify(h))}function getPersonalBest(player,target){return state.history.filter(x=>x.player===player&&x.target===target).sort((a,b)=>b.score-a.score)[0]||null}
function renderHistory(){const b=$("history");if(!state.history.length){b.innerHTML='<div class="empty-history">Aucun résultat enregistré sur cet appareil.</div>';return}b.innerHTML=state.history.slice().sort((a,b)=>b.score-a.score).slice(0,10).map((x,i)=>`<div class="history-row"><b>${i===0?"🏆 ":""}${escapeHtml(x.player)}</b><span>Cible ${escapeHtml(x.target)}</span><span>${x.score} pts</span><span>${new Date(x.date).toLocaleDateString("fr-FR")}</span></div>`).join("")}
function clearHistory(){if(!confirm("Effacer l'historique local ?"))return;state.history=[];saveHistory([]);renderHistory()}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function buildHeatBoard(){const svg=$("heatSvg"),ns="http://www.w3.org/2000/svg",cx=250,cy=250;svg.innerHTML="";const R={o:214,d:184,to:126,ti:108,bo:40,bi:18};const bg=document.createElementNS(ns,"circle");bg.setAttribute("cx",cx);bg.setAttribute("cy",cy);bg.setAttribute("r",226);bg.setAttribute("fill","#070a12");bg.setAttribute("stroke","#303a58");bg.setAttribute("stroke-width",2);svg.appendChild(bg);ORDER.forEach((num,i)=>{const a1=i*18-8.3,a2=i*18+8.3;[["single",R.ti,R.d],["outer",R.d,R.o],["triple",R.to,R.ti],["inner",R.bo,R.to]].forEach(([bed,r1,r2])=>{const p=document.createElementNS(ns,"path");p.setAttribute("d",wedge(cx,cy,r1,r2,a1,a2));p.dataset.number=num;p.dataset.bed=bed;p.classList.add("heat-segment");svg.appendChild(p)});const [x,y]=polar(cx,cy,240,(a1+a2)/2),t=document.createElementNS(ns,"text");t.setAttribute("x",x);t.setAttribute("y",y);t.setAttribute("text-anchor","middle");t.setAttribute("dominant-baseline","middle");t.classList.add("heat-label");t.textContent=num;svg.appendChild(t)});const bull=document.createElementNS(ns,"circle");bull.setAttribute("cx",cx);bull.setAttribute("cy",cy);bull.setAttribute("r",R.bo);bull.classList.add("heat-bull");bull.dataset.number="25";svg.appendChild(bull);const bullseye=document.createElementNS(ns,"circle");bullseye.setAttribute("cx",cx);bullseye.setAttribute("cy",cy);bullseye.setAttribute("r",R.bi);bullseye.classList.add("heat-bullseye");bullseye.dataset.number="25";svg.appendChild(bullseye);const c=document.createElementNS(ns,"text");c.setAttribute("x",cx);c.setAttribute("y",cy+4);c.setAttribute("text-anchor","middle");c.classList.add("heat-center-label");c.textContent="HEAT";svg.appendChild(c);renderHeatmap()}
function heatAlpha(count,max){return count?Math.min(.82,.10+.68*(count/max)):0}
function coordToSvg(c){return c?{x:250+c.x*205,y:250-c.y*205}:null}
function dartColor(t){return !t.hit?"#8a94ad":t.mult===3?"#62e6a8":t.mult===2?"#ff6974":"#ffca5c"}
function renderImpactLayer(svg,ns){const layer=document.createElementNS(ns,"g");layer.classList.add("impact-layer");state.throws.forEach(t=>{const pos=coordToSvg(t.coords);if(!pos)return;const color=dartColor(t);const halo=document.createElementNS(ns,"circle");halo.setAttribute("cx",pos.x);halo.setAttribute("cy",pos.y);halo.setAttribute("r",t.hit?15:11);halo.setAttribute("fill",color);halo.setAttribute("fill-opacity",t.hit?0.12:0.07);halo.classList.add("impact-halo");layer.appendChild(halo);const dot=document.createElementNS(ns,"circle");dot.setAttribute("cx",pos.x);dot.setAttribute("cy",pos.y);dot.setAttribute("r",t.n===state.darts?5.2:3.6);dot.setAttribute("fill",color);dot.setAttribute("stroke","#080b12");dot.setAttribute("stroke-width",2);dot.classList.add("impact-dot");dot.dataset.n=t.n;const title=document.createElementNS(ns,"title");title.textContent=`#${t.n} · ${t.name} · +${t.points} · x ${t.coords.x.toFixed(3)} · y ${t.coords.y.toFixed(3)}`;dot.appendChild(title);layer.appendChild(dot)});svg.appendChild(layer)}
function renderHeatmap(){const svg=$("heatSvg");if(!svg)return;const max=Math.max(1,...Object.values(state.sectorHits));document.querySelectorAll(".heat-segment").forEach(el=>{const n=Number(el.dataset.number),count=state.sectorHits[n]||0,alpha=heatAlpha(count,max),isTarget=n===state.target;el.style.fill=count?`rgba(98,230,168,${alpha})`:"rgba(255,255,255,.035)";el.style.stroke=isTarget?"#dfffee":"rgba(255,255,255,.07)";el.style.strokeWidth=isTarget?"2.5":"1";el.classList.toggle("target-zone",isTarget)});const hb=svg.querySelector(".heat-bull"),hs=svg.querySelector(".heat-bullseye");if(hb)hb.style.fill=state.sectorHits[25]?`rgba(255,202,92,${heatAlpha(state.sectorHits[25],max)})`:"rgba(255,255,255,.04)";if(hs)hs.style.fill=state.sectorHits[25]?`rgba(255,91,98,${heatAlpha(state.sectorHits[25],max)})`:"rgba(255,255,255,.04)";document.querySelectorAll(".heat-label").forEach(t=>{const n=Number(t.textContent);t.style.opacity=(state.sectorHits[n]||state.target===n)?0.95:0.42;t.style.fill=state.target===n?"#62e6a8":"#dce3fa"});const old=svg.querySelector(".impact-layer");if(old)old.remove();renderImpactLayer(svg,"http://www.w3.org/2000/svg");const exact=state.throws.filter(t=>t.coords).length;if($("exactHits"))$("exactHits").textContent=exact;if($("coordMode"))$("coordMode").textContent=exact?"COORDONNÉES RÉELLES":"EN ATTENTE DES COORDONNÉES"}

function audioContext(){if(!state.audio)state.audio=new(window.AudioContext||window.webkitAudioContext)();if(state.audio.state==="suspended")state.audio.resume();return state.audio}
function beep(freq,dur,type="sine",gain=.035,delay=0){try{const a=audioContext(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.03)}catch(_){}}
function playStartSound(){beep(520,.12);beep(780,.16,"sine",.035,.09)}function playDartSound(good,m){if(!good){beep(180,.07,"square",.018);return}if(m===3){beep(660,.1,"sine",.045);beep(990,.14,"sine",.05,.08);beep(1320,.18,"sine",.045,.16)}else if(m===2){beep(620,.13,"sine",.04);beep(820,.14,"sine",.035,.1)}else beep(520,.09,"sine",.03)}
function playFinishSound(){[523,659,784,1047].forEach((f,i)=>beep(f,.16,"sine",.04,i*.11))}

$("startBtn").onclick=startGame;$("resetBtn").onclick=resetToSetup;$("againBtn").onclick=resetToSetup;$("shareBtn").onclick=shareResult;$("clearHistory").onclick=clearHistory;
$("playerName").value=localStorage.getItem("99darts.player")||"";buildBoard();buildTargetButtons();buildHeatBoard();renderHistory();selectTarget(20);connect();
