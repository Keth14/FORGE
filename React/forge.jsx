import { useState, useEffect, useRef } from "react";

// ─── Identity ─────────────────────────────────────────────────────────────────
var STORAGE_KEY = "forge_keth_v4";
var MAX_GRACE = 5;

var INTEGRITY_CONTRACTS = [
  { id: 1, short: "No escape into planning", full: "I do not escape into planning when execution becomes uncomfortable. Redesigning systems, researching endlessly, building new visions instead of doing the difficult next action — that is drift, not productivity." },
  { id: 2, short: "Protect the morning", full: "No mindless scrolling, random content consumption, or dopamine flooding before I have grounded myself in reality and direction for the day." },
  { id: 3, short: "Finish what I commit to", full: "Not perfectly. Not flawlessly. But I do not repeatedly abandon goals the moment intensity fades or discomfort appears." },
  { id: 4, short: "Train even when the mind resists", full: "My physical discipline stabilizes my mental discipline. When I stop respecting my body, every other system starts decaying after it." },
  { id: 5, short: "No collapse disguised as rest", full: "Recovery is allowed. Temporary slowing is allowed. Disappearing for days and pretending it is resetting is not." },
  { id: 6, short: "Create more than I consume", full: "Watching, planning, imagining, optimizing, researching, fantasizing — none of it counts unless something tangible was built, learned, executed, or progressed." },
  { id: 7, short: "Action before overthinking", full: "The longer I mentally negotiate with difficult tasks, the weaker I become. Face resistance directly instead of negotiating with it for hours." },
  { id: 8, short: "Structure survives emotion", full: "Bad mood, low confidence, frustration, boredom, loneliness, overstimulation — none of these are valid reasons to dissolve my routines completely." },
  { id: 9, short: "Tell the truth inside FORGE", full: "If I lie in the comments, soften reality, or hide patterns, I destroy the purpose of the system itself. The mirror only works if I stop performing for it." },
  { id: 10, short: "Respect today's execution", full: "My life changes through accumulated days, not imagined identities. I do not disappear into future versions of myself while neglecting the current one." },
];

var DEFAULT_HABITS = [
  { id: "train",    icon: "🏋️", label: "Train",            desc: "Lean and aesthetic. Build the body for the stage.",       xp: 30, locked: true  },
  { id: "water",    icon: "💧", label: "3L Water",          desc: "Jaw definition. Skin. Energy.",                           xp: 10, locked: true  },
  { id: "groom",    icon: "🪞", label: "Grooming",          desc: "Look the part every day. No exceptions.",                 xp: 10, locked: false },
  { id: "phone",    icon: "📵", label: "Phone Quarantine",  desc: "First 90 min. Face down.",                                xp: 25, locked: true  },
  { id: "deepwork", icon: "🧠", label: "Deep Work",         desc: "One focused block. Build or study.",                      xp: 30, locked: true  },
  { id: "read",     icon: "📖", label: "Read",              desc: "Feed the mind. Not the feed.",                            xp: 15, locked: false },
  { id: "debrief",  icon: "✍️", label: "Debrief",           desc: "What was today for. What did it cost.",                   xp: 10, locked: false },
  { id: "interact", icon: "🗣️", label: "Sharp Interaction", desc: "One present, engaged, real conversation.",                xp: 10, locked: false },
  { id: "sleep",    icon: "😴", label: "Sleep",             desc: "Discipline starts the night before.",                     xp: 15, locked: false },
];

var DRIFT_WORDS = ["tomorrow", "need to reorganize", "still figuring", "didn't feel", "not ready", "will start", "planning to", "once i", "when i get", "need to sort", "after i", "maybe tomorrow", "wasn't focused", "couldn't start"];
var RESISTANCE_WORDS = ["avoided", "kept delaying", "couldn't start", "felt uncomfortable", "didn't want to", "too hard", "procrastinated", "avoided again", "skipped again", "not yet", "postponed", "escaped"];
var DELUSION_WORDS = ["massive rebuild", "thinking of changing", "new system", "planning everything", "redesign", "might start", "need the perfect", "whole new approach", "rethinking everything", "overhaul", "new project"];
var RECOVERY_WORDS = ["exhausted", "mentally drained", "low energy", "need stabilization", "trying to reset", "overwhelmed", "burnt out", "barely", "struggling", "crashing"];

var JARVIS_CORE = "You are the AI core of FORGE — a behavioral inference engine built exclusively for one person: Keth.\n\nKeth's Integrity Contracts (reference by number when relevant):\n1. No escape into planning when execution is uncomfortable\n2. Protect the morning from chaos and dopamine\n3. Finish what is committed to — do not abandon at first discomfort\n4. Train even when the mind resists — physical discipline stabilizes mental discipline\n5. No collapse disguised as rest — disappearing for days is not recovery\n6. Create more than consumed — planning and fantasy do not count as output\n7. Action before overthinking — face resistance directly\n8. Structure survives emotional fluctuation — bad mood is not permission to dissolve routines\n9. Tell the truth inside FORGE — the mirror only works without performance\n10. Respect today's execution — life changes through accumulated days not imagined identities\n\nKeth's known failure patterns: fragmentation, restart cycles, romanticizing outcomes over execution, confusing inspiration with avoidance, planning spikes before abandonment, identity fantasy replacing grounded action.\n\nYour tone: observational, cold, precise. Never motivational. Never theatrical. Never moralistic. Speak like a system that has watched his patterns for years. Reference specific data from the habit logs and comments provided. Identify which Integrity Contracts are being violated by pattern, not by single incidents. Use the language: 'patterns suggest' not 'you are'. 'Divergence detected' not 'you failed'. Always observational. Never certain. Max 3 paragraphs.";

var GOAL_SYSTEM = "You are JARVIS. Break down goals into precise actionable plans. Return ONLY valid JSON array. Each item: {id, category, task (specific with reps/sets/duration), note (one sharp insight)}. No markdown. No explanation. Max 12 items.";
var FOCUS_SYSTEM = "You are JARVIS. Given a goal plan and completed items, generate today adjusted focus. Max 7 items. Return ONLY valid JSON array same format.";

// ─── Signals ──────────────────────────────────────────────────────────────────
function detectLanguageSignals(comments) {
  var text = Object.values(comments || {}).join(" ").toLowerCase();
  var drift = DRIFT_WORDS.filter(function(w) { return text.includes(w); }).length;
  var resistance = RESISTANCE_WORDS.filter(function(w) { return text.includes(w); }).length;
  var delusion = DELUSION_WORDS.filter(function(w) { return text.includes(w); }).length;
  var recovery = RECOVERY_WORDS.filter(function(w) { return text.includes(w); }).length;
  return { drift: drift, resistance: resistance, delusion: delusion, recovery: recovery };
}

function inferMode(history, habits) {
  var entries = Object.entries(history || {}).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; }).slice(0, 7);
  if (entries.length < 2) return "stable";
  var deepWorkDone = entries.filter(function(e) { return e[1].checks && e[1].checks["deepwork"]; }).length;
  var phoneDone = entries.filter(function(e) { return e[1].checks && e[1].checks["phone"]; }).length;
  var trainDone = entries.filter(function(e) { return e[1].checks && e[1].checks["train"]; }).length;
  var totalChecks = entries.reduce(function(s, e) {
    return s + habits.filter(function(h) { return e[1].checks && e[1].checks[h.id]; }).length;
  }, 0);
  var maxPossible = entries.length * habits.length;
  var execRate = maxPossible > 0 ? totalChecks / maxPossible : 0;
  var allComments = entries.flatMap(function(e) { return Object.values(e[1].comments || {}); }).join(" ").toLowerCase();
  var driftSignal = DRIFT_WORDS.filter(function(w) { return allComments.includes(w); }).length;
  var delusionSignal = DELUSION_WORDS.filter(function(w) { return allComments.includes(w); }).length;
  var recoverySignal = RECOVERY_WORDS.filter(function(w) { return allComments.includes(w); }).length;

  if (recoverySignal >= 2 || (execRate < 0.25 && trainDone === 0)) return "recovery";
  if (delusionSignal >= 2 || (driftSignal >= 3 && execRate < 0.4)) return "delusion";
  if (driftSignal >= 2 || (deepWorkDone <= 1 && phoneDone <= 1 && execRate < 0.45)) return "drift";
  if (deepWorkDone >= 5 && phoneDone >= 5 && execRate > 0.75) return "war";
  return "stable";
}

function calcMomentum(history, habits) {
  var entries = Object.entries(history || {}).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; }).slice(0, 14);
  if (entries.length === 0) return 0;
  var recent = entries.slice(0, 7);
  var older = entries.slice(7, 14);
  function avgExec(arr) {
    if (arr.length === 0) return 0;
    var total = arr.reduce(function(s, e) {
      return s + habits.filter(function(h) { return e[1].checks && e[1].checks[h.id]; }).length;
    }, 0);
    return total / (arr.length * habits.length);
  }
  var recentAvg = avgExec(recent);
  var olderAvg = avgExec(older);
  var base = recentAvg * 100;
  var trend = older.length > 0 ? (recentAvg - olderAvg) * 50 : 0;
  return Math.round(Math.min(100, Math.max(0, base + trend)));
}

function calcDrift(history, habits) {
  var entries = Object.entries(history || {}).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; }).slice(0, 7);
  if (entries.length === 0) return 0;
  var allComments = entries.flatMap(function(e) { return Object.values(e[1].comments || {}); }).join(" ").toLowerCase();
  var langScore = DRIFT_WORDS.filter(function(w) { return allComments.includes(w); }).length * 8;
  var deepMissed = entries.filter(function(e) { return !e[1].checks || !e[1].checks["deepwork"]; }).length;
  var phoneMissed = entries.filter(function(e) { return !e[1].checks || !e[1].checks["phone"]; }).length;
  var execScore = (deepMissed + phoneMissed) / (entries.length * 2) * 60;
  return Math.round(Math.min(100, langScore + execScore));
}

function calcResistance(history, habits) {
  var entries = Object.entries(history || {}).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; }).slice(0, 7);
  if (entries.length === 0) return 0;
  var allComments = entries.flatMap(function(e) { return Object.values(e[1].comments || {}); }).join(" ").toLowerCase();
  var langScore = RESISTANCE_WORDS.filter(function(w) { return allComments.includes(w); }).length * 10;
  var locked = ["train", "phone", "deepwork"];
  var lockedMissed = entries.reduce(function(s, e) {
    return s + locked.filter(function(id) { return !e[1].checks || !e[1].checks[id]; }).length;
  }, 0);
  var execScore = lockedMissed / (entries.length * locked.length) * 50;
  return Math.round(Math.min(100, langScore + execScore));
}

function calcSelfBetrayal(history, habits) {
  var entries = Object.entries(history || {}).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; }).slice(0, 14);
  if (entries.length === 0) return 0;
  var allComments = entries.flatMap(function(e) { return Object.values(e[1].comments || {}); }).join(" ").toLowerCase();
  var betrayalWords = DRIFT_WORDS.concat(RESISTANCE_WORDS).filter(function(w) { return allComments.includes(w); }).length;
  var criticalMissed = entries.filter(function(e) {
    var c = e[1].checks || {};
    return !c["train"] || !c["deepwork"];
  }).length;
  var score = (betrayalWords * 5) + (criticalMissed / entries.length * 60);
  return Math.round(Math.min(100, score));
}

