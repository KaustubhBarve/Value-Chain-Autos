/* Value Chain Atlas app: loop, industry web, car x-ray, engine and motor, drawer. Needs data.js. */
(function(){
"use strict";
/* ================= helpers ================= */
const SVGNS="http://www.w3.org/2000/svg";
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const li=a=>a.map(x=>"<li>"+esc(x)+"</li>").join("");
function el(tag,attrs,parent){const n=document.createElementNS(SVGNS,tag);if(attrs){for(const k in attrs)n.setAttribute(k,attrs[k]);}if(parent)parent.appendChild(n);return n;}
const SV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const ICON={
  pause:SV+'<path d="M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"/><path d="M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"/></svg>',
  play:SV+'<path d="M7 4v16l13 -8z"/></svg>',
  x:SV+'<path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>',
  left:SV+'<path d="M15 6l-6 6l6 6"/></svg>',
  right:SV+'<path d="M9 6l6 6l-6 6"/></svg>'
};
function fmtIN(n){if(n>=1e7)return (n/1e7).toFixed(2).replace(/\.?0+$/,"")+" crore";if(n>=1e5)return (n/1e5).toFixed(1).replace(/\.0$/,"")+" lakh";return n.toLocaleString("en-IN");}
const fmtCr=n=>Math.round(n).toLocaleString("en-IN");
const lakhCr=n=>n>=1e5?(n/1e5).toFixed(1)+" lakh cr":fmtCr(n)+" cr";
const num=(v,d)=>v==null?"-":v.toFixed(d);
const pct=v=>v==null?"-":(v>0?"+":"")+v.toFixed(1)+"%";

const CO={};
for(const id in CO_RAW){const a=CO_RAW[id];CO[id]={id:id,name:a[0],url:SCR+a[1],mcap:a[2],pe:a[3],salesQ:a[4],yoy:a[5],roce:a[6],ind:a[7],role:a[8],verify:!!a[9]};}
const NI={};NODES.forEach(n=>{NI[n.id]=n;});
const PART={};DATA.parts.forEach(p=>{PART[p.id]=p;});
const coId=e=>typeof e==="string"?e:(e&&!Array.isArray(e)&&e.id)?e.id:null;
const coNote=e=>(e&&!Array.isArray(e)&&typeof e==="object"&&e.note)?e.note:null;
function reveal(elm){
  if(!elm||window.innerWidth>=900)return;
  const r=elm.getBoundingClientRect(),vh=window.innerHeight;
  if(r.top>vh-140||r.bottom<80)elm.scrollIntoView({behavior:smooth(),block:"start"});
}
const nodesOf=id=>{const hits=NODES.filter(n=>n.cos.some(c=>coId(c)===id));const prim=hits.filter(n=>n.cos.includes(id));return prim.concat(hits.filter(n=>!prim.includes(n))).map(n=>n.id);};

const reduceMQ=window.matchMedia("(prefers-reduced-motion: reduce)");
const smooth=()=>reduceMQ.matches?"auto":"smooth";
const state={mode:"ice",flow:"both",paused:reduceMQ.matches,dv:null,part:null,pw:null,json:false};
const NS=DATA.stations.length;

/* ================= Level 1: the loop ================= */
class Track{
  constructor(x0,y0,x1,y1,r){
    this.x0=x0;this.y0=y0;this.x1=x1;this.y1=y1;this.r=r;
    const Lt=(x1-x0)-2*r,Ls=(y1-y0)-2*r,La=Math.PI*r/2;
    this.segs=[
      {k:"l",ax:x0+r,ay:y0,bx:x1-r,by:y0,len:Lt},
      {k:"a",cx:x1-r,cy:y0+r,a0:-Math.PI/2,a1:0,len:La},
      {k:"l",ax:x1,ay:y0+r,bx:x1,by:y1-r,len:Ls},
      {k:"a",cx:x1-r,cy:y1-r,a0:0,a1:Math.PI/2,len:La},
      {k:"l",ax:x1-r,ay:y1,bx:x0+r,by:y1,len:Lt},
      {k:"a",cx:x0+r,cy:y1-r,a0:Math.PI/2,a1:Math.PI,len:La},
      {k:"l",ax:x0,ay:y1-r,bx:x0,by:y0+r,len:Ls},
      {k:"a",cx:x0+r,cy:y0+r,a0:Math.PI,a1:1.5*Math.PI,len:La}
    ];
    let acc=0;this.starts=[];
    for(const s of this.segs){this.starts.push(acc);acc+=s.len;}
    this.L=acc;
  }
  at(s){
    const L=this.L;s=((s%L)+L)%L;
    let i=this.segs.length-1;
    for(let k=0;k<this.segs.length;k++){if(s<this.starts[k]+this.segs[k].len){i=k;break;}}
    const g=this.segs[i],u=g.len?(s-this.starts[i])/g.len:0;
    if(g.k==="l"){const tx=g.len?(g.bx-g.ax)/g.len:1,ty=g.len?(g.by-g.ay)/g.len:0;return {x:g.ax+(g.bx-g.ax)*u,y:g.ay+(g.by-g.ay)*u,tx:tx,ty:ty};}
    const a=g.a0+(g.a1-g.a0)*u;
    return {x:g.cx+this.r*Math.cos(a),y:g.cy+this.r*Math.sin(a),tx:-Math.sin(a),ty:Math.cos(a)};
  }
  sOf(seg,t){return this.starts[seg]+this.segs[seg].len*t;}
  d(){const {x0,y0,x1,y1,r}=this;return "M"+(x0+r)+" "+y0+"H"+(x1-r)+"A"+r+" "+r+" 0 0 1 "+x1+" "+(y0+r)+"V"+(y1-r)+"A"+r+" "+r+" 0 0 1 "+(x1-r)+" "+y1+"H"+(x0+r)+"A"+r+" "+r+" 0 0 1 "+x0+" "+(y1-r)+"V"+(y0+r)+"A"+r+" "+r+" 0 0 1 "+(x0+r)+" "+y0+"Z";}
  inset(d){return new Track(this.x0+d,this.y0+d,this.x1-d,this.y1-d,Math.max(1,this.r-d));}
}
const DESK=[[0,.125],[0,.375],[0,.625],[0,.875],[1,.72],[3,.28],[4,1/6],[4,.5],[4,5/6],[5,.72],[7,.28]];
const TALL=[[0,.5],[2,.12],[2,.37],[2,.62],[2,.87],[4,.5],[6,.1],[6,.3],[6,.5],[6,.7],[6,.9]];
const PAINT=[["MAKE",0,.5],["SELL",2,.5],["USE",4,1/3],["RETURN",6,.5]];
const loopEl=$("#loop"),stage=$("#stage"),svg=$("#loopSvg"),canvas=$("#loopCanvas"),ctx=canvas.getContext("2d"),copy=$("#loopCopy");
let LAY=null,ST=[],firstRender=true,sO=null,sI=null,goods=[],cash=[];
let introAlpha=0,introStart=0,goodsA=1,cashA=1,raf=0,last=0,onScreen=true;

function layoutFor(W,forceTall){
  if(!forceTall&&W>=980){
    const H=Math.round(Math.max(720,Math.min(820,W*.56)));
    const padX=172,padY=108,roadW=44,tw=W-2*padX,th=H-2*padY;
    const r=Math.round(Math.min(150,th/2-24,tw*.14));
    return {W:W,H:H,tall:false,small:false,roadW:roadW,track:new Track(padX,padY,W-padX,H-padY,r),slots:DESK,out:true};
  }
  const small=W<560;
  const H=Math.round(small?Math.max(640,W*1.72):Math.min(1000,Math.max(720,W*1.1)));
  const pad=small?20:36,roadW=small?30:38,r=small?54:84;
  return {W:W,H:H,tall:true,small:small,roadW:roadW,track:new Track(pad,pad,W-pad,H-pad,r),slots:TALL,out:false};
}
function placeCopy(lay){
  const T=lay.track,rw=lay.roadW;
  const inL=T.x0+rw/2,inR=T.x1-rw/2,inT=T.y0+rw/2,inB=T.y1-rw/2;
  const padL=Math.max(40,T.r*.34);
  const w=Math.floor(Math.min(620,(inR-inL)-padL-40));
  copy.style.width=w+"px";copy.style.left=Math.round(inL+padL)+"px";copy.style.top="0px";
  const h=copy.offsetHeight;
  copy.style.top=Math.round((inT+inB)/2-h/2)+"px";
  return h<=(inB-inT)-24;
}
function clearCopy(){copy.style.width="";copy.style.left="";copy.style.top="";}
function msPath(x,y,w,h,rt,rb){return "M"+(x+rt)+" "+y+"H"+(x+w-rt)+"A"+rt+" "+rt+" 0 0 1 "+(x+w)+" "+(y+rt)+"V"+(y+h-rb)+"A"+rb+" "+rb+" 0 0 1 "+(x+w-rb)+" "+(y+h)+"H"+(x+rb)+"A"+rb+" "+rb+" 0 0 1 "+x+" "+(y+h-rb)+"V"+(y+rt)+"A"+rt+" "+rt+" 0 0 1 "+(x+rt)+" "+y+"Z";}
function capPath(x,y,w,ch,rt){return "M"+(x+rt)+" "+y+"H"+(x+w-rt)+"A"+rt+" "+rt+" 0 0 1 "+(x+w)+" "+(y+rt)+"V"+(y+ch)+"H"+x+"V"+(y+rt)+"A"+rt+" "+rt+" 0 0 1 "+(x+rt)+" "+y+"Z";}
function milestone(st,i,p,n,lay){
  const rw=lay.roadW,dir=lay.out?n:{x:-n.x,y:-n.y};
  const gap=rw/2+(lay.small?7:12);
  const ax=p.x+dir.x*gap,ay=p.y+dir.y*gap;
  const side=Math.abs(dir.x)>Math.abs(dir.y)?(dir.x>0?"right":"left"):(dir.y>0?"below":"above");
  const g=el("g",{class:"ms",tabindex:"0",role:"button","aria-label":"Stop "+(i+1)+", "+st.name+". "+st.tag},svg);
  const lift=el("g",{class:"ms-lift"},g);
  const pb=el("path",{class:"ms-body"},lift),pc=el("path",{class:"ms-cap"},lift),pl=el("path",{class:"ms-line"},lift);
  const tN=el("text",{class:"ms-num","text-anchor":"middle"},lift);tN.textContent=String(i+1);
  const tH=el("text",{class:"ms-hi","text-anchor":"middle",lang:"hi"},lift);tH.textContent=lay.small?(st.hiS||st.hi):st.hi;
  const tE=el("text",{class:"ms-en","text-anchor":"middle"},lift);tE.textContent=st.short;
  const S=lay.small?{cap:14,body:31,px:8,rt:9,hy:12,ey:25}:{cap:17,body:38,px:12,rt:12,hy:14,ey:31};
  let tw=0;
  try{tw=Math.max(tH.getComputedTextLength(),tE.getComputedTextLength());}catch(e){tw=0;}
  if(!tw)tw=st.short.length*7;
  const w=Math.ceil(tw+S.px*2),h=S.cap+S.body;
  let x,y;
  if(side==="above"){x=ax-w/2;y=ay-h;}else if(side==="below"){x=ax-w/2;y=ay;}else if(side==="right"){x=ax;y=ay-h/2;}else{x=ax-w;y=ay-h/2;}
  x=Math.max(2,Math.min(lay.W-w-2,x));y=Math.max(2,Math.min(lay.H-h-2,y));
  x=Math.round(x)+.5;y=Math.round(y)+.5;
  pb.setAttribute("d",msPath(x,y,w,h,S.rt,3));pc.setAttribute("d",capPath(x,y,w,S.cap,S.rt));pl.setAttribute("d",msPath(x,y,w,h,S.rt,3));
  const cx=(x+w/2).toFixed(1);
  tN.setAttribute("x",cx);tN.setAttribute("y",(y+S.cap/2+3.6).toFixed(1));
  tH.setAttribute("x",cx);tH.setAttribute("y",(y+S.cap+S.hy).toFixed(1));
  tE.setAttribute("x",cx);tE.setAttribute("y",(y+S.cap+S.ey).toFixed(1));
  g.addEventListener("click",()=>openStop(i));
  g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openStop(i);}});
  return g;
}
function renderLoop(){
  const W=Math.max(300,Math.round(loopEl.clientWidth));
  let lay=layoutFor(W,false);
  loopEl.classList.toggle("tall",lay.tall);
  if(!lay.tall&&!placeCopy(lay)){lay=layoutFor(W,true);loopEl.classList.add("tall");}
  if(lay.tall)clearCopy();
  LAY=lay;
  stage.classList.toggle("small",lay.small);
  stage.style.height=lay.H+"px";
  svg.setAttribute("width",lay.W);svg.setAttribute("height",lay.H);svg.setAttribute("viewBox","0 0 "+lay.W+" "+lay.H);
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  const T=lay.track,rw=lay.roadW;
  const gRoad=el("g",{class:"road","aria-hidden":"true"},svg);
  const body=el("path",{class:"road-body",d:T.d(),"stroke-width":rw},gRoad);
  const marks=el("g",{class:"marks"},gRoad);
  el("path",{class:"mark edge",d:T.inset(-(rw/2-4)).d()},marks);
  el("path",{class:"mark edge",d:T.inset(rw/2-4).d()},marks);
  el("path",{class:"mark centre",d:T.d()},marks);
  if(!lay.tall){
    PAINT.forEach(pw=>{
      const p=T.at(T.sOf(pw[1],pw[2])),n={x:p.ty,y:-p.tx},off=rw/4;
      const x=p.x+n.x*off,y=p.y+n.y*off;
      let ang=Math.atan2(p.ty,p.tx)*180/Math.PI;
      if(ang>90.5)ang-=180;if(ang<-90.5)ang+=180;
      const t=el("text",{class:"paint",x:x.toFixed(1),y:y.toFixed(1),"text-anchor":"middle","dominant-baseline":"central",transform:"rotate("+ang.toFixed(1)+" "+x.toFixed(1)+" "+y.toFixed(1)+")"},marks);
      t.textContent=pw[0];
    });
  }
  const xings=el("g",{class:"xings"},gRoad);
  ST=[];
  DATA.stations.forEach((st,i)=>{
    const sl=lay.slots[i],s=T.sOf(sl[0],sl[1]),p=T.at(s),n={x:p.ty,y:-p.tx};
    const gx=el("g",{class:"xing"},xings),k=lay.small?4:5;
    for(let j=0;j<k;j++){
      const off=-rw/2+5+j*((rw-10)/(k-1)),cx=p.x+n.x*off,cy=p.y+n.y*off;
      el("line",{x1:(cx-p.tx*6).toFixed(1),y1:(cy-p.ty*6).toFixed(1),x2:(cx+p.tx*6).toFixed(1),y2:(cy+p.ty*6).toFixed(1)},gx);
    }
    ST.push({s:s,u:s/T.L,g:milestone(st,i,p,n,lay),gx:gx});
  });
  sizeCanvas(lay);buildSamples(lay);markOpen();
  if(firstRender){firstRender=false;intro(body,T.L);}
  else if(!raf){snapAlphas();draw();}
}

