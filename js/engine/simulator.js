/**
 * PRISMA STREAM — HTML5 Canvas Geometric Simulation Engine
 * Manages grid layout, bezier laser wire routing, particle physics,
 * prism collisions, and real-time mathematical impurity telemetry.
 */

import {
  calculateGini,
  calculateGiniGain,
  calculateEntropy,
  calculateInformationGain,
  calculateWireBrightness,
  getMathematicalBreakdown
} from "./gini.js";

/**
 * Cubic Bezier point evaluator.
 */
function getBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  };
}

export class SimulationEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = Object.assign({
      cols: 6,
      rows: 5,
      paddingLeft: 70,
      paddingRight: 140,
      paddingY: 65,
      speed: 1.0,
      onBinUpdate: null,
      onPrismHit: null,
      onMetricsUpdate: null
    }, options);

    this.particles = [];
    this.prisms = new Map(); // Key: `${col}_${row}` -> Prism object
    this.bins = []; // Array of output bins at col = cols - 1
    this.animId = null;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.spawnInterval = 850; // ms between particle spawns
    this.spawningEnabled = true;
    this.generator = null;
    this.hoverCell = null;
    this.selectedPrismKey = null;

    // Global model performance telemetry
    this.metrics = {
      trainAccuracy: 100.0,
      testAccuracy: 100.0,
      overallGini: 0.0,
      treeDepth: 0
    };

    this.initBins();
    this.resize();
  }

  setGenerator(generator, interval = 850) {
    this.generator = generator;
    this.spawnInterval = interval;
  }

  setHoverCell(col, row) {
    if (col !== null && col !== undefined && row !== null && row !== undefined) {
      this.hoverCell = { col, row };
    } else {
      this.hoverCell = null;
    }
  }

  initBins() {
    this.bins = [];
    for (let r = 0; r < this.options.rows; r++) {
      this.bins.push({
        row: r,
        col: this.options.cols - 1,
        collected: [],
        gini: 0.0,
        entropy: 0.0,
        purity: 100.0,
        isStable: true,
        dominantClass: null,
        classDistribution: {},
        simulatedCount: 0
      });
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  getCellPos(col, row) {
    const { cols, rows, paddingY } = this.options;
    const padLeft = this.options.paddingLeft !== undefined ? this.options.paddingLeft : 70;
    const padRight = this.options.paddingRight !== undefined ? this.options.paddingRight : 140;
    const usableWidth = this.width - padLeft - padRight;
    const usableHeight = this.height - paddingY * 2;
    const stepX = usableWidth / (cols - 1);
    const stepY = usableHeight / (rows - 1);

    return {
      x: padLeft + col * stepX,
      y: paddingY + row * stepY
    };
  }

  addPrism(col, row, condition) {
    const key = `${col}_${row}`;
    const prism = {
      col,
      row,
      feature: condition.feature, // "color" | "shape" | "size"
      operator: condition.operator || "==",
      value: condition.value, // e.g. "blue", "circle", "large"
      label: `${condition.feature.toUpperCase()} == ${String(condition.value).toUpperCase()}`,
      pulse: 0.0,
      giniGain: 0.0,
      infoGain: 0.0,
      wireBrightness: 0.5,
      parentItems: [],
      trueItems: [],
      falseItems: [],
      mathBreakdown: null
    };
    this.prisms.set(key, prism);
    this.recalculateAllMetrics();
    return prism;
  }

  removePrism(col, row) {
    const key = `${col}_${row}`;
    const deleted = this.prisms.delete(key);
    if (deleted) {
      this.recalculateAllMetrics();
    }
    return deleted;
  }

  clearPrisms() {
    this.prisms.clear();
    this.recalculateAllMetrics();
  }

  resetStream() {
    this.particles = [];
    this.initBins();
    this.recalculateAllMetrics();
  }

  /**
   * Recalculates exact mathematical Gini, Gini Gain, Entropy, Information Gain,
   * wire brightness, and Train vs Test generalization accuracy across the current network.
   */
  recalculateAllMetrics() {
    if (!this.generator) return;

    // 1. Evaluate on Training sample batch
    const trainBatch = this.generator.generateBatch(80, "train");
    const trainPaths = trainBatch.map(p => this.simulateParticlePath(p));

    // Update each prism's metrics using training data
    for (const [key, prism] of this.prisms.entries()) {
      const arriving = [];
      const left = [];
      const right = [];

      for (const sp of trainPaths) {
        const step = sp.find(s => s.col === prism.col && s.row === prism.row);
        if (step) {
          arriving.push(step.particle);
          if (step.branch === "up") left.push(step.particle);
          else if (step.branch === "down") right.push(step.particle);
        }
      }

      prism.parentItems = arriving;
      prism.trueItems = left;
      prism.falseItems = right;

      const breakdown = getMathematicalBreakdown(arriving, left, right, "targetClass");
      prism.mathBreakdown = breakdown;
      prism.giniGain = breakdown.giniGain;
      prism.infoGain = breakdown.infoGain;
      prism.wireBrightness = calculateWireBrightness(breakdown.giniGain, breakdown.parentGini);
    }

    // Update Output Bins for Training data
    let totalCorrectTrain = 0;
    this.bins.forEach(bin => {
      const inBin = trainPaths
        .filter(sp => sp[sp.length - 1].row === bin.row)
        .map(sp => sp[sp.length - 1].particle);

      bin.simulatedCount = inBin.length;
      bin.gini = calculateGini(inBin, "targetClass");
      bin.entropy = calculateEntropy(inBin, "targetClass");

      // Determine majority class and purity
      const counts = new Map();
      for (const p of inBin) {
        counts.set(p.targetClass, (counts.get(p.targetClass) || 0) + 1);
      }
      let maxCnt = 0;
      let dominant = null;
      for (const [cls, cnt] of counts.entries()) {
        if (cnt > maxCnt) {
          maxCnt = cnt;
          dominant = cls;
        }
      }
      bin.dominantClass = dominant;
      bin.classDistribution = Object.fromEntries(counts);
      const purity = inBin.length > 0 ? Number(((maxCnt / inBin.length) * 100).toFixed(1)) : 100.0;
      bin.purity = purity;
      bin.isStable = inBin.length === 0 || bin.gini === 0.0 || (purity >= 78.0 && inBin.length > 0);

      if (dominant) {
        totalCorrectTrain += maxCnt;
      }
    });

    const trainAccuracy = trainBatch.length > 0
      ? Number(((totalCorrectTrain / trainBatch.length) * 100).toFixed(1))
      : 100.0;

    // 2. Evaluate on Unseen Test sample batch
    const testBatch = this.generator.generateBatch(80, "test");
    const testPaths = testBatch.map(p => this.simulateParticlePath(p));
    let totalCorrectTest = 0;

    testPaths.forEach(sp => {
      const finalRow = sp[sp.length - 1].row;
      const bin = this.bins[finalRow];
      if (bin && bin.dominantClass && sp[sp.length - 1].particle.targetClass === bin.dominantClass) {
        totalCorrectTest++;
      }
    });

    const testAccuracy = testBatch.length > 0
      ? Number(((totalCorrectTest / testBatch.length) * 100).toFixed(1))
      : 100.0;

    // Calculate maximum tree depth (furthest column containing a prism)
    let maxDepth = 0;
    for (const prism of this.prisms.values()) {
      if (prism.col > maxDepth) maxDepth = prism.col;
    }

    this.metrics = {
      trainAccuracy,
      testAccuracy,
      treeDepth: maxDepth
    };

    if (this.options.onBinUpdate) {
      this.options.onBinUpdate(this.bins);
    }
    if (this.options.onMetricsUpdate) {
      this.options.onMetricsUpdate(this.metrics);
    }
  }

  simulateParticlePath(particle) {
    let c = 0;
    let r = 2; // Center row
    const path = [];

    while (c < this.options.cols - 1) {
      const key = `${c}_${r}`;
      const prism = this.prisms.get(key);

      if (prism) {
        const matches = this.evaluateCondition(particle, prism);
        const branch = matches ? "up" : "down";
        path.push({ col: c, row: r, particle, branch });
        r = matches ? Math.max(0, r - 1) : Math.min(this.options.rows - 1, r + 1);
      } else {
        path.push({ col: c, row: r, particle, branch: "straight" });
      }
      c++;
    }

    path.push({ col: c, row: r, particle, branch: "end" });
    return path;
  }

  evaluateCondition(particle, prism) {
    const val = particle[prism.feature];
    return String(val).toLowerCase() === String(prism.value).toLowerCase();
  }

  start() {
    if (this.animId) return;
    this.lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min(100, now - this.lastTime);
      this.lastTime = now;

      this.update(dt);
      this.render();

      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  update(dt) {
    // Spawning logic
    if (this.spawningEnabled && this.generator) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        const p = this.generator.spawnParticle();
        const startPos = this.getCellPos(0, 2);
        p.fromCol = 0;
        p.fromRow = 2;
        p.targetCol = 1;
        p.targetRow = 2;
        p.posX = startPos.x;
        p.posY = startPos.y;
        p.progress = 0.0;
        p.status = "traveling";

        // Check if prism exists at starting destination (col 1, row 2)
        this.particles.push(p);
      }
    }

    // Tranquil, comfortable speed: ~0.00120 (easy to observe and follow)
    const { cols, rows, speed } = this.options;
    const moveStep = 0.00120 * speed * dt;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.status === "traveling") {
        p.progress += moveStep;

        if (p.progress >= 1.0) {
          // Arrived at targetCol, targetRow
          p.progress = 0.0;
          p.fromCol = p.targetCol;
          p.fromRow = p.targetRow;

          if (p.fromCol >= cols - 1) {
            // Reached Output Bins on the right edge
            p.status = "binned";
            const bin = this.bins[p.fromRow];
            if (bin) {
              bin.collected.push(p);
              if (bin.collected.length > 40) bin.collected.shift();
              bin.gini = calculateGini(bin.collected, "targetClass");
              bin.entropy = calculateEntropy(bin.collected, "targetClass");
              const counts = new Map();
              for (const cp of bin.collected) {
                counts.set(cp.targetClass, (counts.get(cp.targetClass) || 0) + 1);
              }
              let maxC = 0;
              for (const cnt of counts.values()) {
                if (cnt > maxC) maxC = cnt;
              }
              const purity = bin.collected.length > 0 ? (maxC / bin.collected.length) * 100 : 100;
              bin.purity = purity;
              bin.isStable = bin.gini === 0.0 || purity >= 78.0;
            }
          } else {
            // Intermediate node: check if a prism sits here
            const key = `${p.fromCol}_${p.fromRow}`;
            const prism = this.prisms.get(key);

            if (prism) {
              const isMatch = this.evaluateCondition(p, prism);
              prism.pulse = 1.0;

              p.targetCol = p.fromCol + 1;
              p.targetRow = isMatch ? Math.max(0, p.fromRow - 1) : Math.min(rows - 1, p.fromRow + 1);

              if (this.options.onPrismHit) {
                this.options.onPrismHit(prism, p);
              }
            } else {
              // Passive straight routing
              p.targetCol = p.fromCol + 1;
              p.targetRow = p.fromRow;
            }
          }
        }

        // Compute exact position along the wire trajectory
        if (p.status === "traveling") {
          const pFrom = this.getCellPos(p.fromCol, p.fromRow);
          const pTo = this.getCellPos(p.targetCol, p.targetRow);

          if (p.fromRow === p.targetRow) {
            // Linear horizontal track
            p.posX = pFrom.x + (pTo.x - pFrom.x) * p.progress;
            p.posY = pFrom.y;
          } else {
            // Smooth cubic bezier curved track
            const dx = pTo.x - pFrom.x;
            const p1 = { x: pFrom.x + dx * 0.45, y: pFrom.y };
            const p2 = { x: pTo.x - dx * 0.45, y: pTo.y };
            const pt = getBezierPoint(pFrom, p1, p2, pTo, p.progress);
            p.posX = pt.x;
            p.posY = pt.y;
          }
        }
      } else if (p.status === "binned") {
        // Smoothly fade out inside output bin
        p.posX += 0.5 * speed;
        if (p.alpha === undefined) p.alpha = 1.0;
        p.alpha -= 0.035 * speed;
        if (p.alpha <= 0.03) {
          this.particles.splice(i, 1);
        }
      }
    }

    // Decay prism pulse glows
    for (const prism of this.prisms.values()) {
      if (prism.pulse > 0) {
        prism.pulse = Math.max(0, prism.pulse - 0.035);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Grid lines and laser routing tracks
    this.renderTracks(ctx);

    // 2. Splitter Prisms
    this.renderPrisms(ctx);

    // 3. Output Bins (Leaf nodes)
    this.renderBins(ctx);

    // 4. Moving geometric particles
    this.renderParticles(ctx);
  }

  renderTracks(ctx) {
    const { cols, rows } = this.options;

    // Draw subtle grid intersection points
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const pos = this.getCellPos(c, r);
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw hover targeting reticle if mouse is over an interactive node
    if (this.hoverCell) {
      const pos = this.getCellPos(this.hoverCell.col, this.hoverCell.row);
      const key = `${this.hoverCell.col}_${this.hoverCell.row}`;
      const hasPrism = this.prisms.has(key);
      ctx.save();
      ctx.strokeStyle = hasPrism ? "rgba(239, 68, 68, 0.75)" : "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw laser circuit wires between columns
    for (let c = 0; c < cols - 1; c++) {
      for (let r = 0; r < rows; r++) {
        const from = this.getCellPos(c, r);
        const key = `${c}_${r}`;
        const prism = this.prisms.get(key);

        if (prism) {
          // Prism branches: Upper (True) and Lower (False)
          const upRow = Math.max(0, r - 1);
          const downRow = Math.min(rows - 1, r + 1);

          const toUp = this.getCellPos(c + 1, upRow);
          const toDown = this.getCellPos(c + 1, downRow);
          const dx = toUp.x - from.x;

          // Wire brightness and pulse scaled by Gini Gain
          const brightness = prism.wireBrightness || 0.5;

          // Upper Wire (True branch — Cyan glow)
          ctx.save();
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.25 + brightness * 0.7})`;
          ctx.lineWidth = 1.8 + brightness * 2.2;
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 9 * brightness;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.bezierCurveTo(from.x + dx * 0.45, from.y, toUp.x - dx * 0.45, toUp.y, toUp.x, toUp.y);
          ctx.stroke();
          ctx.restore();

          // Lower Wire (False branch — Amber glow)
          ctx.save();
          ctx.strokeStyle = `rgba(251, 146, 60, ${0.25 + brightness * 0.7})`;
          ctx.lineWidth = 1.8 + brightness * 2.2;
          ctx.shadowColor = "#fb923c";
          ctx.shadowBlur = 9 * brightness;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.bezierCurveTo(from.x + dx * 0.45, from.y, toDown.x - dx * 0.45, toDown.y, toDown.x, toDown.y);
          ctx.stroke();
          ctx.restore();
        } else {
          // Passive straight horizontal track
          const to = this.getCellPos(c + 1, r);
          ctx.save();
          ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Source Emitter Node on far left (Data Inflow)
    const emitPos = this.getCellPos(0, 2);
    ctx.save();
    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(emitPos.x - 22, emitPos.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Source label
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText("DATA SOURCE", emitPos.x - 34, emitPos.y + 3);
    ctx.restore();
  }

  renderPrisms(ctx) {
    for (const prism of this.prisms.values()) {
      const pos = this.getCellPos(prism.col, prism.row);
      const size = 26;

      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Pulse glow on collision
      if (prism.pulse > 0) {
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 18 * prism.pulse;
      }

      // Hexagonal Crystal Prism Body
      ctx.fillStyle = "#0c1322";
      ctx.strokeStyle = prism.pulse > 0 ? "#67e8f9" : "#38bdf8";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.86, -size * 0.35);
      ctx.lineTo(size * 0.86, size * 0.35);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.86, size * 0.35);
      ctx.lineTo(-size * 0.86, -size * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Information Resonance Core
      const coreSize = 5 + (prism.giniGain || 0) * 12;
      ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + (prism.giniGain || 0) * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Question Badge Above Prism
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 9.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(prism.label, 0, -size - 7);

      // Branch Directional Indicators: clean minimal True / False
      ctx.font = "600 8.5px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("YES", size * 0.55, -size * 0.45);
      ctx.fillStyle = "#fb923c";
      ctx.fillText("NO", size * 0.55, size * 0.55);

      ctx.restore();
    }
  }

  renderBins(ctx) {
    const { cols } = this.options;
    for (const bin of this.bins) {
      const pos = this.getCellPos(cols - 1, bin.row);
      const isPure = bin.isStable;

      ctx.save();
      ctx.translate(pos.x + 18, pos.y);

      // Stability Glow
      ctx.shadowColor = isPure ? "#10b981" : "#f59e0b";
      ctx.shadowBlur = isPure ? 14 : 5;

      ctx.strokeStyle = isPure ? "#10b981" : "#f59e0b";
      ctx.lineWidth = 2.2;
      ctx.fillStyle = isPure ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.08)";

      // Intake Funnel Bracket
      ctx.beginPath();
      ctx.arc(0, 0, 15, -Math.PI * 0.5, Math.PI * 0.5, true);
      ctx.stroke();
      ctx.fill();

      ctx.shadowBlur = 0;

      // Line 1: Status Pill Text (100% PURE or IMPURE)
      ctx.font = "700 9px 'JetBrains Mono', monospace";
      ctx.fillStyle = isPure ? "#34d399" : "#fbbf24";
      ctx.textAlign = "left";
      ctx.fillText(isPure ? "100% PURE" : "IMPURE", 12, -4);

      // Line 2: Dominant Target Class Tag
      ctx.font = "600 8.5px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#cbd5e1";
      const classStr = bin.dominantClass ? `[${bin.dominantClass}]` : "Empty";
      ctx.fillText(classStr, 12, 7);

      // Line 3: Clear, High-Contrast Gini Impurity Readout (Prominently displayed, never clipped)
      ctx.font = "700 8.5px 'JetBrains Mono', monospace";
      ctx.fillStyle = isPure ? "#34d399" : "#fb923c";
      ctx.fillText(`GINI: ${bin.gini.toFixed(3)}`, 12, 18);

      ctx.restore();
    }
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      const isSmall = p.size === "small";
      const radius = isSmall ? 7 : 12;
      const isBlue = p.color === "blue";
      const colorHex = isBlue ? "#38bdf8" : "#fb923c";

      ctx.save();
      ctx.translate(p.posX, p.posY);
      ctx.globalAlpha = p.alpha !== undefined ? p.alpha : 1.0;

      // Outer Feature Body
      ctx.fillStyle = colorHex;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = colorHex;
      ctx.shadowBlur = 7;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.shape === "square") {
        const half = radius * 0.88;
        ctx.beginPath();
        ctx.rect(-half, -half, half * 2, half * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.shape === "triangle") {
        ctx.beginPath();
        ctx.moveTo(radius * 1.15, 0); // Pointing forward along travel path
        ctx.lineTo(-radius * 0.8, -radius * 0.88);
        ctx.lineTo(-radius * 0.8, radius * 0.88);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Inner Target Class Glyph (Separating Feature from Ground-Truth Label)
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#090d16";
      ctx.font = `700 ${isSmall ? 7 : 9.5}px 'JetBrains Mono', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const glyph = p.targetClass === "Alpha" ? "A" : (p.targetClass === "Beta" ? "B" : "G");
      ctx.fillText(glyph, 0, 0);

      // Distinct styling for Unseen Test Data particles
      if (p.mode === "test") {
        ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
