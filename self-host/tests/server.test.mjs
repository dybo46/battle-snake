import test from 'node:test';import assert from 'node:assert/strict';import {once} from 'node:events';
import {createGameServer} from '../server.mjs';
test('HTTP room flow, sessions, six seats, static files, same-origin protection and input ownership',async()=>{
 const app=createGameServer();app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base='http://127.0.0.1:'+app.server.address().port;
 const post=async(path,data={},cookie='',origin='')=>fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{cookie}:{}),...(origin?{origin}:{})},body:JSON.stringify(data)});
 try{
  const health=await fetch(base+'/health').then(r=>r.json());assert.equal(health.version,'3.1');assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/core.js')).status,200);assert.equal((await fetch(base+'/../package.json')).status,404);const wav=await fetch(base+'/audio/step-01.wav');assert.equal(wav.headers.get('content-type'),'audio/wav');assert.ok((await wav.arrayBuffer()).byteLength>1000);
  const a=await post('join',{name:'一番'}),ac=a.headers.get('set-cookie').split(';')[0];assert.equal(a.status,200);const b=await post('join',{name:'二番'}),bc=b.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('chat',{text:'未入室'})).status,401);assert.equal((await post('chat',{text:'よろしく'},ac)).status,200);assert.equal(app.lobby.snapshot(bc.slice(10)).chat[0].text,'よろしく');
  assert.equal((await post('ready',{ready:true},ac,'https://different.example')).status,403);
  await post('ready',{ready:true},ac);await post('mode',{mode:'cpu'},ac);await post('ready',{ready:true},bc);assert.ok(app.lobby.match);assert.equal(app.lobby.match.game.players.length,4);
  const abort=new AbortController();const response=await fetch(base+'/api/events',{headers:{cookie:ac},signal:abort.signal});assert.match(response.headers.get('content-type'),/text\/event-stream/);const reader=response.body.getReader();const first=new TextDecoder().decode((await reader.read()).value);assert.match(first,/一番/);assert.match(first,/"owner":"一番"/);await reader.cancel();abort.abort();
  const stranger=await post('join',{name:'観戦'}),sc=stranger.headers.get('set-cookie').split(';')[0];app.lobby.match.game.status='running';const g=app.lobby.match.game;await post('input',{matchId:app.lobby.match.id,dash:true},sc);assert.equal(g.players[0].dash,false);await post('input',{matchId:app.lobby.match.id,dash:true},ac);assert.equal(g.players[0].dash,true);
  for(let i=0;i<3;i++)assert.equal((await post('join',{name:'追加'+i})).status,200);assert.equal((await post('join',{name:'七人目'})).status,409);
  assert.equal((await post('leave',{},bc)).status,200);assert.equal(app.lobby.players.size,5);
 }finally{await app.dispose();}
});
