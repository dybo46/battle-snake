// Select attacks separately from the physical movement. Dropping a sound never drops a move.
export class StepMixer{
 constructor(){this.reset();}
 reset(){this.nextOther=-Infinity;this.cursor=0;this.pending=new Map();}
 choose(moved,focusId,now,roster,density=50){
  const result=[],own=moved.find(p=>p.id===focusId);if(own)result.push({id:own.id,group:'focus',delay:0});
  if(density<=0){this.pending.clear();return result;}
  for(const p of moved)if(p.id!==focusId)this.pending.set(p.id,{p,time:now});
  for(const[id,event]of this.pending)if(now-event.time>.28||!roster.some(p=>p.id===id&&p.alive!==false))this.pending.delete(id);
  if(now+1e-7<this.nextOther)return result;
  const others=[...this.pending.values()].map(e=>e.p);if(!others.length)return result;
  const indexes=new Map(roster.map((p,i)=>[p.id,i])),length=Math.max(1,roster.length);
  others.sort((a,b)=>((indexes.get(a.id)-this.cursor+length)%length)-((indexes.get(b.id)-this.cursor+length)%length));
  const selected=others[0];this.pending.delete(selected.id);this.cursor=(indexes.get(selected.id)+1)%length;this.nextOther=now+(.3-density*.002);
  result.push({id:selected.id,group:'other',delay:own?.035:0});return result;
 }
}
