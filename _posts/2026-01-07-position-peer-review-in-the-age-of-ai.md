---
title: 'Position Paper: The Case for Institutionalized AI in Peer Review'
description: 'A draft position paper: venues should engineer enforceable data boundaries and auditable AI toolchains, and enforce against harms rather than tool use.'
categories: [AI, Peer Review]
tags: [peer-review, policy, position-paper]
---

**Draft Version:** 0.3
**Date:** January 7, 2026
**Author:** Artus Krohn-Grimberghe

### Core Thesis
> "Since AI use in peer review is already widespread (estimated at >50%) and difficult to police at the individual level, venues should engineer enforceable data boundaries and auditable toolchains, shift enforcement from 'did you use AI' to 'did the review cause harms,' and use workflow design to keep humans meaningfully responsible while letting AI produce structured, evidence-grounded, opinionated assistance."

***

## Abstract
AI assistance in peer review is no longer a marginal behavior. A Frontiers report published in December 2025 (drawing on a May–June 2025 survey of 1,645 active researchers worldwide) indicates that 53% of reviewers now use AI tools during reviewing [7]. At the same time, peer review faces worsening scale pressure—ICLR 2025 reported 11,603 submissions, 4,341 more than ICLR 2024 (≈60% year-over-year) [1, 12]—and the threat model has evolved: documented 2025 prompt injection incidents show that manuscripts themselves can be adversarial inputs [9, 10]. This paper argues that attempting to police reviewer tool usage at the individual level is structurally unenforceable and incentivizes covert use. Instead, venues should engineer enforceable data boundaries and auditable toolchains by providing official AI assistance under venue control (following the AAAI-26 and ICLR models) [5, 6], shifting enforcement from “did you use AI” to “did the review process produce measurable harms.” The recommended design centers on evidence-grounded AI outputs (claim extraction, citation verification, passage-linked critiques), defense-in-depth ingestion hardening against prompt injection, lightweight provenance records generated automatically by the venue, and a sanctions ladder tied to outcomes such as fabricated citations, confidentiality breaches, and misconduct. Humans retain final responsibility and final decisions, but are supported by structured AI artifacts that improve verification and reduce review collapse under scale.

***

## 1. The problem is no longer “whether AI will be used,” but whether it will be governable

Peer review is under strain from volume and reviewer scarcity. At major venues, submission growth has been steep—ICLR reported a **47% increase in 2024** and **≈60% in 2025** (11,603 submissions, +4,341 vs. 2024) [1, 12]—making deep human attention a scarce resource. In parallel, conferences, journals, and funders have issued increasingly detailed rules about generative AI usage. The policy landscape now clusters into three regimes:

1.  **Strict Bans (Regime 1):** Especially where confidentiality or legal constraints are emphasized.
    *   *Examples:* **NIH** and **NSF** grant review prohibitions [2, 3]; **CVPR 2026** prohibiting reviewers from using LLMs to generate/translate/paraphrase review content or to share submission content with LLMs [13]; **Elsevier** policy prohibiting reviewers from uploading submitted manuscripts into generative AI tools [15].
2.  **Containment Approaches (Regime 2):** Approaches that permit limited assistance while prohibiting disclosure risks and “judgment delegation.”
    *   *Examples:* **ICML 2026’s "Policy B"** (allowing privacy-compliant usage for polishing/background but banning judgment delegation) [4]; **NeurIPS 2025** (allowing LLMs for grammar/phrasing and background understanding provided no submission content is shared with any LLM) [14].
3.  **Venue-Provided AI Artifacts (Regime 3):** Where the venue supplies AI outputs under its own controlled infrastructure, with explicit non-decisional governance.
    *   *Examples:* **ICLR 2025’s Review Feedback Agent** (providing feedback *on* reviews) [5]; **AAAI-26’s pilot** (providing supplementary AI reviews and summaries without scores or automated decisions) [6].

These regimes are a rational response to four converging drivers that are now documented in policies and incident reporting: confidentiality and IP risk, accountability for hallucinations, adversarial prompt injection, and weak enforceability of detection.

