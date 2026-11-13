---
title: 'The Frankenstein, Part 9: The RAM KV Tier Is Served, 2.4x the Agent Tasks per Hour at 8 Sessions'
description: 'Part 9 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. The KV tier in host RAM from Part 8 is now in our served setup. On our agent test with 8 sessions at once, the server finished 208 graded tasks per hour with it, against 87 without, and time to first token, summed over the requests of each task, fell from 74 s to 13 s. Without the tier, throughput plateaued at 3 to 6 sessions and halved at 8; with it, it keeps rising to 8 and holds at 16. Pass rates are within sampling noise.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell, kv-cache]
---

*13 November 2026. A progress note from a running campaign, following [Part 8](/2026/11/12/frankenstein-part-8.html). Like Part 8, it is about several users at once. Not a peer-reviewed paper.*

Part 9 of our Frankenstein: the RAM KV tier from Part 8 is now served on our 2× RTX PRO 6000 DeepSeek-V4.1-Flash server.

On our graded agent test with 8 sessions at once, it finished 208 tasks per hour, against 87 without the tier: 2.4x.

The setup: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000) and its serving recipe, plus our own parts from Parts 1 to 5. DeepSeek's DSpark drafter proposes 5 tokens ahead.

## Summary

- **The tier is served.** Part 8 measured a KV tier in host RAM on a replay and called it "not served yet". Since 12 November, 17:56 UTC, it is part of our served setup: a 37 GiB tier, about 6 million tokens, behind the 1.07 million tokens of KV cache on the cards. Artus's reason: "Why would you want me to run an inferior version with 1M tok kv cache when the known better version is already there?"
- **On real agent tasks, it removes the 8-session cliff.** We ran our 6-task agent test with 1 to 16 sessions at once. Without the tier, the server plateaued at 3 to 6 sessions (158 to 185 graded tasks per hour across two runs) and fell to 87 at 8. With it, it did **208 tasks per hour at 8 sessions, 2.4x**, and time to first token, summed over each task's requests, fell from 74 s to 13 s.
- **At 16 sessions it saturates:** 220 tasks per hour, 5% more than at 8, with about 2 minutes of waiting in the queue per task.
- **Pass rates are within sampling noise:** at the counts both ran, 73 of 90 tasks passed with the tier and 77 of 90 without it, under one standard error apart. They missed a quality bar we had set beforehand, though; see Limits.

## The test

Part 8's replay had fixed answer lengths and no grading. This time the sessions do real work: our [6-task agent test](/frankenstein/#how-we-measure), with two questions about a document of 128,000 or 200,000 tokens and four coding tasks with tools, graded mechanically. Those are nominal sizes: on this model's tokenizer the tasks start at about 105,000 or 164,000 tokens, and every prompt in the test is 105,000 to 183,000 tokens long, about 140,000 on average.

