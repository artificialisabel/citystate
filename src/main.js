import "./glass-chrome/index.css";
import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <section class="studio gc-ui" data-gc-theme="void" aria-label="Procedural building generator">
    <div class="viewport">
      <canvas id="scene" tabindex="0" aria-label="Procedural 3D city"></canvas>
      <canvas id="textureLab" class="texture-lab" aria-label="Procedural facade texture laboratory" hidden></canvas>
      <button id="toggleToolbar" class="toolbar-toggle gc-panel gc-dense gc-pill" type="button" aria-label="minimise controls" aria-controls="controlToolbar" aria-expanded="true">-</button>
      <div id="playHud" class="play-hud gc-panel gc-dense" hidden>
        <button id="avatarHandle" class="avatar-handle" type="button" aria-label="drag to place avatar; activate to reset at the city entrance"></button>
        <div>
          <strong class="gc-panel-title">play mode</strong>
          <span id="playStatus" class="gc-note" role="status" aria-live="polite">drag scene to orbit, scroll to zoom</span>
          <div class="play-options gc-row" role="group" aria-label="play options">
            <button class="gc-chip" data-play-toggle="playDoubleJump" type="button">double jump</button>
            <button class="gc-chip" data-play-toggle="playWallBounce" type="button">wall bounce</button>
          </div>
        </div>
      </div>
      <div id="mobilePlayControls" class="mobile-play-controls" hidden>
        <div id="mobileJoystick" class="mobile-joystick" role="group" tabindex="0" aria-label="movement joystick; drag to move or use arrow keys">
          <div id="mobileJoystickKnob" class="mobile-joystick-knob" aria-hidden="true"></div>
        </div>
        <button id="mobileJumpButton" class="mobile-jump-button gc-panel gc-dense gc-pill" type="button">jump</button>
      </div>
    </div>

    <aside id="controlToolbar" class="toolbar gc-panel gc-dense gc-scroll" aria-label="City controls">
      <header class="toolbar-title gc-panel-head">
        <div>
          <span class="gc-panel-title">citystate</span>
          <span class="gc-panel-meta">by @artificial.isabel</span>
        </div>
        <div class="toolbar-actions">
          <button id="aboutToggle" class="gc-chip" type="button" aria-controls="aboutPanel" aria-expanded="false">about</button>
        </div>
      </header>

      <div class="segmented segmented-filter gc-segmented" role="group" aria-label="control filters">
        <button class="segment gc-chip" data-filter="environment" type="button">environment</button>
        <button class="segment gc-chip" data-filter="architecture" type="button">architecture</button>
        <button class="segment gc-chip" data-filter="texture" type="button">texture</button>
        <button class="segment gc-chip" data-filter="play" type="button">play</button>
        <button class="segment gc-chip" data-filter="reactive" type="button">react</button>
      </div>

      <div class="segmented segmented-mode gc-segmented" role="group" aria-label="view mode">
        <button class="segment gc-chip is-active" data-mode="city" type="button">city</button>
        <button class="segment gc-chip" data-mode="single" type="button">single</button>
        <button class="segment gc-chip" data-mode="texture" type="button">texture</button>
        <button class="segment gc-chip" data-mode="play" type="button">play</button>
        <button class="segment gc-chip" data-mode="reactive" type="button">react</button>
      </div>

      <div class="segmented segmented-presets gc-segmented" role="group" aria-label="colour presets">
        <button class="segment gc-chip" data-preset="day" type="button">day</button>
        <button class="segment gc-chip" data-preset="sunset" type="button">sunset</button>
        <button class="segment gc-chip" data-preset="night" type="button">night</button>
        <button class="segment gc-chip" id="randomise" type="button">randomise</button>
      </div>

      <details class="panel gc-section" data-category="environment" open>
        <summary>colour</summary>
        <div id="paletteControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel gc-section" data-category="environment" open>
        <summary>camera</summary>
        <div id="cameraControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel gc-section" data-category="architecture" open>
        <summary>city layout</summary>
        <div id="cityControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel gc-section" data-category="reactive" open>
        <summary>react input</summary>
        <div class="panel-body gc-section-body">
          <button id="audioToggle" class="gc-chip is-wide" type="button">start mic</button>
          <output id="reactiveStatus" class="status-line gc-note" role="status" aria-live="polite">idle pulse</output>
        </div>
      </details>

      <details class="panel gc-section" data-category="reactive" open>
        <summary>pulse</summary>
        <div id="reactiveMotionControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel play-tuning-panel gc-section" data-category="play" open>
        <summary>play tuning</summary>
        <div class="panel-body gc-section-body">
          <button id="resetPlayView" class="gc-chip is-wide" type="button">reset view</button>
          <div id="playControls" class="panel-control-stack"></div>
        </div>
      </details>

      <details class="panel gc-section" data-category="architecture" open>
        <summary>building shape</summary>
        <div id="shapeControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel gc-section" data-category="architecture" open>
        <summary>windows + details</summary>
        <div id="detailControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel gc-section" data-category="texture" open>
        <summary>texture lab</summary>
        <div id="textureLabControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel gc-section" data-category="environment" open>
        <summary>environment</summary>
        <div id="environmentControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel gc-section" data-category="environment" open>
        <summary>post</summary>
        <div id="postControls" class="panel-body gc-section-body"></div>
      </details>

      <details class="panel gc-section" data-category="environment" open>
        <summary>performance</summary>
        <div id="performanceControls" class="panel-body gc-section-body"></div>
      </details>
    </aside>

    <aside id="aboutPanel" class="about-panel gc-panel gc-dense" role="dialog" aria-modal="false" aria-label="about citystate" hidden>
      <header class="about-header gc-panel-head">
        <span class="gc-panel-title">citystate</span>
        <button id="aboutClose" class="gc-chip" type="button" aria-label="close about">x</button>
      </header>
      <p class="gc-note gc-natural-case">
        a procedural three.js city sketch built in code with custom geometry generation,
        instanced windows, five-colour palette controls, lightweight atmosphere, and shader-based painterly post.
      </p>
      <p class="gc-note gc-natural-case">
        for more miscellaneous ventures, experiments, collaborations and such in this vein find me online.
      </p>
      <div class="about-actions gc-row">
        <a class="gc-chip" href="https://www.instagram.com/artificial.isabel/" target="_blank" rel="noreferrer">dm me</a>
      </div>
    </aside>
  </section>
`;

const STORAGE_KEY = "five-colour-city-lab-v4";
const DEFAULT_PRESET = "night";
const VIEW_MODES = new Set(["city", "single", "texture", "play", "reactive"]);
const CONTROL_FILTERS = new Set(["", "environment", "architecture", "texture", "play", "reactive"]);
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const MAX_RAIN_DROPS = 900;
const STAR_COUNT = 960;
const MAX_BUILDING_BPM = 180;
const AUDIO_REACTIVE_GAIN = 5.2;
const AUDIO_REACTIVE_BASS_GAIN = 1.1;
const AUDIO_REACTIVE_MIN_PULSE = 0.055;
const AUDIO_REACTIVE_MAX_SMOOTHING = 0.84;
const AUDIO_REACTIVE_MIN_SCALE_X = 0.28;
const AUDIO_REACTIVE_MIN_SCALE_Y = 0.38;
const AMBIENT_CAMERA_IDLE_SECONDS = 3;
const AMBIENT_CAMERA_FADE_SECONDS = 2;
const SKY_BODY_HOURS = {
  day: 13.5,
  sunset: 18.25,
  night: 23.5,
};
const SKY_BODY_ORBIT = {
  horizonY: 6,
  apexY: 72,
  sunriseX: -36,
  sunsetX: 24,
  sunriseZ: -52,
  sunsetZ: 72,
  noonZPull: 18,
};
const POST_SHADER_TIME_LOOP = 16;
const NEUTRAL_POST_SETTINGS = {
  postNoise: 0,
  bloom: 0,
  bloomThreshold: 0.89,
  pixelation: 1,
  paletteSteps: 0,
  dither: 0,
  aberration: 0,
  focalShift: 0,
};

const defaults = {
  mode: "city",
  controlFilter: "",
  skyColor: "#87e9ee",
  highlightColor: "#ffa50a",
  shadowColor: "#746693",
  accentAColor: "#c8ff00",
  accentBColor: "#ff7300",
  highlightReach: 0.45,
  skyGradientBand: 0.5,
  accentScatter: 1,
  seed: 1,
  gridSize: 9,
  density: 0.53,
  buildingMotion: 0.4,
  buildingBpm: 72,
  reactiveSmoothing: 0.96,
  reactiveBeatVariance: 1,
  reactiveScaleX: 0.25,
  reactiveScaleY: 0.175,
  reactiveBuildingWave: 1,
  reactiveHeightSplit: 1,
  reactiveIndividuality: 1,
  reactiveShortBass: 0.8,
  reactiveTallTreble: 1,
  lotSpacing: 3.7,
  streetGap: 1,
  foregroundHeight: 4,
  backgroundHeight: 26.5,
  skylineVariance: 0.78,
  widthMin: 0.8,
  widthMax: 8,
  depthMin: 3.2,
  depthMax: 7.2,
  tierCount: 3,
  tierInset: 0.17,
  deformation: 1,
  edgeChunkDensity: 0.22,
  roofDetailDensity: 0.54,
  domeChance: 0.22,
  domeScale: 0.68,
  spireDensity: 0.91,
  windowDensity: 0.5,
  windowWidth: 0.57,
  windowHeight: 0.27,
  windowJitter: 0.74,
  windowGlow: 0.44,
  labNoiseScaleX: 100,
  labNoiseScaleY: 1,
  labBlockSize: 1,
  labBrightness: 0.37,
  labContrast: 0.14,
  labShadowGate: 0.18,
  labHighlightGate: 0.77,
  labGradientStrength: 0.18,
  labGradientCurve: 0.2,
  labAccentDensity: 0.28,
  labAccentStrength: 0.73,
  labAccentDodge: 1,
  labKuwaharaAmount: 1,
  labKuwaharaRadius: 10,
  sceneMood: 2,
  timeOfDay: 23.5,
  playDoubleJump: true,
  playWallBounce: true,
  playCameraDistance: 42,
  playCameraHeight: 13,
  playCameraPitch: 0.16,
  playCameraLag: 0.18,
  playWalkSpeed: 12.75,
  playRunSpeed: 21,
  playTurnSpeed: 3.4,
  playMouseTurnSpeed: 0.006,
  playJumpSpeed: 22,
  playDoubleJumpSpeed: 20,
  playWallBounceSpeed: 18,
  lensMm: 50,
  cameraHeight: 14,
  cameraDistance: 50,
  cameraYaw: 0,
  cameraPitch: 0,
  skyBodyX: -22,
  skyBodyY: 41,
  skyBodyZ: 34,
  skyBodyMode: "orbit",
  skyBodyIntensity: 1,
  skyBodySize: 1.53,
  moonPhase: 0.66,
  starDensity: 0.18,
  fogAmount: 0,
  cloudCover: 0.18,
  cloudDensity: 0.36,
  cloudScale: 1.15,
  cloudSoftness: 0.72,
  cloudBillow: 0.32,
  cloudBrightness: 0.68,
  cloudSpeed: 0.22,
  cloudOrientation: 0,
  rainAmount: 0,
  rainSpeed: 0,
  rainAngle: 0,
  windAmount: 0.16,
  stormAmount: 0,
  birdAmount: 0.36,
  treeAmount: 0.5,
  ambientFill: 1.5,
  floorVisible: false,
  ...NEUTRAL_POST_SETTINGS,
  renderScale: 0.78,
  maxFps: 30,
};

function sceneValueFromTime(hour) {
  const altitude = Math.sin(((((hour % 24) + 24) % 24) - 6) / 12 * Math.PI);
  if (altitude > 0.35) return 0;
  if (altitude < -0.05) return 2;
  return 1;
}

const controlGroups = [
  {
    id: "paletteControls",
    controls: [
      ["Highlight reach", "highlightReach", 0, 1, 0.01],
      ["Sky gradient band", "skyGradientBand", 0, 1, 0.01],
      ["Accent scatter", "accentScatter", 0, 1, 0.01],
    ],
  },
  {
    id: "cityControls",
    controls: [
      ["Seed", "seed", 1, 999, 1],
      ["Grid size", "gridSize", 6, 12, 1],
      ["Density", "density", 0.05, 1, 0.01],
      ["Building motion", "buildingMotion", 0, 1, 0.01],
      ["Building bpm", "buildingBpm", 30, 180, 1],
      ["Lot spacing", "lotSpacing", 2.8, 7, 0.1],
      ["Street gap", "streetGap", 0, 2.5, 0.1],
      ["Front height", "foregroundHeight", 3, 20, 0.5],
      ["Back height", "backgroundHeight", 8, 55, 0.5],
      ["Skyline variance", "skylineVariance", 0, 1, 0.01],
    ],
  },
  {
    id: "reactiveMotionControls",
    controls: [
      ["Scale x", "reactiveScaleX", 0, 0.5, 0.01],
      ["Scale y", "reactiveScaleY", 0, 1.2, 0.01],
      ["Smoothing", "reactiveSmoothing", 0.1, 0.96, 0.01],
      ["Beat variance", "reactiveBeatVariance", 0, 1, 0.01],
      ["Building wave", "reactiveBuildingWave", 0, 1, 0.01],
      ["Height split", "reactiveHeightSplit", 0, 1, 0.01],
      ["Individuality", "reactiveIndividuality", 0, 1, 0.01],
      ["Short pulse", "reactiveShortBass", 0, 1.8, 0.01],
      ["Tall pulse", "reactiveTallTreble", 0, 1.8, 0.01],
    ],
  },
  {
    id: "playControls",
    controls: [
      ["Cam distance", "playCameraDistance", 6, 160, 1],
      ["Cam height", "playCameraHeight", 2, 44, 0.5],
      ["Cam tilt", "playCameraPitch", -0.5, 1.2, 0.01],
      ["Follow lag", "playCameraLag", 0.03, 0.8, 0.01],
      ["Walk speed", "playWalkSpeed", 3, 30, 0.25],
      ["Run speed", "playRunSpeed", 5, 44, 0.25],
      ["Turn speed", "playTurnSpeed", 0.6, 8, 0.05],
      ["Mouse turn", "playMouseTurnSpeed", 0.001, 0.02, 0.001],
      ["Jump", "playJumpSpeed", 6, 42, 0.5],
      ["Double jump", "playDoubleJumpSpeed", 6, 42, 0.5],
      ["Wall bounce", "playWallBounceSpeed", 0, 42, 0.5],
    ],
  },
  {
    id: "shapeControls",
    controls: [
      ["Width min", "widthMin", 0.8, 5, 0.1],
      ["Width max", "widthMax", 1, 8, 0.1],
      ["Depth min", "depthMin", 0.8, 5, 0.1],
      ["Depth max", "depthMax", 1, 8, 0.1],
      ["Tiers", "tierCount", 1, 6, 1],
      ["Tier inset", "tierInset", -0.35, 0.45, 0.01],
      ["Deformation", "deformation", 0, 1, 0.01],
      ["Domes", "domeChance", 0, 1, 0.01],
      ["Dome scale", "domeScale", 0.2, 1.4, 0.01],
    ],
  },
  {
    id: "detailControls",
    controls: [
      ["Edge chunks", "edgeChunkDensity", 0, 1, 0.01],
      ["Roof detail", "roofDetailDensity", 0, 1, 0.01],
      ["Spires", "spireDensity", 0, 1, 0.01],
      ["Windows", "windowDensity", 0, 1, 0.01],
      ["Window width", "windowWidth", 0.08, 0.6, 0.01],
      ["Window height", "windowHeight", 0.08, 0.8, 0.01],
      ["Window jitter", "windowJitter", 0, 1, 0.01],
      ["Window glow", "windowGlow", 0, 1, 0.01],
    ],
  },
  {
    id: "textureLabControls",
    controls: [
      ["Scale x", "labNoiseScaleX", 1, 100, 0.1],
      ["Scale y", "labNoiseScaleY", 1, 100, 0.1],
      ["Block size", "labBlockSize", 1, 100, 1],
      ["Brightness", "labBrightness", -0.5, 0.5, 0.01],
      ["Contrast", "labContrast", 0, 2.6, 0.01],
      ["Shadow gate", "labShadowGate", 0.05, 0.8, 0.01],
      ["Highlight gate", "labHighlightGate", 0.2, 0.95, 0.01],
      ["Gradient", "labGradientStrength", 0, 1, 0.01],
      ["Gradient curve", "labGradientCurve", 0.2, 3, 0.01],
      ["Accent density", "labAccentDensity", 0, 1, 0.01],
      ["Accent strength", "labAccentStrength", 0, 1, 0.01],
      ["Accent dodge", "labAccentDodge", 0, 1, 0.01],
      ["Kuwahara", "labKuwaharaAmount", 0, 1, 0.01],
      ["Kuwahara radius", "labKuwaharaRadius", 1, 10, 1],
    ],
  },
  {
    id: "cameraControls",
    controls: [
      ["Lens mm", "lensMm", 24, 85, 1],
      ["Camera height", "cameraHeight", 4, 36, 0.5],
      ["Distance", "cameraDistance", 18, 80, 1],
      ["Yaw", "cameraYaw", -180, 180, 1],
      ["Pitch", "cameraPitch", -70, 70, 1],
    ],
  },
  {
    id: "environmentControls",
    controls: [
      ["Time of day", "timeOfDay", 0, 24, 0.25],
      ["Sky body mode", "skyBodyMode", [["orbit", "orbit"], ["manual", "manual"]]],
      ["Sky body x", "skyBodyX", -48, 48, 1],
      ["Sky body y", "skyBodyY", 8, 62, 1],
      ["Sky body z", "skyBodyZ", -18, 78, 1],
      ["Sky body power", "skyBodyIntensity", 0, 2, 0.01],
      ["Sky body size", "skyBodySize", 0.2, 2.5, 0.01],
      ["Moon phase", "moonPhase", 0, 1, 0.01],
      ["Stars", "starDensity", 0, 1, 0.01],
      ["Fog", "fogAmount", 0, 1, 0.01],
      ["Cloud cover", "cloudCover", 0, 1, 0.01],
      ["Cloud density", "cloudDensity", 0, 1, 0.01],
      ["Cloud scale", "cloudScale", 0.35, 3.5, 0.01],
      ["Cloud softness", "cloudSoftness", 0, 1, 0.01],
      ["Cloud billow", "cloudBillow", 0, 1, 0.01],
      ["Cloud brightness", "cloudBrightness", 0, 2.4, 0.01],
      ["Cloud speed", "cloudSpeed", 0, 1, 0.01],
      ["Cloud orientation", "cloudOrientation", -180, 180, 1],
      ["Rain", "rainAmount", 0, 1, 0.01],
      ["Rain speed", "rainSpeed", 0, 1, 0.01],
      ["Rain angle", "rainAngle", 0, 1, 0.01],
      ["Wind", "windAmount", 0, 1, 0.01],
      ["Storm", "stormAmount", 0, 1, 0.01],
      ["Birds", "birdAmount", 0, 1, 0.01],
      ["Trees", "treeAmount", 0, 1, 0.01],
      ["Ambient fill", "ambientFill", 0, 1.5, 0.01],
      ["Floor", "floorVisible", "toggle"],
    ],
  },
  {
    id: "postControls",
    controls: [
      ["Post noise", "postNoise", 0, 1, 0.01],
      ["Bloom", "bloom", 0, 1.5, 0.01],
      ["Bloom threshold", "bloomThreshold", 0, 1, 0.01],
      ["Pixelation", "pixelation", 1, 8, 1],
      ["Palette steps", "paletteSteps", 0, 12, 1],
      ["Dither", "dither", 0, 1, 0.01],
      ["Aberration", "aberration", 0, 1, 0.01],
      ["Focal shift", "focalShift", 0, 1, 0.01],
    ],
  },
  {
    id: "performanceControls",
    controls: [
      ["Render scale", "renderScale", 0.4, 1, 0.01],
      ["Max fps", "maxFps", 12, 60, 1],
    ],
  },
];

const colorControls = [
  ["Sky", "skyColor"],
  ["Highlight", "highlightColor"],
  ["Shadow", "shadowColor"],
  ["Accent 1", "accentAColor"],
  ["Accent 2", "accentBColor"],
];

const PALETTE_WHEEL_SIZE = 190;
const PALETTE_LIGHTNESS_ENABLED = false;
let selectedPaletteIndex = 0;
let paletteWheelDiscCache = null;
let paletteWheelDiscCacheSize = 0;

function paletteWheelMetrics() {
  const requestedRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
  const backingSize = Math.round(PALETTE_WHEEL_SIZE * requestedRatio);
  return {
    backingSize,
    pixelRatio: backingSize / PALETTE_WHEEL_SIZE,
  };
}

const presets = {
  day: {
    seed: 1,
    skyColor: "#87e9ee",
    highlightColor: "#ffa50a",
    shadowColor: "#746693",
    accentAColor: "#c8ff00",
    accentBColor: "#ff7300",
    highlightReach: 0.45,
    accentScatter: 1,
    gridSize: 9,
    density: 0.53,
    lotSpacing: 3.7,
    streetGap: 1,
    foregroundHeight: 4,
    backgroundHeight: 26.5,
    skylineVariance: 0.78,
    widthMin: 0.8,
    widthMax: 8,
    depthMin: 3.2,
    depthMax: 7.2,
    tierCount: 3,
    tierInset: 0.17,
    deformation: 1,
    domeChance: 0.22,
    domeScale: 0.68,
    edgeChunkDensity: 0.22,
    roofDetailDensity: 0.54,
    spireDensity: 0.91,
    windowWidth: 0.57,
    windowHeight: 0.27,
    windowJitter: 0.74,
    windowGlow: 0.44,
    labNoiseScaleX: 100,
    labNoiseScaleY: 1,
    labBlockSize: 1,
    labBrightness: 0.37,
    labContrast: 0.14,
    labShadowGate: 0.18,
    labHighlightGate: 0.77,
    labGradientStrength: 0.18,
    labGradientCurve: 0.2,
    labAccentDensity: 0.28,
    labAccentStrength: 0.73,
    labAccentDodge: 1,
    labKuwaharaAmount: 1,
    labKuwaharaRadius: 10,
    cameraHeight: 14,
    cameraDistance: 50,
    cameraYaw: 0,
    cameraPitch: 0,
    skyBodyX: -22,
    skyBodyY: 41,
    skyBodyZ: 34,
    skyBodyIntensity: 1,
    skyBodySize: 1.53,
    starDensity: 0.18,
    fogAmount: 0,
    cloudCover: 0.21,
    cloudDensity: 0.2,
    cloudScale: 3.24,
    cloudSoftness: 0.47,
    cloudBillow: 0.51,
    cloudBrightness: 2.4,
    cloudSpeed: 0,
    cloudOrientation: 138,
    rainAmount: 0,
    rainSpeed: 0,
    rainAngle: 0,
    ambientFill: 1.5,
    postNoise: 0,
    bloom: 0,
    bloomThreshold: 0.89,
    pixelation: 3,
    paletteSteps: 0,
    dither: 0,
    aberration: 0,
    focalShift: 0.26,
  },
  sunset: {
    skyColor: "#f43e50",
    highlightColor: "#ff8800",
    shadowColor: "#6546af",
    accentAColor: "#ff7d7d",
    accentBColor: "#b7ae4e",
    seed: 140,
    gridSize: 8,
    density: 0.47,
    lotSpacing: 2.8,
    streetGap: 0,
    foregroundHeight: 3,
    backgroundHeight: 31.5,
    skylineVariance: 0.15,
    widthMin: 5,
    widthMax: 8,
    depthMin: 5,
    depthMax: 8,
    tierCount: 5,
    tierInset: 0.03,
    deformation: 0,
    domeChance: 1,
    domeScale: 1.4,
    edgeChunkDensity: 0.56,
    roofDetailDensity: 0,
    spireDensity: 1,
    windowDensity: 1,
    windowWidth: 0.6,
    windowHeight: 0.8,
    windowJitter: 1,
    windowGlow: 1,
    labNoiseScaleX: 100,
    labNoiseScaleY: 13.4,
    labBlockSize: 1,
    labBrightness: -0.11,
    labContrast: 1.16,
    labShadowGate: 0.18,
    labHighlightGate: 0.67,
    labGradientStrength: 0,
    labGradientCurve: 0.2,
    labAccentDensity: 0.28,
    labAccentStrength: 0.73,
    labAccentDodge: 1,
    labKuwaharaAmount: 1,
    labKuwaharaRadius: 10,
    skyBodyX: -13,
    skyBodyY: 11,
    skyBodyZ: -18,
    skyBodyIntensity: 2,
    skyBodySize: 2.5,
    starDensity: 1,
    fogAmount: 0.07,
    cloudCover: 0.36,
    cloudDensity: 0.91,
    cloudScale: 3.24,
    cloudSoftness: 0.15,
    cloudBillow: 0.82,
    cloudBrightness: 1.42,
    cloudSpeed: 0.42,
    cloudOrientation: 73,
    rainAmount: 1,
    rainSpeed: 0,
    rainAngle: 0.1,
    birdAmount: 0.7,
    treeAmount: 0.98,
    ambientFill: 0.64,
    postNoise: 0.32,
    bloom: 0.37,
    bloomThreshold: 0.82,
    pixelation: 1,
    paletteSteps: 10,
    dither: 0.57,
    aberration: 1,
    focalShift: 1,
    renderScale: 1,
    maxFps: 30,
    lensMm: 50,
    cameraHeight: 14,
    cameraDistance: 50,
    cameraYaw: 0,
    cameraPitch: 0,
  },
  night: {
    skyColor: "#272735",
    highlightColor: "#2ba9ab",
    shadowColor: "#04342c",
    accentAColor: "#66ffcc",
    accentBColor: "#d400ff",
    highlightReach: 0.66,
    accentScatter: 1,
    seed: 147,
    gridSize: 8,
    density: 0.8,
    lotSpacing: 7,
    streetGap: 1.1,
    foregroundHeight: 7.5,
    backgroundHeight: 47,
    skylineVariance: 1,
    widthMin: 2.7,
    widthMax: 5.1,
    depthMin: 3.3,
    depthMax: 6.7,
    tierCount: 4,
    tierInset: 0.19,
    deformation: 1,
    domeChance: 0.3,
    domeScale: 0.48,
    edgeChunkDensity: 0.73,
    roofDetailDensity: 1,
    spireDensity: 1,
    windowDensity: 0.19,
    windowWidth: 0.26,
    windowHeight: 0.08,
    windowJitter: 1,
    windowGlow: 1,
    labNoiseScaleX: 100,
    labNoiseScaleY: 1,
    labBlockSize: 1,
    labBrightness: 0.5,
    labContrast: 0.62,
    labShadowGate: 0.23,
    labHighlightGate: 0.37,
    labGradientStrength: 1,
    labGradientCurve: 1.3,
    labAccentDensity: 0.23,
    labAccentStrength: 1,
    labAccentDodge: 1,
    labKuwaharaAmount: 1,
    labKuwaharaRadius: 10,
    skyBodyX: -24,
    skyBodyY: 48,
    skyBodyZ: -6,
    skyBodyIntensity: 1.27,
    skyBodySize: 1.35,
    starDensity: 1,
    fogAmount: 0.43,
    cloudCover: 0.47,
    cloudDensity: 0.55,
    cloudScale: 3.24,
    cloudSoftness: 0.58,
    cloudBillow: 0.75,
    cloudBrightness: 0.88,
    cloudSpeed: 0.69,
    cloudOrientation: 73,
    rainAmount: 1,
    rainSpeed: 1,
    rainAngle: 0.12,
    birdAmount: 0,
    treeAmount: 0.72,
    ambientFill: 0.44,
    postNoise: 0.1,
    bloom: 0.5,
    bloomThreshold: 0.25,
    pixelation: 2,
    paletteSteps: 0,
    dither: 0,
    aberration: 1,
    focalShift: 1,
    renderScale: 1,
    maxFps: 30,
    lensMm: 36,
    cameraHeight: 34,
    cameraDistance: 77,
    cameraYaw: -21,
    cameraPitch: -18,
  },
};

const BOOLEAN_STATE_PATHS = new Set(["playDoubleJump", "playWallBounce"]);
const PRESET_PRESERVED_PATHS = new Set([
  "mode",
  "controlFilter",
  "playDoubleJump",
  "playWallBounce",
  "renderScale",
  "maxFps",
  ...(controlGroups.find((group) => group.id === "playControls")?.controls.map(([, path]) => path) ?? []),
]);
const PRESET_SCENE_PATHS = Object.keys(defaults).filter((path) => !PRESET_PRESERVED_PATHS.has(path));

function normalizeStateRelationships(record, changedPath = "") {
  const changed = new Set();
  const normalizePair = (minimumPath, maximumPath) => {
    if (record[minimumPath] <= record[maximumPath]) return;
    if (changedPath === minimumPath) {
      record[maximumPath] = record[minimumPath];
      changed.add(maximumPath);
    } else if (changedPath === maximumPath) {
      record[minimumPath] = record[maximumPath];
      changed.add(minimumPath);
    } else {
      [record[minimumPath], record[maximumPath]] = [record[maximumPath], record[minimumPath]];
      changed.add(minimumPath);
      changed.add(maximumPath);
    }
  };

  normalizePair("widthMin", "widthMax");
  normalizePair("depthMin", "depthMax");
  normalizePair("playWalkSpeed", "playRunSpeed");

  const gateGap = 0.04;
  if (record.labShadowGate > record.labHighlightGate - gateGap) {
    if (changedPath === "labShadowGate") {
      record.labHighlightGate = clamp(record.labShadowGate + gateGap, 0.2, 0.95);
      changed.add("labHighlightGate");
    } else if (changedPath === "labHighlightGate") {
      record.labShadowGate = clamp(record.labHighlightGate - gateGap, 0.05, 0.8);
      changed.add("labShadowGate");
    } else {
      const low = Math.min(record.labShadowGate, record.labHighlightGate);
      const high = Math.max(record.labShadowGate, record.labHighlightGate);
      record.labShadowGate = clamp(Math.min(low, high - gateGap), 0.05, 0.8);
      record.labHighlightGate = clamp(Math.max(high, record.labShadowGate + gateGap), 0.2, 0.95);
      changed.add("labShadowGate");
      changed.add("labHighlightGate");
    }
  }
  return changed;
}

function sanitizeState(candidate, base = defaults) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const clean = { ...base };

  colorControls.forEach(([, path]) => {
    const value = source[path];
    if (typeof value === "string" && HEX_COLOR_PATTERN.test(value)) clean[path] = value.toLowerCase();
  });

  controlGroups.forEach((group) => {
    group.controls.forEach(([, path, min, max, step]) => {
      if (!Object.hasOwn(source, path)) return;
      if (min === "toggle") {
        if (typeof source[path] === "boolean") clean[path] = source[path];
        return;
      }
      if (Array.isArray(min)) {
        const allowed = new Set(min.map(([value]) => value));
        if (allowed.has(source[path])) clean[path] = source[path];
        return;
      }
      const value = Number(source[path]);
      if (!Number.isFinite(value)) return;
      const clamped = clamp(value, min, max);
      clean[path] = step >= 1 ? Math.round(clamped / step) * step : clamped;
    });
  });

  BOOLEAN_STATE_PATHS.forEach((path) => {
    if (typeof source[path] === "boolean") clean[path] = source[path];
  });
  if (VIEW_MODES.has(source.mode)) clean.mode = source.mode;
  if (CONTROL_FILTERS.has(source.controlFilter)) clean.controlFilter = source.controlFilter;
  const sceneMood = Number(source.sceneMood);
  if (Number.isFinite(sceneMood)) clean.sceneMood = clamp(Math.round(sceneMood), 0, 2);
  normalizeStateRelationships(clean);
  return clean;
}

const painterlyShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uPixelSize: { value: 1 },
    uDither: { value: 0.12 },
    uPaletteSteps: { value: 0 },
    uAberration: { value: 0.08 },
    uFocalShift: { value: 0.16 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uPixelSize;
    uniform float uDither;
    uniform float uPaletteSteps;
    uniform float uAberration;
    uniform float uFocalShift;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(0.1031, 0.11369));
      p += dot(p, p.yx + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    vec3 samplePaint(vec2 uv) {
      float px = max(1.0, uPixelSize);
      vec2 pixelUv = (floor(uv * uResolution / px) * px + px * 0.5) / uResolution;
      float focus = smoothstep(0.58, 0.02, uv.y) * uFocalShift;
      vec2 blur = vec2(px / uResolution.x, px / uResolution.y) * focus * 5.4;
      vec3 color = texture2D(tDiffuse, pixelUv).rgb * 0.24;
      color += texture2D(tDiffuse, pixelUv + vec2(blur.x, 0.0)).rgb * 0.12;
      color += texture2D(tDiffuse, pixelUv - vec2(blur.x, 0.0)).rgb * 0.12;
      color += texture2D(tDiffuse, pixelUv + vec2(0.0, blur.y)).rgb * 0.12;
      color += texture2D(tDiffuse, pixelUv - vec2(0.0, blur.y)).rgb * 0.12;
      color += texture2D(tDiffuse, pixelUv + blur * vec2(0.75, 0.55)).rgb * 0.14;
      color += texture2D(tDiffuse, pixelUv - blur * vec2(0.75, 0.55)).rgb * 0.14;
      return color;
    }

    void main() {
      vec2 center = vUv - 0.5;
      vec2 aberr = center * uAberration * 0.006;
      vec3 color;
      color.r = samplePaint(vUv + aberr).r;
      color.g = samplePaint(vUv).g;
      color.b = samplePaint(vUv - aberr).b;

      float frame = mod(floor(uTime * 24.0), 384.0);
      float ditherGrain = hash(floor(vUv * uResolution / max(1.0, uPixelSize)) + frame);
      color += (ditherGrain - 0.5) * uDither * 0.045;

      if (uPaletteSteps > 0.5) {
        float steps = max(2.0, uPaletteSteps);
        color = floor(color * steps + ditherGrain * uDither * 0.32) / steps;
      }

      gl_FragColor = vec4(max(color, 0.0), 1.0);
    }
  `,
};

const grainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uNoise: { value: 0.16 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uNoise;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(0.1031, 0.11369));
      p += dot(p, p.yx + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      float frame = mod(floor(uTime * 30.0), 480.0);
      vec2 frag = floor(vUv * uResolution);
      float grainA = hash(frag + vec2(frame * 17.13, frame * 3.71));
      float grainB = hash(frag * 1.37 + vec2(frame * 5.91, frame * 13.37));
      float grainC = hash(frag * 0.73 + vec2(frame * 19.19, frame * 7.07));
      float mono = (grainA - 0.5) * 2.0;
      vec3 chroma = vec3(grainA - 0.5, grainB - 0.5, grainC - 0.5);
      chroma -= vec3(dot(chroma, vec3(0.299, 0.587, 0.114)));
      vec3 luma = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
      vec3 textured = mix(luma, color, 1.0 + mono * uNoise * 0.12);
      textured += chroma * uNoise * 0.025;
      color = clamp(mix(color, textured, uNoise * 0.55), 0.0, 1.0);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const skyShader = {
  uniforms: {
    uTop: { value: new THREE.Color(0x87e9ee) },
    uMid: { value: new THREE.Color(0xffa50a) },
    uHorizon: { value: new THREE.Color(0xffa50a) },
    uBottom: { value: new THREE.Color(0x746693) },
    uGradientBand: { value: 0.5 },
    uBodyDir: { value: new THREE.Vector3(0, 1, 0) },
    uBodyColor: { value: new THREE.Color(0xffa50a) },
    uAccentA: { value: new THREE.Color(0xc8ff00) },
    uAccentB: { value: new THREE.Color(0xff7300) },
    uBodyPower: { value: 1 },
    uBodySize: { value: 1 },
    uCloudCover: { value: 0 },
    uCloudDensity: { value: 0.35 },
    uCloudScale: { value: 1.15 },
    uCloudSoftness: { value: 0.72 },
    uCloudBillow: { value: 0.32 },
    uCloudBrightness: { value: 0.68 },
    uCloudSpeed: { value: 0.22 },
    uCloudOrientation: { value: 0 },
    uWind: { value: 0.16 },
    uStorm: { value: 0 },
    uLightning: { value: 0 },
    uTime: { value: 0 },
    uNight: { value: 1 },
    uStarDensity: { value: 0.18 },
    uStarColor: { value: new THREE.Color(0xdaf6ff) },
  },
  vertexShader: `
    varying vec3 vWorld;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = normalize(world.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uTop;
    uniform vec3 uMid;
    uniform vec3 uHorizon;
    uniform vec3 uBottom;
    uniform float uGradientBand;
    uniform vec3 uBodyDir;
    uniform vec3 uBodyColor;
    uniform vec3 uAccentA;
    uniform vec3 uAccentB;
    uniform float uBodyPower;
    uniform float uBodySize;
    uniform float uCloudCover;
    uniform float uCloudDensity;
    uniform float uCloudScale;
    uniform float uCloudSoftness;
    uniform float uCloudBillow;
    uniform float uCloudBrightness;
    uniform float uCloudSpeed;
    uniform float uCloudOrientation;
    uniform float uWind;
    uniform float uStorm;
    uniform float uLightning;
    uniform float uNight;
    uniform float uStarDensity;
    uniform vec3 uStarColor;
    varying vec3 vWorld;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        value += noise(p) * amp;
        p *= 2.04;
        amp *= 0.5;
      }
      return value;
    }

    float cloudTexture(vec2 uv) {
      mat2 rotate = mat2(0.78, -0.62, 0.62, 0.78);
      float motion = uTime * (0.012 + uCloudSpeed * 0.18 + uWind * 0.04);
      vec2 drift = vec2(motion * (0.65 + uWind * 1.2), -motion * 0.36);
      vec2 flow = vec2(
        fbm(uv * 1.7 + drift),
        fbm(rotate * uv * 1.9 - drift.yx * 0.82)
      );
      vec2 warped = uv + (flow - 0.5) * mix(0.74, 0.34, uCloudBillow);
      float broad = fbm(warped * uCloudScale * mix(1.55, 0.9, uCloudBillow) + drift * 0.42);
      float detail = fbm(rotate * warped * uCloudScale * mix(5.6, 2.75, uCloudBillow) + broad * mix(1.7, 0.72, uCloudBillow));
      float wisps = sin((warped.x * 23.0 + detail * 8.0 + motion * 2.6) * max(0.35, uCloudScale)) * (1.0 - uCloudBillow);
      float softCloud = broad * 0.68 + detail * 0.28 + wisps * 0.035;
      float lobed = smoothstep(0.24, 0.92, broad) * 0.78 + detail * 0.18;
      float cloud = mix(softCloud, lobed, uCloudBillow);
      return clamp((cloud - 0.5) * mix(1.0, 2.35, uCloudBillow) + 0.5, 0.0, 1.0);
    }

    float starField(vec3 dir, float h) {
      float azimuth = atan(dir.z, dir.x) / 6.2831853 + 0.5;
      vec2 uv = vec2(azimuth, h * 0.92 + dir.z * 0.035);
      vec2 grid = uv * vec2(104.0, 50.0);
      vec2 cell = floor(grid);
      vec2 local = fract(grid) - 0.5;
      float seed = hash(cell);
      vec2 offset = vec2(hash(cell + vec2(17.2, 3.9)), hash(cell + vec2(5.7, 29.1))) - 0.5;
      float density = smoothstep(0.01, 0.42, uStarDensity);
      float present = step(1.0 - density * 0.46, seed);
      float point = smoothstep(0.01, 0.0, length(local - offset * 0.8));
      float horizonMask = smoothstep(0.02, 0.16, h);
      float twinkle = 0.72 + 0.28 * sin(uTime * (1.1 + seed * 3.8) + seed * 31.4);
      return present * point * horizonMask * twinkle;
    }

    void main() {
      float h = clamp(vWorld.y * 0.5 + 0.5, 0.0, 1.0);
      float band = clamp(uGradientBand, 0.0, 1.0);
      float horizonStart = mix(0.02, 0.16, band);
      float horizonPeak = mix(0.16, 0.42, band);
      float horizonEnd = mix(0.32, 0.74, band);
      float topStart = mix(0.24, 0.5, band);
      float topEnd = mix(0.56, 0.86, band);
      float midStart = mix(0.1, 0.3, band);
      float midPeak = mix(0.32, 0.6, band);
      float midEnd = mix(0.54, 0.95, band);
      float horizonRise = smoothstep(horizonStart, horizonPeak, h);
      float horizonFall = 1.0 - smoothstep(horizonPeak, horizonEnd, h);
      float horizonBand = max(horizonRise * horizonFall, smoothstep(horizonStart, horizonEnd, h) * (1.0 - band * 0.35));
      vec3 low = mix(uBottom, uHorizon, horizonRise);
      vec3 color = mix(low, uTop, smoothstep(topStart, topEnd, h));
      color = mix(color, uHorizon, horizonBand * mix(0.18, 0.52, band));
      color = mix(color, uMid, smoothstep(midStart, midPeak, h) * (1.0 - smoothstep(midPeak, midEnd, h)) * 0.18);

      vec3 dir = normalize(vWorld);
      float bodyDot = max(dot(dir, normalize(uBodyDir)), 0.0);
      float glowPower = mix(26.0, 5.0, clamp(uBodySize / 2.5, 0.0, 1.0));
      float bodyGlow = pow(bodyDot, glowPower) * uBodyPower;

      float cloudAngle = radians(uCloudOrientation);
      vec2 xz = normalize(dir.xz + vec2(0.0001));
      float domeFacing = dir.y;
      float domeMask = smoothstep(-0.08, 0.08, domeFacing);
      vec2 skyUv = vec2(xz.x * 0.92 + xz.y * 0.26, h * 1.42 + xz.y * 0.18);
      mat2 cloudOrientation = mat2(cos(cloudAngle), -sin(cloudAngle), sin(cloudAngle), cos(cloudAngle));
      skyUv = cloudOrientation * skyUv;
      float cloudNoise = cloudTexture(skyUv);
      float threshold = mix(0.84, 0.34, uCloudDensity);
      float feather = mix(0.006, 0.36, uCloudSoftness) * mix(0.7, 1.0, 1.0 - uCloudBillow);
      float veil = smoothstep(threshold - feather, threshold + feather, cloudNoise + uCloudCover * 0.22);
      veil *= uCloudCover * smoothstep(0.03, 0.24, h) * domeMask;

      vec3 cloudAccent = mix(uAccentA, uAccentB, smoothstep(0.28, 0.92, cloudNoise));
      vec3 cloudShade = mix(uMid * 0.48 + uHorizon * 0.3 + cloudAccent * 0.22, uHorizon * 0.86 + uMid * 0.18 + cloudAccent * 0.34, smoothstep(0.25, 0.86, cloudNoise));
      cloudShade = mix(cloudShade, uBodyColor * 0.82 + uAccentA * 0.34, bodyGlow * 0.22);
      cloudShade = mix(cloudShade, uBottom * 0.62 + uAccentB * 0.24, uStorm * (0.2 + cloudNoise * 0.18));
      color = mix(color, cloudShade * (0.42 + uCloudBrightness * 1.18), veil * 0.6);
      float starNight = max(uNight, smoothstep(0.72, 1.0, uStarDensity) * 0.5);
      float stars = starField(dir, h) * starNight * (1.0 - uCloudCover * 0.68);
      color += mix(uStarColor, uAccentB, 0.12) * stars * (1.18 + uStarDensity * 0.62);
      color += uBodyColor * bodyGlow * 0.28;
      color += mix(uAccentA, uBodyColor, 0.22) * uLightning * 0.42;
      color = mix(color, vec3(0.035, 0.04, 0.07), uStorm * 0.1);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const starShader = {
  uniforms: {
    uTime: { value: 0 },
    uDpr: { value: 1 },
    uNight: { value: 1 },
    uCloudCover: { value: 0 },
    uStarDensity: { value: 0.18 },
    uStarColor: { value: new THREE.Color(0x87e9ee) },
    uAccent: { value: new THREE.Color(0xff7300) },
  },
  vertexShader: `
    attribute float aSize;
    attribute float aPhase;
    attribute float aTone;
    uniform float uTime;
    uniform float uDpr;
    varying float vTwinkle;
    varying float vTone;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      vTwinkle = 0.55 + 0.45 * sin(uTime * (1.4 + aTone * 4.0) + aPhase);
      vTone = aTone;
      gl_PointSize = aSize * uDpr * vTwinkle;
    }
  `,
  fragmentShader: `
    uniform float uNight;
    uniform float uCloudCover;
    uniform float uStarDensity;
    uniform vec3 uStarColor;
    uniform vec3 uAccent;
    varying float vTwinkle;
    varying float vTone;

    void main() {
      vec2 uv = gl_PointCoord * 2.0 - 1.0;
      float r = length(uv);
      float starPresence = smoothstep(0.01, 0.32, uStarDensity);
      float cloudWindow = mix(1.0, 0.42, clamp(uCloudCover, 0.0, 1.0));
      float alpha = smoothstep(1.0, 0.05, r) * uNight * starPresence * cloudWindow * (0.82 + uStarDensity * 1.08) * vTwinkle;
      vec3 color = mix(mix(uStarColor, vec3(1.0), 0.42), uAccent, step(0.86, vTone) * 0.34);
      float core = smoothstep(0.34, 0.0, r) * 0.62;
      gl_FragColor = vec4(color * (1.22 + core), alpha);
    }
  `,
};

const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointerMedia = window.matchMedia("(pointer: coarse), (hover: none)");
const state = loadState();
let ambientCameraActive = false;
let ambientCameraBase = null;
let ambientCameraStartedAt = 0;
let lastPointerActivityAt = performance.now();
const cameraControlPaths = new Set(["lensMm", "cameraHeight", "cameraDistance", "cameraYaw", "cameraPitch"]);
const cameraLensPaths = new Set(["lensMm"]);
const liveControlPaths = new Set([
  ...cameraControlPaths,
  "timeOfDay",
  "skyGradientBand",
  "skyBodyX",
  "skyBodyY",
  "skyBodyZ",
  "skyBodyMode",
  "skyBodyIntensity",
  "skyBodySize",
  "moonPhase",
  "starDensity",
  "fogAmount",
  "buildingMotion",
  "buildingBpm",
  "reactiveSmoothing",
  "reactiveBeatVariance",
  "reactiveScaleX",
  "reactiveScaleY",
  "reactiveBuildingWave",
  "reactiveHeightSplit",
  "reactiveIndividuality",
  "reactiveShortBass",
  "reactiveTallTreble",
  "cloudCover",
  "cloudDensity",
  "cloudScale",
  "cloudSoftness",
  "cloudBillow",
  "cloudBrightness",
  "cloudSpeed",
  "cloudOrientation",
  "rainAmount",
  "windAmount",
  "stormAmount",
  "ambientFill",
  "bloom",
  "bloomThreshold",
  "pixelation",
  "postNoise",
  "paletteSteps",
  "dither",
  "aberration",
  "focalShift",
  "rainSpeed",
  "rainAngle",
  "renderScale",
  "maxFps",
]);
const atmosphereControlPaths = new Set(["birdAmount", "treeAmount"]);
const textureLabControlPaths = new Set([
  "accentAColor",
  "accentBColor",
  "highlightColor",
  "shadowColor",
  "skyBodyX",
  "skyBodyY",
  ...(controlGroups.find((group) => group.id === "textureLabControls")?.controls.map(([, path]) => path) ?? []),
]);
const playControlPaths = new Set(
  controlGroups.find((group) => group.id === "playControls")?.controls.map(([, path]) => path) ?? [],
);
const atmosphereRebuildParts = {
  starDensity: { stars: true, rain: false, birds: false, trees: false },
  rainAmount: { stars: false, rain: true, birds: false, trees: false },
  birdAmount: { stars: false, rain: false, birds: true, trees: false },
  treeAmount: { stars: false, rain: false, birds: false, trees: true },
};
let rebuildTimer = 0;
let cityRoot = new THREE.Group();
let skyRoot = new THREE.Group();
let starsRoot = new THREE.Group();
let treesRoot = new THREE.Group();
let birdsRoot = new THREE.Group();
let rainRoot = new THREE.Group();
let lightningPulse = 0;
let lightningCooldown = 0;
let skyBodyTextureKind = "";
let lastMoonPhaseBucket = -1;
let animationFrame = 0;
let lastRenderAt = 0;
let materialCount = 0;
let meshCount = 0;
let buildingCount = 0;
let windowCount = 0;
let cityColliders = [];
const cityPulse = {
  value: 0,
  lastBeat: -1,
  beatStrength: 1,
};
const audioReactive = {
  active: false,
  energy: 0,
  bass: 0,
  mid: 0,
  treble: 0,
};
let audioContext = null;
let audioAnalyser = null;
let audioSource = null;
let audioBins = null;
let audioRequestGeneration = 0;
let audioStartPending = false;
const audioStreams = new Set();
let lastTextureViewportWidth = 0;
let lastTextureViewportHeight = 0;
let textureLabRenderFrame = 0;
const materialCache = new Map();

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const windowGeometry = new THREE.PlaneGeometry(1, 1);
const treeCanopyGeometry = new THREE.ConeGeometry(1, 2, 5);
const birdWingGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-0.5, 0, 0),
  new THREE.Vector3(0, 0.18, 0),
  new THREE.Vector3(0.5, 0, 0),
]);
const domeGeometry = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
domeGeometry.scale(1, 0.54, 1);
const spireGeometry = new THREE.CylinderGeometry(0.035, 0.08, 1, 5);
const skyGeometry = new THREE.SphereGeometry(160, 32, 16);
const sharedGeometries = new Set([
  boxGeometry,
  windowGeometry,
  treeCanopyGeometry,
  birdWingGeometry,
  domeGeometry,
  spireGeometry,
  skyGeometry,
]);
const transformMatrix = new THREE.Matrix4();
const transformPosition = new THREE.Vector3();
const transformQuaternion = new THREE.Quaternion();
const transformScale = new THREE.Vector3();
const skyBodyWorld = new THREE.Vector3();
const skyBodyDir = new THREE.Vector3(0, 1, 0);
const lightningStart = new THREE.Vector3();
const cameraOrbitTarget = new THREE.Vector3();
const cameraOrbitPosition = new THREE.Vector3();
const cameraOrbitOffset = new THREE.Vector3();
const cameraOrbitSpherical = new THREE.Spherical();
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const dropPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dropPoint = new THREE.Vector3();
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.42;
const player = {
  active: false,
  draggingAvatar: false,
  avatarPointerId: null,
  grounded: false,
  position: new THREE.Vector3(0, PLAYER_HEIGHT / 2, -18),
  velocity: new THREE.Vector3(),
  bounceVelocity: new THREE.Vector3(),
  wallNormal: new THREE.Vector3(),
  jumpCount: 0,
  jumpWasPressed: false,
  yaw: 0,
};
const playCamera = {
  yaw: 0,
  yawOffset: 0,
  pitch: state.playCameraPitch,
  distance: state.playCameraDistance,
  minDistance: 6,
  maxDistance: 160,
  height: state.playCameraHeight,
  dragging: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
};
const mobilePlay = {
  pointerId: null,
  centerX: 0,
  centerY: 0,
  forward: 0,
  strafe: 0,
  jumpQueued: false,
};
const pressedKeys = new Set();

const studio = document.querySelector(".studio");
const toolbarToggle = document.querySelector("#toggleToolbar");
const aboutToggle = document.querySelector("#aboutToggle");
const aboutPanel = document.querySelector("#aboutPanel");
const canvas = document.querySelector("#scene");
const textureCanvas = document.querySelector("#textureLab");
const mobilePlayControls = document.querySelector("#mobilePlayControls");
const mobileJoystick = document.querySelector("#mobileJoystick");
const mobileJoystickKnob = document.querySelector("#mobileJoystickKnob");
const mobileJumpButton = document.querySelector("#mobileJumpButton");
let touchPlayWasActive = false;
let toolbarAutoCollapsed = false;
const textureContext = textureCanvas.getContext("2d", { willReadFrequently: true });
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: false,
});
renderer.setClearColor(0x0a0d13);
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xced4d8, 0.013);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
camera.filmGauge = 35;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), state.bloom * 1.9, 0.72, 0.82);
const painterlyPass = new ShaderPass(painterlyShader);
const grainPass = new ShaderPass(grainShader);
const outputPass = new OutputPass();
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(painterlyPass);
composer.addPass(grainPass);
composer.addPass(outputPass);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = false;
controls.minDistance = 8;
controls.maxDistance = 240;
controls.maxPolarAngle = Math.PI * 0.92;
["pointermove", "pointerdown", "wheel", "touchstart", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, resetAmbientCameraActivity, { passive: true });
});

const ambient = new THREE.HemisphereLight(0xf3f5f5, 0x77716b, 2.4);
scene.add(ambient);

const skyBodyLight = new THREE.DirectionalLight(0xffd5a1, 3.2);
skyBodyLight.position.set(-20, 38, 24);
scene.add(skyBodyLight);

const skyBodyDisc = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeSunTexture(),
    color: 0xffffff,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  }),
);
skyBodyDisc.renderOrder = -80;
scene.add(skyBodyDisc);

const lightningBolt = buildLightningBolt();
scene.add(lightningBolt);

const skyMaterial = new THREE.ShaderMaterial({
  ...skyShader,
  depthWrite: false,
  depthTest: false,
  side: THREE.BackSide,
});
const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
skyMesh.renderOrder = -100;
skyRoot.add(skyMesh);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({
    color: 0x12161c,
    roughness: 0.95,
    metalness: 0,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.visible = state.floorVisible === true;
scene.add(floor);

scene.add(cityRoot);
scene.add(skyRoot);
scene.add(starsRoot);
scene.add(treesRoot);
scene.add(birdsRoot);
scene.add(rainRoot);

const avatarRoot = new THREE.Group();
const avatarBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.68, PLAYER_HEIGHT, 0.68),
  new THREE.MeshStandardMaterial({
    color: 0xfff6df,
    roughness: 0.72,
    metalness: 0.02,
  }),
);
const avatarFront = new THREE.Mesh(
  new THREE.BoxGeometry(0.08, 0.48, 0.12),
  new THREE.MeshBasicMaterial({ color: 0x101010 }),
);
avatarFront.position.set(0, PLAYER_HEIGHT * 0.12, -0.4);
avatarRoot.add(avatarBody, avatarFront);
avatarRoot.visible = false;
scene.add(avatarRoot);

function loadState() {
  const initialState = sanitizeState({
    ...defaults,
    ...(presets[DEFAULT_PRESET] ?? {}),
    mode: "city",
    controlFilter: "",
  });
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
    return sanitizeState({ ...initialState, ...stored }, initialState);
  } catch {
    return initialState;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function wrapHue(value) {
  return ((value % 1) + 1) % 1;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

function rgbToHex([r, g, b]) {
  const encode = (value) => Math.round(clamp(value) * 255).toString(16).padStart(2, "0");
  return `#${encode(r)}${encode(g)}${encode(b)}`;
}

