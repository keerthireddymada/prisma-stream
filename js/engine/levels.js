/**
 * PRISMA STREAM — Level Specifications & Pedagogical Progression
 * Each level introduces a specific concept in supervised decision trees:
 * Features vs Labels, Recursive Branching, Impurity Gain (Gini vs Entropy),
 * Overfitting on Noise vs Unseen Test Data, and Model Pruning.
 */

export const LEVELS = [
  {
    id: 1,
    title: "Phase 1: The Primal Split",
    concept: "Features, Target Classes & Binary Partitioning",
    subtitle: "Separating observations into pure outcome groups",
    description: "A continuous flow of data objects is entering the system. Each object has observable features (Color, Shape, Size) and a hidden Target Class (Alpha or Beta). Place a Splitter Prism to route each target class into its own pure Output Bin.",
    energyLimit: 1, // Max 1 Prism (Depth 1)
    gridCols: 5,
    gridRows: 5,
    spawnInterval: 1100, // Relaxed, observable pacing
    manifest: {
      shapes: ["Circle"],
      colors: ["Blue", "Orange"],
      sizes: ["Large"],
      profiles: ["Blue Circle (Large)", "Orange Circle (Large)"]
    },
    streamDistribution: {
      shapes: { circle: 1.0, square: 0.0, triangle: 0.0 },
      colors: { blue: 0.5, orange: 0.5 },
      sizes: { small: 0.0, large: 1.0 },
      targetRule: (f) => f.color === "blue" ? "Alpha" : "Beta"
    },
    targetClasses: ["Alpha", "Beta"],
    requiredPureBins: 2,
    hints: {
      basic: "A prism asks a yes-or-no question about an object's feature. Objects that meet the condition take the UP track; others take the DOWN track.",
      why: "In Machine Learning, a decision node splits data based on an input feature to isolate the target classes (Alpha vs Beta).",
      math: "Initial Gini impurity is 0.500 (equal 50/50 mixture). A split on COLOR separates them into two 100% pure groups (Gini = 0.000), giving maximum Gini Gain of +0.500."
    }
  },
  {
    id: 2,
    title: "Phase 2: Morphology",
    concept: "Recursive Branching & Tree Hierarchy",
    subtitle: "Multi-class classification using hierarchical decision nodes",
    description: "Three distinct target classes (Alpha, Beta, Gamma) now enter the system. A single binary prism can only divide a stream into two. Construct a two-level Decision Tree to isolate all three classes.",
    energyLimit: 2, // Max 2 Prisms (Depth 2)
    gridCols: 6,
    gridRows: 5,
    spawnInterval: 1080,
    manifest: {
      shapes: ["Circle", "Square", "Triangle"],
      colors: ["Blue", "Orange"],
      sizes: ["Large"],
      profiles: ["Blue Circle (Large)", "Blue Square (Large)", "Orange Triangle (Large)"]
    },
    streamDistribution: {
      conditional: (rng) => {
        const r = rng();
        if (r < 0.35) {
          // Class Alpha: Blue Circle
          return { shape: "circle", color: "blue", size: "large", targetClass: "Alpha" };
        } else if (r < 0.70) {
          // Class Beta: Blue Square
          return { shape: "square", color: "blue", size: "large", targetClass: "Beta" };
        } else {
          // Class Gamma: Orange Triangle
          return { shape: "triangle", color: "orange", size: "large", targetClass: "Gamma" };
        }
      }
    },
    targetClasses: ["Alpha", "Beta", "Gamma"],
    requiredPureBins: 3,
    hints: {
      basic: "No single yes/no question can separate three classes at once. First isolate the distinct color, then place a second prism along the mixed branch to split by shape.",
      why: "This creates a Decision Tree: the first prism is the Root Node; its child branch feeds into an internal Decision Node, terminating in Pure Leaves.",
      math: "The root split on COLOR isolates Orange (Gamma) with zero impurity. The remaining Blue branch still has Gini = 0.500; a second split on SHAPE reduces its impurity to 0.000."
    }
  },
  {
    id: 3,
    title: "Phase 3: The Entropy Trap",
    concept: "Gini Gain vs Shannon Information Gain",
    subtitle: "Evaluating split quality and rejecting uninformative features",
    description: "Multiple features exist, but not all questions are equally informative. An uninformative feature leaves the child streams mixed, producing zero Gain and wasting energy. Find the optimal split.",
    energyLimit: 2,
    gridCols: 6,
    gridRows: 5,
    spawnInterval: 1050,
    manifest: {
      shapes: ["Circle", "Square"],
      colors: ["Blue", "Orange"],
      sizes: ["Small", "Large"],
      profiles: [
        "Blue Circle (Small / Large)",
        "Blue Square (Small / Large)",
        "Orange Circle (Small / Large)",
        "Orange Square (Small / Large)"
      ]
    },
    streamDistribution: {
      conditional: (rng) => {
        const isAlpha = rng() > 0.5;
        const targetClass = isAlpha ? "Alpha" : "Beta";
        // Color is the true informative signal
        const color = isAlpha ? "blue" : "orange";
        // Shape is weakly correlated
        const shape = isAlpha ? (rng() > 0.3 ? "circle" : "square") : (rng() > 0.3 ? "square" : "circle");
        // Size is pure noise: 50% large, 50% small for both Alpha and Beta!
        const size = rng() > 0.5 ? "large" : "small";
        return { shape, color, size, targetClass };
      }
    },
    targetClasses: ["Alpha", "Beta"],
    requiredPureBins: 2,
    hints: {
      basic: "Test different prisms and look at the connecting wire brightness and telemetry inspector. Informative splits glow brilliant neon; uninformative splits remain dim.",
      why: "Decision tree algorithms greedily pick the feature that maximizes Information Gain at each node. Splitting on random noise (Size) does not reduce uncertainty.",
      math: "Shannon Entropy measures total disorder in bits. Splitting on COLOR drops entropy from 1.000 bit to 0.000 bits (Information Gain = +1.000). Splitting on SIZE leaves both branches with entropy 1.000 (Information Gain = 0.000)."
    }
  },
  {
    id: 4,
    title: "Phase 4: The Generalization Crisis",
    concept: "Overfitting on Noise vs Unseen Test Data",
    subtitle: "The bias-variance tradeoff and the power of model pruning",
    description: "Training data often contains random noise or outliers. If you place extra prisms to fit every training anomaly, you achieve 100% Training Purity but fail on Unseen Test Data. Discover how pruning restores generalization.",
    energyLimit: 3,
    gridCols: 7,
    gridRows: 5,
    spawnInterval: 1050,
    hasTestMode: true, // Enables Train vs Test data evaluation!
    manifest: {
      shapes: ["Circle", "Square"],
      colors: ["Blue", "Orange"],
      sizes: ["Small", "Large"],
      profiles: [
        "Blue Circle (Large)",
        "Blue Circle (Small)",
        "Orange Square (Large)",
        "Orange Square (Small)"
      ]
    },
    streamDistribution: {
      conditional: (rng, mode) => {
        // Ground truth: Circle -> Alpha, Square -> Beta
        const isCircle = rng() < 0.5;
        const shape = isCircle ? "circle" : "square";
        const color = isCircle ? "blue" : "orange";
        // 35% of objects are small, 65% are large
        const size = rng() < 0.35 ? "small" : "large";

        let targetClass;
        if (mode === "train") {
          // Training spurious correlation (The Overfitting Trap):
          // In this training sample, all small circles happen to be labeled Beta!
          if (shape === "circle" && size === "small") {
            targetClass = "Beta"; // Spurious training anomaly!
          } else {
            targetClass = isCircle ? "Alpha" : "Beta";
          }
        } else {
          // Unseen test set: true underlying ground truth (All Circles are Alpha!)
          targetClass = isCircle ? "Alpha" : "Beta";
        }

        return { shape, color, size, targetClass };
      }
    },
    targetClasses: ["Alpha", "Beta"],
    requiredPureBins: 2,
    hints: {
      basic: "Notice in the training stream: all Alpha circles are LARGE, while the outlier Beta circles are SMALL. You can isolate them by splitting on SIZE, but watch what happens on Unseen Test Data!",
      why: "Overfitting occurs when a tree memorizes an accidental correlation in the training sample (Size). In the real world, circles are always Alpha, so the extra rule causes errors on new data.",
      math: "A simple tree achieves 82.5% Train and 100% Test accuracy. An overfitted tree reaches 100% Train accuracy but drops to 80% Test accuracy! Pruning the SIZE node restores 100% generalization."
    }
  },
  {
    id: 5,
    title: "Phase 5: Prisma Master",
    concept: "Full Multidimensional Induction",
    subtitle: "Building a decision tree that separates all classes and generalizes to test data",
    description: "A complex multi-feature distribution requiring coordinated hierarchical decisions across Color, Shape, and Size. Build an elegant, compact tree that generalizes reliably across both training and test streams.",
    energyLimit: 4,
    gridCols: 7,
    gridRows: 5,
    spawnInterval: 1020,
    hasTestMode: true,
    manifest: {
      shapes: ["Circle", "Square", "Triangle"],
      colors: ["Blue", "Orange"],
      sizes: ["Small", "Large"],
      profiles: [
        "Blue Circle (Small / Large)",
        "Blue Square (Small / Large)",
        "Orange Triangle (Small / Large)",
        "Orange Square (Small / Large)"
      ]
    },
    streamDistribution: {
      conditional: (rng, mode) => {
        const r = rng();
        if (r < 0.40) {
          // Class Alpha: Blue Circle
          const size = rng() < 0.5 ? "small" : "large";
          return { shape: "circle", color: "blue", size, targetClass: "Alpha" };
        } else if (r < 0.75) {
          // Class Beta: Blue Square
          const size = rng() < 0.5 ? "small" : "large";
          return { shape: "square", color: "blue", size, targetClass: "Beta" };
        } else {
          // Class Gamma: Orange Triangle or Orange Square
          const shape = rng() < 0.6 ? "triangle" : "square";
          const size = rng() < 0.5 ? "small" : "large";
          return { shape, color: "orange", size, targetClass: "Gamma" };
        }
      }
    },
    targetClasses: ["Alpha", "Beta", "Gamma"],
    requiredPureBins: 3,
    hints: {
      basic: "Start with the highest-gain root question (Color). Then recursively partition each resulting branch.",
      why: "Complete decision trees inductively partition multi-dimensional feature space into rectangular decision regions.",
      math: "Every prism placed costs 1 Energy (tree depth budget). Keep the model compact to prevent overfitting and guarantee high test set accuracy."
    }
  }
];
