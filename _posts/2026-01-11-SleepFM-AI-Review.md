I am always intrigued by medical applications of AI, so let's have a look at this paper: [A multimodal sleep foundation model for disease prediction](https://www.nature.com/articles/s41591-025-04133-4.pdf). 

As the first step, I ran my below standard prompt through GPT-5.2 Pro (standard thinking) twice (in parallel) and then went through the paper in while Pro was chugging along. 

> Please an in depth review of the below paper. No sugar coating, no mercy, no malice. I want the good, the bad, and (if any) the ugly. Where does this work improve our knowledge/the state of the art and how? Do you see potential uses/extensions/connections beyond this paper? Where would a well-read reviewer see missed connections—to older work the authors should have cited, to parallel developments in adjacent fields, or to techniques that could have been applied but weren’t? Anything else you like to point out?
 >
>
> https://www.nature.com/articles/s41591-025-04133-4.pdf
>
> Code: https://github.com/zou-group/sleepfm-clinical/tree/sleepfm_release

This was the first 5.2 Pro run that came back:

~~~
What the paper claims to do (and broadly does)

The paper introduces “SleepFM”, a multimodal self-supervised (“foundation”) model trained on overnight polysomnography (PSG) across multiple cohorts. It uses four modality groups (brain activity signals (BAS: EEG + EOG), ECG, EMG, and respiratory) and is designed to be “channel-agnostic” so it can tolerate different channel counts and ordering across sites. The authors pretrain with a new “leave-one-out” contrastive objective (LOO-CL) that aligns temporally matched 5‑min segments across modalities, then fine-tune using (mostly) lightweight heads on top of frozen embeddings for downstream tasks including sleep staging, apnea severity, and large-scale future disease prediction using EHR phecodes. The dataset is large by sleep-medicine standards: across SSC, BioSerenity, MESA, and MrOS they report ~65,000 participants and >585,000 hours of PSG.

Where this work clearly advances the state of the art

1. A credible step toward a “general” PSG representation across sites and channel sets  
    The channel heterogeneity problem is real in PSG (different montages, missing channels, different respiratory sensor suites). Their explicit attention-based pooling across channels within a modality is a reasonable architectural choice to get permutation-robust modality embeddings and makes cross-cohort training more plausible. They describe this as pooling channel embeddings via multihead self-attention to produce a modality-specific sequence, explicitly motivated by cross-site inconsistency.
    
2. Multimodal self-supervision at scale in sleep medicine (not just EEG sleep staging)  
    Most prior “big” sleep models in the literature are either (i) supervised sleep staging models on a few datasets or (ii) unimodal physiologic foundation models (e.g., ECG) not purpose-built for PSG. Here, pretraining is genuinely multimodal and uses multiple cohorts; they also show that more pretraining data improves downstream disease prediction (Extended Data Fig. 5 description).
    
3. A systematic “sleep-to-phenome” prediction framing  
    Pairing PSG with EHR and evaluating hundreds to >1,000 phenotypes is a meaningful framing shift: even if individual effect interpretations are shaky (more below), the idea that a single-night PSG embedding can be used as a general-purpose clinical covariate is important. They map ICD-9/10 to phecodes, exclude rare phecodes (<1.5% prevalence), and evaluate 1,041 phecodes.
    
4. Practicality: the model is small and training is cheap (relative to “foundation model” norms)  
    The base model is ~4.44M parameters, pretrained for one epoch on 432,000 hours from 48,000 participants in ~15 hours on an A100. That is unusually tractable in biomedical foundation-model land and makes replication more realistic.
    

The good

Data and evaluation design positives

They use multiple cohorts, not just one dataset, and hold out SHHS from pretraining to test transfer learning via lightweight fine-tuning (SHHS fine-tuning set 3,291; test set 2,000).

They include a temporal shift evaluation: a Stanford cohort from 2020 onwards, with pretraining/training on pre-2020 data. They report sustained performance for selected conditions (e.g., death 0.83, HF 0.80, dementia 0.83 with Bonferroni-corrected significance).

They benchmark sleep staging against several widely used sleep-staging systems and also do fully external validation on DCSM and HMC against PhysioEx variants (reported F1 0.68 on DCSM and 0.55 on HMC).

Methodological positives (where the engineering is sensible)

The signal preprocessing is at least described (many papers gloss this): resampling to 128 Hz, low-pass filtering before downsampling, zero-phase filtering, then standardizing to zero mean/unit variance, and linear interpolation for upsampling.

The modality design is clinically grounded: BAS includes frontal/central/occipital EEG plus EOG; respiratory includes chest/abd movements, pulse readings, and airflow.

