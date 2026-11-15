/**
 * PRISMA STREAM — Mathematical Gini & Entropy Calculation Engine
 * Computes exact statistical impurity metrics for incoming particle streams.
 * Distinguishes rigorously between Gini Gain (impurity reduction)
 * and Information Gain (Shannon entropy reduction).
 */

/**
 * Calculates Gini Impurity for an array of items.
 * Gini(S) = 1 - sum(p_i^2)
 *
 * @param {Array<Object>} items - Array of data objects
 * @param {string|Function} [targetProp="targetClass"] - Property to measure purity on
 * @returns {number} Gini Impurity in [0.0, 1 - 1/K]
 */
export function calculateGini(items, targetProp = "targetClass") {
  if (!items || items.length === 0) return 0.0;

  const total = items.length;
  const counts = getClassCounts(items, targetProp);

  let sumSquares = 0.0;
  for (const count of counts.values()) {
    const p = count / total;
    sumSquares += p * p;
  }

  return Number(Math.max(0.0, 1.0 - sumSquares).toFixed(4));
}

/**
 * Calculates Gini Gain achieved by a binary split.
 * Delta Gini(S, A) = Gini(S) - [ (|Left| / |S|) * Gini(Left) + (|Right| / |S|) * Gini(Right) ]
 *
 * @param {Array<Object>} parentItems
 * @param {Array<Object>} leftItems
 * @param {Array<Object>} rightItems
 * @param {string|Function} [targetProp="targetClass"]
 * @returns {number} Gini Gain (reduction in Gini impurity)
 */
export function calculateGiniGain(parentItems, leftItems, rightItems, targetProp = "targetClass") {
  if (!parentItems || parentItems.length === 0) return 0.0;

  const total = parentItems.length;
  const leftCount = leftItems ? leftItems.length : 0;
  const rightCount = rightItems ? rightItems.length : 0;

  if (leftCount === 0 || rightCount === 0) return 0.0;

  const parentGini = calculateGini(parentItems, targetProp);
  const leftGini = calculateGini(leftItems, targetProp);
  const rightGini = calculateGini(rightItems, targetProp);

  const weightedChildGini = (leftCount / total) * leftGini + (rightCount / total) * rightGini;
  const gain = parentGini - weightedChildGini;

  return Number(Math.max(0.0, gain).toFixed(4));
}

/**
 * Calculates Shannon Entropy in bits.
 * H(S) = - sum(p_i * log2(p_i))
 *
 * @param {Array<Object>} items
 * @param {string|Function} [targetProp="targetClass"]
 * @returns {number} Entropy in bits
 */
export function calculateEntropy(items, targetProp = "targetClass") {
  if (!items || items.length === 0) return 0.0;

  const total = items.length;
  const counts = getClassCounts(items, targetProp);

  let entropy = 0.0;
  for (const count of counts.values()) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return Number(Math.max(0.0, entropy).toFixed(4));
}

/**
 * Calculates Information Gain (based on Shannon Entropy).
 * IG(S, A) = H(S) - [ (|Left| / |S|) * H(Left) + (|Right| / |S|) * H(Right) ]
 *
 * @param {Array<Object>} parentItems
 * @param {Array<Object>} leftItems
 * @param {Array<Object>} rightItems
 * @param {string|Function} [targetProp="targetClass"]
 * @returns {number} Information Gain in bits
 */
export function calculateInformationGain(parentItems, leftItems, rightItems, targetProp = "targetClass") {
  if (!parentItems || parentItems.length === 0) return 0.0;

  const total = parentItems.length;
  const leftCount = leftItems ? leftItems.length : 0;
  const rightCount = rightItems ? rightItems.length : 0;

  if (leftCount === 0 || rightCount === 0) return 0.0;

  const parentH = calculateEntropy(parentItems, targetProp);
  const leftH = calculateEntropy(leftItems, targetProp);
  const rightH = calculateEntropy(rightItems, targetProp);

  const weightedChildH = (leftCount / total) * leftH + (rightCount / total) * rightH;
  const gain = parentH - weightedChildH;

  return Number(Math.max(0.0, gain).toFixed(4));
}

