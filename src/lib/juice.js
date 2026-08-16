/* Feedback you feel: tones, taps, and a burst of particles.
 *
 * Everything is synthesised or drawn at runtime. Nothing here loads a file, so
 * the app stays a directory of text that works offline on first run — adding
 * a folder of mp3s would have been the easy version and the wrong one.
 *
 * All of it is optional. `prefers-reduced-motion` and the in-app settings both
 * silence it, and nothing in the drill depends on any of it having happened.
 */

let ctx = null;
let enabled = { sound: true, haptics: true };

export function configure(settings) {
  enabled = {
    sound: settings.sound !== false,
    haptics: settings.haptics !== false,
  };
}

/* Browsers refuse an AudioContext until the user has interacted, so it is
   built on the first note rather than at load, and a refusal is not an error
   worth surfacing. */
function audio() {
  if (!enabled.sound) return null;
  if (ctx) return ctx;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

function tone(freq, { at = 0, length = 0.12, gain = 0.06, type = "sine", slideTo = null } = {}) {
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});

  const start = c.currentTime + at;
  const osc = c.createOscillator();
  const amp = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);

  /* A hard start or stop on a gain node clicks; the ramps are the difference
     between a note and a pop. */
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length);

  osc.connect(amp).connect(c.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

function buzz(pattern) {
  if (!enabled.haptics) return;
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* a browser that exposes vibrate and then refuses it is not a problem */
  }
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C major, no thirds to clash

export const sfx = {
  /* Rises with the combo, so twelve in a row sounds different from two. */
  right(combo = 0) {
    const step = SCALE[Math.min(SCALE.length - 1, Math.floor(combo / 2))];
    tone(step, { length: 0.1, gain: 0.05, type: "triangle" });
    tone(step * 1.5, { at: 0.055, length: 0.11, gain: 0.035, type: "sine" });
    buzz(12);
  },
  wrong() {
    tone(196, { length: 0.2, gain: 0.05, type: "sawtooth", slideTo: 138 });
    buzz([16, 40, 16]);
  },
  tick() {
    tone(1200, { length: 0.03, gain: 0.02, type: "square" });
  },
  hit() {
    tone(320, { length: 0.09, gain: 0.06, type: "square", slideTo: 180 });
    buzz(20);
  },
  clear() {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, { at: i * 0.075, length: 0.16, gain: 0.05, type: "triangle" }));
    buzz([18, 50, 26]);
  },
  levelUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, { at: i * 0.09, length: 0.3, gain: 0.055, type: "triangle" }),
    );
    buzz([24, 60, 24, 60, 40]);
  },
  fail() {
    [392, 329.63, 261.63].forEach((f, i) => tone(f, { at: i * 0.12, length: 0.26, gain: 0.05, type: "sine" }));
    buzz([30, 60, 60]);
  },
};

/* ---------- particles ---------- */

const TAU = Math.PI * 2;

/* A one-shot burst on a canvas that already exists. Runs on
   requestAnimationFrame and removes itself; there is no particle system to
   keep alive between missions. */
export function burst(canvas, { x, y, count = 46, hue = 214, still = false }) {
  if (!canvas) return;
  const g = canvas.getContext("2d");
  if (!g) return;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  const bits = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * TAU + Math.random() * 0.4;
    const speed = 2.2 + Math.random() * 4.4;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.6,
      life: 1,
      decay: 0.012 + Math.random() * 0.016,
      size: 2 + Math.random() * 3.5,
      hue: hue + (Math.random() * 40 - 20),
    };
  });

  /* With motion turned down the burst still happens — it just does not move.
     A single fading ring reads as "something good" without animating. */
  if (still) {
    g.clearRect(0, 0, w, h);
    for (const b of bits) {
      g.globalAlpha = 0.5;
      g.fillStyle = `hsl(${b.hue} 70% 55%)`;
      g.beginPath();
      g.arc(x + b.vx * 9, y + b.vy * 9, b.size, 0, TAU);
      g.fill();
    }
    setTimeout(() => g.clearRect(0, 0, w, h), 420);
    return;
  }

  let raf = 0;
  const step = () => {
    g.clearRect(0, 0, w, h);
    let alive = false;
    for (const b of bits) {
      if (b.life <= 0) continue;
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.16; // gravity
      b.vx *= 0.985;
      b.life -= b.decay;
      /* Checked again after the decrement, not only before it. A particle that
         died this frame has a negative life, and arc() throws on a negative
         radius rather than drawing nothing — which aborts the rest of the
         frame along with it. */
      if (b.life <= 0) continue;
      alive = true;
      g.globalAlpha = b.life;
      g.fillStyle = `hsl(${b.hue} 72% 56%)`;
      g.beginPath();
      g.arc(b.x, b.y, b.size * b.life, 0, TAU);
      g.fill();
    }
    if (alive) raf = requestAnimationFrame(step);
    else g.clearRect(0, 0, w, h);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
