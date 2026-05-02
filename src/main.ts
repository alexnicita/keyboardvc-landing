import { Factory, StaveConnector } from 'vexflow/bravura';

type ScoreSection = {
  treble: string;
  bass: string;
  audioTreble: string[];
  audioBass: string[][];
};

type PianoSample = {
  note: string;
  midi: number;
  url: string;
};

type PortfolioCompany = {
  name: string;
  url?: string;
};

type ScoreCue = {
  noteId: string;
  offset: number;
  duration: number;
  weight: number;
};

type ScoreScrollCue = {
  offset: number;
  x: number;
};

type ScoreScrollRange = {
  startX: number;
  endX: number;
};

const scoreSections: ScoreSection[] = [
  {
    treble:
      'g#4/16, c#5/16, e5/16, g#5/16, c#6/16, e6/16, g#6/16, e6/16, c#6/16, g#5/16, e5/16, c#5/16, g#4/16, e4/16, c#4/16, e4/16',
    bass: '(c#3 c#2)/q, g#2/q, c#3/q, g#2/q',
    audioTreble: ['g#4', 'c#5', 'e5', 'g#5', 'c#6', 'e6', 'g#6', 'e6', 'c#6', 'g#5', 'e5', 'c#5', 'g#4', 'e4', 'c#4', 'e4'],
    audioBass: [['c#2', 'c#3'], ['g#2'], ['c#3'], ['g#2']]
  },
  {
    treble:
      'g#4/16, b#4/16, d#5/16, g#5/16, b#5/16, d#6/16, f#6/16, d#6/16, b#5/16, g#5/16, d#5/16, b#4/16, g#4/16, d#4/16, b#3/16, d#4/16',
    bass: '(g#2 g#1)/q, d#2/q, g#2/q, d#2/q',
    audioTreble: ['g#4', 'b#4', 'd#5', 'g#5', 'b#5', 'd#6', 'f#6', 'd#6', 'b#5', 'g#5', 'd#5', 'b#4', 'g#4', 'd#4', 'b#3', 'd#4'],
    audioBass: [['g#1', 'g#2'], ['d#2'], ['g#2'], ['d#2']]
  },
  {
    treble:
      'f#4/16, a4/16, c#5/16, f#5/16, a5/16, c#6/16, f#6/16, c#6/16, a5/16, f#5/16, c#5/16, a4/16, f#4/16, c#4/16, a3/16, c#4/16',
    bass: '(f#2 f#1)/q, c#2/q, f#2/q, c#2/q',
    audioTreble: ['f#4', 'a4', 'c#5', 'f#5', 'a5', 'c#6', 'f#6', 'c#6', 'a5', 'f#5', 'c#5', 'a4', 'f#4', 'c#4', 'a3', 'c#4'],
    audioBass: [['f#1', 'f#2'], ['c#2'], ['f#2'], ['c#2']]
  },
  {
    treble:
      'e4/16, g#4/16, b4/16, e5/16, g#5/16, b5/16, e6/16, b5/16, g#5/16, e5/16, b4/16, g#4/16, e4/16, b3/16, g#3/16, b3/16',
    bass: '(e2 e1)/q, b1/q, e2/q, b1/q',
    audioTreble: ['e4', 'g#4', 'b4', 'e5', 'g#5', 'b5', 'e6', 'b5', 'g#5', 'e5', 'b4', 'g#4', 'e4', 'b3', 'g#3', 'b3'],
    audioBass: [['e1', 'e2'], ['b1'], ['e2'], ['b1']]
  },
  {
    treble:
      'd#4/16, f#4/16, a4/16, d#5/16, f#5/16, a5/16, d#6/16, a5/16, f#5/16, d#5/16, a4/16, f#4/16, d#4/16, a3/16, f#3/16, a3/16',
    bass: '(d#2 d#1)/q, a1/q, d#2/q, a1/q',
    audioTreble: ['d#4', 'f#4', 'a4', 'd#5', 'f#5', 'a5', 'd#6', 'a5', 'f#5', 'd#5', 'a4', 'f#4', 'd#4', 'a3', 'f#3', 'a3'],
    audioBass: [['d#1', 'd#2'], ['a1'], ['d#2'], ['a1']]
  }
];

