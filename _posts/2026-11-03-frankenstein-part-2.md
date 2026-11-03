---
title: 'The Frankenstein, Part 2: A Part from Another Fork'
description: 'Part 2 of assembling a DeepSeek-V4.1-Flash server from the best parts of other engines on two RTX PRO 6000s. An SM120 mHC overlap from kacper-daftcode''s vLLM-Moet cut time per verify step by 4.88% in 5 of 5 randomized blocks and is now served for single-stream use. The CPU-expert schedule passed its ten-block agent-task comparison with no pass-rate harm shown, the prompt region cache is served, and four things did not work.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cpu-offload, blackwell]
---

*3 November 2026. A progress note from a running campaign, following [Part 1](/2026/11/02/frankenstein-part-1.html). The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

Part 2 of our Frankenstein: a DeepSeek-V4.1-Flash server on two RTX PRO 6000s, built from other engines' best parts.

New part, served: an SM120 mHC overlap from kacper-daftcode's vLLM-Moet. Verify steps took 4.88% less time, lower in 5 of 5 randomized blocks.

The target is unchanged: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on one workstation with two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), for long-context agentic coding, one request at a time. The body is still vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000). Each new part goes in only through a test whose decision rule we write before it runs.

## Summary

- **New part, served: an SM120 mHC overlap from [kacper-daftcode's vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet).** Time per verify step was 4.88% lower than on the served engine (overlap/served − 1 = −4.88%), lower in 5 of 5 randomized blocks (p = 1/32). That is step time with one request at a time, not task time. A verify-path fidelity proxy was within its registered tolerance first. It is served for single-stream use: adopted for one request at a time; concurrency 5 and above is not yet fidelity-checked.
- **Schedule 2 stays.** Part 1's CPU-expert schedule finished its randomized comparison on our agent-task benchmark: 151 of 180 episodes passed in each arm, a mean difference of 0.0 passes per engine start. No pass-rate harm was shown.
- **The prompt region cache is served.** On the first agent-task runs with it, the client's token-count call took a median of 0.052–0.054 s per turn, against 0.212 s on earlier runs. Those are different occasions, not a controlled comparison.
- **Four things that didn't work**, at the end.

## New part: the mHC overlap, from vLLM-Moet

DeepSeek-V4.1 keeps four residual streams instead of one, and mixes them at every layer boundary (its mHC, a form of hyper-connections). The mixing is small, but it sits on the critical path: in our profile of the served engine, about 78 boundaries per verify step and 1.05 ms of a 15.62 ms step.

vLLM can already compute part of the next boundary's mixing on a second CUDA stream while the current layer finishes, but only on SM100 GPUs. kacper-daftcode's [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet) (Apache-2.0) extends it to SM120 with its own kernels: a post-norm kernel on the critical path and the projection on the side stream. We read its source, screened it on one GPU, and then tested it in our full engine against what we serve.

The test (registered before launch): five blocks, each with one engine start per arm in random order. Each start replays 189 recorded turns from two agent tasks, one request at a time, timed by the server. The rule: the overlap is confirmed only if its time per verify step is lower in all five blocks.

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

It was lower in all five blocks: confirmed, one-sided exact sign test p = 1/32. Decode time per output token was also lower in all five blocks, by 4.28% on average (overlap/served − 1 = −4.28%; reported, not tested). Tokens per step changed by −0.59% on average, in both directions.

**Before serving it: fidelity and memory.** A separate run checked the verify path at one request at a time, in forced decode with the draft model on. The measure was a top-64 logit proxy: the mean KL per position over the top 64 log-probabilities, across 767 decode positions, against a tolerance registered before the run. It was within that tolerance. That is not a claim that quality is equal.
- two starts of the served engine differed by 0.0173–0.0177;
- the overlap against the served engine: 0.0184–0.0202;
- the tolerance: 0.025, with fewer than 10 positions above 0.5 nats (at most 5 occurred).

GPU memory at a 1M-token test was 8 MiB per GPU higher. On that basis our campaign manager adopted it for single-stream serving (one request at a time) on 2 November, with a one-step revert. Five agent-task runs since, three draws each, have finished without an engine or episode error.

What this does and does not show:
- **Step time, not task time.** The replay is one request at a time, and a verify step is one pass of the target model over the draft tokens. How much of an agent task's time that is depends on the task. We haven't published a task-time figure for it.
- **Single-stream only.** Adopted for one request at a time; concurrency 5 and above is not yet fidelity-checked. From five concurrent requests, the side stream switches to a different projection.
- **The fidelity check is a proxy** on the verify path, not a quality-equivalence claim.
- **Larger than predicted.** The overlap saved 0.70 ms per step, 1.69 times what our one-GPU screen predicted (0.42 ms). This run doesn't say where the extra time comes from.
- **Power:** both arms ran under the workstation's standard cap (500 W per GPU while the CPU is busy, 600 W otherwise). Sampled power draw stayed below 500 W in every start.

## Schedule 2 stays: the agent-task comparison

Part 1 served diffbot's second CPU-expert schedule on a step-time result and said a randomized comparison on our agent-task benchmark was running. W01 is six long-context coding and analysis tasks with real tool calls, graded mechanically; one draw runs all six.

The design (registered before launch): ten blocks, each with one engine start per schedule in random order, three W01 draws per start. Every episode counts, failures included. The rule: go back to schedule 1 if schedule 2 passes fewer, at one-sided p ≤ 0.05.

{::nomarkdown}
<div class="brrr"><section class="card" id="c-cpu-schedule-w01">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Lollipop chart of ten randomized blocks of the W01 agent-task benchmark. Passes per engine start, CPU-expert schedule 2 minus schedule 1, ranged from minus 3 to plus 2; mean 0. 151 of 180 passes in each arm.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">CPU-expert schedule 2 against 1: W01 passes per engine start</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Ten randomized blocks, one start per arm, three W01 draws (18 episodes) per start · above zero = schedule 2 passed more</text>
<line x1="130" x2="1130" y1="530.0" y2="530.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="535.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−4</text>
<line x1="130" x2="1130" y1="485.0" y2="485.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="490.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−3</text>
<line x1="130" x2="1130" y1="440.0" y2="440.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="445.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−2</text>
<line x1="130" x2="1130" y1="395.0" y2="395.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="400.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−1</text>
<line x1="130" x2="1130" y1="350.0" y2="350.0" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<text x="118.0" y="355.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0</text>
<line x1="130" x2="1130" y1="305.0" y2="305.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="310.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+1</text>
<line x1="130" x2="1130" y1="260.0" y2="260.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="265.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+2</text>
<line x1="130" x2="1130" y1="215.0" y2="215.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="220.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+3</text>
<line x1="130" x2="1130" y1="170.0" y2="170.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="175.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+4</text>
<text x="70.0" y="148.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Passes per start, schedule 2 minus schedule 1 (of 18)</text>
<g><title>block 1 · schedule 2 minus 1 · +0 passes of 18</title><circle cx="190.0" cy="350.0" r="13" style="fill:transparent"/><circle cx="190.0" cy="350.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="190.0" y="334.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">0</text>
<text x="190.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 1</text>
<line x1="287.8" x2="287.8" y1="350.0" y2="485.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 2 · schedule 2 minus 1 · −3 passes of 18</title><circle cx="287.8" cy="485.0" r="13" style="fill:transparent"/><circle cx="287.8" cy="485.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="287.8" y="511.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−3</text>
<text x="287.8" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 2</text>
<line x1="385.6" x2="385.6" y1="350.0" y2="305.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 3 · schedule 2 minus 1 · +1 passes of 18</title><circle cx="385.6" cy="305.0" r="13" style="fill:transparent"/><circle cx="385.6" cy="305.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="385.6" y="289.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+1</text>
<text x="385.6" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 3</text>
<g><title>block 4 · schedule 2 minus 1 · +0 passes of 18</title><circle cx="483.3" cy="350.0" r="13" style="fill:transparent"/><circle cx="483.3" cy="350.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="483.3" y="334.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">0</text>
<text x="483.3" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 4</text>
<line x1="581.1" x2="581.1" y1="350.0" y2="395.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 5 · schedule 2 minus 1 · −1 passes of 18</title><circle cx="581.1" cy="395.0" r="13" style="fill:transparent"/><circle cx="581.1" cy="395.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="581.1" y="421.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−1</text>
<text x="581.1" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 5</text>
<line x1="678.9" x2="678.9" y1="350.0" y2="305.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 6 · schedule 2 minus 1 · +1 passes of 18</title><circle cx="678.9" cy="305.0" r="13" style="fill:transparent"/><circle cx="678.9" cy="305.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="678.9" y="289.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+1</text>
<text x="678.9" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 6</text>
<g><title>block 7 · schedule 2 minus 1 · +0 passes of 18</title><circle cx="776.7" cy="350.0" r="13" style="fill:transparent"/><circle cx="776.7" cy="350.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="776.7" y="334.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">0</text>
<text x="776.7" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 7</text>
<line x1="874.4" x2="874.4" y1="350.0" y2="260.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 8 · schedule 2 minus 1 · +2 passes of 18</title><circle cx="874.4" cy="260.0" r="13" style="fill:transparent"/><circle cx="874.4" cy="260.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="874.4" y="244.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+2</text>
<text x="874.4" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 8</text>
<line x1="972.2" x2="972.2" y1="350.0" y2="260.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 9 · schedule 2 minus 1 · +2 passes of 18</title><circle cx="972.2" cy="260.0" r="13" style="fill:transparent"/><circle cx="972.2" cy="260.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="972.2" y="244.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+2</text>
<text x="972.2" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 9</text>
<line x1="1070.0" x2="1070.0" y1="350.0" y2="440.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 10 · schedule 2 minus 1 · −2 passes of 18</title><circle cx="1070.0" cy="440.0" r="13" style="fill:transparent"/><circle cx="1070.0" cy="440.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="1070.0" y="466.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−2</text>
<text x="1070.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 10</text>
<text x="1130.0" y="148.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">mean 0.0 · 151 of 180 passes in each arm</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Registered rule: go back to schedule 1 only if schedule 2 passes fewer, one-sided p ≤ 0.05 over 1,024 swaps. Result p = 0.578: no pass-rate harm shown.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Not proof of equal quality: no difference was detected at this size. Measured without the region cache.</text>
</svg>
</section></div>
{:/nomarkdown}

| Block | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Mean |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Passes per start, schedule 2 minus 1 (of 18) | 0 | −3 | +1 | 0 | −1 | +1 | 0 | +2 | +2 | −2 | **0.0** |

Both arms passed 151 of 180 episodes. The exact permutation test over all 1,024 assignments gives one-sided p = 0.578, so the rule did not fire, and schedule 2 stays served.

What this does and does not show:
- **No harm shown is not equal quality.** No pass difference was detected at this size.
- **Not a speed result.** This comparison was built to detect pass-rate harm, so we don't report its task times as an effect of the schedule.
- **Measured without the region cache**, which was served only after it ended.

## The region cache is served

Part 1's prompt region cache caches token IDs for the long text region that repeats in every agent request. It was served on 2 November at 05:13Z, after the schedule comparison ended, as planned. Its adoption rested on its registered result in Part 1: 5.57 s less server time per W01 draw outside queueing and prefill (p = 1/70). The numbers below played no part in it.

Before each turn, our W01 client asks the server how many tokens the prompt has. On 60 earlier W01 draws, all before the cache, that call took a median of 0.212 s per turn, about 9.0 s per draw. On the first four draws with the cache served, the median was 0.052–0.054 s per turn; on the first three of them, the call took 2.24–3.47 s per draw.

These are different occasions, not a controlled comparison. That the cache caused the drop is our inference.

## What didn't work

- **More GPU slots for CPU experts.** The engine keeps the most-used CPU experts in a 512-slot GPU cache. With 768 slots, time per verify step was 1.34% lower than with 512 (lower in 5 of 5 blocks), but time per output token was only 0.80% lower on average, and lower in just 3 of 5 blocks. It also took 1,620 MiB more per GPU. Not adopted.
- **Our own decode kernel for the GPU-resident experts.** In a kernel test harness, no exact build reached the 0.079 ms per step saving we required; all five were slower than the existing kernel, by 0.019–0.144 ms per step. A variant that folds the codebook decode into the kernel was 0.062 ms slower. Stopped.
- **A work-claiming split for the CPU-expert pool.** On a CPU benchmark of recorded job shapes, it took 8.2–8.7% longer per job. Parked.
- **Pool settings.** None of the CPU-expert pool's tunable settings was at least 5% faster than the served one in every block of a screen. No candidate.

## Credits

- **kacper-daftcode** for [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet)'s SM120 mHC overlap and its kernels (commit `ec8a1e05e1cb`, Apache-2.0).
- **DeepSeek** for DeepSeek-V4.1-Flash-1017.
- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the CPU-expert runtime with both schedules and the prompt segment encoder our region cache wraps.
- **turboderp** for the EXL3 format.
- **vLLM** for the engine, including the mHC overlap that vLLM-Moet extends to SM120.

## AI assistance

AI agents (Claude and GPT models) designed and ran these tests. An independent AI reviewer checked each design before launch and audited each result afterwards, and an AI agent drafted this post. Artus set the goal, authorized the hardware and asked for these progress notes.