function calcCollapseRisk(history, habits, goals) {
  var entries = Object.entries(history || {}).sort(function(a,b){ return a[0]<b[0]?1:-1; });
  var last7 = entries.slice(0,7);
  var last2 = entries.slice(0,2);
  var last14 = entries.slice(0,14);
  var score = 0;
  var signals = [];

  // +25 Sudden goal creation spike (3+ goals created recently)
  if ((goals||[]).length >= 3) {
    var recentGoals = (goals||[]).filter(function(g){ return g.createdAt && last7.some(function(e){ return e[0]===g.createdAt; }); });
    if (recentGoals.length >= 2) { score+=25; signals.push("Multiple goals created in short window"); }
  }

  // +20 System restructure language in comments
  var restructureWords = ["rebuild","restructure","overhaul","new phase","full reset","this time","redesign","new system","reinvent","whole new","starting over","clean slate","fresh start"];
  var allComments7 = last7.flatMap(function(e){ return Object.values(e[1].comments||{}); }).join(" ").toLowerCase();
  var restructureHits = restructureWords.filter(function(w){ return allComments7.includes(w); }).length;
  if (restructureHits >= 2) { score+=20; signals.push("System restructure language detected ("+restructureHits+" signals)"); }

  // +20 Planning-heavy language spike
  var planningWords = ["planning to","going to start","once i","need to first","need to sort","after i","will begin","setting up","getting ready","preparing","organizing first"];
  var planningHits = planningWords.filter(function(w){ return allComments7.includes(w); }).length;
  if (planningHits >= 2) { score+=20; signals.push("Planning language elevated without matching execution"); }

  // +20 Execution collapse after ambition spike
  if (last14.length >= 7) {
    var older7 = last14.slice(7,14);
    function execRate(arr) {
      if (!arr.length) return 0;
      return arr.reduce(function(s,e){ return s+habits.filter(function(h){ return e[1].checks&&e[1].checks[h.id]; }).length; },0)/(arr.length*habits.length);
    }
    var recentRate = execRate(last7);
    var olderRate = execRate(older7);
    var commentLen7 = last7.reduce(function(s,e){ return s+Object.values(e[1].comments||{}).join("").length; },0);
    if (commentLen7 > 200 && recentRate < olderRate - 0.2) { score+=20; signals.push("High conceptual activity paired with execution decline"); }
  }

  // +15 Philosophical journaling spike (long abstract comments, low action words)
  var abstractWords = ["meaning","purpose","identity","who i am","becoming","philosophy","existence","truly","deeply","fundamentally","essence","real me","actual self"];
  var abstractHits = abstractWords.filter(function(w){ return allComments7.includes(w); }).length;
  if (abstractHits >= 2) { score+=15; signals.push("Philosophical abstraction spike detected"); }

  // +15 Physical grounding collapse
  var trainMissed = last7.filter(function(e){ return !e[1].checks||!e[1].checks["train"]; }).length;
  var waterMissed = last7.filter(function(e){ return !e[1].checks||!e[1].checks["water"]; }).length;
  var sleepMissed = last7.filter(function(e){ return !e[1].checks||!e[1].checks["sleep"]; }).length;
  var physicalCollapse = (trainMissed>=4?1:0)+(waterMissed>=4?1:0)+(sleepMissed>=4?1:0);
  if (physicalCollapse >= 2) { score+=15; signals.push("Physical grounding collapsing (train/water/sleep)"); }

  // +10 Inconsistent logging (2+ day gaps)
  if (last2.length < 2) { score+=10; signals.push("Logging gap detected"); }

  // +10 Long comments + low execution
  var avgCommentLen = last7.length>0 ? last7.reduce(function(s,e){ return s+Object.values(e[1].comments||{}).join("").length; },0)/last7.length : 0;
  var deepMissed = last7.filter(function(e){ return !e[1].checks||!e[1].checks["deepwork"]; }).length;
  if (avgCommentLen>80 && deepMissed>=4) { score+=10; signals.push("Verbose commentary without execution"); }

  // +10 High planning / low completion ratio in goals
  if ((goals||[]).length >= 2) {
    var totalItems = goals.reduce(function(s,g){ return s+(g.plan||[]).length; },0);
    var doneItems = goals.reduce(function(s,g){ return s+Object.values(g.checks||{}).filter(Boolean).length; },0);
    if (totalItems>6 && doneItems/totalItems < 0.2) { score+=10; signals.push("High goal count, low completion ratio"); }
  }

  score = Math.min(100, score);
  var phase = score<35?"stable":score<55?"watch":score<75?"drift":"stabilization";
  return { score:score, phase:phase, signals:signals };
}

function detectContractDivergence(history, habits) {
  var entries = Object.entries(history || {}).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; }).slice(0, 7);
  if (entries.length < 3) return [];
  var allComments = entries.flatMap(function(e) { return Object.values(e[1].comments || {}); }).join(" ").toLowerCase();
  var divergences = [];
  var deepMissed = entries.filter(function(e) { return !e[1].checks || !e[1].checks["deepwork"]; }).length;
  var trainMissed = entries.filter(function(e) { return !e[1].checks || !e[1].checks["train"]; }).length;
  var phoneMissed = entries.filter(function(e) { return !e[1].checks || !e[1].checks["phone"]; }).length;
  var driftLang = DRIFT_WORDS.filter(function(w) { return allComments.includes(w); }).length;
  var delusionLang = DELUSION_WORDS.filter(function(w) { return allComments.includes(w); }).length;

  if (driftLang >= 2 || (deepMissed >= 4 && delusionLang >= 1)) {
    divergences.push({ contract: 1, note: "Increased planning language without matching execution for " + entries.length + " consecutive days." });
  }
  if (phoneMissed >= 4) {
    divergences.push({ contract: 2, note: "Morning quarantine failed " + phoneMissed + " of last " + entries.length + " days." });
  }
  if (trainMissed >= 4) {
    divergences.push({ contract: 4, note: "Training missed " + trainMissed + " of last " + entries.length + " days. Physical anchor destabilizing." });
  }
  if (deepMissed >= 4) {
    divergences.push({ contract: 7, note: "Deep work avoided " + deepMissed + " of last " + entries.length + " days. Resistance pattern strengthening." });
  }
  return divergences;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysUntil(d) { return Math.ceil((new Date(d) - new Date(todayStr())) / 86400000); }

function getLevel(xp) {
  var levels = [
    { name: "CIVILIAN", min: 0, color: "#6b7280" },
    { name: "INITIATE", min: 500, color: "#10b981" },
    { name: "OPERATOR", min: 1500, color: "#3b82f6" },
    { name: "SPECIALIST", min: 3500, color: "#8b5cf6" },
    { name: "IRONCLAD", min: 7000, color: "#f59e0b" },
    { name: "FORGED", min: 12000, color: "#ef4444" },
  ];
  var level = levels[0];
  for (var i = 0; i < levels.length; i++) { if (xp >= levels[i].min) level = levels[i]; }
  return level;
}

function storeCollapsePattern(state, risk) {
  if (risk.phase === "stabilization" || risk.phase === "drift") {
    var pattern = { date: todayStr(), phase: risk.phase, score: risk.score, signals: risk.signals };
    var existing = state.collapsePatterns || [];
    // Don't duplicate same day
    if (existing.length > 0 && existing[0].date === todayStr()) return state;
    return Object.assign({}, state, { collapsePatterns: [pattern].concat(existing).slice(0,10) });
  }
  return state;
}

function findPatternMatch(currentSignals, collapsePatterns) {
  if (!collapsePatterns || collapsePatterns.length < 2) return null;
  var prev = collapsePatterns.slice(1);
  for (var i=0; i<prev.length; i++) {
    var p = prev[i];
    var matches = currentSignals.filter(function(s){ return p.signals.some(function(ps){ return ps.slice(0,20)===s.slice(0,20); }); }).length;
    if (matches >= 2) return p;
  }
  return null;
}

function loadState() {
  try {
    var s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!s) return null;
    if (!s.habits) s.habits = DEFAULT_HABITS;
    return s;
  } catch(e) { return null; }
}

function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e) {} }

function initState() {
  return {
    username: "Keth", startDate: todayStr(), dayCount: 1, collapsePatterns: [], awarenessAcknowledged: null,
    totalXP: 0, lifetimeChecks: 0, lifetimePossible: 0,
    streak: 0, longestStreak: 0, graceDaysUsed: 0,
    lastActiveDate: null, history: {}, habits: DEFAULT_HABITS,
    missions: [], bodyLog: [], photoLog: [], jarvisInsights: [], goals: [], pin: null,
  };
}

async function callClaude(system, msg) {
  var res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: system, messages: [{ role: "user", content: msg }] }),
  });
  var data = await res.json();
  return data.content ? data.content.map(function(c) { return c.text || ""; }).join("") : "";
}

// ─── Mode Config ──────────────────────────────────────────────────────────────
var MODE_CONFIG = {
  stable:        { label: "STABLE",        accent: "#f59e0b", bg: "#0a0908", cardBg: "#0f0e0d", border: "#1c1917" },
  war:           { label: "WAR",           accent: "#ef4444", bg: "#090808", cardBg: "#0f0c0c", border: "#2a1515" },
  drift:         { label: "DRIFT",         accent: "#78716c", bg: "#0c0c0b", cardBg: "#111110", border: "#1a1a18" },
  delusion:      { label: "DELUSION",      accent: "#8b5cf6", bg: "#0b0a0e", cardBg: "#100f14", border: "#1e1a2a" },
  recovery:      { label: "RECOVERY",      accent: "#60a5fa", bg: "#090c0f", cardBg: "#0d1117", border: "#152030" },
  watch:         { label: "WATCH",         accent: "#fb923c", bg: "#0b0a08", cardBg: "#110f0d", border: "#1f1a15" },
  stabilization: { label: "STABILIZATION", accent: "#60a5fa", bg: "#08090c", cardBg: "#0c0d10", border: "#141620" },
};

var STABILIZATION_HABITS = [
  { id: "sleep",   icon: "😴", label: "Sleep",      desc: "Consistent time. Non-negotiable.", xp: 0, locked: true },
  { id: "water",   icon: "💧", label: "Water",       desc: "3 litres. Basic system maintenance.", xp: 0, locked: true },
  { id: "move",    icon: "🚶", label: "Move",        desc: "Walk. Sunlight. Get outside.", xp: 0, locked: true },
  { id: "shower",  icon: "🚿", label: "Shower",      desc: "Physical reset.", xp: 0, locked: true },
  { id: "connect", icon: "🗣️", label: "One Human",  desc: "Talk to someone real. Not a screen.", xp: 0, locked: true },
];