The fine-tuning head is lightweight and clearly documented: 5‑s embeddings over a standardized 9‑h window go through pooling, a two-layer bidirectional LSTM (hidden 64), temporal mean pooling, concatenation with age/sex, then a linear layer to hazards, with ~0.91M learnable parameters.

The “LOO-CL” idea is coherent: for each modality embedding, predict the leave-one-out average of the other modalities as the positive, with batch negatives.

Empirical positives (as reported)

They report that 130 diseases reach both C-index and AUROC ≥ 0.75 on held-out Stanford test participants (Bonferroni-corrected P < 0.01).

They claim large AUROCs for several clinically salient outcomes in the Stanford cohort (e.g., death 0.84, dementia 0.87, HF 0.83, CKD 0.82, stroke 0.81).

They compare against a demographics-only baseline and an end-to-end PSG model trained from scratch, reporting AUROC improvements ranging 5–17% across disease categories. They also give a concrete example: all-cause mortality AUROC 0.85 vs baseline AUROC 0.78.

The bad

This is where a skeptical reviewer will start sharpening the knife. A lot of the “disease prediction from sleep” story is plausible, but the way it is operationalized leaves several major holes.

1. The disease-labeling scheme is too permissive for “incident” disease, and likely mixes prevalence with incidence  
    They define positives as the first phecode instance occurring more than 7 days after the sleep study. Seven days is not a serious washout for chronic diseases. For many conditions (hypertension, diabetes, CKD, many cancers, dementia, Parkinson’s), “first code in this EHR” is not the same as “new onset”. It is often “first appearance in this institution’s coding stream,” which can happen long after true onset, especially for referred patients.
    

Why this matters: the model might be predicting “already sick but not yet coded here” rather than “future disease onset.” That inflates apparent performance and muddies any mechanistic claims (“sleep as an early marker”). The paper repeatedly interprets high AUROC as consistent with “early indicators” and “existing literature” (e.g., Parkinson’s). Without a stronger incident definition, those interpretations are not earned.

A reviewer will want: a longer look-back window (e.g., exclude anyone with any related ICD codes in the prior 1–2 years in the same EHR), sensitivity analyses with 6–12 month washout, and ideally linkage to claims/outside codes if available.

2. The AUROC “6-year horizon” is under-specified with respect to censoring and follow-up  
    They compute AUROC by labeling a condition positive if it occurs within 6 years of PSG. But the paper does not clearly state how they handle patients censored before 6 years (insufficient follow-up). Treating them as negatives biases AUROC upward; excluding them biases toward patients with longer follow-up and possibly higher utilization; using inverse probability of censoring weights is more correct.
    

They do report C-index (good), but AUROC is heavily featured and “130 diseases with AUROC ≥ 0.75” is a headline claim. If the AUROC computation mishandles censoring, that headline claim can be partly an artifact.

3. Survival modeling choices are simplistic for the problem they claim to solve  
    They extend CoxPH by computing the Cox loss independently for each of 1,041 labels and summing across labels. That implicitly assumes independence across outcomes in the optimization, despite strong correlations and shared risk factors across phecodes. It also ignores the phecode hierarchy they explicitly use.
    

This is not “wrong,” but it is blunt. A more statistically aligned approach could exploit the ontology (hierarchical regularization), shared representation with task-specific heads, or structured multitask survival models.

4. The baselines are not strong enough to support clinical-utility-level conclusions  
    They compare to (i) demographics-only (age, sex, BMI, race/ethnicity) and (ii) an end-to-end model trained from scratch on raw PSG plus age/sex. This shows pretraining helps, but it does not establish that SleepFM adds real incremental clinical value beyond what a sleep clinic already has.
    

What’s missing (and what a reviewer will ask for):

A baseline using standard PSG-derived clinical indices (AHI, ODI, arousal index, sleep efficiency, REM %, N3 %, PLMI, mean SpO2, nadir SpO2, etc.).  
A baseline using pre-existing comorbidity burden from the EHR (problem list, Charlson/Elixhauser, prior diagnoses, meds, labs).  
A combined baseline (EHR + conventional PSG metrics).

Without these, “SleepFM predicts cancer/dementia/etc.” risks being interpreted as novelty when it may just be capturing well-known correlates (e.g., obesity/OSA severity, hypoxemia, autonomic dysfunction) in a more flexible way.

5. Pretraining context is only 5 minutes; the “sleep architecture” claim is only partly supported  
    Pretraining uses 5‑min recordings (sequence length = 5 min) and produces modality embeddings for contrastive learning. That is short relative to sleep cycles (ultradian structure ~90 minutes), stage transitions, and macroarchitecture.
    

