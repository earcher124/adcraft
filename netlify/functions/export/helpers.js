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
 * Editorial header: left accent strip + section tag + slide title.
 * Returns the y position where content should begin.
 */
function addSlideHeader(slide, title, sectionLabel) {
  // Left accent sidebar strip
  slide.addShape("rect", {
    x: 0, y: 0, w: T.margin.sidebar, h: T.H,
    fill: { color: T.color.accent },
    line: { color: T.color.accent },
  });

  // Section label (small caps, stacked above title)
  if (sectionLabel) {
    slide.addText(sectionLabel.toUpperCase(), {
      x: T.margin.x, y: 0.32, w: 6, h: 0.18,
      fontSize: T.size.sectionLabel,
      color: T.color.accent,
      fontFace: T.font.body,
      charSpacing: 2.5,
      bold: false,
    });
  }

  // Slide title
  slide.addText(title, {
    x: T.margin.x,
    y: sectionLabel ? 0.5 : 0.38,
    w: T.W - T.margin.x * 2,
    h: sectionLabel ? 0.42 : 0.54,
    fontSize: T.size.slideTitle,
    color: T.color.fg,
    fontFace: T.font.heading,
    bold: true,
  });

  // Fine rule below title
  slide.addShape("line", {
    x: T.margin.x, y: T.margin.titleH,
    w: T.W - T.margin.x * 2, h: 0,
    line: { color: T.color.border, pt: 0.5 },
  });

  return T.margin.titleH + 0.22; // content start Y
}

/** Add the standard footer */
function addFooter(slide) {
  // Footer rule
  slide.addShape("line", {
    x: T.margin.x, y: T.margin.footerY - 0.06,
    w: T.W - T.margin.x * 2, h: 0,
    line: { color: T.color.borderLight, pt: 0.5 },
  });
  slide.addText("AdCraft", {
    x: 0, y: T.margin.footerY,
    w: T.W - T.margin.x, h: T.margin.footerH,
    fontSize: T.size.footer,
    color: T.color.mutedLight,
    fontFace: T.font.body,
    align: "right",
  });
}

/**
 * White card with subtle shadow-like border.
 */
function addCard(slide, x, y, w, h, opts) {
  opts = opts || {};
  slide.addShape("rect", {
    x: x, y: y, w: w, h: h,
    fill: { color: opts.fill || T.color.bgWhite },
    line: { color: opts.border || T.color.border, pt: 0.75 },
    rectRadius: T.card.r,
  });
}

/**
 * Accent-filled card (for highlighted/featured content).
 */
function addAccentCard(slide, x, y, w, h) {
  slide.addShape("rect", {
    x: x, y: y, w: w, h: h,
    fill: { color: T.color.accent },
    line: { color: T.color.accent },
    rectRadius: T.card.r,
  });
}

/**
 * Add a labeled key-value row (label above value).
 */
function addKVItem(slide, label, value, x, y, w, h) {
  slide.addText(label.toUpperCase(), {
    x: x, y: y, w: w, h: 0.15,
    fontSize: T.size.sectionLabel,
    color: T.color.accent,
    fontFace: T.font.body,
    charSpacing: 1.5,
  });
  slide.addText(trunc(value, 100), {
    x: x, y: y + 0.17, w: w, h: h - 0.17,
    fontSize: T.size.body,
    color: T.color.fg,
    fontFace: T.font.body,
    wrap: true,
  });
}

/**
 * Add a thin horizontal rule.
 */
function addRule(slide, x, y, w, color) {
  slide.addShape("line", {
    x: x, y: y, w: w, h: 0,
    line: { color: color || T.color.border, pt: 0.75 },
  });
}

/**
 * Add a stat tile: large number with label below.
 */
function addStatTile(slide, label, value, x, y, w, h) {
  addCard(slide, x, y, w, h, { fill: T.color.accentLight, border: T.color.border });
  slide.addText(trunc(value, 20), {
    x: x + T.card.pad, y: y + T.card.pad,
    w: w - T.card.pad * 2, h: h * 0.55,
    fontSize: T.size.stat,
    color: T.color.accent,
    fontFace: T.font.heading,
    bold: true,
    align: "center",
    valign: "bottom",
  });
  slide.addText(label.toUpperCase(), {
    x: x + T.card.pad, y: y + h * 0.6,
    w: w - T.card.pad * 2, h: h * 0.3,
    fontSize: T.size.sectionLabel,
    color: T.color.muted,
    fontFace: T.font.body,
    charSpacing: 1,
    align: "center",
  });
}

/**
 * Add an action badge (SCALE / MAINTAIN / OPTIMIZE / REDUCE).
 */
function addActionBadge(slide, action, x, y) {
  var raw = (action || "").toUpperCase();
  var colorMap = T.color.action;
  var bg = colorMap[raw.toLowerCase()] || T.color.muted;

  slide.addShape("rect", {
    x: x, y: y, w: 0.88, h: 0.20,
    fill: { color: bg },
    line: { color: bg },
    rectRadius: 0.03,
  });
  slide.addText(raw, {
    x: x, y: y, w: 0.88, h: 0.20,
    fontSize: T.size.tag,
    color: T.color.white,
    fontFace: T.font.body,
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
  addCard,
  addAccentCard,
  addKVItem,
  addRule,
  addStatTile,
  addActionBadge,
};
