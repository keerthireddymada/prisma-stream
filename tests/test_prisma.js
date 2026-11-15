/**
 * PRISMA STREAM — Comprehensive Mathematical & Data Science Verification Suite
 * Verifies Gini impurity, Gini Gain, Shannon Entropy, Information Gain,
 * Train vs Test data separation, Overfitting on noise, and Pruning recovery.
 */

import {
  calculateGini,
  calculateGiniGain,
  calculateEntropy,
  calculateInformationGain,
  calculatePurity,
  calculateWireBrightness,
  getMathematicalBreakdown
} from "../js/engine/gini.js";

import { StreamGenerator } from "../js/engine/stream.js";
import { LEVELS } from "../js/engine/levels.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function assertClose(actual, expected, tolerance = 0.001, message = "") {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    console.error(`FAIL: ${message} (Expected ~${expected}, got ${actual}, diff ${diff})`);
    process.exit(1);
  }
}

console.log("=== Running PRISMA STREAM Data Science Verification Suite ===\n");

// 1. GINI IMPURITY VERIFICATION
console.log("1. Verifying Gini Impurity calculations...");
// Pure leaf: only Alpha
const pureAlpha = Array.from({ length: 20 }, () => ({ targetClass: "Alpha" }));
assert(calculateGini(pureAlpha) === 0.0, "Pure set must have Gini = 0.000");

// 50/50 mixture of 2 classes: Gini = 1 - (0.5^2 + 0.5^2) = 0.500
const mixedBinary = [
  ...Array.from({ length: 15 }, () => ({ targetClass: "Alpha" })),
  ...Array.from({ length: 15 }, () => ({ targetClass: "Beta" }))
];
assertClose(calculateGini(mixedBinary), 0.500, 0.001, "50/50 binary mixture must have Gini = 0.500");

// 3-class equal mixture: Gini = 1 - 3 * (1/3)^2 = 1 - 3/9 = 2/3 ≈ 0.6667
const mixedTernary = [
  ...Array.from({ length: 10 }, () => ({ targetClass: "Alpha" })),
  ...Array.from({ length: 10 }, () => ({ targetClass: "Beta" })),
  ...Array.from({ length: 10 }, () => ({ targetClass: "Gamma" }))
];
assertClose(calculateGini(mixedTernary), 0.6667, 0.001, "1/3 ternary mixture must have Gini ≈ 0.6667");
console.log("✔ Gini Impurity verified.");

// 2. SHANNON ENTROPY VERIFICATION
console.log("2. Verifying Shannon Entropy calculations...");
// Pure set: H = 0.0 bits
assert(calculateEntropy(pureAlpha) === 0.0, "Pure set must have Entropy = 0.000 bits");

// 50/50 mixture: H = - (0.5 * log2(0.5) + 0.5 * log2(0.5)) = 1.000 bit
assertClose(calculateEntropy(mixedBinary), 1.000, 0.001, "50/50 binary mixture must have Entropy = 1.000 bit");

// 3-class equal mixture: H = log2(3) ≈ 1.5850 bits
assertClose(calculateEntropy(mixedTernary), 1.5850, 0.001, "1/3 ternary mixture must have Entropy ≈ 1.585 bits");
console.log("✔ Shannon Entropy verified.");

// 3. GINI GAIN VS SHANNON INFORMATION GAIN (WEIGHTED CHILD FORMULAS)
console.log("3. Verifying Gini Gain and Shannon Information Gain...");
const parentStream = [
  ...Array.from({ length: 20 }, () => ({ targetClass: "Alpha" })),
  ...Array.from({ length: 20 }, () => ({ targetClass: "Beta" }))
];
// Perfect split: Left is pure Alpha (20), Right is pure Beta (20)
const leftPure = Array.from({ length: 20 }, () => ({ targetClass: "Alpha" }));
const rightPure = Array.from({ length: 20 }, () => ({ targetClass: "Beta" }));

const perfectGiniGain = calculateGiniGain(parentStream, leftPure, rightPure);
assertClose(perfectGiniGain, 0.500, 0.001, "Perfect split Gini Gain must be 0.500");

const perfectInfoGain = calculateInformationGain(parentStream, leftPure, rightPure);
assertClose(perfectInfoGain, 1.000, 0.001, "Perfect split Information Gain must be 1.000 bit");

// Uninformative split: Left (10 Alpha, 10 Beta), Right (10 Alpha, 10 Beta)
const leftMixed = [
  ...Array.from({ length: 10 }, () => ({ targetClass: "Alpha" })),
  ...Array.from({ length: 10 }, () => ({ targetClass: "Beta" }))
];
const rightMixed = [
  ...Array.from({ length: 10 }, () => ({ targetClass: "Alpha" })),
  ...Array.from({ length: 10 }, () => ({ targetClass: "Beta" }))
];
const zeroGiniGain = calculateGiniGain(parentStream, leftMixed, rightMixed);
assertClose(zeroGiniGain, 0.000, 0.001, "Uninformative split Gini Gain must be 0.000");

const zeroInfoGain = calculateInformationGain(parentStream, leftMixed, rightMixed);
assertClose(zeroInfoGain, 0.000, 0.001, "Uninformative split Information Gain must be 0.000 bits");

