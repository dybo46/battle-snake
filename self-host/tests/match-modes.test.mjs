import test from 'node:test';import assert from 'node:assert/strict';
import {Game,normalizeSettings,DEFAULTS} from '../public/core.js';
import {Lobby} from '../lobby.mjs';
import {decideCPU} from '../public/cpu.js';

test('FFA is the default; cooperative modes retain a CPU side and teams always total four',()=>{
 assert.equal(DEFAULTS.mode,'ffa');assert.equal(normalizeSettings().mode,'ffa');
 for(const [humans,cpus] of [[2,2],[2,1],[3,1]])assert.deepEqual([normalizeSettings({mode:'coop',humans,cpus}).humans,normalizeSettings({mode:'coop',humans,cpus}).cpus],[humans,cpus]);
 assert.deepEqual([normalizeSettings({mode:'coop',humans:4,cpus:0}).humans,normalizeSettings({mode:'coop',humans:4,cpus:0}).cpus],[3,1]);
 for(let humans=1;humans<=4;humans++)assert.equal(normalizeSettings({mode:'team',humans,cpus:0}).cpus,4-humans);
});

test('cooperation shares human stars including dead teammates and ends when the CPU side is gone',()=>{
 for(const [humans,cpus] of [[2,2],[2,1],[3,1]]){
  const slots=[...Array.from({length:humans},(_,i)=>({id:'p'+i})),...Array.from({length:cpus},(_,i)=>({id:'c'+i,bot:true}))],g=new Game({mode:'coop',humans,cpus},slots,7);
  assert.ok(g.players.every(p=>p.team===(p.bot?1:0)));g.kill(g.players[0],'test');g.checkEnd();assert.equal(g.status,'countdown');
  for(const p of g.players.filter(p=>p.bot))g.kill(p,'test');g.checkEnd();assert.deepEqual(g.scores,[1,0]);assert.ok(g.players.filter(p=>!p.bot).every(p=>p.score===1));assert.equal(g.result.names.length,humans);
 }
});

test('CPU cooperation gets a shared star only when all human players are eliminated; simultaneous wipe is draw',()=>{
 const slots=[{id:'a'},{id:'b'},{id:'c',bot:true},{id:'d',bot:true}],g=new Game({mode:'coop'},slots,1);g.kill(g.players[0],'test');g.checkEnd();assert.equal(g.result,null);g.kill(g.players[1],'test');g.checkEnd();assert.deepEqual(g.scores,[0,1]);assert.ok(g.players.filter(p=>p.bot).every(p=>p.score===1));
 const draw=new Game({mode:'coop'},slots,2);for(const p of draw.players)draw.kill(p,'test');draw.checkEnd();assert.equal(draw.result.draw,true);assert.deepEqual(draw.scores,[0,0]);
});

test('random two-v-two teams vary across sets, stay fixed across rounds, and can mix humans and CPUs',()=>{
 const formations=new Set(),slots=[{id:'p1'},{id:'p2'},{id:'c1',bot:true},{id:'c2',bot:true}];let together=false,separate=false;
 for(let seed=1;seed<=30;seed++){
  const g=new Game({mode:'team'},slots,seed),teams=g.players.map(p=>p.team);assert.equal(teams.filter(t=>t===0).length,2);assert.equal(teams.filter(t=>t===1).length,2);formations.add(teams.join(''));
  together ||= teams[0]===teams[1];separate ||= teams[0]!==teams[1];for(let round=0;round<12;round++){g.newRound();assert.deepEqual(g.players.map(p=>p.team),teams);}
 }
 assert.ok(formations.size>=3&&together&&separate);
});

test('cooperative CPU attack and stalker target humans rather than their CPU allies',()=>{
 for(const personality of ['attack','reckless','stalker','pincer']){const g=new Game({mode:'coop',personality},[{id:'human1'},{id:'human2'},{id:'cpu1',bot:true},{id:'cpu2',bot:true}],3),p=g.players[2];decideCPU(g,p);assert.ok(['human1','human2'].includes(p.ai.targetId),personality);}
});

test('adopted rules show upper owner for normal waiting and next anyone owner at their actual rank',()=>{
 const l=new Lobby(),p=Array.from({length:5},(_,i)=>l.join('人'+i));l.settings(p[0].token,{mode:'coop',humans:2,cpus:2});assert.deepEqual([l.snapshot(p[2].token).next.position,l.snapshot(p[2].token).next.mode],[1,'coop']);l.ready(p[0].token,true);l.ready(p[1].token,true);
 l.settings(p[2].token,{mode:'ffa',humans:3,cpus:1,cpuPool:{levels:[2,6,8],personalities:['jumper','ramen']}});l.anyone(p[2].token,true);assert.deepEqual([l.snapshot(p[2].token).next.position,l.snapshot(p[2].token).next.humans,l.snapshot(p[2].token).next.mode],[3,3,'ffa']);assert.equal(l.snapshot(p[4].token).next.position,1);
 for(const x of p.slice(2))l.anyone(x.token,true);l.ready(p[2].token,true);l.ready(p[3].token,true);assert.equal(l.matches.length,1);l.ready(p[4].token,true);assert.equal(l.matches.length,2);const m=l.matchFor(p[2].id);assert.equal(m.ids.length,3);assert.ok([2,6,8].includes(m.game.players[3].level));assert.ok(['jumper','ramen'].includes(m.game.players[3].personality));assert.equal(l.snapshot(p[3].token).next.position,3);
});

test('atomic ready settings beat stale settings and rule edits retain a winner/waiter ready flag',()=>{
 const l=new Lobby(),a=l.join('上'),b=l.join('下'),c=l.join('次');l.ready(a.token,true,{humans:3,cpus:1,level:8});l.ready(b.token,true);assert.equal(l.match,null);l.settings(a.token,{humans:3,cpus:1,level:6});assert.equal(a.ready,true);l.ready(c.token,true);assert.equal(l.match.game.settings.humans,3);assert.equal(l.match.game.players[3].level,6);
});

test('cooperative and random team CPU simulations reach real first-to-six and first-to-eleven results',()=>{
 for(const mode of ['coop','team'])for(const target of [6,11]){
  const slots=Array.from({length:4},(_,i)=>({id:'c'+i,bot:true,coopSide:i<2?0:1})),g=new Game({mode,target,personality:'random',level:5},slots,900+target),teams=g.players.map(p=>p.team);
  for(let tick=0;tick<60*1800&&g.status!=='finished';tick++)g.step(1/60);
  assert.equal(g.status,'finished',mode+' '+target);assert.equal(g.scores[g.result.winner],target);assert.deepEqual(g.players.map(p=>p.team),teams);assert.ok(g.players.filter(p=>p.team===g.result.winner).every(p=>p.score===target));assert.equal(g.result.names.length,2);
 }
});
