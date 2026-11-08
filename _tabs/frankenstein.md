---
title: 'The Frankenstein: Where We Stand'
icon: fas fa-chart-line
order: 0
description: 'A living overview of our DeepSeek-V4.1-Flash server on two RTX PRO 6000 cards at home: how it compares with the same model on other setups, how much faster it got than our first version, what other models do on the same kind of cards, and whether the speed is worth it. Updated as new measurements land.'
---

*Last updated: 8 November 2026, 05:29 UTC. This page changes as new measurements land, and the changelog at the end lists each change. Rows still being measured are marked as such, never estimated. The day-by-day notes are [Parts 1 to 6](#the-story-so-far).*

We run DeepSeek-V4.1-Flash-1017, an open model with 763 billion parameters, on two RTX PRO 6000 Blackwell cards in a workstation at home. As released, it doesn't fit on two cards. So our server is a Frankenstein: diffbot's 3-bit version of the model and their serving recipe, parts from other engines, and parts of our own. This page answers four questions in one place:
- How fast is it, against the same model on other setups?
- How much faster has it become since our first version?
- What do other models do on the same kind of cards?
- Is the speed worth it?

## At a glance

- **Our 2-card server needs 34.8 s of model time per task** on our agent test, or 39.0 s with tools included.
- **NVIDIA's full-quality version on 4 cards needs 36.4 s,** with its drafter set the same way as ours. The two are **about level.** Ours takes about 4.5% less model time, which is less than the spread between single draws. So our 3-bit Frankenstein gets 4-card full-quality speed from half the cards. The price is quality that hasn't been measured on public benchmarks yet.
- **A second 4-card run, with vLLM's default draft setting, needed 42.8 s.** It accepted fewer of the drafter's guesses and thought longer. Whether the setting explains the gap isn't settled with 3 draws each.
- **On AWS's own 2 cards, diffbot's recipe as published needs 58.9 s.** That's the same 3-bit pack, without our parts. The gap down to our 34.8 s is the home hardware plus our parts, and we haven't split it further.
- **Squeezing the full-quality model onto 2 cards costs about 9.5x:** 330.5 s with its drafter (352.9 s without), because the CPU has to compute most of the model. A 2-bit version small enough to fit entirely on 2 cards needed 150.2 s on ExLlamaV3's own server, because diffbot's engine couldn't load it; its drafter wasn't tuned.
- **Since our first version, we're about 2x faster,** from 82.6 s to 39.0 s per task. The first figures come from an older version of the test.
- **Quality:** our 3-bit version has no public benchmark score of its own. On our small test, it passed 83% of tasks. The other setups passed 78% to 94%, on too few tasks to rank them.

## How we measure

- **The test** is our 6-task agent test:
  - two questions about a document of 128,000 or 200,000 tokens;
  - four coding tasks in a code base, with tools to search, read and write files and to run tests.

  Grading is mechanical: exact facts and line citations for the questions, hidden tests for the code. A *draw* is one pass over all 6 tasks.
- **Model seconds per task** are the time the model spends reading and writing, on the server's own clock, averaged over the tasks. This is the number we rank by.
- **Task seconds per task** add the tools and the network, on the client's clock.
- **Single-user speed:** every number on this page is for one request at a time. Serving several users at once is a separate question; see [Throughput](#throughput-several-users-at-once-measuring).
- **Every DeepSeek row uses the same settings:** temperature 1.0, top-p 0.95, thinking on and one request at a time.
- **Drafters:** a drafter is a small model that guesses a few tokens ahead, and the big model checks all the guesses in one step. It changes the speed, not what the model would write. Its guesses can be its single top choice (*greedy*) or sampled from its probabilities (*probabilistic*), and that can change how many guesses are accepted. Our server samples them. Every setup gets its drafter unless the row says otherwise. Short tests picked how many tokens ahead it guesses for NVIDIA's FP4 and for full quality on 2 cards. Ours kept 5 after a test against 7 on 1 November. diffbot's recipe as published and the 2-bit version used 5 without a test.
- **Where the tools run:** in a sandbox on our Mac at home. The AWS runs reach the Mac over the internet, so their task seconds include extra network time. That's why we rank by model seconds.

## Is it worth it?

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-worth-it">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Scatter plot of seconds per task, on a log scale, against each maker's DeepSWE v1.1 score. DeepSeek-V4.1-Flash-1017 at 77.0: ours, 3-bit on 2 cards, 34.8 s, drawn hollow because 77.0 is the full model's score; NVIDIA's FP4 on 4 cards 36.4 s; a 2-bit version on 2 cards 150.2 s, drafter not tuned, hollow; full quality on 2 cards with its drafter 330.5 s. Qwen3.8 Flash Next at 58.7: 77.7 s as released, 49.9 s on our tuned stack. Qwen3.8 27B at 42.2: 181.3 s as released, 140.3 to 145.1 s tuned. Tuned points are hollow too.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="60.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Is it worth it? Time per task against a public coding score</text>
<text x="60.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSWE v1.1 as each maker reports it · seconds per task on our 6-task agent test, one request at a time · up and left is better</text>
<circle cx="68" cy="112" r="7" style="fill:var(--s1,#2a78d6)"/>
<text x="82.0" y="117.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash-1017, other setups</text>
<circle cx="412.8" cy="112" r="7" style="fill:none;stroke:var(--s2,#eb6834);stroke-width:3"/>
<text x="426.8" y="117.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Ours, 3-bit</text>
<circle cx="552.4" cy="112" r="7" style="fill:var(--s3,#1baf7a)"/>
<text x="566.4" y="117.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Qwen3.8</text>
<circle cx="661.5999999999999" cy="112" r="7" style="fill:none;stroke:var(--muted,#898781);stroke-width:3"/>
<text x="675.6" y="117.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Hollow: no score of its own</text>
<line x1="110" x2="1120" y1="489.5" y2="489.5" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="494.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">40</text>
<line x1="110" x2="1120" y1="418.5" y2="418.5" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="423.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">50</text>
<line x1="110" x2="1120" y1="347.5" y2="347.5" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="352.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">60</text>
<line x1="110" x2="1120" y1="276.5" y2="276.5" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="281.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">70</text>
<line x1="110" x2="1120" y1="205.5" y2="205.5" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="98.0" y="210.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">80</text>
<line x1="171.5" x2="171.5" y1="170" y2="525" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="171.5" y="547.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">30 s</text>
<line x1="343.7" x2="343.7" y1="170" y2="525" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="343.7" y="547.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">50 s</text>
<line x1="577.4" x2="577.4" y1="170" y2="525" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="577.4" y="547.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">100 s</text>
<line x1="811.1" x2="811.1" y1="170" y2="525" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="811.1" y="547.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">200 s</text>
<line x1="1044.8" x2="1044.8" y1="170" y2="525" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="1044.8" y="547.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">400 s</text>
<text x="1120.0" y="569.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">seconds per task (log scale)</text>
<text x="60.0" y="152.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">DeepSWE v1.1 score</text>
<g><title>Full quality on 2 cards (AWS), with its DSpark drafter: 330.5 s model time per task, 2 draws (352.9 s without the drafter) · DeepSWE 77.0</title><circle cx="980.4" cy="226.8" r="15" style="fill:transparent"/><circle cx="980.4" cy="226.8" r="9" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>2-bit version, all on 2 cards (AWS, TabbyAPI + ExLlamaV3), drafter not tuned: 150.2 s model time per task · 77.0 is the full model's score, an upper bound here</title><circle cx="714.5" cy="226.8" r="15" style="fill:transparent"/><circle cx="714.5" cy="226.8" r="9" style="fill:var(--surface,#fcfcfb);stroke:var(--s1,#2a78d6);stroke-width:3"/></g>
<g><title>NVIDIA's FP4 on 4 cards (AWS), draft setting as ours: 36.4 s model time per task · DeepSWE 77.0</title><circle cx="236.9" cy="226.8" r="14" style="fill:transparent"/><circle cx="236.9" cy="226.8" r="8" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Ours, 3-bit on 2 cards: 34.8 s model time per task · 77.0 is the full model's score, an upper bound for ours</title><circle cx="221.3" cy="226.8" r="14" style="fill:transparent"/><circle cx="221.3" cy="226.8" r="8" style="fill:var(--surface,#fcfcfb);stroke:var(--s2,#eb6834);stroke-width:3"/></g>
<line x1="478.5" x2="365.1" y1="356.7" y2="356.7" style="stroke:var(--muted,#898781);stroke-width:1.5"/><path d="M359.1 356.7 l8 -5 v10 Z" style="fill:var(--muted,#898781)"/>
<g><title>Qwen3.8 Flash Next as released (FP8), 2 cards (AWS): 77.7 s task time per task, 1 draw · DeepSWE 58.7</title><circle cx="492.5" cy="356.7" r="15" style="fill:transparent"/><circle cx="492.5" cy="356.7" r="9" style="fill:var(--s3,#1baf7a);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Qwen3.8 Flash Next on our tuned stack, 2 cards (AWS): 49.9 s task time per task, 3 draws · 58.7 is the release's score, an upper bound here</title><circle cx="343.1" cy="356.7" r="15" style="fill:transparent"/><circle cx="343.1" cy="356.7" r="9" style="fill:var(--surface,#fcfcfb);stroke:var(--s3,#1baf7a);stroke-width:3"/></g>
<line x1="764.0" x2="724.9" y1="473.9" y2="473.9" style="stroke:var(--muted,#898781);stroke-width:1.5"/><path d="M718.9 473.9 l8 -5 v10 Z" style="fill:var(--muted,#898781)"/>
<g><title>Qwen3.8 27B as released (FP8), 1 card (AWS): 181.3 s task time per task, 1 draw · DeepSWE 42.2</title><circle cx="778.0" cy="473.9" r="15" style="fill:transparent"/><circle cx="778.0" cy="473.9" r="9" style="fill:var(--s3,#1baf7a);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>Qwen3.8 27B on our tuned stacks, 1 card (AWS): 140.3 to 145.1 s task time per task, three runs · 42.2 is the release's score, an upper bound here</title><rect x="676.6" y="458.9" width="41.3" height="30" style="fill:transparent"/><line x1="691.6" x2="702.9" y1="473.9" y2="473.9" style="stroke:var(--s3,#1baf7a);stroke-width:21;stroke-linecap:round"/><line x1="691.6" x2="702.9" y1="473.9" y2="473.9" style="stroke:var(--surface,#fcfcfb);stroke-width:15;stroke-linecap:round"/></g>
<text x="209.3" y="204.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Ours, 3-bit, 2 cards: 34.8 s</text>
<text x="224.9" y="260.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">NVIDIA's FP4, 4 cards: 36.4 s</text>
<text x="714.5" y="260.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">2-bit, all on 2 cards: 150.2 s</text>
<text x="714.5" y="280.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">drafter not tuned</text>
<text x="980.4" y="204.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="end">Full quality, 2 cards, with its drafter: 330.5 s</text>
<text x="333.1" y="334.7" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Qwen3.8 Flash Next, 2 cards: 77.7 s as released, 49.9 s tuned</text>
<text x="679.6" y="451.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Qwen3.8 27B, 1 card: 181.3 s as released, 140.3-145.1 s tuned</text>
<text x="60.0" y="617.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">DeepSeek's points use model time (server clock, temperature 1.0), each with its drafter; the Qwen points use task time from October runs with greedy decoding.</text>
<text x="60.0" y="635.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Hollow: lower-precision weights with no score of their own, so the release's score is an upper bound. NVIDIA's FP4 has its own, within 0.7 points of the original.</text>
<text x="60.0" y="653.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">The makers ran DeepSWE in different harnesses. Ours runs on Workstation Edition cards at home, the other points on AWS's Server Edition.</text>
</svg>
</section></div>
{:/nomarkdown}

Each point is one model on one setup. Across is its time per task. Up is the score its maker reports on DeepSWE v1.1, a public benchmark of agentic coding. Up and to the left is better. DeepSWE v1.1 is the one score that all three makers report. Arrows go from a Qwen release to our tuned stack for it.
- **Time:** DeepSeek's points use model time. The Qwen points use task time, from October runs with greedy decoding. Those runs ran the tools on the GPU machine itself, so there was no internet hop, and they were graded with a variant that accepts one more wording on one question.
- **Hollow points have no score of their own.** Their weights are at lower precision than the release the score is for, so that score is an upper bound for them:
  - our 3-bit version, under DeepSeek's 77.0 for the full model;
  - the Qwen models on our tuned stacks, which run lower-precision weights than Qwen's releases;
  - the 2-bit version that fits on 2 cards. turboderp reports 90.4% on GPQA Diamond for it, against 90.2% for the original (a figure turboderp took from OpenRouter), but it has no DeepSWE score.

  NVIDIA's FP4 version is drawn solid because NVIDIA reports its own scores, within 0.7 points of the original on six benchmarks. Every DeepSeek point on the chart has its drafter, and NVIDIA's 4-card run is the one with the same draft setting as ours.
- **Harnesses:** the makers ran DeepSWE in different harnesses:
  - DeepSeek used Mini-SWE-V2;
  - Qwen3.8 27B used Claude Code;
  - Qwen3.8 Flash Next used the better of Claude Code and mini-SWE-agent.

## The same model on other setups

{::nomarkdown}
<div class="brrr"><section class="card" id="c-same-model-setups">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 740" width="1200" height="740" role="img" aria-label="Bar chart of model seconds per task for DeepSeek-V4.1-Flash-1017 on our 6-task agent test, one request at a time. Ours, 3-bit on 2 cards at home with its drafter: 34.8 s. NVIDIA's FP4 on 4 cards on AWS: 36.4 s with the same draft setting as ours, 42.8 s with vLLM's default, 76.1 s without a drafter. On AWS's 2 cards: diffbot's recipe as published 58.9 s, a 2-bit version on the cards 150.2 s with an untuned drafter, full quality with the experts on the CPU 330.5 s with its drafter and 352.9 s without.">
<rect width="1200" height="740" style="fill:var(--surface,#fcfcfb)"/>
<text x="60.0" y="50.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">One model, several setups: model time per task</text>
<text x="60.0" y="80.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">DeepSeek-V4.1-Flash-1017 on our 6-task agent test · server clock · one request at a time · lower is better</text>
<line x1="520.0" x2="520.0" y1="114" y2="594" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="520.0" y="614.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">0</text>
<line x1="667.5" x2="667.5" y1="114" y2="594" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="667.5" y="614.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">100 s</text>
<line x1="815.0" x2="815.0" y1="114" y2="594" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="815.0" y="614.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">200 s</text>
<line x1="962.5" x2="962.5" y1="114" y2="594" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="962.5" y="614.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">300 s</text>
<line x1="1110.0" x2="1110.0" y1="114" y2="594" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="1110.0" y="614.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">400 s</text>
<text x="60.0" y="140.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">Ours: the 3-bit Frankenstein</text>
<text x="60.0" y="160.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">2 cards at home · DSpark drafter · 54 draws</text>
<g><title>Ours: the 3-bit Frankenstein: 34.8 s of model time per task</title><path d="M520 133 h47.3 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-47.3 Z" style="fill:var(--s2,#eb6834)"/><rect x="520" y="128" width="60.0" height="34" style="fill:transparent"/></g>
<text x="581.3" y="150.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">34.8 s</text>
<text x="60.0" y="200.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">NVIDIA's FP4, full quality</text>
<text x="60.0" y="220.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">4 cards on AWS · DSpark, draft setting as ours · 3 draws</text>
<g><title>NVIDIA's FP4, full quality: 36.4 s of model time per task</title><path d="M520 193 h49.7 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-49.7 Z" style="fill:var(--s1,#2a78d6)"/><rect x="520" y="188" width="60.0" height="34" style="fill:transparent"/></g>
<text x="583.7" y="210.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">36.4 s</text>
<text x="60.0" y="260.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">NVIDIA's FP4, vLLM's default drafts</text>
<text x="60.0" y="280.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">4 cards on AWS · DSpark, greedy draft setting · 3 draws</text>
<g><title>NVIDIA's FP4, vLLM's default drafts: 42.8 s of model time per task</title><path d="M520 253 h59.1 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-59.1 Z" style="fill:var(--s1,#2a78d6)"/><rect x="520" y="248" width="63.1" height="34" style="fill:transparent"/></g>
<text x="593.1" y="270.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">42.8 s</text>
<text x="60.0" y="320.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">diffbot's recipe as published</text>
<text x="60.0" y="340.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">2 cards on AWS · same 3-bit pack, without our parts · 3 draws</text>
<g><title>diffbot's recipe as published: 58.9 s of model time per task</title><path d="M520 313 h82.9 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-82.9 Z" style="fill:var(--s1,#2a78d6)"/><rect x="520" y="308" width="86.9" height="34" style="fill:transparent"/></g>
<text x="616.9" y="330.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">58.9 s</text>
<text x="60.0" y="380.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">NVIDIA's FP4, no drafter</text>
<text x="60.0" y="400.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">4 cards on AWS · shows what the drafter is worth · 3 draws</text>
<g><title>NVIDIA's FP4, no drafter: 76.1 s of model time per task</title><path d="M520 373 h108.3 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-108.3 Z" style="fill:var(--s1,#2a78d6)"/><rect x="520" y="368" width="112.3" height="34" style="fill:transparent"/></g>
<text x="642.3" y="390.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">76.1 s</text>
<text x="60.0" y="440.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">2-bit, all on 2 cards</text>
<text x="60.0" y="460.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">AWS · turboderp's EXL3, ExLlamaV3 · drafter not tuned · 3 draws</text>
<g><title>2-bit, all on 2 cards: 150.2 s of model time per task</title><path d="M520 433 h217.5 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-217.5 Z" style="fill:var(--s1,#2a78d6)"/><rect x="520" y="428" width="221.5" height="34" style="fill:transparent"/></g>
<text x="751.5" y="450.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">150.2 s</text>
<text x="60.0" y="500.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Full quality on 2 cards</text>
<text x="60.0" y="520.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">AWS · experts computed by the CPU · DSpark, 3 tokens · 2 draws</text>
<g><title>Full quality on 2 cards: 330.5 s of model time per task</title><path d="M520 493 h483.5 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-483.5 Z" style="fill:var(--s1,#2a78d6)"/><rect x="520" y="488" width="487.5" height="34" style="fill:transparent"/></g>
<text x="1017.5" y="510.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">330.5 s</text>
<text x="60.0" y="560.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">Full quality on 2 cards, no drafter</text>
<text x="60.0" y="580.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">AWS · experts computed by the CPU · 3 draws</text>
<g><title>Full quality on 2 cards, no drafter: 352.9 s of model time per task</title><path d="M520 553 h516.5 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-516.5 Z" style="fill:var(--s1,#2a78d6)"/><rect x="520" y="548" width="520.5" height="34" style="fill:transparent"/></g>
<text x="1050.5" y="570.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">352.9 s</text>
<line x1="520" x2="520" y1="114" y2="594" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="60.0" y="682.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Model time: the model's reading and writing per task on the server's own clock, mean over the draws (a draw is all 6 tasks once).</text>
<text x="60.0" y="700.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Ours runs on RTX PRO 6000 Workstation Edition cards at home, the AWS rows on Server Edition cards; our parts aren't on AWS, so these gaps mix hardware and software.</text>
<text x="60.0" y="718.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Our 3-bit version has no public benchmark score. NVIDIA reports its FP4 within 0.7 points of the original on six benchmarks.</text>
</svg>
</section></div>
{:/nomarkdown}

| Setup | Cards | Drafter | Model s per task | Task s per task | Passed | Writes, tokens/s | Draws |
|---|---|---|---:|---:|---:|---:|---:|
| **Ours: the 3-bit Frankenstein** | 2 Workstation, home | DSpark 5 | **34.8** | **39.0** | 270/324 | 259.4 | 54 |
| **NVIDIA's FP4, full quality** | 4 Server, AWS | DSpark 5 | **36.4** | 59.3 | 15/18 | 244.8 | 3 |
| NVIDIA's FP4, vLLM's default draft setting | 4 Server, AWS | DSpark 5, greedy | 42.8 | 63.9 | 15/18 | 227.0 | 3 |
| diffbot's recipe as published | 2 Server, AWS | DSpark 5 | 58.9 | 82.9 | 17/18 | 172.6 | 3 |
| NVIDIA's FP4, no drafter | 4 Server, AWS | none | 76.1 | 103.8 | 14/18 | 102.5 | 3 |
| 2-bit, all on 2 cards | 2 Server, AWS | MTP 5, not tuned | 150.2 | 195.9 | 14/18 | 88.8 | 3 |
| **Full quality on 2 cards** | 2 Server, AWS | DSpark 3 | **330.5** | 364.3 | 10/12 | 26.5 | 2 |
| Full quality on 2 cards, no drafter | 2 Server, AWS | none | 352.9 | 384.4 | 16/18 | 24.3 | 3 |

The setups:
- **Ours:** diffbot's EXL3 3-bit pack in vLLM, plus our parts, on RTX PRO 6000 Workstation Edition cards at home.
- **NVIDIA's FP4:** full quality where it fits. This is NVIDIA's 4-bit version in vLLM, on 4 RTX PRO 6000 Server Edition cards.
  - The first row samples the drafter's guesses, as our server does.
  - The second keeps vLLM's default, the drafter's top guess.
  - The row without a drafter is there only to show what the drafter is worth.
- **diffbot's recipe as published:** the same 3-bit pack and serving recipe as ours, exactly as diffbot published them, on AWS's 2 cards. Our parts aren't in it. The CPU computes its rarest experts on 2 × 11 cores of a 24-core Xeon, against 64 Zen 5 cores at home.
- **2-bit, all on 2 cards:** turboderp's EXL3 at 2.25 bits per weight, small enough that every weight fits on the cards.
  - diffbot's engine can't load it: turboderp quantizes every layer, and diffbot's engine expects that only for the experts.
  - So it ran on TabbyAPI with ExLlamaV3 1.6.6, using its MTP head as the drafter, 5 tokens ahead. We didn't test other lengths, so its drafter isn't tuned.
  - The engine and the quantization both differ from the other rows, so this row doesn't isolate either one.
- **Full quality on 2 cards:** the original model on 2 cards, with most of its experts computed by the CPU (SGLang and kTransformers).
  - The first row has DeepSeek's DSpark drafter, guessing 3 tokens ahead, which beat 5 in a short test.
  - It differs from the row without a drafter in two more ways. A one-line patch was needed before the drafter would load at all. And the recipe's KV-memory lending is off: it keeps more experts on the cards in spare KV-cache memory, and with it on, the first drafted step crashed.
- **DSpark 5** and **DSpark 3** are DeepSeek's DSpark drafter, guessing 5 or 3 tokens ahead.

Notes:
- **Single-user speed:** every row is one request at a time. How many users each setup serves at once is not measured yet ([Throughput](#throughput-several-users-at-once-measuring)).
- **Hardware differs.** Ours runs on Workstation Edition cards at home, capped at 500 W while the CPU is busy and at 600 W otherwise. The AWS rows run on Server Edition cards, and the 2-card ones on a smaller CPU. Our parts aren't on AWS, so diffbot's recipe as published is the AWS baseline. On the same AWS cards, the 4-card FP4 run takes 0.62x its time, the 2-bit run 2.55x, and full quality on 2 cards with its drafter 5.6x.
- **What the drafter is worth:** on the 4-card setup, it cuts model time from 76.1 s to 36.4 s (2.1x). The two drafted runs differ by 6.4 s per task. The run with vLLM's default accepted fewer guesses per step (2.45 against 2.78), and its draws thought 12% longer. That the draft setting causes the gap is a hypothesis with 3 draws each, not a result. The draft length of 5 tokens matches our server; a short test of 3, 5 and 7 before the first drafted run found 3 and 5 tied.
- **With the experts on the CPU, the drafter is worth little:** full quality on 2 cards took 330.5 s with it, against 352.9 s without (0.94x). Read that as no worse, maybe 5 to 10% better, not as a measured gain: the draws without it ranged from 306 to 377 s per task, and the two setups differ in more than the drafter (above). The CPU still computes most of the experts, and a drafter can't change that. Our reading, not measured: each guess the big model checks costs CPU work too.
- **The 2-bit version writes slower as the context grows:** 77 tokens/s at 128,000 tokens in a short test, against 163 to 184 at 8,000 to 64,000.
- **Few draws on AWS:** 3 draws each (18 tasks), and 2 for full quality on 2 cards with its drafter (12 tasks), against our 54. Pass counts from 12 or 18 tasks are too few to rank quality. Every failed task on AWS was one of the two document questions, on citations, and every coding task passed.
- **The "original":** DeepSeek ships the model's experts in 4-bit form, so the original is already 4-bit where most of the weights are. NVIDIA's FP4 version makes their arithmetic 4-bit too, and NVIDIA reports it within 0.7 points of the original on the six benchmarks it ran.
- **Our row** was measured on 5 November. The part we added since (our top-k kernel, Part 5) saves about 0.3 ms per decoding step, too little to show up in task time with the rows run so far.
- **Writing speed** is on the server's clock, while the model writes.
- **Mac load:** five AWS draws ran while our Mac had extra work on it: two of the 4-card draws without the drafter, one of diffbot's recipe as published and two of the 2-bit version. That affects only their task seconds; model time is counted on the AWS machine.

## How much faster than our first version

| Version | Date | Task s per task | Draws | Test version |
|---|---|---:|---:|---|
| The first version we served: llama.cpp with Unsloth's 2-bit GGUF and the DSpark drafter | 31 Oct | 82.6 | 3 | older |
| diffbot's recipe (vLLM and their 3-bit pack) as they published it | 31 Oct | 59.3 | 3 | older |
| The same, on today's test | 1 Nov | 46.7 | 3 | today's |
| Today's served Frankenstein | 5 Nov | **39.0** (model time 34.8) | 54 | today's |

- **About 2x faster than the first version we served** (82.6 s against 39.0 s per task).
- **About 1.2x faster than diffbot's recipe as published,** when both ran today's test (46.7 s against 39.0 s). The 31 October run of that recipe took 59.3 s on the older test.
- **Not one clean series:** the two test versions differ in the facts of one question, and the early rows are only 3 draws each. A clean rerun of the published recipe on today's test is queued on our box.
- **Since 2 November, task time has stayed flat inside its spread.** The gains since then are inside each decoding step. A step took 14.42 ms on 5 November's rows, and our own top-k kernel took about 0.31 ms off that (Parts 4 and 5).

## Other models on the same kind of cards

From our October campaign with Qwen3.8 models, on AWS's Server Edition cards.

| Model | Cards | Drafter | Task s per task: as released, then on our tuned stack | Draws | DeepSWE v1.1 |
|---|---|---|---|---:|---:|
| Qwen3.8 Flash Next | 2 Server, AWS | MTP, 3 tokens | 77.7, then **49.9** | 1, then 3 | 58.7 |
| Qwen3.8 27B | 1 Server, AWS | MTP, 5 tokens | 181.3, then **140 to 145** | 1, then 3 (two stacks) | 42.2 |
| *For scale: DeepSeek-V4.1-Flash-1017, ours* | *2 Workstation, at home* | *DSpark, 5 tokens* | *39.0 (model time 34.8)* | *54* | *77.0 for the full model* |

- **Different settings from the DeepSeek rows:** these runs used greedy decoding, ran the tools on the GPU machine (no internet hop) and were graded with the variant described above. Their times are task time.
- **Our tuned stacks** run the models at lower precision than the releases, with our own kernels, among them SilentMountain's decoding kernel for Flash Next's experts. In October we checked them against the releases on our own tests (math questions, needles in long documents and this agent test), but they have no public scores of their own.
- **A rerun of Flash Next on our home box** with the DeepSeek rows' settings is queued. It replaces this row when it lands.

## Throughput: several users at once (measuring)

Everything above is single-user speed. How much a box can serve to many users at once is a different question, and we have no concurrency numbers yet for either model. This section will show none until we measure them. What we know so far:
- **Qwen3.8 Flash Next fits on one card.** NVIDIA's 4-bit version of it, on our tuned one-card stack, took 55.5 s per task (one draw, 5 of 6 tasks passed; AWS, greedy decoding), against 49.9 s on two cards together. So a 2-card box can run two copies at once, one per card.
- **Each copy should also serve many users at once cheaply.** It uses only about 6 billion of its parameters per token, and its linear-attention layers (Gated DeltaNet) keep a fixed-size state per request. This is an expectation, not a measurement.
- **Our DeepSeek setup needs both cards for one copy,** and the CPU computes its rarest experts, which likely limits how many users it can serve at once. This isn't measured either.

## Still measuring

- diffbot's recipe as published, rerun on today's test on our box.
- Qwen3.8 Flash Next on our box, with the DeepSeek rows' settings.
- Throughput with several users at once, for both models.

## The story so far

- [Part 1](/2026/11/02/frankenstein-part-1.html): the body, vLLM with diffbot's 3-bit pack in place of llama.cpp, and a faster schedule for the experts the CPU computes.
- [Part 2](/2026/11/03/frankenstein-part-2.html): a part from another fork, vLLM-Moet's overlap for these cards, and a cache for repeated prompts.
- [Part 3](/2026/11/04/frankenstein-part-3.html): a plan for which experts the CPU computes, made from our own agent traffic, and a newer vLLM base we turned down.
- [Part 4](/2026/11/06/frankenstein-part-4.html): our first own part, an exact top-k kernel for the attention indexer.
- [Part 5](/2026/11/07/frankenstein-part-5.html): that kernel in served traffic, 0.31 ms faster per decoding step.
- [Part 6](/2026/11/08/frankenstein-part-6.html): two cards about level with NVIDIA's FP4 on four, draw by draw, what the two cards cost and what our 3-bit weights cost in fidelity.

## Credits

- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and its DSpark drafter.
- **NVIDIA** for the FP4 version.
- **vLLM** for the engine of the 4-card runs and of our server.
- **diffbot** for the EXL3 3-bit pack and the serving recipe our server builds on, also run as published on AWS.
- **turboderp** for EXL3, ExLlamaV3 and the 2.25-bit version.
- **theroyallab** for TabbyAPI, which served the 2.25-bit version.
- **SGLang** and **kTransformers** (kt-kernel) for the run with the experts on the CPU.
- **Unsloth** for the GGUF of our first version, and **llama.cpp** for its engine.
- **The Qwen team** for Qwen3.8 Flash Next and Qwen3.8 27B.
- **kacper-daftcode** for vLLM-Moet's SM120 overlap, still served.

## AI assistance

AI agents (Claude and GPT models) designed, ran and checked these measurements and built our parts of the server, and an AI agent drafted this page. Artus set the goal, approved the hardware and the AWS budget, and asked for this overview.

## Changelog

- **8 November 2026, 05:29 UTC:** [Part 6](/2026/11/08/frankenstein-part-6.html) is linked under "The story so far". It reads this page's first two rows draw by draw, and adds what the two cards our server doesn't need cost and what our 3-bit weights cost in fidelity. No number on this page changed.
- **8 November 2026, 05:10 UTC:** the first table and its bar chart are sorted by model time per task, fastest first: diffbot's recipe as published (58.9 s) now comes before NVIDIA's FP4 without a drafter (76.1 s). No number changed.
- **7 November 2026, 16:28 UTC:** one wording fixed: our server's draft length was tested too (5 kept over 7, on 1 November), so the drafter note now says so.
- **7 November 2026, 16:20 UTC:** the first table's last measuring row is in:
  - **Full quality on 2 cards with its drafter** took 330.5 s (2 draws), against 352.9 s without. That's no worse, maybe 5 to 10% better, inside the spread. So squeezing the model onto 2 cards costs about 9.5x ours, not 10x.
  - **On the chart,** the full-quality point moved to 330.5 s, so every DeepSeek point there has its drafter.
  - **The 2-bit row** now says its drafter wasn't tuned.
  - **The Mac-load note** now names all five AWS draws that ran with extra work on our Mac.
- **7 November 2026, 13:33 UTC:** AWS round 2 changes the headline:
  - **About level now, not 1.2x.** NVIDIA's 4-card FP4 run with the same draft setting as ours took 36.4 s, against our 34.8 s, so "about 1.2x faster" no longer stands. The 42.8 s run stays, as a second run with vLLM's default draft setting.
  - **The "ours on AWS's cards" row is replaced** by diffbot's recipe as published on AWS (58.9 s), because our parts aren't on AWS.
  - **The 2-bit version that fits on 2 cards** took 150.2 s, on TabbyAPI and ExLlamaV3.
  - **New on the chart:** the 4-card point moved to 36.4 s, and the 2-bit point is added.
- **7 November 2026, 12:50 UTC:** the first table made narrower, with the setups described below it; no numbers changed.
- **7 November 2026, 12:48 UTC:** a note that every number is single-user speed, under the first table and on both charts, and a Throughput section, still measuring.
- **7 November 2026, 12:43 UTC:** first version. It has 4 setups of DeepSeek-V4.1-Flash-1017 on our test (3 of them new, run on AWS on 7 November), our progress since 31 October, two Qwen3.8 models from October, and the time-against-score chart. Five rows are still measuring.
