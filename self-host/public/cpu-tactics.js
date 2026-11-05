// Tactical estimates only. These helpers never place stones or change a score.
const D=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
const free=(g,x,y)=>g.inside(x,y)&&!g.tile(x,y);
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function area(g,x,y,limit,blocked){
 if(!free(g,x,y))return 0;const w=g.width,seen=new Set([y*w+x]),queue=[[x,y]];let head=0;
 while(head<queue.length&&seen.size<limit){const[cx,cy]=queue[head++];for(const d of D){const nx=cx+d.x,ny=cy+d.y,k=ny*w+nx;if(free(g,nx,ny)&&!seen.has(k)&&!blocked.has(k)){seen.add(k);queue.push([nx,ny]);if(seen.size>=limit)break;}}}return seen.size;
}
function nearestFree(g,point){
 for(let radius=0;radius<=3;radius++)for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++)if(Math.abs(dx)+Math.abs(dy)===radius&&free(g,point.x+dx,point.y+dy))return{x:point.x+dx,y:point.y+dy};return null;
}
export function routeTo(g,goal){
 const point=goal&&nearestFree(g,goal);if(!point)return null;const distances=new Int16Array(g.width*g.height);distances.fill(-1);const queue=[point];distances[point.y*g.width+point.x]=0;
 for(let i=0;i<queue.length;i++){const p=queue[i],value=distances[p.y*g.width+p.x]+1;for(const d of D){const x=p.x+d.x,y=p.y+d.y,k=y*g.width+x;if(free(g,x,y)&&distances[k]<0){distances[k]=value;queue.push({x,y});}}}return{goal:point,distances};
}
export function routeScore(g,route,x,y){if(!route)return 0;const n=route.distances[y*g.width+x];return n>=0?-n*2.7:-distance({x,y},route.goal)*1.1-10;}
export function enclosureTarget(g,p,enemies,partners){
 const ids=new Set(partners.map(q=>q.id)),eligible=enemies.filter(q=>!ids.has(q.id)),pool=eligible.length?eligible:enemies;
 const leader=partners.length&&eligible.length?[p,...partners].sort((a,b)=>a.index-b.index)[0]:p;
 const target=pool.find(q=>q.id===leader.ai.targetId)||pool.find(q=>q.id===p.ai.targetId)||pool.slice().sort((a,b)=>distance(a,leader)-distance(b,leader))[0];p.ai.targetId=target?.id||null;return target||null;
}
function corners(g,target,r){const v=D[target.dir],cx=clamp(target.x+v.x*2,3,g.width-4),cy=clamp(target.y+v.y*2,3,g.height-4),left=clamp(cx-r,1,g.width-2),right=clamp(cx+r,1,g.width-2),top=clamp(cy-r,1,g.height-2),bottom=clamp(cy+r,1,g.height-2);return{cx,cy,points:[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}]};}
export function enclosureRoute(g,p,target,partners=[]){
 if(!target)return null;let plan=p.ai.enclosure;
 if(!plan||plan.targetId!==target.id||Math.abs(target.x-plan.cx)>plan.radius+2||Math.abs(target.y-plan.cy)>plan.radius+2){
  const radius=4+Number(p.level<=3),shape=corners(g,target,radius),all=[p,...partners].sort((a,b)=>a.index-b.index),role=all.indexOf(p);const anchor=partners.length?all[0]:p;let index=shape.points.reduce((best,q,i)=>distance(q,anchor)<distance(shape.points[best],anchor)?i:best,0);if(partners.length)index=(index+Math.round(role*4/all.length))%4;
  plan=p.ai.enclosure={targetId:target.id,radius,...shape,index,sign:role%2?-1:1,visited:0};
 }
 for(let n=0;n<4;n++){const goal=plan.points[plan.index];if(distance(goal,p)>1&&free(g,goal.x,goal.y))break;plan.index=(plan.index+plan.sign+4)%4;plan.visited++;if(plan.visited>=4){plan.radius=Math.max(2,plan.radius-1);Object.assign(plan,corners(g,target,plan.radius),{visited:0});}}
 const route=routeTo(g,plan.points[plan.index]);p.ai.enclosureGoal=route?.goal||null;return route;
}
export function pressureGain(g,p,target,dir){
 if(!target||distance(p,target)>12)return 0;const limit=220,base=g.reachable(target.x,target.y,limit),blocked=new Set(),v=D[dir];
 for(let i=0;i<=4;i++){const x=p.x+v.x*i,y=p.y+v.y*i;if(!free(g,x,y))break;if(x!==target.x||y!==target.y)blocked.add(y*g.width+x);}
 return Math.max(0,Math.min(base,limit)-area(g,target.x,target.y,limit,blocked));
}
export function escapeSituation(g,p,enemies){
 const areaSize=g.reachable(p.x,p.y,160),enemyValues=new Set(enemies.map(q=>q.index+1));let enemyWalls=0;
 for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++)if(Math.abs(dx)+Math.abs(dy)<=4&&enemyValues.has(g.tile(p.x+dx,p.y+dy)))enemyWalls++;
 const exits=D.filter(d=>free(g,p.x+d.x,p.y+d.y)).length;return{area:areaSize,enemyWalls,trapped:areaSize<28||(enemyWalls>=4&&(areaSize<110||exits<=2))};
}
export function escapeRoute(g,p,enemies){
 const queue=[{x:p.x,y:p.y,steps:0}],seen=new Set([p.y*g.width+p.x]);let best=null,bestScore=-Infinity;
 for(let i=0;i<queue.length&&i<400;i++){const q=queue[i],open=D.filter(d=>free(g,q.x+d.x,q.y+d.y)).length,away=enemies.length?Math.min(...enemies.map(e=>distance(e,q))):0,score=open*4+Math.min(away,12)*.8+Math.min(q.steps,12)*.7;
  if(q.steps>1&&score>bestScore){bestScore=score;best=q;}if(q.steps>=16)continue;
  for(const d of D){const x=q.x+d.x,y=q.y+d.y,k=y*g.width+x;if(free(g,x,y)&&!seen.has(k)){seen.add(k);queue.push({x,y,steps:q.steps+1});}}
 }return routeTo(g,best);
}
