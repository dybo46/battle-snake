import test from 'node:test';
import assert from 'node:assert/strict';
import {Lobby} from '../lobby.mjs';
import {DEFAULTS} from '../public/core.js';
import {createGameServer} from '../server.mjs';
import {once} from 'node:events';

function setup(count=6){const l=new Lobby(),p=Array.from({length:count},(_,i)=>l.join('参加'+(i+1)));for(const x of p)l.settings(x.token,{...DEFAULTS,cpus:0});return{l,p};}
function ready(l,ps){for(const p of ps)l.ready(p.token,true);}

test('extra match requires readiness and mutual anyone; opting out does not interrupt a running match',()=>{
 const{l,p}=setup();assert.ok(p.every(x=>!x.anyone));ready(l,p.slice(0,4));assert.equal(l.matches.length,1);
 l.anyone(p[2].token,true);assert.equal(l.matches.length,1);l.anyone(p[3].token,true);assert.equal(l.matches.length,2);
 const second=l.matchFor(p[2].id);assert.deepEqual(second.ids,p.slice(2,4).map(x=>x.id));l.anyone(p[2].token,false);assert.equal(l.matchFor(p[2].id),second);
 assert.equal(l.byId(p[4].id).mode,'lobby');
});

test('extra match uses its own first ready owner, required humans, CPU pool and first-to rules',()=>{
 const{l,p}=setup();ready(l,p.slice(0,2));l.settings(p[2].token,{...DEFAULTS,humans:3,cpus:1,target:11,cpuPool:{levels:[8],personalities:['drunk']}});
 for(const x of p.slice(2,5))l.anyone(x.token,true);ready(l,p.slice(2,4));assert.equal(l.matches.length,1);l.ready(p[4].token,true);
 const m=l.matchFor(p[2].id);assert.equal(m.owner,p[2].name);assert.equal(m.game.settings.target,11);assert.equal(m.ids.length,3);assert.equal(m.game.players[3].level,8);assert.equal(m.game.players[3].personality,'drunk');assert.equal(l.match.game.settings.target,6);
});

test('spectators always see the uppermost match while participants see only their own match',()=>{
 const{l,p}=setup();ready(l,p.slice(0,2));for(const x of p.slice(2,4))l.anyone(x.token,true);ready(l,p.slice(2,4));
 const first=l.match,second=l.matchFor(p[2].id);assert.equal(l.snapshot(p[4].token).match.id,first.id);assert.equal(l.snapshot(p[2].token).match.id,second.id);
 assert.equal(l.snapshot(p[3].token).me.matchId,second.id);assert.equal(l.snapshot(p[4].token).matches.length,2);assert.ok(!JSON.stringify(l.snapshot(p[4].token)).includes(p[2].token));
});

test('inputs, resignation, disconnect and simulation are isolated to the owned match',()=>{
 const{l,p}=setup();ready(l,p.slice(0,2));for(const x of p.slice(2,4))l.anyone(x.token,true);ready(l,p.slice(2,4));const a=l.match,b=l.matchFor(p[2].id);
 a.game.status=b.game.status='running';l.input(p[2].token,{matchId:a.id,dash:true});assert.equal(b.game.players[0].dash,false);l.input(p[2].token,{matchId:b.id,dash:true});assert.equal(b.game.players[0].dash,true);assert.equal(a.game.players[0].dash,false);
 const ta=a.game.time,tb=b.game.time;l.advance(1/60);assert.ok(a.game.time>ta&&b.game.time>tb);l.leave(p[2].token);assert.equal(b.game.players[0].resigned,true);assert.equal(a.game.players[0].resigned,undefined);
 for(let i=0;i<1000&&b.game.round<2;i++)l.advance(1/60);assert.equal(b.game.players[0].alive,false);
});

test('secondary result retains winner position and moves only its loser without disturbing the upper match',()=>{
 const{l,p}=setup();ready(l,p.slice(0,2));for(const x of p.slice(2,4))l.anyone(x.token,true);ready(l,p.slice(2,4));const first=l.match,second=l.matchFor(p[2].id),time=first.game.time;
 second.game.result={winner:0,names:[p[2].name]};l.release(second);assert.equal(l.match,first);assert.equal(first.game.time,time);assert.equal(l.byId(p[2].id).ready,true);assert.equal(l.byId(p[3].id).ready,false);assert.equal(l.byId(p[2].id).wins,1);assert.deepEqual(l.queue,[p[0].id,p[1].id,p[2].id,p[4].id,p[5].id,p[3].id]);
});

test('six ready humans can occupy three independent pairs and never enter two matches',()=>{
 const{l,p}=setup();for(const x of p)l.anyone(x.token,true);ready(l,p);assert.equal(l.matches.length,3);assert.equal(new Set(l.matches.flatMap(m=>m.ids)).size,6);assert.ok(l.matches.every(m=>m.ids.length===2));
});

test('a real winner is already ready during results and remains ready in place after return',()=>{
 const{l,p}=setup(4);ready(l,p.slice(0,2));for(const x of p.slice(2))l.anyone(x.token,true);ready(l,p.slice(2));const upper=l.match,m=l.matchFor(p[2].id);
 l.resign(p[2].token);
 for(let i=0;i<10000&&m.game.status!=='finished';i++)l.advance(1/60);
 assert.equal(m.game.status,'finished');assert.equal(m.game.players[1].score,6);assert.equal(l.byId(p[3].id).ready,true);assert.equal(l.byId(p[2].id).ready,false);
 const during=l.snapshot(p[3].token);assert.equal(during.me.ready,true);assert.equal(during.match.id,m.id);assert.equal(during.readyCount,0);
 for(let i=0;i<60;i++)l.advance(1/60);assert.equal(l.byId(p[3].id).ready,true);assert.ok(l.matches.includes(m));
 for(let i=0;i<500&&l.matches.includes(m);i++)l.advance(1/60);assert.ok(!l.matches.includes(m));assert.equal(l.byId(p[3].id).ready,true);assert.equal(l.match,upper);assert.deepEqual(l.queue,[p[0].id,p[1].id,p[3].id,p[2].id]);
});

test('HTTP anyone requires a joined session and only strict true opts in',async()=>{
 const app=createGameServer();app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base='http://127.0.0.1:'+app.server.address().port;
 const post=(path,data,cookie='')=>fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',cookie},body:JSON.stringify(data)});
 try{assert.equal((await post('anyone',{enabled:true})).status,401);const res=await post('join',{name:'設定'}),cookie=res.headers.get('set-cookie').split(';')[0];assert.equal((await post('anyone',{enabled:true},cookie)).status,200);const p=[...app.lobby.players.values()][0];assert.equal(p.anyone,true);await post('anyone',{enabled:'true'},cookie);assert.equal(p.anyone,false);}
 finally{await app.dispose();}
});

test('last human departure clears an empty match immediately so a new ready pair can start',()=>{const{l,p}=setup(4);ready(l,p.slice(0,2));l.leave(p[0].token);assert.equal(l.matches.length,1);l.leave(p[1].token);assert.equal(l.matches.length,0);ready(l,p.slice(2));assert.deepEqual(l.match.ids,p.slice(2).map(x=>x.id));});