/* traffic: each stage of the loop moves in the vehicle that really carries it */
function sizeCanvas(lay){const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(lay.W*dpr);canvas.height=Math.round(lay.H*dpr);canvas.style.width=lay.W+"px";canvas.style.height=lay.H+"px";ctx.setTransform(dpr,0,0,dpr,0,0);}
function sampleTrack(T,N){const x=new Float32Array(N),y=new Float32Array(N),a=new Float32Array(N);for(let k=0;k<N;k++){const p=T.at(k/N*T.L);x[k]=p.x;y[k]=p.y;a[k]=Math.atan2(p.ty,p.tx);}return {x:x,y:y,a:a,N:N};}
function buildSamples(lay){
  const T=lay.track,off=lay.roadW/4,N=Math.max(600,Math.ceil(T.L/1.5));
  sO=sampleTrack(T.inset(-off),N);sI=sampleTrack(T.inset(off),N);
  const nG=lay.tall?(lay.small?22:30):44,nC=lay.tall?(lay.small?20:28):42;
  if(goods.length!==nG)goods=Array.from({length:nG},(_,i)=>({u:(i+Math.random()*.4)/nG,r:Math.random(),c:(Math.random()*20)|0}));
  if(cash.length!==nC)cash=Array.from({length:nC},(_,i)=>({u:(i+Math.random()*.45)/nC}));
}
const RGB={ore:[181,119,79],steel:[190,199,207],part:[240,138,62],partEv:[65,194,127],vehicle:[244,246,245],aged:[214,200,172],scrap:[160,113,84],recovered:[176,193,207]};
const STAGE=["ore","steel","part","vehicle","vehicle","vehicle","vehicle","vehicle","aged","scrap","recovered"];
const CASH="#6FB0F0",GLASS="rgba(16,22,28,.85)",CABC="#E7EBEE",BED="#6E767E",BED2="#58616A",EVG="#2FB36D";
const CARC=["#F2F4F5","#F2F4F5","#C7CDD2","#8E969D","#C8463D","#3F6FB5","#9A7B5E"],HELM=["#C8463D","#3F6FB5","#F2F4F5","#E5C21C","#2FA36B"],LORC=["#E27A2B","#E5C21C","#3F6FB5","#C8463D"];
function stageRGB(k){const key=STAGE[k];return key==="part"?(state.mode==="ev"?RGB.partEv:RGB.part):RGB[key];}
function goodsColor(u){
  let k=ST.length-1;
  for(let i=0;i<ST.length;i++){if(ST[i].u<=u)k=i;else break;}
  const cur=stageRGB(k),prev=stageRGB((k-1+ST.length)%ST.length);
  let d=u-ST[k].u;if(d<0)d+=1;
  const b=Math.min(1,d*LAY.track.L/34);
  return [prev[0]+(cur[0]-prev[0])*b,prev[1]+(cur[1]-prev[1])*b,prev[2]+(cur[2]-prev[2])*b,k];
}
const rgb=c=>"rgb("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+")";
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function fill(c){ctx.fillStyle=c;ctx.fill();}
function dot(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);fill(c);}
function cab(s,x,c){rr(x,-2.7*s,4.3*s,5.4*s,1.3*s);fill(c||CABC);ctx.fillStyle=GLASS;ctx.fillRect(x+2.9*s,-2.2*s,.9*s,4.4*s);}
function tipper(s,c){rr(-9*s,-2.9*s,12*s,5.8*s,.8*s);fill(BED);rr(-8.2*s,-2.2*s,10.4*s,4.4*s,2*s);fill(c);cab(s,3.3*s);}
function coilTruck(s,c){rr(-9*s,-2.6*s,12*s,5.2*s,.6*s);fill(BED2);[-6.2,-1.8].forEach(cx=>{dot(cx*s,0,2.15*s,c);dot(cx*s,0,.8*s,"rgba(0,0,0,.45)");});cab(s,3.3*s);}
function boxTruck(s,c){rr(-9*s,-2.9*s,12.2*s,5.8*s,.8*s);fill(c);ctx.fillStyle="rgba(255,255,255,.3)";ctx.fillRect(-8.4*s,-.4*s,11*s,.8*s);cab(s,3.4*s);}
function carrier(s,p,ev){rr(-14*s,-2.7*s,17.2*s,5.4*s,.8*s);fill(BED2);for(let j=0;j<3;j++){rr((-13.4+j*5.5)*s,-1.95*s,4.7*s,3.9*s,1.2*s);fill(CARC[(p.c+j)%CARC.length]);if(ev){ctx.fillStyle=EVG;ctx.fillRect((-9.3+j*5.5)*s,-.8*s,.6*s,1.6*s);}}cab(s,3.4*s);}
function carTop(s,c,ev){rr(-5*s,-2.4*s,10*s,4.8*s,1.7*s);fill(c);rr(1.3*s,-1.95*s,1.7*s,3.9*s,.6*s);fill(GLASS);rr(-3.9*s,-1.8*s,1.3*s,3.6*s,.5*s);fill(GLASS);if(ev){ctx.fillStyle=EVG;ctx.fillRect(4.3*s,-1*s,.7*s,2*s);}}
function bike(s,c,ev){rr(-3.6*s,-.85*s,7.2*s,1.7*s,.85*s);fill("#C9D1D8");dot(-.5*s,0,1.35*s,c);if(ev)dot(3.1*s,0,.65*s,EVG);}
function auto3w(s,ev){rr(-3.8*s,-2.1*s,7.6*s,4.2*s,1.6*s);fill(ev?"#1E7F4A":"#2E8B4A");rr(-3.1*s,-1.8*s,4.4*s,3.6*s,1.2*s);fill("#E5C21C");}
function lorry(s,c,ev){rr(-8*s,-2.9*s,10.6*s,5.8*s,.8*s);fill(c);cab(s,2.8*s,"#D9DEE2");if(ev){ctx.fillStyle=EVG;ctx.fillRect(6.6*s,-1*s,.6*s,2*s);}}
function towTruck(s){rr(-9*s,-2.6*s,12*s,5.2*s,.6*s);fill(BED2);ctx.save();ctx.rotate(.12);rr(-8.4*s,-2*s,8.2*s,4*s,1.4*s);fill("#8F857B");ctx.restore();cab(s,3.3*s,"#E0A81E");}
function scrapTruck(s,c){rr(-9*s,-2.9*s,12*s,5.8*s,.8*s);fill(BED);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-8*s,-1.8*s);ctx.lineTo(-5.4*s,-2.2*s);ctx.lineTo(-4*s,.4*s);ctx.lineTo(-7.6*s,1.9*s);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-3.6*s,-2*s);ctx.lineTo(1.6*s,-1.4*s);ctx.lineTo(.8*s,1.9*s);ctx.lineTo(-3*s,1.4*s);ctx.closePath();ctx.fill();cab(s,3.3*s);}
function ingotTruck(s,c){rr(-9*s,-2.6*s,12*s,5.2*s,.6*s);fill(BED2);for(let j=0;j<3;j++){rr((-8.4+j*3.6)*s,-2*s,3*s,4*s,.4*s);fill(c);}cab(s,3.3*s);}
/* owner traffic follows India's FY26 sales mix: 76.8% two-wheelers, 16.4% cars, 3.8% commercial, 3.0% three-wheelers */
function owner(s,p,ev){const r=p.r;if(r<.768)bike(s,HELM[p.c%HELM.length],ev);else if(r<.932)carTop(s,CARC[p.c%CARC.length],ev);else if(r<.97)lorry(s,LORC[p.c%LORC.length],ev);else auto3w(s,ev);}
function vehicle(p,c,x,y,a,s){
  const k=c[3],ev=state.mode==="ev";
  ctx.save();ctx.translate(x,y);ctx.rotate(a);
  if(k===0)tipper(s,rgb(c));
  else if(k===1)coilTruck(s,rgb(c));
  else if(k===2)boxTruck(s,rgb(c));
  else if(k===3)carrier(s,p,ev);
  else if(k>=4&&k<=7)owner(s,p,ev);
  else if(k===8)towTruck(s);
  else if(k===9)scrapTruck(s,rgb(c));
  else ingotTruck(s,rgb(c));
  ctx.restore();
}
function draw(){
  if(!LAY||!ST.length)return;
  ctx.clearRect(0,0,LAY.W,LAY.H);
  const s=LAY.small?.78:(LAY.tall?.95:1.2),cr=LAY.small?2.1:2.7;
  const ga=goodsA*introAlpha,ca=cashA*introAlpha;
  if(ga>.01){ctx.globalAlpha=ga;for(const p of goods){const k=Math.floor(p.u*sO.N)%sO.N;vehicle(p,goodsColor(p.u),sO.x[k],sO.y[k],sO.a[k],s);}}
  if(ca>.01){ctx.globalAlpha=ca;for(const m of cash){const k=Math.floor(m.u*sI.N)%sI.N;dot(sI.x[k],sI.y[k],cr,CASH);}}
  ctx.globalAlpha=1;
}
function update(dt){
  const L=LAY.track.L,vg=(LAY.tall?50:74)/L,vc=(LAY.tall?42:62)/L;
  for(const p of goods){p.u+=vg*dt;if(p.u>=1)p.u-=1;}
  for(const m of cash){m.u-=vc*dt;if(m.u<0)m.u+=1;}
  const tg=state.flow==="money"?.12:1,tc=state.flow==="goods"?0:1,f=Math.min(1,dt*6);
  goodsA+=(tg-goodsA)*f;cashA+=(tc-cashA)*f;
  if(introAlpha<1)introAlpha=Math.max(0,Math.min(1,(performance.now()-introStart)/800));
}
function snapAlphas(){goodsA=state.flow==="money"?.12:1;cashA=state.flow==="goods"?0:1;introAlpha=1;}
function shouldRun(){return !state.paused&&onScreen&&!document.hidden;}
function kick(){if(!raf&&shouldRun()&&LAY){last=performance.now();raf=requestAnimationFrame(frame);}}
function frame(now){raf=0;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;update(dt);draw();if(shouldRun())raf=requestAnimationFrame(frame);}
function intro(body,L){
  if(reduceMQ.matches||state.paused){snapAlphas();draw();kick();return;}
  stage.classList.add("intro");
  body.style.strokeDasharray=L+"px";body.style.strokeDashoffset=L+"px";
  ST.forEach((o,i)=>o.g.style.setProperty("--d",(640+i*70)+"ms"));
  introAlpha=0;introStart=performance.now()+1150;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{stage.classList.add("go");body.style.transition="stroke-dashoffset 1.3s cubic-bezier(.6,0,.2,1)";body.style.strokeDashoffset="0px";}));
  setTimeout(()=>{
    stage.classList.remove("intro","go");
    const b=svg.querySelector(".road-body");if(b){b.style.transition="";b.style.strokeDasharray="";b.style.strokeDashoffset="";}
    ST.forEach(o=>o.g.style.removeProperty("--d"));
  },2700);
  kick();
}
function markOpen(){const oi=(state.dv&&state.dv.t==="stop")?state.dv.i:-1;ST.forEach((o,k)=>{o.g.classList.toggle("open",k===oi);o.gx.classList.toggle("open",k===oi);});stage.classList.toggle("has-open",oi>=0);}

