---
title: 'The Frankenstein, Part 8: A RAM Tier for the KV Cache, 4.65x the Output at 16 Agent Sessions'
description: 'Part 8 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. With 16 agent sessions on our served engine, the cards run out of room for the conversations, and 98% of the prompt tokens get recomputed. vLLM can keep evicted conversations in host RAM instead. With that tier, aggregate output rose from 122 to 568 tokens per second (4.65x), and a confirming run against the engine exactly as served gave 4.55x with a 37 GiB tier. A capacity result on a replay of agent sessions, not yet part of our served setup.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell, kv-cache]
---

*12 November 2026. A progress note from a running campaign, following [Part 7](/2026/11/10/frankenstein-part-7.html). This one is about several users at once, not single-user speed. Not a peer-reviewed paper.*

Part 8 of our Frankenstein: in a replay of 16 agent sessions, our 2× RTX PRO 6000 DeepSeek-V4.1-Flash server ran out of KV cache and recomputed 98% of its prompt tokens.

A KV tier in host RAM (vLLM's offloading) took aggregate output from 122 to 568 tok/s: 4.65x.

The setup is unchanged: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000) and its serving recipe, plus our own parts from Parts 1 to 5. DeepSeek's DSpark drafter proposes 5 tokens ahead. Everything before this part measured one request at a time.

## Summary

- **With 16 agent sessions, our served engine collapses.** Its two cards hold about 1.07 million tokens of KV cache, the model's working memory of each conversation. 16 long agent conversations don't fit, so the engine reuses the cache of conversations that aren't running and recomputes it on the session's next turn. At 16 sessions, it recomputed 98% of the prompt tokens in its turns. Output fell to about 122 tokens per second (125 for the engine exactly as served), from 442 at 12 sessions.
- **A KV tier in host RAM fixes it.** vLLM can copy cache blocks to the host's RAM and load them back when a session returns. With a 100 GiB tier, recompute fell to 0.1%, and aggregate output rose to 568 tokens per second at 16 sessions, **4.65x**. At 12 sessions it rose from 442 to 542, **1.23x**.
- **Confirmed against the engine exactly as served,** with a smaller tier: 37 GiB, about 6 million tokens. 125 against 569 tokens per second, **4.55x**, the same as the 100 GiB tier to within 0.2%. Median time to first token fell from 56 s to 9 s.
- **Not served yet.** This is a capacity result on a replay of agent sessions. Whether our server runs with the tier is Artus's call.

## What the tier does

An agent session is a long conversation that comes back every few seconds with a little more text: a tool result, a file, a new instruction. The engine keeps each conversation's KV cache so that the next turn only has to process the new part. Our engine runs at most 8 requests at once. With 16 sessions, about 8 are queued or between turns at any moment, and the cache they need competes for the same 1.07 million tokens on the cards. When running requests need room, the engine reuses the blocks still cached for conversations that aren't running. When that session's next turn arrives, the engine has to compute its whole conversation again, up to about 180,000 tokens, before writing a single new token.

vLLM's KV offloading keeps a copy of those blocks in host RAM. Our start script turns it on with two options, `--kv-offloading-size` and `--kv-offloading-backend native`; it is off in what we serve today. When a conversation comes back, its blocks load from RAM instead of being recomputed. In an earlier check on our server with 4 streams, loading a resumed conversation of about 250,000 tokens took about 30 ms (median), at 51 to 55 GB/s, and time to first token on those turns fell from 17.7 s to 0.94 s.

## The test

The test is a replay of agent sessions, with no live users. Each session is a client in a closed loop: it sends a turn, waits for the answer, pauses (0.9 s on average, drawn at random and capped at 10 s), and sends the next turn. A session's conversation starts at 16,000 to 24,000 tokens and grows turn by turn up to 120,000 to 180,000 tokens, then a new one starts. That's about 87 turns per conversation. The growth per turn and the answer lengths follow about 15,000 requests from a load test Artus ran on this server with up to 10 agent sessions at a time, and the mean pause is that test's. The text comes from our benchmark's documents, decoded greedily, and each answer runs to its drawn length.