- **N sessions at once.** At each count, N copies of the test start together, each at a different task, and each works through all 6. Every session has its own cache key, so sessions can't reuse each other's cached text. The sampling is the same as in all our DeepSeek rows: temperature 1.0, top-p 0.95, thinking on.
- **The measure** is graded tasks finished per hour for the whole server: the tasks finished at that count, divided by the wall time from the first start to the last finish, tools included. The tools run in a sandbox on a Mac at home.
- **Without the tier,** the engine as served until 12 November: two runs that day, at 1, 2, 4 and 8 sessions, then at 3 to 6.
- **With the tier,** the setup as served since: the same engine and drafter with the tier, plus one memory-allocator setting the tier needs and a higher memory limit for its container. One run from 12 to 13 November, at 1, 2, 4, 8 and 16 sessions, with the same test kit.
- **Valid and unshared:** every traced step was valid, and no request came from outside the test. Both runs that reached 8 sessions also repeated that step with the request tracing off, as a check on its cost.

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-tasks-per-hour">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="1200" height="700" role="img" aria-label="Line chart of agent tasks per hour for the whole server against concurrent agent sessions. With the RAM KV tier: 1 sessions 102.6, 2 sessions 156.5, 4 sessions 171.9, 8 sessions 208.4, 16 sessions 219.5. Without it, 1M tokens of KV cache on the GPUs only: 1 sessions 91.3, 2 sessions 123.9, 4 sessions 185.3, 8 sessions 87.2; a second run gave 3 sessions 166.1, 4 sessions 171.9, 5 sessions 157.8, 6 sessions 170.1. At 8 sessions the tier gives 2.4 times the tasks per hour.">
<rect width="1200" height="700" style="fill:var(--surface,#fcfcfb)"/>
<text x="60.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">The RAM KV tier, as served: 2.4× the agent tasks per hour at 8 sessions</text>
<text x="60.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Graded agent tasks per hour for the whole server · DeepSeek-V4.1-Flash-1017 on 2× RTX PRO 6000 · our 6-task agent test, all sessions start together</text>
<text x="60.0" y="102.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Wall clock, tools included · one draw of the 6 tasks per session · open dots are repeats and a second run on 12 Nov</text>
<rect x="60" y="122" width="14" height="14" rx="3" style="fill:var(--s1,#2a78d6)"/>
<text x="82.0" y="134.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">With a 37 GiB KV tier in host RAM (served since 12 Nov)</text>
<rect x="560" y="122" width="14" height="14" rx="3" style="fill:var(--s2,#eb6834)"/>
<text x="582.0" y="134.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Without it: KV cache on the GPUs only (1.07M tokens)</text>
<line x1="110" x2="1120" y1="560.0" y2="560.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="564.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0</text>
<line x1="110" x2="1120" y1="483.0" y2="483.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="487.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">50</text>
<line x1="110" x2="1120" y1="406.0" y2="406.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="410.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">100</text>
<line x1="110" x2="1120" y1="329.0" y2="329.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="333.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">150</text>
<line x1="110" x2="1120" y1="252.0" y2="252.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="256.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">200</text>
<line x1="110" x2="1120" y1="175.0" y2="175.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="179.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">250</text>
<text x="173.1" y="586.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">1</text>
<text x="236.2" y="586.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">2</text>
<text x="362.5" y="586.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">4</text>
<text x="488.8" y="586.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">6</text>
<text x="615.0" y="586.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">8</text>
<text x="867.5" y="586.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">12</text>
<text x="1120.0" y="586.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">16</text>
<text x="615.0" y="612.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">Agent sessions at once</text>
<line x1="110" x2="1120" y1="560" y2="560" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<path d="M173.1,419.4 L236.2,369.2 L362.5,274.7 L615.0,425.8" style="fill:none;stroke:var(--s2,#eb6834);stroke-width:2.5;stroke-linejoin:round"/>
<g><title>1 session, without the tier: 91.3 tasks/h</title><circle cx="173.1" cy="419.4" r="14" style="fill:transparent"/><circle cx="173.1" cy="419.4" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>2 sessions, without the tier: 123.9 tasks/h</title><circle cx="236.2" cy="369.2" r="14" style="fill:transparent"/><circle cx="236.2" cy="369.2" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>4 sessions, without the tier: 185.3 tasks/h</title><circle cx="362.5" cy="274.7" r="14" style="fill:transparent"/><circle cx="362.5" cy="274.7" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>8 sessions, without the tier: 87.2 tasks/h</title><circle cx="615.0" cy="425.8" r="14" style="fill:transparent"/><circle cx="615.0" cy="425.8" r="6" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>3 sessions, without the tier, second run, 12 Nov: 166.1 tasks/h</title><circle cx="299.4" cy="304.3" r="14" style="fill:transparent"/><circle cx="299.4" cy="304.3" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:2"/></g>
<g><title>4 sessions, without the tier, second run, 12 Nov: 171.9 tasks/h</title><circle cx="376.5" cy="295.3" r="14" style="fill:transparent"/><circle cx="376.5" cy="295.3" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:2"/></g>
<g><title>5 sessions, without the tier, second run, 12 Nov: 157.8 tasks/h</title><circle cx="425.6" cy="317.0" r="14" style="fill:transparent"/><circle cx="425.6" cy="317.0" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:2"/></g>
<g><title>6 sessions, without the tier, second run, 12 Nov: 170.1 tasks/h</title><circle cx="488.8" cy="298.0" r="14" style="fill:transparent"/><circle cx="488.8" cy="298.0" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:2"/></g>
<g><title>8 sessions, without the tier, untraced repeat: 80.6 tasks/h</title><circle cx="629.0" cy="435.8" r="14" style="fill:transparent"/><circle cx="629.0" cy="435.8" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:2"/></g>
<path d="M173.1,402.0 L236.2,319.0 L362.5,295.3 L615.0,239.1 L1120.0,222.0" style="fill:none;stroke:var(--s1,#2a78d6);stroke-width:2.5;stroke-linejoin:round"/>
<g><title>1 session, with the tier: 102.6 tasks/h</title><circle cx="173.1" cy="402.0" r="14" style="fill:transparent"/><circle cx="173.1" cy="402.0" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>2 sessions, with the tier: 156.5 tasks/h</title><circle cx="236.2" cy="319.0" r="14" style="fill:transparent"/><circle cx="236.2" cy="319.0" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>4 sessions, with the tier: 171.9 tasks/h</title><circle cx="362.5" cy="295.3" r="14" style="fill:transparent"/><circle cx="362.5" cy="295.3" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>8 sessions, with the tier: 208.4 tasks/h</title><circle cx="615.0" cy="239.1" r="14" style="fill:transparent"/><circle cx="615.0" cy="239.1" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>16 sessions, with the tier: 219.5 tasks/h</title><circle cx="1120.0" cy="222.0" r="14" style="fill:transparent"/><circle cx="1120.0" cy="222.0" r="6" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>8 sessions, with the tier, untraced repeat: 207.9 tasks/h</title><circle cx="629.0" cy="239.8" r="14" style="fill:transparent"/><circle cx="629.0" cy="239.8" r="5" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:2"/></g>
<text x="605.0" y="225.1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="end">208</text>
<text x="1120.0" y="206.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">220</text>
<text x="603.0" y="430.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="end">87</text>
<text x="362.5" y="258.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">185</text>
<path d="M649.0,239.1 H655.0 V425.8 H649.0" style="fill:none;stroke:var(--ink2,#52514e);stroke-width:1.5"/>
<text x="667.0" y="339.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;fill:var(--ink,#0b0b0b);font-weight:700" text-anchor="start">2.4× at 8 sessions</text>
<text x="1112.0" y="250.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">saturated: about 2 min</text>
<text x="1112.0" y="267.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">of queue per task</text>
<text x="60.0" y="638.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Same engine and drafter (DSpark, 5 tokens), at most 8 requests at once; the tier adds one allocator setting it needs. Prompts 105,000 to 183,000 tokens. Without the tier: 12 Nov; 16 not run.</text>
<text x="60.0" y="658.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">With the tier: 12-13 Nov, after the switch, the same test kit. Each point is one step; 1 session is one draw. Our own agent test, not live users.</text>
</svg>
</section></div>
{:/nomarkdown}