/* ================= drawer: stops and industries ================= */
const drawer=$("#drawer"),scrim=$("#scrim"),dBody=$("#dBody"),dKicker=$("#dKicker");
let lastFocus=null,closeTimer=0;
$("#dClose").innerHTML=ICON.x;
function view(st){return (state.mode==="ev"&&st.evx)?Object.assign({},st,st.evx):st;}
function statHTML(s){
  let bd="";
  if(s.bd){
    const tot=s.bd.reduce((a,b)=>a+b[1],0);
    const cols=s.bdc||["var(--ink)","color-mix(in srgb,var(--ink) 62%,var(--land))","color-mix(in srgb,var(--ink) 38%,var(--land))","color-mix(in srgb,var(--ink) 20%,var(--land))"];
    bd='<div class="bd" aria-hidden="true">'+s.bd.map((b,j)=>'<span style="width:'+(b[1]/tot*100).toFixed(2)+'%;background:'+cols[j%cols.length]+'"></span>').join("")+'</div>'+
       '<ul class="bd-list">'+s.bd.map((b,j)=>'<li><i style="background:'+cols[j%cols.length]+'"></i>'+esc(b[0])+' <b>'+esc(s.pct?b[1].toFixed(2)+"%":fmtIN(b[1]))+'</b></li>').join("")+'</ul>';
  }
  return '<figure class="stat">'+(s.v?'<p class="stat-v">'+esc(s.v)+'</p>':"")+'<p class="stat-l">'+esc(s.l)+'</p>'+bd+'<figcaption>Source: <a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.src)+'</a></figcaption></figure>';
}
function navBtns(pl,pn,nl,nn){
  $("#dPrev").innerHTML=ICON.left+"<span>"+esc(pl)+"</span>";$("#dPrev").setAttribute("aria-label","Previous: "+pn);
  $("#dNext").innerHTML="<span>"+esc(nl)+"</span>"+ICON.right;$("#dNext").setAttribute("aria-label","Next: "+nn);
  $("#dData").setAttribute("aria-pressed",String(state.json));$("#dData").textContent=state.json?"View details":"View data";
}
function renderStop(i){
  const st=DATA.stations[i],v=view(st);
  dKicker.textContent="Stop "+(i+1)+" of "+NS+" · "+st.phase;
  if(state.json){
    dBody.innerHTML='<h2 class="d-title" id="dTitle" tabindex="-1">'+esc(st.name)+'</h2><p class="d-hi">The data behind this stop</p><pre class="json">'+esc(JSON.stringify(st,null,2))+'</pre>';
  }else{
    dBody.innerHTML=[
      '<h2 class="d-title" id="dTitle" tabindex="-1">'+esc(st.name)+'</h2>',
      '<p class="d-hi" lang="hi">'+esc(st.hi)+'</p>',
      '<p class="d-tag">'+esc(v.tag)+'</p>',
      v.stat?statHTML(v.stat):"",
      '<h3 class="d-h">The route through this stop</h3><ol class="route">'+li(v.flow)+'</ol>',
      '<h3 class="d-h">What happens here</h3><p class="d-what">'+esc(v.what)+'</p>',
      '<div class="io"><div><h3 class="d-h">Goes in</h3><ul>'+li(v.inputs)+'</ul></div><div><h3 class="d-h">Comes out</h3><ul>'+li(v.outputs)+'</ul></div></div>',
      '<h3 class="d-h">Who does this</h3><div class="anchor"><strong>'+esc(v.anchor.n)+'</strong><span>'+esc(v.anchor.r)+'</span></div>',
      '<ul class="players">'+v.players.map(pl=>'<li><strong>'+esc(pl[0])+'</strong> <span>'+esc(pl[1])+'</span>'+(pl[2]?'<span class="unl">unlisted</span>':"")+'</li>').join("")+'</ul>',
      '<h3 class="d-h">What moves the economics</h3><ul class="drivers">'+li(v.drivers)+'</ul>',
      '<div class="note cash"><h3 class="d-h">How money moves</h3><p>'+esc(v.cash)+'</p></div>',
      '<div class="note ev"><h3 class="d-h">Electric shift</h3><p>'+esc(v.ev)+'</p></div>',
      st.links?'<div class="jumps">'+st.links.map(l=>'<button type="button" class="jump" data-go="'+esc(l.target)+'">'+esc(l.label)+'</button>').join("")+'</div>':""
    ].join("");
    const r=dBody.querySelector(".route");
    if(r){const items=r.querySelectorAll("li");r.style.setProperty("--h",items[items.length-1].offsetTop+"px");}
  }
  const pv=DATA.stations[(i-1+NS)%NS],nx=DATA.stations[(i+1)%NS];
  navBtns(pv.short,pv.name,nx.short,nx.name);
}
const nameOf=x=>CO[x]?CO[x].name:x;
const custName=l=>nameOf(l[1])+(l[4]?" ("+l[4]+")":"");
function custLine(id){
  const cl=LINKS.filter(l=>l[0]===id);if(!cl.length)return "";
  const groups=[];
  cl.forEach(l=>{const k=l[2]+"|"+l[3];let g=groups.find(x=>x.k===k);if(!g){g={k:k,detail:l[2],r:l[3]==="r",names:[]};groups.push(g);}g.names.push(custName(l));});
  return '<span class="role cust">Customers: '+esc(groups.map(g=>g.names.join(", ")+": "+g.detail+(g.r?" (reported, not re-verified)":"")).join("; "))+'</span>';
}
const SHORT_IND={"Auto Components & Equipments":"Auto Components","Non Banking Financial Company (NBFC)":"NBFC","Passenger Cars & Utility Vehicles":"Passenger Cars & UVs","Refineries & Marketing":"Refineries"};
const snapItem=(k,v)=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(String(v))+'</dd></div>';
function nodeData(n){
  return {id:n.id,name:n.name,column:COLS[n.col],what:n.what,
    screenerIndustries:n.ind.map(nm=>{const s=IND[nm];return s?{name:nm,companies:s[0],totalMcapCr:s[1],medianMcapCr:s[2],medianPE:s[3],salesGrowthPct:s[4],opmPct:s[5],wtdRocePct:s[6],median1YReturnPct:s[7]}:{name:nm};}),
    companies:n.cos.map(e=>{const c=CO[coId(e)];return c?{name:c.name,screener:c.url,mcapCr:c.mcap,pe:c.pe,latestQtrSalesCr:c.salesQ,qtrSalesYoYPct:c.yoy,rocePct:c.roce,screenerIndustry:c.ind,role:coNote(e)||c.role,toVerify:!!((e&&e.v)||(!coNote(e)&&c.verify)),customers:LINKS.filter(l=>l[0]===c.id).map(l=>({customer:custName(l),detail:l[2],basis:l[3]==="r"?"reported":"disclosed"}))}:null;}).filter(Boolean),
    suppliersToTheseMakers:n.cos.map(e=>coId(e)).filter(Boolean).flatMap(cid=>LINKS.filter(l=>l[1]===cid)).map(l=>({supplier:nameOf(l[0]),customer:custName(l),detail:l[2],basis:l[3]==="r"?"reported":"disclosed"})),
    verified:VERIFIED,
    namesWithoutData:(n.extra||[]).map(x=>({name:x[0],role:x[1],unlisted:!!x[2],toVerify:!!x[3]})),
    buysFrom:EDGES.filter(e=>e[1]===n.id).map(e=>e[0]),sellsTo:EDGES.filter(e=>e[0]===n.id).map(e=>e[1]),
    source:"Screener, fetched "+ASOF};
}
function renderNode(id){
  const n=NI[id],k=NODES.indexOf(n);
  dKicker.textContent="Industry "+(k+1)+" of "+NODES.length+" · "+COLS[n.col];
  if(state.json){
    dBody.innerHTML='<h2 class="d-title" id="dTitle" tabindex="-1">'+esc(n.name)+'</h2><p class="d-hi">The data behind this industry</p><pre class="json">'+esc(JSON.stringify(nodeData(n),null,2))+'</pre>';
  }else{
    let h='<h2 class="d-title" id="dTitle" tabindex="-1">'+esc(n.name)+'</h2><p class="d-lead">'+esc(n.what)+'</p>';
    n.ind.forEach(nm=>{const s=IND[nm];if(!s)return;h+='<p class="snap-cap">Screener industry: <b>'+esc(nm)+'</b></p><dl class="snap">'+snapItem("Companies",s[0])+snapItem("Total m-cap","₹"+lakhCr(s[1]))+snapItem("Median P/E",s[3])+snapItem("Weighted ROCE",s[6]+"%")+snapItem("Operating margin",s[5]+"%")+snapItem("Median 1Y return",(s[7]>0?"+":"")+s[7]+"%")+'</dl>';});
    const hit=state.dv&&state.dv.hit;
    const rows=n.cos.map(e=>({c:CO[coId(e)],note:coNote(e),v:!!(e&&e.v)})).filter(r=>r.c).sort((a,b)=>b.c.mcap-a.c.mcap);
    if(rows.length){
      h+='<h3 class="d-h">Listed companies mapped here, by market cap</h3><div class="tbl-wrap"><table class="cos"><thead><tr><th scope="col">Company</th><th scope="col">M-cap ₹ cr</th><th scope="col">P/E</th><th scope="col">ROCE %</th><th scope="col">Qtr sales YoY</th></tr></thead><tbody>'+
        rows.map(r=>{const c=r.c;const other=n.ind.indexOf(c.ind)<0?" · on Screener as "+(SHORT_IND[c.ind]||c.ind):"";
          return '<tr data-co="'+c.id+'"'+(hit===c.id?' class="hitrow"':"")+'><td><a href="'+esc(c.url)+'" target="_blank" rel="noopener noreferrer">'+esc(c.name)+'</a><span class="role">'+esc((r.note||c.role)+(r.v||(!r.note&&c.verify)?" (to verify)":"")+other)+'</span>'+custLine(c.id)+'</td><td data-l="M-cap ₹ cr">'+fmtCr(c.mcap)+'</td><td data-l="P/E">'+num(c.pe,1)+'</td><td data-l="ROCE %">'+num(c.roce,1)+'</td><td data-l="Sales YoY"'+(c.yoy!=null&&c.yoy<0?' class="neg"':"")+'>'+pct(c.yoy)+'</td></tr>';}).join("")+'</tbody></table></div>';
    }
    if(n.extra&&n.extra.length){h+='<h3 class="d-h">'+(rows.length?"Also here, no Screener data pulled":"Names in this industry, no Screener data pulled")+'</h3><ul class="extra">'+n.extra.map(x=>'<li><strong>'+esc(x[0])+'</strong> <span>'+esc(x[1])+'</span>'+(x[2]?'<span class="unl">unlisted</span>':"")+(x[3]?'<span class="unl">to verify</span>':"")+'</li>').join("")+'</ul>';}
    if(n.also){h+='<h3 class="d-h">Makers that also sell heavily here</h3><div class="nchips">'+n.also.map(cid=>'<button type="button" class="nchip" data-node="'+nodesOf(cid)[0]+'" data-hit="'+cid+'">'+esc(CO[cid].name)+'</button>').join("")+'</div>';}
    const sl=n.cos.map(e=>coId(e)).filter(Boolean).flatMap(cid=>LINKS.filter(l=>l[1]===cid));
    if(sl.length){h+='<h3 class="d-h">Suppliers with named links to these makers</h3><ul class="extra links">'+sl.map(l=>{const sn=CO[l[0]]?'<button type="button" class="linkbtn" data-node="'+nodesOf(l[0])[0]+'" data-hit="'+l[0]+'">'+esc(CO[l[0]].name)+'</button>':'<strong>'+esc(l[0])+'</strong>';return '<li>'+sn+' <span>to '+esc(custName(l))+': '+esc(l[2])+'</span><span class="unl">'+(l[3]==="r"?"reported":"disclosed")+'</span></li>';}).join("")+'</ul>';}
    const ins=EDGES.filter(e=>e[1]===id).map(e=>e[0]),outs=EDGES.filter(e=>e[0]===id).map(e=>e[1]);
    if(ins.length)h+='<h3 class="d-h">Buys from</h3><div class="nchips">'+ins.map(x=>'<button type="button" class="nchip in" data-node="'+x+'">'+esc(NI[x].name)+'</button>').join("")+'</div>';
    if(outs.length)h+='<h3 class="d-h">Sells to</h3><div class="nchips">'+outs.map(x=>'<button type="button" class="nchip out" data-node="'+x+'">'+esc(NI[x].name)+'</button>').join("")+'</div>';
    if(n.parts)h+='<h3 class="d-h">Where it sits in the car</h3><div class="nchips">'+n.parts.map(p=>'<button type="button" class="nchip" data-part="'+p+'">'+esc(PART[p].short||PART[p].name)+'</button>').join("")+'</div>';
    h+='<p class="caveat">Screener data fetched '+ASOF+'. Product lines and customer links checked against prospectuses, results presentations and exchange filings on '+VERIFIED+'; anything tagged to verify is unconfirmed. Industry figures come from Screener\'s industry overview; company rows are the largest names on each industry page. For lenders and insurers, sales means total income.</p>';
    dBody.innerHTML=h;
  }
  const pv=NODES[(k-1+NODES.length)%NODES.length],nx=NODES[(k+1)%NODES.length];
  navBtns(pv.name,pv.name,nx.name,nx.name);
}
function renderDrawer(){const dv=state.dv;if(!dv)return;if(dv.t==="stop")renderStop(dv.i);else renderNode(dv.id);dBody.scrollTop=0;}
function openDrawer(){
  if(drawer.hidden){
    clearTimeout(closeTimer);lastFocus=document.activeElement;
    drawer.hidden=false;scrim.hidden=false;document.body.classList.add("drawer-open");
    void drawer.offsetWidth;drawer.classList.add("show");scrim.classList.add("show");
  }
  const t=$("#dTitle");if(t)t.focus({preventScroll:true});
}
function openStop(i){state.dv={t:"stop",i:i};state.json=false;renderDrawer();markOpen();webHi(null);openDrawer();}
function openNode(id,hit){
  state.dv={t:"node",id:id,hit:hit||null};state.json=false;renderDrawer();markOpen();webHi(null);openDrawer();
  if(hit){const row=dBody.querySelector('tr[data-co="'+hit+'"]');if(row)row.scrollIntoView({block:"center"});}
}
function closeStop(){
  if(drawer.hidden)return;
  drawer.classList.remove("show");scrim.classList.remove("show");document.body.classList.remove("drawer-open");
  const dv=state.dv;state.dv=null;markOpen();webHi(null);
  closeTimer=setTimeout(()=>{drawer.hidden=true;scrim.hidden=true;},reduceMQ.matches?0:360);
  const back=(lastFocus&&document.contains(lastFocus))?lastFocus:(dv&&dv.t==="stop"&&ST[dv.i]?ST[dv.i].g:null);
  if(back&&back.focus)back.focus({preventScroll:true});
}
function step(d){
  const dv=state.dv;if(!dv)return;
  if(dv.t==="stop")openStop((dv.i+d+NS)%NS);
  else{const k=NODES.findIndex(n=>n.id===dv.id);openNode(NODES[(k+d+NODES.length)%NODES.length].id);}
}
function goSection(sel,focusSel){const sec=$(sel);if(!sec)return;sec.scrollIntoView({behavior:smooth(),block:"start"});const h=focusSel&&$(focusSel);if(h)h.focus({preventScroll:true});}
function goPart(id){closeStop();goSection("#heart");selectPart(id);}
function goPw(id){closeStop();goSection("#part");selectPw(id);}
function goNodeFromPage(id,hit){$("#web").scrollIntoView({behavior:smooth(),block:"start"});setTimeout(()=>openNode(id,hit),reduceMQ.matches?0:420);}
$("#dClose").addEventListener("click",closeStop);
scrim.addEventListener("click",closeStop);
$("#dPrev").addEventListener("click",()=>step(-1));
$("#dNext").addEventListener("click",()=>step(1));
$("#dData").addEventListener("click",()=>{state.json=!state.json;renderDrawer();});
dBody.addEventListener("click",e=>{
  const go=e.target.closest("[data-go]");
  if(go){const t=go.getAttribute("data-go");
    if(t.indexOf("node:")===0){$("#web").scrollIntoView({behavior:"auto",block:"start"});openNode(t.slice(5));}
    else{closeStop();goSection(t,t==="#heart"?"#h2":null);}
    return;}
  const nb=e.target.closest("[data-node]");
  if(nb){$("#web").scrollIntoView({behavior:"auto",block:"start"});openNode(nb.getAttribute("data-node"),nb.getAttribute("data-hit"));return;}
  const pb=e.target.closest("[data-part]");
  if(pb){goPart(pb.getAttribute("data-part"));}
});
drawer.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.preventDefault();closeStop();return;}
  const inTable=e.target.closest&&e.target.closest(".tbl-wrap,pre");
  if(!inTable&&e.key==="ArrowRight"&&!e.altKey&&!e.metaKey&&!e.ctrlKey){e.preventDefault();step(1);return;}
  if(!inTable&&e.key==="ArrowLeft"&&!e.altKey&&!e.metaKey&&!e.ctrlKey){e.preventDefault();step(-1);return;}
  if(e.key==="Tab"){
    const f=$$("button,a[href],[tabindex]:not([tabindex='-1'])",drawer).filter(x=>!x.disabled&&x.getClientRects().length);
    if(!f.length)return;
    const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
  }
});