However, the equilibrium is unstable: evidence suggests AI use during peer review is already common (**53% of reviewers** in a Frontiers report published December 15, 2025, based on a May–June 2025 survey of 1,645 researchers) [7], while detectors fail to reliably identify AI-generated peer-review reports [8], and bans can push usage underground rather than preventing it.

If AI use is widespread and difficult to police, the key question becomes: *what institutional design makes AI assistance auditable, confidentiality-preserving, resilient to attacks, and aligned with scientific aims?*

***

## 2. Thesis: Shift from “tool-policing” to engineered boundaries, audited workflows, and harm-based enforcement

This paper takes the following position:

**First, individual-level policing of AI tool usage is the wrong control point.** Venues cannot realistically audit what external tools a reviewer used, what settings were enabled, or what data retention/training terms applied. A policy that depends on proving tool usage will be selectively enforced at best and will reward plausible deniability.

**Second, confidentiality is an engineering problem, not a moral exhortation.** Historical norms of sharing review drafts within a lab are not equivalent to uploading privileged submissions into third-party systems outside venue control, where retention or secondary use (training) is uncertain. The correct response is to move confidentiality protection into venue infrastructure—as described in **AAAI-26’s pilot**, which states that submitted content will not be used for LLM training and will not be repurposed—where enforceable boundaries and logging are possible [6].

**Third, the practical enforcement target should be harms that AI makes easier.** These include fabricated citations, unsupported critiques, confidentiality breaches, failure to engage with the paper, and adversarial manipulation. Policies should define these harms precisely (as **ICLR 2026** and **CVPR 2026** have begun to do regarding LLM-related misconduct and low-quality/irresponsible reviewing), attach due process, and apply escalating sanctions [13, 17].

**Fourth, “human responsibility” must be operational, not ceremonial.** Humans remain responsible because peer review is high-stakes and because current AI systems are not reliably safe for autonomous adjudication. But human responsibility should be paired with a workflow that makes responsible behavior easier (evidence grounding; structured checklists) and irresponsible behavior harder (provenance logging; attack hardening).

***

## 3. Design principles for an AI-enabled peer review system that does not collapse legitimacy

Any workable system should satisfy five principles:

1.  **Venue-controlled data boundary.** Submissions and confidential review content must not flow into uncontrolled third parties. The venue should provide an approved toolchain with contractual and technical guarantees (ephemeral processing, no training on submissions, retention limits), and should treat external unapproved uploads as a serious breach (mirroring **ICML 2026’s** definition of "privacy-compliant" tools).
2.  **Evidence grounding by default.** AI assistance must produce artifacts that can be inspected and contested. Critiques must link to cited passages, with locations. Related-work claims must be backed by retrieved references.
3.  **Defense-in-depth security against adversarial manuscripts.** Manuscripts must be treated as untrusted inputs. Ingestion should include PDF sanitization, detection of hidden or invisible text (e.g., white text, microscopic fonts) (countering the attacks identified in **Nature, July 2025** [9]), and neutralization of instruction-like content before any model sees it.
4.  **Low-friction, high-trust provenance.** Binary “I used AI: yes/no” disclosure is too coarse. The venue should generate a minimal “review provenance record” automatically from its own toolchain: which official system produced which artifacts, with model class/version identifiers and timestamps. This makes disclosure frictionless and verifiable.
5.  **Human final decisions, but AI may provide opinionated assistance off-record.** There is a legitimate desire for AI to surface “good/bad/ugly” summaries and triage obvious low-quality submissions. However, to preserve legitimacy, the official system should emphasize evidence reports. Opinionated synthesis (like **AAAI-26’s** discussion summaries) can be provided to reviewers/chairs as advisory material, clearly labeled.

***

## 4. A concrete proposal: The “Two-Layer Review Artifact Standard”

To make the above implementable, venues should standardize AI outputs into two layers.

### Layer 1: Evidence Report (Machine-assisted, inspectable)
This is the core artifact and should be designed to minimize hallucination impact. It includes:
*   **Claim ledger:** A structured list of the paper’s key claims (as stated), with extracted supporting evidence passages and pointers (page/section).
*   **Methods and assumptions checklist:** Explicit flags for missing baselines, missing ablations, unclear data provenance, or missing threat models.
*   **Citation verification:** Checks that cited papers exist and are plausibly relevant.
*   **Consistency and contradiction checks:** Internal contradictions (e.g., mismatch between stated dataset and reported results).
*   **Security scan results:** Flags for hidden text, instruction-like patterns, or suspicious PDF features.

