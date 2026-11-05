import {PERSONALITIES} from './cpu.js';
export function setupCPUPool(container){
 {
  const row=document.createElement('fieldset');row.id='cpuPool';row.className='cpu-profile';
  const title=document.createElement('legend');title.textContent='すべてのCPUの抽選候補';row.append(title);
  for(const [kind,label,options]of [['levels','難易度',[1,2,3,4,5,6,7,8,9,10].map(v=>[v,String(v)])],['personalities','性格',PERSONALITIES.map(p=>[p.id,p.name])]]){
   const group=document.createElement('fieldset');group.className='candidate-group';group.dataset.kind=kind;
   const legend=document.createElement('legend');legend.textContent=label;group.append(legend);
   const actions=document.createElement('div');actions.className='candidate-actions';
   for(const [value,text]of [[true,'すべてチェック'],[false,'チェックを外す']]){const button=document.createElement('button');button.type='button';button.textContent=text;button.onclick=()=>{for(const input of group.querySelectorAll('input'))input.checked=value;group.dispatchEvent(new Event('input',{bubbles:true}));};actions.append(button);}group.append(actions);
   const choices=document.createElement('div');choices.className='candidate-choices '+kind;
   for(const[value,text]of options){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=value;input.dataset.kind=kind;input.id='cpu-'+kind+'-'+value;label.append(input,document.createTextNode(text));choices.append(label);}group.append(choices);row.append(group);
  }
  const summary=document.createElement('p');summary.className='hint pool-summary';row.append(summary);container.append(row);
 }
 return{
  read(){return{levels:[...container.querySelectorAll('input[data-kind="levels"]:checked')].map(e=>Number(e.value)),personalities:[...container.querySelectorAll('input[data-kind="personalities"]:checked')].map(e=>e.value)};},
  fill(pool={}){for(const input of container.querySelectorAll('input'))input.checked=(pool[input.dataset.kind]||[]).includes(input.dataset.kind==='levels'?Number(input.value):input.value);},
  summarize(){const levels=container.querySelectorAll('input[data-kind="levels"]:checked').length,kinds=container.querySelectorAll('input[data-kind="personalities"]:checked').length;container.querySelector('.pool-summary').textContent=`難易度：${levels?levels+'候補':'共通設定'} ／ 性格：${kinds?kinds+'候補':'共通設定'}。各CPUが同じ候補から別々に抽選します。`;}

 };
}
export function buttonChoices(select){
 select.hidden=true;const group=document.createElement('div');group.className='choice-buttons';group.setAttribute('role','group');group.setAttribute('aria-label',select.getAttribute('aria-label')||select.closest('label')?.firstChild.textContent||'選択');
 for(const option of select.options){const button=document.createElement('button');button.type='button';button.textContent=option.textContent;button.dataset.value=option.value;button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));};group.append(button);}select.after(group);
 return()=>{for(const button of group.children)button.setAttribute('aria-pressed',String(button.dataset.value===select.value));};
}
