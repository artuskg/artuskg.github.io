---
title: 'The Frankenstein, Part 5: Our Own Part, Served'
description: 'Part 5 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. rs8, our exact top-k kernel for the attention indexer, now runs in served traffic. On its first served agent-task rows, verify steps were 0.314 ms faster at matched tokens per step (95% interval 0.217 to 0.410), and quality held. Task time does not resolve the saving at this number of rows, so the count stays at 0.31 ms per verify step. Three more levers were measured and parked.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell]
---

*7 November 2026. A progress note from a running campaign, following [Part 4](/2026/11/06/frankenstein-part-4.html). The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

Part 5 of our Frankenstein, a DeepSeek-V4.1-Flash server on two RTX PRO 6000s: our own top-k kernel, rs8, now runs in served traffic.

On its first served agent-task rows, verify steps were 0.314 ms faster at matched tokens per step (95% interval 0.217-0.410).

Part 4 said that served rows didn't carry rs8 yet. Since 06:11Z on 6 November they do: rs8 is in the served engine. Part 4's text stays as it was published, so this is the dated update. Part 4 also carries a dated correction from today: its replay's low tokens per step came from turns decoded past their sampled end, not from low drafting. And a credit fix: the served top-k kernel that rs8 replaces is diffbot's, from their serving recipe, not vLLM's as Part 4 said. Part 4's text and credits are corrected.

The setup is unchanged: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000), one request at a time. rs8 replaces the top-k kernel from diffbot's recipe, which keeps the best 512 entries of each attention-indexer row in one block of 1,024 threads. rs8 keeps that kernel's select and spreads each row over a cluster of eight blocks, and it returned the same keys in the same order on every real call we checked (Part 4).

## Summary

- **rs8 is served, and its saving carries on served rows.** On its first served W01 rows, verify steps were 0.314 ms faster at matched tokens per step, 95% interval 0.217 to 0.410 ms, against the 18 rows of 5 November.
- **Same-day check:** the two rows without rs8 that ran before and after it matched 5 November's 18 (drift −0.015 ms). Against those two rows alone, the saving is 0.30 ms.
- **Quality held:** all 48 agentic task runs passed, and the draws passed 5.17 of 6 tasks on average, against 5.00.
- **Task time is not resolved at this number of rows.** Server model time was 206.28 s per draw with rs8 and 206.25 s on the same day without it, so it doesn't show the 0.64 s per task that the count implies. The count stays at 0.31 ms per verify step.
- **Three more levers, measured and parked.** A fused top-k for the indexer's masked layers matched the served path byte for byte once its first check had caught a mismatch, then saved 0.071 ms per verify step, under its bar of 0.08 ms. Two changes to the MoE expert kernel saved at most 0.055 ms, under their bar of 0.10 ms.

## The question, set before the rows

SageSummit, one of our agents, wrote the question and the rule's reader before the first row: on served W01 rows, does rs8 lower the time per verify step by at least half of the counted 0.31 ms? BrightPeak put rs8 into the served stack, and GentleSparrow, our research lead, launched the rows. W01 is our agent-task benchmark: six long-context coding and analysis tasks with real tool calls, graded mechanically, and a row is three draws of it on one engine start.

- **Rows, fixed in advance:** four rows with rs8, between one row without it before and one after, with no interim look. The comparison is 5 November's 18 served rows without rs8 (Part 4's yardstick).
- **Matched tokens per step.** A verify step checks the drafter's proposed tokens. Time per step rises with tokens per step, an association that follows the text: draws whose text lets steps accept more drafted tokens also take longer per step. Tokens per step varies from draw to draw, so each draw's time per step is moved to 3.740 tokens per step, 5 November's mean, with two slopes for that association: 0.366 and 0.602 ms per token. A row's value is the mean of its three draws.
- **Bands,** on the 95% interval's lower end: at least 0.155 ms, half the count, reads *carries*; above 0 reads *seen*, and a smaller gain is recounted; at or below 0 rolls rs8 back.
- **Guards:** any failure of the four agentic tasks, or 4.5 passes per draw or fewer, holds the reading. Same-day rows without rs8 that move more than 0.13 ms from 5 November's mean mark it confounded by drift.