const portfolioCompanies: PortfolioCompany[] = [
  { name: 'Astro Mechanica', url: 'https://www.astromecha.co/' },
  { name: 'Spectre Aerospace', url: 'https://www.specteraerospace.com/' },
  { name: 'Machina Labs', url: 'https://www.machinalabs.ai/' },
  { name: 'Rainbow', url: 'https://rainbow.me/' },
  { name: 'Rox', url: 'https://www.rox.com/' }
];
const moonlightTempo = 156;
const sixteenthDuration = 60 / moonlightTempo / 4;
const scoreLoopPause = 0.82;
const scoreSmoothingMs = 58;
const pianoSampleNotes = [
  'D#1',
  'F#1',
  'A1',
  'C2',
  'D#2',
  'F#2',
  'A2',
  'C3',
  'F#3',
  'A3',
  'C4',
  'D#4',
  'F#4',
  'A4',
  'C5',
  'D#5',
  'F#5',
  'A5',
  'C6',
  'D#6',
  'F#6',
  'A6'
];
const pianoSamples: PianoSample[] = pianoSampleNotes.map((note) => ({
  note,
  midi: noteToMidi(note) ?? 60,
  url: `/audio/salamander/${encodeURIComponent(note)}v8.ogg`
}));
let scoreCues: ScoreCue[] = [];
let scoreScrollCues: ScoreScrollCue[] = [];
let scoreScrollRange: ScoreScrollRange | null = null;
let scoreFontLoadPromise: Promise<void> | null = null;
let scoreRenderPromise: Promise<void> | null = null;

const playButton = document.querySelector<HTMLButtonElement>('#play-button');
const portfolioButton = document.querySelector<HTMLButtonElement>('#portfolio-button');
const pageShell = document.querySelector<HTMLElement>('.page-shell');
const portfolioView = document.querySelector<HTMLElement>('.portfolio-view');
const portfolioList = document.querySelector<HTMLUListElement>('#portfolio-list');
const scoreCircle = document.querySelector<HTMLElement>('.score-circle');
const scoreTrack = document.querySelector<HTMLElement>('#long-score');

let audioContext: AudioContext | null = null;
let pianoBusContext: AudioContext | null = null;
let pianoBus: {
  dry: GainNode;
  hallInput: GainNode;
} | null = null;
let hammerBufferContext: AudioContext | null = null;
let hammerBuffer: AudioBuffer | null = null;
let pianoSampleContext: AudioContext | null = null;
let pianoSampleLoadPromise: Promise<boolean> | null = null;
let useSampledPiano = false;
const pianoSampleBuffers = new Map<string, AudioBuffer>();
let activeSources: AudioScheduledSourceNode[] = [];
let activeHighlightTimers: number[] = [];
let stopTimer = 0;
let scoreAnimationFrame = 0;
let scoreCycleStartTime = 0;
let scoreCycleDuration = 0;
let scoreVisualStartTime = 0;
let scoreVisualStartOffset = 0;
let currentScoreX = 0;
let displayedScoreX = 0;
let targetScoreX = 0;
let lastScoreFrameTime = 0;
let pausedCycleOffset = 0;
let isPlaying = false;

function loadScoreFonts(): Promise<void> {
  if (scoreFontLoadPromise) return scoreFontLoadPromise;

  scoreFontLoadPromise = (async () => {
    if (!('fonts' in document)) return;

    await Promise.all([document.fonts.load('32px Bravura'), document.fonts.load('16px Academico')]);
    await document.fonts.ready;
  })();

  return scoreFontLoadPromise;
}

function createPortfolioList(): void {
  if (!portfolioList) return;
  portfolioList.replaceChildren();

  portfolioCompanies.forEach((company) => {
    const item = document.createElement('li');

    if (company.url) {
      const link = document.createElement('a');
      link.href = company.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = company.name;
      item.append(link);
    } else {
      item.textContent = company.name;
    }

    portfolioList.append(item);
  });
}

async function renderLongScore(): Promise<void> {
  const container = document.getElementById('long-score');
  if (!container) return;

  await loadScoreFonts();

  container.innerHTML = '';
  const measureWidth = 468;
  const width = measureWidth * scoreSections.length + 64;
  const height = 286;
  const factory = new Factory({
    renderer: {
      elementId: 'long-score',
      width,
      height
    }
  });

  const score = factory.EasyScore();

  scoreSections.forEach((section, index) => {
    const x = 18 + index * measureWidth;
    const system = factory.System({
      x,
      y: 18,
      width: measureWidth,
      spaceBetweenStaves: 14
    });
    const trebleNotes = score.notes(section.treble, { stem: 'up' });
    const bassNotes = score.notes(section.bass, { clef: 'bass', stem: 'down' });

    trebleNotes.forEach((note, noteIndex) => {
      note.setAttribute('id', getTrebleNoteId(index, noteIndex)).addClass('score-note');
    });
    bassNotes.forEach((note, noteIndex) => {
      note.setAttribute('id', getBassNoteId(index, noteIndex)).addClass('score-note');
    });

    const trebleStave = system.addStave({ voices: [score.voice(trebleNotes)] });
    const bassStave = system.addStave({ voices: [score.voice(bassNotes)] });

    if (index === 0) {
      trebleStave.addClef('treble').addKeySignature('C#m').addTimeSignature('4/4');
      bassStave.addClef('bass').addKeySignature('C#m').addTimeSignature('4/4');
      system.addConnector().setType(StaveConnector.type.BRACE);
    }

    system.addConnector().setType(StaveConnector.type.SINGLE_LEFT);

    [0, 4, 8, 12].forEach((start) => {
      const beam = factory.Beam({ notes: trebleNotes.slice(start, start + 4) });
      beam.renderOptions.flatBeams = true;
    });
  });

  factory.draw();

  scoreSections.forEach((section, sectionIndex) => {
    section.audioTreble.forEach((_, noteIndex) => getRenderedScoreNote(getTrebleNoteId(sectionIndex, noteIndex))?.classList.add('score-note'));
    section.audioBass.forEach((_, noteIndex) => getRenderedScoreNote(getBassNoteId(sectionIndex, noteIndex))?.classList.add('score-note'));
  });

  buildScoreCues();
  rebuildScoreScrollCues();

  const svg = container.querySelector('svg');
  svg?.setAttribute('aria-hidden', 'true');
  svg?.setAttribute('focusable', 'false');
  svg?.setAttribute('preserveAspectRatio', 'xMidYMid meet');
}

