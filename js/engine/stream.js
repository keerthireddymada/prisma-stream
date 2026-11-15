/**
 * PRISMA STREAM — Procedural Data Stream Generator
 * Spawns continuous geometric particles representing dataset rows.
 * Strictly separates input features (shape, color, size) from target class (Alpha, Beta, Gamma).
 * Supports both Training and Unseen Testing data generation for authentic overfitting verification.
 */

export const SHAPES = ["circle", "square", "triangle"];
export const COLORS = ["blue", "orange"];
export const SIZES = ["small", "large"];
export const TARGET_CLASSES = ["Alpha", "Beta", "Gamma"];

/**
 * Deterministic PRNG (Mulberry32).
 */
export function createRNG(seed = 42) {
  let a = seed >>> 0;
  return function() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Particle Stream Generator with customizable class distributions
 * and train/test partition support.
 */
export class StreamGenerator {
  constructor(options = {}) {
    this.seed = options.seed || 1337;
    this.rng = createRNG(this.seed);
    this.particleCounter = 0;
    this.mode = options.mode || "train"; // "train" | "test"
    this.distributions = Object.assign({
      shapes: { circle: 0.333, square: 0.333, triangle: 0.334 },
      colors: { blue: 0.5, orange: 0.5 },
      sizes: { small: 0.5, large: 0.5 },
      targetRule: null, // (features, rng, mode) => "Alpha" | "Beta" | "Gamma"
      conditional: null // Custom generator function
    }, options);
  }

  setMode(mode) {
    this.mode = mode;
    // Reset RNG with test-specific or train-specific offset for reproducible separation
    const offset = mode === "test" ? 99991 : 0;
    this.rng = createRNG(this.seed + offset);
  }

  setDistributions(dist) {
    this.distributions = Object.assign(this.distributions, dist);
  }

  _sampleCategorical(weightsObj) {
    const keys = Object.keys(weightsObj);
    let r = this.rng();
    let cumulative = 0;
    for (const key of keys) {
      cumulative += weightsObj[key];
      if (r <= cumulative) return key;
    }
    return keys[keys.length - 1];
  }

  spawnParticle() {
    this.particleCounter++;
    const id = `P_${this.particleCounter}`;

    let shape, color, size, targetClass;

    if (this.distributions.conditional) {
      const res = this.distributions.conditional(this.rng, this.mode);
      shape = res.shape;
      color = res.color;
      size = res.size;
      targetClass = res.targetClass;
    } else {
      shape = this._sampleCategorical(this.distributions.shapes);
      color = this._sampleCategorical(this.distributions.colors);
      size = this._sampleCategorical(this.distributions.sizes);

      if (this.distributions.targetRule) {
        targetClass = this.distributions.targetRule({ shape, color, size }, this.rng, this.mode);
      } else {
        // Default target: correlated with color
        targetClass = color === "blue" ? "Alpha" : "Beta";
      }
    }

    return {
      id,
      shape,
      color,
      size,
      targetClass,
      mode: this.mode,
      label: `${shape}_${color}_${size}_${targetClass}`,
      createdAt: performance.now(),
      // Simulation positioning state
      gridX: 0,
      gridY: 2, // Middle row index (row 2 of 0..4)
      posX: 0,
      posY: 0,
      targetX: 0,
      targetY: 0,
      progress: 0.0,
      speed: 1.0,
      status: "traveling", // "traveling" | "binned" | "absorbed"
      routedPath: []
    };
  }

  /**
   * Generates a batch of N reference samples for mathematical metrics and test evaluation.
   */
  generateBatch(count = 80, overrideMode = null) {
    const originalMode = this.mode;
    if (overrideMode) this.setMode(overrideMode);

    const batch = [];
    for (let i = 0; i < count; i++) {
      batch.push(this.spawnParticle());
    }

    if (overrideMode) this.setMode(originalMode);
    return batch;
  }
}
