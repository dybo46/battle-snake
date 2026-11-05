// Page choices last only for this page visit; a fresh visit starts dark.
(()=>{
 const key='battle-snake-page-theme',root=document.documentElement;
 let theme='dark';try{localStorage.removeItem(key);}catch{}
 function apply(){
  root.dataset.pageTheme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0c1416':'#f5f4ef');
  const button=document.getElementById('pageTheme');if(!button)return;
  const current=theme==='dark'?'ダーク':'ライト',next=theme==='dark'?'ライト':'ダーク';button.textContent='配色：'+current;button.setAttribute('aria-pressed',String(theme==='dark'));button.setAttribute('aria-label','ページ配色：'+current+'。'+next+'表示に切り替え');button.title=next+'表示に切り替え';
 }
 apply();document.addEventListener('DOMContentLoaded',()=>{apply();document.getElementById('pageTheme').onclick=()=>{theme=theme==='dark'?'light':'dark';apply();};});
})();