function getTrebleNoteId(sectionIndex: number, noteIndex: number): string {
  return `score-t-${sectionIndex}-${noteIndex}`;
}

function getBassNoteId(sectionIndex: number, noteIndex: number): string {
  return `score-b-${sectionIndex}-${noteIndex}`;
}

function getRenderedScoreNote(noteId: string): HTMLElement | SVGElement | null {
  return document.getElementById(noteId) ?? document.getElementById(`vf-${noteId}`);
}

function buildScoreCues(): void {
  scoreCues = [];
  let sectionOffset = 0;

  scoreSections.forEach((section, sectionIndex) => {
    section.audioTreble.forEach((_, noteIndex) => {
      scoreCues.push({
        noteId: getTrebleNoteId(sectionIndex, noteIndex),
        offset: sectionOffset + noteIndex * sixteenthDuration,
        duration: sixteenthDuration * 2.3,
        weight: 1.35
      });
    });

    section.audioBass.forEach((_, beat) => {
      scoreCues.push({
        noteId: getBassNoteId(sectionIndex, beat),
        offset: sectionOffset + beat * sixteenthDuration * 4,
        duration: sixteenthDuration * 8.6,
        weight: 0.75
      });
    });

    sectionOffset += sixteenthDuration * 16;
  });

  scoreCues.sort((a, b) => a.offset - b.offset);
}

function getMoonlightCycleDuration(): number {
  return sixteenthDuration * 16 * scoreSections.length + scoreLoopPause;
}

function getMoonlightMusicDuration(): number {
  return sixteenthDuration * 16 * scoreSections.length;
}

function smootherStep(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));

  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}

function commitScoreX(x: number): void {
  if (!scoreTrack) return;

  currentScoreX = x;
  scoreTrack.style.setProperty('--score-x', `${x.toFixed(2)}px`);
}

function freezeScoreTransform(frameTime = performance.now()): void {
  targetScoreX = currentScoreX;
  displayedScoreX = currentScoreX;
  lastScoreFrameTime = frameTime;
  commitScoreX(currentScoreX);
}

function setScoreX(x: number, immediate = false, frameTime = performance.now()): void {
  if (!scoreCircle || !scoreTrack) return;

  targetScoreX = x;

  if (immediate || !lastScoreFrameTime) {
    displayedScoreX = x;
    lastScoreFrameTime = frameTime;
    commitScoreX(displayedScoreX);
    return;
  }

  const delta = Math.max(0, Math.min(80, frameTime - lastScoreFrameTime));
  const smoothing = 1 - Math.exp(-delta / scoreSmoothingMs);

  lastScoreFrameTime = frameTime;
  displayedScoreX += (targetScoreX - displayedScoreX) * smoothing;

  if (Math.abs(targetScoreX - displayedScoreX) < 0.02) {
    displayedScoreX = targetScoreX;
  }

  commitScoreX(displayedScoreX);
}

function getFallbackScoreX(progress: number): number {
  if (!scoreCircle || !scoreTrack) return currentScoreX;

  const scoreWidth = scoreTrack.offsetWidth;
  const circleWidth = scoreCircle.clientWidth;
  const inset = Math.max(14, circleWidth * 0.07);
  const travel = Math.max(0, scoreWidth - circleWidth);
  const startX = travel / 2 + inset;
  const endX = -travel / 2 - inset;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return startX + (endX - startX) * clampedProgress;
}