- **Two arms, the same engine:** our served engine and drafter, without and with the tier. Every start is a fresh engine. On 11 November we ran 2 starts per arm at each count, with a 100 GiB tier: without, with, with, without at 12 sessions, and with, without, without, with at 16. On that day both arms turn off one memory-allocator setting that the tier needs, and the tier arm also gets a higher memory limit for its container. On 12 November a confirming pair ran at 16 sessions: the engine exactly as served, then the same with a 37 GiB tier.
- **The measure** is the server's own output-token counter over a 30-minute window, after a 10-minute warm-up.
- All 10 starts were valid, with no requests from outside the test.

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-ram-kv-tier">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="1200" height="700" role="img" aria-label="Bar chart of aggregate output tokens per second, without and with a RAM tier for the KV cache. 12 sessions: 442.1 without, 542.1 with, 1.23x. 16 sessions: 122.1 without, 568.0 with, 4.65x. 16 sessions again, as served against a 6M-token tier: 125.0 and 569.1, 4.55x.">
<rect width="1200" height="700" style="fill:var(--surface,#fcfcfb)"/>
<text x="60.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">A RAM tier for the KV cache: 4.65× the output at 16 agent sessions</text>
<text x="60.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Aggregate output, tokens per second · DeepSeek-V4.1-Flash-1017 on 2× RTX PRO 6000 · our served engine, at most 8 requests running at once</text>
<text x="60.0" y="102.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Server token counter over a 30-minute window · a replay of agent sessions, not live users · dots are single engine starts, bars their mean</text>
<rect x="60" y="122" width="14" height="14" rx="3" style="fill:var(--s2,#eb6834)"/>
<text x="82.0" y="134.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">No tier: KV cache on the GPUs only (1.07M tokens)</text>
<rect x="490" y="122" width="14" height="14" rx="3" style="fill:var(--s1,#2a78d6)"/>
<text x="512.0" y="134.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Plus a KV tier in host RAM</text>
<line x1="110" x2="1140" y1="530.0" y2="530.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="534.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0</text>
<line x1="110" x2="1140" y1="475.8" y2="475.8" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="479.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">100</text>
<line x1="110" x2="1140" y1="421.7" y2="421.7" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="425.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">200</text>
<line x1="110" x2="1140" y1="367.5" y2="367.5" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="371.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">300</text>
<line x1="110" x2="1140" y1="313.3" y2="313.3" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="317.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">400</text>
<line x1="110" x2="1140" y1="259.2" y2="259.2" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="263.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">500</text>
<line x1="110" x2="1140" y1="205.0" y2="205.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="209.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">600</text>
<g><title>12 sessions, no tier: 442.1 tok/s (starts 446.8, 437.4)</title><rect x="160.7" y="185" width="120" height="345" style="fill:transparent"/><path d="M160.7,530 V294.5 q0,-4 4,-4 H276.7 q4,0 4,4 V530 Z" style="fill:var(--s2,#eb6834)"/></g>
<circle cx="206.7" cy="288.0" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<circle cx="234.7" cy="293.1" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="220.7" y="278.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">442</text>
<g><title>12 sessions, 100 GiB tier: 542.1 tok/s (starts 542.7, 541.5)</title><rect x="282.7" y="185" width="120" height="345" style="fill:transparent"/><path d="M282.7,530 V240.4 q0,-4 4,-4 H398.7 q4,0 4,4 V530 Z" style="fill:var(--s1,#2a78d6)"/></g>
<circle cx="328.7" cy="236.0" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<circle cx="356.7" cy="236.7" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="342.7" y="224.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">542</text>
<text x="281.7" y="556.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">12 sessions</text>
<text x="281.7" y="576.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">11 Nov, 2 starts each</text>
<text x="281.7" y="200.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;fill:var(--ink,#0b0b0b);font-weight:700" text-anchor="middle">1.23×</text>
<g><title>16 sessions, no tier: 122.1 tok/s (starts 119.5, 124.7)</title><rect x="504.0" y="185" width="120" height="345" style="fill:transparent"/><path d="M504.0,530 V467.9 q0,-4 4,-4 H620.0 q4,0 4,4 V530 Z" style="fill:var(--s2,#eb6834)"/></g>
<circle cx="550.0" cy="465.3" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<circle cx="578.0" cy="462.5" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="564.0" y="451.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">122</text>
<g><title>16 sessions, 100 GiB tier: 568.0 tok/s (starts 567.9, 568.0)</title><rect x="626.0" y="185" width="120" height="345" style="fill:transparent"/><path d="M626.0,530 V226.4 q0,-4 4,-4 H742.0 q4,0 4,4 V530 Z" style="fill:var(--s1,#2a78d6)"/></g>
<circle cx="672.0" cy="222.4" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<circle cx="700.0" cy="222.3" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="686.0" y="210.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">568</text>
<text x="625.0" y="556.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">16 sessions</text>
<text x="625.0" y="576.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">11 Nov, 2 starts each</text>
<text x="625.0" y="186.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;fill:var(--ink,#0b0b0b);font-weight:700" text-anchor="middle">4.65×</text>
<g><title>16 sessions, again, as served: 125.0 tok/s</title><rect x="847.3" y="185" width="120" height="345" style="fill:transparent"/><path d="M847.3,530 V466.3 q0,-4 4,-4 H963.3 q4,0 4,4 V530 Z" style="fill:var(--s2,#eb6834)"/></g>
<circle cx="907.3" cy="462.3" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="907.3" y="450.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">125</text>
<g><title>16 sessions, again, 37 GiB tier: 569.1 tok/s</title><rect x="969.3" y="185" width="120" height="345" style="fill:transparent"/><path d="M969.3,530 V225.7 q0,-4 4,-4 H1085.3 q4,0 4,4 V530 Z" style="fill:var(--s1,#2a78d6)"/></g>
<circle cx="1029.3" cy="221.7" r="5" style="fill:var(--ink,#0b0b0b);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="1029.3" y="209.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">569</text>
<text x="968.3" y="556.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">16 sessions, again</text>
<text x="968.3" y="576.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">12 Nov, exactly as served vs 6M-token tier</text>
<text x="968.3" y="185.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;fill:var(--ink,#0b0b0b);font-weight:700" text-anchor="middle">4.55×</text>
<line x1="110" x2="1140" y1="530" y2="530" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<text x="60.0" y="616.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Both arms run the same engine and drafter (DSpark, 5 tokens). 11 Nov: no tier against a 100 GiB tier, order without, with, with, without at 12 sessions and with, without, without, with at 16.</text>
<text x="60.0" y="636.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">On 11 Nov the no-tier arm differs from the served engine only in one allocator setting the tier needs; on 12 Nov the served engine itself gave 125.0, within 2.4% of it.</text>
<text x="60.0" y="656.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">12 Nov: the engine exactly as served against a 37 GiB tier (about 6 million tokens). Ratios are of the means. Not yet part of our served setup.</text>
</svg>
</section></div>
{:/nomarkdown}

