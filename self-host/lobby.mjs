import {randomBytes} from 'node:crypto';
import {Game,normalizeSettings,VERSION} from './public/core.js';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export class Lobby{
 constructor(){this.players=new Map();this.queue=[];this.matches=[];this.lastResult=null;this.serial=0;this.messages=[];this.chatSerial=0;}
 get match(){return this.sortedMatches()[0]||null;}
 matchFor(id){return this.matches.find(m=>m.ids.includes(id))||null;}
 sortedMatches(){return this.matches.slice().sort((a,b)=>Math.min(...a.ids.map(id=>this.queue.indexOf(id)).filter(n=>n>=0))-Math.min(...b.ids.map(id=>this.queue.indexOf(id)).filter(n=>n>=0))||a.id-b.id);}
 defaultName(){for(let i=1;i<99;i++){const n='スライム'+i;if(![...this.players.values()].some(p=>p.name===n))return n;}return'旅人';}
 join(name){
  if(this.players.size>=6)fail('満員です。6人まで入室できます。',409);
  name=String(name||this.defaultName()).trim().normalize('NFC');if(!name||Array.from(name).length>8||/[\p{C}<>]/u.test(name))fail('名前は1〜8文字で入力してください。');
  if([...this.players.values()].some(p=>p.name===name))fail('同じ名前の人がいます。',409);
  const p={token:randomBytes(24).toString('hex'),id:randomBytes(8).toString('hex'),name,ready:false,anyone:false,mode:'lobby',settings:normalizeSettings(),wins:0,lastSeen:Date.now()};
  this.players.set(p.token,p);this.queue.push(p.id);return p;
 }
 chat(token,text){const p=this.players.get(token);if(!p)fail('入室してください。',401);if(typeof text!=='string')fail('メッセージを入力してください。');text=text.trim();if(!text||Array.from(text).length>200||/[\p{Cc}\p{Cs}]/u.test(text))fail('メッセージは1〜200文字で入力してください。');const now=Date.now();if(p.chatAt&&now-p.chatAt<800)fail('少し待ってから送信してください。',429);p.chatAt=now;this.messages.push({id:++this.chatSerial,name:p.name,text,at:now});if(this.messages.length>60)this.messages.shift();}
 byId(id){return[...this.players.values()].find(p=>p.id===id);}
 settings(token,data){const p=this.players.get(token);if(!p)return;if(p.mode==='match')fail('対戦中のルールは固定です。',409);p.settings=normalizeSettings(data);this.tryMatch();}
 ready(token,value,settings){const p=this.players.get(token);if(!p||p.mode==='match')return;if(value===true&&settings)p.settings=normalizeSettings(settings);p.ready=value===true;this.tryMatch();}
 mode(token,value){const p=this.players.get(token);if(p&&p.mode!=='match')p.mode=value==='cpu'?'cpu':'lobby';}
 anyone(token,value,settings){const p=this.players.get(token);if(!p)return;if(p.mode!=='match'&&settings)p.settings=normalizeSettings(settings);p.anyone=value===true;this.tryMatch();}
 tryMatch(){
  let started=false;
  for(let lane=0;lane<3;lane++){
   if(this.matches.some(m=>m.lane===lane))continue;
   const ready=this.queue.map(id=>this.byId(id)).filter(p=>p?.ready&&!this.matchFor(p.id)&&(lane===0||p.anyone));
   if(!ready.length)continue;const owner=ready[0],s=owner.settings;if(ready.length<s.humans)continue;
   const humans=ready.slice(0,s.humans),slots=humans.map(p=>({id:p.id,name:p.name,bot:false}));
   for(let i=0;i<s.cpus;i++)slots.push({id:`cpu-${i}`,bot:true});
   const game=new Game(s,slots);for(const p of humans){p.mode='match';p.ready=false;}
   this.matches.push({id:++this.serial,lane,ownerId:owner.id,owner:owner.name,ids:humans.map(p=>p.id),game,finishAt:null});started=true;
  }
  return started;
 }
 input(token,data){const p=this.players.get(token),m=p&&this.matchFor(p.id);if(m&&data.matchId===m.id)m.game.input(p.id,data);}
 resign(token){const p=this.players.get(token),m=p&&this.matchFor(p.id);if(m){m.game.resign(p.id);m.game.players.find(q=>q.id===p.id).resigned=true;}}
 release(m=this.match){
  if(!m||!this.matches.includes(m))return;
  const winner=m.game.result?.winner,winners=m.game.players.filter(p=>p.team===winner&&!p.bot&&!p.resigned).map(p=>p.id).filter(id=>this.byId(id));
  this.lastResult={id:m.id,winnerNames:m.game.result?.names||[],draw:m.game.result?.draw??true};
  for(const id of m.ids){const p=this.byId(id);if(p){p.mode='lobby';p.ready=id===winners[0];if(winners.includes(id))p.wins++;}}
  // Keep each winner in their current place; only this match's losers move back.
  const losers=m.ids.filter(id=>!winners.includes(id)&&this.byId(id));
  this.queue=[...this.queue.filter(id=>!losers.includes(id)),...losers];
  this.matches=this.matches.filter(x=>x!==m);this.tryMatch();
 }
 leave(token){const p=this.players.get(token);if(!p)return;this.resign(token);this.players.delete(token);this.queue=this.queue.filter(id=>id!==p.id);this.matches=this.matches.filter(m=>m.ids.some(id=>this.byId(id)));if(!this.players.size){this.messages=[];this.lastResult=null;}this.tryMatch();}
 advance(dt){
  for(const m of this.matches.slice()){
   // A departed participant stays eliminated in all later rounds of their own set.
   m.game.step(dt);
   for(const p of m.game.players)if(!p.bot&&(!this.byId(p.id)||p.resigned)&&p.alive)m.game.kill(p,'退出・降参');
   if(m.game.status==='running')m.game.checkEnd();
   if(m.game.status==='finished'){if(m.finishAt===null){m.finishAt=m.game.time+7;const winner=m.game.result?.winner,first=m.game.players.find(p=>p.team===winner&&!p.bot&&!p.resigned&&this.byId(p.id));for(const id of m.ids){const p=this.byId(id);if(p)p.ready=id===first?.id;}}if(m.game.time>=m.finishAt)this.release(m);}
  }
  this.tryMatch();
 }
 nextInfo(id){
  const own=this.matchFor(id),primary=this.sortedMatches()[0],me=this.byId(id);let owner,settings;
  if(own){owner=this.byId(own.ownerId);settings=own.game.settings;}
  else if(primary&&!me?.anyone){owner=this.byId(primary.ownerId);settings=primary.game.settings;}
  else{const free=this.queue.map(i=>this.byId(i)).filter(p=>p&&!this.matchFor(p.id)&&(!primary||p.anyone));owner=free.find(p=>p.ready)||free[0];settings=owner?.settings;}
  return owner&&settings?{position:this.queue.indexOf(owner.id)+1,owner:owner.name,humans:settings.humans,cpus:settings.cpus,mode:settings.mode,level:settings.level,personality:settings.personality,cpuPool:settings.cpuPool}:null;
 }
 snapshot(token){
  const me=this.players.get(token),sorted=this.sortedMatches(),own=me&&this.matchFor(me.id),view=own||sorted[0]||null;
  const ready=this.queue.map(id=>this.byId(id)).filter(p=>p?.ready&&!this.matchFor(p.id)&&(!this.matches.some(m=>m.lane===0)||p.anyone));
  const roster=this.queue.map(id=>this.byId(id)).filter(Boolean).map(p=>({id:p.id,name:p.name,ready:p.ready,anyone:p.anyone,mode:p.mode,wins:p.wins,matchId:this.matchFor(p.id)?.id||null}));
  return{version:VERSION,next:this.nextInfo(me?.id),players:roster,me:me?{...roster.find(p=>p.id===me.id),settings:me.settings}:null,owner:ready[0]?.name||null,needed:ready[0]?.settings.humans||null,readyCount:ready.length,
   chat:me?this.messages:[],lastResult:this.lastResult,matches:sorted.map(m=>({id:m.id,owner:m.owner,ids:m.ids,status:m.game.status})),match:view?{id:view.id,owner:view.owner,ids:view.ids,finishAt:view.finishAt,game:view.game.snapshot()}:null};
 }
}
