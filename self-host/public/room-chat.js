export function setupRoomChat({list,input,sendButton,form,status,unread,send}){
 let me=null,lastId=0,sending=false,newCount=0;
 const atBottom=()=>list.scrollHeight-list.scrollTop-list.clientHeight<35;
 function clearUnread(){newCount=0;unread.hidden=true;}
 function scrollLatest(){list.scrollTop=list.scrollHeight;clearUnread();}
 unread.addEventListener('click',scrollLatest);
 list.addEventListener('scroll',()=>{if(atBottom())clearUnread();});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.isComposing)e.preventDefault();});
 function sync(){input.disabled=!me;sendButton.disabled=!me||sending;input.placeholder=me?'メッセージ（200文字まで）':'入室するとチャットできます';}
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!me||sending)return;const text=input.value.trim();if(!text)return;
  sending=true;sync();try{await send(text);if(input.value.trim()===text)input.value='';status.textContent='送信しました。';}catch(e){status.textContent=e.message;}finally{sending=false;sync();}
 });
 return {update(snapshot){
  const id=snapshot?.me?.id||null;if(id!==me){me=id;lastId=0;list.replaceChildren();clearUnread();status.textContent='入室中の6人で話せます（200文字まで）。';}
  sync();const messages=me?snapshot.chat||[]:[];const latest=messages.at(-1)?.id||0;if(latest===lastId)return;
  const bottom=atBottom(),added=messages.filter(m=>m.id>lastId);lastId=latest;
  for(const m of added){const li=document.createElement('li'),name=document.createElement('b'),text=document.createElement('span');li.dataset.messageId=m.id;name.textContent=m.name+'：';text.textContent=m.text;li.append(name,text);list.append(li);}
  while(list.children.length>60)list.firstElementChild.remove();
  if(bottom)scrollLatest();else{newCount+=added.length;unread.textContent=`新着${newCount}件 ↓`;unread.hidden=false;}
 }};
}
