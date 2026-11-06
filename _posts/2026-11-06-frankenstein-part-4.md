---
title: 'The Frankenstein, Part 4: Our First Own Part'
description: 'Part 4 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. Our first own part, an exact top-k kernel for the attention indexer, matched the served kernel byte for byte on every real call we checked and is adopted, counted at 0.31 ms per verify step, about 0.64 s per agent task. Served rows do not carry it yet. We now measure model seconds per task: model time is 89.6% of an agent task draw. Three more levers were measured and parked.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell]
---

*6 November 2026. A progress note from a running campaign, following [Part 3](/2026/11/04/frankenstein-part-3.html). The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

Part 4 of our Frankenstein: a DeepSeek-V4.1-Flash server on two RTX PRO 6000s, built from other engines' best parts, then our own.

Our first own part is adopted: an exact top-k kernel for the attention indexer, counted at 0.31 ms per verify step, about 0.64 s per agent task.

The target is unchanged: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on one workstation with two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), for long-context agentic coding, one request at a time. The body is vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000), serving the parts from Parts 1 to 3. The Frankenstein's second stage replaces parts with our own. Part 3 named the first one as "next", with no GPU numbers. It now has them.

## Summary

- **Adopted: our first own part, an exact top-k kernel for DeepSeek-V4.1's attention indexer.** Its output equalled the served kernel's byte for byte on every real call we checked: 776 on rows that fit its key cache, 1,024 on longer rows. We count it at 0.31 ms per verify step, about 0.64 s per agent task. Served rows don't carry it yet: putting it into the served stack is next, and its gain there hasn't been measured.
- **Measured inside the engine:** on a replayed agent session, verify steps were faster with it in 3 of 3 paired engine starts, by 0.377 ms on average. The counted 0.31 ms is the difference on the turns that draft the way served steps do (a descriptive split, not paired).
- **A yardstick for every engine lever: model seconds per task.** Over 54 served draws, model time is 89.6% of the time of an agent-task draw, and tool calls are 5.7%. One millisecond per verify step is worth about 2.06 s per task.
- **Three more levers, measured and parked.** Each saved less than its rule asked for.

## Our first own part: an exact top-k for the indexer

DeepSeek-V4.1's sparse attention has an indexer, and a top-k kernel keeps the best 512 entries of each indexer row. The served kernel, vLLM's, gives each row one block of 1,024 threads. At one request at a time a verify step has six rows, so each call uses 6 of the GPU's 188 SMs.

SilentMountain, one of our agents, wrote rs8. It spreads each row over a cluster of eight blocks, which combine their candidates through the cluster's distributed shared memory. Its output must equal the served kernel's byte for byte: the same keys, in the same order, with the same fill for unused slots. So adopting it changes speed, not results.

It got here in four steps, each with a rule we wrote before it ran:
1. **Synthetic rows.** A micro-benchmark timed rs8 at 24.77 µs per call against the served kernel's 73.12 µs (event-timed, weighted over five context lengths from our agent traffic, 112,464 to 169,449 tokens), with identical output. A planning number: real rows could overturn it.
2. **Real rows.** We captured the served indexer's inputs and outputs from real agent traffic. rs8's output equalled the served output on 776 of 776 calls. That test's timing stopped at a calibration check and gave no speed decision.
3. **Inside the engine** (BrightPeak), below.
4. **Long rows** (BrightPeak), below.

### Inside the engine

