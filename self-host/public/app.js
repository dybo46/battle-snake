import {WatchLoop,continuedWatchSlots} from './watch-loop.js';
import {SkinSelection} from './skin-selection.js';
import {setupCPUPool,buttonChoices} from './cpu-options.js';

import {setupRoomChat} from './room-chat.js';
import {Game,DEFAULTS,normalizeSettings,VERSION} from './core.js';
import {PERSONALITIES} from './cpu.js';
import {BRIGHT_BACKGROUND_REPLACEMENTS} from './block-outlines.js';
import {Renderer,SKINS,BACKGROUNDS} from './render.js';
import {ArenaControls} from './controls.js';
import {GameAudio} from './audio.js';
import {SOUND_BANK,SOUND_LABELS,SOUND_DEFAULTS} from './sound-bank.js';
const $=id=>document.getElementById(id),renderer=new Renderer($('arena')),KEY='battle-snake-v01-prefs';
let nameCandidates=[];
const stored={};try{localStorage.removeItem(KEY);}catch{}
const modeName=mode=>({ffa:'乱戦',coop:'協力',team:'チーム'}[mode]||'乱戦');
const skinSelection=new SkinSelection(SKINS,stored);
let settings=normalizeSettings(stored.settings),skin=skinSelection.resolved;renderer.setSkin(skin);
let backgroundFixed=stored.backgroundFixed===true;
const savedBackground=BRIGHT_BACKGROUND_REPLACEMENTS[stored.background]||stored.background;
let background=BACKGROUNDS.some(b=>b.id===savedBackground)?savedBackground:pairedBackgroundForSkin().id;renderer.setBackground(background);
const watchLoop=new WatchLoop();
const audio=new GameAudio(stored.audio);let idleGame=new Game(settings,[],1);idleGame.status='idle';
let localGame=null,localKind='idle',paused=false,room=null,stream=null,heartbeat=null,networkAt=0,lastNetworkId=null,noticeTimer=null,lastUI=0,boardSizeKey='',localSetSerial=0,inputQueue=Promise.resolve(),lastPad={dir:null,dash:false,jump:false};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

