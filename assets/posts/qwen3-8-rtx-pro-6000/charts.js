// Charts for the post "Qwen3.8 on RTX PRO 6000 Blackwell" (artus.ai). Draws into .brrr; colours come from its CSS tokens.
(function(){
'use strict';
const ROOT=document.querySelector('.brrr');
if(!ROOT)return;

const NS='http://www.w3.org/2000/svg';
const css=v=>getComputedStyle(ROOT).getPropertyValue(v).trim();
function el(n,a,p){const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function tx(p,x,y,s,cls,anchor,extra){const t=el('text',Object.assign({x,y,class:cls,'text-anchor':anchor||'start'},extra||{}),p);t.textContent=s;return t;}
function hbar(x,y,w,h){if(w<=0)return '';const r=Math.min(4,w/2);return `M${x},${y}h${w-r}a${r},${r} 0 0 1 ${r},${r}v${h-2*r}a${r},${r} 0 0 1 -${r},${r}h${-(w-r)}z`;}
const f1=v=>v.toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1});
const f0=v=>Math.round(v).toLocaleString('en-US');
const sg=v=>(v>0?'+':v<0?'\u2212':'')+Math.abs(v);
function size(svg,W,H){svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('width',W);svg.setAttribute('height',H);svg.style.width='100%';svg.style.height='auto';}
function clear(id){const s=document.getElementById(id);while(s.firstChild)s.removeChild(s.firstChild);return s;}
function table(id,head,rows,num){const t=document.getElementById(id);t.innerHTML='<tr>'+head.map((h,i)=>`<th${num&&num[i]?' class="n"':''}>${h}</th>`).join('')+'</tr>'+rows.map(r=>'<tr>'+r.map((c,i)=>`<td${num&&num[i]?' class="n"':''}>${c}</td>`).join('')+'</tr>').join('');}

// ---------- data ----------
const LADDER=[
 {l:'Stock: FP8 checkpoint + MTP5',s:'speculative decoding; 3 runs',v:1019.2,g:'17 of 18',t:'Runs 1,087.8 / 1,048.0 / 921.8 s, no loops. The reference for this ladder. A same-host rerun on 28 October took 1,013.5 s (4 of 6; both Q&A tasks failed) against 649.1 s for the sparse-prefill stack (−36%) and 1,903.3 s without speculation.'},
 {l:'+ 4-bit weights everywhere',s:'NVFP4 on Marlin kernels, FP8 KV cache; 3 runs',v:863.6,g:'15 of 18',t:'Runs 860.3 / 861.9 / 868.6 s, no loops.'},
 {l:'+ FP8-KV prefill attention kernel',s:'katt2b; 3 runs',v:762.6,g:'13 of 18, 2 loops',t:'Runs 783.4 / 800.8 / 703.7 s. Two runs looped on the same task.'},
 {l:'+ 4-bit prefill matmuls',s:'S2 W4A4; 3 runs',v:672.8,g:'17 of 18',t:'Runs 685.4 / 657.1 / 675.9 s; 654–672 s on later hosts. Time to first token 1.5–1.9× faster than the row above.'},
 {l:'+ INT4 draft head, decode-attention split',s:'stack F; 3 runs; wrote 9% more tokens',v:681.1,g:'18 of 18',t:'Runs 678.7–684.6 s against 665.4 s for the row above on the same host. 8.58 against 9.14 ms per output token: these runs wrote 9% more tokens, so the run took slightly longer.'},
 {l:'+ sparse long-prompt prefill',s:'KP1 v2; 2 runs · adoption unclear',v:645.2,g:'10 of 12',t:'Runs 645.1 / 645.4 s against 662.1 / 682.7 s for the 4-bit-prefill stack on the same host (−4.0%). First-turn prefill −41 s per run. GSM8K 1,244 of 1,319; needles 18 of 18; no loops. A third run, beside stock on one host, took 649.1 s (5 of 6).'},
 {l:'+ tokenization cache',s:'KT1; projected, not run as a stack',v:622.8,g:'projection',p:1,t:'645.2 s minus the 22.4 s per run less time to first token seen with KT1. The compared runs made different numbers of requests, so the saving is an estimate.'}
];
const DEC_CATS=[['BF16 release','+ MTP5 *'],['FP8 release','+ MTP5'],['+ pruned draft','head, FP8 KV'],['+ NVFP4','weights'],['+ Marlin','kernels'],['+ all layers','in NVFP4'],['+ 4-bit','prefill'],['+ INT4 draft,','decode attn.']];
const DEC_NOTE=['BF16 release with MTP5, one prompt per length','Stock: FP8 release with MTP5 (1.0×), three draws on the same host as the last point','Draft head limited to the 65,536 most frequent tokens; FP8 KV cache','NVIDIA NVFP4 checkpoint with the official FP8 MTP layer','Marlin W4A16 and W8A16 kernels','Attention and linear-attention projections re-quantized to NVFP4 (al)','4-bit prefill matmuls and FP8-KV prefill attention (three-bench mean)','INT4 draft head and decode-attention split, stack F (three draws on the same host as stock)'];
const DEC=[{n:'64K',c:'--c64',d:[60.7,78.3,101.1,127.7,138.3,158.5,155.8,164.9]},{n:'128K',c:'--c128',d:[59.0,73.4,95.4,119.5,134.2,150.1,147.4,150.0]},{n:'256K',c:'--c256',d:[52.2,67.2,97.1,111.6,115.5,134.0,131.2,139.3]}];
const SEG=[{n:'First-turn prefill',v:179,c:'--s1'},{n:'Later-turn time to first token',v:48,c:'--s2'},{n:'Generation',v:409,c:'--s3'},{n:'Tool calls',v:16,c:'--s4'},{n:'Gaps (mostly harness tokenization)',v:28,c:'--s5'}];
const LEVERS=[
 {c:'--s1',h:'First-turn prefill (26%)',b:'Sparse long-prompt prefill (KP1 v2): <b>−41 s per run, measured</b> on two hosts. A sparser version cut 20 s more but missed 1 of 54 retrieval probes. Faster prefill attention kernels: 8–40 s <span class="estag">estimate</span>'},
 {c:'--s2',h:'Later-turn time to first token (7%)',b:'Tokenization cache (KT1): −22 s per run seen in runs that were not matched request for request <span class="estag">estimate</span>'},
 {c:'--s3',h:'Generation (60%)',b:'INT4 draft head and decode-attention split (F): 2–7% less time per streamed output event, on two hosts. A 4-bit KV-cache decode kernel saved 0.24–0.50 ms of a 20.5 ms decode round in its first version.'},
 {c:'--s4',h:'Tool calls (2%)',b:'Run by the harness; not a serving cost.'},
 {c:'--s5',h:'Gaps (4%)',b:'Mostly the harness counting prompt tokens before each request; KT1 also removes 22 s of it, which we do not count as a gain.'}
];
const LANES=[
 {n:'Qwen3.8 27B · 1 GPU',c:'--s1',stock:'FP8 release + MTP5',best:'stack F: all-NVFP4 + Marlin, 4-bit prefill, INT4 draft head, decode-attention split',
  ns:[40.1,36.7,31.4],st:[78.3,73.4,67.2],b:[164.9,150.0,139.3],
  w:'W01 task time, one run each: 1,014 s stock → 649 s best with sparse prefill (−36%); 1,903 s without speculation'},
 {n:'Qwen3.8-Flash-Next · 2 GPUs',c:'--s2',stock:'FP8 release + MTP3',best:'NVFP4 MoE on Marlin, fused kernels, INT4 draft head, native prefill and decode MoE kernels',
  ns:[118.2,117.4,117.4],st:[188.2,189.2,188.7],b:[331.6,338.8,353.3],
  w:'W01 task time, mean of two runs each: 548 s stock → 324 s best (−41%); 703 s without speculation'},
 {n:'Qwen3.8-Flash-Next NVFP4 · 1 GPU',c:'--s3',stock:'NVIDIA NVFP4 release + MTP3',best:'NVFP4 linear attention on Marlin, INT4 output head, native decode MoE kernel',
  ns:[91.5,91.6,91.4],st:[145.0,145.1,152.1],b:[258.1,267.1,267.5],
  w:'W01 task time, one run each: 539 s stock → 344 s best (−36%); 731 s without speculation'}
];
const CONC={x:[1,4,8,14,16],s:[{n:'64K prompts, our stack',lab:'64K',c:'--c64',d:[94.5,148.0,162.8,162.5,160.3],pr:[161.0,56.3,29.6,15.0,13.6]},{n:'128K prompts, our stack',lab:'128K',c:'--c256',d:[62.7,82.7,85.0,null,77.8],pr:[164.4,34.8,15.5,null,9.4]},
 {n:'64K prompts, stock',lab:'64K stock',c:'--c64',dash:1,d:[55.6,99.7,112.7,null,114.2],pr:[86.6,32.8,20.0,null,16.4]},{n:'128K prompts, stock',lab:'128K stock',c:'--c256',dash:1,d:[41.6,59.0,60.5,null,60.9],pr:[84.2,22.4,14.8,null,14.3]}]};
// GPU-hours: consolidated census of every host (instance IDs matched across agent sessions and AWS CloudTrail)
const GPUH=[
 {grp:'Campaign, 24–28 October: 374 GPU-hours on 62 hosts',rows:[
  {l:'Why the models loop',s:'causes and fixes for repetition loops',h:{p6:100.89}},
  {l:'Flash Next on 2 GPUs',s:'speed stack and quality gates',h:{p6:61.18}},
  {l:'New Blackwell kernels',s:'MoE decode, prefill, attention, 4-bit KV cache',h:{p6:37.35,p45:3.86}},
  {l:'Community models for comparison',s:'published checkpoints and recipes, same tests',h:{p6:40.57}},
  {l:'27B speed stack and quality gates',s:'plus checks for our published 4-bit checkpoint',h:{p6:28.76}},
  {l:'27B 4-bit prefill',s:'W4A4 prefill matmuls, accuracy repair',h:{p6:17.63}},
  {l:'27B on a 32 GB RTX PRO 4500',s:'fit and quality only',h:{p45:16.35}},
  {l:'27B new levers',s:'draft head, attention, sparse prefill, tokenization',h:{p6:13.95}},
  {l:'Flash Next on 1 GPU',s:'speed stack and quality gates',h:{p6:13.64}},
  {l:'27B combined-stack comparisons',s:'paired runs before adopting a stack',h:{p6:12.46}},
  {l:'Same-host reruns for this page',s:'no speculation, stock and best on one host per setup',h:{p6:11.37}},
  {l:'Reference controls, second team',s:'independent baseline runs (On-Demand)',h:{p6:8.94}},
  {l:'Fine-tuned 27B comparison',s:'Tess-4.5 against the base checkpoint',h:{p6:3.63}},
  {l:'Fused-kernel prototypes',s:'larger fused decode kernels',h:{p6:3.44}}]},
 {grp:'Groundwork in the same project, 6–24 October: 303 GPU-hours on 18 hosts',rows:[
  {l:'4-bit serving studies',s:'NVFP4 serving and long context, 4 GPU types',h:{a100:200.09,p6:44.60,p45:9.01}},
  {l:'27B and Flash reference testbed',s:'baselines and the W01 task suite',h:{p6:42.54,h100:6.63}}]}
];
const GPUH_KEYS=[{k:'p6',n:'RTX PRO 6000 Blackwell',c:'--s1'},{k:'p45',n:'RTX PRO 4500 Blackwell',c:'--s2'},{k:'a100',n:'A100',c:'--s3'},{k:'h100',n:'H100',c:'--s4'}];
const NEXT=[
 ['<b>4-bit KV cache for the 27B (NVFP4 KV).</b> Passed its quality screen (GSM8K-200 185, needles 18 of 18) and holds 1.76× the KV tokens, so more agents fit on one GPU. Needs a faster 4-bit decode-attention kernel (version 1 saved 0.24–0.50 ms per decode round; version 2 is designed) and 4-bit prefill staging: without it, time to first token is 1.24–1.33× slower.'],
 ['<b>Prefill attention efficiency.</b> Prefill attention is 59–69% of first-turn time to first token and runs at about two-thirds of the GPU\'s BF16 peak. A profiler capture will attribute the gap.','8–40 s per run'],
 ['<b>Tokenization cache (KT1).</b> Exact by construction; a matched replay of fixed requests will measure its saving.','about 22 s per run'],
 ['<b>Native 4-bit decode matmul for the 27B</b>, reading the existing Marlin weight layout so no second weight copy is needed.','about 0.30 ms per decode round, about 6 s per run'],
 ['<b>Cheaper draft step for deeper speculation.</b> Drafting 7 tokens instead of 5 gives +2.9% decode today and no task-time gain; the draft step costs 0.8–0.9 ms.'],
 ['<b>Flash Next on one GPU.</b> Carry the 27B prefill work (4-bit prefill, prefill attention, sparse prefill) to Flash Next, whose agent task time is now dominated by long-prompt prefill.']
];
const GLOSS=[
 ['W01','Six frozen agentic coding tasks run through a tool-using harness with 128K–200K tokens of context: two repository Q&A tasks that must cite sources, two proof-of-concept builds and two bug fixes. Task time is the summed episode time to graded completion.'],
 ['Decode speed','Output tokens per second for one stream after the prompt is processed, at 64K, 128K or 256K tokens of context.'],
 ['Prefill, time to first token','Processing the prompt before the first output token. The first turn of a task is uncached ("cold"); later turns reuse the cached prefix.'],
 ['Speculative decoding','A small draft proposes several tokens and the full model checks them in one pass. With greedy verification the output is identical to plain greedy decoding.'],
 ['MTP3, MTP5','The model\'s built-in multi-token-prediction draft layer, drafting 3 or 5 tokens per round.'],
 ['No-speculation control','The same checkpoint served without speculative decoding.'],
 ['FP8, NVFP4, INT4','8-bit floating point; NVIDIA\'s 4-bit floating-point format with per-block scales, native on Blackwell; 4-bit integers with group scales.'],
 ['W4A16, W4A4','4-bit weights with 16-bit activations, or with 4-bit activations too.'],
 ['Marlin','An open-source mixed-precision matrix-multiply kernel for 4- and 8-bit weights at small batch sizes.'],
 ['KV cache, FP8 KV','The attention keys and values kept for the context; stored in 8 bits it halves memory and reads.'],
 ['Pruned draft head','The draft\'s output layer limited to the 65,536 most frequent tokens; the full model still verifies over the whole vocabulary.'],
 ['al','Our 27B checkpoint with every projection in NVFP4: NVIDIA\'s release plus attention and linear-attention (GDN) layers re-quantized by us.'],
 ['katt2b','Our prefill attention path: FP8 KV pages staged to BF16 for FlashAttention-2.'],
 ['S2','4-bit (W4A4) matrix multiplies for prefill, sharing one weight copy with decode.'],
 ['F','The 27B stack: al, katt2b and S2, plus an INT4 draft head rescored in FP8 and a decode-attention kernel that splits short queries across more GPU cores.'],
 ['KP1 v2','Sparse prefill for long prompts: beyond 65,536 tokens, attention reads the highest-scoring half of the 256-token key blocks plus a dense 2,048-token tail. Approximate, so judged by the quality gates.'],
 ['KT1','Tokenization cache: reuses the previous turn\'s token IDs so only new text is tokenized. Exact by construction.'],
 ['Flash Next','Qwen3.8-Flash-Next, a mixture-of-experts model. On two GPUs it is split with tensor parallelism (TP2) in FP8; on one GPU it runs NVIDIA\'s NVFP4 release.'],
 ['GSM8K, needles','Grade-school math (1,319 problems) as a regression check; 18 needle-in-a-haystack retrieval probes at 64K–200K.'],
 ['Loop','An output that repeats itself until a token budget runs out. Loops fail tasks and inflate speed, so they are counted separately.'],
 ['GPU-hour','One GPU for one hour, from launch to termination, setup and idle time included.'],
 ['Spot','Discounted cloud capacity that the provider can reclaim at short notice.']
];

// ---------- tiles ----------
function tiles(){
 const T=[
  ['27B agent task time','649 s','per W01 run, from 1,014 s on the stock FP8 setup on the same host (−36%). Lower is better.'],
  ['27B decode speed','2.1×','165 / 150 / 139 tok/s at 64K / 128K / 256K, 2.04–2.11× stock FP8 + MTP5. Higher is better.'],
  ['Flash Next, 2 GPUs','1.8×','332–353 tok/s decode, 1.76–1.87× stock; agent task time 548 → 324 s.'],
  ['Flash Next, 1 GPU','1.8×','258–268 tok/s, 1.76–1.84× stock NVFP4 + MTP3 and 2.8–2.9× no speculation; agent task time 539 → 344 s.'],
  ['Quality held','18 of 18','needle probes for every adopted stack; GSM8K and W01 grades within their bars.'],
  ['GPU time used','374 GPU-h','on 62 cloud hosts over five days, plus 303 GPU-h of groundwork before.']
 ];
 document.getElementById('tiles').innerHTML=T.map(t=>`<div class="tile"><div class="k">${t[0]}</div><div class="v">${t[1]}</div><div class="d">${t[2]}</div></div>`).join('');
}

// ---------- 1 task-time ladder ----------
function ladder(){
 const svg=clear('v-tasktime'),W=760,RH=44,T=6,L=292,BW=300,MAX=1150,H=T+LADDER.length*RH+26;size(svg,W,H);
 const c=css('--s1'),x=v=>L+v/MAX*BW;
 for(let g=0;g<=1000;g+=250){el('line',{x1:x(g),x2:x(g),y1:T,y2:H-22,class:'g-grid'},svg);tx(svg,x(g),H-7,g?f0(g):'0 s','t-tick','middle');}
 LADDER.forEach((r,i)=>{const y=T+i*RH+8,w=r.v/MAX*BW;
  tx(svg,0,y+8,r.l,'t-lab');tx(svg,0,y+24,r.s,'t-sub');
  const pct=Math.round((r.v/LADDER[0].v-1)*100);
  const g=el('g',{'data-tip':`<b>${r.l}</b> (${r.s})<br>${f1(r.v)} s per run · ${r.g}${i?` · ${sg(pct)}% vs stock`:''}<br>${r.t}`},svg);
  el('rect',{x:L,y:y-6,width:W-L,height:RH-6,fill:'transparent'},g);
  el('path',{d:hbar(L,y,w,22),fill:c,'fill-opacity':r.p?0.32:1},g);
  const t=tx(g,L+w+8,y+11,'', 't-val');
  const a=el('tspan',{class:'t-b'},t);a.textContent=f0(r.v)+' s';
  const b=el('tspan',{class:'t-mut',dx:6},t);b.textContent=r.g+(i&&!r.p?` · ${sg(pct)}%`:'');
 });
 el('line',{x1:L,x2:L,y1:T,y2:H-22,class:'g-base'},svg);
 table('t-tasktime',['Stack','Detail','Seconds per run','vs stock','Passed'],LADDER.map((r,i)=>[r.l,r.s,f1(r.v),i?sg(+((r.v/LADDER[0].v-1)*100).toFixed(1))+'%':'–',r.g]),[0,0,1,1,0]);
}

// ---------- 2 decode lines ----------
function decode(){
 const svg=clear('v-decode'),W=760,L=36,R=636,T=22,B=216,H=256,MAX=180;size(svg,W,H);
 const st=(R-L)/DEC_CATS.length,X=i=>L+(i+.5)*st,Y=v=>B-v/MAX*(B-T);
 for(let g=0;g<=MAX;g+=30){el('line',{x1:L,x2:R,y1:Y(g),y2:Y(g),class:'g-grid'},svg);tx(svg,L-7,Y(g)+4,g,'t-tick','end');}
 tx(svg,L-30,T-12,'tok/s','t-tick','start');
 el('line',{x1:L,x2:R,y1:B,y2:B,class:'g-base'},svg);
 DEC_CATS.forEach((c,i)=>{tx(svg,X(i),B+16,c[0],'t-tick','middle');tx(svg,X(i),B+30,c[1],'t-tick','middle');});
 // stock marker
 el('rect',{x:L+st,y:T,width:st,height:B-T,fill:css('--ink'),'fill-opacity':0.04},svg);
 tx(svg,X(1),T+13,'stock = 1.0×','t-sub','middle');
 DEC.forEach(s=>el('path',{d:s.d.map((v,i)=>(i?'L':'M')+X(i)+','+Y(v)).join(''),fill:'none',stroke:css(s.c),'stroke-width':2,'stroke-linejoin':'round','stroke-linecap':'round'},svg));
 DEC.forEach(s=>s.d.forEach((v,i)=>el('circle',{cx:X(i),cy:Y(v),r:4,fill:css(s.c),stroke:css('--surface'),'stroke-width':2},svg)));
 const n=DEC_CATS.length-1,ends=DEC.map(s=>({s,y:Y(s.d[n])})).sort((a,b)=>a.y-b.y);
 for(let i=1;i<ends.length;i++)if(ends[i].y-ends[i-1].y<15)ends[i].y=ends[i-1].y+15;
 ends.forEach(e=>{const t=tx(svg,X(n)+12,e.y+4,'','t-val');const a=el('tspan',{class:'t-b'},t);a.textContent=e.s.n+' '+f1(e.s.d[n]);const b=el('tspan',{class:'t-mut',dx:5},t);b.textContent=(e.s.d[n]/e.s.d[1]).toFixed(2)+'×';});
 DEC_CATS.forEach((c,i)=>{const g=el('g',{'data-tip':`<b>${c.join(' ')}</b><br>${DEC_NOTE[i]}<br>`+DEC.map(s=>`<span class="sw" style="background:${css(s.c)}"></span>${s.n}: ${f1(s.d[i])} tok/s${i!==1?` (${(s.d[i]/s.d[1]).toFixed(2)}×)`:''}`).join('<br>')},svg);el('rect',{x:L+i*st,y:T,width:st,height:B-T+34,fill:'transparent'},g);});
 document.getElementById('lg-decode').innerHTML=DEC.map(s=>`<span><span class="ln" style="border-color:${css(s.c)}"></span>${s.n} context</span>`).join('');
 table('t-decode',['Stack','64K','128K','256K','× stock (64K / 128K / 256K)'],DEC_CATS.map((c,i)=>[c.join(' ').replace(' *',' (one prompt)'),...DEC.map(s=>f1(s.d[i])),DEC.map(s=>(s.d[i]/s.d[1]).toFixed(2)).join(' / ')]),[0,1,1,1,1]);
}

// ---------- 3 anatomy ----------
function anatomy(){
 const svg=clear('v-anatomy'),W=760,H=146,BY=8,BH=36,gap=2;size(svg,W,H);
 const tot=SEG.reduce((a,b)=>a+b.v,0),avail=W-gap*(SEG.length-1);let x=0;const pos=[];
 SEG.forEach((s,i)=>{const w=s.v/tot*avail;pos.push({x,w,cx:x+w/2});
  const g=el('g',{'data-tip':`<b>${s.n}</b><br>${s.v} s per run · ${(s.v/tot*100).toFixed(1)}% of ${tot} s`},svg);
  const r=i===0?4:0,re=i===SEG.length-1?4:0;
  el('path',{d:`M${x+r},${BY}h${w-r-re}${re?`a${re},${re} 0 0 1 ${re},${re}v${BH-2*re}a${re},${re} 0 0 1 -${re},${re}`:`v${BH}`}h${-(w-r-re)}${r?`a${r},${r} 0 0 1 -${r},-${r}v${-(BH-2*r)}a${r},${r} 0 0 1 ${r},-${r}`:`v${-BH}`}z`,fill:css(s.c)},g);
  x+=w+gap;});
 // callouts: every segment labelled the same way (name, seconds, share); small segments use elbow leaders
 const rowY=[BY+BH+32,BY+BH+76],short=['First-turn prefill','Later-turn TTFT','Generation','Tool calls','Gaps'];
 const place=[{r:0,a:'middle'},{r:1,a:'middle'},{r:0,a:'middle'},{r:1,a:'middle',to:640},{r:0,a:'end',to:W}];
 const ln=(pts)=>el('path',{d:pts.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(''),fill:'none',stroke:css('--axis'),'stroke-width':1},svg);
 SEG.forEach((s,i)=>{const p=pos[i],q=place[i],y=rowY[q.r],top=BY+BH+3,lab=y-15;
  el('circle',{cx:p.cx,cy:top,r:2,fill:css('--ink2')},svg);
  let ax=p.cx;
  if(q.to===W){ax=W;ln([[p.cx,top],[p.cx,lab]]);}
  else if(q.to){ax=q.to;const ey=top+7;ln([[p.cx,top],[p.cx,ey],[ax,ey],[ax,lab]]);}
  else ln([[p.cx,top],[p.cx,lab]]);
  tx(svg,ax,y-1,short[i],'t-lab t-b',q.a);
  tx(svg,ax,y+15,`${s.v} s · ${Math.round(s.v/tot*100)}%`,'t-mut',q.a);
 });
 document.getElementById('levers').innerHTML=LEVERS.map(l=>`<li style="--c:${css(l.c)}"><b>${l.h}.</b> ${l.b}</li>`).join('');
 table('t-anatomy',['Part of the run','Seconds','Share'],SEG.map(s=>[s.n,s.v,(s.v/tot*100).toFixed(1)+'%']).concat([['Total',tot,'100%']]),[0,1,1]);
}

// ---------- 4 lanes ----------
function lanes(){
 const svg=clear('v-lanes'),W=760,L=50,BW=520,MAX=360,RH=26,HH=44,WH=30,X=v=>L+v/MAX*BW;
 const H=LANES.length*(HH+3*RH+WH)+24;size(svg,W,H);
 for(let g=0;g<=MAX;g+=60){el('line',{x1:X(g),x2:X(g),y1:6+HH-3,y2:H-22,class:'g-grid'},svg);tx(svg,X(g),H-7,g?g:'0 tok/s','t-tick','middle');}
 let y=6;const ctx=['64K','128K','256K'];
 LANES.forEach(ln=>{const c=css(ln.c);
  el('rect',{x:0,y:y,width:W,height:HH-3,fill:css('--surface')},svg);
  el('rect',{x:0,y:y+3,width:4,height:30,rx:2,fill:c},svg);
  tx(svg,12,y+16,ln.n,'t-lab t-b');
  tx(svg,12,y+32,`stock: ${ln.stock} · best: ${ln.best}`,'t-sub');
  y+=HH;
  ctx.forEach((k,i)=>{const yy=y+i*RH+3,bh=18,st=ln.st[i],b=ln.b[i],m=b/st;
   const tip=`<b>${ln.n}, ${k}</b><br>best ${f1(b)} tok/s (${m.toFixed(2)}×)<br>stock ${f1(st)} tok/s (1.00×)`+(ln.ns?`<br>no speculation ${f1(ln.ns[i])} tok/s (${(ln.ns[i]/st).toFixed(2)}×)`:'<br>no-speculation control not yet measured');
   const g=el('g',{'data-tip':tip},svg);
   el('rect',{x:0,y:yy-3,width:W,height:RH,fill:'transparent'},g);
   tx(g,L-10,yy+13,k,'t-tick','end');
   el('path',{d:hbar(L,yy,X(b)-L,bh),fill:c},g);
   el('rect',{x:L,y:yy,width:X(st)-L,height:bh,fill:css('--surface'),'fill-opacity':0.62},g);
   el('line',{x1:X(st),x2:X(st),y1:yy,y2:yy+bh,stroke:css('--surface'),'stroke-width':2},g);
   tx(g,L+6,yy+13,f0(st),'t-mut');
   if(ln.ns){const nx=X(ln.ns[i]);el('line',{x1:nx,x2:nx,y1:yy-3,y2:yy+bh+3,stroke:css('--ink'),'stroke-width':2},g);
    if(i===0)tx(g,nx+6,yy+13,'no spec','t-sub');}
   const t=tx(g,X(b)+8,yy+13,'','t-val');const a=el('tspan',{class:'t-b'},t);a.textContent=f1(b)+' tok/s';const bb=el('tspan',{class:'t-mut',dx:6},t);bb.textContent=m.toFixed(2)+'×';
  });
  y+=3*RH;
  el('rect',{x:0,y:y,width:W,height:WH,fill:css('--surface')},svg);
  tx(svg,12,y+16,ln.w,'t-sub');
  y+=WH;
 });
 const c=css('--s1');
 document.getElementById('lg-lanes').innerHTML=`<span><span class="sw" style="background:${c};opacity:.38"></span>stock speculative decoding (1.0×)</span><span><span class="sw" style="background:${c}"></span>added by this work</span><span><span class="tk"></span>no speculative decoding</span>`;
 const rows=[];LANES.forEach(ln=>ctx.forEach((k,i)=>rows.push([ln.n,k,ln.ns?f1(ln.ns[i])+' ('+(ln.ns[i]/ln.st[i]).toFixed(2)+'×)':'not measured',f1(ln.st[i]),f1(ln.b[i]),(ln.b[i]/ln.st[i]).toFixed(2)+'×'])));
 table('t-lanes',['Setup','Context','No speculation','Stock (1.0×)','Best','Best × stock'],rows,[0,0,1,1,1,1]);
}

// ---------- 5 concurrency ----------
function conc(){
 const svg=clear('v-conc'),W=760,L=36,R=640,T=22,B=206,H=238,MAX=180,XM=16;size(svg,W,H);
 const X=v=>L+(v-1)/(XM-1)*(R-L),Y=v=>B-v/MAX*(B-T);
 for(let g=0;g<=MAX;g+=30){el('line',{x1:L,x2:R,y1:Y(g),y2:Y(g),class:'g-grid'},svg);tx(svg,L-7,Y(g)+4,g,'t-tick','end');}
 tx(svg,L-30,T-12,'tok/s','t-tick','start');
 el('line',{x1:L,x2:R,y1:B,y2:B,class:'g-base'},svg);
 [1,4,8,12,16].forEach(v=>tx(svg,X(v),B+16,v,'t-tick','middle'));tx(svg,(L+R)/2,B+31,'concurrent streams','t-tick','middle');
 CONC.s.forEach(s=>{const pts=CONC.x.map((v,i)=>[v,s.d[i],s.pr[i]]).filter(p=>p[1]!=null);
  el('path',Object.assign({d:pts.map((p,i)=>(i?'L':'M')+X(p[0])+','+Y(p[1])).join(''),fill:'none',stroke:css(s.c),'stroke-width':2,'stroke-linejoin':'round'},s.dash?{'stroke-dasharray':'5 4'}:{}),svg);
  pts.forEach(p=>{const g=el('g',{'data-tip':`<b>${s.n}, ${p[0]} stream${p[0]>1?'s':''}</b><br>${f1(p[1])} tok/s in total<br>${f1(p[2])} tok/s per stream while generating`},svg);el('circle',{cx:X(p[0]),cy:Y(p[1]),r:10,fill:'transparent'},g);el('circle',{cx:X(p[0]),cy:Y(p[1]),r:4,fill:css(s.c),stroke:css('--surface'),'stroke-width':2},g);});
  const lp=pts[pts.length-1];const t=tx(svg,X(lp[0])+12,Y(lp[1])+4,'','t-val');const a=el('tspan',{class:'t-b'},t);a.textContent=s.lab;const b=el('tspan',{class:'t-mut',dx:5},t);b.textContent=f1(lp[1]);
 });
 const s64=CONC.s[0],s128=CONC.s[1];
 tx(svg,X(8),Y(s64.d[2])-12,`${(s64.d[2]/s64.d[0]).toFixed(1)}× one stream`,'t-sub','middle');
 tx(svg,X(16)-4,Y(77.8)-12,'KV cache full','t-sub','end');
 document.getElementById('lg-conc').innerHTML=CONC.s.map(s=>`<span><span class="ln" style="border-color:${css(s.c)}${s.dash?';border-top-style:dashed':''}"></span>${s.n}</span>`).join('');
 const rows=[];CONC.s.forEach(s=>CONC.x.forEach((v,i)=>{if(s.d[i]!=null)rows.push([s.n,v,f1(s.d[i]),f1(s.pr[i])]);}));
 table('t-conc',['Prompts','Streams','Total tok/s','Per-stream tok/s while generating'],rows,[0,1,1,1]);
}

// ---------- 6 GPU-hours ----------
function gpuh(){
 const svg=clear('v-gpuh'),W=760,L=330,BW=350,MAX=260,RH=34,GH=34,X=v=>L+v/MAX*BW;
 const nrows=GPUH.reduce((a,g)=>a+g.rows.length,0),H=GPUH.length*GH+nrows*RH+28;size(svg,W,H);
 for(let g=0;g<=MAX;g+=50){el('line',{x1:X(g),x2:X(g),y1:GH-4,y2:H-22,class:'g-grid'},svg);tx(svg,X(g),H-7,g?g:'0 GPU-h','t-tick','middle');}
 el('line',{x1:L,x2:L,y1:GH-4,y2:H-22,class:'g-base'},svg);
 let y=0;const all=[];
 GPUH.forEach(G=>{el('rect',{x:0,y:y+4,width:W,height:24,fill:css('--surface')},svg);tx(svg,0,y+21,G.grp,'t-lab t-b');y+=GH;
  G.rows.forEach(r=>{const yy=y+5,tot=GPUH_KEYS.reduce((a,k)=>a+(r.h[k.k]||0),0);all.push([G.grp.split(':')[0],r.l,r.s,...GPUH_KEYS.map(k=>r.h[k.k]?r.h[k.k].toFixed(2):''),tot.toFixed(2)]);
   tx(svg,0,yy+10,r.l,'t-lab');tx(svg,0,yy+25,r.s,'t-sub');
   const g=el('g',{'data-tip':`<b>${r.l}</b> (${r.s})<br>${f1(tot)} GPU-h`+GPUH_KEYS.filter(k=>r.h[k.k]).map(k=>`<br><span class="sw" style="background:${css(k.c)}"></span>${k.n}: ${f1(r.h[k.k])}`).join('')},svg);
   el('rect',{x:0,y:yy-4,width:W,height:RH,fill:'transparent'},g);
   let x=L;const ks=GPUH_KEYS.filter(k=>r.h[k.k]);
   ks.forEach((k,j)=>{const w=r.h[k.k]/MAX*BW,last=j===ks.length-1;el('path',{d:last?hbar(x,yy+2,w,16):`M${x},${yy+2}h${w}v16h${-w}z`,fill:css(k.c)},g);x+=w+(last?0:2);});
   tx(g,x+7,yy+14,f1(tot),'t-val');
   y+=RH;});
 });
 document.getElementById('lg-gpuh').innerHTML=GPUH_KEYS.map(k=>`<span><span class="sw" style="background:${css(k.c)}"></span>${k.n}</span>`).join('');
 document.getElementById('n-gpuh').textContent='Totals: 374.0 GPU-h for the campaign (353.8 on RTX PRO 6000, 20.2 on RTX PRO 4500) and 302.9 GPU-h of earlier groundwork; 676.9 GPU-h in all. Host sets from agent records were matched to the cloud provider\'s launch log; three early hosts include stopped time, so their figures are upper bounds. Each host counts once, under its main purpose.';
 table('t-gpuh',['Period','Work item','Detail',...GPUH_KEYS.map(k=>k.n),'Total'],all,[0,0,0,1,1,1,1,1]);
}

// ---------- text cards ----------
function textCards(){
 document.getElementById('next').innerHTML=NEXT.map(n=>`<li>${n[0]}${n[1]?` <span class="estag">estimate: ${n[1]}</span>`:''}</li>`).join('');
 document.getElementById('gloss').innerHTML=GLOSS.map(g=>`<dt>${g[0]}</dt><dd>${g[1]}</dd>`).join('');
}

function render(){tiles();ladder();decode();anatomy();lanes();conc();gpuh();textCards();}
render();

// redraw when the site's light/dark toggle or the system setting changes
new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['data-bs-theme']});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',render);

// tooltip
const tip=document.createElement('div');tip.className='brrr-tip';document.body.appendChild(tip);
document.addEventListener('mousemove',e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(!t){tip.style.display='none';return;}
 tip.innerHTML=t.getAttribute('data-tip');tip.style.display='block';const r=tip.getBoundingClientRect();
 let x=e.clientX+14,y=e.clientY+14;if(x+r.width>innerWidth-6)x=e.clientX-r.width-14;if(y+r.height>innerHeight-6)y=e.clientY-r.height-14;tip.style.left=Math.max(6,x)+'px';tip.style.top=Math.max(6,y)+'px';});
document.addEventListener('mouseleave',()=>tip.style.display='none');
addEventListener('scroll',()=>tip.style.display='none',{passive:true});
})();
