---
title: 'The Frankenstein, Part 3: One Part In, One Base Rejected'
description: 'Part 3 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. A host-expert plan built from our own agent traffic cut time per verify step by 2.42% in 5 of 5 randomized blocks and is served. A newer vLLM base took 10.0% longer per agent-task draw in 4 of 4 blocks and was not adopted. Our first randomized agent-task quality check of a served part was inconclusive at its planned size, and a time split of today''s stack points our first own part at decode.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cpu-offload, blackwell]
---

*4 November 2026. A progress note from a running campaign, following [Part 2](/2026/11/03/frankenstein-part-2.html). The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

Part 3 of our Frankenstein: a DeepSeek-V4.1-Flash server on two RTX PRO 6000s, built from other engines' best parts.

New part, served: a CPU/GPU expert plan built from our own agent traffic. Verify steps took 2.42% less time, lower in 5 of 5 randomized blocks (p = 1/32).

The target is unchanged: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on one workstation with two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), for long-context agentic coding, one request at a time. The body is still vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000). It now serves Part 1's CPU-expert schedule and region cache, Part 2's mHC overlap from vLLM-Moet, and, since 3 November, the expert plan below. Each part goes in only through a test whose decision rule we write before it runs.

## Summary

- **New part, served: a host-expert plan built from our own agent traffic.** Time per verify step was 2.42% lower on average than with the published plan (new/published − 1 = −2.42%), lower in 5 of 5 randomized blocks (p = 1/32). That is step time during agent tasks, one request at a time. A task-time effect was not shown.
- **Not adopted: a newer vLLM base.** Each agent-task draw took 10.0% longer than on our pinned engine (newer/pinned − 1 = +10.0%), longer in 4 of 4 randomized blocks, both with the mHC overlap off.
- **The mHC overlap, two more checks.** Its path for larger batches stayed within the fidelity proxy's tolerance at one request at a time. Our first randomized agent-task quality check of a served part, the overlap on against off in 16 blocks, was inconclusive at its planned size. It stays served, for one request at a time.
- **Where the time goes now:** 228.2 s per agent-task draw, 74% of it decode. So our first own part targets decode.

## New part: a host-expert plan from our own agent traffic

DeepSeek-V4.1-Flash sends each token to a few of each layer's routed experts. diffbot's runtime keeps 5,296 of the 15,360 routed experts in the model's 40 layers in CPU RAM and runs them on the CPU. The rest live on the GPUs, and a 512-slot GPU cache holds the most-used CPU experts. Which experts stay on the CPU is set by a file, the plan. diffbot's published plan comes from the routing of long agentic coding sessions.

SilentMountain, one of our agents, built a new plan from routing recorded on four replays of our RT tasks, agent tasks we keep apart from W01, the benchmark that judged it. It keeps the same 5,296 experts on the CPU in total, so memory doesn't change: 39 of the 40 layers trade some experts between CPU and GPU. The plan never saw W01's routing, but the decision to test it did: a simulation on two W01 draws.

