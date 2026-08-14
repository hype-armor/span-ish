/* The game layer: regions, stages, XP, streak, level and quests.
 *
 * Everything here is a *readout of the review state*, never a parallel score.
 * That is deliberate. Gamification only helps when it points at real learning;
 * where it becomes its own currency it competes with the thing it was meant to
 * encourage (see docs/learning-design.md, "The game layer"). So:
 *
 *   - XP is paid for retrievals that were actually scheduled. Replaying
 *     material that is not due earns a token amount and says so.
 *   - The streak counts days you did the work the scheduler asked for, not
 *     days you opened the app.
 *   - Level comes from how much material is mature, which no amount of
 *     grinding easy cards can move.
 *
 * Pure functions over a plain object, so tools/test-lib.js can drive them
 * without a browser. This module must not import the decks: it is loaded by
 * the tests, and the decks need window.MX.
 */

/* ---------- the map ---------- */

/* Each region is one of the old tabs. `mod` is its deck in src/lib/decks.js,
   which is also what review history is keyed under, so nothing moves. */
export const REGIONS = [
  {
    id: "rules", mod: "rules", name: "Los Cimientos", en: "Foundations", glyph: "◆",
    blurb: "The rules by themselves, before you have to apply them to anything.",
    signature: "rapid",
  },
  {
    id: "suffix", mod: "suffix", name: "La Fragua", en: "The Forge", glyph: "⚒",
    blurb: "Fifteen ending swaps turn English you already own into Spanish you never studied.",
    signature: "forge",
  },
  {
    id: "sound", mod: "sound", name: "El Oído", en: "The Ear", glyph: "♪",
    blurb: "Five vowels, no reduction, no silent endings — then write down what you hear.",
    signature: "ear",
  },
  {
    id: "verbs", mod: "verbs", name: "Los Verbos", en: "The Verbs", glyph: "▲",
    blurb: "Irregularity is a closed list. Produce the forms inside sentences.",
    signature: "rapid",
  },
  {
    id: "past", mod: "past", name: "El Pasado", en: "The Past", glyph: "◐",
    blurb: "One past tense does most of the work, and the other one sets the scene.",
    signature: "ambush",
  },
  {
    id: "periphrasis", mod: "periphrasis", name: "Los Atajos", en: "The Shortcuts", glyph: "→",
    blurb: "Ten helper-verb patterns stand in for most of the tense system.",
    signature: "rapid",
  },
  {
    id: "subjunctive", mod: "subjunctive", name: "El Subjuntivo", en: "The Subjunctive", glyph: "✦",
    blurb: "Don't reason about mood mid-sentence. Match the phrase.",
    signature: "ambush",
  },
  {
    id: "gender", mod: "gender", name: "El o La", en: "Gender", glyph: "◑",
    blurb: "The ending settles it nearly every time; the leftovers are a famous short list.",
    signature: "ambush",
  },
  {
    id: "mexicanismos", mod: "mexicanismos", name: "La Calle", en: "The Street", glyph: "★",
    blurb: "The words your textbook got wrong, because it was written for Spain.",
    signature: "rapid",
  },
  {
    id: "connectors", mod: "connectors", name: "La Plática", en: "The Talk", glyph: "◇",
    blurb: "Fluency is mostly stalling, well executed.",
    signature: "rapid",
  },
  {
    id: "arena", mod: "mixed", name: "La Arena", en: "The Arena", glyph: "✷",
    blurb: "Everything at once, drawn by decay. This is the one that never finishes.",
    signature: "rapid", endless: true,
  },
];

export const REGION_IDS = REGIONS.map((r) => r.id);
export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

/* How the missions escalate. Every region runs the same four, with its own
   signature mode in the second slot, so the shape of a region is learnable
   while what it demands of you is not the same everywhere. */
