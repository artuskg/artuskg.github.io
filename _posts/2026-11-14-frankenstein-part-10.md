---
title: 'The Frankenstein, Part 10: The Drafter Is Worth a Third More Throughput at 8 Sessions, and Two Changes That Did Not Help'
description: 'Part 10 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. On the served setup, with its two-tier KV cache (cards plus host RAM), the DSpark drafter guessing 5 tokens ahead finishes about a third more graded tasks per hour at 8 agent sessions than no drafter (211 against 159, at about the same tokens per task), and alone it cuts model time per task 2.3x. Guessing 3 or 2 tokens ahead added under 1% in tasks per hour, and a change to how vLLM frees cached conversations had nothing left to fix once the KV cache had its host-RAM half. The served setup is unchanged.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell, speculative-decoding]
---

*14 November 2026. A progress note from a running campaign, following [Part 9](/2026/11/13/frankenstein-part-9.html). Like Parts 8 and 9, it is about several users at once. Not a peer-reviewed paper.*

*Updated 16 November 2026: tokens per task now stand beside every throughput figure, as [Part 13](/2026/11/16/frankenstein-part-13.html) does, which shows the drafter's +34% is speed and most of 3 ahead's +3.5% was longer answers; the KV cache is named as two-tier, and a line links Part 13's adaptive verification. The previous version is [on GitHub](https://github.com/artuskg/artuskg.github.io/blob/518d93f/_posts/2026-11-14-frankenstein-part-10.md).*

Part 10 of our Frankenstein: what the drafter is worth with many users.

On our 2× RTX PRO 6000 DeepSeek-V4.1-Flash server, with 8 agent sessions, DeepSeek's DSpark drafter (5 tokens ahead) finishes 211 graded tasks per hour against 159 without it, and writes 440 output tok/s against 328: +34%, at about the same tokens per task (7,516 and 7,396). Alone, it takes 2.3x less model time per task.

The setup: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000) and its serving recipe, our own parts from Parts 1 to 5, and since Part 9 a two-tier KV cache: the cards plus host RAM. DeepSeek's DSpark drafter guesses 5 tokens ahead.

## Summary

