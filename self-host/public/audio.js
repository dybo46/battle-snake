import{SOUND_BANK,normalizeAudio,soundFile}from'./sound-bank.js';
import{StepMixer}from'./step-mixer.js';
export class GameAudio{
 constructor(settings={},random=Math.random){this.settings=normalizeAudio(settings);this.random=random;this.cache=new Map();this.context=null;this.master=null;this.stepBus=null;this.otherFilter=null;this.active=new Set();this.timers=new Set();this.stepVoices=new Map();this.mixer=new StepMixer();this.previous=null;this.seenCrashes=new Set();this.generation=0;this.matchKey=null;this.randomPicks={};this.previewPicks={};this.previewUntil=0;this.duckUntil=0;}
 currentId(kind){const id=this.settings[kind];return id==='random'?this.randomPicks[kind]||null:id;}
 drawId(kind){return String(1+Math.min(SOUND_BANK[kind].length-1,Math.floor(this.random()*SOUND_BANK[kind].length))).padStart(2,'0');}
 beginSet(key){if(this.matchKey===key)return;this.matchKey=key;this.randomPicks=Object.fromEntries(Object.keys(SOUND_BANK).map(kind=>[kind,this.drawId(kind)]));this.mixer.reset();if(this.context)for(const kind of Object.keys(SOUND_BANK))this.load(kind,this.currentId(kind)).catch(()=>{});}
 stepId(){return this.currentId('step');}
 async unlock(){
  if(!this.context){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;this.context=new C();this.master=this.context.createGain();this.stepBus=this.context.createGain();this.stepBus.connect(this.master);this.otherFilter=this.context.createBiquadFilter();this.otherFilter.type='lowpass';this.otherFilter.frequency.value=2600;this.otherFilter.Q.value=.5;this.otherFilter.connect(this.stepBus);const compressor=this.context.createDynamicsCompressor();compressor.threshold.value=-5;compressor.knee.value=6;compressor.ratio.value=8;compressor.attack.value=.002;compressor.release.value=.08;this.master.connect(compressor);compressor.connect(this.context.destination);this.applyGain();}
  await this.context.resume();for(const kind of Object.keys(SOUND_BANK))this.load(kind,this.currentId(kind)).catch(()=>{});
 }
 applyGain(){if(this.master)this.master.gain.setTargetAtTime(this.settings.volume/100,this.context.currentTime,.01);}
 configure(settings){this.settings=normalizeAudio(settings);this.applyGain();if(!this.settings.enabled)this.stop();if(this.context)for(const kind of Object.keys(SOUND_BANK))this.load(kind,this.currentId(kind)).catch(()=>{});}
 async load(kind,id){if(!id||id==='none'||id==='random'||!this.context)return null;const key=kind+'-'+id;if(!this.cache.has(key))this.cache.set(key,fetch(soundFile(kind,id)).then(r=>{if(!r.ok)throw new Error('音を読み込めません');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)).catch(e=>{this.cache.delete(key);throw e;}));return this.cache.get(key);}
 duck(kind){if(!this.stepBus)return;const now=this.context.currentTime;this.duckUntil=Math.max(this.duckUntil,now+(kind==='crash'?.24:kind==='start'?.18:.14));this.stepBus.gain.cancelScheduledValues(now);this.stepBus.gain.setTargetAtTime(.28,now,.008);this.stepBus.gain.setTargetAtTime(1,this.duckUntil,.04);}
 async play(kind,{preview=false,level=1,id=null,stepGroup='focus',delay=0}={}){
  if(!this.context||this.context.state!=='running'||(!this.settings.enabled&&!preview)||(!preview&&performance.now()<this.previewUntil))return;
  id=id||this.currentId(kind);if(!id||id==='none')return;const generation=this.generation,buffer=await this.load(kind,id);if(!buffer||generation!==this.generation)return;
  const now=this.context.currentTime;
  if(kind==='step'&&this.stepVoices.has(stepGroup)){const voice=this.stepVoices.get(stepGroup);try{voice.gain.gain.setTargetAtTime(0,now,.0008);voice.source.stop(now+.004);}catch{}}
  if(kind!=='step')this.duck(kind);
  const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.gain.value=this.settings[kind+'Gain']/100*level;source.connect(gain);
  gain.connect(kind==='step'?(stepGroup==='other'?this.otherFilter:this.stepBus):this.master);
  this.active.add(source);if(kind==='step')this.stepVoices.set(stepGroup,{source,gain});source.onended=()=>{this.active.delete(source);gain.disconnect();if(this.stepVoices.get(stepGroup)?.source===source)this.stepVoices.delete(stepGroup);};source.start(now+delay);
 }
 async preview(kind,fast=false){
  await this.unlock();this.stop();const id=this.settings[kind]==='random'?this.drawId(kind):this.settings[kind];this.previewPicks[kind]=id;this.previewUntil=performance.now()+(kind==='step'?1400:650);
  if(kind!=='step')return this.play(kind,{preview:true,id});
  const generation=this.generation;for(let i=0;i<6;i++)this.schedule(()=>this.play(kind,{preview:true,id}).catch(()=>{}),i*(fast?90:200),generation);
 }
 schedule(action,delay,generation=this.generation){const timer=setTimeout(()=>{this.timers.delete(timer);if(generation===this.generation)action();},delay);this.timers.add(timer);}
 async previewFootsteps(){
  await this.unlock();this.stop();const id=this.settings.step==='random'?this.drawId('step'):this.settings.step;this.previewPicks.step=id;this.previewUntil=performance.now()+2700;
  const mixer=new StepMixer(),roster=[{id:'you'},{id:'cpu1'},{id:'cpu2'},{id:'cpu3'}],previous=[-1,-1,-1,-1],speeds=[5,5,11,7],generation=this.generation;
  for(let frame=0;frame<144;frame++){const t=frame/60,moved=roster.filter((p,i)=>{const step=Math.floor(t*speeds[i]);if(step===previous[i])return false;previous[i]=step;return true;});
   for(const event of mixer.choose(moved,'you',t,roster,this.settings.stepDensity)){if(event.group==='other'&&this.settings.otherStepGain===0)continue;this.schedule(()=>this.play('step',{preview:true,id,stepGroup:event.group,level:event.group==='other'?this.settings.otherStepGain/100:1,delay:event.delay}).catch(()=>{}),t*1000,generation);}
  }
 }
 stop(){this.generation++;this.previewUntil=0;for(const timer of this.timers)clearTimeout(timer);this.timers.clear();for(const source of this.active)try{source.stop();}catch{}this.active.clear();this.stepVoices.clear();if(this.stepBus){this.stepBus.gain.cancelScheduledValues(this.context.currentTime);this.stepBus.gain.setValueAtTime(1,this.context.currentTime);}this.duckUntil=0;}
 reset(){this.stop();this.previous=null;this.seenCrashes.clear();this.matchKey=null;this.randomPicks={};this.previewPicks={};this.mixer.reset();}
 sync(game,key,meId,paused=false){
  if(!game||game.status==='idle'){this.previous=null;return;}
  this.beginSet(key);
  if(paused){this.previous=null;return;}
  const rows=game.players.map(p=>({id:p.id,x:p.x,y:p.y,jumps:p.jumps,flight:!!p.flight,alive:p.alive}));
  if(!this.previous||this.previous.key!==key||this.previous.round!==game.round||performance.now()<this.previewUntil){if(this.previous?.round!==game.round)this.mixer.reset();this.previous={key,round:game.round,status:game.status,rows};this.seenCrashes=new Set((game.crashes||[]).map(c=>c.index+':'+c.time));return;}
  const previous=this.previous;
  if(game.status==='running'&&previous.status==='countdown')this.play('start').catch(()=>{});
  const focus=game.players.find(p=>p.id===meId)||game.players.find(p=>p.alive),moved=[];
  for(const p of game.players){const old=previous.rows.find(q=>q.id===p.id);if(!old)continue;
   if(p.jumps<old.jumps)this.play('jump',{level:p.id===focus?.id?1:.4}).catch(()=>{});
   else if(p.alive&&!p.flight&&!old.flight&&(p.x!==old.x||p.y!==old.y)&&game.status==='running')moved.push(p);
  }
  for(const event of this.mixer.choose(moved,focus?.id,game.time,game.players,this.settings.stepDensity)){if(event.group==='other'&&this.settings.otherStepGain===0)continue;this.play('step',{id:this.stepId(),stepGroup:event.group,level:event.group==='other'?this.settings.otherStepGain/100:1,delay:event.delay}).catch(()=>{});}
  for(const crash of game.crashes||[]){const id=crash.index+':'+crash.time;if(this.seenCrashes.has(id))continue;this.seenCrashes.add(id);if(!crash.reason.includes('退出')&&!crash.reason.includes('降参'))this.play('crash').catch(()=>{});}
  this.previous={key,round:game.round,status:game.status,rows};
 }
}