var GRACE_REASONS = [
  { id: "sick",   label: "Sick / Unwell",          valid: true  },
  { id: "travel", label: "Travelling / Disrupted", valid: true  },
  { id: "mental", label: "Mental Health Day",       valid: true  },
  { id: "nope",   label: "No excuse. I slipped.",   valid: false },
];

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Forge() {
  var [S, setS] = useState(loadState() || initState());
  var [view, setView] = useState("today");
  var [checks, setChecks] = useState({});
  var [comments, setComments] = useState({});
  var [openComment, setOpenComment] = useState(null);
  var [modal, setModal] = useState(null);
  var [jarvisText, setJarvisText] = useState("");
  var [jarvisLoading, setJarvisLoading] = useState(false);
  var [typewritten, setTypewritten] = useState("");
  var [locked, setLocked] = useState(false);
  var [pinInput, setPinInput] = useState("");
  var [pinError, setPinError] = useState(false);
  var [xpPops, setXpPops] = useState([]);
  var popId = useRef(0);
  var td = todayStr();
  var week = Math.ceil(S.dayCount / 7);

  useEffect(function() {
    var h = S.history[td];
    if (h && h.checks) setChecks(h.checks);
    if (h && h.comments) setComments(h.comments);
  }, [td]);

  useEffect(function() { saveState(S); }, [S]);
  useEffect(function() { if (S.pin) setLocked(true); }, []);

  useEffect(function() {
    if (!jarvisText) return;
    setTypewritten("");
    var i = 0;
    var iv = setInterval(function() {
      setTypewritten(jarvisText.slice(0, i));
      i++;
      if (i > jarvisText.length) clearInterval(iv);
    }, 14);
    return function() { clearInterval(iv); };
  }, [jarvisText]);

  // Merge today's live checks into history for real-time tracker accuracy
  var liveHistory = Object.assign({}, S.history);
  var td2 = todayStr();
  liveHistory[td2] = Object.assign({}, liveHistory[td2] || {}, { checks: checks, comments: comments });

  var mode = inferMode(liveHistory, S.habits);
  var effectiveMode = mode;
  var mc = MODE_CONFIG[mode] || MODE_CONFIG.stable;
  var momentum = calcMomentum(liveHistory, S.habits);
  var drift = calcDrift(liveHistory, S.habits);
  var resistance = calcResistance(liveHistory, S.habits);
  var selfBetrayal = calcSelfBetrayal(liveHistory, S.habits);
  var stateScore = Math.round((momentum * 0.4) + ((100 - drift) * 0.3) + ((100 - resistance) * 0.3));
  var contractDivergences = detectContractDivergence(liveHistory, S.habits);
  var collapseRisk = calcCollapseRisk(liveHistory, S.habits, S.goals);
  var collapsePhase = collapseRisk.phase;
  var patternMatch = findPatternMatch(collapseRisk.signals, S.collapsePatterns);
  // Recompute mc with collapse awareness
  if (collapseRisk.phase === "stabilization") { effectiveMode = "stabilization"; mc = MODE_CONFIG.stabilization; }
  else if (collapseRisk.phase === "watch" && effectiveMode === "stable") { effectiveMode = "watch"; mc = MODE_CONFIG.watch; }
  // Store pattern if elevated
  useEffect(function() {
    if (collapseRisk.phase === "drift" || collapseRisk.phase === "stabilization") {
      setS(function(s) { return storeCollapsePattern(s, collapseRisk); });
    }
  }, [collapseRisk.phase]);
  var level = getLevel(S.totalXP);
  var doneToday = S.habits.filter(function(h) { return checks[h.id]; }).length;
  var allDoneToday = S.habits.every(function(h) { return checks[h.id]; });

  function addXP(amt) {
    var id = popId.current++;
    setXpPops(function(p) { return p.concat([{ id: id, amt: amt }]); });
    setTimeout(function() { setXpPops(function(p) { return p.filter(function(x) { return x.id !== id; }); }); }, 2000);
  }

  function toggleHabit(hid) {
    var habit = S.habits.find(function(h) { return h.id === hid; });
    if (!habit) return;
    var was = !!checks[hid];
    var nc = Object.assign({}, checks);
    nc[hid] = !was;
    setChecks(nc);
    var wasAllDone = S.habits.every(function(h) { return !!checks[h.id]; });
    var allDone = S.habits.every(function(h) { return nc[h.id]; });
    var bonusXP = (allDone && !wasAllDone) ? 50 : 0;
    var lostBonus = (!allDone && wasAllDone) ? 50 : 0;
    if (!was) addXP(habit.xp);
    if (bonusXP) setTimeout(function() { addXP(50); }, 300);
    var dayXP = S.habits.reduce(function(s, h) { return s + (nc[h.id] ? h.xp : 0); }, 0) + (allDone ? 50 : 0);
    setS(function(s) {
      var newXP = Math.max(0, s.totalXP + (!was ? habit.xp : -habit.xp) + bonusXP - lostBonus);
      var streak = s.streak, longest = s.longestStreak, lastActive = s.lastActiveDate;
      if (allDone && s.lastActiveDate !== td) {
        var yest = new Date(); yest.setDate(yest.getDate() - 1);
        var yStr = yest.toISOString().slice(0, 10);
        streak = s.lastActiveDate === yStr ? s.streak + 1 : 1;
        longest = Math.max(streak, s.longestStreak);
        lastActive = td;
      }
      var nh = Object.assign({}, s.history);
      var existingComments = (s.history[td] && s.history[td].comments) ? s.history[td].comments : comments;
      nh[td] = { checks: nc, comments: existingComments, xpEarned: dayXP };
      return Object.assign({}, s, {
        totalXP: newXP, streak: streak, longestStreak: longest, lastActiveDate: lastActive,
        lifetimeChecks: Math.max(0, s.lifetimeChecks + (!was ? 1 : -1)),
        history: nh,
      });
    });
  }

  function saveComment(hid, text) {
    var nc = Object.assign({}, comments);
    nc[hid] = text;
    setComments(nc);
    setS(function(s) {
      var nh = Object.assign({}, s.history);
      nh[td] = Object.assign({}, nh[td] || {}, { comments: nc });
      return Object.assign({}, s, { history: nh });
    });
  }

  function advanceDay() {
    setS(function(s) { return Object.assign({}, s, { dayCount: s.dayCount + 1, lifetimePossible: s.lifetimePossible + s.habits.length }); });
    setChecks({});
    setComments({});
  }

  function useGrace(rid) {
    var r = GRACE_REASONS.find(function(x) { return x.id === rid; });
    if (!r) return;
    setS(function(s) { return Object.assign({}, s, { graceDaysUsed: r.valid ? s.graceDaysUsed + 1 : s.graceDaysUsed, streak: r.valid ? s.streak : 0, totalXP: r.valid ? s.totalXP : Math.max(0, s.totalXP - 30) }); });
    setModal(null);
    advanceDay();
  }

  async function runJarvis(trigger) {
    setModal("jarvis");
    setJarvisLoading(true);
    setJarvisText("");
    var hist = Object.entries(S.history).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; }).slice(0, 14);
    var habitLines = S.habits.map(function(h) {
      var done = hist.filter(function(e) { return e[1].checks && e[1].checks[h.id]; }).length;
      var recentComments = hist.filter(function(e) { return e[1].comments && e[1].comments[h.id]; }).map(function(e) { return e[0] + ": " + e[1].comments[h.id]; }).slice(-3);
      return h.label + ": " + done + "/" + hist.length + (recentComments.length ? " | notes: " + recentComments.join(" / ") : "");
    }).join("\n");
    var allComments = hist.flatMap(function(e) {
      return Object.entries(e[1].comments || {}).map(function(ce) {
        var hLabel = (S.habits.find(function(h) { return h.id === ce[0]; }) || {}).label || ce[0];
        return "[" + e[0] + "] " + hLabel + ": " + ce[1];
      });
    }).slice(-20).join("\n");
    var divergences = contractDivergences.map(function(d) { return "Contract " + d.contract + ": " + d.note; }).join("\n");
    var collapseInfo = "Collapse risk: "+collapseRisk.score+" ("+collapseRisk.phase+") signals: "+(collapseRisk.signals.join("; ")||"none");
    var patternInfo = patternMatch ? "Pattern match: "+patternMatch.date+" score "+patternMatch.score : "No pattern match.";
    var msg = "Current mode: " + effectiveMode.toUpperCase() + "\nDay: " + S.dayCount + " | Streak: " + S.streak + " | Grace used: " + S.graceDaysUsed + "/" + MAX_GRACE + "\nMomentum: " + momentum + " | Drift: " + drift + " | Resistance: " + resistance + " | Self-betrayal: " + selfBetrayal + "\n\nHabit data (last " + hist.length + " days):\n" + habitLines + "\n\nPersonal notes:\n" + (allComments || "None.") + "\n\nDetected contract divergences:\n" + (divergences || "None detected.") + "\n\nTrigger: " + trigger;
    try {
      var text = await callClaude(JARVIS_CORE, msg);
      setJarvisText(text);
      setS(function(s) { return Object.assign({}, s, { jarvisInsights: [{ date: td, trigger: trigger, msg: text, mode: mode }].concat(s.jarvisInsights).slice(0, 15) }); });
    } catch(e) { setJarvisText("JARVIS offline. Network unavailable. The data still exists. Execute regardless."); }
    setJarvisLoading(false);
  }

  async function createGoal(name, desc) {
    var gid = "g" + Date.now();
    setS(function(s) { return Object.assign({}, s, { goals: s.goals.concat([{ id: gid, name: name, description: desc, createdAt: td, plan: null, planLoading: true, dailyFocus: null, dailyFocusLoading: false, checks: {} }]) }); });
    setModal(null);
    try {
      var raw = await callClaude(GOAL_SYSTEM, "Goal: " + name + "\nContext: " + desc);
      var plan = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setS(function(s) { return Object.assign({}, s, { goals: s.goals.map(function(g) { return g.id === gid ? Object.assign({}, g, { plan: plan, planLoading: false }) : g; }) }); });
    } catch(e) {
      setS(function(s) { return Object.assign({}, s, { goals: s.goals.map(function(g) { return g.id === gid ? Object.assign({}, g, { plan: [], planLoading: false }) : g; }) }); });
    }
  }

  async function refreshFocus(gid) {
    var goal = S.goals.find(function(g) { return g.id === gid; });
    if (!goal || !goal.plan) return;
    setS(function(s) { return Object.assign({}, s, { goals: s.goals.map(function(g) { return g.id === gid ? Object.assign({}, g, { dailyFocusLoading: true }) : g; }) }); });
    var done = Object.entries(goal.checks || {}).filter(function(e) { return e[1]; }).map(function(e) { var item = goal.plan.find(function(p) { return p.id === e[0]; }); return item ? item.task : e[0]; });
    try {
      var raw = await callClaude(FOCUS_SYSTEM, "Goal: " + goal.name + "\nPlan: " + JSON.stringify(goal.plan) + "\nCompleted: " + (done.join(", ") || "None") + "\nGenerate today focus max 7 items.");
      var focus = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setS(function(s) { return Object.assign({}, s, { goals: s.goals.map(function(g) { return g.id === gid ? Object.assign({}, g, { dailyFocus: focus, dailyFocusLoading: false }) : g; }) }); });
    } catch(e) {
      setS(function(s) { return Object.assign({}, s, { goals: s.goals.map(function(g) { return g.id === gid ? Object.assign({}, g, { dailyFocusLoading: false }) : g; }) }); });
    }
  }

  function toggleGoalItem(gid, iid) {
    setS(function(s) { return Object.assign({}, s, { goals: s.goals.map(function(g) { if (g.id !== gid) return g; var nc = Object.assign({}, g.checks); nc[iid] = !nc[iid]; return Object.assign({}, g, { checks: nc }); }) }); });
  }

  // PIN lock
  if (locked) {
    return (
      <div style={{ minHeight: "100vh", background: mc.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, fontFamily: "'DM Mono',monospace" }}>
        <style>{CSS}</style>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: "0.12em", color: "#e7e5e4" }}>FORGE</div>
        <div style={{ fontSize: 9, color: "#292524", letterSpacing: "0.3em", marginTop: -16 }}>LOCKED</div>
        <div style={{ display: "flex", gap: 10, margin: "8px 0" }}>
          {[0, 1, 2, 3].map(function(i) { return <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: pinInput.length > i ? (pinError ? "#ef4444" : mc.accent) : "#1c1917", transition: "background 0.15s" }} />; })}
        </div>
        {pinError && <div style={{ fontSize: 11, color: "#ef4444", letterSpacing: "0.1em" }}>WRONG PIN</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "<"].map(function(k, i) {
            return (
              <button key={i} onClick={function() {
                if (!k) return;
                if (k === "<") { setPinInput(function(p) { return p.slice(0, -1); }); return; }
                var np = pinInput + k;
                setPinInput(np);
                if (np.length === 4) {
                  if (np === S.pin) { setLocked(false); setPinInput(""); setPinError(false); }
                  else { setPinError(true); setTimeout(function() { setPinInput(""); setPinError(false); }, 600); }
                }
              }} style={{ width: 68, height: 68, borderRadius: 12, background: k ? "#1c1917" : "transparent", border: k ? "1px solid #292524" : "none", color: "#e7e5e4", fontSize: 20, cursor: k ? "pointer" : "default", fontFamily: "'Bebas Neue',sans-serif", opacity: k ? 1 : 0 }}>
                {k}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: mc.bg, color: "#e7e5e4", fontFamily: "'DM Mono',monospace", transition: "background 1.5s, color 1.5s" }}>
      <style>{CSS}</style>

      {xpPops.map(function(p) {
        return <div key={p.id} className="xp-pop" style={{ borderColor: mc.accent + "44", color: mc.accent }}>{"+" + p.amt}</div>;
      })}

      {modal === "jarvis"  && <JarvisModal loading={jarvisLoading} text={typewritten} accent={mc.accent} onClose={function() { setModal(null); }} />}
      {modal === "grace"   && <GraceModal graceDaysLeft={MAX_GRACE - S.graceDaysUsed} onPick={useGrace} onClose={function() { setModal(null); }} mc={mc} />}
      {modal === "mission" && <MissionModal onAdd={function(n, d, w, e) { setS(function(s) { return Object.assign({}, s, { missions: s.missions.concat([{ id: Date.now(), name: n, date: d, why: w, emoji: e }]).sort(function(a, b) { return new Date(a.date) - new Date(b.date); }) }); }); setModal(null); }} onClose={function() { setModal(null); }} mc={mc} />}
      {modal === "habit"   && <HabitModal onAdd={function(l, ic, x) { setS(function(s) { return Object.assign({}, s, { habits: s.habits.concat([{ id: "c" + Date.now(), icon: ic, label: l, desc: "Custom directive.", xp: parseInt(x) || 10, locked: false }]) }); }); setModal(null); }} onClose={function() { setModal(null); }} mc={mc} />}
      {modal === "body"    && <BodyModal onLog={function(w, e, n) { setS(function(s) { return Object.assign({}, s, { bodyLog: s.bodyLog.concat([{ date: td, weight: w, energy: e, notes: n }]) }); }); setModal(null); }} onClose={function() { setModal(null); }} mc={mc} />}
      {modal === "goal"    && collapseRisk.phase !== "stabilization" && <GoalModal onAdd={createGoal} onClose={function() { setModal(null); }} mc={mc} />}
      {modal === "photo"   && <PhotoModal fortnightNum={Math.floor(S.dayCount / 14) + 1} onLog={function(n) { setS(function(s) { return Object.assign({}, s, { photoLog: s.photoLog.concat([{ date: td, note: n, fortnight: Math.floor(s.dayCount / 14) + 1 }]) }); }); setModal(null); }} onClose={function() { setModal(null); }} mc={mc} />}
      {modal === "pin"     && <PinModal onSet={function(p) { setS(function(s) { return Object.assign({}, s, { pin: p }); }); setModal(null); }} onClose={function() { setModal(null); }} mc={mc} />}
      {modal === "weekly"  && <WeeklyModal S={S} mc={mc} onClose={function() { setModal(null); }} />}
      {modal === "contracts" && <ContractsModal divergences={contractDivergences} mc={mc} onClose={function() { setModal(null); }} />}

      <header style={{ padding: "14px 16px 10px", borderBottom: "1px solid " + mc.border, background: mc.bg + "f0", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "flex-start", transition: "all 1.5s" }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 34, letterSpacing: "0.12em", color: "#e7e5e4", lineHeight: 1 }}>FORGE</div>
          <div style={{ fontSize: 9, color: mc.accent, letterSpacing: "0.2em", marginTop: 2, opacity: 0.7, transition: "color 1.5s" }}>{mc.label}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: "0.15em", color: level.color }}>{level.name}</div>
          <div style={{ fontSize: 9, color: "#44403c", letterSpacing: "0.08em" }}>{S.totalXP.toLocaleString() + " XP · DAY " + S.dayCount}</div>
          <div style={{ fontSize: 9, color: "#292524", letterSpacing: "0.08em" }}>{"STREAK " + S.streak}</div>
        </div>
      </header>

      {S.missions.length > 0 && (
        <div style={{ background: mc.cardBg, borderBottom: "1px solid " + mc.border, padding: "6px 14px", display: "flex", gap: 10, overflowX: "auto", transition: "all 1.5s" }}>
          {S.missions.map(function(m) {
            var d = daysUntil(m.date);
            return <div key={m.id} style={{ display: "inline-flex", alignItems: "center", fontSize: 10, color: "#78716c", background: mc.bg, border: "1px solid " + mc.border, borderRadius: 99, padding: "3px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>{m.emoji + " " + m.name + " "}<span style={{ color: d < 30 ? "#ef4444" : mc.accent, marginLeft: 6 }}>{d < 0 ? "PAST" : d + "d"}</span></div>;
          })}
        </div>
      )}

      <nav style={{ display: "flex", borderBottom: "1px solid " + mc.border, background: mc.bg + "e8", position: "sticky", top: 62, zIndex: 99, transition: "all 1.5s" }}>
        {[["today", "TODAY"], ["goals", "GOALS"], ["log", "LOG"], ["intel", "INTEL"], ["me", "ME"]].map(function(item) {
          return <button key={item[0]} onClick={function() { setView(item[0]); }} style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", color: view === item[0] ? mc.accent : "#44403c", cursor: "pointer", fontFamily: "inherit", fontSize: 9, letterSpacing: "0.12em", borderBottom: view === item[0] ? "2px solid " + mc.accent : "none", transition: "color 0.3s" }}>{item[1]}</button>;
        })}
      </nav>

      <main style={{ padding: 12, maxWidth: 600, margin: "0 auto", paddingBottom: 50 }}>
        {view === "today"  && <TodayView S={S} week={week} checks={checks} comments={comments} doneToday={doneToday} allDoneToday={allDoneToday} momentum={momentum} drift={drift} resistance={resistance} selfBetrayal={selfBetrayal} stateScore={stateScore} contractDivergences={contractDivergences} mc={mc} openComment={openComment} setOpenComment={setOpenComment} toggleHabit={toggleHabit} saveComment={saveComment} advanceDay={advanceDay} setModal={setModal} runJarvis={runJarvis} mode={mode} collapseRisk={collapseRisk} patternMatch={patternMatch} setS={setS} />}
        {view === "goals"  && <GoalsView S={S} mc={mc} toggleGoalItem={toggleGoalItem} refreshFocus={refreshFocus} removeGoal={function(gid) { setS(function(s) { return Object.assign({}, s, { goals: s.goals.filter(function(g) { return g.id !== gid; }) }); }); }} setModal={setModal} />}
        {view === "log"    && <LogView S={S} mc={mc} setModal={setModal} />}
        {view === "intel"  && <IntelView S={S} mc={mc} momentum={momentum} drift={drift} resistance={resistance} selfBetrayal={selfBetrayal} stateScore={stateScore} contractDivergences={contractDivergences} runJarvis={runJarvis} jarvisLoading={jarvisLoading} mode={mode} collapseRisk={collapseRisk} patternMatch={patternMatch} />}
        {view === "me"     && <MeView S={S} setS={setS} mc={mc} level={level} setModal={setModal} />}
      </main>
    </div>
  );
}

