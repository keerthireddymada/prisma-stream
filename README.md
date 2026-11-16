# Prisma Stream
## An Interactive Logic-Puzzle Game for Learning Decision Tree Induction

**Course Project:** Supervised Machine Learning / Data Science  
**Topic:** Decision Tree Classification, Impurity Measures, Information Gain, and Model Generalization  
**Stack:** React 18, HTML5 Canvas, Vanilla JavaScript (ES Modules), CSS3  

---

## 1. Project Motivation & Core Concept

Decision trees are one of the most foundational models in machine learning. However, students often encounter them either as abstract mathematical formulas ($Gini$, $Entropy$, $IG$) or as a few lines of scikit-learn code (`clf.fit(X, y)`). Neither approach gives learners an intuitive, tactile understanding of **how** and **why** decision boundaries are drawn, why features are split hierarchically, or what actually happens under the hood when a model memorizes noise and overfits.

**Prisma Stream** transforms decision tree induction into a spatial flow-routing puzzle:
- **The Data Stream:** A continuous stream of geometric particles flows from left to right. Each particle represents a single row in a dataset, with observable features (**Shape**, **Color**, **Size**) and an underlying target classification (**Alpha**, **Beta**, or **Gamma**).
- **Splitter Prisms (Decision Nodes):** The player places prisms onto grid intersections. Each prism evaluates a binary condition (e.g., `COLOR == BLUE` or `SHAPE == CIRCLE`), splitting the incoming stream into **UP** (True) and **DOWN** (False) trajectories.
- **Output Bins (Leaf Nodes):** Streams terminate at collection bins on the right. A bin is considered **Stable (Pure)** only when 100% of the particles entering it belong to the exact same target class ($\text{Gini} = 0.000$).
- **Energy Limit :** Placing a prism consumes 1 Energy unit. This budget prevents players from endlessly branching, reinforcing the principle that simpler models that generalize to unseen data are preferred over bloated models that memorize training anomalies.

---

## 2. Mathematical Principles & Implementation

The game does not use canned or scripted outcomes; all metrics are calculated live as particles pass through nodes and bins.

### A. Gini Impurity
For a set of observations $S$ containing classes $k \in \{1, \dots, K\}$ with class probabilities $p_k$:
$$\text{Gini}(S) = 1 - \sum_{k=1}^K p_k^2$$

- **Pure leaf:** $\text{Gini} = 1 - (1.0)^2 = 0.000$ (Stable bin).
- **50/50 binary mixture:** $\text{Gini} = 1 - (0.5^2 + 0.5^2) = 0.500$.
- **3-class equal mixture:** $\text{Gini} = 1 - 3 \times \left(\frac{1}{3}\right)^2 = \frac{2}{3} \approx 0.667$.

### B. Weighted Gini Gain ($\Delta \text{Gini}$)
When a Splitter Prism divides stream $S$ into child branches $S_{\text{True}}$ and $S_{\text{False}}$:
$$\Delta \text{Gini}(S, A) = \text{Gini}(S) - \left[ \frac{|S_{\text{True}}|}{|S|} \text{Gini}(S_{\text{True}}) + \frac{|S_{\text{False}}|}{|S|} \text{Gini}(S_{\text{False}}) \right]$$
The right telemetry panel updates this metric live whenever a prism is placed or inspected.

### C. Shannon Entropy & Information Gain
While CART uses Gini impurity, algorithms like ID3 and C4.5 optimize Shannon Information Gain:
$$H(S) = - \sum_{k=1}^K p_k \log_2(p_k)$$
$$IG(S, A) = H(S) - \left[ \frac{|S_{\text{True}}|}{|S|} H(S_{\text{True}}) + \frac{|S_{\text{False}}|}{|S|} H(S_{\text{False}}) \right]$$

**Visual Feedback:** The laser wires connecting prisms pulse with a brightness directly proportional to Information Gain ($IG$). Splits that reduce significant entropy glow intensely, giving the player instant visual feedback on split quality without needing to read raw numbers.

### D. Overfitting on Noise & Post-Pruning
In **Phase 4**, the training data contains a spurious correlation (small circles are noisy outliers). If the player places an extra prism to isolate the small circles:
- **Training Purity:** Reaches 100%.
- **Unseen Test Accuracy:** Drops to 87.5% because the pattern was just noise.

The player is prompted to click **"PRUNE NODE"**, removing the redundant leaf and restoring **100% test accuracy**. This concretely demonstrates **Occam's Razor** and the bias-variance tradeoff.

---

## 3. Levels & Game Progression

The game consists of 5 levels that guide the player from basic binary space partitioning to multi-class generalization:

| Level | Title | Concept Discovered | Features in Stream | Depth Budget |
|---|---|---|---|---|
| **01** | *Binary Stream Induction* | First decision split; purifying binary classes down to Gini = 0.00. | Color (`Blue`, `Orange`) | 1 Prism |
| **02** | *Orthogonal Partitioning* | Hierarchical multi-level splitting; conditional sub-branching. | Color + Shape | 2 Prisms |
| **03** | *Ternary Stream Synthesis* | Multi-class partitioning ($K=3$: Alpha, Beta, Gamma) under branching constraints. | Color + Shape | 3 Prisms |
| **04** | *The Overfitting Trap* | Training noise vs. Unseen Test Data generalization; manual pruning. | Color + Shape + Size | 2 Prisms |
| **05** | *Final Synthesis* | Full 3-feature multi-target tree induction under a strict energy ceiling. | Color + Shape + Size | 3 Prisms |