function getRenderedNoteCenterX(noteId: string): number | null {
  if (!scoreTrack) return null;

  const note = getRenderedScoreNote(noteId);
  const svg = scoreTrack.querySelector<SVGSVGElement>('svg');
  if (!(note instanceof SVGGraphicsElement) || !svg) return null;

  const box = note.getBBox();
  const viewBoxWidth = svg.viewBox.baseVal.width || Number(svg.getAttribute('width')) || scoreTrack.offsetWidth;
  if (!viewBoxWidth) return null;

  return ((box.x + box.width / 2) / viewBoxWidth) * scoreTrack.offsetWidth;
}

function getScoreXForNote(noteId: string): number | null {
  if (!scoreTrack) return null;

  const noteCenterX = getRenderedNoteCenterX(noteId);
  if (noteCenterX === null) return null;

  return scoreTrack.offsetWidth / 2 - noteCenterX;
}

function rebuildScoreScrollCues(): void {
  const grouped = new Map<string, { offset: number; totalX: number; totalWeight: number }>();

  scoreCues.forEach((cue) => {
    const x = getScoreXForNote(cue.noteId);
    if (x === null) return;

    const key = cue.offset.toFixed(6);
    const group = grouped.get(key) ?? { offset: cue.offset, totalX: 0, totalWeight: 0 };
    group.totalX += x * cue.weight;
    group.totalWeight += cue.weight;
    grouped.set(key, group);
  });

  scoreScrollCues = Array.from(grouped.values())
    .map((group) => ({ offset: group.offset, x: group.totalX / group.totalWeight }))
    .sort((a, b) => a.offset - b.offset);

  const finalSection = scoreSections[scoreSections.length - 1];
  const firstNoteX = getScoreXForNote(getTrebleNoteId(0, 0));
  const lastNoteX = finalSection ? getScoreXForNote(getTrebleNoteId(scoreSections.length - 1, finalSection.audioTreble.length - 1)) : null;

  scoreScrollRange = firstNoteX === null || lastNoteX === null ? null : { startX: firstNoteX, endX: lastNoteX };
}

function getScoreXAtOffset(offset: number): number {
  const cycleDuration = getMoonlightCycleDuration();
  const normalizedOffset = ((offset % cycleDuration) + cycleDuration) % cycleDuration;
  const musicDuration = getMoonlightMusicDuration();

  if (scoreScrollRange) {
    if (normalizedOffset <= musicDuration || scoreLoopPause <= 0) {
      const progress = Math.max(0, Math.min(1, normalizedOffset / musicDuration));
      return scoreScrollRange.startX + (scoreScrollRange.endX - scoreScrollRange.startX) * progress;
    }

    const easedReset = smootherStep((normalizedOffset - musicDuration) / scoreLoopPause);
    return scoreScrollRange.endX + (scoreScrollRange.startX - scoreScrollRange.endX) * easedReset;
  }

  if (scoreScrollCues.length === 0) return getFallbackScoreX(normalizedOffset / cycleDuration);

  const firstCue = scoreScrollCues[0];
  if (normalizedOffset <= firstCue.offset) return firstCue.x;

  for (let index = 0; index < scoreScrollCues.length - 1; index += 1) {
    const currentCue = scoreScrollCues[index];
    const nextCue = scoreScrollCues[index + 1];
    if (normalizedOffset < nextCue.offset) {
      const span = nextCue.offset - currentCue.offset;
      const progress = Math.max(0, Math.min(1, (normalizedOffset - currentCue.offset) / span));
      return currentCue.x + (nextCue.x - currentCue.x) * progress;
    }
  }

  const lastCue = scoreScrollCues[scoreScrollCues.length - 1];
  const loopSpan = cycleDuration - lastCue.offset;
  if (loopSpan <= 0) return lastCue.x;

  const progress = Math.max(0, Math.min(1, (normalizedOffset - lastCue.offset) / loopSpan));
  return lastCue.x + (firstCue.x - lastCue.x) * progress;
}

function getScoreOffsetForX(x: number, preferredOffset = pausedCycleOffset): number {
  const cycleDuration = getMoonlightCycleDuration();
  const musicDuration = getMoonlightMusicDuration();
  const normalizedPreferred = ((preferredOffset % cycleDuration) + cycleDuration) % cycleDuration;
  if (!scoreScrollRange) return normalizedPreferred;

  const { startX, endX } = scoreScrollRange;
  if (Math.abs(endX - startX) < 0.001) return normalizedPreferred;

  if (normalizedPreferred > musicDuration && scoreLoopPause > 0) {
    const resetProgress = Math.max(0, Math.min(1, (x - endX) / (startX - endX)));
    return musicDuration + resetProgress * scoreLoopPause;
  }

  const musicProgress = Math.max(0, Math.min(1, (x - startX) / (endX - startX)));
  return musicProgress * musicDuration;
}

