---
title: 'A Short-Context Drafter on Long-Context Reasoning: Testing JetSpec++ on Qwen3.8-27B'
description: 'The released JetSpec++ drafter for Qwen3.8-27B beat our MTP head on short math prompts. On 77K–224K-token prompts with thinking on, it accepted 1.1–1.2 tokens per step and decoded 3.6–5.6x slower. An FP32 reference check found no large defect in our port on the prompt we checked.'
categories: [AI, Research Notes]
tags: [qwen, vllm, gpu, speculative-decoding]
---

*31 October 2026. One test on one GPU, stopped by a rule written before launch. Not a peer-reviewed paper.*

We tested the released JetSpec++ drafter for Qwen3.8-27B on long-context reasoning, served in vLLM on one RTX PRO 6000.

On short math prompts it beats Qwen's own MTP head. On 77K–224K-token prompts with thinking on, it accepts 1.1–1.2 tokens per step and decodes 3.6–5.6× slower.

[JetSpec++](https://jetspec-project.github.io/jetspecpp-web/) is a new lossless speculative-decoding method from Hao AI Lab. While the target model verifies one block of draft tokens, a second GPU drafts the next block and refines it. For Qwen3.8-27B, the authors report 342 tokens per second on GSM8K, 5.68× autoregressive decoding, on a GB200 pair. They released a drafter for the same Qwen3.8-27B revision we serve.

Our workload is different: long-context agentic coding with Qwen3.8-27B on one RTX PRO 6000 Blackwell. Prompts run from 77K to 224K tokens, and the model thinks before it answers. There the drafter does not help, and the reference check below makes a large bug in our port unlikely on the prompt we checked.

## Summary

- **Long context:** at 77K, 126K and 224K prompt tokens with thinking on, the drafter accepted 1.22, 1.21 and 1.13 tokens per decode step and decoded 41, 34 and 23 tokens per second. Qwen's own MTP head, which we serve, accepted 2.93, 2.99 and 3.11 and decoded 148, 142 and 131.
- **Short prompts, its training regime:** without thinking, it beat the MTP head on math: 5.83 against 4.57 tokens per step on GSM8K and 7.54 against 4.81 on MATH-500, 12% and 36% faster. On MT-Bench, acceptance was a near-tie and MTP5 was faster.
- **Thinking and length:** thinking alone cut its GSM8K acceptance by about 40%. With thinking on, acceptance fell steadily with prompt length, from 2.63 at 1.6K tokens to 1.22 at 77K. The MTP head stayed near 3 throughout.
- **Our port:** on one 76,742-token prompt, vLLM's drafts matched an FP32 run of the released model code on identical inputs in 98–99% of draft slots, and every disagreement was a near-tie. Scored against what the target actually generated, the FP32 reference matched it exactly as far as vLLM's drafts did, on every scored step.
- **What it is not:** this is the released drafter outside the regime it was trained for (at most 4,096 tokens, no thinking, a BF16 target). It is not a verdict on JetSpec++.

## What we tested, and what we did not

The full method runs the drafter, an adapter and refinement passes on a second GPU. It cannot run our workload as released:
- **Context:** the released engine's drafter caches top out at 4,096 tokens, and it rejects longer requests.
- **Hardware:** it has no recipe for the RTX PRO 6000 (SM120).
- **Our task:** our prompts are 77K–224K tokens.

So we tested the part that can run there, the released drafter's first pass. The paper calls it J0. On the paper's own ablation, the first pass alone performs about like stock DFlash. On the 8B model at short context, the full method reaches about 1.3–1.7× the first pass's acceptance (the paper's Tables 12 and 16).

**The drafter.** vLLM already supports this drafter architecture as DFlash. We served the released 27B checkpoint (`JetSpec/jetspec-plus-plus-qwen3p8-27b`) that way, with these settings:
- **Weights:** unchanged.
- **Config:** the config's causal-head flag was mapped to the name vLLM reads.
- **Draft length:** 15 draft tokens per step, its trained block of 16. We also ran 7 tokens as a variant.
- **Precision:** the drafter ran in BF16 with a BF16 draft KV cache. It shares the target's embedding and LM head.