/* ================= Level 2: the web ================= */
const webSvg=$("#webSvg");
const COLX=[80,250,420,590,760,930,1110],WT=56,WB=700;
const webBox=webSvg.parentElement;
let wEdges=[],wNodes=[],wEdgeG=null,webLay={mode:null,W:0};
function webModeFor(w){return w>=960?"h":"v";}
function renderWeb(){
  const cw0=Math.round(webBox.clientWidth)||960,mode=webModeFor(cw0);
  webLay={mode:mode,W:cw0};
  while(webSvg.firstChild)webSvg.removeChild(webSvg.firstChild);
  webSvg.classList.toggle("vert",mode==="v");
  const byCol=COLS.map(()=>[]);NODES.forEach(n=>byCol[n.col].push(n));
  NODES.forEach(n=>{n.tot=n.cos.reduce((a,e)=>{const id=coId(e);return a+(CO[id]?CO[id].mcap:0);},0);
    n.r=n.tot?Math.min(30,7+5*Math.sqrt(n.tot/1e5)):(n.sub?18:8);});
  const gH=el("g",{"aria-hidden":"true"},webSvg);
  let W,H,cell=136;
  if(mode==="h"){
    W=1200;H=790;
    byCol.forEach((arr,c)=>{const cnt=arr.length;arr.forEach((n,i)=>{n.x=COLX[c];n.y=Math.round(WT+(i+.5)*(WB-WT)/cnt);});});
    COLS.forEach((t,c)=>{const tx=el("text",{class:"wcol",x:COLX[c],y:26},gH);tx.textContent=t;});
    webSvg.removeAttribute("width");webSvg.removeAttribute("height");
  }else{
    W=Math.max(280,cw0);const pad=W<420?6:14,k=W>=720?4:(W>=480?3:2);cell=(W-2*pad)/k;
    let y=4;
    byCol.forEach((arr,c)=>{
      if(c>0)el("line",{class:"wsep",x1:pad,x2:W-pad,y1:y,y2:y},gH);
      const tx=el("text",{class:"wcol wcol-v",x:pad,y:y+24},gH);tx.textContent=COLS[c];y+=36;
      for(let i=0;i<arr.length;i+=k){
        const row=arr.slice(i,i+k),rr=Math.max.apply(null,row.map(n=>n.r)),cy=y+rr+4,off=(k-row.length)*cell/2;
        row.forEach((n,j)=>{n.x=Math.round(pad+off+cell*(j+.5));n.y=Math.round(cy);});
        const ml=Math.max.apply(null,row.map(n=>n.lab.length));
        y=cy+rr+15+ml*14+12;
      }
      y+=10;
    });
    H=Math.round(y);
    webSvg.setAttribute("width",W);webSvg.setAttribute("height",H);
  }
  webSvg.setAttribute("viewBox","0 0 "+W+" "+H);
  wEdgeG=el("g",{"aria-hidden":"true"},webSvg);
  wEdges=EDGES.map(e=>{
    const A=NI[e[0]],B=NI[e[1]];let d,back=false;
    if(mode==="h"){
      if(A.col===B.col){const bx=A.x+54;d="M"+A.x+" "+A.y+"C"+bx+" "+A.y+" "+bx+" "+B.y+" "+B.x+" "+B.y;}
      else if(B.col<A.col){back=true;const yb=776;d="M"+A.x+" "+A.y+"C"+(A.x+40)+" "+yb+" "+(B.x-40)+" "+yb+" "+B.x+" "+B.y;}
      else{const dx=(B.x-A.x)*.5;d="M"+A.x+" "+A.y+"C"+(A.x+dx)+" "+A.y+" "+(B.x-dx)+" "+B.y+" "+B.x+" "+B.y;}
    }else{
      if(A.col===B.col){const by=Math.min(A.y,B.y)-Math.max(A.r,B.r)-18;d="M"+A.x+" "+A.y+"C"+A.x+" "+by+" "+B.x+" "+by+" "+B.x+" "+B.y;}
      else if(B.col<A.col){back=true;const bx=W-3;d="M"+A.x+" "+A.y+"C"+bx+" "+A.y+" "+bx+" "+B.y+" "+B.x+" "+B.y;}
      else{const dy=(B.y-A.y)*.5;d="M"+A.x+" "+A.y+"C"+A.x+" "+(A.y+dy)+" "+B.x+" "+(B.y-dy)+" "+B.x+" "+B.y;}
    }
    const p=el("path",{class:"wedge"+(back?" back":""),d:d},wEdgeG);p._a=e[0];p._b=e[1];return p;});
  const gN=el("g",null,webSvg),hw=Math.min(136,Math.floor(cell)-4);
  wNodes=NODES.map(n=>{
    const g=el("g",{class:"wnode"+((n.tot||n.sub)?"":" nodata"),tabindex:"0",role:"button","aria-label":n.name+". "+(n.tot?"Listed market cap mapped here: rupees "+lakhCr(n.tot)+". ":"No company data pulled. ")+"Open details."},gN);
    g._id=n.id;
    el("circle",{class:"core",cx:n.x,cy:n.y,r:n.r.toFixed(1)},g);
    let y=n.y+n.r+15;
    n.lab.forEach(t=>{const tx=el("text",{class:"nm",x:n.x,y:y},g);tx.textContent=t;y+=14;});
    const m=el("text",{class:"mc",x:n.x,y:y},g);m.textContent=n.tot?"₹"+lakhCr(n.tot):(n.sub||"names only");
    const top=n.y-n.r-6,hit=el("rect",{class:"whit",x:n.x-hw/2,y:top,width:String(hw),height:(y+6-top).toFixed(0),fill:"transparent"});g.insertBefore(hit,g.firstChild);
    g.addEventListener("mouseenter",()=>webHi(n.id));g.addEventListener("mouseleave",()=>webHi(null));
    g.addEventListener("focus",()=>webHi(n.id));g.addEventListener("blur",()=>webHi(null));
    g.addEventListener("click",()=>openNode(n.id));
    g.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();openNode(n.id);}});
    return g;});
  webHi(null);
}
let webRq=0;
new ResizeObserver(()=>{cancelAnimationFrame(webRq);webRq=requestAnimationFrame(()=>{
  const w=Math.round(webBox.clientWidth);if(!w)return;
  const m=webModeFor(w);if(m!==webLay.mode||(m==="v"&&Math.abs(w-webLay.W)>2)){const f=document.activeElement&&document.activeElement.closest&&document.activeElement.closest(".wnode");const fid=f?f._id:null;renderWeb();if(fid){const g=wNodes.find(x=>x._id===fid);if(g)g.focus({preventScroll:true});}}
});}).observe(webBox);
function webHi(id){
  if(!id)id=state.dv&&state.dv.t==="node"?state.dv.id:null;
  if(!id){webSvg.classList.remove("hov");wEdges.forEach(p=>p.classList.remove("in","out"));wNodes.forEach(g=>g.classList.remove("on","nb"));return;}
  webSvg.classList.add("hov");const nb=new Set();
  wEdges.forEach(p=>{const o=p._a===id,i=p._b===id;p.classList.toggle("out",o);p.classList.toggle("in",i);if(o)nb.add(p._b);if(i)nb.add(p._a);if(o||i)wEdgeG.appendChild(p);});
  wNodes.forEach(g=>{g.classList.toggle("on",g._id===id);g.classList.toggle("nb",nb.has(g._id));});
}
/* find a company */
const ALIAS={"shriram pistons":"spr","shriram pistons & rings":"spr","tide water":"veedol","tide water oil":"veedol","wabco":"zfcv","sona comstar":"sona","m&m":"mm","mahindra":"mm","tata motors cv":"tmcv","sml isuzu":"sml","amara raja":"amararaja","motherson":"motherson","bkt":"bkt","himadri":"himadri","vedanta":"vaml"};
(function(){const dl=$("#coList");Object.values(CO).sort((a,b)=>a.name.localeCompare(b.name)).forEach(c=>{const o=document.createElement("option");o.value=c.name;dl.appendChild(o);});})();
function findCo(){
  const q=$("#coFind").value.trim().toLowerCase(),msg=$("#findMsg");
  if(!q){msg.textContent="";return;}
  let id=ALIAS[q]||null;
  if(!id){const all=Object.values(CO);const c=all.find(x=>x.name.toLowerCase()===q)||all.find(x=>x.name.toLowerCase().startsWith(q))||all.find(x=>x.name.toLowerCase().indexOf(q)>=0);id=c?c.id:null;}
  if(!id){msg.textContent="Not in this map yet.";return;}
  const ns=nodesOf(id);
  if(!ns.length){msg.textContent="Found, but not placed in the web.";return;}
  msg.textContent=CO[id].name+" sits in: "+ns.map(x=>NI[x].name).join(", ");
  openNode(ns[0],id);
}
$("#findForm").addEventListener("submit",e=>{e.preventDefault();findCo();});
$("#coFind").addEventListener("input",()=>{const v=$("#coFind").value.trim().toLowerCase();if(Object.values(CO).some(c=>c.name.toLowerCase()===v))findCo();});

