// AdCraft Presentation Theme
// All visual constants live here. Change once to update the entire export system.

const THEME = {
  // Slide dimensions — 16:9 widescreen (inches)
  W: 13.33,
  H: 7.5,

  // Color palette (hex, no #)
  color: {
    bg:         "FAF6ED", // warm ivory — slide background
    fg:         "1A1A1A", // charcoal — primary text
    muted:      "6B6270", // muted aubergine-grey — labels, secondary text
    accent:     "4A1040", // deep aubergine — headings, rules, accents
    accentLight:"F0E8EE", // pale aubergine — card fills, highlights
    white:      "FFFFFF",
    border:     "D8CCB8", // warm border
    scale: {
      increase:  "2D7A4F", // green
      decrease:  "C0392B", // red
      neutral:   "6B6270", // grey
    },
    action: {
      scale:    "2D7A4F",
      maintain: "4A5568",
      optimize: "B7791F",
      reduce:   "C0392B",
    },
  },

  // Typography
  font: {
    heading:  "Gill Sans",      // primary heading face
    body:     "Calibri",        // body / table / label face
    fallback: "Arial",
  },

  // Font sizes (pt)
  size: {
    coverTitle:   36,
    coverSubtitle: 18,
    coverMeta:    12,
    slideTitle:   24,
    sectionLabel: 9,
    h2:           18,
    h3:           14,
    body:         11,
    small:        9,
    tag:          8,
    footer:       8,
    kpi:          28,
    kpiLabel:     9,
  },

  // Margins and spacing (inches)
  margin: {
    x:    0.55,  // left/right slide margin
    y:    0.5,   // top margin (below title bar)
    titleH: 0.7, // height of the slide title bar
    footerY: 7.15, // y position of footer row
    footerH: 0.25,
  },

  // Card style
  card: {
    r:   0.06,  // corner radius
    pad: 0.15,  // internal padding
  },
};

module.exports = THEME;
