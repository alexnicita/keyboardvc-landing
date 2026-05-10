import { drag, type D3DragEvent } from 'd3-drag';
import { geoOrthographic, geoPath, type GeoPermissibleObjects, type GeoProjection } from 'd3-geo';
import { select } from 'd3-selection';
import { timer, type Timer } from 'd3-timer';

type VexFlowRuntime = typeof import('vexflow/bravura');
type VexFlowFactory = InstanceType<VexFlowRuntime['Factory']>;

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

type MelodyMotionCue = {
  offset: number;
  tilt: number;
};

type GlobeTrack = 'treble' | 'bass';

type GlobePitch = {
  latitude: number;
};

type GlobeNote = {
  noteId: string;
  track: GlobeTrack;
  offset: number;
  duration: number;
  longitude: number;
  pitches: GlobePitch[];
  weight: number;
};

type GlobeRotation = {
  longitude: number;
  latitude: number;
};

type GlobeViewState = {
  manualLongitude: number;
  manualLatitude: number;
  melodyLatitude: number;
  idleLongitude: number;
  velocityLongitude: number;
  velocityLatitude: number;
  lastFrameTime: number;
  isDragging: boolean;
};

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  edgeFade: number;
};

type VisibleGlobeNote = {
  note: GlobeNote;
  depth: number;
};

type ScoreTexture = {
  data: ImageData;
  width: number;
  height: number;
  latitudeTop: number;
  latitudeBottom: number;
  visibleRows: Uint8Array;
  staffLineLatitudes: number[];
};

type GlobeProjectionMap = {
  size: number;
  pitch: number;
  textureHeight: number;
  outputIndexes: Uint32Array;
  baseLongitudes: Float32Array;
  sourceYs: Float32Array;
  textureVisibility: Float32Array;
};

type GlobeWebGLState = {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  texture: WebGLTexture | null;
  textureReady: boolean;
  maxTextureSize: number;
  uniforms: {
    resolution: WebGLUniformLocation | null;
    rotation: WebGLUniformLocation | null;
    radius: WebGLUniformLocation | null;
    latTop: WebGLUniformLocation | null;
    latBottom: WebGLUniformLocation | null;
    texture: WebGLUniformLocation | null;
    staffCount: WebGLUniformLocation | null;
    staffLatitudes: WebGLUniformLocation | null;
  };
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
  { name: 'Specter Aerospace', url: 'https://www.specteraerospace.com/' },
  { name: 'Machina Labs', url: 'https://www.machinalabs.ai/' },
  { name: 'Rainbow', url: 'https://rainbow.me/' },
  { name: 'Rox', url: 'https://www.rox.com/' }
];
const moonlightTempo = 156;
const sixteenthDuration = 60 / moonlightTempo / 4;
const scoreLoopPause = 0.82;
const initialTitleTypingDuration = 1650;
const initialTitleFinalHoldDuration = 520;
const scoreMeasureWidth = 468;
const scoreTextureSourceHeight = 286;
const scoreTextureHorizontalPadding = 260;
const scoreTextureVerticalPadding = 54;
const globeSpherePadding = 0.018;
const scoreTextureLatitudeTop = 38;
const scoreTextureLatitudeBottom = -38;
const scoreTextureBackingScale = 5;
const minGlobeDevicePixelRatio = 2.65;
const maxGlobeBackingSize = 2160;
const maxGlobeDevicePixelRatio = 2.65;
const motionGlobeBackingScale = minGlobeDevicePixelRatio;
const maxMotionGlobeBackingSize = maxGlobeBackingSize;
const maxStaffLineUniforms = 16;
const melodyTiltDegrees = 4.2;
const melodyTiltSmoothing = 9.5;
const globeSphere: GeoPermissibleObjects = { type: 'Sphere' };
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
let melodyMotionCues: MelodyMotionCue[] = [];
let globeNotesById = new Map<string, GlobeNote>();
let scoreTexture: ScoreTexture | null = null;
let vexFlowModulePromise: Promise<VexFlowRuntime> | null = null;
let scoreFontLoadPromise: Promise<void> | null = null;
let scoreRenderPromise: Promise<void> | null = null;

const playButton = document.querySelector<HTMLButtonElement>('#play-button');
const portfolioButton = document.querySelector<HTMLButtonElement>('#portfolio-button');
const pageShell = document.querySelector<HTMLElement>('.page-shell');
const portfolioView = document.querySelector<HTMLElement>('.portfolio-view');
const portfolioList = document.querySelector<HTMLUListElement>('#portfolio-list');
const scoreCircle = document.querySelector<HTMLElement>('.score-circle');
const scoreMount = document.querySelector<HTMLElement>('#long-score');
const introTitle = document.querySelector<HTMLElement>('.intro-title');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

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
let activeGlobeNoteIds = new Set<string>();
let stopTimer = 0;
let globeMusicLongitudeStart = -172;
let globeMusicLongitudeSpan = 344;
let globeFrameTimer: Timer | null = null;
let globeCanvas: HTMLCanvasElement | null = null;
let globeContext: CanvasRenderingContext2D | null = null;
let globeOverlayCanvas: HTMLCanvasElement | null = null;
let globeProjection: GeoProjection | null = null;
let globeWebGLState: GlobeWebGLState | null = null;
let globeSize = 0;
let globeCssSize = 0;
let globeTextureCanvas: HTMLCanvasElement | null = null;
let globeTextureContext: CanvasRenderingContext2D | null = null;
let globeFrameImage: ImageData | null = null;
let globeProjectionMap: GlobeProjectionMap | null = null;
let lastGlobeRenderTime = 0;
let prefersReducedMotion = reducedMotionQuery.matches;
let visibleGlobeNotes: VisibleGlobeNote[] = [];
let scoreCycleStartTime = 0;
let scoreCycleDuration = 0;
let scoreVisualStartTime = 0;
let scoreVisualStartOffset = 0;
let pausedCycleOffset = 0;
let isPlaying = false;
let isPlaybackStarting = false;
let initialTitleTypingPromise: Promise<void> | null = null;
let initialTitleCompleteTime = 0;
const globeView: GlobeViewState = {
  manualLongitude: 0,
  manualLatitude: -8,
  melodyLatitude: 0,
  idleLongitude: 0,
  velocityLongitude: 0,
  velocityLatitude: 0,
  lastFrameTime: 0,
  isDragging: false
};

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

async function renderGlobeScore(): Promise<void> {
  if (!scoreCircle || !scoreMount) return;

  const canvas = document.createElement('canvas');
  const overlayCanvas = document.createElement('canvas');
  const webGLState = createGlobeWebGLState(canvas);
  const context = webGLState ? overlayCanvas.getContext('2d', { alpha: true }) : canvas.getContext('2d', { alpha: true });
  if (!context) return;

  canvas.className = 'score-globe-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  overlayCanvas.className = 'score-globe-overlay';
  overlayCanvas.setAttribute('aria-hidden', 'true');
  overlayCanvas.setAttribute('role', 'presentation');
  scoreMount.replaceChildren(canvas);
  if (webGLState) {
    scoreMount.append(overlayCanvas);
  }
  scoreMount.setAttribute('aria-hidden', 'true');

  globeCanvas = canvas;
  globeOverlayCanvas = webGLState ? overlayCanvas : null;
  globeContext = context;
  globeWebGLState = webGLState;
  globeProjection = geoOrthographic().precision(0.45);
  attachGlobeDrag(webGLState ? overlayCanvas : canvas);
  resizeGlobeCanvas();
  renderCurrentGlobeFrame();
  await renderScoreTexture();
  uploadGlobeWebGLTexture();
  await warmGlobeRenderer();
  renderCurrentGlobeFrame();
  canvas.classList.add('is-ready');
  overlayCanvas.classList.add('is-ready');
}