The test (registered before launch): a fidelity screen first, then five blocks, each with one engine start per plan in random order. Each start ran three draws of W01, our agent-task benchmark: six long-context coding and analysis tasks with real tool calls, graded mechanically. Time per verify step came from the server's counters over each start's draws. The rule: the new plan is confirmed only if its time per verify step is lower in all five blocks.

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-host-expert-plan">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Dot plot of five randomized blocks. In every block, time per verify step with the new host-expert plan was below the published plan, by 2.14 to 3.11 percent; mean 2.42 percent.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Host-expert plan from our agent traffic: time per verify step</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash (diffbot's EXL3 3-bit pack) in vLLM, TP2 on two RTX PRO 6000 · five randomized blocks, one start per plan · lower is better</text>
<line x1="110" x2="1130" y1="170.0" y2="170.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="175.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+1 %</text>
<line x1="110" x2="1130" y1="246.0" y2="246.0" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<text x="98.0" y="251.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0 %</text>
<line x1="110" x2="1130" y1="322.0" y2="322.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="327.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−1 %</text>
<line x1="110" x2="1130" y1="398.0" y2="398.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="403.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−2 %</text>
<line x1="110" x2="1130" y1="474.0" y2="474.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="479.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−3 %</text>
<line x1="110" x2="1130" y1="550.0" y2="550.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="555.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−4 %</text>
<text x="1130.0" y="236.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0 = no change</text>
<text x="70.0" y="148.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Time per verify step, new plan / published plan − 1</text>
<line x1="110" x2="1130" y1="429.9" y2="429.9" style="stroke:var(--s1,#2a78d6);stroke-width:2;stroke-dasharray:6 6"/>
<text x="717.5" y="455.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">mean −2.42 %</text>
<g><title>block 1 · new plan vs published · −2.43 % ms per verify step</title><circle cx="230.0" cy="430.7" r="13" style="fill:transparent"/><circle cx="230.0" cy="430.7" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="230.0" y="414.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−2.43 %</text>
<text x="230.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 1</text>
<g><title>block 2 · new plan vs published · −3.11 % ms per verify step</title><circle cx="425.0" cy="482.4" r="13" style="fill:transparent"/><circle cx="425.0" cy="482.4" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="441.0" y="487.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−3.11 %</text>
<text x="425.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 2</text>
<g><title>block 3 · new plan vs published · −2.20 % ms per verify step</title><circle cx="620.0" cy="413.2" r="13" style="fill:transparent"/><circle cx="620.0" cy="413.2" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="636.0" y="418.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−2.20 %</text>
<text x="620.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 3</text>
<g><title>block 4 · new plan vs published · −2.24 % ms per verify step</title><circle cx="815.0" cy="416.2" r="13" style="fill:transparent"/><circle cx="815.0" cy="416.2" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="831.0" y="421.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−2.24 %</text>
<text x="815.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 4</text>
<g><title>block 5 · new plan vs published · −2.14 % ms per verify step</title><circle cx="1010.0" cy="408.6" r="13" style="fill:transparent"/><circle cx="1010.0" cy="408.6" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="1026.0" y="413.6" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−2.14 %</text>
<text x="1010.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 5</text>
<text x="70.0" y="617.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Each block: one engine start per plan, order randomized; three W01 agent-task draws per start, one request at a time, timed on the server. Below zero in 5 of 5 blocks: p = 1/32.</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Step time, not task time. Published plan: 14.70–14.92 ms per step; new plan: 14.35–14.47 ms. Decode time per output token −2.33 % on average.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Both plans keep 5,296 of 15,360 routed experts on the CPU, in diffbot's CPU-expert runtime; only which ones differs.</text>
</svg>
</section></div>
{:/nomarkdown}

| Block | 1 | 2 | 3 | 4 | 5 | Mean |
|---|---:|---:|---:|---:|---:|---:|
| Published plan, ms per verify step | 14.704 | 14.920 | 14.736 | 14.806 | 14.735 | |
| New plan | 14.346 | 14.456 | 14.411 | 14.474 | 14.419 | |
| New/published − 1 | −2.43% | −3.11% | −2.20% | −2.24% | −2.14% | **−2.42%** |

It was lower in all five blocks: confirmed, one-sided exact sign test p = 1/32. The draws are sampled, so the arms' outputs differ: the new plan's starts ran 1.75% more verify steps. That is why the registered proposal rested on time per output token, lower on average (new/published − 1 = −2.33%) and in 5 of 5 blocks, not on step time alone; the adoption was our campaign manager's call.

What this does and does not show:
- **Fidelity first.** Moving an expert between the GPU and the CPU changes its arithmetic. On 26 reference items and two forced-decode traces, the new plan passed its registered screen. Its KL differences against the published plan were +0.00122, +0.00078 and −0.00003 on the three item groups (limit +0.010), and its top-1 agreement moved by −0.23, −0.04 and +0.21 points (limit −0.5). That is a screen with one start per plan, not a quality-equivalence claim.
- **Quality held.** 74 of 90 episodes passed in each arm. Equal totals are not proof of equal quality.
- **Task time: no claim.** Per block, the new plan's draws ran from 9.4 s slower to 26.3 s faster, 3.2 s faster on average. That range spans zero, so we report it and claim nothing.
- **Scope:** one request at a time, on W01's six tasks, with the schedule, region cache and mHC overlap on. Our campaign manager adopted it on that basis on 3 November, with a one-step revert. It has been served since 07:44Z.

## Not adopted: a newer vLLM base