They do fine-tune over longer windows (standardized 9 hours, with an LSTM over 5‑s embeddings). So the downstream head can capture longer structure, but the pretrained encoder was not explicitly trained to model long-range dependencies across hours. If the claim is that the representation captures the “temporal structure of sleep” in a deep way, the pretraining setup is not obviously aligned with that claim.

6. Preprocessing choices may remove clinically meaningful absolute-scale information  
    They standardize signals to zero mean and unit variance. For some channels, absolute values matter (e.g., SpO2 baseline level, ECG amplitude/morphology scaling, some respiratory amplitude features). Z-scoring can preserve relative excursions (desaturations) but may discard absolute baselines. Maybe the model still learns useful shape information; but the paper doesn’t justify why this normalization is appropriate for all channels.
    
7. Interpretability is thin relative to the ambition  
    They stratify performance by sleep stage and modality and note, e.g., BAS better for mental/neurological, respiratory better for respiratory/metabolic, ECG better for circulatory, and that combining modalities is best. That’s descriptive, but it’s not mechanistic. For something like predicting neurodegeneration or cancer, a reviewer will want at least some signal-level attribution or linkage to known sleep biomarkers (spindle/slow-wave coupling, REM without atonia proxies, autonomic arousals, hypoxemic burden, etc.) beyond stage-level and modality-level aggregates.
    

The ugly

These are the issues that, if a reviewer is paying attention, could force major revision or at least temper the claims sharply.

1. The Cox partial likelihood computation as described is almost certainly not correct  
    They explicitly state that because computing Cox loss over all patients in one batch is infeasible, they compute it in batches of 32, “with patients sorted by event time in descending order to ensure correct computation of the partial likelihood.”
    

Sorting does not make minibatch Cox partial likelihood “correct.” CoxPH requires risk sets that include all individuals still at risk at each event time. In minibatches, unless you are using a justified approximation (case–control sampling of risk sets, or other stochastic approximations with known properties), you are optimizing a different objective. The paper does not present it as an approximation; it presents it as correctness.

This is not a nit. If implemented as literally described, the training objective is mis-specified. That could change the learned risk scores and therefore the reported C-index/AUROC across all phenotypes. A careful reviewer will demand either:

A correct full-risk-set computation (possible with vectorization even for tens of thousands of patients per label, though 1,041 labels is heavy), or  
A clearly justified stochastic approximation (and evidence it matches the full objective on a subset), or  
A different survival loss (e.g., discrete-time hazard modeling) that supports minibatching cleanly.

2. “Foundation model” framing vs. actual scale and training regime  
    This is less “fatal” but it is reputational: a 4.44M parameter model pretrained for one epoch (~15 hours on a single A100) is not what most ML reviewers think of as a foundation model. In biomedicine, smaller can still be “foundational” if it becomes a widely reusable representation across tasks/sites, but the authors should be careful not to overclaim based on the term.
    
3. The disease prediction results are likely dominated by confounding and healthcare-process signals  
    They acknowledge selection bias: the cohort is primarily patients referred for sleep studies (suspected sleep disorders or other conditions), not the general population. In such a cohort, future phecodes are strongly shaped by referral reasons, baseline comorbidity burden, and follow-up intensity. A model that sees a rich overnight physiologic snapshot may learn proxies for obesity, cardiopulmonary disease, medication effects, frailty, etc. That is not inherently bad, but it means:
    

The model may be a strong “patient severity/utilization” predictor, not a sleep-specific biomarker extractor.  
Interpreting high AUROC as “sleep disturbances are early markers” is tenuous without confounding controls and incident definition rigor.

Missed connections and what a well-read reviewer might flag

I can’t guarantee what is or isn’t cited in the supplementary reference list without reading it end-to-end, but based on what is visible here, these are the categories where reviewers often expect tighter linkage:

1. Multiview / multimodal representation learning  
    LOO-CL is essentially multiview contrastive learning with a particular choice of positive target (leave-one-out average). A reviewer may expect explicit discussion/citation of older multiview representation learning frameworks such as:
    

Deep CCA / generalized CCA ideas (your “average of other views” is conceptually close to extracting shared latent structure across views).  
Multiview contrastive learning variants (contrastive multiview coding, multi-positive InfoNCE, etc.).  
Non-contrastive alignment approaches (Barlow Twins / VICReg-style correlation alignment) as potential alternatives that avoid negative sampling issues.