/* ================= Level 3: the car ================= */
const car=$("#car");
function coItem(e){
  const id=coId(e);
  if(id&&CO[id]){const c=CO[id];return '<li><strong>'+esc(c.name)+'</strong> <span>'+esc(coNote(e)||c.role)+'</span><span class="mc">₹'+fmtCr(c.mcap)+' cr</span>'+((e&&e.v)||(!coNote(e)&&c.verify)?'<span class="unl">to verify</span>':"")+'</li>';}
  if(Array.isArray(e))return '<li><strong>'+esc(e[0])+'</strong> <span>'+esc(e[1])+'</span>'+(e[2]?'<span class="unl">unlisted</span>':"")+(e[3]?'<span class="unl">to verify</span>':"")+'</li>';
  return "";
}
(function buildCells(){const g=$("#cells");for(let c=0;c<14;c++){for(let r=0;r<2;r++){el("rect",{class:"e-solid cell",x:(322+c*24.4).toFixed(1),y:(295+r*13.5).toFixed(1),width:"21",height:"10.5",rx:"1.5",style:"animation-delay:"+(c*.09).toFixed(2)+"s"},g);}}})();
function selectPart(id){
  const p=PART[id];if(!p)return;
  if(p.mode==="ev"&&state.mode!=="ev")setMode("ev");
  state.part=id;
  $$(".part",car).forEach(g=>g.classList.toggle("sel",g.getAttribute("data-part")===id));
  car.classList.add("has-sel");
  $$("#partIndex .chip").forEach(c=>c.setAttribute("aria-pressed",String(c.getAttribute("data-part")===id)));
  renderPartCard();
}
function clearPart(){state.part=null;$$(".part",car).forEach(g=>g.classList.remove("sel"));car.classList.remove("has-sel");$$("#partIndex .chip").forEach(c=>c.setAttribute("aria-pressed","false"));}
const STATUS={ice:"Only in petrol and diesel cars",both:"Carries over to electric cars",ev:"New in electric cars"};
function renderPartCard(){
  const box=$("#partCard"),id=state.part;
  if(!id){box.innerHTML='<p class="pc-status">Pick a part</p><h3 class="pc-name">Tap anything in the drawing</h3><p class="pc-what">Orange parts exist only in petrol and diesel cars. Green parts appear only in electric cars. Outlined parts carry over either way. Each part lists who makes it in India, with Screener market cap where the company is in the web.</p>';return;}
  const p=PART[id],ghost=p.mode==="ice"&&state.mode==="ev";
  box.innerHTML='<p class="pc-status"><span class="sw sw-'+p.mode+'"></span>'+esc(ghost?"Removed in an electric car":STATUS[p.mode])+'</p>'+
    '<h3 class="pc-name">'+esc(p.name)+'</h3><p class="pc-what">'+esc(p.what)+'</p>'+
    '<h4 class="pc-h">Who makes it in India</h4><ul class="pc-co">'+p.co.map(coItem).join("")+'</ul>'+
    '<h4 class="pc-h">Why it matters</h4><p class="pc-why">'+esc(p.why)+'</p>'+
    (p.verify?'<p class="pc-verify">The supplier mapping for this part is indicative. Check company segment disclosures before relying on it.</p>':"")+
    '<div class="jumps"><button type="button" class="jump" data-node="'+p.node+'">Open the industry: '+esc(NI[p.node].name)+'</button>'+(p.pw?'<button type="button" class="jump ghost" data-pw="'+p.pw+'">See how it works inside</button>':"")+'</div>';
}
function renderIndex(){
  const groups=[["ice","Shrinks as EVs grow"],["both","Carries over"],["ev","Grows with EVs"]];
  $("#partIndex").innerHTML=groups.map(g=>'<div class="pi-group"><h3><span class="sw sw-'+g[0]+'"></span>'+g[1]+'</h3><div class="chips">'+
    DATA.parts.filter(p=>p.mode===g[0]).map(p=>'<button type="button" class="chip s-'+g[0]+'" data-part="'+p.id+'" aria-pressed="false">'+esc(p.short||p.name)+'</button>').join("")+'</div></div>').join("");
}
$("#partIndex").addEventListener("click",e=>{const c=e.target.closest(".chip");if(c){selectPart(c.getAttribute("data-part"));reveal($("#partCard"));}});
$$(".part",car).forEach(g=>{
  g.addEventListener("click",()=>{selectPart(g.getAttribute("data-part"));reveal($("#partCard"));});
  g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectPart(g.getAttribute("data-part"));}});
});
$("#partCard").addEventListener("click",e=>{
  const n=e.target.closest("[data-node]");if(n){goNodeFromPage(n.getAttribute("data-node"));return;}
  const w=e.target.closest("[data-pw]");if(w){goPw(w.getAttribute("data-pw"));}
});