function setScoreOffset(offset: number, immediate = false, frameTime = performance.now()): void {
  const cycleDuration = getMoonlightCycleDuration();
  const normalizedOffset = ((offset % cycleDuration) + cycleDuration) % cycleDuration;

  setScoreX(getScoreXAtOffset(normalizedOffset), immediate, frameTime);
}

function setScoreProgress(progress: number, immediate = false, frameTime = performance.now()): void {
  setScoreOffset(progress * getMoonlightCycleDuration(), immediate, frameTime);
}

function cancelScoreScroll(): void {
  window.cancelAnimationFrame(scoreAnimationFrame);
  scoreAnimationFrame = 0;
}

function clearNoteHighlights(): void {
  activeHighlightTimers.forEach((timer) => window.clearTimeout(timer));
  activeHighlightTimers = [];
  document.querySelectorAll('.score-note.is-playing').forEach((note) => note.classList.remove('is-playing'));
}

function illuminateScoreNote(noteId: string, duration: number): void {
  const note = getRenderedScoreNote(noteId);
  if (!note) return;

  note.classList.remove('is-playing');
  note.getBoundingClientRect();
  note.classList.add('is-playing');

  const timer = window.setTimeout(() => {
    note.classList.remove('is-playing');
    activeHighlightTimers = activeHighlightTimers.filter((activeTimer) => activeTimer !== timer);
  }, Math.max(80, Math.min(180, duration * 1000)));

  activeHighlightTimers.push(timer);
}

function scheduleScoreHighlight(context: AudioContext, noteId: string, start: number, duration: number): void {
  const delay = Math.max(0, (start - context.currentTime) * 1000);
  const timer = window.setTimeout(() => {
    activeHighlightTimers = activeHighlightTimers.filter((activeTimer) => activeTimer !== timer);
    illuminateScoreNote(noteId, duration);
  }, delay);

  activeHighlightTimers.push(timer);
}

function startScoreScroll(context: AudioContext, cycleStart: number, cycleDuration: number, offset = 0): void {
  const normalizedOffset = ((offset % cycleDuration) + cycleDuration) % cycleDuration;
  const frameTime = performance.now();

  scoreCycleStartTime = cycleStart - normalizedOffset;
  scoreCycleDuration = cycleDuration;
  scoreVisualStartTime = frameTime + Math.max(0, cycleStart - context.currentTime) * 1000;
  scoreVisualStartOffset = normalizedOffset;
  cancelScoreScroll();
  if (!lastScoreFrameTime) lastScoreFrameTime = frameTime;
  setScoreOffset(normalizedOffset, false, frameTime);

  const tick = (now: number): void => {
    if (!isPlaying) return;

    const elapsed = now < scoreVisualStartTime ? scoreVisualStartOffset : scoreVisualStartOffset + (now - scoreVisualStartTime) / 1000;
    const progress = (elapsed % scoreCycleDuration) / scoreCycleDuration;
    setScoreProgress(progress, false, now);
    scoreAnimationFrame = window.requestAnimationFrame(tick);
  };

  scoreAnimationFrame = window.requestAnimationFrame(tick);
}

function getCurrentCycleOffset(): number {
  const cycleDuration = scoreCycleDuration || getMoonlightCycleDuration();
  if (!cycleDuration) return pausedCycleOffset;

  if (scoreVisualStartTime) {
    const now = performance.now();
    const elapsed = now < scoreVisualStartTime ? scoreVisualStartOffset : scoreVisualStartOffset + (now - scoreVisualStartTime) / 1000;
    return ((elapsed % cycleDuration) + cycleDuration) % cycleDuration;
  }

  const context = audioContext;
  if (!context) return pausedCycleOffset;

  const elapsed = context.currentTime - scoreCycleStartTime;
  return ((elapsed % cycleDuration) + cycleDuration) % cycleDuration;
}