function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (Math.abs(max - min) < 0.0001) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  if (max === g) h = (b - r) / d + 2;
  if (max === b) h = (r - g) / d + 4;
  return { h: h / 6, s, l };
}

function hueToRgb(p, q, t) {
  const hue = wrapHue(t);
  if (hue < 1 / 6) return p + (q - p) * 6 * hue;
  if (hue < 1 / 2) return q;
  if (hue < 2 / 3) return p + (q - p) * (2 / 3 - hue) * 6;
  return p;
}

function hslToHex({ h, s, l }) {
  const safeH = wrapHue(h);
  const safeS = clamp(s);
  const safeL = clamp(l);
  if (safeS <= 0.0001) return rgbToHex([safeL, safeL, safeL]);
  const q = safeL < 0.5 ? safeL * (1 + safeS) : safeL + safeS - safeL * safeS;
  const p = 2 * safeL - q;
  return rgbToHex([hueToRgb(p, q, safeH + 1 / 3), hueToRgb(p, q, safeH), hueToRgb(p, q, safeH - 1 / 3)]);
}

// day / sunset / night from the scene mood value the presets set.
function sceneKeyFromValue(value) {
  if (value <= 0.5) return "day";
  if (value <= 1.5) return "sunset";
  return "night";
}

function isPlayMode() {
  return state.mode === "play";
}

