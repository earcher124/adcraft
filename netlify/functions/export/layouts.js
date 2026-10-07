// AdCraft Slide Layouts — Editorial redesign
// Each function receives a pptx instance, the plan object, and any extras.

var T = require("./theme");
var H = require("./helpers");

// ── 1. COVER ─────────────────────────────────────────────────────────────────
function slideCover(pptx, plan, meta) {
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };

  var planName = H.trunc(meta.planName || plan.plan_name || "Advertising Plan", 55);
  var bizName  = H.trunc(meta.bizName || "", 45);
  var date     = meta.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
  var hasImage = !!(meta.coverImageBase64);

  if (hasImage) {
    // ── With cover illustration ──
    // Left: deep aubergine panel
    var panelW = 7.0;
    slide.addShape("rect", {
      x: 0, y: 0, w: panelW, h: T.H,
      fill: { color: T.color.accent },
      line: { color: T.color.accent },
    });

    // Right: illustration
    var imgX = panelW;
    slide.addImage({
      data: "data:" + (meta.coverMime || "image/png") + ";base64," + meta.coverImageBase64,
      x: imgX, y: 0, w: T.W - imgX, h: T.H,
      sizing: { type: "cover", w: T.W - imgX, h: T.H },
    });

    // Text on left panel
    var tx = 0.65, tw = panelW - 1.1;

    // AdCraft mark
    slide.addText("ADCRAFT", {
      x: tx, y: 0.52, w: tw, h: 0.18,
      fontSize: 8, color: T.color.accentLight,
      fontFace: T.font.body, bold: false, charSpacing: 3.5,
    });

    // Plan name — large serif
    slide.addText(planName, {
      x: tx, y: 1.0, w: tw, h: 2.8,
      fontSize: T.size.coverTitle, color: T.color.white,
      fontFace: T.font.heading, bold: true,
      wrap: true,
    });

    // Rule
    slide.addShape("line", {
      x: tx, y: 3.9, w: 1.2, h: 0,
      line: { color: T.color.accentLight, pt: 1.5 },
    });

    // Subtitle tag
    slide.addText("Advertising Strategy", {
      x: tx, y: 4.1, w: tw, h: 0.28,
      fontSize: T.size.coverSubtitle, color: T.color.accentLight,
      fontFace: T.font.body, italic: false,
    });

    if (bizName) {
      slide.addText(bizName, {
        x: tx, y: 4.52, w: tw, h: 0.28,
        fontSize: 12, color: T.color.white,
        fontFace: T.font.body, bold: true,
      });
    }

    slide.addText(date, {
      x: tx, y: bizName ? 4.84 : 4.52, w: tw, h: 0.22,
      fontSize: T.size.coverMeta, color: T.color.accentLight,
      fontFace: T.font.body,
    });

    // Footer on left panel
    slide.addText("Prepared with AdCraft", {
      x: tx, y: 7.18, w: tw, h: 0.22,
      fontSize: T.size.footer, color: T.color.accentLight,
      fontFace: T.font.body,
    });

  } else {
    // ── Minimal cover — no illustration ──
    // Top accent bar (generous)
    slide.addShape("rect", {
      x: 0, y: 0, w: T.W, h: 2.2,
      fill: { color: T.color.accent },
      line: { color: T.color.accent },
    });

    // Subtle grid pattern on top bar
    for (var gi = 0; gi < 8; gi++) {
      slide.addShape("line", {
        x: 1.6 * gi, y: 0, w: 0, h: 2.2,
        line: { color: "5A2050", pt: 0.5 },
      });
    }

    // AdCraft mark in top bar
    slide.addText("ADCRAFT", {
      x: T.margin.x, y: 0.35, w: 3, h: 0.2,
      fontSize: 8, color: T.color.accentLight,
      fontFace: T.font.body, charSpacing: 4,
    });

    // Plan name below top bar — very large
    var cx = T.margin.x, cw = T.W - T.margin.x * 2;
    slide.addText(planName, {
      x: cx, y: 2.5, w: cw, h: 2.2,
      fontSize: T.size.coverTitle, color: T.color.fg,
      fontFace: T.font.heading, bold: true,
      wrap: true,
    });

    // Rule
    slide.addShape("line", {
      x: cx, y: 4.82, w: 1.0, h: 0,
      line: { color: T.color.accent, pt: 2 },
    });

    slide.addText("Advertising Strategy", {
      x: cx, y: 5.05, w: cw, h: 0.3,
      fontSize: T.size.coverSubtitle, color: T.color.accent,
      fontFace: T.font.body,
    });

    if (bizName) {
      slide.addText(bizName, {
        x: cx, y: 5.45, w: cw, h: 0.28,
        fontSize: 12, color: T.color.fg,
        fontFace: T.font.body, bold: true,
      });
    }

    slide.addText(date, {
      x: cx, y: bizName ? 5.78 : 5.45, w: cw, h: 0.22,
      fontSize: T.size.coverMeta, color: T.color.muted,
      fontFace: T.font.body,
    });

    slide.addText("Prepared with AdCraft", {
      x: 0, y: T.margin.footerY,
      w: T.W - T.margin.x, h: T.margin.footerH,
      fontSize: T.size.footer, color: T.color.mutedLight,
      fontFace: T.font.body, align: "right",
    });
  }
}

