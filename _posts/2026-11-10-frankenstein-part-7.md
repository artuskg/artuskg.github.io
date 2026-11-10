---
title: 'The Frankenstein, Part 7: Block Verification, Fixed, Measured and Parked'
description: 'Part 7 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. We tried block verification for the DSpark drafter. It needed an upstream vLLM fix first (#61161), which we backported and which passes its tests on SM120. On our agent test, block verification raised tokens per verify step by 1.36% and time per step by 0.67%, a net decode gain of 0.69%. The 1.36% is below the 2% bar for tokens per verify step that we set before the run, so we parked it.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell, speculative-decoding]
---

*10 November 2026. A progress note from a running campaign, following [Part 6](/2026/11/08/frankenstein-part-6.html). The measurements below are of the decode step, not agent task time. Not a peer-reviewed paper.*

Part 7 of our Frankenstein: we tried block verification for the DSpark drafter on our 2× RTX PRO 6000 DeepSeek-V4.1-Flash server.

It needed an upstream vLLM fix first, which works on SM120. Tokens per verify step +1.36%, under the 2% bar we set before the run, so it's parked.

The setup is unchanged: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000) and its serving recipe, plus our own parts from Parts 1 to 5, one request at a time. DeepSeek's DSpark drafter proposes 5 tokens ahead, and each verify step checks them against the full model.

## Summary

- **Block verification needed a fix first, and the fix works on SM120.** vLLM's block verification reused random draws across rounds, which biased what it sampled. [vLLM #61161](https://github.com/vllm-project/vllm/pull/61161) fixed that upstream on 15 October. We backported it whole onto our engine's vLLM, and its regression tests pass on our cards, while our engine's own build gives the predicted 4 failures and 2 passes.
- **It isn't worth keeping on our server.** On our 6-task agent test, block verification raised tokens per verify step by 1.36% and time per verify step by 0.67%, so decode ran 0.69% faster net.
- **Below our bar.** Before the run, we had set a gain of at least 2% in tokens per verify step as the minimum worth a task-time test. 1.36% is under it, so block verification is parked. By the estimate we set beside the bar, this gain would save about 0.2 s of the 34.8 s of model time per task ([Part 6](/2026/11/08/frankenstein-part-6.html)).

## What block verification is