function noteToMidi(note: string): number | null {
  const match = /^([a-g])([#b]?)(-?\d)$/i.exec(note);
  if (!match) return null;

  const [, rawPitch, accidental, rawOctave] = match;
  const pitchClass: Record<string, number> = {
    c: 0,
    d: 2,
    e: 4,
    f: 5,
    g: 7,
    a: 9,
    b: 11
  };

  const pitch = pitchClass[rawPitch.toLowerCase()];
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const octave = Number(rawOctave);
  return (octave + 1) * 12 + pitch + offset;
}

function noteToFrequency(note: string): number {
  const midi = noteToMidi(note);
  if (midi === null) return 440;
  return 440 * 2 ** ((midi - 69) / 12);
}

function ensureAudioContext(): AudioContext {
  audioContext ??= new AudioContext();
  return audioContext;
}

function createConcertHallImpulse(context: AudioContext): AudioBuffer {
  const duration = 3.35;
  const length = Math.floor(context.sampleRate * duration);
  const impulse = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    let smoothed = 0;
    for (let index = 0; index < length; index += 1) {
      const progress = index / length;
      const earlyReflection = index < context.sampleRate * 0.075 ? 0.38 : 1;
      const tail = (1 - progress) ** 4.15;
      smoothed = smoothed * 0.74 + (Math.random() * 2 - 1) * 0.26;
      data[index] = smoothed * tail * earlyReflection;
    }
  }

  return impulse;
}

function ensurePianoBus(context: AudioContext): NonNullable<typeof pianoBus> {
  if (pianoBus && pianoBusContext === context) return pianoBus;

  const dry = context.createGain();
  const hallInput = context.createGain();
  const preDelay = context.createDelay(0.08);
  const convolver = context.createConvolver();
  const hallFilter = context.createBiquadFilter();
  const hallReturn = context.createGain();
  const body = context.createBiquadFilter();
  const presence = context.createBiquadFilter();
  const air = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();
  const master = context.createGain();

  dry.gain.value = 0.92;
  hallInput.gain.value = 0.2;
  preDelay.delayTime.value = 0.026;
  convolver.buffer = createConcertHallImpulse(context);
  hallFilter.type = 'lowpass';
  hallFilter.frequency.value = 5600;
  hallFilter.Q.value = 0.32;
  hallReturn.gain.value = 0.2;
  body.type = 'lowshelf';
  body.frequency.value = 170;
  body.gain.value = 1.6;
  presence.type = 'peaking';
  presence.frequency.value = 3200;
  presence.Q.value = 0.88;
  presence.gain.value = -1.8;
  air.type = 'highshelf';
  air.frequency.value = 5200;
  air.gain.value = -3.4;
  compressor.threshold.value = -9;
  compressor.knee.value = 28;
  compressor.ratio.value = 1.55;
  compressor.attack.value = 0.018;
  compressor.release.value = 0.42;
  master.gain.value = 0.74;

  dry.connect(body);
  body.connect(presence);
  presence.connect(air);
  air.connect(compressor);
  hallInput.connect(preDelay);
  preDelay.connect(convolver);
  convolver.connect(hallFilter);
  hallFilter.connect(hallReturn);
  hallReturn.connect(compressor);
  compressor.connect(master);
  master.connect(context.destination);

  pianoBusContext = context;
  pianoBus = { dry, hallInput };
  return pianoBus;
}

function getHammerBuffer(context: AudioContext): AudioBuffer {
  if (hammerBuffer && hammerBufferContext === context) return hammerBuffer;

  const length = Math.floor(context.sampleRate * 0.045);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    const progress = index / length;
    data[index] = (Math.random() * 2 - 1) * (1 - progress) ** 5;
  }

  hammerBufferContext = context;
  hammerBuffer = buffer;
  return buffer;
}

function findNearestSample(note: string): PianoSample | null {
  const midi = noteToMidi(note);
  if (midi === null) return null;

  return pianoSamples.reduce<PianoSample | null>((nearest, sample) => {
    if (!nearest) return sample;
    return Math.abs(sample.midi - midi) < Math.abs(nearest.midi - midi) ? sample : nearest;
  }, null);
}

async function loadPianoSamples(context: AudioContext): Promise<boolean> {
  if (pianoSampleContext !== context) {
    pianoSampleContext = context;
    pianoSampleLoadPromise = null;
    useSampledPiano = false;
    pianoSampleBuffers.clear();
  }

  if (pianoSampleLoadPromise) return pianoSampleLoadPromise;

  pianoSampleLoadPromise = Promise.all(
    pianoSamples.map(async (sample) => {
      const response = await fetch(sample.url);
      if (!response.ok) throw new Error(`Unable to load ${sample.url}`);
      const data = await response.arrayBuffer();
      pianoSampleBuffers.set(sample.note, await context.decodeAudioData(data));
    })
  )
    .then(() => {
      useSampledPiano = true;
      return true;
    })
    .catch(() => {
      useSampledPiano = false;
      pianoSampleBuffers.clear();
      return false;
    });

  return pianoSampleLoadPromise;
}

function preloadPianoSamples(): void {
  const context = ensureAudioContext();
  void loadPianoSamples(context);
}

function trackSource(source: AudioScheduledSourceNode): void {
  activeSources.push(source);
  source.onended = () => {
    activeSources = activeSources.filter((activeSource) => activeSource !== source);
  };
}

