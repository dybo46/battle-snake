import {RIM_BRIGHT_BACKGROUNDS} from './rim-bright-backgrounds.js';
import {outlinedSkins,drawBlockOutline,BRIGHT_BACKGROUND_TRIALS} from './block-outlines.js';
import {WORLD_BACKGROUNDS,paintWorldFloor} from './world-backgrounds.js';
import {EXTRA_SKINS,themedStone,themedCharacter} from './skin-themes.js';
import {DIRS,COLORS} from './core.js';
const ORIGINAL_SKINS=[
 {id:'ah1',name:'クラシック',ref:'ah1',note:'丸い鼻付きキャラと石ブロック',floor:['#fff6da','#ecddb3'],wall:'#a8aca9',material:'stone'},
 {id:'ak1',name:'白い陶器',ref:'ak1',note:'なめらかな白磁と艶のある石',floor:['#fffefa','#e4e8e8'],wall:'#d6d7d0',material:'porcelain'},
 {id:'ak2',name:'木のおもちゃ',ref:'ak2',note:'木目のキャラと木のブロック',floor:['#edcc96','#c59a61'],wall:'#ba874c',material:'wood'},
 {id:'ak3',name:'やわらかな粘土',ref:'ak3',note:'素焼きのキャラと石ブロック',floor:['#ce8661','#a85f43'],wall:'#ce9c79',material:'clay'},
 {id:'ak4',name:'ガラスのビー玉',ref:'ak4',note:'光を通すキャラとガラスの石',floor:['#b7e9ed','#6bb9c6'],wall:'#86cbd5',material:'glass'},
 ...EXTRA_SKINS
];
export const SKINS=outlinedSkins(ORIGINAL_SKINS);
const PREVIOUS_BACKGROUNDS=[...BRIGHT_BACKGROUND_TRIALS,...[{"id": "sand", "name": "砂色", "file": "./backgrounds/sand.svg", "floor": ["#fff6da", "#ecddb3"], "color": "#ecddb3"}, {"id": "board-green", "name": "盤面グリーン", "floor": ["#18734A", "#18734A"], "color": "#18734A"}, {"id": "table-green", "name": "テーブル緑", "floor": ["#236143", "#236143"], "color": "#236143"}, {"id": "arcade-green", "name": "暗いアーケード緑", "floor": ["#173D12", "#173D12"], "color": "#173D12"}, {"id": "forest", "name": "深緑", "floor": ["#183C2B", "#183C2B"], "color": "#183C2B"}, {"id": "teal", "name": "青緑", "floor": ["#02352f", "#02352f"], "color": "#02352f"}, {"id": "velvet-green", "name": "ベルベット緑", "floor": ["#033322", "#033322"], "color": "#033322"}, {"id": "velvet-blue", "name": "ベルベット青", "floor": ["#071d4b", "#071d4b"], "color": "#071d4b"}, {"id": "velvet-plum", "name": "ベルベット紫", "floor": ["#300734", "#300734"], "color": "#300734"}, {"id": "bordeaux", "name": "ボルドー", "floor": ["#3d061e", "#3d061e"], "color": "#3d061e"}, {"id": "navy", "name": "ネイビー", "floor": ["#06183c", "#06183c"], "color": "#06183c"}, {"id": "slate", "name": "スレート", "floor": ["#121d32", "#121d32"], "color": "#121d32"}, {"id": "charcoal", "name": "チャコール", "floor": ["#0d1925", "#0d1925"], "color": "#0d1925"}, {"id": "midnight", "name": "ミッドナイト", "floor": ["#181D28", "#181D28"], "color": "#181D28"}, {"id": "olive", "name": "オリーブ", "floor": ["#1e2b06", "#1e2b06"], "color": "#1e2b06"}, {"id": "cocoa", "name": "ココア", "floor": ["#2e1008", "#2e1008"], "color": "#2e1008"}, {"id": "petrol", "name": "ペトロール", "floor": ["#042b3b", "#042b3b"], "color": "#042b3b"}, {"id": "dark-gray", "name": "暗い灰色", "floor": ["#17181b", "#17181b"], "color": "#17181b"}],...WORLD_BACKGROUNDS];
const FIRST_BACKGROUNDS=['sand','arcade-green','midnight'];
export const BACKGROUNDS=[...FIRST_BACKGROUNDS.map(id=>PREVIOUS_BACKGROUNDS.find(b=>b.id===id)),...BRIGHT_BACKGROUND_TRIALS,...RIM_BRIGHT_BACKGROUNDS,...PREVIOUS_BACKGROUNDS.filter(b=>!FIRST_BACKGROUNDS.includes(b.id)&&!BRIGHT_BACKGROUND_TRIALS.some(t=>t.id===b.id))];
export const LEGACY_BACKGROUNDS={ah1:"sand",ak1:"sand",ak2:"sand",ak3:"sand",ak4:"sand"};
const mix=(hex,amount)=>{const v=parseInt(hex.slice(1),16),f=n=>Math.round(amount>=0?n+(255-n)*amount:n*(1+amount));return`rgb(${f(v>>16)},${f(v>>8&255)},${f(v&255)})`;};
const round=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.key='';this.skin='ah1';this.background='sand';this.images=new Map();this.stoneSprites=new Map();this.setBackground('sand');this.cache=document.createElement('canvas');this.floorCache=document.createElement('canvas');this.floorKey='';}
 setSkin(id){this.stoneSprites.clear();this.skin=SKINS.some(s=>s.id===id)?id:'ah1';this.key='';}
 setBackground(id){this.background=BACKGROUNDS.some(b=>b.id===id)?id:'sand';if(BACKGROUNDS.find(b=>b.id===this.background).file&&!this.images.has(this.background)){const image=new Image();this.images.set(this.background,image);image.onload=()=>{this.key='';};image.src=BACKGROUNDS.find(b=>b.id===this.background).file;}this.key='';}
 rememberStone(key,sprite){if(this.stoneSprites.size>=2048)this.stoneSprites.delete(this.stoneSprites.keys().next().value);this.stoneSprites.set(key,sprite);}
 stone(c,x,y,u,color,theme,seed=0,wall=false,connections=0){
  if(theme.outline){const base=SKINS.find(t=>t.id===theme.baseId);if(!base.variant){drawBlockOutline(c,x,y,u,color,theme.outline,seed,base,connections);this.stone(c,x,y,u,color,base,seed,wall);return;}const variation=base.variant?seed%12:seed,key='outline:'+theme.id+':'+u+':'+color+':'+wall+':'+variation+':'+connections,pad=Math.ceil(u*.18);let sprite=this.stoneSprites.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=u+pad*2;const ctx=sprite.getContext('2d');const actualColor=wall&&base.variant?base.walls[Math.abs(seed%12)%base.walls.length]:color;drawBlockOutline(ctx,pad,pad,u,actualColor,theme.outline,seed%12,base,connections);this.stone(ctx,pad,pad,u,color,base,variation,wall);this.rememberStone(key,sprite);}c.drawImage(sprite,x-pad,y-pad);return;}

  if(theme.variant){const key=theme.id+':'+u+':'+color+':'+wall+':'+seed%12,pad=Math.ceil(u*.18);let sprite=this.stoneSprites.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=u+pad*2;themedStone(sprite.getContext('2d'),pad,pad,u,color,theme,seed%12,wall);this.rememberStone(key,sprite);}c.drawImage(sprite,x-pad,y-pad);return;}
  const pad=u*.055,sz=u-pad*2,r=u*(theme.material==='clay'?.1:.085);x+=pad;y+=pad;
  c.save();c.shadowColor='rgba(27,38,39,.22)';c.shadowBlur=u*.09;c.shadowOffsetY=u*.065;
  const glass=theme.material==='glass',clay=theme.material==='clay';
  const g=c.createLinearGradient(x,y,x+sz*.7,y+sz);g.addColorStop(0,mix(color,glass?.55:.33));g.addColorStop(.4,mix(color,.1));g.addColorStop(1,mix(color,clay?-.12:-.25));
  round(c,x,y,sz,sz,r);c.fillStyle=g;if(glass)c.globalAlpha=.78;c.fill();c.globalAlpha=1;c.shadowColor='transparent';
  if(glass){c.globalAlpha=.48;c.fillStyle='#e9ffff';round(c,x+sz*.12,y+sz*.1,sz*.76,sz*.55,r);c.fill();c.globalAlpha=1;c.strokeStyle='rgba(245,255,255,.8)';c.lineWidth=u*.045;round(c,x+1,y+1,sz-2,sz-2,r);c.stroke();c.beginPath();c.moveTo(x+sz*.16,y+sz*.18);c.lineTo(x+sz*.34,y+sz*.4);c.moveTo(x+sz*.82,y+sz*.68);c.lineTo(x+sz*.68,y+sz*.86);c.stroke();}
  else{c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=u*.035;c.beginPath();c.moveTo(x+sz*.1,y+sz*.2);c.lineTo(x+sz*.15,y+sz*.1);c.lineTo(x+sz*.87,y+sz*.1);c.stroke();
   const noise=rng(seed+33);c.fillStyle=wall?'rgba(25,33,33,.11)':'rgba(15,28,30,.07)';
   if(theme.material!=='porcelain')for(let i=0;i<16;i++){const nx=x+noise()*sz,ny=y+noise()*sz;c.fillRect(nx,ny,u*.018+noise()*u*.025,u*.02);}
   if(theme.material==='wood'){c.strokeStyle='rgba(73,37,12,.12)';c.lineWidth=.7;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+sz*.15,y+sz*(.25+i*.2));c.bezierCurveTo(x+sz*.35,y+sz*(.2+i*.2),x+sz*.65,y+sz*(.35+i*.2),x+sz*.85,y+sz*(.25+i*.2));c.stroke();}}
   if(theme.material==='porcelain'){c.fillStyle='rgba(255,255,255,.26)';round(c,x+sz*.12,y+sz*.1,sz*.7,sz*.26,r);c.fill();}
  }
  c.restore();
 }
 floor(target,w,h,bg,image){
  const key=bg.id+':'+w+':'+h+':'+Number(!!(image?.complete&&image.naturalWidth));
  if(this.floorKey!==key){this.floorCache.width=w;this.floorCache.height=h;const c=this.floorCache.getContext('2d');
  c.fillStyle=bg.floor[0];c.fillRect(0,0,w,h);if(image?.complete&&image.naturalWidth)c.drawImage(image,0,0,w,h);if(bg.world)paintWorldFloor(c,w,h,bg);
   this.floorKey=key;
  }
  target.drawImage(this.floorCache,0,0);
 }
 rebuild(g,u,theme){
  this.cache.width=this.canvas.width;this.cache.height=this.canvas.height;const c=this.cache.getContext('2d'),w=this.cache.width,h=this.cache.height;
  const bg=BACKGROUNDS.find(b=>b.id===this.background),image=this.images.get(this.background);this.floor(c,w,h,bg,image);
  for(let y=0;y<g.height;y++)for(let x=0;x<g.width;x++){
   const wall=x===0||y===0||x===g.width-1||y===g.height-1,tile=g.board[y*g.width+x];
   if(wall||tile){const occupied=(xx,yy)=>xx>=0&&yy>=0&&xx<g.width&&yy<g.height&&(xx===0||yy===0||xx===g.width-1||yy===g.height-1||!!g.board[yy*g.width+xx]),connections=theme.outline?Number(occupied(x,y-1))|Number(occupied(x+1,y))*2|Number(occupied(x,y+1))*4|Number(occupied(x-1,y))*8:0;this.stone(c,x*u,y*u,u,wall?theme.wall:tile===-2?mix(theme.wall,-.1):COLORS[(tile-1)%COLORS.length],theme,x*97+y*227,wall||tile===-2,connections);}
  }
 }
 draw(g,{meId=null,now=performance.now(),networkAge=0,reducedMotion=false}={}){
  const theme=SKINS.find(s=>s.id===this.skin)||SKINS[0],u=36;
  if(this.canvas.width!==g.width*u||this.canvas.height!==g.height*u){this.canvas.width=g.width*u;this.canvas.height=g.height*u;this.key='';}
  const key=`${this.skin}:${this.background}:${g.width}:${g.height}:${g.round}:${g.changes}`;if(key!==this.key){this.rebuild(g,u,theme);this.key=key;}
  const c=this.ctx;c.clearRect(0,0,this.canvas.width,this.canvas.height);c.drawImage(this.cache,0,0);
  for(const p of g.players){if(!p.alive)continue;
   let progress=g.status==='running'?Math.min(.98,p.progress+(networkAge/1000)*p.speed):0;
   const dir=p.renderDir??p.dir,d=DIRS[dir],fromX=p.prevX??p.x,fromY=p.prevY??p.y;
   let cx=(fromX+.5+(p.x-fromX)*progress)*u,cy=(fromY+.5+(p.y-fromY)*progress)*u;
   const flight=p.renderFlight??p.flight,air=flight?Math.max(0,Math.sin(Math.PI*Math.min(1,(flight.total-flight.remaining+progress)/flight.total))):0;
   if(p.dash&&g.status==='running'&&!reducedMotion){c.save();c.globalAlpha=.13;c.fillStyle=p.color;c.beginPath();c.ellipse(cx-d.x*u*.27,cy-d.y*u*.27,u*.33,u*.33,0,0,Math.PI*2);c.fill();c.restore();}
   this.character(c,cx,cy,u,{...p,dir:progress>.92&&!p.flight?p.dir:dir},theme,air,meId===p.id);
  }
  for(const hit of g.crashes||[]){const age=g.time-hit.time+networkAge/1000;if(age>.55||age<0||hit.reason.includes('退出')||hit.reason.includes('降参'))continue;this.crash(c,hit,age,u,theme,g.players[hit.index],reducedMotion);}
 }
 crash(c,hit,age,u,theme,player,reducedMotion=false){
  const landing=hit.kind==='landing',dir=hit.dir??0,d=DIRS[dir],cx=(hit.x+.5-(landing?0:d.x*.38))*u,cy=(hit.y+.5-(landing?0:d.y*.38))*u;
  if(age<.28){const squash=Math.min(1,age/.16),thin=1-squash*.88,wide=1+squash*.48;c.save();
   if(landing){c.translate(cx,cy+u*.26);c.scale(wide,thin);this.character(c,0,-u*.26,u,{color:player?.color||COLORS[hit.index%COLORS.length],dir},theme);}
   else{c.translate(cx,cy);c.scale(dir%2===1?thin:wide,dir%2===1?wide:thin);this.character(c,0,0,u,{color:player?.color||COLORS[hit.index%COLORS.length],dir},theme);}
   c.restore();
  }
  if(age>=.23){const t=(age-.23)/.32,alpha=1-t;c.save();c.translate(cx,cy);c.globalAlpha=Math.max(0,alpha);c.lineCap='round';
   if(t<.22){c.fillStyle='rgba(255,255,244,.9)';c.beginPath();c.arc(0,0,u*(.12+t),0,Math.PI*2);c.fill();}
   for(let i=0;i<16;i++){const a=i*Math.PI/8+.12,r0=u*(.2+t*.6),r1=u*(.68+t*(reducedMotion?.25:.8))*(i%2?1:.8);c.strokeStyle=i%2?'#fffdf1':player?.color||'#f1c966';c.lineWidth=i%2?u*.065:u*.035;c.beginPath();c.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);c.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);c.stroke();}
   c.restore();
  }
 }
 character(c,cx,cy,u,p,theme,air=0,isMe=false){
  if(theme.variant){themedCharacter(c,cx,cy,u,p,theme,air,isMe);return;}
  c.save();c.fillStyle=`rgba(21,34,39,${.18-air*.09})`;c.beginPath();c.ellipse(cx,cy+u*.18,u*(.32-air*.08),u*.14,0,0,Math.PI*2);c.fill();
  c.translate(cx,cy-air*u*.37);c.scale(1+air*.28,1+air*.28);c.rotate(p.dir*Math.PI/2-Math.PI/2);
  // Local forward is +X. Body + nose fit in .88 cell; no direction arrows.
  const glass=theme.material==='glass',clay=theme.material==='clay',r=u*.32;
  c.shadowColor='rgba(23,47,59,.22)';c.shadowBlur=u*.09;c.shadowOffsetY=u*.055;
  const grad=c.createRadialGradient(-u*.12,-u*.16,u*.025,0,0,r*1.4);grad.addColorStop(0,mix(p.color,glass?.84:.68));grad.addColorStop(.42,mix(p.color,.16));grad.addColorStop(1,mix(p.color,-.38));
  c.fillStyle=grad;c.beginPath();c.ellipse(-u*.025,0,r,r*.96,0,0,Math.PI*2);if(glass)c.globalAlpha=.72;c.fill();c.globalAlpha=1;c.shadowColor='transparent';
  if(glass){c.strokeStyle='rgba(239,255,255,.85)';c.lineWidth=u*.025;c.stroke();c.fillStyle='rgba(237,255,255,.3)';c.beginPath();c.ellipse(-u*.035,u*.1,u*.23,u*.13,-.3,0,Math.PI*2);c.fill();}
  c.fillStyle=clay?'rgba(255,255,255,.18)':'rgba(255,255,255,.62)';c.beginPath();c.ellipse(-u*.12,-u*.15,u*.09,u*.045,-.6,0,Math.PI*2);c.fill();
  if(theme.material==='wood'){c.strokeStyle='rgba(72,42,15,.14)';c.lineWidth=.7;for(let y=-.17;y<.2;y+=.09){c.beginPath();c.moveTo(-u*.2,y*u);c.quadraticCurveTo(0,y*u-u*.03,u*.16,y*u);c.stroke();}}
  // Two eyes on the leading half, with an orange nose clearly contrasting with the body.
  for(const side of [-1,1]){c.fillStyle='#fbffff';c.beginPath();c.ellipse(u*.12,side*u*.135,u*.075,u*.067,0,0,Math.PI*2);c.fill();c.fillStyle='#153441';c.beginPath();c.ellipse(u*.15,side*u*.135,u*.034,u*.043,0,0,Math.PI*2);c.fill();}
  const nose=c.createRadialGradient(u*.34,-u*.04,0,u*.36,0,u*.12);nose.addColorStop(0,'#ffe19b');nose.addColorStop(.4,'#faaa33');nose.addColorStop(1,'#d66b17');c.fillStyle=nose;c.beginPath();c.ellipse(u*.34,0,u*.105,u*.079,0,0,Math.PI*2);c.fill();
  if(isMe){c.strokeStyle='rgba(255,255,255,.88)';c.lineWidth=u*.023;c.beginPath();c.arc(-u*.025,0,r+u*.025,Math.PI*.62,Math.PI*1.45);c.stroke();}
  c.restore();
 }
 preview(canvas,skin){const prior=this.skin;this.setSkin(skin);const w=canvas.width,h=canvas.height,c=canvas.getContext('2d'),theme=SKINS.find(s=>s.id===skin);c.fillStyle='#173d12';c.fillRect(0,0,w,h);for(let i=0;i<8;i++)this.stone(c,i*19,1,19,theme.wall,theme,i*97,true,(i>0?8:0)|(i<7?2:0));const u=25;this.stone(c,8,41,u,COLORS[0],theme,21,false,2);this.stone(c,33,41,u,COLORS[0],theme,22,false,8);this.stone(c,105,41,u,COLORS[1],theme,23);this.character(c,76,53,u,{color:COLORS[0],dir:1,index:0},theme);this.setSkin(prior);}

}
