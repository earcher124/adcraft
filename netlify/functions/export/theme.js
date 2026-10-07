// AdCraft Presentation Theme
// All visual constants live here. Change once to update the entire export system.

const THEME = {
  // Slide dimensions — 16:9 widescreen (inches)
  W: 13.33,
  H: 7.5,

  // Color palette (hex, no #)
  color: {
    bg:          "FAF6ED", // warm ivory — slide background
    bgWhite:     "FFFFFF", // true white — card fills
    fg:          "1A1A1A", // charcoal — primary text
    muted:       "7A6C74", // muted aubergine-grey — labels, secondary text
    mutedLight:  "B5A9B1", // lighter muted — fine details
    accent:      "4A1040", // deep aubergine — headings, rules, accents
    accentLight: "F0E8EE", // pale aubergine — subtle highlights
    accentMid:   "7A2060", // mid aubergine — secondary accent
    white:       "FFFFFF",
    border:      "E2D8CC", // warm border
    borderLight: "EDE7DF", // very light border
    scale: {
      increase:  "2E7D52", // forest green
      decrease:  "B5351F", // terracotta red
      neutral:   "7A6C74", // grey
    },
    action: {
      scale:    "2E7D52",
      maintain: "4A5568",
      optimize: "B97A1C",
      reduce:   "B5351F",
    },
  },

  // Typography
  font: {
    heading:  "Garamond",     // editorial serif heading face
    body:     "Gill Sans",    // clean sans body
    fallback: "Arial",
  },

  // Font sizes (pt)
  size: {
    coverTitle:    40,
    coverSubtitle: 16,
    coverMeta:     11,
    slideTitle:    28,
    slideSub:      10,
    sectionLabel:  8,
    h2:            20,
    h3:            13,
    body:          10,
    small:         8,
    tag:           7,
    footer:        7,
    kpi:           32,
    kpiLabel:      8,
    stat:          24,
  },

  // Margins and spacing (inches)
  margin: {
    x:       0.55,  // left/right slide margin
    y:       0.5,   // generic top margin
    titleH:  0.82,  // height of the header area
    footerY: 7.18,  // y position of footer row
    footerH: 0.22,
    sidebar: 0.08,  // left accent sidebar width
  },

  // Card style
  card: {
    r:   0.05,  // corner radius
    pad: 0.18,  // internal padding
  },
};

module.exports = THEME;