/* ================= Level 4: engine and motor ================= */
const PH=["#D23F31","#D9A400","#2E6AD1"],SLOT_PH=[0,2,1,0,2,1],SLOT_SG=[1,-1,1,-1,1,-1];
const egPiston=$("#egPiston"),egRod=$("#egRod"),egCrank=$("#egCrank"),egCamI=$("#egCamI"),egCamE=$("#egCamE"),egVi=$("#egVi"),egVe=$("#egVe"),egGas=$("#egGas"),egSpark=$("#egSpark"),egSpray=$("#egSpray"),crankRead=$("#crankRead");
const egIn=$("#egInPath"),egEx=$("#egExPath"),egInL=egIn.getTotalLength(),egExL=egEx.getTotalLength();
const egDots=[];for(let j=0;j<7;j++)egDots.push(el("circle",{r:"3.2",opacity:"0"},$("#egDots")));
const strokeLis=$$("#strokes li");let lastStroke=-1,lastDeg=-1;
function engineFrame(th){
  const R=44,L=150,CY=358,rad=th*Math.PI/180,sx=R*Math.sin(rad),sy=R*Math.cos(rad);
  const s=sy+Math.sqrt(L*L-sx*sx),pinY=CY-s,top=pinY-30;
  egPiston.setAttribute("transform","translate(0 "+top.toFixed(2)+")");
  egRod.setAttribute("y1",pinY.toFixed(2));egRod.setAttribute("x2",(210+sx).toFixed(2));egRod.setAttribute("y2",(CY-sy).toFixed(2));
  egCrank.setAttribute("transform","rotate("+(th%360).toFixed(2)+" 210 "+CY+")");
  egCamI.setAttribute("transform","rotate("+(th/2-45).toFixed(2)+")");
  egCamE.setAttribute("transform","rotate("+(th/2-315).toFixed(2)+")");
  const lv=th<180?14*Math.sin(Math.PI*th/180):0,le=th>=540?14*Math.sin(Math.PI*(th-540)/180):0;
  egVi.setAttribute("transform","translate(0 "+lv.toFixed(2)+")");egVe.setAttribute("transform","translate(0 "+le.toFixed(2)+")");
  const st=Math.floor(th/180)%4,u=(th%180)/180;
  let col;
  if(st===0)col="rgba(111,176,240,"+(.18+.22*u).toFixed(3)+")";
  else if(st===1)col="rgba(111,176,240,"+(.4+.4*u).toFixed(3)+")";
  else if(st===2)col="rgba(255,"+Math.round(180-80*u)+",60,"+(.95-.5*u).toFixed(3)+")";
  else col="rgba(150,158,166,"+(.5-.38*u).toFixed(3)+")";
  egGas.setAttribute("fill",col);egGas.setAttribute("height",Math.max(0,top-128).toFixed(2));
  egSpark.setAttribute("opacity",(th>=352&&th<=374)?"1":"0");
  egSpray.setAttribute("opacity",(th>=15&&th<=115)?".95":"0");
  for(let j=0;j<egDots.length;j++){
    const d=egDots[j];
    if(st===0||st===3){
      const f=(u*1.6+j/egDots.length)%1,pt=st===0?egIn.getPointAtLength(f*egInL):egEx.getPointAtLength(f*egExL);
      d.setAttribute("cx",pt.x.toFixed(1));d.setAttribute("cy",pt.y.toFixed(1));
      d.setAttribute("fill",st===0?"rgba(111,176,240,.95)":"rgba(150,158,166,.95)");d.setAttribute("opacity","1");
    }else d.setAttribute("opacity","0");
  }
  if(st!==lastStroke){strokeLis.forEach((x,i)=>x.classList.toggle("on",i===st));lastStroke=st;}
  const deg=Math.round(th);if(deg!==lastDeg){crankRead.textContent="Crank angle "+deg+" of 720 degrees";lastDeg=deg;}
}
const mtField=$("#mtField"),mtMags=$("#mtMags");let coilEls=[],mtCursor=null;
(function buildMotor(){
  const gT=$("#mtTeeth"),gC=$("#mtCoils"),gW=$("#mtWave");
  for(let k=0;k<12;k++){
    const rot="rotate("+(k*30)+" 210 200)";
    el("rect",{class:"mt-tooth",x:"203",y:"44",width:"14",height:"48",transform:rot},gT);
    coilEls.push(el("rect",{class:"mt-coil",x:"197",y:"52",width:"26",height:"34",rx:"4",fill:PH[SLOT_PH[k%6]],"fill-opacity":".4",transform:rot},gC));
  }
  for(let m=0;m<4;m++){
    const rot="rotate("+(m*90)+" 210 200)",n=m%2===0;
    el("rect",{class:"mt-mag "+(n?"n":"s"),x:"186",y:"100",width:"48",height:"12",rx:"3",transform:rot},mtMags);
    const t=el("text",{class:"mt-pole "+(n?"n":"s"),x:"210",y:"124",transform:rot},mtMags);t.textContent=n?"N":"S";
  }
  el("line",{class:"mt-axis",x1:"150",y1:"421",x2:"400",y2:"421"},gW);
  for(let ph=0;ph<3;ph++){let d="";for(let j=0;j<=250;j+=5){const t=j/250*4*Math.PI,y=421-22*Math.sin(t-ph*2*Math.PI/3);d+=(j?"L":"M")+(150+j)+" "+y.toFixed(1);}el("path",{class:"mt-wave",d:d,stroke:PH[ph]},gW);}
  mtCursor=el("line",{class:"mt-cursor",x1:"150",y1:"394",x2:"150",y2:"448"},gW);
  const cap=el("text",{class:"pw-read",x:"275",y:"464","text-anchor":"middle"},gW);cap.textContent="Phase currents over one turn of the rotor";
})();
function motorFrame(phi){
  const I=[Math.sin(phi),Math.sin(phi-2.0944),Math.sin(phi-4.1888)];
  for(let k=0;k<12;k++){const m=k%6;coilEls[k].setAttribute("fill-opacity",(.12+.88*Math.abs(SLOT_SG[m]*I[SLOT_PH[m]])).toFixed(3));}
  const F=(phi*180/Math.PI-90)/2;
  mtField.setAttribute("transform","rotate("+F.toFixed(2)+" 210 200)");
  mtMags.setAttribute("transform","rotate("+(F+76).toFixed(2)+" 210 200)");
  const x=150+(((phi%(4*Math.PI))+4*Math.PI)%(4*Math.PI))/(4*Math.PI)*250;
  mtCursor.setAttribute("x1",x.toFixed(1));mtCursor.setAttribute("x2",x.toFixed(1));
}
const pw={th:366,phi:2.2,slow:true,raf:0,last:0,on:false};
const pwRun=()=>!state.paused&&pw.on&&!document.hidden;
function pwKick(){if(!pw.raf&&pwRun()){pw.last=performance.now();pw.raf=requestAnimationFrame(pwFrame);}}
function pwFrame(now){
  pw.raf=0;const dt=Math.min(.05,Math.max(0,(now-pw.last)/1000));pw.last=now;
  const ec=pw.slow?4.4:1.1,mc=pw.slow?2.6:.6;
  pw.th=(pw.th+720*dt/ec)%720;pw.phi=(pw.phi+2*Math.PI*dt/mc)%(4*Math.PI);
  engineFrame(pw.th);motorFrame(pw.phi);
  if(pwRun())pw.raf=requestAnimationFrame(pwFrame);
}
$("#slowBtn").addEventListener("click",()=>{pw.slow=!pw.slow;$("#slowBtn").setAttribute("aria-pressed",String(pw.slow));});
function selectPw(id){
  if(!PW[id])return;state.pw=id;
  $$("[data-pw]",$("#part")).forEach(x=>x.classList.toggle("sel",x.getAttribute("data-pw")===id&&!x.closest(".pw-lbl")&&!x.classList.contains("chip")));
  $$("#pwIndex .chip").forEach(c=>c.setAttribute("aria-pressed",String(c.getAttribute("data-pw")===id)));
  renderPwCard();
}
function renderPwCard(){
  const box=$("#pwCard"),id=state.pw;
  if(!id){box.innerHTML='<p class="pc-status">Pick a part</p><h3 class="pc-name">Tap a labelled part in either drawing</h3><p class="pc-what">The engine runs through intake, compression, power and exhaust every two turns of the crank. The motor has no strokes: three phase currents take turns, so the field and the rotor turn smoothly.</p>';return;}
  const p=PW[id];
  box.innerHTML='<p class="pc-status">'+esc(p.kind)+'</p><h3 class="pc-name">'+esc(p.name)+'</h3><p class="pc-what">'+esc(p.what)+'</p>'+
    (p.co.length?'<h4 class="pc-h">Who makes it in India</h4><ul class="pc-co">'+p.co.map(coItem).join("")+'</ul>':"")+
    '<h4 class="pc-h">Why it matters</h4><p class="pc-why">'+esc(p.why)+'</p>'+
    (p.verify?'<p class="pc-verify">The supplier mapping for this part is indicative. Check company segment disclosures before relying on it.</p>':"")+
    '<div class="jumps"><button type="button" class="jump" data-node="'+p.node+'">Open the industry: '+esc(NI[p.node].name)+'</button><button type="button" class="jump ghost" data-part="'+p.car+'">Find it in the car</button></div>';
}
(function(){const box=$("#pwIndex");if(!box)return;
  box.innerHTML=[["Engine part","Engine parts","ice"],["Motor part","Motor parts","ev"]].map(g=>'<div class="pi-group"><h3><span class="sw sw-'+g[2]+'"></span>'+g[1]+'</h3><div class="chips">'+Object.keys(PW).filter(k=>PW[k].kind===g[0]).map(k=>'<button type="button" class="chip s-'+g[2]+'" data-pw="'+k+'" aria-pressed="false">'+esc(PW[k].name)+'</button>').join("")+'</div></div>').join("");})();
