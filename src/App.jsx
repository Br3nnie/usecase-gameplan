import { useEffect, useState } from "react";

// ─── COLOUR TOKENS ───────────────────────────────────────────────
const C = {
  accent:      "#1a56db",
  accentLight: "#eff6ff",
  accentText:  "#1e40af",
  accentDim:   "#93c5fd",
  bg:          "#f0f4f8",
  card:        "#ffffff",
  border:      "#e2e8f0",
  inputBg:     "#f8fafc",
  textPrimary: "#1a1a2e",
  textSecond:  "#4a5568",
  textMuted:   "#6b7280",
  red:         "#ef4444",
  redBg:       "#fef2f2",
  redBorder:   "#fecaca",
  redText:     "#b91c1c",
  redLight:    "#7f1d1d",
  green:       "#16a34a",
  greenBg:     "#f0fdf4",
  amber:       "#d97706",
  orange:      "#ea580c",
};

const GATES = [
  {
    key: "problemClarity",
    label: "Problem Clarity",
    question: "Can you describe the problem you're solving without mentioning any technology?",
    tip: "If you can't separate the problem from the solution, you're not solving a problem — you're justifying a purchase.",
    scale: ["No", "Not really", "Getting there", "Mostly", "Clearly yes"],
    failMessage: "The problem is still tied too closely to the technology. That makes it difficult to tell whether this use case solves something important or retrofits a justification for an AI idea. Your Gameplan will make defining the underlying problem an early action.",
  },
  {
    key: "stakeholderValidation",
    label: "Stakeholder Validation",
    question: "Have the people who actually experience this problem confirmed it's a real, recurring issue?",
    tip: "Don't assume — have you actually asked them? Exec assumptions are how shelfware gets bought.",
    scale: ["Never asked", "Informally", "Some have", "Most have", "Formally confirmed"],
    failMessage: "The people who experience this day to day have not yet confirmed it is a real, recurring priority. That means the use case is currently built on a hypothesis. Your Gameplan will include a practical way to validate the problem before you invest further.",
  },
  {
    key: "changeReadiness",
    label: "Change Readiness",
    question: "Have the people affected been told this is coming, and is there a plan for managing the transition?",
    tip: "The biggest mistake: no training investment = users excited for a week, then back to old habits.",
    scale: ["No plan", "Vague intent", "In discussion", "Plan drafted", "Plan confirmed"],
    failMessage: "The people affected have not yet been brought into the plan, and ownership of the transition is unclear. Even a useful tool can fail when nobody owns adoption, training or the day-30 outcome. Your Gameplan will treat that transition work as part of the use case, not an afterthought.",
  },
];

