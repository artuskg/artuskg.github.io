---
title: 'The Frankenstein, Part 2: vLLM-Moet''s mHC Overlap, 4.9% Off Each Verify Step'
description: 'Part 2 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. An SM120 mHC overlap from kacper-daftcode''s vLLM-Moet made each verify step 4.88% shorter, in 5 of 5 blocks. It went in on 2 November together with Part 1''s prompt region cache, and one user''s model time per task fell from 38.2 to 33.8 s, partly from shorter answers (a before-and-after, not an A/B), and has stayed near there since. Four other things we tried did not help.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cpu-offload, blackwell]
---

*3 November 2026. A progress note from a running campaign, following [Part 1](/2026/11/02/frankenstein-part-1.html). The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

*Rewritten 16 November 2026 with what later parts of the series showed. The original version is [on GitHub](https://github.com/artuskg/artuskg.github.io/blob/518d93f/_posts/2026-11-03-frankenstein-part-2.md).*

Part 2 of our Frankenstein: a DeepSeek-V4.1-Flash server on two RTX PRO 6000s, built from other engines' best parts.

**This is when one user's task time fell.** Two parts went in on 2 November: Part 1's prompt region cache, and the part in this post, an SM120 mHC overlap from kacper-daftcode's vLLM-Moet. On our six-task agent test, one session at a time, model time per task was 38.2 s on 1 and 2 November (39 draws) and 33.8 s that evening (15 draws), 11.5% less. That is a before-and-after series, not an A/B, so it doesn't split the gain between the two parts. Those evening draws also needed the fewest steps per task, about 1,920 against 1,990 to 2,060 on the next days, so part of the drop is shorter answers. It hasn't moved much since: every day's mean but one has stayed between 33.8 and 34.8 s ([Part 12](/2026/11/15/frankenstein-part-12.html)).

On its own, the overlap made each verify step 4.88% shorter, in all five of its A/B blocks. It is still served, and it is part of our public serving setup ([Part 11](/2026/11/14/frankenstein-part-11.html)).

The target: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on one workstation with two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), for long-context agentic coding. The body is vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000).

## The overlap, from vLLM-Moet

DeepSeek-V4.1 keeps four residual streams instead of one, and mixes them at every layer boundary (its mHC, a form of hyper-connections). The mixing is small, but it sits on the critical path. In our profile of the served engine it was about 78 boundaries per verify step, and 1.05 ms of a 15.62 ms step. A verify step is one pass of the big model over the tokens its drafter guessed.

vLLM can already compute part of the next boundary's mixing on a second CUDA stream while the current layer finishes, but only on SM100 GPUs. kacper-daftcode's [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet) (Apache-2.0) extends it to SM120 with its own kernels: a post-norm kernel on the critical path, and the projection on the side stream. We read its source, screened it on one GPU, and then tested it in our full engine against what we served.