export const MODES = {
  plain: {
    id: "plain", name: "Reconocimiento", en: "Recon",
    note: "No timer, no penalty. Meet the material.",
  },
  rapid: {
    id: "rapid", name: "Relámpago", en: "Lightning",
    note: "A clock on the choices, and a combo that climbs while you stay right.",
  },
  ambush: {
    id: "ambush", name: "Emboscada", en: "Ambush",
    note: "Two forms, both real. Pick fast — left or right.",
  },
  forge: {
    /* Not "La Fragua": that is the region's own name, and a mission header
       reading "La Fragua · LA FRAGUA" says one thing twice. */
    id: "forge", name: "El Yunque", en: "The Anvil",
    note: "Strike the English word into its Spanish shape.",
  },
  ear: {
    id: "ear", name: "Al Oído", en: "By Ear",
    note: "Audio only. Spell exactly what you hear.",
  },
  sudden: {
    id: "sudden", name: "Muerte Súbita", en: "Sudden Death",
    note: "One miss ends the run. How deep can you get?",
  },
  boss: {
    id: "boss", name: "El Jefe", en: "Boss",
    note: "Built from the items you keep missing. Right answers wound it; misses heal it.",
  },
};

/* A timer only ever runs on cards you answer by choosing. Putting a clock on
   a typed retrieval trades the thing the app is for against a bit of drama. */
export const TIMED_MODES = new Set(["rapid", "ambush"]);

export function stagesFor(region) {
  const long = region.endless;
  return [
    { id: "recon", mode: "plain", size: long ? 12 : 6 },
    { id: "signature", mode: region.signature, size: long ? 14 : 8 },
    { id: "sudden", mode: "sudden", size: long ? 24 : 14 },
    { id: "boss", mode: "boss", size: long ? 14 : 10 },
  ].map((s, i) => ({
    ...s,
    index: i,
    name: MODES[s.mode].name,
    en: MODES[s.mode].en,
    note: MODES[s.mode].note,
  }));
}

/* ---------- mastery, which is what the level is made of ---------- */

/* An item's standing, read straight off its scheduling state. `shaky` is a
   card that has lapsed back to zero: it has been met, and it is not learned. */
export function rankOf(item) {
  if (!item || (item.right || 0) + (item.wrong || 0) === 0) return "unseen";
  if (item.streak === 0) return "shaky";
  const days = item.interval || 0;
  if (days >= 60) return "burnished";
  if (days >= 21) return "mature";
  if (days >= 8) return "solid";
  return "learning";
}

export const RANKS = ["unseen", "shaky", "learning", "solid", "mature", "burnished"];
export const RANK_LABEL = {
  unseen: "unmet", shaky: "shaky", learning: "learning",
  solid: "solid", mature: "mature", burnished: "burnished",
};
const RANK_WEIGHT = { unseen: 0, shaky: 1, learning: 2, solid: 4, mature: 7, burnished: 10 };

/* The only number the level is derived from. Grinding an easy card cannot
   raise it: every step needs a longer interval, and intervals only lengthen
   by being recalled after a real gap. */
export function masteryPoints(items, ids) {
  let points = 0;
  for (const id of ids) points += RANK_WEIGHT[rankOf(items[id])] || 0;
  return points;
}

export const levelFor = (points) => 1 + Math.floor(Math.sqrt(Math.max(0, points) / 12));
export const pointsForLevel = (level) => 12 * (level - 1) * (level - 1);

/* Where you are between this level and the next, 0..1. */
export function levelProgress(points) {
  const level = levelFor(points);
  const floor = pointsForLevel(level);
  const ceiling = pointsForLevel(level + 1);
  return { level, points, floor, ceiling, fraction: (points - floor) / (ceiling - floor) };
}

export const RANK_NAMES = [
  "Turista", "Principiante", "Aprendiz", "Estudiante", "Practicante",
  "Conversador", "Hablante", "Fluido", "Veterano", "Maestro",
];
export const titleFor = (level) => RANK_NAMES[Math.min(RANK_NAMES.length - 1, Math.floor((level - 1) / 2))];

