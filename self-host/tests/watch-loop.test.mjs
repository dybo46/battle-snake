import test from 'node:test';import assert from 'node:assert/strict';
import {WatchLoop,continuedWatchSlots} from '../public/watch-loop.js';
import {Game} from '../public/core.js';

test('watch continuation is opt-in and only final results start its six-second clock',()=>{
 const loop=new WatchLoop();assert.equal(loop.tick({key:1,finished:true,now:100000}),false);loop.start({target:11,map:'wide'});
 assert.equal(loop.tick({key:1,finished:false,now:100000}),false);assert.equal(loop.tick({key:1,finished:true,now:200000}),false);
 assert.equal(loop.tick({key:1,finished:true,now:205999}),false);assert.equal(loop.tick({key:1,finished:true,now:206000}),true);assert.equal(loop.tick({key:1,finished:true,now:999999}),false);
});
test('pause freezes results and changing sets resets the clock without losing the same rules',()=>{
 const loop=new WatchLoop();loop.start({target:11,map:'wide'});loop.tick({key:1,finished:true,now:0});loop.tick({key:1,finished:true,now:2000});assert.equal(loop.remaining,4000);
 loop.tick({key:1,finished:true,paused:true,now:22000});assert.equal(loop.remaining,4000);assert.equal(loop.tick({key:1,finished:true,now:25999}),false);assert.equal(loop.tick({key:1,finished:true,now:26000}),true);
 loop.tick({key:2,finished:false,now:30000});assert.equal(loop.remaining,6000);assert.equal(loop.enabled,true);assert.equal(loop.rules.target,11);assert.equal(loop.rules.map,'wide');
});
test('stop cancels a pending continuation; rules and candidate arrays are copied',()=>{
 const rules={cpuPool:{levels:[2,6],personalities:['jumper','ramen']}},loop=new WatchLoop();loop.start(rules);rules.cpuPool.levels.push(10);rules.cpuPool.personalities.length=0;assert.deepEqual(loop.rules.cpuPool.levels,[2,6]);assert.deepEqual(loop.rules.cpuPool.personalities,['jumper','ramen']);
 loop.tick({key:1,finished:true,now:0});loop.stop();assert.equal(loop.tick({key:1,finished:true,now:100000}),false);assert.equal(loop.rules,null);
});
test('each random CPU changes personality within the checked pool while fixed choices stay fixed',()=>{
 const old=Array.from({length:4},(_,i)=>({personality:i%2?'ramen':'jumper'}));
 const s=continuedWatchSlots({cpuPool:{levels:[2,6,8],personalities:['jumper','ramen']}},old,()=>0);assert.deepEqual(s.map(p=>p.personality),['ramen','jumper','ramen','jumper']);
 assert.ok(continuedWatchSlots({personality:'careful'},old).every(p=>p.personality==='careful'));
 assert.ok(continuedWatchSlots({cpuPool:{personalities:['random-round']}},old).every(p=>p.personality==='random-round'));
});
test('common random personalities are fresh for every CPU and use the existing level candidates',()=>{
 const rules={personality:'random',cpuPool:{levels:[2,6,8]}},previous=Array.from({length:4},()=>({personality:'careful'})),slots=continuedWatchSlots(rules,previous,()=>0),g=new Game(rules,slots,100);
 assert.ok(g.players.every(p=>p.bot&&p.personality!=='careful'&&[2,6,8].includes(p.level)));assert.equal(g.players.length,4);
});
test('continued cooperative CPU observation retains two surrogate sides',()=>{
 const rules={mode:'coop'},g=new Game(rules,continuedWatchSlots(rules),1);assert.deepEqual([0,1].map(t=>g.players.filter(p=>p.team===t).length),[2,2]);
});