function isReactiveMode() {
  return state.mode === "reactive";
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(rng, min, max) {
  return lerp(min, max, rng());
}

function makeSunTexture() {
  const size = 192;
  const canvasElement = document.createElement("canvas");
  canvasElement.width = size;
  canvasElement.height = size;
  const ctx = canvasElement.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "#fff8d8");
  gradient.addColorStop(0.18, "#fff2b8");
  gradient.addColorStop(0.58, "rgba(255, 157, 34, 0.82)");
  gradient.addColorStop(0.94, "rgba(255, 92, 74, 0.24)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeStarTexture() {
  const size = 32;
  const canvasElement = document.createElement("canvas");
  canvasElement.width = size;
  canvasElement.height = size;
  const ctx = canvasElement.getContext("2d");
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.24, "rgba(255,255,255,0.92)");
  gradient.addColorStop(0.58, "rgba(190,230,255,0.28)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeMoonTexture(phase) {
  const size = 192;
  const canvasElement = document.createElement("canvas");
  canvasElement.width = size;
  canvasElement.height = size;
  const ctx = canvasElement.getContext("2d");
  const center = size / 2;
  const radius = size * 0.36;
  const glow = ctx.createRadialGradient(center, center, radius * 0.15, center, center, size * 0.5);
  glow.addColorStop(0, "rgba(231,245,255,0.42)");
  glow.addColorStop(0.72, "rgba(102,156,255,0.11)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  const moonGradient = ctx.createRadialGradient(center - radius * 0.18, center - radius * 0.2, radius * 0.08, center, center, radius * 1.2);
  moonGradient.addColorStop(0, "#f1fbff");
  moonGradient.addColorStop(0.62, "#9fbfff");
  moonGradient.addColorStop(1, "#314878");
  ctx.fillStyle = moonGradient;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();
  const illum = 1 - Math.abs(phase - 0.5) * 2;
  const waxing = phase < 0.5 ? -1 : 1;
  const shadowX = center + waxing * radius * (1 - illum) * 0.82;
  const shadowGradient = ctx.createRadialGradient(shadowX - waxing * radius * 0.1, center - radius * 0.06, radius * 0.08, shadowX, center, radius * 1.18);
  shadowGradient.addColorStop(0, "#274283");
  shadowGradient.addColorStop(0.7, "#17223d");
  shadowGradient.addColorStop(1, "#0b1226");
  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(shadowX, center, Math.max(radius * 0.12, radius * illum), radius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function skyBodyBlend() {
  celestialState();
  return clamp((skyBodyWorld.y - 8) / 54);
}

function skyBodyOrbitPosition(hour) {
  const t = clamp((((hour - 6) % 24) + 24) % 24 / 12, 0, 1);
  const angle = t * Math.PI;
  const altitude = Math.max(0, Math.sin(angle));
  const pathT = smoothstep(0, 1, t);
  const lateralDrift = Math.sin(angle * 2) * 8;
  return new THREE.Vector3(
    lerp(SKY_BODY_ORBIT.sunriseX, SKY_BODY_ORBIT.sunsetX, pathT) + lateralDrift,
    SKY_BODY_ORBIT.horizonY + Math.pow(altitude, 0.72) * (SKY_BODY_ORBIT.apexY - SKY_BODY_ORBIT.horizonY),
    lerp(SKY_BODY_ORBIT.sunriseZ, SKY_BODY_ORBIT.sunsetZ, pathT) - altitude * SKY_BODY_ORBIT.noonZPull,
  );
}

function celestialState() {
  const hour = ((Number(state.timeOfDay ?? defaults.timeOfDay) % 24) + 24) % 24;
  const sceneKey = sceneKeyFromValue(Number(state.sceneMood ?? defaults.sceneMood));
  const sunAngle = ((hour - 6) / 12) * Math.PI;
  const sunAltitude = Math.sin(sunAngle);
  const sunFade = smoothstep(-0.22, -0.04, sunAltitude);
  const bodyKind = sunFade <= 0.001 ? "moon" : "sun";

  if (state.skyBodyMode === "manual") {
    skyBodyWorld.set(state.skyBodyX, state.skyBodyY, state.skyBodyZ);
  } else if (bodyKind === "moon") {
    skyBodyWorld.copy(skyBodyOrbitPosition((hour + 12) % 24));
  } else {
    skyBodyWorld.copy(skyBodyOrbitPosition(hour));
  }

  skyBodyDir.copy(skyBodyWorld).normalize();
  // Smooth, altitude-driven blends so any time-of-day reads sensibly.
  const dayAmount = smoothstep(0, 0.35, sunAltitude);
  const nightAmount = smoothstep(0.08, -0.32, sunAltitude);
  const goldenAmount = Math.max(0, 1 - Math.abs(sunAltitude) / 0.4);
  return { sceneKey, hour, bodyKind, dayAmount, nightAmount, goldenAmount, sunFade };
}

function updateSkyBodyTexture(kind) {
  const moonBucket = Math.round(state.moonPhase * 32);
  if (kind === skyBodyTextureKind && (kind !== "moon" || moonBucket === lastMoonPhaseBucket)) return;
  if (skyBodyDisc.material.map) skyBodyDisc.material.map.dispose();
  skyBodyDisc.material.map = kind === "moon" ? makeMoonTexture(state.moonPhase) : makeSunTexture();
  skyBodyDisc.material.needsUpdate = true;
  skyBodyTextureKind = kind;
  lastMoonPhaseBucket = moonBucket;
}

function paletteColor(path) {
  return new THREE.Color(state[path]);
}

function paletteAccent(rng) {
  return rng() < 0.5 ? paletteColor("accentAColor") : paletteColor("accentBColor");
}

function hash2(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function fbm(x, y, seed) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 5; i += 1) {
    value += smoothNoise(x * freq, y * freq, seed + i * 19.19) * amp;
    freq *= 2.03;
    amp *= 0.5;
  }
  return value;
}

function rgbFromColor(path) {
  const color = paletteColor(path);
  return [color.r * 255, color.g * 255, color.b * 255];
}

function rgbFromThreeColor(color) {
  return [color.r * 255, color.g * 255, color.b * 255];
}

function mixRgb(a, b, t) {
  const amount = clamp(t);
  return [
    lerp(a[0], b[0], amount),
    lerp(a[1], b[1], amount),
    lerp(a[2], b[2], amount),
  ];
}

function analogousBuildingPalette(base = paletteColor("accentAColor"), accent = paletteColor("accentBColor")) {
  const hsl = {};
  base.getHSL(hsl);
  const shadowColor = new THREE.Color().setHSL(
    (hsl.h - 0.09 + 1) % 1,
    clamp(hsl.s * 1.05 + 0.04),
    clamp(hsl.l - 0.16, 0.06, 0.82),
  );
  const highlightColor = new THREE.Color().setHSL(
    (hsl.h + 0.055) % 1,
    clamp(hsl.s * 0.86 + 0.03),
    clamp(hsl.l + 0.18, 0.16, 0.94),
  );
  return {
    shadow: rgbFromThreeColor(shadowColor),
    mid: rgbFromThreeColor(base),
    highlight: rgbFromThreeColor(highlightColor),
    accent: rgbFromThreeColor(accent),
  };
}

function blendAccentRgb(base, accent, amount, dodgeAmount) {
  const strength = clamp(amount);
  const dodge = clamp(dodgeAmount);
  const add = [
    Math.min(255, base[0] + accent[0] * strength),
    Math.min(255, base[1] + accent[1] * strength),
    Math.min(255, base[2] + accent[2] * strength),
  ];
  const colorDodge = [0, 1, 2].map((index) => {
    const blend = clamp((accent[index] / 255) * strength);
    return blend >= 0.99 ? 255 : Math.min(255, base[index] / (1 - blend));
  });
  return mixRgb(add, colorDodge, dodge);
}

function labTonePalette(options = {}) {
  const analogous = analogousBuildingPalette(options.baseColor, options.accentColor);
  const mid = analogous.mid;
  const spread = lerp(0.32, 1, smoothstep(0, 1, state.labContrast));
  return {
    shadow: mixRgb(mid, analogous.shadow, spread),
    mid,
    highlight: mixRgb(mid, analogous.highlight, spread),
    accent: mixRgb(mid, analogous.accent, spread),
    spread,
  };
}

function environmentGradientAmount(u, v) {
  celestialState();
  const skyX = clamp(0.5 + skyBodyWorld.x / 96, 0.02, 0.98);
  const verticalLight = 1 - v;
  const horizontalBias = clamp(1 - Math.abs(u - skyX) * 0.72, 0.35, 1);
  return Math.pow(clamp(verticalLight * horizontalBias), state.labGradientCurve);
}

function applyKuwahara(image, width, height, radius, amount) {
  if (amount <= 0.001) return image;
  const source = image.data;
  const output = new Uint8ClampedArray(source);
  const r = Math.max(1, Math.round(radius));
  const blendAmount = clamp(amount);
  const stride = width + 1;
  const size = stride * (height + 1);
  const sums = [
    new Float64Array(size),
    new Float64Array(size),
    new Float64Array(size),
    new Float64Array(size),
    new Float64Array(size),
    new Float64Array(size),
  ];

  for (let y = 1; y <= height; y += 1) {
    let rowR = 0;
    let rowG = 0;
    let rowB = 0;
    let rowRR = 0;
    let rowGG = 0;
    let rowBB = 0;
    for (let x = 1; x <= width; x += 1) {
      const sourceIndex = ((y - 1) * width + x - 1) * 4;
      const rValue = source[sourceIndex];
      const gValue = source[sourceIndex + 1];
      const bValue = source[sourceIndex + 2];
      rowR += rValue;
      rowG += gValue;
      rowB += bValue;
      rowRR += rValue * rValue;
      rowGG += gValue * gValue;
      rowBB += bValue * bValue;
      const targetIndex = y * stride + x;
      const aboveIndex = targetIndex - stride;
      sums[0][targetIndex] = sums[0][aboveIndex] + rowR;
      sums[1][targetIndex] = sums[1][aboveIndex] + rowG;
      sums[2][targetIndex] = sums[2][aboveIndex] + rowB;
      sums[3][targetIndex] = sums[3][aboveIndex] + rowRR;
      sums[4][targetIndex] = sums[4][aboveIndex] + rowGG;
      sums[5][targetIndex] = sums[5][aboveIndex] + rowBB;
    }
  }

  const sampleRect = (x0, y0, x1, y1) => {
    const left = clamp(Math.floor(x0), 0, width - 1);
    const top = clamp(Math.floor(y0), 0, height - 1);
    const right = clamp(Math.floor(x1), left, width - 1);
    const bottom = clamp(Math.floor(y1), top, height - 1);
    const a = left;
    const b = right + 1;
    const c = top;
    const d = bottom + 1;
    const topLeft = c * stride + a;
    const topRight = c * stride + b;
    const bottomLeft = d * stride + a;
    const bottomRight = d * stride + b;
    const count = (right - left + 1) * (bottom - top + 1);
    const sum = (channel) =>
      sums[channel][bottomRight] -
      sums[channel][topRight] -
      sums[channel][bottomLeft] +
      sums[channel][topLeft];
    const mean = [sum(0) / count, sum(1) / count, sum(2) / count];
    const variance =
      sum(3) / count -
      mean[0] * mean[0] +
      sum(4) / count -
      mean[1] * mean[1] +
      sum(5) / count -
      mean[2] * mean[2];
    return { mean, variance };
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let bestVariance = Infinity;
      let bestColor = [0, 0, 0];
      [
        sampleRect(x - r, y - r, x, y),
        sampleRect(x, y - r, x + r, y),
        sampleRect(x - r, y, x, y + r),
        sampleRect(x, y, x + r, y + r),
      ].forEach((sample) => {
        if (sample.variance < bestVariance) {
          bestVariance = sample.variance;
          bestColor = sample.mean;
        }
      });

      const i = (y * width + x) * 4;
      output[i] = Math.round(lerp(source[i], bestColor[0], blendAmount));
      output[i + 1] = Math.round(lerp(source[i + 1], bestColor[1], blendAmount));
      output[i + 2] = Math.round(lerp(source[i + 2], bestColor[2], blendAmount));
    }
  }

  return new ImageData(output, width, height);
}

function createLabTextureImageData(width, height, seed, blockSize, options = {}) {
  const data = new Uint8ClampedArray(width * height * 4);
  const { shadow, mid, highlight, accent, spread } = labTonePalette(options);
  const block = Math.max(1, Math.round(blockSize));
  const shadowGate = Math.min(state.labShadowGate, state.labHighlightGate - 0.04);
  const highlightGate = Math.max(state.labHighlightGate, shadowGate + 0.04);
  const toneContrast = lerp(0.86, 1.58, smoothstep(1, 2.6, state.labContrast));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const qx = Math.floor(x / block) * block;
      const qy = Math.floor(y / block) * block;
      const u = qx / width;
      const v = qy / height;
      const broad = fbm(u * state.labNoiseScaleX, v * state.labNoiseScaleY, seed);
      const blockNoise = smoothNoise(u * state.labNoiseScaleX * 0.72, v * state.labNoiseScaleY * 0.88, seed + 29);
      let tone = broad * 0.76 + blockNoise * 0.24;
      tone = clamp((tone - 0.5) * toneContrast + 0.5 + state.labBrightness);

      let color = mid;
      if (tone < shadowGate) {
        color = mixRgb(shadow, mid, smoothstep(shadowGate - 0.12, shadowGate, tone) * 0.18);
      } else if (tone > highlightGate) {
        color = mixRgb(mid, highlight, 0.72 + smoothstep(highlightGate, highlightGate + 0.18, tone) * 0.28);
      } else {
        const midT = (tone - shadowGate) / (highlightGate - shadowGate);
        color = mixRgb(mid, highlight, midT * 0.18);
      }

      const gradient = environmentGradientAmount(u, v);
      const envLight = mixRgb(rgbFromColor("shadowColor"), rgbFromColor("highlightColor"), gradient);
      color = mixRgb(color, envLight, state.labGradientStrength * (0.16 + gradient * 0.68));

      const accentCell = hash2(Math.floor(u * 24), Math.floor(v * 34), seed + 311);
      const accentMask = smoothstep(1 - state.labAccentDensity, 1, accentCell);
      if (accentMask > 0.001) {
        color = blendAccentRgb(
          color,
          accent,
          accentMask * state.labAccentStrength * lerp(0.4, 1, spread),
          state.labAccentDodge,
        );
      }

      const i = (y * width + x) * 4;
      data[i] = Math.round(color[0]);
      data[i + 1] = Math.round(color[1]);
      data[i + 2] = Math.round(color[2]);
      data[i + 3] = 255;
    }
  }

  return new ImageData(data, width, height);
}

function scheduleTextureLabRender() {
  if (textureLabRenderFrame) return;
  textureLabRenderFrame = requestAnimationFrame(() => {
    textureLabRenderFrame = 0;
    renderTextureLab();
  });
}

function renderTextureLab() {
  if (state.mode !== "texture" || !textureContext) return;

  const viewportWidth = textureCanvas.clientWidth || window.innerWidth;
  const viewportHeight = textureCanvas.clientHeight || window.innerHeight;
  lastTextureViewportWidth = viewportWidth;
  lastTextureViewportHeight = viewportHeight;
  const ratio = Math.min(1, 384 / Math.max(1, viewportWidth));
  const width = Math.max(1, Math.floor(viewportWidth * ratio));
  const height = Math.max(1, Math.floor(viewportHeight * ratio));
  if (textureCanvas.width !== width || textureCanvas.height !== height) {
    textureCanvas.width = width;
    textureCanvas.height = height;
  }

  const seed = state.seed + 17013;
  const block = Math.max(1, Math.round(state.labBlockSize * ratio));
  let image = createLabTextureImageData(width, height, seed, block);
  image = applyKuwahara(
    image,
    width,
    height,
    state.labKuwaharaRadius,
    state.labKuwaharaAmount,
  );
  textureContext.putImageData(image, 0, 0);
}

function makePainterTexture(seed, spec, baseColor, accentColor) {
  const width = 96;
  const height = 128;
  const depthScale = spec ? lerp(1, 2.8, spec.depthT) : 1;
  const block = Math.max(1, Math.round((state.labBlockSize * width * depthScale) / 384));
  let image = createLabTextureImageData(width, height, seed, block, { baseColor, accentColor });
  image = applyKuwahara(
    image,
    width,
    height,
    Math.max(1, Math.round((state.labKuwaharaRadius * width * depthScale) / 192)),
    state.labKuwaharaAmount,
  );
  const texture = new THREE.DataTexture(new Uint8Array(image.data), width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

function lightingSettings() {
  const sky = paletteColor("skyColor");
  const highlight = paletteColor("highlightColor");
  const shadow = paletteColor("shadowColor");

  return {
    clear: sky.getHex(),
    fog: sky.clone().lerp(shadow, 0.18).getHex(),
    fogDensity: 0.012,
    hemiSky: sky.clone().lerp(new THREE.Color(0xffffff), 0.42).getHex(),
    hemiGround: shadow.clone().lerp(sky, 0.28).getHex(),
    hemiIntensity: 2.7,
    skyBody: highlight.getHex(),
    skyBodyIntensity: 3.8,
    buildingLift: 0.22,
    saturationLift: -0.04,
    windowBoost: 0.42,
  };
}

function updateSkyGradient() {
  const celestial = celestialState();
  const sky = paletteColor("skyColor");
  const highlight = paletteColor("highlightColor");
  const shadow = paletteColor("shadowColor");
  const accentA = paletteColor("accentAColor");
  const accentB = paletteColor("accentBColor");
  const storm = state.stormAmount;
  const twilight = celestial.goldenAmount;
  const highlightDominance = clamp(state.highlightReach);
  const sunsetTakeover = clamp(twilight * 1.35) * smoothstep(0.62, 0.9, highlightDominance);
  const manualGradientBand = clamp(Number(state.skyGradientBand ?? 0.5));
  const sunGradientBand = 1 - smoothstep(-0.18, 0.04, skyBodyDir.y);
  const gradientBand = clamp(lerp(manualGradientBand, sunGradientBand, sunsetTakeover * 0.42));
  const highlightGradientShare = lerp(clamp(0.24 + twilight * 0.18), 0.75, sunsetTakeover);
  const horizon = highlight
    .clone()
    .lerp(sky, lerp(0.16, 0.02, sunsetTakeover))
    .lerp(accentA, twilight * lerp(0.26, 0.12, sunsetTakeover));
  const mid = sky
    .clone()
    .lerp(highlight, highlightGradientShare)
    .lerp(accentB, (storm * 0.2 + celestial.nightAmount * 0.08) * lerp(1, 0.28, sunsetTakeover));
  const bottom = shadow
    .clone()
    .lerp(sky, 0.18)
    .lerp(highlight, sunsetTakeover * 0.52)
    .lerp(accentB, (storm * 0.16 + celestial.nightAmount * 0.18) * lerp(1, 0.35, sunsetTakeover));
  const top = sky
    .clone()
    .lerp(highlight, sunsetTakeover * 0.34 * highlightGradientShare)
    .lerp(shadow, (state.fogAmount * 0.16 + storm * 0.18) * lerp(1, 0.22, sunsetTakeover));
  const bodyColor = celestial.bodyKind === "moon"
    ? shadow.clone().lerp(sky, 0.24).lerp(accentB, 0.52 + celestial.nightAmount * 0.24).lerp(highlight, 0.12)
    : highlight.clone().lerp(sky, celestial.dayAmount * 0.14).lerp(accentA, 0.1 + twilight * 0.34).lerp(new THREE.Color(0xffffff), celestial.dayAmount * 0.08);
  skyMaterial.uniforms.uTop.value.copy(top);
  skyMaterial.uniforms.uMid.value.copy(mid);
  skyMaterial.uniforms.uHorizon.value.copy(horizon);
  skyMaterial.uniforms.uBottom.value.copy(bottom);
  skyMaterial.uniforms.uGradientBand.value = gradientBand;
  skyMaterial.uniforms.uBodyDir.value.copy(skyBodyDir);
  skyMaterial.uniforms.uBodyColor.value.copy(bodyColor);
  skyMaterial.uniforms.uAccentA.value.copy(accentA);
  skyMaterial.uniforms.uAccentB.value.copy(accentB);
  skyMaterial.uniforms.uBodyPower.value = state.skyBodyIntensity * (celestial.bodyKind === "moon" ? 0.56 : celestial.sunFade);
  skyMaterial.uniforms.uBodySize.value = state.skyBodySize;
  skyMaterial.uniforms.uCloudCover.value = state.cloudCover;
  skyMaterial.uniforms.uCloudDensity.value = state.cloudDensity;
  skyMaterial.uniforms.uCloudScale.value = state.cloudScale;
  skyMaterial.uniforms.uCloudSoftness.value = state.cloudSoftness;
  skyMaterial.uniforms.uCloudBillow.value = state.cloudBillow;
  skyMaterial.uniforms.uCloudBrightness.value = state.cloudBrightness;
  skyMaterial.uniforms.uCloudSpeed.value = state.cloudSpeed;
  skyMaterial.uniforms.uCloudOrientation.value = state.cloudOrientation;
  skyMaterial.uniforms.uWind.value = state.windAmount;
  skyMaterial.uniforms.uStorm.value = storm;
  skyMaterial.uniforms.uLightning.value = lightningPulse;
  skyMaterial.uniforms.uNight.value = celestial.nightAmount;
  skyMaterial.uniforms.uStarDensity.value = state.starDensity;
  skyMaterial.uniforms.uStarColor.value.copy(
    sky.clone().lerp(highlight, 0.16).lerp(accentA, 0.22).lerp(new THREE.Color(0xffffff), 0.52),
  );
  return { celestial, bodyColor };
}

function applyLighting() {
  const light = lightingSettings();
  const { celestial, bodyColor } = updateSkyGradient();
  const skyBodyHeight = clamp((skyBodyWorld.y - 8) / 54);
  renderer.setClearColor(light.clear);
  scene.fog.color.setHex(light.fog);
  scene.fog.density = light.fogDensity * lerp(0.35, 2.1, clamp(state.fogAmount + state.cloudCover * 0.14 + state.stormAmount * 0.18));
  ambient.color.setHex(light.hemiSky);
  ambient.groundColor.setHex(light.hemiGround);
  ambient.intensity = light.hemiIntensity * state.ambientFill * (1 - state.stormAmount * 0.18) + lightningPulse * 0.72;
  skyBodyLight.color.copy(bodyColor);
  const skyBodyVisibility = celestial.bodyKind === "moon" ? 1 : celestial.sunFade;
  skyBodyLight.intensity =
    light.skyBodyIntensity *
    lerp(0.5, 1.12, skyBodyHeight) *
    state.skyBodyIntensity *
    skyBodyVisibility *
    (1 - state.stormAmount * 0.48) +
    lightningPulse * 4;
  skyBodyLight.position.copy(skyBodyWorld);
  updateSkyBodyTexture(celestial.bodyKind);
  skyBodyDisc.position.copy(skyBodyWorld);
  skyBodyDisc.scale.setScalar(lerp(4.2, 9.8, clamp(state.skyBodySize / 2.5)) * lerp(0.86, 1.18, celestial.goldenAmount));
  skyBodyDisc.material.opacity =
    state.skyBodyIntensity *
    (celestial.bodyKind === "moon" ? 0.48 : 0.72) *
    skyBodyVisibility *
    (1 - state.cloudCover * (celestial.bodyKind === "moon" ? 0.34 : 0.56)) *
    (1 - state.stormAmount * 0.68);
  skyBodyDisc.material.color.copy(bodyColor);
  floor.material.color.copy(paletteColor("shadowColor").lerp(paletteColor("skyColor"), 0.18));
}

function transformedGeometry(source, position, scale, rotationY = 0) {
  const geometry = source.clone();
  transformPosition.set(position[0], position[1], position[2]);
  transformQuaternion.setFromEuler(new THREE.Euler(0, rotationY, 0));
  transformScale.set(scale[0], scale[1], scale[2]);
  transformMatrix.compose(transformPosition, transformQuaternion, transformScale);
  geometry.applyMatrix4(transformMatrix);
  return geometry;
}

function addBoxGeometry(geometries, width, height, depth, x, y, z) {
  geometries.push(transformedGeometry(boxGeometry, [x, y, z], [width, height, depth]));
}

function addEdgeChunks(geometries, rng, spec, width, depth, height) {
  const count = Math.round((5 + height * 0.45) * spec.edgeChunkDensity * spec.deformation * spec.lodDetail);
  for (let i = 0; i < count; i += 1) {
    const side = Math.floor(rng() * 4);
    const chunkWidth = randomBetween(rng, 0.18, 0.78) * spec.deformation;
    const chunkHeight = randomBetween(rng, 0.25, 1.6) * spec.deformation;
    const chunkDepth = randomBetween(rng, 0.14, 0.65) * spec.deformation;
    const w = side < 2 ? chunkWidth : chunkDepth;
    const d = side < 2 ? chunkDepth : chunkWidth;
    const y = randomBetween(rng, chunkHeight * 0.5, height - chunkHeight * 0.5);
    const onLeft = side === 0;
    const onRight = side === 1;
    const onFront = side === 2;
    const onBack = side === 3;
    const x = onLeft ? -width / 2 - chunkDepth / 2 : onRight ? width / 2 + chunkDepth / 2 : randomBetween(rng, -width * 0.46, width * 0.46);
    const z = onFront ? depth / 2 + chunkDepth / 2 : onBack ? -depth / 2 - chunkDepth / 2 : randomBetween(rng, -depth * 0.46, depth * 0.46);
    addBoxGeometry(geometries, w, chunkHeight, d, x, y, z);
  }
}

function addRoofDetails(geometries, rng, spec, width, depth, height) {
  const count = Math.round(1 + spec.roofDetailDensity * 9 * spec.lodDetail);
  for (let i = 0; i < count; i += 1) {
    if (rng() > spec.roofDetailDensity) continue;
    const w = randomBetween(rng, 0.18, 0.8);
    const d = randomBetween(rng, 0.18, 0.9);
    const h = randomBetween(rng, 0.18, 1.8) * (0.45 + spec.deformation);
    addBoxGeometry(
      geometries,
      w,
      h,
      d,
      randomBetween(rng, -width * 0.38, width * 0.38),
      height + h / 2,
      randomBetween(rng, -depth * 0.38, depth * 0.38),
    );
  }

  if (rng() < spec.domeChance && spec.lodDetail > 0.45) {
    const radius = Math.min(width, depth) * 0.36 * spec.domeScale;
    geometries.push(
      transformedGeometry(
        domeGeometry,
        [
          randomBetween(rng, -width * 0.18, width * 0.18),
          height,
          randomBetween(rng, -depth * 0.18, depth * 0.18),
        ],
        [radius, radius, radius],
      ),
    );
  }

  if (rng() < spec.spireDensity && spec.lodDetail > 0.35) {
    const spireHeight = randomBetween(rng, 1.5, 4.8) * spec.spireDensity;
    geometries.push(
      transformedGeometry(
        spireGeometry,
        [
          randomBetween(rng, -width * 0.34, width * 0.34),
          height + spireHeight / 2,
          randomBetween(rng, -depth * 0.34, depth * 0.34),
        ],
        [1, spireHeight, 1],
      ),
    );
  }
}

function createWindowStyle(rng, spec) {
  const styles = [
    {
      name: "office",
      density: 1.08,
      width: 0.82,
      height: 0.9,
      spacingX: 2.55,
      spacingY: 2.4,
      jitter: 0.45,
      banding: 0.08,
      offChance: 0.18,
      brightness: 1.05,
    },
    {
      name: "slits",
      density: 0.82,
      width: 0.36,
      height: 1.45,
      spacingX: 3.25,
      spacingY: 2.7,
      jitter: 0.34,
      banding: 0.12,
      offChance: 0.28,
      brightness: 0.92,
    },
    {
      name: "chunky",
      density: 0.62,
      width: 1.55,
      height: 1.22,
      spacingX: 4.15,
      spacingY: 3.25,
      jitter: 0.72,
      banding: 0.1,
      offChance: 0.34,
      brightness: 1,
    },
    {
      name: "bands",
      density: 1.2,
      width: 1.42,
      height: 0.48,
      spacingX: 2.05,
      spacingY: 3.35,
      jitter: 0.24,
      banding: 0.58,
      offChance: 0.14,
      brightness: 0.98,
    },
    {
      name: "sparse",
      density: 0.36,
      width: 0.94,
      height: 0.95,
      spacingX: 4.65,
      spacingY: 4.15,
      jitter: 0.9,
      banding: 0.03,
      offChance: 0.52,
      brightness: 0.78,
    },
    {
      name: "chaotic",
      density: 0.74,
      width: 0.9,
      height: 1,
      spacingX: 2.7,
      spacingY: 2.85,
      jitter: 1.15,
      banding: 0.2,
      offChance: 0.38,
      brightness: 1.12,
    },
  ];
  const style = styles[Math.floor(rng() * styles.length)];
  return {
    ...style,
    density: style.density * randomBetween(rng, 0.72, 1.24),
    width: style.width * randomBetween(rng, 0.75, 1.28),
    height: style.height * randomBetween(rng, 0.75, 1.28),
    spacingX: style.spacingX * randomBetween(rng, 0.82, 1.24),
    spacingY: style.spacingY * randomBetween(rng, 0.82, 1.22),
    temperature: randomBetween(rng, -0.06, 0.08),
    facadePhase: rng() * Math.PI * 2,
    dabChance: randomBetween(rng, 0.1, 0.34) * spec.lodWindowDetail,
  };
}

function addWindows(group, rng, spec, width, depth, height, warmColor) {
  const matrices = [];
  const colors = [];
  const dummy = new THREE.Object3D();
  const style = createWindowStyle(rng, spec);
  const spacingX = Math.max(0.32, spec.windowWidth * style.spacingX);
  const spacingY = Math.max(0.45, spec.windowHeight * style.spacingY);
  const windowDensity = clamp(spec.windowDensity * spec.lodWindowDetail * style.density, 0, 0.96);
  const faces = [
    { axis: "z", sign: 1, span: width, depthOffset: depth / 2 + 0.012, rotation: 0 },
    { axis: "z", sign: -1, span: width, depthOffset: -depth / 2 - 0.012, rotation: Math.PI },
    { axis: "x", sign: 1, span: depth, depthOffset: width / 2 + 0.012, rotation: Math.PI / 2 },
    { axis: "x", sign: -1, span: depth, depthOffset: -width / 2 - 0.012, rotation: -Math.PI / 2 },
  ];

  faces.forEach((face) => {
    const columns = Math.max(1, Math.floor(face.span / spacingX));
    const rows = Math.max(1, Math.floor((height - 1.2) / spacingY));
    const facePhase = rng() * Math.PI * 2;
    for (let row = 0; row < rows; row += 1) {
      const bandBoost = Math.sin(row * 1.73 + style.facadePhase + facePhase) > 0.15 ? style.banding : 0;
      for (let col = 0; col < columns; col += 1) {
        const columnNoise = Math.sin(col * 2.1 + row * 0.73 + facePhase) * 0.08;
        const localDensity = clamp(windowDensity + bandBoost + columnNoise, 0, 0.98);
        if (rng() > localDensity || rng() < style.offChance * 0.22) continue;
        const chaos = style.name === "chaotic" ? randomBetween(rng, -0.18, 0.18) : 0;
        const xLocal =
          (col - (columns - 1) / 2) * spacingX +
          randomBetween(rng, -0.12, 0.12) * spec.windowJitter * style.jitter +
          chaos;
        const y = 0.8 + row * spacingY + randomBetween(rng, -0.2, 0.2) * spec.windowJitter * style.jitter;
        const w = spec.windowWidth * style.width * randomBetween(rng, 0.68, 1.34);
        const h = spec.windowHeight * style.height * randomBetween(rng, 0.68, 1.38);
        dummy.position.set(
          face.axis === "z" ? xLocal : face.depthOffset,
          y,
          face.axis === "z" ? face.depthOffset : xLocal,
        );
        dummy.rotation.set(0, face.rotation, 0);
        dummy.scale.set(w, h, 1);
        dummy.updateMatrix();
        matrices.push(dummy.matrix.clone());
        const color = warmColor.clone();
        const rowGlow = Math.sin(row * 0.94 + style.facadePhase) * 0.05;
        const temperature = style.temperature + randomBetween(rng, -0.045, 0.05);
        const brightness = (style.brightness - 1) * 0.18 + rowGlow + randomBetween(rng, -0.13, 0.19);
        color.offsetHSL(temperature, randomBetween(rng, -0.1, 0.08), brightness);
        colors.push(color);

        if (rng() < style.dabChance && w > 0.08 && h > 0.08) {
          dummy.position.set(
            face.axis === "z" ? xLocal + randomBetween(rng, -w * 0.16, w * 0.16) : face.depthOffset + 0.002 * face.sign,
            y + randomBetween(rng, -h * 0.12, h * 0.12),
            face.axis === "z" ? face.depthOffset + 0.002 * face.sign : xLocal + randomBetween(rng, -w * 0.16, w * 0.16),
          );
          dummy.scale.set(w * randomBetween(rng, 0.28, 0.62), h * randomBetween(rng, 0.22, 0.58), 1);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());
          const dabColor = color.clone();
          dabColor.offsetHSL(randomBetween(rng, -0.025, 0.035), randomBetween(rng, -0.03, 0.08), randomBetween(rng, 0.08, 0.18));
          colors.push(dabColor);
        }
      }
    }
  });

  if (!matrices.length) return;

  const windowMaterial = getWindowMaterial(spec);
  const windows = new THREE.InstancedMesh(windowGeometry, windowMaterial, matrices.length);
  matrices.forEach((matrix, index) => {
    windows.setMatrixAt(index, matrix);
    windows.setColorAt(index, colors[index]);
  });
  windows.instanceMatrix.needsUpdate = true;
  windows.instanceColor.needsUpdate = true;
  group.add(windows);
  meshCount += 1;
  windowCount += matrices.length;
}

function materialRevision() {
  return [
    state.skyColor,
    state.highlightColor,
    state.shadowColor,
    state.accentAColor,
    state.accentBColor,
    state.highlightReach,
    state.accentScatter,
    state.labAccentDensity,
    state.labAccentStrength,
    state.labAccentDodge,
    state.labNoiseScaleX,
    state.labNoiseScaleY,
    state.labBlockSize,
    state.labBrightness,
    state.labContrast,
    state.labShadowGate,
    state.labHighlightGate,
    state.labGradientStrength,
    state.labGradientCurve,
    state.labKuwaharaAmount,
    state.labKuwaharaRadius,
    state.sceneMood,
    state.skyBodyMode,
    state.skyBodyX,
    state.skyBodyY,
  ].join(":");
}

function getBuildingMaterial(spec) {
  const key = `building:${spec.materialIndex}:${materialRevision()}`;
  if (materialCache.has(key)) return materialCache.get(key);

  const rng = mulberry32(spec.materialSeed);
  const light = lightingSettings();
  const sunBias = clamp(spec.sunBlend * state.highlightReach + randomBetween(rng, -0.16, 0.16), 0, 1);
  const cool = paletteColor("shadowColor")
    .lerp(paletteColor("highlightColor"), sunBias)
    .offsetHSL(randomBetween(rng, -0.02, 0.02), 0, light.buildingLift + randomBetween(rng, -0.04, 0.04));
  const accent = paletteAccent(rng).lerp(paletteColor("highlightColor"), randomBetween(rng, 0.05, 0.28) * state.highlightReach);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: makePainterTexture(spec.materialSeed, spec, cool, accent),
    roughness: 0.9,
    metalness: 0.02,
  });
  materialCount += 1;
  materialCache.set(key, material);
  return material;
}

