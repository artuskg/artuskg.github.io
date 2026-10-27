# When an Agent Repeats Its Plan: A Qwen3.8-27B Case Study and a Reasoning-History Reset

*27 October 2026. A single-model case study and a small fix, not a peer-reviewed paper.*

## Abstract

We observed Qwen3.8-27B repeating the same short reasoning plan across dozens of tool turns while failing to finish small coding tasks. Earlier reasoning was retained in each request. In greedy replay, we tested deletion after eight consecutive equal reasoning blocks. The selected panel contained 22 recorded histories, with 20 distinct prefixes from three tasks, each continued on two fixed serving engines. Leaving reasoning history unchanged passed 1 of 44 continuations. Removing all earlier reasoning from every later request passed 44 of 44. Summed continuation time was 32% lower, comparing successful completion with mostly turn-limit failures. Always deleting reasoning from the start increased six-task suite time by about 12% on one serving configuration; on the other, the difference was not resolved. Keeping the first copy of each repeated plan passed only 29 of 44 continuations, against fresh full-deletion controls that passed 44 of 44. In 72 whole-task runs with the policy armed, using greedy or vendor-recommended sampling, no detector fired. These runs therefore did not test recovery. This single-model case study supports reasoning-history deletion as a recovery action on the selected histories. Its benefit on new tasks and in live use remains unmeasured.

## 1. What happened

An agent harness sends the model a growing conversation: the task, the model's earlier turns, tool calls and tool results. Qwen3.8 can also receive its own earlier *reasoning*, the thinking text it wrote before each answer. The current model card makes this the default: "By default, Qwen3.8 retains thinking blocks from all historical messages, maintaining a complete reasoning trace across the conversation." It gives the reasons as "full context continuity" and "reduced redundant reasoning" in agent use (Qwen3.8-27B card, revision `1d4bf0f2`, section "Preserved Thinking").

In this note, "reasoning history" means that text, as the harness sends it back to the model. We make no claim about the model's internal processing.

During a benchmarking campaign we saw some Qwen3.8-27B episodes fail in a striking way. In the example of section 3, the model stated the bug correctly and had read the relevant source file. Then it began a short plan such as "look for the test runner", and from then on it wrote that same plan, word for word, at the start of every turn. Its tool calls changed from turn to turn, but none of them made progress, and the episode ended at the 64-turn limit.

We asked three questions:

1. Can a cheap rule detect this state?
2. Does removing the repeated text from the model's view end it?
3. What does that removal cost when nothing is wrong?

## 2. Setting

**Model and serving.** Qwen3.8-27B, served with vLLM on one NVIDIA RTX PRO 6000 Blackwell GPU per engine. We used two serving configurations, both our own quantizations of the public model and both with multi-token-prediction speculative decoding (five draft tokens):
- **FP8:** FP8 weights.
- **NVFP4:** NVFP4 weights, an FP8 KV cache and a custom attention kernel.

We call one start of the server an *engine load*, or *engine*. Section 6.4 adds a third configuration.

**Tasks and tools.** We use an internal six-task suite: two question-answering tasks and four small coding tasks. Each coding task gives the model four tools: `search_files`, `read_file`, `write_file` and `run_tests`. Search matches file contents, not file names, and there is no directory listing or general shell. The model cannot read the grading checks. It can run them only through `run_tests`. The tasks include repository source bundles of about 128,000 or 200,000 tokens, even when the editable fixture is small. A task allows up to 64 assistant turns and 262,144 output tokens in total. Each request allows at most 65,536 output tokens, further limited by the remaining task and context budgets; the context limit is 262,144 tokens. We have not tested whether the same failures occur with short prompts. A code task passes when the grading checks pass and the model delivers a final answer. The three code tasks that matter here are:
- **batch:** prove a vulnerability in a batch-payment service;
- **argv:** fix a command-line parsing bug;
- **refund:** prove a refund flaw.

**Decoding, and how it departs from the card.** The main replay and always-strip comparisons use greedy decoding (temperature 0, seed 42), xhigh reasoning effort and preserved thinking. Section 6.3 includes sampling and lower-effort screens. Section 6.4 includes both greedy and sampled runs, at xhigh and medium effort. The card recommends xhigh and preserved thinking, so those two settings follow it. The card's recommended thinking-mode sampling is temperature 1.0, top-p 0.95 and top-k 20; greedy decoding departs from that. We chose greedy for paired, reproducible comparisons. The older Qwen3 card (2025) also warned against greedy decoding, saying it "can lead to performance degradation and endless repetitions"; that card describes a different model.

