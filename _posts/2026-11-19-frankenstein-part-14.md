---
title: 'The Frankenstein, Part 14: On Real Traffic, in Minutes With 8 Requests Running, Guessing 3 Tokens Ahead Beats 5 by 8%'
description: 'Part 14 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. In a trial on real coding-agent traffic, in minutes that began and ended with 8 requests running, the DSpark drafter guessing 3 tokens ahead wrote 544 output tokens per second against 503 at 5 ahead (+8.2%), and 4 ahead wrote 527 (+4.8%). Engine steps got 21% shorter while each draft yielded 16% fewer tokens. The server now guesses 3 ahead.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell, speculative-decoding]
---

*19 November 2026. A progress note from a running campaign, following [Part 13](/2026/11/16/frankenstein-part-13.html). Not a peer-reviewed paper. [Where We Stand](/frankenstein/) is the series overview.*

**On real coding-agent traffic, in minutes that began and ended with 8 requests running, our server wrote 8.2% more output tokens per second when the drafter guessed 3 tokens ahead instead of 5:** 544.0 against 502.9. An engine step took 38.4 ms on average instead of 48.4 ms (21% shorter), and each draft yielded 2.94 tokens instead of 3.50 (16% fewer). The cheaper step wins. 4 ahead sits in between: 43.6 ms, 3.25 tokens per draft, 526.9 tok/s (+4.8%). On 18 November we chose 3 ahead as the serving depth, and the server has run it since 15:56 UTC that day.

This revises [Part 10](/2026/11/14/frankenstein-part-10.html). There, on our six recorded agent tasks, 3 ahead gave 3.5% more output per second than 5 but only 0.7% more tasks per hour, so we kept 5. This live comparison led us to choose 3.

## The trial

DeepSeek's DSpark drafter is a small model that guesses a few tokens ahead. In one step the large model checks the guesses, keeps the ones that match what it would write, and adds its own next token. A longer draft can yield more tokens per step, but it also gives the large model more guesses to check.

This time the load wasn't ours: another of Artus's projects supplied live coding-agent traffic to our server. The engine runs at most 8 requests at once. Draft depth was the engine setting we varied, in four blocks of about 8 hours in a row, 31 hours in all:

| Block (UTC) | Guesses ahead |
|---|---:|
| 17 Nov 08:00 to 15:50 | 5 |
| 17 Nov 15:57 to 23:50 | 4 |
| 17 Nov 23:56 to 18 Nov 07:50 | 3 |
| 18 Nov 07:56 to 14:42 | 5 |

We ended the comparison window when the incoming work changed, at 14:42 on 18 November. The two blocks at 5 bracket the two changes.

How we counted, fixed before the read: output tokens per second from the engine's own token counter, per minute, only in minutes that began and ended with 8 requests running, after a 30-minute warm-up in each block. Standard errors come from one-hour clusters. A depth would be adopted if it beat both blocks at 5 and its gain over their mean was more than twice the combined standard error. Two windows (21 and 28 minutes, both in the block at 4) when the other project's machines restarted are left out.

## Result

| Guesses ahead | Output tok/s, 8 running | vs the two blocks at 5 | Minutes counted |
|---|---:|---:|---:|
| 5 (first block) | 501.3 | | 113 |
| 4 | 526.9 | **+4.8%** (z 5.5) | 111 |
| 3 | **544.0** | **+8.2%** (z 5.0) | 141 |
| 5 (last block) | 504.4 | | 98 |

z is the gain divided by its standard error; the rule needed more than 2. Both 4 and 3 meet it. 3 against 5 is +8.5% against the first block at 5 and +7.9% against the last. We take 3: its gain is larger in every check below. 3 over 4 itself is 17 tok/s, only z 2.1, so we call that a lean, not a result.

## Why the shallower guess wins here

| Guesses ahead | Mean time per engine step | Tokens per draft (1 + accepted guesses) |
|---|---:|---:|
| 5 | 48.4 ms | 3.50 |
| 4 | 43.6 ms (−9.9%) | 3.25 (−7.0%) |
| 3 | 38.4 ms (−20.7%) | 2.94 (−16.0%) |

We calculated this table from elapsed time and the engine's counters in those same minutes. Steps came more often and each draft yielded fewer tokens; those two ratios multiply to a 5.9% gain at 3 ahead. We also counted 7.11 drafts per engine step at 3 ahead against 6.96 at 5, and including that ratio brings the estimate to 8.2%. We don't know yet why drafts per step differed.

The yield fell as predicted. From the acceptance rates per guess position that the engine logged at 5 ahead (a sample of the drafts), a guess 3 deep should yield 2.91 tokens per draft; it yielded 2.94. For 4 deep, 3.24 predicted and 3.25 measured.

One difference to Part 10 we can see: on our recorded tasks, drafts at 5 ahead with 8 sessions yielded 3.75 tokens; on this traffic, 3.50. When fewer guesses survive, checking deep ones is worth less. That difference may matter; we haven't shown how much of the gap between the two tests it explains.

## Checks

- **All minutes, including those with fewer than 8 running:** 3 ahead +7.4%, 4 ahead +4.2%. Both still leave out the warm-ups and the two restart windows.
- **Recorded disk-work windows on our server or the traffic's source left out, plus ten minutes after each:** +8.3% and +4.6%.
- **15-minute clusters instead of one-hour clusters:** same means, z 7.0 and 6.0.
- **Two independently written readers.** After the first reading program failed a second code review, the lead agent wrote an independent one. They share no code and agree to the printed precision on the main gains, standard errors and decisions. Every precondition check passed: the measured depth was exactly 5, 4, 3 and 5 in the four blocks, each block stayed within one engine start, and there were no data gaps over 60 seconds at block ends.

## Limits

- **Across the four blocks, 26 to 32% of eligible minutes met the 8-running test.** That's why the all-minute numbers stand beside the main read. They agree.
- **We tried 3 and 4 ahead once each, at different hours, between two blocks at 5.** The traffic wasn't ours to control, and a change in the mix of requests between blocks could explain some or all of the difference; the repeat and the check by kind of request are there to test that. A check by the kind of request waits for the other project's own counts.
- **No tasks here.** We measured server output tokens per second. We didn't measure tokens per task, completed tasks per hour or task quality on this live traffic.
- **One session at a time wasn't part of this trial.** In Part 10, 3 ahead was about level with 5 for a single session (2% slower in model time per task, in one round).
- **A repeat on the changed traffic:** 3 ahead again, against the stretch at 5 after the traffic changed, ran from 15:56 UTC on 18 November to the end of the trial that night. Its read is pending, and we'll report it either way.

## What's next

2 ahead against 3, on the same kind of traffic.

## Credits

- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and the DSpark drafter.
- **diffbot** for the 3-bit pack and the serving recipe.
- **turboderp** for EXL3 and ExLlamaV3.
- **vLLM** for the engine.

## AI assistance

AI agents (Claude and GPT models) ran this trial, wrote and reviewed its readers, and drafted and reviewed this note. The serving code is public in [sm120-serving](https://github.com/Percivio-Ltd/sm120-serving) ([Part 11](/2026/11/14/frankenstein-part-11.html)).
