If I don't have much time, I am simply asking GPT-5.2 Pro to come up with an overview for me:

> Please an in depth review of the below paper. No sugar coating, no mercy, no malice. I want the good, the bad, and (if any) the ugly. Where does this work improve our knowledge/the state of the art and how? Do you see potential uses/extensions/connections beyond this paper? Where would a well-read reviewer see missed connections—to older work the authors should have cited, to parallel developments in adjacent fields, or to techniques that could have been applied but weren’t? Anything else you like to point out?

This is not for an automated AI Peer Review, which would also require explicit (and exhaustive):
*   **Claim ledger:** A structured list of the paper’s key claims (as stated), with extracted supporting evidence passages and pointers (page/section).
*   **Methods and assumptions checklist:** Explicit flags for missing baselines, missing ablations, unclear data provenance, or missing threat models.
*   **Citation verification:** Checks that cited papers exist and are plausibly relevant.
*   **Consistency and contradiction checks:** Internal contradictions (e.g., mismatch between stated dataset and reported results).

And the above actually *before* heading off to the judgemental prompt that I like to run. But, again, I am not writing peer reviews with my prompt. I am just reading papers guided by AI.

If I have more time (to wait) and more interest in the paper, I do
- Submit multiple parallel runs of the initial prompt against 5.2 Pro as parallel runs can vary quite substantially in the more detailed findings; 
- Additional runs against Opus 4.5, Gemini 3 Pro, and Grok 4.1 Thinking. 
All those runs are then again fed into (this time just one) 5.2 Pro for consolidation and additional validation/double checking of the individual review items. Usually with something along the lines of:

> Validate and then consolidate the below reviews of the attached/linked paper...

What I find (judged solely by my gut feeling) is that GPT-5.2 Pro does really only hallucinate relatively rarely. When a second 5.2 Pro then double checks the findings of the first, I have so far not seen a hallucination in the original sense survive (but errors maybe). Which I think is pretty amazing also for "industrial" paper reviews. So far the added value of G3P or O4.5 has been a bit limited (again, no scientific evaluations as of now); whereas, interestingly, Grok 4.1 Thinking sometimes seems to surface interesting related work. I may add GLM 4.7, Qwen 3 Max or K2 Thinking to my stack eventually, but this will depend on at least a partial automation of this workflow. 

Why is this workflow not yet fully automated? This can't be too difficult?! In fact it would be super easy to automate this workflow using the existing vendor APIs. Maybe a few hours with "Claudex". But the real problem are the exorbitant costs that I am not willing to bear. Hence, my manual copy & paste workflow. Will I pseudo-automate it by packaging the calls into a "Claudex" browser-automation skill eventually? Certainly! I am traveling for now, but soon I should get my hands on the new Mac Mini where a "Claudex" shall live and work on exactly those things for me. 

Btw: A follow-up prompt that I like to run for papers that interest me: 

> Now step back from evaluating the paper on its own terms. What does this work remind you of? What older ideas is it reinventing, what adjacent fields face similar problems, and what techniques from elsewhere could apply here?