function stopPlayback(): void {
  if (isPlaying) {
    pausedCycleOffset = getScoreOffsetForX(currentScoreX, getCurrentCycleOffset());
  }

  activeSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  });
  activeSources = [];
  window.clearTimeout(stopTimer);
  cancelScoreScroll();
  clearNoteHighlights();
  freezeScoreTransform();
  scoreVisualStartTime = 0;
  scoreVisualStartOffset = pausedCycleOffset;
  isPlaying = false;
  if (playButton) playButton.textContent = 'Play';
}

function scheduleSampledPianoTone(context: AudioContext, note: string, start: number, duration: number, gainValue: number): boolean {
  const sample = findNearestSample(note);
  if (!sample) return false;

  const buffer = pianoSampleBuffers.get(sample.note);
  const midi = noteToMidi(note);
  if (!buffer || midi === null) return false;

  const bus = ensurePianoBus(context);
  const source = context.createBufferSource();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  const panner = context.createStereoPanner();
  const hallSend = context.createGain();
  const frequency = noteToFrequency(note);
  const pitchDistance = Math.abs(midi - sample.midi);
  const tail = Math.min(5.2, Math.max(1.85, 3.9 - Math.log2(frequency / 440) * 0.32));
  const stopAt = start + duration + tail;
  const releaseStart = Math.max(start + 0.024, stopAt - 0.42);
  const noteBody = Math.max(0.82, 1 - pitchDistance * 0.045);
  const brightness = Math.min(9800, Math.max(3600, frequency * 8.6));
  const pianoGain = gainValue * noteBody * 2.25;

  source.buffer = buffer;
  source.playbackRate.setValueAtTime(2 ** ((midi - sample.midi) / 12), start);

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.linearRampToValueAtTime(pianoGain, start + 0.011);
  envelope.gain.setValueAtTime(pianoGain, releaseStart);
  envelope.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(brightness, start);
  filter.Q.setValueAtTime(0.28, start);
  panner.pan.setValueAtTime(Math.max(-0.26, Math.min(0.26, Math.log2(frequency / 261.63) * 0.12)), start);
  hallSend.gain.setValueAtTime(0.24, start);

  source.connect(envelope);
  envelope.connect(filter);
  filter.connect(panner);
  panner.connect(bus.dry);
  panner.connect(hallSend);
  hallSend.connect(bus.hallInput);

  source.start(start);
  source.stop(stopAt + 0.08);
  trackSource(source);
  return true;
}

function scheduleSynthPianoTone(context: AudioContext, note: string, start: number, duration: number, gainValue: number): void {
  const frequency = noteToFrequency(note);
  const bus = ensurePianoBus(context);
  const voice = context.createGain();
  const filter = context.createBiquadFilter();
  const panner = context.createStereoPanner();
  const hallSend = context.createGain();
  const hammer = context.createBufferSource();
  const hammerGain = context.createGain();
  const hammerFilter = context.createBiquadFilter();
  const partials: Array<[multiple: number, level: number]> = [
    [1, 1],
    [2.003, 0.25],
    [3.012, 0.095],
    [4.032, 0.038]
  ];
  const brightness = Math.min(5400, Math.max(1500, frequency * 7.2));
  const tail = Math.min(3.2, Math.max(1.15, 2.05 - Math.log2(frequency / 440) * 0.2));
  const stopAt = start + duration + tail;

  voice.gain.setValueAtTime(0.0001, start);
  voice.gain.linearRampToValueAtTime(gainValue * 0.82, start + 0.012);
  voice.gain.exponentialRampToValueAtTime(gainValue * 0.2, start + duration + 0.18);
  voice.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(brightness, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(1200, brightness * 0.46), start + duration + tail * 0.48);
  filter.Q.setValueAtTime(0.42, start);

  panner.pan.setValueAtTime(Math.max(-0.24, Math.min(0.24, Math.log2(frequency / 261.63) * 0.11)), start);
  hallSend.gain.setValueAtTime(0.22, start);

  voice.connect(filter);
  filter.connect(panner);
  panner.connect(bus.dry);
  panner.connect(hallSend);
  hallSend.connect(bus.hallInput);

  partials.forEach(([multiple, level], index) => {
    const partialFrequency = frequency * multiple;
    if (partialFrequency > context.sampleRate * 0.45) return;

    const oscillator = context.createOscillator();
    const partialGain = context.createGain();
    const stretch = 1 + index * index * 0.00085;
    const detune = index === 0 ? 0 : (index % 2 === 0 ? -1 : 1) * (1.4 + index * 0.32);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(partialFrequency * stretch, start);
    oscillator.detune.setValueAtTime(detune, start);
    partialGain.gain.setValueAtTime(level, start);

    oscillator.connect(partialGain);
    partialGain.connect(voice);
    oscillator.start(start);
    oscillator.stop(stopAt + 0.05);
    trackSource(oscillator);
  });

  hammer.buffer = getHammerBuffer(context);
  hammerFilter.type = 'bandpass';
  hammerFilter.frequency.setValueAtTime(Math.min(5200, Math.max(1400, frequency * 5)), start);
  hammerFilter.Q.setValueAtTime(0.8, start);
  hammerGain.gain.setValueAtTime(gainValue * 0.11, start);
  hammerGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.034);

  hammer.connect(hammerFilter);
  hammerFilter.connect(hammerGain);
  hammerGain.connect(filter);
  hammer.start(start);
  hammer.stop(start + 0.045);
  trackSource(hammer);
}