function getWindowMaterial(spec) {
  const opacityBucket = Math.round(spec.windowGlow * 10) / 10;
  const key = `window:${opacityBucket}`;
  if (materialCache.has(key)) return materialCache.get(key);

  const glowLift = 1.15 + opacityBucket * 1.85;
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(glowLift, glowLift, glowLift),
    transparent: true,
    opacity: 0.5 + opacityBucket * 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  material.toneMapped = false;
  materialCount += 1;
  materialCache.set(key, material);
  return material;
}

function createBuilding(spec) {
  const rng = mulberry32(spec.seed);
  const group = new THREE.Group();
  const geometries = [];
  const material = getBuildingMaterial(spec);
  const warm = paletteColor("highlightColor").lerp(paletteAccent(rng), rng() < state.accentScatter ? 0.52 : 0.08);

  let y = 0;
  let currentWidth = spec.width;
  let currentDepth = spec.depth;
  const tierCount = Math.max(1, Math.round(spec.tierCount));
  const tierHeights = [];
  let totalWeight = 0;
  for (let i = 0; i < tierCount; i += 1) {
    const weight = randomBetween(rng, 0.7, 1.35) * lerp(1.2, 0.72, i / Math.max(1, tierCount - 1));
    tierHeights.push(weight);
    totalWeight += weight;
  }
  for (let i = 0; i < tierHeights.length; i += 1) {
    tierHeights[i] = (tierHeights[i] / totalWeight) * spec.height;
  }

  tierHeights.forEach((tierHeight, index) => {
    const outdent = randomBetween(rng, -spec.tierInset, spec.tierInset * 1.2) * spec.deformation;
    if (index > 0) {
      currentWidth = Math.max(0.7, currentWidth * (1 - spec.tierInset * randomBetween(rng, 0.1, 1.3)) + outdent);
      currentDepth = Math.max(0.7, currentDepth * (1 - spec.tierInset * randomBetween(rng, 0.1, 1.3)) + outdent * 0.75);
    }
    addBoxGeometry(
      geometries,
      currentWidth,
      tierHeight,
      currentDepth,
      randomBetween(rng, -0.28, 0.28) * spec.deformation,
      y + tierHeight / 2,
      randomBetween(rng, -0.28, 0.28) * spec.deformation,
    );
    y += tierHeight;
  });

  addEdgeChunks(geometries, rng, spec, spec.width, spec.depth, spec.height);
  addRoofDetails(geometries, rng, spec, currentWidth, currentDepth, spec.height);

  const mergedGeometry = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  const body = new THREE.Mesh(mergedGeometry, material);
  group.add(body);
  meshCount += 1;
  buildingCount += 1;

  addWindows(group, rng, spec, spec.width, spec.depth, spec.height * 0.96, warm);
  return group;
}

function getBuildingSpec(seed, width, depth, height, depthT) {
  const light = lightingSettings();
  const lodDetail = lerp(1, 0.34, depthT);
  const lodWindowDetail = lerp(1, 0.42, depthT);
  const materialIndex = Math.floor(depthT * 4) * 3 + (seed % 3);
  return {
    seed,
    materialSeed: state.seed * 31 + materialIndex * 101,
    materialIndex,
    depthT,
    width,
    depth,
    height,
    tierCount: state.tierCount,
    tierInset: state.tierInset,
    deformation: state.deformation,
    edgeChunkDensity: state.edgeChunkDensity * lerp(1.15, 0.55, depthT),
    roofDetailDensity: state.roofDetailDensity * lerp(1.15, 0.5, depthT),
    domeChance: state.domeChance,
    domeScale: state.domeScale,
    spireDensity: state.spireDensity * lerp(1, 0.55, depthT),
    windowDensity: state.windowDensity * lerp(1.15, 0.72, depthT),
    windowWidth: state.windowWidth,
    windowHeight: state.windowHeight,
    windowJitter: state.windowJitter,
    windowGlow: state.windowGlow * light.windowBoost,
    sunBlend: 0.5,
    lodDetail,
    lodWindowDetail,
  };
}

function disposeObject(object) {
  const disposedMaterials = new Set();
  object.traverse((child) => {
    if (child.geometry && !sharedGeometries.has(child.geometry)) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (disposedMaterials.has(material)) return;
        disposedMaterials.add(material);
        if (material.map) material.map.dispose();
        material.dispose();
      });
    }
  });
}

function resetRoot(root) {
  scene.remove(root);
  disposeObject(root);
  const nextRoot = new THREE.Group();
  scene.add(nextRoot);
  return nextRoot;
}

function rebuildAtmosphere(parts = {}) {
  const { stars = true, rain = true, birds = true, trees = true } = parts;
  const rng = mulberry32(state.seed + 8807);
  if (stars) {
    starsRoot = resetRoot(starsRoot);
    buildStars(rng);
  }
  if (rain) {
    rainRoot = resetRoot(rainRoot);
    buildRain(rng);
  }
  if (birds) {
    birdsRoot = resetRoot(birdsRoot);
    buildBirds(rng);
  }
  if (trees) {
    treesRoot = resetRoot(treesRoot);
    buildTrees(rng);
  }
}

