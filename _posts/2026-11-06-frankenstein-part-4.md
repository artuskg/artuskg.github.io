---
title: 'The Frankenstein, Part 4: Our First Own Part, an Exact Top-k Kernel 2% Faster per Step'
description: 'Part 4 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. Our first own part, rs8, is a top-k kernel for the attention indexer that spreads each row over eight blocks, because one block per row leaves 182 of the 188 SMs idle at one request at a time. It returns the same bytes as the kernel it replaces and saves 0.31 ms of a 14.4 ms verify step, about 2%. Model time is 89.6% of an agent task, so the engine is where the time goes. With hindsight, the step saving held in served traffic, but one user''s task time did not show it.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cuda, blackwell]
---

*6 November 2026. A progress note from a running campaign, following [Part 3](/2026/11/04/frankenstein-part-3.html). The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

*Rewritten 16 November 2026 with what later parts of the series showed. The original version is [on GitHub](https://github.com/artuskg/artuskg.github.io/blob/518d93f/_posts/2026-11-06-frankenstein-part-4.md). The corrections of 6 and 7 November are folded into the text.*

Part 4 of our Frankenstein: a DeepSeek-V4.1-Flash server on two RTX PRO 6000s, built from other engines' best parts, then our own.

Our first own part is a top-k kernel for DeepSeek-V4.1's attention indexer. The kernel it replaces gives each row one block. At one request at a time a decoding step has six rows, so each call keeps 6 of the GPU's 188 SMs busy. Ours, rs8, spreads each row over eight blocks. It returns the same bytes and saves 0.31 ms of a 14.4 ms step, about 2%.

For one user, that didn't reach task time. In served traffic the step saving held ([Part 5](/2026/11/07/frankenstein-part-5.html)), but model time per task didn't fall: from the evening of 2 November, all but one day's mean stayed between 33.8 and 34.8 s, because the number of steps per task varies far more than 2% from day to day ([Part 12](/2026/11/15/frankenstein-part-12.html)).

The setup: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on one workstation with two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), for long-context agentic coding, one request at a time. The body is vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000), serving the parts from Parts 1 to 3. rs8 is now in our public [sm120-serving](https://github.com/Percivio-Ltd/sm120-serving) repository ([Part 11](/2026/11/14/frankenstein-part-11.html)).

## Summary

- **An exact multi-block top-k for the indexer.** rs8 spreads each indexer row over a cluster of eight blocks. Its output equalled the served kernel's byte for byte on every real call we checked: 776 calls on rows that fit its key cache, 1,024 on longer rows. So it changes speed, not results.
- **0.31 ms of a 14.4 ms step, about 2%.** Inside the engine, steps were faster with it in 3 of 3 paired engine starts. The saving was 0.31 ms on turns that draft the way served traffic does. Served rows later measured 0.314 ms (Part 5).
- **Model time is 89.6% of an agent task.** Tool calls are 5.7%. For one user, the engine is where the time goes.
- **Step time is not task time.** At a fixed number of steps, 0.31 ms would be 0.64 s per task. But steps per task ranged from about 1,920 to 2,390 between days (Part 12), so one user's task time didn't show this gain.
- **Three more levers were too small to keep** (list at the end).

## The kernel

DeepSeek-V4.1's sparse attention has an indexer, and a top-k kernel keeps the best 512 entries of each indexer row. The served kernel, from diffbot's serving recipe, gives each row one block of 1,024 threads. At one request at a time, a verify step (one decoding step, which checks the drafter's guesses) has six rows. So each call uses 6 of the GPU's 188 SMs and leaves the rest idle.

rs8 spreads each row over a cluster of eight blocks, which combine their candidates through the cluster's distributed shared memory. Each block keeps up to 22,928 of a row's keys in a cache, 183,424 for the cluster. Longer rows take a separate tail path. Its output must equal the served kernel's byte for byte: the same keys, in the same order, with the same fill for unused slots.

On synthetic rows, a micro-benchmark timed rs8 at 24.77 µs per call against the served kernel's 73.12 µs, with identical output. The rows were weighted over five context lengths from our agent traffic, 112,464 to 169,449 tokens. That was a planning number. The engine had the last word.

## Is it exact?

We captured the served indexer's inputs and outputs from real agent traffic and ran rs8 on the same inputs.

- **Rows that fit the key cache:** rs8's output equalled the served output on 776 of 776 calls.
- **Longer rows:** four turns of one session, with prompts of 184,809 to 191,998 tokens. rs8's whole output buffer equalled the served kernel's on all 1,024 calls of 128 steps, run directly and inside CUDA graphs. Two of the turns ended early, so 53 of those steps decoded past the sampled end. Before the ends, it matched on 600 of 600 calls in 75 steps, 375 of them on rows longer than its key cache.
- **Edge cases:** on 3,912 rows from 251 test cases checked against a reference implementation, 90 of the cases at the edge of the key cache, none differed. A deliberately wrong build differed on 213, so the check can fail.

That is real-row coverage, not a proof for every input.

We didn't judge exactness by comparing the text the engine writes. Our replays sample, so two starts of the identical engine already differ in 38 to 40 of 50 turns. Text can't show exactness through that noise. Byte checks on captured inputs can.

## How much faster, inside the engine

We replayed one served agent-task draw, 50 turns, one request at a time, timed on the server's clock. Six fresh engine starts in the order A B B A A B made three pairs: the served kernel (A) against rs8 (B). We picked this draw because it is the only one of 54 served draws with turns longer than rs8's key cache.

| Pair | 1 | 2 | 3 | Mean |
|---|---:|---:|---:|---:|
| Served kernel, ms per verify step | 14.607 | 14.659 | 14.612 | |
| rs8 | 14.224 | 14.222 | 14.301 | |
| Served − rs8 | 0.383 | 0.437 | 0.311 | **0.377** |

rs8 was faster in all three pairs.

**Why we count 0.31 ms, not 0.377.** The replay ignored end-of-sequence and decoded every turn to its recorded length. A turn whose new sample ended earlier kept decoding past its end, at about one token per step with no drafting. So the replay's steps produced only 2.0 to 2.1 tokens each, against 3.74 in served traffic, where the drafter proposes almost all of its five tokens (4.99 of 5 on average). rs8 saved more on the turns past their end (0.444 ms per step) than on fully drafted turns like served ones (0.309 ms). That split is descriptive, not paired. We count the served-like 0.31 ms. Served rows later measured 0.314 ms, with a 95% interval of 0.217 to 0.410 ([Part 5](/2026/11/07/frankenstein-part-5.html)).

## Where an agent task's time goes

We split 54 served draws from 5 November into their parts: 18 rows of three draws, one request at a time, on the stack before rs8. W01, our agent test, is six long-context coding and analysis tasks with real tool calls, graded mechanically. A draw is one pass through all six.

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
{:/nomarkdown}

{::nomarkdown}
<div class="brrr"><section class="card" id="c-draw-time-split">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Stacked bar of one W01 agent-task draw, 233.83 seconds on average over 54 served draws: decode 174.58 s, time to first token 34.84 s, tool calls 13.33 s, outside requests and tools 11.09 s. Model time, decode plus time to first token, is 209.41 s, 89.6 percent.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Where an agent-task draw's 233.83 s go: model time is 89.6 %</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">54 served W01 draws on 5 November, one request at a time, the stack before rs8 · seconds per draw, mean, client clock</text>
<g><title>Decode · 174.58 s per draw · 74.7 %</title><rect x="71.0" y="190" width="789.4" height="64" rx="4" style="fill:var(--s1,#2a78d6)"/></g>
<g><title>Time to first token · 34.84 s per draw · 14.9 %</title><rect x="862.4" y="190" width="155.9" height="64" rx="4" style="fill:var(--s2,#eb6834)"/></g>
<g><title>Tool calls · 13.33 s per draw · 5.7 %</title><rect x="1020.3" y="190" width="58.4" height="64" rx="4" style="fill:var(--s3,#1baf7a)"/></g>
<g><title>Outside requests and tools · 11.09 s per draw · 4.7 %</title><rect x="1080.8" y="190" width="48.3" height="64" rx="4" style="fill:var(--s4,#eda100)"/></g>
<text x="465.7" y="229.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;fill:#ffffff;font-weight:650" text-anchor="middle">decode 74.7 %</text>
<path d="M71 180 V168 H1018.3 V180" style="fill:none;stroke:var(--ink2,#52514e);stroke-width:1.5"/>
<text x="544.6" y="158.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">model time: 209.41 s, 89.6 %</text>
<line x1="70" x2="1130" y1="268" y2="268" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<line x1="70.0" x2="70.0" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="70.0" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">0 s</text>
<line x1="296.7" x2="296.7" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="296.7" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">50 s</text>
<line x1="523.3" x2="523.3" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="523.3" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">100 s</text>
<line x1="750.0" x2="750.0" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="750.0" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">150 s</text>
<line x1="976.6" x2="976.6" y1="268" y2="274" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="976.6" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">200 s</text>
<text x="1130.0" y="292.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">233.83 s</text>
<rect x="70" y="331" width="18" height="18" rx="4" style="fill:var(--s1,#2a78d6)"/>
<text x="100.0" y="346.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Decode</text>
<text x="540.0" y="346.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">174.58 s</text>
<text x="630.0" y="346.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">74.7 %</text>
<rect x="70" y="371" width="18" height="18" rx="4" style="fill:var(--s2,#eb6834)"/>
<text x="100.0" y="386.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Time to first token</text>
<text x="540.0" y="386.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">34.84 s</text>
<text x="630.0" y="386.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">14.9 %</text>
<rect x="70" y="411" width="18" height="18" rx="4" style="fill:var(--s3,#1baf7a)"/>
<text x="100.0" y="426.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Tool calls</text>
<text x="540.0" y="426.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">13.33 s</text>
<text x="630.0" y="426.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">5.7 %</text>
<rect x="70" y="451" width="18" height="18" rx="4" style="fill:var(--s4,#eda100)"/>
<text x="100.0" y="466.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Outside requests and tools</text>
<text x="540.0" y="466.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">11.09 s</text>
<text x="630.0" y="466.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">4.7 %</text>
<text x="710.0" y="346.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Server clock: model time 208.65 s per draw;</text>
<text x="710.0" y="368.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">decode is 12,340 verify steps at 14.42 ms,</text>
<text x="710.0" y="390.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">3.74 tokens per step.</text>
<text x="710.0" y="434.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">So 1 ms per verify step is about 12.34 s per</text>
<text x="710.0" y="456.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">draw, 2.06 s per task at a fixed</text>
<text x="710.0" y="478.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">number of steps.</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">18 served rows of three draws, six agent tasks per draw; 5.00 of 6 tasks passed per draw on average. Served runs on one day, not an A/B.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Model time = time to first token + decode, on the client's clock. Parts sum to 233.84 s from rounding.</text>
</svg>
</section></div>
{:/nomarkdown}

Model time, time to first token plus decode, is 209.41 s of a 233.83 s draw: 89.6%. Tool calls take 13.33 s (5.7%), and time outside requests and tools 11.09 s (4.7%). On the server's clock, model time is 208.65 s per draw, about 34.8 s per task. Decode is 12,340 verify steps at 14.42 ms, with 3.74 tokens per step. The draws passed 5.00 of 6 tasks on average.

So for one user, the engine is where the time is. Tool calls and the harness don't move with an engine change.

The chart's conversion, 1 ms per verify step for 12.34 s per draw or 2.06 s per task, holds only at a fixed number of steps. This post first used it to count rs8 at 0.64 s per task. But steps per task follow how much the model writes, and that ranged from about 1,920 to 2,390 steps per task between days (Part 12). Against that swing, 2% of each step doesn't show. So we now give step time first, with steps or tokens per task beside any task-level figure, as [Part 13](/2026/11/16/frankenstein-part-13.html) does for throughput.

## Three more levers, too small to keep

Each saved less than the bar we set before it ran:

- **Fusing the split-K reduce into the dense matrix-vector kernels.** Bit-equal: 0 of 1,216 checks unequal, and 0 of 10,000 soak replays mismatched. It saved 0.045 ms per 279-call step-set (median of 400 rounds, positive in all 400), against a bar of 0.10 ms.
- **Isolating worker threads from the CPU-expert pools' cores,** a switch already in diffbot's recipe. It saved 0.078 ms per verify step on fully drafted turns, against a bar of 0.15 ms.
- **A smaller vocabulary for the drafter's output head.** With a 32K-token subset, a held-out task had 1.185% of its tokens outside it. That would cost 1.93 to 2.06% of tokens per step, more than the 1.4% that the head's saving of about 0.2 ms per step pays for. Checked on the CPU, with no GPU time.

## Next

[Part 5](/2026/11/07/frankenstein-part-5.html) puts rs8 into served traffic.

## Credits

- **vLLM** for the engine.
- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the served top-k kernel that rs8 replaces, matches byte for byte and builds on, and the CPU-expert runtime with its thread-isolation switch.
- **turboderp** for the EXL3 format.
- **kacper-daftcode** for [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet)'s SM120 mHC overlap and its kernels (commit `ec8a1e05e1cb`, Apache-2.0), still served.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017.

## AI assistance

AI agents (Claude and GPT models) designed, wrote and ran these tests and the kernel. An independent AI reviewer checked each design before launch and audited each result afterwards, and AI agents drafted this post and its 16 November rewrite. Artus set the goal, authorized the hardware and asked for these progress notes.