function message(text){$('notice').textContent=text;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,6500);}
async function api(path,data={}){const res=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const value=await res.json();if(!res.ok)throw new Error(value.error||'通信できません。');return value;}
function onlineMine(){return !!room?.match&&room.match.ids.includes(room.me?.id);}
function selectedGame(){if(onlineMine())return room.match.game;if(localGame)return localGame;if(room?.match)return room.match.game;return idleGame;}
function meId(){return onlineMine()?room.me.id:localKind==='practice'&&localGame?'you':null;}
function formValues(){const data={};for(const key of Object.keys(DEFAULTS))data[key]=$(key).value;data.cpuPool=cpuPool.read();return normalizeSettings(data);}
function updateOutputs(){
 updateScope();updateCPUCount();cpuPool.summarize();
 for(const key of ['level','speed','dashSpeed','deceleration']){const v=Number($(key).value);$(key+'Value').textContent=key==='level'?'Lv.'+v:key==='deceleration'?v.toFixed(2)+' 秒':v+' マス / 秒';}
 const personality=PERSONALITIES.find(p=>p.id===$('personality').value);$('personalityHint').textContent=personality?personality.description:'重複ありで選び、星6つ／11この決着まで同じ性格です。';
 const mode=$('mode').value;for(const option of $('humans').options)option.disabled=mode==='coop'&&Number(option.value)>3;
 const normalized=normalizeSettings({mode,humans:Number($('humans').value),cpus:Number($('cpus').value)});$('humans').value=String(normalized.humans);$('cpus').value=String(normalized.cpus);
 const humans=normalized.humans;for(const option of $('cpus').options)option.disabled=Number(option.value)>4-humans||(mode==='coop'&&Number(option.value)===0)||(mode==='team'&&Number(option.value)!==4-humans);
 $('modeHint').textContent=mode==='coop'?'人間全員 VS CPU全員。相手側が全滅すると味方全員に★。':mode==='team'?'合計4体を試合開始時にランダムで2対2へ分け、星を共有。チームは決着まで固定。':'乱戦：全員が敵です。';
 const count=$('profileScope').value==='network'?normalized.cpus:$('profileScope').value==='watch'?4:mode==='team'?3:Number($('practiceCPUs').value);
 $('profileCount').textContent=count?'CPU '+count+'体すべてを、下の共通候補から1体ずつランダムに選びます。':'今のネット設定ではCPUは出場しません。共通候補はそのまま残ります。';
}
function fillForm(){for(const key of Object.keys(DEFAULTS))if($(key))$(key).value=String(settings[key]);cpuPool.fill(settings.cpuPool||{});updateOutputs();}
for(const personality of PERSONALITIES){const op=document.createElement('option');op.value=personality.id;op.textContent=personality.name;$('personality').append(op);}
const cpuPool=setupCPUPool($('cpuProfiles'));
const updateScope=buttonChoices($('profileScope')),updateCPUCount=buttonChoices($('practiceCPUs'));
$('practiceCPUs').value=String([1,2,3].includes(stored.practiceCPUs)?stored.practiceCPUs:3);
fillForm();$('playerName').value=stored.name||'';validateEntryName();$('playerName').addEventListener('input',validateEntryName);
let ruleTimer=null;
function syncNetworkRules(){clearTimeout(ruleTimer);if(!room?.me||onlineMine())return;ruleTimer=setTimeout(()=>{if(!room?.me||onlineMine())return;settings=formValues();api('settings',settings).catch(e=>message(e.message));},180);}
$('settingsForm').addEventListener('input',e=>{if(['humans','cpus'].includes(e.target.id))$('profileScope').value='network';if(e.target.id==='practiceCPUs')$('profileScope').value='practice';updateOutputs();if(!['practiceCPUs','profileScope'].includes(e.target.id))syncNetworkRules();});
$('settingsForm').addEventListener('submit',async e=>{e.preventDefault();settings=formValues();fillForm();if(!localGame&&!onlineMine())resetIdle();try{if(room?.me)await api('settings',settings);message(localGame?'ルールを適用しました。「このルールで再スタート」で反映します。':'ルールを適用しました。次の対戦から使います。');$('practice').firstChild.textContent=localGame?'このルールで再スタート ':'CPUと対戦 ';}catch(e){message(e.message);}});
$('defaults').onclick=()=>{settings={...DEFAULTS};fillForm();syncNetworkRules();message('初期値へ戻しました。次の対戦から使います。');};
function newLocal(kind='practice',options={}){
 if(onlineMine()){message('ネット対戦中です。');return;}
 $('profileScope').value=kind;updateOutputs();
 releaseKeys();audio.reset();audio.unlock().catch(()=>{});settings=options.rules?normalizeSettings(options.rules):formValues();paused=false;localKind=kind;
 const count=kind==='practice'?(settings.mode==='team'?4:1+Number($('practiceCPUs').value)):4,slots=kind==='watch'&&options.rules?continuedWatchSlots(settings,options.previous):[];
 if(kind==='practice')slots.push({id:'you',name:room?.me?.name||$('playerName').value.trim()||'あなた',bot:false});
 while(slots.length<count)slots.push({id:'local-cpu-'+slots.length,bot:true,...(settings.mode==='coop'&&kind==='watch'?{coopSide:slots.length<2?0:1}:{})});
 localGame=new Game(settings,slots);localSetSerial++;applyBoardSize(localGame);if(kind==='practice')$('arena').focus({preventScroll:true});
 if(room?.me)api('mode',{mode:'cpu'}).catch(e=>message(e.message));updateUI(true);
}
$('practice').onclick=()=>{watchLoop.stop();newLocal('practice');};$('watch').onclick=()=>{watchLoop.stop();newLocal('watch');};
 $('pause').onclick=()=>{if(localGame&&!onlineMine()){releaseKeys();audio.stop();paused=!paused;updateUI(true);}};