function buildStars(rng) {
  const positions = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const phases = new Float32Array(STAR_COUNT);
  const tones = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i += 1) {
    const az = randomBetween(rng, -Math.PI, Math.PI);
    const alt = randomBetween(rng, 0.04, 1.24);
    const radius = randomBetween(rng, 86, 120);
    positions[i * 3] = Math.cos(az) * Math.cos(alt) * radius;
    positions[i * 3 + 1] = Math.sin(alt) * radius;
    positions[i * 3 + 2] = Math.sin(az) * Math.cos(alt) * radius;
    sizes[i] = randomBetween(rng, 2.2, 6.8);
    phases[i] = rng() * Math.PI * 2;
    tones[i] = rng();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aTone", new THREE.BufferAttribute(tones, 1));
  const material = new THREE.PointsMaterial({
    color: 0xdaf6ff,
    map: makeStarTexture(),
    size: 0.2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(geometry, material);
  stars.renderOrder = -90;
  starsRoot.add(stars);
  updateStarUniforms(0);
}

function buildRain(rng) {
  const positions = new Float32Array(MAX_RAIN_DROPS * 6);
  const base = new Float32Array(MAX_RAIN_DROPS * 3);
  const lengths = new Float32Array(MAX_RAIN_DROPS);
  const phases = new Float32Array(MAX_RAIN_DROPS);
  const speeds = new Float32Array(MAX_RAIN_DROPS);
  for (let i = 0; i < MAX_RAIN_DROPS; i += 1) {
    base[i * 3] = randomBetween(rng, -42, 42);
    base[i * 3 + 1] = randomBetween(rng, -8, 36);
    base[i * 3 + 2] = randomBetween(rng, -18, 58);
    lengths[i] = randomBetween(rng, 1.6, 5.2);
    phases[i] = rng() * 100;
    speeds[i] = randomBetween(rng, 0.7, 1.3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.userData.base = base;
  geometry.userData.lengths = lengths;
  geometry.userData.phases = phases;
  geometry.userData.speeds = speeds;
  geometry.setDrawRange(0, 0);
  const material = new THREE.LineBasicMaterial({
    color: paletteColor("skyColor").lerp(paletteColor("highlightColor"), 0.22),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const rain = new THREE.LineSegments(geometry, material);
  rain.renderOrder = 5;
  updateRainGeometry(rain, 0);
  rainRoot.add(rain);
}

function updateStarUniforms(time) {
  const celestial = celestialState();
  starsRoot.children.forEach((stars) => {
    if (stars.material?.uniforms) {
      stars.material.uniforms.uTime.value = time;
      stars.material.uniforms.uDpr.value = renderer.getPixelRatio();
      stars.material.uniforms.uNight.value = celestial.nightAmount;
      stars.material.uniforms.uCloudCover.value = state.cloudCover;
      stars.material.uniforms.uStarDensity.value = state.starDensity;
      stars.material.uniforms.uStarColor.value.copy(
        paletteColor("skyColor").lerp(paletteColor("highlightColor"), 0.2).lerp(paletteColor("accentAColor"), 0.28),
      );
      stars.material.uniforms.uAccent.value.copy(paletteColor("accentBColor").lerp(paletteColor("highlightColor"), 0.18));
      return;
    }
    const presence = smoothstep(0.01, 0.32, state.starDensity);
    const cloudWindow = lerp(1, 0.42, clamp(state.cloudCover));
    stars.material.opacity = clamp(celestial.nightAmount * presence * cloudWindow * (0.72 + state.starDensity * 0.4));
    stars.material.size = (1.2 + state.starDensity * 1.35) * renderer.getPixelRatio();
    stars.material.color.copy(
      paletteColor("skyColor")
        .lerp(paletteColor("highlightColor"), 0.16)
        .lerp(paletteColor("accentAColor"), 0.22)
        .lerp(new THREE.Color(0xffffff), 0.52),
    );
  });
}

function updateRainGeometry(rain, time) {
  const position = rain.geometry.getAttribute("position");
  const base = rain.geometry.userData.base;
  const lengths = rain.geometry.userData.lengths;
  const phases = rain.geometry.userData.phases;
  const speeds = rain.geometry.userData.speeds;
  if (!base || !lengths || !phases || !speeds) return;

  const fallSpan = 44;
  const top = 37;
  const count = Math.round(MAX_RAIN_DROPS * state.rainAmount);
  const slant = lerp(-0.1, -1.9, state.rainAngle) * lerp(0.72, 1.3, state.windAmount);
  const fallSpeed = lerp(4, 32, state.rainSpeed || state.rainAmount) * lerp(0.75, 1.35, state.windAmount);
  for (let i = 0; i < count; i += 1) {
    const x = base[i * 3] + Math.sin(time * 0.5 + phases[i]) * state.windAmount * 1.4;
    const z = base[i * 3 + 2] + Math.cos(time * 0.28 + phases[i]) * state.windAmount * 1.2;
    const length = lengths[i] * lerp(0.75, 1.35, state.rainAmount);
    const wrapped = top - ((time * fallSpeed * speeds[i] + base[i * 3 + 1] + phases[i]) % fallSpan);
    const index = i * 6;
    position.array[index] = x;
    position.array[index + 1] = wrapped;
    position.array[index + 2] = z;
    position.array[index + 3] = x + slant * length;
    position.array[index + 4] = wrapped - length;
    position.array[index + 5] = z;
  }
  rain.geometry.setDrawRange(0, count * 2);
  position.needsUpdate = true;
  rain.material.color.copy(
    paletteColor("accentAColor")
      .lerp(paletteColor("accentBColor"), state.stormAmount * 0.42)
      .lerp(paletteColor("skyColor"), 0.28)
      .lerp(paletteColor("highlightColor"), lightningPulse * 0.22),
  );
  rain.material.opacity = state.rainAmount * lerp(0.22, 0.58, state.stormAmount);
}

function buildLightningBolt() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(9 * 3), 3));
  geometry.setDrawRange(0, 0);
  const material = new THREE.LineBasicMaterial({
    color: 0xd7f5ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.Line(geometry, material);
  line.renderOrder = 7;
  return line;
}

function resetLightningBolt(time) {
  const position = lightningBolt.geometry.getAttribute("position");
  lightningStart.set(Math.sin(time * 8.71) * 22, 38, -18 + Math.cos(time * 3.17) * 12);
  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    position.array[i * 3] = lightningStart.x + Math.sin(t * 12.4 + time) * lerp(0, 3.2, t);
    position.array[i * 3 + 1] = lerp(lightningStart.y, 8, t);
    position.array[i * 3 + 2] = lightningStart.z + Math.cos(t * 10.1 + time) * 1.4;
  }
  position.needsUpdate = true;
  lightningBolt.geometry.setDrawRange(0, 9);
}

function updateLightning(time, delta) {
  lightningPulse *= Math.pow(0.015, delta);
  lightningCooldown = Math.max(0, lightningCooldown - delta);
  if (state.stormAmount > 0.05 && lightningCooldown <= 0 && Math.random() < delta * state.stormAmount * 0.16) {
    lightningPulse = randomBetween(Math.random, 0.55, 1);
    lightningCooldown = randomBetween(Math.random, 1.8, 5.8) / Math.max(0.25, state.stormAmount);
    resetLightningBolt(time);
  }
  if (lightningPulse < 0.01) lightningBolt.geometry.setDrawRange(0, 0);
  lightningBolt.material.opacity = lightningPulse * 0.92 * state.stormAmount;
  lightningBolt.material.color.copy(paletteColor("accentAColor").lerp(paletteColor("highlightColor"), 0.18));
  skyMaterial.uniforms.uLightning.value = lightningPulse;
}

function buildBirds(rng) {
  const count = Math.round(state.birdAmount * 12);
  for (let i = 0; i < count; i += 1) {
    const bird = new THREE.Line(
      birdWingGeometry,
      new THREE.LineBasicMaterial({
        color: paletteColor("shadowColor").lerp(paletteColor("accentBColor"), 0.12),
        transparent: true,
        opacity: randomBetween(rng, 0.24, 0.58),
      }),
    );
    bird.position.set(randomBetween(rng, -34, 34), randomBetween(rng, 18, 34), randomBetween(rng, 2, 42));
    bird.scale.setScalar(randomBetween(rng, 0.55, 1.65));
    bird.userData.speed = randomBetween(rng, 2.2, 9.7);
    bird.userData.phase = rng() * Math.PI * 2;
    bird.userData.baseY = bird.position.y;
    birdsRoot.add(bird);
  }
}

function buildTrees(rng) {
  const count = Math.round(state.treeAmount * 34);
  if (count <= 0) return;

  const geometries = [];
  for (let i = 0; i < count; i += 1) {
    const row = rng() < 0.7 ? 0 : 1;
    const x = randomBetween(rng, -34, 34);
    const z = randomBetween(rng, -16, 26) + row * 8;
    const h = randomBetween(rng, 1.4, 4.4) * (z < -8 ? 1.2 : 0.82);
    addBoxGeometry(geometries, h * 0.12, h * 0.78, h * 0.12, x, h * 0.39, z);
    geometries.push(transformedGeometry(treeCanopyGeometry, [x, h * 0.9, z], [h * 0.48, h * 0.58, h * 0.48], rng() * Math.PI));
    if (rng() < 0.45) {
      geometries.push(transformedGeometry(treeCanopyGeometry, [x + h * 0.18, h * 1.1, z - h * 0.05], [h * 0.38, h * 0.45, h * 0.38], rng() * Math.PI));
    }
  }

  const geometry = mergeGeometries(geometries, false);
  geometries.forEach((item) => item.dispose());
  const material = new THREE.MeshStandardMaterial({
    color: paletteColor("shadowColor").lerp(paletteColor("accentAColor"), 0.2),
    roughness: 1,
    metalness: 0,
  });
  const trees = new THREE.Mesh(geometry, material);
  trees.renderOrder = -1;
  treesRoot.add(trees);
}

// Play mode walks on boxes, not on the building meshes: one axis-aligned
// footprint per building is enough for collision and rooftop landing.
function addCityCollider(x, z, width, depth, height) {
  cityColliders.push({
    x,
    z,
    width: Math.max(0.8, width),
    depth: Math.max(0.8, depth),
    height: Math.max(0, height),
  });
}

function prepareBuildingMotion(building, spec, row = 0, col = 0) {
  building.userData.motion = {
    baseScale: building.scale.clone(),
    height: spec.height,
    heightT: 0.5,
    phase: hash2(row + 11.31, col + 7.17, spec.seed),
    personality: hash2(row + 37.53, col + 19.91, spec.seed + 5.7),
    z: building.position.z,
  };
}

function updateBuildingMotionBands() {
  let minHeight = Infinity;
  let maxHeight = -Infinity;
  cityRoot.children.forEach((building) => {
    const height = building.userData.motion?.height;
    if (!Number.isFinite(height)) return;
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
  });
  const range = Math.max(0.001, maxHeight - minHeight);
  cityRoot.children.forEach((building) => {
    const record = building.userData.motion;
    if (!record || !Number.isFinite(record.height)) return;
    record.heightT = clamp((record.height - minHeight) / range);
  });
}

function rebuildScene({ resetCamera = false } = {}) {
  applyLighting();
  scene.remove(cityRoot);
  disposeObject(cityRoot);
  materialCache.clear();
  cityRoot = new THREE.Group();
  scene.add(cityRoot);
  cityColliders = [];
  meshCount = 0;
  materialCount = 0;
  buildingCount = 0;
  windowCount = 0;

  if (state.mode === "single") {
    const spec = getBuildingSpec(
      state.seed,
      (state.widthMin + state.widthMax) / 2,
      (state.depthMin + state.depthMax) / 2,
      (state.foregroundHeight + state.backgroundHeight) / 2,
      0.25,
    );
    spec.sunBlend = skyBodyBlend();
    const building = createBuilding(spec);
    building.position.set(0, 0, 0);
    prepareBuildingMotion(building, spec, 0, 0);
    addCityCollider(0, 0, spec.width + 0.7, spec.depth + 0.7, spec.height);
    cityRoot.add(building);
  } else {
    const rng = mulberry32(state.seed);
    const grid = state.gridSize;
    const half = (grid - 1) * state.lotSpacing * 0.5;
    for (let row = 0; row < grid; row += 1) {
      const depthT = row / Math.max(1, grid - 1);
      const band = Math.floor(depthT * 3);
      for (let col = 0; col < grid; col += 1) {
        const lotRoll = rng();
        const centerBias = 1 - Math.abs(col - (grid - 1) / 2) / ((grid - 1) / 2);
        const chance = state.density * lerp(0.7, 1.08, centerBias) * lerp(1.05, 0.82, depthT);
        if (lotRoll > chance) continue;

        const w = randomBetween(rng, state.widthMin, state.widthMax) * lerp(1.16, 0.78, depthT);
        const d = randomBetween(rng, state.depthMin, state.depthMax) * lerp(1.08, 0.82, depthT);
        const heightBase = lerp(state.foregroundHeight, state.backgroundHeight, depthT);
        const h = heightBase * lerp(1 - state.skylineVariance * 0.55, 1 + state.skylineVariance * 0.85, rng());
        const x = col * state.lotSpacing - half + randomBetween(rng, -0.35, 0.35);
        const z = row * state.lotSpacing - half + (row % 3 === 2 ? state.streetGap : 0) + (col % 4 === 3 ? state.streetGap * 0.6 : 0) + randomBetween(rng, -0.35, 0.35);
        const spec = getBuildingSpec(state.seed + row * 97 + col * 719 + band * 13, w, d, h, depthT);
        const sunSide = clamp(skyBodyWorld.x / 48, -1, 1);
        const sideLight = clamp(0.5 + (x / Math.max(1, half)) * sunSide * 0.48 + randomBetween(rng, -0.18, 0.18), 0, 1);
        spec.sunBlend = lerp(sideLight, 0.25 + skyBodyBlend() * 0.7, depthT * 0.25);
        const building = createBuilding(spec);
        building.position.set(x, 0, z);
        building.rotation.y = randomBetween(rng, -0.04, 0.04);
        prepareBuildingMotion(building, spec, row, col);
        addCityCollider(x, z, spec.width + 0.7, spec.depth + 0.7, spec.height);
        cityRoot.add(building);
      }
    }
  }

  updateBuildingMotionBands();
  rebuildAtmosphere();
  updateLiveEffects();
  if (isPlayMode()) {
    ensureAvatarActive();
    updatePlayCamera(1, true);
  } else if (resetCamera) {
    updateCamera();
  }
  canvas.dataset.buildings = String(buildingCount);
  updateToolbarStates();
}

function setCameraOrbit({ yaw, pitch, distance, height, lensMm, target }) {
  camera.setFocalLength(lensMm);
  camera.position.set(
    Math.sin(yaw) * distance,
    height,
    -Math.cos(yaw) * distance,
  );
  camera.position.y += Math.sin(pitch) * 10;
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  controls.target.copy(target);
  controls.update();
}

function cameraTargetForMode() {
  if (state.mode === "single") return cameraOrbitTarget.set(0, 8, 0);
  return cameraOrbitTarget.set(0, 12, 7);
}

function updateCamera() {
  if (isPlayMode()) {
    updatePlayCamera(1, true);
    return;
  }
  ambientCameraActive = false;
  ambientCameraBase = null;
  ambientCameraStartedAt = 0;
  setCameraOrbit({
    yaw: THREE.MathUtils.degToRad(state.cameraYaw),
    pitch: THREE.MathUtils.degToRad(state.cameraPitch),
    distance: state.mode === "single" ? state.cameraDistance * 0.38 : state.cameraDistance,
    height: state.cameraHeight,
    lensMm: state.lensMm,
    target: cameraTargetForMode(),
  });
}

function updateCameraLens() {
  ambientCameraBase = null;
  ambientCameraStartedAt = 0;
  camera.setFocalLength(state.lensMm);
  camera.updateProjectionMatrix();
}

function captureAmbientCameraBase() {
  const offset = cameraOrbitOffset.copy(camera.position).sub(controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  return {
    radius: spherical.radius,
    phi: spherical.phi,
    theta: spherical.theta,
    target: controls.target.clone(),
    focalLength: camera.getFocalLength(),
  };
}

function resetAmbientCameraActivity() {
  lastPointerActivityAt = performance.now();
  if (!ambientCameraActive) return;
  ambientCameraActive = false;
  ambientCameraBase = null;
  ambientCameraStartedAt = 0;
}

function updateAmbientCamera(time, now) {
  if (reducedMotionMedia.matches || state.mode === "texture" || isPlayMode()) return;
  const idleSeconds = (now - lastPointerActivityAt) / 1000;
  if (idleSeconds < AMBIENT_CAMERA_IDLE_SECONDS) return;
  if (!ambientCameraBase) {
    ambientCameraBase = captureAmbientCameraBase();
    ambientCameraStartedAt = time;
  }
  ambientCameraActive = true;
  const fade = smoothstep(0, AMBIENT_CAMERA_FADE_SECONDS, idleSeconds - AMBIENT_CAMERA_IDLE_SECONDS);
  const shotTime = time - ambientCameraStartedAt;
  const yawDrift = THREE.MathUtils.degToRad(
    (Math.sin(shotTime * 0.32) * 11 +
      Math.sin(shotTime * 0.13 + 1.4) * 6 +
      Math.sin(shotTime * 0.72 + 0.2) * 2.5) *
      fade,
  );
  const pitchDrift = THREE.MathUtils.degToRad(
    (Math.sin(shotTime * 0.27 + 0.8) * 4 + Math.sin(shotTime * 0.58) * 1.4) * fade,
  );
  const zoomWave = Math.sin(shotTime * 0.2 + 2.1) * 0.09 + Math.sin(shotTime * 0.46) * 0.035;
  const radius = ambientCameraBase.radius * (1 + zoomWave * fade);
  const focalLength = ambientCameraBase.focalLength * (1 + (Math.sin(shotTime * 0.24 + 4.2) * 0.06 - zoomWave * 0.18) * fade);
  const target = cameraOrbitTarget.copy(ambientCameraBase.target);
  target.x += (Math.sin(shotTime * 0.25 + 1.2) * 2.2 + Math.sin(shotTime * 0.54) * 0.7) * fade;
  target.y += Math.sin(shotTime * 0.3 + 2.4) * 2.1 * fade;
  target.z += (Math.cos(shotTime * 0.21 + 0.4) * 2 + Math.sin(shotTime * 0.43 + 1.1) * 0.8) * fade;
  cameraOrbitSpherical.set(
    radius,
    clamp(ambientCameraBase.phi + pitchDrift, 0.08, Math.PI - 0.08),
    ambientCameraBase.theta + yawDrift,
  );
  cameraOrbitPosition.setFromSpherical(cameraOrbitSpherical).add(target);
  camera.position.copy(cameraOrbitPosition);
  camera.setFocalLength(focalLength);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  controls.target.copy(target);
}

function updateToolbarStates({ resetScroll = false, openVisible = false } = {}) {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const isActive = button.dataset.filter === state.controlFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  document.querySelectorAll("[data-category]").forEach((panel) => {
    const isVisible = !state.controlFilter || panel.dataset.category === state.controlFilter;
    panel.hidden = !isVisible;
    if (isVisible && openVisible) panel.open = true;
  });
  document.querySelectorAll("[data-play-toggle]").forEach((button) => {
    const isActive = Boolean(state[button.dataset.playToggle]);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  if (resetScroll) document.querySelector(".toolbar")?.scrollTo({ top: 0 });
}

function usesTouchPlayControls() {
  return coarsePointerMedia.matches || navigator.maxTouchPoints > 0 || window.innerWidth <= 760;
}

function setToolbarHidden(hidden, { preserveAutoCollapse = false } = {}) {
  studio.classList.toggle("is-toolbar-hidden", hidden);
  toolbarToggle.textContent = hidden ? "+" : "-";
  toolbarToggle.setAttribute("aria-label", hidden ? "expand controls" : "minimise controls");
  toolbarToggle.setAttribute("aria-expanded", String(!hidden));
  if (!preserveAutoCollapse) toolbarAutoCollapsed = false;
  requestAnimationFrame(resize);
}

function updateTouchPlayLayout() {
  const isTouchPlay = isPlayMode() && usesTouchPlayControls();
  studio.classList.toggle("is-touch-play", isTouchPlay);
  mobilePlayControls.hidden = !isTouchPlay;

  if (isTouchPlay && !touchPlayWasActive && !studio.classList.contains("is-toolbar-hidden")) {
    toolbarAutoCollapsed = true;
    setToolbarHidden(true, { preserveAutoCollapse: true });
  } else if (!isTouchPlay && touchPlayWasActive && toolbarAutoCollapsed) {
    setToolbarHidden(false, { preserveAutoCollapse: true });
    toolbarAutoCollapsed = false;
  }
  touchPlayWasActive = isTouchPlay;
}

function updateViewportMode() {
  const isTextureMode = state.mode === "texture";
  canvas.hidden = isTextureMode;
  textureCanvas.hidden = !isTextureMode;
  avatarRoot.visible = isPlayMode();
  document.querySelector("#playHud").hidden = !isPlayMode();
  updateTouchPlayLayout();
  controls.enabled = !isTextureMode && !isPlayMode();
  if (isPlayMode()) {
    updateBuildingMotion(performance.now() / 1000, 0);
    updatePlayStatus(
      usesTouchPlayControls()
        ? "drag the avatar to place it; use the joystick and jump button"
        : "drag scene to orbit, scroll to zoom",
    );
    if (!usesTouchPlayControls()) requestAnimationFrame(() => canvas.focus());
  }
  if (!isPlayMode()) resetTransientInput();
  if (isTextureMode) {
    renderTextureLab();
  } else {
    lastTextureViewportWidth = 0;
    lastTextureViewportHeight = 0;
  }
}

function updatePlayStatus(text) {
  const status = document.querySelector("#playStatus");
  if (status) status.textContent = text;
}

function updatePlayControlDisplay(path) {
  const control = document.querySelector(`[data-path="${path}"]`);
  if (!control) return;
  control.value = state[path];
  const output = document.querySelector(`[data-output="${path}"]`);
  if (output) output.textContent = formatValue(state[path], Number(control.dataset.step));
}

function updatePlaySettings({ resetDistance = false } = {}) {
  playCamera.height = state.playCameraHeight;
  playCamera.pitch = state.playCameraPitch;
  if (resetDistance) playCamera.distance = state.playCameraDistance;
  playCamera.distance = clamp(playCamera.distance, playCamera.minDistance, playCamera.maxDistance);
  if (isPlayMode()) updatePlayCamera(1 / Math.max(1, state.maxFps), false);
}

function resetPlayView() {
  state.playCameraDistance = defaults.playCameraDistance;
  state.playCameraHeight = defaults.playCameraHeight;
  state.playCameraPitch = defaults.playCameraPitch;
  playCamera.yawOffset = 0;
  playCamera.yaw = player.yaw;
  playCamera.distance = state.playCameraDistance;
  ["playCameraDistance", "playCameraHeight", "playCameraPitch"].forEach(updatePlayControlDisplay);
  updatePlaySettings({ resetDistance: true });
  if (isPlayMode()) updatePlayCamera(1, true);
  saveState();
}

function isInsideCollider(collider, x, z, padding = 0) {
  return (
    Math.abs(x - collider.x) <= collider.width / 2 + padding &&
    Math.abs(z - collider.z) <= collider.depth / 2 + padding
  );
}

function getSurfaceHeightAt(x, z, maxHeight = Infinity) {
  let surface = 0;
  cityColliders.forEach((collider) => {
    if (collider.height <= maxHeight + 0.08 && isInsideCollider(collider, x, z, PLAYER_RADIUS * 0.66)) {
      surface = Math.max(surface, collider.height);
    }
  });
  return surface;
}

function syncAvatarMesh() {
  avatarRoot.position.copy(player.position);
  avatarRoot.rotation.y = player.yaw;
}

function setAvatarFeet(x, z, feetY) {
  player.position.set(x, feetY + PLAYER_HEIGHT / 2, z);
  player.velocity.set(0, 0, 0);
  player.bounceVelocity.set(0, 0, 0);
  player.wallNormal.set(0, 0, 0);
  player.grounded = true;
  player.active = true;
  player.jumpCount = 0;
  player.jumpWasPressed = false;
  syncAvatarMesh();
}

function ensureAvatarActive() {
  if (player.active) return;
  const gridSpan = (Math.max(6, state.gridSize) - 1) * state.lotSpacing * 0.5;
  setAvatarFeet(0, -gridSpan - 8, 0);
}

function getDropTargetFromPointer(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.set(
    ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
    -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1),
  );
  raycaster.setFromCamera(pointerNdc, camera);

  const hits = [];
  dropPlane.constant = 0;
  if (raycaster.ray.intersectPlane(dropPlane, dropPoint)) {
    hits.push({ point: dropPoint.clone(), height: 0, distance: raycaster.ray.origin.distanceTo(dropPoint) });
  }

  cityColliders.forEach((collider) => {
    dropPlane.constant = -collider.height;
    if (!raycaster.ray.intersectPlane(dropPlane, dropPoint)) return;
    if (!isInsideCollider(collider, dropPoint.x, dropPoint.z, 0)) return;
    hits.push({
      point: dropPoint.clone(),
      height: collider.height,
      distance: raycaster.ray.origin.distanceTo(dropPoint),
    });
  });

  hits.sort((a, b) => a.distance - b.distance);
  return hits[0] ?? null;
}

function placeAvatarFromPointer(clientX, clientY) {
  if (!isPlayMode()) return false;
  const hit = getDropTargetFromPointer(clientX, clientY);
  if (!hit) return false;
  setAvatarFeet(hit.point.x, hit.point.z, hit.height);
  updatePlayStatus(hit.height > 0.1 ? "dropped on a roof" : "dropped on the street");
  return true;
}

function resolveHorizontalCollisions(previousX, previousZ) {
  const feetY = player.position.y - PLAYER_HEIGHT / 2;
  player.wallNormal.set(0, 0, 0);
  cityColliders.forEach((collider) => {
    if (feetY >= collider.height - 0.12) return;
    if (!isInsideCollider(collider, player.position.x, player.position.z, PLAYER_RADIUS)) return;

    const previousWasInside = isInsideCollider(collider, previousX, previousZ, PLAYER_RADIUS);
    const dx = player.position.x - collider.x;
    const dz = player.position.z - collider.z;
    const pushX = collider.width / 2 + PLAYER_RADIUS - Math.abs(dx);
    const pushZ = collider.depth / 2 + PLAYER_RADIUS - Math.abs(dz);

    if (!previousWasInside && Math.abs(previousX - collider.x) > collider.width / 2 + PLAYER_RADIUS * 0.8) {
      player.position.x = previousX;
      player.wallNormal.set(dx >= 0 ? 1 : -1, 0, 0);
    } else if (!previousWasInside && Math.abs(previousZ - collider.z) > collider.depth / 2 + PLAYER_RADIUS * 0.8) {
      player.position.z = previousZ;
      player.wallNormal.set(0, 0, dz >= 0 ? 1 : -1);
    } else if (pushX < pushZ) {
      player.position.x += (dx >= 0 ? 1 : -1) * pushX;
      player.wallNormal.set(dx >= 0 ? 1 : -1, 0, 0);
    } else {
      player.position.z += (dz >= 0 ? 1 : -1) * pushZ;
      player.wallNormal.set(0, 0, dz >= 0 ? 1 : -1);
    }
  });
}

function applyJump(jumpSpeed = state.playJumpSpeed) {
  player.velocity.y = jumpSpeed;
  player.grounded = false;
  player.jumpCount += 1;
}

function angleDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function cameraRelativeForwardVector() {
  return new THREE.Vector3(-Math.sin(playCamera.yaw), 0, -Math.cos(playCamera.yaw));
}

function cameraRelativeRightVector() {
  return new THREE.Vector3(Math.cos(playCamera.yaw), 0, -Math.sin(playCamera.yaw));
}

function yawFromDirection(direction) {
  return Math.atan2(-direction.x, -direction.z);
}

function characterForwardVector(direction = 1) {
  return new THREE.Vector3(
    -Math.sin(player.yaw) * direction,
    0,
    -Math.cos(player.yaw) * direction,
  );
}

function updateAvatar(dt) {
  if (!isPlayMode()) return;
  ensureAvatarActive();

  const keyForward = Number(pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp")) -
    Number(pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown"));
  const keyTurn = Number(pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft")) -
    Number(pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight"));
  const mobileAmount = clamp(Math.hypot(mobilePlay.forward, mobilePlay.strafe));
  const runPressed = pressedKeys.has("ShiftLeft") || pressedKeys.has("ShiftRight") || mobileAmount > 0.72;
  const jumpPressed = pressedKeys.has("Space");
  const jumpJustPressed = mobilePlay.jumpQueued || (jumpPressed && !player.jumpWasPressed);
  mobilePlay.jumpQueued = false;
  player.jumpWasPressed = jumpPressed;
  const previousX = player.position.x;
  const previousZ = player.position.z;

  if (keyTurn) player.yaw += keyTurn * state.playTurnSpeed * dt;

  if (keyForward) {
    const move = characterForwardVector(keyForward);
    const speed = runPressed ? state.playRunSpeed : state.playWalkSpeed;
    player.position.x += move.x * speed * dt;
    player.position.z += move.z * speed * dt;
  }

  if (mobileAmount > 0.04) {
    const move = cameraRelativeForwardVector()
      .multiplyScalar(mobilePlay.forward)
      .add(cameraRelativeRightVector().multiplyScalar(mobilePlay.strafe))
      .normalize();
    const speed = runPressed ? state.playRunSpeed : state.playWalkSpeed;
    player.yaw += angleDelta(player.yaw, yawFromDirection(move)) * Math.min(1, state.playTurnSpeed * dt);
    player.position.x += move.x * speed * mobileAmount * dt;
    player.position.z += move.z * speed * mobileAmount * dt;
  }

  if (player.bounceVelocity.lengthSq() > 0.0001) {
    player.position.x += player.bounceVelocity.x * dt;
    player.position.z += player.bounceVelocity.z * dt;
    player.bounceVelocity.multiplyScalar(Math.pow(0.08, dt));
  }
  resolveHorizontalCollisions(previousX, previousZ);

  if (jumpJustPressed && player.grounded) {
    applyJump(state.playJumpSpeed);
  } else if (jumpJustPressed && state.playWallBounce && player.wallNormal.lengthSq() > 0.1) {
    player.bounceVelocity.copy(player.wallNormal).multiplyScalar(state.playWallBounceSpeed);
    applyJump(state.playDoubleJumpSpeed);
  } else if (jumpJustPressed && state.playDoubleJump && player.jumpCount < 2) {
    applyJump(state.playDoubleJumpSpeed);
  }

  const previousFeetY = player.position.y - PLAYER_HEIGHT / 2;
  player.velocity.y -= 36 * dt;
  player.velocity.y = Math.max(player.velocity.y, -42);
  player.position.y += player.velocity.y * dt;
  const nextFeetY = player.position.y - PLAYER_HEIGHT / 2;
  const surfaceY = getSurfaceHeightAt(player.position.x, player.position.z, Math.max(previousFeetY, nextFeetY));

  if (player.velocity.y <= 0 && previousFeetY >= surfaceY - 0.08 && nextFeetY <= surfaceY) {
    player.position.y = surfaceY + PLAYER_HEIGHT / 2;
    player.velocity.y = 0;
    player.grounded = true;
    player.jumpCount = 0;
  } else {
    player.grounded = false;
  }

  syncAvatarMesh();
}

function updatePlayCamera(dt = 1 / 30, immediate = false) {
  if (!isPlayMode()) return;
  ensureAvatarActive();
  playCamera.height = state.playCameraHeight;
  playCamera.pitch = state.playCameraPitch;
  playCamera.distance = clamp(playCamera.distance, playCamera.minDistance, playCamera.maxDistance);
  const blend = immediate ? 1 : 1 - Math.exp(-dt / Math.max(0.03, state.playCameraLag));
  const targetYaw = player.yaw + playCamera.yawOffset;
  playCamera.yaw = immediate ? targetYaw : playCamera.yaw + angleDelta(playCamera.yaw, targetYaw) * blend;
  const target = player.position.clone().add(new THREE.Vector3(0, 1.25 + playCamera.pitch * 16, 0));
  const pitchLift = Math.sin(playCamera.pitch) * 4.5;
  const desired = target.clone().add(new THREE.Vector3(
    Math.sin(playCamera.yaw) * playCamera.distance,
    playCamera.height + pitchLift,
    Math.cos(playCamera.yaw) * playCamera.distance,
  ));
  camera.setFocalLength(Math.max(24, Math.min(state.lensMm, 34)));
  if (immediate) camera.position.copy(desired);
  else camera.position.lerp(desired, blend);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

function updateLiveEffects() {
  applyLighting();
  updateStarUniforms(performance.now() / 1000);
  rainRoot.children.forEach((rain) => updateRainGeometry(rain, performance.now() / 1000));
  bloomPass.strength = state.bloom * 1.9;
  bloomPass.radius = 0.52 + state.bloom * 0.18;
  bloomPass.threshold = state.bloomThreshold;
  bloomPass.enabled = state.bloom > 0.01;
  painterlyPass.enabled =
    state.pixelation > 1 ||
    state.paletteSteps > 0 ||
    state.dither > 0.001 ||
    state.aberration > 0.001 ||
    state.focalShift > 0.001;
  painterlyPass.uniforms.uPixelSize.value = state.pixelation;
  painterlyPass.uniforms.uPaletteSteps.value = state.paletteSteps;
  painterlyPass.uniforms.uDither.value = state.dither;
  painterlyPass.uniforms.uAberration.value = state.aberration;
  painterlyPass.uniforms.uFocalShift.value = state.focalShift;
  grainPass.enabled = state.postNoise > 0.001;
  grainPass.uniforms.uNoise.value = state.postNoise;
}

function averageAudioBins(start, end) {
  if (!audioBins?.length) return 0;
  const first = Math.max(0, Math.floor(start));
  const last = Math.min(audioBins.length, Math.max(first + 1, Math.floor(end)));
  let total = 0;
  for (let index = first; index < last; index += 1) total += audioBins[index];
  return total / (last - first) / 255;
}

function sampleAudioReactive() {
  if (!audioReactive.active || !audioAnalyser || !audioBins) return;
  audioAnalyser.getByteFrequencyData(audioBins);
  const bass = averageAudioBins(1, audioBins.length * 0.12);
  const mid = averageAudioBins(audioBins.length * 0.12, audioBins.length * 0.45);
  const treble = averageAudioBins(audioBins.length * 0.45, audioBins.length);
  const energy = bass * 0.55 + mid * 0.3 + treble * 0.15;
  const smoothing = 0.76;
  audioReactive.energy = audioReactive.energy * smoothing + energy * (1 - smoothing);
  audioReactive.bass = audioReactive.bass * smoothing + bass * (1 - smoothing);
  audioReactive.mid = audioReactive.mid * smoothing + mid * (1 - smoothing);
  audioReactive.treble = audioReactive.treble * smoothing + treble * (1 - smoothing);
}

function currentReactiveAudio() {
  if (audioReactive.active) {
    sampleAudioReactive();
    return {
      active: true,
      energy: audioReactive.energy,
      bass: audioReactive.bass,
      mid: audioReactive.mid,
      treble: audioReactive.treble,
    };
  }
  return { active: false, energy: 0, bass: 0, mid: 0, treble: 0 };
}

function updateReactiveState(status = "") {
  const button = document.querySelector("#audioToggle");
  const readout = document.querySelector("#reactiveStatus");
  if (button) {
    button.classList.toggle("is-active", audioReactive.active);
    button.disabled = audioStartPending;
    button.setAttribute("aria-busy", String(audioStartPending));
    button.setAttribute("aria-pressed", String(audioReactive.active));
    button.textContent = audioStartPending ? "waiting for mic" : audioReactive.active ? "stop mic" : "start mic";
  }
  if (readout) {
    readout.textContent = status || (audioStartPending ? "allow mic" : audioReactive.active ? "listening" : "idle pulse");
  }
}

async function startAudioReactive() {
  if (!isReactiveMode()) switchMode("reactive");
  if (audioReactive.active || audioStartPending) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    updateReactiveState("mic unavailable");
    return;
  }
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    updateReactiveState("audio unavailable");
    return;
  }

  const requestGeneration = ++audioRequestGeneration;
  audioStartPending = true;
  updateReactiveState();
  let stream = null;
  try {
    audioContext ||= new AudioContextConstructor();
    if (audioContext.state === "suspended") await audioContext.resume();
    if (requestGeneration !== audioRequestGeneration || !isReactiveMode()) return;
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (requestGeneration !== audioRequestGeneration || !isReactiveMode()) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    audioStreams.add(stream);
    audioSource = audioContext.createMediaStreamSource(stream);
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 1024;
    audioAnalyser.smoothingTimeConstant = 0.62;
    audioBins = new Uint8Array(audioAnalyser.frequencyBinCount);
    audioSource.connect(audioAnalyser);
    audioReactive.active = true;
  } catch (error) {
    if (stream && !audioStreams.has(stream)) stream.getTracks().forEach((track) => track.stop());
    throw error;
  } finally {
    if (requestGeneration === audioRequestGeneration) {
      audioStartPending = false;
      updateReactiveState();
    }
  }
}

function stopAudioReactive(status = "") {
  audioRequestGeneration += 1;
  audioStartPending = false;
  audioSource?.disconnect();
  audioSource = null;
  audioAnalyser = null;
  audioBins = null;
  audioStreams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
  audioStreams.clear();
  audioContext?.suspend?.().catch(() => {});
  audioReactive.active = false;
  audioReactive.energy = 0;
  audioReactive.bass = 0;
  audioReactive.mid = 0;
  audioReactive.treble = 0;
  updateReactiveState(status);
}

function updateBuildingMotion(time, delta = 1 / 60) {
  if (isPlayMode() || reducedMotionMedia.matches) {
    cityPulse.value = 0;
    cityRoot.children.forEach((building) => {
      const baseScale = building.userData.motion?.baseScale;
      if (baseScale) building.scale.copy(baseScale);
    });
    return;
  }
  const motion = clamp(Number(state.buildingMotion) || 0);
  const bpm = clamp(Number(state.buildingBpm) || MAX_BUILDING_BPM * motion, 30, MAX_BUILDING_BPM);
  const beatPosition = time * bpm / 60;
  const beatIndex = Math.floor(beatPosition);
  const beat = beatPosition - beatIndex;
  if (beatIndex !== cityPulse.lastBeat) {
    const variance = clamp(state.reactiveBeatVariance ?? 0.32);
    const random = hash2(beatIndex + 13.1, state.seed + 29.7, bpm * 0.17);
    const phrase = 0.5 + 0.5 * Math.sin(beatIndex * 0.73 + state.seed * 0.11);
    cityPulse.beatStrength = lerp(1, 0.68 + random * 0.62, variance) * lerp(1, 0.88 + phrase * 0.24, variance * 0.55);
    cityPulse.lastBeat = beatIndex;
  }
  const attack = Math.exp(-beat * 4.2);
  const aftershock = Math.exp(-Math.pow((beat - 0.24) / 0.16, 2)) * 0.22;
  const reactiveAudio = currentReactiveAudio();
  const rawPulse = reactiveAudio.active
    ? clamp(Math.pow(reactiveAudio.energy, 0.72) * AUDIO_REACTIVE_GAIN + reactiveAudio.bass * AUDIO_REACTIVE_BASS_GAIN + AUDIO_REACTIVE_MIN_PULSE)
    : clamp((attack + aftershock) * cityPulse.beatStrength) * motion;
  const smoothing = reactiveAudio.active
    ? Math.min(clamp(state.reactiveSmoothing ?? 0.78, 0.1, 0.96), AUDIO_REACTIVE_MAX_SMOOTHING)
    : clamp(state.reactiveSmoothing ?? 0.78, 0.1, 0.96);
  cityPulse.value = cityPulse.value * smoothing + rawPulse * (1 - smoothing);
  const pulseBase = cityPulse.value;
  cityRoot.children.forEach((building, index) => {
    if (!building.userData.motion) {
      building.userData.motion = {
        baseScale: building.scale.clone(),
        height: 1,
        heightT: 0.5,
        phase: (index * 0.173 + Math.abs(building.position.x) * 0.017 + Math.abs(building.position.z) * 0.011) % 1,
        personality: 0.5,
        z: building.position.z,
      };
    }
    const record = building.userData.motion;
    const heightT = record.heightT ?? 0.5;
    const contrast = lerp(0.7, 3.2, clamp(state.reactiveHeightSplit));
    const shortWeight = Math.pow(1 - heightT, contrast) * clamp(state.reactiveShortBass, 0, 1.8);
    const tallWeight = Math.pow(heightT, contrast) * clamp(state.reactiveTallTreble, 0, 1.8);
    const midWeight = Math.pow(1 - Math.abs(heightT * 2 - 1), 1.25) * 0.55;
    const weightTotal = Math.max(0.001, shortWeight + midWeight + tallWeight);
    const heightSignal = reactiveAudio.active
      ? (
          reactiveAudio.bass * shortWeight +
          reactiveAudio.mid * midWeight +
          reactiveAudio.treble * tallWeight * 1.18
        ) / weightTotal
      : (shortWeight * 0.85 + midWeight + tallWeight * 1.18) / weightTotal;
    const wave = 0.5 + 0.5 * Math.sin(record.phase * Math.PI * 2 + record.z * 0.045);
    const individuality = lerp(1, lerp(0.52, 1.48, record.personality ?? 0.5), clamp(state.reactiveIndividuality));
    const local = pulseBase * lerp(1, heightSignal, clamp(state.reactiveHeightSplit));
    const waveGain = lerp(1, 0.62 + wave * 0.92, clamp(state.reactiveBuildingWave));
    const pulse = local * individuality * waveGain;
    const scaleXAmount = reactiveAudio.active ? Math.max(clamp(state.reactiveScaleX, 0, 0.5), AUDIO_REACTIVE_MIN_SCALE_X) : clamp(state.reactiveScaleX, 0, 0.5);
    const scaleYAmount = reactiveAudio.active ? Math.max(clamp(state.reactiveScaleY, 0, 1.2), AUDIO_REACTIVE_MIN_SCALE_Y) : clamp(state.reactiveScaleY, 0, 1.2);
    const scaleX = 1 + scaleXAmount * (pulse * 0.72);
    const scaleY = 1 + scaleYAmount * pulse;
    building.scale.set(
      record.baseScale.x * scaleX,
      record.baseScale.y * scaleY,
      record.baseScale.z * scaleX,
    );
  });
}

function scheduleRebuild(delay = 120, options = {}) {
  window.clearTimeout(rebuildTimer);
  rebuildTimer = window.setTimeout(() => {
    rebuildScene(options);
  }, delay);
}

function formatValue(value, step, path = "") {
  if (path === "sceneMood") return sceneKeyFromValue(value);
  if (path === "skyBodyMode") return String(value);
  if (!Number.isFinite(Number(value))) return String(value);
  if (step >= 1) return Math.round(value).toString();
  return Number(value).toFixed(step < 0.01 ? 3 : 2).replace(/\.?0+$/, "");
}

function randomColor(rng) {
  const color = new THREE.Color();
  color.setHSL(rng(), randomBetween(rng, 0.28, 0.72), randomBetween(rng, 0.18, 0.78));
  return `#${color.getHexString()}`;
}

function renderRangeControls(controls) {
  return controls
    .map(([label, path, min, max, step]) => {
      if (min === "toggle") {
        return `
          <label class="control-row control-row--toggle gc-control">
            <span class="gc-control-head">
              <span class="gc-label">${label}</span>
              <input
                type="checkbox"
                data-path="${path}"
                data-kind="toggle"
                ${state[path] ? "checked" : ""}
              />
            </span>
          </label>
        `;
      }
      if (Array.isArray(min)) {
        return `
          <label class="control-row gc-control">
            <span class="gc-control-head">
              <span class="gc-label">${label}</span>
              <output class="gc-value" data-output="${path}">${formatValue(state[path], 1, path)}</output>
            </span>
            <select class="gc-select" data-path="${path}" data-kind="select">
              ${min
                .map(([value, text]) => `<option value="${value}" ${state[path] === value ? "selected" : ""}>${text}</option>`)
                .join("")}
            </select>
          </label>
        `;
      }
      return `
        <label class="control-row gc-control">
          <span class="gc-control-head">
            <span class="gc-label">${label}</span>
            <output class="gc-value" data-output="${path}">${formatValue(state[path], step, path)}</output>
          </span>
          <input
            class="gc-range"
            type="range"
            min="${min}"
            max="${max}"
            step="${step}"
            value="${state[path]}"
            data-path="${path}"
            data-step="${step}"
          />
        </label>
      `;
    })
    .join("");
}

function refreshControlsForPath(path, sourceControl = null) {
  const controls = document.querySelectorAll(`[data-path="${path}"]`);
  const step = Number(controls[0]?.dataset.step ?? controls[0]?.step ?? 0.01);
  controls.forEach((control) => {
    if (control === sourceControl) return;
    if (control.dataset.kind === "toggle") {
      control.checked = Boolean(state[path]);
    } else {
      control.value = state[path];
    }
  });
  document.querySelectorAll(`[data-output="${path}"]`).forEach((output) => {
    output.textContent = formatValue(state[path], step, path);
  });
}

function renderPaletteEditor() {
  const { backingSize } = paletteWheelMetrics();
  const rows = colorControls
    .map(
      ([label, path], index) => `
        <label class="color-row gc-control" data-palette-row="${index}">
          <span class="gc-control-head">
            <span class="gc-label">${label}</span>
            <output class="gc-value" data-color-output="${path}">${String(state[path]).toLowerCase()}</output>
          </span>
          <input class="gc-swatch" type="color" value="${state[path]}" data-color-path="${path}" data-palette-index="${index}" />
        </label>
      `,
    )
    .join("");
  return `
    <div class="palette-wheel-wrap">
      <canvas
        id="paletteWheel"
        width="${backingSize}"
        height="${backingSize}"
        role="slider"
        tabindex="0"
        aria-label="selected palette colour hue; use left and right for hue, up and down for saturation"
        aria-valuemin="0"
        aria-valuemax="359"
      ></canvas>
      ${
        PALETTE_LIGHTNESS_ENABLED
          ? `<label class="palette-lightness gc-control">
              <span class="gc-label">lightness</span>
              <input id="paletteLightness" class="gc-range" type="range" min="0" max="1" step="0.01" value="0.5" />
            </label>`
          : ""
      }
    </div>
    <div class="color-rows">${rows}</div>
  `;
}

function paletteWheelDisc(size) {
  if (paletteWheelDiscCache && paletteWheelDiscCacheSize === size) return paletteWheelDiscCache;
  const disc = document.createElement("canvas");
  disc.width = size;
  disc.height = size;
  const ctx = disc.getContext("2d");
  const image = ctx.createImageData(size, size);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 1;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const i = (y * size + x) * 4;
      const edgeCoverage = clamp(radius + 0.5 - dist, 0, 1);
      if (edgeCoverage <= 0) {
        image.data[i + 3] = 0;
        continue;
      }
      const h = ((Math.atan2(dy, dx) / (Math.PI * 2)) + 1) % 1;
      const s = clamp(dist / radius);
      const rgb = hexToRgb(hslToHex({ h, s, l: 0.5 }));
      image.data[i] = rgb[0] * 255;
      image.data[i + 1] = rgb[1] * 255;
      image.data[i + 2] = rgb[2] * 255;
      image.data[i + 3] = Math.round(edgeCoverage * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
  paletteWheelDiscCache = disc;
  paletteWheelDiscCacheSize = size;
  return disc;
}

function drawPaletteWheel() {
  const canvas = document.querySelector("#paletteWheel");
  if (!canvas) return;
  const { backingSize: size, pixelRatio } = paletteWheelMetrics();
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 1;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(paletteWheelDisc(size), 0, 0);
  colorControls.forEach(([, path], index) => {
    const hsl = hexToHsl(state[path]);
    const angle = hsl.h * Math.PI * 2;
    const r = clamp(hsl.s) * radius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const selected = index === selectedPaletteIndex;
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      (selected ? 8 : 6) * pixelRatio,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = state[path];
    ctx.fill();
    ctx.lineWidth = (selected ? 3 : 2) * pixelRatio;
    ctx.strokeStyle = selected ? "#ffffff" : "rgba(0,0,0,0.6)";
    ctx.stroke();
  });
  const [label, path] = colorControls[selectedPaletteIndex];
  const selected = hexToHsl(state[path]);
  canvas.setAttribute("aria-valuenow", String(Math.round(selected.h * 359)));
  canvas.setAttribute(
    "aria-valuetext",
    `${label}: ${Math.round(selected.h * 360)} degree hue, ${Math.round(selected.s * 100)} percent saturation`,
  );
}

function refreshPaletteEditor() {
  colorControls.forEach(([, path]) => {
    const input = document.querySelector(`[data-color-path="${path}"]`);
    const output = document.querySelector(`[data-color-output="${path}"]`);
    if (input) input.value = state[path];
    if (output) output.textContent = String(state[path]).toLowerCase();
  });
  document.querySelectorAll("[data-palette-row]").forEach((row) => {
    row.classList.toggle("is-selected", Number(row.dataset.paletteRow) === selectedPaletteIndex);
  });
  if (PALETTE_LIGHTNESS_ENABLED) {
    const lightness = document.querySelector("#paletteLightness");
    if (lightness) lightness.value = String(hexToHsl(state[colorControls[selectedPaletteIndex][1]]).l);
  }
  drawPaletteWheel();
}

function commitPaletteColor() {
  refreshPaletteEditor();
  saveState();
  if (state.mode === "texture") {
    scheduleTextureLabRender();
  } else {
    scheduleRebuild();
  }
}

function setPaletteColorHex(index, hex) {
  state[colorControls[index][1]] = hex;
  commitPaletteColor();
}

function setPaletteColorHsl(index, hsl) {
  state[colorControls[index][1]] = hslToHex(hsl);
  commitPaletteColor();
}

function bindPaletteWheel() {
  const canvas = document.querySelector("#paletteWheel");
  if (!canvas) return;

  const pickFromEvent = (event) => {
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 1;
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * size - cx;
    const py = ((event.clientY - rect.top) / rect.height) * size - cy;
    const h = ((Math.atan2(py, px) / (Math.PI * 2)) + 1) % 1;
    const s = clamp(Math.hypot(px, py) / radius);
    return { h, s };
  };

  const selectNearest = (event) => {
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 1;
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * size;
    const py = ((event.clientY - rect.top) / rect.height) * size;
    let best = 0;
    let bestDist = Infinity;
    colorControls.forEach(([, path], index) => {
      const hsl = hexToHsl(state[path]);
      const angle = hsl.h * Math.PI * 2;
      const r = clamp(hsl.s) * radius;
      const dist = Math.hypot(px - (cx + Math.cos(angle) * r), py - (cy + Math.sin(angle) * r));
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    selectedPaletteIndex = best;
  };

  let dragging = false;
  const applyPick = (event) => {
    const { h, s } = pickFromEvent(event);
    const current = hexToHsl(state[colorControls[selectedPaletteIndex][1]]);
    setPaletteColorHsl(selectedPaletteIndex, { h, s, l: current.l });
  };

  canvas.addEventListener("pointerdown", (event) => {
    selectNearest(event);
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    applyPick(event);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (dragging) applyPick(event);
  });
  const stop = (event) => {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  canvas.addEventListener("lostpointercapture", stop);
  canvas.addEventListener("keydown", (event) => {
    const current = hexToHsl(state[colorControls[selectedPaletteIndex][1]]);
    const increment = event.shiftKey ? 0.05 : 0.01;
    if (event.key === "ArrowLeft") current.h = (current.h - increment + 1) % 1;
    else if (event.key === "ArrowRight") current.h = (current.h + increment) % 1;
    else if (event.key === "ArrowDown") current.s = clamp(current.s - increment);
    else if (event.key === "ArrowUp") current.s = clamp(current.s + increment);
    else if (event.key === "Home") current.h = 0;
    else if (event.key === "End") current.h = 359 / 360;
    else return;
    event.preventDefault();
    setPaletteColorHsl(selectedPaletteIndex, current);
  });

  const lightness = PALETTE_LIGHTNESS_ENABLED ? document.querySelector("#paletteLightness") : null;
  if (lightness) {
    lightness.addEventListener("input", () => {
      const current = hexToHsl(state[colorControls[selectedPaletteIndex][1]]);
      setPaletteColorHsl(selectedPaletteIndex, { h: current.h, s: current.s, l: Number(lightness.value) });
    });
  }

  document.querySelectorAll("[data-palette-row]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.matches("input")) return;
      selectedPaletteIndex = Number(row.dataset.paletteRow);
      refreshPaletteEditor();
    });
  });
}

function renderControls() {
  controlGroups.forEach((group) => {
    if (group.id !== "paletteControls" && group.id !== "textureLabControls") {
      document.querySelector(`#${group.id}`).innerHTML = renderRangeControls(group.controls);
    }
  });

  const paletteSliders = controlGroups.find((group) => group.id === "paletteControls")?.controls ?? [];
  document.querySelector("#paletteControls").innerHTML = `
    ${renderPaletteEditor()}
    ${renderRangeControls(paletteSliders)}
  `;
  const labSliders = controlGroups.find((group) => group.id === "textureLabControls")?.controls ?? [];
  document.querySelector("#textureLabControls").innerHTML = `
    ${renderRangeControls(labSliders)}
  `;
  document.querySelectorAll("[data-path]").forEach((control) => {
    if (control.dataset.boundControl === "true") return;
    control.dataset.boundControl = "true";
    const eventName = control.dataset.kind === "select" || control.dataset.kind === "toggle" ? "change" : "input";
    control.addEventListener(eventName, () => {
      const path = control.dataset.path;
      if (control.dataset.kind === "toggle") {
        state[path] = control.checked;
      } else {
        state[path] = control.dataset.kind === "select" ? control.value : Number(control.value);
      }
      const relatedPaths = normalizeStateRelationships(state, path);
      refreshControlsForPath(path, control);
      relatedPaths.forEach((relatedPath) => refreshControlsForPath(relatedPath));
      saveState();
      if (path === "floorVisible") {
        floor.visible = state.floorVisible;
      } else if (path === "timeOfDay") {
        state.sceneMood = sceneValueFromTime(state.timeOfDay);
        updateLiveEffects();
      } else if (playControlPaths.has(path)) {
        updatePlaySettings({ resetDistance: path === "playCameraDistance" });
      } else if (cameraLensPaths.has(path)) {
        updateCameraLens();
      } else if (cameraControlPaths.has(path)) {
        updateCamera();
        updateToolbarStates();
      } else if (atmosphereControlPaths.has(path)) {
        rebuildAtmosphere(atmosphereRebuildParts[path]);
        updateLiveEffects();
      } else if (textureLabControlPaths.has(path)) {
        if (state.mode === "texture") {
          if (liveControlPaths.has(path)) updateLiveEffects();
          scheduleTextureLabRender();
        } else {
          scheduleRebuild();
        }
      } else if (liveControlPaths.has(path)) {
        updateLiveEffects();
        updateToolbarStates();
      } else {
        scheduleRebuild();
      }
    });
  });

  document.querySelectorAll("[data-color-path]").forEach((control) => {
    control.addEventListener("input", () => {
      selectedPaletteIndex = Number(control.dataset.paletteIndex);
      setPaletteColorHex(selectedPaletteIndex, control.value);
    });
  });

  bindPaletteWheel();
  refreshPaletteEditor();
}

function randomiseSettings() {
  const rng = mulberry32(Date.now() % 1000000);
  controlGroups.forEach((group) => {
    if (["postControls", "performanceControls", "cameraControls", "playControls"].includes(group.id)) return;
    group.controls.forEach(([, path, min, max, step]) => {
      if (min === "toggle") return;
      if (Array.isArray(min)) {
        state[path] = min[Math.floor(rng() * min.length)]?.[0] ?? state[path];
        return;
      }
      const value = randomBetween(rng, min, max);
      state[path] = step >= 1 ? Math.round(value / step) * step : Number((Math.round(value / step) * step).toFixed(3));
    });
  });
  colorControls.forEach(([, path]) => {
    state[path] = randomColor(rng);
  });
  state.seed = 1 + Math.floor(rng() * 998);
  state.gridSize = Math.round(state.gridSize);
  state.sceneMood = sceneValueFromTime(state.timeOfDay);
  normalizeStateRelationships(state);
  Object.assign(state, NEUTRAL_POST_SETTINGS);
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) return;
  const presetState = sanitizeState({
    ...defaults,
    ...preset,
    sceneMood: name === "day" ? 0 : name === "sunset" ? 1 : 2,
    timeOfDay: SKY_BODY_HOURS[name],
    skyBodyMode: "orbit",
  });
  PRESET_SCENE_PATHS.forEach((path) => {
    state[path] = presetState[path];
  });
}

function switchMode(mode, { persist = true, rebuild = true } = {}) {
  if (!VIEW_MODES.has(mode)) return false;
  if (mode !== "reactive" && (audioReactive.active || audioStartPending || audioStreams.size)) {
    stopAudioReactive();
  }
  if (mode === state.mode) return false;
  state.mode = mode;
  // Each mode has its own panel group; follow it in so the toolbar matches.
  if (state.mode === "texture") {
    state.controlFilter = "texture";
  } else if (state.mode === "play") {
    state.controlFilter = "play";
  } else if (state.mode === "reactive") {
    state.controlFilter = "reactive";
  } else if (["texture", "play", "reactive"].includes(state.controlFilter)) {
    state.controlFilter = "";
  }
  if (persist) saveState();
  updateViewportMode();
  updateToolbarStates({ resetScroll: true, openVisible: true });
  if (isPlayMode()) {
    updatePlaySettings({ resetDistance: true });
    playCamera.yawOffset = 0;
  }
  if (rebuild && state.mode !== "texture") {
    scheduleRebuild(0, { resetCamera: true });
  }
  return true;
}

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.mode));
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.controlFilter = state.controlFilter === button.dataset.filter ? "" : button.dataset.filter;
    saveState();
    updateToolbarStates({ resetScroll: true, openVisible: true });
  });
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    applyPreset(button.dataset.preset);
    saveState();
    renderControls();
    if (state.mode === "texture") {
      renderTextureLab();
    } else {
      scheduleRebuild(0);
    }
  });
});

document.querySelector("#randomise").addEventListener("click", () => {
  switchMode("city", { persist: false, rebuild: false });
  randomiseSettings();
  state.controlFilter = "";
  saveState();
  renderControls();
  updateToolbarStates({ resetScroll: true, openVisible: true });
  updateViewportMode();
  if (state.mode !== "texture") {
    scheduleRebuild(0, { resetCamera: true });
  }
});

document.querySelector("#toggleToolbar").addEventListener("click", () => {
  setToolbarHidden(!studio.classList.contains("is-toolbar-hidden"));
});

function setAboutOpen(open, { restoreFocus = false } = {}) {
  aboutPanel.hidden = !open;
  studio.classList.toggle("is-about-open", open);
  aboutToggle.setAttribute("aria-expanded", String(open));
  if (open) document.querySelector("#aboutClose")?.focus();
  else if (restoreFocus) aboutToggle.focus();
}

aboutToggle.addEventListener("click", () => setAboutOpen(true));
document.querySelector("#aboutClose").addEventListener("click", () => setAboutOpen(false, { restoreFocus: true }));

document.querySelector("#audioToggle").addEventListener("click", async () => {
  if (audioReactive.active) {
    stopAudioReactive();
    return;
  }
  try {
    await startAudioReactive();
  } catch {
    stopAudioReactive("mic blocked");
    window.setTimeout(() => updateReactiveState(), 1800);
  }
});

function resetMobileJoystick() {
  const pointerId = mobilePlay.pointerId;
  mobilePlay.pointerId = null;
  mobilePlay.forward = 0;
  mobilePlay.strafe = 0;
  mobileJoystickKnob.style.transform = "translate(-50%, -50%)";
  if (pointerId !== null && mobileJoystick.hasPointerCapture(pointerId)) {
    mobileJoystick.releasePointerCapture(pointerId);
  }
}

function queueMobileJump() {
  mobilePlay.jumpQueued = true;
}

mobileJumpButton.addEventListener("click", queueMobileJump);

function updateMobileJoystick(event) {
  const maxDistance = Math.max(34, mobileJoystick.clientWidth * 0.34);
  const dx = event.clientX - mobilePlay.centerX;
  const dy = event.clientY - mobilePlay.centerY;
  const distance = Math.min(maxDistance, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx);
  const knobX = Math.cos(angle) * distance;
  const knobY = Math.sin(angle) * distance;
  mobilePlay.strafe = clamp(knobX / maxDistance, -1, 1);
  mobilePlay.forward = clamp(-knobY / maxDistance, -1, 1);
  mobileJoystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
}

mobileJoystick.addEventListener("pointerdown", (event) => {
  if (!isPlayMode()) return;
  event.preventDefault();
  event.stopPropagation();
  const rect = mobileJoystick.getBoundingClientRect();
  mobilePlay.pointerId = event.pointerId;
  mobilePlay.centerX = rect.left + rect.width / 2;
  mobilePlay.centerY = rect.top + rect.height / 2;
  mobileJoystick.setPointerCapture(event.pointerId);
  updateMobileJoystick(event);
});

mobileJoystick.addEventListener("pointermove", (event) => {
  if (event.pointerId !== mobilePlay.pointerId) return;
  event.preventDefault();
  event.stopPropagation();
  updateMobileJoystick(event);
});

["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
  mobileJoystick.addEventListener(eventName, (event) => {
    if (event.pointerId !== mobilePlay.pointerId && eventName !== "lostpointercapture") return;
    event.preventDefault();
    event.stopPropagation();
    resetMobileJoystick();
  });
});

