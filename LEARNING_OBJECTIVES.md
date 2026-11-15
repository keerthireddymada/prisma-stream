# LEARNING OBJECTIVES & SYLLABUS MAPPING
## PRISMA STREAM: The Geometric Decision Tree Synthesizer

This document details the pedagogical framework, syllabus alignment, and academic grading mapping for **PRISMA STREAM**, mapped across the four core college Data Science project criteria:

1. **Concept Coverage and Correctness** (1.5 Marks)
2. **Game Design and Learning Loop** (1.5 Marks)
3. **Implementation Quality & Mathematical Integrity** (1.0 Mark)
4. **Documentation and Evidence of Learning** (1.0 Mark)

---

## 1. Machine Learning Concept Mapping

| Data Science Concept | In-Game Representation & Mechanics | Formal Definition / Formula | Level Introduced |
|---|---|---|---|
| **Observations & Features ($X$)** | Continuous geometric particle stream with 3 observable attributes: Shape, Color, Size. | Feature vector $\mathbf{x} = (x_{\text{shape}}, x_{\text{color}}, x_{\text{size}}) \in \mathcal{X}$. | Phase 1 |
| **Ground-Truth Target Class ($y$)** | Inner core glyph rendered on each particle: Alpha (`A`), Beta (`B`), Gamma (`G`). | Discrete target label $y \in \{\text{Alpha}, \text{Beta}, \text{Gamma}\}$. | Phase 1 |
| **Binary Decision Nodes** | Hexagonal Splitter Prisms placed at grid intersections. Tests a boolean predicate ($X_j == v$). | Partitioning sample set $S$ into $S_L = \{x \in S \mid x_j = v\}$ and $S_R = \{x \in S \mid x_j \ne v\}$. | Phase 1 |
| **Terminal Leaves (Pure Bins)** | Receptacles on the right boundary. Turns emerald green and marks `100% PURE` when Gini $= 0.000$. | Terminal leaf node predicting majority class $\hat{y} = \arg\max_k p_k$. | Phase 1 |
| **Recursive Tree Induction** | Connecting child branches of earlier prisms into subsequent prisms. | Recursive top-down greedy partitioning (CART / ID3). | Phase 2 |
| **Gini Impurity** | Live node and bin readings. Measures disorder based on class squared probabilities. | $\text{Gini}(S) = 1 - \sum_{k=1}^K p_k^2$. Range: $0.00$ to $1 - 1/K$. | Phase 1, 2, 3 |
| **Shannon Entropy** | Live bit-entropy readout in the Telemetry inspector. | $H(S) = - \sum_{k=1}^K p_k \log_2(p_k)$ (bits). Range: $0.00$ to $\log_2(K)$. | Phase 3 |
| **Gini Gain ($\Delta \text{Gini}$)** | Impurity reduction weighted by branch sizes. | $\Delta\text{Gini}(S, A) = \text{Gini}(S) - \left[ \frac{\|S_L\|}{\|S\|}\text{Gini}(S_L) + \frac{\|S_R\|}{\|S\|}\text{Gini}(S_R) \right]$. | Phase 3 |
| **Shannon Information Gain ($IG$)** | Reduction in Shannon entropy. Directly scales laser wire brightness and pulsing glow intensity. | $IG(S, A) = H(S) - \left[ \frac{\|S_L\|}{\|S\|}H(S_L) + \frac{\|S_R\|}{\|S\|}H(S_R) \right]$. | Phase 3 |
| **Spurious Correlations & Noise** | Accidental sample patterns in training data (e.g. outlier small circles labeled Beta). | Non-causal statistical anomalies present in finite training batches $D_{\text{train}}$. | Phase 4 |
| **Overfitting & Generalization** | Toggling between Training and Unseen Test streams. Adding noisy prisms increases train accuracy but drops test accuracy. | Gap between empirical risk $R_{\text{emp}}(f)$ and true expected risk $R(f)$ (High Variance). | Phase 4 |
| **Tree Depth Budget** | The Energy Limit bar. Restricts maximum depth / number of decision prisms. | Maximum depth hyperparameter ($\text{max\_depth}$) regularizing model complexity. | Phase 1–5 |
| **Model Pruning** | The `PRUNE NODE` button and click-to-remove mechanics. Cuts noisy branches to maximize test accuracy. | Reduced-error or cost-complexity pruning minimizing generalization error. | Phase 4, 5 |

---

## 2. Pedagogical Progression

The game follows a strict, progressive conceptual sequence:

```
[ Phase 1: The Primal Split ]     --> Understand Features, Labels & Binary Cuts
               │
               ▼
[ Phase 2: Morphology ]           --> Multi-Class Recursion & Hierarchical Decision Nodes
               │
               ▼
[ Phase 3: The Entropy Trap ]     --> Gini Gain vs Shannon Information Gain (Feature Selection)
               │
               ▼
[ Phase 4: Generalization Crisis ]--> Overfitting on Noise vs Unseen Test Data & Pruning
               │
               ▼
[ Phase 5: Prisma Master ]        --> Full Multidimensional Induction & Model Synthesis
```

---

## 3. Academic Grading Criteria Alignment

### Criteria 1: Concept Coverage and Correctness (1.5 Marks)
* **Distinction between Features and Target Labels:** Particles visibly separate input dimensions (Shape, Color, Size) from ground-truth class symbols ($A, B, G$).
* **Exact Mathematical Metrics:** Implements real Gini Impurity, Gini Gain, Shannon Entropy, and Information Gain with child-branch observation weighting. Never faked or hardcoded.
* **Authentic Overfitting:** Verified empirically with separate training and unseen test generator distributions.

### Criteria 2: Game Design and Learning Loop (1.5 Marks)
* **Goal:** Route continuous geometric streams into pure leaves within tree depth constraints.
* **Decisions:** Selecting informative features and placing prisms at optimal grid intersections.
* **Feedback:** Visual glowing laser wires (brightness $\propto$ Information Gain), pitch-scaled harmonic chimes, and live step-by-step arithmetic derivations.
* **Progression:** 5 carefully calibrated phases introducing higher dimensions and noise.

### Criteria 3: Implementation Quality & Mathematical Integrity (1.0 Mark)
* Zero-dependency React 18 + HTML5 Canvas vector simulation with seedable Mulberry32 PRNG.
* Smooth cubic bezier particle paths matching visual wires.
* 100% offline-capable with built-in React fallback mini-runtime.

### Criteria 4: Documentation and Evidence of Learning (1.0 Mark)
* Complete How-To-Play manual (`HOW_TO_PLAY.md`).
* Syllabus mapping and pedagogical objectives (`LEARNING_OBJECTIVES.md`).
* Pre-game and post-game diagnostic assessment inventory with scoring key (`PLAYTEST_TEMPLATE.md`).
* Formal test verification report (`TEST_REPORT.md`).
