// Deep, saturated floors for the 26 unoutlined material skins. Stable IDs preserve saved choices.
const bg=(skin,name,color,note)=>({id:'world-'+skin,skin,name,color,floor:[color,color],world:true,crisp:true,note});
export const WORLD_BACKGROUNDS=[
 bg('aa8','黒曜のダークベリー','#24091a','金の鋲と黒曜石の面を見分けやすい、赤紫の深色'),
 bg('ab3','氷のミッドナイトブルー','#061b43','青白い氷レンガとペンギンが浮かぶ、鮮明な夜の青'),
 bg('ab9','玩具のディープエメラルド','#062d23','原色の玩具タイルに合わせた、濃いエメラルド'),
 bg('ac2','ゼリーのワインレッド','#3d0620','果実ゼリーの透明感と艶を引き立てる、深いワインレッド'),
 bg('ac3','糖衣のダークアメジスト','#2b103e','多色の糖衣をくっきり見せる、濃いアメジスト'),
 bg('ac6','ソーダのディープペトロール','#022b35','透明ソーダの気泡と石を引き立てる、鮮明な暗い青緑'),
 bg('ac7','真珠のインディゴ','#10113e','オパールの白と遊色を受け止める、深い藍'),
 bg('ac8','砂糖菓子のカシス','#33103b','砂糖粒の淡い色に合わせた、濃いカシス'),
 bg('ad3','ネオンのダークターコイズ','#042c2d','紫の光とゴーストが浮かぶ、くっきりした暗い青緑'),
 bg('ad5','小鳥のナイトラピス','#0a2048','空色の小鳥と青白い壁を引き立てる、深い瑠璃'),
 bg('ad7','鋼のブラックグレープ','#260b30','青い鋼板と銀の縁が沈まない、黒葡萄の紫'),
 bg('ad8','ローズのピーコックグリーン','#083226','ピンクの陶器と対比させる、濃い孔雀緑'),
 bg('ae1','白磁のディープボルドー','#38091b','白磁の白と桃青の色を引き立てる、濃いボルドー'),
 bg('ae2','工場のアイアンネイビー','#071d37','黄黒の金属壁を読みやすくする、暗い鉄紺'),
 bg('ae3','切子のロイヤルバイオレット','#28103e','水色の切子ガラスが際立つ、深いロイヤルパープル'),
 bg('ae5','木工のダークスプルース','#072c25','三色の木肌の温かさを引き立てる、濃い針葉樹の緑'),
 bg('ae7','折り紙のオックスブラッド','#35121d','多色の紙細工を受け止める、深い赤褐色'),
 bg('af7','街のネオンブラック','#180724','電飾の光を濁らせない、紫を残した鮮明な夜色'),
 bg('af3','雪のディープアジュール','#102844','白い雪帽子と氷壁の輪郭が見える、濃い青'),
 bg('ag7','森のブラックチェリー','#300b25','緑の木枠と耳当てに対比する、深い黒桜色'),
 bg('ag8','ポップのディープオーシャン','#052a3e','原色の壁と羽をくっきり見せる、濃い海の青'),
 bg('ag9','パールのダークプラム','#311037','白いパネルと真珠の艶を引き立てる、濃いプラム'),
 bg('ai2','極地のポーラーナイト','#06243e','青い氷の亀裂と白い頬を引き立てる、鮮明な極夜の青'),
 bg('ai4','入り江のダークガーネット','#310c17','緑の岩壁とアヒルに合わせた、濃いガーネット'),
 bg('aj1','石墨のディープシアン','#06292d','灰色の面と金属鼻を見分けやすい、暗いシアン'),
 bg('al1','宇宙のウルトラマリン夜','#080e2c','星くずと青い石を沈ませない、深い群青の夜')
];
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function paintWorldFloor(c,w,h,bg){
 if(bg.crisp){c.fillStyle=bg.color;c.fillRect(0,0,w,h);return;}
 const seed=[...bg.skin].reduce((n,ch)=>n*31+ch.charCodeAt(0),0),rnd=random(seed),g=c.createRadialGradient(w*.42,h*.34,0,w*.5,h*.5,w*.85);g.addColorStop(0,bg.floor[1]);g.addColorStop(1,bg.floor[0]);c.fillStyle=g;c.fillRect(0,0,w,h);c.save();
 const texture=bg.texture;
 if(['grain','mineral','matte','paper','fiber','brushed'].includes(texture)){
  for(let i=0;i<2500;i++){const x=rnd()*w,y=rnd()*h;c.fillStyle=i%2?'rgba(238,242,230,.025)':'rgba(0,0,0,.035)';c.fillRect(x,y,texture==='paper'?2.5:1,texture==='fiber'?2.5:1);}
  if(['fiber','paper','brushed'].includes(texture)){c.strokeStyle='rgba(225,233,224,.018)';c.lineWidth=.6;for(let i=0;i<170;i++){const x=rnd()*w,y=rnd()*h;c.beginPath();c.moveTo(x,y);c.lineTo(x+(texture==='brushed'?60:8),y+(texture==='fiber'?3:.5));c.stroke();}}
  if(texture==='mineral'){c.strokeStyle='rgba(209,222,220,.02)';c.lineWidth=1;for(let i=0;i<12;i++){const x=rnd()*w,y=rnd()*h;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+70,y+25,x+40,y+85,x+160,y+130);c.stroke();}}
 }else if(['water','lagoon'].includes(texture)){
  c.strokeStyle=texture==='lagoon'?'rgba(133,193,163,.035)':'rgba(163,221,229,.035)';c.lineWidth=2;for(let i=0;i<17;i++){const x=rnd()*w,y=rnd()*h;c.beginPath();c.ellipse(x,y,45+rnd()*100,8+rnd()*14,-.1,Math.PI*.15,Math.PI*1.15);c.stroke();}
 }else if(['frost','prism','opal','glaze'].includes(texture)){
  for(let i=0;i<7;i++){const x=rnd()*w,y=rnd()*h,light=c.createLinearGradient(x,y,x+150,y+100);light.addColorStop(0,'rgba(212,232,236,0)');light.addColorStop(.5,texture==='opal'?'rgba(223,203,229,.035)':'rgba(212,232,236,.035)');light.addColorStop(1,'rgba(212,232,236,0)');c.fillStyle=light;c.beginPath();c.moveTo(x-100,y-80);c.lineTo(x+190,y+40);c.lineTo(x+260,y+110);c.lineTo(x-30,y+10);c.fill();}
 }else if(texture==='cosmos'){
  for(let i=0;i<100;i++){c.fillStyle=i%4?'rgba(176,190,216,.08)':'rgba(204,197,220,.1)';c.beginPath();c.arc(rnd()*w,rnd()*h,.3+rnd()*.35,0,7);c.fill();}
 }else{
  for(let i=0;i<5;i++){const x=rnd()*w,y=rnd()*h,r=w*(.12+rnd()*.16),cloud=c.createRadialGradient(x,y,0,x,y,r);cloud.addColorStop(0,texture==='canopy'?'rgba(111,150,103,.022)':'rgba(190,206,220,.018)');cloud.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=cloud;c.fillRect(x-r,y-r,r*2,r*2);}
 }
 c.restore();
}
