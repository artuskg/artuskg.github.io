---
title: 'The Frankenstein, Part 6: Two Cards Keep Pace With Four'
description: 'Part 6 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. On our agent test it needs 34.8 s of model time per task, against 36.4 s for NVIDIA''s FP4 version on four cards, each with its drafter: 4.5% less on average, inside the spread between draws, so about level. The two cards it does not need listed at $16,000 each in August. The price is fidelity: our 3-bit weights deviate measurably from the original model.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, blackwell]
---

*8 November 2026. A note from a running campaign, following [Part 5](/2026/11/07/frankenstein-part-5.html). It adds no new measurement: it puts two rows of [Where We Stand](/frankenstein/) side by side, draw by draw, with what they mean for the cards and what they cost in fidelity. Not a peer-reviewed paper.*

Part 6 of our Frankenstein: on two RTX PRO 6000s, our DeepSeek-V4.1-Flash server keeps pace with NVIDIA's FP4 version on four.

Model time per task on our agent test: 34.8 s vs 36.4 s, each with its drafter. 4.5% less on average, inside the draw spread: about level.

Artus asked what that result is worth. Two things: the speed, and the two cards our server doesn't need. Both come at a price in fidelity, and this note states that as plainly as the speed.

## Summary

- **About level with four cards, on two.** Our server needs 34.8 s of model time per task on our agent test. NVIDIA's FP4 version on 4 cards needs 36.4 s, with the drafter set the same way. Theirs is 1.047x ours: ours takes 4.5% less model time on average.
- **That 4.5% is not a resolved speed-up.** It is 1.6 s per task, with a 95% interval from 4.8 s slower to 8.1 s faster, because NVIDIA's side has only three draws: 39.8, 34.7 and 34.8 s per task. Ours ranged from 27.8 to 44.6 s over 54 draws.
- **Two cards not bought.** NVIDIA raised the RTX PRO 6000 Blackwell's list price to $16,000 in August, and the lowest US retail price we found was $17,063 on 4 November. The two cards our server doesn't need come to about $32,000 at that list price. That covers the cards only, and it holds for our workstation, not for any two cards.
- **The price is fidelity.** Our weights are diffbot's 3-bit pack, and they deviate measurably from the original model. On diffbot's measurement, the most likely next token differs from the original's at 7.1% of positions in neutral text, against 3.0% when the original is simply run twice. NVIDIA reports its 4-bit version within 0.7 points of the original on six benchmarks; ours has no benchmark score of its own, and very likely deviates more, though no one has measured both on the same text.

## What we compare

- **Ours:** DeepSeek-V4.1-Flash-1017 as [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000), served by vLLM with diffbot's serving recipe and our parts, on two RTX PRO 6000 Blackwell Workstation Edition cards at home. Even at 3 bits, the model doesn't fit on two cards, so the CPU, a 64-core Threadripper PRO 9985WX with 512 GB of RAM, computes some of the experts. 54 draws, on 5 November.
- **NVIDIA's FP4:** NVIDIA's 4-bit (NVFP4) version of the same model, served by vLLM on four RTX PRO 6000 Blackwell Server Edition cards on AWS. 3 draws, on 7 November.
- **The drafter:** both use DeepSeek's DSpark drafter, guessing 5 tokens ahead, with its guesses sampled rather than taken greedily.
  - NVIDIA's setup got the tuning we could afford: a short screen of 3, 5 and 7 tokens ahead on the 4-card setup, with one to four requests per kind of prompt and length. 5 won on median decode rate, and 3 tied within the screen's noise.
  - Ours kept 5 after a test against 7 on 1 November.
  - NVIDIA validated DSpark with SGLang. These runs used vLLM's route for it, which NVIDIA's card doesn't list as validated.
  - A second 4-card run with vLLM's default draft setting, the drafter's top guess, took 42.8 s. We compare against the faster run, whose drafting matches ours.
- **The test:** our 6-task agent test: two questions about documents of 128,000 and 200,000 tokens, and four coding tasks with tools. One request at a time, temperature 1.0. A draw is all six tasks once.
- **The clock:** model time is the server's time to first token plus its decode time, summed over a task's requests. It leaves out tool calls and the network. That matters here: the AWS runs reached the tools on our Mac through a tunnel, so their wall time per task (59.3 s, against our 39.0 s) includes that tunnel, and we don't compare it.