/**
 * Computes Purity percentage: (Dominant Class Count / Total) * 100%
 */
export function calculatePurity(items, targetProp = "targetClass") {
  if (!items || items.length === 0) return 100.0;

  const total = items.length;
  const counts = getClassCounts(items, targetProp);

  let maxCount = 0;
  for (const count of counts.values()) {
    if (count > maxCount) maxCount = count;
  }

  return Number(((maxCount / total) * 100.0).toFixed(1));
}

/**
 * Computes glowing wire brightness factor (from 0.25 to 1.0)
 * based on Gini Gain relative to parent Gini impurity.
 */
export function calculateWireBrightness(giniGain, parentGini) {
  if (parentGini <= 0.0001) return 0.25;
  const ratio = Math.min(1.0, giniGain / parentGini);
  return Number((0.25 + 0.75 * ratio).toFixed(2));
}

/**
 * Extracts class counts map for items.
 */
export function getClassCounts(items, targetProp = "targetClass") {
  const counts = new Map();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let key;
    if (typeof targetProp === "function") {
      key = targetProp(item);
    } else if (typeof targetProp === "string" && targetProp) {
      key = item[targetProp] !== undefined ? item[targetProp] : item.targetClass;
    } else {
      key = item.targetClass || `${item.shape}_${item.color}`;
    }
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/**
 * Generates an exhaustive mathematical derivation object for live UI inspection.
 * Uses real item counts and percentages currently flowing through a node.
 */
export function getMathematicalBreakdown(parentItems, leftItems, rightItems, targetProp = "targetClass") {
  const total = parentItems.length;
  const leftCount = leftItems ? leftItems.length : 0;
  const rightCount = rightItems ? rightItems.length : 0;

  const parentCounts = getClassCounts(parentItems, targetProp);
  const leftCounts = getClassCounts(leftItems || [], targetProp);
  const rightCounts = getClassCounts(rightItems || [], targetProp);

  const parentGini = calculateGini(parentItems, targetProp);
  const leftGini = calculateGini(leftItems, targetProp);
  const rightGini = calculateGini(rightItems, targetProp);
  const giniGain = calculateGiniGain(parentItems, leftItems, rightItems, targetProp);

  const parentEntropy = calculateEntropy(parentItems, targetProp);
  const leftEntropy = calculateEntropy(leftItems, targetProp);
  const rightEntropy = calculateEntropy(rightItems, targetProp);
  const infoGain = calculateInformationGain(parentItems, leftItems, rightItems, targetProp);

  // Format probability strings for Gini
  const parentGiniTerms = [];
  for (const [cls, cnt] of parentCounts.entries()) {
    const p = (cnt / total).toFixed(2);
    parentGiniTerms.push(`(${cnt}/${total})^2`);
  }
  const giniFormulaStr = `1 - [ ${parentGiniTerms.join(" + ")} ] = ${parentGini.toFixed(4)}`;

  // Format weighted Gini Gain string
  const giniGainStr = total > 0 && leftCount > 0 && rightCount > 0
    ? `${parentGini.toFixed(4)} - [ (${leftCount}/${total}) × ${leftGini.toFixed(4)} + (${rightCount}/${total}) × ${rightGini.toFixed(4)} ] = ${giniGain.toFixed(4)}`
    : `0.0000 (No split)`;

  // Format Information Gain string
  const infoGainStr = total > 0 && leftCount > 0 && rightCount > 0
    ? `${parentEntropy.toFixed(4)} - [ (${leftCount}/${total}) × ${leftEntropy.toFixed(4)} + (${rightCount}/${total}) × ${rightEntropy.toFixed(4)} ] = ${infoGain.toFixed(4)} bits`
    : `0.0000 bits (No split)`;

  return {
    total,
    leftCount,
    rightCount,
    parentCounts: Object.fromEntries(parentCounts),
    leftCounts: Object.fromEntries(leftCounts),
    rightCounts: Object.fromEntries(rightCounts),
    parentGini,
    leftGini,
    rightGini,
    giniGain,
    parentEntropy,
    leftEntropy,
    rightEntropy,
    infoGain,
    giniFormulaStr,
    giniGainStr,
    infoGainStr
  };
}
