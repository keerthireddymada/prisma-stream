# HOW TO PLAY: PRISMA STREAM
## The Geometric Decision Tree Synthesizer & Operational Field Manual

Welcome to **PRISMA STREAM**, a minimalist logic-puzzle game inspired by *Mini Metro* and *Opus Magnum*. You build and optimize physical decision-tree networks to partition continuous streams of multidimensional data observations into pure, stable classifications.

---

## 1. System Overview & The Core Loop

In Prisma Stream, every puzzle represents a supervised classification problem:

```
[ DATA SOURCE ] ──> [ SPLITTER PRISM ] ──┬──> [ TRUE BRANCH (UP) ]   ──> [ OUTPUT BIN 1 ]
                     (Decision Node)     │    (Cyan Resonant Wire)       (Pure Leaf A)
                                         └──> [ FALSE BRANCH (DOWN) ] ──> [ OUTPUT BIN 2 ]
                                              (Amber Resonant Wire)      (Pure Leaf B)
```

1. **Observe the Inflow:** Inspect the continuous stream of geometric particles entering from the left emitter.
2. **Formulate a Hypothesis:** Use the **Stream Sensor** in the left panel to examine the active feature dimensions (Color, Shape, Size) and find the feature that best divides the classes.
3. **Deploy Prisms:** Select a binary condition (e.g. `COLOR == BLUE`, `SHAPE == CIRCLE`) and place a Splitter Prism on a grid intersection.
4. **Follow Trajectories:** Watch particles physically branch along glowing cubic bezier tracks (True diverts UP, False diverts DOWN).
5. **Inspect Live Metrics:** Click any placed prism to view its **Gini Gain** ($\Delta \text{Gini}$) and **Shannon Information Gain** ($IG$ in bits).
6. **Harmonize Output Bins:** A level is cleared when all active output paths feed into stable bins ($\text{Gini} = 0.000$ or $\ge 80\%$ purity on noisy data) within the allowed **Tree Depth Budget**.

---

## 2. Interface Anatomy

* **Top Telemetry Bar:**
  * **Brand Zone:** System title and synthesizer status.
  * **Player Name:** Displays the active player name entered on the Welcome Screen.
  * **Level Selector (01 to 05):** Jump between game levels.
  * **Tree Depth Budget (Energy Gauge):** Visual cells indicating maximum allowed prism nodes. If exceeded, the system enters an **Overfit Penalty** state.
  * **Controls:** `GUIDE` (Onboarding walkthrough), `PAUSE/RESUME`, and `RESET` (Clear all placed prisms).
* **Left Control Panel:**
  * **Splitter Prism Palette:** Categorized by feature dimension:
    * **Color Features:** `COLOR == BLUE` (Cyan), `COLOR == ORANGE` (Amber).
    * **Shape Features:** `SHAPE == CIRCLE` (●), `SHAPE == SQUARE` (■), `SHAPE == TRIANGLE` (▲).
    * **Size Features:** `SIZE == LARGE` (⬡), `SIZE == SMALL` (⬝).
  * **Stream Sensor (Inflow Manifest):** Displays all colors, shapes, and sizes actively flowing into the workspace without spoiling the ground-truth target classes.
  * **Objective & Contextual Hint Card:** Displays phase title, core machine learning concept, description, and multi-tier hints (`GUIDE`, `THEORY`, `CALCULATION`).
* **Central Grid Workspace:**
  * Interactive canvas vector simulation.
  * Hovering displays a dashed targeting reticle.
  * Click any intersection to place a prism; click an existing prism to remove (prune) it.
  * When `hasTestMode` is active (Phases 4 & 5), an **Evaluation Bar** appears at the top to toggle between **Training Data** and **Unseen Test Data**.
* **Right Telemetry Panel:**
  * **Decision Node Inspector:** Displays the active node's question, parent count, branch counts, Gini Gain, Shannon Information Gain, and an interactive **"SHOW EXACT FORMULAS & NUMBERS"** calculation breakdown.
  * **Output Bins Monitor:** Displays purity tags (`100% PURE` or `IMPURE`), target class labels, and live Gini readings for every output leaf.

---

## 3. Level Progression & Mechanics

### Phase 01: The Primal Split
* **Concept:** Features, Target Classes, and Binary Partitioning.
* **Challenge:** Two equal groups of particles (Blue Circles vs Orange Circles). Place 1 prism (`COLOR == BLUE`) to route each class into its own pure bin.

### Phase 02: Morphology
* **Concept:** Multi-Class Hierarchical Trees.
* **Challenge:** Three target classes (Alpha, Beta, Gamma). A single binary split can only create two branches. Build a 2-level hierarchical tree: first split by Color, then split the remaining branch by Shape.

### Phase 03: The Entropy Trap
* **Concept:** Gini Gain vs Shannon Information Gain.
* **Challenge:** Multiple features exist, but Size is random noise. Compare candidate splits: splitting on Size yields zero Gain (dim wires), while splitting on Color yields maximum Information Gain (brilliant neon glow).

### Phase 04: The Generalization Crisis
* **Concept:** Overfitting on Noise vs Unseen Test Data & Model Pruning.
* **Challenge:** The training stream contains anomalous small circles labeled Beta.
  * If you add a `SIZE` prism to isolate them, your training accuracy reaches 100%, but your **Unseen Test Accuracy drops to 80%** (Overfitting).
  * Pruning the `SIZE` prism restores **100% Test Generalization**!

### Phase 05: Prisma Master
* **Concept:** Full Multidimensional Induction.
* **Challenge:** A complex composite distribution across Color, Shape, and Size. Build a compact, generalizable decision tree within a 4-node budget that stabilizes all output leaves on both training and unseen test streams.

---

## 4. Tips for High Generalization

1. **Look at the Wires:** A brightly glowing neon cyan wire indicates a high-gain split that sharply reduces entropy. A dim wire indicates a weak question that leaves classes mixed.
2. **Beware of Outliers:** If a single odd particle doesn't fit the pattern, do not build a dedicated branch for it. In machine learning, simpler models that capture the primary signal generalize better to new observations.
3. **Use the Prune Button:** If your test accuracy drops below 85%, click `PRUNE NODE` to remove recent overfitted branches.
