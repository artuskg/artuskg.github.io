---
title: 'The Frankenstein, Part 12: Where the Speed Went, and Graph Sizes Matched to the Drafter'
description: 'Part 12 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. Since the evening of 2 November, one user at a time has stayed about as fast on our agent test, while, since 12 November, 8 agent sessions at once went from 87 to about 210-215 graded tasks per hour. The newest gain is under load too: vLLM padded 5 and 7 running requests to larger recorded graphs, and matching the graph sizes to the drafter cut the 7-request step from 48.7 to 37.1 ms. At 8 sessions its run wrote 6.9% more tokens per second and finished 2.3% more graded tasks per hour, but it also wrote 4.5% more tokens per task, so the step time is the clean measure.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell, speculative-decoding]
---

*15 November 2026. A progress note from a running campaign, following [Part 11](/2026/11/14/frankenstein-part-11.html). Not a peer-reviewed paper. [Where We Stand](/frankenstein/) has all the numbers.*

*Updated 16 November 2026: [Part 13](/2026/11/16/frankenstein-part-13.html)'s correction is folded into the text (tasks per hour rose less than tokens per second because the graph-size fix's run wrote 4.5% more tokens per task, not because of prefill, tool calls and waiting, as we first guessed), the table gains a tokens-per-task row, the description no longer leads with the +6.9% output, and the text calls the cache the two-tier KV cache or the KV cache in host RAM. The previous version is [on GitHub](https://github.com/artuskg/artuskg.github.io/blob/518d93f/_posts/2026-11-15-frankenstein-part-12.md).*

Twelve parts in, a fair question is whether this is still paying off. For one user at a time, the honest answer is: not much, lately. For several users at once, it is paying more than ever. This part shows both, and adds one more gain of the second kind.

Two terms we use throughout: **model time** is the time the server spends reading prompts and writing answers for a task's requests, without tool calls; a **draw** is one pass of a session through our six agent tasks.

## Where the speed went

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-where-the-speed-went">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 960" width="1200" height="960" role="img" aria-label="Two charts on one date axis, 31 October to 14 November 2026. Top: one user's model seconds per task, from 40.5 (diffbot's recipe as published) and 38.2 on 1 to 2 November to 33.8 on the evening of 2 November, then 34 to 35 through 11 November (38.6 on 9 November from 6 draws), and single draws of 29 to 45 from 12 to 14 November. Bottom: graded tasks per hour with 8 sessions, 87 with the cards only on 12 November, 208 with the two-tier KV cache, 210 to 212 on 13 and 14 November, and 215 with the graph-size fix.">
<rect width="1200" height="960" style="fill:var(--surface,#fcfcfb)"/>
<text x="60.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Where the speed went: one user level since 2 Nov evening, 8 sessions 2.4× since 12 Nov</text>
<text x="60.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash-1017 on 2× RTX PRO 6000, our server by date · our 6-task agent test</text>
<text x="60.0" y="133.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:18px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">One user at a time: model seconds per task (lower is better)</text>
<text x="60.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start"></text>
<line x1="110" x2="1130" y1="455.0" y2="455.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="459.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">25 s</text>
<line x1="110" x2="1130" y1="397.0" y2="397.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="401.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">30 s</text>
<line x1="110" x2="1130" y1="339.0" y2="339.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="343.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">35 s</text>
<line x1="110" x2="1130" y1="281.0" y2="281.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="285.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">40 s</text>
<line x1="110" x2="1130" y1="223.0" y2="223.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="227.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">45 s</text>
<line x1="110" x2="1130" y1="165.0" y2="165.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="169.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">50 s</text>
<line x1="110" x2="1130" y1="455" y2="455" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<line x1="145.2" x2="145.2" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="215.5" x2="215.5" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="285.9" x2="285.9" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="356.2" x2="356.2" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="426.6" x2="426.6" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="496.9" x2="496.9" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="567.2" x2="567.2" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="637.6" x2="637.6" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="707.9" x2="707.9" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="778.3" x2="778.3" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="848.6" x2="848.6" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="919.0" x2="919.0" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="989.3" x2="989.3" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="1059.7" x2="1059.7" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="1130.0" x2="1130.0" y1="455" y2="460" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<circle cx="66" cy="148" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="78.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">mean of 6 to 207 draws, ±1 standard error</text>
<circle cx="396" cy="148" r="6" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/>
<text x="408.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">one draw</text>
<path d="M506,141 l7,7 l-7,7 l-7,-7 Z" style="fill:var(--surface,#fcfcfb);stroke:var(--ink2,#52514e);stroke-width:2"/>
<text x="520.0" y="153.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">client clock, 3 draws</text>
<g><title>diffbot's recipe as published, on our box, 31 Oct: 40.5 s (3 draws, client clock)</title><path d="M139.1,267.2 l8,8 l-8,8 l-8,-8 Z" style="fill:var(--surface,#fcfcfb);stroke:var(--ink2,#52514e);stroke-width:2"/></g>
<text x="151.1" y="241.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">diffbot's recipe as published</text>
<line x1="216.2" x2="216.2" y1="311.4" y2="292.6" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>02 Nov: 38.2 s per task, 39 draws, ±0.8 s</title><circle cx="216.2" cy="302.0" r="14" style="fill:transparent"/><circle cx="216.2" cy="302.0" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="245.8" x2="245.8" y1="331.3" y2="282.4" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>02 Nov: 37.8 s per task, 9 draws, ±2.1 s</title><circle cx="245.8" cy="306.8" r="14" style="fill:transparent"/><circle cx="245.8" cy="306.8" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="279.3" x2="279.3" y1="361.2" y2="345.5" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>02 Nov: 33.8 s per task, 15 draws, ±0.7 s</title><circle cx="279.3" cy="353.4" r="14" style="fill:transparent"/><circle cx="279.3" cy="353.4" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="319.1" x2="319.1" y1="356.3" y2="345.2" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>03 Nov: 34.0 s per task, 51 draws, ±0.5 s</title><circle cx="319.1" cy="350.7" r="14" style="fill:transparent"/><circle cx="319.1" cy="350.7" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="392.4" x2="392.4" y1="345.4" y2="338.9" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>04 Nov: 34.7 s per task, 207 draws, ±0.3 s</title><circle cx="392.4" cy="342.2" r="14" style="fill:transparent"/><circle cx="392.4" cy="342.2" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="444.1" x2="444.1" y1="352.2" y2="340.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>05 Nov: 34.4 s per task, 57 draws, ±0.5 s</title><circle cx="444.1" cy="346.1" r="14" style="fill:transparent"/><circle cx="444.1" cy="346.1" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="470.8" x2="470.8" y1="347.3" y2="336.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>05 Nov: 34.8 s per task, 54 draws, ±0.5 s</title><circle cx="470.8" cy="341.6" r="14" style="fill:transparent"/><circle cx="470.8" cy="341.6" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="512.0" x2="512.0" y1="358.9" y2="333.5" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>06 Nov: 34.4 s per task, 12 draws, ±1.1 s</title><circle cx="512.0" cy="346.2" r="14" style="fill:transparent"/><circle cx="512.0" cy="346.2" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="764.6" x2="764.6" y1="324.8" y2="269.0" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>09 Nov: 38.6 s per task, 6 draws, ±2.4 s</title><circle cx="764.6" cy="296.9" r="14" style="fill:transparent"/><circle cx="764.6" cy="296.9" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="865.7" x2="865.7" y1="366.7" y2="331.6" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<g><title>11 Nov: 34.1 s per task, 6 draws, ±1.5 s</title><circle cx="865.7" cy="349.2" r="14" style="fill:transparent"/><circle cx="865.7" cy="349.2" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="289.3" y="379.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">mHC overlap in</text>
<text x="249.8" y="272.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">region cache in</text>
<g><title>12 Nov 00:33: 35.5 s per task, one draw</title><circle cx="920.6" cy="333.3" r="14" style="fill:transparent"/><circle cx="920.6" cy="333.3" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<g><title>12 Nov 08:39: 35.0 s per task, one draw</title><circle cx="944.3" cy="339.0" r="14" style="fill:transparent"/><circle cx="944.3" cy="339.0" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<g><title>12 Nov 23:54: 31.0 s per task, one draw</title><circle cx="989.0" cy="385.4" r="14" style="fill:transparent"/><circle cx="989.0" cy="385.4" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<g><title>13 Nov 07:22: 44.8 s per task, one draw</title><circle cx="1010.9" cy="224.9" r="14" style="fill:transparent"/><circle cx="1010.9" cy="224.9" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<g><title>13 Nov 10:37: 33.2 s per task, one draw</title><circle cx="1020.4" cy="359.7" r="14" style="fill:transparent"/><circle cx="1020.4" cy="359.7" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<g><title>13 Nov 18:18: 31.8 s per task, one draw</title><circle cx="1042.9" cy="375.9" r="14" style="fill:transparent"/><circle cx="1042.9" cy="375.9" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<g><title>14 Nov 05:46: 33.5 s per task, one draw</title><circle cx="1076.6" cy="356.4" r="14" style="fill:transparent"/><circle cx="1076.6" cy="356.4" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<g><title>14 Nov 07:29: 29.5 s per task, one draw</title><circle cx="1081.6" cy="402.7" r="14" style="fill:transparent"/><circle cx="1081.6" cy="402.7" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<g><title>14 Nov 09:17: 29.2 s per task, one draw</title><circle cx="1086.9" cy="406.5" r="14" style="fill:transparent"/><circle cx="1086.9" cy="406.5" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<text x="998.9" y="230.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">single draws</text>
<text x="1069.6" y="426.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">29.5, graph-size fix: one draw</text>
<text x="60.0" y="528.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:18px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">8 sessions at once: graded tasks per hour (higher is better)</text>
<text x="60.0" y="548.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start"></text>
<line x1="110" x2="1130" y1="800.0" y2="800.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="804.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0</text>
<line x1="110" x2="1130" y1="752.0" y2="752.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="756.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">50</text>
<line x1="110" x2="1130" y1="704.0" y2="704.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="708.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">100</text>
<line x1="110" x2="1130" y1="656.0" y2="656.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="660.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">150</text>
<line x1="110" x2="1130" y1="608.0" y2="608.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="612.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">200</text>
<line x1="110" x2="1130" y1="560.0" y2="560.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="564.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">250</text>
<line x1="110" x2="1130" y1="800" y2="800" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<line x1="145.2" x2="145.2" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="215.5" x2="215.5" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="285.9" x2="285.9" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="356.2" x2="356.2" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="426.6" x2="426.6" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="496.9" x2="496.9" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="567.2" x2="567.2" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="637.6" x2="637.6" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="707.9" x2="707.9" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="778.3" x2="778.3" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="848.6" x2="848.6" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="919.0" x2="919.0" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="989.3" x2="989.3" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="1059.7" x2="1059.7" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="1130.0" x2="1130.0" y1="800" y2="805" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="532.1" y="680.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">no comparable 8-session measurement before 12 November</text>
<g><title>12 Nov 07:41: 87.2 tasks per hour, cards only, one step of 48 tasks</title><circle cx="941.5" cy="716.3" r="14" style="fill:transparent"/><circle cx="941.5" cy="716.3" r="6" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:2"/></g>
<g><title>12 Nov 23:20: 208.4 tasks per hour, with the two-tier KV cache, one step of 48 tasks</title><circle cx="987.4" cy="599.9" r="14" style="fill:transparent"/><circle cx="987.4" cy="599.9" r="6" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:2"/></g>
<g><title>13 Nov 10:37: 211.7 tasks per hour</title><circle cx="1020.4" cy="596.8" r="14" style="fill:transparent"/><circle cx="1020.4" cy="596.8" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>13 Nov 18:18: 210.2 tasks per hour</title><circle cx="1042.9" cy="598.2" r="14" style="fill:transparent"/><circle cx="1042.9" cy="598.2" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>14 Nov 05:46: 211.9 tasks per hour</title><circle cx="1076.6" cy="596.6" r="14" style="fill:transparent"/><circle cx="1076.6" cy="596.6" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>14 Nov 07:29: 215.0 tasks per hour, graph-size fix</title><circle cx="1081.6" cy="593.6" r="14" style="fill:transparent"/><circle cx="1081.6" cy="593.6" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>14 Nov 09:17: 208.4 tasks per hour</title><circle cx="1086.9" cy="599.9" r="14" style="fill:transparent"/><circle cx="1086.9" cy="599.9" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<circle cx="66" cy="543" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="78.0" y="548.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">6 steps, 288 tasks</text>
<circle cx="256" cy="543" r="6" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:2"/>
<text x="268.0" y="548.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">one step, 48 tasks</text>
<text x="929.5" y="721.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">87, cards only</text>
<text x="975.4" y="625.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">208, two-tier</text>
<text x="1083.6" y="579.6" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">215, graph-size fix</text>
<text x="145.2" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">1 Nov</text>
<text x="285.9" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">3 Nov</text>
<text x="426.6" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">5 Nov</text>
<text x="567.2" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">7 Nov</text>
<text x="707.9" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">9 Nov</text>
<text x="848.6" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">11 Nov</text>
<text x="989.3" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">13 Nov</text>
<text x="1059.7" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">14 Nov</text>
<text x="110.0" y="822.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start"></text>
<text x="60.0" y="872.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">One user: model time = the server's time to first token plus decode, summed over a task's requests, without tools (the</text>
<text x="60.0" y="892.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">recipe's point: the client's clock, 0.1 s apart on 5 Nov). Single draws but the first come from 8-session runs' one-session</text>
<text x="60.0" y="912.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">step. The first version we served, llama.cpp on 31 Oct, took 82.6 s per task including tools on an older test; not shown.</text>
<text x="60.0" y="932.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">8 sessions: graded tasks per hour on the wall clock, tools included, one run per point. Our own test, not live users.</text>
</svg>
</section></div>
{:/nomarkdown}

**One user at a time** got faster early, then stopped moving. On our 6-task agent test, one session at a time, the server needed 38.2 s of model time per task on 1 and 2 November (39 draws), and 33.8 s on the evening of 2 November (15 draws), after the prompt region cache and vLLM-Moet's mHC overlap went in ([Parts 1](/2026/11/02/frankenstein-part-1.html) and [2](/2026/11/03/frankenstein-part-2.html)). Since then, every day's mean but one has stayed between 33.8 and 34.8 s, with a standard deviation of 2.6 to 4.0 s from one draw to the next.

**The steps kept getting faster; the tasks didn't.** Each decoding step took 15.5 ms on 1 and 2 November, 14.8 ms after the overlap, 14.4 ms after the host-expert plan ([Part 3](/2026/11/04/frankenstein-part-3.html)) and 14.0 to 14.1 ms with our top-k kernel ([Part 5](/2026/11/07/frankenstein-part-5.html)). From 14.8 to 14.1 ms is worth about 1.4 s per task at about 2,000 steps per task, but the daily means didn't fall. How much the model writes varies more than that: the 2 November evening draws needed about 1,920 steps per task, the next days 1,990 to 2,060, and 9 November's 6 draws 2,390. That is why 9 November reads 38.6 s with the fastest steps so far. On a test this size, step-time gains of a few percent are real but don't show up in task time.

Since 12 November we have only single draws, most of them taken as the one-session step of our 8-session runs: with the two-tier KV cache they average 33.9 s, from 29.2 to 44.8.

**Several users at once** is where the gains are now. With 8 agent sessions sharing the server, it finished 87 graded tasks per hour on 12 November. Adding a KV cache in host RAM behind the cards' own took that to 208 the same day ([Part 9](/2026/11/13/frankenstein-part-9.html)), about 2.4 times as many, at about the same tokens per task (7,712 and 7,815). Longer runs since then put the served setup at 208 to 212, and the graph-size fix below added 2.3% on top in its own test: 215 against 210, though its run wrote 4.5% more tokens per task. That line only starts on 12 November: we had no comparable 8-session measurement before then.

Why the two lines differ: one user's speed is set by how long each decoding step takes, and each part since early November took only a few percent off a step. With 8 sessions, the server first ran out of KV cache, the memory that holds the conversations: without the KV cache in host RAM, 8 sessions did fewer tasks per hour than 2. Fixing that was worth far more than any one-user part.

## New: graph sizes matched to the drafter

vLLM replays recorded CUDA graphs for decoding, one per batch size. With DeepSeek's DSpark drafter guessing 5 tokens ahead, each running request needs 6 rows, and vLLM rounds every recorded size up to a multiple of 6. Our size list came out as 6, 12, 18, 24, 36 and 48 rows. So 5 running requests (30 rows) replayed the 36-row graph, and 7 (42 rows) replayed the 48-row one: 6 padding rows each time. On this model, padding rows aren't free. Profiles of those steps show the GPUs waiting longer on the experts that run on the CPU: about 6.6 ms more per step, summed over the layers. Why padding costs that much, more than real rows, we haven't verified. Our guess: their dummy inputs route to experts that real tokens rarely use, which aren't warm on the CPU.

7 matters with 8 sessions because the sessions don't all decode at once: some are busy with tool calls. In the served setup's run, about one decoding step in five had 7 requests running.

The fix is one setting: record graphs for every multiple of 6 up to 48. In a test on 14 November (one run each: the served setup, the change, the served setup again):

| | Served setup (two runs: average, or each) | With the fix |
|---|---:|---:|
| Decode step with 7 requests running | 48.7 ms | **37.1 ms** |
| Decode step with 8 requests running | 39.2 ms | 38.7 ms |
| Output tokens per second, 8 sessions | 438.5 | 468.7 (+6.9%) |
| Graded tasks per hour, 8 sessions | 210.2 | 215.0 (+2.3%) |
| Tokens per task, 8 sessions | 7,405 and 7,622 | 7,849 (+4.5%) |
| Tasks passed, 8 sessions | 246 and 243 of 288 | 249 of 288 |
| One session, ms per generated token | 3.63 and 3.83 | 3.75 (level) |

- **The 7-request step is 24% shorter,** and the 8-request step, which never padded, is within 1.4%. 5 requests gained too (29.3 against 40.1 and 41.7 ms).
- **Tasks per hour move less than tokens per second,** 2.3% against 6.9%, because the fix's run wrote 4.5% more tokens per task than the served runs (7,849 against 7,405 and 7,622): 1.069 / 1.045 = 1.023. Some of the +6.9% may come from those longer answers too, because prompt and tool time get spread over more tokens. So the step times above are the clean measure ([Part 13](/2026/11/16/frankenstein-part-13.html) explains).
- **It has been served since 14 November, 13:03 UTC.**

## Tried and parked

- **A dataflow kernel for the expert layers** saved no time and is parked.
- **A profile of the served engine under load** didn't complete: the profiled engine ran out of its container's memory. Nothing to report from it yet.

## Limits

- **One run per arm** for the graph-size test; the two runs of the served setup bracket it. They differ by 1.2% in tokens per second and by 1.7% in tasks per hour. The +6.9% stands clear of that spread, though part of it may be longer answers (above); the +2.3% in tasks per hour is barely outside it.
- **The fix's run had more preemptions,** requests paused for lack of memory (5 against 0 and 2 in the measured window). They may cost it a little; we don't count that as part of the gain.
- **We couldn't check that its output is bit-identical,** because the served setup isn't: two runs of it already differ under greedy decoding. The change only picks which recorded graph a batch replays, not the math, and every other safety check passed.
- **The one-user line joins two kinds of measurement.** Up to 11 November, each point is the mean of 6 to 207 draws of our agent test, run one at a time. From 12 November, each is a single draw, all but the first taken as the one-session step of an 8-session run. The first point, diffbot's recipe as published, is on the client's clock (the two clocks were 0.1 s per task apart on 5 November). The first version we served, 82.6 s per task including tools on 31 October, ran an older version of the test and is left out.
- **The 8-session line joins two kinds of run too.** The two 12 November points are each one 8-session step of 48 tasks, from runs that went from 1 to 16 sessions. The 13 and 14 November points are each 6 steps of 288 tasks after a warm-up.

## Credits

- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and the DSpark drafter.
- **diffbot** for the 3-bit pack and serving recipe.
- **turboderp** for EXL3.
- **vLLM** for the engine and its CUDA graph capture.

## AI assistance

AI agents (Claude and GPT models) ran these measurements, and an AI agent drafted this note. The code is public in [sm120-serving](https://github.com/Percivio-Ltd/sm120-serving) ([Part 11](/2026/11/14/frankenstein-part-11.html)).