/* How much of a region is standing up. */
export function regionMastery(items, ids) {
  const counts = { unseen: 0, shaky: 0, learning: 0, solid: 0, mature: 0, burnished: 0 };
  for (const id of ids) counts[rankOf(items[id])]++;
  const total = ids.length || 1;
  const held = counts.solid + counts.mature + counts.burnished;
  return { counts, total, held, fraction: held / total, met: total - counts.unseen };
}

/* ---------- days ---------- */

const pad = (n) => (n < 10 ? "0" + n : String(n));
export function dayKey(now) {
  const d = new Date(now);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* Whole days between two day keys, counted on the calendar rather than in
   milliseconds so a clock change or a daylight-saving shift cannot cost
   somebody their streak. */
export function daysBetween(fromKey, toKey) {
  if (!fromKey || !toKey) return Infinity;
  const parse = (k) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(toKey) - parse(fromKey)) / 864e5);
}

/* ---------- the saved shape ---------- */

export const DAILY_GOAL = 15;
export const MAX_FREEZES = 2;
const FREEZE_EVERY = 7; // days of streak per banked grace day

export function freshDay(key) {
  return {
    key,
    xp: 0,
    due: 0, // scheduled items answered right — what the goal is measured in
    answers: 0,
    missions: 0,
    flawless: 0,
    boss: 0,
    combo: 0, // the best combo reached today
    ear: 0,
    forge: 0,
    goalMet: false,
  };
}

export function freshGame(now = 0) {
  return {
    /* Whether the app still owes an explanation of itself. Set false the
       first time somebody is shown one. */
    intro: true,
    xp: 0,
    today: freshDay(dayKey(now)),
    streak: { count: 0, best: 0, last: null, freezes: 1 },
    regions: {},
    badges: [],
    settings: { motion: "full", sound: true, haptics: true },
  };
}

/* Anything on disk was written by an older version, so nothing is trusted. */
export function normaliseGame(raw, now = 0) {
  const base = freshGame(now);
  if (!raw || typeof raw !== "object") return base;

  const today = raw.today && typeof raw.today === "object" ? raw.today : {};
  const streak = raw.streak && typeof raw.streak === "object" ? raw.streak : {};

  const regions = {};
  for (const [id, entry] of Object.entries(raw.regions || {})) {
    if (!regionById(id)) continue; // a region that no longer exists
    const stages = {};
    for (const [stageId, s] of Object.entries((entry && entry.stages) || {})) {
      stages[stageId] = {
        cleared: !!(s && s.cleared),
        best: Number(s && s.best) || 0,
        runs: Number(s && s.runs) || 0,
      };
    }
    regions[id] = { stages };
  }

  const settings = raw.settings && typeof raw.settings === "object" ? raw.settings : {};

  return {
    intro: raw.intro !== false,
    xp: Number(raw.xp) || 0,
    today: { ...freshDay(String(today.key || base.today.key)), ...numeric(today) },
    streak: {
      count: Number(streak.count) || 0,
      best: Number(streak.best) || Number(streak.count) || 0,
      last: typeof streak.last === "string" ? streak.last : null,
      freezes: clamp(Number(streak.freezes) || 0, 0, MAX_FREEZES),
    },
    regions,
    badges: Array.isArray(raw.badges) ? raw.badges.filter((b) => typeof b === "string") : [],
    settings: {
      motion: settings.motion === "reduced" ? "reduced" : "full",
      sound: settings.sound !== false,
      haptics: settings.haptics !== false,
    },
  };
}