function createGlobeWebGLState(canvas: HTMLCanvasElement): GlobeWebGLState | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    stencil: false
  });
  if (!gl) return null;

  const vertexShader = compileGlobeShader(
    gl,
    gl.VERTEX_SHADER,
    `#version 300 es
    in vec2 a_position;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`
  );
  const fragmentShader = compileGlobeShader(
    gl,
    gl.FRAGMENT_SHADER,
    `#version 300 es
    precision highp float;

    uniform vec2 u_resolution;
    uniform vec2 u_rotation;
    uniform float u_radius;
    uniform float u_latTop;
    uniform float u_latBottom;
    uniform sampler2D u_scoreTexture;
    uniform int u_staffCount;
    uniform float u_staffLatitudes[${maxStaffLineUniforms}];

    out vec4 outColor;

    const float PI = 3.141592653589793;
    const vec3 PAGE_COLOR = vec3(231.0 / 255.0, 227.0 / 255.0, 221.0 / 255.0);
    const vec3 ORB_COLOR = vec3(252.0 / 255.0, 251.0 / 255.0, 248.0 / 255.0);

    float smootherStep(float value) {
      float x = clamp(value, 0.0, 1.0);
      return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    }

    void main() {
      vec2 center = u_resolution * 0.5;
      vec2 pixel = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
      vec2 normalized = vec2((pixel.x - center.x) / u_radius, (center.y - pixel.y) / u_radius);
      float radiusSquared = dot(normalized, normalized);

      if (radiusSquared > 1.0) {
        discard;
      }

      float depth = sqrt(1.0 - radiusSquared);
      float pitch = -u_rotation.y * PI / 180.0;
      float cosPitch = cos(pitch);
      float sinPitch = sin(pitch);
      float unrotatedY = normalized.y * cosPitch + depth * sinPitch;
      float unrotatedZ = -normalized.y * sinPitch + depth * cosPitch;
      float latitude = asin(clamp(unrotatedY, -1.0, 1.0)) * 180.0 / PI;
      float sphereEdge = sqrt(radiusSquared);
      float bodyBlend = smootherStep((0.78 - sphereEdge) / 0.5);
      float whiteBody = 0.62 * bodyBlend;
      float light = mix(1.0, clamp(0.996 + depth * 0.016 - normalized.x * 0.003 + normalized.y * 0.002, 0.99, 1.014), bodyBlend);
      vec3 orbBase = mix(PAGE_COLOR, ORB_COLOR, whiteBody) * light;
      vec4 base = vec4(orbBase, 1.0);

      float staffAlpha = 0.0;
      if (depth > 0.12) {
        float staffFade = smootherStep((depth - 0.16) / 0.36);
        float latitudeWidth = max(fwidth(latitude) * 0.94, 0.025);

        for (int index = 0; index < ${maxStaffLineUniforms}; index += 1) {
          if (index >= u_staffCount) {
            break;
          }
          float distanceToLine = abs(latitude - u_staffLatitudes[index]);
          float line = 1.0 - smoothstep(0.0, latitudeWidth, distanceToLine);
          staffAlpha = max(staffAlpha, line * staffFade * 0.32);
        }
      }

      if (latitude <= u_latTop && latitude >= u_latBottom) {
        float baseLongitude = atan(normalized.x, unrotatedZ) * 180.0 / PI;
        float longitude = baseLongitude - u_rotation.x;
        longitude = mod(longitude + 540.0, 360.0) - 180.0;
        float latitudeProgress = (u_latTop - latitude) / (u_latTop - u_latBottom);
        vec2 textureUv = vec2((longitude + 180.0) / 360.0, latitudeProgress);
        float limbFade = smootherStep((depth - 0.22) / 0.24);
        float textureVisibility = limbFade * clamp(depth * 1.22 + 0.08, 0.0, 1.0);
        vec4 score = texture(u_scoreTexture, textureUv);
        score.a *= textureVisibility;
        base.rgb = mix(base.rgb, score.rgb, score.a);
      }

      if (staffAlpha > 0.0) {
        base.rgb = mix(base.rgb, vec3(18.0 / 255.0, 19.0 / 255.0, 19.0 / 255.0), staffAlpha);
      }

      outColor = base;
    }`
  );
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.bindAttribLocation(program, 0, 'a_position');
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) {
    gl.deleteProgram(program);
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);

  return {
    gl,
    program,
    positionBuffer,
    texture: null,
    textureReady: false,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    uniforms: {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      rotation: gl.getUniformLocation(program, 'u_rotation'),
      radius: gl.getUniformLocation(program, 'u_radius'),
      latTop: gl.getUniformLocation(program, 'u_latTop'),
      latBottom: gl.getUniformLocation(program, 'u_latBottom'),
      texture: gl.getUniformLocation(program, 'u_scoreTexture'),
      staffCount: gl.getUniformLocation(program, 'u_staffCount'),
      staffLatitudes: gl.getUniformLocation(program, 'u_staffLatitudes')
    }
  };
}

function compileGlobeShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function uploadGlobeWebGLTexture(): void {
  if (!globeWebGLState || !scoreTexture) return;
  const { gl } = globeWebGLState;

  if (scoreTexture.width > globeWebGLState.maxTextureSize || scoreTexture.height > globeWebGLState.maxTextureSize) {
    globeWebGLState.textureReady = false;
    return;
  }

  globeWebGLState.texture ??= gl.createTexture();
  if (!globeWebGLState.texture) return;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, globeWebGLState.texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, scoreTexture.width, scoreTexture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, scoreTexture.data.data);
  globeWebGLState.textureReady = true;
}

async function warmGlobeRenderer(): Promise<void> {
  if (!scoreTexture || !globeSize) return;

  const previousOffset = pausedCycleOffset;
  const warmFrameCount = globeWebGLState?.textureReady ? 18 : 3;
  const musicDuration = getMoonlightMusicDuration();

  for (let frame = 0; frame < warmFrameCount; frame += 1) {
    const offset = musicDuration * (frame / warmFrameCount);
    renderScoreGlobe(offset);

    if (frame % 6 === 5) {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    }
  }

  renderScoreGlobe(previousOffset);
  globeWebGLState?.gl.finish();
}

function getTrebleNoteId(sectionIndex: number, noteIndex: number): string {
  return `score-t-${sectionIndex}-${noteIndex}`;
}

function getBassNoteId(sectionIndex: number, noteIndex: number): string {
  return `score-b-${sectionIndex}-${noteIndex}`;
}

function loadVexFlowModule(): Promise<VexFlowRuntime> {
  vexFlowModulePromise ??= import('vexflow/bravura');

  return vexFlowModulePromise;
}

async function loadScoreFonts(vexflow: VexFlowRuntime): Promise<void> {
  scoreFontLoadPromise ??= (async () => {
    vexflow.default.setFonts('Bravura', 'Academico');
    await Promise.race([
      Promise.all([document.fonts.load('30pt Bravura'), document.fonts.load('16pt Academico'), document.fonts.ready]).then(() => undefined),
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1600);
      })
    ]);
  })();

  return scoreFontLoadPromise;
}