$$("#part [data-pw]").forEach(x=>{
  x.addEventListener("click",()=>{selectPw(x.getAttribute("data-pw"));reveal($("#pwCard"));});
  x.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectPw(x.getAttribute("data-pw"));}});
});
$("#pwCard").addEventListener("click",e=>{
  const n=e.target.closest("[data-node]");if(n){goNodeFromPage(n.getAttribute("data-node"));return;}
  const pb=e.target.closest("[data-part]");if(pb){goPart(pb.getAttribute("data-part"));}
});

/* ================= global controls ================= */
function setMode(m){
  if(state.mode===m)return;state.mode=m;
  document.body.classList.toggle("mode-ev",m==="ev");
  $$(".plate").forEach(b=>b.setAttribute("aria-pressed",String(b.getAttribute("data-mode")===m)));
  car.classList.toggle("ev",m==="ev");
  if(state.dv)renderDrawer();
  if(m==="ice"&&state.part&&PART[state.part].mode==="ev")clearPart();
  renderPartCard();
  if(!raf)draw();
}
function setFlow(f){state.flow=f;$$(".seg button").forEach(b=>b.setAttribute("aria-pressed",String(b.getAttribute("data-flow")===f)));if(!raf){snapAlphas();draw();}}
const pp=$("#pp");
function setPaused(p){
  state.paused=p;document.body.classList.toggle("paused",p);
  pp.innerHTML=(p?ICON.play:ICON.pause)+"<span>"+(p?"Play":"Pause")+"</span>";pp.setAttribute("aria-label",p?"Play animations":"Pause animations");
  pp.setAttribute("aria-label",p?"Play animations":"Pause animations");
  if(p){if(raf){cancelAnimationFrame(raf);raf=0;}if(pw.raf){cancelAnimationFrame(pw.raf);pw.raf=0;}if(LAY){snapAlphas();draw();}}
  else{document.body.classList.add("motion-ok");kick();pwKick();}
}
$$(".plate").forEach(b=>b.addEventListener("click",()=>setMode(b.getAttribute("data-mode"))));
$$(".seg button").forEach(b=>b.addEventListener("click",()=>setFlow(b.getAttribute("data-flow"))));
pp.addEventListener("click",()=>setPaused(!state.paused));

