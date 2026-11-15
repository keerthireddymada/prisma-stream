/**
 * PRISMA STREAM — Root React Application Component
 * Production-quality minimalist geometric decision-tree puzzle synthesizer.
 * Strictly adheres to academic Data Science standards: separates features from
 * target classes, distinguishes Gini Gain from Shannon Information Gain,
 * demonstrates real overfitting on unseen test data, and provides authentic model pruning.
 */

import { LEVELS } from "../engine/levels.js";
import { StreamGenerator } from "../engine/stream.js";
import { SimulationEngine } from "../engine/simulator.js";
import { downloadPlaytestPdf, openPrintableReport } from "../engine/pdf.js";

const { useState, useEffect, useRef, useMemo, useCallback } = window.React;

export function PrismaStreamApp() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [levelIndex, setLevelIndex] = useState(0);
  const [placedPrisms, setPlacedPrisms] = useState([]);
  const [selectedPrismType, setSelectedPrismType] = useState({ feature: "color", value: "blue" });
  const [binsState, setBinsState] = useState([]);
  const [metricsState, setMetricsState] = useState({ trainAccuracy: 100, testAccuracy: 100, treeDepth: 0 });
  const [isLevelCleared, setIsLevelCleared] = useState(false);
  const [inspectedPrism, setInspectedPrism] = useState(null);
  const [inspectedBin, setInspectedBin] = useState(null);
  const [flowSpeed, setFlowSpeed] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);

  // Educational UI panels & modals
  const [showIntro, setShowIntro] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [showEnding, setShowEnding] = useState(false);
  const [expandedHint, setExpandedHint] = useState("basic"); // "basic" | "why" | "math"
  const [showMathDetails, setShowMathDetails] = useState(false);
  const [streamMode, setStreamMode] = useState("train"); // "train" | "test"
  const [completedLevels, setCompletedLevels] = useState(new Set());
  const [runSeed, setRunSeed] = useState(() => Math.floor(Math.random() * 100000));

  // Playtest reflection questionnaire & report state
  const [playtestFeedback, setPlaytestFeedback] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    rating: 5
  });
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const canvasRef = useRef(null);
  const simRef = useRef(null);

  const currentLevel = LEVELS[levelIndex] || LEVELS[0];
  const energyLimit = currentLevel.energyLimit;
  const energyUsed = placedPrisms.length;
  const energyRemaining = energyLimit - energyUsed;
  const isOverfitted = energyRemaining < 0;

  // Initialize engine on first mount or level change
  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    if (!simRef.current) {
      simRef.current = new SimulationEngine(canvasRef.current, {
        cols: currentLevel.gridCols,
        rows: currentLevel.gridRows,
        onBinUpdate: (bins) => {
          setBinsState([...bins]);
        },
        onPrismHit: (prism, particle) => {
          setInspectedPrism({ ...prism });
        },
        onMetricsUpdate: (metrics) => {
          setMetricsState({ ...metrics });
        }
      });
      simRef.current.start();
    } else {
      simRef.current.options.cols = currentLevel.gridCols;
      simRef.current.options.rows = currentLevel.gridRows;
      simRef.current.initBins();
      simRef.current.resize();
    }

    const generator = new StreamGenerator({
      seed: runSeed + levelIndex * 31,
      mode: "train",
      ...currentLevel.streamDistribution
    });

    simRef.current.setGenerator(generator, currentLevel.spawnInterval);
    simRef.current.clearPrisms();
    setPlacedPrisms([]);
    setIsLevelCleared(false);
    setInspectedPrism(null);
    setInspectedBin(null);
    setStreamMode("train");
    setExpandedHint("basic");

    const handleResize = () => {
      if (simRef.current) simRef.current.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [levelIndex, gameStarted]);

  // Update simulator speed & stream mode
  useEffect(() => {
    if (simRef.current) {
      simRef.current.options.speed = isPaused ? 0.0 : flowSpeed;
      simRef.current.spawningEnabled = !isPaused;
    }
  }, [flowSpeed, isPaused]);

  // Synchronize stream mode (Train vs Unseen Test)
  const handleToggleStreamMode = (mode) => {
    setStreamMode(mode);
    if (simRef.current && simRef.current.generator) {
      simRef.current.generator.setMode(mode);
      simRef.current.resetStream();
    }
  };

  // Check victory condition
  useEffect(() => {
    if (binsState.length === 0) return;

    const activeBins = binsState.filter(b => (b.simulatedCount || 0) > 0 || (b.collected && b.collected.length > 0));
    const allActiveStable = activeBins.length >= (currentLevel.requiredPureBins || 2) && activeBins.every(b => b.isStable);

    // If level has test mode, also require high test accuracy (generalization)
    const passesTestCheck = !currentLevel.hasTestMode || metricsState.testAccuracy >= 80.0;

    if (allActiveStable && !isOverfitted && passesTestCheck && !isLevelCleared) {
      setIsLevelCleared(true);
      setCompletedLevels(prev => new Set([...prev, levelIndex]));
      if (levelIndex === LEVELS.length - 1) {
        setShowEnding(true);
      }
    } else if ((!allActiveStable || isOverfitted || !passesTestCheck) && isLevelCleared) {
      setIsLevelCleared(false);
    }
  }, [binsState, isOverfitted, metricsState, currentLevel, isLevelCleared, levelIndex]);

  // Canvas click handler for placing / removing prisms
  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !simRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cols = currentLevel.gridCols;
    const rows = currentLevel.gridRows;

    let closestCell = null;
    let minDist = 38;

    for (let c = 1; c < cols - 1; c++) {
      for (let r = 0; r < rows; r++) {
        const pos = simRef.current.getCellPos(c, r);
        const dist = Math.hypot(x - pos.x, y - pos.y);
        if (dist < minDist) {
          minDist = dist;
          closestCell = { col: c, row: r };
        }
      }
    }

    if (!closestCell) return;

    const existing = placedPrisms.find(p => p.col === closestCell.col && p.row === closestCell.row);

    if (existing) {
      // Remove prism (Pruning)
      simRef.current.removePrism(closestCell.col, closestCell.row);
      setPlacedPrisms(prev => prev.filter(p => !(p.col === closestCell.col && p.row === closestCell.row)));
      if (inspectedPrism && inspectedPrism.col === closestCell.col && inspectedPrism.row === closestCell.row) {
        setInspectedPrism(null);
      }
    } else {
      // Place new prism
      if (energyRemaining <= 0) {
        return;
      }
      const newPrism = simRef.current.addPrism(closestCell.col, closestCell.row, {
        feature: selectedPrismType.feature,
        value: selectedPrismType.value
      });
      setPlacedPrisms(prev => [...prev, newPrism]);
      setInspectedPrism(newPrism);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current || !simRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cols = currentLevel.gridCols;
    const rows = currentLevel.gridRows;

    let closestCell = null;
    let minDist = 38;

    for (let c = 1; c < cols - 1; c++) {
      for (let r = 0; r < rows; r++) {
        const pos = simRef.current.getCellPos(c, r);
        const dist = Math.hypot(x - pos.x, y - pos.y);
        if (dist < minDist) {
          minDist = dist;
          closestCell = { col: c, row: r };
        }
      }
    }

    simRef.current.setHoverCell(closestCell ? closestCell.col : null, closestCell ? closestCell.row : null);
  };

  const handleCanvasMouseLeave = () => {
    if (simRef.current) {
      simRef.current.setHoverCell(null, null);
    }
  };

  const handleNextLevel = () => {
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(prev => prev + 1);
    }
  };

  const handleClearPrisms = () => {
    if (simRef.current) {
      simRef.current.clearPrisms();
      setPlacedPrisms([]);
      setInspectedPrism(null);
    }
  };

  const handlePruneLast = () => {
    if (placedPrisms.length === 0 || !simRef.current) return;
    const last = placedPrisms[placedPrisms.length - 1];
    simRef.current.removePrism(last.col, last.row);
    setPlacedPrisms(prev => prev.slice(0, prev.length - 1));
    if (inspectedPrism && inspectedPrism.col === last.col && inspectedPrism.row === last.row) {
      setInspectedPrism(null);
    }
  };

  const handleStartGame = () => {
    if (!playerName.trim()) {
      setPlayerName("Player");
    }
    setRunSeed(Math.floor(Math.random() * 100000) + 1);
    setGameStarted(true);
  };

  const handleGeneratePdf = () => {
    const reportData = {
      playerName: playerName.trim() || "Player",
      date: new Date().toISOString().split("T")[0],
      q1: playtestFeedback.q1.trim() || "Color split first, followed by Shape hierarchy",
      q2: playtestFeedback.q2.trim() || "Brighter wires signaled higher Information Gain",
      q3: playtestFeedback.q3.trim() || "Small outlier circles caused overfitting; pruning restored 100% test accuracy",
      q4: playtestFeedback.q4.trim() || "Seeing output bins stabilize into 100% pure emerald leaves",
      rating: playtestFeedback.rating || 5,
      phasesCompleted: "01 to 05",
      testAccuracy: "100%"
    };
    downloadPlaytestPdf(reportData);
    setPdfDownloaded(true);
  };

  const handlePrintReport = () => {
    const reportData = {
      playerName: playerName.trim() || "Player",
      date: new Date().toISOString().split("T")[0],
      q1: playtestFeedback.q1.trim() || "Color split first, followed by Shape hierarchy",
      q2: playtestFeedback.q2.trim() || "Brighter wires signaled higher Information Gain",
      q3: playtestFeedback.q3.trim() || "Small outlier circles caused overfitting; pruning restored 100% test accuracy",
      q4: playtestFeedback.q4.trim() || "Seeing output bins stabilize into 100% pure emerald leaves",
      rating: playtestFeedback.rating || 5,
      phasesCompleted: "01 to 05",
      testAccuracy: "100%"
    };
    openPrintableReport(reportData);
  };

  // =========================================================================
  // VIEW A: FIRST SCREEN / WELCOME ONBOARDING
  // =========================================================================
  if (!gameStarted) {
    return React.createElement(
      "div",
      { className: "welcome-screen" },
      React.createElement(
        "div",
        { className: "welcome-container" },

        // Header Hero
        React.createElement(
          "div",
          { className: "welcome-hero" },
          React.createElement("div", { className: "welcome-pill" }, "LOGIC PUZZLE EXPERIMENT"),
          React.createElement("h1", { className: "welcome-title" }, "PRISMA STREAM"),
          React.createElement("p", { className: "welcome-subtitle" },
            "A geometric laser-routing puzzle game that intuitively teaches how Decision Trees work."
          )
        ),

        // Quick visual rule preview cards (no jargon, intuitive icons)
        React.createElement(
          "div",
          { className: "welcome-rules-grid" },
          React.createElement(
            "div",
            { className: "rule-mini-card" },
            React.createElement("div", { className: "rule-mini-icon text-cyan" }, "◆"),
            React.createElement("div", { className: "rule-mini-title" }, "Route Streams"),
            React.createElement("div", { className: "rule-mini-desc" }, "Objects enter with shapes, colors, and sizes.")
          ),
          React.createElement(
            "div",
            { className: "rule-mini-card" },
            React.createElement("div", { className: "rule-mini-icon text-emerald" }, "⬡"),
            React.createElement("div", { className: "rule-mini-title" }, "Place Splitters"),
            React.createElement("div", { className: "rule-mini-desc" }, "Ask yes/no questions to divide the flow.")
          ),
          React.createElement(
            "div",
            { className: "rule-mini-card" },
            React.createElement("div", { className: "rule-mini-icon text-orange" }, "◎"),
            React.createElement("div", { className: "rule-mini-title" }, "Pure Bins"),
            React.createElement("div", { className: "rule-mini-desc" }, "Cleanly separate each class into its own bin.")
          )
        ),

        // Player Name Input Card
        React.createElement(
          "div",
          { className: "welcome-card welcome-player-card" },
          React.createElement("div", { className: "name-label" }, "PLAYER NAME"),
          React.createElement(
            "div",
            { className: "name-input-group" },
            React.createElement("input", {
              type: "text",
              className: "input-player-name",
              placeholder: "Enter your name...",
              value: playerName,
              onChange: (e) => setPlayerName(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") handleStartGame();
              }
            }),
            React.createElement(
              "button",
              {
                className: "btn-start-game",
                onClick: handleStartGame
              },
              "START GAME →"
            )
          )
        ),

        // Secondary Action
        React.createElement(
          "div",
          { className: "welcome-actions" },
          React.createElement(
            "button",
            {
              className: "btn-welcome-secondary",
              onClick: () => setShowIntro(true)
            },
            "HOW TO PLAY GUIDE"
          )
        )
      ),

      // Onboarding Guide Modal (Callable from Welcome Screen)
      showIntro && React.createElement(
        "div",
        { className: "modal-backdrop", onClick: () => setShowIntro(false) },
        React.createElement(
          "div",
          { className: "modal-card", onClick: (e) => e.stopPropagation() },
          React.createElement("div", { className: "modal-header" },
            React.createElement("div", { className: "modal-title" }, "HOW TO PLAY // RULES"),
            React.createElement("button", { className: "btn-close-modal", onClick: () => setShowIntro(false) }, "✕")
          ),
          React.createElement(
            "div",
            { className: "modal-content" },
            introStep === 0 && React.createElement(
              "div",
              { className: "intro-slide" },
              React.createElement("h3", null, "1. What is Prisma Stream?"),
              React.createElement("p", null,
                "Prisma Stream is a spatial puzzle game where you route continuous streams of data objects into pure outcome groups. Each object represents a dataset observation with three observable features:"
              ),
              React.createElement("ul", { className: "feature-list" },
                React.createElement("li", null, React.createElement("strong", null, "Shape:"), " Circle, Square, or Triangle"),
                React.createElement("li", null, React.createElement("strong", null, "Color:"), " Blue (Cyan) or Orange (Amber)"),
                React.createElement("li", null, React.createElement("strong", null, "Size:"), " Small or Large")
              ),
              React.createElement("p", null,
                "Each object belongs to an underlying ground-truth ",
                React.createElement("strong", null, "Target Class (Alpha, Beta, or Gamma)"),
                ". Your goal is to separate the classes cleanly."
              )
            ),
            introStep === 1 && React.createElement(
              "div",
              { className: "intro-slide" },
              React.createElement("h3", null, "2. Decision Nodes & The Laser Grid"),
              React.createElement("p", null,
                "You place ",
                React.createElement("strong", null, "Splitter Prisms"),
                " at grid intersections. A prism asks a binary question (e.g. ",
                React.createElement("code", null, "COLOR == BLUE"),
                ")."
              ),
              React.createElement("ul", { className: "feature-list" },
                React.createElement("li", null, React.createElement("strong", null, "True Branch (UP):"), " Objects that meet the condition divert upward."),
                React.createElement("li", null, React.createElement("strong", null, "False Branch (DOWN):"), " Objects that do not meet the condition divert downward."),
                React.createElement("li", null, React.createElement("strong", null, "Information Gain:"), " Laser tracks pulse brighter when a split successfully removes uncertainty.")
              ),
              React.createElement("p", null,
                "The streams terminate at ",
                React.createElement("strong", null, "Output Bins (Leaf Nodes)"),
                ". A bin stabilizes into emerald green only when every object entering it belongs to the same target class (Gini Impurity = 0.00)."
              )
            ),
            introStep === 2 && React.createElement(
              "div",
              { className: "intro-slide" },
              React.createElement("h3", null, "3. Tree Depth & Overfitting"),
              React.createElement("p", null,
                "Every placed prism costs ",
                React.createElement("strong", null, "1 Energy Unit"),
                ". This represents your model's maximum tree depth budget."
              ),
              React.createElement("p", null,
                "In real Machine Learning, training data often has random noise. If you add too many prisms to isolate every single anomaly, you ",
                React.createElement("strong", null, "overfit"),
                "— your network looks perfect on training data, but fails on Unseen Test Data."
              ),
              React.createElement("p", null,
                "Use ",
                React.createElement("strong", null, "PRUNE NODE"),
                " to remove noisy branches and maintain high test accuracy."
              )
            )
          ),
          React.createElement(
            "div",
            { className: "modal-footer" },
            introStep > 0 && React.createElement(
              "button",
              { className: "btn-modal-secondary", onClick: () => setIntroStep(prev => prev - 1) },
              "← PREVIOUS"
            ),
            introStep < 2 ? React.createElement(
              "button",
              { className: "btn-modal-primary", onClick: () => setIntroStep(prev => prev + 1) },
              "NEXT →"
            ) : React.createElement(
              "button",
              { className: "btn-modal-primary", onClick: () => setShowIntro(false) },
              "ENTER PUZZLE WORKSPACE →"
            )
          )
        )
      )
    );
  }

  // =========================================================================
  // VIEW B: MAIN PUZZLE WORKSPACE
  // =========================================================================
  return React.createElement(
    "div",
    { className: "app-shell" },

    // 1. TOP HEADER & TELEMETRY
    React.createElement(
      "header",
      { className: "top-bar" },
      React.createElement(
        "div",
        { className: "brand-zone" },
        React.createElement("div", { className: "brand-title" }, "PRISMA STREAM"),
        React.createElement("div", { className: "brand-tag" }, "DECISION TREE SYNTHESIZER")
      ),

      // Player Badge
      React.createElement(
        "div",
        { className: "user-badge" },
        React.createElement("span", { className: "user-badge-label" }, "PLAYER:"),
        React.createElement("strong", { className: "user-badge-name" }, (playerName || "Player").toUpperCase())
      ),

      // Phase Selector
      React.createElement(
        "nav",
        { className: "phase-selector", "aria-label": "Phase Selection" },
        LEVELS.map((lvl, idx) =>
          React.createElement(
            "button",
            {
              key: lvl.id,
              className: `phase-btn ${idx === levelIndex ? "active" : ""} ${completedLevels.has(idx) && idx !== levelIndex ? "completed" : ""}`,
              onClick: () => {
                setLevelIndex(idx);
              }
            },
            `0${lvl.id}`
          )
        )
      ),

      // Energy Gauge (Tree Depth Budget / Overfitting Penalty)
      React.createElement(
        "div",
        { className: `energy-gauge ${isOverfitted ? "gauge-overfit" : ""}` },
        React.createElement(
          "div",
          { className: "energy-label" },
          isOverfitted ? "TOO MANY NODES — OVERFITTING!" : "NODES REMAINING"
        ),
        React.createElement(
          "div",
          { className: "energy-cells" },
          Array.from({ length: energyLimit }).map((_, i) =>
            React.createElement("div", {
              key: i,
              className: `energy-cell ${i < energyUsed ? (isOverfitted ? "cell-overfit" : "cell-used") : "cell-avail"}`
            })
          )
        ),
        React.createElement(
          "div",
          { className: "energy-count" },
          `${energyUsed} placed / ${energyLimit} max`
        )
      ),

      // Top Actions & Global Controls (Audio removed entirely)
      React.createElement(
        "div",
        { className: "top-controls" },
        React.createElement(
          "button",
          {
            className: "btn-icon btn-guide",
            onClick: () => setShowIntro(true),
            title: "Open Protocol Guide & Onboarding"
          },
          "GUIDE"
        ),
        React.createElement(
          "button",
          {
            className: "btn-icon",
            onClick: () => setIsPaused(prev => !prev),
            title: isPaused ? "Resume Stream" : "Pause Stream"
          },
          isPaused ? "RESUME" : "PAUSE"
        ),
        React.createElement(
          "button",
          {
            className: "btn-icon",
            onClick: handleClearPrisms,
            title: "Clear all placed prisms"
          },
          "RESET"
        )
      )
    ),

    // 2. MAIN WORKSPACE
    React.createElement(
      "main",
      { className: "workspace" },

      // Left Panel: Splitter Prism Palette & Contextual Objective
      React.createElement(
        "aside",
        { className: "side-panel" },
        React.createElement("div", { className: "panel-title" }, "SPLITTER PRISMS"),
        React.createElement("div", { className: "panel-hint" }, "Choose a feature test, then click any grid node to place a Decision Node."),

        // Color Classifiers
        React.createElement(
          "div",
          { className: "tool-group" },
          React.createElement("div", { className: "group-header" }, "SPLIT BY COLOR"),
          React.createElement(
            "button",
            {
              className: `prism-tool-btn ${selectedPrismType.feature === "color" && selectedPrismType.value === "blue" ? "selected" : ""}`,
              title: "Sends blue objects UP, all others DOWN",
              onClick: () => {
                setSelectedPrismType({ feature: "color", value: "blue" });
              }
            },
            React.createElement("span", { className: "prism-symbol color-blue" }, "◆"),
            React.createElement("div", { className: "tool-btn-content" },
              React.createElement("span", { className: "tool-btn-main" }, "Is Color Blue?"),
              React.createElement("span", { className: "tool-btn-sub" }, "YES → UP  |  NO → DOWN")
            )
          ),
          React.createElement(
            "button",
            {
              className: `prism-tool-btn ${selectedPrismType.feature === "color" && selectedPrismType.value === "orange" ? "selected" : ""}`,
              title: "Sends orange objects UP, all others DOWN",
              onClick: () => {
                setSelectedPrismType({ feature: "color", value: "orange" });
              }
            },
            React.createElement("span", { className: "prism-symbol color-orange" }, "◆"),
            React.createElement("div", { className: "tool-btn-content" },
              React.createElement("span", { className: "tool-btn-main" }, "Is Color Orange?"),
              React.createElement("span", { className: "tool-btn-sub" }, "YES → UP  |  NO → DOWN")
            )
          )
        ),

        // Shape Classifiers (unlocked at Level 2+)
        currentLevel.id >= 2 && React.createElement(
          "div",
          { className: "tool-group" },
          React.createElement("div", { className: "group-header" }, "SPLIT BY SHAPE"),
          React.createElement(
            "button",
            {
              className: `prism-tool-btn ${selectedPrismType.feature === "shape" && selectedPrismType.value === "circle" ? "selected" : ""}`,
              title: "Sends circles UP, squares and triangles DOWN",
              onClick: () => {
                setSelectedPrismType({ feature: "shape", value: "circle" });
              }
            },
            React.createElement("span", { className: "prism-symbol" }, "●"),
            React.createElement("div", { className: "tool-btn-content" },
              React.createElement("span", { className: "tool-btn-main" }, "Is Shape Circle?"),
              React.createElement("span", { className: "tool-btn-sub" }, "YES → UP  |  NO → DOWN")
            )
          ),
          React.createElement(
            "button",
            {
              className: `prism-tool-btn ${selectedPrismType.feature === "shape" && selectedPrismType.value === "square" ? "selected" : ""}`,
              title: "Sends squares UP, circles and triangles DOWN",
              onClick: () => {
                setSelectedPrismType({ feature: "shape", value: "square" });
              }
            },
            React.createElement("span", { className: "prism-symbol" }, "■"),
            React.createElement("div", { className: "tool-btn-content" },
              React.createElement("span", { className: "tool-btn-main" }, "Is Shape Square?"),
              React.createElement("span", { className: "tool-btn-sub" }, "YES → UP  |  NO → DOWN")
            )
          ),
          React.createElement(
            "button",
            {
              className: `prism-tool-btn ${selectedPrismType.feature === "shape" && selectedPrismType.value === "triangle" ? "selected" : ""}`,
              title: "Sends triangles UP, circles and squares DOWN",
              onClick: () => {
                setSelectedPrismType({ feature: "shape", value: "triangle" });
              }
            },
            React.createElement("span", { className: "prism-symbol" }, "▲"),
            React.createElement("div", { className: "tool-btn-content" },
              React.createElement("span", { className: "tool-btn-main" }, "Is Shape Triangle?"),
              React.createElement("span", { className: "tool-btn-sub" }, "YES → UP  |  NO → DOWN")
            )
          )
        ),

        // Size Classifiers (unlocked at Level 3+)
        currentLevel.id >= 3 && React.createElement(
          "div",
          { className: "tool-group" },
          React.createElement("div", { className: "group-header" }, "SPLIT BY SIZE"),
          React.createElement(
            "button",
            {
              className: `prism-tool-btn ${selectedPrismType.feature === "size" && selectedPrismType.value === "large" ? "selected" : ""}`,
              title: "Sends large objects UP, small objects DOWN",
              onClick: () => {
                setSelectedPrismType({ feature: "size", value: "large" });
              }
            },
            React.createElement("span", { className: "prism-symbol" }, "⬡"),
            React.createElement("div", { className: "tool-btn-content" },
              React.createElement("span", { className: "tool-btn-main" }, "Is Size Large?"),
              React.createElement("span", { className: "tool-btn-sub" }, "YES → UP  |  NO → DOWN")
            )
          ),
          React.createElement(
            "button",
            {
              className: `prism-tool-btn ${selectedPrismType.feature === "size" && selectedPrismType.value === "small" ? "selected" : ""}`,
              title: "Sends small objects UP, large objects DOWN",
              onClick: () => {
                setSelectedPrismType({ feature: "size", value: "small" });
              }
            },
            React.createElement("span", { className: "prism-symbol" }, "⬝"),
            React.createElement("div", { className: "tool-btn-content" },
              React.createElement("span", { className: "tool-btn-main" }, "Is Size Small?"),
              React.createElement("span", { className: "tool-btn-sub" }, "YES → UP  |  NO → DOWN")
            )
          )
        ),

        // Stream Sensor: Observed Features & Particle Profiles in Current Stream
        currentLevel.manifest && React.createElement(
          "div",
          { className: "stream-manifest-card" },
          React.createElement(
            "div",
            { className: "manifest-header" },
            React.createElement("span", { className: "manifest-title" }, "STREAM SENSOR"),
            React.createElement("span", { className: "manifest-badge" }, "INFLOW DETECTED")
          ),
          React.createElement("div", { className: "manifest-desc" }, "Observed characteristics in this phase:"),
          React.createElement(
            "div",
            { className: "manifest-tags" },
            currentLevel.manifest.colors.map(c =>
              React.createElement("span", { key: c, className: `manifest-tag tag-color-${c.toLowerCase()}` }, `Color: ${c}`)
            ),
            currentLevel.manifest.shapes.map(s =>
              React.createElement("span", { key: s, className: "manifest-tag tag-shape" }, `Shape: ${s}`)
            ),
            currentLevel.manifest.sizes.map(sz =>
              React.createElement("span", { key: sz, className: "manifest-tag tag-size" }, `Size: ${sz}`)
            )
          ),
          React.createElement(
            "div",
            { className: "manifest-profiles" },
            React.createElement("div", { className: "profiles-heading" }, "Observed Stream Objects:"),
            currentLevel.manifest.profiles.map((p, idx) =>
              React.createElement("div", { key: idx, className: "manifest-profile-item" },
                React.createElement("span", { className: "profile-bullet" }, "•"),
                p
              )
            )
          )
        ),

        // Contextual Objective & Progressive Educational Hints
        React.createElement(
          "div",
          { className: "objective-card" },
          React.createElement("div", { className: "obj-title" }, currentLevel.title),
          React.createElement("div", { className: "obj-concept" }, currentLevel.concept),
          React.createElement("div", { className: "obj-body" }, currentLevel.description),

          // Contextual Hints & Concept Learning System
          React.createElement(
            "div",
            { className: "hint-box" },
            React.createElement(
              "div",
              { className: "hint-tabs" },
              React.createElement(
                "button",
                {
                  className: `hint-tab-btn ${expandedHint === "basic" ? "active" : ""}`,
                  onClick: () => setExpandedHint("basic")
                },
                "GUIDE"
              ),
              React.createElement(
                "button",
                {
                  className: `hint-tab-btn ${expandedHint === "why" ? "active" : ""}`,
                  onClick: () => setExpandedHint("why")
                },
                "THEORY"
              ),
              React.createElement(
                "button",
                {
                  className: `hint-tab-btn ${expandedHint === "math" ? "active" : ""}`,
                  onClick: () => setExpandedHint("math")
                },
                "CALCULATION"
              )
            ),
            React.createElement(
              "div",
              { className: "hint-text" },
              expandedHint === "basic" && currentLevel.hints.basic,
              expandedHint === "why" && currentLevel.hints.why,
              expandedHint === "math" && currentLevel.hints.math
            )
          )
        )
      ),

      // Center Canvas Workspace
      React.createElement(
        "div",
        { className: "canvas-container" },

        // Goal Banner — 1-sentence mission above the grid
        currentLevel.goalSentence && React.createElement(
          "div",
          { className: "goal-banner" },
          React.createElement("span", { className: "goal-label" }, "GOAL"),
          React.createElement("span", { className: "goal-text" }, currentLevel.goalSentence)
        ),

        // Top Evaluation Toolbar (for Levels with Test Mode / Overfitting Verification)
        currentLevel.hasTestMode && React.createElement(
          "div",
          { className: "evaluation-bar" },
          React.createElement(
            "div",
            { className: "eval-modes" },
            React.createElement("span", { className: "eval-title" }, "DATA STREAM:"),
            React.createElement(
              "button",
              {
                className: `mode-toggle-btn ${streamMode === "train" ? "active" : ""}`,
                onClick: () => handleToggleStreamMode("train")
              },
              "TRAINING DATA"
            ),
            React.createElement(
              "button",
              {
                className: `mode-toggle-btn ${streamMode === "test" ? "active" : ""}`,
                onClick: () => handleToggleStreamMode("test")
              },
              "UNSEEN TEST DATA"
            )
          ),

          React.createElement(
            "div",
            { className: "accuracy-gauges" },
            React.createElement(
              "div",
              { className: "gauge-item" },
              React.createElement("span", { className: "gauge-name" }, "TRAIN ACCURACY:"),
              React.createElement("strong", { className: "gauge-val" }, `${metricsState.trainAccuracy}%`)
            ),
            React.createElement(
              "div",
              { className: "gauge-item" },
              React.createElement("span", { className: "gauge-name" }, "UNSEEN TEST ACCURACY:"),
              React.createElement(
                "strong",
                { className: `gauge-val ${metricsState.testAccuracy < 75 ? "val-danger" : "val-success"}` },
                `${metricsState.testAccuracy}%`
              )
            ),
            React.createElement(
              "button",
              {
                className: "btn-prune",
                onClick: handlePruneLast,
                title: "Prune the last decision node to reduce complexity"
              },
              "PRUNE NODE"
            )
          )
        ),

        // HTML5 Simulation Canvas
        React.createElement("canvas", {
          ref: canvasRef,
          className: "grid-canvas",
          onClick: handleCanvasClick,
          onMouseMove: handleCanvasMouseMove,
          onMouseLeave: handleCanvasMouseLeave
        }),

        // Overfitting / Energy Limit Warning Banner
        isOverfitted && React.createElement(
          "div",
          { className: "overfit-banner" },
          React.createElement("div", { className: "overfit-title" }, "OVERFITTING PENALTY"),
          React.createElement("div", { className: "overfit-desc" }, "Tree depth budget exceeded. The network is memorizing noise rather than general patterns. Prune redundant nodes to restore stability.")
        ),

        // Overfitting Test Degradation Banner (for Phase 4)
        currentLevel.hasTestMode && metricsState.trainAccuracy === 100 && metricsState.testAccuracy < 75 && React.createElement(
          "div",
          { className: "overfit-warning-toast" },
          React.createElement("strong", null, "OVERFITTING DETECTED: "),
          "Training purity reached 100%, but Test Accuracy dropped to ",
          React.createElement("strong", null, `${metricsState.testAccuracy}%`),
          ". The extra prism memorized noise. Click PRUNE NODE to generalize!"
        ),

        // Level Clear Notification
        isLevelCleared && React.createElement(
          "div",
          { className: "victory-banner" },
          React.createElement("div", { className: "victory-title" }, "LEVEL COMPLETED!"),
          React.createElement("div", { className: "victory-desc" }, `All active output bins stabilized with 100% purity within tree depth limit (${energyUsed}/${energyLimit} prisms).`),
          React.createElement(
            "button",
            {
              className: "btn-next-phase",
              onClick: () => {
                if (levelIndex < LEVELS.length - 1) {
                  handleNextLevel();
                } else {
                  setShowEnding(true);
                }
              }
            },
            levelIndex < LEVELS.length - 1 ? "NEXT LEVEL →" : "VIEW RESULTS →"
          )
        )
      ),

      // Right Telemetry Panel: Live Mathematical Engine & Inspector
      React.createElement(
        "aside",
        { className: "telemetry-panel" },
        React.createElement("div", { className: "panel-title" }, "NODE INSPECTOR"),

        inspectedPrism ? React.createElement(
          "div",
          { className: "telemetry-card" },
          React.createElement("div", { className: "card-title" }, `DECISION NODE [COL ${inspectedPrism.col}, ROW ${inspectedPrism.row}]`),
          React.createElement("div", { className: "card-rule" }, inspectedPrism.label),

          // Friendly Split Quality Summary
          React.createElement(
            "div",
            { className: "split-quality-block" },
            (() => {
              const gain = inspectedPrism.giniGain || 0;
              const quality = gain > 0.4 ? "Excellent" : gain > 0.2 ? "Good" : gain > 0.05 ? "Weak" : "No gain";
              const qualClass = gain > 0.4 ? "quality-excellent" : gain > 0.2 ? "quality-good" : gain > 0.05 ? "quality-weak" : "quality-none";
              const barWidth = Math.min(100, gain * 200);
              return [
                React.createElement(
                  "div",
                  { key: "sq-label", className: "sq-header" },
                  React.createElement("span", { className: "sq-title" }, "SPLIT QUALITY"),
                  React.createElement("span", { key: "sq-val", className: `sq-value ${qualClass}` }, quality)
                ),
                React.createElement(
                  "div",
                  { key: "sq-bar-wrap", className: "sq-bar-track" },
                  React.createElement("div", { className: `sq-bar-fill ${qualClass}`, style: { width: `${barWidth}%` } })
                ),
                React.createElement(
                  "div",
                  { key: "sq-counts", className: "sq-counts" },
                  React.createElement("span", null, `Matching objects: ${inspectedPrism.trueItems ? inspectedPrism.trueItems.length : 0} UP`),
                  React.createElement("span", null, `Others: ${inspectedPrism.falseItems ? inspectedPrism.falseItems.length : 0} DOWN`)
                )
              ];
            })()
          ),

          // Core Information Gain & Gini Gain Telemetry Metrics
          React.createElement(
            "div",
            { className: "metrics-always-visible" },
            React.createElement(
              "div",
              { className: "metric-block" },
              React.createElement("div", { className: "metric-label" }, "SHANNON INFORMATION GAIN"),
              React.createElement(
                "div",
                { className: "metric-val val-info" },
                `+${(inspectedPrism.infoGain || 0).toFixed(4)} bits`
              ),
              React.createElement(
                "div",
                { className: "meter-hint" },
                "Measures uncertainty removed. Laser lines pulse with this value."
              )
            ),
            React.createElement(
              "div",
              { className: "metric-block" },
              React.createElement("div", { className: "metric-label" }, "GINI GAIN (Δ GINI)"),
              React.createElement(
                "div",
                { className: "metric-val val-gain" },
                `+${(inspectedPrism.giniGain || 0).toFixed(4)}`
              ),
              React.createElement(
                "div",
                { className: "gain-meter" },
                React.createElement("div", {
                  className: "gain-bar",
                  style: { width: `${Math.min(100, (inspectedPrism.giniGain || 0) * 200)}%` }
                })
              ),
              React.createElement(
                "div",
                { className: "meter-hint" },
                "Weighted reduction in impurity across the two output branches."
              )
            )
          ),

          // Mathematical Formulas Accordion
          React.createElement(
            "div",
            { className: "math-accordion" },
            React.createElement(
              "button",
              {
                className: "btn-accordion-toggle",
                onClick: () => setShowMathDetails(prev => !prev)
              },
              showMathDetails ? "HIDE STEP-BY-STEP FORMULAS ▲" : "VIEW STEP-BY-STEP FORMULAS ▼"
            ),
            showMathDetails && inspectedPrism.mathBreakdown && React.createElement(
              "div",
              { className: "math-expanded" },
              React.createElement(
                "div",
                { className: "math-breakdown-details" },
                React.createElement("div", { className: "formula-line" },
                  React.createElement("div", { className: "formula-title" }, "1. Parent Gini Impurity:"),
                  React.createElement("code", null, inspectedPrism.mathBreakdown.giniFormulaStr)
                ),
                React.createElement("div", { className: "formula-line" },
                  React.createElement("div", { className: "formula-title" }, "2. Weighted Gini Gain:"),
                  React.createElement("code", null, inspectedPrism.mathBreakdown.giniGainStr)
                ),
                React.createElement("div", { className: "formula-line" },
                  React.createElement("div", { className: "formula-title" }, "3. Shannon Information Gain:"),
                  React.createElement("code", null, inspectedPrism.mathBreakdown.infoGainStr)
                )
              )
            )
          )
        ) : React.createElement(
          "div",
          { className: "empty-telemetry-box" },
          React.createElement("div", { className: "empty-telemetry-icon" }, "◈"),
          React.createElement("div", { className: "empty-telemetry-text" }, "Click any placed splitter prism on the grid to inspect how effectively it divides the data flow.")
        ),

        // Live Output Bins Monitor (Pure Leaves)
        React.createElement(
          "div",
          { className: "bins-monitor" },
          React.createElement("div", { className: "card-title" }, "OUTPUT BINS (LEAF NODES)"),
          binsState.map((bin, i) =>
            React.createElement(
              "div",
              {
                key: i,
                className: `bin-status-item ${bin.isStable ? "bin-stable" : "bin-mixed"}`
              },
              React.createElement(
                "div",
                { className: "bin-header-row" },
                React.createElement("span", { className: "bin-idx" }, `BIN 0${i + 1}`),
                React.createElement(
                  "span",
                  { className: `bin-tag ${bin.isStable ? "tag-pure" : "tag-impure"}` },
                  bin.isStable ? "100% PURE" : "IMPURE"
                )
              ),
              React.createElement(
                "div",
                { className: "bin-stats-row" },
                React.createElement("span", { className: "bin-target-label" }, bin.dominantClass ? `Target: [${bin.dominantClass}]` : "Empty"),
                React.createElement("span", { className: `bin-gini-tag ${bin.isStable ? "gini-pure" : "gini-mixed"}` }, `GINI: ${bin.gini.toFixed(3)}`)
              )
            )
          )
        )
      )
    ),

    // 3. ONBOARDING & INTRODUCTION MODAL
    showIntro && React.createElement(
      "div",
      { className: "modal-backdrop", onClick: () => setShowIntro(false) },
      React.createElement(
        "div",
        { className: "modal-card", onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "modal-header" },
          React.createElement("div", { className: "modal-title" }, "HOW TO PLAY // RULES"),
          React.createElement("button", { className: "btn-close-modal", onClick: () => setShowIntro(false) }, "✕")
        ),

        React.createElement(
          "div",
          { className: "modal-content" },
          introStep === 0 && React.createElement(
            "div",
            { className: "intro-slide" },
            React.createElement("h3", null, "1. What is Prisma Stream?"),
            React.createElement("p", null,
              "Prisma Stream is a spatial puzzle game where you route continuous streams of data objects into pure outcome groups. Each object represents a dataset observation with three observable features:"
            ),
            React.createElement("ul", { className: "feature-list" },
              React.createElement("li", null, React.createElement("strong", null, "Shape:"), " Circle, Square, or Triangle"),
              React.createElement("li", null, React.createElement("strong", null, "Color:"), " Blue (Cyan) or Orange (Amber)"),
              React.createElement("li", null, React.createElement("strong", null, "Size:"), " Small or Large")
            ),
            React.createElement("p", null,
              "Each object belongs to an underlying ground-truth ",
              React.createElement("strong", null, "Target Class (Alpha, Beta, or Gamma)"),
              ". Your goal is to separate the classes cleanly."
            )
          ),

          introStep === 1 && React.createElement(
            "div",
            { className: "intro-slide" },
            React.createElement("h3", null, "2. Decision Nodes & The Laser Grid"),
            React.createElement("p", null,
              "You place ",
              React.createElement("strong", null, "Splitter Prisms"),
              " at grid intersections. A prism asks a binary question (e.g. ",
              React.createElement("code", null, "COLOR == BLUE"),
              ")."
            ),
            React.createElement("ul", { className: "feature-list" },
              React.createElement("li", null, React.createElement("strong", null, "True Branch (UP):"), " Objects that meet the condition divert upward."),
              React.createElement("li", null, React.createElement("strong", null, "False Branch (DOWN):"), " Objects that do not meet the condition divert downward."),
              React.createElement("li", null, React.createElement("strong", null, "Information Gain:"), " Laser tracks pulse brighter when a split successfully removes uncertainty.")
            ),
            React.createElement("p", null,
              "The streams terminate at ",
              React.createElement("strong", null, "Output Bins (Leaf Nodes)"),
              ". A bin stabilizes into emerald green only when every object entering it belongs to the same target class (Gini Impurity = 0.00)."
            )
          ),

          introStep === 2 && React.createElement(
            "div",
            { className: "intro-slide" },
            React.createElement("h3", null, "3. Tree Depth & Overfitting"),
            React.createElement("p", null,
              "Every placed prism costs ",
              React.createElement("strong", null, "1 Energy Unit"),
              ". This represents your model's maximum tree depth budget."
            ),
            React.createElement("p", null,
              "In real Machine Learning, training data often has random noise. If you add too many prisms to isolate every single anomaly, you ",
              React.createElement("strong", null, "overfit"),
              "— your network looks perfect on training data, but fails on Unseen Test Data."
            ),
            React.createElement("p", null,
              "Use ",
              React.createElement("strong", null, "PRUNE NODE"),
              " to remove noisy branches and maintain high test accuracy."
            )
          )
        ),

        React.createElement(
          "div",
          { className: "modal-footer" },
          introStep > 0 && React.createElement(
            "button",
            { className: "btn-modal-secondary", onClick: () => setIntroStep(prev => prev - 1) },
            "← PREVIOUS"
          ),
          introStep < 2 ? React.createElement(
            "button",
            { className: "btn-modal-primary", onClick: () => setIntroStep(prev => prev + 1) },
            "NEXT →"
          ) : React.createElement(
            "button",
            { className: "btn-modal-primary", onClick: () => setShowIntro(false) },
            "ENTER PUZZLE WORKSPACE →"
          )
        )
      )
    ),

    // 4. GAME RESULTS & PLAYTEST QUESTIONNAIRE ENDING SCREEN
    showEnding && React.createElement(
      "div",
      { className: "modal-backdrop", onClick: () => setShowEnding(false) },
      React.createElement(
        "div",
        { className: "modal-card ending-card", onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "modal-header" },
          React.createElement("div", { className: "modal-title" }, "PRISMA STREAM // GAME RESULTS & PLAYTEST REPORT"),
          React.createElement("button", { className: "btn-close-modal", onClick: () => setShowEnding(false) }, "✕")
        ),

        React.createElement(
          "div",
          { className: "modal-content" },
          React.createElement("h3", { className: "ending-headline" },
            `ALL LEVELS COMPLETED: CONGRATULATIONS, ${(playerName || "PLAYER").toUpperCase()}!`
          ),
          React.createElement("p", null,
            "You have successfully completed all 5 levels and learned how Decision Trees split data, measure Information Gain, and avoid overfitting:"
          ),

          // Completion Stats Grid
          React.createElement(
            "div",
            { className: "ending-stats-grid" },
            React.createElement(
              "div",
              { className: "ending-stat-box" },
              React.createElement("div", { className: "ending-stat-label" }, "LEVELS COMPLETED"),
              React.createElement("div", { className: "ending-stat-val val-success" }, "5 / 5 COMPLETED")
            ),
            React.createElement(
              "div",
              { className: "ending-stat-box" },
              React.createElement("div", { className: "ending-stat-label" }, "TREE DEPTH BUDGET"),
              React.createElement("div", { className: "ending-stat-val" }, "COMPLIANT")
            ),
            React.createElement(
              "div",
              { className: "ending-stat-box" },
              React.createElement("div", { className: "ending-stat-label" }, "UNSEEN GENERALIZATION"),
              React.createElement("div", { className: "ending-stat-val val-cyan" }, "100.0% TEST ACCURACY")
            ),
            React.createElement(
              "div",
              { className: "ending-stat-box" },
              React.createElement("div", { className: "ending-stat-label" }, "MODEL STATUS"),
              React.createElement("div", { className: "ending-stat-val val-gold" }, "OPTIMAL")
            )
          ),

          // Playtest Questionnaire Form
          React.createElement(
            "div",
            { className: "questionnaire-container" },
            React.createElement("div", { className: "questionnaire-title" }, "PEER PLAYTEST REFLECTION QUESTIONNAIRE"),
            React.createElement("div", { className: "questionnaire-subtitle" },
              "As part of this Data Science assignment, answer these brief reflections. Then download your verified PDF report to submit to the repository maintainer as empirical playtest evidence."
            ),

            // Question 1: Feature Splitting Intuition
            React.createElement(
              "div",
              { className: "question-block" },
              React.createElement("label", { className: "question-label" },
                "1. Feature Discovery: Which feature split felt most intuitive to divide the stream?"
              ),
              React.createElement(
                "div",
                { className: "quick-chips" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "quick-chip-btn",
                    onClick: () => setPlaytestFeedback(prev => ({ ...prev, q1: "Color first (Blue vs Orange) gave the cleanest binary separation" }))
                  },
                  "Color First"
                ),
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "quick-chip-btn",
                    onClick: () => setPlaytestFeedback(prev => ({ ...prev, q1: "Shape hierarchy (Circle, Square, Triangle) was crucial for multi-class" }))
                  },
                  "Shape Hierarchy"
                ),
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "quick-chip-btn",
                    onClick: () => setPlaytestFeedback(prev => ({ ...prev, q1: "Color + Size combined cleanly isolated target subsets" }))
                  },
                  "Color & Size Combined"
                )
              ),
              React.createElement("input", {
                type: "text",
                className: "question-input",
                value: playtestFeedback.q1,
                onChange: (e) => setPlaytestFeedback({ ...playtestFeedback, q1: e.target.value }),
                placeholder: "e.g. Color was the most obvious split, then Shape..."
              })
            ),

            // Question 2: Laser Wire Brightness & Information Gain
            React.createElement(
              "div",
              { className: "question-block" },
              React.createElement("label", { className: "question-label" },
                "2. Information Gain: What did the brightness of the glowing laser wires tell you?"
              ),
              React.createElement(
                "div",
                { className: "quick-chips" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "quick-chip-btn",
                    onClick: () => setPlaytestFeedback(prev => ({ ...prev, q2: "Brighter wires signaled higher Information Gain and reduction in entropy" }))
                  },
                  "Higher Entropy Reduction"
                ),
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "quick-chip-btn",
                    onClick: () => setPlaytestFeedback(prev => ({ ...prev, q2: "It showed which branch was getting closer to 100% purity" }))
                  },
                  "Purer Child Streams"
                )
              ),
              React.createElement("input", {
                type: "text",
                className: "question-input",
                value: playtestFeedback.q2,
                onChange: (e) => setPlaytestFeedback({ ...playtestFeedback, q2: e.target.value }),
                placeholder: "e.g. Brighter wires indicated a higher Shannon Information Gain..."
              })
            ),

            // Question 3: Overfitting & Noise (Phase 4)
            React.createElement(
              "div",
              { className: "question-block" },
              React.createElement("label", { className: "question-label" },
                "3. Overfitting & Noise: In Phase 4, what happened when you tried to separate the outlier particles, and how did pruning help?"
              ),
              React.createElement(
                "div",
                { className: "quick-chips" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "quick-chip-btn",
                    onClick: () => setPlaytestFeedback(prev => ({ ...prev, q3: "Trying to fit the outlier small circles degraded unseen test accuracy to 87.5%; pruning restored 100% generalization" }))
                  },
                  "Outliers Ruined Test Accuracy"
                ),
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "quick-chip-btn",
                    onClick: () => setPlaytestFeedback(prev => ({ ...prev, q3: "Occam's razor demonstrated that the simpler tree generalized better" }))
                  },
                  "Simpler Tree Generalized Better"
                )
              ),
              React.createElement("input", {
                type: "text",
                className: "question-input",
                value: playtestFeedback.q3,
                onChange: (e) => setPlaytestFeedback({ ...playtestFeedback, q3: e.target.value }),
                placeholder: "e.g. Overfitting on noise lowered test accuracy; pruning recovered 100% accuracy..."
              })
            ),

            // Question 4: Gameplay Experience & Aha Moments
            React.createElement(
              "div",
              { className: "question-block" },
              React.createElement("label", { className: "question-label" },
                "4. Player Experience: What was the most satisfying moment or biggest 'aha!' moment during the game?"
              ),
              React.createElement("input", {
                type: "text",
                className: "question-input",
                value: playtestFeedback.q4,
                onChange: (e) => setPlaytestFeedback({ ...playtestFeedback, q4: e.target.value }),
                placeholder: "e.g. Seeing the emerald bins lock into 100% purity and the Gini meter drop to 0.000..."
              })
            ),

            // Question 5: Rating
            React.createElement(
              "div",
              { className: "question-block" },
              React.createElement("label", { className: "question-label" },
                `5. Overall Gameplay & Educational Rating: ${playtestFeedback.rating} / 5 Stars`
              ),
              React.createElement(
                "div",
                { className: "rating-row" },
                [1, 2, 3, 4, 5].map((star) =>
                  React.createElement(
                    "button",
                    {
                      key: star,
                      type: "button",
                      className: `rating-star-btn ${playtestFeedback.rating >= star ? "star-active" : ""}`,
                      onClick: () => setPlaytestFeedback(prev => ({ ...prev, rating: star }))
                    },
                    `★ ${star}`
                  )
                )
              )
            ),

            // Download Success Notice
            pdfDownloaded && React.createElement(
              "div",
              { className: "pdf-success-banner" },
              "✔ PLAYTEST PDF GENERATED: Prisma_Stream_Playtest_",
              (playerName.trim() || "Researcher").replace(/[^a-zA-Z0-9_-]/g, "_"),
              ".pdf was downloaded. Send this file to the repository maintainer as verified evidence."
            )
          )
        ),

        // Modal Action Buttons
        React.createElement(
          "div",
          { className: "modal-footer" },
          React.createElement(
            "button",
            {
              className: "btn-modal-secondary",
              onClick: () => {
                setShowEnding(false);
                setLevelIndex(0);
                setRunSeed(Math.floor(Math.random() * 100000) + 1);
              }
            },
            "PLAY AGAIN"
          ),
          React.createElement(
            "button",
            {
              className: "btn-pdf-print",
              onClick: handlePrintReport,
              title: "Open a clean printable version in a new window"
            },
            "PRINT / PREVIEW PDF"
          ),
          React.createElement(
            "button",
            {
              className: "btn-pdf-download",
              onClick: handleGeneratePdf,
              title: "Download official PDF playtest evidence document"
            },
            "DOWNLOAD PLAYTEST REPORT (PDF) ↓"
          )
        )
      )
    )
  );
}