async function renderScoreTexture(): Promise<void> {
  const vexflow = await loadVexFlowModule();
  await loadScoreFonts(vexflow);

  const stage = document.createElement('div');
  const stageId = `score-texture-${Date.now().toString(36)}`;
  stage.id = stageId;
  stage.style.position = 'fixed';
  stage.style.left = '-10000px';
  stage.style.top = '0';
  stage.style.width = `${scoreMeasureWidth * scoreSections.length + scoreTextureHorizontalPadding * 2}px`;
  stage.style.height = `${scoreTextureSourceHeight + scoreTextureVerticalPadding * 2}px`;
  stage.style.overflow = 'hidden';
  document.body.append(stage);

  try {
    const width = scoreMeasureWidth * scoreSections.length + scoreTextureHorizontalPadding * 2;
    const height = scoreTextureSourceHeight + scoreTextureVerticalPadding * 2;
    const factory = new vexflow.Factory({
      renderer: {
        elementId: stageId,
        width,
        height
      }
    });

    drawVexFlowScore(factory, vexflow.StaveConnector, scoreTextureHorizontalPadding, scoreTextureVerticalPadding);
    factory.draw();
    buildScoreCues();

    const svg = stage.querySelector<SVGSVGElement>('svg');
    if (!svg) return;

    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    buildGlobeNotesFromRenderedScore(svg);
    updateGlobeMusicLongitudeRange();
    scoreTexture = await renderCanvasScoreTexture(width, height, vexflow, getRenderedStaffLineLatitudes(svg));
  } finally {
    stage.remove();
  }
}