const avatarHandle = document.querySelector("#avatarHandle");

avatarHandle.addEventListener("pointerdown", (event) => {
  if (!isPlayMode()) return;
  player.draggingAvatar = true;
  player.avatarPointerId = event.pointerId;
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.classList.add("is-dragging");
  updatePlayStatus("drop on a street or rooftop");
});

function finishAvatarDrag(event, { place = false } = {}) {
  if (!player.draggingAvatar || event.pointerId !== player.avatarPointerId) return;
  player.draggingAvatar = false;
  player.avatarPointerId = null;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  event.currentTarget.classList.remove("is-dragging");
  if (place && !placeAvatarFromPointer(event.clientX, event.clientY)) {
    updatePlayStatus("drop missed the city");
  } else if (!place) {
    updatePlayStatus("placement cancelled");
  }
}

avatarHandle.addEventListener("pointerup", (event) => finishAvatarDrag(event, { place: true }));
avatarHandle.addEventListener("pointercancel", (event) => finishAvatarDrag(event));
avatarHandle.addEventListener("lostpointercapture", (event) => finishAvatarDrag(event));
avatarHandle.addEventListener("click", (event) => {
  if (!isPlayMode() || event.detail !== 0) return;
  player.active = false;
  ensureAvatarActive();
  updatePlayStatus("avatar reset at the city entrance");
});