BrightPeak ran rs8 inside our engine on a replay of one served W01 draw: its 50 turns, one request at a time, timed on the server's clock. Six fresh engine starts in a fixed order, A B B A A B, made three pairs: the served kernel (A) against rs8 (B). We picked the draw because it is the only one of 54 served draws with turns longer than rs8's key cache (see Long rows).

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-rs8-in-engine">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Dot plot of three paired engine starts on a replayed agent session. In every pair, time per verify step with rs8 was below the served kernel, by 0.383, 0.437 and 0.311 milliseconds; mean 0.377 as measured, 0.31 counted.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Our top-k kernel rs8 inside the engine: time per verify step</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash (diffbot's EXL3 3-bit pack) in vLLM, TP2 on two RTX PRO 6000 · three paired engine starts · lower is better</text>
<line x1="110" x2="1130" y1="515.0" y2="515.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="520.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.0</text>
<line x1="110" x2="1130" y1="430.0" y2="430.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="435.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.2</text>
<line x1="110" x2="1130" y1="345.0" y2="345.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="350.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.4</text>
<line x1="110" x2="1130" y1="260.0" y2="260.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="265.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.6</text>
<line x1="110" x2="1130" y1="175.0" y2="175.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="180.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.8</text>
<text x="70.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">ms per verify step, server clock</text>
<circle cx="660" cy="148.0" r="8" style="fill:var(--s1,#2a78d6)"/>
<text x="676.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">served kernel (vLLM's)</text>
<circle cx="910" cy="148.0" r="8" style="fill:var(--s2,#eb6834)"/>
<text x="926.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">rs8 (ours)</text>
<line x1="300.0" x2="300.0" y1="266.0" y2="410.7" style="stroke:var(--axis,#c3c2b7);stroke-width:2"/>
<g><title>pair 1 (s1, s2) · served kernel · 14.6070 ms per verify step</title><circle cx="300.0" cy="257.0" r="13" style="fill:transparent"/><circle cx="300.0" cy="257.0" r="8" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>pair 1 (s1, s2) · rs8 · 14.2242 ms per verify step</title><circle cx="300.0" cy="419.7" r="13" style="fill:transparent"/><circle cx="300.0" cy="419.7" r="8" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="282.0" y="262.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">14.607</text>
<text x="282.0" y="424.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">14.224</text>
<text x="318.0" y="344.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">−0.383 ms</text>
<text x="300.0" y="545.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">pair 1 (s1, s2)</text>
<line x1="600.0" x2="600.0" y1="243.9" y2="411.6" style="stroke:var(--axis,#c3c2b7);stroke-width:2"/>
<g><title>pair 2 (s4, s3) · served kernel · 14.6591 ms per verify step</title><circle cx="600.0" cy="234.9" r="13" style="fill:transparent"/><circle cx="600.0" cy="234.9" r="8" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>pair 2 (s4, s3) · rs8 · 14.2221 ms per verify step</title><circle cx="600.0" cy="420.6" r="13" style="fill:transparent"/><circle cx="600.0" cy="420.6" r="8" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="582.0" y="239.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">14.659</text>
<text x="582.0" y="425.6" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">14.222</text>
<text x="618.0" y="333.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">−0.437 ms</text>
<text x="600.0" y="545.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">pair 2 (s4, s3)</text>
<line x1="900.0" x2="900.0" y1="264.1" y2="378.1" style="stroke:var(--axis,#c3c2b7);stroke-width:2"/>
<g><title>pair 3 (s5, s6) · served kernel · 14.6115 ms per verify step</title><circle cx="900.0" cy="255.1" r="13" style="fill:transparent"/><circle cx="900.0" cy="255.1" r="8" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>pair 3 (s5, s6) · rs8 · 14.3009 ms per verify step</title><circle cx="900.0" cy="387.1" r="13" style="fill:transparent"/><circle cx="900.0" cy="387.1" r="8" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="882.0" y="260.1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">14.612</text>
<text x="882.0" y="392.1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">14.301</text>
<text x="918.0" y="327.1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">−0.311 ms</text>
<text x="900.0" y="545.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">pair 3 (s5, s6)</text>
<text x="1130.0" y="577.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">mean −0.377 ms measured · counted: 0.31 ms (about 0.64 s per task)</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Replay of one served W01 draw: 50 turns, one request at a time, on six fresh engine starts in the order A B B A A B. Faster in 3 of 3 pairs.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Counted gain: the difference on turns that draft like served steps. Output byte-equal to the served kernel on 776 + 1,024 real calls checked.</text>
</svg>
</section></div>
{:/nomarkdown}

| Pair | 1 | 2 | 3 | Mean |
|---|---:|---:|---:|---:|
| Served kernel, ms per verify step | 14.607 | 14.659 | 14.612 | |
| rs8 | 14.224 | 14.222 | 14.301 | |
| Served − rs8 | 0.383 | 0.437 | 0.311 | **0.377** |

rs8 was faster in all three pairs. Afterwards, one graded W01 draw on rs8 passed 5 of its 6 tasks, against at least 4 in each of the 54 served draws.

The rule had four conditions. Three held: faster in every pair, a mean saving of at least 0.15 ms, and tokens per step within the spread between the served starts. The fourth didn't. It asked that rs8's text differ from the served kernel's in no more turns than two served starts differ from each other: 41 of 50 turns against 40. So the run parked. On this draw that criterion was saturated: the replay samples, so two starts of the identical engine already diverge in 38 to 40 of 50 turns. From the next A/B on, it is reported, not deciding. Whether rs8 picks the same keys is a question for an exact check, and the last step was that check.

**Why we count 0.31 ms, not 0.377.** The replay's verify steps produced about 2.0 to 2.1 tokens each, against 3.74 in served traffic, because on many of its turns the drafter proposed few tokens. rs8 saved more on those turns (0.444 ms per step) than on turns that drafted almost five tokens per step, as served steps do (0.309 ms). Both figures are descriptive, not paired. We count the served-like 0.31 ms: at 2.06 s per task per millisecond (below), about 0.64 s per agent task.

### Long rows

Each of rs8's eight blocks keeps up to 22,928 of a row's keys in a cache, 183,424 for the cluster. Longer rows take a separate tail path. The real rows of step 2 all fit in the cache. Seven of the replay's 50 turns didn't, but a replay compares text, and text differs between two starts of the same engine anyway.

So BrightPeak captured the served indexer's inputs and outputs on four of those turns, with prompts of 184,809 to 191,998 tokens, and ran rs8 on the same inputs:
- rs8's whole output buffer equalled the served kernel's on all 1,024 calls of 128 steps, both run directly and inside CUDA graphs.
- On 3,912 rows from 251 test cases checked against a reference implementation, 90 of the cases at the edge of the key cache, none differed. A deliberately wrong build differed on 213, so the check can fail.

That is real-row coverage from four turns of one session, not a proof for every input.

**The decision.** With the same keys on both paths, GentleSparrow, our research lead, adopted rs8 as an exact replacement under the rule written before the run, counted at 0.31 ms per verify step. Served rows don't carry it yet. Putting it into the served stack is the next step, and its gain on served rows hasn't been measured.

## A yardstick: model seconds per task

SageSummit split 54 served W01 draws from 5 November: 18 rows of three draws, one request at a time, on the stack before rs8. W01 is our agent-task benchmark: six long-context coding and analysis tasks with real tool calls, graded mechanically.

{::nomarkdown}
<div class="brrr"><section class="card" id="c-draw-time-split">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Stacked bar of one W01 agent-task draw, 233.83 seconds on average over 54 served draws: decode 174.58 s, time to first token 34.84 s, tool calls 13.33 s, outside requests and tools 11.09 s. Model time, decode plus time to first token, is 209.41 s, 89.6 percent.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Where an agent-task draw's 233.83 s go: model time is 89.6 %</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">54 served W01 draws on 5 November, one request at a time, the stack before rs8 · seconds per draw, mean, client clock</text>
<g><title>Decode · 174.58 s per draw · 74.7 %</title><rect x="71.0" y="190" width="789.4" height="64" rx="4" style="fill:var(--s1,#2a78d6)"/></g>
<g><title>Time to first token · 34.84 s per draw · 14.9 %</title><rect x="862.4" y="190" width="155.9" height="64" rx="4" style="fill:var(--s2,#eb6834)"/></g>
<g><title>Tool calls · 13.33 s per draw · 5.7 %</title><rect x="1020.3" y="190" width="58.4" height="64" rx="4" style="fill:var(--s3,#1baf7a)"/></g>
<g><title>Outside requests and tools · 11.09 s per draw · 4.7 %</title><rect x="1080.8" y="190" width="48.3" height="64" rx="4" style="fill:var(--s4,#eda100)"/></g>
<text x="465.7" y="229.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;fill:#ffffff;font-weight:650" text-anchor="middle">decode 74.7 %</text>
<path d="M71 180 V168 H1018.3 V180" style="fill:none;stroke:var(--ink2,#52514e);stroke-width:1.5"/>
<text x="544.6" y="158.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">model time: 209.41 s, 89.6 %</text>
<line x1="70" x2="1130" y1="268" y2="268" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="70.0" x2="70.0" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="70.0" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">0 s</text>
<line x1="296.7" x2="296.7" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="296.7" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">50 s</text>
<line x1="523.3" x2="523.3" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="523.3" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">100 s</text>
<line x1="750.0" x2="750.0" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="750.0" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">150 s</text>
<line x1="976.6" x2="976.6" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="976.6" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">200 s</text>
<text x="1130.0" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">233.83 s</text>
<rect x="70" y="331" width="18" height="18" rx="4" style="fill:var(--s1,#2a78d6)"/>
<text x="100.0" y="346.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Decode</text>
<text x="540.0" y="346.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">174.58 s</text>
<text x="630.0" y="346.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">74.7 %</text>
<rect x="70" y="371" width="18" height="18" rx="4" style="fill:var(--s2,#eb6834)"/>
<text x="100.0" y="386.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Time to first token</text>
<text x="540.0" y="386.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">34.84 s</text>
<text x="630.0" y="386.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">14.9 %</text>
<rect x="70" y="411" width="18" height="18" rx="4" style="fill:var(--s3,#1baf7a)"/>
<text x="100.0" y="426.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Tool calls</text>
<text x="540.0" y="426.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">13.33 s</text>
<text x="630.0" y="426.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">5.7 %</text>
<rect x="70" y="451" width="18" height="18" rx="4" style="fill:var(--s4,#eda100)"/>
<text x="100.0" y="466.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Outside requests and tools</text>
<text x="540.0" y="466.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">11.09 s</text>
<text x="630.0" y="466.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">4.7 %</text>
<text x="710.0" y="346.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Server clock: model time 208.65 s per draw;</text>
<text x="710.0" y="368.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">decode is 12,340 verify steps at 14.42 ms,</text>
<text x="710.0" y="390.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">3.74 tokens per step.</text>
<text x="710.0" y="434.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">So 1 ms per verify step is about 12.34 s per</text>
<text x="710.0" y="456.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">draw, 2.06 s per task: the conversion we use</text>
<text x="710.0" y="478.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">for every engine lever.</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">18 served rows of three draws, six agent tasks per draw; 5.00 of 6 tasks passed per draw on average. Served runs on one day, not an A/B.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Model time = time to first token + decode, on the client's clock. Parts sum to 233.84 s from rounding.</text>
</svg>
</section></div>
{:/nomarkdown}

| Part of a W01 draw (client clock) | s per draw | Share |
|---|---:|---:|
| Decode | 174.58 | 74.7% |
| Time to first token | 34.84 | 14.9% |
| Tool calls | 13.33 | 5.7% |
| Outside requests and tools | 11.09 | 4.7% |
| **Episode time** | **233.83** | |

Model time, time to first token plus decode, is 209.41 s per draw: 89.6% of the episode time over the 54 draws. On the server's clock it is 208.65 s, and decode is 12,340 verify steps at 14.42 ms, with 3.74 tokens per step. An engine change moves model time; tool calls and the harness's own time don't move with it. So we now rank engine levers by model seconds per task: 1 ms per verify step is about 12.34 s per draw, or 2.06 s per task. The draws passed 5.00 of 6 tasks on average.

These are served runs on one day, not an A/B against Part 3's 228.2 s from 3 November.

## Three more levers, measured and parked

Each had a rule written before it ran, and each saved less than its rule asked for:
- **The split-K reduce fused into the dense matrix-vector kernels** (SilentMountain). Bit-equal: 0 of 1,216 checks unequal, and 0 of 10,000 soak replays mismatched. It saved 0.045 ms per 279-call step-set, the median of 400 rounds and positive in all 400, against the rule's 0.10.
- **Isolating worker threads from the CPU-expert pools' cores**, a switch already in diffbot's recipe (SageSummit). It saved 0.047 ms per verify step, lower in 3 of 3 pairs, against the rule's 0.15. On the same replayed draw, the served engine's six starts across this test and rs8's lay within 0.053 ms of each other, about four hours apart.
- **A smaller vocabulary for the drafter's output head** (BrightPeak's CPU check, parked by SageSummit, no GPU time). With a 32K-token subset, a held-out task had 1.185% of its tokens outside it. That would cost 1.93 to 2.06% of tokens per step, more than the 1.4% that the head's saving of about 0.2 ms per step pays for.

## Next

rs8 goes into the served stack. Its first served rows will answer a named question, with the number of rows planned before they run.

## Credits

- **vLLM** for the engine and for the served top-k kernel that rs8 replaces and matches byte for byte.
- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the CPU-expert runtime and its thread-isolation switch.
- **turboderp** for the EXL3 format.
- **kacper-daftcode** for [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet)'s SM120 mHC overlap and its kernels (commit `ec8a1e05e1cb`, Apache-2.0), still served.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017.

## AI assistance

AI agents (Claude and GPT models) designed, wrote and ran these tests and the kernel. An independent AI reviewer checked each design before launch and audited each result afterwards, and an AI agent drafted this post. Artus set the goal, authorized the hardware and asked for these progress notes.

*Corrected 6 November: the 90 edge items are test cases, not rows; the 0.31 ms split is descriptive, not paired.*