function numeric(today) {
  const out = {};
  for (const [k, v] of Object.entries(today)) {
    if (k === "key") continue;
    if (k === "goalMet") out[k] = !!v;
    else if (typeof v === "number" && isFinite(v)) out[k] = v;
  }
  return out;
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* A new calendar day wipes the day's counters. The streak is left alone —
   it is only ever moved by meeting the goal, and whether it is still alive is
   a question `streakStatus` answers by looking at the date. */
export function rollDay(game, now) {
  const key = dayKey(now);
  if (game.today.key === key) return game;
  return { ...game, today: freshDay(key) };
}

/* ---------- XP ---------- */

/* An item that has never been seen counts as due: meeting new material is the
   work, not a way around it. An item you are revisiting early is not. */
export const XP_DUE = 10;
export const XP_EARLY = 2;
export const XP_MISS = 1; // a miss with feedback still teaches — Kornell et al. (2009)

export const comboMultiplier = (combo) => 1 + Math.min(3, Math.floor(combo / 3));

export function xpForAnswer({ right, wasDue, combo }) {
  if (!right) return XP_MISS;
  if (!wasDue) return XP_EARLY;
  return XP_DUE * comboMultiplier(combo);
}

/* Under this share of scheduled material, a run is practice rather than
   review. It still counts for learning, and the app says so rather than
   quietly paying out as though the work had been the same. */
export const CRAM_THRESHOLD = 0.25;
export const isCram = (answers) =>
  answers.length > 0 && answers.filter((a) => a.wasDue).length / answers.length < CRAM_THRESHOLD;

/* ---------- recording a finished mission ---------- */

/* `answers` are what the mission produced: { id, right, wasDue }. `run` is
   what the mission itself did: which mode, whether it was clean. */
export function recordMission(game, { answers, mode, region, stage, score, now }) {
  let next = rollDay(game, now);
  const day = { ...next.today };

  let combo = 0;
  let best = 0;
  let xp = 0;
  for (const answer of answers) {
    combo = answer.right ? combo + 1 : 0;
    best = Math.max(best, combo);
    xp += xpForAnswer({ right: answer.right, wasDue: answer.wasDue, combo: combo - 1 });
    if (answer.right && answer.wasDue) day.due += 1;
  }
  if (isCram(answers)) xp = Math.round(xp / 4);

  const flawless = answers.length > 0 && answers.every((a) => a.right);
  if (flawless) xp += 15;

  day.answers += answers.length;
  day.missions += 1;
  day.xp += xp;
  day.combo = Math.max(day.combo, best);
  if (flawless) day.flawless += 1;
  if (mode === "boss" && score && score.won) day.boss += 1;
  if (mode === "ear") day.ear += answers.filter((a) => a.right).length;
  if (mode === "forge") day.forge += answers.filter((a) => a.right).length;

  next = { ...next, xp: next.xp + xp, today: day };

  /* A stage is cleared by finishing it — but the modes that can be lost have
     to actually be survived, or sudden death would be cleared by dying on the
     first card. */
  const cleared = !(score && score.won === false);
  next = markStage(next, region, stage, { cleared, best: Math.max(0, (score && score.value) || 0) });

  if (!day.goalMet && day.due >= DAILY_GOAL) {
    next = markGoal(next, now);
  }

  return { game: next, xp, combo: best, flawless, cram: isCram(answers) };
}

export function markStage(game, regionId, stageId, { cleared, best }) {
  const region = game.regions[regionId] || { stages: {} };
  const prev = region.stages[stageId] || { cleared: false, best: 0, runs: 0 };
  return {
    ...game,
    regions: {
      ...game.regions,
      [regionId]: {
        ...region,
        stages: {
          ...region.stages,
          [stageId]: {
            cleared: prev.cleared || !!cleared,
            best: Math.max(prev.best, best || 0),
            runs: prev.runs + 1,
          },
        },
      },
    },
  };
}

/* ---------- the streak ---------- */

/* Met the day's goal. Called at most once a day; calling it again is a no-op,
   which is what keeps a second mission from advancing the streak twice. */
export function markGoal(game, now) {
  const key = dayKey(now);
  const streak = game.streak;
  if (streak.last === key) return { ...game, today: { ...game.today, goalMet: true } };

  const gap = daysBetween(streak.last, key);
  let count;
  let freezes = streak.freezes;

  if (gap === 1) {
    count = streak.count + 1;
  } else if (gap === 2 && freezes > 0) {
    /* One missed day is spent rather than fatal. A streak that shatters on the
       first bad day stops being something worth protecting. */
    count = streak.count + 1;
    freezes -= 1;
  } else {
    count = 1;
  }

  if (count > 0 && count % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);

  return {
    ...game,
    today: { ...game.today, goalMet: true },
    streak: { count, best: Math.max(streak.best, count), last: key, freezes },
  };
}

/* Whether the streak on file is still standing, without changing it. */
export function streakStatus(game, now) {
  const { count, last, freezes } = game.streak;
  if (!last || count === 0) return { count: 0, alive: false, atRisk: false };
  const gap = daysBetween(last, dayKey(now));
  if (gap === 0) return { count, alive: true, atRisk: false };
  if (gap === 1) return { count, alive: true, atRisk: true };
  if (gap === 2 && freezes > 0) return { count, alive: true, atRisk: true, thawing: true };
  return { count: 0, alive: false, atRisk: false, lost: count };
}

/* ---------- what is open ---------- */

const STAGES_TO_ADVANCE = 2;

export const stagesCleared = (game, regionId) =>
  Object.values((game.regions[regionId] || { stages: {} }).stages).filter((s) => s.cleared).length;

/* A region opens when the one before it has been worked, not finished — the
   point is to stay just past what you can already do, not to gate progress
   behind mastery you will only reach weeks later. */
export function unlockedRegions(game) {
  const open = new Set([REGIONS[0].id]);
  const ordinary = REGIONS.filter((r) => !r.endless);

  for (let i = 1; i < ordinary.length; i++) {
    const before = ordinary[i - 1];
    if (open.has(before.id) && stagesCleared(game, before.id) >= STAGES_TO_ADVANCE) {
      open.add(ordinary[i].id);
    }
  }

  /* The Arena interleaves everything, so it needs a few regions behind it
     before it can mean anything. */
  const worked = ordinary.filter((r) => stagesCleared(game, r.id) >= STAGES_TO_ADVANCE).length;
  if (worked >= 4) open.add("arena");

  return open;
}

export function stageOpen(game, regionId, index) {
  if (index === 0) return true;
  const stages = stagesFor(regionById(regionId));
  const before = stages[index - 1];
  return !!((game.regions[regionId] || { stages: {} }).stages[before.id] || {}).cleared;
}

/* ---------- daily quests ---------- */

const QUEST_POOL = [
  { id: "due12", track: "due", target: 12, text: "Clear 12 scheduled items" },
  { id: "due25", track: "due", target: 25, text: "Clear 25 scheduled items" },
  { id: "flawless1", track: "flawless", target: 1, text: "Finish a mission without a miss" },
  { id: "boss1", track: "boss", target: 1, text: "Beat a boss" },
  { id: "combo8", track: "combo", target: 8, text: "Reach a run of 8 right in a row" },
  { id: "combo12", track: "combo", target: 12, text: "Reach a run of 12 right in a row" },
  { id: "ear4", track: "ear", target: 4, text: "Spell 4 dictation items correctly" },
  { id: "forge6", track: "forge", target: 6, text: "Forge 6 words from their English ending" },
  { id: "missions3", track: "missions", target: 3, text: "Finish 3 missions" },
];

/* Deterministic from the date, so the day's quests are the same every time the
   app is opened and nothing has to be persisted to keep them still. */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function questsFor(key, count = 3) {
  const pool = [...QUEST_POOL];
  const out = [];
  let seed = hash(key);
  while (out.length < count && pool.length) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const [quest] = pool.splice(seed % pool.length, 1);
    /* Two quests measuring the same counter would move together, which reads
       as one quest drawn twice. */
    if (out.some((q) => q.track === quest.track)) continue;
    out.push(quest);
  }
  return out;
}