$('endGame').onclick=async()=>{
 watchLoop.stop();releaseKeys();if(onlineMine()){try{await api('resign');message('この先取戦を降参しました。終了まで観戦します。');}catch(e){message(e.message);}return;}
 localGame=null;localKind='idle';paused=false;audio.reset();if(room?.me)api('mode',{mode:'lobby'}).catch(()=>{});
 resetIdle();renderRoom();updateUI(true);
};
$('overlayAction').onclick=()=>{watchLoop.stop();newLocal(localKind==='idle'?'practice':localKind);};
$('continueWatch').onclick=()=>{if(onlineMine()||localKind!=='watch'||localGame?.status!=='finished')return;watchLoop.start(localGame.settings);newLocal('watch',{rules:watchLoop.rules,previous:localGame.players});};
function resetIdle(){idleGame=new Game(settings,[],1);idleGame.status='idle';applyBoardSize(selectedGame());}
function applyBoardSize(g=selectedGame()){
 const large=g.width>28;document.body.classList.toggle('large-map',large);
 const available=$('layout').querySelector('.stage').clientWidth;if($('layout').hidden||available<=0)return;
 const height=Math.max(360,innerHeight-(document.fullscreenElement?270:285)),desired=Math.min(available,height*g.width/g.height);
 document.documentElement.style.setProperty('--arena-width',desired+'px');$('arenaFrame').style.width='min(100%, var(--arena-width))';
}
window.addEventListener('resize',()=>applyBoardSize());
new ResizeObserver(()=>applyBoardSize()).observe($('layout').querySelector('.stage'));
function wide(value){document.body.classList.toggle('wide-view',value);$('wide').textContent=value?'通常表示':'画面を広く';$('wide').setAttribute('aria-pressed',String(value));$('showRoom').hidden=true;applyBoardSize();}
$('fullscreen').onclick=async()=>{releaseKeys();try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message('全画面にできませんでした。ブラウザーのF11も使えます。');}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'全画面を解除':'全画面';applyBoardSize();});
$('wide').onclick=()=>wide(!document.body.classList.contains('wide-view'));$('showRoom').onclick=()=>wide(false);
const randomCard=document.createElement('button');randomCard.className='skin-card random-skin-card';randomCard.dataset.skin='random';randomCard.setAttribute('aria-label','ランダムスキン');randomCard.title='押すたびに別のスキンを選びます。次の対戦でも抽選し、ラウンド間は固定します。';const randomImage=document.createElement('img');randomImage.src='/assets/random-skin.svg';randomImage.alt='灰色の背景と黒いシルエットに白い？';const randomLabel=document.createElement('span');randomLabel.textContent='ランダム';randomCard.append(randomImage,randomLabel);randomCard.onclick=()=>selectSkinChoice('random');$('skins').append(randomCard);
function syncSkinChoices(){for(const card of $('skins').children)card.setAttribute('aria-pressed',String(card.dataset.skin===skinSelection.choice));$('randomSkinStatus').hidden=skinSelection.choice!=='random';$('randomSkinStatus').dataset.resolvedSkin=skin;const theme=SKINS.find(t=>t.id===skin);$('randomSkinStatus').textContent='ランダム選択中：'+theme.ref.toUpperCase()+' · '+theme.name+'（クリック／次の対戦で変更）';}
function applyResolvedSkin(){skin=skinSelection.resolved;renderer.setSkin(skin);if(!backgroundFixed)selectBackground(pairedBackgroundForSkin().id);syncSkinChoices();}
function selectSkinChoice(choice){skinSelection.select(choice);applyResolvedSkin();}
for(const theme of SKINS){const button=document.createElement('button');button.className='skin-card';button.dataset.skin=theme.id;button.setAttribute('aria-pressed',String(theme.id===skinSelection.choice));button.title=theme.note;const canvas=document.createElement('canvas');canvas.width=150;canvas.height=80;button.append(canvas);renderer.preview(canvas,theme.id);const title=document.createElement('span');title.textContent=theme.ref.toUpperCase()+' · '+theme.name;const sub=document.createElement('small');sub.textContent=theme.ref.toUpperCase()+' · '+theme.note;title.append(sub);button.append(title);button.onclick=()=>selectSkinChoice(theme.id);$('skins').append(button);}
for(const bg of BACKGROUNDS){const button=document.createElement('button');button.className='background-card';button.dataset.background=bg.id;button.setAttribute('aria-pressed',String(bg.id===background));button.title=(bg.skin?(bg.ref||bg.skin).toUpperCase()+'向け：':'')+bg.name+(bg.note?' — '+bg.note:'');button.setAttribute('aria-label',bg.name);const image=document.createElement('i');image.className='palette-color';image.style.backgroundColor=bg.color;if(bg.file)image.style.backgroundImage='url('+bg.file+')';if(bg.world)image.style.backgroundImage='radial-gradient(ellipse at 42% 34%,'+bg.floor[1]+','+bg.floor[0]+')';const label=document.createElement('span');label.textContent=(bg.skin?(bg.ref||bg.skin).toUpperCase()+' · ':'')+bg.name;button.append(image,label);button.onclick=()=>{selectBackground(bg.id);};$('backgrounds').append(button);}
syncSkinChoices();
$('backgroundFixed').checked=backgroundFixed;$('backgroundFixed').onchange=()=>{backgroundFixed=$('backgroundFixed').checked;};
$('gameEntrance').href='./about.html';
$('sidebarSettings').append(document.querySelector('.skin-section'),$('sounds'));
$('toggleBlockEdge').onclick=()=>{const theme=SKINS.find(t=>t.id===skin),id=theme.baseId||theme.id+'-edge';document.querySelector('[data-skin="'+id+'"]').click();};
function pairedBackgroundForSkin(){
 const classic={ah1:'sand',ak1:'sandlight-porcelain',ak2:'sand',ak3:'sandlight-peach',ak4:'sandlight-blue'};
 return BACKGROUNDS.find(b=>b.skin===skin)||BACKGROUNDS.find(b=>b.skin===(SKINS.find(t=>t.id===skin)?.baseId||skin))||BACKGROUNDS.find(b=>b.id===(classic[skin]||'arcade-green'));
}
function selectBackground(id){background=id;renderer.setBackground(background);for(const card of $('backgrounds').children)card.setAttribute('aria-pressed',String(card.dataset.background===background));}