Even if the exact methods differ, it helps situate LOO-CL as a particular point in a known design space rather than a wholly new paradigm.

2. Set-based / permutation-invariant modeling for channel heterogeneity  
    Their “attention-based spatial pooling across channels” is basically a set-function over channels (permutation-invariant pooling via attention). A reviewer might expect citations to Deep Sets / Set Transformer–style ideas, or Perceiver-like architectures, since this is a standard way to handle unordered collections.
    
3. Survival modeling beyond CoxPH and proper minibatchable approaches  
    Given the scale (1,041 labels) and the need for minibatching, reviewers might ask why not use:
    

Discrete-time survival (logistic hazard per time bin) which is naturally minibatchable.  
Deep survival models like DeepHit / MTLR variants, or ranking losses aligned with C-index.  
Competing risks / multi-state approaches (especially if predicting correlated disease trajectories).

At minimum, the minibatch Cox issue should have forced a discussion of known approximations if they wanted to keep CoxPH.

4. Clinical sleep phenotyping work beyond sleep staging and apnea  
    They mention EEG markers like slow-wave/spindle coupling and link to glucose regulation. But the paper doesn’t really connect SleepFM embeddings to established sleep phenotypes (hypoxic burden, arousal burden, autonomic arousals, CAP, REM fragmentation, PLMs, etc.). A reviewer may see this as a missed opportunity: if you are claiming broad disease prediction, you should at least test whether embeddings recover known phenotypes and add incremental value beyond them.
    

Potential uses, extensions, and cross-field connections

Even with the criticisms above, there is a lot to build on if the methodology is tightened.

1. As a reusable PSG embedding for downstream clinical models  
    Because the fine-tuning head is lightweight and the base encoder is small, SleepFM could realistically become a standard PSG feature extractor for multi-center studies, provided weights and preprocessing are stable and well-documented. The cross-site intent is explicit (heterogeneous channels; SHHS transfer).
    
2. Joint modeling with EHR, labs, meds, and imaging  
    The obvious extension is a multimodal clinical model where SleepFM embeddings are one input stream alongside EHR features. The key question would be incremental predictive utility: does PSG add beyond baseline comorbidity and standard sleep indices, and for which diseases?
    
3. Ontology-aware phenome prediction  
    They already use phecodes and their hierarchy is known. A natural extension is hierarchical multi-task learning: enforce consistency across parent/child phecodes, share statistical strength, and improve interpretability (“what disease family is driving risk?”).
    
4. Longer-context self-supervised pretraining  
    Right now, pretraining is 5‑min segments. A strong extension would be hierarchical transformers / state-space models / masked modeling that sees hours-long sequences, learning sleep-cycle structure directly. This could also reduce reliance on the downstream LSTM to learn macroarchitecture from scratch.
    
5. Robustness to missing modalities as a first-class evaluation  
    They claim resilience to missing/heterogeneous channels. A strong follow-up is systematic modality dropout at inference (EEG-only, ECG+resp only, resp-only, etc.) across tasks and cohorts, plus calibration. (They hint that multi-modality is best, but “resilience” is stronger than “best with all modalities.”)
    
6. Bridging to wearables  
    Their modality set includes ECG and respiratory/pulse signals. With careful retooling, you could distill SleepFM into a wearable-friendly model (single-lead ECG + PPG-derived respiration, actigraphy) while keeping a shared representation space. This is a plausible translational route: learn in PSG, deploy in wearables.
    

Concrete things I would demand in a revision (or do as a follow-up study)

If the goal is “hard-nosed reviewer” feedback, these are not optional tweaks; they are what separates “interesting demo” from “clinically credible result.”

1. Fix or justify the survival loss computation  
    Either implement proper CoxPH risk sets (or a validated approximation), or switch to a minibatchable survival objective. The current description is a red flag.
    
2. Re-define incident disease more rigorously  
    At least a 6–12 month washout; better, 1–2 years; exclude prior codes; show sensitivity curves (washout length vs AUROC/C-index). Current 7-day rule is not adequate.
    
3. Add strong clinical baselines  
    PSG summary metrics baseline; EHR comorbidity baseline; combined baseline; and show incremental value of SleepFM embeddings.
    
4. Clarify AUROC computation under censoring  
    State explicitly how censoring before the 6-year horizon is handled. Provide time-dependent AUC or IPCW-AUC if appropriate.
    
5. External validation for more than six SHHS outcomes  
    They limit SHHS evaluation to a subset because of outcome availability. That’s understandable, but the “130 diseases” claim remains essentially single-system. Even one additional external EHR-linked sleep cohort would materially strengthen the paper.
    