A drafter guesses several tokens ahead, and the full model checks them all in one step. The usual rule accepts the guesses one at a time and stops at the first rejection. [Block verification](https://arxiv.org/abs/2403.10444) (Sun, Mendlovic, Leviathan, Aharoni, Ro, Beirami and Suresh, Google Research) judges the drafted block as a whole. It keeps the guarantee that the output follows the full model's own distribution, and on average it never accepts fewer tokens per step than the usual rule. The paper reports wall-clock gains of 5 to 8% on its tasks. vLLM offers it as `rejection_sample_method: "block"`, and our served engine uses the usual rule.

## The fix we needed first

In vLLM's version, a position that the drafter guessed in one round but that wasn't committed could be drafted and judged again in the next round with the same random draws as before. Those draws were already conditioned on the earlier decision, so the output was biased. SeverinVisionary reported it ([#61114](https://github.com/vllm-project/vllm/issues/61114)), and DimensionSTP fixed it in #61161, reviewed by TheEpicDolphin and merged by njhill. Under the fix, each round gets fresh draws.

- **The backport.** SilentMountain, one of our agents, applied #61161 to our engine's vLLM with no conflict. Its four code files are byte-identical at our version and at the PR's base, so what we ran is the merged change itself. None of our engine's patches touches those files.
- **A CPU check first.** A NumPy port of the verification, run on the PR's own test setup, showed the same bias: the chance that the third token was 0 came out at 0.420 where it should be 0.5, and at 0.353 where it should be 0.3. The PR had measured 0.417 and 0.356 on real generation. With the fix, every position passed.
- **The unit tests on our cards.** We ran the PR's two regression tests (6 cases) on SM120 inside our serving image, twice: with the fix, 6 of 6 passed. Our engine's own build gave the predicted result in all 6: both block-verification cases failed their distribution test, the two standard cases passed, and the two cases that check the draft seeds failed.

## The rule, set before the run

SilentMountain wrote the screen and its rule before any GPU time: two arms on the fixed base, standard against block, each start a fresh engine, in the order standard, block, block, standard, with 6 draws of our agent test per start, so 12 per arm. The test is our 6-task agent workload, sampled at temperature 1.0 and top-p 0.95, one request at a time. Tokens per verify step and time per verify step come from the server's own counters for each draw.

- **g** is the change in tokens per verify step, block against standard, and **h** the change in time per verify step.
- **Stop** if g is under +2%, or if h is at least g. Otherwise, a task-time test follows.
- With 12 draws per arm, the planned standard error of g was about 0.8%. So a true gain of 5% would very likely clear the bar, and one near 2% would be a coin toss.

GentleSparrow, our research lead, ran it on 9 November. A first attempt that morning was cut short when Artus resumed using the machine, and it was rerun whole from 11:10 to 13:05 UTC. All four starts were valid, with no outside requests during any of them.

## The run

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-block-verification">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600" role="img" aria-label="Bar chart of block verification against standard verification, 12 draws per arm. Tokens per verify step +1.36%, below the +2% bar set before the run; time per verify step +0.67%; net decode speed +0.69%.">
<rect width="1200" height="600" style="fill:var(--surface,#fcfcfb)"/>
<text x="60.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Block verification on our server: correct, but too small a gain to keep</text>
<text x="60.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Change with block against standard verification · DeepSeek-V4.1-Flash-1017, DSpark drafter at 5 tokens · our 6-task agent test, one request at a time</text>
<text x="60.0" y="102.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Server clock · 12 draws per arm, engine starts in the order standard, block, block, standard · 9 November · both arms carry vLLM #61161's fix</text>
<line x1="400.0" x2="400.0" y1="140" y2="470" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="400.0" y="492.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">0.0%</text>
<line x1="544.0" x2="544.0" y1="140" y2="470" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="544.0" y="492.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">+0.5%</text>
<line x1="688.0" x2="688.0" y1="140" y2="470" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="688.0" y="492.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">+1.0%</text>
<line x1="832.0" x2="832.0" y1="140" y2="470" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="832.0" y="492.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">+1.5%</text>
<line x1="976.0" x2="976.0" y1="140" y2="470" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="976.0" y="492.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">+2.0%</text>
<line x1="1120.0" x2="1120.0" y1="140" y2="470" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="1120.0" y="492.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">+2.5%</text>
<text x="60.0" y="193.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">Tokens per verify step</text>
<text x="60.0" y="215.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">3.7607 → 3.8120</text>
<g><title>Tokens per verify step: standard 3.7607, block 3.8120, change +1.36%, 2.1 standard errors</title><rect x="400" y="148.0" width="720.0" height="94" style="fill:transparent"/><rect x="400" y="178.0" width="392.9" height="34" rx="4" style="fill:var(--s1,#2a78d6)"/></g>
<text x="804.9" y="201.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">+1.36% (2.1 SE)</text>
<text x="60.0" y="303.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">Time per verify step</text>
<text x="60.0" y="325.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">14.110 → 14.204 ms</text>
<g><title>Time per verify step: standard 14.110 ms, block 14.204 ms, change +0.67%, 1.8 standard errors</title><rect x="400" y="258.0" width="720.0" height="94" style="fill:transparent"/><rect x="400" y="288.0" width="191.9" height="34" rx="4" style="fill:var(--s2,#eb6834)"/></g>
<text x="603.9" y="311.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">+0.67% (1.8 SE), a cost</text>
<text x="60.0" y="413.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">Net decode speed</text>
<text x="60.0" y="435.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">tokens per second</text>
<g><title>Net decode speed: +0.69%, from the two changes above</title><rect x="400" y="368.0" width="720.0" height="94" style="fill:transparent"/><rect x="400" y="398.0" width="199.7" height="34" rx="4" style="fill:var(--s1,#2a78d6)"/></g>
<text x="611.7" y="421.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">+0.69%</text>
<line x1="976.0" x2="976.0" y1="134" y2="242" style="stroke:var(--ink,#0b0b0b);stroke-width:2;stroke-dasharray:6 5"/>
<text x="976.0" y="128.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">+2% bar, set before the run</text>
<line x1="400.0" x2="400.0" y1="140" y2="470" style="stroke:var(--ink2,#52514e);stroke-width:1.5"/>
<text x="60.0" y="524.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">The rule, set before the run: stop if tokens per verify step rise by less than 2%, or if time per verify step rises by as much or more.</text>
<text x="60.0" y="542.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Change = block arm / standard arm − 1, on the means of 12 draws each. Net decode speed = (1 + tokens change) / (1 + time change) − 1. SE: standard errors of the difference.</text>
<text x="60.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">This is the decode step only, not task time. One engine, one drafter setting (5 tokens), one request at a time.</text>
</svg>
</section></div>
{:/nomarkdown}

| Arm, 12 draws each | Tokens per verify step (SD) | ms per verify step (SD) |
|---|---:|---:|
| Standard (as served) | 3.7607 (0.0486) | 14.110 (0.138) |
| Block | 3.8120 (0.0679) | 14.204 (0.112) |
| **Block against standard** | **+1.36%** (+0.0513, 2.1 SE) | **+0.67%** (+0.094 ms, 1.8 SE) |

Net decode speed in tokens per second, derived from the two changes, rose by 0.69%. Block verification did accept more tokens per step, as the paper says it should, but each step also took about 0.7% longer (1.8 SE), eating about half of the gain. g is under 2%, so the reading is *stop*, and the lead parked block verification on our engine. The fix's correctness result stands on its own.

## Limits

- **One engine, one drafter setting:** our engine with DSpark at 5 tokens and sampled drafts. A drafter that accepts more per step could change the picture, and that's when we'd revisit it.
- **One request at a time.** Batches weren't tested.
- **The decode step only,** not agent task time. The 0.2 s per task is our planning estimate from these two changes, not a measurement.
- **Why the step got slower isn't measured.** Block verification adds work after each step's main forward pass, and we only timed the step as a whole.

## Credits

- **Ziteng Sun, Uri Mendlovic, Yaniv Leviathan, Asaf Aharoni, Jae Hun Ro, Ahmad Beirami and Ananda Theertha Suresh** (Google Research) for block verification.
- **SeverinVisionary** for the bug report (vLLM #61114), **DimensionSTP** for the fix (#61161), **TheEpicDolphin** for reviewing it and **njhill** for merging it.
- **vLLM** for the engine and its block verification.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and its DSpark drafter.
- **diffbot** for the EXL3 3-bit pack and the serving recipe our server builds on.
- **turboderp** for the EXL3 format.

## AI assistance

AI agents (Claude and GPT models) backported the fix, ran the measurements quoted here and drafted this note, and an independent AI reviewer checked it against the receipts before publication. [Where We Stand](/frankenstein/) lists what is in our server today.
