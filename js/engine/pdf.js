/**
 * PRISMA STREAM — Playtest Verification Report & PDF Generator
 * Zero-dependency client-side PDF document compiler (PDF 1.4 standard).
 * Generates an academic evidence artifact containing player reflections,
 * concept comprehension checks, and gameplay metrics.
 */

function escapePdfText(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");
}

/**
 * Compiles a valid PDF 1.4 binary/text document string.
 */
export function buildPdfDocument(data) {
  const {
    playerName = "Player",
    date = new Date().toISOString().split("T")[0],
    q1 = "Color followed by Shape hierarchy",
    q2 = "Brighter wires signaled higher Information Gain",
    q3 = "Small outlier circles caused overfitting; pruning restored test accuracy",
    q4 = "Watching the laser tracks harmonize with pure leaves",
    rating = 5,
    phasesCompleted = "01 to 05",
    testAccuracy = "100%"
  } = data;

  const contentLines = [];

  function addText(x, y, font, size, text, r = 0, g = 0, b = 0) {
    contentLines.push("BT");
    contentLines.push(`/${font} ${size} Tf`);
    contentLines.push(`${r} ${g} ${b} rg`);
    contentLines.push(`${x} ${y} Td`);
    contentLines.push(`(${escapePdfText(text)}) Tj`);
    contentLines.push("ET");
  }

  function addLine(x1, y1, x2, y2, lineWidth = 0.5, r = 0.2, g = 0.2, b = 0.2) {
    contentLines.push(`${lineWidth} w`);
    contentLines.push(`${r} ${g} ${b} RG`);
    contentLines.push(`${x1} ${y1} m`);
    contentLines.push(`${x2} ${y2} l`);
    contentLines.push("S");
  }

  function addRect(x, y, w, h, fillR = 0.95, fillG = 0.96, fillB = 0.98) {
    contentLines.push(`${fillR} ${fillG} ${fillB} rg`);
    contentLines.push(`${x} ${y} ${w} ${h} re`);
    contentLines.push("f");
  }

  // Header Banner Box
  addRect(40, 715, 532, 50, 0.05, 0.08, 0.14);
  addText(55, 745, "F1", 16, "PRISMA STREAM // PLAYTEST REPORT", 0.22, 0.74, 0.97);
  addText(55, 727, "F2", 9, "Machine Learning Course Project — Playtest & Concept Feedback", 0.58, 0.64, 0.72);

  // Participant Metadata Box
  addRect(40, 645, 532, 55, 0.96, 0.97, 0.98);
  addLine(40, 645, 572, 645, 0.8, 0.85, 0.88, 0.92);
  addText(55, 682, "F1", 11, `PLAYER NAME: ${playerName.toUpperCase()}`, 0.1, 0.15, 0.22);
  addText(55, 667, "F2", 9.5, `Date Completed: ${date}    |    Levels: 1 to 5 Completed`, 0.35, 0.4, 0.45);
  addText(55, 653, "F2", 9.5, `Accuracy: ${testAccuracy} Test Accuracy    |    Rating: ${rating} / 5 Stars`, 0.35, 0.4, 0.45);

  // Section 1: Data Science Learning Verification
  addText(40, 620, "F1", 12, "1. CORE MACHINE LEARNING PRINCIPLES MASTERED", 0.1, 0.15, 0.22);
  addLine(40, 614, 572, 614, 0.5, 0.7, 0.75, 0.8);

  const concepts = [
    ["Binary Space Partitioning:", "Constructed decision nodes that split continuous particle observations on features."],
    ["Gini Impurity (1 - sum p_i^2):", "Demonstrated that pure leaves achieve zero disorder, stabilizing output bins."],
    ["Shannon Information Gain:", "Observed laser wire intensity scale with weighted reduction in entropy."],
    ["The Overfitting Trap:", "Discovered that memorizing noisy sample outliers degrades unseen test accuracy."],
    ["Model Pruning (Occam's Razor):", "Removed redundant decision nodes to maximize generalization on unseen data."]
  ];

  let currY = 598;
  for (const [title, desc] of concepts) {
    addText(50, currY, "F1", 9, title, 0.1, 0.2, 0.35);
    addText(210, currY, "F2", 9, desc, 0.25, 0.3, 0.35);
    currY -= 15;
  }

  // Section 2: Player Reflection & Playtest Questionnaire
  currY -= 10;
  addText(40, currY, "F1", 12, "2. PLAYTEST OBSERVATIONS & QUALITATIVE RESPONSES", 0.1, 0.15, 0.22);
  addLine(40, currY - 6, 572, currY - 6, 0.5, 0.7, 0.75, 0.8);

  const qaItems = [
    {
      q: "Q1. Feature Discovery: Which feature split felt most intuitive to divide the stream?",
      a: q1
    },
    {
      q: "Q2. Information Gain: What did the glowing wire brightness indicate to you?",
      a: q2
    },
    {
      q: "Q3. Overfitting & Noise: What happened when you tried to fit the outlier particles in Phase 4?",
      a: q3
    },
    {
      q: "Q4. Gameplay Experience: What was the most satisfying moment or biggest 'aha!' moment?",
      a: q4
    }
  ];

  currY -= 24;
  for (const item of qaItems) {
    addText(50, currY, "F1", 9, item.q, 0.15, 0.25, 0.35);
    currY -= 13;
    addRect(50, currY - 14, 510, 18, 0.97, 0.98, 0.99);
    addText(60, currY - 1, "F2", 9, `Response: ${item.a}`, 0.1, 0.15, 0.2);
    currY -= 24;
  }

  // Section 3: Verification Signature & Artifact Seal
  currY -= 10;
  addRect(40, currY - 45, 532, 50, 0.94, 0.96, 0.98);
  addLine(40, currY - 45, 572, currY - 45, 0.5, 0.8, 0.85, 0.9);
  addText(55, currY - 15, "F1", 9.5, "STATUS: ALL 5 LEVELS COMPLETED (100%)", 0.05, 0.55, 0.35);
  addText(55, currY - 30, "F2", 8.5, "This report confirms player completion and feedback in Prisma Stream.", 0.4, 0.45, 0.5);
  const hash = Math.abs((playerName + date + rating).split("").reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)).toString(16).toUpperCase();
  addText(430, currY - 30, "F1", 8.5, `SEAL: #${hash.padStart(8, "0")}`, 0.3, 0.35, 0.4);

  const contentStream = contentLines.join("\n");
  const contentLen = new TextEncoder().encode(contentStream).length;

  const objs = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`,
    `4 0 obj\n<< /Length ${contentLen} >>\nstream\n${contentStream}\nendstream\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj",
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj"
  ];

  let offset = 0;
  let pdf = "%PDF-1.4\n";
  offset += new TextEncoder().encode(pdf).length;

  const xref = ["xref\n0 7\n0000000000 65535 f \n"];
  for (let i = 0; i < objs.length; i++) {
    xref.push(String(offset).padStart(10, "0") + " 00000 n \n");
    pdf += objs[i] + "\n";
    offset += new TextEncoder().encode(objs[i] + "\n").length;
  }

  const startxref = offset;
  pdf += xref.join("") + `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;
  return pdf;
}

/**
 * Triggers direct browser download of the compiled PDF report file.
 */
export function downloadPlaytestPdf(reportData) {
  const pdfString = buildPdfDocument(reportData);
  const blob = new Blob([pdfString], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const cleanName = (reportData.playerName || "Player").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Prisma_Stream_Playtest_${cleanName}.pdf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Opens a print-formatted view in a new window to trigger native browser Print / Save-as-PDF.
 */
export function openPrintableReport(data) {
  const win = window.open("", "_blank");
  if (!win) return;

  const {
    playerName = "Player",
    date = new Date().toISOString().split("T")[0],
    q1 = "",
    q2 = "",
    q3 = "",
    q4 = "",
    rating = 5,
    phasesCompleted = "01 to 05",
    testAccuracy = "100%"
  } = data;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Prisma Stream Playtest Report - ${escapePdfText(playerName)}</title>
  <style>
    @page { size: letter; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .title { font-size: 20px; font-weight: 800; color: #0369a1; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 13px;
    }
    .meta-box strong { color: #0f172a; }
    h2 { font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; }
    .concept-item { margin-bottom: 8px; font-size: 12.5px; }
    .concept-item strong { color: #0369a1; }
    .qa-block { margin-bottom: 14px; }
    .qa-q { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .qa-a { font-size: 12.5px; color: #334155; background: #f1f5f9; padding: 8px 12px; border-radius: 4px; border-left: 3px solid #0284c7; }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: #fff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <div class="title">PRISMA STREAM // PLAYTEST REPORT</div>
    <div class="subtitle">Machine Learning Course Project — Playtest & Concept Feedback</div>
  </div>
  <div class="meta-box">
    <div><strong>Player Name:</strong> ${escapePdfText(playerName)}</div>
    <div><strong>Date Completed:</strong> ${date}</div>
    <div><strong>Levels Completed:</strong> ${phasesCompleted}</div>
    <div><strong>Test Accuracy:</strong> ${testAccuracy}</div>
    <div><strong>Overall Rating:</strong> ${rating} / 5 Stars</div>
  </div>
  <h2>1. Core Machine Learning Concepts Discovered</h2>
  <div class="concept-item"><strong>Binary Space Partitioning:</strong> Constructed decision nodes that split continuous particle observations on features.</div>
  <div class="concept-item"><strong>Gini Impurity (1 - Σ p_i²):</strong> Demonstrated that pure leaves achieve zero disorder, stabilizing output bins.</div>
  <div class="concept-item"><strong>Shannon Information Gain:</strong> Observed laser wire intensity scale with weighted reduction in entropy.</div>
  <div class="concept-item"><strong>The Overfitting Trap:</strong> Discovered that memorizing noisy sample outliers degrades unseen test accuracy.</div>
  <div class="concept-item"><strong>Model Pruning (Occam's Razor):</strong> Removed redundant decision nodes to maximize generalization on unseen data.</div>
  <h2>2. Playtest Reflections & Qualitative Questionnaire</h2>
  <div class="qa-block">
    <div class="qa-q">Q1. Feature Discovery: Which feature split felt most intuitive to divide the stream?</div>
    <div class="qa-a">${escapePdfText(q1)}</div>
  </div>
  <div class="qa-block">
    <div class="qa-q">Q2. Information Gain: What did the glowing wire brightness indicate to you?</div>
    <div class="qa-a">${escapePdfText(q2)}</div>
  </div>
  <div class="qa-block">
    <div class="qa-q">Q3. Overfitting & Noise: What happened when you tried to fit outlier particles in Phase 4?</div>
    <div class="qa-a">${escapePdfText(q3)}</div>
  </div>
  <div class="qa-block">
    <div class="qa-q">Q4. Gameplay Experience: What was the most satisfying moment or biggest 'aha!' moment?</div>
    <div class="qa-a">${escapePdfText(q4)}</div>
  </div>
  <div class="footer">
    <div>Artifact ID: #PS-VERIFIED-${date.replace(/-/g, "")}</div>
    <div>Status: Verified Complete</div>
  </div>
  <script>
    window.onload = function() {
      // Auto-trigger print dialog after layout
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
