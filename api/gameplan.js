export const config = {
  maxDuration: 30,
}

// Corbelle's 6-stage AI Product Suite. Used so the model can name a real
// next step instead of inventing a product. Keep this in sync with
// "AI-Product-Suite-User-Guide-DRAFT.md" if the stage lineup ever changes.
const STAGE_TOOLS = [
  { name: "Readiness Diagnostic", answers: "Where are we exposed, and what don't we agree on yet?" },
  { name: "Use Case ID & Prioritisation", answers: "Of everything we could do, what do we do first?" },
  { name: "AI Audit", answers: "Does this specific use case actually pay off?" },
  { name: "Tool & Solution Match", answers: "What do we actually build or buy for it?" },
  { name: "Governance & Policy", answers: "Are we allowed to do this safely?" },
  { name: "Rollout & Adoption", answers: "How do we make sure it actually gets used?" },
]

// Real patterns pulled from a first-hand AI rollout at a PE-backed firm.
// Not a script to follow — texture to draw on so the model reaches for a
// specific, lived detail instead of a generic one when one genuinely fits.
const REAL_PATTERNS = [
  "A firm rolled CoPilot out to 500+ users at $9/user/month with zero training — users were excited for a week, then drifted back to old habits within the month. It was, in their own words, 'an updated Clippy.'",
  "The same firm's second attempt succeeded because they separated adoption from engagement as different numbers: an 85% active seat rate (are people logged in and using the approved tool) versus a 60% stickiness rate (are they still using it daily a month later, versus reverting to the old way).",
  "ChatGPT's original 8,000-character prompt limit forced one team into building 30-page mega-prompts just to process a single investment memo — a scaling problem nobody planned for until it hit them mid-project.",
  "Investment memo extraction across 100+ page documents cut review effort by 72% and saved roughly 6 hours per document per person once the process (not just the tool) was redesigned around it.",
  "A trial group of under 50 users, selected for role and influence rather than opened firm-wide, is how one firm avoided burning the $9/user/month budget on 500+ people who hadn't asked for the tool.",
  "Senior staff uploading confidential investment committee documents to public LLMs to translate them happened on day one, before any policy existed to stop it — a textbook case of Shadow AI.",
  "A Champions Network (peer-to-peer support) plus informal 'Genius Bar' drop-in sessions did more for adoption than any top-down mandate — people ask a peer before they ask IT.",
  "When OpenAI had an outage, firms that had embedded ChatGPT directly into a core process with no fallback felt the gap immediately — the process simply stopped.",
]