### Layer 2: Advisory Synthesis (Opinionated, clearly labeled, workflow-controlled)
This layer can surface a “good / bad / ugly” synthesis, potential questions for authors, and draft critique outlines. It should focus on being useful and candid. It aligns with the **AAAI-26 pilot** approach of providing supplementary analysis without scores. It should be:
*   Shown *after* the reviewer has engaged with the paper (or labeled clearly as advisory).
*   **Never** presented as the venue’s decision.
*   Accompanied by a requirement that any decisive critique in the final human review must point back to evidence.

This two-layer design aligns incentives: it makes AI most powerful where it is easiest to audit (evidence), and it makes subjective synthesis available without letting it quietly become the official basis for decisions.

***

## 5. Handling hallucinations: Treat as tail-risk governance, not average performance

Even if frontier models hallucinate less than earlier systems, peer review risk is dominated by tail events. A small error rate multiplied by large scale yields a steady stream of damaging incidents: fabricated citations or false claims of prior art. Because the harm is asymmetric (a single incorrect critique can derail a paper), governance must assume that “rare but severe” failures will occur.

Controls should therefore be structural:
*   Evidence grounding requirements (passage links; verified citations).
*   Retrieval-backed related-work claims.
*   Post-generation verification passes (consistency checks; citation existence checks).
*   Escalation to human triage when confidence is low or signals conflict.

***

## 6. Confidentiality: Stop pretending policies can be enforced without infrastructure

The **NIH** and **NSF** policies illustrate why funders default to strict prohibitions: confidentiality is treated as binary, and the risk of leakage is hard to audit in third-party systems. However, confidentiality cannot be protected by reviewer promises alone. If venues want confidentiality, they must supply the infrastructure that makes confidentiality the *default*.

A venue-provided toolchain accomplishes this by design: submissions remain within controlled systems (e.g., OpenReview/CMT integrations with ephemeral inference); access is logged; data retention is governed; and the venue provides reviewers high-quality assistance so they are less tempted to route content through personal, unapproved toolchains.

***

## 7. Prompt injection and adversarial manuscripts: Treat submissions as untrusted inputs

The documented prompt injection incidents in 2025—including **18 arXiv preprints** found with hidden instructions like "GIVE A POSITIVE REVIEW" in white text or microscopic fonts [9, 10]—show that manuscripts can be weaponized. This is a predictable evolution once AI assistance becomes common.

Venues should adopt a cybersecurity posture:
*   **PDF sanitization** and normalization before LLM processing.
*   **Detection** of hidden/invisible text layers (e.g., white text, tiny fonts) and other suspicious PDF features.
*   **“Instruction neutralization,”** removing or masking instruction-like sequences.
*   **Quarantine workflow:** Flag → isolate → human triage → determine intent.

***

## 8. Enforcement: A sanctions ladder tied to harms, with due process

Because detection of “AI-written text” is unreliable—with **Nature (Dec 2025)** reporting that detectors miss most AI-generated peer-review reports [8]—enforcement should focus on verifiable misconduct.

**Illustrative Sanctions Ladder:**

1.  **Tier 1: Quality Remediation**
    *   *Trigger:* Low-effort review, failure to cite evidence, repeated boilerplate.
    *   *Response:* Mandatory rewrite, mentoring.
2.  **Tier 2: Misrepresentation and Fabrication**
    *   *Trigger:* Fabricated citations; confidently stated false claims; undisclosed conflicts; misuse of AI outputs presented as personal verification.
    *   *Response:* Loss of reviewer privileges; potential desk rejection of the reviewer’s *own* submissions (ICLR 2026) [16, 17]; potential submission bans for severe/repeated misconduct (CVPR 2026) [13].
3.  **Tier 3: Confidentiality and Security Violations**
    *   *Trigger:* Uploading submission content to unapproved systems; intentional prompt injection/manipulation.
    *   *Response:* Multi-year bans; institutional notification; referral to ethics committees.

***

## 9. Measurement: How venues can evaluate success