document.querySelector("#resetPlayView").addEventListener("click", () => {
  resetPlayView();
  updatePlayStatus("view reset");
});

document.querySelectorAll("[data-play-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const path = button.dataset.playToggle;
    state[path] = !state[path];
    saveState();
    updateToolbarStates();
  });
});

canvas.addEventListener("dblclick", (event) => {
  if (!isPlayMode()) return;
  placeAvatarFromPointer(event.clientX, event.clientY);
});

canvas.addEventListener("pointerdown", (event) => {
  if (!isPlayMode() || player.draggingAvatar || event.button !== 0) return;
  if (event.pointerType === "touch") {
    queueMobileJump();
    return;
  }
  playCamera.dragging = true;
  playCamera.pointerId = event.pointerId;
  playCamera.lastX = event.clientX;
  playCamera.lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!playCamera.dragging || event.pointerId !== playCamera.pointerId) return;
  const dx = event.clientX - playCamera.lastX;
  const dy = event.clientY - playCamera.lastY;
  playCamera.lastX = event.clientX;
  playCamera.lastY = event.clientY;
  playCamera.yawOffset -= dx * state.playMouseTurnSpeed;
  state.playCameraPitch = clamp(state.playCameraPitch - dy * 0.004, -0.5, 1.2);
  updatePlayControlDisplay("playCameraPitch");
});

function finishPlayCameraDrag(event) {
  if (!playCamera.dragging || event.pointerId !== playCamera.pointerId) return;
  playCamera.dragging = false;
  playCamera.pointerId = null;
  saveState();
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

canvas.addEventListener("pointerup", finishPlayCameraDrag);
canvas.addEventListener("pointercancel", finishPlayCameraDrag);
canvas.addEventListener("lostpointercapture", finishPlayCameraDrag);

canvas.addEventListener(
  "wheel",
  (event) => {
    if (!isPlayMode()) return;
    event.preventDefault();
    const zoomFactor = Math.exp(event.deltaY * 0.0015);
    playCamera.distance = clamp(
      playCamera.distance * zoomFactor,
      playCamera.minDistance,
      playCamera.maxDistance,
    );
    state.playCameraDistance = Math.round(playCamera.distance);
    updatePlayControlDisplay("playCameraDistance");
    saveState();
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !aboutPanel.hidden) {
    event.preventDefault();
    setAboutOpen(false, { restoreFocus: true });
    return;
  }
  if (!isPlayMode()) return;
  const target = event.target;
  if (target instanceof Element && target.closest("input, textarea, select, button, a, summary, [contenteditable='true']")) return;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
    event.preventDefault();
  }
  pressedKeys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.code);
});

function resetTransientInput() {
  pressedKeys.clear();
  resetMobileJoystick();
  mobilePlay.jumpQueued = false;
  player.jumpWasPressed = false;
  const cameraPointerId = playCamera.pointerId;
  playCamera.dragging = false;
  playCamera.pointerId = null;
  if (cameraPointerId !== null && canvas.hasPointerCapture(cameraPointerId)) {
    canvas.releasePointerCapture(cameraPointerId);
  }
  if (player.draggingAvatar) {
    const avatarPointerId = player.avatarPointerId;
    player.draggingAvatar = false;
    player.avatarPointerId = null;
    avatarHandle.classList.remove("is-dragging");
    if (avatarPointerId !== null && avatarHandle.hasPointerCapture(avatarPointerId)) {
      avatarHandle.releasePointerCapture(avatarPointerId);
    }
  }
}

window.addEventListener("blur", resetTransientInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetTransientInput();
});

window.addEventListener(
  "resize",
  () => {
    updateTouchPlayLayout();
    drawPaletteWheel();
  },
  { passive: true },
);
coarsePointerMedia.addEventListener("change", updateTouchPlayLayout);
reducedMotionMedia.addEventListener("change", () => {
  resetAmbientCameraActivity();
  updateBuildingMotion(0, 0);
  updateCamera();
});
window.addEventListener("pagehide", () => stopAudioReactive());

function resize() {
  if (state.mode === "texture") {
    const textureWidth = textureCanvas.clientWidth || window.innerWidth;
    const textureHeight = textureCanvas.clientHeight || window.innerHeight;
    if (
      Math.abs(textureWidth - lastTextureViewportWidth) > 1 ||
      Math.abs(textureHeight - lastTextureViewportHeight) > 1
    ) {
      renderTextureLab();
    }
    return;
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2) * state.renderScale;
  const targetWidth = Math.max(1, Math.floor(width * ratio));
  const targetHeight = Math.max(1, Math.floor(height * ratio));
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(ratio);
    composer.setSize(width, height);
    bloomPass.setSize(targetWidth, targetHeight);
    painterlyPass.uniforms.uResolution.value.set(targetWidth, targetHeight);
    grainPass.uniforms.uResolution.value.set(targetWidth, targetHeight);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }
}

function animate(now) {
  resize();
  const frameInterval = 1000 / Math.max(1, state.maxFps);
  if (lastRenderAt && now - lastRenderAt < frameInterval) {
    animationFrame = requestAnimationFrame(animate);
    return;
  }
  const delta = lastRenderAt ? Math.min(0.12, (now - lastRenderAt) / 1000) : 0;
  const dt = Math.min(0.05, Math.max(0.001, delta || 1 / 60));
  lastRenderAt = now;
  const time = now / 1000;
  const visualTime = reducedMotionMedia.matches ? 0 : time;
  if (reducedMotionMedia.matches) {
    lightningPulse = 0;
    lightningBolt.geometry.setDrawRange(0, 0);
    lightningBolt.material.opacity = 0;
    skyMaterial.uniforms.uLightning.value = 0;
  } else {
    updateLightning(time, delta);
  }
  applyLighting();
  updateBuildingMotion(visualTime, delta);
  updateStarUniforms(visualTime);
  rainRoot.children.forEach((rain) => updateRainGeometry(rain, visualTime));
  if (!reducedMotionMedia.matches) {
    birdsRoot.children.forEach((bird) => {
      bird.position.x += bird.userData.speed * delta;
      bird.position.y = bird.userData.baseY + Math.sin(time * 3 + bird.userData.phase) * 0.18;
      if (bird.position.x > 42) bird.position.x = -42 + (bird.position.x - 42);
    });
  }
  if (isPlayMode()) {
    updateAvatar(dt);
    updatePlayCamera(dt);
  } else {
    updateAmbientCamera(time, now);
    controls.update();
  }
  skyMesh.position.copy(camera.position);
  skyMaterial.uniforms.uTime.value = visualTime;
  const postTime = visualTime % POST_SHADER_TIME_LOOP;
  painterlyPass.uniforms.uTime.value = postTime;
  grainPass.uniforms.uTime.value = postTime;
  composer.render();
  animationFrame = requestAnimationFrame(animate);
}

renderControls();
updateViewportMode();
updateReactiveState();
if (state.mode === "texture") {
  updateToolbarStates();
} else {
  rebuildScene({ resetCamera: true });
}
animationFrame = requestAnimationFrame(animate);

window.proceduralCity = {
  state,
  regenerate: rebuildScene,
  regenerateTextureLab: renderTextureLab,
  stats() {
    return {
      buildings: buildingCount,
      meshes: meshCount,
      materials: materialCount,
      windows: windowCount,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    };
  },
  stop() {
    cancelAnimationFrame(animationFrame);
    stopAudioReactive();
    resetTransientInput();
  },
};