How we decided: five blocks, each with one engine start per arm in random order. Each start replays 189 recorded turns from two agent tasks, one request at a time, timed by the server. We would take it only if its verify step was shorter in all five blocks.

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-mhc-overlap">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Dot plot of five randomized blocks. In every block, time per verify step with the mHC overlap was below the served engine, by 4.55 to 5.39 percent; mean 4.88 percent.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">mHC overlap (vLLM-Moet, SM120): time per verify step against the served engine</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash (diffbot's EXL3 3-bit pack) in vLLM, TP2 on two RTX PRO 6000 · five randomized blocks, one start per arm · lower is better</text>
<line x1="110" x2="1130" y1="170.0" y2="170.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="175.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+1 %</text>
<line x1="110" x2="1130" y1="224.3" y2="224.3" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<text x="98.0" y="229.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0 %</text>
<line x1="110" x2="1130" y1="278.6" y2="278.6" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="283.6" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−1 %</text>
<line x1="110" x2="1130" y1="332.9" y2="332.9" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="337.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−2 %</text>
<line x1="110" x2="1130" y1="387.1" y2="387.1" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="392.1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−3 %</text>
<line x1="110" x2="1130" y1="441.4" y2="441.4" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="446.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−4 %</text>
<line x1="110" x2="1130" y1="495.7" y2="495.7" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="500.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−5 %</text>
<line x1="110" x2="1130" y1="550.0" y2="550.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="555.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−6 %</text>
<text x="1130.0" y="214.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0 = no change</text>
<text x="70.0" y="148.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Time per verify step, overlap / served − 1</text>
<line x1="110" x2="1130" y1="489.2" y2="489.2" style="stroke:var(--s1,#2a78d6);stroke-width:2;stroke-dasharray:6 6"/>
<text x="717.5" y="477.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">mean −4.88 %</text>
<g><title>block 1 · mHC overlap vs served · −4.70 % ms per verify step</title><circle cx="230.0" cy="479.4" r="13" style="fill:transparent"/><circle cx="230.0" cy="479.4" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="246.0" y="484.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−4.70 %</text>
<text x="230.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 1</text>
<g><title>block 2 · mHC overlap vs served · −4.62 % ms per verify step</title><circle cx="425.0" cy="475.1" r="13" style="fill:transparent"/><circle cx="425.0" cy="475.1" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="441.0" y="480.1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−4.62 %</text>
<text x="425.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 2</text>
<g><title>block 3 · mHC overlap vs served · −5.39 % ms per verify step</title><circle cx="620.0" cy="516.9" r="13" style="fill:transparent"/><circle cx="620.0" cy="516.9" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="636.0" y="521.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−5.39 %</text>
<text x="620.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 3</text>
<g><title>block 4 · mHC overlap vs served · −5.14 % ms per verify step</title><circle cx="815.0" cy="503.3" r="13" style="fill:transparent"/><circle cx="815.0" cy="503.3" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="831.0" y="508.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−5.14 %</text>
<text x="815.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 4</text>
<g><title>block 5 · mHC overlap vs served · −4.55 % ms per verify step</title><circle cx="1010.0" cy="471.3" r="13" style="fill:transparent"/><circle cx="1010.0" cy="471.3" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="1026.0" y="476.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−4.55 %</text>
<text x="1010.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 5</text>
<text x="70.0" y="617.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Each block: one engine start per arm, order randomized; each start replays 189 recorded agent-task turns one at a time, timed on the server. Below zero in 5 of 5 blocks: p = 1/32.</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Step time at one request at a time, not task time. Served engine: 14.35–14.44 ms per step; with the overlap: 13.67–13.71 ms.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">The overlap and its SM120 kernels are kacper-daftcode's vLLM-Moet (Apache-2.0); we screened, tested and adopted them.</text>
</svg>
</section></div>
{:/nomarkdown}

| Block | 1 | 2 | 3 | 4 | 5 | Mean |
|---|---:|---:|---:|---:|---:|---:|
| Served engine, ms per verify step | 14.359 | 14.348 | 14.444 | 14.407 | 14.360 | |
| With the overlap | 13.684 | 13.685 | 13.665 | 13.666 | 13.706 | |
| Overlap/served − 1 | −4.70% | −4.62% | −5.39% | −5.14% | −4.55% | **−4.88%** |

It was shorter in all five blocks (one-sided sign test, p = 1/32). Decode time per output token fell 4.28% on average, and tokens per step barely moved (−0.59%). The overlap saved 0.70 ms per step, more than the 0.42 ms our one-GPU screen had predicted; this run doesn't say where the extra comes from. On served traffic, each decoding step later read 14.8 ms after the overlap, against 15.5 ms on 1 and 2 November ([Part 12](/2026/11/15/frankenstein-part-12.html)).

**Before serving it.** We scored the verify path with a top-64 logit proxy: the mean KL per position over the top 64 log-probabilities, across 767 decode positions, in forced decode with the drafter on. The overlap against the served engine scored 0.0184–0.0202. Two starts of the served engine against each other scored 0.0173–0.0177, and our tolerance was 0.025. That is a proxy, not proof of equal quality. GPU memory at a 1M-token test was 8 MiB per GPU higher.

We served it on 2 November for one request at a time. From five concurrent requests, the side stream switches to a different projection, which this check didn't cover; [Part 3](/2026/11/04/frankenstein-part-3.html) checks a padded version of that path.

## Part 1's two parts, followed up

- **The CPU-expert schedule stays.** Part 1 served diffbot's second CPU-expert schedule on a step-time result. Its pass-rate check on our agent test then finished: over ten blocks, 151 of 180 episodes passed with each schedule (p = 0.578 for "schedule 2 passes fewer"). No harm shown, which is not proof of equal quality.
- **The prompt region cache is served.** Before each turn, our test client asks the server how many tokens the prompt has. On 60 earlier draws that call took a median of 0.212 s per turn, about 9.0 s per draw. On the first four draws with the cache it took 0.052–0.054 s per turn. Those are different occasions, not an A/B.

## Tried, didn't help

- **More GPU slots for CPU experts**, 768 instead of 512: steps 1.34% shorter, but time per output token only 0.80% lower, and lower in just 3 of 5 blocks, for 1,620 MiB more per GPU.
- **Our own decode kernel for the GPU-resident experts:** all five exact builds were 0.019–0.144 ms per step slower than the existing kernel. We needed one 0.079 ms faster.
- **A work-claiming split for the CPU-expert pool:** 8.2–8.7% longer per job on recorded job shapes.
- **The CPU-expert pool's settings:** none was at least 5% faster than the served one in every block of a screen.

## Credits

- **kacper-daftcode** for [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet)'s SM120 mHC overlap and its kernels (commit `ec8a1e05e1cb`, Apache-2.0).
- **DeepSeek** for DeepSeek-V4.1-Flash-1017.
- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the CPU-expert runtime with both schedules and the prompt segment encoder our region cache wraps.
- **turboderp** for the EXL3 format.
- **vLLM** for the engine, including the mHC overlap that vLLM-Moet extends to SM120.

## AI assistance

AI agents (Claude and GPT models) designed and ran these tests. An independent AI reviewer checked each design before launch and audited each result afterwards, and AI agents drafted this post and its 16 November rewrite. Artus set the goal, authorized the hardware and asked for these progress notes.
