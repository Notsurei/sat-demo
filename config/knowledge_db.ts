export const mathCommonTraps: Record<string, string> = {
  "Linear equations in one variable":
    "Don't forget to apply the same operation to BOTH sides at every step. Watch for questions that ask for the value of an expression like '2x + 1' rather than x itself — solve for x first, then substitute. Negative signs when distributing are the #1 arithmetic trap.",
  "Linear functions":
    "When a table or graph is given, check if the relationship is truly linear before assuming slope is constant. The trap: confusing slope (rate of change) with y-intercept (starting value). In word problems, always identify which quantity is the independent variable before writing the equation.",
  "Linear inequalities":
    "Flipping the inequality sign when multiplying or dividing by a NEGATIVE number is the most common error. Also watch for 'at least' vs. 'more than' (≥ vs. >) — these translate differently. When graphing, double-check which side of the line satisfies the inequality by testing a point.",
  "Systems of Equations":
    "For elimination, make sure coefficients match before adding/subtracting — scale both equations if needed. For substitution, distribute carefully after substituting. The classic trap: SAT often asks for the value of x + y or 2x − y, not x and y individually — don't waste time solving for both if you don't need to.",
  "Quadratic and exponential functions":
    "For quadratics, check whether the question asks for roots, vertex, or y-intercept — each requires a different form (factored, vertex, or standard). For exponentials, a(1+r)^t means growth; a(1−r)^t means decay. Trap: confusing the base with the rate (the rate is what you add/subtract from 1).",
  "Polynomials and rational expressions":
    "When simplifying rational expressions, factor completely BEFORE cancelling — you can only cancel common factors, not terms. For polynomial division, check whether the remainder is zero (factor) or nonzero (remainder). Trap: forgetting to exclude values that make the denominator zero.",
  "Equivalent expressions":
    "Use substitution to verify equivalence — plug in a specific number for the variable and check both sides match. Watch for questions that look like they require algebra but are actually faster with strategic substitution. Trap: distribution errors when expanding (a+b)² = a²+2ab+b², NOT a²+b².",
  "Function notation":
    "f(x+1) does NOT equal f(x)+1 — substitute (x+1) into the entire expression. For composite functions f(g(x)), work inside out: evaluate g(x) first. Trap: the domain of a composite function f(g(x)) requires x to be in the domain of g AND g(x) to be in the domain of f.",
  "Lines, angles, and triangles":
    "In multi-step angle problems, name every angle you find before solving for the next. For similar triangles, write out the proportion with corresponding sides explicitly — confusing which sides correspond is the most common error. Trap: assuming a figure is drawn to scale when the problem says 'not drawn to scale.'",
  "Area and volume":
    "Always check units — if the question mixes feet and inches, convert first. For composite figures, break them into basic shapes. Trap: using diameter instead of radius in circle formulas. For 3D shapes, distinguish between surface area (sum of all faces) and volume (space inside).",
  Circles:
    "The central angle equals the arc measure; the inscribed angle equals HALF the arc measure. Trap: using the diameter when the formula needs the radius (r = d/2). For arc length and sector area, set up a proportion: (arc length / circumference) = (central angle / 360°).",
  Trigonometry:
    "SOHCAHTOA applies only to right triangles. For a given angle θ, sin θ = cos(90° − θ) — this complementary identity appears frequently on SAT. Trap: using the wrong side as 'opposite' or 'adjacent' — always label the triangle relative to the angle in question, not a different angle.",
  "Ratios, rates, proportions":
    "When setting up a proportion, make sure corresponding units are on the same side of the ratio. For multi-step rate problems, track units explicitly (miles/hour × hours = miles). Trap: adding percentages directly instead of computing them from the correct base (a 20% increase followed by a 20% decrease does NOT return to the original value).",
  "Probability and statistics":
    "Probability = favorable outcomes / total outcomes — both must be counted consistently (with or without replacement, ordered or unordered). For statistics questions, mean is sensitive to outliers but median is not — know when each is the better descriptor. Trap: confusing correlation with causation in data interpretation questions.",
  "Data interpretation":
    "Read the axis labels and units before doing any calculation — the most common error is misreading what each axis represents. Check whether a graph shows absolute values or percentages. Trap: when a table or chart shows percentages, you can't calculate actual counts without the total — make sure the total is given before attempting such a calculation.",
};
export const rwProTips: Record<string, { tip: string; trap: string }> = {
  "Words in Context": {
    tip: 'Always use the surrounding sentence — not just the blank — to determine meaning. Read the entire sentence, identify contrast/support signals ("however," "rather than," "in fact"), then test each option back in context. The correct word must fit the <em>tone</em> and <em>logic</em> of the sentence, not just the dictionary definition.',
    trap: "Avoid choosing a word simply because it 'sounds sophisticated' or because you've seen it used near similar topics. The SAT always provides enough context clues to distinguish between close synonyms.",
  },
  "Text Structure and Purpose": {
    tip: "Always ask: <em>what is the author DOING in this sentence/paragraph, not just SAYING?</em> Common purposes: define → illustrate → qualify → conclude. Look for signal phrases like 'in fact,' 'yet,' 'while,' 'this suggests' to identify structural moves.",
    trap: "Watch out for answers that use words from the passage but describe the wrong relationship (e.g., 'contradicts' when the passage actually 'qualifies'). Extreme verbs like 'proves,' 'refutes,' or 'dismisses' are usually wrong when the passage is nuanced.",
  },
  "Cross-Text Connections": {
    tip: "Map each text's main claim BEFORE reading the question. The key question types are: (1) How would Author 2 respond to Author 1? (2) What do both agree on? (3) How do they differ? For type 1, find Author 2's core argument and apply it — don't just look for surface contradictions.",
    trap: "Never choose an answer that overstates one author's position. If Text 2 says 'evidence is mixed,' the answer can't say Text 2 'denies' or 'refutes' the claim — it only qualifies it. Watch for degree words: 'partially,' 'conditionally,' 'in some cases.'",
  },
  "Central Ideas and Details": {
    tip: "The correct 'main idea' answer must cover the WHOLE passage — not just the first sentence or a vivid detail. A quick test: can you find support for this answer in every paragraph? If a choice is only supported by one section, it's probably a detail, not the main idea.",
    trap: "Avoid answers that are true but too narrow (focusing on one example), or too broad (introducing claims not in the passage). Both extremes are classic wrong-answer traps.",
  },
  "Command of Evidence": {
    tip: "For Rhetorical Synthesis (bullet notes → sentence): match the answer to the <em>stated goal</em> word-for-word. If the goal says 'contrast two findings,' the answer must contain both findings in opposition — not just one. For quantitative evidence, verify every number and direction claim against the chart before selecting.",
    trap: "Don't choose the answer that uses the most data points — choose the one that uses the <em>right</em> data points to accomplish the specific goal. An answer with 3 statistics that misses the goal is worse than one with 1 precise statistic that hits it.",
  },
  Inferences: {
    tip: "The correct inference is always the one that <em>must</em> be true given the passage — not the one that <em>could</em> be true. Test each answer: if the passage is true, is this answer necessarily true? If there's even a small possibility it's false, eliminate it.",
    trap: "Watch for answers that are plausible extensions of the passage but go one step too far. 'Researchers found X in Group A' does NOT support 'X is true for all groups.' Scope creep (overgeneralizing) is the most common inference trap.",
  },
  Boundaries: {
    tip: "The fastest approach: identify whether the underlined gap connects two <em>independent clauses</em> (complete sentences) or a clause and a phrase/list. Two independent clauses → semicolon OR comma + coordinating conjunction (FANBOYS). A colon introduces a list or explanation. An em-dash pair sets off a parenthetical.",
    trap: "A comma alone CANNOT join two independent clauses — this is a comma splice. 'However,' 'therefore,' and 'furthermore' are NOT coordinating conjunctions; they need a semicolon before them, not just a comma.",
  },
  "Form, Structure, and Sense": {
    tip: "For subject-verb agreement: ignore everything between the subject and the verb. Cross out prepositional phrases and parenthetical clauses to find the true subject. For tense: identify the time frame of the sentence (narrative past? general present? future completion?) before choosing. For parallelism: match the grammatical form of the other items in the list.",
    trap: "The mandative subjunctive (after 'require that,' 'insist that,' 'recommend that') always uses the BASE form of the verb — no -s, no past tense, no 'will.' This is a high-frequency SAT trap: 'The policy requires that each student submit [NOT submits] the form.'",
  },
  "Modifier Placement": {
    tip: "The subject immediately after a comma following an introductory phrase must be the thing the phrase describes. Test: read just the introductory phrase + the subject — does this make logical sense? 'Running late for the interview, [WHO ran late?]' → the subject must be the runner.",
    trap: "Passive constructions are a common trap: 'Having studied for years, the results were announced' — results can't study. When you see a participial phrase at the start of a sentence, always check that the grammatical subject of the main clause is actually the logical actor of the phrase.",
  },
  "Rhetorical Synthesis": {
    tip: "Read the note carefully for the <em>specific goal</em> — it will tell you exactly what the answer must do. Underline the goal's key verb (contrast, argue, illustrate, correct a misconception, acknowledge both X and Y). The correct answer must accomplish ALL parts of the goal, using evidence from the notes.",
    trap: "Answers that are factually accurate but miss part of the goal are always wrong. If the goal says 'argue X while acknowledging Y,' an answer that only argues X (without Y) is incorrect, no matter how well-written it is.",
  },
  Transitions: {
    tip: "Map the logical relationship between the two sentences BEFORE looking at options: (A) Same direction → Furthermore, Additionally, Similarly; (B) Opposite direction → However, In contrast, Yet; (C) Cause→effect → Therefore, Consequently, As a result; (D) Concession → Nevertheless, Despite this, That said; (E) Surprise/paradox → Remarkably, Yet paradoxically, To their astonishment.",
    trap: "Don't choose a transition just because it 'sounds right' — test it logically. 'However' implies the second sentence weakens or contradicts the first. If the second sentence actually extends or illustrates the first, 'however' is wrong even if it fits grammatically.",
  },
};
export const knowledgeDB = {
  rw: [
    {
      domain: "Craft and Structure",
      icon: "🔍",
      subtopics: [
        {
          name: "Words in Context",
          keypoints: [
            "The correct word must fit <b>TONE</b> and <b>LOGIC</b> — not just dictionary definition.",
            "Read the <b>entire sentence</b> before evaluating any option — never just look at the blank.",
            "<b>Contrast signals</b> (however, rather than, yet, although) → word must be OPPOSITE in tone to surrounding content.",
            "<b>Support signals</b> (because, since, in fact, indeed) → word must ALIGN with surrounding content.",
            "Test each option: substitute it back. Right answer sounds <b>natural AND logical</b>.",
            "Watch for <b>connotation</b>: 'frugal' vs 'miserly' are both 'careful with money' but differ in tone.",
          ],
          diagram: `<svg viewBox="0 0 520 140" xmlns="http://www.w3.org/2000/svg" style="max-width:520px;width:100%">
            <rect x="0" y="0" width="520" height="140" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="260" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#64748b">CONTEXT SIGNAL LOGIC</text>
            <rect x="20" y="35" width="150" height="40" rx="6" fill="#dbeafe" stroke="#3b82f6"/>
            <text x="95" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">CONTRAST signal</text>
            <text x="95" y="66" text-anchor="middle" font-size="10" fill="#1e40af">however / but / yet</text>
            <text x="180" y="58" text-anchor="middle" font-size="18" fill="#64748b">→</text>
            <rect x="200" y="35" width="130" height="40" rx="6" fill="#fee2e2" stroke="#ef4444"/>
            <text x="265" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#991b1b">OPPOSITE tone</text>
            <text x="265" y="66" text-anchor="middle" font-size="10" fill="#991b1b">word = reverse of nearby</text>
            <rect x="20" y="90" width="150" height="40" rx="6" fill="#dcfce7" stroke="#22c55e"/>
            <text x="95" y="107" text-anchor="middle" font-size="11" font-weight="bold" fill="#14532d">SUPPORT signal</text>
            <text x="95" y="121" text-anchor="middle" font-size="10" fill="#14532d">because / since / indeed</text>
            <text x="180" y="113" text-anchor="middle" font-size="18" fill="#64748b">→</text>
            <rect x="200" y="90" width="130" height="40" rx="6" fill="#dcfce7" stroke="#22c55e"/>
            <text x="265" y="107" text-anchor="middle" font-size="11" font-weight="bold" fill="#14532d">SAME direction</text>
            <text x="265" y="121" text-anchor="middle" font-size="10" fill="#14532d">word aligns with nearby</text>
            <text x="360" y="80" text-anchor="middle" font-size="11" fill="#64748b">→ Sub each option</text>
            <text x="360" y="95" text-anchor="middle" font-size="11" fill="#64748b">back into sentence</text>
            <rect x="415" y="48" width="90" height="50" rx="6" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="460" y="67" text-anchor="middle" font-size="11" font-weight="bold" fill="#92400e">CORRECT</text>
            <text x="460" y="81" text-anchor="middle" font-size="10" fill="#92400e">natural +</text>
            <text x="460" y="93" text-anchor="middle" font-size="10" fill="#92400e">logical ✓</text>
          </svg>`,
          tip: rwProTips["Words in Context"]
            ? rwProTips["Words in Context"].tip
            : "",
          trap: rwProTips["Words in Context"]
            ? rwProTips["Words in Context"].trap
            : "",
          videos: [
            {
              title: "Words in Context — SAT Reading",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:craft-and-structure/v/sat-reading-words-in-context",
            },
            {
              title: "Vocabulary in Context Strategy",
              url: "https://www.youtube.com/results?search_query=SAT+words+in+context+strategy+2024",
            },
          ],
        },
        {
          name: "Text Structure and Purpose",
          keypoints: [
            "Ask: <b>What is the author DOING</b> here — not just what they're saying.",
            "Common moves: <b>Define → Illustrate → Qualify → Conclude</b>.",
            "<b>Signal phrases</b>: 'in fact' (emphasis) · 'however' (contrast) · 'for example' (illustration) · 'this suggests' (conclusion).",
            "Purpose answer verbs: argue, illustrate, qualify, counter, define, contrast, support, question.",
            "Avoid <b>extreme verbs</b> (proves, refutes, dismisses) unless text is explicitly that strong.",
            "A paragraph's function is determined by its <b>relationship to adjacent paragraphs</b> — not in isolation.",
          ],
          diagram: `<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg" style="max-width:500px;width:100%">
            <rect x="0" y="0" width="500" height="120" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="250" y="20" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">COMMON PASSAGE STRUCTURE FLOW</text>
            <rect x="10" y="30" width="90" height="72" rx="6" fill="#dbeafe" stroke="#3b82f6"/>
            <text x="55" y="60" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">DEFINE</text>
            <text x="55" y="75" text-anchor="middle" font-size="9" fill="#1e40af">introduce</text>
            <text x="55" y="88" text-anchor="middle" font-size="9" fill="#1e40af">a concept</text>
            <text x="108" y="68" font-size="16" fill="#94a3b8">→</text>
            <rect x="118" y="30" width="90" height="72" rx="6" fill="#dcfce7" stroke="#22c55e"/>
            <text x="163" y="60" text-anchor="middle" font-size="11" font-weight="bold" fill="#14532d">ILLUSTRATE</text>
            <text x="163" y="75" text-anchor="middle" font-size="9" fill="#14532d">give example</text>
            <text x="163" y="88" text-anchor="middle" font-size="9" fill="#14532d">or evidence</text>
            <text x="216" y="68" font-size="16" fill="#94a3b8">→</text>
            <rect x="226" y="30" width="90" height="72" rx="6" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="271" y="60" text-anchor="middle" font-size="11" font-weight="bold" fill="#92400e">QUALIFY</text>
            <text x="271" y="75" text-anchor="middle" font-size="9" fill="#92400e">add nuance</text>
            <text x="271" y="88" text-anchor="middle" font-size="9" fill="#92400e">or counter</text>
            <text x="324" y="68" font-size="16" fill="#94a3b8">→</text>
            <rect x="334" y="30" width="90" height="72" rx="6" fill="#fee2e2" stroke="#ef4444"/>
            <text x="379" y="60" text-anchor="middle" font-size="11" font-weight="bold" fill="#991b1b">CONCLUDE</text>
            <text x="379" y="75" text-anchor="middle" font-size="9" fill="#991b1b">summarize</text>
            <text x="379" y="88" text-anchor="middle" font-size="9" fill="#991b1b">implication</text>
            <text x="432" y="68" font-size="14" fill="#94a3b8">✓</text>
            <rect x="447" y="30" width="45" height="72" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
            <text x="470" y="60" text-anchor="middle" font-size="9" fill="#64748b">identify</text>
            <text x="470" y="74" text-anchor="middle" font-size="9" fill="#64748b">which</text>
            <text x="470" y="88" text-anchor="middle" font-size="9" fill="#64748b">step ✓</text>
          </svg>`,
          tip: rwProTips["Text Structure and Purpose"]
            ? rwProTips["Text Structure and Purpose"].tip
            : "",
          trap: rwProTips["Text Structure and Purpose"]
            ? rwProTips["Text Structure and Purpose"].trap
            : "",
          videos: [
            {
              title: "Text Structure & Purpose — Khan Academy",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:craft-and-structure/v/sat-text-structure-and-purpose",
            },
            {
              title: "SAT Reading: Author's Purpose",
              url: "https://www.youtube.com/results?search_query=SAT+text+structure+purpose+strategy",
            },
          ],
        },
        {
          name: "Cross-Text Connections",
          keypoints: [
            "Step 1: Summarize <b>each text's main claim in one sentence</b> before reading the question.",
            "Three question types: (1) <b>How would A respond to B?</b> (2) Both agree on? (3) How differ?",
            "For type 1: Find Author 2's core position → apply it directly to Author 1's specific claim.",
            "<b>Match strength carefully</b>: 'qualifies' ≠ 'contradicts' ≠ 'refutes' — these are on a spectrum.",
            "If a text uses <b>hedging</b> (may, might, could, suggests), the correct answer can't use absolute language.",
            "Both authors can agree on a <b>fact</b> while disagreeing on its <b>interpretation or significance</b>.",
          ],
          diagram: `<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:480px;width:100%">
            <rect x="0" y="0" width="480" height="130" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="240" y="20" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">CROSS-TEXT RELATIONSHIP SPECTRUM</text>
            <rect x="20" y="32" width="90" height="80" rx="6" fill="#dcfce7" stroke="#22c55e"/>
            <text x="65" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="#14532d">AGREES</text>
            <text x="65" y="70" text-anchor="middle" font-size="9" fill="#14532d">supports /</text>
            <text x="65" y="82" text-anchor="middle" font-size="9" fill="#14532d">confirms /</text>
            <text x="65" y="94" text-anchor="middle" font-size="9" fill="#14532d">corroborates</text>
            <rect x="125" y="32" width="90" height="80" rx="6" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="170" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">QUALIFIES</text>
            <text x="170" y="70" text-anchor="middle" font-size="9" fill="#92400e">adds nuance /</text>
            <text x="170" y="82" text-anchor="middle" font-size="9" fill="#92400e">complicates /</text>
            <text x="170" y="94" text-anchor="middle" font-size="9" fill="#92400e">partially agrees</text>
            <rect x="230" y="32" width="90" height="80" rx="6" fill="#fed7aa" stroke="#f97316"/>
            <text x="275" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="#7c2d12">CHALLENGES</text>
            <text x="275" y="70" text-anchor="middle" font-size="9" fill="#7c2d12">questions /</text>
            <text x="275" y="82" text-anchor="middle" font-size="9" fill="#7c2d12">disputes /</text>
            <text x="275" y="94" text-anchor="middle" font-size="9" fill="#7c2d12">complicates</text>
            <rect x="335" y="32" width="90" height="80" rx="6" fill="#fee2e2" stroke="#ef4444"/>
            <text x="380" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="#991b1b">CONTRADICTS</text>
            <text x="380" y="70" text-anchor="middle" font-size="9" fill="#991b1b">refutes /</text>
            <text x="380" y="82" text-anchor="middle" font-size="9" fill="#991b1b">disproves /</text>
            <text x="380" y="94" text-anchor="middle" font-size="9" fill="#991b1b">rejects</text>
            <path d="M 20 122 L 425 122" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
            <text x="200" y="118" text-anchor="middle" font-size="9" fill="#94a3b8">increasing disagreement →</text>
          </svg>`,
          tip: rwProTips["Cross-Text Connections"]
            ? rwProTips["Cross-Text Connections"].tip
            : "",
          trap: rwProTips["Cross-Text Connections"]
            ? rwProTips["Cross-Text Connections"].trap
            : "",
          videos: [
            {
              title: "Cross-Text Connections — Khan Academy",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:craft-and-structure/v/sat-cross-text-connections",
            },
            {
              title: "Paired Passages SAT Strategy",
              url: "https://www.youtube.com/results?search_query=SAT+paired+passages+cross+text+strategy",
            },
          ],
        },
      ],
    },
    {
      domain: "Information and Ideas",
      icon: "💡",
      subtopics: [
        {
          name: "Central Ideas and Details",
          keypoints: [
            "Main idea = supported by <b>EVERY paragraph</b>, not just one section.",
            "Details support the main idea — they <b>cannot BE</b> the main idea.",
            "Eliminate answers that are <b>too narrow</b> (single example) OR <b>too broad</b> (introduces info not in text).",
            "Quick test: point to where the passage directly supports this choice in <b>each part</b>.",
            "If the title is given, it often signals the main idea — use it as a <b>cross-check</b>.",
          ],
          tip: rwProTips["Central Ideas and Details"]
            ? rwProTips["Central Ideas and Details"].tip
            : "",
          trap: rwProTips["Central Ideas and Details"]
            ? rwProTips["Central Ideas and Details"].trap
            : "",
          videos: [
            {
              title: "Main Idea Questions — SAT Reading",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:information-and-ideas/v/sat-central-ideas-and-details",
            },
            {
              title: "How to Find the Main Idea",
              url: "https://www.youtube.com/results?search_query=SAT+main+idea+reading+comprehension+strategy",
            },
          ],
        },
        {
          name: "Command of Evidence",
          keypoints: [
            "Underline the <b>goal verb</b> in the prompt (contrast, argue, illustrate, correct, acknowledge).",
            "The answer must accomplish <b>ALL parts</b> of the goal — partial answers are wrong.",
            "For charts/graphs: verify <b>every number, direction, and group label</b> against the actual data.",
            "<b>More data ≠ better answer</b>. The RIGHT data for the goal is what matters.",
            "Factually true but <b>goal-missing</b> answers are always incorrect.",
            "For Rhetorical Synthesis: only use information from the <b>provided bullets</b> — no outside knowledge.",
          ],
          tip: rwProTips["Command of Evidence"]
            ? rwProTips["Command of Evidence"].tip
            : "",
          trap: rwProTips["Command of Evidence"]
            ? rwProTips["Command of Evidence"].trap
            : "",
          videos: [
            {
              title: "Command of Evidence — Khan Academy",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:information-and-ideas/v/sat-command-of-evidence",
            },
            {
              title: "SAT Rhetorical Synthesis Questions",
              url: "https://www.youtube.com/results?search_query=SAT+rhetorical+synthesis+command+evidence+2024",
            },
          ],
        },
        {
          name: "Inferences",
          keypoints: [
            "Correct inference <b>MUST be true</b> — not just likely, possible, or plausible.",
            "Test: 'If the passage is true, <b>can this answer be false?</b>' If yes → eliminate.",
            "Always pick the <b>most conservative</b> (most textually grounded) option.",
            "<b>Scope creep trap</b>: 'found in Group A' ≠ 'true for all groups'. Never overgeneralize.",
            "Predictions about <b>future events</b> are almost never supportable from the passage alone.",
            "Look for the inference supported by the <b>most specific textual evidence</b>.",
          ],
          tip: rwProTips["Inferences"] ? rwProTips["Inferences"].tip : "",
          trap: rwProTips["Inferences"] ? rwProTips["Inferences"].trap : "",
          videos: [
            {
              title: "SAT Inference Questions Strategy",
              url: "https://www.youtube.com/results?search_query=SAT+inference+questions+reading+strategy+2024",
            },
            {
              title: "Inferences — Khan Academy SAT",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:information-and-ideas/v/sat-inferences",
            },
          ],
        },
      ],
    },
    {
      domain: "Standard English Conventions",
      icon: "✍️",
      subtopics: [
        {
          name: "Boundaries",
          keypoints: [
            "Two <b>independent clauses</b> must be joined by: <b>semicolon</b> | <b>comma + FANBOYS</b> | <b>period</b> | em-dash pair.",
            "<b>FANBOYS</b>: For, And, Nor, But, Or, Yet, So — the ONLY coordinating conjunctions.",
            "<b>Conjunctive adverbs</b> (however, therefore, furthermore, moreover) need a <b>semicolon BEFORE</b> them.",
            "A <b>colon</b> introduces a list, explanation, or elaboration — only needs ONE independent clause before it.",
            "<b>Em dashes</b>: one open parenthetical — or two — to enclose one.",
            "A comma alone joining two ICs = <b>comma splice</b> = always wrong.",
          ],
          diagram: `<svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" style="max-width:500px;width:100%">
            <rect x="0" y="0" width="500" height="160" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="250" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">JOINING TWO INDEPENDENT CLAUSES</text>
            <rect x="10" y="25" width="220" height="30" rx="4" fill="#dbeafe" stroke="#3b82f6"/>
            <text x="120" y="45" text-anchor="middle" font-size="11" fill="#1e40af">[Clause 1]  ;  [Clause 2]</text>
            <text x="240" y="42" font-size="9" fill="#64748b">semicolon ✓</text>
            <rect x="10" y="62" width="220" height="30" rx="4" fill="#dcfce7" stroke="#22c55e"/>
            <text x="120" y="82" text-anchor="middle" font-size="11" fill="#14532d">[Clause 1] , FANBOYS [Clause 2]</text>
            <text x="240" y="79" font-size="9" fill="#64748b">comma + conj ✓</text>
            <rect x="10" y="99" width="220" height="30" rx="4" fill="#fee2e2" stroke="#ef4444"/>
            <text x="120" y="119" text-anchor="middle" font-size="11" fill="#991b1b">[Clause 1] , [Clause 2]</text>
            <text x="240" y="116" font-size="9" fill="#ef4444">✗ COMMA SPLICE</text>
            <rect x="10" y="136" width="220" height="18" rx="4" fill="#fee2e2" stroke="#ef4444"/>
            <text x="120" y="148" text-anchor="middle" font-size="10" fill="#991b1b">[C1] , however, [C2]</text>
            <text x="240" y="148" font-size="9" fill="#ef4444">✗ ALWAYS WRONG</text>
            <rect x="270" y="25" width="220" height="30" rx="4" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="380" y="45" text-anchor="middle" font-size="11" fill="#92400e">[Clause 1] ; however, [C2]</text>
            <text x="270" y="62" font-size="9" fill="#64748b">semicolon + conj adv ✓</text>
            <rect x="270" y="72" width="220" height="30" rx="4" fill="#f3e8ff" stroke="#a855f7"/>
            <text x="380" y="92" text-anchor="middle" font-size="11" fill="#6b21a8">[Clause] : [list/explain]</text>
            <text x="270" y="109" font-size="9" fill="#64748b">colon for list/explain ✓</text>
            <rect x="270" y="119" width="220" height="30" rx="4" fill="#f0fdf4" stroke="#86efac"/>
            <text x="380" y="139" text-anchor="middle" font-size="11" fill="#14532d">Clause — parenthetical — clause</text>
            <text x="270" y="156" font-size="9" fill="#64748b">em dashes for aside ✓</text>
          </svg>`,
          tip: rwProTips["Boundaries"] ? rwProTips["Boundaries"].tip : "",
          trap: rwProTips["Boundaries"] ? rwProTips["Boundaries"].trap : "",
          videos: [
            {
              title: "Punctuation Rules — Khan Academy SAT",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:standard-english-conventions/v/sat-boundaries",
            },
            {
              title: "Comma Splices & Semicolons SAT",
              url: "https://www.youtube.com/results?search_query=SAT+comma+splice+semicolon+punctuation+2024",
            },
          ],
        },
        {
          name: "Form, Structure, and Sense",
          keypoints: [
            "<b>Subject-verb agreement</b>: cross out ALL phrases between subject and verb to find the true subject.",
            "<b>Collective nouns</b> (team, committee, jury, group, class) → singular verb.",
            "<b>Indefinite pronouns</b> (everyone, each, neither, anyone, nobody) → singular verb.",
            "'<b>Neither…nor</b>' / '<b>Either…or</b>': verb agrees with the <b>CLOSER</b> noun.",
            "<b>Mandative subjunctive</b> (after require/insist/recommend/suggest that) → always use <b>BASE VERB</b>: 'require that she <u>submit</u>' not 'submits'.",
            "<b>Parallel structure</b>: all items in a list must match grammatically (all gerunds, all infinitives, all nouns).",
          ],
          tip: rwProTips["Form, Structure, and Sense"]
            ? rwProTips["Form, Structure, and Sense"].tip
            : "",
          trap: rwProTips["Form, Structure, and Sense"]
            ? rwProTips["Form, Structure, and Sense"].trap
            : "",
          videos: [
            {
              title: "Subject-Verb Agreement — Khan Academy",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:standard-english-conventions/v/sat-form-structure-and-sense",
            },
            {
              title: "SAT Grammar: Subject-Verb Agreement",
              url: "https://www.youtube.com/results?search_query=SAT+subject+verb+agreement+grammar+2024",
            },
          ],
        },
        {
          name: "Modifier Placement",
          keypoints: [
            "The noun <b>immediately after</b> an introductory participial phrase must be the phrase's logical subject.",
            "Test: '<b>[Phrase], [Subject]</b>' — does the subject logically perform the action of the phrase?",
            "<b>Passive traps</b>: 'Having studied for years, the <u>results</u> were announced' — results can't study.",
            "Common modifiers: <b>Having, Being, After, Before, While</b> + -ing phrase at the start.",
            "Fix: Move the actor to <b>immediately after</b> the comma following the phrase.",
            "Also check: single adjective phrases close to what they describe — not separated by other clauses.",
          ],
          diagram: `<svg viewBox="0 0 480 110" xmlns="http://www.w3.org/2000/svg" style="max-width:480px;width:100%">
            <rect x="0" y="0" width="480" height="110" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="240" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">MODIFIER PLACEMENT RULE</text>
            <rect x="10" y="28" width="460" height="35" rx="5" fill="#fee2e2" stroke="#ef4444"/>
            <text x="240" y="44" text-anchor="middle" font-size="11" fill="#991b1b">❌  Running late, [the decision] was announced.</text>
            <text x="240" y="58" text-anchor="middle" font-size="10" fill="#991b1b">The decision can't run late → dangling modifier</text>
            <rect x="10" y="70" width="460" height="35" rx="5" fill="#dcfce7" stroke="#22c55e"/>
            <text x="240" y="86" text-anchor="middle" font-size="11" fill="#14532d">✅  Running late, [the manager] announced the decision.</text>
            <text x="240" y="100" text-anchor="middle" font-size="10" fill="#14532d">The manager ran late → correct logical subject</text>
          </svg>`,
          tip: rwProTips["Modifier Placement"]
            ? rwProTips["Modifier Placement"].tip
            : "",
          trap: rwProTips["Modifier Placement"]
            ? rwProTips["Modifier Placement"].trap
            : "",
          videos: [
            {
              title: "Modifier Placement — SAT Writing",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:standard-english-conventions/v/sat-modifier-placement",
            },
            {
              title: "Dangling Modifiers SAT Strategy",
              url: "https://www.youtube.com/results?search_query=SAT+dangling+misplaced+modifier+strategy",
            },
          ],
        },
      ],
    },
    {
      domain: "Expression of Ideas",
      icon: "🎯",
      subtopics: [
        {
          name: "Rhetorical Synthesis",
          keypoints: [
            "Underline the <b>goal verb</b> before looking at options: contrast, argue, illustrate, correct, acknowledge.",
            "Answer must use <b>ONLY</b> the provided bullet notes — no outside knowledge.",
            "<b>Multi-part goals</b> = multi-part answers. Check <b>every part</b> is addressed.",
            "Factually accurate ≠ correct. <b>Goal fulfillment</b> is the only criterion.",
            "If goal = 'argue X while acknowledging Y' → answer must contain <b>BOTH X and Y</b>.",
            "The answer with the <b>most statistics</b> isn't necessarily right — relevance to goal matters more.",
          ],
          tip: rwProTips["Rhetorical Synthesis"]
            ? rwProTips["Rhetorical Synthesis"].tip
            : "",
          trap: rwProTips["Rhetorical Synthesis"]
            ? rwProTips["Rhetorical Synthesis"].trap
            : "",
          videos: [
            {
              title: "Rhetorical Synthesis — Khan Academy",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:expression-of-ideas/v/sat-rhetorical-synthesis",
            },
            {
              title: "SAT Rhetorical Synthesis Tips",
              url: "https://www.youtube.com/results?search_query=SAT+rhetorical+synthesis+notes+bullets+2024",
            },
          ],
        },
        {
          name: "Transitions",
          keypoints: [
            "Map logical relationship <b>BEFORE</b> looking at options — never guess.",
            "<b>Same direction</b>: Furthermore, Additionally, Similarly, Moreover, In addition.",
            "<b>Contrast</b>: However, In contrast, Nevertheless, On the other hand, Conversely, Yet.",
            "<b>Cause→Effect</b>: Therefore, Consequently, As a result, Thus, Hence.",
            "<b>Concession</b>: Nevertheless, Despite this, That said, Even so.",
            "<b>Illustration</b>: For example, For instance, Specifically, In particular.",
            "Test the chosen transition: <b>swap sentences mentally</b> — does the logic hold in both directions?",
          ],
          diagram: `<svg viewBox="0 0 480 140" xmlns="http://www.w3.org/2000/svg" style="max-width:480px;width:100%">
            <rect x="0" y="0" width="480" height="140" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="240" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">TRANSITION LOGIC MAP</text>
            <rect x="10" y="25" width="100" height="50" rx="5" fill="#dbeafe" stroke="#3b82f6"/>
            <text x="60" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">SAME DIR</text>
            <text x="60" y="58" text-anchor="middle" font-size="9" fill="#1e40af">Furthermore</text>
            <text x="60" y="70" text-anchor="middle" font-size="9" fill="#1e40af">Additionally</text>
            <rect x="120" y="25" width="100" height="50" rx="5" fill="#fee2e2" stroke="#ef4444"/>
            <text x="170" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#991b1b">CONTRAST</text>
            <text x="170" y="58" text-anchor="middle" font-size="9" fill="#991b1b">However</text>
            <text x="170" y="70" text-anchor="middle" font-size="9" fill="#991b1b">In contrast</text>
            <rect x="230" y="25" width="100" height="50" rx="5" fill="#dcfce7" stroke="#22c55e"/>
            <text x="280" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#14532d">CAUSE→FX</text>
            <text x="280" y="58" text-anchor="middle" font-size="9" fill="#14532d">Therefore</text>
            <text x="280" y="70" text-anchor="middle" font-size="9" fill="#14532d">Consequently</text>
            <rect x="340" y="25" width="130" height="50" rx="5" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="405" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">CONCESSION</text>
            <text x="405" y="58" text-anchor="middle" font-size="9" fill="#92400e">Nevertheless</text>
            <text x="405" y="70" text-anchor="middle" font-size="9" fill="#92400e">Despite this</text>
            <rect x="10" y="85" width="460" height="46" rx="5" fill="#f1f5f9" stroke="#cbd5e1"/>
            <text x="240" y="101" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">STRATEGY: Read S1 → Read S2 → Ask the logical relationship → THEN look at options</text>
            <text x="240" y="116" text-anchor="middle" font-size="9" fill="#64748b">S2 extends S1?  →  Same Dir     S2 contradicts S1?  →  Contrast</text>
            <text x="240" y="128" text-anchor="middle" font-size="9" fill="#64748b">S1 causes S2?  →  Cause-Effect     S2 surprises after S1?  →  Concession</text>
          </svg>`,
          tip: rwProTips["Transitions"] ? rwProTips["Transitions"].tip : "",
          trap: rwProTips["Transitions"] ? rwProTips["Transitions"].trap : "",
          videos: [
            {
              title: "Transitions — Khan Academy SAT",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:reading-and-writing/x0a8c2e5f3af3d50c:expression-of-ideas/v/sat-transitions",
            },
            {
              title: "SAT Transition Words Strategy",
              url: "https://www.youtube.com/results?search_query=SAT+transition+words+strategy+2024",
            },
          ],
        },
      ],
    },
  ],
  math: [
    {
      domain: "Algebra",
      icon: "📐",
      subtopics: [
        {
          name: "Linear Equations",
          keypoints: [
            "SAT often asks for an <b>expression</b> (like 2x+3), not just x — check <b>what is asked</b> before solving.",
            "<b>Shortcut</b>: If equation is 4x+6=18, notice 2x+3 = half of that → answer is 9. No need to find x first.",
            "Isolate variable: <b>same operation on BOTH sides</b> every step.",
            "Distribute <b>negative signs carefully</b>: -(a+b) = -a-b.",
            "For <b>word problems</b>: identify what x represents, write the equation, then solve.",
            "Always <b>verify</b> by substituting your answer back into the original equation.",
          ],
          diagram: `<svg viewBox="0 0 460 120" xmlns="http://www.w3.org/2000/svg" style="max-width:460px;width:100%">
  <rect x="0" y="0" width="460" height="120" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="230" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">LINEAR EQUATION STRATEGY</text>
            <rect x="10" y="25" width="80" height="85" rx="5" fill="#dbeafe" stroke="#3b82f6"/>
            <text x="50" y="48" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">WHAT</text>
            <text x="50" y="62" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">does the</text>
            <text x="50" y="76" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">question</text>
            <text x="50" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">ask for?</text>
            <text x="97" y="70" font-size="16" fill="#94a3b8">→</text>
            <rect x="105" y="25" width="100" height="38" rx="5" fill="#dcfce7" stroke="#22c55e"/>
            <text x="155" y="42" text-anchor="middle" font-size="10" font-weight="bold" fill="#14532d">asks for x</text>
            <text x="155" y="56" text-anchor="middle" font-size="9" fill="#14532d">solve normally</text>
            <rect x="105" y="70" width="100" height="40" rx="5" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="155" y="87" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">asks 2x+3</text>
            <text x="155" y="101" text-anchor="middle" font-size="9" fill="#92400e">find shortcut!</text>
            <text x="212" y="70" font-size="16" fill="#94a3b8">→</text>
            <rect x="220" y="25" width="230" height="85" rx="5" fill="#f8f9fa" stroke="#cbd5e1"/>
            <text x="335" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">SHORTCUT EXAMPLE</text>
            <text x="335" y="60" text-anchor="middle" font-size="11" fill="#1e40af">6x − 4 = 32</text>
            <text x="335" y="76" text-anchor="middle" font-size="10" fill="#475569">Find: 3x − 2</text>
            <text x="335" y="92" text-anchor="middle" font-size="10" fill="#14532d">3x−2 = (6x−4)/2 = 32/2 = <tspan font-weight="bold">16 ✓</tspan></text>
          </svg>`,
          tip: "Always check what the question is ACTUALLY asking for. SAT frequently asks for an expression value rather than the variable itself — recognize this pattern and save time.",
          trap: mathCommonTraps["Linear equations in one variable"] || "",
          videos: [
            {
              title: "Linear Equations — Khan Academy SAT",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:math/x0a8c2e5f3af3d50c:algebra/v/sat-linear-equations",
            },
            {
              title: "SAT Algebra Shortcuts",
              url: "https://www.youtube.com/results?search_query=SAT+algebra+linear+equations+shortcuts+2024",
            },
          ],
        },
        {
          name: "Systems of Equations",
          keypoints: [
            "Always check: can I <b>add or subtract equations directly</b> to get what's asked? Often faster than solving x and y separately.",
            "<b>Elimination</b>: multiply equations to match coefficients, then add/subtract.",
            "<b>Substitution</b>: isolate one variable, substitute into the other equation, distribute carefully.",
            "SAT often asks for <b>x+y</b> or <b>2x−y</b> directly — set up equations to find that combination.",
            "<b>No solution</b>: parallel lines (same slope, different intercepts).",
            "<b>Infinite solutions</b>: identical lines (one is a multiple of the other).",
          ],
          diagram: `<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" style="max-width:460px;width:100%">
            <rect x="0" y="0" width="460" height="130" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="230" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">SYSTEMS OF EQUATIONS — DECISION TREE</text>
            <rect x="160" y="25" width="140" height="28" rx="5" fill="#dbeafe" stroke="#3b82f6"/>
            <text x="230" y="43" text-anchor="middle" font-size="11" fill="#1e40af">2 equations, 2 unknowns</text>
            <line x1="200" y1="53" x2="120" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
            <line x1="260" y1="53" x2="340" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
            <rect x="40" y="70" width="160" height="28" rx="5" fill="#dcfce7" stroke="#22c55e"/>
            <text x="120" y="88" text-anchor="middle" font-size="10" fill="#14532d">Ask for x+y or combo?</text>
            <rect x="260" y="70" width="160" height="28" rx="5" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="340" y="88" text-anchor="middle" font-size="10" fill="#92400e">Ask for x and y separately?</text>
            <line x1="120" y1="98" x2="80" y2="113" stroke="#94a3b8" stroke-width="1.5"/>
            <line x1="120" y1="98" x2="160" y2="113" stroke="#94a3b8" stroke-width="1.5"/>
            <line x1="340" y1="98" x2="300" y2="113" stroke="#94a3b8" stroke-width="1.5"/>
            <line x1="340" y1="98" x2="380" y2="113" stroke="#94a3b8" stroke-width="1.5"/>
            <text x="55" y="125" text-anchor="middle" font-size="9" fill="#14532d">Add/Sub eqs</text>
            <text x="160" y="125" text-anchor="middle" font-size="9" fill="#14532d">Multiply then add</text>
            <text x="300" y="125" text-anchor="middle" font-size="9" fill="#92400e">Elimination</text>
            <text x="390" y="125" text-anchor="middle" font-size="9" fill="#92400e">Substitution</text>
          </svg>`,
          tip: "Before solving, ask: 'Does the question want x+y or 2x−3y?' If so, try adding/subtracting the equations directly — this is usually 5x faster than finding each variable.",
          trap: mathCommonTraps["Systems of Equations"] || "",
          videos: [
            {
              title: "Systems of Equations — Khan Academy",
              url: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:systems-of-equations",
            },
            {
              title: "SAT Systems of Equations Tips",
              url: "https://www.youtube.com/results?search_query=SAT+systems+of+equations+shortcuts+2024",
            },
          ],
        },
        {
          name: "Linear Inequalities",
          keypoints: [
            "<b>Flip the inequality sign</b> when multiplying or dividing by a NEGATIVE number.",
            "'<b>At least</b>' = ≥ · '<b>More than</b>' = > · '<b>No more than</b>' = ≤ · '<b>Less than</b>' = <.",
            "When graphing, <b>test a point</b> (use origin if not on the line) to verify which region is correct.",
            "For <b>compound inequalities</b>: solve both parts, check for AND (intersection) vs OR (union).",
            "Absolute value inequalities: |x| < a → -a < x < a; |x| > a → x < -a or x > a.",
          ],
          tip: "Translate word problems carefully: 'at least' and 'no less than' both mean ≥. 'At most' and 'no more than' both mean ≤. 'Exceeds' means >.",
          trap: mathCommonTraps["Linear inequalities"] || "",
          videos: [
            {
              title: "Linear Inequalities — Khan Academy",
              url: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:inequalities-systems-graphs",
            },
            {
              title: "SAT Inequalities Strategy",
              url: "https://www.youtube.com/results?search_query=SAT+linear+inequalities+strategy+2024",
            },
          ],
        },
      ],
    },
    {
      domain: "Advanced Math",
      icon: "🔢",
      subtopics: [
        {
          name: "Quadratic Functions",
          keypoints: [
            "<b>Standard form</b>: ax²+bx+c → easy to find y-intercept (c) and use quadratic formula.",
            "<b>Vertex form</b>: a(x-h)²+k → vertex is (h, k), min/max value is k.",
            "<b>Factored form</b>: a(x-r)(x-s) → roots/zeros are r and s.",
            "<b>Discriminant</b> Δ=b²-4ac: Δ>0 → 2 solutions; Δ=0 → 1 solution; Δ<0 → no real solutions.",
            "<b>Vieta's formulas</b>: sum of roots = -b/a; product of roots = c/a.",
            "Vertex x-coordinate: <b>x = -b/(2a)</b>. Substitute back to find y.",
          ],
          diagram: `<svg viewBox="0 0 480 150" xmlns="http://www.w3.org/2000/svg" style="max-width:480px;width:100%">
            <rect x="0" y="0" width="480" height="150" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="240" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">THREE FORMS OF A QUADRATIC</text>
            <rect x="10" y="25" width="140" height="115" rx="6" fill="#dbeafe" stroke="#3b82f6"/>
            <text x="80" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">STANDARD FORM</text>
            <text x="80" y="60" text-anchor="middle" font-size="11" fill="#1e40af">ax² + bx + c</text>
            <text x="80" y="78" text-anchor="middle" font-size="9" fill="#1e40af">✓ y-intercept = c</text>
            <text x="80" y="92" text-anchor="middle" font-size="9" fill="#1e40af">✓ Use quad formula</text>
            <text x="80" y="106" text-anchor="middle" font-size="9" fill="#1e40af">✓ Discriminant easy</text>
            <rect x="170" y="25" width="140" height="115" rx="6" fill="#dcfce7" stroke="#22c55e"/>
            <text x="240" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#14532d">VERTEX FORM</text>
            <text x="240" y="60" text-anchor="middle" font-size="11" fill="#14532d">a(x−h)² + k</text>
            <text x="240" y="78" text-anchor="middle" font-size="9" fill="#14532d">✓ Vertex = (h, k)</text>
            <text x="240" y="92" text-anchor="middle" font-size="9" fill="#14532d">✓ Min/max = k</text>
            <text x="240" y="106" text-anchor="middle" font-size="9" fill="#14532d">✓ Axis: x = h</text>
            <rect x="330" y="25" width="140" height="115" rx="6" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="400" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">FACTORED FORM</text>
            <text x="400" y="60" text-anchor="middle" font-size="11" fill="#92400e">a(x−r)(x−s)</text>
            <text x="400" y="78" text-anchor="middle" font-size="9" fill="#92400e">✓ Roots = r, s</text>
            <text x="400" y="92" text-anchor="middle" font-size="9" fill="#92400e">✓ x-intercepts</text>
            <text x="400" y="106" text-anchor="middle" font-size="9" fill="#92400e">✓ Signs of roots</text>
          </svg>`,
          tip: "Identify which form to use BEFORE solving. The question will give you a hint: 'minimum value' → vertex form; 'zeros/roots' → factored form; 'y-intercept' → standard form.",
          trap: mathCommonTraps["Quadratic and exponential functions"] || "",
          videos: [
            {
              title: "Quadratics — Khan Academy",
              url: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratics-multiplying-factoring",
            },
            {
              title: "SAT Quadratic Functions Mastery",
              url: "https://www.youtube.com/results?search_query=SAT+quadratic+functions+vertex+form+2024",
            },
          ],
        },
        {
          name: "Exponential Functions",
          keypoints: [
            "<b>Growth</b>: f(x) = a·(1+r)^t where r is the growth rate (add to 1).",
            "<b>Decay</b>: f(x) = a·(1-r)^t where r is the decay rate (subtract from 1).",
            "The base b: if <b>b > 1</b> → growth; if <b>0 < b < 1</b> → decay.",
            "<b>Doubling time</b>: f(x) = a·2^(t/d) where d is the doubling period.",
            "For compounding: distinguish between the <b>rate r</b> and the <b>base (1+r)</b>.",
            "Exponential functions always <b>eventually dominate</b> any polynomial as x→∞.",
          ],
          tip: "In exponential models, the rate is what you ADD or SUBTRACT from 1. If base = 1.08, the rate is 8% growth. If base = 0.92, the rate is 8% decay.",
          trap: mathCommonTraps["Quadratic and exponential functions"] || "",
          videos: [
            {
              title: "Exponential Functions — Khan Academy",
              url: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:exponential-growth-decay",
            },
            {
              title: "SAT Exponential Models",
              url: "https://www.youtube.com/results?search_query=SAT+exponential+functions+growth+decay+2024",
            },
          ],
        },
        {
          name: "Polynomials and Rational Expressions",
          keypoints: [
            "<b>Remainder Theorem</b>: if f(k)=0, then (x−k) is a factor of f(x).",
            "Factor <b>completely BEFORE canceling</b> — you can only cancel common factors, not terms.",
            "Rational expressions: always note values that make the <b>denominator zero</b> (excluded values).",
            "<b>Adding fractions</b>: find common denominator, then add numerators.",
            "Polynomial long division: dividend = divisor × quotient + remainder.",
            "<b>FOIL / distribution</b>: (a+b)² = a²+2ab+b², NOT a²+b².",
          ],
          tip: "For rational expressions, factor numerator and denominator completely first. Then cancel common factors. Never cancel across addition signs: (x+3)/(x+5) ≠ 3/5.",
          trap: mathCommonTraps["Polynomials and rational expressions"] || "",
          videos: [
            {
              title: "Polynomials — Khan Academy",
              url: "https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:poly-arithmetic",
            },
            {
              title: "SAT Advanced Algebra Tips",
              url: "https://www.youtube.com/results?search_query=SAT+polynomials+rational+expressions+2024",
            },
          ],
        },
        {
          name: "Function Notation",
          keypoints: [
            "<b>f(x+1) ≠ f(x)+1</b> — always substitute the ENTIRE expression into the function.",
            "Composite functions <b>f(g(x))</b>: work inside-out — evaluate g(x) first, then substitute into f.",
            "To find inverse <b>f⁻¹(x)</b>: swap x and y in the equation, then solve for y.",
            "Domain of composite f(g(x)): x must be in domain of g, AND g(x) must be in domain of f.",
            "<b>Even functions</b>: f(-x)=f(x) → symmetric about y-axis.",
            "<b>Odd functions</b>: f(-x)=-f(x) → symmetric about origin (180° rotational symmetry).",
          ],
          tip: "When evaluating f(2a+1), replace EVERY x in the formula with (2a+1) — keeping the parentheses. This prevents order-of-operations errors.",
          trap: "f(x+1) does NOT equal f(x)+1. Always substitute into the function formula first, THEN simplify.",
          videos: [
            {
              title: "Function Notation — Khan Academy",
              url: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:functions",
            },
            {
              title: "SAT Function Questions",
              url: "https://www.youtube.com/results?search_query=SAT+function+notation+composite+2024",
            },
          ],
        },
      ],
    },
    {
      domain: "Geometry",
      icon: "📏",
      subtopics: [
        {
          name: "Triangles and Angles",
          keypoints: [
            "Triangle angles sum to <b>180°</b>. Straight line angles sum to <b>180°</b>. Full rotation = <b>360°</b>.",
            "<b>Exterior angle</b> of a triangle = sum of the two non-adjacent interior angles.",
            "<b>Pythagorean triples</b>: 3-4-5, 5-12-13, 8-15-17, 7-24-25 — memorize these.",
            "<b>Similar triangles</b>: corresponding sides are proportional — write out the proportion explicitly.",
            "<b>30-60-90</b>: sides x, x√3, 2x. <b>45-45-90</b>: sides x, x, x√2.",
            "<b>SOHCAHTOA</b>: sin=opp/hyp, cos=adj/hyp, tan=opp/adj — label relative to the angle.",
          ],
          diagram: `<svg viewBox="0 0 480 140" xmlns="http://www.w3.org/2000/svg" style="max-width:480px;width:100%">
            <rect x="0" y="0" width="480" height="140" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="240" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">SPECIAL RIGHT TRIANGLES</text>
            <polygon points="30,110 130,110 30,30" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="30" y="125" font-size="9" fill="#1e40af">30°</text>
            <text x="110" y="125" font-size="9" fill="#1e40af">60°</text>
            <text x="14" y="75" font-size="9" fill="#1e40af">x</text>
            <text x="75" y="125" font-size="9" fill="#1e40af">x√3</text>
            <text x="72" y="65" font-size="9" fill="#1e40af">2x</text>
            <text x="80" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">30-60-90</text>
            <polygon points="210,110 330,110 270,30" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5"/>
            <text x="210" y="125" font-size="9" fill="#14532d">45°</text>
            <text x="315" y="125" font-size="9" fill="#14532d">45°</text>
            <text x="265" y="125" font-size="9" fill="#14532d">x</text>
            <text x="195" y="75" font-size="9" fill="#14532d">x</text>
            <text x="300" y="65" font-size="9" fill="#14532d">x√2</text>
            <text x="270" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#14532d">45-45-90</text>
            <rect x="370" y="25" width="100" height="110" rx="5" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="420" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">SOHCAHTOA</text>
            <text x="420" y="62" text-anchor="middle" font-size="10" fill="#92400e">sin = opp/hyp</text>
            <text x="420" y="78" text-anchor="middle" font-size="10" fill="#92400e">cos = adj/hyp</text>
            <text x="420" y="94" text-anchor="middle" font-size="10" fill="#92400e">tan = opp/adj</text>
            <text x="420" y="110" text-anchor="middle" font-size="9" fill="#92400e">(relative to θ)</text>
            <text x="420" y="126" text-anchor="middle" font-size="9" fill="#92400e">sin(θ)=cos(90°-θ)</text>
          </svg>`,
          tip: "Always label every angle you discover as you work through a multi-step angle problem. Skipping intermediate labels is the #1 cause of errors.",
          trap: mathCommonTraps["Lines, angles, and triangles"] || "",
          videos: [
            {
              title: "Triangle Geometry — Khan Academy SAT",
              url: "https://www.khanacademy.org/math/geometry/hs-geo-trig",
            },
            {
              title: "SAT Geometry: Triangles & Angles",
              url: "https://www.youtube.com/results?search_query=SAT+geometry+triangles+angles+strategy+2024",
            },
          ],
        },
        {
          name: "Circles",
          keypoints: [
            "<b>Arc length</b> = (θ/360°) × 2πr &nbsp;·&nbsp; <b>Sector area</b> = (θ/360°) × πr².",
            "<b>Central angle</b> = arc measure · <b>Inscribed angle</b> = HALF the arc measure.",
            "<b>Circle equation</b>: (x−h)²+(y−k)²=r² with center (h,k) and radius r.",
            "To find center/radius from general form: <b>complete the square</b> for both x and y terms.",
            "<b>Tangent line</b> to a circle is perpendicular to the radius at the point of tangency.",
            "Diameter = longest chord. Diameter ⊥ to a chord bisects that chord.",
          ],
          diagram: `<svg viewBox="0 0 460 140" xmlns="http://www.w3.org/2000/svg" style="max-width:460px;width:100%">
            <rect x="0" y="0" width="460" height="140" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="230" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">CIRCLE ANGLE RELATIONSHIPS</text>
            <circle cx="90" cy="80" r="55" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
            <line x1="90" y1="80" x2="55" y2="32" stroke="#1e40af" stroke-width="1.5"/>
            <line x1="90" y1="80" x2="140" y2="28" stroke="#1e40af" stroke-width="1.5"/>
            <text x="90" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Central</text>
            <text x="90" y="82" text-anchor="middle" font-size="9" fill="#1e40af">angle θ</text>
            <text x="90" y="122" text-anchor="middle" font-size="9" fill="#1e40af">Arc = θ</text>
            <circle cx="260" cy="80" r="55" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5"/>
            <line x1="225" y1="32" x2="310" y2="80" stroke="#14532d" stroke-width="1.5"/>
            <line x1="225" y1="32" x2="225" y2="128" stroke="#14532d" stroke-width="1.5"/>
            <circle cx="225" cy="32" r="3" fill="#14532d"/>
            <text x="260" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="#14532d">Inscribed</text>
            <text x="260" y="82" text-anchor="middle" font-size="9" fill="#14532d">angle θ/2</text>
            <text x="260" y="122" text-anchor="middle" font-size="9" fill="#14532d">Arc = θ (not θ/2)</text>
            <rect x="330" y="25" width="120" height="90" rx="5" fill="#fef3c7" stroke="#f59e0b"/>
            <text x="390" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">Circle Equation</text>
            <text x="390" y="62" text-anchor="middle" font-size="10" fill="#92400e">(x−h)²+(y−k)²=r²</text>
            <text x="390" y="80" text-anchor="middle" font-size="9" fill="#92400e">center (h, k)</text>
            <text x="390" y="94" text-anchor="middle" font-size="9" fill="#92400e">radius = r</text>
            <text x="390" y="108" text-anchor="middle" font-size="9" fill="#92400e">Complete sq to find</text>
          </svg>`,
          tip: "Inscribed angle = HALF the central angle. This is the most frequently tested circle relationship on the SAT. Memorize it.",
          trap: mathCommonTraps["Circles"] || "",
          videos: [
            {
              title: "Circles — Khan Academy SAT",
              url: "https://www.khanacademy.org/math/geometry/hs-geo-circles",
            },
            {
              title: "SAT Circle Problems Strategy",
              url: "https://www.youtube.com/results?search_query=SAT+circle+geometry+inscribed+angle+2024",
            },
          ],
        },
        {
          name: "Area and Volume",
          keypoints: [
            "Always check <b>units first</b> — mixing feet and inches will give wrong answers.",
            "<b>Composite figures</b>: break into basic shapes, calculate each, then add/subtract.",
            "<b>Radius vs diameter</b>: always verify which is given. r = d/2. Use radius in ALL circle formulas.",
            "<b>Surface area</b> = sum of ALL faces. <b>Volume</b> = space inside — completely different.",
            "<b>Cone = ⅓ cylinder</b>. <b>Pyramid = ⅓ prism</b>. The ⅓ is the only difference.",
            "Arc length = (θ/360) × 2πr · Sector area = (θ/360) × πr² — <b>same θ/360 ratio</b>.",
          ],
          tip: "Cone = ⅓ Cylinder. Pyramid = ⅓ Prism. Memorize these two relationships — they eliminate half the 3D volume questions instantly.",
          trap: "Using diameter instead of radius in circle formulas is the single most common geometry error on the SAT. Always write r = d/2 first.",
          videos: [
            {
              title: "Area and Volume — Khan Academy",
              url: "https://www.khanacademy.org/math/geometry/hs-geo-solids",
            },
            {
              title: "SAT Geometry: Area & Volume",
              url: "https://www.youtube.com/results?search_query=SAT+area+volume+geometry+strategy+2024",
            },
          ],
        },
      ],
    },
    {
      domain: "Problem Solving and Data Analysis",
      icon: "📊",
      subtopics: [
        {
          name: "Ratios, Rates, and Percentages",
          keypoints: [
            "When setting up a proportion, keep <b>corresponding units on the same side</b> of each ratio.",
            "Track units explicitly: <b>miles/hour × hours = miles</b> — cancel units.",
            "<b>Percentage change</b> = (new − old) / old × 100%. Always divide by the <b>ORIGINAL</b>.",
            "A 20% increase then 20% decrease does <b>NOT</b> return to the original (= 96% of original).",
            "<b>Percent of a percent</b>: 30% of 40% = 0.3 × 0.4 = 0.12 = 12%.",
            "Ratio a:b means a/(a+b) and b/(a+b) of the total.",
          ],
          tip: "For percentage change problems, always identify the BASE (original value). Many students accidentally divide by the new value instead of the original.",
          trap: mathCommonTraps["Ratios, rates, proportions"] || "",
          videos: [
            {
              title: "Ratios & Rates — Khan Academy",
              url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-ratios-prop-topic",
            },
            {
              title: "SAT Percentage Problems",
              url: "https://www.youtube.com/results?search_query=SAT+percentage+ratio+rate+strategy+2024",
            },
          ],
        },
        {
          name: "Statistics and Probability",
          keypoints: [
            "<b>Mean</b> is affected by outliers; <b>median</b> is resistant to outliers.",
            "<b>Standard deviation</b> measures spread — larger SD = more spread out data.",
            "<b>Probability</b> = favorable outcomes / total possible outcomes (must be counted consistently).",
            "<b>Margin of error</b> ∝ 1/√n — doubling sample size reduces margin by factor of √2.",
            "<b>Correlation</b> ≠ causation — association does not imply one causes the other.",
            "For <b>normal distributions</b>: ~68% within 1 SD, ~95% within 2 SD, ~99.7% within 3 SD.",
          ],
          diagram: `<svg viewBox="0 0 460 120" xmlns="http://www.w3.org/2000/svg" style="max-width:460px;width:100%">
            <rect x="0" y="0" width="460" height="120" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="230" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b">MEAN vs MEDIAN — EFFECT OF OUTLIERS</text>
            <rect x="10" y="25" width="210" height="85" rx="5" fill="#dbeafe" stroke="#3b82f6"/>
            <text x="115" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Dataset: {2, 3, 4, 5, 96}</text>
            <text x="115" y="62" text-anchor="middle" font-size="10" fill="#1e40af">Mean = (2+3+4+5+96)/5 = <tspan font-weight="bold">22</tspan></text>
            <text x="115" y="78" text-anchor="middle" font-size="10" fill="#1e40af">Median = <tspan font-weight="bold">4</tspan> (middle value)</text>
            <text x="115" y="100" text-anchor="middle" font-size="9" fill="#1e40af">96 is an outlier → pulls mean up hugely</text>
            <rect x="235" y="25" width="215" height="85" rx="5" fill="#dcfce7" stroke="#22c55e"/>
            <text x="342" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="#14532d">When to use which:</text>
            <text x="342" y="62" text-anchor="middle" font-size="10" fill="#14532d">Mean → typical value (no outliers)</text>
            <text x="342" y="78" text-anchor="middle" font-size="10" fill="#14532d">Median → resistant to outliers</text>
            <text x="342" y="96" text-anchor="middle" font-size="9" fill="#14532d">SAT often tests: which is higher/lower?</text>
          </svg>`,
          tip: "When a dataset has outliers, median is more representative than mean. When asked 'which measure changes if X is added?' — test both mean and median quickly.",
          trap: mathCommonTraps["Probability and statistics"] || "",
          videos: [
            {
              title: "Statistics — Khan Academy SAT",
              url: "https://www.khanacademy.org/math/statistics-probability",
            },
            {
              title: "SAT Data Analysis & Statistics",
              url: "https://www.youtube.com/results?search_query=SAT+statistics+probability+mean+median+2024",
            },
          ],
        },
        {
          name: "Data Interpretation",
          keypoints: [
            "Read <b>axis labels and units</b> before doing any calculation — misreading axes is the #1 error.",
            "Check: does the graph show <b>absolute values</b> or <b>percentages</b>? They require different calculations.",
            "To calculate actual counts from a percentage chart, you <b>need the total given</b> — if not provided, you can't calculate counts.",
            "<b>Residual</b> = actual − predicted. Positive residual = above line; negative = below line.",
            "<b>Correlation r</b>: close to ±1 = strong association; close to 0 = weak. Negative r = downward trend.",
            "<b>Larger sample</b> = lower margin of error. Margin of error ∝ 1/√n.",
          ],
          tip: "For chart questions, verify EVERY specific claim in each answer against the actual data. Wrong direction (increase vs decrease) is a very common trap.",
          trap: "When a chart shows percentages, you cannot find actual counts without the total. If total is not given, you can only compare percentages.",
          videos: [
            {
              title: "Data Analysis — Khan Academy SAT",
              url: "https://www.khanacademy.org/test-prep/sat/x0a8c2e5f3af3d50c:math/x0a8c2e5f3af3d50c:problem-solving-and-data-analysis",
            },
            {
              title: "SAT Data Interpretation Strategy",
              url: "https://www.youtube.com/results?search_query=SAT+data+interpretation+charts+graphs+2024",
            },
          ],
        },
      ],
    },
  ],
};
