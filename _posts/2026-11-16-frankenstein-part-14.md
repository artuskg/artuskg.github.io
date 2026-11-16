---
title: 'The Frankenstein, Part 14: Under Real Agent Load, the GPU Cache Does the Work'
description: 'Part 14 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. We expected long agent sessions to lean on the KV tier in host RAM. Over 74 minutes of real work from about 10 concurrent coding-agent runs, 96.5% of prompt tokens came from the cache on the GPUs, 3.4% were computed, and the host-RAM tier supplied 0.1%. Decoding took 89% of mean request time on the server.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, kv-cache, agents]
---

*16 November 2026. A progress note from a running campaign, following [Part 13](/2026/11/16/frankenstein-part-13.html). Not a peer-reviewed paper. [Where We Stand](/frankenstein/) has all the numbers.*

Since 12 November our server has kept a KV tier in host RAM, 37 GiB of it, next to the KV cache on the cards ([Part 8](/2026/11/12/frankenstein-part-8.html), [Part 9](/2026/11/13/frankenstein-part-9.html)). The KV cache is the model's working memory of each conversation. vLLM's prefix caching reuses it: when a new request starts with text the engine has already processed, it reads that part from the cache instead of computing it again. Agent sessions have long contexts, and ten of them together can come close to the 1.07 million tokens the cards hold. So we expected real agent work to lean on the RAM tier.

It hardly does. Over 74 minutes of real work from about 10 concurrent coding-agent runs, the tier supplied 0.1% of the prompt tokens. The cache on the GPUs supplied 96.5%.

A reader also asked whether the graph-size fix from [Part 12](/2026/11/15/frankenstein-part-12.html) still pays once long contexts spill into host RAM. At the time we could only answer from vLLM's design. Now we have a measurement of where the server's time goes.

## The load

The work came from another of Artus's projects: coding-agent runs through the opencode harness, about 10 at a time, on our server. The engine runs at most 8 requests at once; the others wait in its queue or are between turns. We sent no requests of our own. All counts come from the engine's own counters, read at the start and end of the window (16 November, 05:59 to 07:13 UTC) and every 10 minutes in between.

That project's request logs give the shape of the work. Over 14 to 16 November there were 463 runs and 66,127 requests:
- **Prompts are long.** The median prompt is 89,000 tokens, the 90th percentile 153,000, and the longest 197,000.
- **Each turn adds a little.** A context starts at about 7,000 tokens and grows by a median of 2,200 tokens per turn. At about 172,000 tokens the harness compacts the conversation and starts again at about 7,000. 75% of runs compact at least once.
- **Turns come fast.** A run makes a median of 119 requests in 33 minutes. The next request follows the previous answer after a median of 0.1 s, and 98.9% of turns follow within 10 s.
- **Runs share only the start.** All runs share about 5,200 tokens of system prompt and tool definitions; after that each task is its own.

## Where the prompt tokens came from

In our 74-minute window, 3,947 requests read 272 million prompt tokens, 69,000 per request on average:

| Source | Share of prompt tokens |
|---|---:|
| Cache on the GPUs | 96.46% |
| Computed | 3.43% |
| RAM tier in host memory | 0.107% (292,000 tokens) |

Each request computed 2,400 prompt tokens on average, close to what a turn adds anyway (a median of 2,200 tokens per turn in the profile above). Our reading: at most a few hundred tokens per request were recomputed after being pushed out of the cache.