// ─── Today View ───────────────────────────────────────────────────────────────
function TodayView(props) {
  var S=props.S, week=props.week, checks=props.checks, comments=props.comments;
  var doneToday=props.doneToday, allDoneToday=props.allDoneToday, mc=props.mc;
  var momentum=props.momentum, drift=props.drift, resistance=props.resistance;
  var selfBetrayal=props.selfBetrayal, stateScore=props.stateScore;
  var contractDivergences=props.contractDivergences, mode=props.mode;
  var openComment=props.openComment, setOpenComment=props.setOpenComment;
  var toggleHabit=props.toggleHabit, saveComment=props.saveComment;
  var advanceDay=props.advanceDay, setModal=props.setModal, runJarvis=props.runJarvis;
  var collapseRisk=props.collapseRisk||{score:0,phase:"stable",signals:[]};
  var patternMatch=props.patternMatch, setS=props.setS;
  var isStabilization = collapseRisk.phase === "stabilization";
  var isWatch = collapseRisk.phase === "watch";
  var isDrift = collapseRisk.phase === "drift";
  var td = todayStr();

  if (isStabilization) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ background:"rgba(96,165,250,0.04)", border:"1px solid rgba(96,165,250,0.15)", borderRadius:8, padding:"14px 16px" }}>
          <div style={{ fontSize:9, color:"#60a5fa", letterSpacing:"0.2em", marginBottom:8 }}>STABILIZATION PROTOCOL ACTIVE</div>
          <div style={{ fontSize:12, color:"#78716c", lineHeight:1.8 }}>Current behavioral pattern resembles previous destabilization sequence. System complexity temporarily reduced until execution stability returns.</div>
          {patternMatch && <div style={{ fontSize:10, color:"#44403c", marginTop:8, lineHeight:1.6, borderLeft:"2px solid rgba(96,165,250,0.2)", paddingLeft:10 }}>{"Last similar pattern: "+patternMatch.date+" (score "+patternMatch.score+")"}</div>}
        </div>
        <div style={{ background:mc.cardBg, border:"1px solid "+mc.border, borderRadius:10, padding:14 }}>
          <div style={{ fontSize:9, letterSpacing:"0.2em", color:"#44403c", marginBottom:12 }}>GROUND YOURSELF. NOTHING ELSE.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {STABILIZATION_HABITS.map(function(h) {
              var done = !!checks[h.id];
              return (
                <div key={h.id} onClick={function(){ toggleHabit(h.id); }} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 10px", borderRadius:7, border:"1px solid "+(done?mc.accent+"33":mc.border), background:done?mc.accent+"06":mc.bg, cursor:"pointer" }}>
                  <div style={{ width:16,height:16,borderRadius:3,border:"1px solid "+(done?mc.accent:"#292524"),background:done?mc.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#000",flexShrink:0 }}>{done?"✓":""}</div>
                  <div style={{ fontSize:16 }}>{h.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:done?mc.accent:"#e7e5e4" }}>{h.label}</div>
                    <div style={{ fontSize:9, color:"#292524", marginTop:1 }}>{h.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={advanceDay} style={{ marginTop:12, width:"100%", padding:10, background:mc.accent+"11", border:"1px solid "+mc.accent+"33", borderRadius:7, color:mc.accent, fontSize:10, letterSpacing:"0.12em", cursor:"pointer", fontFamily:"inherit" }}>NEXT DAY</button>
        </div>
        <div style={{ fontSize:9, color:"#292524", textAlign:"center", letterSpacing:"0.08em", lineHeight:1.8 }}>Goal creation and system changes are disabled. Execute the five above. That is enough.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {collapseRisk.score > 0 && collapseRisk.phase !== "stable" && (
        <div style={{ background: isWatch?"rgba(251,146,60,0.04)":"rgba(120,113,108,0.04)", border:"1px solid "+(isWatch?"rgba(251,146,60,0.2)":"rgba(120,113,108,0.15)"), borderRadius:8, padding:"12px 14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ fontSize:9, color:isWatch?"#fb923c":"#78716c", letterSpacing:"0.15em" }}>{"COLLAPSE RISK — "+collapseRisk.score+" — "+collapseRisk.phase.toUpperCase()}</div>
            {(isWatch||isDrift) && S.awarenessAcknowledged !== td && (
              <button onClick={function(){ setS(function(s){ return Object.assign({},s,{awarenessAcknowledged:td}); }); }} style={{ padding:"3px 8px", background:"transparent", border:"1px solid rgba(120,113,108,0.3)", borderRadius:4, color:"#78716c", fontSize:8, cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.1em" }}>I SEE IT</button>
            )}
          </div>
          {collapseRisk.signals.slice(0,2).map(function(sig,i){ return <div key={i} style={{ fontSize:10, color:"#44403c", lineHeight:1.6, marginBottom:2 }}>{sig}</div>; })}
          {patternMatch && <div style={{ fontSize:9, color:"#44403c", marginTop:6, borderLeft:"2px solid rgba(120,113,108,0.2)", paddingLeft:8, lineHeight:1.6 }}>{"Pattern resembles destabilization sequence from "+patternMatch.date+"."}</div>}
        </div>
      )}

      {contractDivergences.length > 0 && (
        <div onClick={function() { setModal("contracts"); }} style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}>
          <div style={{ fontSize: 9, color: "#ef4444", letterSpacing: "0.15em", marginBottom: 4 }}>{"CONTRACT DIVERGENCE — " + contractDivergences.length + " PATTERN" + (contractDivergences.length > 1 ? "S" : "")}</div>
          <div style={{ fontSize: 11, color: "#78716c", lineHeight: 1.6 }}>{contractDivergences[0].note}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <PsychBar label="MOMENTUM" value={momentum} color={momentum > 60 ? "#10b981" : momentum > 35 ? mc.accent : "#ef4444"} mc={mc} />
        <PsychBar label="DRIFT" value={drift} color={drift > 60 ? "#ef4444" : drift > 30 ? mc.accent : "#10b981"} mc={mc} invert />
        <PsychBar label="RESISTANCE" value={resistance} color={resistance > 60 ? "#ef4444" : resistance > 30 ? mc.accent : "#10b981"} mc={mc} invert />
        <PsychBar label="SELF-BETRAYAL" value={selfBetrayal} color={selfBetrayal > 60 ? "#ef4444" : selfBetrayal > 30 ? mc.accent : "#10b981"} mc={mc} invert />
      </div>

      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c" }}>{"DIRECTIVES — WEEK " + week}</span>
          <span style={{ fontSize: 11, color: allDoneToday ? mc.accent : "#44403c" }}>{doneToday + "/" + S.habits.length}</span>
        </div>
        {allDoneToday && <div style={{ background: mc.accent + "11", border: "1px solid " + mc.accent + "33", borderRadius: 6, padding: "8px 10px", fontSize: 10, color: mc.accent, letterSpacing: "0.06em", marginBottom: 10 }}>ALL DIRECTIVES COMPLETE</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {S.habits.map(function(h) {
            var done = !!checks[h.id];
            var isOpen = openComment === h.id;
            return (
              <div key={h.id} style={{ display: "flex", flexDirection: "column", padding: "9px 10px", borderRadius: 7, border: "1px solid " + (done ? mc.accent + "22" : mc.border), background: done ? mc.accent + "06" : mc.bg, cursor: "pointer", borderLeft: done ? "2px solid " + mc.accent : "2px solid transparent", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }} onClick={function() { toggleHabit(h.id); }}>
                  <div style={{ width: 17, height: 17, borderRadius: 3, border: "1px solid " + (done ? mc.accent : "#292524"), background: done ? mc.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000", fontWeight: "bold", flexShrink: 0, marginTop: 1 }}>{done ? "✓" : ""}</div>
                  <div style={{ fontSize: 15, flexShrink: 0, marginTop: 0 }}>{h.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: done ? mc.accent : "#e7e5e4" }}>{h.label}</div>
                    <div style={{ fontSize: 9, color: "#292524", marginTop: 1, lineHeight: 1.5 }}>{h.desc}</div>
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: done ? mc.accent : "#1f1f1d", flexShrink: 0 }}>{"+" + h.xp}</div>
                </div>
                <div style={{ paddingLeft: 36, marginTop: 5 }}>
                  <button onClick={function(e) { e.stopPropagation(); setOpenComment(isOpen ? null : h.id); }} style={{ background: "none", border: "none", color: "#292524", fontSize: 9, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em", padding: 0 }}>
                    {comments[h.id] ? (isOpen ? "close" : "note *") : (isOpen ? "close" : "add note")}
                  </button>
                  {isOpen && (
                    <textarea value={comments[h.id] || ""} onChange={function(e) { saveComment(h.id, e.target.value); }} onClick={function(e) { e.stopPropagation(); }} placeholder="Be honest. The mirror only works if you stop performing for it." style={{ width: "100%", marginTop: 5, padding: "8px 10px", background: mc.bg, border: "1px solid " + mc.border, borderRadius: 5, color: "#78716c", fontSize: 10, fontFamily: "inherit", outline: "none", resize: "none", height: 56, lineHeight: 1.6 }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={advanceDay} style={{ flex: 1, padding: 11, background: mc.accent + "11", border: "1px solid " + mc.accent + "33", borderRadius: 7, color: mc.accent, fontSize: 10, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "inherit" }}>NEXT DAY</button>
          <button onClick={function() { setModal("grace"); }} style={{ padding: "11px 14px", background: "transparent", border: "1px solid " + mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit" }}>MISSED DAY</button>
        </div>
      </div>

      <button onClick={function() { runJarvis("daily check-in"); }} style={{ padding: 13, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)", borderRadius: 8, color: "#60a5fa", fontSize: 10, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "inherit", width: "100%", animation: "pulseGlow 4s ease infinite" }}>
        CALL JARVIS
      </button>

      {S.missions.length > 0 && (
        <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c" }}>MISSIONS</span>
            <button onClick={function() { setModal("mission"); }} style={{ padding: "4px 8px", background: "transparent", border: "1px solid " + mc.border, borderRadius: 4, color: "#44403c", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>+ ADD</button>
          </div>
          {S.missions.map(function(m) {
            var d = daysUntil(m.date);
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid " + mc.border }}>
                <div style={{ fontSize: 20 }}>{m.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#e7e5e4" }}>{m.name}</div>
                  <div style={{ fontSize: 9, color: "#44403c", fontStyle: "italic", marginTop: 1 }}>{'"' + m.why + '"'}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: d < 30 ? "#ef4444" : mc.accent }}>{d < 0 ? "PAST" : d + "d"}</div>
              </div>
            );
          })}
        </div>
      )}
      {S.missions.length === 0 && (
        <button onClick={function() { setModal("mission"); }} style={{ padding: 11, background: "transparent", border: "1px dashed " + mc.border, borderRadius: 8, color: "#292524", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit", width: "100%" }}>+ ADD MISSION</button>
      )}
    </div>
  );
}

// ─── Psych Bar ────────────────────────────────────────────────────────────────
function PsychBar(props) {
  var label=props.label, value=props.value, color=props.color, mc=props.mc, invert=props.invert;
  return (
    <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 8, letterSpacing: "0.15em", color: "#44403c" }}>{label}</span>
        <span style={{ fontSize: 10, color: color, fontFamily: "'Bebas Neue',sans-serif" }}>{value}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: value + "%", background: color, borderRadius: 99, transition: "width 0.8s ease, background 1s" }} />
      </div>
      {invert && value > 50 && <div style={{ fontSize: 8, color: color, marginTop: 4, opacity: 0.7 }}>elevated</div>}
      {!invert && value < 40 && <div style={{ fontSize: 8, color: color, marginTop: 4, opacity: 0.7 }}>low</div>}
    </div>
  );
}

// ─── Goals View ───────────────────────────────────────────────────────────────
function GoalsView(props) {
  var S=props.S, mc=props.mc, toggleGoalItem=props.toggleGoalItem;
  var refreshFocus=props.refreshFocus, removeGoal=props.removeGoal, setModal=props.setModal;
  var [activeGoal, setActiveGoal] = useState(null);
  var [tab, setTab] = useState("plan");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c" }}>AI GOAL EXPANDER</span>
        <button onClick={function() { setModal("goal"); }} style={{ padding: "8px 14px", background: mc.accent + "11", border: "1px solid " + mc.accent + "33", borderRadius: 6, color: mc.accent, fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit" }}>+ NEW GOAL</button>
      </div>
      {S.goals.length === 0 && <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: "20px 14px", textAlign: "center", fontSize: 11, color: "#292524" }}>No goals. Add one and JARVIS builds the plan.</div>}
      {S.goals.map(function(g) {
        var done = Object.values(g.checks || {}).filter(Boolean).length;
        var total = (g.plan || []).length;
        var isActive = activeGoal === g.id;
        var pct = total > 0 ? Math.round(done / total * 100) : 0;
        return (
          <div key={g.id} style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={function() { setActiveGoal(isActive ? null : g.id); }}>
              <div>
                <div style={{ fontSize: 13, color: "#e7e5e4", fontWeight: 500 }}>{g.name}</div>
                <div style={{ fontSize: 9, color: "#44403c", marginTop: 2 }}>{g.description}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 10, color: pct >= 70 ? "#10b981" : mc.accent }}>{done + "/" + total}</div>
                <div style={{ fontSize: 11, color: "#44403c" }}>{isActive ? "▲" : "▼"}</div>
              </div>
            </div>
            {!g.planLoading && total > 0 && <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: pct >= 70 ? "#10b981" : mc.accent, borderRadius: 99, transition: "width 0.5s" }} /></div>}
            {isActive && (
              <div style={{ marginTop: 14 }}>
                {g.planLoading ? <div style={{ color: "#44403c", fontSize: 12, padding: "10px 0" }}>Generating plan...</div> : (
                  <div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                      {[["plan", "FULL PLAN"], ["today", "TODAY"]].map(function(t) {
                        return <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ padding: "5px 10px", background: tab === t[0] ? mc.accent + "11" : "transparent", border: "1px solid " + (tab === t[0] ? mc.accent + "33" : mc.border), borderRadius: 5, color: tab === t[0] ? mc.accent : "#44403c", fontSize: 9, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.1em" }}>{t[1]}</button>;
                      })}
                      <button onClick={function() { refreshFocus(g.id); }} style={{ padding: "5px 10px", background: "transparent", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 5, color: "#60a5fa", fontSize: 9, cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>{g.dailyFocusLoading ? "..." : "REFRESH"}</button>
                    </div>
                    {tab === "plan" && <GoalItems items={g.plan || []} checks={g.checks || {}} onToggle={function(id) { toggleGoalItem(g.id, id); }} mc={mc} />}
                    {tab === "today" && (g.dailyFocus ? <GoalItems items={g.dailyFocus} checks={g.checks || {}} onToggle={function(id) { toggleGoalItem(g.id, id); }} mc={mc} /> : <div style={{ fontSize: 11, color: "#292524", padding: "8px 0" }}>Hit REFRESH for today adjusted focus.</div>)}
                  </div>
                )}
                <button onClick={function() { removeGoal(g.id); }} style={{ marginTop: 12, width: "100%", padding: 9, background: "transparent", border: "1px solid #7f1d1d", borderRadius: 7, color: "#f87171", fontSize: 9, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.1em" }}>REMOVE GOAL</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GoalItems(props) {
  var items=props.items, checks=props.checks, onToggle=props.onToggle, mc=props.mc;
  var grouped = {};
  items.forEach(function(item) { if (!grouped[item.category]) grouped[item.category] = []; grouped[item.category].push(item); });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Object.entries(grouped).map(function(entry) {
        return (
          <div key={entry[0]}>
            <div style={{ fontSize: 8, color: "#44403c", letterSpacing: "0.2em", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid " + mc.border }}>{entry[0].toUpperCase()}</div>
            {entry[1].map(function(item) {
              var done = !!checks[item.id];
              return (
                <div key={item.id} onClick={function() { onToggle(item.id); }} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid " + mc.border, cursor: "pointer", opacity: done ? 0.4 : 1 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, border: "1px solid " + (done ? mc.accent : "#292524"), background: done ? mc.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#000", flexShrink: 0, marginTop: 1 }}>{done ? "✓" : ""}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: done ? "#78716c" : "#d6d3d1", textDecoration: done ? "line-through" : "none", lineHeight: 1.5 }}>{item.task}</div>
                    <div style={{ fontSize: 9, color: "#44403c", marginTop: 2, fontStyle: "italic" }}>{item.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Log View ─────────────────────────────────────────────────────────────────
function LogView(props) {
  var S=props.S, mc=props.mc, setModal=props.setModal;
  var entries = Object.entries(S.history).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c" }}>MISSION LOG</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[["weekly", "WEEK"], ["photo", "PHOTO"], ["body", "BODY"]].map(function(item) {
            return <button key={item[0]} onClick={function() { setModal(item[0]); }} style={{ padding: "4px 8px", background: "transparent", border: "1px solid " + mc.border, borderRadius: 4, color: "#44403c", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>{item[1]}</button>;
          })}
        </div>
      </div>
      {entries.length === 0 && <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 20, textAlign: "center", fontSize: 11, color: "#292524" }}>No entries yet.</div>}
      {entries.map(function(entry) {
        var date=entry[0], data=entry[1];
        var done = S.habits.filter(function(h) { return data.checks && data.checks[h.id]; }).length;
        var pct = Math.round(done / S.habits.length * 100);
        var hasComments = Object.values(data.comments || {}).some(Boolean);
        return (
          <div key={date} style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: hasComments ? 8 : 0 }}>
              <div style={{ fontSize: 10, color: "#44403c", width: 82, flexShrink: 0 }}>{date}</div>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: pct === 100 ? mc.accent : pct >= 50 ? "#3b82f6" : "#292524", borderRadius: 99 }} /></div>
              <div style={{ fontSize: 10, color: "#44403c", minWidth: 28, textAlign: "right" }}>{done + "/" + S.habits.length}</div>
              <div style={{ fontSize: 10, color: mc.accent, minWidth: 40, textAlign: "right" }}>{"+" + (data.xpEarned || 0)}</div>
            </div>
            {hasComments && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {Object.entries(data.comments || {}).filter(function(e) { return e[1]; }).map(function(e) {
                  var h = S.habits.find(function(x) { return x.id === e[0]; });
                  return <div key={e[0]} style={{ fontSize: 10, color: "#44403c", lineHeight: 1.6 }}><span style={{ color: "#57534e" }}>{(h ? h.icon + " " + h.label : "") + ":"}</span>{" " + e[1]}</div>;
                })}
              </div>
            )}
          </div>
        );
      })}
      {S.photoLog && S.photoLog.length > 0 && (
        <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 10 }}>PROGRESS SNAPSHOTS</div>
          {S.photoLog.slice().reverse().map(function(p, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid " + mc.border, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: mc.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📸</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#44403c" }}>{"Fortnight " + p.fortnight + " · " + p.date}</div>
                  <div style={{ fontSize: 11, color: "#d6d3d1", marginTop: 2 }}>{p.note || "No notes."}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Intel View ───────────────────────────────────────────────────────────────
function IntelView(props) {
  var S=props.S, mc=props.mc, momentum=props.momentum, drift=props.drift;
  var resistance=props.resistance, selfBetrayal=props.selfBetrayal, stateScore=props.stateScore;
  var contractDivergences=props.contractDivergences, runJarvis=props.runJarvis;
  var jarvisLoading=props.jarvisLoading, mode=props.mode;
  var hist = Object.values(S.history);
  var perfect = hist.filter(function(d) { return S.habits.every(function(h) { return d.checks && d.checks[h.id]; }); }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 12 }}>PSYCHOLOGICAL STATE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <PsychBar label="MOMENTUM" value={momentum} color={momentum > 60 ? "#10b981" : momentum > 35 ? mc.accent : "#ef4444"} mc={mc} />
          <PsychBar label="DRIFT" value={drift} color={drift > 60 ? "#ef4444" : drift > 30 ? mc.accent : "#10b981"} mc={mc} invert />
          <PsychBar label="RESISTANCE" value={resistance} color={resistance > 60 ? "#ef4444" : resistance > 30 ? mc.accent : "#10b981"} mc={mc} invert />
          <PsychBar label="SELF-BETRAYAL" value={selfBetrayal} color={selfBetrayal > 60 ? "#ef4444" : selfBetrayal > 30 ? mc.accent : "#10b981"} mc={mc} invert />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: mc.bg, borderRadius: 6, border: "1px solid " + mc.border, marginBottom:6 }}>
          <span style={{ fontSize: 9, color: "#44403c", letterSpacing: "0.1em" }}>INFERRED MODE</span>
          <span style={{ fontSize: 9, color: mc.accent, letterSpacing: "0.15em", fontWeight: "bold" }}>{props.mode.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: mc.bg, borderRadius: 6, border: "1px solid " + mc.border }}>
          <span style={{ fontSize: 9, color: "#44403c", letterSpacing: "0.1em" }}>COLLAPSE RISK</span>
          <span style={{ fontSize: 9, color: props.collapseRisk&&props.collapseRisk.score>54?"#ef4444":props.collapseRisk&&props.collapseRisk.score>34?"#fb923c":"#10b981", letterSpacing: "0.15em" }}>{(props.collapseRisk?props.collapseRisk.score:0)+" / "+props.collapseRisk.phase.toUpperCase()}</span>
        </div>
      </div>

      {contractDivergences.length > 0 && (
        <div style={{ background: mc.cardBg, border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#ef4444", marginBottom: 10 }}>INTEGRITY CONTRACT DIVERGENCES</div>
          {contractDivergences.map(function(d) {
            var contract = INTEGRITY_CONTRACTS.find(function(c) { return c.id === d.contract; });
            return (
              <div key={d.contract} style={{ padding: "10px 0", borderBottom: "1px solid " + mc.border }}>
                <div style={{ fontSize: 9, color: "#ef4444", letterSpacing: "0.1em", marginBottom: 4 }}>{"CONTRACT " + d.contract + ": " + (contract ? contract.short.toUpperCase() : "")}</div>
                <div style={{ fontSize: 11, color: "#78716c", lineHeight: 1.6 }}>{d.note}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 12 }}>BEHAVIORAL DATA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
          {[["DAYS LOGGED", hist.length], ["PERFECT DAYS", perfect], ["BEST STREAK", S.longestStreak + "d"], ["GRACE USED", S.graceDaysUsed + "/" + MAX_GRACE]].map(function(item) {
            return (
              <div key={item[0]} style={{ background: mc.bg, border: "1px solid " + mc.border, borderRadius: 7, padding: 10, textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#e7e5e4" }}>{item[1]}</div>
                <div style={{ fontSize: 8, color: "#44403c", letterSpacing: "0.12em", marginTop: 2 }}>{item[0]}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 10 }}>CALL JARVIS</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[["Weekly Review", "weekly review"], ["Pattern Scan", "deep pattern analysis including comment language"], ["Trajectory", "behavioral trend projection — where does current trajectory lead in 30 days"]].map(function(item) {
            return <button key={item[0]} onClick={function() { runJarvis(item[1]); }} disabled={jarvisLoading} style={{ padding: "8px 12px", background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)", borderRadius: 6, color: "#60a5fa", fontSize: 9, letterSpacing: "0.08em", cursor: "pointer", fontFamily: "inherit" }}>{item[0]}</button>;
          })}
        </div>
        {S.jarvisInsights.length === 0 ? (
          <div style={{ fontSize: 11, color: "#292524", textAlign: "center", padding: "10px 0" }}>No analyses yet.</div>
        ) : (
          S.jarvisInsights.map(function(ins, i) {
            return (
              <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid " + mc.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 8, color: mc.accent, letterSpacing: "0.12em" }}>{ins.trigger.toUpperCase()}</div>
                  <div style={{ fontSize: 8, color: "#292524" }}>{ins.date + (ins.mode ? " · " + ins.mode.toUpperCase() : "")}</div>
                </div>
                <div style={{ fontSize: 11, color: "#78716c", lineHeight: 1.8 }}>{ins.msg}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Me View ──────────────────────────────────────────────────────────────────
function MeView(props) {
  var S=props.S, setS=props.setS, mc=props.mc, level=props.level, setModal=props.setModal;
  var [confirmReset, setConfirmReset] = useState(false);
  var [exportDone, setExportDone] = useState(false);
  var [showImport, setShowImport] = useState(false);
  var [importTxt, setImportTxt] = useState("");
  var consPct = S.lifetimePossible > 0 ? Math.round(S.lifetimeChecks / S.lifetimePossible * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: "0.1em", color: "#e7e5e4", lineHeight: 1 }}>{S.username}</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: level.color, letterSpacing: "0.2em", marginTop: 4 }}>{level.name}</div>
        <div style={{ fontSize: 9, color: "#44403c", marginTop: 8 }}>{"XP: " + S.totalXP.toLocaleString() + " · Consistency: " + consPct + "% · Day: " + S.dayCount}</div>
        <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: consPct + "%", background: level.color, borderRadius: 99 }} />
        </div>
      </div>

      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 10 }}>INTEGRITY CONTRACTS</div>
        {INTEGRITY_CONTRACTS.map(function(c) {
          return (
            <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid " + mc.border }}>
              <div style={{ fontSize: 9, color: "#57534e", letterSpacing: "0.08em", marginBottom: 2 }}>{"#" + c.id + " — " + c.short.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: "#44403c", lineHeight: 1.6 }}>{c.full}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c" }}>DIRECTIVES</span>
          <button onClick={function() { setModal("habit"); }} style={{ padding: "4px 8px", background: "transparent", border: "1px solid " + mc.border, borderRadius: 4, color: "#44403c", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>+ ADD</button>
        </div>
        {S.habits.map(function(h) {
          return (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid " + mc.border }}>
              <span style={{ fontSize: 15 }}>{h.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#d6d3d1" }}>{h.label}</div>
                <div style={{ fontSize: 9, color: "#44403c" }}>{"+" + h.xp + " XP" + (h.locked ? " · CORE" : "")}</div>
              </div>
              {!h.locked && <button onClick={function() { setS(function(s) { return Object.assign({}, s, { habits: s.habits.filter(function(x) { return x.id !== h.id; }) }); }); }} style={{ padding: "3px 7px", background: "transparent", border: "1px solid #7f1d1d", borderRadius: 4, color: "#f87171", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>X</button>}
            </div>
          );
        })}
      </div>

      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 10 }}>SECURITY</div>
        <button onClick={function() { setModal("pin"); }} style={{ padding: "9px 14px", background: "transparent", border: "1px solid " + mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit" }}>{S.pin ? "CHANGE PIN" : "SET PIN"}</button>
        {S.pin && <button onClick={function() { setS(function(s) { return Object.assign({}, s, { pin: null }); }); }} style={{ marginLeft: 8, padding: "9px 14px", background: "transparent", border: "1px solid #7f1d1d", borderRadius: 7, color: "#f87171", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>REMOVE PIN</button>}
      </div>

      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 10 }}>CROSS-DEVICE</div>
        <div style={{ fontSize: 10, color: "#44403c", lineHeight: 1.8, marginBottom: 12 }}>Config only — not progress. Each device runs independently.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={function() { var cfg = { habits: S.habits, username: S.username, missions: S.missions }; if (navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(cfg)); setExportDone(true); setTimeout(function() { setExportDone(false); }, 2000); }} style={{ padding: "9px 14px", background: mc.accent + "11", border: "1px solid " + mc.accent + "33", borderRadius: 7, color: mc.accent, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>{exportDone ? "COPIED" : "COPY CONFIG"}</button>
          <button onClick={function() { setShowImport(!showImport); }} style={{ padding: "9px 14px", background: "transparent", border: "1px solid " + mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>IMPORT</button>
        </div>
        {showImport && (
          <div style={{ marginTop: 10 }}>
            <textarea value={importTxt} onChange={function(e) { setImportTxt(e.target.value); }} placeholder="Paste config JSON here..." style={{ width: "100%", padding: "8px 10px", background: mc.bg, border: "1px solid " + mc.border, borderRadius: 6, color: "#d6d3d1", fontSize: 11, fontFamily: "inherit", outline: "none", height: 60, resize: "vertical" }} />
            <button onClick={function() { try { var cfg = JSON.parse(importTxt); if (cfg.habits) { setS(function(s) { return Object.assign({}, s, { habits: cfg.habits, username: cfg.username || s.username, missions: cfg.missions || s.missions }); }); setShowImport(false); setImportTxt(""); } } catch(e) { alert("Invalid config."); } }} style={{ marginTop: 8, width: "100%", padding: 9, background: mc.accent + "11", border: "1px solid " + mc.accent + "33", borderRadius: 7, color: mc.accent, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>APPLY</button>
          </div>
        )}
      </div>

      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#ef4444", marginBottom: 10 }}>DANGER ZONE</div>
        {!confirmReset ? (
          <button onClick={function() { setConfirmReset(true); }} style={{ width: "100%", padding: 9, background: "transparent", border: "1px solid #7f1d1d", borderRadius: 7, color: "#f87171", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>RESET ALL PROGRESS</button>
        ) : (
          <div>
            <div style={{ fontSize: 11, color: "#f87171", marginBottom: 10 }}>This wipes everything. No undo.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={function() { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }} style={{ padding: "9px 14px", background: "transparent", border: "1px solid #7f1d1d", borderRadius: 7, color: "#f87171", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>YES, RESET</button>
              <button onClick={function() { setConfirmReset(false); }} style={{ padding: "9px 14px", background: "transparent", border: "1px solid " + mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function JarvisModal(props) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0a0d12", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 12, padding: 20, maxWidth: 480, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(96,165,250,0.1)" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: "0.2em", color: "#60a5fa" }}>J.A.R.V.I.S</div>
            <div style={{ fontSize: 8, color: "#1d4ed8", letterSpacing: "0.2em" }}>BEHAVIORAL INFERENCE ENGINE</div>
          </div>
          {!props.loading && <button onClick={props.onClose} style={{ padding: "5px 10px", background: "transparent", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 5, color: "#60a5fa", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>DISMISS</button>}
        </div>
        {props.loading ? (
          <div style={{ color: "#44403c", fontSize: 12, padding: "20px 0", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ animation: "pulseGlow 1s ease infinite" }}>●</span> Analyzing patterns...
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#93c5fd", lineHeight: 1.9, whiteSpace: "pre-wrap", fontFamily: "'DM Mono',monospace" }}>{props.text}<span style={{ animation: "blink 1s step-end infinite" }}>|</span></div>
        )}
      </div>
    </div>
  );
}

function ContractsModal(props) {
  var divergences=props.divergences, mc=props.mc;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: mc.cardBg, border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20, maxWidth: 440, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ fontSize: 9, color: "#ef4444", letterSpacing: "0.2em", marginBottom: 16 }}>INTEGRITY CONTRACT DIVERGENCES</div>
        {divergences.map(function(d) {
          var contract = INTEGRITY_CONTRACTS.find(function(c) { return c.id === d.contract; });
          return (
            <div key={d.contract} style={{ padding: "12px 0", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
              <div style={{ fontSize: 9, color: "#ef4444", letterSpacing: "0.12em", marginBottom: 6 }}>{"CONTRACT #" + d.contract}</div>
              <div style={{ fontSize: 11, color: "#e7e5e4", marginBottom: 6, fontStyle: "italic" }}>{contract ? contract.short : ""}</div>
              <div style={{ fontSize: 11, color: "#78716c", lineHeight: 1.7 }}>{d.note}</div>
              {contract && <div style={{ fontSize: 10, color: "#44403c", marginTop: 8, lineHeight: 1.6, borderLeft: "2px solid rgba(239,68,68,0.2)", paddingLeft: 10 }}>{contract.full}</div>}
            </div>
          );
        })}
        <button onClick={props.onClose} style={{ marginTop: 14, width: "100%", padding: 9, background: "transparent", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, color: "#f87171", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>ACKNOWLEDGED</button>
      </div>
    </div>
  );
}

function WeeklyModal(props) {
  var S=props.S, mc=props.mc;
  var entries = Object.entries(S.history).sort(function(a, b) { return a[0] < b[0] ? 1 : -1; }).slice(0, 7);
  if (entries.length === 0) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 12, padding: 20, maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 11, color: "#44403c", textAlign: "center", padding: "20px 0" }}>Not enough data yet.</div>
        <button onClick={props.onClose} style={{ width: "100%", padding: 9, background: "transparent", border: "1px solid " + mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CLOSE</button>
      </div>
    </div>
  );
  var total = entries.reduce(function(s, e) { return s + S.habits.filter(function(h) { return e[1].checks && e[1].checks[h.id]; }).length; }, 0);
  var pct = Math.round(total / (entries.length * S.habits.length) * 100);
  var grade = pct >= 90 ? "S" : pct >= 75 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "D";
  var gc = { S: "#f59e0b", A: "#10b981", B: "#3b82f6", C: "#8b5cf6", D: "#ef4444" }[grade];
  var perfect = entries.filter(function(e) { return S.habits.every(function(h) { return e[1].checks && e[1].checks[h.id]; }); }).length;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: mc.cardBg, border: "1px solid " + mc.border, borderRadius: 12, padding: 20, maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 16 }}>WEEKLY SCORECARD</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: 12, background: mc.bg, borderRadius: 8, border: "1px solid " + mc.border }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: gc, lineHeight: 1 }}>{grade}</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: "#e7e5e4" }}>{pct + "%"}</div>
            <div style={{ fontSize: 9, color: "#44403c", letterSpacing: "0.1em" }}>{"LAST " + entries.length + " DAYS"}</div>
            <div style={{ fontSize: 9, color: "#44403c", marginTop: 2 }}>{perfect + " perfect days"}</div>
          </div>
        </div>
        {S.habits.map(function(h) {
          var rate = Math.round(entries.filter(function(e) { return e[1].checks && e[1].checks[h.id]; }).length / entries.length * 100);
          return (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{h.icon}</span>
              <div style={{ flex: 1, fontSize: 10, color: "#d6d3d1" }}>{h.label}</div>
              <div style={{ fontSize: 10, color: rate >= 70 ? "#10b981" : rate >= 40 ? mc.accent : "#ef4444", width: 36, textAlign: "right" }}>{rate + "%"}</div>
            </div>
          );
        })}
        <button onClick={props.onClose} style={{ marginTop: 14, width: "100%", padding: 9, background: "transparent", border: "1px solid " + mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CLOSE</button>
      </div>
    </div>
  );
}

function GraceModal(props) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: props.mc.cardBg, border: "1px solid " + props.mc.border, borderRadius: 12, padding: 20, maxWidth: 380, width: "100%" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 6 }}>WHY DID YOU MISS?</div>
        <div style={{ fontSize: 10, color: "#44403c", marginBottom: 16, lineHeight: 1.7 }}>{props.graceDaysLeft + " grace days remaining."}</div>
        {GRACE_REASONS.map(function(r) {
          return <button key={r.id} onClick={function() { props.onPick(r.id); }} style={{ display: "block", width: "100%", padding: 11, background: props.mc.bg, border: "1px solid " + (r.valid ? props.mc.border : "#7f1d1d"), borderRadius: 7, color: r.valid ? "#d6d3d1" : "#f87171", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 7, textAlign: "left" }}>{r.label}</button>;
        })}
        <button onClick={props.onClose} style={{ width: "100%", padding: 9, background: "transparent", border: "1px solid " + props.mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
      </div>
    </div>
  );
}

function SimpleModal(props) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: props.mc.cardBg, border: "1px solid " + props.mc.border, borderRadius: 12, padding: 20, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        {props.children}
      </div>
    </div>
  );
}

function MissionModal(props) {
  var [n, setN] = useState(""); var [d, setD] = useState(""); var [w, setW] = useState(""); var [e, setE] = useState("🎯");
  return (
    <SimpleModal mc={props.mc} onClose={props.onClose}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 16 }}>NEW MISSION</div>
      {[["Name", n, setN, "Fashion Show"], ["Date YYYY-MM-DD", d, setD, "2027-02-01"], ["Why", w, setW, "This is what I am building for."], ["Emoji", e, setE, "🎯"]].map(function(f) {
        return <div key={f[0]} style={{ marginBottom: 10 }}><div style={{ fontSize: 8, color: "#44403c", letterSpacing: "0.15em", marginBottom: 4 }}>{f[0].toUpperCase()}</div><input value={f[1]} onChange={function(ev) { f[2](ev.target.value); }} placeholder={f[3]} style={{ width: "100%", padding: "8px 10px", background: props.mc.bg, border: "1px solid " + props.mc.border, borderRadius: 5, color: "#d6d3d1", fontSize: 11, fontFamily: "inherit", outline: "none" }} /></div>;
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={function() { if (n && d) props.onAdd(n, d, w, e); }} style={{ flex: 1, padding: 10, background: props.mc.accent + "11", border: "1px solid " + props.mc.accent + "33", borderRadius: 7, color: props.mc.accent, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>ADD</button>
        <button onClick={props.onClose} style={{ padding: "10px 14px", background: "transparent", border: "1px solid " + props.mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
      </div>
    </SimpleModal>
  );
}

function HabitModal(props) {
  var [l, setL] = useState(""); var [ic, setIc] = useState("⚡"); var [x, setX] = useState("15");
  return (
    <SimpleModal mc={props.mc} onClose={props.onClose}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 16 }}>NEW DIRECTIVE</div>
      {[["Name", l, setL, "Cold Plunge"], ["Icon", ic, setIc, "⚡"], ["XP", x, setX, "15"]].map(function(f) {
        return <div key={f[0]} style={{ marginBottom: 10 }}><div style={{ fontSize: 8, color: "#44403c", letterSpacing: "0.15em", marginBottom: 4 }}>{f[0].toUpperCase()}</div><input value={f[1]} onChange={function(ev) { f[2](ev.target.value); }} placeholder={f[3]} style={{ width: "100%", padding: "8px 10px", background: props.mc.bg, border: "1px solid " + props.mc.border, borderRadius: 5, color: "#d6d3d1", fontSize: 11, fontFamily: "inherit", outline: "none" }} /></div>;
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={function() { if (l) props.onAdd(l, ic, x); }} style={{ flex: 1, padding: 10, background: props.mc.accent + "11", border: "1px solid " + props.mc.accent + "33", borderRadius: 7, color: props.mc.accent, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>ADD</button>
        <button onClick={props.onClose} style={{ padding: "10px 14px", background: "transparent", border: "1px solid " + props.mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
      </div>
    </SimpleModal>
  );
}

function BodyModal(props) {
  var [w, setW] = useState(""); var [e, setE] = useState("7"); var [n, setN] = useState("");
  return (
    <SimpleModal mc={props.mc} onClose={props.onClose}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 16 }}>BODY CHECK-IN</div>
      {[["Weight kg", w, setW, "72"], ["Energy 1-10", e, setE, "7"], ["Notes", n, setN, "Feeling leaner..."]].map(function(f) {
        return <div key={f[0]} style={{ marginBottom: 10 }}><div style={{ fontSize: 8, color: "#44403c", letterSpacing: "0.15em", marginBottom: 4 }}>{f[0].toUpperCase()}</div><input value={f[1]} onChange={function(ev) { f[2](ev.target.value); }} placeholder={f[3]} style={{ width: "100%", padding: "8px 10px", background: props.mc.bg, border: "1px solid " + props.mc.border, borderRadius: 5, color: "#d6d3d1", fontSize: 11, fontFamily: "inherit", outline: "none" }} /></div>;
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={function() { props.onLog(w, e, n); }} style={{ flex: 1, padding: 10, background: props.mc.accent + "11", border: "1px solid " + props.mc.accent + "33", borderRadius: 7, color: props.mc.accent, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>LOG</button>
        <button onClick={props.onClose} style={{ padding: "10px 14px", background: "transparent", border: "1px solid " + props.mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
      </div>
    </SimpleModal>
  );
}

function GoalModal(props) {
  var [name, setName] = useState(""); var [desc, setDesc] = useState("");
  return (
    <SimpleModal mc={props.mc} onClose={props.onClose}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 6 }}>NEW GOAL</div>
      <div style={{ fontSize: 10, color: "#44403c", marginBottom: 14, lineHeight: 1.7 }}>JARVIS generates a full actionable plan. Be specific.</div>
      {[["Goal", name, setName, "Build lean aesthetic body"], ["Context", desc, setDesc, "72kg, no gym, fashion show Feb 2027"]].map(function(f) {
        return <div key={f[0]} style={{ marginBottom: 10 }}><div style={{ fontSize: 8, color: "#44403c", letterSpacing: "0.15em", marginBottom: 4 }}>{f[0].toUpperCase()}</div><input value={f[1]} onChange={function(ev) { f[2](ev.target.value); }} placeholder={f[3]} style={{ width: "100%", padding: "8px 10px", background: props.mc.bg, border: "1px solid " + props.mc.border, borderRadius: 5, color: "#d6d3d1", fontSize: 11, fontFamily: "inherit", outline: "none" }} /></div>;
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={function() { if (name) props.onAdd(name, desc); }} style={{ flex: 1, padding: 10, background: props.mc.accent + "11", border: "1px solid " + props.mc.accent + "33", borderRadius: 7, color: props.mc.accent, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>GENERATE PLAN</button>
        <button onClick={props.onClose} style={{ padding: "10px 14px", background: "transparent", border: "1px solid " + props.mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
      </div>
    </SimpleModal>
  );
}

function PhotoModal(props) {
  var [note, setNote] = useState("");
  return (
    <SimpleModal mc={props.mc} onClose={props.onClose}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 6 }}>{"FORTNIGHT " + props.fortnightNum + " SNAPSHOT"}</div>
      <div style={{ fontSize: 10, color: "#44403c", marginBottom: 14, lineHeight: 1.7 }}>Take a photo now. Save it to your camera roll. Add honest notes here.</div>
      <div style={{ background: props.mc.bg, border: "1px solid " + props.mc.border, borderRadius: 8, padding: 16, textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 30, marginBottom: 4 }}>📸</div>
        <div style={{ fontSize: 9, color: "#44403c", letterSpacing: "0.1em" }}>TAKE YOUR PHOTO NOW</div>
      </div>
      <textarea value={note} onChange={function(e) { setNote(e.target.value); }} placeholder="What do you see? What changed? What still needs work?" style={{ width: "100%", padding: "8px 10px", background: props.mc.bg, border: "1px solid " + props.mc.border, borderRadius: 6, color: "#78716c", fontSize: 10, fontFamily: "inherit", outline: "none", height: 80, resize: "none" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={function() { props.onLog(note); }} style={{ flex: 1, padding: 10, background: props.mc.accent + "11", border: "1px solid " + props.mc.accent + "33", borderRadius: 7, color: props.mc.accent, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>LOG SNAPSHOT</button>
        <button onClick={props.onClose} style={{ padding: "10px 14px", background: "transparent", border: "1px solid " + props.mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
      </div>
    </SimpleModal>
  );
}

function PinModal(props) {
  var [pin1, setPin1] = useState(""); var [pin2, setPin2] = useState(""); var [stage, setStage] = useState(1); var [err, setErr] = useState("");
  var current = stage === 1 ? pin1 : pin2;
  function handleKey(k) {
    if (k === "<") { stage === 1 ? setPin1(function(p) { return p.slice(0, -1); }) : setPin2(function(p) { return p.slice(0, -1); }); return; }
    var np = current + k;
    stage === 1 ? setPin1(np) : setPin2(np);
    if (np.length === 4) {
      if (stage === 1) { setStage(2); }
      else { if (np === pin1) { props.onSet(pin1); } else { setErr("PINs do not match."); setPin1(""); setPin2(""); setStage(1); setTimeout(function() { setErr(""); }, 1500); } }
    }
  }
  return (
    <SimpleModal mc={props.mc} onClose={props.onClose}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#44403c", marginBottom: 16 }}>{stage === 1 ? "SET PIN" : "CONFIRM PIN"}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
        {[0, 1, 2, 3].map(function(i) { return <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: current.length > i ? props.mc.accent : "#1c1917", transition: "background 0.15s" }} />; })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "<"].map(function(k, i) {
          return <button key={i} onClick={function() { if (k) handleKey(k); }} style={{ height: 52, borderRadius: 8, background: k ? "#1c1917" : "transparent", border: k ? "1px solid #292524" : "none", color: "#e7e5e4", fontSize: 16, cursor: k ? "pointer" : "default", fontFamily: "'Bebas Neue',sans-serif", opacity: k ? 1 : 0 }}>{k}</button>;
        })}
      </div>
      {err && <div style={{ fontSize: 10, color: "#ef4444", textAlign: "center", marginBottom: 8 }}>{err}</div>}
      <button onClick={props.onClose} style={{ width: "100%", padding: 9, background: "transparent", border: "1px solid " + props.mc.border, borderRadius: 7, color: "#44403c", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
    </SimpleModal>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
var CSS = [
  "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');",
  "* { box-sizing:border-box; margin:0; padding:0; }",
  "::-webkit-scrollbar { width:2px; }",
  "::-webkit-scrollbar-thumb { background:#1c1917; }",
  ".xp-pop { position:fixed; top:16%; right:12px; border:1px solid; font-weight:bold; font-size:14px; padding:7px 12px; border-radius:6px; z-index:999; animation:fadeUp 2s ease forwards; pointer-events:none; font-family:'DM Mono',monospace; letter-spacing:0.05em; }",
  "@keyframes fadeUp { 0%{opacity:1;transform:translateY(0)} 60%{opacity:1} 100%{opacity:0;transform:translateY(-30px)} }",
  "@keyframes pulseGlow { 0%,100%{opacity:0.5} 50%{opacity:1} }",
  "@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }",
  "button:active { transform:scale(0.97); }",
].join(" ");
