---
title: 'The Frankenstein, Part 5: Our Kernel Keeps Its 2% in Served Traffic'
description: 'Part 5 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. rs8, the exact top-k kernel from Part 4, now runs in served traffic. Verify steps there were 0.314 ms faster (95% interval 0.217 to 0.410), about 2.2% of a 14.43 ms step, and quality held. One user''s task time could not show a saving this small at the number of rows we ran, and we knew that before they ran. Three more levers were too small to keep.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell]
---

*7 November 2026. A progress note from a running campaign, following [Part 4](/2026/11/06/frankenstein-part-4.html). The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

*Rewritten 16 November 2026 with what later parts of the series showed. The original version is [on GitHub](https://github.com/artuskg/artuskg.github.io/blob/518d93f/_posts/2026-11-07-frankenstein-part-5.md).*

Part 5 of our Frankenstein, a DeepSeek-V4.1-Flash server on two RTX PRO 6000s: our own top-k kernel, rs8, from [Part 4](/2026/11/06/frankenstein-part-4.html), has run in served traffic since 06:11 UTC on 6 November. rs8 spreads each row of the attention indexer's top-k over a cluster of eight blocks and returns the same keys, in the same order, as the kernel it replaces.

On served agent-task rows, each verify step was 0.314 ms faster (95% interval 0.217 to 0.410 ms), about 2.2% of a 14.43 ms step. That confirms Part 4. One user's model time per task didn't move: 34.38 s with rs8 and without it on the same day. At this number of rows it couldn't, because the expected saving was smaller than the noise. Later days didn't show it either ([Part 12](/2026/11/15/frankenstein-part-12.html)).

## Summary

- **The step saving carries.** 0.314 ms per verify step (95% interval 0.217 to 0.410) at matched tokens per step, from four served rows with rs8 against 18 rows without it from 5 November. All four rs8 rows lie below every one of those 18.
- **No drift.** Two rows without rs8 on the same day, one before and one after, matched 5 November (−0.015 ms). Against those two alone, the saving is 0.30 ms.
- **Quality held.** All 48 agentic task runs passed, and the draws passed 5.17 of 6 tasks on average, against 5.00.
- **Task time can't resolve a 2% step gain here, by design.** At a fixed number of steps, the saving is about 3.8 s per draw. With four rows, the standard error of the difference was 7.45 s per draw, and 5 November's own spread keeps it at 3.18 s or more however many rs8 rows run. So we chose step time as the measure before the rows ran.
- **Three more levers were too small to keep** (list at the end).

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

Each dot is a row: three draws of W01, our agent test (six long-context coding and analysis tasks with real tool calls, graded mechanically), on one engine start. A verify step checks the drafter's guesses, and its time rises with the number of tokens it accepts, which varies with the text. So each draw's time per step is moved to 3.740 tokens per step, 5 November's mean. Tokens per step were 3.749 with rs8, 3.736 without it on the same day and 3.740 on 5 November, so the adjustment hardly matters: with either slope we used, 0.366 or 0.602 ms per token, the saving is 0.314 or 0.316 ms.

**How we decided.** Before the first row, we fixed the rows (four with rs8, between one row without it before and one after, with no interim look) and the question: does the 95% interval's lower end clear half of Part 4's 0.31 ms? It was 0.215 ms at worst, against 0.155, so the saving carries and the count stays at 0.31 ms.

## Quality

All 48 runs of the four agentic tasks passed, as all 216 had on 5 November. The draws passed 5.17 of 6 tasks over 12 draws, against 5.00 over 54. That is a guard against a broken served path, not a quality measurement. rs8 returns the same keys as the kernel it replaces, so it isn't expected to change the text.

## Why task time can't show it

On the server's clock, model time was 206.28 s per draw with rs8 and 206.25 s on the same-day rows without it, 34.38 s per task either way. 5 November's rows took 208.65 s (34.77 s per task).

At a fixed 12,340 verify steps per draw, 0.31 ms per step is about 3.83 s per draw, or 0.64 s per task. With four rows, the difference's standard error is 7.45 s per draw, about twice the effect. Adding rs8 rows doesn't fix that: 5 November's own spread keeps the standard error at 3.18 s or more however many rs8 rows run, so the effect would stay near one standard error. We worked this out before the rows ran, and it is why step time, at matched tokens per step, is the measure here.

Later parts showed it again. Steps went from 14.4 ms to 14.0 to 14.1 ms with rs8, while one user's daily means of model time stayed between 33.8 and 34.8 s, all but one day. The number of steps per task moved more than the steps did: from about 1,920 to 2,390 between days ([Part 12](/2026/11/15/frankenstein-part-12.html)). On a test this size, a step gain of a few percent is real but doesn't show in task time.

## Three more levers, too small to keep

Each saved less than the bar we set before it ran. These are engine-level timings on each test's own bench.

- **A fused top-k for the indexer's masked layers.** On four of the indexer's eight top-k layers, only the keys in a row's 2,048 candidate blocks count. The served path sets the rest of the row to −∞ in two small kernels, then runs rs8 over the whole row. The fused version gathers the candidate blocks into shared memory and selects from them in one launch, with the select from diffbot's kernel, which beat rs8 on rows this short. Its first check caught a mismatch on subnormal values (floats below the normal range): it ranked them exactly, while the served kernels rank positive subnormals as zero. Changed to match, it equalled the served path byte for byte on all 388 real calls (2,328 rows). It saved 0.071 ms per verify step, against a bar of 0.08 ms.
- **Two changes to the MoE expert kernel**, each timed inside one engine start on 128 chunks of the kernel's work. A cheaper end for each segment of its split-K reduce saved 0.039 ms per verify step (95% interval 0.035 to 0.042). Three ways of scheduling the memory copies in its matrix-multiply pipeline saved 0.000, 0.026 and 0.055 ms. All are under their bar of 0.10 ms. Each variant's output stayed within the served kernel's own run-to-run differences, which aren't zero because its floating-point atomic adds change order between runs.

## Next

Served rows now run with rs8.

## Credits

- **vLLM** for the engine.
- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the indexer top-k kernel that rs8 replaces, matches and builds on (its select also runs inside the fused top-k), and the CPU-expert runtime.
- **turboderp** for the EXL3 format.
- **kacper-daftcode** for [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet)'s SM120 mHC overlap and its kernels (commit `ec8a1e05e1cb`, Apache-2.0), still served.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017.

## AI assistance

AI agents (Claude and GPT models) designed, wrote and ran these tests and the kernel. An independent AI reviewer checked each design before launch and audited each result afterwards, and AI agents drafted this post and its 16 November rewrite. Artus set the goal, authorized the hardware and asked for these progress notes.
