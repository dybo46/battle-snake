// Hand-drawn Canvas materials, based on the selected concept panels.
// The current round, nose-led character remains the size and silhouette standard.
const theme=(id,name,pattern,character,walls,note)=>({id,ref:id,name,variant:true,pattern,character,walls,wall:walls[0],material:pattern,floor:['#173d12','#173d12'],note});
export const EXTRA_SKINS=[
 theme('aa8','黒曜の宝石','obsidian','gem',['#363c42','#242b31'],'金の鋲壁・カット宝石・丸い結晶キャラ'),
 theme('ab3','氷のペンギン','icebrick','penguin',['#9cd6f2','#dbf2ff'],'氷レンガ・霜の石・白いお腹とくちばし'),
 theme('ab9','小鳥のおもちゃ','toy','bird',['#388bdb','#e9c848','#70b35c'],'原色の外周・玩具タイル・丸い小鳥'),
 theme('ac2','フルーツゼリー','jelly','jelly',['#f5a1b7','#efb16b','#ed839c'],'果実色のゼリー壁・ぷるんとした石と体'),
 theme('ac3','キャンディ工房','candy','candy',['#a9d9b9','#efb1cb','#f2d17d','#a4d8e5'],'色違いの糖衣壁・丸いキャンディキャラ'),
 theme('ac6','透明ソーダ','glass','bubble',['#b5e9ed','#88cbd7'],'透き通る壁・気泡入りの石・ソーダの丸い体'),
 theme('ac7','オパールの光','opal','pearl',['#e8e1d2','#d5dbda','#e5d8e8'],'遊色の白い石壁・虹の反射と真珠の体'),
 theme('ac8','こんぺいとう','sugar','sugar',['#d6b2e4','#a4d5e1','#e5bfda','#e7d085'],'砂糖粒の壁・ざらめ石・砂糖の帽子'),
 theme('ad3','ネオンゴースト','neon','ghost',['#8c65cf','#ac80e7'],'紫の発光壁・光るガラス石・丸いゴースト'),
 theme('ad5','空色の小鳥','sky','chick',['#73c5ea','#dcf2fc','#abddec'],'青白い外周・つや消し石・小さな冠羽'),
 theme('ad7','夜のロボット','tech','robot',['#344558','#253447'],'銀縁のパネル壁・回路の石・黒いバイザー'),
 theme('ad8','ローズマスク','rose','mask',['#e3a9b1','#efc5c4'],'ローズの陶器壁・斜めの面・白いフェイス'),
 theme('ae1','ミルクの陶器','porcelain','porcelain',['#e6e9e7','#e3a4bc','#8bb8dc'],'白磁と桃青の外周・釉薬の石と丸い体'),
 theme('ae2','工場のマスコット','hazard','engineer',['#d6a937','#3d4650'],'黒黄の外周・金属の石・リベット付きキャラ'),
 theme('ae3','カットクリスタル','crystal','crystal',['#9fd6e8','#bce9ef'],'厚い切子ガラス・カット面のある丸い体'),
 theme('ae5','三色の木工','timber','wooden',['#b4804e','#e2c28c','#75452e'],'三種の木材・年輪の石・木目と木の鼻'),
 theme('ae7','折り紙の積み木','origami','paper',['#6fae9b','#d3a25f','#c9877f','#6e9dbc'],'折り筋の外周・四面の石・丸い紙細工'),
 theme('af7','ネオンシティ','city','cyber',['#26bdd7','#be65d8','#ec87b2'],'交互の電飾壁・灯りの粒・発光ヘッドセット'),
 theme('af3','雪の精','snow','snow',['#b8ddec','#d6edf6'],'雪をかぶった氷壁・雪帽子の石とキャラ'),
 theme('ag7','森のヘッドホン','headphone','headphone',['#61a673','#92be82','#9b8862'],'緑の木枠・彫り目の石・丸い耳当て'),
 theme('ag8','ポップバード','pop','popbird',['#447dc4','#d7b14d','#cd6e84'],'ポップな原色外周・二段の石・丸い羽'),
 theme('ag9','パールロボ','pearltech','pearlbot',['#e0e5df','#a7cbdc','#dab7d3'],'白いパネル壁・四隅の留め具・光る目'),
 theme('ai2','極地のペンギン','frozen','polar',['#a8d7e9','#d1ecf5'],'細かな氷の亀裂・色付きの氷・白い頬'),
 theme('ai4','ラグーンのアヒル','lagoon','duck',['#5d9288','#487e79'],'緑の岩壁・波紋の彫刻・丸い羽とくちばし'),
 theme('aj1','グラファイト','graphite','orb',['#535d64','#68747b'],'細粒の石壁・厚いブロック・丸い金属鼻'),
 theme('al1','星くずの宇宙','cosmos','cosmic',['#384e76','#425e86'],'星と斑点の外周・星くず石・夜色の丸い体')
];
const blend=(hex,t)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.round(t<0?v*(1+t):v+(255-v)*t);return `rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`;};
const poly=(c,points)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();};
const box=(c,x,y,w,h,r=.08)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
function noise(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function spark(c,x,y,r,color){c.strokeStyle=color;c.lineWidth=.023;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();}
// All shapes below use one unit per cell, so walls and trails share exact bounds.
export function themedStone(c,x,y,u,color,t,seed=0,wall=false){
 c.save();c.translate(x,y);c.scale(u,u);const rnd=noise(seed+91),k=t.pattern,base=wall?t.walls[Math.abs(seed)%t.walls.length]:color;
 const transparent=['glass','crystal','icebrick','frozen'].includes(k),glow=['neon','city','cosmos'].includes(k),r=k==='jelly'?.16:k==='candy'?.13:k==='graphite'?.045:.075;
 c.shadowColor=glow?blend(base,.2):'rgba(0,0,0,.35)';c.shadowBlur=u*(glow&&!wall?.12:.045);c.shadowOffsetY=u*.045;
 const g=c.createLinearGradient(.1,.05,.85,1);g.addColorStop(0,blend(base,transparent?.5:.3));g.addColorStop(.38,blend(base,.05));g.addColorStop(1,blend(base,-.28));c.fillStyle=g;box(c,.045,.045,.91,.91,r);c.fill();c.shadowColor='transparent';
 c.save();box(c,.055,.055,.89,.89,r);c.clip();
 switch(k){
  case'obsidian':{
   c.fillStyle=wall?'#1e252c':blend(base,-.3);poly(c,[[.1,.12],[.5,.28],[.88,.13],[.72,.7],[.15,.88]]);c.fill();c.fillStyle=wall?'#637078':blend(base,.38);poly(c,[[.12,.12],[.5,.28],[.25,.5],[.12,.87]]);c.fill();c.fillStyle=blend(base,.12);poly(c,[[.5,.28],[.88,.13],[.75,.72],[.51,.86],[.25,.5]]);c.fill();c.strokeStyle=wall?'#8b9499':blend(base,.65);c.lineWidth=.018;c.beginPath();c.moveTo(.12,.12);c.lineTo(.5,.28);c.lineTo(.88,.13);c.moveTo(.25,.5);c.lineTo(.51,.86);c.stroke();
   if(wall){c.fillStyle='#d3b572';poly(c,[[.5,.28],[.64,.46],[.5,.64],[.36,.46]]);c.fill();c.fillStyle='#f3dfa3';c.beginPath();c.arc(.47,.42,.045,0,7);c.fill();}break;
  }
  case'icebrick':
   c.fillStyle='rgba(244,254,255,.35)';poly(c,[[0,.1],[.48,.06],[.95,.38],[.6,.5],[.05,.31]]);c.fill();c.strokeStyle='#f1fcff';c.lineWidth=.022;c.beginPath();c.moveTo(.18,.12);c.lineTo(.44,.39);c.lineTo(.32,.6);c.moveTo(.44,.39);c.lineTo(.73,.26);c.stroke();for(let i=0;i<14;i++){c.fillStyle='rgba(255,255,255,.28)';c.fillRect(rnd(),rnd(),.025,.018);}break;
  case'toy':
   c.strokeStyle=blend(base,-.27);c.lineWidth=.028;box(c,.13,.13,.74,.74,.08);c.stroke();c.fillStyle='rgba(255,255,255,.23)';box(c,.17,.14,.63,.17,.05);c.fill();if(wall&&seed%4===0){c.fillStyle='#f3e4a8';for(let i=0;i<5;i++){const a=i*1.256;c.beginPath();c.arc(.5+Math.cos(a)*.09,.5+Math.sin(a)*.09,.055,0,7);c.fill();}}break;
  case'jelly':
   c.fillStyle='rgba(255,246,246,.2)';box(c,.13,.16,.74,.66,.14);c.fill();c.strokeStyle='rgba(255,250,248,.52)';c.lineWidth=.03;c.beginPath();c.moveTo(.22,.28);c.quadraticCurveTo(.35,.15,.7,.22);c.stroke();for(let i=0;i<3;i++){c.fillStyle='rgba(255,255,255,.42)';c.beginPath();c.arc(.25+rnd()*.5,.35+rnd()*.4,.022,0,7);c.fill();}break;
  case'candy':
   c.fillStyle='rgba(255,255,255,.12)';poly(c,[[.07,.1],[.92,.13],[.92,.36],[.07,.6]]);c.fill();c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=.023;box(c,.13,.13,.74,.74,.11);c.stroke();c.fillStyle=blend(base,.5);c.beginPath();c.ellipse(.25,.23,.09,.035,-.3,0,7);c.fill();break;
  case'glass':
   c.fillStyle='rgba(230,255,255,.2)';poly(c,[[.1,.1],[.86,.12],[.62,.84],[.35,.9]]);c.fill();for(let i=0;i<4;i++){c.strokeStyle='rgba(246,255,255,.5)';c.lineWidth=.014;c.beginPath();c.arc(.25+rnd()*.5,.25+rnd()*.5,.025+rnd()*.04,0,7);c.stroke();}c.strokeStyle='#e4ffff';c.lineWidth=.025;box(c,.1,.1,.8,.8,.06);c.stroke();break;
  case'opal':{
   const hues=['#c9f4ee','#e6ceee','#ffe4b2','#a6d3ed'];for(let i=0;i<4;i++){c.globalAlpha=.25;c.fillStyle=hues[(i+seed)%4];poly(c,[[.5,.47],[.09+i*.2,.09],[.3+i*.2,.1],[.92,.8]]);c.fill();}c.globalAlpha=1;c.strokeStyle='rgba(255,255,249,.7)';c.lineWidth=.024;c.beginPath();c.moveTo(.16,.81);c.lineTo(.18,.2);c.lineTo(.79,.15);c.stroke();break;
  }
  case'sugar':
   for(let i=0;i<50;i++){c.fillStyle=i%3?'rgba(255,255,255,.32)':'rgba(66,39,74,.12)';const px=rnd(),py=rnd();poly(c,[[px,py],[px+.025,py-.013],[px+.035,py+.024],[px+.006,py+.032]]);c.fill();}break;
  case'neon':
   c.strokeStyle=blend(base,.7);c.lineWidth=.036;box(c,.1,.1,.8,.8,.035);c.stroke();c.fillStyle='rgba(245,237,255,.15)';box(c,.2,.2,.6,.6,.025);c.fill();spark(c,.75,.25,.07,'#e9ceff');break;
  case'sky':
   c.fillStyle='rgba(255,255,255,.14)';box(c,.15,.13,.7,.72,.09);c.fill();c.strokeStyle='rgba(255,255,255,.52)';c.lineWidth=.025;c.beginPath();c.moveTo(.2,.3);c.quadraticCurveTo(.3,.16,.78,.2);c.stroke();break;
  case'tech':
   c.strokeStyle=wall?'#b8c5d4':blend(base,.72);c.lineWidth=.025;box(c,.1,.1,.8,.8,.025);c.stroke();c.strokeStyle=blend(base,-.25);c.lineWidth=.03;box(c,.2,.2,.6,.6,.015);c.stroke();c.fillStyle=wall?'#86a6bf':blend(base,.6);c.fillRect(.19,.19,.1,.04);c.fillRect(.7,.73,.1,.04);c.beginPath();c.arc(.72,.28,.024,0,7);c.fill();break;
  case'rose':
   c.fillStyle='rgba(255,255,250,.17)';poly(c,[[.06,.06],[.94,.06],[.06,.94]]);c.fill();c.strokeStyle='rgba(255,255,255,.24)';c.lineWidth=.02;c.beginPath();c.moveTo(.15,.85);c.lineTo(.85,.15);c.stroke();break;
  case'porcelain':
   c.fillStyle='rgba(255,255,255,.27)';box(c,.12,.12,.76,.26,.08);c.fill();c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=.02;box(c,.1,.1,.8,.8,.09);c.stroke();c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(.7,.76,.09,.035,-.5,0,7);c.fill();break;
  case'hazard':
   if(wall){c.fillStyle='#343c42';for(let i=-2;i<4;i++){poly(c,[[i*.42,.05],[i*.42+.21,.05],[i*.42+.9,.95],[i*.42+.69,.95]]);c.fill();}}else{c.strokeStyle=blend(base,-.35);c.lineWidth=.025;box(c,.13,.13,.74,.74,.035);c.stroke();}for(const px of [.17,.83])for(const py of [.17,.83]){c.fillStyle=wall?'#c7c3a1':blend(base,.65);c.beginPath();c.arc(px,py,.028,0,7);c.fill();}break;
  case'crystal':
   c.fillStyle=blend(base,.4);poly(c,[[.1,.1],[.9,.1],[.72,.32],[.28,.32]]);c.fill();c.fillStyle=blend(base,-.12);poly(c,[[.9,.1],[.9,.9],[.71,.69],[.72,.32]]);c.fill();c.fillStyle='rgba(239,255,255,.25)';poly(c,[[.1,.9],[.28,.32],[.72,.69],[.9,.9]]);c.fill();c.strokeStyle='rgba(244,255,255,.6)';c.lineWidth=.018;box(c,.1,.1,.8,.8,.025);c.stroke();spark(c,.25,.25,.07,'#f6ffff');break;
  case'timber':
   c.strokeStyle=wall?'rgba(70,32,9,.25)':blend(base,-.24);c.lineWidth=.016;for(let i=0;i<6;i++){const py=.18+i*.125;c.beginPath();c.moveTo(.08,py);c.bezierCurveTo(.3,py-.07,.65,py+.07,.92,py);c.stroke();}c.beginPath();c.ellipse(.58,.48,.11,.045,.1,0,7);c.stroke();c.fillStyle='rgba(255,229,171,.15)';c.fillRect(.08,.08,.84,.07);break;
  case'origami':
   for(const [points,tint]of [[[[.06,.06],[.94,.06],[.5,.5]],.3],[[[.94,.06],[.94,.94],[.5,.5]],-.12],[[[.94,.94],[.06,.94],[.5,.5]],.02],[[[.06,.94],[.06,.06],[.5,.5]],.15]]){c.fillStyle=blend(base,tint);poly(c,points);c.fill();}c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=.014;c.beginPath();c.moveTo(.06,.06);c.lineTo(.94,.94);c.stroke();break;
  case'city':
   c.fillStyle='rgba(0,8,38,.22)';c.fillRect(.08,.59,.84,.26);c.fillStyle='rgba(242,253,255,.42)';for(let i=0;i<3;i++)c.fillRect(.21+i*.23,.69,.075,.065);c.strokeStyle=blend(base,.67);c.lineWidth=.025;c.beginPath();c.moveTo(.15,.44);c.lineTo(.15,.16);c.lineTo(.7,.16);c.stroke();break;
  case'snow':
   c.fillStyle='#f0fbff';c.beginPath();c.moveTo(.045,.32);c.lineTo(.045,.12);c.quadraticCurveTo(.1,.02,.25,.07);c.quadraticCurveTo(.45,-.01,.62,.07);c.quadraticCurveTo(.88,.01,.955,.12);c.lineTo(.955,.32);for(let i=0;i<4;i++){const xx=.93-i*.23;c.quadraticCurveTo(xx-.06,.23,xx-.13,.34);}c.closePath();c.fill();c.fillStyle='rgba(242,253,255,.5)';for(let i=0;i<7;i++)c.fillRect(.15+rnd()*.7,.4+rnd()*.38,.018,.018);break;
  case'headphone':
   c.strokeStyle=blend(base,-.25);c.lineWidth=.025;box(c,.14,.14,.72,.72,.035);c.stroke();c.strokeStyle=blend(base,.32);c.lineWidth=.022;c.beginPath();c.moveTo(.2,.7);c.lineTo(.2,.24);c.lineTo(.7,.24);c.stroke();if(wall){c.fillStyle=blend(base,-.1);c.fillRect(.44,.27,.12,.46);}break;
  case'pop':
   c.fillStyle=blend(base,-.18);c.fillRect(.08,.62,.84,.23);c.strokeStyle=blend(base,.6);c.lineWidth=.026;c.beginPath();c.moveTo(.18,.42);c.lineTo(.18,.17);c.lineTo(.76,.17);c.stroke();if(wall&&seed%3===0){c.fillStyle='rgba(255,255,255,.48)';c.beginPath();c.arc(.7,.3,.075,0,7);c.fill();}break;
  case'pearltech':
   c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=.026;box(c,.1,.1,.8,.8,.09);c.stroke();c.strokeStyle=blend(base,-.18);c.lineWidth=.015;c.beginPath();c.moveTo(.14,.67);c.lineTo(.86,.67);c.stroke();for(const px of [.18,.82]){c.fillStyle='#e9d6a6';c.beginPath();c.arc(px,.18,.027,0,7);c.fill();}break;
  case'frozen':
   c.strokeStyle='rgba(242,254,255,.78)';c.lineWidth=.02;for(let i=0;i<3;i++){const xx=.15+rnd()*.7;c.beginPath();c.moveTo(xx,.08);c.lineTo(xx-.12,.34);c.lineTo(xx+.09,.56);c.lineTo(xx-.02,.92);c.moveTo(xx+.09,.56);c.lineTo(xx+.29,.42);c.stroke();}c.fillStyle='rgba(250,255,255,.18)';poly(c,[[.07,.07],[.92,.07],[.2,.9]]);c.fill();break;
  case'lagoon':
   c.strokeStyle=blend(base,-.23);c.lineWidth=.024;for(let i=0;i<3;i++){c.beginPath();c.moveTo(.15,.3+i*.17);c.bezierCurveTo(.35,.16+i*.17,.55,.41+i*.17,.85,.27+i*.17);c.stroke();}c.strokeStyle=blend(base,.27);c.lineWidth=.018;c.beginPath();c.moveTo(.16,.23);c.lineTo(.22,.13);c.lineTo(.75,.13);c.stroke();break;
  case'graphite':
   for(let i=0;i<65;i++){c.fillStyle=i%2?'rgba(255,255,255,.11)':'rgba(8,15,22,.12)';c.fillRect(rnd(),rnd(),.014+rnd()*.014,.012);}c.strokeStyle=blend(base,-.3);c.lineWidth=.024;box(c,.09,.09,.82,.82,.025);c.stroke();break;
  case'cosmos':
   c.fillStyle='rgba(188,211,255,.17)';poly(c,[[.08,.18],[.44,.08],[.91,.55],[.67,.9]]);c.fill();for(let i=0;i<9;i++){c.fillStyle=i%3?'rgba(246,245,255,.45)':'rgba(156,199,255,.55)';c.beginPath();c.arc(.15+rnd()*.7,.16+rnd()*.7,.008+rnd()*.012,0,7);c.fill();}spark(c,.32,.3,.06,'#d7ecff');break;
 }
 c.restore();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=.016;box(c,.06,.06,.88,.88,r);c.stroke();c.restore();
}

export function themedCharacter(c,cx,cy,u,p,t,air=0,isMe=false){
 c.save();c.translate(cx,cy);c.scale(u,u);c.fillStyle=`rgba(0,0,0,${.23-air*.1})`;c.beginPath();c.ellipse(0,.22,.29-air*.06,.095,0,0,7);c.fill();c.translate(0,-air*.37);c.scale(1+air*.28,1+air*.28);c.rotate(p.dir*Math.PI/2-Math.PI/2);
 const kind=t.character,color=p.color,rnd=noise(p.index+13),base=kind==='cosmic'?'#27354e':color;
 const g=c.createRadialGradient(-.12,-.14,.01,0,0,.45);g.addColorStop(0,blend(base,['pearl','porcelain','polar'].includes(kind)?.75:.48));g.addColorStop(.45,blend(base,.05));g.addColorStop(1,blend(base,-.37));c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=u*.065;c.shadowOffsetY=u*.035;c.fillStyle=g;
 // The rounded body occupies the same .64-cell diameter as the original ah1.
 c.beginPath();if(kind==='ghost'){c.moveTo(.28,.17);c.bezierCurveTo(.4,-.26,.16,-.35,-.09,-.32);c.bezierCurveTo(-.38,-.3,-.38,.05,-.3,.25);for(let i=0;i<4;i++)c.quadraticCurveTo(-.21+i*.15,.34,-.15+i*.15,.2);c.closePath();}else if(kind==='paper'||kind==='gem'||kind==='crystal'){for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*.32-.02,y=Math.sin(a)*.32;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}else c.ellipse(-.02,0,.32,.31,0,0,7);c.fill();c.shadowColor='transparent';
 c.save();c.beginPath();c.ellipse(-.02,0,.319,.308,0,0,7);c.clip();
 if(['gem','crystal','paper'].includes(kind)){c.fillStyle='rgba(255,255,255,.25)';poly(c,[[-.3,-.11],[-.05,-.31],[.21,-.17],[.03,.02]]);c.fill();c.fillStyle='rgba(0,8,25,.16)';poly(c,[[.03,.02],[.29,-.1],[.16,.27],[-.06,.3]]);c.fill();c.strokeStyle='rgba(255,255,255,.23)';c.lineWidth=.014;c.beginPath();c.moveTo(-.27,-.12);c.lineTo(.03,.02);c.lineTo(.16,.27);c.stroke();}
 if(['penguin','polar','mask','porcelain','pearlbot','snow'].includes(kind)){c.fillStyle=kind==='mask'?'#ffedf1':'#f0f8f5';c.beginPath();c.ellipse(.12,.01,kind==='polar'?.21:.2,.25,0,0,7);c.fill();}
 if(kind==='wooden'){c.strokeStyle=blend(color,-.28);c.lineWidth=.014;for(let y=-.24;y<.28;y+=.07){c.beginPath();c.moveTo(-.34,y);c.bezierCurveTo(-.12,y-.04,.05,y+.05,.31,y);c.stroke();}c.beginPath();c.ellipse(-.17,.1,.065,.028,.1,0,7);c.stroke();}
 if(kind==='sugar'){for(let i=0;i<32;i++){c.fillStyle=i%2?'rgba(255,255,255,.55)':'rgba(255,255,255,.18)';c.fillRect(rnd()*.6-.32,rnd()*.6-.3,.016,.016);}}
 if(kind==='pearl'){for(let i=0;i<3;i++){c.strokeStyle=['#e1f9da','#efd1f4','#c6ebff'][i];c.globalAlpha=.48;c.lineWidth=.024;c.beginPath();c.arc(-.04,0,.22+i*.02,2.5,4.5);c.stroke();}c.globalAlpha=1;}
 if(kind==='bubble'){for(let i=0;i<4;i++){c.strokeStyle='rgba(245,255,255,.4)';c.lineWidth=.012;c.beginPath();c.arc(-.2+rnd()*.3,-.2+rnd()*.4,.018+rnd()*.025,0,7);c.stroke();}}
 if(kind==='cosmic'){c.strokeStyle=color;c.lineWidth=.055;c.beginPath();c.ellipse(-.02,0,.29,.285,0,0,7);c.stroke();for(let i=0;i<10;i++){c.fillStyle='#c3dcff';c.beginPath();c.arc(rnd()*.5-.27,rnd()*.5-.25,.007,0,7);c.fill();}spark(c,-.15,-.12,.04,'#ffffff');}
 c.restore();
 // Individual world accessories remain inside a one-cell ground footprint.
 if(['headphone','cyber'].includes(kind)){c.strokeStyle=kind==='cyber'?'#cbdafa':'#273d48';c.lineWidth=.045;c.beginPath();c.arc(-.025,0,.3,Math.PI*.48,Math.PI*1.52);c.stroke();for(const y of [-.26,.26]){c.fillStyle='#263847';box(c,-.09,y-.06,.15,.12,.04);c.fill();c.fillStyle=kind==='cyber'?'#75f7ff':blend(color,.35);box(c,-.055,y-.045,.08,.09,.025);c.fill();}}
 if(['bird','chick','popbird','duck','penguin','polar'].includes(kind)){c.fillStyle=blend(color,-.15);c.beginPath();c.ellipse(-.12,.16,.13,.065,-.3,0,7);c.fill();c.strokeStyle=blend(color,.35);c.lineWidth=.012;c.beginPath();c.arc(-.12,.1,.09,.4,2.8);c.stroke();if(['bird','chick','popbird'].includes(kind)){c.fillStyle=kind==='popbird'?'#f4d59b':blend(color,.3);c.beginPath();c.ellipse(-.17,-.28,.085,.035,.55,0,7);c.fill();}if(['penguin','polar'].includes(kind)){c.fillStyle='#eeb656';c.beginPath();c.ellipse(-.1,.3,.055,.022,0,0,7);c.fill();}}
 if(kind==='engineer'){c.fillStyle='#d4a83a';c.beginPath();c.ellipse(-.1,-.19,.2,.11,-.3,0,7);c.fill();c.strokeStyle='#626c6b';c.lineWidth=.025;c.beginPath();c.moveTo(-.28,-.13);c.lineTo(.02,-.24);c.stroke();c.fillStyle='#e6d5a4';c.beginPath();c.arc(-.22,-.2,.025,0,7);c.fill();}
 if(kind==='snow'){c.fillStyle='#f2fcff';c.beginPath();c.ellipse(-.09,-.24,.23,.095,-.25,0,7);c.fill();c.beginPath();c.arc(-.17,-.29,.06,0,7);c.fill();}
 if(kind==='sugar'){c.fillStyle='#f4ead5';poly(c,[[-.19,-.26],[-.1,-.37],[.02,-.26]]);c.fill();}
 if(['robot','pearlbot','cyber'].includes(kind)){c.fillStyle=kind==='pearlbot'?'#344451':'#152b38';box(c,.035,-.205,.225,.41,.085);c.fill();c.strokeStyle=kind==='pearlbot'?'#dce9e5':blend(color,.55);c.lineWidth=.018;box(c,.035,-.205,.225,.41,.085);c.stroke();for(const y of [-.1,.1]){c.fillStyle=kind==='pearlbot'?'#e6eec3':'#a5f4ff';box(c,.12,y-.033,.066,.066,.016);c.fill();}c.strokeStyle='#91a9b4';c.lineWidth=.018;c.beginPath();c.moveTo(-.13,-.25);c.lineTo(-.17,-.36);c.stroke();c.fillStyle=color;c.beginPath();c.arc(-.17,-.36,.035,0,7);c.fill();}
 else{
  for(const y of [-.125,.125]){c.fillStyle=['jelly','ghost','mask'].includes(kind)?'#163240':'#f7ffff';c.beginPath();c.ellipse(.12,y,.066,.065,0,0,7);c.fill();if(!['jelly','ghost','mask'].includes(kind)){c.fillStyle='#173341';c.beginPath();c.ellipse(.145,y,.029,.04,0,0,7);c.fill();}else{c.fillStyle='#efffff';c.beginPath();c.arc(.135,y-.02,.017,0,7);c.fill();}}
 }
 const beak=['bird','chick','popbird','penguin','polar','duck'].includes(kind),nose=kind==='wooden'?'#c38c48':kind==='cosmic'?'#d5c6ef':kind==='orb'?'#e5e8e9':kind==='mask'?'#e88a9d':'#f7ad42';
 c.fillStyle=nose;c.beginPath();if(beak){c.moveTo(.28,-.072);c.quadraticCurveTo(.47,-.06,.46,0);c.quadraticCurveTo(.45,.085,.28,.073);c.closePath();}else c.ellipse(.345,0,.095,.075,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(.35,-.027,.04,.018,-.15,0,7);c.fill();
 if(['jelly','candy','porcelain','orb','chick','popbird'].includes(kind)){c.fillStyle='rgba(255,255,255,.48)';c.beginPath();c.ellipse(-.15,-.17,.08,.035,-.6,0,7);c.fill();}
 if(kind==='ghost'||kind==='jelly'){c.fillStyle='rgba(254,171,197,.5)';c.beginPath();c.arc(.06,.23,.038,0,7);c.fill();}
 if(isMe){c.strokeStyle='rgba(250,255,255,.85)';c.lineWidth=.018;c.beginPath();c.arc(-.02,0,.347,Math.PI*.58,Math.PI*1.47);c.stroke();}c.restore();
}