function drawVexFlowScore(
  factory: VexFlowFactory,
  StaveConnectorClass: VexFlowRuntime['StaveConnector'],
  offsetX = 0,
  offsetY = 0
): void {
  const score = factory.EasyScore();

  scoreSections.forEach((section, index) => {
    const x = offsetX + 18 + index * scoreMeasureWidth;
    const system = factory.System({
      x,
      y: offsetY + 18,
      width: scoreMeasureWidth,
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
      system.addConnector().setType(StaveConnectorClass.type.BRACE);
    }

    system.addConnector().setType(StaveConnectorClass.type.SINGLE_LEFT);

    [0, 4, 8, 12].forEach((start) => {
      const beam = factory.Beam({ notes: trebleNotes.slice(start, start + 4) });
      beam.renderOptions.flatBeams = true;
    });
  });
}

function buildScoreCues(): void {
  const cues: ScoreCue[] = [];
  let sectionOffset = 0;

  scoreSections.forEach((section, sectionIndex) => {
    section.audioTreble.forEach((_, noteIndex) => {
      cues.push({
        noteId: getTrebleNoteId(sectionIndex, noteIndex),
        offset: sectionOffset + noteIndex * sixteenthDuration,
        duration: sixteenthDuration * 2.3,
        weight: 1.35
      });
    });

    section.audioBass.forEach((_, beat) => {
      cues.push({
        noteId: getBassNoteId(sectionIndex, beat),
        offset: sectionOffset + beat * sixteenthDuration * 4,
        duration: sixteenthDuration * 8.6,
        weight: 0.75
      });
    });

    sectionOffset += sixteenthDuration * 16;
  });

  scoreCues = cues.sort((a, b) => a.offset - b.offset);
  melodyMotionCues = buildMelodyMotionCues();
}

function buildMelodyMotionCues(): MelodyMotionCue[] {
  const trebleNotes = scoreSections.flatMap((section) => section.audioTreble);
  const midiNotes = trebleNotes.map(noteToMidi).filter((midi): midi is number => midi !== null);
  if (midiNotes.length === 0) return [];

  const anchorMidi = midiNotes[0];
  const melodyRange = Math.max(1, ...midiNotes.map((midi) => Math.abs(midi - anchorMidi)));
  const cues: MelodyMotionCue[] = [];
  let sectionOffset = 0;

  scoreSections.forEach((section) => {
    section.audioTreble.forEach((note, noteIndex) => {
      const midi = noteToMidi(note);
      if (midi === null) return;

      cues.push({
        offset: sectionOffset + noteIndex * sixteenthDuration,
        tilt: clamp(((midi - anchorMidi) / melodyRange) * melodyTiltDegrees, -melodyTiltDegrees, melodyTiltDegrees)
      });
    });

    sectionOffset += sixteenthDuration * 16;
  });

  return cues.sort((a, b) => a.offset - b.offset);
}

function buildGlobeNotesFromRenderedScore(svg: SVGSVGElement): void {
  const viewBox = svg.viewBox.baseVal;
  const viewBoxWidth = viewBox.width || Number(svg.getAttribute('width')) || 1;
  const viewBoxHeight = viewBox.height || Number(svg.getAttribute('height')) || 1;
  const notes = scoreCues.map((cue) => {
    const renderedNote = getRenderedScoreNote(svg, cue.noteId);
    const box = renderedNote?.getBBox();
    const track: GlobeTrack = cue.noteId.startsWith('score-t') ? 'treble' : 'bass';
    const fallbackProgress = getMoonlightMusicDuration() ? clamp(cue.offset / getMoonlightMusicDuration(), 0, 1) : 0;
    const centerX = box ? (box.x + box.width / 2) / viewBoxWidth : fallbackProgress;
    const centerY = box ? (box.y + box.height / 2) / viewBoxHeight : track === 'treble' ? 0.34 : 0.66;
    const notePitches = getCuePitchNames(cue.noteId);
    const renderedNoteheadYs = renderedNote ? getRenderedNoteheadYProgresses(renderedNote, viewBoxHeight, notePitches.length) : [];
    const pitches =
      renderedNoteheadYs.length === notePitches.length && notePitches.length > 1
        ? renderedNoteheadYs.map((yProgress) => ({ latitude: getLatitudeFromYProgress(yProgress) }))
        : track === 'bass' && notePitches.length > 1
          ? getChordGlobePitches(notePitches, centerY, viewBoxHeight)
          : [{ latitude: getLatitudeFromYProgress(centerY) }];

    return {
      noteId: cue.noteId,
      track,
      offset: cue.offset,
      duration: cue.duration,
      longitude: -180 + centerX * 360,
      pitches,
      weight: cue.weight
    };
  });

  globeNotesById = new Map(notes.map((note) => [note.noteId, note]));
}

function getRenderedNoteheadYProgresses(renderedNote: SVGGraphicsElement, viewBoxHeight: number, expectedCount: number): number[] {
  if (expectedCount <= 1) return [];

  const candidates = Array.from(renderedNote.querySelectorAll<SVGGraphicsElement>('path, ellipse, rect, use'))
    .map((element) => {
      const box = element.getBBox();

      return {
        y: (box.y + box.height / 2) / viewBoxHeight,
        width: box.width,
        height: box.height
      };
    })
    .filter(({ width, height }) => width >= 5 && width <= 24 && height >= 4 && height <= 18)
    .sort((a, b) => a.y - b.y);

  const centers: number[] = [];
  candidates.forEach((candidate) => {
    if (centers.every((center) => Math.abs(center - candidate.y) > 0.006)) {
      centers.push(candidate.y);
    }
  });

  if (centers.length < expectedCount) return [];
  if (centers.length === expectedCount) return centers;

  const stride = (centers.length - 1) / (expectedCount - 1);
  return Array.from({ length: expectedCount }, (_, index) => centers[Math.round(index * stride)]);
}

function getRenderedStaffLineLatitudes(svg: SVGSVGElement): number[] {
  const viewBox = svg.viewBox.baseVal;
  const viewBoxHeight = viewBox.height || Number(svg.getAttribute('height')) || 1;
  const minLineWidth = scoreMeasureWidth * 0.62;
  const yProgresses: number[] = [];

  Array.from(svg.querySelectorAll<SVGGraphicsElement>('path, line, rect')).forEach((element) => {
    const box = element.getBBox();
    if (box.width < minLineWidth || box.height > 2.8) return;

    const yProgress = (box.y + box.height / 2) / viewBoxHeight;
    if (yProgresses.every((existing) => Math.abs(existing - yProgress) > 0.004)) {
      yProgresses.push(yProgress);
    }
  });

  return yProgresses.sort((a, b) => a - b).map(getLatitudeFromYProgress);
}

function getCuePitchNames(noteId: string): string[] {
  const [, track, rawSectionIndex, rawNoteIndex] = /^score-([tb])-(\d+)-(\d+)$/.exec(noteId) ?? [];
  const sectionIndex = Number(rawSectionIndex);
  const noteIndex = Number(rawNoteIndex);
  const section = scoreSections[sectionIndex];

  if (!section) return [];
  if (track === 't') return [section.audioTreble[noteIndex]].filter(Boolean);
  if (track === 'b') return section.audioBass[noteIndex] ?? [];
  return [];
}

function getChordGlobePitches(notes: string[], centerY: number, viewBoxHeight: number): GlobePitch[] {
  const diatonicIndexes = notes.map(getDiatonicPitchIndex).filter((index): index is number => index !== null);
  if (diatonicIndexes.length !== notes.length || diatonicIndexes.length === 0) {
    return [{ latitude: getLatitudeFromYProgress(centerY) }];
  }

  const averagePitch = diatonicIndexes.reduce((sum, index) => sum + index, 0) / diatonicIndexes.length;
  const staffStepY = viewBoxHeight * 0.0126;

  return diatonicIndexes.map((pitchIndex) => ({
    latitude: getLatitudeFromYProgress(centerY + ((averagePitch - pitchIndex) * staffStepY) / viewBoxHeight)
  }));
}

function getLatitudeFromYProgress(yProgress: number): number {
  return scoreTextureLatitudeTop - clamp(yProgress, 0, 1) * (scoreTextureLatitudeTop - scoreTextureLatitudeBottom);
}

function getDiatonicPitchIndex(note: string): number | null {
  const match = /^([a-g])([#b]?)(-?\d)$/i.exec(note);
  if (!match) return null;

  const [, rawPitch, , rawOctave] = match;
  const pitchClass: Record<string, number> = {
    c: 0,
    d: 1,
    e: 2,
    f: 3,
    g: 4,
    a: 5,
    b: 6
  };
  const pitch = pitchClass[rawPitch.toLowerCase()];
  const octave = Number(rawOctave);

  return octave * 7 + pitch;
}

function updateGlobeMusicLongitudeRange(): void {
  const firstCue = scoreCues[0];
  const lastCue = scoreCues[scoreCues.length - 1];
  const firstNote = firstCue ? globeNotesById.get(firstCue.noteId) : null;
  const lastNote = lastCue ? globeNotesById.get(lastCue.noteId) : null;

  if (!firstNote || !lastNote) return;

  globeMusicLongitudeStart = firstNote.longitude;
  globeMusicLongitudeSpan = Math.max(24, lastNote.longitude - firstNote.longitude);
}

function getRenderedScoreNote(svg: SVGSVGElement, noteId: string): SVGGraphicsElement | null {
  const direct = svg.querySelector<SVGGraphicsElement>(`#${noteId}`);
  return direct ?? svg.querySelector<SVGGraphicsElement>(`#vf-${noteId}`);
}

async function renderCanvasScoreTexture(
  sourceWidth: number,
  sourceHeight: number,
  vexflow: VexFlowRuntime,
  staffLineLatitudes: number[]
): Promise<ScoreTexture> {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.id = `score-canvas-texture-${Date.now().toString(36)}`;
  sourceCanvas.style.position = 'fixed';
  sourceCanvas.style.left = '-10000px';
  sourceCanvas.style.top = '0';
  sourceCanvas.style.width = `${sourceWidth}px`;
  sourceCanvas.style.height = `${sourceHeight}px`;
  document.body.append(sourceCanvas);

  try {
    const factory = new vexflow.Factory({
      renderer: {
        elementId: sourceCanvas.id,
        backend: vexflow.Renderer.Backends.CANVAS,
        width: sourceWidth,
        height: sourceHeight
      }
    });

    (factory.getContext() as { resize(width: number, height: number, devicePixelRatio?: number): unknown }).resize(
      sourceWidth,
      sourceHeight,
      scoreTextureBackingScale
    );
    drawVexFlowScore(factory, vexflow.StaveConnector, scoreTextureHorizontalPadding, scoreTextureVerticalPadding);
    factory.draw();

    const context = sourceCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Unable to create score texture context.');
    const data = context.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    removeStaffLineTexturePixels(data, staffLineLatitudes);

    return {
      data,
      width: sourceCanvas.width,
      height: sourceCanvas.height,
      latitudeTop: scoreTextureLatitudeTop,
      latitudeBottom: scoreTextureLatitudeBottom,
      visibleRows: getScoreTextureVisibleRows(data),
      staffLineLatitudes
    };
  } finally {
    sourceCanvas.remove();
  }
}

function removeStaffLineTexturePixels(image: ImageData, staffLineLatitudes: number[]): void {
  const latitudeSpan = scoreTextureLatitudeTop - scoreTextureLatitudeBottom;
  const lineHalfHeight = Math.max(1, Math.round(scoreTextureBackingScale * 0.45));
  const probeHalfHeight = Math.max(4, Math.round(scoreTextureBackingScale * 1.5));

  staffLineLatitudes.forEach((latitude) => {
    const row = Math.round(((scoreTextureLatitudeTop - latitude) / latitudeSpan) * (image.height - 1));
    const startY = Math.max(0, row - lineHalfHeight);
    const endY = Math.min(image.height - 1, row + lineHalfHeight);

    for (let y = startY; y <= endY; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        const alphaIndex = (y * image.width + x) * 4 + 3;
        if (image.data[alphaIndex] <= 8) continue;

        let verticalSupport = 0;
        const probeStart = Math.max(0, y - probeHalfHeight);
        const probeEnd = Math.min(image.height - 1, y + probeHalfHeight);

        for (let probeY = probeStart; probeY <= probeEnd; probeY += 1) {
          if (Math.abs(probeY - y) <= lineHalfHeight) continue;
          if (image.data[(probeY * image.width + x) * 4 + 3] > 18) {
            verticalSupport += 1;
          }
        }

        if (verticalSupport <= 1) {
          image.data[alphaIndex - 3] = 0;
          image.data[alphaIndex - 2] = 0;
          image.data[alphaIndex - 1] = 0;
          image.data[alphaIndex] = 0;
        }
      }
    }
  });
}

function getScoreTextureVisibleRows(image: ImageData): Uint8Array {
  const rows = new Uint8Array(image.height);
  const expandedRows = new Uint8Array(image.height);
  const alphaCounts = new Uint32Array(image.height);
  const rowExpansion = Math.max(2, Math.round(scoreTextureBackingScale * 0.9));
  const staffCoverageLimit = image.width * 0.18;

  for (let index = 3; index < image.data.length; index += 4) {
    if (image.data[index] <= 8) continue;
    alphaCounts[Math.floor(index / 4 / image.width)] += 1;
  }

  alphaCounts.forEach((alphaCount, row) => {
    if (!alphaCount || alphaCount > staffCoverageLimit) return;
    rows[row] = 1;
  });

  rows.forEach((visible, row) => {
    if (!visible) return;
    const start = Math.max(0, row - rowExpansion);
    const end = Math.min(image.height - 1, row + rowExpansion);
    for (let expandedRow = start; expandedRow <= end; expandedRow += 1) {
      expandedRows[expandedRow] = 1;
    }
  });

  return expandedRows;
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

function getGlobeMusicLongitude(offset: number): number {
  const musicDuration = getMoonlightMusicDuration();
  const progress = musicDuration ? clamp(offset / musicDuration, 0, 1) : 0;
  return globeMusicLongitudeStart + globeMusicLongitudeSpan * progress;
}

function getGlobeCycleLongitude(offset: number): number {
  const cycleDuration = getMoonlightCycleDuration();
  const normalizedOffset = ((offset % cycleDuration) + cycleDuration) % cycleDuration;
  const musicDuration = getMoonlightMusicDuration();

  if (normalizedOffset <= musicDuration || scoreLoopPause <= 0) {
    return getGlobeMusicLongitude(normalizedOffset);
  }

  const resetProgress = smootherStep((normalizedOffset - musicDuration) / scoreLoopPause);
  return globeMusicLongitudeStart + globeMusicLongitudeSpan + (360 - globeMusicLongitudeSpan) * resetProgress;
}

function getMelodyLatitudeTarget(offset: number): number {
  if (prefersReducedMotion || melodyMotionCues.length === 0) return 0;

  const cycleDuration = getMoonlightCycleDuration();
  const musicDuration = getMoonlightMusicDuration();
  const normalizedOffset = ((offset % cycleDuration) + cycleDuration) % cycleDuration;
  if (normalizedOffset > musicDuration) return 0;

  const firstCue = melodyMotionCues[0];
  if (normalizedOffset <= firstCue.offset) return firstCue.tilt;

  for (let index = 0; index < melodyMotionCues.length - 1; index += 1) {
    const currentCue = melodyMotionCues[index];
    const nextCue = melodyMotionCues[index + 1];
    if (normalizedOffset < currentCue.offset || normalizedOffset > nextCue.offset) continue;

    const cueSpan = Math.max(0.001, nextCue.offset - currentCue.offset);
    const progress = smootherStep((normalizedOffset - currentCue.offset) / cueSpan);
    return currentCue.tilt + (nextCue.tilt - currentCue.tilt) * progress;
  }

  const lastCue = melodyMotionCues[melodyMotionCues.length - 1];
  const releaseProgress = smootherStep((normalizedOffset - lastCue.offset) / Math.max(0.001, musicDuration - lastCue.offset));
  return lastCue.tilt * (1 - releaseProgress);
}

function updateMelodyLatitude(offset: number, deltaSeconds: number): void {
  const activeTarget = isPlaying ? getMelodyLatitudeTarget(offset) : 0;
  const dragBlend = globeView.isDragging ? 0.35 : 1;
  const target = activeTarget * dragBlend;
  const blend = 1 - Math.exp(-deltaSeconds * melodyTiltSmoothing);

  globeView.melodyLatitude += (target - globeView.melodyLatitude) * blend;
  if (!isPlaying && Math.abs(globeView.melodyLatitude) < 0.001) {
    globeView.melodyLatitude = 0;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeLongitude(value: number): number {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function attachGlobeDrag(canvas: HTMLCanvasElement): void {
  const globeDrag = drag<HTMLCanvasElement, unknown>()
    .on('start', () => {
      globeView.isDragging = true;
      globeView.velocityLongitude = 0;
      globeView.velocityLatitude = 0;
      canvas.classList.add('is-dragging');
      startGlobeFrameLoop();
    })
    .on('drag', (event: D3DragEvent<HTMLCanvasElement, unknown, unknown>) => {
      const sizeFactor = globeCssSize ? clamp(760 / globeCssSize, 0.82, 1.65) : 1;
      const longitudeDelta = event.dx * 0.32 * sizeFactor;
      const latitudeDelta = event.dy * 0.28 * sizeFactor;

      globeView.manualLongitude = normalizeLongitude(globeView.manualLongitude + longitudeDelta);
      globeView.manualLatitude = clamp(globeView.manualLatitude - latitudeDelta, -45, 45);
      globeView.velocityLongitude = longitudeDelta * 0.2;
      globeView.velocityLatitude = -latitudeDelta * 0.2;
    })
    .on('end', () => {
      globeView.isDragging = false;
      canvas.classList.remove('is-dragging');
      startGlobeFrameLoop();
    });

  select<HTMLCanvasElement, unknown>(canvas).call(globeDrag);
}

function resizeGlobeCanvas(): void {
  if (!scoreCircle || !globeCanvas || !globeContext || !globeProjection) return;

  const rect = scoreCircle.getBoundingClientRect();
  const layoutWidth = scoreCircle.clientWidth || scoreCircle.offsetWidth || rect.width;
  const layoutHeight = scoreCircle.clientHeight || scoreCircle.offsetHeight || rect.height;
  const cssSize = Math.max(1, Math.round(Math.min(layoutWidth, layoutHeight)));
  const dpr = Math.min(Math.max(window.devicePixelRatio || 1, minGlobeDevicePixelRatio), maxGlobeDevicePixelRatio);
  const width = isGlobeMotionActive()
    ? Math.max(1, Math.min(maxMotionGlobeBackingSize, Math.round(cssSize * motionGlobeBackingScale)))
    : Math.max(1, Math.min(maxGlobeBackingSize, Math.round(cssSize * dpr)));

  if (globeCanvas.width !== width || globeCanvas.height !== width) {
    globeCanvas.width = width;
    globeCanvas.height = width;
    globeCanvas.style.width = `${cssSize}px`;
    globeCanvas.style.height = `${cssSize}px`;
    if (globeOverlayCanvas) {
      globeOverlayCanvas.width = width;
      globeOverlayCanvas.height = width;
      globeOverlayCanvas.style.width = `${cssSize}px`;
      globeOverlayCanvas.style.height = `${cssSize}px`;
    }
    globeFrameImage = null;
    globeProjectionMap = null;
  }

  globeSize = width;
  globeCssSize = cssSize;
  globeWebGLState?.gl.viewport(0, 0, width, width);
  globeContext.setTransform(1, 0, 0, 1, 0, 0);
  globeProjection.translate([width / 2, width / 2]).scale(width * (0.5 - globeSpherePadding)).clipAngle(90);
}

function refreshScoreLayout(): void {
  resizeGlobeCanvas();
  renderCurrentGlobeFrame();
}

function renderCurrentGlobeFrame(): void {
  renderScoreGlobe(isPlaying ? getCurrentCycleOffset() : pausedCycleOffset);
}

function renderScoreGlobe(offset: number): void {
  if (!globeContext || !globeProjection || !globeSize) return;

  const context = globeContext;
  const projection = globeProjection;
  const rotation = getGlobeRotation(offset);
  const path = geoPath(projection, context);

  projection.rotate([rotation.longitude, rotation.latitude, 0]).clipAngle(90);
  context.clearRect(0, 0, globeSize, globeSize);

  if (renderGlobeWebGL(rotation)) {
    drawActiveGlobeNotes(context, rotation);
    return;
  }

  drawGlobeBackground(context, path);
  if (scoreTexture) {
    drawScoreTextureGlobe(context, rotation, scoreTexture);
    drawStaffLineGlobe(context, rotation, scoreTexture);
  }
  drawActiveGlobeNotes(context, rotation);
}

function renderGlobeWebGL(rotation: GlobeRotation): boolean {
  if (!globeWebGLState?.textureReady || !scoreTexture || !globeCanvas) return false;
  const { gl, program, positionBuffer, texture, uniforms } = globeWebGLState;
  if (!texture) return false;

  gl.viewport(0, 0, globeSize, globeSize);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform2f(uniforms.resolution, globeSize, globeSize);
  gl.uniform2f(uniforms.rotation, rotation.longitude, rotation.latitude);
  gl.uniform1f(uniforms.radius, globeSize * (0.5 - globeSpherePadding));
  gl.uniform1f(uniforms.latTop, scoreTexture.latitudeTop);
  gl.uniform1f(uniforms.latBottom, scoreTexture.latitudeBottom);
  gl.uniform1i(uniforms.texture, 0);
  gl.uniform1i(uniforms.staffCount, Math.min(maxStaffLineUniforms, scoreTexture.staffLineLatitudes.length));
  gl.uniform1fv(uniforms.staffLatitudes, scoreTexture.staffLineLatitudes.slice(0, maxStaffLineUniforms));
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  return true;
}

function getGlobeRotation(offset: number): GlobeRotation {
  const scoreLongitude = getGlobeCycleLongitude(offset);
  return {
    longitude: normalizeLongitude(-scoreLongitude + globeView.manualLongitude + globeView.idleLongitude),
    latitude: clamp(globeView.manualLatitude + globeView.melodyLatitude, -45, 45)
  };
}

function drawGlobeBackground(context: CanvasRenderingContext2D, path: ReturnType<typeof geoPath>): void {
  const center = globeSize / 2;
  const radius = globeSize * (0.5 - globeSpherePadding);
  const gradient = context.createRadialGradient(center - radius * 0.34, center - radius * 0.42, radius * 0.08, center, center, radius * 1.05);

  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.52)');
  gradient.addColorStop(0.44, 'rgba(252, 251, 248, 0.24)');
  gradient.addColorStop(0.72, 'rgba(231, 227, 221, 0)');
  gradient.addColorStop(1, 'rgba(231, 227, 221, 0)');

  context.save();
  context.beginPath();
  path(globeSphere);
  context.fillStyle = gradient;
  context.fill();
  context.restore();
}

function getGlobeTextureContext(): CanvasRenderingContext2D | null {
  globeTextureCanvas ??= document.createElement('canvas');
  globeTextureContext ??= globeTextureCanvas.getContext('2d', { alpha: true });
  if (!globeTextureContext) return null;

  if (globeTextureCanvas.width !== globeSize || globeTextureCanvas.height !== globeSize) {
    globeTextureCanvas.width = globeSize;
    globeTextureCanvas.height = globeSize;
    globeFrameImage = null;
  }

  return globeTextureContext;
}

function drawScoreTextureGlobe(context: CanvasRenderingContext2D, rotation: GlobeRotation, texture: ScoreTexture): void {
  const textureContext = getGlobeTextureContext();
  if (!textureContext || !globeTextureCanvas) return;

  const image =
    globeFrameImage && globeFrameImage.width === globeSize && globeFrameImage.height === globeSize
      ? globeFrameImage
      : textureContext.createImageData(globeSize, globeSize);
  const output = image.data;
  const source = texture.data.data;
  const map = getGlobeProjectionMap(rotation, texture);

  globeFrameImage = image;
  output.fill(0);

  for (let index = 0; index < map.outputIndexes.length; index += 1) {
    const outputIndex = map.outputIndexes[index];
    const sourceY = map.sourceYs[index];
    const visibility = map.textureVisibility[index];
    if (visibility <= 0.004) continue;

    let longitude = map.baseLongitudes[index] - rotation.longitude;
    if (longitude < -180) {
      longitude += 360;
    } else if (longitude > 180) {
      longitude -= 360;
    }
    const sourceX = clamp(((longitude + 180) / 360) * (texture.width - 1), 0, texture.width - 1);
    const x0 = Math.floor(sourceX);
    const y0 = Math.floor(sourceY);
    const x1 = Math.min(texture.width - 1, x0 + 1);
    const y1 = Math.min(texture.height - 1, y0 + 1);
    const tx = sourceX - x0;
    const ty = sourceY - y0;
    const w00 = (1 - tx) * (1 - ty);
    const w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty;
    const w11 = tx * ty;
    const i00 = (y0 * texture.width + x0) * 4;
    const i10 = (y0 * texture.width + x1) * 4;
    const i01 = (y1 * texture.width + x0) * 4;
    const i11 = (y1 * texture.width + x1) * 4;
    const a00 = source[i00 + 3] * w00;
    const a10 = source[i10 + 3] * w10;
    const a01 = source[i01 + 3] * w01;
    const a11 = source[i11 + 3] * w11;
    const sampledAlpha = a00 + a10 + a01 + a11;
    const alpha = sampledAlpha * visibility;
    if (alpha <= 1) continue;

    output[outputIndex] = (source[i00] * a00 + source[i10] * a10 + source[i01] * a01 + source[i11] * a11) / sampledAlpha;
    output[outputIndex + 1] = (source[i00 + 1] * a00 + source[i10 + 1] * a10 + source[i01 + 1] * a01 + source[i11 + 1] * a11) / sampledAlpha;
    output[outputIndex + 2] = (source[i00 + 2] * a00 + source[i10 + 2] * a10 + source[i01 + 2] * a01 + source[i11 + 2] * a11) / sampledAlpha;
    output[outputIndex + 3] = Math.round(alpha);
  }

  textureContext.putImageData(image, 0, 0);
  context.drawImage(globeTextureCanvas, 0, 0);
}

function getGlobeProjectionMap(rotation: GlobeRotation, texture: ScoreTexture): GlobeProjectionMap {
  const pitchKey = Math.round(rotation.latitude * 100) / 100;
  if (
    globeProjectionMap &&
    globeProjectionMap.size === globeSize &&
    globeProjectionMap.pitch === pitchKey &&
    globeProjectionMap.textureHeight === texture.height
  ) {
    return globeProjectionMap;
  }

  const radius = globeSize * (0.5 - globeSpherePadding);
  const center = globeSize / 2;
  const latitudeSpan = texture.latitudeTop - texture.latitudeBottom;
  const pitch = -toRadians(pitchKey);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const start = Math.max(0, Math.floor(center - radius - 1));
  const end = Math.min(globeSize - 1, Math.ceil(center + radius + 1));
  const outputIndexes: number[] = [];
  const baseLongitudes: number[] = [];
  const sourceYs: number[] = [];
  const textureVisibility: number[] = [];

  for (let y = start; y <= end; y += 1) {
    const normalizedY = (center - (y + 0.5)) / radius;
    for (let x = start; x <= end; x += 1) {
      const normalizedX = (x + 0.5 - center) / radius;
      const radiusSquared = normalizedX * normalizedX + normalizedY * normalizedY;
      if (radiusSquared > 1) continue;

      const depth = Math.sqrt(1 - radiusSquared);
      const unrotatedY = normalizedY * cosPitch + depth * sinPitch;
      const unrotatedZ = -normalizedY * sinPitch + depth * cosPitch;
      const latitude = (Math.asin(clamp(unrotatedY, -1, 1)) * 180) / Math.PI;
      if (latitude > texture.latitudeTop || latitude < texture.latitudeBottom) continue;

      const sourceY = clamp(((texture.latitudeTop - latitude) / latitudeSpan) * (texture.height - 1), 0, texture.height - 1);
      if (!texture.visibleRows[Math.round(sourceY)]) continue;

      const limbFade = smootherStep((depth - 0.22) / 0.24);

      outputIndexes.push((y * globeSize + x) * 4);
      baseLongitudes.push((Math.atan2(normalizedX, unrotatedZ) * 180) / Math.PI);
      sourceYs.push(sourceY);
      textureVisibility.push(limbFade * clamp(depth * 1.22 + 0.08, 0, 1));
    }
  }

  globeProjectionMap = {
    size: globeSize,
    pitch: pitchKey,
    textureHeight: texture.height,
    outputIndexes: Uint32Array.from(outputIndexes),
    baseLongitudes: Float32Array.from(baseLongitudes),
    sourceYs: Float32Array.from(sourceYs),
    textureVisibility: Float32Array.from(textureVisibility)
  };

  return globeProjectionMap;
}

function drawStaffLineGlobe(context: CanvasRenderingContext2D, rotation: GlobeRotation, texture: ScoreTexture): void {
  if (texture.staffLineLatitudes.length === 0) return;

  const step = Math.max(0.55, 520 / globeSize);
  const lineWidth = Math.max(0.78, globeSize * 0.0009);

  context.save();
  context.globalCompositeOperation = 'multiply';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = lineWidth;

  texture.staffLineLatitudes.forEach((latitude) => {
    let previous: ProjectedPoint | null = null;

    for (let longitude = -178; longitude <= 178; longitude += step) {
      const point = projectGlobePoint(longitude, latitude, rotation);
      if (point.depth <= 0.12) {
        previous = null;
        continue;
      }

      if (previous) {
        const fade = smootherStep((Math.min(point.depth, previous.depth) - 0.16) / 0.36);
        if (fade > 0.02) {
          context.strokeStyle = `rgba(18, 19, 19, ${0.32 * fade})`;
          context.beginPath();
          context.moveTo(previous.x, previous.y);
          context.lineTo(point.x, point.y);
          context.stroke();
        }
      }

      previous = point;
    }
  });

  context.restore();
}

function drawActiveGlobeNotes(context: CanvasRenderingContext2D, rotation: GlobeRotation): void {
  visibleGlobeNotes.length = 0;

  activeGlobeNoteIds.forEach((noteId) => {
    const note = globeNotesById.get(noteId);
    if (!note) return;

    const depth = getGlobeNoteDepth(note, rotation);
    if (depth > -0.08) {
      visibleGlobeNotes.push({ note, depth });
    }
  });

  visibleGlobeNotes.sort((a, b) => a.depth - b.depth);
  visibleGlobeNotes.forEach(({ note, depth }) => {
    const noteOpacity = getDepthOpacity(depth, true);
    const radius = globeSize * (note.track === 'bass' ? 0.0094 : 0.0082) * (0.84 + Math.max(0, depth) * 0.24);

    note.pitches.forEach((pitch) => {
      const point = projectGlobePoint(note.longitude, pitch.latitude, rotation);
      const opacity = noteOpacity * getDepthOpacity(point.depth, true) * 0.46;
      if (opacity <= 0.02) return;

      const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 2.35);

      glow.addColorStop(0, `rgba(116, 70, 28, ${opacity * 0.22})`);
      glow.addColorStop(0.52, `rgba(116, 70, 28, ${opacity * 0.085})`);
      glow.addColorStop(1, 'rgba(116, 70, 28, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(point.x, point.y, radius * 2.35, 0, Math.PI * 2);
      context.fill();

      context.save();
      context.translate(point.x, point.y);
      context.rotate(-0.18);
      context.lineWidth = Math.max(0.55, globeSize * 0.00082);
      context.fillStyle = `rgba(116, 70, 28, ${opacity * 0.14})`;
      context.beginPath();
      context.ellipse(0, 0, radius * 1.08, radius * 0.7, 0, 0, Math.PI * 2);
      context.fill();

      context.lineWidth = Math.max(0.9, globeSize * 0.0011);
      context.strokeStyle = `rgba(142, 82, 28, ${opacity * 0.72})`;
      context.beginPath();
      context.ellipse(0, 0, radius * 1.72, radius * 1.12, 0, 0, Math.PI * 2);
      context.stroke();

      context.lineWidth = Math.max(0.55, globeSize * 0.00082);
      context.strokeStyle = `rgba(54, 32, 14, ${opacity * 0.64})`;
      context.beginPath();
      context.ellipse(0, 0, radius * 1.34, radius * 0.88, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    });
  });
}

function getGlobeNoteDepth(note: GlobeNote, rotation: GlobeRotation): number {
  const totalDepth = note.pitches.reduce((sum, pitch) => sum + projectGlobePoint(note.longitude, pitch.latitude, rotation).depth, 0);
  return totalDepth / note.pitches.length;
}

function getDepthOpacity(depth: number, active: boolean): number {
  if (depth < 0) {
    return clamp((depth + 0.14) / 0.14, 0, 1) * (active ? 0.16 : 0.07);
  }

  return clamp(0.16 + depth * 0.88 + (active ? 0.16 : 0), 0, 1);
}

function projectGlobePoint(longitude: number, latitude: number, rotation: GlobeRotation): ProjectedPoint {
  const lambda = toRadians(longitude + rotation.longitude);
  const phi = toRadians(latitude);
  const pitch = -toRadians(rotation.latitude);
  const cosPhi = Math.cos(phi);
  const x = cosPhi * Math.sin(lambda);
  const y = Math.sin(phi);
  const z = cosPhi * Math.cos(lambda);
  const rotatedY = y * Math.cos(pitch) - z * Math.sin(pitch);
  const rotatedZ = y * Math.sin(pitch) + z * Math.cos(pitch);
  const scale = globeSize * (0.5 - globeSpherePadding);

  return {
    x: globeSize / 2 + x * scale,
    y: globeSize / 2 - rotatedY * scale,
    depth: rotatedZ,
    edgeFade: clamp((rotatedZ + 0.04) / 0.44, 0, 1)
  };
}

function startGlobeFrameLoop(): void {
  if (globeFrameTimer) return;

  resizeGlobeCanvas();
  globeView.lastFrameTime = performance.now();
  lastGlobeRenderTime = 0;
  globeFrameTimer = timer(() => {
    renderGlobeAnimationFrame(performance.now());
  });
}

function stopGlobeFrameLoop(): void {
  globeFrameTimer?.stop();
  globeFrameTimer = null;
}

function renderGlobeAnimationFrame(frameTime: number): void {
  const isActiveMotion =
    globeView.isDragging || isPlaying || Math.abs(globeView.velocityLongitude) > 0.002 || Math.abs(globeView.velocityLatitude) > 0.002;
  if (!isActiveMotion && frameTime - lastGlobeRenderTime < 84) return;

  const deltaSeconds = clamp((frameTime - globeView.lastFrameTime) / 1000, 0, 0.08);
  globeView.lastFrameTime = frameTime;
  lastGlobeRenderTime = frameTime;

  if (!globeView.isDragging && (Math.abs(globeView.velocityLongitude) > 0.002 || Math.abs(globeView.velocityLatitude) > 0.002)) {
    globeView.manualLongitude = normalizeLongitude(globeView.manualLongitude + globeView.velocityLongitude * deltaSeconds * 60);
    globeView.manualLatitude = clamp(globeView.manualLatitude + globeView.velocityLatitude * deltaSeconds * 60, -45, 45);
    const decay = Math.exp(-deltaSeconds * 5.8);
    globeView.velocityLongitude *= decay;
    globeView.velocityLatitude *= decay;
  }

  const cycleOffset = isPlaying ? getCurrentCycleOffset() : pausedCycleOffset;
  updateMelodyLatitude(cycleOffset, deltaSeconds);
  renderScoreGlobe(cycleOffset);

  if (!shouldContinueGlobeFrameLoop()) {
    stopGlobeFrameLoop();
    refreshScoreLayout();
  }
}

function isGlobeMotionActive(): boolean {
  return (
    isPlaying ||
    globeView.isDragging ||
    Math.abs(globeView.melodyLatitude) > 0.002 ||
    Math.abs(globeView.velocityLongitude) > 0.002 ||
    Math.abs(globeView.velocityLatitude) > 0.002
  );
}

function shouldContinueGlobeFrameLoop(): boolean {
  return isGlobeMotionActive();
}

function cancelScoreScroll(): void {
  stopGlobeFrameLoop();
}

function clearNoteHighlights(): void {
  activeHighlightTimers.forEach((timer) => window.clearTimeout(timer));
  activeHighlightTimers = [];
  activeGlobeNoteIds.clear();
  renderCurrentGlobeFrame();
}

function illuminateScoreNote(noteId: string, duration: number): void {
  const cue = scoreCues.find((scoreCue) => scoreCue.noteId === noteId);
  if (!cue) return;

  activeGlobeNoteIds.delete(noteId);
  activeGlobeNoteIds.add(noteId);
  renderCurrentGlobeFrame();

  const timer = window.setTimeout(() => {
    activeGlobeNoteIds.delete(noteId);
    activeHighlightTimers = activeHighlightTimers.filter((activeTimer) => activeTimer !== timer);
    renderCurrentGlobeFrame();
  }, Math.max(120, Math.min(320, (duration || cue.duration) * 1200)));

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
  resizeGlobeCanvas();
  renderScoreGlobe(normalizedOffset);
  startGlobeFrameLoop();
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
  const duration = 4.85;
  const length = Math.floor(context.sampleRate * duration);
  const impulse = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    let smoothed = 0;
    for (let index = 0; index < length; index += 1) {
      const progress = index / length;
      const earlyReflection = index < context.sampleRate * 0.09 ? 0.28 : 1;
      const tail = (1 - progress) ** 3.15;
      smoothed = smoothed * 0.82 + (Math.random() * 2 - 1) * 0.18;
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

  dry.gain.value = 0.76;
  hallInput.gain.value = 0.36;
  preDelay.delayTime.value = 0.038;
  convolver.buffer = createConcertHallImpulse(context);
  hallFilter.type = 'lowpass';
  hallFilter.frequency.value = 4300;
  hallFilter.Q.value = 0.26;
  hallReturn.gain.value = 0.44;
  body.type = 'lowshelf';
  body.frequency.value = 170;
  body.gain.value = 2.1;
  presence.type = 'peaking';
  presence.frequency.value = 2850;
  presence.Q.value = 0.82;
  presence.gain.value = -2.8;
  air.type = 'highshelf';
  air.frequency.value = 4800;
  air.gain.value = -5.2;
  compressor.threshold.value = -10;
  compressor.knee.value = 32;
  compressor.ratio.value = 1.42;
  compressor.attack.value = 0.028;
  compressor.release.value = 0.58;
  master.gain.value = 0.7;

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
    pausedCycleOffset = getCurrentCycleOffset();
  }

  isPlaybackStarting = false;
  isPlaying = false;
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
  globeView.melodyLatitude = 0;
  clearNoteHighlights();
  scoreVisualStartTime = 0;
  scoreVisualStartOffset = pausedCycleOffset;
  if (playButton) playButton.textContent = 'Play';
  refreshScoreLayout();
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
  const tail = Math.min(6.6, Math.max(2.45, 4.75 - Math.log2(frequency / 440) * 0.28));
  const stopAt = start + duration + tail;
  const releaseStart = Math.max(start + 0.036, stopAt - 0.78);
  const noteBody = Math.max(0.82, 1 - pitchDistance * 0.045);
  const brightness = Math.min(7600, Math.max(2400, frequency * 6.4));
  const pianoGain = gainValue * noteBody * 1.95;

  source.buffer = buffer;
  source.playbackRate.setValueAtTime(2 ** ((midi - sample.midi) / 12), start);

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.linearRampToValueAtTime(pianoGain, start + 0.018);
  envelope.gain.setValueAtTime(pianoGain, releaseStart);
  envelope.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(brightness, start);
  filter.Q.setValueAtTime(0.22, start);
  panner.pan.setValueAtTime(Math.max(-0.22, Math.min(0.22, Math.log2(frequency / 261.63) * 0.1)), start);
  hallSend.gain.setValueAtTime(0.42, start);

  source.connect(envelope);
  envelope.connect(filter);
  filter.connect(panner);
  panner.connect(bus.dry);
  panner.connect(hallSend);
  hallSend.connect(bus.hallInput);

  source.start(start);
  source.stop(stopAt + 0.14);
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
  const brightness = Math.min(4200, Math.max(1200, frequency * 5.6));
  const tail = Math.min(4.1, Math.max(1.6, 2.85 - Math.log2(frequency / 440) * 0.18));
  const stopAt = start + duration + tail;

  voice.gain.setValueAtTime(0.0001, start);
  voice.gain.linearRampToValueAtTime(gainValue * 0.7, start + 0.02);
  voice.gain.exponentialRampToValueAtTime(gainValue * 0.18, start + duration + 0.26);
  voice.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(brightness, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(900, brightness * 0.42), start + duration + tail * 0.55);
  filter.Q.setValueAtTime(0.34, start);

  panner.pan.setValueAtTime(Math.max(-0.2, Math.min(0.2, Math.log2(frequency / 261.63) * 0.09)), start);
  hallSend.gain.setValueAtTime(0.4, start);

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
  hammerGain.gain.setValueAtTime(gainValue * 0.075, start);
  hammerGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);

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
  if (isPlaying || isPlaybackStarting) {
    stopPlayback();
    return;
  }

  const context = ensureAudioContext();
  const resumeOffset = pausedCycleOffset;
  isPlaybackStarting = true;
  if (playButton) playButton.textContent = 'Stop';
  await context.resume();
  await scoreRenderPromise;
  await loadPianoSamples(context);
  if (!isPlaybackStarting) return;

  const cycleStart = context.currentTime + 0.06;
  const cycleDuration = getMoonlightCycleDuration();
  const nextStart = scheduleMoonlightCycle(context, cycleStart, resumeOffset);
  isPlaying = true;
  isPlaybackStarting = false;
  startScoreScroll(context, cycleStart, cycleDuration, resumeOffset);
  scheduleNextLoop(context, nextStart);
}

function showPortfolio(): void {
  if (!pageShell || !portfolioView) return;
  const nextView = pageShell.dataset.view === 'portfolio' ? 'music' : 'portfolio';
  pageShell.dataset.view = nextView;
  portfolioView.setAttribute('aria-hidden', nextView === 'portfolio' ? 'false' : 'true');
}

function startInitialTitleTyping(): Promise<void> {
  if (initialTitleTypingPromise) return initialTitleTypingPromise;
  if (!introTitle) return Promise.resolve();

  const title = introTitle.dataset.title ?? introTitle.textContent ?? 'Keyboard VC';
  introTitle.classList.add('is-typing');

  if (prefersReducedMotion) {
    introTitle.textContent = title;
    initialTitleCompleteTime = performance.now();
    initialTitleTypingPromise = Promise.resolve();
    return initialTitleTypingPromise;
  }

  introTitle.textContent = '';
  initialTitleTypingPromise = new Promise((resolve) => {
    const initialDelay = 160;
    const stepDuration = initialTitleTypingDuration / Math.max(1, title.length);
    let index = 0;

    const typeNextLetter = (): void => {
      index += 1;
      introTitle.textContent = title.slice(0, index);

      if (index >= title.length) {
        initialTitleCompleteTime = performance.now();
        resolve();
        return;
      }

      window.setTimeout(typeNextLetter, stepDuration);
    };

    window.setTimeout(typeNextLetter, initialDelay);
  });

  return initialTitleTypingPromise;
}

async function waitForInitialTitleTyping(): Promise<void> {
  await startInitialTitleTyping();

  if (prefersReducedMotion) return;

  const remaining = Math.max(0, initialTitleFinalHoldDuration - (performance.now() - initialTitleCompleteTime));
  if (remaining <= 0) return;

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}

function revealLoadedPage(): void {
  if (introTitle) {
    introTitle.textContent = introTitle.dataset.title ?? 'Keyboard VC';
    introTitle.classList.add('is-typing');
  }
  pageShell?.removeAttribute('data-loading');
}

createPortfolioList();
void startInitialTitleTyping();
scoreRenderPromise = renderGlobeScore()
  .then(async () => {
    await waitForInitialTitleTyping();
    revealLoadedPage();
    window.requestAnimationFrame(refreshScoreLayout);
  })
  .catch((error: unknown) => {
    console.error(error);
    revealLoadedPage();
  });
preloadPianoSamples();
reducedMotionQuery.addEventListener('change', (event) => {
  prefersReducedMotion = event.matches;

  if (prefersReducedMotion) {
    globeView.melodyLatitude = 0;
  }

  if (prefersReducedMotion && !isPlaying && !globeView.isDragging) {
    stopGlobeFrameLoop();
    renderCurrentGlobeFrame();
  }
});
window.addEventListener('resize', () => {
  window.requestAnimationFrame(refreshScoreLayout);
});
window.visualViewport?.addEventListener('resize', () => window.requestAnimationFrame(refreshScoreLayout));
playButton?.addEventListener('click', () => void playDisplayedMoonlight());
portfolioButton?.addEventListener('click', showPortfolio);
