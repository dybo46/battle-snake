// Mouse capture and keyboard share held-button state; releasing one source must not release another.
export class ArenaControls{
 constructor({canvas,onInput,canControl,onModeChange=()=>{},onError=()=>{}}){
  Object.assign(this,{canvas,onInput,canControl,onModeChange,onError});this.keys=new Set();this.mouseDown=false;this.keyboardActive=false;this.active=false;this.lastDash=false;this.context='';
  this.bind();
 }
 editable(target){return target instanceof HTMLElement&&(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(target.tagName)||target.isContentEditable);}
 bind(){
  this.canvas.addEventListener('focus',()=>{this.keyboardActive=true;});
  this.canvas.addEventListener('mousedown',e=>{
   if(!this.canControl())return;
   if(e.button===0){e.preventDefault();this.canvas.focus({preventScroll:true});this.keyboardActive=true;this.mouseDown=true;
    if(document.pointerLockElement!==this.canvas){try{const result=this.canvas.requestPointerLock();result?.catch(e=>{this.mouseDown=false;this.flush();this.onError('この画面ではマウス固定を開始できません。キー操作はそのまま使えます。');});}catch{this.mouseDown=false;this.onError('マウス固定を開始できません。キー操作はそのまま使えます。');}}
    else this.flush();
   }else if(e.button===2&&this.active){e.preventDefault();this.onInput({jump:true});}
  });
  document.addEventListener('mouseup',e=>{if(e.button===0){this.mouseDown=false;this.flush();}});
  this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('contextmenu',e=>{if(this.active)e.preventDefault();});
  document.addEventListener('pointerlockchange',()=>{this.active=document.pointerLockElement===this.canvas;if(!this.active){this.clear();this.keyboardActive=false;this.canvas.blur();}else this.keyboardActive=true;this.flush();this.onModeChange(this.active);});
  document.addEventListener('keydown',e=>{
   if((e.code==='Escape'||e.code==='Enter'||e.code==='NumpadEnter'||e.code==='Backspace')&&(this.active||this.keyboardActive)&&!this.editable(e.target)){e.preventDefault();this.release();return;}
   if(this.editable(e.target)||!this.canControl()||(!this.active&&!this.keyboardActive))return;
   const dirs={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3,KeyW:0,KeyD:1,KeyS:2,KeyA:3};
   if(e.code in dirs){e.preventDefault();if(!e.repeat)this.onInput({dir:dirs[e.code]});}
   else if(['ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();this.keys.add(e.code);this.flush();}
   else if(['KeyB','Space'].includes(e.code)){e.preventDefault();if(!e.repeat)this.onInput({jump:true});}
  });
  document.addEventListener('keyup',e=>{if(this.keys.delete(e.code))this.flush();});
  window.addEventListener('blur',()=>this.release());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.release();});
 }
 clear(){this.keys.clear();this.mouseDown=false;}
 flush(force=false){const dash=this.canControl()&&(this.keys.size>0||(this.active&&this.mouseDown));if(force||dash!==this.lastDash){this.lastDash=dash;this.onInput({dash});}}
 release(){this.clear();this.flush(true);this.keyboardActive=false;if(document.pointerLockElement===this.canvas)document.exitPointerLock();this.active=false;this.canvas.blur();this.onModeChange(false);}
 refresh(context){if(context!==this.context){this.context=context;this.flush(true);}if(!this.canControl()&&this.active)this.release();}
}