export function questProgress(game, quest) {
  const have = game.today[quest.track] || 0;
  return { ...quest, have, done: have >= quest.target, fraction: Math.min(1, have / quest.target) };
}

/* ---------- badges ---------- */

/* Awarded for things that took real work, and never for opening the app. */
export const BADGES = [
  { id: "first", text: "First mission", of: (s) => s.missions >= 1 },
  { id: "flawless", text: "A mission without a single miss", of: (s) => s.flawless >= 1 },
  { id: "boss", text: "First boss down", of: (s) => s.bosses >= 1 },
  { id: "week", text: "Seven days of clearing the queue", of: (s) => s.streak >= 7 },
  { id: "month", text: "Thirty days of clearing the queue", of: (s) => s.streak >= 30 },
  { id: "level5", text: "Level 5", of: (s) => s.level >= 5 },
  { id: "level10", text: "Level 10", of: (s) => s.level >= 10 },
  { id: "hundred", text: "A hundred items mature", of: (s) => s.mature >= 100 },
  { id: "cartographer", text: "Every region open", of: (s) => s.unlocked >= REGIONS.length },
  { id: "clean", text: "Nothing overdue", of: (s) => s.met > 40 && s.due === 0 },
];

export function awardBadges(game, snapshot) {
  const held = new Set(game.badges);
  const won = BADGES.filter((b) => !held.has(b.id) && b.of(snapshot));
  if (!won.length) return { game, won: [] };
  return { game: { ...game, badges: [...game.badges, ...won.map((b) => b.id)] }, won };
}

