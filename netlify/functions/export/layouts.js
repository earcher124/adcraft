// AdCraft Slide Layouts
// Each function receives a pptx instance, the plan object, and any extras.
// Returns nothing — adds slides to pptx in place.

var T = require("./theme");
var H = require("./helpers");

// ── 1. COVER ─────────────────────────────────────────────────────────────────
function slideCover(pptx, plan, meta) {
  // meta: { planName, bizName, date, coverImageBase64, coverMime }
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };

  var planName = H.trunc(meta.planName || plan.plan_name || "Advertising Plan", 60);
  var bizName  = H.trunc(meta.bizName || "", 50);
  var date     = meta.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });

  var hasImage = !!(meta.coverImageBase64);

  if (hasImage) {
    // Left half: text; right half: illustration
    var imgX = 6.8, imgW = 5.8, imgH = 7.5;

    // Ivory left panel
    slide.addShape("rect", {
      x: 0, y: 0, w: imgX + 0.2, h: T.H,
      fill: { color: T.color.bg },
      line: { color: T.color.bg },
    });

    // Illustration — fills right 43% of slide
    slide.addImage({
      data: "data:" + (meta.coverMime || "image/png") + ";base64," + meta.coverImageBase64,
      x: imgX, y: 0, w: imgW, h: imgH,
      sizing: { type: "cover", w: imgW, h: imgH },
    });

    // Thin accent rule left of image
    slide.addShape("rect", {
      x: imgX - 0.03, y: 0, w: 0.04, h: T.H,
      fill: { color: T.color.accent },
      line: { color: T.color.accent },
    });

    // Text positioned on left panel
    var tx = T.margin.x, tw = imgX - T.margin.x * 2 - 0.1;

    // AdCraft wordmark small
    slide.addText("AdCraft", {
      x: tx, y: 0.45, w: tw, h: 0.22,
      fontSize: 11, color: T.color.accent,
      fontFace: T.font.heading, bold: true, charSpacing: 2,
    });

    // Plan name
    slide.addText(planName, {
      x: tx, y: 1.15, w: tw, h: 1.6,
      fontSize: T.size.coverTitle, color: T.color.fg,
      fontFace: T.font.heading, bold: true,
      wrap: true,
    });

    // Subtitle
    slide.addText("Advertising Plan", {
      x: tx, y: 2.85, w: tw, h: 0.35,
      fontSize: T.size.coverSubtitle, color: T.color.accent,
      fontFace: T.font.body,
    });

    H.addRule(slide, tx, 3.3, tw - 0.3);

    if (bizName) {
      slide.addText(bizName, {
        x: tx, y: 3.5, w: tw, h: 0.3,
        fontSize: 13, color: T.color.fg,
        fontFace: T.font.body, bold: true,
      });
    }

    slide.addText(date, {
      x: tx, y: bizName ? 3.85 : 3.5, w: tw, h: 0.25,
      fontSize: T.size.coverMeta, color: T.color.muted,
      fontFace: T.font.body,
    });

    // Footer
    slide.addText("Prepared with AdCraft", {
      x: tx, y: 7.15, w: tw, h: 0.25,
      fontSize: T.size.footer, color: T.color.muted,
      fontFace: T.font.body,
    });

  } else {
    // Minimal cover — full ivory, centered text, accent bar on left
    slide.addShape("rect", {
      x: 0, y: 0, w: 0.25, h: T.H,
      fill: { color: T.color.accent },
      line: { color: T.color.accent },
    });

    var cx = 1.0, cw = T.W - 1.6;

    slide.addText("AdCraft", {
      x: cx, y: 0.7, w: cw, h: 0.28,
      fontSize: 11, color: T.color.accent,
      fontFace: T.font.heading, bold: true, charSpacing: 2,
    });

    slide.addText(planName, {
      x: cx, y: 1.4, w: cw, h: 2.0,
      fontSize: T.size.coverTitle, color: T.color.fg,
      fontFace: T.font.heading, bold: true,
      wrap: true,
    });

    slide.addText("Advertising Plan", {
      x: cx, y: 3.5, w: cw, h: 0.4,
      fontSize: T.size.coverSubtitle, color: T.color.accent,
      fontFace: T.font.body,
    });

    H.addRule(slide, cx, 4.05, cw * 0.4);

    if (bizName) {
      slide.addText(bizName, {
        x: cx, y: 4.25, w: cw, h: 0.3,
        fontSize: 13, color: T.color.fg,
        fontFace: T.font.body, bold: true,
      });
    }

    slide.addText(date, {
      x: cx, y: bizName ? 4.62 : 4.25, w: cw, h: 0.25,
      fontSize: T.size.coverMeta, color: T.color.muted,
      fontFace: T.font.body,
    });

    slide.addText("Prepared with AdCraft", {
      x: cx, y: 7.15, w: T.W - 1.2, h: 0.25,
      fontSize: T.size.footer, color: T.color.muted,
      fontFace: T.font.body,
    });
  }
}

