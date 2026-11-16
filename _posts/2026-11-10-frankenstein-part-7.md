---
title: 'The Frankenstein, Part 7: Block Verification, 0.7% Faster Decoding, Not Enough to Keep'
description: 'Part 7 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. Block verification (Sun et al., Google Research) judges a drafted block as a whole. With the upstream vLLM fix #61161, which we backported and which passes its tests on SM120, it kept 1.36% more tokens per step from the DSpark drafter but made each step 0.67% slower: decode 0.69% faster net, against the paper''s 5 to 8% on its own tasks. We did not keep it.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell, speculative-decoding]
---

*10 November 2026. A progress note from a running campaign, following [Part 6](/2026/11/08/frankenstein-part-6.html). The measurements below are of the decode step, not agent task time. Not a peer-reviewed paper.*

*Rewritten 16 November 2026 with what later parts of the series showed. The original version is [on GitHub](https://github.com/artuskg/artuskg.github.io/blob/518d93f/_posts/2026-11-10-frankenstein-part-7.md). Its first title was "Block Verification, Fixed, Measured and Parked".*

Part 7 of our Frankenstein: we tried block verification on the DSpark drafter of our 2× RTX PRO 6000 DeepSeek-V4.1-Flash server, one request at a time.

Each verify step kept 1.36% more of the drafter's tokens but took 0.67% longer, so decode ran only 0.69% faster. The paper reports 5 to 8% on its own tasks. We didn't keep it: 1.36% more tokens per step was under the 2% bar we set before the run. A test of model time per task couldn't have shown a gain this small anyway ([Part 12](/2026/11/15/frankenstein-part-12.html)).

It first needed an upstream fix. Before [vLLM #61161](https://github.com/vllm-project/vllm/pull/61161), vLLM's block verification sampled from a biased distribution. We backported the fix, and it passes its tests on SM120.

The setup is unchanged: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000) and its serving recipe, plus our own parts from Parts 1 to 5. DeepSeek's DSpark drafter proposes 5 tokens ahead, and each verify step checks them against the full model.

## What block verification is

A drafter guesses several tokens ahead, and the full model checks them all in one step. The usual rule accepts the guesses one at a time and stops at the first rejection. [Block verification](https://arxiv.org/abs/2403.10444) (Sun, Mendlovic, Leviathan, Aharoni, Ro, Beirami and Suresh, Google Research) judges the drafted block as a whole. It keeps the guarantee that the output follows the full model's own distribution, and on average it never accepts fewer tokens per step than the usual rule. The paper reports wall-clock gains of 5 to 8% on its tasks. vLLM offers it as `rejection_sample_method: "block"`, and our served engine uses the usual rule.

## The fix it needed first

In vLLM's version, a position that the drafter guessed in one round but that wasn't committed could be drafted and judged again in the next round with the same random draws as before. Those draws were already conditioned on the earlier decision, so the output was biased. SeverinVisionary reported it ([#61114](https://github.com/vllm-project/vllm/issues/61114)), and DimensionSTP fixed it upstream on 15 October in #61161, reviewed by TheEpicDolphin and merged by njhill. Under the fix, each round gets fresh draws.

- **What we ran is the merged change.** #61161 applied to our engine's vLLM with no conflict. Its four code files are byte-identical at our version and at the PR's base, and none of our engine's patches touches them.
- **A CPU check first.** A NumPy port of the verification, run on the PR's own test setup, showed the same bias: the chance that the third token was 0 came out at 0.420 where it should be 0.5, and at 0.353 where it should be 0.3. The PR had measured 0.417 and 0.356 on real generation. With the fix, every position passed.
- **On our cards.** The PR's two regression tests (6 cases) pass 6 of 6 on SM120 inside our serving image. Without the fix, our engine's build gives the predicted 4 failures and 2 passes: both block-verification cases fail their distribution test, the two cases that check the draft seeds fail, and the two standard cases pass.

## The result

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

Block verification did keep more tokens per step, as the paper says it should. But each step also took about 0.7% longer, which ate about half of the gain, and net decode speed rose 0.69%. Why the step got slower isn't measured: block verification adds work after each step's main forward pass, and we only timed the step as a whole. Why our net gain is so much smaller than the paper's isn't measured either.

## How we decided

Before any GPU time, we set the rule: go on to a task-time test only if tokens per verify step rose by at least 2%, and by more than time per verify step. Both arms ran on the fixed vLLM, standard against block. Each start was a fresh engine, in the order standard, block, block, standard, with 6 draws of our 6-task agent test per start, so 12 per arm. Sampling was at temperature 1.0 and top-p 0.95, one request at a time, and both measures come from the server's own counters. It ran on 9 November, from 11:10 to 13:05 UTC, with no outside requests during any start. 1.36% is under 2%, so we stopped there.

## What later parts showed

- **The drafter itself is the big lever.** Alone, it cuts model time per task 2.3x (32.5 against 73.8 s), and with 8 sessions at once it gives 34% more output at about the same tokens per task ([Part 10](/2026/11/14/frankenstein-part-10.html)). How its guesses get checked moved decode by 0.69% here.
- **Another change to verification didn't pay either.** Adaptive verification decides each step how much of the draft to check. With 8 sessions, it made each step 41% shorter, but each step kept 45% fewer tokens, so output fell 8.4% ([Part 13](/2026/11/16/frankenstein-part-13.html)). It stays off too.

## Limits

- **One engine, one drafter setting:** our engine with DSpark at 5 tokens and sampled drafts. A drafter that accepts more per step could change the picture, and that's when we'd revisit it.
- **One request at a time.** Several sessions at once weren't tested.
- **The decode step only,** not agent task time.

## Credits

- **Ziteng Sun, Uri Mendlovic, Yaniv Leviathan, Asaf Aharoni, Jae Hun Ro, Ahmad Beirami and Ananda Theertha Suresh** (Google Research) for block verification.
- **SeverinVisionary** for the bug report (vLLM #61114), **DimensionSTP** for the fix (#61161), **TheEpicDolphin** for reviewing it and **njhill** for merging it.
- **vLLM** for the engine and its block verification.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and its DSpark drafter.
- **diffbot** for the EXL3 3-bit pack and the serving recipe our server builds on.
- **turboderp** for the EXL3 format.

## AI assistance

AI agents (Claude and GPT models) backported the fix, ran the measurements quoted here and drafted this note, and an independent AI reviewer checked it against the receipts before publication. [Where We Stand](/frankenstein/) lists what is in our server today.