## Draw by draw

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-two-cards-draw-by-draw">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Dot plot of model seconds per task, one dot per draw of our 6-task agent test. Ours on 2 cards: 54 draws from 27.8 to 44.6 s, mean 34.8 s. NVIDIA's FP4 on 4 cards: 3 draws, 39.8, 34.7, 34.8 s, mean 36.4 s.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="60.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Two cards, level with four: model time per task, draw by draw</text>
<text x="60.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash-1017 on our 6-task agent test · server clock · each dot is one draw of all 6 tasks · lower is better</text>
<line x1="168.6" x2="168.6" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="168.6" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">26 s</text>
<line x1="265.7" x2="265.7" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="265.7" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">28 s</text>
<line x1="362.9" x2="362.9" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="362.9" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">30 s</text>
<line x1="460.0" x2="460.0" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="460.0" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">32 s</text>
<line x1="557.1" x2="557.1" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="557.1" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">34 s</text>
<line x1="654.3" x2="654.3" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="654.3" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">36 s</text>
<line x1="751.4" x2="751.4" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="751.4" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">38 s</text>
<line x1="848.6" x2="848.6" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="848.6" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">40 s</text>
<line x1="945.7" x2="945.7" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="945.7" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">42 s</text>
<line x1="1042.9" x2="1042.9" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="1042.9" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">44 s</text>
<line x1="1140.0" x2="1140.0" y1="120" y2="560" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="1140.0" y="582.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">46 s</text>
<g><title>Ours, 2 cards, one draw: 27.8 s per task</title><circle cx="255.3" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="255.3" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 28.6 s per task</title><circle cx="293.5" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="293.5" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 28.9 s per task</title><circle cx="307.9" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="307.9" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 29.1 s per task</title><circle cx="317.1" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="317.1" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 30.3 s per task</title><circle cx="378.1" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="378.1" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 30.5 s per task</title><circle cx="386.3" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="386.3" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 30.7 s per task</title><circle cx="395.0" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="395.0" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 31.2 s per task</title><circle cx="420.2" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="420.2" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 31.2 s per task</title><circle cx="421.3" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="421.3" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 31.5 s per task</title><circle cx="435.8" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="435.8" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 31.7 s per task</title><circle cx="444.5" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="444.5" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 32.0 s per task</title><circle cx="462.0" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="462.0" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 32.3 s per task</title><circle cx="473.3" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="473.3" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 32.3 s per task</title><circle cx="474.9" cy="236.0" r="12.5" style="fill:transparent"/><circle cx="474.9" cy="236.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 32.4 s per task</title><circle cx="481.4" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="481.4" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 32.5 s per task</title><circle cx="485.1" cy="278.0" r="12.5" style="fill:transparent"/><circle cx="485.1" cy="278.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 32.5 s per task</title><circle cx="485.7" cy="222.0" r="12.5" style="fill:transparent"/><circle cx="485.7" cy="222.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 32.9 s per task</title><circle cx="505.3" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="505.3" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 33.0 s per task</title><circle cx="507.8" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="507.8" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 33.0 s per task</title><circle cx="508.3" cy="236.0" r="12.5" style="fill:transparent"/><circle cx="508.3" cy="236.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 33.0 s per task</title><circle cx="508.7" cy="278.0" r="12.5" style="fill:transparent"/><circle cx="508.7" cy="278.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 33.1 s per task</title><circle cx="512.1" cy="222.0" r="12.5" style="fill:transparent"/><circle cx="512.1" cy="222.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 33.3 s per task</title><circle cx="523.6" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="523.6" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 34.1 s per task</title><circle cx="564.0" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="564.0" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 34.2 s per task</title><circle cx="569.2" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="569.2" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 34.4 s per task</title><circle cx="577.3" cy="236.0" r="12.5" style="fill:transparent"/><circle cx="577.3" cy="236.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 34.4 s per task</title><circle cx="578.3" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="578.3" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 34.9 s per task</title><circle cx="599.7" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="599.7" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 35.0 s per task</title><circle cx="603.9" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="603.9" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 35.0 s per task</title><circle cx="605.7" cy="236.0" r="12.5" style="fill:transparent"/><circle cx="605.7" cy="236.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 35.2 s per task</title><circle cx="614.6" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="614.6" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 35.3 s per task</title><circle cx="619.9" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="619.9" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 35.4 s per task</title><circle cx="626.7" cy="236.0" r="12.5" style="fill:transparent"/><circle cx="626.7" cy="236.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 36.0 s per task</title><circle cx="656.3" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="656.3" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 36.1 s per task</title><circle cx="657.5" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="657.5" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 36.1 s per task</title><circle cx="659.3" cy="236.0" r="12.5" style="fill:transparent"/><circle cx="659.3" cy="236.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 36.2 s per task</title><circle cx="662.4" cy="278.0" r="12.5" style="fill:transparent"/><circle cx="662.4" cy="278.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 36.4 s per task</title><circle cx="674.0" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="674.0" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 37.1 s per task</title><circle cx="709.6" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="709.6" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 37.2 s per task</title><circle cx="712.3" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="712.3" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 37.2 s per task</title><circle cx="713.5" cy="236.0" r="12.5" style="fill:transparent"/><circle cx="713.5" cy="236.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 37.3 s per task</title><circle cx="719.0" cy="278.0" r="12.5" style="fill:transparent"/><circle cx="719.0" cy="278.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 37.5 s per task</title><circle cx="729.0" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="729.0" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 38.0 s per task</title><circle cx="749.8" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="749.8" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 38.4 s per task</title><circle cx="770.7" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="770.7" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 38.6 s per task</title><circle cx="779.4" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="779.4" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 38.7 s per task</title><circle cx="783.6" cy="236.0" r="12.5" style="fill:transparent"/><circle cx="783.6" cy="236.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 39.1 s per task</title><circle cx="803.1" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="803.1" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 39.4 s per task</title><circle cx="818.9" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="818.9" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 39.8 s per task</title><circle cx="838.0" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="838.0" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 40.1 s per task</title><circle cx="852.6" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="852.6" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 40.3 s per task</title><circle cx="863.3" cy="264.0" r="12.5" style="fill:transparent"/><circle cx="863.3" cy="264.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 42.1 s per task</title><circle cx="949.2" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="949.2" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 2 cards, one draw: 44.6 s per task</title><circle cx="1072.7" cy="250.0" r="12.5" style="fill:transparent"/><circle cx="1072.7" cy="250.0" r="6.5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="594.8" x2="594.8" y1="205.5" y2="294.5" style="stroke:var(--ink,#0b0b0b);stroke-width:2"/>
<text x="594.8" y="195.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">mean 34.8 s</text>
<text x="60.0" y="320.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">Ours: 3-bit, 2 Workstation cards at home, 54 draws (5 Nov)</text>
<g><title>NVIDIA's FP4, 4 cards, one draw: 34.7 s per task</title><circle cx="592.8" cy="470.0" r="12.5" style="fill:transparent"/><circle cx="592.8" cy="470.0" r="6.5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>NVIDIA's FP4, 4 cards, one draw: 34.8 s per task</title><circle cx="595.2" cy="484.0" r="12.5" style="fill:transparent"/><circle cx="595.2" cy="484.0" r="6.5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>NVIDIA's FP4, 4 cards, one draw: 39.8 s per task</title><circle cx="836.4" cy="470.0" r="12.5" style="fill:transparent"/><circle cx="836.4" cy="470.0" r="6.5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="674.8" x2="674.8" y1="439.5" y2="500.5" style="stroke:var(--ink,#0b0b0b);stroke-width:2"/>
<text x="674.8" y="429.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">mean 36.4 s</text>
<text x="60.0" y="526.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">NVIDIA's FP4: 4-bit, 4 Server cards on AWS, 3 draws (7 Nov)</text>
<text x="60.0" y="617.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Both use DeepSeek's DSpark drafter, 5 tokens ahead, with sampled drafts. The means differ by 1.6 s per task; the standard error of that difference is 1.7 s.</text>
<text x="60.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Model time is the server's time to first token plus decode. It leaves out tools and network, so the AWS runs' tunnel to our tools doesn't count.</text>
<text x="60.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Ours serves diffbot's 3-bit pack: it deviates measurably from the original model and has no benchmark score of its own; NVIDIA reports its FP4 within 0.7 points.</text>
</svg>
</section></div>
{:/nomarkdown}