const SCORING_DIMS = [
  {
    key: "processQuality",
    label: "Process Quality",
    weight: 0.25,
    question: "Is the process you're applying AI to already lean and documented, or are you hoping AI will fix underlying problems?",
    tip: "AI accelerates what's already there — good or bad. Fix the process before you automate it.",
    scale: ["Broken", "Inconsistent", "Functional", "Documented", "Lean & proven"],
    blocker: [
      "The process is broken. AI won't fix this — it will make the mess move faster.",
      "Too inconsistent to automate reliably. Standardise first.",
      "Functional but not optimised. Worth mapping before adding AI.",
      "Well documented. Minor inefficiencies worth resolving before deploying.",
      "Strong process foundation. Ready for AI overlay.",
    ],
  },
  {
    key: "dataReadiness",
    label: "Data Readiness",
    weight: 0.20,
    question: "Does the right data exist, is it accessible, and clean enough to act on?",
    tip: "Garbage in, garbage out. AI is only as good as the data feeding it.",
    scale: ["Doesn't exist", "Exists but messy", "Accessible but unclean", "Mostly clean", "Clean & accessible"],
    blocker: [
      "Critical data gaps — AI cannot function reliably without addressing these first.",
      "Data exists but quality issues will undermine every output.",
      "Data is usable but needs cleansing or governance work before scaling.",
      "Data is largely ready. Spot-check quality before deployment.",
      "Strong data readiness. Proceed with confidence.",
    ],
  },
  {
    key: "successDefinition",
    label: "Success Definition",
    weight: 0.20,
    question: "Have you defined specific metrics for both adoption and engagement before you start?",
    tip: "Adoption and engagement are two different things. 'People are using it' is not a success metric.",
    scale: ["Not defined", "Vague goals", "One metric", "Adoption only", "Both defined"],
    blocker: [
      "No definition of success. You won't know if it's working or failing.",
      "Vague goals won't survive first contact with reality. Get specific.",
      "One metric isn't enough. Define both adoption and engagement.",
      "Adoption metrics exist but engagement is undefined. Add stickiness measures.",
      "Clear success definition. You'll know exactly what good looks like.",
    ],
  },
  {
    key: "executiveSponsorship",
    label: "Executive Sponsorship",
    weight: 0.15,
    question: "Is there a named executive who owns this initiative and can unblock decisions when needed?",
    tip: "Without a named sponsor, AI initiatives die in committee. The CEO asking 'are we doing AI yet?' is not sponsorship.",
    scale: ["No sponsor", "Interest only", "Informally agreed", "Named but passive", "Named & active"],
    blocker: [
      "No sponsor means no decisions get made when it gets hard. It will get hard.",
      "Interest isn't ownership. Someone needs to be accountable.",
      "Informal agreement isn't enough when budget or headcount is on the line.",
      "Named but passive won't cut it. They need to actively unblock.",
      "Strong executive sponsorship. This initiative has the backing it needs.",
    ],
  },
  {
    key: "governanceReadiness",
    label: "Governance Readiness",
    weight: 0.10,
    question: "Do you have a policy covering data upload, IP protection, and acceptable use before this goes live?",
    tip: "Senior staff uploading confidential documents to public LLMs is not hypothetical — it happens on day one without clear guardrails.",
    scale: ["No policy", "Being drafted", "Partial policy", "Policy exists", "Policy + attestation"],
    blocker: [
      "No guardrails means day one is a data risk. Sort this before launch.",
      "A draft policy is better than nothing but won't protect you if something goes wrong.",
      "Partial policy leaves gaps. Close them before going live.",
      "Policy exists. Make sure staff have read and understood it.",
      "Strong governance foundation. Policy and accountability in place.",
    ],
  },
  {
    key: "roiRealism",
    label: "ROI Realism",
    weight: 0.05,
    question: "Can you articulate what success looks like in measurable terms with a timeframe and an owner?",
    tip: "'Efficiency gains' is not a metric. Name the number, the date, and the person accountable.",
    scale: ["No idea", "Rough guess", "Defined metric(s)", "Metric(s) + owner", "Metric(s) + owner + deadline"],
    blocker: [
      "No ROI definition. You're flying blind on value.",
      "A rough guess won't survive a board question. Get specific.",
      "Metric(s) without an owner is just a wish.",
      "Metric(s) and owner are good. Add a deadline to create accountability.",
      "Clear, measurable ROI definition with full accountability.",
    ],
  },
  {
    key: "operationalResilience",
    label: "Operational Resilience",
    weight: 0.03,
    question: "If this AI tool became unavailable tomorrow, would this process still function?",
    tip: "OpenAI went down and gaps appeared immediately in firms that had embedded it without a fallback plan.",
    scale: ["Total dependency", "No plan", "Partial fallback", "Fallback exists", "Fully resilient"],
    blocker: [
      "Complete single point of failure. A contingency plan is non-negotiable before going live.",
      "No plan means a vendor outage becomes your operational crisis.",
      "Partial fallback is better than nothing — document it and test it.",
      "Fallback exists. Make sure it's been tested before you actually need it.",
      "Fully resilient. No single point of failure.",
    ],
  },
  {
    key: "costResilience",
    label: "Cost Resilience",
    weight: 0.02,
    question: "If the cost of this AI tool increased 5× tomorrow, could your business absorb it?",
    tip: "Token costs are not fixed. Firms that embedded AI at today's prices with no cost ceiling are exposed.",
    scale: ["Would kill it", "Serious problem", "Painful but manageable", "Easily absorbed", "Cost is negligible"],
    blocker: [
      "A 5× cost increase would end this initiative. That's a critical dependency to resolve.",
      "A serious cost problem would force hard decisions. Model the scenarios now, not later.",
      "Painful but survivable — but have the conversation with finance before you're committed.",
      "Good cost resilience. Keep monitoring vendor pricing as the market matures.",
      "Cost is not a constraint. Strong position.",
    ],
  },
];

const RADAR_DIMS   = ["processQuality","dataReadiness","successDefinition","executiveSponsorship","governanceReadiness"];
const RADAR_LABELS = ["Process\nQuality","Data\nReadiness","Success\nDefinition","Exec\nSponsorship","Governance"];
const MIN_USE_CASE_LENGTH = 50;
const DRAFT_STORAGE_KEY = "corbelle.gameplan.draft.v1";
const HISTORY_STORAGE_KEY = "corbelle.gameplan.history.v1";
const HISTORY_LIMIT = 10;

function readLocalJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}

function newAssessmentId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const VERDICT_BANDS = [
  { min: 80, label: "Strong Foundation",            color: "#16a34a", icon: "✅", message: "Your use case has solid foundations. The logical next step is a process blueprint before selecting any technology." },
  { min: 60, label: "Proceed with Conditions",      color: "#d97706", icon: "⚠️", message: "There's a viable use case here, but specific gaps need groundwork before committing to a technology decision." },
  { min: 40, label: "Significant Groundwork Needed",color: "#ea580c", icon: "🔶", message: "This isn't a no — but it isn't ready. Acting now risks investing in the wrong solution to a poorly defined problem." },
  { min: 0,  label: "Not Ready",                    color: "#ef4444", icon: "🛑", message: "The foundations aren't in place yet. Proceeding without addressing these gaps typically leads to expensive reversals." },
];

// ─── COMPONENTS ──────────────────────────────────────────────────

function RadarChart({ scores }) {
  const cx = 160, cy = 160, r = 110;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  function polar(angle, radius) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }
  const angles = RADAR_DIMS.map((_, i) => (i / RADAR_DIMS.length) * 360);
  const gridPts = levels.map(l => angles.map(a => polar(a, r * l)).map(p => `${p.x},${p.y}`).join(" "));
  const scorePts = RADAR_DIMS.map((d, i) => polar(angles[i], r * ((scores[d] || 1) / 5)));
  const scorePolygon = scorePts.map(p => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox="0 0 320 320" style={{ width: "100%", maxWidth: 300 }}>
      {gridPts.map((pts, i) => <polygon key={i} points={pts} fill="none" stroke={C.border} strokeWidth="1" />)}
      {angles.map((angle, i) => { const pt = polar(angle, r); return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke={C.border} strokeWidth="1" />; })}
      <polygon points={scorePolygon} fill="rgba(26,86,219,0.12)" stroke={C.accent} strokeWidth="2" />
      {scorePts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill={C.accent} />)}
      {angles.map((angle, i) => {
        const pt = polar(angle, r + 28);
        const lines = RADAR_LABELS[i].split("\n");
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" fill={C.textMuted} fontSize="10.5" fontFamily="'DM Sans', sans-serif">
            {lines.map((line, j) => <tspan key={j} x={pt.x} dy={j === 0 ? (lines.length > 1 ? "-0.5em" : "0") : "1.2em"}>{line}</tspan>)}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreBar({ value }) {
  return (
    <div style={{ background: C.border, borderRadius: 4, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${(value / 5) * 100}%`, height: "100%", background: C.accent, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

function ProgressBar({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: i < current ? C.accent : i === current ? C.accentDim : C.border }} />
      ))}
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", marginTop: 14, display: "block", width: "100%", textAlign: "center", fontFamily: "'DM Sans', sans-serif", padding: "8px 0" }}>
      ← Back
    </button>
  );
}

function BrandHeader({ subtitle, className }) {
  return (
    <div className={className} style={{ marginBottom: 12 }}>
      <img
        src="/corbelle-logo.png"
        alt="Corbelle"
        style={{ display: "block", width: 104, height: 31, objectFit: "cover", objectPosition: "center 50%" }}
      />
      {subtitle && <div style={{ ...labelStyle, marginTop: 2, marginBottom: 0 }}>{subtitle}</div>}
    </div>
  );
}

function PurchaseSuccess({ onStart }) {
  return (
    <div style={wrapStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <main style={{ ...cardStyle, maxWidth: 560, textAlign: "center" }}>
        <BrandHeader className="success-brand" />
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            margin: "8px auto 22px",
            background: "#dcfce7",
            color: C.green,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          ✓
        </div>
        <div style={{ ...labelStyle, marginBottom: 8 }}>Payment confirmed</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: C.textPrimary, lineHeight: 1.2, marginBottom: 14 }}>
          Your AI Use Case Gameplan is ready
        </h1>
        <p style={{ fontSize: 15, color: C.textSecond, lineHeight: 1.7, margin: "0 auto 8px", maxWidth: 440 }}>
          Thank you for your purchase. Your access is active on this device, so you can start building your Gameplan now.
        </p>
        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, margin: "0 auto 4px", maxWidth: 440 }}>
          We’ve also emailed you a secure access link so you can return later or continue on another device.
        </p>
        <button style={btnStyle} onClick={onStart}>
          Start Your Gameplan →
        </button>
      </main>
    </div>
  );
}

// ─── SHARED STYLES ───────────────────────────────────────────────
const wrapStyle     = { minHeight: "100vh", background: C.bg, color: C.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" };
const cardStyle     = { background: C.card, borderRadius: 16, padding: "36px 32px", maxWidth: 600, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: `1px solid ${C.border}` };
const labelStyle    = { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, fontWeight: 700, marginBottom: 10 };
const questionStyle = { fontSize: 20, fontWeight: 700, color: C.textPrimary, lineHeight: 1.35, marginBottom: 0 };
const tipStyle      = { fontSize: 13, color: C.accentText, lineHeight: 1.6, marginTop: 14, padding: "10px 14px", background: C.accentLight, borderRadius: 8, borderLeft: `3px solid ${C.accent}` };
const btnStyle      = { background: C.accent, color: "#fff", border: "none", borderRadius: 50, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 20, fontFamily: "'DM Sans', sans-serif" };
const btnSecStyle   = { background: "transparent", color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 50, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 10, fontFamily: "'DM Sans', sans-serif" };
const inputStyle    = { width: "100%", background: C.inputBg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", color: C.textPrimary, fontSize: 15, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };

// ─── APP ─────────────────────────────────────────────────────────
export default function App() {
  const totalSteps = GATES.length + SCORING_DIMS.length;

  const initScores = () => {
    const s = {};
    GATES.forEach(g => s[g.key] = 3);
    SCORING_DIMS.forEach(d => s[d.key] = 3);
    return s;
  };

  const [initialDraft] = useState(() => readLocalJson(DRAFT_STORAGE_KEY, null));
  const [assessmentId, setAssessmentId]   = useState(() => initialDraft?.id || newAssessmentId());
  const [step, setStep]                   = useState(() => {
    if (initialDraft?.step === "gameplan" && !initialDraft?.gameplan) return "results";
    return initialDraft?.step || "intro";
  });
  const [useCase, setUseCase]             = useState(() => initialDraft?.useCase || "");
  const [scores, setScores]               = useState(() => ({ ...initScores(), ...(initialDraft?.scores || {}) }));
  const [gateIndex, setGateIndex]         = useState(() => initialDraft?.gateIndex || 0);
  const [scoringIndex, setScoringIndex]   = useState(() => initialDraft?.scoringIndex || 0);
  const [failedGate, setFailedGate]       = useState(() => GATES.find(g => g.key === initialDraft?.failedGateKey) || null);
  const [gameplan, setGameplan]           = useState(() => initialDraft?.gameplan || null);
  const [history, setHistory]             = useState(() => {
    const saved = readLocalJson(HISTORY_STORAGE_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [loadingGameplan, setLoadingGameplan] = useState(false);
  const [gameplanError, setGameplanError] = useState(null);
  const [gameplanStatus, setGameplanStatus] = useState("");
  const [accessStatus, setAccessStatus] = useState("checking");
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(
    () => new URLSearchParams(window.location.search).get("purchase") === "success"
  );

  useEffect(() => {
    let active = true;
    fetch("/api/access/session", { credentials: "include" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Access check failed")))
      .then(data => { if (active) setAccessStatus(data.access ? "allowed" : "denied"); })
      .catch(() => { if (active) setAccessStatus("error"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!useCase.trim()) {
      try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch {}
      return;
    }

    writeLocalJson(DRAFT_STORAGE_KEY, {
      id: assessmentId,
      step,
      useCase,
      scores,
      gateIndex,
      scoringIndex,
      failedGateKey: failedGate?.key || null,
      gameplan,
      updatedAt: new Date().toISOString(),
    });
  }, [assessmentId, step, useCase, scores, gateIndex, scoringIndex, failedGate, gameplan]);

  useEffect(() => {
    if (!useCase.trim() || (step !== "results" && !gameplan)) return;

    const score = calcScore();
    const verdict = getVerdict(score);
    const savedAssessment = {
      id: assessmentId,
      useCase,
      scores,
      score,
      verdictLabel: verdict?.label || "",
      gameplan,
      updatedAt: new Date().toISOString(),
    };

    setHistory(existing => {
      const next = [savedAssessment, ...existing.filter(item => item.id !== assessmentId)]
        .slice(0, HISTORY_LIMIT);
      writeLocalJson(HISTORY_STORAGE_KEY, next);
      return next;
    });
  }, [assessmentId, step, useCase, scores, gameplan]);

  function setScore(key, val) { setScores(s => ({ ...s, [key]: val })); }

  function calcScore() {
    return Math.round(SCORING_DIMS.reduce((acc, d) => acc + (scores[d.key] / 5) * d.weight, 0) * 100);
  }

  function getVerdict(s) { return VERDICT_BANDS.find(b => s >= b.min); }

  function weakestDims(n = 3) {
    return [...SCORING_DIMS]
      .sort((a, b) => scores[a.key] - scores[b.key])
      .slice(0, n)
      .map(d => ({ label: d.label, score: scores[d.key], scaleLabel: d.scale[scores[d.key] - 1] }));
  }

  function foundationGaps() {
    return GATES
      .filter(g => scores[g.key] < 3)
      .map(g => ({
        label: g.label,
        score: scores[g.key],
        scaleLabel: g.scale[scores[g.key] - 1],
      }));
  }

  async function fetchGameplan() {
    setLoadingGameplan(true);
    setGameplanError(null);
    setGameplan(null);
    const score = calcScore();
    const verdict = getVerdict(score);

    const statuses = ["Reviewing your weakest gaps...", "Matching gaps to next steps...", "Building your gameplan..."];
    let i = 0;
    setGameplanStatus(statuses[0]);
    const statusTimer = setInterval(() => {
      i = Math.min(i + 1, statuses.length - 1);
      setGameplanStatus(statuses[i]);
    }, 3500);

    try {
      const response = await fetch("/api/gameplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useCase,
          foundationScore: score,
          verdictLabel: verdict?.label,
          weakestDimensions: weakestDims(3),
          foundationGaps: foundationGaps(),
        }),
      });
      if (!response.ok) {
        const t = await response.text();
        console.error("Gameplan API error:", t);
        setGameplanError("Couldn't build your gameplan right now. Please try again.");
        setLoadingGameplan(false);
        clearInterval(statusTimer);
        return;
      }
      const data = await response.json();
      if (data.error || !data.phases) {
        setGameplanError("Couldn't build your gameplan right now. Please try again.");
      } else {
        setGameplan(data);
      }
    } catch (e) {
      console.error("Gameplan fetch error:", e);
      setGameplanError("Couldn't build your gameplan right now. Please try again.");
    }
    clearInterval(statusTimer);
    setLoadingGameplan(false);
  }

  function handleGateNext() {
    const gate = GATES[gateIndex];
    if (scores[gate.key] < 3) { setFailedGate(gate); setStep("gateWarning"); return; }
    advanceFromGate();
  }

  function advanceFromGate() {
    if (gateIndex < GATES.length - 1) { setGateIndex(i => i + 1); } else { setStep("scoring"); }
  }

  function continueWithGap() {
    setFailedGate(null);
    advanceFromGate();
  }

  function handleGateBack() {
    if (gateIndex === 0) { setStep("intro"); } else { setGateIndex(i => i - 1); }
  }

  function handleScoringNext() {
    if (scoringIndex < SCORING_DIMS.length - 1) { setScoringIndex(i => i + 1); } else { setStep("results"); }
  }

  function handleScoringBack() {
    if (scoringIndex === 0) { setStep("gates"); setGateIndex(GATES.length - 1); } else { setScoringIndex(i => i - 1); }
  }

  function goToGameplan() {
    setStep("gameplan");
    fetchGameplan();
  }

  function startNewAssessment() {
    try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch {}
    setAssessmentId(newAssessmentId());
    setStep("intro"); setUseCase(""); setScores(initScores());
    setGateIndex(0); setScoringIndex(0); setFailedGate(null);
    setGameplan(null); setGameplanError(null); setLoadingGameplan(false);
  }

  function openSavedAssessment(saved) {
    setAssessmentId(saved.id);
    setUseCase(saved.useCase);
    setScores({ ...initScores(), ...saved.scores });
    setGateIndex(0);
    setScoringIndex(0);
    setFailedGate(null);
    setGameplan(saved.gameplan || null);
    setGameplanError(null);
    setLoadingGameplan(false);
    setStep(saved.gameplan ? "gameplan" : "results");
  }

  function deleteSavedAssessment(id) {
    setHistory(existing => {
      const next = existing.filter(item => item.id !== id);
      writeLocalJson(HISTORY_STORAGE_KEY, next);
      return next;
    });
  }

  function startPurchasedGameplan() {
    window.history.replaceState({}, "", "/");
    setShowPurchaseSuccess(false);
  }

  const score       = calcScore();
  const verdict     = getVerdict(score);
  const currentGate = GATES[gateIndex];
  const currentDim  = SCORING_DIMS[scoringIndex];
  const useCaseLength = useCase.trim().length;
  const canBeginAssessment = useCaseLength >= MIN_USE_CASE_LENGTH;

  if (accessStatus !== "allowed") {
    const accessIssue = new URLSearchParams(window.location.search).get("access");
    const checkoutUrl = import.meta.env.VITE_GAMEPLAN_CHECKOUT_URL;
    const issueMessage = accessIssue === "expired"
      ? "That access link has expired or has already been used."
      : accessIssue === "revoked"
        ? "This purchase no longer has access to the Gameplan."
        : accessIssue === "error"
          ? "We couldn't complete that sign-in link."
          : null;

    return (
      <div style={wrapStyle}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ ...cardStyle, maxWidth: 520 }}>
          <BrandHeader subtitle="AI Use Case Gameplan" />
          {accessStatus === "checking" ? (
            <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Checking your access…</p>
          ) : accessStatus === "error" ? (
            <>
              <h1 style={{ fontSize: 22, lineHeight: 1.3, marginBottom: 10 }}>We couldn't check your access</h1>
              <p style={{ fontSize: 14, color: C.textSecond, lineHeight: 1.65 }}>Please refresh the page. If this continues, contact Corbelle and we'll help you get in.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 22, lineHeight: 1.3, marginBottom: 10 }}>Your Gameplan is ready when you are</h1>
              {issueMessage && <div style={{ ...tipStyle, marginTop: 0, marginBottom: 14 }}>{issueMessage}</div>}
              <p style={{ fontSize: 14, color: C.textSecond, lineHeight: 1.65, marginBottom: checkoutUrl ? 0 : 4 }}>
                Already purchased? Open the access link in your Corbelle email. It signs this device in automatically—no password needed.
              </p>
              {checkoutUrl && (
                <a href={checkoutUrl} style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none" }}>
                  Get Access →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (showPurchaseSuccess) {
    return <PurchaseSuccess onStart={startPurchasedGameplan} />;
  }

  return (
    <div style={wrapStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── INTRO ── */}
      {step === "intro" && (
        <div style={cardStyle}>
          <BrandHeader />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.textPrimary, lineHeight: 1.2, marginBottom: 12 }}>AI Use Case Gameplan</h1>
          <p style={{ fontSize: 15, color: C.textSecond, lineHeight: 1.7, marginBottom: 12 }}>
            Turn one uncertain AI idea into a defensible next move before you buy a licence or brief a team.
          </p>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginBottom: 10 }}>11 questions. Under 5 minutes. A clear verdict, plus what to do next.</p>
          <p style={{ fontSize: 13, color: C.accentText, lineHeight: 1.6, marginBottom: 24, padding: "10px 14px", background: C.accentLight, borderRadius: 8 }}>
            Answer honestly. Weak foundations will not disqualify your idea or end the assessment — they become part of your Gameplan.
          </p>
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
            placeholder="Describe the AI use case you're considering in one or two sentences..."
            value={useCase}
            onChange={e => setUseCase(e.target.value)}
          />
          <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right", marginTop: 6, color: canBeginAssessment ? C.green : C.red }}>
            {useCaseLength}/{MIN_USE_CASE_LENGTH} characters minimum
          </div>
          <button style={{ ...btnStyle, opacity: canBeginAssessment ? 1 : 0.45 }} disabled={!canBeginAssessment} onClick={() => setStep("gates")}>
            Begin Assessment →
          </button>
          {history.length > 0 && (
            <button style={btnSecStyle} onClick={() => setStep("history")}>
              Previous Use Cases ({history.length})
            </button>
          )}
        </div>
      )}

      {/* ── PREVIOUS USE CASES ── */}
      {step === "history" && (
        <div style={{ ...cardStyle, maxWidth: 640 }}>
          <BrandHeader subtitle="Saved on this device" />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, lineHeight: 1.25, marginBottom: 8 }}>Previous Use Cases</h1>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
            These assessments are stored only in this browser. Open one to review its score or Gameplan.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map(saved => (
              <div key={saved.id} style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
                <p style={{ fontSize: 14, color: C.textPrimary, lineHeight: 1.55, fontWeight: 600, margin: "0 0 10px" }}>
                  {saved.useCase.length > 180 ? `${saved.useCase.slice(0, 180)}…` : saved.useCase}
                </p>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                  {saved.score}/100 — {saved.verdictLabel} · {saved.gameplan ? "Gameplan saved" : "Assessment saved"}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={{ ...btnSecStyle, width: "auto", marginTop: 0, padding: "8px 14px", fontSize: 12 }} onClick={() => openSavedAssessment(saved)}>
                    Open
                  </button>
                  <button style={{ ...btnSecStyle, width: "auto", marginTop: 0, padding: "8px 14px", fontSize: 12, color: C.red, borderColor: C.redBorder }} onClick={() => deleteSavedAssessment(saved.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button style={btnStyle} onClick={startNewAssessment}>Validate a New Use Case</button>
          <BackButton onClick={() => setStep("intro")} />
        </div>
      )}

      {/* ── GATES ── */}
      {step === "gates" && (
        <div style={cardStyle}>
          <ProgressBar current={gateIndex} total={totalSteps} />
          <div style={labelStyle}>Foundation Gate {gateIndex + 1} of {GATES.length}</div>
          <h2 style={questionStyle}>{currentGate.question}</h2>
          <div style={tipStyle}>{currentGate.tip}</div>
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.accent, textAlign: "center", marginBottom: 4 }}>
              {scores[currentGate.key]}<span style={{ fontSize: 16, color: C.textMuted }}>/5</span>
            </div>
            <div style={{ fontSize: 13, color: C.accent, textAlign: "center", marginBottom: 16, fontWeight: 600 }}>
              {currentGate.scale[scores[currentGate.key] - 1]}
            </div>
            <input type="range" min="1" max="5" value={scores[currentGate.key]}
              onChange={e => setScore(currentGate.key, Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMuted, marginTop: 6 }}>
              {currentGate.scale.map((l, i) => <span key={i} style={{ textAlign: "center", maxWidth: 60, lineHeight: 1.2 }}>{l}</span>)}
            </div>
          </div>
          <button style={btnStyle} onClick={handleGateNext}>Continue →</button>
          <BackButton onClick={handleGateBack} />
        </div>
      )}

      {/* ── FOUNDATION WARNING ── */}
      {step === "gateWarning" && failedGate && (
        <div style={cardStyle}>
          <div style={{ ...labelStyle, color: C.amber }}>Important foundation gap</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, lineHeight: 1.3, marginBottom: 16 }}>We’ve recorded this. Keep going.</h2>
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>⚠️ {failedGate.label}</div>
            <p style={{ fontSize: 14, color: C.redText, lineHeight: 1.75, margin: 0 }}>{failedGate.failMessage}</p>
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginBottom: 0 }}>
            This does not disqualify the use case. It will become an explicit action in your final Gameplan.
          </p>
          <button style={btnStyle} onClick={continueWithGap}>Record This Gap and Continue →</button>
          <BackButton onClick={() => { setFailedGate(null); setStep("gates"); }} />
        </div>
      )}

      {/* ── SCORING ── */}
      {step === "scoring" && (
        <div style={cardStyle}>
          <ProgressBar current={GATES.length + scoringIndex} total={totalSteps} />
          <div style={labelStyle}>{currentDim.label} — Question {GATES.length + scoringIndex + 1} of {totalSteps}</div>
          <h2 style={questionStyle}>{currentDim.question}</h2>
          <div style={tipStyle}>{currentDim.tip}</div>
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.accent, textAlign: "center", marginBottom: 4 }}>
              {scores[currentDim.key]}<span style={{ fontSize: 16, color: C.textMuted }}>/5</span>
            </div>
            <div style={{ fontSize: 13, color: C.accent, textAlign: "center", marginBottom: 16, fontWeight: 600 }}>
              {currentDim.scale[scores[currentDim.key] - 1]}
            </div>
            <input type="range" min="1" max="5" value={scores[currentDim.key]}
              onChange={e => setScore(currentDim.key, Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMuted, marginTop: 6 }}>
              {currentDim.scale.map((l, i) => <span key={i} style={{ textAlign: "center", maxWidth: 56, lineHeight: 1.2 }}>{l}</span>)}
            </div>
          </div>
          <button style={btnStyle} onClick={handleScoringNext}>
            {scoringIndex < SCORING_DIMS.length - 1 ? "Next →" : "See My Score →"}
          </button>
          <BackButton onClick={handleScoringBack} />
        </div>
      )}

      {/* ── RESULTS ── */}
      {step === "results" && (
        <div style={{ ...cardStyle, maxWidth: 640 }}>
          <BrandHeader subtitle="Use Case Gameplan" />

          {/* Score */}
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 28 }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: `conic-gradient(${verdict?.color} ${score * 3.6}deg, ${C.border} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 74, height: 74, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: verdict?.color, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>/ 100</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: verdict?.color, marginBottom: 5 }}>{verdict?.icon} {verdict?.label}</div>
              <div style={{ fontSize: 13, color: C.textSecond, lineHeight: 1.6 }}>{verdict?.message}</div>
            </div>
          </div>

          {/* Radar */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <RadarChart scores={scores} />
          </div>

          {/* Dimension breakdown */}
          <div style={{ marginBottom: 8 }}>
            {SCORING_DIMS.map(dim => (
              <div key={dim.key} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: C.textSecond, fontWeight: 600 }}>{dim.label}</span>
                  <span style={{ color: C.accent, fontWeight: 700 }}>{scores[dim.key]}/5 — {dim.scale[scores[dim.key]-1]}</span>
                </div>
                <ScoreBar value={scores[dim.key]} />
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 5 }}>{dim.blocker[scores[dim.key]-1]}</div>
              </div>
            ))}
          </div>

          <button style={btnStyle} onClick={goToGameplan}>Build My Gameplan →</button>
          <button style={btnSecStyle} onClick={startNewAssessment}>Validate Another Use Case</button>
        </div>
      )}

      {/* ── GAMEPLAN ── */}
      {step === "gameplan" && (
        <div style={{ ...cardStyle, maxWidth: 640 }}>
          <BrandHeader className="no-print" subtitle="Your Gameplan" />

          {loadingGameplan && (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textMuted, fontSize: 14 }}>
              <div style={{ fontSize: 26, marginBottom: 14 }}>⚡</div>
              {gameplanStatus || "Building your gameplan..."}
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 10, fontFamily: "monospace" }}>Usually 15–30 seconds</div>
            </div>
          )}

          {!loadingGameplan && gameplanError && (
            <div>
              <div style={{ background: C.redBg, border: `1.5px solid ${C.redBorder}`, borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: C.redText, lineHeight: 1.6, margin: 0 }}>{gameplanError}</p>
              </div>
              <button style={btnStyle} onClick={fetchGameplan}>Try Again</button>
              <BackButton onClick={() => setStep("results")} />
            </div>
          )}

          {!loadingGameplan && !gameplanError && gameplan && (
            <>
              <div className="print-section" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                  {verdict?.icon} {score}/100 — {verdict?.label}
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4, margin: 0 }}>
                  {gameplan.headline}
                </h2>
              </div>

              {(gameplan.phases || []).map((phase, pIdx) => (
                <div key={pIdx} className="print-section" style={{ marginBottom: 26 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 3 }}>{phase.title}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", marginBottom: 12 }}>{phase.goal}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(phase.steps || []).map((s, i) => (
                      <div key={i} style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>{s.action}</div>
                        <p style={{ fontSize: 13, color: C.textSecond, lineHeight: 1.6, margin: 0 }}>{s.why}</p>
                        {s.mapsTo && (
                          <div style={{ marginTop: 8, display: "inline-block", fontSize: 11, fontWeight: 600, color: C.accentText, background: C.accentLight, borderRadius: 20, padding: "3px 10px" }}>
                            Maps to: {s.mapsTo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="no-print" style={{ background: C.accentLight, borderRadius: 12, padding: "20px 22px", marginBottom: 16, borderLeft: `3px solid ${C.accent}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>
                  This tells you what needs fixing and in what order — the next conversation is about which of these four steps you run first, and what it actually costs to do it properly.
                </div>
                <div style={{ fontSize: 13, color: C.textSecond, lineHeight: 1.6, marginBottom: 14 }}>Corbelle helps executives make confident AI decisions without the hype, the wasted licences, or the expensive reversals.</div>
                <a href="https://cal.com/brennie/ai-30-mins" target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", background: C.accent, color: "#fff", borderRadius: 50, padding: "13px 20px", fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                  Book a Free 30-Minute Call →
                </a>
              </div>

              <div className="no-print gameplan-actions">
                <button style={{ ...btnSecStyle, width: "auto", marginTop: 0, padding: "11px 12px", fontSize: 12, whiteSpace: "nowrap" }} onClick={() => window.print()}>Print / Save PDF</button>
                <button style={{ ...btnSecStyle, width: "auto", marginTop: 0, padding: "11px 12px", fontSize: 12, whiteSpace: "nowrap" }} onClick={() => setStep("results")}>← Back</button>
                <button style={{ ...btnSecStyle, width: "auto", marginTop: 0, padding: "11px 12px", fontSize: 12, whiteSpace: "nowrap" }} onClick={startNewAssessment}>Validate New Use Case</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
