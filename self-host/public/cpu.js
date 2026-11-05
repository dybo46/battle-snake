import {enclosureTarget,enclosureRoute,routeTo,routeScore,pressureGain,escapeSituation,escapeRoute} from './cpu-tactics.js';
const DIRS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
export const PERSONALITIES=[
 {id:'careful',name:'丁寧AI',description:'広い場所を確保し、端から丁寧に埋めます。'},
 {id:'spiral',name:'渦巻きAI',description:'大きく囲って、内側へ巻きながら待ちます。'},
 {id:'ramen',name:'ラーメンAI',description:'折り返しを使って、隙間を順に埋めます。'},
 {id:'cut',name:'横切りAI',description:'相手の前をダッシュで横切り、道をふさぎます。'},
 {id:'jumper',name:'ジャンプAI',description:'積極的に飛び越えて、別の区画へ移ります。'},
 {id:'feint',name:'フェイントAI',description:'曲がり方やダッシュに緩急をつけます。'},
 {id:'chaos',name:'気まぐれAI',description:'突然加速したり、寄り道したりします。'},
 {id:'pincer',name:'連携AI',description:'仲間がいれば挟み込み、単独なら相手を1人決めて周辺をダッシュで囲います。石の道で使える場所を狭め、相手が脱落すると次の敵を選びます。'},
 {id:'random-round',name:'毎ランダムAI',description:'各ラウンド開始時に性格を選び直します。難易度と名前は先取戦の決着まで同じです。'},
 {id:'attack',name:'攻撃AI',description:'前を横切る・回り込む・追い詰める攻撃をバランスよく使います。'},
 {id:'reckless',name:'乱暴AI',description:'その時いちばん近い敵へ、常に攻撃を仕掛けに行きます。'},
 {id:'dasher',name:'ダッシュAI',description:'ダッシュを多用し、高速ジャンプも狙います。着地点を読み違えることも多めです。'},
 {id:'stalker',name:'ストーカーAI',description:'最初に選んだ相手の近くをついて回ります。攻撃は狙わず、相手のダッシュを少し遅れて真似します。相手が脱落すると別の相手を選びます。'},
 {id:'normal',name:'平均AI',description:'状況を見て普通に判断するノーマルタイプ。近い敵にはダッシュで横切りや囲い込みを狙い、敵の石で囲まれそうなら攻撃よりダッシュ脱出を優先します。必要ならジャンプも使います。'},
 {id:'drunk',name:'酔いどれAI',description:'短い距離で左右へふらふら曲がりながら、通常速度でゆったりうろちょろします。ダッシュせず、長い直進を避けます。通れないときは安全な道やジャンプを探します。'}
];
export const ROUND_RANDOM_ID='random-round';
export const RANDOM_PERSONALITIES=PERSONALITIES.filter(p=>p.id!==ROUND_RANDOM_ID);
export const effectivePersonality=p=>p.personality===ROUND_RANDOM_ID?(p.ai.behavior||'careful'):p.personality;
const CPU_TITLES=['赤ちゃん','ひよこ','見習い','ルーキー','さん','先輩','エリート','先生','教授','博士'];
export function cpuName(personality,level){const n=PERSONALITIES.find(p=>p.id===personality)?.name||'丁寧AI';return `${n}${CPU_TITLES[level-1]??CPU_TITLES[4]}`;}
function free(game,x,y){return game.inside(x,y)&&!game.tile(x,y);}
export function jumpOptions(game,p,distance){
 const options=[],dirs=[p.dir,(p.dir+1)%4,(p.dir+3)%4];
 const add=(launchDir,turnAt,turnDir)=>{
  const a=DIRS[launchDir],b=DIRS[turnDir],x=p.x+a.x*turnAt+b.x*(distance-turnAt),y=p.y+a.y*turnAt+b.y*(distance-turnAt);
  const valid=free(game,x,y)&&!game.players.some(q=>q!==p&&q.alive&&!q.flight&&q.x===x&&q.y===y);
  let inBounds=true,cx=p.x,cy=p.y;for(let i=0;i<distance;i++){const d=DIRS[i<turnAt?launchDir:turnDir];cx+=d.x;cy+=d.y;if(!game.inside(cx,cy)){inBounds=false;break;}}
  const area=valid&&inBounds?game.reachable(x,y,130+p.level*12):0;options.push({launchDir,turnAt,turnDir,x,y,valid:valid&&inBounds,area,curved:launchDir!==turnDir});
 };
 for(const dir of dirs){add(dir,distance,dir);for(let at=1;at<distance;at++)for(const turn of [(dir+1)%4,(dir+3)%4])add(dir,at,turn);}
 return options.sort((a,b)=>Number(b.valid)-Number(a.valid)||b.area-a.area);
}
export function decideAirCPU(game,p){
 const plan=p.ai.jumpPlan;if(!plan||!p.flight||plan.done)return null;
 const travelled=p.flight.total-p.flight.remaining;if(travelled<plan.turnAt)return null;
 plan.done=true;return{dir:plan.turnDir};
}
export function decideCPU(game,p){
 const random=game.random,level=p.level,kind=effectivePersonality(p);p.ai.moves++;
 const enemies=game.players.filter(q=>q.alive&&q!==p&&(game.settings.mode==='ffa'||q.team!==p.team));
 const distance=q=>Math.abs(q.x-p.x)+Math.abs(q.y-p.y);
 const nearest=enemies.slice().sort((a,b)=>distance(a)-distance(b))[0];
 let target=null,route=null,partners=[],escaping=false,escapeJump=null;
 if(kind==='stalker'){
  target=enemies.find(q=>q.id===p.ai.targetId);
  if(!target&&enemies.length){target=enemies[Math.floor(random()*enemies.length)];p.ai.targetId=target.id;p.ai.observedDash=null;p.ai.mimicDash=false;}
  if(target){if(p.ai.observedDash!==target.dash){p.ai.observedDash=target.dash;p.ai.reactAt=game.time+.18+(10-level)*.025;}if(game.time>=p.ai.reactAt)p.ai.mimicDash=!!target.dash;}
 }else if(kind==='attack'||kind==='reckless'){
  target=nearest;p.ai.targetId=target?.id||null;
  if(kind==='attack'&&(p.ai.attackMode==null||p.ai.moves%12===1))p.ai.attackMode=Math.floor(random()*3);
 }
 if(kind==='pincer'){
  partners=game.players.filter(q=>q!==p&&q.alive&&q.bot&&effectivePersonality(q)==='pincer'&&(game.settings.mode==='ffa'||q.team===p.team));
  if(!enemies.some(q=>!partners.includes(q)))partners=[];
  target=enclosureTarget(game,p,enemies,partners);route=enclosureRoute(game,p,target,partners);p.ai.tactic='enclose';
 }else if(kind==='normal'){
  const danger=escapeSituation(game,p,enemies);escaping=danger.trapped;p.ai.escapeDanger=danger;
  if(escaping){p.ai.tactic='escape';p.ai.targetId=null;route=escapeRoute(game,p,enemies);
   if(p.jumps>0)escapeJump=jumpOptions(game,p,Math.max(3,Math.ceil(p.speed*game.settings.jumpTime-1e-8))).find(o=>o.valid&&o.area>danger.area+16);
  }else if(nearest&&distance(nearest)<=10){target=nearest;p.ai.targetId=target.id;if(p.ai.normalMode==null||p.ai.moves%12===1)p.ai.normalMode=random()<.5?'enclose':'cut';p.ai.tactic=p.ai.normalMode;
   if(p.ai.tactic==='enclose')route=enclosureRoute(game,p,target);else{const v=DIRS[target.dir];route=routeTo(game,{x:target.x+v.x*3,y:target.y+v.y*3});}
  }else{p.ai.tactic='survive';p.ai.targetId=null;}
 }else if(kind==='drunk'){
  p.ai.wanderSide??=random()<.5?1:-1;p.ai.wanderAfter??=1+Math.floor(random()*3);p.ai.wanderRun??=0;p.ai.tactic='wander';
 }
 const finish=action=>{if(kind==='drunk'){const turned=action.dir!==p.dir;p.ai.wanderRun=turned?1:p.ai.wanderRun+1;if(turned){p.ai.wanderSide*=-1;p.ai.wanderAfter=1+Math.floor(random()*3);}action.dash=false;}return action;};
 const dirs=[p.dir,(p.dir+1)%4,(p.dir+3)%4];
 const candidates=dirs.map(dir=>{
  const d=DIRS[dir],x=p.x+d.x,y=p.y+d.y,valid=free(game,x,y)&&!game.players.some(q=>q!==p&&q.alive&&!q.flight&&q.x===x&&q.y===y);
  if(!valid)return{dir,x,y,score:-1e8,valid:false,area:0};
  const area=game.reachable(x,y,70+level*30);let straight=0;while(straight<4+level&&free(game,x+d.x*straight,y+d.y*straight))straight++;
  let score=Math.min(area,100+level*8)*.15+straight*.6+(dir===p.dir?2.5:0)+random()*(11-level)*.8;
  const edge=Math.min(x-1,y-1,game.width-2-x,game.height-2-y);
  if(['careful','spiral','ramen'].includes(kind)){score+=dir===p.dir?9:0;score+=Math.max(0,3-edge)*.9;if(kind==='spiral'&&dir===(p.dir+1)%4)score+=2;if(kind==='ramen'&&dir!==p.dir)score+=(p.ai.moves%4<2?dir===(p.dir+1)%4:dir===(p.dir+3)%4)?2:0;}
  for(const q of enemies){const dist=Math.abs(q.x-x)+Math.abs(q.y-y);if(dist<3)score-=(4-dist)*(kind==='reckless'?.15:kind==='attack'||kind==='normal'||kind==='pincer'?.4:level*.5);}
  if(kind==='cut'&&nearest){const v=DIRS[nearest.dir],tx=nearest.x+v.x*3,ty=nearest.y+v.y*3;score-=(Math.abs(tx-x)+Math.abs(ty-y))*.65;}
  if(route){score+=routeScore(game,route,x,y);if(p.ai.tactic==='enclose')score+=pressureGain(game,p,target,dir)*.4;}
  if(kind==='drunk'&&p.ai.wanderRun>=p.ai.wanderAfter){const preferred=(p.dir+(p.ai.wanderSide===1?1:3))%4;if(dir!==p.dir&&area>=8)score+=dir===preferred?30:22;else if(dir===p.dir)score-=10;}

  if(target){
   const v=DIRS[target.dir];
   if(kind==='stalker'){
    // Follow behind or alongside at a comfortable distance, never aim across the target's nose.
    const tx=target.x-v.x*3,ty=target.y-v.y*3,dist=Math.abs(target.x-x)+Math.abs(target.y-y);
    score-=(Math.abs(tx-x)+Math.abs(ty-y))*1.8;if(dist<3)score-=(3-dist)*8;
   }else if(kind==='attack'||kind==='reckless'){
    const offset=kind==='reckless'?1:[4,2,-1][p.ai.attackMode],side=kind==='attack'&&p.ai.attackMode===1?2:0;
    const tx=target.x+v.x*offset-v.y*side,ty=target.y+v.y*offset+v.x*side;
    score-=(Math.abs(tx-x)+Math.abs(ty-y))*(kind==='reckless'?3:1.6);
   }
  }
  if(kind==='feint'&&p.ai.moves%9===0&&dir!==p.dir)score+=5;
  if(kind==='chaos')score+=random()*8;
  return{dir,x,y,score,valid:true,area,straight};
 });
 candidates.sort((a,b)=>b.score-a.score);let chosen=candidates[0];
 // Rare judgment lapses use real movement and collisions; never change the winner directly.
 const lapse=level<8&&p.ai.moves>12&&random()<(8-level)*.0015;
 if(lapse)chosen=candidates[Math.floor(random()*candidates.length)];
 let jump=false;const dir=chosen.dir,d=DIRS[dir];
 const wantJump=(!!escapeJump||!chosen.valid||chosen.area<20||(kind==='jumper'&&random()<.065)||(kind==='dasher'&&p.speed>game.settings.speed*1.25&&random()<.045)||(kind==='attack'&&nearest&&distance(nearest)<8&&random()<.025));
 const jumpDistance=Math.max(3,Math.ceil(p.speed*game.settings.jumpTime-1e-8));
 if(wantJump&&p.jumps>0){
  const options=jumpOptions(game,p,jumpDistance),straight=options.find(o=>!o.curved&&o.valid),curved=options.find(o=>o.curved&&o.valid);
  const preferCurve=curved&&(!straight||curved.area>straight.area+12||random()<(kind==='jumper'?.48:.28));
  let option=escapeJump||(preferCurve?curved:straight||options[0]);
  if(option?.valid||lapse){
   p.ai.jumpPlan=null;
   if(option.curved){
    const dashFlight=p.speed>game.settings.speed*1.25;
    // A fast curved jump is deliberately hard to estimate even at high levels.
    // The estimate changes, never the real speed, flight length or collision rules.
    const misread=random()<Math.min(.98,(dashFlight?.96-level*.012:.52-level*.028)+(kind==='dasher'?.12:0));
    let turnAt=option.turnAt,estimatedDistance=jumpDistance;
    if(misread&&dashFlight){
     const magnitude=2+Math.floor(random()*(level<=4?4:3));
     estimatedDistance=Math.max(3,jumpDistance+(random()<.5?-magnitude:magnitude));
     const narrowness=o=>DIRS.reduce((sum,d)=>sum+Number(!free(game,o.x+d.x,o.y+d.y)),0);
     const mistaken=jumpOptions(game,p,estimatedDistance).filter(o=>o.curved&&o.valid).sort((a,b)=>narrowness(b)-narrowness(a)||b.area-a.area)[0];
     if(mistaken){option=mistaken;turnAt=option.turnAt;}
     else turnAt=turnAt<jumpDistance-1?turnAt+1:Math.max(1,turnAt-1);
    }else if(misread)turnAt=turnAt<jumpDistance-1?turnAt+1:Math.max(1,turnAt-1);
    p.ai.jumpPlan={turnAt,turnDir:option.turnDir,done:false,misread,dashFlight,estimatedDistance,intended:{x:option.x,y:option.y}};
   }
   return finish({dir:option.launchDir,jump:true,dash:kind==='dasher'||(kind==='normal'&&escaping)});
  }
 }
 let dash=false;
 if(kind==='drunk')dash=false;
 else if(kind==='pincer')dash=!!target&&chosen.valid&&chosen.straight>=4;
 else if(kind==='normal'&&(escaping||target))dash=chosen.valid&&chosen.straight>=(escaping?3:4);
 else if(kind==='stalker')dash=!!p.ai.mimicDash;
 else if(kind==='dasher'&&chosen.valid&&chosen.straight>3)dash=random()<.9;
 else if((kind==='attack'||kind==='reckless')&&chosen.valid&&chosen.straight>3)dash=random()<(kind==='reckless'?.8:.65);
 else if(chosen.valid&&chosen.straight>5){if(kind==='cut'||kind==='pincer')dash=random()<.6;else if(kind==='chaos'||kind==='feint')dash=random()<.35;else dash=level>=6&&random()<.08;}
 // Look far enough ahead to allow the same braking distance as a human.
 const braking=Math.ceil((p.speed+game.settings.speed)*game.settings.deceleration/2)+2;
 for(let i=1;i<=Math.min(braking,kind==='dasher'||(kind==='normal'&&escaping)?3:kind==='pincer'||(kind==='normal'&&target)?4:8);i++)if(!free(game,p.x+d.x*i,p.y+d.y*i)){dash=false;break;}
 return finish({dir,jump,dash});
}