| | Without the tier | With the tier | Ratio |
|---|---:|---:|---:|
| **12 sessions,** output tokens/s (starts) | 442.1 (446.8, 437.4) | 542.1 (542.7, 541.5), 100 GiB | **1.23x** |
| **16 sessions,** output tokens/s (starts) | 122.1 (119.5, 124.7) | 568.0 (567.9, 568.0), 100 GiB | **4.65x** |
| **16 sessions again,** exactly as served | 125.0 | 569.1, 37 GiB | **4.55x** |
| Prompt tokens recomputed, 16 sessions | 98.0 to 98.1% | 0.1% | |
| Median time to first token, 16 sessions (client clock) | 56.3 to 57.7 s | 9.0 to 9.4 s | |

- **At 16 sessions the effect is far outside the noise.** The lowest start with the tier beat the highest without it by 4.55x, and the two 100 GiB starts differed by 0.02%. The engine exactly as served gave 125.0, within 2.4% of the no-tier arm.
- **At 12 sessions the gain is smaller.** The lowest start with the tier beat the highest without it by 1.21x. That is about twice the 11% drift between runs we saw earlier, but under the 1.25x we had set beforehand as a clear gain.
- **Without the tier, going from 12 to 16 sessions cost 72% of the output.** With it, output rose 5%; we didn't measure why.
- **37 GiB was enough for this run.** The 6-million-token tier matched the 100 GiB one (569.1 against 568.0 tokens per second) and was 74% full at the end of the run. The host's peak memory use rose by 37 GiB, the tier's size, from 221.5 to 258.5 GiB.

## Limits

- **A replay, not live users.** The lengths follow a load test of Artus's agent sessions, but the text is our benchmark's and the answers run to fixed lengths. Real sessions also share system prompts, which the replay doesn't. His everyday prompts run longer than the test's, which likely makes eviction more frequent, not less.
- **Two counts, 12 and 16 sessions,** with two starts per arm on 11 November and one on 12 November. We didn't measure where between 1 and 12 sessions the tier starts to matter.
- **Single-user speed.** An earlier single-request check showed no slowdown with the tier, within the 11% drift between runs that day.
- **Outputs.** In that earlier check, the token distributions with and without the tier differed by 0.014 to 0.015 nats (KL divergence). That is about twice the 0.008 to 0.009 between repeated runs without it, and inside the 0.025 bound we had set beforehand. Top-1 tokens agreed 99.4 to 99.6% of the time, against 99.7% between repeats.
- **The drafter wasn't re-tuned for 12 to 16 sessions.** Both arms use 5 draft tokens, the setting tuned for one request at a time.
- **A fix of ours to pinning the RAM.** Both tier runs use a small fix of ours to how vLLM's offload worker pins the RAM region for the GPUs. On 9 November, without it, one GPU failed to pin a 100 GiB region partway.

## Credits

- **Or Ozeri** for vLLM's KV offloading and its CPU backend (the series from vLLM #19848), and **Yihua Cheng** for its command-line options (#27621).
- **vLLM** for the engine.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and its DSpark drafter.
- **diffbot** for the EXL3 3-bit pack and the serving recipe our server builds on.
- **turboderp** for the EXL3 format.

## AI assistance

AI agents (Claude and GPT models) designed and ran these measurements and drafted this note. An independent AI reviewer checked it against the receipts before publication. [Where We Stand](/frankenstein/) lists what is in our server today.
