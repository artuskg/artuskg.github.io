---
title: 'The Frankenstein, Part 1: DeepSeek-V4.1-Flash on Two RTX PRO 6000s'
description: 'We are assembling a server for DeepSeek-V4.1-Flash on one workstation with two RTX PRO 6000s from the best parts of other engines. Part 1: the body (vLLM with diffbot''s EXL3 3-bit pack), one CPU-expert schedule served at 2.07% less time per verify step, and a prompt region cache that passed its test at 5.57 s less server time per agent-task draw and is next in line.'
categories: [AI, Research Notes]
tags: [deepseek, vllm, gpu, cpu-offload, tokenization]
---

*2 November 2026. A progress note from a running campaign. The measurements below are engine-level, and none of them is agent task time unless it says so. Not a peer-reviewed paper.*

We're building a server for DeepSeek-V4.1-Flash on a workstation with two RTX PRO 6000s, Frankenstein-style: other engines' best parts first, then our own.

Part 1: the body, one part served (verify steps 2.07% shorter) and one up next (5.57 s less server time per task draw).

The target is [DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) on one workstation: two RTX PRO 6000 Blackwell Workstation Edition GPUs, a 64-core Threadripper PRO 9985WX and 512 GB of RAM. The workload is long-context agentic coding, one request at a time, and the goal is to finish agent tasks sooner at the same graded quality.

The plan has two stages. First we combine the best parts of several existing engines. Then we replace parts with our own. Each part goes in only through a test whose decision rule we write before it runs.

## Summary

