import { decideCPU, decideAirCPU, PERSONALITIES, RANDOM_PERSONALITIES, ROUND_RANDOM_ID, cpuName } from './cpu.js';
export const VERSION='3.1';
export const DIRS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
export const COLORS=['#24b9df','#f5787e','#f4c737','#9c70e5','#67c997','#ed9856','#6995e5','#e57fbd'];
export const DEFAULTS=Object.freeze({map:'standard',speed:5,dashSpeed:11,deceleration:.65,jumpTime:.6,jumps:1,target:6,humans:2,cpus:2,level:5,personality:'random',mode:'ffa',obstacleRound:7,obstacles:10,obstacleEvery:4});
export const MAPS={standard:[28,26],wide:[34,30],large:[40,34]};
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
export function normalizeSettings(input={}){
 const s={...DEFAULTS};for(const k of ['map','mode','personality'])if(typeof input[k]==='string')s[k]=input[k];
 if(!MAPS[s.map])s.map='standard';if(!['ffa','team','coop'].includes(s.mode))s.mode='ffa';
 if(s.personality!=='random'&&!PERSONALITIES.some(p=>p.id===s.personality))s.personality='random';
 // One shared pool. Legacy CPU 1 supplies the pool; later individual profiles are superseded.
 const pool=input.cpuPool&&typeof input.cpuPool==='object'&&!Array.isArray(input.cpuPool)?input.cpuPool:input.cpuProfiles?.[0]||{};
 const legacyPersonality=pool.personality==='common'?'common':PERSONALITIES.some(x=>x.id===pool.personality)?pool.personality:'random';
 s.cpuPool={
  levels:Array.isArray(pool.levels)?[...new Set(pool.levels.filter(n=>Number.isInteger(n)&&n>=1&&n<=10))]:pool.level==null?[]:[Math.round(clamp(pool.level,1,10,5))],
  personalities:Array.isArray(pool.personalities)?[...new Set(pool.personalities.filter(id=>PERSONALITIES.some(x=>x.id===id)))]:pool.personality==null||legacyPersonality==='common'?[]:legacyPersonality==='random'?RANDOM_PERSONALITIES.map(x=>x.id):[legacyPersonality]
 };
 for(const [k,lo,hi]of [['speed',2,10],['dashSpeed',3,20],['deceleration',.1,2],['jumpTime',.3,1.2],['jumps',0,5],['humans',1,4],['cpus',0,3],['level',1,10],['obstacleRound',0,30],['obstacles',0,20],['obstacleEvery',1,10]])s[k]=clamp(input[k]??s[k],lo,hi,s[k]);
 for(const k of ['jumps','humans','cpus','level','obstacleRound','obstacles','obstacleEvery'])s[k]=Math.round(s[k]);
 if(s.mode==='coop'){s.humans=Math.min(3,s.humans);s.cpus=Math.max(1,s.cpus);}
 if(s.mode==='team')s.cpus=4-s.humans;
 s.cpus=Math.min(s.cpus,4-s.humans);if(s.humans+s.cpus<2)s.cpus=1;
 s.dashSpeed=Math.max(s.speed,s.dashSpeed);s.target=Number(input.target)===11?11:6;return s;
}
export function seededRandom(seed=Date.now()){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export class Game{
 constructor(settings={},slots=[],seed=Date.now()){
  this.settings=normalizeSettings(settings);[this.width,this.height]=MAPS[this.settings.map];this.random=seededRandom(seed);this.seed=seed;
  this.round=0;this.time=0;this.status='countdown';this.phaseTime=0;this.result=null;this.changes=0;this.crashes=[];
  const used={};this.players=slots.map((slot,i)=>{
   const pool=this.settings.cpuPool,pick=values=>values[Math.floor(this.random()*values.length)];
   const choice=slot.personality??(pool.personalities.length?pick(pool.personalities):this.settings.personality);
   const personality=choice==='random'?pick(RANDOM_PERSONALITIES).id:PERSONALITIES.some(p=>p.id===choice)?choice:'careful';
   used[personality]=(used[personality]||0)+1;const bot=!!slot.bot,level=Math.round(clamp(slot.level??(pool.levels.length?pick(pool.levels):this.settings.level),1,10,5));
   return{id:slot.id??`slot-${i}`,name:bot?cpuName(personality,level):String(slot.name||'あなた'),bot,level,personality,color:COLORS[i%COLORS.length],index:i,team:this.settings.mode==='coop'?(slot.coopSide??(bot?1:0)):i,score:0,alive:true,ai:{moves:0,nonce:this.random()}};
  });
  const seen={};for(const p of this.players)if(p.bot&&used[p.personality]>1){seen[p.personality]=(seen[p.personality]||0)+1;p.name+=' '+seen[p.personality];}
  if(this.settings.mode==='team'){const order=this.players.map((_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}order.forEach((index,i)=>this.players[index].team=i<Math.ceil(order.length/2)?0:1);}
  this.scores=Array.from({length:this.settings.mode!=='ffa'?2:this.players.length},()=>0);this.newRound();
 }
 inside(x,y){return x>0&&x<this.width-1&&y>0&&y<this.height-1;}
 tile(x,y){return this.inside(x,y)?this.board[y*this.width+x]:-1;}
 put(x,y,value){if(this.inside(x,y)&&!this.tile(x,y)){this.board[y*this.width+x]=value;this.changes++;}}
 newRound(){
  this.round++;this.status='countdown';this.phaseTime=2.5;this.roundElapsed=0;this.result=null;this.crashes=[];this.board=Array(this.width*this.height).fill(0);this.changes++;
  const w=this.width,h=this.height,spawns=[[3,3,1],[w-4,h-4,3],[w-4,3,2],[3,h-4,0],[Math.floor(w/2),3,2],[Math.floor(w/2),h-4,0],[3,Math.floor(h/2),1],[w-4,Math.floor(h/2),3]];
  const anyMP=this.scores.some(n=>n===this.settings.target-1);
  this.players.forEach((p,i)=>{const[x,y,dir]=spawns[i%spawns.length];Object.assign(p,{x,y,dir,prevX:x,prevY:y,renderDir:dir,renderFlight:null,turn:null,progress:0,speed:this.settings.speed,dash:false,flight:null,jumpRequested:false,reverse:false,alive:true,reason:'',jumps:this.settings.jumps+(anyMP&&this.scores[p.team]<this.settings.target-1?1:0),score:this.scores[p.team],ai:{nonce:p.ai.nonce,moves:0,...(p.bot&&p.personality===ROUND_RANDOM_ID?{behavior:RANDOM_PERSONALITIES[Math.floor(this.random()*RANDOM_PERSONALITIES.length)].id}:{})}});});
  const s=this.settings;
  const count=s.obstacleRound>0&&this.round>=s.obstacleRound?Math.min(40,s.obstacles*(1+Math.floor((this.round-s.obstacleRound)/s.obstacleEvery))):0;
  let n=0;for(let tries=0;n<count&&tries<5000;tries++){
   const x=2+Math.floor(this.random()*(w-4)),y=2+Math.floor(this.random()*(h-4));
   if(this.tile(x,y)||this.players.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<5))continue;
   // Never seal a starting lane or create an enclosed pocket around a spawn.
   this.put(x,y,-2);if(this.players.some(p=>this.reachable(p.x,p.y,45)<35))this.board[y*w+x]=0;else n++;
  }
 }
 reachable(x,y,limit=300){
  if(!this.inside(x,y)||this.tile(x,y))return 0;
  const seen=new Set([y*this.width+x]),queue=[[x,y]];let head=0;
  while(head<queue.length&&queue.length<limit){const[cx,cy]=queue[head++];for(const d of DIRS){const nx=cx+d.x,ny=cy+d.y,k=ny*this.width+nx;if(this.inside(nx,ny)&&!this.tile(nx,ny)&&!seen.has(k)){seen.add(k);queue.push([nx,ny]);}}}return queue.length;
 }
 input(id,data){
  const p=this.players.find(p=>p.id===id);if(!p||!p.alive||this.status!=='running')return;
  if(typeof data.dash==='boolean')p.dash=data.dash;
  if(Number.isInteger(data.dir)&&data.dir>=0&&data.dir<4){
   const base=p.flight?p.flight.dir:p.dir;
   if(data.dir===(base+2)%4||(p.flight&&data.dir===(p.flight.launchDir+2)%4)){if(!p.flight)p.reverse=true;}
   else if(p.flight)p.flight.turn=data.dir;
   else p.turn=data.dir;
  }
  if(data.jump===true&&!p.flight&&p.jumps>0)p.jumpRequested=true;
 }
 kill(p,reason){if(!p.alive)return;p.alive=false;p.reason=reason;p.dash=false;p.jumpRequested=false;this.crashes.push({index:p.index,x:p.x,y:p.y,time:this.time,reason,dir:reason==='真後ろに入力'?(p.dir+2)%4:p.dir,kind:reason==='石の上に着地'?'landing':'impact'});}
 resign(id){const p=this.players.find(p=>p.id===id);if(p){this.kill(p,'退出・降参');this.checkEnd();}}
 step(dt){
  dt=Math.max(0,Math.min(.1,dt));this.time+=dt;
  if(this.status==='finished')return;
  if(this.status!=='running'){this.phaseTime-=dt;if(this.phaseTime<=0){if(this.status==='countdown')this.status='running';else this.newRound();}return;}
  this.roundElapsed+=dt;
  for(const p of this.players)if(p.alive){const target=p.dash?this.settings.dashSpeed:this.settings.speed,rate=(this.settings.dashSpeed-this.settings.speed)/(p.dash?.08:this.settings.deceleration);if(p.flight)p.speed=p.flight.speed;else p.speed+=Math.sign(target-p.speed)*Math.min(Math.abs(target-p.speed),Math.max(rate,1)*dt);if(p.reverse){this.put(p.x,p.y,p.index+1);this.kill(p,'真後ろに入力');}}
  let remaining=dt,guard=0;
  while(remaining>1e-8&&this.status==='running'&&guard++<20){
   const alive=this.players.filter(p=>p.alive);if(!alive.length){this.checkEnd();break;}
   const wait=Math.min(...alive.map(p=>(1-p.progress)/p.speed));
   if(wait>remaining+1e-8){for(const p of alive)p.progress+=p.speed*remaining;break;}
   for(const p of alive)p.progress+=p.speed*wait;remaining-=wait;
   const moving=alive.filter(p=>p.progress>=1-1e-7);for(const p of moving)p.progress=Math.max(0,p.progress-1);
   this.moveTogether(moving);this.checkEnd();
  }
  this.checkEnd();
 }
 moveTogether(moving){
  const proposals=[];
  for(const p of moving){
   if(p.bot){const action=p.flight?decideAirCPU(this,p):decideCPU(this,p);if(action)this.input(p.id,action);}
   if(p.reverse){this.put(p.x,p.y,p.index+1);this.kill(p,'真後ろに入力');continue;}
   if(!p.flight&&p.turn!==null){p.dir=p.turn;p.turn=null;}
   const takeoff=p.jumpRequested&&!p.flight&&p.jumps>0;p.jumpRequested=false;
   if(takeoff){const distance=Math.max(3,Math.ceil(p.speed*this.settings.jumpTime-1e-8));p.flight={dir:p.dir,launchDir:p.dir,total:distance,remaining:distance,turn:null,speed:p.speed};p.jumps--;}
   if(p.flight&&p.flight.turn!==null){p.flight.dir=p.flight.turn;p.dir=p.flight.turn;p.flight.turn=null;}
   const airborne=!!p.flight&&p.flight.remaining>1;
   if(!p.flight||takeoff)this.put(p.x,p.y,p.index+1);
   const d=DIRS[p.flight?p.flight.dir:p.dir];proposals.push({p,x:p.x+d.x,y:p.y+d.y,airborne,dead:false,reason:''});
  }
  for(const a of proposals){
   if(!this.inside(a.x,a.y)){a.dead=true;a.reason='外周に衝突';}
   else if(!a.airborne&&this.tile(a.x,a.y)){a.dead=true;a.reason=a.p.flight?'石の上に着地':'石に衝突';}
   if(a.airborne)continue;
   for(const other of this.players){if(other===a.p||!other.alive)continue;const b=proposals.find(b=>b.p===other);
    if(b){if(!b.airborne&&b.x===a.x&&b.y===a.y){a.dead=b.dead=true;a.reason=b.reason='キャラ同士の衝突';}}
    else if(!other.flight&&other.x===a.x&&other.y===a.y){a.dead=true;a.reason='キャラ同士の衝突';this.kill(other,'キャラ同士の衝突');}
   }
  }
  for(const a of proposals){const p=a.p;p.prevX=p.x;p.prevY=p.y;p.renderDir=p.flight?p.flight.dir:p.dir;p.renderFlight=p.flight?{...p.flight}:null;p.x=a.x;p.y=a.y;if(p.flight){p.flight.remaining--;if(p.flight.remaining<=0)p.flight=null;}
   if(a.dead)this.kill(p,a.reason);}
 }
 checkEnd(){
  if(this.status!=='running'&&this.status!=='countdown')return;
  const teams=[...new Set(this.players.filter(p=>p.alive).map(p=>p.team))];if(teams.length>1)return;
  const winner=teams.length?teams[0]:null;if(winner!==null)this.scores[winner]++;
  for(const p of this.players){p.score=this.scores[p.team];p.dash=false;}
  const final=winner!==null&&this.scores[winner]>=this.settings.target;
  this.result={winner,draw:winner===null,final,at:this.time,names:winner===null?[]:this.players.filter(p=>p.team===winner).map(p=>p.name)};
  this.status=final?'finished':'roundover';this.phaseTime=2.8;
 }
 snapshot(){return{version:VERSION,settings:this.settings,width:this.width,height:this.height,round:this.round,time:this.time,phaseTime:this.phaseTime,status:this.status,result:this.result,roundElapsed:this.roundElapsed,board:this.board,changes:this.changes,scores:this.scores,crashes:this.crashes,players:this.players.map(({ai,...p})=>p)};}
}