6. Calibration and clinical decision analysis  
    If they want clinical relevance, they need calibration (not just discrimination) and possibly decision curves. High AUROC in a biased referral cohort does not directly translate to useful risk stratification.
    

Bottom line

As an engineering contribution, this is a solid and useful step: a practical, small multimodal PSG representation model trained on unusually large and heterogeneous sleep data, with evidence of transfer across time and to SHHS.

As a clinical prediction paper, the central disease-prediction claims are currently on shakier ground than the headline results suggest, primarily due to (i) weak incident-disease definitions (7-day washout) , (ii) unclear censoring handling for AUROC horizons , (iii) inadequate clinical baselines, and (iv) the very concerning description of minibatch CoxPH “correctness.”

If those issues are fixed, the work could genuinely become a standard PSG embedding backbone for sleep research and multimodal clinical modeling. If they are not fixed, the risk is that the most attention-grabbing part (phenome-wide disease prediction) is partly a methodological mirage.
~~~

To get a broader view, I also asked Opus 4.5, Gemini 3 Pro, Grok 4, Grok 4.1 Thinking, GLM 4.7, Kimi K2 Thinking with the same prompt to review the paper. I had to rerun the subsequent consolidation as I initially did not see that GLM 4.7 actually did not manage to access the full text; finally, I reran the prompt with GLM 4.7 with the PDF attached to fix this problem. 

All those reviews had points for them. As usual, Opus 4.5 was a very nice reviewer. Gemini 3 Pro had quite a few hallucinations. Grok 4 was good for finding missing literature. Grok 4.1 Thinking was quite balanced. GLM 4.7 had some unique insights. Kimi K2 went all the way and even fully reviewed the published code; Opus didn't like how strict it was, but I did. 

Here is the consolidation of the reviews as per Opus 4.5. The extra section on GLM 4.7 comes from the additional run that arrived after the others had already been scored (my weekly quota, guy!). I also did run consolidated reviews through 5.2 Pro Extended Thinking but both failed to access the GH code and could not assess the claims that stem from the code reviews. 

Final Consolidated Assessment

### What the Paper Actually Demonstrates

1. ✅ Self-supervised pretraining at large scale produces useful PSG representations
2. ✅ Channel-agnostic architecture enables cross-site deployment
3. ✅ Pretraining improves performance over supervised baselines on the same data
4. ✅ Transfer learning to SHHS (held-out cohort) works for cardiovascular outcomes
5. ✅ Sleep staging performance is competitive with specialized models

### What the Paper Does NOT Demonstrate

1. ❌ That sleep alone "predicts" disease (confounding by existing pathology)
2. ❌ That predictions generalize to population cohorts (only sleep clinic patients)
3. ❌ Clinical utility or actionability of risk predictions
4. ❌ Incremental value over standard PSG clinical features
5. ❌ Correct survival modeling (mini-batch Cox issue)
6. ❌ Calibration of risk predictions (GLM 4.7)
7. ❌ Temporal stability expected of a true "foundation" (GLM 4.7)
8. ❌ Zero/few-shot capabilities implied by "foundation model" terminology (GLM 4.7)

### Recommended Interpretation

The headline claim—"from one night of sleep, SleepFM accurately predicts 130 conditions"—should be interpreted as:

> "Among patients referred to sleep clinics, multimodal PSG embeddings show strong association with subsequent EHR codes for 130 conditions, likely reflecting baseline disease burden and diagnostic trajectories rather than independent sleep biomarkers."

### Score Summary (Based on Reviewer Consensus)

|Dimension|Score|Notes|
|---|---|---|
|**Technical Innovation**|7/10|Solid engineering, sensible design choices|
|**Dataset/Scale**|9/10|Genuinely unprecedented for the field|
|**Methodological Rigor**|5/10|Major issues with incident definition, survival modeling, baselines|
|**Clinical Significance**|4/10|Overstated claims, utility undemonstrated|
|**Reproducibility**|8/10|Excellent code/data release|
|**Overall Impact**|6/10|Important step for field, but claims need major qualification|

### Bottom Line

**For ML/engineering venues:** This is a strong contribution demonstrating that foundation model approaches work for multimodal PSG at scale.

**For clinical interpretation:** The disease prediction claims are not as clean as headlines suggest. The combination of weak baselines, permissive incident definitions, referral bias, and potential survival modeling issues means the clinical value proposition remains under-supported.

**The lasting contribution** will likely be SleepFM as a reusable encoder for sleep researchers, not the specific disease prediction claims.


With that by my side, I'll now re-read the paper and have a look at the code, too. 