function schedulePianoTone(context: AudioContext, note: string, start: number, duration: number, gainValue: number): void {
  if (useSampledPiano && scheduleSampledPianoTone(context, note, start, duration, gainValue)) return;
  scheduleSynthPianoTone(context, note, start, duration, gainValue);
}

function scheduleMoonlightCycle(context: AudioContext, start: number, offset = 0): number {
  const cycleDuration = getMoonlightCycleDuration();
  const cycleOffset = ((offset % cycleDuration) + cycleDuration) % cycleDuration;
  let sectionOffset = 0;

  scoreSections.forEach((section, sectionIndex) => {
    section.audioTreble.forEach((note, index) => {
      const noteOffset = sectionOffset + index * sixteenthDuration;
      if (noteOffset >= cycleOffset) {
        const phraseAccent = index % 8 === 0 ? 1.08 : index % 4 === 0 ? 1.03 : index % 4 === 3 ? 0.9 : 0.96;
        const noteStart = start + noteOffset - cycleOffset;
        const noteDuration = sixteenthDuration * 2.3;
        schedulePianoTone(context, note, noteStart, noteDuration, 0.036 * phraseAccent);
        scheduleScoreHighlight(context, getTrebleNoteId(sectionIndex, index), noteStart, noteDuration);
      }
    });

    section.audioBass.forEach((chord, beat) => {
      const chordOffset = sectionOffset + beat * sixteenthDuration * 4;
      if (chordOffset >= cycleOffset) {
        const bassAccent = beat === 0 ? 1.08 : 0.94;
        const noteStart = start + chordOffset - cycleOffset;
        const noteDuration = sixteenthDuration * 8.6;
        chord.forEach((note) => schedulePianoTone(context, note, noteStart, noteDuration, 0.046 * bassAccent));
        scheduleScoreHighlight(context, getBassNoteId(sectionIndex, beat), noteStart, noteDuration);
      }
    });

    sectionOffset += sixteenthDuration * 16;
  });

  return start + cycleDuration - cycleOffset;
}

function scheduleNextLoop(context: AudioContext, nextStart: number): void {
  const schedulerLead = 0.28;
  const delay = Math.max(16, (nextStart - context.currentTime - schedulerLead) * 1000);

  stopTimer = window.setTimeout(() => {
    if (!isPlaying) return;
    const cycleStart = Math.max(context.currentTime + 0.04, nextStart);
    const followingStart = scheduleMoonlightCycle(context, cycleStart);
    scheduleNextLoop(context, followingStart);
  }, delay);
}

async function playDisplayedMoonlight(): Promise<void> {
  if (isPlaying) {
    stopPlayback();
    return;
  }

  const context = ensureAudioContext();
  const resumeOffset = pausedCycleOffset;
  isPlaying = true;
  if (playButton) playButton.textContent = 'Stop';
  await context.resume();
  await scoreRenderPromise;
  await loadPianoSamples(context);
  if (!isPlaying) return;

  const cycleStart = context.currentTime + 0.06;
  const cycleDuration = getMoonlightCycleDuration();
  const nextStart = scheduleMoonlightCycle(context, cycleStart, resumeOffset);
  startScoreScroll(context, cycleStart, cycleDuration, resumeOffset);
  scheduleNextLoop(context, nextStart);
}

function showPortfolio(): void {
  if (!pageShell || !portfolioView) return;
  const nextView = pageShell.dataset.view === 'portfolio' ? 'music' : 'portfolio';
  pageShell.dataset.view = nextView;
  portfolioView.setAttribute('aria-hidden', nextView === 'portfolio' ? 'false' : 'true');
}

createPortfolioList();
scoreRenderPromise = renderLongScore()
  .then(() => {
    window.requestAnimationFrame(() => setScoreProgress(0, true));
  })
  .catch(() => undefined);
preloadPianoSamples();
window.addEventListener('resize', () => {
  window.requestAnimationFrame(() => {
    rebuildScoreScrollCues();
    setScoreOffset(isPlaying ? getCurrentCycleOffset() : pausedCycleOffset, true);
  });
});
playButton?.addEventListener('click', () => void playDisplayedMoonlight());
portfolioButton?.addEventListener('click', showPortfolio);