// ── 2. PLAN AT A GLANCE ───────────────────────────────────────────────────────
function slideAtAGlance(pptx, plan, meta) {
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Plan at a Glance", "Executive Summary");
  H.addFooter(slide);

  var items = [];
  var budget = H.totalBudget(plan);
  if (plan.the_opportunity)          items.push({ label: "Opportunity",         value: H.trunc(plan.the_opportunity, 130) });
  if (plan.recommended_approach)     items.push({ label: "Strategic Approach",  value: H.trunc(plan.recommended_approach, 130) });
  if (budget)                        items.push({ label: "Monthly Budget",       value: H.fmtDollars(budget) + "/mo" });
  if (meta.geography)                items.push({ label: "Geography",            value: H.trunc(meta.geography, 60) });
  if (meta.goal)                     items.push({ label: "Primary Goal",         value: H.trunc(meta.goal, 80) });
  if (plan.who_to_target && plan.who_to_target[0])
    items.push({ label: "Primary Audience", value: H.trunc(plan.who_to_target[0].audience_group, 60) });

  // Two columns
  var col = 0, colX = [T.margin.x, T.W / 2 + 0.1], rowH = 0.95, perCol = Math.ceil(items.length / 2);
  items.forEach(function(item, i) {
    var col = i < perCol ? 0 : 1;
    var row = i < perCol ? i : i - perCol;
    var ix = colX[col], iy = y + row * rowH;
    var iw = T.W / 2 - T.margin.x - 0.2;
    H.addCard(slide, ix - T.card.pad, iy - T.card.pad, iw + T.card.pad * 2, rowH - 0.1);
    H.addKVItem(slide, item.label, item.value, ix, iy, iw, rowH - 0.12);
  });
}