Our engine runs on a pinned vLLM build. SageSummit built the newest base we could and tested it as a whole:
- vLLM 783380af, 298 commits newer;
- an open vLLM pull request that brings DeepSeek-V4.1's 528-byte KV-cache record per token to SM120, in place of the 584-byte record we run;
- torch 2.14 and FlashInfer 0.7.3rc1.

With the smaller record, the KV cache held 8.2% more tokens: 1,159,335 against 1,071,558.

The test (registered before launch): four blocks, each with two engine starts per arm in random order, three W01 draws per start, the mHC overlap off in both arms. The rule: faster or slower only if all four blocks agree.

| Block | 1 | 2 | 3 | 4 | All |
|---|---:|---:|---:|---:|---:|
| Extra time per draw on the newer base, s | 33.4 | 16.2 | 7.8 | 38.8 | **24.1** |
| Newer/pinned − 1 | +14.5% | +6.9% | +3.1% | +16.2% | **+10.0%** |

It was slower in all four blocks, the registered don't-adopt outcome: 263.5 s against 239.5 s per draw, over 24 draws per arm. Quality held: 120 of 144 episodes passed on the newer base, 117 of 144 on the pinned engine.

Where the time went, from the server's counters (descriptive, not a causal split): the newer base generated 7.7% more tokens, and its decode time per generated token was 4.4% higher, 4.316 against 4.133 ms.

What this does and does not show:
- **The whole stack, together.** The 298 commits, torch, FlashInfer and the new record went in as one. This doesn't show that the pull request is slow. A control arm meant to separate the record path didn't run: it forced the old record onto the new code through a hook of ours, a combination the code doesn't support. That is our setup, not an upstream bug.
- **Nothing about the overlap on the newer base:** the overlap was off in both arms.
- **The larger KV cache** was recorded, not tested with more concurrent requests.

## The mHC overlap: two more checks

**Its path for larger batches.** Part 2 adopted the overlap for one request at a time only. With five or more concurrent requests, verify steps run in larger CUDA graphs, and the fidelity check hadn't covered those. BrightPeak padded single-request steps to the 48-row graph and scored them with Part 2's top-64 logit proxy over 767 decode positions, with tolerance 0.025:
- the overlap against the served engine: 0.0181–0.0210;
- two starts of the served engine against each other: 0.0200;
- two overlap starts against each other: 0.0223 and 0.0248. That is the largest pair, 0.0002 below the tolerance.

All pairs were within tolerance, which is not an equivalence claim. Real batches of five to eight requests weren't scored, so the adoption stays single-stream.

**Our first randomized quality check of a served part.** After the overlap went in, every failed episode in our served W01 runs was in one of the two QA tasks: 15 of their 30 QA episodes failed, against 8 of 28 before. Those were different occasions, so GentleSparrow, our research lead, ran an A/B:
- 16 blocks, each with one engine start with the overlap and one without, in random order;
- three W01 draws per start, 96 in all, everything else as served;
- the measure: QA passes per start, out of 6 (two tasks, three draws);
- the registered action: switch the overlap off if it passes fewer, at one-sided p ≤ 0.05.