- **The drafter still pays with 8 sessions at once.** A drafter is a small model that guesses a few tokens ahead; the big model checks all the guesses in one step, so it changes the speed, not the odds of what the model writes. With 8 agent sessions at once, our server wrote **440 output tokens per second with DSpark guessing 5 ahead, against 328 without a drafter: 34% more**. Graded tasks per hour rose by about a third too, from 159 to 211. Tokens per task were within 2% across the runs with 5, 2 and no guessed tokens (7,396 to 7,541), so this gain is speed, not answer length.
- **Alone it is worth more:** at 1 session, a task took 32.5 s of model time with the drafter and 73.8 s without it, **2.3x less**.
- **Guessing fewer tokens ahead didn't help.** We had expected that with 8 sessions sharing each step, shorter guesses might waste less work. 3 ahead gave 3.5% more output than 5, under the 5% we had set beforehand as the bar for a change, but its run also wrote 2.8% more tokens per task, so most of that is longer answers: tasks per hour rose 0.7%. It was about level at 1 session (2% slower, in one round). 2 ahead gave 0.9% more output at 8 and was 34% slower at 1. **We keep 5.**
- **A change to how vLLM frees cached conversations had nothing left to fix.** It targeted the prefix-cache collapse we saw at 8 sessions before the KV cache had its host-RAM half (60.7% of prompt tokens found in the cache). With the two-tier KV cache alone, 94.8% are found already. On top of it, the change tied: 212 against 208 tasks per hour at 8 sessions, 219 against 220 at 16 (tokens per task weren't reported for this test). **Not adopted.**
- **No quality difference detected** in either test.

## What the drafter is worth

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-drafter-worth">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="1200" height="700" role="img" aria-label="Bar chart of speed against no drafter, for the DSpark drafter guessing 5, 3 or 2 tokens ahead. 5 ahead (served): 2.27 times at 1 session, 1.34 times at 8 sessions; 3 ahead: 2.23 times at 1 session, 1.39 times at 8 sessions; 2 ahead: 1.70 times at 1 session, 1.36 times at 8 sessions. No drafter is 1.">
<rect width="1200" height="700" style="fill:var(--surface,#fcfcfb)"/>
<text x="60.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">What the drafter is worth: 2.3× alone, +34% with 8 sessions</text>
<text x="60.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Speed against no drafter · DeepSeek-V4.1-Flash-1017 on 2× RTX PRO 6000, our served setup with the two-tier KV cache · our 6-task agent test</text>
<text x="60.0" y="102.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">1 session: model time per task (one step each) · 8 sessions: output tokens per second over 6 steps</text>
<rect x="60" y="122" width="14" height="14" rx="3" style="fill:var(--s1,#2a78d6)"/>
<text x="82.0" y="134.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">1 session</text>
<rect x="260" y="122" width="14" height="14" rx="3" style="fill:var(--s2,#eb6834)"/>
<text x="282.0" y="134.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">8 sessions at once</text>
<line x1="460" x2="488" y1="129" y2="129" style="stroke:var(--ink2,#52514e);stroke-width:1.5;stroke-dasharray:6 5"/>
<text x="496.0" y="134.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">no drafter = 1×</text>
<line x1="110" x2="1120" y1="560.0" y2="560.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="564.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0×</text>
<line x1="110" x2="1120" y1="483.0" y2="483.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="487.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0.5×</text>
<line x1="110" x2="1120" y1="406.0" y2="406.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="410.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">1×</text>
<line x1="110" x2="1120" y1="329.0" y2="329.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="333.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">1.5×</text>
<line x1="110" x2="1120" y1="252.0" y2="252.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="256.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">2×</text>
<line x1="110" x2="1120" y1="175.0" y2="175.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="179.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">2.5×</text>
<g><title>5 ahead (served), 1 session, model time per task: 2.27× no drafter</title><rect x="157.3" y="202.3" width="120" height="357.7" style="fill:transparent"/><path d="M157.3,560.0 V214.3 Q157.3,210.3 161.3,210.3 H273.3 Q277.3,210.3 277.3,214.3 V560.0 Z" style="fill:var(--s1,#2a78d6)"/></g>
<text x="217.3" y="200.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">2.27×</text>
<g><title>5 ahead (served), 8 sessions, output tokens per second: 1.34× no drafter</title><rect x="279.3" y="344.9" width="120" height="215.1" style="fill:transparent"/><path d="M279.3,560.0 V356.9 Q279.3,352.9 283.3,352.9 H395.3 Q399.3,352.9 399.3,356.9 V560.0 Z" style="fill:var(--s2,#eb6834)"/></g>
<text x="339.3" y="342.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">1.34×</text>
<text x="278.3" y="588.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">5 ahead (served)</text>
<g><title>3 ahead, 1 session, model time per task: 2.23× no drafter</title><rect x="494.0" y="208.6" width="120" height="351.4" style="fill:transparent"/><path d="M494.0,560.0 V220.6 Q494.0,216.6 498.0,216.6 H610.0 Q614.0,216.6 614.0,220.6 V560.0 Z" style="fill:var(--s1,#2a78d6)"/></g>
<text x="554.0" y="206.6" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">2.23×</text>
<g><title>3 ahead, 8 sessions, output tokens per second: 1.39× no drafter</title><rect x="616.0" y="337.7" width="120" height="222.3" style="fill:transparent"/><path d="M616.0,560.0 V349.7 Q616.0,345.7 620.0,345.7 H732.0 Q736.0,345.7 736.0,349.7 V560.0 Z" style="fill:var(--s2,#eb6834)"/></g>
<text x="676.0" y="335.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">1.39×</text>
<text x="615.0" y="588.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">3 ahead</text>
<g><title>2 ahead, 1 session, model time per task: 1.70× no drafter</title><rect x="830.7" y="290.7" width="120" height="269.3" style="fill:transparent"/><path d="M830.7,560.0 V302.7 Q830.7,298.7 834.7,298.7 H946.7 Q950.7,298.7 950.7,302.7 V560.0 Z" style="fill:var(--s1,#2a78d6)"/></g>
<text x="890.7" y="288.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">1.70×</text>
<g><title>2 ahead, 8 sessions, output tokens per second: 1.36× no drafter</title><rect x="952.7" y="343.1" width="120" height="216.9" style="fill:transparent"/><path d="M952.7,560.0 V355.1 Q952.7,351.1 956.7,351.1 H1068.7 Q1072.7,351.1 1072.7,355.1 V560.0 Z" style="fill:var(--s2,#eb6834)"/></g>
<text x="1012.7" y="341.1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">1.36×</text>
<text x="951.7" y="588.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">2 ahead</text>
<line x1="110" x2="1120" y1="406.0" y2="406.0" style="stroke:var(--ink2,#52514e);stroke-width:1.5;stroke-dasharray:6 5"/>
<line x1="110" x2="1120" y1="560" y2="560" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<text x="60.0" y="618.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">DeepSeek's DSpark drafter. Each setting is one engine start of the served setup with only the number of guessed tokens changed,</text>
<text x="60.0" y="638.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">run on 13 Nov in the order 5, 3, 2, none, 5; the two runs at 5 differ by 0.5% at 8 sessions (4% at 1), and 5 ahead shows their mean. 1 session: the server's clock; 8 sessions: the wall clock.</text>
<text x="60.0" y="658.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Our pre-set bar for a change at 8 sessions was +5% over 5 ahead; 3 ahead gave +3.5%. Our own agent test, not live users.</text>
</svg>
</section></div>
{:/nomarkdown}

Each setting was one engine start of the served setup with only the number of guessed tokens changed, in the order 5, 3, 2, none, 5. For each, 6 measured rounds with 8 sessions of our [6-task agent test](/frankenstein/#how-we-measure) at once, then one round with a single session. The two runs at 5, first and last, gave 441.5 and 439.3 tokens per second at 8 sessions, 0.5% apart, so the box didn't drift at 8 sessions over the 10 hours.

| Guessed tokens | Output tokens/s at 8 sessions | Against 5 | Tasks per hour at 8 | Tokens per task at 8 | Model s per task at 1 session | Tasks passed (of 288) |
|---|---:|---:|---:|---:|---:|---:|
| 5, first | 441.5 | | 211.7 | 7,508 | 33.2 | 238 |
| 3 | 455.8 | +3.5% | 212.4 | 7,725 | 33.1 | 241 |
| 2 | 444.3 | +0.9% | 212.1 | 7,541 | 43.5 | 243 |
| none | 327.5 | −25.6% | 159.4 | 7,396 | 73.8 | 240 |
| 5, last | 439.3 | | 210.2 | 7,524 | 31.8 | 249 |

- **The measure** is output tokens over the wall time of the 6 rounds at 8 sessions, as we registered it before the run. Tasks per hour are graded tasks finished over the same wall time, tools included. "Against 5" is against the mean of the two runs at 5 (440.4).
- **The drafter's gain shrinks with company, but stays large.** Alone, it more than halves the model time per task. With 8 sessions, 34% more output. Our reading: alone, a step is mostly the cards reading the model's weights, so checking a few guessed tokens costs little more than writing one; with 8 sessions each step already carries 8 conversations' work, so the extra guesses cost more. We didn't measure that split here.
- **Longer guesses waste more but keep more.** At 8 sessions, each step kept 3.75 tokens on average at 5 ahead, 3.07 at 3 and 2.54 at 2. At 8 sessions, the cheaper steps at 3 more than make up for that (+3.5%, under our bar); alone, it was about level (2% slower in one round; the two runs at 5 differed by 4% there).
- **Another way to spend the drafter also lost.** With hindsight: [Part 13](/2026/11/16/frankenstein-part-13.html) tried adaptive verification, which decides each step how much of the draft to check. Its steps were 41% shorter, but each kept 2.06 tokens instead of about 3.75, and output fell 8.4%.
- **Quality:** 487 of 576 tasks passed at 5 ahead (two runs), 241, 243 and 240 of 288 at 3, 2 and none. A one-sided Fisher test against 5 finds no difference (p 0.36 to 0.51). The drafter can't change the odds of what the model writes, only how fast, so this is a check, not a question.

## The change that had nothing left to fix

Before the KV cache had its host-RAM half, at 8 sessions only 60.7% of the prompt tokens were found in the prefix cache, and the server recomputed 20.1 million of 51.1 million prompt tokens in one 8-session round. One suspect was how vLLM frees a finished conversation's cache. This model mixes several kinds of attention layers, and vLLM frees each kind's blocks on its own, so under pressure one kind can lose the start of a conversation and the whole cached prefix becomes unusable. An open draft vLLM pull request frees the blocks by position in the conversation, across all kinds at once, which is meant to keep the prefix usable. We tried an earlier revision of it as a small patch over our served vLLM, with the helpers it builds on from a vLLM change merged after our base.

By the time it ran, the two-tier KV cache was served. With it alone, 94.8% of prompt tokens are found at 8 sessions (89.8% on the cards, 5.0% from host RAM), and 2.7 million are recomputed; with the change on top, 94.6% and 2.7 million. On our tasks-per-hour test against the two-tier KV cache alone:

| Sessions at once | With the change | Two-tier KV cache alone (Part 9) |
|---|---:|---:|
| 1 | 90.2 | 102.6 |
| 8 | 211.7 | 208.4 |
| 16 | 219.4 | 219.5 |
| Tasks passed at 1, 8 and 16 | 131 of 150 | 126 of 150 |

At 8 and 16 sessions it ties. At 1 session it was 12% slower in model time per task (34.9 against 31.0 s). That is one draw (one pass of the 6 tasks), and a single draw's standard error here is about 14%, so it isn't an established effect; but it fails the 5% bar we had set for single-user cost, and its direction fits a cost we had flagged before the run (one extra cache lookup per finished request). Our result says nothing against the change where it is meant to help: under KV pressure, without the KV cache in host RAM. We didn't test that.

## What it means for Artus

Nothing changes in what he runs: the same server, with the two-tier KV cache and the drafter guessing 5 ahead. What's new is a measured number for the drafter with many sessions: dropping it would cost about a quarter of the graded tasks per hour at 8 sessions, at about the same tokens per task, and more than half the speed for a single session.

## Limits

- **One run per test, one engine start per setting.** The 1-session figures are one round each; the 8-session figures are 6 rounds each.
- **Our test, not Artus's sessions:** our 6 tasks, all sessions starting together, each with its own cache key.
- **Two measures.** The drafter test reads output tokens per second over its 8-session rounds; the cache test reads tasks per hour on the wall clock. Both include the tools, which run in a sandbox on a Mac at home.
- **The Mac was busy during part of a test.** While the cache change ran its 8-session round and the start of its 16-session round, other work of ours ran on the Mac that hosts the tools. That can only have slowed it, and it tied anyway.
- **The 8-session numbers include a few preemptions** (the engine pausing a conversation for memory): 1 and 7 in the two runs at 5, 2 at 3, none at 2 or without a drafter.

## Credits

- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and its DSpark drafter.
- **vLLM** for the engine and its speculative decoding.
- **ivanium** for the open vLLM change on freeing hybrid KV cache by position that we tried, and **Juntian777** and **njhill** for the merged helpers it builds on ([vLLM #61724](https://github.com/vllm-project/vllm/pull/61724)).
- **diffbot** for the EXL3 3-bit pack and the serving recipe our server builds on.
- **turboderp** for the EXL3 format.
- **Or Ozeri** and **Yihua Cheng** for vLLM's KV offloading, the host-RAM half of the two-tier KV cache both tests ran on.

## AI assistance

AI agents (Claude and GPT models) designed and ran these measurements and drafted this note. An independent AI reviewer checked it against the receipts before publication. [Where We Stand](/frankenstein/) lists what is in our server today.
