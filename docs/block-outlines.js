// A separate experimental skin for every accepted base. No base artwork changes.
// width/radius are cell-relative; shade darkens the actual tile's hue, not black.
const edge=(width,radius,shade,finish,note)=>({width,radius,shade,finish,note});
export const OUTLINE_STYLES={
 ah1:edge(.063,.072,.64,'quarry','石の厚みが見える角縁'),
 ak1:edge(.046,.09,.59,'polish','白磁の滑らかな細縁'),
 ak2:edge(.061,.045,.65,'wood','木口と溝を残す木枠'),
 ak3:edge(.072,.11,.57,'clay','手びねりの少し揺れる縁'),
 ak4:edge(.047,.085,.70,'glass','透明感を残した二重ガラス縁'),
 aa8:edge(.069,.026,.68,'facet','黒曜石の面を拾う角張った縁'),
 ab3:edge(.058,.065,.65,'frost','氷の外形を締める冷色の縁'),
 ab9:edge(.064,.085,.60,'toy','おもちゃの丸い成形縁'),
 ac2:edge(.065,.16,.53,'jelly','ゼリーの丸い濃色リップ'),
 ac3:edge(.057,.13,.59,'candy','糖衣の丸みを包む縁'),
 ac6:edge(.044,.075,.72,'glass','ソーダガラスの深い色の二重縁'),
 ac7:edge(.050,.073,.62,'opal','真珠色の石の細い遊色縁'),
 ac8:edge(.060,.075,.56,'sugar','砂糖の粒を残す細かな縁'),
 ad3:edge(.056,.04,.69,'neon','光を残して外形を締める暗い縁'),
 ad5:edge(.059,.09,.61,'sky','空色の玩具石に丸い縁'),
 ad7:edge(.064,.03,.72,'tech','パネルの四隅を拾う金属縁'),
 ad8:edge(.055,.07,.59,'rose','陶器の斜め面につながる縁'),
 ae1:edge(.048,.095,.61,'porcelain','厚い釉薬を囲う白磁の細縁'),
 ae2:edge(.073,.035,.67,'metal','工場の留め具付き金属縁'),
 ae3:edge(.053,.035,.70,'crystal','切子のカット面に沿う二段縁'),
 ae5:edge(.067,.045,.66,'timber','三色それぞれの木口の溝縁'),
 ae7:edge(.052,.015,.60,'paper','折り紙の端の薄い折り返し縁'),
 af7:edge(.059,.065,.71,'city','電飾を残す暗い筐体縁'),
 af3:edge(.062,.075,.64,'snow','雪の下の氷を囲う縁'),
 ag7:edge(.066,.04,.63,'carved','森の木枠の彫り込み縁'),
 ag8:edge(.068,.065,.62,'pop','二段の玩具石の丸い縁'),
 ag9:edge(.051,.10,.64,'pearltech','白いパネルの精密な縁'),
 ai2:edge(.060,.055,.68,'polar','極地の氷の角を拾う縁'),
 ai4:edge(.065,.06,.66,'lagoon','緑の岩石に波形の彫り込み縁'),
 aj1:edge(.070,.035,.67,'graphite','粗い石墨のしっかりした縁'),
 al1:edge(.057,.065,.69,'cosmos','星の光を残す青黒い縁')
};
export const BRIGHT_BACKGROUND_TRIALS=[{"id": "sandlight-cream", "name": "くっきり・クリーム", "color": "#fdeab1", "floor": ["#fdeab1", "#fdeab1"], "sandLuminanceReference": 0.8273994248149777}, {"id": "sandlight-porcelain", "name": "くっきり・白磁", "color": "#ebebeb", "floor": ["#ebebeb", "#ebebeb"], "sandLuminanceReference": 0.8273994248149777}, {"id": "sandlight-leaf", "name": "くっきり・若草", "color": "#c0fc93", "floor": ["#c0fc93", "#c0fc93"], "sandLuminanceReference": 0.8273994248149777}, {"id": "sandlight-blue", "name": "くっきり・スカイ", "color": "#d8eefe", "floor": ["#d8eefe", "#d8eefe"], "sandLuminanceReference": 0.8273994248149777}, {"id": "sandlight-lilac", "name": "くっきり・ライラック", "color": "#f3e6fe", "floor": ["#f3e6fe", "#f3e6fe"], "sandLuminanceReference": 0.8273994248149777}, {"id": "sandlight-peach", "name": "くっきり・ピーチ", "color": "#fee6d6", "floor": ["#fee6d6", "#fee6d6"], "sandLuminanceReference": 0.8273994248149777}];
export const BRIGHT_BACKGROUND_REPLACEMENTS={"light-test-ivory":"sandlight-cream","light-test-gray":"sandlight-porcelain","light-test-green":"sandlight-leaf","light-test-blue":"sandlight-blue","light-test-lilac":"sandlight-lilac","light-test-peach":"sandlight-peach"};
export function outlinedSkins(bases){return bases.flatMap(base=>[base,{...base,id:base.id+'-edge',baseId:base.id,ref:base.ref+'-E',name:base.name+'〈縁〉',outline:OUTLINE_STYLES[base.id],note:base.note+'／'+OUTLINE_STYLES[base.id].note}]);}
function dark(hex,amount){return '#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-amount)).toString(16).padStart(2,'0')).join('');}
function path(c,inset,radius){c.beginPath();c.roundRect(inset,inset,1-inset*2,1-inset*2,radius);}
// Paint a solid cell-sized surround BEHIND the untouched original block.
// The cutout matches the original silhouette; its center remains transparent,
// including the original glass transparency. Full-cell outer edges meet with
// no floor-colored cracks at joined edges and fully occupied four-way corners.
export const OUTER_CORNER_RADIUS=.055;
// N=1, E=2, S=4, W=8. Only exposed convex corners are softened.
export function outlineCornerRadii(connections=0,radius=OUTER_CORNER_RADIUS){return[(connections&9)?0:radius,(connections&3)?0:radius,(connections&6)?0:radius,(connections&12)?0:radius];}
export function drawBlockOutline(c,x,y,u,baseColor,style,seed=0,base={},connections=0){
 const pad=base.variant?.045:.055,r=base.variant?(base.pattern==='jelly'?.16:base.pattern==='candy'?.13:base.pattern==='graphite'?.045:.075):(base.material==='clay'?.1:.085);
 c.save();c.translate(x,y);c.scale(u,u);c.shadowColor='transparent';c.beginPath();c.roundRect(0,0,1,1,outlineCornerRadii(connections,style.outerRadius??OUTER_CORNER_RADIUS));c.roundRect(pad,pad,1-pad*2,1-pad*2,r);c.clip('evenodd');
 const{width,radius,shade,finish}=style;c.fillStyle=dark(baseColor,shade);c.fillRect(0,0,1,1);
 c.strokeStyle=dark(baseColor,Math.min(.9,shade+.1));c.lineWidth=Math.min(.014,width*.2);c.lineJoin='round';c.lineCap='round';path(c,.008,Math.min(.045,radius*.35));c.stroke();
 c.strokeStyle=dark(baseColor,shade*.72);c.lineWidth=width*.35;path(c,pad,r);c.stroke();
 // Individual material marks are clipped to the new surround, never the body.
 c.lineWidth=.01;c.strokeStyle=dark(baseColor,shade*.82);
 switch(finish){
  case'wood':case'timber':case'carved':
   for(const yy of [.018,.98]){c.beginPath();c.moveTo(.08,yy);c.bezierCurveTo(.28,yy-.004,.66,yy+.004,.92,yy);c.stroke();}c.beginPath();c.moveTo(.02,.16);c.lineTo(.02,.84);c.stroke();break;
  case'glass':case'crystal':case'frost':case'polar':case'opal':case'polish':case'porcelain':
   c.strokeStyle=dark(baseColor,shade*.42);c.beginPath();c.moveTo(.12,.018);c.lineTo(.82,.018);c.moveTo(.018,.12);c.lineTo(.018,.7);c.stroke();if(['crystal','polar','frost'].includes(finish)){c.strokeStyle=dark(baseColor,shade*.82);for(const xx of [.22,.66]){c.beginPath();c.moveTo(xx,0);c.lineTo(xx+.07,.07);c.stroke();}}break;
  case'facet':case'paper':case'rose':
   for(const [xx,yy,dx,dy]of [[0,.14,.14,-.14],[.86,0,.14,.14],[1,.86,-.14,.14],[.14,1,-.14,-.14]]){c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+dx,yy+dy);c.stroke();}break;
  case'tech':case'metal':case'pearltech':
   c.fillStyle=dark(baseColor,shade*.65);for(const xx of [.025,.975])for(const yy of [.025,.975]){c.beginPath();c.arc(xx,yy,finish==='metal'?.011:.008,0,7);c.fill();}break;
  case'quarry':case'graphite':case'sugar':
   for(let i=0;i<8;i++){const xx=.12+i*.105,yy=i%2?.012:.987;c.strokeStyle=dark(baseColor,i%2?shade*.7:Math.min(.9,shade+.08));c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+.02,yy+(i%2?.006:-.006));c.stroke();}break;
  case'clay':case'jelly':case'candy':case'toy':case'pop':case'sky':
   c.strokeStyle=dark(baseColor,shade*.62);c.beginPath();c.moveTo(.15,.021);c.quadraticCurveTo(.5,.013,.85,.021);c.stroke();break;
  case'neon':case'city':
   c.strokeStyle=dark(baseColor,shade*.5);for(const xx of [.2,.65]){c.beginPath();c.moveTo(xx,.015);c.lineTo(xx+.12,.015);c.moveTo(.985,xx);c.lineTo(.985,xx+.12);c.stroke();}break;
  case'lagoon':
   c.beginPath();c.moveTo(.1,.98);c.bezierCurveTo(.35,.968,.6,.992,.9,.98);c.stroke();break;
  case'snow':
   c.strokeStyle=dark(baseColor,shade*.35);c.beginPath();c.moveTo(.12,.02);c.lineTo(.88,.02);c.stroke();break;
  case'cosmos':
   c.strokeStyle=dark(baseColor,shade*.45);c.beginPath();c.moveTo(.015,.025);c.lineTo(.06,.025);c.moveTo(.033,.007);c.lineTo(.033,.05);c.stroke();break;
 }
 c.restore();
}