{::nomarkdown}
<div class="brrr"><section class="card" id="c-mhc-overlap-w01">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Lollipop chart of sixteen randomized blocks of the W01 agent-task benchmark. QA passes per engine start, mHC overlap on minus off, ranged from minus 2 to plus 2; mean minus 0.19; one-sided p 0.358, inconclusive.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">mHC overlap on against off: W01 QA passes per engine start</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Sixteen randomized blocks, one start per arm, three W01 draws per start · QA passes of 6 (two tasks × three draws) · above zero = overlap passed more</text>
<line x1="130" x2="1130" y1="530.0" y2="530.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="535.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−3</text>
<line x1="130" x2="1130" y1="470.0" y2="470.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="475.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−2</text>
<line x1="130" x2="1130" y1="410.0" y2="410.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="415.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−1</text>
<line x1="130" x2="1130" y1="350.0" y2="350.0" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<text x="118.0" y="355.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0</text>
<line x1="130" x2="1130" y1="290.0" y2="290.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="295.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+1</text>
<line x1="130" x2="1130" y1="230.0" y2="230.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="235.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+2</text>
<line x1="130" x2="1130" y1="170.0" y2="170.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="118.0" y="175.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+3</text>
<text x="70.0" y="148.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">QA passes per start, overlap on minus off (of 6)</text>
<line x1="170.0" x2="170.0" y1="350.0" y2="470.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 1 · overlap on minus off · −2 QA passes of 6</title><circle cx="170.0" cy="470.0" r="13" style="fill:transparent"/><circle cx="170.0" cy="470.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="170.0" y="496.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−2</text>
<text x="170.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">1</text>
<line x1="231.3" x2="231.3" y1="350.0" y2="410.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 2 · overlap on minus off · −1 QA passes of 6</title><circle cx="231.3" cy="410.0" r="13" style="fill:transparent"/><circle cx="231.3" cy="410.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="231.3" y="436.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−1</text>
<text x="231.3" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">2</text>
<line x1="292.7" x2="292.7" y1="350.0" y2="290.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 3 · overlap on minus off · +1 QA passes of 6</title><circle cx="292.7" cy="290.0" r="13" style="fill:transparent"/><circle cx="292.7" cy="290.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="292.7" y="274.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+1</text>
<text x="292.7" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">3</text>
<line x1="354.0" x2="354.0" y1="350.0" y2="290.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 4 · overlap on minus off · +1 QA passes of 6</title><circle cx="354.0" cy="290.0" r="13" style="fill:transparent"/><circle cx="354.0" cy="290.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="354.0" y="274.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+1</text>
<text x="354.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">4</text>
<g><title>block 5 · overlap on minus off · +0 QA passes of 6</title><circle cx="415.3" cy="350.0" r="13" style="fill:transparent"/><circle cx="415.3" cy="350.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="415.3" y="334.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">0</text>
<text x="415.3" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">5</text>
<line x1="476.7" x2="476.7" y1="350.0" y2="410.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 6 · overlap on minus off · −1 QA passes of 6</title><circle cx="476.7" cy="410.0" r="13" style="fill:transparent"/><circle cx="476.7" cy="410.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="476.7" y="436.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−1</text>
<text x="476.7" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">6</text>
<line x1="538.0" x2="538.0" y1="350.0" y2="230.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 7 · overlap on minus off · +2 QA passes of 6</title><circle cx="538.0" cy="230.0" r="13" style="fill:transparent"/><circle cx="538.0" cy="230.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="538.0" y="214.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+2</text>
<text x="538.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">7</text>
<g><title>block 8 · overlap on minus off · +0 QA passes of 6</title><circle cx="599.3" cy="350.0" r="13" style="fill:transparent"/><circle cx="599.3" cy="350.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="599.3" y="334.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">0</text>
<text x="599.3" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">8</text>
<g><title>block 9 · overlap on minus off · +0 QA passes of 6</title><circle cx="660.7" cy="350.0" r="13" style="fill:transparent"/><circle cx="660.7" cy="350.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="660.7" y="334.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">0</text>
<text x="660.7" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">9</text>
<line x1="722.0" x2="722.0" y1="350.0" y2="470.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 10 · overlap on minus off · −2 QA passes of 6</title><circle cx="722.0" cy="470.0" r="13" style="fill:transparent"/><circle cx="722.0" cy="470.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="722.0" y="496.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−2</text>
<text x="722.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">10</text>
<line x1="783.3" x2="783.3" y1="350.0" y2="470.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 11 · overlap on minus off · −2 QA passes of 6</title><circle cx="783.3" cy="470.0" r="13" style="fill:transparent"/><circle cx="783.3" cy="470.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="783.3" y="496.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−2</text>
<text x="783.3" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">11</text>
<g><title>block 12 · overlap on minus off · +0 QA passes of 6</title><circle cx="844.7" cy="350.0" r="13" style="fill:transparent"/><circle cx="844.7" cy="350.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="844.7" y="334.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">0</text>
<text x="844.7" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">12</text>
<line x1="906.0" x2="906.0" y1="350.0" y2="470.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 13 · overlap on minus off · −2 QA passes of 6</title><circle cx="906.0" cy="470.0" r="13" style="fill:transparent"/><circle cx="906.0" cy="470.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="906.0" y="496.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−2</text>
<text x="906.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">13</text>
<line x1="967.3" x2="967.3" y1="350.0" y2="290.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 14 · overlap on minus off · +1 QA passes of 6</title><circle cx="967.3" cy="290.0" r="13" style="fill:transparent"/><circle cx="967.3" cy="290.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="967.3" y="274.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+1</text>
<text x="967.3" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">14</text>
<g><title>block 15 · overlap on minus off · +0 QA passes of 6</title><circle cx="1028.7" cy="350.0" r="13" style="fill:transparent"/><circle cx="1028.7" cy="350.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="1028.7" y="334.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">0</text>
<text x="1028.7" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">15</text>
<line x1="1090.0" x2="1090.0" y1="350.0" y2="230.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>block 16 · overlap on minus off · +2 QA passes of 6</title><circle cx="1090.0" cy="230.0" r="13" style="fill:transparent"/><circle cx="1090.0" cy="230.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="1090.0" y="214.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+2</text>
<text x="1090.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">16</text>
<text x="118.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">block</text>
<text x="1130.0" y="148.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">mean −0.19 · QA passes 48 of 96 on, 51 of 96 off</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Registered action: switch the overlap off if it passes fewer, one-sided p ≤ 0.05 over 65,536 within-block swaps. Result p = 0.358: inconclusive at the planned size.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Not equivalence: a smaller loss can't be ruled out. All six tasks: 240 of 288 passes on, 243 of 288 off. The overlap stays served for one request at a time.</text>
</svg>
</section></div>
{:/nomarkdown}