/* ---------- merging two devices ---------- */

/* Same rule as the review history in src/lib/merge.js: counters take the
   larger side so merging the same export twice changes nothing the second
   time, and the streak belongs to whichever device reported the later day. */
export function mergeGame(mine, theirs) {
  if (!theirs) return mine;
  if (!mine) return theirs;

  const regions = { ...mine.regions };
  for (const [id, entry] of Object.entries(theirs.regions || {})) {
    const here = regions[id] || { stages: {} };
    const stages = { ...here.stages };
    for (const [stageId, s] of Object.entries(entry.stages || {})) {
      const was = stages[stageId] || { cleared: false, best: 0, runs: 0 };
      stages[stageId] = {
        cleared: was.cleared || s.cleared,
        best: Math.max(was.best || 0, s.best || 0),
        runs: Math.max(was.runs || 0, s.runs || 0),
      };
    }
    regions[id] = { stages };
  }

  const newerStreak =
    daysBetween(mine.streak.last, theirs.streak.last) > 0 ? theirs.streak : mine.streak;

  return {
    /* Explained on either device is explained. */
    intro: mine.intro && theirs.intro,
    xp: Math.max(mine.xp, theirs.xp),
    /* The day's counters are local to a device and to a date; taking the
       larger of two different days would invent a day that never happened. */
    today: mine.today.key === theirs.today.key
      ? mergeDay(mine.today, theirs.today)
      : mine.today,
    streak: {
      count: newerStreak.count,
      best: Math.max(mine.streak.best, theirs.streak.best),
      last: newerStreak.last,
      freezes: Math.max(mine.streak.freezes, theirs.streak.freezes),
    },
    regions,
    badges: [...new Set([...mine.badges, ...theirs.badges])],
    settings: mine.settings,
  };
}

function mergeDay(mine, theirs) {
  const out = { ...mine };
  for (const key of Object.keys(mine)) {
    if (key === "key") continue;
    if (key === "goalMet") out[key] = mine[key] || theirs[key];
    else out[key] = Math.max(mine[key] || 0, theirs[key] || 0);
  }
  return out;
}