- **Ours:** 54 draws, mean 34.8 s per task, standard deviation 3.6 s, from 27.8 to 44.6 s.
- **NVIDIA's FP4:** 3 draws, 39.8, 34.7 and 34.8 s, mean 36.4 s.
- **The difference in means,** 1.6 s per task, is smaller than its standard error, 1.7 s. Most of that error comes from having 3 draws on NVIDIA's side. The 95% interval runs from ours 4.8 s slower to 8.1 s faster per task (Welch's t, 2.4 degrees of freedom), and more 4-card draws could move their mean either way. So: about level, with 4.5% less model time on average for ours, not a measured speed-up.
- **Ours isn't faster by thinking less.** It decoded 46.2K tokens per draw at 259.4 tokens/s, against 44.7K at 244.8 tokens/s for NVIDIA's version.

## What two cards save

- **NVIDIA's list price** went to $16,000 per card in August 2026, about double the launch price of around $8,000 ([Wccftech](https://wccftech.com/nvidia-96-gb-rtx-pro-6000-blackwell-now-costs-16000-usd-double-its-original-price/), [Viperatech](https://viperatech.com/news-details/nvidia-raises-rtx-pro-6000-blackwell-pricing-to-16000)). It applies to the Workstation and Max-Q Workstation editions.
- **Retail:** the lowest US price we found was $17,063, on 4 November, for a Max-Q card ([gpuprix](https://gpuprix.com/us/gpus/rtx-pro-6000-blackwell)).
- **So the two cards our server doesn't need come to about $32,000 at that list price.**
- **Cards only.** Our server leans on the rest of the workstation: the CPU computes the experts that don't fit on the cards, with 64 cores and 512 GB of RAM, which a 4-card machine may not need. We don't price the whole machine, its power or the work of building the Frankenstein. The editions differ too: Workstation cards at home, Server Edition cards on AWS.
- **Not any two cards.** On AWS's own 2 cards, with a smaller CPU (2 × 11 cores of a 24-core Xeon for the experts) and diffbot's recipe as published, the same 3-bit pack needed 58.9 s per task, 1.6x the 4-card time. We haven't split how much of the gap down to our 34.8 s is the home hardware and how much is our parts.

*Correction, 8 November:* a run we already had splits that gap, roughly. On our box, the same recipe as published needed about 40.5 s per task on 31 October (3 draws, on the client's clock), and our parts took it to 34.8 s. So most of the gap, about 18.4 s, likely comes with the hardware, and about 5.7 s with our parts. With 3 draws of the recipe, from 35.4 to 47.1 s, our parts' share isn't resolved: its 95% interval runs from our parts costing 8.7 s to saving 20.2 s. The recipe leaves the experts that don't fit on the cards to the CPU, and AWS's 2-card machine gives it 22 cores, against 56 of our 64. That the CPU and its memory are most of the hardware share is our inference: the cards are the same chip, but the machines differ in other ways too, and we haven't measured their parts one by one. [Where We Stand](/frankenstein/) has the details.

## What it costs in fidelity

diffbot measured their pack against the original DeepSeek-V4.1-Flash-1017 and published the results with the pack. Below: the KL divergence from the original in nats (lower is better), and how often the most likely next token agrees with the original's.

| | Neutral text | Code | Agentic | kyuz0's short100 |
|---|---|---|---|---|
| diffbot's 3-bit pack, as served | 0.0521 · 92.9% | 0.0310 · 95.9% | 0.0107 · 98.2% | 0.0339 · 95.2% |
| The original, run a second time (noise floor) | 0.0082 · 97.1% | 0.0050 · 98.2% | 0.0047 · 98.8% | — |

- **The KL figures are lower bounds.** They are computed from the top 512 tokens at each position, with the rest merged into one bucket.
- **The pack's KL is about 6 times the noise floor on neutral text,** and about 2 times on agentic text.
- **diffbot measured the pack on their serving stack.** We haven't repeated it on ours.
- **Against NVIDIA's 4-bit version, ours very likely deviates more, but that isn't measured.** NVIDIA reports its version within 0.7 points of the original on six benchmarks, and ours is the one at 3 bits with no benchmark score of its own. We have no KL for NVIDIA's version on the same text, and its experts round activations to 4 bits as well as weights, so we can't put a number on the gap.
- **On our own agent test, both passed 83% of tasks:** 270 of our 324 task runs, and 15 of NVIDIA's 18. That's too few tasks on their side to rank, and the test checks whether a task gets done, not fidelity.

## What it means

For one person running one agent at a time, our 2-card workstation now keeps pace with NVIDIA's 4-bit version on four cards on our test, and the two cards it doesn't need listed at about $32,000 together. The trade is fidelity: a 3-bit model whose next-token choices differ from the original's measurably more often than the original's own run-to-run noise. Whether that matters depends on the work, and our small test can't settle it. [Where We Stand](/frankenstein/) keeps both rows current as new draws land.

## Credits

- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and its DSpark drafter.
- **NVIDIA** for the FP4 version.
- **vLLM** for the engine of both setups.
- **diffbot** for the EXL3 3-bit pack, the serving recipe our server builds on, and the fidelity measurements quoted here.
- **turboderp** for the EXL3 format.
- **kyuz0** for the short100 reference panel, **AtomicChat** for the corpus protocol and **AtomicBot-ai** for the KL scorer diffbot used.
- **kacper-daftcode** for vLLM-Moet's SM120 overlap, still served.
- **Prices:** Wccftech, Viperatech and gpuprix.

## AI assistance

AI agents (Claude and GPT models) ran the measurements quoted here and drafted this note, and an independent AI reviewer checked it against the receipts before publication. Artus asked for it and set its angle.

*Corrected 8 November: the gap from diffbot's recipe on AWS down to our server is now split, roughly, into hardware and our parts, with the same recipe's run on our box (under "What two cards save").*