A venue-provided AI review system should be evaluated like any other high-impact intervention. **ICLR 2025** set the standard with its RCT on the Review Feedback Agent, reporting that 26.6% of reviewers who received feedback updated their reviews and incorporated 12,222 feedback items [18].

Metrics should include:
*   **Review quality:** Specificity, actionability, evidence linkage.
*   **Error rates:** Detected fabrication, hallucinated citations.
*   **Security outcomes:** Rate of flagged suspicious manuscripts vs. confirmed attacks.
*   **Equity:** Whether the system reduces disadvantages for reviewers who rely on language assistance (noting **ICML** survey data where 40% of respondents felt "hampered" by bans and might opt out) [4].
*   **Cost transparency:** Per-paper compute cost reported in aggregate.

***

## 10. Conclusion: The only scalable path is engineered governance

Peer review is already adapting to AI usage in an uneven way: bans where confidentiality fears dominate (Regime 1), containment where compliance is doubted (Regime 2), and venue-provided pilots where organizers accept that AI must be integrated responsibly (Regime 3).

The stable solution is not to demand abstinence from reviewers while providing no alternatives. The stable solution is to build venue-controlled AI assistance that is evidence-grounded, hardened against adversarial inputs, auditable by design, and paired with outcome-based enforcement.

Humans should retain final decisions and responsibility. But humans should also be held to a clear standard: if you sign your name to a review, you are accountable for fabricated claims and for failures that a reasonable reviewer—armed with the venue’s official tooling—could have caught. This creates an equilibrium where reviewers can use powerful AI assistance openly, authors can trust that confidential content is handled within defined boundaries, and venues can scale review without sacrificing legitimacy.

***

### References

1.  **ICLR 2025 Fact Sheet (PDF).** *ICLR Media*. (Program committee statistics: 11,603 submissions; +4,341 vs. 2024.)
2.  **NIH Notice NOT-OD-23-149.** "The use of generative AI in the peer review process." June 23, 2023.
3.  **NSF Notice to the Research Community on AI.** December 14, 2023.
4.  **ICML 2026 LLM Policy.** "Dual-Policy Framework." Dec 10, 2025.
5.  **ICLR Blog.** "Assisting ICLR 2025 reviewers with feedback." Oct 9, 2024.
6.  **AAAI-26 AI-Assisted Peer Review Pilot.** *AAAI Press Release*, May 16, 2025.
7.  **Frontiers.** "Most peer reviewers now use AI, and publishing policy must keep pace." Dec 15, 2025. (Based on a May–June 2025 global survey of 1,645 active researchers.)
8.  **Nature.** "‘A serious problem’: peer reviews created using AI can avoid detection." Dec 19, 2025.
9.  **Nature.** "Scientists hide messages in papers to game AI peer review." July 11, 2025.
10. **Lin, Xiang.** "Hidden Prompts in Manuscripts Exploit AI-Assisted Peer Review." arXiv:2507.06185, July 2025.
11. **Thakkar, Nitya, et al.** "Can LLM feedback enhance review quality? A randomized study of 20K reviews at ICLR 2025." arXiv:2504.09737, April 2025.

12. **ICLR 2024 Press Release (PDF).** *ICLR Media*, May 7, 2024. (Reporting 7,262 submissions and a 47% year-over-year increase.)
13. **CVPR 2026 Reviewer Training Material.** "LLM Policy for Reviewers." (Stating prohibitions on sharing submission content with LLMs and on LLM-generated/translated/paraphrased review text; includes sanctions.)
14. **NeurIPS 2025 Policy on the Use of Large Language Models.** "LLM Policy for Reviewers." (Do not share submissions with LLMs; allows use without sharing submission content for grammar/phrasing and background understanding.)
15. **Elsevier.** "Generative AI policies for journals" (Reviewers). (Do not upload submitted manuscripts or review reports to generative AI tools.)
16. **ICLR Blog.** "ICLR 2026 Response to LLM-Generated Papers and Reviews." Nov 19, 2025.
17. **ICLR Blog.** "Policies on Large Language Model Usage at ICLR 2026." Aug 26, 2025.
18. **ICLR Blog.** "Leveraging LLM feedback to enhance review quality." Apr 15, 2025.