// Named frameworks from Brendan's own SME Strategy Architect persona.
// Use where a step genuinely fits — don't force one into every step.
const FRAMEWORKS = [
  { term: "The Bridge Approach", meaning: "Never recommend a technology in the abstract. Connect it to the specific pain point it removes — not \"use LLMs,\" but \"automate the 3 hours your team spends on customer email replies.\"" },
  { term: "Shadow AI", meaning: "Staff already using personal ChatGPT/Claude accounts for work, ungoverned. A red flag wherever governance or data risk is the weak dimension." },
  { term: "Walled Garden", meaning: "A centralised, enterprise-grade AI environment where data doesn't leak out and doesn't train external models — the fix for Shadow AI." },
  { term: "Tool Sprawl", meaning: "Too many disconnected apps doing overlapping jobs. Relevant when a step is about consolidating rather than adding another tool." },
  { term: "The 'So What?' Test", meaning: "Every single recommendation must tie back to a named business pain point. If a step can't pass this test, cut it." },
  { term: "Buy, Don't Build", meaning: "Default advice for SMEs is off-the-shelf plus retrieval, not custom model-building — invoke only if a step is about tooling choice." },
  { term: "Human-in-the-Loop", meaning: "Any step that automates something must still include a human review checkpoint — AI output is not sign-off." },
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { useCase, foundationScore, verdictLabel, weakestDimensions } = req.body

    if (!useCase || !Array.isArray(weakestDimensions)) {
      return res.status(400).json({ error: 'Missing useCase or weakestDimensions' })
    }

    const weakSummary = weakestDimensions
      .map(d => `- ${d.label}: ${d.score}/5 (${d.scaleLabel})`)
      .join('\n')

    const stageSummary = STAGE_TOOLS
      .map(s => `- ${s.name}: ${s.answers}`)
      .join('\n')

    const patternSummary = REAL_PATTERNS
      .map(p => `- ${p}`)
      .join('\n')

    const frameworkSummary = FRAMEWORKS
      .map(f => `- ${f.term}: ${f.meaning}`)
      .join('\n')

    const prompt = `ROLE & PERSONA

You are the Lead AI Strategy Architect for SMEs (25-250 employees). You operate with the sophistication of a McKinsey Partner and the agility of a startup founder. Your tone is professional, insightful, and ROI-focused. You despise "AI Hype" and prioritise IP safety, operational efficiency, and value-driven engagement over anything that sounds impressive but doesn't ship.

Practicality first: no "blue sky" thinking, no consultancy-deck abstractions. Every recommendation is a "Monday morning" action — something a person could actually go and do this week. Never use words like "leverage," "seamless," "unlock," "robust," "streamline," "synergy," "holistic," "utilize," "cutting-edge," or "game-changing" — if you catch yourself writing one of those, rewrite the sentence.

YOUR NAMED FRAMEWORKS

You have a proprietary vocabulary. Reach for a term only where it genuinely fits the step you're writing — never force one in:
${frameworkSummary}

Also apply, without naming it explicitly: every recommendation must include a human-review checkpoint if it automates something (Human-in-the-Loop), and default to off-the-shelf tools plus retrieval rather than custom-built models unless the use case clearly demands otherwise (Buy, Don't Build).

REAL PATTERNS FOR TEXTURE

Reach for one only where it genuinely fits their weakest dimension — paraphrase it, don't quote it verbatim, and never claim it happened to them specifically (it didn't; it's "we've seen this" material, not their story):
${patternSummary}

THE CLIENT

A business executive just ran their use case through this assessment:

Use case (their own words): "${useCase}"
Foundation Score: ${foundationScore}/100
Verdict: ${verdictLabel}

Their three weakest areas:
${weakSummary}

Corbelle also sells a 6-stage AI product suite. Point to a real next step where one genuinely applies — do not force a mapping if none fits:
${stageSummary}

YOUR TASK

Write their gameplan as 2-3 phases, sequenced so each phase unblocks the next. Every single step must pass the "So What?" Test and reference something specific from their use case description above — not "the process," but what their process actually is; not "the data," but what kind of data this use case would touch. If you can't tie a step back to a specific word or detail they wrote, cut it and write one you can.

For each phase, write a one-line "goal" the way a sharp operator would say it out loud — not "improve process quality," but something like "prove this isn't guesswork before you spend a penny on it." For each step's "why," name the actual cost of skipping it — what breaks, what it costs, or what it looks like in six months if they ignore this. Where a step is genuinely about applying a technology, use the Bridge Approach: name the specific task being automated or accelerated, not the technology category.

Respond ONLY with a JSON object, no markdown, no preamble:
{
  "headline": "One sharp sentence, second person, naming their single biggest exposure given their specific weakest dimension and use case. This is the first thing they read — it should land like a diagnosis, not a summary.",
  "phases": [
    {
      "title": "Phase 1 — [short, specific name, not \\"Month 1\\"]",
      "goal": "One sentence. What this phase proves, in plain talk.",
      "steps": [
        { "action": "Imperative, under 10 words", "why": "2-3 sentences. Must reference a specific detail from their use case. Must name the concrete cost of skipping this step.", "mapsTo": "exact stage name from the list above, or null" }
      ]
    }
  ],
  "closingLine": "One sentence bridging to a next conversation. Should feel like 'this roadmap gives you the What — the How is a different conversation,' in your own words, not salesy, not generic."
}
4-5 steps total across the phases.`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text()
      console.error('Anthropic error:', err)
      return res.status(500).json({ error: 'Anthropic error', detail: err })
    }

    const data = await anthropicResponse.json()
    const text = data.content?.find((block) => block.type === 'text')?.text || '{}'
    const clean = text.replace(/```json[\s\S]*?```|```/g, '').trim()

    let gameplan = {}
    try {
      gameplan = JSON.parse(clean)
    } catch (e) {
      console.error('Parse error:', e, text)
      return res.status(500).json({ error: 'Could not parse model output' })
    }

    return res.status(200).json(gameplan)

  } catch (err) {
    console.error('Handler error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