/* ================= start ================= */
setPaused(state.paused);
renderIndex();renderPartCard();renderWeb();renderPwCard();
engineFrame(pw.th);motorFrame(pw.phi);
renderLoop();
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>{if(LAY)renderLoop();});}
let rq=0;
new ResizeObserver(()=>{cancelAnimationFrame(rq);rq=requestAnimationFrame(()=>{const W=Math.round(loopEl.clientWidth);if(!LAY||Math.abs(W-LAY.W)>1)renderLoop();});}).observe(loopEl);
new IntersectionObserver(es=>{onScreen=es[0].isIntersecting;if(onScreen)kick();},{rootMargin:"120px"}).observe(stage);
new IntersectionObserver(es=>{car.classList.toggle("off",!es[0].isIntersecting);},{rootMargin:"80px"}).observe(car);
new IntersectionObserver(es=>{$("#web").classList.toggle("off",!es[0].isIntersecting);},{rootMargin:"80px"}).observe($("#web"));
new IntersectionObserver(es=>{pw.on=es[0].isIntersecting;if(pw.on)pwKick();},{rootMargin:"80px"}).observe($("#part"));
document.addEventListener("visibilitychange",()=>{if(!document.hidden){kick();pwKick();}});

/* ================= header menu (tablets and phones) ================= */
(function(){
  const btn=$("#menuBtn"),menu=$("#barMenu");if(!btn||!menu)return;
  const mq=window.matchMedia("(max-width: 900px)");
  function setOpen(o){menu.classList.toggle("open",o);btn.setAttribute("aria-expanded",String(o));btn.setAttribute("aria-label",o?"Close menu":"Open menu");}
  btn.addEventListener("click",e=>{e.stopPropagation();setOpen(!menu.classList.contains("open"));});
  menu.addEventListener("click",e=>{if(e.target.closest("a"))setOpen(false);});
  document.addEventListener("click",e=>{if(menu.classList.contains("open")&&!menu.contains(e.target)&&e.target!==btn)setOpen(false);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&menu.classList.contains("open")){setOpen(false);btn.focus();}});
  (mq.addEventListener?mq.addEventListener.bind(mq,"change"):mq.addListener.bind(mq))(()=>{if(!mq.matches)setOpen(false);});
})();
/* sources: expanded on wide screens, collapsed on phones */
(function(){const d=document.querySelector(".src-more");if(d&&window.matchMedia("(min-width: 861px)").matches)d.open=true;})();
})();