## The rows

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-rs8-served-rows">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Dot plot of served W01 rows, time per verify step at 3.740 tokens per step. The 18 rows without rs8 from 5 November lie between 14.280 and 14.582 ms, mean 14.429. On 6 November, two rows without rs8 read 14.451 and 14.376, and the four rows with rs8 between them read 14.171, 14.097, 14.049 and 14.145: 0.314 ms below the 5 November mean, 95 percent interval 0.217 to 0.410.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">rs8 in served traffic: time per verify step, row by row</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash (diffbot's EXL3 3-bit pack) in vLLM, TP2 on two RTX PRO 6000 · served W01 rows, one request at a time · lower is better</text>
<line x1="110" x2="1130" y1="515.0" y2="515.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="520.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.0</text>
<line x1="110" x2="1130" y1="466.4" y2="466.4" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="471.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.1</text>
<line x1="110" x2="1130" y1="417.9" y2="417.9" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="422.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.2</text>
<line x1="110" x2="1130" y1="369.3" y2="369.3" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="374.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.3</text>
<line x1="110" x2="1130" y1="320.7" y2="320.7" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="325.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.4</text>
<line x1="110" x2="1130" y1="272.1" y2="272.1" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="277.1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.5</text>
<line x1="110" x2="1130" y1="223.6" y2="223.6" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="228.6" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.6</text>
<line x1="110" x2="1130" y1="175.0" y2="175.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="180.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">14.7</text>
<text x="70.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">ms per verify step at 3.740 tokens per step, server clock</text>
<circle cx="660" cy="148.0" r="8" style="fill:var(--s1,#2a78d6)"/>
<text x="676.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">without rs8 (diffbot's top-k kernel)</text>
<circle cx="960" cy="148.0" r="8" style="fill:var(--s2,#eb6834)"/>
<text x="976.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">with rs8 (ours)</text>
<line x1="110" x2="1130" y1="306.7" y2="306.7" style="stroke:var(--s1,#2a78d6);stroke-width:1.5;stroke-dasharray:6 5"/>
<text x="1130.0" y="296.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">5 Nov's mean 14.429</text>
<g><title>5 Nov row, 12:16 UTC · without rs8 · 14.502 ms</title><circle cx="140.0" cy="271.0" r="11" style="fill:transparent"/><circle cx="140.0" cy="271.0" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 13:02 UTC · without rs8 · 14.362 ms</title><circle cx="159.0" cy="339.3" r="11" style="fill:transparent"/><circle cx="159.0" cy="339.3" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 13:20 UTC · without rs8 · 14.375 ms</title><circle cx="178.0" cy="332.6" r="11" style="fill:transparent"/><circle cx="178.0" cy="332.6" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 13:39 UTC · without rs8 · 14.500 ms</title><circle cx="197.0" cy="272.1" r="11" style="fill:transparent"/><circle cx="197.0" cy="272.1" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 13:56 UTC · without rs8 · 14.536 ms</title><circle cx="216.0" cy="254.8" r="11" style="fill:transparent"/><circle cx="216.0" cy="254.8" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 14:13 UTC · without rs8 · 14.442 ms</title><circle cx="235.0" cy="300.5" r="11" style="fill:transparent"/><circle cx="235.0" cy="300.5" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 14:31 UTC · without rs8 · 14.352 ms</title><circle cx="254.0" cy="343.8" r="11" style="fill:transparent"/><circle cx="254.0" cy="343.8" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 14:48 UTC · without rs8 · 14.427 ms</title><circle cx="273.0" cy="307.5" r="11" style="fill:transparent"/><circle cx="273.0" cy="307.5" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 15:05 UTC · without rs8 · 14.280 ms</title><circle cx="292.0" cy="379.1" r="11" style="fill:transparent"/><circle cx="292.0" cy="379.1" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 15:23 UTC · without rs8 · 14.305 ms</title><circle cx="311.0" cy="366.8" r="11" style="fill:transparent"/><circle cx="311.0" cy="366.8" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 15:41 UTC · without rs8 · 14.328 ms</title><circle cx="330.0" cy="355.8" r="11" style="fill:transparent"/><circle cx="330.0" cy="355.8" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 15:58 UTC · without rs8 · 14.582 ms</title><circle cx="349.0" cy="232.4" r="11" style="fill:transparent"/><circle cx="349.0" cy="232.4" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 16:14 UTC · without rs8 · 14.495 ms</title><circle cx="368.0" cy="274.4" r="11" style="fill:transparent"/><circle cx="368.0" cy="274.4" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 16:32 UTC · without rs8 · 14.506 ms</title><circle cx="387.0" cy="269.1" r="11" style="fill:transparent"/><circle cx="387.0" cy="269.1" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 16:48 UTC · without rs8 · 14.343 ms</title><circle cx="406.0" cy="348.6" r="11" style="fill:transparent"/><circle cx="406.0" cy="348.6" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 17:06 UTC · without rs8 · 14.408 ms</title><circle cx="425.0" cy="316.9" r="11" style="fill:transparent"/><circle cx="425.0" cy="316.9" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 17:23 UTC · without rs8 · 14.475 ms</title><circle cx="444.0" cy="284.5" r="11" style="fill:transparent"/><circle cx="444.0" cy="284.5" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>5 Nov row, 17:39 UTC · without rs8 · 14.502 ms</title><circle cx="463.0" cy="271.4" r="11" style="fill:transparent"/><circle cx="463.0" cy="271.4" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="610.0" x2="986.0" y1="459.0" y2="459.0" style="stroke:var(--s2,#eb6834);stroke-width:1.5;stroke-dasharray:6 5"/>
<path d="M986.0 309.7 V456.0" style="stroke:var(--ink2,#52514e);stroke-width:1.5;fill:none"/>
<text x="996.0" y="378.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">−0.314 ms</text>
<text x="996.0" y="398.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">95 %: 0.217</text>
<text x="996.0" y="415.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">to 0.410</text>
<g><title>6 Nov row, 04:25 UTC · without rs8 · 14.451 ms</title><circle cx="560.0" cy="295.8" r="13" style="fill:transparent"/><circle cx="560.0" cy="295.8" r="8" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="560.0" y="279.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">14.451</text>
<text x="560.0" y="541.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">04:25</text>
<g><title>6 Nov row, 04:43 UTC · with rs8 · 14.171 ms</title><circle cx="640.0" cy="432.0" r="13" style="fill:transparent"/><circle cx="640.0" cy="432.0" r="8" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="640.0" y="416.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">14.171</text>
<text x="640.0" y="541.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">04:43</text>
<g><title>6 Nov row, 05:00 UTC · with rs8 · 14.097 ms</title><circle cx="720.0" cy="467.7" r="13" style="fill:transparent"/><circle cx="720.0" cy="467.7" r="8" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="720.0" y="495.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">14.097</text>
<text x="720.0" y="541.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">05:00</text>
<g><title>6 Nov row, 05:18 UTC · with rs8 · 14.049 ms</title><circle cx="800.0" cy="491.4" r="13" style="fill:transparent"/><circle cx="800.0" cy="491.4" r="8" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="800.0" y="519.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">14.049</text>
<text x="800.0" y="541.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">05:18</text>
<g><title>6 Nov row, 05:36 UTC · with rs8 · 14.145 ms</title><circle cx="880.0" cy="444.8" r="13" style="fill:transparent"/><circle cx="880.0" cy="444.8" r="8" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="880.0" y="428.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">14.145</text>
<text x="880.0" y="541.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">05:36</text>
<g><title>6 Nov row, 05:52 UTC · without rs8 · 14.376 ms</title><circle cx="960.0" cy="332.3" r="13" style="fill:transparent"/><circle cx="960.0" cy="332.3" r="8" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="960.0" y="360.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">14.376</text>
<text x="960.0" y="541.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">05:52</text>
<text x="301.5" y="541.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">5 Nov: 18 rows, in run order</text>
<text x="760.0" y="563.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">6 Nov: six rows, in run order (start, UTC)</text>
<text x="70.0" y="617.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Each dot is a row: the mean of its 3 draws, each moved to 3.740 tokens per step at 0.366 ms per token. At 0.602 ms per token: −0.316 ms, 95 % 0.215 to 0.417.</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">The two 6 Nov rows without rs8 match 5 Nov's 18 (drift −0.015 ms); against them alone, the rs8 rows are 0.30 ms lower.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Quality held: 48 of 48 agentic task runs passed. Task time didn't resolve the saving at this number of rows.</text>
</svg>
</section></div>
{:/nomarkdown}

| Row, 6 November (start, UTC) | Top-k kernel | ms per verify step at 3.740 tokens per step |
|---|---|---:|
| 04:25 | diffbot's | 14.451 |
| 04:43 | rs8 | 14.171 |
| 05:00 | rs8 | 14.097 |
| 05:18 | rs8 | 14.049 |
| 05:36 | rs8 | 14.145 |
| 05:52 | diffbot's | 14.376 |
| *5 November, 18 rows* | *diffbot's* | *14.429 (rows 14.280 to 14.582)* |

All four rs8 rows lie below every one of the 18 rows of 5 November.

| Reading | at 0.366 ms per token | at 0.602 ms per token |
|---|---:|---:|
| Saving against 5 November's 18 rows (95% interval) | **0.314** (0.217 to 0.410) | **0.316** (0.215 to 0.417) |
| Same-day rows without rs8 against those 18 (drift) | −0.015 | −0.014 |
| Saving against the two same-day rows alone (95% interval) | 0.298 (0.169 to 0.428) | 0.301 (0.168 to 0.435) |

The smaller lower end over the two slopes is 0.215 ms, above the 0.155 the rule asked for, so the reading is *carries*. Both upper ends are above 0.31, so the count stays at 0.31 ms per verify step. Tokens per step were 3.749 on the rs8 rows, 3.736 on the same-day rows without it and 3.740 on 5 November. The GPUs' heat-protection power cap of 500 W was engaged in a similar share of every row, 26 to 30% of the samples drawing 250 W or more.

## Quality

All 48 runs of the four agentic tasks passed, as all 216 had on 5 November. The draws passed 5.17 of 6 tasks on average over 12 draws, against 5.00 over 54. The misses were in the two question-answering tasks: qa-remote passed in 0.83 of the draws (0.52 on 5 November) and qa-config in 0.33 (0.48).

That is a guard against a broken served path, not a quality measurement. rs8 returned the same keys as the kernel it replaces on every call we checked, so it isn't expected to change the text. The guard covers the parts of the served path beyond those checks.

## Task time

On the server's clock, model time was 206.28 s per draw with rs8 (34.38 s per task), 206.25 s on the same-day rows without it (34.38 s) and 208.65 s on 5 November (34.77 s). The two same-day arms are equal on this clock.

The count implies 0.31 ms × 12,340 verify steps, about 3.83 s per draw or 0.64 s per task. The plan said before the rows that task time can't decide this: with four rows, the difference's standard error is 7.45 s per draw, and 5 November's own spread keeps it at 3.18 s or more however many rs8 rows run. So the per-step saving carries on served rows, and task time is not resolved at this number of rows. Task time stays in the served series, and the rows from here on run with rs8.

## Three more levers, measured and parked

Each had a bar written before it ran, and each saved less than its bar. These are engine-level timings on each test's own bench, not task time.
- **F, a fused top-k for the indexer's masked layers** (BrightPeak's design and bench, SilentMountain's kernel). On four of the indexer's eight top-k layers, only the keys in a row's 2,048 candidate blocks count. The served path sets the rest of the row to −∞ in two small kernels, then runs rs8 over the whole row. F gathers the candidate blocks into shared memory and selects from them in one launch, with the select from diffbot's kernel, which beat rs8 on rows this short. Its first checks stopped it before any timing. On 12 test rows of zeros and subnormal values (floats below the normal range), F's output differed from the served path's: F ranked those values exactly, while the served kernels rank positive subnormals as zero. Its bar is byte equality with the served kernel, so F was changed to rank them the same way. Fixed, it matched byte for byte on all 388 real calls (2,328 rows) and on the 816 rows of its pre-timing check; memcheck and racecheck found no errors. It then saved 0.071 ms per verify step at W01's mix of contexts, under its bar of 0.08 ms, so it is parked. The check caught the mismatch; the bar parked a real but small gain.
- **Two changes to the MoE expert kernel** (SilentMountain), each timed inside one engine start on 128 chunks of the kernel's work. A cheaper end for each segment of its split-K reduce saved 0.039 ms per verify step (95% interval 0.035 to 0.042). Three ways of scheduling the memory copies in its matrix-multiply pipeline saved 0.000, 0.026 and 0.055 ms. All are under their bar of 0.10 ms. Each variant's output stayed within the bound set by the served kernel's own run-to-run differences, which are not zero because its floating-point atomic adds change order between runs.

## Next

Served rows now run with rs8, and they continue the task-time series.

## Credits

- **vLLM** for the engine.
- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the indexer top-k kernel that rs8 replaces, matches and builds on (its select also runs inside F), and the CPU-expert runtime.
- **turboderp** for the EXL3 format.
- **kacper-daftcode** for [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet)'s SM120 mHC overlap and its kernels (commit `ec8a1e05e1cb`, Apache-2.0), still served.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017.

## AI assistance

AI agents (Claude and GPT models) designed, wrote and ran these tests and the kernel. An independent AI reviewer checked each design before launch and audited each result afterwards, and an AI agent drafted this post. Artus set the goal, authorized the hardware and asked for these progress notes.
