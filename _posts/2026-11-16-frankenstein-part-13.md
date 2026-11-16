---
title: 'The Frankenstein, Part 13: Faster Prompt Reading, a Faster Step That Lost, and What Tasks per Hour Hides'
description: 'Part 13 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. Three small changes, now served, read prompts 8.7% faster and return the first token 5.5% sooner. Adaptive verification made each decoding step 41% shorter and still lost 8.4% of output, because each step kept far fewer drafted tokens. And a correction: when two runs write different amounts of text, tasks per hour moves with the amount, not only with the speed.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell, speculative-decoding]
---

*16 November 2026. A progress note from a running campaign, following [Part 12](/2026/11/15/frankenstein-part-12.html). Not a peer-reviewed paper. [Where We Stand](/frankenstein/) has all the numbers.*

Two results this time, one adopted and one not, and a lesson about our own throughput numbers that corrects a line in Part 12.

All three tests below ran the same way: 8 agent sessions at once on our server, recorded agent tasks, three runs in a row (the served setup, the change, the served setup again), 288 graded tasks per run after a warm-up, and one single-session draw per run. A **draw** is one pass through our six agent tasks.

## Adopted: faster prompt reading

Since 15 November, 22:01 UTC, the server runs three small changes together:

- **Fixed MXFP8 matrix-multiply tactics for prompt-sized batches.** Some of the model's weight matrices run as MXFP8 matrix multiplies through FlashInfer, and for batches above 128 rows the served path used a default that is slow on our shapes. We timed FlashInfer's tactics on our six weight shapes at 160, 512, 2,048 and 16,384 rows, and pinned the fastest valid one per shape: 57% less time summed over the 6 shapes and 4 batch sizes (most of that sum is the largest batches), with outputs bit-identical to the served path. One shape, 5,120 by 15,360, went from 19.2 to 4.9 ms at 16,384 rows.
- **Our expert module's flat path up to batch 96** instead of 64.
- **Fewer host operations** after routing in the layer that runs experts on the CPU during prefill.

What they did together, at 8 sessions:

| | Served setup (two runs) | With the changes |
|---|---:|---:|
| Prefill, seconds per 1,000 computed prompt tokens (not found in the cache) | 0.1020 and 0.1034 | **0.0937** (−8.7%) |
| Time to first token, per request | 1.68 and 1.74 s | **1.61 s** (−5.5%) |
| Decode step with 8 requests running | 38.5 and 38.5 ms | 38.7 ms (level) |
| Output tokens per second | 466.8 and 476.3 | 474.5 (+0.6%, inside the 2% between the served runs) |
| Tasks passed | 252 and 239 of 288 | 236 of 288 |

Prompt reading got faster beyond the difference between the two served runs; the decoding step didn't change. One session at a time wasn't slower either. We adopted it on the prompt-reading gain, the rule we set before the run.

How much that is worth: at 8 sessions, reading prompts takes about 5% of the server's time per task (5.8 of 119 s in the first served run), so 8.7% faster prefill is worth under half a percent of throughput. Users see it as the first token arriving 5.5% sooner.

What we don't claim: the run's tasks per hour rose 6.1%, but most of that comes from the next section's problem, not from speed.

## What tasks per hour hides

Our tokens per second is every token the model wrote, divided by the run's wall time. Tasks per hour is 288 tasks divided by the same wall time. So the ratio between them is simply how many tokens the model wrote per task, and that changes from run to run: the model answers the same task at different lengths. In our three tests, the two served runs differ by up to 3% in tokens per task.

- **The bundle's run wrote 5.2% fewer tokens per task** than the served runs' average (7,432 against 7,733 and 7,943). That accounts for most of its 6.1% more tasks per hour: about 4 to 5 points. We can't tell whether the shorter answers are chance or an effect of the change, which runs some steps through different kernels; either way they aren't speed.
- **A correction to Part 12.** The graph-size fix raised tokens per second 6.9% but tasks per hour only 2.3%. We wrote that a task's wall time also holds prefill, tool calls and waiting. That was our guess, and the counts show otherwise: the fix's run wrote 4.5% more tokens per task (7,849 against 7,405 and 7,622), and 1.069 / 1.045 = 1.023. Some of its +6.9% may come from the same source, because prompt and tool time get spread over more tokens. The clean measure of that fix is the step time: the step with 7 requests running went from 48.7 to 37.1 ms. That result stands.

From now on we report step times and prefill times first, and give throughput with the tokens per task beside it.

## Not adopted: adaptive verification

DeepSeek's DSpark drafter guesses 5 tokens ahead, and the large model checks them all at once. Adaptive verification decides each step how much of the draft to check, from measured cost curves and an estimate of how much will be accepted, which can make each step cheaper. It only ran on our cards at all with the indexer change from vLLM pull request [#65527](https://github.com/vllm-project/vllm/pull/65527), which we applied as an overlay.

At 8 sessions (overnight from 14 to 15 November):

| | Served setup (two runs) | Adaptive verification |
|---|---:|---:|
| Decode step with 8 requests running | 38.5 and 38.5 ms | **22.5 ms** |
| Tokens per step | 3.75 and 3.76 | 2.06 |
| Output tokens per second | 474.1 and 471.1 | **433.0** (−8.4%) |

Each step got 41% shorter, but each step produced 45% fewer tokens, so the server wrote less per second. Tokens per task were about the same in all three runs (within 2%), so here tasks per hour fell with output, by 7%. We set a bar of +2.5% before the run, so adaptive verification stays off.

One session at a time, its draw took 26.7 s of model time per task against 36.1 and 36.4. That is the same trap: its answers were a third shorter (33,354 tokens against 49,080 and 50,380), and per generated token it was about 10% slower (model time divided by tokens written: 4.81 against 4.41 and 4.34 ms). One draw each; we read nothing more into it.

## Also tried

The CPU's energy setting, "performance" against "balance_performance", in six alternating 75-minute blocks under a steady 12-session load: the decoding step moved 1.5%, inside the 4.2% that two blocks with the same setting already differ by. Unresolved, not adopted.

## Limits

- **One run per arm.** The two served runs bracket each change.
- **The prefill gain is the bundle's, not one change's.** The three changes were measured together. The 57% is the matrix multiply alone, in a separate timing on one card; how much of the 8.7% it accounts for, we didn't measure.
- **Passes:** 236 against 252 and 239 of 288 is not a significant difference (one-sided Fisher p = 0.125 against both served runs together; 0.041 against the first served run alone, 0.41 against the second), but we report it. The flat path at 96 changes which kernel runs some steps, so outputs aren't bit-identical to the served setup's; neither are two served runs.
- **Preemptions** (requests paused for lack of memory): 4 in the bundle's run, 0 and 2 in the served runs; 0 for adaptive verification, 1 and 2 for its served runs. They may cost the bundle's run a little.
- **Our own test, not live users.**

## Credits

- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and the DSpark drafter.
- **Lei-010** for vLLM [#65527](https://github.com/vllm-project/vllm/pull/65527), which let adaptive verification start on these cards.
- **FlashInfer** for the MXFP8 matrix-multiply tactics.
- **diffbot** for the 3-bit pack and the serving recipe, whose vllm-exl3 layer the host-operations change patches.
- **turboderp** for EXL3 and ExLlamaV3.
- **vLLM** for the engine.

## AI assistance

AI agents (Claude and GPT models) ran these measurements, and an AI agent drafted this note. The code is public in [sm120-serving](https://github.com/Percivio-Ltd/sm120-serving) ([Part 11](/2026/11/14/frankenstein-part-11.html)).
