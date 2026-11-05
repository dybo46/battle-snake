import {readFileSync} from 'node:fs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Lobby} from './lobby.mjs';
import {VERSION} from './public/core.js';
const randomNames=JSON.parse(readFileSync(new URL('./data/random-names.json',import.meta.url),'utf8'));
export function createGameServer(){
 const lobby=new Lobby(),streams=new Map(),disconnects=new Map(),rates=new Map();const root=fileURLToPath(new URL('./public/',import.meta.url));
 const token=req=>(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('snakeroom='))?.slice(10)||'';
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const publish=()=>{for(const[id,res]of streams){if(res.destroyed||res.writableLength>256*1024){res.destroy();continue;}res.write(`data: ${JSON.stringify(lobby.snapshot(id))}\n\n`);}};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try{
   const url=new URL(req.url,'http://localhost'),id=token(req),p=lobby.players.get(id);
   if(url.pathname==='/health')return send(res,200,{ok:true,version:VERSION,players:lobby.players.size});
   if(url.pathname==='/api/info')return send(res,200,{version:VERSION,max:6,count:lobby.players.size,name:p?.name||lobby.defaultName(),session:!!p,names:randomNames});
   if(url.pathname==='/api/events'&&req.method==='GET'){
    if(!p)return send(res,401,{error:'入室してください。'});clearTimeout(disconnects.get(id));disconnects.delete(id);streams.get(id)?.end();
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});streams.set(id,res);p.lastSeen=Date.now();res.write(`data: ${JSON.stringify(lobby.snapshot(id))}\n\n`);
    req.on('close',()=>{if(streams.get(id)!==res)return;streams.delete(id);disconnects.set(id,setTimeout(()=>{disconnects.delete(id);if(!streams.has(id)){lobby.leave(id);publish();}},10000));});return;
   }
   if(url.pathname.startsWith('/api/')&&req.method==='POST'){
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(res,403,{error:'接続元が異なります。'});
    const key=id||req.socket.remoteAddress,now=Date.now();let rate=rates.get(key);if(!rate||now-rate.at>1000)rate={at:now,count:0};rate.count++;rates.set(key,rate);if(rate.count>100)return send(res,429,{error:'操作が多すぎます。少し待ってください。'});
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)throw Object.assign(new Error('データが大きすぎます。'),{status:413});}
    let data;try{data=JSON.parse(raw||'{}');}catch{throw Object.assign(new Error('送信データを確認してください。'),{status:400});}
    if(url.pathname==='/api/join'){const q=p||lobby.join(data.name);res.setHeader('Set-Cookie',`snakeroom=${q.token}; HttpOnly; SameSite=Strict; Path=/`);send(res,200,{ok:true,name:q.name});publish();return;}
    if(!p)return send(res,401,{error:'退室しました。もう一度入室してください。'});p.lastSeen=now;
    switch(url.pathname){
     case'/api/heartbeat':break;
     case'/api/chat':lobby.chat(id,data.text);break;
     case'/api/settings':lobby.settings(id,data);break;
     case'/api/anyone':lobby.anyone(id,data.enabled,data.settings);break;
     case'/api/ready':lobby.ready(id,data.ready,data.settings);break;
     case'/api/mode':lobby.mode(id,data.mode);break;
     case'/api/input':lobby.input(id,data);break;
     case'/api/resign':lobby.resign(id);break;
     case'/api/leave':lobby.leave(id);clearTimeout(disconnects.get(id));disconnects.delete(id);streams.get(id)?.end();streams.delete(id);res.setHeader('Set-Cookie','snakeroom=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/');break;
     default:return send(res,404,{error:'操作が見つかりません。'});
    }
    send(res,200,{ok:true});if(url.pathname!=='/api/input'&&url.pathname!=='/api/heartbeat')publish();return;
   }
   if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'対応していない操作です。'});
   const pathname=decodeURIComponent(url.pathname),file=path.resolve(root,pathname==='/'?'index.html':pathname.slice(1));if(!file.startsWith(root))return send(res,403,{error:'アクセスできません。'});
   try{const bytes=await readFile(file),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.json':'application/json; charset=utf-8'};res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);}catch{return send(res,404,{error:'見つかりません。'});}
  }catch(e){if(!res.headersSent)send(res,e.status||500,{error:e.status?e.message:'サーバーでエラーが発生しました。'});else res.end();}
 });
 const clock=setInterval(()=>lobby.advance(1/60),1000/60),broadcast=setInterval(publish,100),cleanup=setInterval(()=>{
  for(const[id,p]of lobby.players)if(Date.now()-p.lastSeen>25000){lobby.leave(id);streams.get(id)?.end();streams.delete(id);}
  for(const r of streams.values())r.write(': heartbeat\n\n');for(const[k,v]of rates)if(Date.now()-v.at>60000)rates.delete(k);
 },5000);
 const dispose=()=>{clearInterval(clock);clearInterval(broadcast);clearInterval(cleanup);for(const timer of disconnects.values())clearTimeout(timer);for(const r of streams.values())r.end();server.closeAllConnections();return new Promise(resolve=>server.close(resolve));};
 return{server,lobby,dispose};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=createGameServer(),host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||8789);
 app.server.listen(port,host,()=>console.log(`対戦型スネイク v${VERSION} http://${host}:${port}/`));
 app.server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'このポートは使用中です。別のPORTを指定してください。':e.message);app.dispose().finally(()=>process.exit(1));});
 for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>app.dispose().then(()=>process.exit(0)));
}