// Uneven split weighting check: Left has 30 items (pure), Right has 10 items (mixed)
const left30 = Array.from({ length: 30 }, () => ({ targetClass: "Alpha" }));
const right10 = [
  ...Array.from({ length: 5 }, () => ({ targetClass: "Alpha" })),
  ...Array.from({ length: 5 }, () => ({ targetClass: "Beta" }))
];
const parent40 = [...left30, ...right10];
const parentGini40 = calculateGini(parent40);
const expectedWeightedChildGini = (30 / 40) * calculateGini(left30) + (10 / 40) * calculateGini(right10);
const actualWeightedGain = calculateGiniGain(parent40, left30, right10);
assertClose(actualWeightedGain, parentGini40 - expectedWeightedChildGini, 0.001, "Gini Gain must strictly weight child impurities by branch size");
console.log("✔ Gini Gain & Shannon Information Gain verified.");

// 4. MATHEMATICAL DERIVATION BREAKDOWN ENGINE
console.log("4. Verifying step-by-step breakdown derivation object...");
const breakdown = getMathematicalBreakdown(parent40, left30, right10);
assert(breakdown.total === 40, "Total count must be 40");
assert(breakdown.leftCount === 30, "Left count must be 30");
assert(breakdown.rightCount === 10, "Right count must be 10");
assert(typeof breakdown.giniFormulaStr === "string" && breakdown.giniFormulaStr.length > 5, "Gini formula string must be present");
assert(typeof breakdown.giniGainStr === "string" && breakdown.giniGainStr.length > 5, "Gini Gain formula string must be present");
assert(typeof breakdown.infoGainStr === "string" && breakdown.infoGainStr.length > 5, "Info Gain formula string must be present");
console.log("✔ Step-by-step mathematical breakdown verified.");

// 5. OVERFITTING & PRUNING VERIFICATION ON UNSEEN TEST DATA
console.log("5. Verifying Overfitting & Pruning behavior on Phase 4 data...");
const phase4 = LEVELS.find(l => l.id === 4);
assert(phase4 && phase4.hasTestMode, "Phase 4 must have test mode enabled");

const generator = new StreamGenerator({
  seed: 42,
  ...phase4.streamDistribution
});

// Generate Training Batch
const trainBatch = generator.generateBatch(50, "train");
// Generate Unseen Test Batch
const testBatch = generator.generateBatch(80, "test");

assert(trainBatch.length === 50, "Train batch generated");
assert(testBatch.length === 80, "Test batch generated");

// Model A: Simple Tree (Root split: SHAPE == CIRCLE)
// Circle -> Alpha; Square -> Beta
function predictSimple(p) {
  return p.shape === "circle" ? "Alpha" : "Beta";
}

let simpleTrainCorrect = 0;
trainBatch.forEach(p => { if (predictSimple(p) === p.targetClass) simpleTrainCorrect++; });
const simpleTrainAcc = (simpleTrainCorrect / trainBatch.length) * 100;

let simpleTestCorrect = 0;
testBatch.forEach(p => { if (predictSimple(p) === p.targetClass) simpleTestCorrect++; });
const simpleTestAcc = (simpleTestCorrect / testBatch.length) * 100;

// Model B: Overfitted Tree (Adds noisy condition: if Circle and Size == Small -> Beta)
function predictOverfitted(p) {
  if (p.shape === "circle") {
    // Overfitted rule memorizing training noise
    if (p.size === "small") return "Beta";
    return "Alpha";
  }
  return "Beta";
}

let overfitTrainCorrect = 0;
trainBatch.forEach(p => { if (predictOverfitted(p) === p.targetClass) overfitTrainCorrect++; });
const overfitTrainAcc = (overfitTrainCorrect / trainBatch.length) * 100;

let overfitTestCorrect = 0;
testBatch.forEach(p => { if (predictOverfitted(p) === p.targetClass) overfitTestCorrect++; });
const overfitTestAcc = (overfitTestCorrect / testBatch.length) * 100;

console.log(`   Simple Tree     - Train Acc: ${simpleTrainAcc.toFixed(1)}%, Test Acc: ${simpleTestAcc.toFixed(1)}%`);
console.log(`   Overfitted Tree - Train Acc: ${overfitTrainAcc.toFixed(1)}%, Test Acc: ${overfitTestAcc.toFixed(1)}%`);

assert(overfitTrainAcc >= simpleTrainAcc, "Overfitted tree must achieve equal or higher Training accuracy");
assert(simpleTestAcc > overfitTestAcc, "Simple tree must achieve higher Test accuracy on unseen data than overfitted tree (Generalization proof)");
console.log("✔ Overfitting on noise & Generalization advantage of pruned tree verified.");

// 6. LEVEL DESIGN & GAMEPLAY CONSTRAINTS
console.log("6. Verifying all 5 Game Levels...");
LEVELS.forEach(lvl => {
  assert(lvl.id >= 1 && lvl.id <= 5, `Level id ${lvl.id} valid`);
  assert(lvl.title && lvl.concept && lvl.description, `Level ${lvl.id} has title, concept, and description`);
  assert(lvl.energyLimit >= 1 && lvl.energyLimit <= 5, `Level ${lvl.id} energy limit valid`);
  assert(lvl.hints && lvl.hints.basic && lvl.hints.why && lvl.hints.math, `Level ${lvl.id} has full contextual hints`);
  assert(lvl.targetClasses && lvl.targetClasses.length >= 2, `Level ${lvl.id} has explicit target classes`);
});
console.log("✔ All 5 Game Levels verified.");

console.log("\n=======================================================");
console.log("ALL PRISMA STREAM DATA SCIENCE SUITE TESTS PASSED 100%!");
console.log("=======================================================");