The RAM tier loaded back 1.89 GB in those 74 minutes, in 36 ms of copy time in total (about 53 GB/s, as in Part 8's check). 94% of that came in one 10-minute stretch, 06:33 to 06:43 UTC.

In the same window the tier stored 71.6 GB, and 134 GB since the engine started at 05:01. That is about 3.4 times its 39.7 GB, so the tier has been overwritten several times. The stored amount is about 95% of all the KV the engine newly made in the window (computed prompt plus generated tokens). So it looks as if the tier keeps a copy of each new block as it's made, not only of blocks pushed out of the cards. That's our reading of the counters, not something we checked in vLLM's code.

No running request was preempted (pushed out of the cards and restarted later): 0 in the 2 hours 12 minutes since the engine started.

## Why the cards absorb it

vLLM keeps a finished request's KV blocks in the GPU cache until it needs the space. With 8 requests running at 69,000 tokens each, running requests fill about half of the cards' 1.07 million tokens. The engine's usage gauge, which counts only running requests, read 27 to 55% across the window.

Our reading: the other half holds the sessions between turns. Their next turn comes a fraction of a second later and finds its whole prefix still on the cards. At about 10 sessions averaging 69,000 prompt tokens, about 0.7 million combined, the RAM tier is insurance worth about 0.1% of prompt tokens on this much GPU memory.

The tier does the work once the combined context passes what the cards hold. It's a token budget, not a session count:
- **[Part 9](/2026/11/13/frankenstein-part-9.html)'s agent test** had 8 sessions with prompts of about 140,000 tokens. That needs about 1.1 million tokens, and there the tier removed a collapse in tasks per hour.
- **In [Part 8](/2026/11/12/frankenstein-part-8.html)'s replay of 16 sessions,** the engine recomputed 98% of its prompt tokens without the tier and 0.1% with a 100 GiB tier, and output rose 4.65x. Every answer in that replay ran to a fixed length, so the output per session was the same with and without the tier. The engine as served, with today's 37 GiB, gave 4.55x.

**Open.** The project's own logs say the combined context of its active runs (each run's latest prompt and answer, summed) was above 1.07 million tokens in 61% of the samples taken while 8 or more runs were active, over 14 to 16 November. That doesn't fit what we saw:
- **The tier should have caught it.** The tier holds about 6 million tokens and seems to copy every new block. So any reused prefix pushed off the cards would have come back from it, and its 0.1% bounds how often that happened in our window.
- **The windows differ.** Our window's mean prompt, 69,000 tokens, is below the profile's median of 89,000. That is the most likely explanation.
- **The one overlap is small.** The profile ends at 05:38 UTC on 16 November. From the engine's start at 05:01 to 05:33, the tier supplied 640 tokens.

We haven't reconciled the two counts.

## The reader's question: does a faster decoding step still reach the request?

Mean time per request on the server, over the same 3,947 requests:

| Phase | Seconds | Share |
|---|---:|---:|
| Waiting in the queue | 0.415 | 4.8% |
| Reading the prompt (prefill) | 0.390 | 4.5% |
| Decoding | 7.724 | 89.4% |
| Other (outside the three phases the engine times) | 0.115 | 1.3% |
| **Total** | **8.645** | |

Decoding was 89% of mean server time per request. Our inference: a step that is some percent faster on these steps cuts that time by up to about 0.89 times that percent. That assumes the gain also holds on the steps that carry other requests' prompt chunks.

Contexts hardly spilled in this window, so what happens when they spill heavily is still unmeasured under this load. What a spill costs per returning conversation was measured before: in Part 8's check, loading a resumed conversation of about 250,000 tokens took about 30 ms, against a mean request of 8.6 s here.

From one request's side, a decoding step came every 50.8 ms on average. The drafter proposes 5 tokens per step, and a step kept 3.77 tokens on average. This isn't comparable with Part 12's 37.1 ms. That was the median step with 7 requests running in our own test; this is a mean over all steps of a different workload, and 4% of the engine's steps also carried more than 64 prompt tokens.

Each request wrote 576 tokens on average, and the first one arrived after 0.92 s. Together the server wrote 509 tokens per second. Time between turns, while the agent runs its tools, is outside these numbers; in the profile, those gaps were 4.5% of a session's wall time.

## Also in the counters: where the experts ran

About a third of the model's routed experts live in host RAM ([Part 1](/2026/11/02/frankenstein-part-1.html)). A 512-slot cache on the cards holds the most-used of them ([Part 3](/2026/11/04/frankenstein-part-3.html)), and the CPU computes the rest. In decoding, the cards handled 97.0% of 1.32 billion expert calls over the 2 hours 12 minutes, and the cache served 61% of the calls to host-RAM experts. The CPU's share rose each hour: 2.68%, 3.09% and 3.64% (the last only its first 13 minutes). We don't know why yet.

## Limits

- **One window of 74 minutes,** at one load of about 10 sessions, read from the engine's counters. The engine doesn't expose RAM-tier load time per request, only the total.
- **Means, not medians,** for the time split. The counters give sums.
- **The profile is the other project's,** from its own request logs over three days, so its windows differ from ours.
- **Before and after the tier:** the project's logs show 7.9% of turns losing their cached prefix on 10 to 12 November, and none of 75,133 since 12 November. That isn't a clean test of the tier, because the same change also changed other engine settings, including the KV cache on the cards.

## Credits

- **vLLM** for the engine, its KV offloading and its counters.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and its DSpark drafter.
- **diffbot** for the 3-bit pack, the serving recipe and the CPU-expert runtime.
- **turboderp** for EXL3 and ExLlamaV3.
- **opencode** for the agent harness the runs used.

## AI assistance

AI agents (Claude and GPT models) read these counters and the request logs, and an AI agent drafted this note.
