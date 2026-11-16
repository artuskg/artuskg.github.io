---
title: 'The Frankenstein, Part 3: An Expert Plan From Our Own Traffic, and a Newer vLLM That Decoded 4.4% Slower per Token'
description: 'Part 3 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. A host-expert plan fitted to our own agent traffic made each verify step 2.42% shorter and is served, but one user''s task time did not show it. A newer vLLM base, with an open pull request for a smaller KV-cache record on SM120, took 10% longer per agent-task draw in 4 of 4 blocks. It also wrote 7.7% more tokens, and its decoding took 4.4% longer per token. It was not adopted.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cpu-offload, blackwell]
---

*4 November 2026. A progress note from a running campaign, following [Part 2](/2026/11/03/frankenstein-part-2.html). The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

*Rewritten 16 November 2026 with what later parts of the series showed. The original version is [on GitHub](https://github.com/artuskg/artuskg.github.io/blob/518d93f/_posts/2026-11-04-frankenstein-part-3.md).*

Part 3 of our Frankenstein: a DeepSeek-V4.1-Flash server on two RTX PRO 6000s, built from other engines' best parts.

**A newer vLLM decoded each token 4.4% slower, so we kept our pinned one.** Built as a whole, with an open pull request that gives DeepSeek-V4.1 a smaller KV-cache record on SM120, it took 263.5 s per draw of our six-task agent test, against 239.5 s on our pinned engine, 10% longer: about 4 s more per task, tool calls included, slower in all four of its A/B blocks. But it also wrote 7.7% more tokens, so part of that is longer answers; per token, decoding was 4.4% slower.

**The part we did take, a host-expert plan fitted to our own agent traffic,** made each verify step 2.42% shorter, in all five of its A/B blocks. That gain didn't reach one user's task time. On served traffic each decoding step went from 14.8 to 14.4 ms with the plan, but model time per task has stayed between 33.8 and 34.8 s since the evening of 2 November (every day but one). The number of steps a task needs varied from about 1,920 to 2,390 between days, far more than 2.42% ([Part 12](/2026/11/15/frankenstein-part-12.html)).

The target: [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on one workstation with two RTX PRO 6000 Blackwell Workstation Edition GPUs (SM120), for long-context agentic coding. The body is vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000). It serves Part 1's CPU-expert schedule and region cache, Part 2's mHC overlap from vLLM-Moet, and, since 3 November, the plan below.

## The plan: which experts the CPU computes

DeepSeek-V4.1-Flash sends each token to a few of each layer's routed experts. diffbot's runtime keeps 5,296 of the 15,360 routed experts in the model's 40 layers in CPU RAM and runs them on the CPU. The rest live on the GPUs, and a 512-slot GPU cache holds the most-used CPU experts. A file, the plan, sets which experts stay on the CPU. diffbot's published plan comes from the routing of long agentic coding sessions.

We built a new plan from the routing recorded on four replays of our own agent tasks, kept apart from the test that judged it, though a simulation on two test draws chose it for testing. It keeps the same 5,296 experts on the CPU in total, so memory doesn't change: 39 of the 40 layers trade some experts between CPU and GPU. The plan is in our public serving repository ([Part 11](/2026/11/14/frankenstein-part-11.html)).

How we decided: five blocks, each with one engine start per plan in random order. Each start ran three draws of our agent test (six long-context coding and analysis tasks with real tool calls, graded mechanically), and step time came from the server's counters. We would take the new plan only if its verify step was shorter in all five blocks.

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-host-expert-plan">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Dot plot of five randomized blocks. In every block, time per verify step with the new host-expert plan was below the published plan, by 2.14 to 3.11 percent; mean 2.42 percent.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Host-expert plan from our agent traffic: time per verify step</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash (diffbot's EXL3 3-bit pack) in vLLM, TP2 on two RTX PRO 6000 · five randomized blocks, one start per plan · lower is better</text>
<line x1="110" x2="1130" y1="170.0" y2="170.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="175.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+1 %</text>
<line x1="110" x2="1130" y1="246.0" y2="246.0" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<text x="98.0" y="251.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0 %</text>
<line x1="110" x2="1130" y1="322.0" y2="322.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="327.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−1 %</text>
<line x1="110" x2="1130" y1="398.0" y2="398.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="403.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−2 %</text>
<line x1="110" x2="1130" y1="474.0" y2="474.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="479.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−3 %</text>
<line x1="110" x2="1130" y1="550.0" y2="550.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="555.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−4 %</text>
<text x="1130.0" y="236.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0 = no change</text>
<text x="70.0" y="148.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Time per verify step, new plan / published plan − 1</text>
<line x1="110" x2="1130" y1="429.9" y2="429.9" style="stroke:var(--s1,#2a78d6);stroke-width:2;stroke-dasharray:6 6"/>
<text x="717.5" y="455.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">mean −2.42 %</text>
<g><title>block 1 · new plan vs published · −2.43 % ms per verify step</title><circle cx="230.0" cy="430.7" r="13" style="fill:transparent"/><circle cx="230.0" cy="430.7" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="230.0" y="414.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="middle">−2.43 %</text>
<text x="230.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 1</text>
<g><title>block 2 · new plan vs published · −3.11 % ms per verify step</title><circle cx="425.0" cy="482.4" r="13" style="fill:transparent"/><circle cx="425.0" cy="482.4" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="441.0" y="487.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−3.11 %</text>
<text x="425.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 2</text>
<g><title>block 3 · new plan vs published · −2.20 % ms per verify step</title><circle cx="620.0" cy="413.2" r="13" style="fill:transparent"/><circle cx="620.0" cy="413.2" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="636.0" y="418.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−2.20 %</text>
<text x="620.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 3</text>
<g><title>block 4 · new plan vs published · −2.24 % ms per verify step</title><circle cx="815.0" cy="416.2" r="13" style="fill:transparent"/><circle cx="815.0" cy="416.2" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="831.0" y="421.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−2.24 %</text>
<text x="815.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 4</text>
<g><title>block 5 · new plan vs published · −2.14 % ms per verify step</title><circle cx="1010.0" cy="408.6" r="13" style="fill:transparent"/><circle cx="1010.0" cy="408.6" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="1026.0" y="413.6" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−2.14 %</text>
<text x="1010.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 5</text>
<text x="70.0" y="617.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Each block: one engine start per plan, order randomized; three W01 agent-task draws per start, one request at a time, timed on the server. Below zero in 5 of 5 blocks: p = 1/32.</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Step time, not task time. Published plan: 14.70–14.92 ms per step; new plan: 14.35–14.47 ms. Decode time per output token −2.33 % on average.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Both plans keep 5,296 of 15,360 routed experts on the CPU, in diffbot's CPU-expert runtime; only which ones differs.</text>
</svg>
</section></div>
{:/nomarkdown}

| Block | 1 | 2 | 3 | 4 | 5 | Mean |
|---|---:|---:|---:|---:|---:|---:|
| Published plan, ms per verify step | 14.704 | 14.920 | 14.736 | 14.806 | 14.735 | |
| New plan | 14.346 | 14.456 | 14.411 | 14.474 | 14.419 | |
| New/published − 1 | −2.43% | −3.11% | −2.20% | −2.24% | −2.14% | **−2.42%** |

It was shorter in all five blocks (one-sided sign test, p = 1/32), and so was time per output token, by 2.33% on average. Moving an expert between GPU and CPU changes its arithmetic, so a fidelity screen came first: against the published plan, KL moved by +0.00122, +0.00078 and −0.00003 on three item groups (limit +0.010), and top-1 agreement by −0.23, −0.04 and +0.21 points (limit −0.5). 74 of 90 episodes passed with each plan. Task time per draw ranged from 9.4 s slower to 26.3 s faster across the blocks, so we claimed no task-time gain, and Part 12 later found none. It has been served since 3 November, one request at a time.

## Not adopted: a newer vLLM base

Our engine runs on a pinned vLLM build. We built the newest base we could and tested it as a whole:
- vLLM 783380af, 298 commits newer;
- an open vLLM pull request that brings DeepSeek-V4.1's 528-byte KV-cache record per token to SM120, in place of the 584-byte record we run;
- torch 2.14 and FlashInfer 0.7.3rc1.

With the smaller record, the KV cache held 8.2% more tokens: 1,159,335 against 1,071,558.

How we decided: four blocks, each with two engine starts per arm in random order, three draws of our agent test per start, and the mHC overlap off in both arms. We would call it faster or slower only if all four blocks agreed.

| Block | 1 | 2 | 3 | 4 | All |
|---|---:|---:|---:|---:|---:|
| Extra time per draw on the newer base, s | 33.4 | 16.2 | 7.8 | 38.8 | **24.1** |
| Newer/pinned − 1 | +14.5% | +6.9% | +3.1% | +16.2% | **+10.0%** |

It was slower in all four blocks: 263.5 s against 239.5 s per draw, over 24 draws per arm. Quality held: 120 of 144 episodes passed on the newer base, 117 of 144 on the pinned engine. The server's counters show where the time went, as a description rather than a causal split: the newer base generated 7.7% more tokens, and its decode time per generated token was 4.4% higher, 4.316 against 4.133 ms.

What this does and does not show:
- **The whole stack, together.** The 298 commits, torch, FlashInfer and the new record went in as one. This doesn't show that the pull request is slow.
- **Nothing about the overlap on the newer base:** it was off in both arms.
- **The larger KV cache wasn't tested with several users.** That is where KV space matters: in [Part 8](/2026/11/12/frankenstein-part-8.html)'s 16-session replay, 16 long conversations didn't fit in the cards' cache of about 1.07 million tokens, and 98% of prompt tokens were recomputed. vLLM's KV offloading to host RAM, by Or Ozeri, fixed that.

## The mHC overlap, checked further

Part 2 served the overlap for one request at a time. With five or more concurrent requests, verify steps run in larger CUDA graphs. Padded to the 48-row graph, single-request steps stayed within the fidelity proxy's tolerance (0.0181–0.0210 against the served engine; tolerance 0.025), though real batches of five to eight weren't scored. After it went in, our served runs had shown more failed QA episodes (15 of 30, against 8 of 28 before), so we ran 16 blocks with the overlap on against off: 48 against 51 of 96 QA passes, and 240 against 243 of 288 over all six tasks. That is inconclusive at that size (one-sided p = 0.358), and a smaller loss can't be ruled out. The overlap stays served.

## Where a draw's time went, and our first own part

On 51 served draws on 3 November, decode was 74.2% of a draw's 228.2 s. Cold first turns were 10.0% and tool calls 5.7%. So our first own part targeted decode. At a fixed number of steps, 1 ms per verify step would be about 11.9 s per draw, but as Part 12 showed, step counts don't stay fixed.

That part is rs8, an exact top-k kernel for the sparse-attention indexer. The served kernel gave each indexer row one block, so at one request at a time each call used 6 of the GPU's 188 SMs. rs8 spreads each row over a cluster of eight blocks, and its output matched the served kernel's byte for byte on every real call we checked. It went in with [Parts 4](/2026/11/06/frankenstein-part-4.html) and [5](/2026/11/07/frankenstein-part-5.html) and took each served step to 14.0–14.1 ms. Again, one user's task time didn't move ([Part 12](/2026/11/15/frankenstein-part-12.html)).

## Credits

- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the CPU-expert runtime and its expert plans, one of which we replaced with a plan built from our own traffic.
- **turboderp** for the EXL3 format.
- **kacper-daftcode** for [vLLM-Moet](https://github.com/kacper-daftcode/vLLM-Moet)'s SM120 mHC overlap and its kernels (commit `ec8a1e05e1cb`, Apache-2.0), still served.
- **DeepSeek** for DeepSeek-V4.1-Flash-1017.
- **vLLM, PyTorch and FlashInfer** for the engine and the newer base we measured.

## AI assistance

AI agents (Claude and GPT models) designed and ran these tests. An independent AI reviewer checked each design before launch and audited each result afterwards, and AI agents drafted this post and its 16 November rewrite. Artus set the goal, authorized the hardware and asked for these progress notes.
