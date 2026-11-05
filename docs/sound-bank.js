// Original procedural game sounds. No recordings or samples from existing games.
const p=(name,wave,curve,duration,extra={})=>({name,wave,curve,duration,...extra});
export const SOUND_BANK={
 step:[
  p('基本のキュイ','pulse',[1250,1550,720],.072,{duty:.35,soft:.3}),
  p('澄んだキュイ','triangle',[1700,1150,760],.075,{bell:.22}),
  p('まるいクイ','fm',[920,1370,650],.085,{fm:1.4,ratio:2}),
  p('8ビット・キュッ','pulse',[2100,1500,710],.055,{duty:.22,quantize:5}),
  p('やさしいキュイ','triangle',[720,1090,580],.093,{soft:.7}),
  p('銀色のキュイ','fm',[1450,1120,820],.067,{fm:1.9,ratio:3,bell:.15}),
  p('キョイ・ボイス','pulse',[510,880,430],.087,{duty:.4,formant:true}),
  p('ピコキュイ','sine',[1320,990,740],.085,{quantize:3,pulses:2,bell:.25}),
  p('短いクィ','pulse',[1900,1350,950],.043,{duty:.28,soft:.25}),
  p('ゆるいキュウ','fm',[660,1030,490],.096,{fm:1.1,ratio:1.5}),
  p('明るいキュイ','triangle',[1370,1660,930],.068,{bell:.45}),
  p('水玉クイ','sine',[1620,1050,620],.081,{fm:.45,ratio:2}),
  p('デジタル・キキ','pulse',[1500,1125,844],.075,{duty:.5,quantize:3,pulses:2}),
  p('シンセ・キュイ','fm',[530,980,640],.089,{fm:2.6,ratio:3.5,soft:.2}),
  p('低めのクイ','triangle',[750,610,390],.092,{fm:.3,ratio:2,soft:.4})
 ],
 jump:[
  p('基本のピュイ','triangle',[420,1150,1750],.24,{bell:.2}),
  p('軽いピョン','pulse',[430,1450,1020],.18,{duty:.3,soft:.25}),
  p('なめらかシューイ','sine',[350,850,2150],.3,{fm:.6,ratio:2}),
  p('8ビット・ピョイ','pulse',[390,850,1850],.21,{quantize:8,duty:.25}),
  p('ふわっとピュウ','triangle',[310,1000,780],.38,{soft:.65,vibrato:7}),
  p('メタリック・ピュイ','fm',[430,1320,1900],.25,{fm:2.8,ratio:3.5}),
  p('ぷるんジャンプ','fm',[280,1260,560],.32,{fm:1.3,ratio:2,vibrato:14}),
  p('高いピュイ','sine',[880,1550,2800],.2,{bell:.4}),
  p('低いポヨン','triangle',[190,720,360],.33,{fm:.8,ratio:1.5}),
  p('二段ピピュイ','pulse',[480,960,1920],.29,{quantize:3,pulses:2,duty:.4}),
  p('小さなワープ','fm',[340,1780,980],.31,{fm:3.2,ratio:2.1,vibrato:9}),
  p('ガラスのピュイ','sine',[630,1420,2320],.28,{bell:.8,echo:.13}),
  p('パルス・シュイ','pulse',[320,900,1520],.27,{duty:.17,soft:.25}),
  p('短いピッ','triangle',[750,1400,1850],.135,{bell:.25}),
  p('レトロ・レーザー','pulse',[280,1200,2450],.35,{duty:.45,quantize:12,echo:.08})
 ],
 crash:[
  p('基本のピキュ','pulse',[1450,610,170],.16,{duty:.3,noise:.08}),
  p('電子ポン','sine',[720,260,110],.18,{fm:1.5,ratio:2}),
  p('8ビット・プギュ','pulse',[1180,440,90],.2,{quantize:8,duty:.4,noise:.12}),
  p('短いビッ','pulse',[1800,750,230],.09,{duty:.2,soft:.15}),
  p('ぷちゅん','fm',[520,800,95],.24,{fm:2,ratio:1.5}),
  p('キュプ','triangle',[1650,580,190],.14,{bell:.2}),
  p('やわらかポフ','sine',[380,220,85],.19,{noise:.06,soft:.6}),
  p('デジタル・パピ','pulse',[1400,700,350],.17,{pulses:2,quantize:3,duty:.35}),
  p('ロボット・ピギュ','fm',[850,520,130],.23,{fm:3.4,ratio:2.5}),
  p('丸いプイッ','triangle',[980,1210,140],.18,{fm:.6,ratio:2}),
  p('高いピチュ','sine',[2300,1000,330],.12,{bell:.65}),
  p('低いビュン','pulse',[620,290,75],.25,{duty:.5,soft:.3}),
  p('電子スパーク','fm',[1750,850,180],.155,{fm:3.8,ratio:4,noise:.1}),
  p('階段ピポポ','triangle',[1320,660,165],.27,{quantize:5,pulses:3}),
  p('ゲーム・プシュ','pulse',[1040,330,120],.205,{duty:.18,noise:.13,echo:.08})
 ],
 start:[
  p('基本のパン','triangle',[1200,1080,1080],.14,{noise:.13,bell:.3,decay:15}),
  p('澄んだピン','sine',[1760,1760,1760],.32,{bell:.8,decay:12}),
  p('レトロ・ピッ','pulse',[1320,1320,1320],.105,{duty:.3,soft:.3}),
  p('ポン！','fm',[660,880,880],.19,{fm:1.5,ratio:2,decay:13}),
  p('二音のピポン','triangle',[1046,1568,1568],.28,{quantize:2,pulses:2,bell:.2}),
  p('明るいティン','sine',[2093,2093,2093],.24,{bell:1.1,decay:18}),
  p('低めのパン','pulse',[440,660,660],.15,{duty:.4,noise:.08,decay:14}),
  p('軽いプン','sine',[520,1040,1040],.13,{fm:.7,ratio:2,decay:15}),
  p('三音のスタート','pulse',[784,988,1568],.36,{quantize:3,pulses:3,duty:.3,soft:.35}),
  p('やさしいピン','triangle',[1175,1175,1175],.3,{bell:.4,decay:10}),
  p('シンセ・パァン','fm',[740,1480,1480],.22,{fm:2.3,ratio:3,noise:.06,decay:11}),
  p('クリスタル・リン','sine',[1568,2093,2093],.4,{bell:1,echo:.15,decay:10}),
  p('短いチン','triangle',[2350,2350,2350],.11,{bell:.6,decay:20}),
  p('ゲーム・タタン','pulse',[988,1318,1318],.255,{quantize:2,pulses:2,duty:.22,noise:.05}),
  p('丸いピポッ','fm',[660,1320,990],.24,{fm:1.1,ratio:1.5,quantize:3})
 ]
};
export const SOUND_LABELS={step:'歩く音',jump:'ジャンプ',crash:'ぶつかった音',start:'ラウンド開始'};
export const SOUND_DEFAULTS={otherSteps:'shared',enabled:true,volume:35,step:'random',jump:'random',crash:'random',start:'random',stepGain:50,jumpGain:50,crashGain:50,startGain:50,otherStepGain:25,stepDensity:50};
export function soundId(kind,index){return `${kind}-${String(index+1).padStart(2,'0')}`;}
export function soundFile(kind,id){return `./audio/${kind}-${id}.wav`;}
export function normalizeAudio(input={}){const s={...SOUND_DEFAULTS};if(typeof input.enabled==='boolean')s.enabled=input.enabled;for(const k of ['volume','stepGain','jumpGain','crashGain','startGain','otherStepGain','stepDensity'])if(Number.isFinite(Number(input[k])))s[k]=Math.max(0,Math.min(100,Number(input[k])));for(const k of Object.keys(SOUND_BANK))if(input[k]==='none'||input[k]==='random'||/^0[1-9]$|^1[0-5]$/.test(input[k]))s[k]=input[k];return s;}
function blep(t,dt){if(t<dt){t/=dt;return t+t-t*t-1;}if(t>1-dt){t=(t-1)/dt;return t*t+t+t+1;}return 0;}
function frequency(curve,t,quantize){let x=Math.min(.999999,t)*(curve.length-1);if(quantize)x=Math.floor(Math.min(.999999,t)*quantize)/(quantize-1)*(curve.length-1);x=Math.min(curve.length-1,x);const i=Math.min(curve.length-2,Math.floor(x)),f=x-i;return curve[i]*Math.pow(curve[i+1]/curve[i],f);}
export function synthesize(kind,index,sampleRate=44100){
 const cfg=SOUND_BANK[kind]?.[index];if(!cfg)throw new Error('音の番号が範囲外です。');
 const length=Math.ceil((cfg.duration+(cfg.echo?.09:0))*sampleRate),samples=new Float32Array(length);let phase=0,modPhase=0,bellPhase=0,noiseState=918273+index*117,low=0,low2=0,dc=0;
 for(let i=0;i<Math.ceil(cfg.duration*sampleRate);i++){
  const seconds=i/sampleRate,t=seconds/cfg.duration,f=frequency(cfg.curve,t,cfg.quantize)*(1+(cfg.vibrato||0)*.0009*Math.sin(seconds*2*Math.PI*(cfg.vibrato||1))),dt=f/sampleRate;
  phase=(phase+dt)%1;modPhase=(modPhase+dt*(cfg.ratio||2))%1;bellPhase=(bellPhase+dt*2.76)%1;
  const sine=Math.sin(phase*Math.PI*2+(cfg.fm||0)*Math.pow(1-t,1.3)*Math.sin(modPhase*Math.PI*2));let signal=sine;
  if(cfg.wave==='pulse'){const duty=cfg.duty||.35;signal=(phase<duty?1:-1)+blep(phase,dt)-blep((phase+1-duty)%1,dt);signal=signal*.65+sine*(cfg.soft||.12);}
  else if(cfg.wave==='triangle'){signal=0;for(let h=1;h<=11&&h*f<sampleRate*.44;h+=2)signal+=Math.pow(-1,(h-1)/2)*Math.sin(phase*Math.PI*2*h)/(h*h);signal*=.9;}
  if(cfg.bell)signal+=cfg.bell*Math.sin(bellPhase*Math.PI*2)*Math.exp(-seconds*24);
  if(cfg.formant)signal=signal*.35+Math.sin(phase*Math.PI*6)*.4+Math.sin(phase*Math.PI*10)*.2;
  noiseState^=noiseState<<13;noiseState^=noiseState>>>17;noiseState^=noiseState<<5;const noise=(noiseState>>>0)/2147483648-1;
  signal+=noise*(cfg.noise||0)*Math.exp(-seconds*110);
  let gate=1;if(cfg.pulses){const beat=(t*cfg.pulses)%1;gate=Math.min(1,beat/.05,(1-beat)/.1);}
  const attack=Math.min(1,seconds/.0025),release=Math.min(1,(cfg.duration-seconds)/.012),envelope=attack*release*Math.exp(-seconds*(cfg.decay??(kind==='start'?8:kind==='crash'?5:1)));
  signal*=envelope*gate;const alpha=1-Math.exp(-2*Math.PI*5800/sampleRate);low+=alpha*(signal-low);low2+=alpha*(low-low2);dc+=.003*(low2-dc);samples[i]=low2-dc;
 }
 if(cfg.echo){const delay=Math.floor(.047*sampleRate);for(let i=samples.length-1;i>=delay;i--)samples[i]+=samples[i-delay]*cfg.echo;}
 let peak=0,power=0;for(const value of samples){peak=Math.max(peak,Math.abs(value));power+=value*value;}const rms=Math.sqrt(power/samples.length),scale=Math.min(.55/Math.max(peak,.001),.19/Math.max(rms,.001));for(let i=0;i<samples.length;i++){const edge=Math.min(1,i/(sampleRate*.0015),(samples.length-1-i)/(sampleRate*.003));samples[i]*=scale*Math.max(0,edge);}return samples;
}
export function wavBytes(samples,sampleRate=44100){const out=new Uint8Array(44+samples.length*2),view=new DataView(out.buffer),text=(offset,s)=>{for(let i=0;i<s.length;i++)out[offset+i]=s.charCodeAt(i);};text(0,'RIFF');view.setUint32(4,out.length-8,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);return out;}