**One patch to vLLM.** vLLM fills the 15 draft slots after the anchor token with a mask token. JetSpec++'s first pass instead fills them with tokens drawn from the context already generated, and it rejects mask inputs. We patched vLLM's draft inputs to match the released code. We also ran stock vLLM's mask filling as a labeled variant.

**The target and the control.** The target was our NVFP4 checkpoint [Percivio/Qwen3.8-27B-NVFP4-all](https://huggingface.co/Percivio/Qwen3.8-27B-NVFP4-all) with an FP8 KV cache. It ran in a vLLM 0.32.1 development build (`c50aca1`) on one RTX PRO 6000 Blackwell Server Edition at 600 W, with greedy decoding and thinking on.

The control, MTP5, is how we serve this model. Qwen3.8's own multi-token-prediction head drafts 5 tokens per step; we use a pruned FP8 copy of it. Only the drafting method differs between arms. The arms ran one after another on the same GPU with the same serving recipe.

## The rule we wrote first

We wrote the decision rules down before launch:
- **(a) Candidate for adoption:** the drafter decodes at least as fast as MTP5 at both 64K and 128K.
- **(b) Worth porting the full method:** the first pass accepts at least 3.5 tokens per step at 64K and 128K. This was a spending rule. A rough estimate put that level near what the full method would need, on two GPUs, to beat our two-GPU setup by a useful margin.
- **(c) Otherwise:** stop.

The first three 64K requests came in at 1.24, 1.19 and 1.23 tokens per step, so rule (c) applied. A planned repeat of the timing pass could not close a 3.6× gap, so we spent the remaining time on diagnostics instead. The whole test used about 2.5 hours of one Spot RTX PRO 6000 (AWS g7e.4xlarge), out of 10 hours authorized.

## Results

### Long context

Pooled decode tokens per second and tokens accepted per decode step:
- **Prompts:** three prompts per context from our benchmark. Each is Django's Python source cut to length, followed by one of three tasks: review the code for a bug, write tests, or explain the codebase.
- **Output:** each request stopped at the benchmark's 2,048-token output limit while the model was still reasoning, so these numbers cover the first 2,048 generated tokens.
- **Scope:** they measure speed and acceptance, not task quality.

| Drafting | 77K prompt tokens | 126K | 224K |
|---|---|---|---|
| MTP5 (Qwen's MTP head, 5 tokens) | 148.2 tok/s, 2.93 | 142.2 tok/s, 2.99 | 130.8 tok/s, 3.11 |
| JetSpec++ drafter, 15 tokens | 41.2 tok/s, 1.22 | 33.9 tok/s, 1.21 | 23.3 tok/s, 1.13 |
| JetSpec++ drafter, 7 tokens | 46.0 tok/s, 1.23 | 37.0 tok/s, 1.20 | 25.7 tok/s, 1.12 |

Time to first token was the same in all arms (17.8–18.2 s at 77K), since drafting does not change prefill. Decoding was 3.6–5.6× slower with the JetSpec++ drafter than with MTP5.

### Short prompts: where it wins

We ran 32 prompts each from GSM8K, MATH-500 and MT-Bench without thinking, with the same 2,048-token output limit. At most 5 of 32 requests per set reached it.

| Drafting | GSM8K | MATH-500 | MT-Bench |
|---|---|---|---|
| JetSpec++ drafter, 15 tokens | 5.83, 285 tok/s | 7.54, 375 tok/s | 3.29, 165 tok/s |
| JetSpec++ drafter, 7 tokens | 4.92, 266 tok/s | 5.78, 325 tok/s | 3.09, 174 tok/s |
| MTP5 | 4.57, 255 tok/s | 4.81, 275 tok/s | 3.34, 191 tok/s |

In the regime it was trained for, the drafter works well. Even its first pass alone, on one GPU and an NVFP4 target, beats the MTP head on math by 12% (GSM8K) and 36% (MATH-500).

### Thinking and prompt length

The drafter was trained on sequences of at most 4,096 tokens: the target's greedy responses in non-thinking mode (the paper's Appendix E). Two departures from that regime each cost acceptance:
- **Thinking:** with thinking on, GSM8K acceptance fell from 5.83 to 3.41 (169 tok/s), below MTP5's 4.14 (231 tok/s).
- **Length:** with thinking on, acceptance declined steadily with prompt length.

{::nomarkdown}
<link rel="stylesheet" href="/assets/posts/qwen3-8-rtx-pro-6000/charts.css">
<div class="brrr"><section class="card" id="c-accept-length">
<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="Line chart of tokens accepted per decode step against prompt length. MTP5 stays between 2.8 and 3.3 from 1.6K to 224K prompt tokens. The JetSpec++ drafter falls from 2.63 at 1.6K to 1.22 at 77K and 1.13 at 224K.">
<rect width="1200" height="675" style="fill:var(--surface,#fcfcfb)"/>
<text x="92.0" y="46.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;fill:var(--ink,#0b0b0b);font-weight:650" text-anchor="start">Tokens accepted per decode step, by prompt length</text>
<text x="92.0" y="76.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">Qwen3.8-27B (our NVFP4 checkpoint) in vLLM on one RTX PRO 6000 Blackwell · thinking on · greedy · higher is better</text>
<rect x="92.0" y="150" width="214.5" height="413" style="fill:var(--grid,#e1e0d9);opacity:.55"/>
<text x="100.0" y="170.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">JetSpec++ trained</text>
<text x="100.0" y="187.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">on ≤ 4K tokens</text>
<line x1="92" x2="950" y1="563.0" y2="563.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="80.0" y="568.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">0</text>
<line x1="92" x2="950" y1="459.8" y2="459.8" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="80.0" y="464.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">1</text>
<line x1="92" x2="950" y1="356.5" y2="356.5" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="80.0" y="361.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">2</text>
<line x1="92" x2="950" y1="253.2" y2="253.2" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="80.0" y="258.2" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">3</text>
<line x1="92" x2="950" y1="150.0" y2="150.0" style="stroke:var(--grid,#e1e0d9);stroke-width:1"/>
<text x="80.0" y="155.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">4</text>
<line x1="92" x2="950" y1="459.8" y2="459.8" style="stroke:var(--axis,#c3c2b7);stroke-width:1.5;stroke-dasharray:5 5"/>
<text x="950.0" y="481.8" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--muted,#898781);font-weight:400" text-anchor="end">1 = no draft token accepted</text>
<line x1="92" x2="950" y1="563" y2="563" style="stroke:var(--axis,#c3c2b7);stroke-width:1"/>
<text x="92.0" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">1K</text>
<text x="199.2" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">2K</text>
<text x="306.5" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">4K</text>
<text x="413.8" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">8K</text>
<text x="521.0" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">16K</text>
<text x="628.2" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">32K</text>
<text x="735.5" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">64K</text>
<text x="842.8" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">128K</text>
<text x="950.0" y="587.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--muted,#898781);font-weight:400" text-anchor="middle">256K</text>
<text x="521.0" y="613.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="middle">Prompt tokens (log scale)</text>
<path d="M165.6,267.7 L368.2,218.1 L640.4,272.9 L759.9,260.5 L836.8,254.3 L925.5,241.9" style="fill:none;stroke:var(--s1,#2a78d6);stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>
<g><title>MTP5 · 1.6K prompt tokens · 2.86 tokens per step · 166.3 tok/s</title><circle cx="165.6" cy="267.7" r="12" style="fill:transparent"/><circle cx="165.6" cy="267.7" r="5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>MTP5 · 6.1K prompt tokens · 3.34 tokens per step · 191.0 tok/s</title><circle cx="368.2" cy="218.1" r="12" style="fill:transparent"/><circle cx="368.2" cy="218.1" r="5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>MTP5 · 35.5K prompt tokens · 2.81 tokens per step · 151.4 tok/s</title><circle cx="640.4" cy="272.9" r="12" style="fill:transparent"/><circle cx="640.4" cy="272.9" r="5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>MTP5 · 76.7K prompt tokens · 2.93 tokens per step · 148.2 tok/s</title><circle cx="759.9" cy="260.5" r="12" style="fill:transparent"/><circle cx="759.9" cy="260.5" r="5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>MTP5 · 126.1K prompt tokens · 2.99 tokens per step · 142.2 tok/s</title><circle cx="836.8" cy="254.3" r="12" style="fill:transparent"/><circle cx="836.8" cy="254.3" r="5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>MTP5 · 223.7K prompt tokens · 3.11 tokens per step · 130.8 tok/s</title><circle cx="925.5" cy="241.9" r="12" style="fill:transparent"/><circle cx="925.5" cy="241.9" r="5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<path d="M165.9,291.5 L264.5,324.5 L324.4,344.1 L368.3,353.4 L491.7,353.4 L640.5,410.2 L759.9,437.0 L836.8,438.1 L925.5,446.3" style="fill:none;stroke:var(--s2,#eb6834);stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>
<g><title>JetSpec++ drafter · 1.7K prompt tokens · 2.63 tokens per step · 132.2 tok/s</title><circle cx="165.9" cy="291.5" r="12" style="fill:transparent"/><circle cx="165.9" cy="291.5" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>JetSpec++ drafter · 3.1K prompt tokens · 2.31 tokens per step · 114.4 tok/s</title><circle cx="264.5" cy="324.5" r="12" style="fill:transparent"/><circle cx="264.5" cy="324.5" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>JetSpec++ drafter · 4.6K prompt tokens · 2.12 tokens per step · 104.2 tok/s</title><circle cx="324.4" cy="344.1" r="12" style="fill:transparent"/><circle cx="324.4" cy="344.1" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>JetSpec++ drafter · 6.1K prompt tokens · 2.03 tokens per step · 98.4 tok/s</title><circle cx="368.3" cy="353.4" r="12" style="fill:transparent"/><circle cx="368.3" cy="353.4" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>JetSpec++ drafter · 13.6K prompt tokens · 2.03 tokens per step · 94.0 tok/s</title><circle cx="491.7" cy="353.4" r="12" style="fill:transparent"/><circle cx="491.7" cy="353.4" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>JetSpec++ drafter · 35.5K prompt tokens · 1.48 tokens per step · 60.5 tok/s</title><circle cx="640.5" cy="410.2" r="12" style="fill:transparent"/><circle cx="640.5" cy="410.2" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>JetSpec++ drafter · 76.7K prompt tokens · 1.22 tokens per step · 41.2 tok/s</title><circle cx="759.9" cy="437.0" r="12" style="fill:transparent"/><circle cx="759.9" cy="437.0" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>JetSpec++ drafter · 126.1K prompt tokens · 1.21 tokens per step · 33.9 tok/s</title><circle cx="836.8" cy="438.1" r="12" style="fill:transparent"/><circle cx="836.8" cy="438.1" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<g><title>JetSpec++ drafter · 223.7K prompt tokens · 1.13 tokens per step · 23.3 tok/s</title><circle cx="925.5" cy="446.3" r="12" style="fill:transparent"/><circle cx="925.5" cy="446.3" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/></g>
<line x1="92" x2="118" y1="107" y2="107" style="stroke:var(--s1,#2a78d6);stroke-width:2"/>
<circle cx="105" cy="107" r="5" style="fill:var(--s1,#2a78d6);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="126.0" y="112.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">MTP5: Qwen's MTP head (pruned FP8), 5 draft tokens</text>
<line x1="512" x2="538" y1="107" y2="107" style="stroke:var(--s2,#eb6834);stroke-width:2"/>
<circle cx="525" cy="107" r="5" style="fill:var(--s2,#eb6834);stroke:var(--surface,#fcfcfb);stroke-width:2"/>
<text x="546.0" y="112.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:400" text-anchor="start">JetSpec++ 27B drafter, first pass, 15 draft tokens</text>
<text x="939.5" y="246.9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">MTP5 3.11</text>
<text x="939.5" y="451.3" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;fill:var(--ink,#0b0b0b);font-weight:600" text-anchor="start">JetSpec++ 1.13</text>
<text x="939.5" y="290.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">at 77K: 2.93 vs 1.22</text>
<text x="939.5" y="307.5" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;fill:var(--ink2,#52514e);font-weight:400" text-anchor="start">148 vs 41 tok/s</text>
<text x="92.0" y="651.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Every request was stopped by the benchmark's 2,048-token output limit, mid-reasoning: these points cover the first 2,048 generated tokens. Speed and acceptance only.</text>
<text x="92.0" y="667.0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12.5px;fill:var(--muted,#898781);font-weight:400" text-anchor="start">Up to 35K: review and explain prompts (MTP5 one prompt per length); 77K and up: three prompts each. Tokens per step = 1 + accepted draft tokens per round.</text>
</svg>
</section></div>
{:/nomarkdown}

| Prompt tokens | JetSpec++ drafter, 15 tokens | MTP5 |
|---|---|---|
| 1.6K | 2.63 (132 tok/s) | 2.86 (166 tok/s) |
| 3.1K | 2.31 (114) | – |
| 4.6K | 2.12 (104) | – |
| 6.1K | 2.03 (98) | 3.34 (191) |
| 13.6K | 2.03 (94) | – |
| 35.5K | 1.48 (60) | 2.81 (151) |
| 76.7K | 1.22 (41) | 2.93 (148) |
| 126.1K | 1.21 (34) | 2.99 (142) |
| 223.7K | 1.13 (23) | 3.11 (131) |

- **Prompts:** up to 35.5K, the drafter's values pool a review and an explain prompt, and MTP5's come from the review prompt alone. From 76.7K up, both pool the three prompts of the table above.
- **No cliff:** the decline is gradual. At 13.6K tokens the prompt is prefilled in two chunks of 8,192 tokens, and acceptance there matched the single-chunk 6.1K prompt (2.03).

**The initialization is not the cause.** With stock vLLM's mask tokens instead of JetSpec's context tokens, acceptance fell the same way. On the review prompt it was 2.72, 1.74 and 1.18 at 1.6K, 13.6K and 76.7K tokens, against 2.82, 2.23 and 1.24 with context tokens.

**Block drafting as such can hold up here.** In an earlier run on the same checkpoint and benchmark, a different block drafter, DFlash2 with 7 draft tokens, accepted 2.91, 2.91 and 3.07 tokens per step at the same three contexts. That run is not part of this test. We did not isolate what differs for this drafter: its 4,096-token training length, its non-thinking training text, or the features of our quantized target.

## Was it our port?

A result this lopsided raises the question of whether the port is simply broken. We checked it three ways.

**Before launch: a code-level check.** An independent reviewer compared the released code with vLLM's drafter path. It found the initialization mismatch described above, which we then patched. It also found that vLLM's drafter would otherwise inherit the target's FP8 KV cache, so we set BF16 explicitly.

**At short context: the same inputs into both implementations.** Our patch dumps every draft step's inputs and outputs: the target's hidden states (the drafter's inputs), the query token ids and their positions. The released `dflash.py` was then run on exactly those inputs. Over 39 decode steps, the two agreed on 99.5% of draft tokens under the shared NVFP4 head. Those anchors sat at positions 65–334, though. That leaves long positions, chunked prefill and the CUDA-graph path we timed untested.

**At long context: one 76,742-token prompt.** We repeated the comparison on one long prompt over the first 37–40 decode steps. It ran three ways: with CUDA graphs and 8,192-token prefill chunks (10 chunks), with CUDA graphs and 32,768-token chunks (3 chunks), and eager with 8,192-token chunks. Building this check taught us three things.

1. **The dumps missed most of the prefill.** On every prefill chunk except the last, vLLM's DFlash drafter only caches the drafter's context keys and values and returns early. That return skipped the code that wrote our dump, so the first attempt captured only the final chunk. We moved the dump; the numerics are unchanged.
2. **vLLM's startup warm-up request drafts too.** With CUDA graphs on, it produced a few draft steps that our first comparison matched against the wrong context. We excluded them.
3. **A BF16 reference is not a reference at 77K positions.** The first readout showed vLLM matching the BF16 reference on only about 84% of draft tokens, which looked like a port bug. But the BF16 reference agreed with an FP32 run of the same code on only about 84% too. At these positions, the BF16 reference is precision-sensitive.

Against the FP32 reference:

| Run | vLLM drafts matching FP32 reference | 1 + leading matches against the recorded continuation (vLLM / FP32 reference) |
|---|---|---|
| CUDA graphs, 8,192-token chunks | 548 of 555 slots (37 steps) | 1.086 / 1.086 (35 scored steps) |
| CUDA graphs, 32,768-token chunks | 586 of 600 slots (40 steps) | 1.179 / 1.179 (39 scored steps) |
| Eager, 8,192-token chunks | 592 of 600 slots (40 steps) | 1.179 / 1.179 (39 scored steps) |

- **Disagreements:** every one was a near-tie. The FP32 reference's top token beat vLLM's token by at most 0.12 logits.
- **Scoring:** the last column scores each draft by how many of its leading tokens match what the target actually generated.
  - The FP32 reference's drafts were never verified by the target, so its score is a counterfactual.
  - It matched vLLM's on every scored step, not only on average.
  - vLLM's scores matched the server's own acceptance counters.
  - Steps whose window ran past the end of the dump (2, 1 and 1) are excluded.

This is strong evidence against a large defect in our drafting path on this prompt and its first 40 or so decode steps. It does not prove the port bug-free at other prompts, at 128K or 256K, or later in a generation.

## What this shows, and what it does not

- **Not a disproof of JetSpec++.** We ran the released drafter outside its regime and without the rest of the method. To match MTP5's acceptance at 77K, the full method would have to multiply its first pass by about 2.4×. On the 8B model at short context, the paper's full method gains about 1.3–1.7×. That is arithmetic across different settings, not a measurement.
- **The cause is open.** Training length, thinking text and the features of our NVFP4 target all differ from the drafter's training regime. We ran no BF16-target arm at long context, so we cannot separate them.
- **Speed and acceptance only.** Every long-context request stopped at the benchmark's 2,048-token output limit while the model was still reasoning. We measured early reasoning, not whole generations, and made no task-quality claim.
- **Small samples.** Three prompts per long context, one or two per length in the sweep, and 32 per short-prompt set, on one GPU type.

For long-context reasoning serving, the practical lesson is to measure a drafter at your own context lengths, with thinking on, before porting anything. A strong short-context number did not carry over here. The model's own MTP head held about three tokens per step from 1.6K to 224K tokens.

## Availability

The JetSpec++ [code](https://github.com/hao-ai-lab/JetSpec), [paper](https://arxiv.org/abs/2610.19792) and [checkpoints](https://huggingface.co/JetSpec) are public. So is the target checkpoint we used, [Percivio/Qwen3.8-27B-NVFP4-all](https://huggingface.co/Percivio/Qwen3.8-27B-NVFP4-all). Our vLLM patch for this test is [one patch file](/assets/posts/jetspec-long-context/vllm-dflash-jetspec-j0.patch) against vLLM `c50aca1`, Apache-2.0 like vLLM. It holds the context-token initialization (`VLLM_DFLASH_CTX_NOISE=1`) and the dump instrumentation (`VLLM_DFLASH_DUMP`), both off by default. Its header gives the one config change the drafter needs and our serving flags. The benchmark prompts and run records are not released with this note.

## AI assistance

AI agents (Claude and GPT models) planned and ran this experiment. An independent AI reviewer checked the design before launch and reproduced the results afterwards, and an AI agent drafted this post. A human authorized the compute and decided to publish.