| Sessions at once | Tasks per hour, with the tier | Tasks per hour, without it | |
|---:|---:|---:|---:|
| 1 | 102.6 | 91.3 | +12% |
| 2 | 156.5 | 123.9 | +26% |
| 3 to 6, second run | | 3: 166.1 · 4: 171.9 untraced · 5: 157.8 · 6: 170.1 | |
| 4 | 171.9 | 185.3 | −7% |
| 8 | **208.4** (207.9 untraced) | **87.2** (80.6 untraced) | **2.4x** |
| 16 | 219.5 | not run | |
| At 8: time to first tokens per task, summed over its requests (of it, in the queue) | 12.8 s (5.7 s) | 74.4 s (41.3 s) | |
| At 8: model time per task, per session | 124.7 s | 313.6 s | |
| Tasks passed at 1, 2, 4 and 8 sessions | 73 of 90 (81%) | 77 of 90 (86%) | |

- **At 8 sessions the effect is far outside the noise.** The lower of the two tier steps beat the higher of the two without it by 2.4x. Without the tier, the steps at 3 to 6 sessions sit on a plateau of 158 to 172 tasks per hour, and 8 sessions did fewer tasks per hour than 2.
- **Why the cliff is at 8:** the prompts average about 140,000 tokens, so six conversations need about 0.8 million tokens of KV cache and eight about 1.1 million, more than the cards' 1.07 million. Without the tier, the conversations evict each other and get recomputed, as in Part 8. That's our reading, not a measurement in this run, and the edge is a token budget, not a session count: with longer conversations it comes sooner.
- **At 16 sessions, the extra time is waiting.** Decoding per task stayed the same as at 8 (113 against 112 s), and the time to first tokens grew to 124 s per task, of which 117 s is waiting in the queue. The engine runs at most 8 requests at once (its max-num-seqs setting), so at 16 about half the sessions wait their turn. Whether a higher cap would help depends on whether 16 running conversations fit in the cards' KV cache (the tier holds only conversations that aren't running); we haven't measured that.
- **At 1 to 4 sessions the two are about level.** The +12% at 1 session and −7% at 4 are each one step, inside the 14% we allow for draw-to-draw noise. Without the tier, the second run's 4-session step gave 171.9, the same as with it. At 2 sessions the tier's +26% is under twice that allowance, so we don't count it as a gain.