---

## 4. Playtest Protocol & Evidence Submission

To satisfy the empirical evidence requirements of the project rubric, Prisma Stream includes a built-in playtest logging and verification system:

### 1. Welcome Screen (Identification)
At startup, players enter their name or student call-sign on the introductory screen. This identity is maintained across the entire session.

### 2. End-Screen Playtest Reflection Questionnaire
Upon completing Phase 5, the game presents a debrief modal that records the player's qualitative learning experience:
- **Q1 (Feature Discovery):** Which feature split felt most intuitive to divide the stream? (e.g. Color first, then Shape hierarchy).
- **Q2 (Information Gain):** What did the brightness of the glowing laser wires indicate?
- **Q3 (Overfitting on Noise):** What happened when trying to isolate outlier particles in Phase 4, and how did pruning help?
- **Q4 (Player Experience):** What was the most satisfying moment or biggest "aha!" moment?
- **Q5 (Rating):** Overall 1–5 star evaluation.

### 3. Automated Client-Side PDF Generation
Clicking **"DOWNLOAD PLAYTEST REPORT (PDF)"** generates an official PDF document (`Prisma_Stream_Playtest_<Name>.pdf`) using our zero-dependency pure JavaScript PDF 1.4 compiler (`js/engine/pdf.js`):
- Operates 100% client-side without external CDNs or npm packages.
- Contains participant metadata, date, completion stats (100% test accuracy, 5/5 phases).
- Includes the 5 core machine learning concepts mastered and the player's exact qualitative questionnaire responses.
- Generates a unique verification seal hash.

---

## 5. Automated Verification & QA Test Suite

The project includes an automated test suite verifying mathematical correctness and UI integrity.

### Running the Test Suite
```bash
# 1. Run the Data Science & Mathematics verification suite:
node tests/test_prisma.js

# 2. Run the CSS class coverage and styling check:
python3 tests/check_css.py
```

### Test Suite Results

```
=== Running PRISMA STREAM Data Science Verification Suite ===

1. Verifying Gini Impurity calculations...
   - Pure leaf (Alpha only): Gini = 0.000 [PASSED]
   - 50/50 binary mixture: Gini = 0.500 [PASSED]
   - 1/3 ternary mixture: Gini = 0.6667 [PASSED]
✔ Gini Impurity verified.

2. Verifying Shannon Entropy calculations...
   - Pure leaf: H = 0.000 bits [PASSED]
   - 50/50 binary mixture: H = 1.000 bit [PASSED]
   - 1/3 ternary mixture: H = 1.5850 bits [PASSED]
✔ Shannon Entropy verified.

3. Verifying Gini Gain and Shannon Information Gain...
   - Perfect split: Gini Gain = 0.500, Info Gain = 1.000 bit [PASSED]
   - Uninformative split: Gini Gain = 0.000, Info Gain = 0.000 bits [PASSED]
✔ Gini Gain & Shannon Information Gain verified.

4. Verifying step-by-step breakdown derivation object...
   - Formatted formula strings and exact numerical substitutions verified [PASSED]
✔ Step-by-step mathematical breakdown verified.

5. Verifying Overfitting & Pruning behavior on Phase 4 data...
   - Simple Tree     - Train Acc: 88.0%, Test Acc: 100.0%
   - Overfitted Tree - Train Acc: 100.0%, Test Acc: 87.5%
✔ Overfitting on noise & Generalization advantage of pruned tree verified.

6. Verifying all 5 Game Levels...
   - Level 1: Pure binary stream verified [PASSED]
   - Level 2: Hierarchical cuts verified [PASSED]
   - Level 3: Ternary multi-class verified [PASSED]
   - Level 4: Noise injection & test degradation verified [PASSED]
   - Level 5: Multi-attribute synthesis verified [PASSED]
✔ All 5 Game Levels verified.

```

---

## 6. Project Files & Directory Layout

```
├── index.html                   # HTML5 root shell with React 18 mount
├── server.py                    # Lightweight Python 3 local web server
├── css/
│   └── prisma.css               # Minimalist dark-mode geometric stylesheet
├── js/
│   ├── main.js                  # DOM entrypoint
│   ├── components/
│   │   └── App.js               # Root React application (Welcome, Workspace, End Screen)
│   ├── engine/
│   │   ├── gini.js              # Pure math module (Gini, Entropy, Information Gain)
│   │   ├── stream.js            # Deterministic PRNG seeded stream generator
│   │   ├── simulator.js         # Canvas particle physics, bezier routing, collisions
│   │   ├── levels.js            # Level manifests, distributions, and depth budgets
│   │   └── pdf.js               # Zero-dependency PDF 1.4 compiler & playtest report
│   └── vendor/
│       └── react-fallback.js    # Offline/sandboxed React 18 production fallback
├── tests/
│   ├── test_prisma.js           # Node.js mathematical verification suite
│   └── check_css.py             # CSS class coverage verification script
├── HOW_TO_PLAY.md               # Quick player walkthrough guide
└── LEARNING_OBJECTIVES.md       # Formal curriculum & syllabus mapping document
```

---

## 7. How to Run Locally

Prisma Stream runs entirely in the browser without any build tools (`npm`, `webpack`, or `vite` are not required):

```bash
# Start the local server:
python3 server.py 8000

# Open in any modern web browser:
http://localhost:8000
```
*(If port 8000 is occupied, the server automatically falls back to 8001 or another open port).*