function soundPreferences(){const next={enabled:$('soundEnabled').checked,volume:Number($('soundVolume').value),otherStepGain:Number($('otherStepGain').value),stepDensity:Number($('stepDensity').value)};for(const kind of Object.keys(SOUND_BANK)){next[kind]=$('sound-'+kind).value;next[kind+'Gain']=Number($('gain-'+kind).value);}audio.configure(next);$('soundVolumeValue').textContent=next.volume+'%';$('otherStepGainValue').textContent=next.otherStepGain+'%';$('stepDensityValue').textContent=next.stepDensity===0?'自分のみ':next.stepDensity+'%';for(const kind of Object.keys(SOUND_BANK))$('gainValue-'+kind).textContent=next[kind+'Gain']+'%';}
$('soundEnabled').checked=audio.settings.enabled;$('soundVolume').value=audio.settings.volume;$('soundVolumeValue').textContent=audio.settings.volume+'%';
for(const key of ['otherStepGain','stepDensity']){$(key).value=audio.settings[key];$(key+'Value').textContent=audio.settings[key]+'%';$(key).oninput=soundPreferences;}
for(const[kind,presets]of Object.entries(SOUND_BANK)){const card=document.createElement('article');card.className='sound-card';const title=document.createElement('h3');title.textContent=SOUND_LABELS[kind];const select=document.createElement('select');select.id='sound-'+kind;select.setAttribute('aria-label',SOUND_LABELS[kind]+'の候補');for(const[value,text]of [['random','すべてランダム（試合中は固定）'],['none','音なし'],...presets.map((p,i)=>[String(i+1).padStart(2,'0'),String(i+1).padStart(2,'0')+' · '+p.name])]){const op=document.createElement('option');op.value=value;op.textContent=text;select.append(op);}select.value=audio.settings[kind];const buttons=document.createElement('div');buttons.className='sound-buttons';for(const[fast,text]of kind==='step'?[[false,'通常を試聴'],[true,'ダッシュを試聴']]:[[false,'試聴する']]){const button=document.createElement('button');button.className='secondary';button.dataset.preview=kind;button.dataset.fast=String(fast);button.textContent=text;button.onclick=()=>audio.preview(kind,fast).catch(()=>message('音を再生できませんでした。ページを再読み込みしてください。'));buttons.append(button);}const label=document.createElement('label');label.textContent='この音の音量';const output=document.createElement('output');output.id='gainValue-'+kind;output.textContent=audio.settings[kind+'Gain']+'%';const range=document.createElement('input');range.type='range';range.id='gain-'+kind;range.min=0;range.max=100;range.value=audio.settings[kind+'Gain'];label.append(output,range);const current=document.createElement('p');current.id='current-'+kind;current.className='sound-current';card.append(title,select,current,buttons,label);$('soundChoices').append(card);select.onchange=soundPreferences;range.oninput=soundPreferences;}
// Defaults come from the same definitions as a fresh installation, never saved values.
for(const range of document.querySelectorAll('input[type="range"]')){
 const audioKey=range.id==='soundVolume'?'volume':range.id.startsWith('gain-')?range.id.slice(5)+'Gain':range.id;
 const defaultValue=range.id in DEFAULTS?DEFAULTS[range.id]:SOUND_DEFAULTS[audioKey];
 if(defaultValue==null)continue;
 range.title='ダブルクリックで初期値 '+defaultValue+' に戻す';
 range.addEventListener('dblclick',e=>{e.preventDefault();range.value=String(defaultValue);range.dispatchEvent(new Event('input',{bubbles:true}));range.dispatchEvent(new Event('change',{bubbles:true}));});
}
$('soundEnabled').onchange=soundPreferences;$('soundVolume').oninput=soundPreferences;$('stopSounds').onclick=()=>audio.stop();$('previewFourSteps').onclick=()=>audio.previewFootsteps().catch(()=>message('音を再生できませんでした。'));
function connect(){
 stream?.close();stream=new EventSource('/api/events');
 stream.onmessage=e=>{const next=JSON.parse(e.data),wasMine=onlineMine(),firstSnapshot=!room;room=next;if(firstSnapshot&&room.me){settings=normalizeSettings(room.me.settings);fillForm();}networkAt=performance.now();$('connection').textContent='接続中';
  if(onlineMine()&&lastNetworkId!==room.match.id){lastNetworkId=room.match.id;watchLoop.stop();releaseKeys();audio.reset();localGame=null;paused=false;applyBoardSize(room.match.game);lastPad={dir:null,dash:false,jump:false};message('ネット対戦が始まります。先頭の '+room.match.owner+' さんのルールです。');}
  if(wasMine&&!onlineMine()){lastNetworkId=null;audio.reset();resetIdle();message('待受に戻りました。勝者は元の位置で待受ONを継続します。');}
  renderRoom();updateUI(true);
 };
 stream.onerror=()=>{$('connection').textContent='再接続中';releaseKeys();};
 clearInterval(heartbeat);heartbeat=setInterval(()=>api('heartbeat').catch(e=>{if(e.message.includes('退室')){stream?.close();clearTimeout(ruleTimer);location.reload();}}),5000);
}
function validateEntryName(){const input=$('playerName'),valid=Array.from(input.value.trim().normalize('NFC')).length<=8;input.setCustomValidity(valid?'':'名前は8文字までで入力してください。');return valid;}
async function join(){if(!validateEntryName()){$('playerName').reportValidity();return;}await api('join',{name:$('playerName').value.trim()});await api('settings',settings);connect();}
$('randomName').onclick=()=>{const candidates=nameCandidates.filter(name=>name!==$('playerName').value.trim());if(!candidates.length){message('名前の候補を読み込めませんでした。名前は手入力できます。');return;}$('playerName').value=candidates[Math.floor(Math.random()*candidates.length)];validateEntryName();};
$('joinForm').onsubmit=async e=>{e.preventDefault();try{await join();}catch(e){message(e.message);}};
$('anyone').onchange=async()=>{try{clearTimeout(ruleTimer);settings=formValues();await api('anyone',{enabled:$('anyone').checked,settings});}catch(e){$('anyone').checked=room?.me?.anyone===true;message(e.message);}};
$('ready').onclick=async()=>{audio.unlock().catch(()=>{});try{clearTimeout(ruleTimer);settings=formValues();await api('ready',{ready:!room?.me?.ready,settings});}catch(e){message(e.message);}};
$('leave').onclick=async()=>{try{watchLoop.stop();clearTimeout(ruleTimer);releaseKeys();await api('leave');stream?.close();clearInterval(heartbeat);room=null;lastNetworkId=null;audio.stop();localGame=null;paused=false;renderRoom();location.reload();}catch(e){message(e.message);}};
function renderRoom(){
 const joined=!!room?.me,opening=joined&&$('layout').hidden;$('joinPanel').hidden=joined;$('layout').hidden=!joined;$('howto').hidden=!joined;$('chooseSounds').hidden=!joined;$('wide').hidden=!joined;$('joined').hidden=!room?.me;$('roomCount').textContent=(room?.players.length||0)+' / 6人';
 if(opening){boardSizeKey='';wide(true);}
 for(const input of $('settingsForm').querySelectorAll('input,select,button'))input.disabled=onlineMine();
 renderChat();if(!room?.me)return;$('myName').textContent=room.me.name;$('roster').replaceChildren();
 room.players.forEach((p,i)=>{const li=document.createElement('li');for(const[cl,text]of [['num',String(i+1)],['player-name',p.name+(p.id===room.me.id?'（あなた）':'')],['wins','win '+p.wins],['state'+(p.ready?' ready':''),(p.mode==='match'?(p.ready?'勝者待受中':'対戦'+p.matchId+'中'):p.ready?'待受中':p.mode==='cpu'?'CPU戦':'待機')+(p.anyone?' · ✅誰でも':'')]]){const span=document.createElement('span');span.className=cl;span.textContent=text;li.append(span);}li.classList.toggle('is-me',p.id===room.me.id);$('roster').append(li);});
 $('anyone').checked=room.me.anyone===true;$('anyone').disabled=false;
 $('ready').setAttribute('aria-pressed',String(room.me.ready));$('ready').textContent=onlineMine()?(room.me.ready?'勝者待受中':'ネット対戦中'):room.me.ready?'待受中 · 取り消す':'ネット対戦待受開始';$('ready').disabled=onlineMine();
 const rule=room.next;$('queueHint').textContent=rule?`「${rule.position}番ルール：${rule.humans}Player・${rule.cpus}CPU・${modeName(rule.mode)}」を採用`:'誰でもON・待受ONの相手を待っています。';
 for(const input of $('settingsForm').querySelectorAll('input,select,button'))input.disabled=onlineMine();
}
const roomChat=setupRoomChat({list:$('chatMessages'),input:$('chatText'),sendButton:$('chatSend'),form:$('chatForm'),status:$('chatStatus'),unread:$('chatUnread'),send:text=>api('chat',{text})});
function renderChat(){roomChat.update(room);}
function sendInput(data){
 if(paused)return;
 if(onlineMine()){const matchId=room.match.id;inputQueue=inputQueue.catch(()=>{}).then(()=>api('input',{...data,matchId})).catch(e=>message(e.message));}
 else if(localGame&&localKind==='practice')localGame.input('you',data);
}
function releaseKeys(){controls.release();if(localGame){const p=localGame.players.find(p=>p.id==='you');if(p)p.dash=false;}lastPad.dash=false;}
const controls=new ArenaControls({canvas:$('arena'),onInput:sendInput,canControl:()=>!!meId()&&!!selectedGame()&&selectedGame().status!=='finished'&&!paused,onModeChange:()=>updateUI(true),onError:message});
function gamepad(){if(!navigator.getGamepads||(!controls.active&&!controls.keyboardActive))return;const pad=[...navigator.getGamepads()].find(Boolean);if(!pad)return;let dir=null;const ax=pad.axes[0]||0,ay=pad.axes[1]||0;
 if(pad.buttons[12]?.pressed||ay<-.55)dir=0;else if(pad.buttons[15]?.pressed||ax>.55)dir=1;else if(pad.buttons[13]?.pressed||ay>.55)dir=2;else if(pad.buttons[14]?.pressed||ax<-.55)dir=3;
 if(dir!==null&&dir!==lastPad.dir)sendInput({dir});const dash=!!pad.buttons[0]?.pressed,jump=!!pad.buttons[1]?.pressed;if(dash!==lastPad.dash)sendInput({dash});if(jump&&!lastPad.jump)sendInput({jump:true});lastPad={dir,dash,jump};
}
let scoreKey='';
function updateUI(force=false){
 const currentSkin=SKINS.find(t=>t.id===skin);$('toggleBlockEdge').textContent=currentSkin?.baseId?'元のスキンを試す':'このスキンの縁ありを試す';
 const g=selectedGame();if(!g)return;
 for(const kind of Object.keys(SOUND_BANK)){const id=audio.currentId(kind),preview=audio.previewPicks[kind],name=value=>value&&value!=='none'?value+' · '+SOUND_BANK[kind][Number(value)-1]?.name:'音なし';$('current-'+kind).textContent=audio.settings[kind]==='random'?(audio.matchKey?'この試合：'+name(id):preview?'試聴：'+name(preview)+' · 対戦開始時に抽選':'対戦開始時に15候補から1音を選びます。'):'使用音：'+name(id);}
 const mine=meId(),p=g.players.find(p=>p.id===mine),playing=!!p;
 $('practice').firstChild.textContent=localGame&&localKind==='practice'?'CPUと再戦 ':'CPUと対戦 ';
 $('gameMode').textContent=g.status==='idle'?'待機中':onlineMine()?'ネット対戦':localGame?localKind==='practice'?'CPUと対戦':'CPU観戦':'ネット観戦';$('round').textContent=g.status==='idle'?'—':String(g.round).padStart(2,'0');
 $('jumpBadge').classList.toggle('boost',!!p&&g.scores.some(v=>v===g.settings.target-1)&&p.score<g.settings.target-1);
 $('jumpCount').replaceChildren();const count=document.createTextNode(p?(p.alive?p.jumps:'—'):'—');$('jumpCount').append(count);const label=document.createElement('small');label.textContent='回';$('jumpCount').append(label);
 $('pause').hidden=!localGame||onlineMine();$('pause').textContent=paused?'再開':'一時停止';$('endGame').hidden=!localGame&&!onlineMine();$('endGame').textContent=onlineMine()?'対戦をやめる（降参）':'対戦をやめる';$('practice').disabled=onlineMine();$('watch').disabled=onlineMine();
 $('captureStatus').textContent=controls.active?'マウス操作中 · 左：ダッシュ／右：ジャンプ · Esc／Enter／Backspace：解除':playing?'盤面を左クリックでマウス操作に入る · Esc／Enter／Backspaceで解除':g.status==='idle'?'ボタンでスタートできます。':'CPU観戦中';
 $('captureStatus').classList.toggle('captured',controls.active);
 const key=g.players.map(p=>[p.id,p.score,p.alive,p.jumps]).join('|')+g.settings.target+mine;
 if(key!==scoreKey||force){scoreKey=key;$('scores').replaceChildren();$('scores').style.gridTemplateColumns=`repeat(${g.players.length},minmax(0,1fr))`;
  for(const q of g.players){const card=document.createElement('div');card.className='score-card'+(q.id===mine?' me':'')+(!q.alive?' dead':'');card.style.setProperty('--player',q.color);const name=document.createElement('div');name.className='score-name';name.textContent=(q.id===mine?'あなた · ':'')+q.name;name.title=q.name;const small=document.createElement('small');small.textContent=q.bot?'Lv.'+q.level:g.settings.mode==='coop'?(q.team===0?'プレイヤー側':'CPU側'):g.settings.mode==='team'?'チーム'+(q.team+1):'';name.append(small);card.append(name);const stars=document.createElement('div');stars.className='stars';stars.setAttribute('aria-label',q.score+'勝');for(let i=0;i<g.settings.target;i++){const star=document.createElement('span');star.className='star'+(i<q.score?' on':'');star.textContent='★';stars.append(star);}card.append(stars);
   if(q.score===g.settings.target-1){const mp=document.createElement('div');mp.className='match-point';mp.textContent='MATCH POINT';card.append(mp);}$('scores').append(card);}
 }
 const overlay=$('overlay');let title='',hint='',detail='';
 if(g.status==='idle'){title='準備できたら、スタート。';hint='BATTLE SNAKE';detail='ルールと音を選んで、CPUと遊んでみましょう。';}
 else if(paused){title='ひと休み';hint='PAUSED';detail='「再開」ボタンで続けられます。';}
 else if(g.status==='countdown'){title=String(Math.max(1,Math.ceil(g.phaseTime)));hint='READY';detail=g.settings.mode!=='ffa'?'同じチームの星は共通です。':'鼻の向きを見て、道を選ぼう。';}
 else if((g.status==='roundover'||g.status==='finished')&&g.time-(g.result?.at??-1)>.6){
  const result=g.result;hint=result?.draw?'DRAW':g.status==='finished'?'GAME SET':'ROUND WIN';
  title=result?.draw?'ドロー':g.settings.mode==='coop'?(result.winner===0?'プレイヤー側の勝利！':'CPU側の勝利！'):g.settings.mode==='team'?`チーム${result.winner+1}の勝利！`:result?.names[0]+' の勝利！';
  detail=g.status==='finished'?(onlineMine()?'まもなく待受へ。勝者は元の位置で待受ONを継続します。':watchLoop.enabled&&localKind==='watch'?`${Math.ceil(watchLoop.remaining/1000)}秒後に同じルールで次の試合へ。`:'規定の星を先取しました。もう一度遊べます。'):'盤面を振り返って、次のラウンドへ。';
 }
 overlay.hidden=!title;overlay.classList.toggle('countdown',g.status==='countdown'&&!paused);$('overlayTitle').textContent=title;$('overlayHint').textContent=hint;$('overlayDetail').textContent=detail;$('overlayAction').hidden=!(g.status==='idle'||localGame&&!onlineMine()&&g.status==='finished');$('overlayAction').textContent=g.status==='idle'?'CPUと対戦を始める':'もう一度遊ぶ';$('continueWatch').hidden=!(localGame&&localKind==='watch'&&!onlineMine()&&g.status==='finished');$('continueWatch').disabled=watchLoop.enabled;$('continueWatch').textContent=watchLoop.enabled?'連続観戦中':'ひたすら観戦を続ける';
 $('gameFootnote').textContent=g.status==='idle'?'自動では始まりません。「CPUと対戦」か「CPU観戦」を選んでください。':p&&!p.alive&&g.status==='running'?`脱落：${p.reason}。残ったキャラの決着を待っています。`:onlineMine()?`採用ルール：${room.match.owner} さん · ${modeName(g.settings.mode)} · 星${g.settings.target}つ先取`:playing?'地上の真後ろ入力は自滅。空中は横入力で曲がれます。石の上への着地はアウト。':watchLoop.enabled?'連続観戦中 · 結果を6秒表示して次の試合へ。「対戦をやめる」で終了します。':'CPU同士の動きを眺めています。「対戦をやめる」で終了します。';
}
async function init(){
 resetIdle();renderRoom();updateUI(true);
 try{const response=await fetch('/api/info');if(!response.ok)throw new Error('接続できません。');const info=await response.json();nameCandidates=Array.isArray(info.names)?info.names.filter(n=>typeof n==='string'):[];$('randomName').disabled=!nameCandidates.length;if(!$('playerName').value)$('playerName').value=info.name;validateEntryName();$('capacity').textContent=`現在 ${info.count} / 6人 · CPU戦・CPU観戦・ネット対戦を遊べます。`;if(info.session)connect();}catch{message('部屋への接続がありません。ゲームサーバーの起動を確認してください。');}
}
let last=performance.now(),accumulator=0;
function frame(now){const delta=Math.min(.12,(now-last)/1000);last=now;accumulator+=delta;let steps=0;
 while(accumulator>=1/60&&steps++<8){if(localGame&&!paused&&!onlineMine())localGame.step(1/60);accumulator-=1/60;}
 if(watchLoop.tick({key:localSetSerial,finished:!!localGame&&localKind==='watch'&&!onlineMine()&&localGame.status==='finished'&&localGame.time-(localGame.result?.at??0)>.6,paused,now}))newLocal('watch',{rules:watchLoop.rules,previous:localGame.players});
 const skinSet=onlineMine()?'net:'+room.match.id+':'+room.me.id:localGame?'local:'+localSetSerial:room?.match&&room?.me?'net:'+room.match.id+':'+room.me.id:null;
 if(skinSelection.beginSet(skinSet))applyResolvedSkin();
 const g=selectedGame(),key=onlineMine()?'net'+room.match.id:localGame?'local'+localSetSerial:'idle',sizeKey=g.width+':'+g.height+':'+innerWidth+':'+innerHeight+':'+document.body.classList.contains('wide-view');if(sizeKey!==boardSizeKey){boardSizeKey=sizeKey;applyBoardSize(g);}controls.refresh(key+':'+g?.round+':'+g?.status);gamepad();if(g)renderer.draw(g,{meId:meId(),now,networkAge:g.status!=='idle'&&(!localGame||onlineMine())?Math.min(100,now-networkAt):0,reducedMotion});audio.sync(g,key,meId(),paused);if(now-lastUI>100){updateUI();lastUI=now;}requestAnimationFrame(frame);
}
init();requestAnimationFrame(frame);

$('chooseSounds').onclick=()=>{releaseKeys();const panel=$('sidebarSettings');panel.scrollTo({top:panel.scrollTop+$('sounds').getBoundingClientRect().top-panel.getBoundingClientRect().top,behavior:'smooth'});};$('backToGame').onclick=()=>$('arenaFrame').scrollIntoView({behavior:'smooth',block:'start'});

