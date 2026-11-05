// The random option is a selection mode, never a material passed to the renderer.
export class SkinSelection{
 constructor(skins,saved={},random=Math.random){
  this.ids=skins.map(s=>typeof s==='string'?s:s.id);this.random=random;this.choice=this.ids.includes(saved.skin)?saved.skin:'random';this.setKey=null;
  const state=saved.randomSkin||{};this.resumeKey=typeof state.setKey==='string'&&state.setKey.startsWith('net:')?state.setKey:null;
  this.resolved=this.choice==='random'?(this.ids.includes(state.resolved)?state.resolved:null):this.choice;if(!this.resolved)this.draw();
 }
 draw(){const pool=this.ids.filter(id=>id!==this.resolved);this.resolved=(pool.length?pool:this.ids)[Math.min((pool.length||this.ids.length)-1,Math.floor(this.random()*(pool.length||this.ids.length)))];return this.resolved;}
 select(choice){if(choice!=='random'&&!this.ids.includes(choice))return false;this.choice=choice;this.resumeKey=null;if(choice==='random')this.draw();else this.resolved=choice;return true;}
 beginSet(key){if(key===this.setKey)return false;this.setKey=key;if(!key||this.choice!=='random')return false;if(key===this.resumeKey){this.resumeKey=null;return false;}this.resumeKey=null;this.draw();return true;}
 serialize(){return{skin:this.choice,...(this.choice==='random'?{randomSkin:{resolved:this.resolved,setKey:this.setKey?.startsWith('net:')?this.setKey:this.resumeKey}}:{})};}
}
