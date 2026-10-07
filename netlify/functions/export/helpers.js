// AdCraft PPTX helper utilities
const T = require("./theme");

// ── String helpers ────────────────────────────────────────────────────────────

/** Truncate a string to maxLen chars, appending ellipsis if needed */
function trunc(str, maxLen) {
  if (!str) return "";
  str = String(str);
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + "…";
}

/** Convert a dollar number to a formatted string: $1,200 */
function fmtDollars(n) {
  if (n == null || n === "") return "";
  var num = typeof n === "string" ? parseFloat(n.replace(/[^0-9.]/g, "")) : Number(n);
  if (isNaN(num)) return String(n);
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Ensure a percentage string ends with % */
function fmtPct(str) {
  if (!str) return "";
  str = String(str).trim();
  return str.endsWith("%") ? str : str + "%";
}

/** Sentence-case a string */
function sentenceCase(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Total budget from a plan's budget array */
function totalBudget(plan) {
  if (!plan || !Array.isArray(plan.budget)) return 0;
  return plan.budget.reduce(function(sum, b) {
    return sum + (parseFloat(String(b.monthly_investment || 0).replace(/[^0-9.]/g, "")) || 0);
  }, 0);
}

// ── Slide helpers ─────────────────────────────────────────────────────────────

/**
 * Add the standard slide title bar (colored strip + title text + section label).
 * Returns the y position where content should begin.
 */
function addSlideHeader(slide, title, sectionLabel) {
  var T2 = T;
  // Title bar background strip
  slide.addShape("rect", {
    x: 0, y: 0, w: T2.W, h: T2.margin.titleH,
    fill: { color: T2.color.accent },
    line: { color: T2.color.accent },
  });

  // Optional section label (small caps, top-left)
  if (sectionLabel) {
    slide.addText(sectionLabel.toUpperCase(), {
      x: T2.margin.x, y: 0.08, w: 4, h: 0.2,
      fontSize: T2.size.sectionLabel,
      color: T2.color.accentLight,
      fontFace: T2.font.body,
      bold: false,
      charSpacing: 1.5,
    });
  }

  // Title text
  slide.addText(title, {
    x: T2.margin.x,
    y: sectionLabel ? 0.22 : 0.13,
    w: T2.W - T2.margin.x * 2,
    h: sectionLabel ? 0.38 : 0.5,
    fontSize: T2.size.slideTitle,
    color: T2.color.white,
    fontFace: T2.font.heading,
    bold: true,
  });

  return T2.margin.titleH + 0.25; // content start Y
}

/** Add the standard footer: "Prepared with AdCraft" right-aligned */
function addFooter(slide, planName) {
  var T2 = T;
  slide.addText("Prepared with AdCraft", {
    x: 0, y: T2.margin.footerY,
    w: T2.W - T2.margin.x, h: T2.margin.footerH,
    fontSize: T2.size.footer,
    color: T2.color.muted,
    fontFace: T2.font.body,
    align: "right",
  });
}

/**
 * Add a labeled key-value row (label above value).
 * Returns x + w so caller can chain multiple items in a row.
 */
function addKVItem(slide, label, value, x, y, w, h) {
  var T2 = T;
  slide.addText(label.toUpperCase(), {
    x: x, y: y, w: w, h: 0.16,
    fontSize: T2.size.sectionLabel,
    color: T2.color.muted,
    fontFace: T2.font.body,
    charSpacing: 1,
  });
  slide.addText(trunc(value, 80), {
    x: x, y: y + 0.18, w: w, h: h - 0.18,
    fontSize: T2.size.body,
    color: T2.color.fg,
    fontFace: T2.font.body,
    wrap: true,
  });
}

/**
 * Add a subtle card background rectangle.
 */
function addCard(slide, x, y, w, h) {
  slide.addShape("rect", {
    x: x, y: y, w: w, h: h,
    fill: { color: T.color.accentLight },
    line: { color: T.color.border, pt: 0.5 },
    rectRadius: T.card.r,
  });
}

/**
 * Add a thin horizontal rule.
 */
function addRule(slide, x, y, w) {
  slide.addShape("line", {
    x: x, y: y, w: w, h: 0,
    line: { color: T.color.border, pt: 0.75 },
  });
}

/**
 * Add an action badge (SCALE / MAINTAIN / OPTIMIZE / REDUCE).
 */
function addActionBadge(slide, action, x, y) {
  var T2 = T;
  var raw = (action || "").toUpperCase();
  var label = raw === "REDUCE" ? "REDUCE" : raw;
  var colorMap = T2.color.action;
  var bg = colorMap[raw.toLowerCase()] || T2.color.muted;

  slide.addShape("rect", {
    x: x, y: y, w: 0.9, h: 0.22,
    fill: { color: bg },
    line: { color: bg },
    rectRadius: 0.03,
  });
  slide.addText(label, {
    x: x, y: y, w: 0.9, h: 0.22,
    fontSize: T2.size.tag,
    color: T2.color.white,
    fontFace: T2.font.body,
    bold: true,
    align: "center",
    valign: "middle",
  });
}

module.exports = {
  trunc,
  fmtDollars,
  fmtPct,
  sentenceCase,
  totalBudget,
  addSlideHeader,
  addFooter,
  addKVItem,
  addCard,
  addRule,
  addActionBadge,
};