// ── 3. BUSINESS OBJECTIVE ─────────────────────────────────────────────────────
function slideObjective(pptx, plan) {
  if (!plan.what_advertising_needs_to_do && !plan.your_advertising_strategy) return;
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Business Objective", "Strategy");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  if (plan.the_opportunity) {
    slide.addText("The Opportunity", {
      x: cx, y: y, w: cw, h: 0.2,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });
    slide.addText(plan.the_opportunity, {
      x: cx, y: y + 0.22, w: cw, h: 0.65,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
    y += 0.95;
  }

  if (plan.what_advertising_needs_to_do) {
    slide.addText("What Advertising Needs to Do", {
      x: cx, y: y, w: cw, h: 0.2,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });
    slide.addText(plan.what_advertising_needs_to_do, {
      x: cx, y: y + 0.22, w: cw, h: 0.85,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
    y += 1.15;
  }

  if (plan.your_advertising_strategy) {
    slide.addText("Strategic Point of View", {
      x: cx, y: y, w: cw, h: 0.2,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });
    slide.addText(plan.your_advertising_strategy, {
      x: cx, y: y + 0.22, w: cw, h: 1.0,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
  }
}

// ── 4. TARGET AUDIENCE ────────────────────────────────────────────────────────
function slideAudience(pptx, plan, meta) {
  if (!plan.who_to_target || !plan.who_to_target.length) return;
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Target Audience", "Audience");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  if (meta.geography) {
    slide.addText("Geography: " + meta.geography, {
      x: cx, y: y, w: cw, h: 0.22,
      fontSize: T.size.small, color: T.color.muted,
      fontFace: T.font.body, italic: true,
    });
    y += 0.28;
  }

  var audiences = plan.who_to_target.slice(0, 4);
  var cols = audiences.length <= 2 ? 1 : 2;
  var cardW = cols === 1 ? cw : (cw - 0.2) / 2;
  var cardH = 1.3;
  var gap = 0.2;

  audiences.forEach(function(aud, i) {
    var col = cols === 1 ? 0 : i % 2;
    var row = cols === 1 ? i : Math.floor(i / 2);
    var ax = cx + col * (cardW + gap);
    var ay = y + row * (cardH + gap);

    H.addCard(slide, ax, ay, cardW, cardH);
    slide.addText(H.trunc(aud.audience_group, 50), {
      x: ax + T.card.pad, y: ay + T.card.pad,
      w: cardW - T.card.pad * 2, h: 0.28,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });
    slide.addText(H.trunc(aud.description, 200), {
      x: ax + T.card.pad, y: ay + T.card.pad + 0.3,
      w: cardW - T.card.pad * 2, h: cardH - T.card.pad * 2 - 0.32,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
  });
}

// ── 5. STRATEGIC APPROACH ─────────────────────────────────────────────────────
function slideStrategy(pptx, plan) {
  if (!plan.recommended_approach) return;
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Strategic Approach", "Strategy");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  slide.addText(plan.recommended_approach, {
    x: cx, y: y, w: cw, h: 0.9,
    fontSize: T.size.h2, color: T.color.fg,
    fontFace: T.font.heading, bold: false, wrap: true,
    italic: true,
  });
  y += 1.0;

  if (plan.campaign_timing) {
    H.addRule(slide, cx, y, cw * 0.3);
    slide.addText("Campaign Approach", {
      x: cx, y: y + 0.1, w: cw, h: 0.22,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });
    slide.addText(H.trunc(plan.campaign_timing, 400), {
      x: cx, y: y + 0.36, w: cw, h: 1.2,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
    y += 1.65;
  }

  if (plan.creative) {
    slide.addText("Creative Direction", {
      x: cx, y: y, w: cw, h: 0.22,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });
    slide.addText(H.trunc(plan.creative, 350), {
      x: cx, y: y + 0.24, w: cw, h: 1.0,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
  }
}

// ── 6. CHANNEL PLAN ───────────────────────────────────────────────────────────
function slideChannels(pptx, plan) {
  if (!plan.recommended_channels || !plan.recommended_channels.length) return;

  var channels = plan.recommended_channels;
  // Split into groups of 3 for multi-slide support
  var pageSize = 3;
  var pages = Math.ceil(channels.length / pageSize);

  for (var p = 0; p < pages; p++) {
    var group = channels.slice(p * pageSize, (p + 1) * pageSize);
    var slide = pptx.addSlide();
    slide.background = { color: T.color.bg };
    var pageLabel = pages > 1 ? " (" + (p + 1) + "/" + pages + ")" : "";
    var y = H.addSlideHeader(slide, "Channel Plan" + pageLabel, "Channels");
    H.addFooter(slide);

    var cx = T.margin.x, cw = T.W - T.margin.x * 2;
    var cardH = (T.H - y - 0.4) / group.length - 0.12;
    cardH = Math.min(cardH, 1.6);

    group.forEach(function(ch, i) {
      var cy = y + i * (cardH + 0.14);
      H.addCard(slide, cx, cy, cw, cardH);

      // Channel name
      slide.addText(H.trunc(ch.channel, 30), {
        x: cx + T.card.pad, y: cy + T.card.pad,
        w: 2.8, h: 0.26,
        fontSize: T.size.h3, color: T.color.accent,
        fontFace: T.font.heading, bold: true,
      });

      // Role pill
      if (ch.role) {
        slide.addShape("rect", {
          x: cx + 3.2, y: cy + T.card.pad + 0.02,
          w: 2.2, h: 0.22,
          fill: { color: T.color.bg },
          line: { color: T.color.border, pt: 0.5 },
          rectRadius: 0.04,
        });
        slide.addText(H.trunc(ch.role, 30), {
          x: cx + 3.2, y: cy + T.card.pad + 0.02,
          w: 2.2, h: 0.22,
          fontSize: T.size.small, color: T.color.muted,
          fontFace: T.font.body, align: "center", valign: "middle",
        });
      }

      // Budget from plan.budget array
      var budgetEntry = (plan.budget || []).find(function(b) {
        return (b.channel || "").toLowerCase() === (ch.channel || "").toLowerCase();
      });
      if (budgetEntry) {
        slide.addText(H.fmtDollars(budgetEntry.monthly_investment) + "/mo", {
          x: T.W - T.margin.x - 1.8, y: cy + T.card.pad,
          w: 1.6, h: 0.26,
          fontSize: 12, color: T.color.fg,
          fontFace: T.font.body, bold: true, align: "right",
        });
      }

      // Why / rationale
      var body = H.trunc(ch.why || ch.what_to_run || "", 180);
      if (body) {
        slide.addText(body, {
          x: cx + T.card.pad, y: cy + T.card.pad + 0.3,
          w: cw - T.card.pad * 2, h: cardH - T.card.pad * 2 - 0.34,
          fontSize: T.size.body, color: T.color.fg,
          fontFace: T.font.body, wrap: true,
        });
      }
    });
  }
}

// ── 7. BUDGET ALLOCATION ──────────────────────────────────────────────────────
function slideBudget(pptx, plan) {
  if (!plan.budget || !plan.budget.length) return;
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Budget Allocation", "Budget");
  H.addFooter(slide);

  var total = H.totalBudget(plan);
  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  // Total callout
  slide.addText("Total Monthly Budget", {
    x: cx, y: y, w: 3.5, h: 0.18,
    fontSize: T.size.small, color: T.color.muted,
    fontFace: T.font.body, charSpacing: 1,
  });
  slide.addText(H.fmtDollars(total) + "/mo", {
    x: cx, y: y + 0.2, w: 3.5, h: 0.5,
    fontSize: T.size.kpi, color: T.color.accent,
    fontFace: T.font.heading, bold: true,
  });

  y += 0.9;

  // Bar chart — horizontal bars proportional to budget
  var barMaxW = cw - 2.4;
  var barH = 0.32;
  var barGap = 0.14;
  var maxInv = Math.max.apply(null, plan.budget.map(function(b) {
    return parseFloat(String(b.monthly_investment || 0).replace(/[^0-9.]/g, "")) || 0;
  }));

  plan.budget.forEach(function(b, i) {
    var inv = parseFloat(String(b.monthly_investment || 0).replace(/[^0-9.]/g, "")) || 0;
    var barW = maxInv > 0 ? (inv / maxInv) * barMaxW : 0;
    var by = y + i * (barH + barGap);

    // Channel label
    slide.addText(H.trunc(b.channel, 18), {
      x: cx, y: by, w: 2.0, h: barH,
      fontSize: 10, color: T.color.fg,
      fontFace: T.font.body, valign: "middle",
    });

    // Bar background
    slide.addShape("rect", {
      x: cx + 2.1, y: by + 0.04, w: barMaxW, h: barH - 0.08,
      fill: { color: T.color.accentLight },
      line: { color: T.color.border, pt: 0.25 },
    });

    // Bar fill
    if (barW > 0.05) {
      slide.addShape("rect", {
        x: cx + 2.1, y: by + 0.04, w: barW, h: barH - 0.08,
        fill: { color: T.color.accent },
        line: { color: T.color.accent },
      });
    }

    // Amount + pct label
    var pct = H.fmtPct(b.percentage);
    slide.addText(H.fmtDollars(inv) + "  " + pct, {
      x: cx + 2.1 + barMaxW + 0.1, y: by, w: 1.8, h: barH,
      fontSize: 10, color: T.color.fg,
      fontFace: T.font.body, valign: "middle",
    });
  });
}

// ── 8. CAMPAIGN / TACTICAL ────────────────────────────────────────────────────
function slideCampaign(pptx, plan) {
  if (!plan.messaging || !plan.messaging.length) return;
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Campaign Approach", "Messaging & Creative");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  var msgs = plan.messaging.slice(0, 4);
  var cols = msgs.length <= 2 ? 1 : 2;
  var cardW = cols === 1 ? cw : (cw - 0.2) / 2;
  var cardH = cols === 1 ? 1.1 : 1.3;

  msgs.forEach(function(msg, i) {
    var col = cols === 1 ? 0 : i % 2;
    var row = cols === 1 ? i : Math.floor(i / 2);
    var mx = cx + col * (cardW + 0.2);
    var my = y + row * (cardH + 0.15);
    H.addCard(slide, mx, my, cardW, cardH);
    slide.addText(H.trunc(msg.territory, 50), {
      x: mx + T.card.pad, y: my + T.card.pad,
      w: cardW - T.card.pad * 2, h: 0.25,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });
    slide.addText(H.trunc(msg.rationale, 180), {
      x: mx + T.card.pad, y: my + T.card.pad + 0.28,
      w: cardW - T.card.pad * 2, h: cardH - T.card.pad * 2 - 0.3,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
  });
}

// ── 9. MEASUREMENT ────────────────────────────────────────────────────────────
function slideMeasurement(pptx, plan) {
  var kpis = plan.how_to_measure_success;
  if (!kpis) return;
  var business = kpis.business_outcomes || [];
  var media    = kpis.media_signals || [];
  if (!business.length && !media.length) return;

  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "How to Measure Success", "Measurement");
  H.addFooter(slide);

  var cx = T.margin.x, cw = (T.W - T.margin.x * 2 - 0.3) / 2;

  function addKpiList(title, items, x) {
    slide.addText(title, {
      x: x, y: y, w: cw, h: 0.25,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });
    H.addRule(slide, x, y + 0.28, cw * 0.4);
    items.slice(0, 6).forEach(function(item, i) {
      var iy = y + 0.44 + i * 0.52;
      H.addCard(slide, x, iy, cw, 0.46);
      slide.addText(H.trunc(item, 100), {
        x: x + T.card.pad, y: iy + T.card.pad,
        w: cw - T.card.pad * 2, h: 0.46 - T.card.pad * 2,
        fontSize: T.size.body, color: T.color.fg,
        fontFace: T.font.body, wrap: true,
      });
    });
  }

  if (business.length) addKpiList("Business Outcomes", business, cx);
  if (media.length)    addKpiList("Media Signals", media, cx + cw + 0.3);
}

// ── 10. ROADMAP ───────────────────────────────────────────────────────────────
function slideRoadmap(pptx, plan) {
  var lp = plan.launch_plan;
  if (!lp) return;
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "90-Day Roadmap", "Next Steps");
  H.addFooter(slide);

  var phases = [
    { label: "Launch", days: "Days 1–30",  text: lp.days_1_30  || "" },
    { label: "Learn",  days: "Days 31–60", text: lp.days_31_60 || "" },
    { label: "Optimize", days: "Days 61–90", text: lp.days_61_90 || "" },
  ].filter(function(p) { return p.text; });

  var cw = (T.W - T.margin.x * 2 - 0.3 * (phases.length - 1)) / phases.length;
  var cx = T.margin.x;
  var cardH = T.H - y - 0.5;

  phases.forEach(function(phase, i) {
    var px = cx + i * (cw + 0.3);

    // Phase header bar
    slide.addShape("rect", {
      x: px, y: y, w: cw, h: 0.4,
      fill: { color: T.color.accent },
      line: { color: T.color.accent },
      rectRadius: 0.04,
    });
    slide.addText(phase.label, {
      x: px, y: y, w: cw, h: 0.22,
      fontSize: 10, color: T.color.white,
      fontFace: T.font.heading, bold: true,
      align: "center", valign: "middle",
    });
    slide.addText(phase.days, {
      x: px, y: y + 0.22, w: cw, h: 0.18,
      fontSize: T.size.small, color: T.color.accentLight,
      fontFace: T.font.body, align: "center",
    });

    // Phase content card
    H.addCard(slide, px, y + 0.44, cw, cardH - 0.46);
    slide.addText(H.trunc(phase.text, 280), {
      x: px + T.card.pad, y: y + 0.44 + T.card.pad,
      w: cw - T.card.pad * 2, h: cardH - 0.46 - T.card.pad * 2,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });

    // Arrow connector (not on last)
    if (i < phases.length - 1) {
      slide.addShape("line", {
        x: px + cw + 0.04, y: y + 0.2,
        w: 0.22, h: 0,
        line: { color: T.color.accent, pt: 1.5 },
      });
    }
  });

  // Smart next moves
  if (plan.smart_next_moves && plan.smart_next_moves.length) {
    var ny = y + cardH + 0.05;
    if (ny < T.H - 0.5) {
      slide.addText("Smart Next Moves", {
        x: T.margin.x, y: ny, w: T.W - T.margin.x * 2, h: 0.22,
        fontSize: T.size.h3, color: T.color.accent,
        fontFace: T.font.heading, bold: true,
      });
      var moves = plan.smart_next_moves.slice(0, 3).join("   •   ");
      slide.addText(moves, {
        x: T.margin.x, y: ny + 0.24,
        w: T.W - T.margin.x * 2, h: 0.25,
        fontSize: T.size.small, color: T.color.muted,
        fontFace: T.font.body,
      });
    }
  }
}

// ── 11. OPTIMIZATION SUMMARY (only if opt data present) ───────────────────────
function slideOptimization(pptx, plan) {
  // Works with either a full optimized plan (has budget_reallocation + channel_actions)
  var realloc  = plan.budget_reallocation;
  var actions  = plan.channel_actions;
  if (!realloc || !realloc.length) return;

  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Budget Optimization", "Optimization");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  // Summary headline
  if (plan.performance_snapshot && plan.performance_snapshot.key_insight) {
    slide.addText(H.trunc(plan.performance_snapshot.key_insight, 150), {
      x: cx, y: y, w: cw, h: 0.38,
      fontSize: T.size.body, color: T.color.muted,
      fontFace: T.font.body, wrap: true, italic: true,
    });
    y += 0.45;
  }

  // Column headers
  var colW = [2.5, 1.3, 1.3, 1.3, 0.95, T.W - T.margin.x * 2 - 7.35];
  var colX = [cx];
  for (var ci = 1; ci < colW.length; ci++) colX.push(colX[ci-1] + colW[ci-1] + 0.05);

  var headers = ["Channel", "Current", "Recommended", "Change", "Action", "Rationale"];
  headers.forEach(function(h, i) {
    slide.addText(h.toUpperCase(), {
      x: colX[i], y: y, w: colW[i], h: 0.22,
      fontSize: T.size.small, color: T.color.muted,
      fontFace: T.font.body, charSpacing: 0.8,
    });
  });
  H.addRule(slide, cx, y + 0.24, cw);
  y += 0.32;

  var rowH = 0.46;
  realloc.slice(0, 7).forEach(function(row, i) {
    var ry = y + i * rowH;
    if (i % 2 === 0) {
      slide.addShape("rect", {
        x: cx - 0.05, y: ry - 0.04, w: cw + 0.1, h: rowH,
        fill: { color: T.color.accentLight },
        line: { color: T.color.accentLight },
      });
    }

    var changeDollars = row.change_dollars || (row.recommended_budget - row.current_budget);
    var changeColor = changeDollars > 0 ? T.color.scale.increase
                    : changeDollars < 0 ? T.color.scale.decrease
                    : T.color.scale.neutral;
    var changeStr = changeDollars > 0 ? "+" + H.fmtDollars(changeDollars) : H.fmtDollars(changeDollars);

    // Find matching action
    var actionObj = actions && actions.find(function(a) {
      return (a.channel || "").toLowerCase() === (row.channel || "").toLowerCase();
    });
    var action = actionObj ? actionObj.action : (row.direction || "");

    slide.addText(H.trunc(row.channel, 24),   { x: colX[0], y: ry, w: colW[0], h: rowH, fontSize: 10, color: T.color.fg,  fontFace: T.font.body, valign: "middle" });
    slide.addText(H.fmtDollars(row.current_budget),     { x: colX[1], y: ry, w: colW[1], h: rowH, fontSize: 10, color: T.color.muted, fontFace: T.font.body, valign: "middle" });
    slide.addText(H.fmtDollars(row.recommended_budget), { x: colX[2], y: ry, w: colW[2], h: rowH, fontSize: 10, color: T.color.fg,    fontFace: T.font.body, valign: "middle", bold: true });
    slide.addText(changeStr, { x: colX[3], y: ry, w: colW[3], h: rowH, fontSize: 10, color: changeColor, fontFace: T.font.body, valign: "middle", bold: true });

    if (action) H.addActionBadge(slide, action, colX[4], ry + 0.12);

    if (row.rationale) {
      slide.addText(H.trunc(row.rationale, 100), { x: colX[5], y: ry, w: colW[5], h: rowH, fontSize: T.size.small, color: T.color.muted, fontFace: T.font.body, valign: "middle", wrap: true });
    }
  });
}

module.exports = {
  slideCover,
  slideAtAGlance,
  slideObjective,
  slideAudience,
  slideStrategy,
  slideChannels,
  slideBudget,
  slideCampaign,
  slideMeasurement,
  slideRoadmap,
  slideOptimization,
};
