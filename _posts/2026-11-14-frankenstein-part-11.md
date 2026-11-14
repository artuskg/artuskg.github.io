---
title: 'The Frankenstein, Part 11: Our Serving Code Is Public'
description: 'Part 11 of assembling a DeepSeek-V4.1-Flash server on two RTX PRO 6000s. Everything we serve on top of diffbot''s 3-bit recipe is now in our public sm120-serving repository: the patches, our indexer top-k kernel, the host-expert plan, the RAM KV tier settings and a start script that reproduces our served container. The tuned Qwen3.8 stacks from October are there too.'
categories: [AI, Research Notes]
tags: [deepseek, qwen, vllm, gpu, cuda, blackwell, open-source]
---

*14 November 2026. A short note in the series that began with [Part 1](/2026/11/02/frankenstein-part-1.html). [Where We Stand](/frankenstein/) has all the numbers.*

When we started tuning Qwen3.8 on these cards in October, we promised to publish the serving code. It's now public, for the Qwen stacks and for the DeepSeek server this series is about: **[github.com/Percivio-Ltd/sm120-serving](https://github.com/Percivio-Ltd/sm120-serving)** (Apache-2.0).

## The Frankenstein

[`deepseek-v4.1-flash-2x-rtx-pro-6000/`](https://github.com/Percivio-Ltd/sm120-serving/tree/master/deepseek-v4.1-flash-2x-rtx-pro-6000) is what we serve today on two RTX PRO 6000 Workstation Edition cards. It starts from [diffbot's EXL3 3-bit pack and serving recipe](https://huggingface.co/diffbot/DeepSeek-V4.1-Flash-EXL3-3bpw-2x-RTX-PRO-6000), which stay as diffbot ships them, and adds our parts as patches and files.

| Part | From | What it bought, when it went in |
|---|---|---|
| A schedule for the experts the CPU computes | [Part 1](/2026/11/02/frankenstein-part-1.html) | 2.07% less time per verify step |
| A cache for repeated prompt regions | Part 1 | 5.57 s less server time per pass of our test |
| vLLM-Moet's mHC overlap (kacper-daftcode's, fetched from their repository) | [Part 2](/2026/11/03/frankenstein-part-2.html) | 4.88% less time per verify step |
| A host-expert plan fitted to our own agent traffic | [Part 3](/2026/11/04/frankenstein-part-3.html) | 2.42% less time per verify step |
| Our exact multi-CTA indexer top-k kernel | [Parts 4](/2026/11/06/frankenstein-part-4.html) and [5](/2026/11/07/frankenstein-part-5.html) | 0.31 ms less per verify step |
| The RAM KV tier, with a fix to vLLM's offload worker | [Parts 8](/2026/11/12/frankenstein-part-8.html) and [9](/2026/11/13/frankenstein-part-9.html) | 2.4x the graded tasks per hour at 8 sessions |
| CUDA graph sizes matched to the drafter's batches | new, 14 November | adopted; its numbers come in a later part |

The directory's README names each part's setting or patch and what it changes, and a start script sets everything on top of the recipe's defaults.

**How close is it to what we serve?** We ran the start script against a stand-in for docker and compared it with our running container's recorded configuration. The vLLM arguments are identical apart from the host address, and so is the environment, except for one variable a simpler packaging of our hook makes unnecessary. The patches apply cleanly to diffbot's and vLLM's public files and reproduce our served code, apart from reworded comments. Every comment we reworded removed an internal name.

**What we haven't done:** run the build steps end to end on a fresh machine. They are written from the records of our own box. If a step is missing, an issue on the repository is welcome.

## The Qwen3.8 stacks

The October work on Qwen3.8 ([X thread, 28 October](https://x.com/artuskg/status/2115339268273127511)) is in the same repository. The 27B recipe and the pruned draft head were already there; these three stacks are new:

| Directory | Stack | One request at a time, decode speed |
|---|---|---|
| [`qwen3.8-flash-next-nvfp4-2gpu/`](https://github.com/Percivio-Ltd/sm120-serving/tree/master/qwen3.8-flash-next-nvfp4-2gpu) | Flash Next on 2 cards: W8A16 decode GEMMs, fused hyper-connection kernels, an INT4 pruned draft head, a FlashInfer prefill path for the experts, and K-FDEC v8, our decode MoE kernel | 1.76–1.87× the official FP8 release with MTP, at 64K–256K |
| [`qwen3.8-flash-next-nvfp4-1gpu/`](https://github.com/Percivio-Ltd/sm120-serving/tree/master/qwen3.8-flash-next-nvfp4-1gpu) | Flash Next on 1 card, with a checkpoint rebuild script and K-FDEC v8 | 1.76–1.84× NVIDIA's NVFP4 release with MTP |
| [`qwen3.8-27b-nvfp4-all-katt2b/`](https://github.com/Percivio-Ltd/sm120-serving/tree/master/qwen3.8-27b-nvfp4-all-katt2b) | The 27B with katt2b, a prefill path for the FP8 KV cache | 1.11–1.19× shorter time to first token |

These were measured on AWS's Server Edition cards in October, each on one host with three benches per setting. Each directory's README gives the conditions and limits. The kernels ship as source with build scripts, and no weights or binaries are included.

## Credits

- **DeepSeek** for DeepSeek-V4.1-Flash-1017 and the DSpark drafter.
- **diffbot** for the 3-bit pack and the recipe the server builds on.
- **turboderp** for EXL3 and ExLlamaV3.
- **vLLM** for the engine, and **Or Ozeri** and **Yihua Cheng** for its KV offloading.
- **kacper-daftcode** for vLLM-Moet's mHC overlap.
- **FlashInfer**, **NVIDIA** (TensorRT-LLM, CUTLASS), **Marlin** and **Triton** for the kernels the Qwen stacks call.
- **The Qwen team** and **NVIDIA** for the Qwen3.8 models and their NVFP4 versions.

## AI assistance

AI agents (Claude and GPT models) built and measured these parts and assembled the release, and an AI agent drafted this note. Artus asked for the code to be published.