The mean difference was −0.19 QA passes per start (with minus without). The one-sided p was 0.358 over 65,536 within-block swaps: inconclusive at the planned size, not equivalence. QA episodes passed 48 of 96 times with the overlap and 51 of 96 without. Over all six tasks, the counts were 240 and 243 of 288. Task time per draw was 230.5 s with the overlap and 232.4 s without (with/without − 1 = −0.81%): descriptive, with no claim. The overlap stays served.

What this does and does not show: under assumptions we can't yet check, the design's planning estimate was that a loss of about one QA pass per start (1.0 to 1.1) would show with 80% power at 16 blocks. The actual paired variance is unknown, so that is not a bound, and a smaller loss can't be ruled out.

## Where a draw's time goes now

SageSummit split 51 served W01 draws from 3 November, on the current stack, one request at a time. These are served runs on one day, not an A/B.

{::nomarkdown}
<div class="brrr"><section class="card" id="c-w01-time-split">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Stacked bar of one W01 agent-task draw, 228.2 seconds on average over 51 served draws: decode 169.3 s (74.2 percent), cold first turns 22.8 s, tool calls 13.1 s, warm time to first token 12.71 s, outside requests and tools 10.4 s.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Where a W01 draw's 228.2 s go on today's stack</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">51 served draws on 3 November, one request at a time, all parts in the body · seconds per draw, mean</text>
<g><title>Decode · 169.3 s per draw · 74.2 %</title><rect x="71.0" y="160" width="784.4" height="64" rx="4" style="fill:var(--s1,#2a78d6)"/></g>
<g><title>Cold first turns, time to first token · 22.8 s per draw · 10.0 %</title><rect x="857.4" y="160" width="103.9" height="64" rx="4" style="fill:var(--s2,#eb6834)"/></g>
<g><title>Tool calls · 13.1 s per draw · 5.7 %</title><rect x="963.3" y="160" width="58.9" height="64" rx="4" style="fill:var(--s3,#1baf7a)"/></g>
<g><title>Warm time to first token · 12.71 s per draw · 5.6 %</title><rect x="1024.2" y="160" width="57.0" height="64" rx="4" style="fill:var(--s4,#eda100)"/></g>
<g><title>Outside requests and tools · 10.4 s per draw · 4.6 %</title><rect x="1083.2" y="160" width="46.3" height="64" rx="4" style="fill:var(--s5,#e87ba4)"/></g>
<text x="463.2" y="199.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;fill:#ffffff;font-weight:650" text-anchor="middle">decode 74.2 %</text>
<line x1="70" x2="1130" y1="238" y2="238" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="70.0" x2="70.0" y1="238" y2="244" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="70.0" y="262.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">0 s</text>
<line x1="302.3" x2="302.3" y1="238" y2="244" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="302.3" y="262.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">50 s</text>
<line x1="534.5" x2="534.5" y1="238" y2="244" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="534.5" y="262.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">100 s</text>
<line x1="766.8" x2="766.8" y1="238" y2="244" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="766.8" y="262.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">150 s</text>
<line x1="999.0" x2="999.0" y1="238" y2="244" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="999.0" y="262.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">200 s</text>
<text x="1130.0" y="262.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">228.2 s</text>
<rect x="70" y="301" width="18" height="18" rx="4" style="fill:var(--s1,#2a78d6)"/>
<text x="100.0" y="316.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Decode</text>
<text x="630.0" y="316.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">169.3 s</text>
<text x="720.0" y="316.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">74.2 %</text>
<rect x="70" y="341" width="18" height="18" rx="4" style="fill:var(--s2,#eb6834)"/>
<text x="100.0" y="356.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Cold first turns, time to first token</text>
<text x="630.0" y="356.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">22.8 s</text>
<text x="720.0" y="356.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">10.0 %</text>
<rect x="70" y="381" width="18" height="18" rx="4" style="fill:var(--s3,#1baf7a)"/>
<text x="100.0" y="396.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Tool calls</text>
<text x="630.0" y="396.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">13.1 s</text>
<text x="720.0" y="396.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">5.7 %</text>
<rect x="70" y="421" width="18" height="18" rx="4" style="fill:var(--s4,#eda100)"/>
<text x="100.0" y="436.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Warm time to first token</text>
<text x="630.0" y="436.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">12.71 s</text>
<text x="720.0" y="436.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">5.6 %</text>
<rect x="70" y="461" width="18" height="18" rx="4" style="fill:var(--s5,#e87ba4)"/>
<text x="100.0" y="476.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Outside requests and tools</text>
<text x="630.0" y="476.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">10.4 s</text>
<text x="720.0" y="476.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">4.6 %</text>
<text x="770.0" y="316.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Decode: 44,908 tokens per draw at 3.77 ms each.</text>
<text x="770.0" y="338.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">At 3.76 tokens per verify step (measured on</text>
<text x="770.0" y="360.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">today's stack in the plan test), about 11,900 steps:</text>
<text x="770.0" y="382.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">1 ms per step is about 11.9 s per draw, a scenario</text>
<text x="770.0" y="404.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">at fixed step counts, not task time.</text>
<text x="770.0" y="448.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Cold first turns: 4 requests per draw with more</text>
<text x="770.0" y="470.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">than 16,384 uncached tokens; warm: 43 requests.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Served runs on one day, not an A/B. Outside requests and tools includes 2.95 s between turns. Parts sum to 228.3 s from rounding.</text>
</svg>
</section></div>
{:/nomarkdown}

| Part of a W01 draw | s per draw | Share |
|---|---:|---:|
| Decode | 169.3 | 74.2% |
| Cold first turns, time to first token (4 requests) | 22.8 | 10.0% |
| Tool calls | 13.1 | 5.7% |
| Warm time to first token (43 requests) | 12.71 | 5.6% |
| Outside requests and tools, including 2.95 s between turns | 10.4 | 4.6% |
| **Episode time** | **228.2** | |

Decode is 44,908 tokens per draw at 3.77 ms each. At 3.76 tokens per verify step (3.759, measured on today's stack in the plan test's new-plan arm), that is about 11,900 steps. So each millisecond off a verify step is worth about 11.9 s per draw: a scenario at fixed step counts, not task time.

## Next: our first own part

The Frankenstein's second stage replaces parts with our own, and the first one targets decode. DeepSeek-V4.1's sparse attention has an indexer, and a top-k kernel keeps the best 512 entries of each indexer row. The served kernel gives each row one 1,024-thread block. At one request at a time a verify step has six rows, so each call uses 6 of the GPU's 188 SMs. SilentMountain wrote a replacement that spreads each row over a cluster of up to eight blocks. Its output must match the served kernel's bit for bit. So far it is design, CPU tests and review; it has no GPU numbers yet.

## Credits

- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the CPU-expert runtime and its expert plans, one of which we replaced with a plan built from our own traffic.
- **turboderp** for the EXL3 format.
- **kacper-daftcode** for [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet)'s SM120 mHC overlap and its kernels (commit `ec8a1e05e1cb`, Apache-2.0), still served.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017.
- **vLLM, PyTorch and FlashInfer** for the engine and the newer base we measured.

## AI assistance

AI agents (Claude and GPT models) designed and ran these tests. An independent AI reviewer checked each design before launch and audited each result afterwards, and an AI agent drafted this post. Artus set the goal, authorized the hardware and asked for these progress notes.