- **The body:** vLLM with [diffbot's EXL3 3-bit pack](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000). On 31 October it replaced our llama.cpp setup under a rule written before the run. Its total time for 18 agent-task episodes was 28.2% lower in that run, and it passed 13 of 18 against 15, within the rule's limit.
- **New part, served:** an optional CPU-expert schedule from diffbot's runtime. Each verify step took 2.07% less time, lower in 5 of 5 randomized blocks (p = 1/32). That is step time, not task time. Its quality test is running.
- **New part, up next:** a cache of token IDs per prompt region. It cut the server's time outside queueing and prefill from 6.64–6.93 s to 1.16–1.23 s per task draw, 5.57 s per draw, in 8 randomized engine starts (p = 1/70), with identical prompt token IDs. It passed its registered test, but it is not task time and it is not adopted or served yet.

## The body: vLLM with diffbot's EXL3 3-bit pack

diffbot's recipe serves DeepSeek-V4.1-Flash-1017 on two RTX PRO 6000s with vLLM at tensor-parallel 2:
- routed experts in 3-bit [EXL3](https://github.com/turboderp-org/exllamav3), turboderp's format, calibrated with coolbho3k's method;
- int4 Engram tables and a DSpark draft model for speculative decoding;
- about a third of the routed experts in host RAM, computed by an AVX-512 CPU runtime that diffbot wrote, so only activations and results cross PCIe.

We compared it with the setup we were serving: llama.cpp with Unsloth's UD-IQ2_XXS GGUF, our own patches and a DSpark drafter. The decision rule, written before the run, adopted the vLLM engine if all three held:
1. its total time over 18 episodes of W01 is lower;
2. it passes at most 2 fewer of the 18 episodes;
3. its fidelity against a reference model's output distribution is no worse.

W01 is our agent-task benchmark: six long-context coding and analysis tasks with real tool calls, graded mechanically. One draw runs all six, with thinking on, at temperature 1.0. Each engine ran three draws, each in a fresh prompt-cache namespace, timed on the client.

| | vLLM + EXL3 3-bit | llama.cpp + UD-IQ2_XXS |
|---|---:|---:|
| W01 total, 18 episodes | **1,067.18 s** | 1,486.61 s |
| Per draw | 465.21 / 304.64 / 297.34 s | 518.02 / 407.57 / 561.02 s |
| Episodes passed | 13 of 18 | 15 of 18 |
| Fidelity against a reference model's output distribution: KL on three text sets, lower is closer | **0.129 / 0.095 / 0.105** | 0.270 / 0.229 / 0.199 |

What this does and does not show:
- **A lower total in this run, not a general speedup.** This was a decision rule written before the run, not a randomized comparison. The draws ran in sequence on one afternoon: two llama.cpp draws, then the vLLM engine's three, then the third llama.cpp draw. No significance test was registered, and the per-draw totals overlap.
- **Passes:** 13 against 15 is within the rule's limit of 2 fewer. It is not evidence that quality is equal.
- **Fidelity:** KL against the output distribution of the checkpoint's own reference code, teacher-forced on the top 64 log-probabilities, on three text sets. Lower is closer. Two runs of the reference itself differ by 0.017–0.031 on the same sets.
- **Before schedule 2:** this run measured the vLLM engine with its default CPU-expert schedule, before the part below was served, so its total and the step-time figure below don't combine.

## New part, served: diffbot's second CPU-expert schedule

diffbot's CPU runtime has an optional second schedule, `EXL3_CPU_EXPERTS_SCHED=2`, which splits each job's work across the pool's threads differently. Their README lists it as measured within noise on their 96-core CPU and not used. On our 64-core CPU, a screening run picked it out, and we then tested it against the default schedule.

The test (registered before launch): five blocks, each with one engine start per schedule in random order, replaying recorded W01 requests. The rule: schedule 2 is confirmed only if its time per verify step is lower in all five blocks.

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-cpu-schedule">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Dot plot of five randomized blocks. In every block, time per verify step with CPU-expert schedule 2 was below schedule 1, by 1.50 to 2.92 percent; mean 2.07 percent.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">CPU-expert schedule 2: time per verify step against schedule 1</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash (diffbot's EXL3 3-bit pack) in vLLM, TP2 on two RTX PRO 6000 · five randomized blocks, one start per arm · lower is better</text>
<line x1="110" x2="1130" y1="180.0" y2="180.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="185.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">+1 %</text>
<line x1="110" x2="1130" y1="252.0" y2="252.0" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5"/>
<text x="98.0" y="257.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0 %</text>
<line x1="110" x2="1130" y1="324.0" y2="324.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="329.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−1 %</text>
<line x1="110" x2="1130" y1="396.0" y2="396.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="401.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−2 %</text>
<line x1="110" x2="1130" y1="468.0" y2="468.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="473.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−3 %</text>
<line x1="110" x2="1130" y1="540.0" y2="540.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="545.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">−4 %</text>
<text x="1130.0" y="242.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0 = no change</text>
<line x1="110" x2="1130" y1="400.8" y2="400.8" style="stroke:var(--s1,#2a78d6);stroke-width:2;stroke-dasharray:6 6"/>
<text x="1130.0" y="424.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="end">mean −2.07 %</text>
<g><title>block 1 · schedule 2 vs 1 · -2.44 % ms per verify step</title><circle cx="230.0" cy="427.7" r="13" style="fill:transparent"/><circle cx="230.0" cy="427.7" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="246.0" y="432.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−2.44 %</text>
<text x="230.0" y="570.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 1</text>
<g><title>block 2 · schedule 2 vs 1 · -1.77 % ms per verify step</title><circle cx="425.0" cy="379.4" r="13" style="fill:transparent"/><circle cx="425.0" cy="379.4" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="441.0" y="384.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−1.77 %</text>
<text x="425.0" y="570.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 2</text>
<g><title>block 3 · schedule 2 vs 1 · -2.92 % ms per verify step</title><circle cx="620.0" cy="462.2" r="13" style="fill:transparent"/><circle cx="620.0" cy="462.2" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="636.0" y="467.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−2.92 %</text>
<text x="620.0" y="570.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 3</text>
<g><title>block 4 · schedule 2 vs 1 · -1.70 % ms per verify step</title><circle cx="815.0" cy="374.4" r="13" style="fill:transparent"/><circle cx="815.0" cy="374.4" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="831.0" y="379.4" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−1.70 %</text>
<text x="815.0" y="570.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 4</text>
<g><title>block 5 · schedule 2 vs 1 · -1.50 % ms per verify step</title><circle cx="1010.0" cy="360.0" r="13" style="fill:transparent"/><circle cx="1010.0" cy="360.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="1026.0" y="365.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">−1.50 %</text>
<text x="1010.0" y="570.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">block 5</text>
<text x="70.0" y="617.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Each block: one engine start per arm, order randomized; a replay of recorded W01 requests. Below zero in 5 of 5 blocks: one-sided sign test p = 1/32.</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Step time, not task time. The schedule changes floating-point summation order; its quality effect is being measured in a randomized W01 comparison.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Schedule 2 is an optional mode in diffbot's CPU-expert runtime (EXL3_CPU_EXPERTS_SCHED=2).</text>
</svg>
</section></div>
{:/nomarkdown}

| Block | 1 | 2 | 3 | 4 | 5 | Mean |
|---|---:|---:|---:|---:|---:|---:|
| Time per verify step, schedule 2 against 1 | −2.44% | −1.77% | −2.92% | −1.70% | −1.50% | **−2.07%** |

It was lower in all five blocks: confirmed, one-sided exact sign test p = 1/32.

What this does and does not show:
- **Step time, not task time.** A verify step is one pass of the target model over the draft tokens. How much of a task's time that is depends on the task.
- **Quality is not settled.** The schedule changes the order in which floating-point sums are added, so outputs can change. A fidelity check could not settle it: two starts of the same engine configuration already differed by more than the check's tolerance.
- **Served on a policy call.** Our campaign manager put schedule 2 into serving on 1 November, on the step-time result, with a revert rule: a failure that only schedule 2 shows, a lower pass rate or a quality regression sends it back. A randomized W01 comparison of the two schedules, 10 blocks, is running now. Its result goes in the next note.

## New part, up next: a prompt region cache

An agent request carries the whole conversation so far. In W01 the prompts are 105K–175K tokens long, and one text region between the chat template's control tokens makes up 98–99% of each one. That region repeats verbatim from request to request, and the server tokenized it again every time: about 0.1–0.2 s per request on the CPU.

diffbot's recipe already cuts each prompt at the template's control tokens and tokenizes the regions in one batch call. Our hook wraps that call with a cache from region text to token IDs, bounded and least-recently-used first. A region seen before gets its stored IDs, and the rest are tokenized as before. Each region is tokenized on its own, with no padding, truncation or carry-over between regions, so stored IDs should equal fresh ones. We checked that on all 1,915 recorded W01 and agent-task requests, and again in every engine start below.

The test (registered before launch): eight engine starts, four with the cache and four without, in one of the 70 balanced orders, drawn at random. Each start replays three recorded W01 draws, 135 requests, one at a time. Each request asks for one output token, because the cache acts only before the engine runs. The measure is the server's own time per request outside queueing and prefill (time to first token minus queue time minus prefill time, from vLLM's metrics), summed per draw. That is chat-template rendering, tokenization and internal hand-offs.

{::nomarkdown}
<div class="brrr"><section class="card" id="c-region-cache">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Dot plot of eight engine starts. With the region cache off, the server spent 6.64 to 6.93 seconds per W01 draw outside queueing and prefill; with it on, 1.16 to 1.23 seconds. Saving 5.57 seconds per draw.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="70.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Prompt region cache: server time per W01 draw outside queue and prefill</text>
<text x="70.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash (diffbot's EXL3 3-bit pack) in vLLM, TP2 on two RTX PRO 6000 · eight engine starts in random order · lower is better</text>
<line x1="260.0" x2="260.0" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="260.0" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">0 s</text>
<line x1="368.8" x2="368.8" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="368.8" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">1 s</text>
<line x1="477.5" x2="477.5" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="477.5" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">2 s</text>
<line x1="586.2" x2="586.2" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="586.2" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">3 s</text>
<line x1="695.0" x2="695.0" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="695.0" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">4 s</text>
<line x1="803.8" x2="803.8" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="803.8" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">5 s</text>
<line x1="912.5" x2="912.5" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="912.5" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">6 s</text>
<line x1="1021.2" x2="1021.2" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="1021.2" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">7 s</text>
<line x1="1130.0" x2="1130.0" y1="170" y2="500" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="1130.0" y="530.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">8 s</text>
<text x="695.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">Seconds per W01 draw (each start: the mean over three replayed draws)</text>
<text x="236.0" y="266.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="end">Cache off</text>
<text x="236.0" y="288.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">as served</text>
<text x="236.0" y="416.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="end">Cache on</text>
<text x="236.0" y="438.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">DS41_REGION_CACHE=1</text>
<g><title>start 2 of 8 · cache off · 6.640 s per W01 draw</title><circle cx="982.1" cy="246.0" r="13" style="fill:transparent"/><circle cx="982.1" cy="246.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>start 3 of 8 · cache off · 6.710 s per W01 draw</title><circle cx="989.7" cy="262.0" r="13" style="fill:transparent"/><circle cx="989.7" cy="262.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>start 5 of 8 · cache off · 6.770 s per W01 draw</title><circle cx="996.2" cy="278.0" r="13" style="fill:transparent"/><circle cx="996.2" cy="278.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>start 6 of 8 · cache off · 6.927 s per W01 draw</title><circle cx="1013.3" cy="294.0" r="13" style="fill:transparent"/><circle cx="1013.3" cy="294.0" r="7" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>start 7 of 8 · cache on · 1.159 s per W01 draw</title><circle cx="386.0" cy="396.0" r="13" style="fill:transparent"/><circle cx="386.0" cy="396.0" r="7" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>start 4 of 8 · cache on · 1.173 s per W01 draw</title><circle cx="387.6" cy="412.0" r="13" style="fill:transparent"/><circle cx="387.6" cy="412.0" r="7" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>start 1 of 8 · cache on · 1.212 s per W01 draw</title><circle cx="391.8" cy="428.0" r="13" style="fill:transparent"/><circle cx="391.8" cy="428.0" r="7" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>start 8 of 8 · cache on · 1.234 s per W01 draw</title><circle cx="394.2" cy="444.0" r="13" style="fill:transparent"/><circle cx="394.2" cy="444.0" r="7" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<text x="964.1" y="228.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">6.64–6.93 s</text>
<text x="412.2" y="425.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">1.16–1.23 s</text>
<line x1="389.9" x2="995.3" y1="345" y2="345" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5;stroke-dasharray:5 5"/>
<text x="692.6" y="335.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="middle">5.57 s saved per draw</text>
<text x="692.6" y="367.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">every cache-off start above every cache-on start: p = 1/70</text>
<text x="70.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Each start replays three recorded W01 draws (135 requests, 105K–175K prompt tokens) one at a time, max_tokens 1. Prompt token IDs were identical in all eight starts.</text>
<text x="70.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Not task time and not yet served. The time is the server's per-request residual: time to first token minus queue and prefill, from vLLM's own metrics.</text>
</svg>
</section></div>
{:/nomarkdown}

| Start (run order) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Cache | on | off | off | on | off | off | on | on |
| Seconds per W01 draw | 1.212 | 6.640 | 6.710 | 1.173 | 6.770 | 6.927 | 1.159 | 1.234 |

Every start without the cache was slower than every start with it. The difference is 5.57 s per W01 draw; p = 1/70, the smallest this design can give. The prompt token IDs were identical in all eight starts. The six requests that start a fresh conversation, where the cache has nothing stored yet, were checked separately. With the cache on, they took 0.010 s longer in total; the registered cost check did not fire, which is not evidence of no cost.

What this does and does not show:
- **Not task time.** The replay is one request at a time with one output token. How much of the 5.57 s a live agent task saves is measured next, with the cache served.
- **Not adopted or served yet.** It is adopted only after the schedule comparison ends, and then served.
- **What remains:** with the cache on, the server still spent 0.75–2.01 s per draw outside queueing and prefill (the arm's mean per draw).

## Next

The next note will report the W01 comparison of the two schedules and the first live W01 runs with the region cache. After that, the parts list ranks the CPU-expert decode wait and the rest of the request front end next.

## Credits

- **DeepSeek** for DeepSeek-V4.1-Flash-1017.
- **diffbot** for the EXL3 3-bit pack and its serving recipe, including the CPU-expert runtime with both schedules and the prompt segment encoder our cache wraps.
- **turboderp** for ExLlamaV3 and the EXL3 format, **vcruz305** for the vllm-exl3 plugin, and **coolbho3k** for the calibration method the pack follows.
- **vLLM** for the engine and its renderer and tokenizer path.
- **Unsloth** for the GGUF our llama.cpp setup used.

## AI assistance

AI agents (Claude and GPT models) designed and ran these tests. An independent AI reviewer checked each design before launch and audited each result afterwards, and an AI agent drafted this post. Artus set the goal, authorized the hardware and asked for these progress notes.
