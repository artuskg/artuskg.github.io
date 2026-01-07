# AI in Scientific Peer Review
## State of the Field as of January 2026

### Executive Summary
Scientific peer review in January 2026 exists in a state of productive tension. Survey data shows **53% of reviewers have used AI tools** in peer review [[13]](#ref-13)[[14]](#ref-14), with **87% of early-career researchers** using AI tools generally [[13]](#ref-13). Meanwhile, venue policies range from strict prohibition to venue-provided AI infrastructure. This document synthesizes verified evidence on the current policy landscape, empirical findings, and likely trajectory of AI integration into peer review.

**The core tension:** traditional confidentiality frameworks assume human-only processing, but detection tools demonstrably fail to identify most AI-generated reviews [[19]](#ref-19). Venues are converging on disclosure-plus-sanctions models rather than tool-policing, and the most forward-looking experiments (ICML 2026 dual-policy, AAAI-26 venue-provided AI) treat controlled integration as more realistic than prohibition.

---

### Verified Timeline
The following events are documented with primary sources:

| Date | Event | Source |
| :--- | :--- | :--- |
| **Jun 2023** | NIH prohibits peer reviewers from using LLMs for grant reviews | NIH Notice [[1]](#ref-1) |
| **Dec 2023** | NSF extends confidentiality to generative AI; prohibits uploads to non-approved tools | NSF Notice [[2]](#ref-2) |
| **Oct 2024** | ICLR 2025 announces Review Feedback Agent pilot (feedback on reviews, not AI-written reviews) | ICLR Blog [[3]](#ref-3) |
| **Apr 2025** | ICLR 2025 RCT results: 18,946 reviews received feedback; 27% updated; >12,000 suggestions incorporated | arXiv:2504.09737 [[4]](#ref-4) |
| **May 2025** | AAAI announces AI-assisted review pilot for AAAI-26: supplementary LLM review + discussion summaries | AAAI Press Release [[5]](#ref-5) |
| **Jul 2025** | Prompt injection attacks discovered: 18 arXiv preprints with hidden instructions | Nature, arXiv [[6]](#ref-6)[[11]](#ref-11) |
| **Aug 2025** | ICLR 2026 policy: mandatory disclosure, human responsibility, enforcement consequences | ICLR Blog [[7]](#ref-7) |
| **Nov 2025** | Pangram Labs analysis: ~21% of ICLR 2026 reviews flagged as fully AI-generated (vendor estimate) | Nature [[8]](#ref-8) |
| **Dec 2025** | ICML 2026 dual-policy framework announced; Frontiers survey shows 53% reviewer AI usage | ICML Policy [[12]](#ref-12), Frontiers [[14]](#ref-14) |
| **Dec 2025** | Nature reports detection tools fail to identify most AI-generated peer reviews | Nature [[19]](#ref-19) |

---

### Current Policy Landscape: Three Regimes
Venue policies have converged into three distinct approaches, each with internal logic but different assumptions about enforcement feasibility and reviewer behavior.

#### Regime 1: Strict Prohibition
*   **Rule:** Do not use LLMs for reviewing; do not paste submission/review content into any AI tool.
*   **Examples:** ICML 2025, AISTATS 2026, CVPR 2026, NIH [[1]](#ref-1), NSF [[2]](#ref-2).
*   **Rationale:** Confidentiality is binary; reviewers cannot prove what tool was used or what data retention applied. This represents the simplest enforceable rule in principle, though empirical evidence suggests widespread non-compliance.

#### Regime 2: Containment (Controlled Allowance)
*   **Rule:** Allow some AI assistance, but wall it off from confidential content and judgment delegation.
*   **Examples:** NeurIPS 2025, ICML 2026 (Policy B) [[12]](#ref-12), ACL Rolling Review.
*   **ICML 2026 provides the most detailed framework [[12]](#ref-12):**
    *   *Policy A (Conservative):* Strict ban on LLM use.
    *   *Policy B (Permissive):* Privacy-compliant LLMs allowed for understanding papers and polishing reviews; prohibited for generating strengths/weaknesses or writing the review.
    *   Authors choose policy requirement; reviewers matched accordingly.
    *   Violations trigger desk rejection of reviewer's own submissions.
*   **Rationale:** Bans are demonstrably violated (53% usage against restrictive policies [[14]](#ref-14)). Better to define a permitted lane and penalize obvious abuse than maintain an unenforceable prohibition.

#### Regime 3: Venue-Provided AI Infrastructure
*   **Rule:** Conference provides AI under its own controls; keeps it supplementary and non-decisional.
*   **Examples:** ICLR 2025 (Review Feedback Agent) [[3]](#ref-3), AAAI-26 (AI-Assisted Pilot) [[5]](#ref-5).
*   **The AAAI-26 pilot represents the most ambitious implementation [[5]](#ref-5):**
    *   Uses OpenAI frontier reasoning model with search/retrieval tools.
    *   One supplementary LLM review per paper (Phase 1); AI discussion summaries for Senior PC (Phase 2).
    *   No scores, no recommendations, no automated decisions.
    *   Privacy: ephemeral data, contractual guarantees against training on submissions.
*   **Rationale:** If AI will be used regardless, centralize it with guardrails, auditing, and explicit non-decisional status. This also addresses confidentiality concerns by keeping data within venue-controlled systems.

---

### Publisher and Journal Policies
Major publishers have converged on similar stances, generally prohibiting upload of manuscripts to external AI tools while exploring venue-provided alternatives:

| Publisher | Policy Summary | Source |
| :--- | :--- | :--- |
| **Elsevier** | Reviewers must not upload manuscripts to AI tools; human reviewer remains accountable. Notes use of identity-protected AI for internal screening/matching. | [[15]](#ref-15)[[16]](#ref-16) |
| **Springer Nature** | Do not upload manuscripts to generative AI; disclose AI-supported evaluation. Exploring provision of safe AI tools to reviewers. | [[17]](#ref-17)[[18]](#ref-18) |
| **Wiley** | Maintain confidentiality; do not upload to GenAI tools. Requires transparent declaration if tools used for review report. | [[20]](#ref-20) |
| **IEEE** | Must not process manuscript content through public AI platforms. Explicitly prohibits AI tools for generating/drafting reviews. | [[21]](#ref-21) |
| **PLOS ONE** | AI tools cannot serve as reviewers or decision-issuing editors. Any AI use must be disclosed; feedback must reflect personal assessments. | [[22]](#ref-22) |

---

### Verified Empirical Findings
The following findings have strong evidential support from primary sources:

| Finding | Source | Confidence |
| :--- | :--- | :--- |
| **53% of reviewers have used AI in peer review** | Frontiers survey (Dec 2025, n=1,645) [[14]](#ref-14) | High |
| **87% of early-career researchers use AI tools** | Frontiers survey [[13]](#ref-13) | High |
| **~32% used GenAI when acting as peer reviewer** | IOP Publishing survey [[23]](#ref-23) | High |
| **27% of reviewers receiving AI feedback updated their reviews** | ICLR 2025 RCT [[4]](#ref-4) | High |
| **18 arXiv preprints contained hidden prompt injections** | Nature, arXiv:2507.06185 [[6]](#ref-6)[[11]](#ref-11) | High |
| **Detection tools miss most AI-generated reviews** | Nature (Dec 2025) [[19]](#ref-19) | High |
| **~21% of ICLR 2026 reviews flagged as fully AI-generated** | Pangram Labs (vendor) [[8]](#ref-8) | Signal only |

> *Note: The 53% figure represents "ever tried AI during peer review." Self-reported usage in prohibited contexts is likely understated. Different survey methodologies yield different percentages.*

#### Submission Volume Context
ICLR reported year-over-year submission increases of **47% (2024)** and **61% (2025)** [[3]](#ref-3). The ICLR 2025 fact sheet shows 11,603 submissions, 18,325 reviewers, and an average of 2.6 papers per reviewer [[24]](#ref-24). This volume pressure underlies much of the push toward AI assistance.

---

### The Four Primary Drivers
Policy positions across venues respond to four documented concerns:

**1. Confidentiality and Data Protection**
Submissions are privileged information under NDA-like terms. External LLMs cannot be audited for data retention or training use. "Privacy-compliant" tools require explicit no-training guarantees (enterprise APIs, self-hosted models) [[12]](#ref-12). Venues cannot audit individual reviewer tool usage, so policies collapse to "do not upload" or "use only venue-approved tools."
*   **Reality check:** Major cloud AI services (Azure OpenAI, Google Vertex AI) now offer BSI C5 attestation and SOC 2 Type 2 certification. The confidentiality argument is increasingly about policy lag rather than technical capability.

**2. Accountability and Hallucinations**
Reviews are expert judgments affecting careers and funding. Hallucinated citations, fabricated claims, and confidently wrong assessments are documented failure modes. Policies now tie hallucinations to ethics violations (ICLR) or desk rejection (ICML, CVPR) [[7]](#ref-7)[[12]](#ref-12). The human reviewer must remain accountable for content accuracy.
*   **Reality check:** Frontier models (late 2025) have substantially reduced hallucination rates. Cross-checking between model instances further reduces error. The human accountability principle remains sound regardless of tool capability.

**3. Adversarial Manipulation**
Documented attacks include hidden instructions in white text or microscopic fonts within submitted papers. Lin (2025) catalogued 18 cases with a four-type typology of prompt injections [[6]](#ref-6). The vulnerability extends beyond peer review to plagiarism detection and citation indexing. Multiple venues now treat prompt injection as misconduct.
*   **Reality check:** Prompt injection is a solved problem at the detection level. Classifiers can flag suspicious content before LLM processing. PDF source inspection catches blunt attacks. This is a deployment hygiene issue, not a fundamental barrier.

**4. Enforcement Reality**
Text detectors have high false negatives (miss AI content) and false positives (flag human content). Nature (December 2025) confirmed that detection tools fail to identify most AI-generated reviews [[19]](#ref-19). Venues therefore lean toward clear policies, disclosure requirements, and outcome-based sanctions rather than tool detection.
*   **Reality check:** If detection is fundamentally unreliable, prohibition-based policies are performative. The field is implicitly acknowledging this by shifting toward disclosure and consequence-based frameworks.

---

### Why "AI Reviewer 2" Is Not Yet Standard
Despite demonstrated capability and widespread shadow usage, AI-primary reviewing is not normalized. The blocking factors:

| Requirement | Current State |
| :--- | :--- |
| **Robust against prompt injection** | Solvable but not yet standard in deployment [[6]](#ref-6) |
| **Reliable novelty assessment** | Improving but historically weak; human judgment still superior |
| **Confidentiality-preserving infrastructure** | Available via venue-provided systems or compliant APIs [[12]](#ref-12) |
| **Consistent/reproducible outputs** | Stochastic; multiple evaluations per paper provide richer signal |
| **Clear governance/appeals process** | Not yet standardized across venues |

The AAAI-26 pilot comes closest to a gold-standard implementation: centralized, venue-controlled, hardened against common attacks, and explicitly non-decisional [[5]](#ref-5).

---

### Strong Alternate Views
Reasonable people disagree about optimal policy. Four coherent positions:

**A. "Hard-ban is the only enforceable rule"**
*   *Argument:* Confidentiality is binary; reviewers cannot reliably prove tool settings or data handling. "No submission content in any LLM" is the only scalable rule.
*   *Counter:* Empirical evidence (53% usage) suggests this is exactly the non-enforceable approach. Prohibition without enforcement creates norm erosion [[14]](#ref-14).

**B. "Containment beats hypocrisy"**
*   *Argument:* Bans are widely violated. Define a permitted lane (privacy-compliant tools, no judgment delegation) and penalize obvious abuse.
*   *Evidence:* ICML 2026 dual-policy [[12]](#ref-12); NeurIPS containment approach; ICML survey showing 40% would be "hampered" by writing bans.

**C. "Venue-provided AI is the only scalable path"**
*   *Argument:* If AI will be used anyway, conferences should provide it centrally with guardrails and auditing.
*   *Evidence:* AAAI-26 pilot [[5]](#ref-5); ICLR 2025 feedback agent success (27% update rate, >12,000 suggestions incorporated) [[4]](#ref-4).

**D. "Disclosure-first, not tool-policing"**
*   *Argument:* Policing which tool was used is a dead end. Require disclosure and enforce against harms (fabrication, hallucinations, breaches).
*   *Evidence:* ICLR 2026 policy (mandatory disclosure + responsibility + consequences) [[7]](#ref-7); Nature's confirmation that detection tools are unreliable [[19]](#ref-19).

---

### Most Likely Trajectory (12-24 Months)

1.  **Convergence toward venue-provided AI infrastructure.** AAAI-26 results will influence adoption. Expect more venues to offer sandboxed tools rather than fight shadow usage.
2.  **Dual-policy experiments spreading.** ICML 2026's approach (author choice of human-only vs. AI-permitted review) may be adopted if results maintain author satisfaction [[12]](#ref-12).
3.  **Disclosure + outcome-based sanctions as enforcement norm.** Detection remains imperfect. Penalties for hallucinations, fabrication, and confidentiality breaches will dominate over tool detection.
4.  **Structured AI outputs, not free-form reviews.** Emerging model: AI for factual checks, claim extraction, citation verification, methodology screening. Not strengths/weaknesses/decisions.
5.  **Continued underground use.** 53% usage rate will not drop [[14]](#ref-14). Policies will adapt toward controlled allowance rather than aspirational bans.
6.  **Author opt-out mechanisms.** ICML 2026's model may spread as authors express preferences about AI involvement in their reviews.

---

### Synthesis and Assessment

The evidence supports several conclusions:

*   **The prohibition era is ending.** 53% usage against restrictive policies, 87% early-career AI adoption, and unreliable detection mean prohibition is increasingly performative. The 87% cohort will be the assistant professors and lab chairs within a few years.
*   **Disclosure should be assumed, not enforced.** In 2026, the reasonable prior is that everything is AI-assisted. Mandatory disclosure is valuable for honesty but should not be treated as meaningful differentiation. The interesting question is which models and prompts are used, not whether AI is involved.
*   **Human accountability is non-negotiable.** When AI errs, the responsible human is at fault. This is not different from any other tool delegation. Lawyers who submitted ChatGPT hallucinations to court were sanctioned for their failure to verify, not for using the tool.
*   **Venue-provided infrastructure is the logical endpoint.** Confidentiality concerns evaporate when the venue controls the system. Quality concerns are addressed through model selection and prompt engineering. Prompt injection is handled through preprocessing. This is where sensible policy converges.
*   **The "non-decisional" constraint may be temporary.** Current pilots explicitly avoid scores and recommendations [[5]](#ref-5). But as model capabilities advance and reviewer burden increases (61% YoY submission growth at ICLR [[3]](#ref-3)), the pressure to accept AI judgment signals will increase. The endgame may be AI-primary review with human oversight and appeals, not AI-assisted human review.

---

### Appendix: Comprehensive Concern Inventory
For completeness, concerns raised across venue policies and coverage:

**Legal and Confidentiality (Explicit in Policies)**
*   Breach of reviewer NDA via external LLM [[12]](#ref-12)[[15]](#ref-15)
*   Third-party data retention uncertainty [[12]](#ref-12)
*   GDPR/jurisdictional data protection
*   IP/trade secret exposure [[15]](#ref-15)
*   Federal grant confidentiality (NIH/NSF) [[1]](#ref-1)[[2]](#ref-2)

**Integrity and Accountability (Explicit)**
*   Hallucinated citations/claims [[3]](#ref-3)
*   Unclear accountability when AI errs
*   Ghostwriting without disclosure [[20]](#ref-20)
*   Reviewer unable to defend own review

**Quality and Signal (Mixed Evidence)**
*   Novelty assessment weakness
*   Generic/boilerplate reviews
*   Review length inflation without substance [[4]](#ref-4)
*   Reduced reviewer skill development

**Adversarial and Security (Verified)**
*   Prompt injection attacks (18 documented cases) [[6]](#ref-6)[[11]](#ref-11)
*   White-font/tiny-font manipulation [[11]](#ref-11)
*   Authors optimizing against AI reviewers

**Enforcement and Detection (Mixed)**
*   Detection tools unreliable (confirmed) [[19]](#ref-19)
*   False positives penalizing legitimate reviewers
*   Policies driving underground use [[14]](#ref-14)

**Systemic and Incentive (Underlying)**
*   Volume overwhelming human review (47-61% YoY growth) [[3]](#ref-3)
*   Reviewer burnout / declining participation
*   Two-tier system emerging

**Fairness and Equity (Implicit)**
*   Non-native speakers disadvantaged by bans (40% report being "hampered")
*   Resource asymmetry in tool access
*   Detection bias against non-native English

---
*Document compiled January 7, 2026*

### References

<a name="ref-1"></a>[1] [NIH Notice NOT-OD-23-149: The Use of Generative Artificial Intelligence Technologies is Prohibited for the NIH Peer Review Process](https://grants.nih.gov/grants/guide/notice-files/NOT-OD-23-149.html) (June 2023)
<a name="ref-2"></a>[2] [NSF Notice to the Research Community on Use of Generative Artificial Intelligence Technology in the NSF Merit Review Process](https://www.nsf.gov/news/notice-to-the-research-community-on-ai) (Dec 2023)
<a name="ref-3"></a>[3] [ICLR Blog: Assisting ICLR 2025 reviewers with feedback](https://blog.iclr.cc/2024/10/09/iclr2025-assisting-reviewers/) (Oct 2024)
<a name="ref-4"></a>[4] [Liang et al., Can LLM feedback enhance review quality? A randomized study of 20K reviews at ICLR 2025](https://arxiv.org/abs/2504.09737) (arXiv, Apr 2025)
<a name="ref-5"></a>[5] [AAAI-26 AI-Assisted Peer Review Pilot Press Release](https://aaai.org/wp-content/uploads/2025/05/AAAI-LLM-Press-Release.pdf) (May 2025)
<a name="ref-6"></a>[6] [Lin et al., Prompt Injection Attacks in Peer Review](https://arxiv.org/abs/2507.06185) (arXiv, July 2025)
<a name="ref-7"></a>[7] [ICLR Blog: Policies on Large Language Model Usage at ICLR 2026](https://blog.iclr.cc/2025/08/26/policies-on-large-language-model-usage-at-iclr-2026/) (Aug 2025)
<a name="ref-8"></a>[8] [Nature: Pangram Labs analysis of ICLR 2026 reviews](https://www.nature.com/articles/d41586-025-03506-6) (Nov 2025)
<a name="ref-11"></a>[11] [PubMed: Scientists hide messages in papers to game AI peer review](https://pubmed.ncbi.nlm.nih.gov/40646151/) (July 2025)
<a name="ref-12"></a>[12] [ICML 2026 LLM Policy and Dual-Track Framework](https://icml.cc/Conferences/2026/LLM-Policy) (Dec 2025)
<a name="ref-13"></a>[13] [Frontiers: AI in peer review: what early-career researchers should know](https://www.frontiersin.org/field-notes/2025/12/15/ai_in_peer_review_dec-25) (Dec 2025)
<a name="ref-14"></a>[14] [Frontiers: Most peer reviewers now use AI](https://www.frontiersin.org/news/2025/12/15/most-peer-reviewers-now-use-ai-and-publishing-policy-must-keep-pace) (Dec 2025)
<a name="ref-15"></a>[15] [Elsevier: The use of generative AI and AI-assisted technologies in the review process](https://www.elsevier.com/about/policies-and-standards/the-use-of-generative-ai-and-ai-assisted-technologies-in-the-review-process)
<a name="ref-16"></a>[16] [Elsevier: Generative AI policies for journals](https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals)
<a name="ref-17"></a>[17] [Springer: Journal policies](https://link.springer.com/brands/springer/journal-policies)
<a name="ref-18"></a>[18] [Nature Portfolio: Artificial Intelligence (AI)](https://www.nature.com/nature-portfolio/editorial-policies/ai)
<a name="ref-19"></a>[19] [Nature: AI-generated peer reviews are hard to spot](https://www.nature.com/articles/d41586-025-04032-1) (Dec 2025)
<a name="ref-20"></a>[20] [Wiley: Review Confidentiality Policy](https://authorservices.wiley.com/Reviewers/journal-reviewers/tools-and-resources/review-confidentiality-policy.html)
<a name="ref-21"></a>[21] [IEEE: Submission and Peer Review Policies](https://journals.ieeeauthorcenter.ieee.org/become-an-ieee-journal-author/publishing-ethics/guidelines-and-policies/submission-and-peer-review-policies/)
<a name="ref-22"></a>[22] [PLOS One: Ethical Publishing Practice](https://journals.plos.org/plosone/s/ethical-publishing-practice)
<a name="ref-23"></a>[23] [IOP Publishing: AI and Peer Review 2025 Discussion](https://ioppublishing.org/ai-and-peer-review-2025-discussion/)
<a name="ref-24"></a>[24] [ICLR 2025 Fact Sheet](https://media.iclr.cc/Conferences/ICLR2025/ICLR2025_Fact_Sheet.pdf)