**Engine-to-engine variation.** Two fresh loads of one configuration can produce different greedy outputs, because a race during compile-cache loading decides which kernel variant some operations use. We traced this race and proposed a fix to vLLM ([vllm-project/vllm#64066](https://github.com/vllm-project/vllm/pull/64066)). The baseline and deletion arms in sections 6.1 and 6.2 share an engine within each comparison. The edits in section 6.5 also share an engine. Section 6.4 uses fresh loads for each suite, and its no-fix comparison comes from earlier loads. A fixed engine does not cover variation across loads.

## 3. The failure, in one trace

The following episode uses the FP8 configuration on the batch task. Turn indices start at zero. At turn 1 the model reads all 380 characters of the vulnerable `service.py`. At turn 2 it states the defect correctly: individual amounts are checked, but their sum is deducted. Then it looks for a runner that it cannot see:

| turn | tool call | result | reasoning text (start of turn) |
|---|---|---|---|
| 4 | search `fixed` | 0 matches | Let's look for the trusted runner and the fixed implementation. I'll search for related files. |
| 5 | search `vulnerable` | 0 matches | Let's look for the runner and the fixed implementation. I'll try searching for "vulnerable" and "control". |
| 6 | search `control` | 0 matches | Let's look for the runner and the fixed implementation. I'll try searching for "control" and "runner". |
| 7 | search `replay` | 0 matches | **Let's look for the runner and the fixed implementation. I'll try searching for "runner" and "replay".** |
| 8 | search `runner` | 0 matches | *same as turn 7* |
| 9 | search `Budget` | 1 match | *same as turn 7* |
| 10–14 | search `balance`, `sum`, `def`, `import`, `test` | 4, 1, 3, 0, 1 | *same as turn 7* |
| 15 | read `model_tests.py` | 51 characters | *same as turn 7* |
| 16–63 | 48 more searches (`poc`, `operations`, `credits`, `negative`, ..., single characters) | 20 empty, 28 nonempty | *same as turn 7* |

Turns 8 to 63 each repeat all 25 tokens of the turn-7 plan (token counts here come from retokenizing the saved text). The searches vary, but the plan does not. The source file and search results were not truncated. Even nonempty search results did not change the repeated plan. The episode makes 61 searches and 3 reads, writes nothing and ends at the turn limit.

A second shape appears in an argv episode from another configuration:
- At turn 10 the model writes a correct fix.
- At turn 11 `run_tests` returns `Ran 3 tests ... OK`.
- At turn 12 the model writes: "The trusted check passed (3 tests, OK)", and then: "I'll run this as a one-off Python snippet."
- It has no tool that runs a snippet, so it calls `run_tests` again.
- Turns 14–63 repeat all 104 retokenized tokens of the turn-13 reasoning. The episode runs the same tests 53 times in turns 11–63. The 52 runs after the first pass take 220 seconds in total.

**Repeating a plan is not by itself a failure.** On other engines of the same FP8 configuration, three batch episodes repeat one plan for five turns (turns 7–11). At turn 12 they change it ("Maybe the search only targets specific files, or maybe the search is case-sensitive"), then write the proof at turn 14 and pass.

**How common it is.** We have 236 recorded Qwen3.8-27B code episodes on this suite. Of these, 15 run out of turns, and every one of the 15 repeats a reasoning plan. One of the 15 is on the FP8 configuration (1 of 36 episodes); the configuration with the highest share is a lossy speculative-decoding variant (7 of 24). The sibling model Qwen3.8-Flash ran 352 code episodes on the same harness and never ran out of turns this way. Its configurations and exposure differ, however, so this is not a controlled comparison.

## 4. Detecting it

We inspected 755 recorded coding episodes in the same transcript format, including 14 from a separate repair suite. The records include Qwen3.8-27B, its Flash sibling and a Qwen3.8 fine-tune. Two counters run over each episode's assistant turns. A counter *fires* at the first turn that meets its rule. The first counter to fire sets the *fire turn* *t*; the edit of section 5 begins with request *t*+1.

- **T2 (repeated plan):** each turn's reasoning text, with leading and trailing whitespace trimmed, is compared with the previous turn's. T2 fires after 7 equal, nonempty transitions in a row, so 8 equal blocks.
- **T1 (search/read run):** 35 consecutive turns, each with at least one tool call and all calls either `search_files` or `read_file`. A turn with no call, a write or a test resets the count. This catches search loops in which the reasoning text keeps changing. It is an observable proxy for lack of progress, not a judgment that reading can never be useful.

```text
t2_run = t1_run = 0
for each assistant turn i = 0, 1, 2, ...:
    r = reasoning(i).strip()
    t2_run = t2_run + 1  if i > 0 and r != "" and r == reasoning(i - 1).strip()  else 0
    calls = names of the tool calls in turn i
    t1_run = t1_run + 1  if calls and every call is search_files or read_file  else 0
    if t2_run >= 7 or t1_run >= 35:
        t = i          # fire turn; the edit then stays on for the rest of the task
        break  # stop scanning; continue the task with deletion enabled
```

**Calibration.** We excluded 48 episodes from the always-strip arm of the cost experiment (section 6.2) before choosing thresholds. The remaining 707 contained 30 turn-limit failures, 635 passing episodes and 42 other failures. We treated turn-limit failures as positives. The combined rule detected all 30, fired on none of the 635 passing episodes, and fired on one of the 42 other failures.
- Each threshold sits one step above the closest passing episode, on a wide plateau. T2 can be raised from 7 to 39, and T1 from 35 to 53, without losing a detection.
- The thresholds were chosen on this data, so these are calibration numbers, not a deployment false-alarm rate. In later runs of the same Qwen3.8 fine-tune, which were not part of the calibration data, the combined rule caught all 6 turn-limit cases, all by T1, with no fire on its 6 passing code episodes. This tests detection only, not recovery.

The rule needs only string equality and tool names, so it is computationally trivial. We have not measured its latency in a live harness.

## 5. The fix

After observing fire turn *t*, the harness removes prior assistant reasoning from request *t*+1 and every later request in that task. It keeps the saved transcript unchanged and filters only the copy sent to the model. It keeps everything else: the task, each turn's tool call, each tool result and any visible answer text. The model still writes fresh reasoning for its current turn. This also removes reasoning generated after the trigger when it becomes history on the next request. Turning off `preserve_thinking` is not the same operation: this model's template still retains thinking since the latest user message, and in these tasks every assistant turn follows the single user message.

Before the trigger, the filter leaves request content unchanged. It does not remove reasoning on tasks that never trigger. Its runtime overhead is not isolated by these experiments.

This is a small request filter. We implemented it as a hook in the harness, and later as a proxy between the harness and vLLM. It needs no change to the model or the server.

## 6. Results

### 6.1 Replayed spirals (main result)

**Design.** We took the 22 recorded Qwen3.8-27B spiral episodes on which the detector fires (18 batch, 2 argv, 2 refund). Every first fire was T2, at turns 10–31. We inserted the recorded assistant messages through the trigger turn and re-executed their tool calls on a fresh fixture. The model generated new messages only after that point. Recorded prefix tokens counted toward the original output budget. From turn *t*+1, two arms ran live under the original task limits plus a 600-second arm wall limit (not reached by any arm):
- **baseline:** the history unchanged;
- **strip:** the fix above.

Each history ran on one FP8 engine and one NVFP4 engine, for 44 pairs.

| engine | baseline passes | strip passes | strip better / worse / same | continuation time, baseline → strip (sum) |
|---|---|---|---|---|
| FP8 | 1/22 | 22/22 | 21 / 0 / 1 | 2,527 s → 1,772 s |
| NVFP4 | 0/22 | 22/22 | 22 / 0 / 0 | 2,816 s → 1,862 s |
| both | 1/44 | **44/44** | 43 / 0 / 1 | 5,343 s → 3,634 s (**−32.0%**) |

**What happened in each arm:**
- **Baseline:** 43 of 44 runs ended at the 64-turn limit. In the median, baseline continued for 47 more turns, almost all of them searches, and the counters fired again in all 44.
- **Strip:** the continuations finished with a passing answer after a median of 4 (FP8) or 6 (NVFP4) turns, and within 1–9 turns in all 44. One history already contained a correct fix: on both engines, deletion ended its repeated testing with an answer in one turn and no new tool call. The other strip continuations wrote and tested code. No counter fired again.
- **Single tie:** the only baseline pass (FP8, refund) took 299 s, against 146 s for its strip arm.
- **Tokens and turns:** strip decoded more tokens in total (241,793 against 157,453) and still finished sooner. Baseline used 967 live turns on FP8 and 976 on NVFP4, compared with 91 and 130 after deletion. Repeated tool turns add request and tool overhead.
- **Slower pairs:** seven strip arms were slower than their baselines, by 0.3–42 s. Each was a pass against a failure.

**How to read these numbers.**
- **They are not independent trials.** Two pairs of histories have identical prefixes, so there are 20 distinct histories. These cover only three tasks, run on two fixed engines.
- **They speak to these three fixtures.** One verdict per distinct history gives 20 better and 0 worse. With one verdict per task, however, three tasks cannot give a two-sided sign-test p below 0.25. These are statements about these fixtures, not a recovery rate for spirals in general.
- **Times start after the replayed prefix.** They end at a pass or at the original task limit, so most baseline times are costs of failure. Both arms began with a cold prefix cache. Section 6.4 covers whole tasks.

### 6.2 Why not strip from the start?

The card's argument for keeping reasoning is a real one, so we measured it. On each of six fresh engines per configuration, the six-task suite ran twice: once unchanged and once with reasoning stripped on every turn from turn 0. The two runs alternated in order.

| configuration | mean adjusted strip − baseline, per six-task suite | conditional 95% interval | ratio of summed adjusted times | loads slower with strip | passes, baseline / strip |
|---|---|---|---|---|---|
| FP8 | **+120.2 s** | [75.4, 165.1] | 1.125 | 6/6 | 34/36 / 35/36 |
| NVFP4 | +47.4 s | [−70.5, 165.3] | 1.055 | 3/6 | 28/36 / 30/36 |

Adjusted time subtracts the measured cost of our metrics observer. It includes time spent on failed tasks. The intervals use six paired suite differences and assume independent loads. Five of the six FP8 loads gave the same output on a fixed probe request, so these intervals do not cover the range of possible engine numerics. The pass counts use a predeclared revision of the question-answering grader; the coding-task rule is unchanged.

- **FP8:** stripping from the start made the suite slower on all six loads. Summed suite time was about 12% higher.
- **NVFP4:** the difference is not resolved.
- **Where the time goes:** on all 12 loads, the sign of the time difference matched the sign of the change in completion tokens generated on coding tasks. Repeating earlier reasoning is one possible explanation, but this comparison does not isolate it.
- **Quality:** no paired task lost a pass in this sample. The three gains were tasks where the baseline spiralled and the always-strip arm completed.

That cost is why the fix waits for the detector. Prior work has already shown that deleting reasoning on every turn has a cost (section 7). This table adds a wall-clock measurement for this model.

### 6.3 What else we tried

Before the replay comparison, we tested several one-turn changes on five saved histories cut during a loop. Each non-sampling arm used one greedy draw per history. One deletion draw reached its 8,192-token cap, so that outcome is censored:
- **Ways that release a spiral:** three changes each released 2 of 5 histories. Here, a release means the plan changed and the model wrote a file checked by the grader; it does not mean the task passed. The three changes were:
  - deleting the reasoning;
  - stating the tools' actual capabilities in the prompt ("facts only");
  - the same statement plus an instruction to use the tools ("affordance").
- **Weaker or no effect:** a "you are repeating yourself" notice released 1 of 5. Lowering the reasoning effort to medium, a presence penalty and a placebo released none. (The card itself cautions that lower effort "does not always reduce overall task completion time" in multi-turn agent tasks.)
- **Sampling:** sampled continuations at the card's settings (eight seeds per cut) kept the plan in 7 or 8 of 8 draws at every cut, with no graded progress.
- **The post-pass spiral:** on the argv retest spiral, only deleting the reasoning changed the plan at all.

In rollouts of up to 8 turns on three spiral cuts, deleting the reasoning ended all three with a passing answer within 2–4 turns. Stating the tools' capabilities ended the two search spirals, but not the post-pass retest spiral. These rollouts executed tools live but showed the model replayed tool results, keeping the real results separately. Section 6.1 re-executed the tools and showed the model their new results.

These are screens, not full-continuation comparisons. Other interventions can work, and stating the tool facts is a reasonable alternative on search spirals. Deletion completed all three cuts in the short rollouts. It produced a graded write on two of the five one-turn cuts. These are different tests of progress and completion.

### 6.4 Live whole tasks, greedy and card sampling

- **Setup:** the full six-task suite, run live with the detector and the proxy in place, at xhigh and medium effort, three runs per effort and decoding. These runs use a third configuration of the base Qwen3.8-27B model: BF16 weights and KV cache, with lossless multi-token-prediction speculative decoding. Each six-task run starts a fresh engine. Greedy and sampled runs therefore do not share an engine.
  - Greedy: temperature 0, seed 42.
  - Card sampling: the card's thinking-mode settings (temperature 1.0, top-p 0.95, top-k 20), with a different seed for every run and turn.
- **Comparison:** historical runs of the same tasks and serving recipe without the fix (three greedy suites per effort), on earlier engines. There is no historical card-sampling arm.

| effort | arm | passed | detector fires | turn-limit cases | mean suite time |
|---|---|---|---|---|---|
| medium | historical, no fix, greedy | 16/18 | – | 0 | 1,144.9 s |
| medium | live, fix armed, greedy | 15/18 | 0 | 0 | 1,153.4 s |
| medium | live, fix armed, card sampling | 14/18 | 0 | 0 | 1,297.4 s |
| xhigh | historical, no fix, greedy | 11/18 | 1 would have fired (turn 12) | 1 | 1,381.1 s |
| xhigh | live, fix armed, greedy | 12/18 | 0 | 0 | 1,391.9 s |
| xhigh | live, fix armed, card sampling | 16/18 | 0 | 0 | 1,600.8 s |

- **Result: the detector did not fire in any of the 72 live task episodes, greedy or sampled, so the fix never changed a request.** All 48 live coding episodes passed; every live failure was a question-answering task answered in a single turn. The one historical code failure was a batch spiral that ran to the turn limit; it would have fired at turn 12.
- **Greedy:** pass counts and mean suite times are close to the historical means (+0.7% medium, +0.8% xhigh), within the spread between runs. Because the historical runs used earlier engines, this does not isolate the proxy's overhead or show that arming the fix is cost-neutral.
- **Card sampling:** no detector fired and no task reached the turn limit in 36 cases, including 24 coding episodes. These repeat the same tasks across two effort settings and fresh engine loads. We do not estimate a population loop rate from this small exposure. The one historical spiral was greedy.
  - Passes: medium 14/18 and xhigh 16/18, against 15/18 and 12/18 greedy with the same serving recipe on different engine loads. The xhigh difference is all question-answering. Three runs per arm are too few to call this an effect.
  - Time: sampled suites took 12.5% (medium) and 15.0% (xhigh) longer than live greedy. Sampled runs had similar output volume and lower draft acceptance. This is consistent with a decoding cost, but the runs used different engine loads and do not isolate its cause. Appendix A gives the rates.
- **Grade:** this table uses a predeclared grade that accepts one source-supported alternative answer in a question-answering task; coding grades are unchanged. Section 6.2 uses a later question-answering grader, so its suite pass counts are not directly comparable with this table. Under the original grade, the live greedy medium arm passes 14/18, and the sampled arms 14/18 (medium) and 14/18 (xhigh).
- **What this block cannot show:**
  - Rescue or prevention: with no fires, it measures neither.
  - A concurrent fix-off control: the historical runs came from earlier engines (section 2).
  - Generalization: these are the same six tasks, not held-out tasks.
- **Shared host:** separate work overlapped parts of the second greedy runs and the third sampled runs. All runs are kept; Appendix A documents the overlaps.

### 6.5 Removing only the repeats

Would a gentler edit do as well? We kept the 22 histories, fire turns and two configurations of section 6.1, loaded fresh engines, and compared three edits from turn *t*+1. Each turn has one reasoning block. D1 and D2 compare a turn's whole block, with leading and trailing whitespace trimmed, with the previous turn's block, so repetition inside a single turn is not detected. All three edits are repeated on every later outgoing request, using the original saved history to decide what to delete. A deleted block is removed from the request; the turn's tool calls, tool results and visible text stay.
- **full (F):** the fix of section 5;
- **keep-first (D1):** delete each nonempty block that equals the previous turn's block. The first block of each run of identical blocks stays, and so does all reasoning that differs;
- **drop-all-copies (D2):** delete every block in a consecutive run of at least two equal nonempty blocks, and keep all reasoning that differs. D2 ran only on histories where D1 failed.

For example, if six turns carry the blocks A A A B A A, D1 sends A – – B A –, D2 sends – – – B – –, and F sends no earlier reasoning at all.

The rule was fixed before the run: D1 is viable if it passes at most one fewer than F.

| engine | full (F) | keep-first (D1) | drop-all-copies (D2), on D1 failures |
|---|---|---|---|
| FP8 | 22/22 | 16/22 | 2/6 (F on the same: 6/6) |
| NVFP4 | 22/22 | 13/22 | 2/4 attempted of 9 selected (F: 4/4) |
| both | **44/44** | 29/44 | 4/10 attempted (F: 10/10) |

- **Full deletion again passed 44/44**, on new engine loads whose numerics differ from those in section 6.1.
- **Keep-first fails the rule.** F won 15 pairs and D1 none. After the edit, the repeated-plan counter fired again in 16 of D1's 44 runs, against none of F's. On NVFP4, D1 kept most of the prompt cache under our warming procedure (14 of 22 first requests hit it; median time to first token 1.3 s against 33 s), but it lost nine completions there.
- **Drop-all-copies fails too, on the histories it ran.** F won 6 of the 10 attempted pairs and D2 none. Five NVFP4 arms did not fit the GPU budget and are untested; even if all five had passed, D2 would trail F by six of 15.
- **What it means:** on this selected replay panel, both exact-deduplication edits recovered less reliably than deleting all earlier reasoning. Removing exact consecutive duplicates is therefore not enough as a recovery rule here. This goes against the prediction that the narrower edit would reliably release these spirals. It does not show which part of the difference comes from the retained text, from the changed prompt length and positions, or from cache reuse. Full deletion remains our best-tested replay intervention; its benefit in live runs is still unmeasured.
- **Limits:** the same 22 histories (20 distinct prefixes) and three tasks as section 6.1, mostly the batch task. D2 was selected on D1 failures and is incomplete. The comparison still cannot separate the content of the text from its length or position.

## 7. Related work

**Repetition.**
- Self-reinforcing repetition in neural text generation is well documented. Xu et al. (2022, [arXiv 2206.02369](https://arxiv.org/abs/2206.02369)) show that the chance of repeating a sentence "increases almost monotonically with the number of historical repetitions".
- Pipis et al. ([arXiv 2512.12895](https://arxiv.org/abs/2512.12895)) find more repetition at low temperature in single-answer mathematical reasoning.
- In multi-turn settings:
  - Cao et al. ([arXiv 2610.19439](https://arxiv.org/abs/2610.19439)) measure agents stagnating by "copy-pasting a prior failed action verbatim".
  - Zhang et al. ([arXiv 2603.09701](https://arxiv.org/abs/2603.09701)) describe whole responses repeated verbatim in multi-turn code generation.

Our observation is narrower: the repeated text is the model's own reasoning, returned to it in the history, while its tool calls keep changing.

**Detection and recovery in agents.**
- **OpenHands:** includes checks for four identical action–observation pairs and other repeat patterns. In its CLI, the user can choose to truncate the history after the loop starts and restart.
- **Cline:** counts identical tool calls and appends a "try a different approach" notice.
- **Wink** ([arXiv 2602.17037](https://arxiv.org/abs/2602.17037)): classifies loops in more than 10,000 coding-agent trajectories and steers the agent back with targeted guidance.

OpenHands and Cline include repeated-call checks; Wink monitors broader trajectory problems and supplies guidance. Our case tracks repeated reasoning as well as long search/read runs, then tests deletion of the reasoning history.

**Deleting reasoning from the history.** This is not new:
- **Earlier guidance:** the QwQ-32B and Qwen3 cards advised keeping only "the final output part" of earlier turns. DeepSeek-V3.2's encoding example drops earlier thinking when `drop_thinking=True`. Anthropic's API can clear thinking blocks.
- **Wang et al.** ([arXiv 2609.29875](https://arxiv.org/abs/2609.29875)) study selective reasoning deletion in long-horizon agents. Their method is called ICLR; this is not a conference attribution. They show that deletion can change later actions and remove useful task state. They also evaluate deleting all thinking.
- **DRSR** (Wang et al., [arXiv 2609.27276](https://arxiv.org/abs/2609.27276); a different paper from the one above) chooses sets of history blocks to remove using a learned estimate of deletion risk. Our tested edit uses a fixed repetition trigger and removes all earlier reasoning.
- **Vallecillos-Ruiz et al.** ([arXiv 2610.35496](https://arxiv.org/abs/2610.35496)): deleting all reasoning at every turn increased the number of turns by 35% for Trae agent and 105% for Mini-SWE-agent. Delayed deletion did not significantly increase run length in their tested settings.
- **Min et al.** ([arXiv 2609.36526](https://arxiv.org/abs/2609.36526)) compare continuations from the same agent state with and without context compression. We use such a comparison for a specific repeated-plan failure.

We add a single-model case in which always deleting reasoning increased suite time on one configuration, while deleting it after a repeated-plan trigger improved selected replay completions.

**What we do not add.** We have no mechanism at the level of attention or circuits. We do not explain why Qwen3.8-Flash did not show the pattern. And we offer no fix at the level of the KV cache.

Editing the cache directly in place of re-sending a shorter prompt is a plausible alternative, and related work exists (Fu et al., *Cache Engineering for Agents*, [arXiv 2610.28577](https://arxiv.org/abs/2610.28577); [Leyline](https://arxiv.org/abs/2606.01065); [PatchKV](https://arxiv.org/abs/2609.26219); [SuffixReplay](https://arxiv.org/abs/2609.33477)). Repositioning retained cache entries does not remove information they already incorporated. Qwen3.8's linear-attention layers keep a running state from which individual tokens cannot simply be removed; checkpointing and replaying that state is a possible route, not a tested fix. We did not test cache editing. The filter changes every request after a trigger, and we have not measured the cache cost of a live recovery.

## 8. Limitations

- **One model, a handful of tasks.**
  - Every replayed spiral comes from Qwen3.8-27B on three small coding tasks, and 18 of the 22 histories are the same batch task.
  - Each serving configuration used one fixed engine in the main replay comparison and a fresh one in the deduplication comparison. The always-strip study used six paired loads per configuration; the live block used a fresh load per suite.
  - The tasks use long repository contexts and a restricted tool interface. Search matches file contents, not filenames; hidden checks cannot be read, and there is no general shell tool. We have not separated these conditions from the observed failures.
  - We have not run the fix on held-out tasks. That is the most useful next experiment.
- **Greedy decoding.** The replay results use greedy decoding. Live under the card's sampling, no spiral started in 36 cases (section 6.4), so we have not tested the fix on a sampled spiral.
- **Selected histories.** We replayed histories already known to fail. The 1/44 baseline describes this selected set; it is not a rate of failure.
- **Detector in sample.** The thresholds were chosen on the calibration data, which mixes models, configurations and one repair suite, and labels a positive by turn-limit status rather than by an independent diagnosis. T1-triggered recovery is untested, because none of the replayed histories fired by T1 first. We also know one blind spot: an episode that alternates between two plans defeats T2, though T1 still catches it at turn 34.
- **False triggers.** Neither zero live fires nor zero in-sample fires on passing episodes shows that deletion is safe on future tasks. We have not measured the harm of a false trigger on a task that needs its retained reasoning.
- **Mechanism.** Deletion changes what the model sees, how long the prompt is, where things sit in it and what is cached, all at once. We have shown that the policy works on these replays, not which of these does the work. Section 6.5 rules out only the simplest selective version: deleting the duplicates alone.
- **Grading.** A pass means the grading checks pass and a final answer is delivered. We did not grade the answer's prose.
- **Time.** In section 6.1, continuation times start with a cold cache in both arms. Section 6.5 warmed the original request first: keep-first then reused the cache on 16 of 44 first live requests, full deletion on none. The section 6.2 intervals assume independent loads, and five of the six FP8 loads gave the same probe output. In live whole-task runs where nothing fired, suite times were close to historical runs on earlier engines (section 6.4); that comparison does not isolate the fix's overhead. Nothing fired in that block. Afterwards, one greedy run on a different, NVFP4 serving stack fired once (T2, turn 14; requests edited from turn 15), and that episode then passed at turn 24. Without a matched run lacking the edit, this is an observed completion after a fire, not a measured rescue. The time effect of a live rescue remains unmeasured.
- **Private artifacts.** The main replay checkpoints are our own quantizations; the live BF16 block uses the public base-model weights. The task contexts and transcripts are private. Exact reproduction is limited by these unreleased artifacts (see Availability).

## 9. Practical recommendation

For Qwen3.8-27B under similar conditions, reasoning-history deletion is a candidate recovery action to test. Keep preserved thinking as the default: always deleting it increased time on our FP8 configuration. After eight consecutive equal, nonempty reasoning blocks, removing all earlier reasoning from each later request passed every selected replay continuation. Removing only exact consecutive duplicates worked less often. We also monitor 35 consecutive search/read turns, but have not tested recovery after that trigger alone. Live recovery, false-trigger costs and benefit on new tasks remain unmeasured. Whether to deploy it, or to study it further, should depend on how often such spirals occur on the tasks that matter and what they cost, weighed against the proxy's overhead, false fires and engineering effort.

## Availability

The detector and the filter are fully specified in sections 4 and 5: the pseudocode is the complete trigger rule, and after the fire turn, the filter removes the reasoning field from every earlier assistant message in each outgoing request. The task suite, transcripts, quantized checkpoints and run records are private and are not released with this note. The base model and its card are public.

## AI assistance

AI agents (Claude and GPT models) wrote the experiment runners, operated the experiments, analyzed the records, searched the literature and drafted this note. Automated checks produced the reported grades. A human directed the investigation and decided to publish this note.

## Appendix A: live-run details (section 6.4)

**Per-run suite times, seconds.**

| effort | arm | run 1 | run 2 | run 3 |
|---|---|---|---|---|
| medium | historical, no fix, greedy | 1,115.1 | 1,211.4 | 1,108.3 |
| medium | live, fix armed, greedy | 1,120.6 | 1,078.7 | 1,260.9 |
| medium | live, fix armed, card sampling | 1,267.6 | 1,023.9 | 1,600.6 |
| xhigh | historical, no fix, greedy | 1,422.3 | 1,278.6 | 1,442.4 |
| xhigh | live, fix armed, greedy | 1,439.5 | 1,358.4 | 1,377.9 |
| xhigh | live, fix armed, card sampling | 1,491.1 | 1,729.7 | 1,581.6 |

**Sampled against greedy, live.** Completion tokens changed by −1.3% (medium) and +2.6% (xhigh). Completion tokens per second of case time after first-token waits were 64.5 and 64.1 greedy, 54.0 and 54.6 sampled. These include tool and harness time, so they are not pure decoder throughput. Summed first-token waits were 994 s and 993 s greedy, 984 s and 972 s sampled. The fractions of draft tokens accepted were 0.670 and 0.660 under greedy decoding, and 0.524 and 0.515 under sampling. The runs used different engine loads, so these are descriptive associations.

**Repeated outputs.** The greedy xhigh runs 1 and 3 produced identical question-answering transcripts on separate loads of the same GPU. Fresh loads therefore need not produce distinct trajectories.

**Shared host, greedy block.** For about two minutes during the second greedy runs, a separate unit test ran on the same host. It held a CUDA context on the GPU running the medium run and shared the host's CPUs with both runs. By the proxy logs, this window overlaps one coding task and the first request of the argv task in both the medium and the xhigh run. All four of those tasks passed. The size of any effect is unknown.

**Shared host, card-sampling block.** During the third sampled runs, a separate environment setup shared the host for about four minutes, at the lowest CPU and I/O priority and without a GPU (package downloads and installs, a git clone, and Python checks). By the proxy logs, it overlapped the xhigh run's second and third tasks (one question-answering, one coding; both passed) and the medium run's first task (question-answering; failed). The size of any effect is unknown.