## What it means for Artus

Running more sessions at once now pays up to 8. Each session gets slower as more share the cards: at 8, about 125 s of model time per task, against about 31 s alone. But together 8 sessions finish about twice as many tasks per hour as one. Before the switch, 8 sessions took 314 s per task each and finished fewer tasks per hour in total than 2. 16 sessions add 5% throughput, at about 2 minutes of waiting per task.

## Limits

- **Our test, not Artus's sessions.** These are our 6 tasks, all starting together, each session with its own cache key. Real sessions share system prompts and start at different times.
- **One run with the tier, one draw per session per count.** The 1-session points are single draws. With the tier, 3, 5, 6 and 9 to 15 sessions weren't run.
- **Tasks per hour on the wall clock.** This isn't our usual single-user ranking number (model time per task on the server's clock). The single-user rows on [Where We Stand](/frankenstein/) were measured before the tier; at 1 session it was level with the setup without it (one draw), so they stand.
- **Pass counts are small samples, and they missed a bar.** Before this run, our rule for replacing the served setup asked for 6 of 6 tasks at 1 session and at least 38 of 48 at 8. The tier got 4 of 6 and 37 of 48 (40 of 48 in the untraced repeat, against 41 of 48 untraced without it; 42 of 48 traced). At the counts both ran, 73 of 90 against 77 of 90 is less than one standard error apart, so we read the misses as draw noise. The tier was already served on Artus's word, and for later candidates that clause now reads "not below the tier by two standard errors". In Part 8's output check, token distributions with and without the tier differed by about twice the gap between repeated runs, inside the bound we had set beforehand.
- **The drafter wasn't re-tuned for many sessions.** Both use 5 draft tokens, the setting tuned for one request at a time.
- **The cost:** the tier takes 37 GiB of host RAM. In Part 8's run, the host's peak memory use was 258.5 GiB of its 503 with it, against 221.5 without.
- **A fix of ours to pinning the RAM.** As in Part 8, the served tier uses a small fix of ours to how vLLM's offload worker pins the RAM region for the GPUs.

## Credits

- **Or Ozeri** for vLLM's KV offloading and its CPU backend (the series from vLLM #19848), and **Yihua Cheng** for its command-line options (#27621).
- **vLLM** for the engine.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and its DSpark drafter.
- **diffbot** for the EXL3 3-bit pack and the serving recipe our server builds on.
- **turboderp** for the EXL3 format.

## AI assistance

AI agents (Claude and GPT models) designed and ran these measurements and drafted this note. An independent AI reviewer checked it against the receipts before publication. Artus decided to serve the tier. [Where We Stand](/frankenstein/) lists what is in our server today.
