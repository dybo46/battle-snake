import {normalizeSettings} from './core.js';
import {RANDOM_PERSONALITIES} from './cpu.js';

// A whole first-to set finishes before the result display starts this clock.
export class WatchLoop{
 constructor(){this.stop();}
 stop(){this.enabled=false;this.rules=null;this.key=null;this.last=null;this.remaining=6000;this.fired=false;}
 start(rules){this.stop();this.enabled=true;this.rules=normalizeSettings(rules);}
 tick({key,finished,paused=false,now}){
  if(!this.enabled)return false;
  if(this.key!==key||!finished){this.key=key;this.last=finished?now:null;this.remaining=6000;this.fired=false;return false;}
  if(this.last!==null&&!paused)this.remaining=Math.max(0,this.remaining-Math.max(0,now-this.last));
  this.last=now;
  if(this.remaining>0||this.fired)return false;
  this.fired=true;return true;
 }
}

export function continuedWatchSlots(rules,previous=[],random=Math.random){
 const s=normalizeSettings(rules),choices=s.cpuPool.personalities.length?s.cpuPool.personalities:s.personality==='random'?RANDOM_PERSONALITIES.map(p=>p.id):[s.personality];
 return Array.from({length:4},(_,i)=>{
  const old=previous[i]?.personality,other=choices.filter(p=>p!==old),pool=other.length?other:choices;
  return{id:'local-cpu-'+i,bot:true,personality:pool[Math.min(pool.length-1,Math.floor(random()*pool.length))],...(s.mode==='coop'?{coopSide:i<2?0:1}:{})};
 });
}