// ── 2. PLAN AT A GLANCE ───────────────────────────────────────────────────────
function slideAtAGlance(pptx, plan, meta) {
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Plan at a Glance", "Executive Summary");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;
  var budget = H.totalBudget(plan);

  // Hero row: key stats
  var stats = [];
  if (budget)                   stats.push({ label: "Monthly Budget",   value: H.fmtDollars(budget) });
  if (plan.who_to_target && plan.who_to_target.length)
    stats.push({ label: "Audiences",       value: String(plan.who_to_target.length) });
  if (plan.recommended_channels && plan.recommended_channels.length)
    stats.push({ label: "Channels",        value: String(plan.recommended_channels.length) });
  if (meta && meta.goal)        stats.push({ label: "Primary Goal",     value: H.trunc(meta.goal, 22) });

  var tileH = 1.05;
  if (stats.length) {
    var sw = (cw - 0.2 * (stats.length - 1)) / stats.length;
    stats.forEach(function(s, i) {
      H.addStatTile(slide, s.label, s.value, cx + i * (sw + 0.2), y, sw, tileH);
    });
    y += tileH + 0.28;
  }

  // Two body text sections — fill remaining space down to footer
  var bodyW = (cw - 0.3) / 2;
  var bodyAvailH = T.margin.footerY - 0.1 - y;
  var textH = bodyAvailH - 0.20; // label height

  if (plan.the_opportunity) {
    slide.addText("THE OPPORTUNITY", {
      x: cx, y: y, w: bodyW, h: 0.18,
      fontSize: T.size.sectionLabel, color: T.color.accent,
      fontFace: T.font.body, charSpacing: 2,
    });
    slide.addText(H.trunc(plan.the_opportunity, 500), {
      x: cx, y: y + 0.20, w: bodyW, h: textH,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
  }

  if (plan.recommended_approach) {
    var r2x = cx + bodyW + 0.3;
    slide.addText("STRATEGIC APPROACH", {
      x: r2x, y: y, w: bodyW, h: 0.18,
      fontSize: T.size.sectionLabel, color: T.color.accent,
      fontFace: T.font.body, charSpacing: 2,
    });
    slide.addText(H.trunc(plan.recommended_approach, 500), {
      x: r2x, y: y + 0.20, w: bodyW, h: textH,
      fontSize: T.size.body, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });
  }
}

// ── 3. BUSINESS OBJECTIVE ─────────────────────────────────────────────────────
function slideObjective(pptx, plan) {
  if (!plan.the_opportunity && !plan.what_advertising_needs_to_do) return;
  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Business Objective", "Strategy");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  // Left/right split: Opportunity | What Advertising Needs to Do
  var hasLeft  = !!(plan.the_opportunity);
  var hasRight = !!(plan.what_advertising_needs_to_do);

  var objAvailH = T.margin.footerY - 0.1 - y;

  if (hasLeft && hasRight) {
    var colW = (cw - 0.4) / 2;
    var rightX = cx + colW + 0.4;
    var textH2 = objAvailH - 0.20;

    // Left — opportunity
    slide.addText("THE OPPORTUNITY", {
      x: cx, y: y, w: colW, h: 0.18,
      fontSize: T.size.sectionLabel, color: T.color.accent,
      fontFace: T.font.body, charSpacing: 2,
    });
    slide.addText(H.trunc(plan.the_opportunity, 500), {
      x: cx, y: y + 0.20, w: colW, h: textH2,
      fontSize: T.size.h2, color: T.color.fg,
      fontFace: T.font.heading, bold: false,
      wrap: true, italic: true,
    });

    // Vertical rule
    slide.addShape("line", {
      x: cx + colW + 0.2, y: y, w: 0, h: objAvailH,
      line: { color: T.color.border, pt: 0.75 },
    });

    // Right — what advertising needs to do
    slide.addText("WHAT ADVERTISING NEEDS TO DO", {
      x: rightX, y: y, w: colW, h: 0.18,
      fontSize: T.size.sectionLabel, color: T.color.accent,
      fontFace: T.font.body, charSpacing: 2,
    });
    slide.addText(H.trunc(plan.what_advertising_needs_to_do, 500), {
      x: rightX, y: y + 0.20, w: colW, h: textH2,
      fontSize: T.size.body + 1, color: T.color.fg,
      fontFace: T.font.body, wrap: true,
    });

  } else {
    // Single section — full width, large
    var single = plan.the_opportunity || plan.what_advertising_needs_to_do;
    var singleLabel = plan.the_opportunity ? "THE OPPORTUNITY" : "WHAT ADVERTISING NEEDS TO DO";
    slide.addText(singleLabel, {
      x: cx, y: y, w: cw, h: 0.18,
      fontSize: T.size.sectionLabel, color: T.color.accent,
      fontFace: T.font.body, charSpacing: 2,
    });
    slide.addText(H.trunc(single, 600), {
      x: cx, y: y + 0.20, w: cw, h: objAvailH - 0.20,
      fontSize: T.size.h2, color: T.color.fg,
      fontFace: T.font.heading, bold: false, wrap: true, italic: true,
    });
  }

  // Strategic POV below — muted, smaller
  if (plan.your_advertising_strategy) {
    H.addRule(slide, cx, y, cw * 0.25);
    slide.addText("STRATEGIC POINT OF VIEW", {
      x: cx, y: y + 0.12, w: cw, h: 0.15,
      fontSize: T.size.sectionLabel, color: T.color.muted,
      fontFace: T.font.body, charSpacing: 2,
    });
    slide.addText(H.trunc(plan.your_advertising_strategy, 280), {
      x: cx, y: y + 0.28, w: cw, h: 0.9,
      fontSize: T.size.body, color: T.color.muted,
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

  if (meta && meta.geography) {
    slide.addText("Geography: " + meta.geography, {
      x: cx, y: y, w: cw, h: 0.18,
      fontSize: T.size.small, color: T.color.muted,
      fontFace: T.font.body,
    });
    y += 0.24;
  }

  var audiences = plan.who_to_target.slice(0, 4);
  var availH = T.margin.footerY - 0.1 - y;
  var cols = audiences.length <= 2 ? audiences.length : 2;
  var rows = Math.ceil(audiences.length / cols);
  var colGap = 0.25, rowGap = 0.18;
  var cardW = (cw - colGap * (cols - 1)) / cols;
  var cardH = (availH - rowGap * (rows - 1)) / rows;

  audiences.forEach(function(aud, i) {
    var col = i % cols;
    var row = Math.floor(i / cols);
    var ax = cx + col * (cardW + colGap);
    var ay = y + row * (cardH + rowGap);

    H.addCard(slide, ax, ay, cardW, cardH);

    // Audience number badge
    slide.addShape("rect", {
      x: ax + T.card.pad, y: ay + T.card.pad,
      w: 0.26, h: 0.26,
      fill: { color: T.color.accent },
      line: { color: T.color.accent },
      rectRadius: 0.03,
    });
    slide.addText(String(i + 1), {
      x: ax + T.card.pad, y: ay + T.card.pad,
      w: 0.26, h: 0.26,
      fontSize: 10, color: T.color.white,
      fontFace: T.font.body, bold: true,
      align: "center", valign: "middle",
    });

    // Audience name
    slide.addText(H.trunc(aud.audience_group || "", 45), {
      x: ax + T.card.pad + 0.34, y: ay + T.card.pad + 0.02,
      w: cardW - T.card.pad * 2 - 0.36, h: 0.24,
      fontSize: T.size.h3, color: T.color.accent,
      fontFace: T.font.heading, bold: true,
    });

    // Description
    var descY = ay + T.card.pad + 0.34;
    var descH = cardH - T.card.pad * 2 - 0.36;
    slide.addText(H.trunc(aud.description || "", 240), {
      x: ax + T.card.pad, y: descY,
      w: cardW - T.card.pad * 2, h: descH,
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

  var totalAvailH = T.margin.footerY - 0.1 - y;
  var hasCols = !!(plan.campaign_timing || plan.creative);

  // Split: top portion for pull-quote, bottom for detail columns
  var quoteH = hasCols ? Math.min(totalAvailH * 0.45, 1.65) : totalAvailH;
  var quoteTextH = quoteH - 0.1;

  // Large italic pull-quote approach statement
  slide.addText(H.trunc(plan.recommended_approach, 320), {
    x: cx, y: y, w: cw * 0.76, h: quoteTextH,
    fontSize: T.size.h2 + 2, color: T.color.fg,
    fontFace: T.font.heading, bold: false,
    wrap: true, italic: true,
  });

  // Decorative quote mark
  slide.addText("\u201c", {
    x: T.W - T.margin.x - 1.8, y: y - 0.15,
    w: 1.8, h: 1.2,
    fontSize: 110, color: T.color.accentLight,
    fontFace: T.font.heading, bold: false,
    align: "right",
  });

  if (hasCols) {
    var ruleY = y + quoteH;
    H.addRule(slide, cx, ruleY, cw * 0.2);
    var colStartY = ruleY + 0.18;

    // Campaign approach + creative direction side by side
    var cols = [];
    if (plan.campaign_timing) cols.push({ label: "CAMPAIGN APPROACH", text: plan.campaign_timing });
    if (plan.creative)         cols.push({ label: "CREATIVE DIRECTION", text: plan.creative });

    var colW = cols.length === 1 ? cw : (cw - 0.3) / 2;
    var colAvailH = T.margin.footerY - 0.1 - colStartY;
    cols.forEach(function(col, i) {
      var colX = cx + i * (colW + 0.3);
      slide.addText(col.label, {
        x: colX, y: colStartY, w: colW, h: 0.15,
        fontSize: T.size.sectionLabel, color: T.color.accent,
        fontFace: T.font.body, charSpacing: 2,
      });
      slide.addText(H.trunc(col.text, 360), {
        x: colX, y: colStartY + 0.18, w: colW, h: colAvailH - 0.18,
        fontSize: T.size.body, color: T.color.fg,
        fontFace: T.font.body, wrap: true,
      });
    });
  }
}

// ── 6. CHANNEL PLAN ───────────────────────────────────────────────────────────
function slideChannels(pptx, plan) {
  if (!plan.recommended_channels || !plan.recommended_channels.length) return;

  var channels = plan.recommended_channels;
  var pageSize = 4;
  var pages = Math.ceil(channels.length / pageSize);

  for (var p = 0; p < pages; p++) {
    var group = channels.slice(p * pageSize, (p + 1) * pageSize);
    var slide = pptx.addSlide();
    slide.background = { color: T.color.bg };
    var pageLabel = pages > 1 ? " (" + (p + 1) + "/" + pages + ")" : "";
    var y = H.addSlideHeader(slide, "Channel Plan" + pageLabel, "Channels");
    H.addFooter(slide);

    var cx = T.margin.x, cw = T.W - T.margin.x * 2;
    var availH = T.margin.footerY - 0.1 - y;
    var cardH = (availH - 0.12 * (group.length - 1)) / group.length;
    cardH = Math.min(cardH, 1.45);

    group.forEach(function(ch, i) {
      var cy = y + i * (cardH + 0.12);
      H.addCard(slide, cx, cy, cw, cardH);

      // Left: channel name block (accent bg strip)
      var nameW = 2.2;
      slide.addShape("rect", {
        x: cx, y: cy, w: nameW, h: cardH,
        fill: { color: T.color.accentLight },
        line: { color: T.color.border, pt: 0.75 },
        rectRadius: T.card.r,
      });

      slide.addText(H.trunc(ch.channel || "", 22), {
        x: cx + T.card.pad, y: cy,
        w: nameW - T.card.pad * 2, h: cardH * 0.68,
        fontSize: T.size.h3 - 1, color: T.color.accent,
        fontFace: T.font.heading, bold: true,
        valign: "bottom", wrap: true,
      });

      // Role
      if (ch.role) {
        slide.addText(H.trunc(ch.role, 30), {
          x: cx + T.card.pad, y: cy + cardH * 0.68,
          w: nameW - T.card.pad * 2, h: cardH * 0.28,
          fontSize: T.size.small, color: T.color.muted,
          fontFace: T.font.body, valign: "top",
        });
      }

      // Right: rationale
      var bodyX = cx + nameW + 0.18;
      var bodyW2 = cw - nameW - 0.18 - T.card.pad;

      // Budget
      var budgetEntry = (plan.budget || []).find(function(b) {
        return (b.channel || "").toLowerCase() === (ch.channel || "").toLowerCase();
      });
      var hasAmt = !!(budgetEntry);
      var amtW = hasAmt ? 1.4 : 0;

      if (hasAmt) {
        slide.addText(H.fmtDollars(budgetEntry.monthly_investment) + "/mo", {
          x: cx + cw - amtW - T.card.pad, y: cy + T.card.pad,
          w: amtW, h: 0.25,
          fontSize: 11, color: T.color.accent,
          fontFace: T.font.heading, bold: true, align: "right",
        });
      }

      var body = H.trunc(ch.why || ch.what_to_run || "", 220);
      if (body) {
        slide.addText(body, {
          x: bodyX, y: cy + T.card.pad,
          w: bodyW2 - amtW - 0.1, h: cardH - T.card.pad * 2,
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

  // Total budget hero — right-aligned large stat
  slide.addText("TOTAL / MONTH", {
    x: T.W - T.margin.x - 3.2, y: y, w: 3.2, h: 0.15,
    fontSize: T.size.sectionLabel, color: T.color.muted,
    fontFace: T.font.body, charSpacing: 2, align: "right",
  });
  slide.addText(H.fmtDollars(total), {
    x: T.W - T.margin.x - 3.2, y: y + 0.15, w: 3.2, h: 0.58,
    fontSize: T.size.kpi, color: T.color.accent,
    fontFace: T.font.heading, bold: true, align: "right",
  });

  y += 0.88;

  // Horizontal bar chart
  var barMaxW = cw - 3.8;
  var labelW = 2.4;
  var amtW = 1.3;
  var barAreaX = cx + labelW + 0.1;
  var barH = 0.3;
  var barGap = 0.12;

  var maxInv = Math.max.apply(null, plan.budget.map(function(b) {
    return parseFloat(String(b.monthly_investment || 0).replace(/[^0-9.]/g, "")) || 0;
  }));

  plan.budget.forEach(function(b, i) {
    var inv = parseFloat(String(b.monthly_investment || 0).replace(/[^0-9.]/g, "")) || 0;
    var barW = maxInv > 0 ? Math.max((inv / maxInv) * barMaxW, 0.06) : 0.06;
    var by = y + i * (barH + barGap);

    // Channel label
    slide.addText(H.trunc(b.channel || "", 20), {
      x: cx, y: by, w: labelW, h: barH,
      fontSize: 10, color: T.color.fg,
      fontFace: T.font.body, valign: "middle",
    });

    // Bar background track
    slide.addShape("rect", {
      x: barAreaX, y: by + 0.04, w: barMaxW, h: barH - 0.08,
      fill: { color: T.color.borderLight },
      line: { color: T.color.borderLight },
      rectRadius: 0.02,
    });

    // Bar fill
    slide.addShape("rect", {
      x: barAreaX, y: by + 0.04, w: barW, h: barH - 0.08,
      fill: { color: T.color.accent },
      line: { color: T.color.accent },
      rectRadius: 0.02,
    });

    // Amount and pct — right of bar
    var pct = b.percentage ? " · " + H.fmtPct(b.percentage) : "";
    slide.addText(H.fmtDollars(inv) + pct, {
      x: barAreaX + barMaxW + 0.12, y: by, w: amtW, h: barH,
      fontSize: 9, color: T.color.muted,
      fontFace: T.font.body, valign: "middle",
    });
  });
}

// ── 8. CAMPAIGN / MESSAGING ───────────────────────────────────────────────────
function slideCampaign(pptx, plan) {
  // Handle both array and object forms of messaging
  var msgs = null;
  if (Array.isArray(plan.messaging)) {
    msgs = plan.messaging.slice(0, 4);
  } else if (plan.messaging && typeof plan.messaging === "object") {
    // Object with territory/tone/key_messages
    msgs = null; // handled separately below
  }

  if (msgs !== null && msgs.length === 0) return;
  if (!plan.messaging) return;

  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Campaign Approach", "Messaging & Creative");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  if (msgs && msgs.length) {
    // Array of messaging territories
    var cols = msgs.length <= 2 ? msgs.length : 2;
    var rows = Math.ceil(msgs.length / cols);
    var colGap = 0.25, rowGap = 0.18;
    var availH = T.margin.footerY - 0.1 - y;
    var cardW = (cw - colGap * (cols - 1)) / cols;
    var cardH = (availH - rowGap * (rows - 1)) / rows;

    msgs.forEach(function(msg, i) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var mx = cx + col * (cardW + colGap);
      var my = y + row * (cardH + rowGap);
      H.addCard(slide, mx, my, cardW, cardH);

      // Territory
      slide.addText(H.trunc(msg.territory || "", 50), {
        x: mx + T.card.pad, y: my + T.card.pad,
        w: cardW - T.card.pad * 2, h: 0.24,
        fontSize: T.size.h3, color: T.color.accent,
        fontFace: T.font.heading, bold: true,
      });

      // Rationale
      slide.addText(H.trunc(msg.rationale || "", 200), {
        x: mx + T.card.pad, y: my + T.card.pad + 0.28,
        w: cardW - T.card.pad * 2, h: cardH - T.card.pad * 2 - 0.3,
        fontSize: T.size.body, color: T.color.fg,
        fontFace: T.font.body, wrap: true,
      });
    });

  } else {
    // Object form: territory, tone, key_messages
    var m = plan.messaging;
    var sections = [];
    if (m.territory)     sections.push({ label: "MESSAGE TERRITORY",  text: m.territory });
    if (m.tone)          sections.push({ label: "TONE OF VOICE",      text: m.tone });
    if (m.key_messages)  {
      var kmText = Array.isArray(m.key_messages) ? m.key_messages.join(" · ") : m.key_messages;
      sections.push({ label: "KEY MESSAGES", text: kmText });
    }

    var secAvailH = T.margin.footerY - 0.1 - y;
    var secSlotH = secAvailH / Math.max(sections.length, 1);
    sections.forEach(function(sec, i) {
      var sy = y + i * secSlotH;
      slide.addText(sec.label, {
        x: cx, y: sy, w: cw, h: 0.15,
        fontSize: T.size.sectionLabel, color: T.color.accent,
        fontFace: T.font.body, charSpacing: 2,
      });
      slide.addText(H.trunc(sec.text, 360), {
        x: cx, y: sy + 0.17, w: cw, h: secSlotH - 0.22,
        fontSize: T.size.body, color: T.color.fg,
        fontFace: T.font.body, wrap: true,
      });
    });
  }
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

  var cx = T.margin.x, colGap = 0.35;
  var colW = (T.W - T.margin.x * 2 - colGap) / 2;
  var availH = T.margin.footerY - 0.1 - y;

  function addKpiColumn(title, items, x) {
    slide.addText(title.toUpperCase(), {
      x: x, y: y, w: colW, h: 0.15,
      fontSize: T.size.sectionLabel, color: T.color.accent,
      fontFace: T.font.body, charSpacing: 2,
    });

    var itemH = (availH - 0.28) / Math.min(items.length, 6);
    itemH = Math.min(itemH, 0.88);

    items.slice(0, 6).forEach(function(item, i) {
      var iy = y + 0.22 + i * (itemH + 0.08);
      H.addCard(slide, x, iy, colW, itemH);

      // Number dot
      slide.addShape("rect", {
        x: x + T.card.pad, y: iy + (itemH - 0.2) / 2,
        w: 0.18, h: 0.18,
        fill: { color: T.color.accent },
        line: { color: T.color.accent },
        rectRadius: 0.09,
      });
      slide.addText(H.trunc(item, 130), {
        x: x + T.card.pad + 0.26, y: iy + T.card.pad,
        w: colW - T.card.pad * 2 - 0.28, h: itemH - T.card.pad * 2,
        fontSize: T.size.body, color: T.color.fg,
        fontFace: T.font.body, wrap: true,
      });
    });
  }

  if (business.length) addKpiColumn("Business Outcomes", business, cx);
  if (media.length)    addKpiColumn("Media Signals", media, cx + colW + colGap);
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
    { label: "Launch",   days: "Days 1–30",   text: lp.days_1_30  || "", num: "01" },
    { label: "Learn",    days: "Days 31–60",  text: lp.days_31_60 || "", num: "02" },
    { label: "Optimize", days: "Days 61–90",  text: lp.days_61_90 || "", num: "03" },
  ].filter(function(p) { return p.text; });

  if (!phases.length) return;

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  // Collect all items as a flat checklist, grouped by phase
  // Each phase gets a label row + one checklist item row per sentence/bullet
  var allRows = [];
  phases.forEach(function(phase) {
    allRows.push({ type: "phase", label: phase.label, days: phase.days });
    // Split text into individual action items (by period, semicolon, or newline)
    var items = phase.text
      .split(/(?<=[.;])\s+|\n+/)
      .map(function(s) { return s.trim().replace(/[.;]+$/, ""); })
      .filter(function(s) { return s.length > 4; });
    if (!items.length) items = [phase.text.trim()];
    items.forEach(function(item) {
      allRows.push({ type: "item", text: item });
    });
  });

  // Add smart next moves as their own section
  var moves = (plan.smart_next_moves || []).slice(0, 5);
  if (moves.length) {
    allRows.push({ type: "phase", label: "Quick Wins", days: "Start Now" });
    moves.forEach(function(m) {
      allRows.push({ type: "item", text: m });
    });
  }

  var phaseRowH = 0.30;
  var itemRowH  = 0.36;
  var rowGap    = 0.06;
  var availH    = T.margin.footerY - 0.1 - y;

  // Calculate total height to see if we need to compress
  var totalH = allRows.reduce(function(sum, r) {
    return sum + (r.type === "phase" ? phaseRowH : itemRowH) + rowGap;
  }, 0);
  if (totalH > availH) {
    // Compress item height proportionally
    var phaseRows  = allRows.filter(function(r) { return r.type === "phase"; }).length;
    var itemRows   = allRows.filter(function(r) { return r.type === "item"; }).length;
    var fixedH     = phaseRows * (phaseRowH + rowGap);
    itemRowH       = Math.max((availH - fixedH) / itemRows - rowGap, 0.24);
  }

  var checkboxW = 0.22, checkboxH = 0.18;
  var textIndent = checkboxW + 0.14;
  var labelW = 2.0;

  var ry = y;
  allRows.forEach(function(row) {
    if (row.type === "phase") {
      // Phase header: accent pill label + days tag
      slide.addShape("rect", {
        x: cx, y: ry, w: labelW, h: phaseRowH,
        fill: { color: T.color.accent },
        line: { color: T.color.accent },
        rectRadius: 0.04,
      });
      slide.addText(row.label.toUpperCase(), {
        x: cx + T.card.pad, y: ry,
        w: labelW - T.card.pad * 2 - 0.8, h: phaseRowH,
        fontSize: 9, color: T.color.white,
        fontFace: T.font.body, bold: true,
        valign: "middle",
      });
      slide.addText(row.days, {
        x: cx + labelW - 0.78, y: ry,
        w: 0.72, h: phaseRowH,
        fontSize: T.size.small, color: T.color.accentLight,
        fontFace: T.font.body, valign: "middle", align: "right",
      });
      ry += phaseRowH + rowGap;
    } else {
      // Checklist item row
      var itemY = ry + (itemRowH - checkboxH) / 2;

      // Checkbox outline
      slide.addShape("rect", {
        x: cx + 0.08, y: itemY,
        w: checkboxH, h: checkboxH,
        fill: { color: T.color.bgWhite },
        line: { color: T.color.border, pt: 1 },
        rectRadius: 0.03,
      });

      // Item text
      slide.addText(H.trunc(row.text, 180), {
        x: cx + 0.08 + textIndent, y: ry,
        w: cw - textIndent - 0.1, h: itemRowH,
        fontSize: T.size.body, color: T.color.fg,
        fontFace: T.font.body, wrap: true, valign: "middle",
      });

      // Light row separator
      if (ry + itemRowH + rowGap < T.margin.footerY - 0.15) {
        slide.addShape("line", {
          x: cx + 0.08, y: ry + itemRowH + rowGap * 0.5,
          w: cw - 0.1, h: 0,
          line: { color: T.color.borderLight, pt: 0.4 },
        });
      }

      ry += itemRowH + rowGap;
    }
  });
}

// ── 11. OPTIMIZATION ──────────────────────────────────────────────────────────
function slideOptimization(pptx, plan) {
  var realloc  = plan.budget_reallocation;
  var actions  = plan.channel_actions;
  if (!realloc || !realloc.length) return;

  var slide = pptx.addSlide();
  slide.background = { color: T.color.bg };
  var y = H.addSlideHeader(slide, "Budget Optimization", "Optimization");
  H.addFooter(slide);

  var cx = T.margin.x, cw = T.W - T.margin.x * 2;

  // Key insight
  if (plan.performance_snapshot && plan.performance_snapshot.key_insight) {
    slide.addText(H.trunc(plan.performance_snapshot.key_insight, 180), {
      x: cx, y: y, w: cw, h: 0.34,
      fontSize: T.size.body, color: T.color.muted,
      fontFace: T.font.body, wrap: true, italic: true,
    });
    y += 0.40;
  }

  // Column layout
  var colW = [2.5, 1.25, 1.3, 1.2, 0.92, 0];
  colW[5] = cw - colW.slice(0, 5).reduce(function(a, b) { return a + b; }, 0) - 0.3;
  var colX = [cx];
  for (var ci = 1; ci < colW.length; ci++) {
    colX.push(colX[ci - 1] + colW[ci - 1] + 0.06);
  }

  // Column headers
  var headers = ["Channel", "Current", "Recommended", "Change", "Action", "Rationale"];
  headers.forEach(function(h, i) {
    slide.addText(h.toUpperCase(), {
      x: colX[i], y: y, w: colW[i], h: 0.18,
      fontSize: T.size.sectionLabel - 1, color: T.color.muted,
      fontFace: T.font.body, charSpacing: 1,
    });
  });
  H.addRule(slide, cx, y + 0.2, cw, T.color.border);
  y += 0.28;

  var rowH = 0.44;
  realloc.slice(0, 8).forEach(function(row, i) {
    var ry = y + i * rowH;

    // Alternating row tint
    if (i % 2 === 0) {
      slide.addShape("rect", {
        x: cx - 0.04, y: ry - 0.03, w: cw + 0.08, h: rowH,
        fill: { color: T.color.accentLight },
        line: { color: T.color.accentLight },
      });
    }

    var changeDollars = row.change_dollars != null
      ? row.change_dollars
      : ((row.recommended_budget || 0) - (row.current_budget || 0));
    var changeColor = changeDollars > 0 ? T.color.scale.increase
                    : changeDollars < 0 ? T.color.scale.decrease
                    : T.color.scale.neutral;
    var changeStr = changeDollars > 0
      ? "+" + H.fmtDollars(changeDollars)
      : H.fmtDollars(changeDollars);

    var actionObj = actions && actions.find(function(a) {
      return (a.channel || "").toLowerCase() === (row.channel || "").toLowerCase();
    });
    var action = actionObj ? actionObj.action : (row.direction || "");

    slide.addText(H.trunc(row.channel, 24),                 { x: colX[0], y: ry, w: colW[0], h: rowH, fontSize: 9,  color: T.color.fg,    fontFace: T.font.body, valign: "middle" });
    slide.addText(H.fmtDollars(row.current_budget),         { x: colX[1], y: ry, w: colW[1], h: rowH, fontSize: 9,  color: T.color.muted, fontFace: T.font.body, valign: "middle" });
    slide.addText(H.fmtDollars(row.recommended_budget),     { x: colX[2], y: ry, w: colW[2], h: rowH, fontSize: 9,  color: T.color.fg,    fontFace: T.font.body, valign: "middle", bold: true });
    slide.addText(changeStr,                                 { x: colX[3], y: ry, w: colW[3], h: rowH, fontSize: 9,  color: changeColor,   fontFace: T.font.body, valign: "middle", bold: true });
    if (action) H.addActionBadge(slide, action, colX[4], ry + 0.12);
    if (row.rationale) {
      slide.addText(H.trunc(row.rationale, 110), { x: colX[5], y: ry, w: colW[5], h: rowH, fontSize: T.size.small, color: T.color.muted, fontFace: T.font.body, valign: "middle", wrap: true });
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
