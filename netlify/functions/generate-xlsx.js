const ExcelJS = require('exceljs');

exports.handler = async function(event) {
  // Only allow POST
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }

  let p;
  try {
    p = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AdCraft';
  wb.created = new Date();

  // ── Colors ──
  const DEEP_PURPLE = '4A1040';
  const MID_PURPLE  = '7A2060';
  const LAVENDER    = 'F0E8EE';
  const OFF_WHITE   = 'FAF6ED';
  const SURFACE     = 'F5EFE4';
  const WHITE       = 'FFFFFF';
  const BODY_TEXT   = '1A1A1A';

  function titleFill(hex) {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
  }

  function titleFont(hex, sz, bold) {
    return { name: 'Arial', size: sz, bold: !!bold, color: { argb: 'FF' + hex } };
  }

  // ══════════════════════════════════════
  // SHEET 1: Ad Plan
  // ══════════════════════════════════════
  const ws = wb.addWorksheet('Ad Plan');
  ws.columns = [
    { width: 24 },
    { width: 72 },
    { width: 20 },
    { width: 20 }
  ];

  function addTitleRow(text, bgHex, fgHex, sz) {
    const row = ws.addRow([text, '', '', '']);
    ws.mergeCells(row.number, 1, row.number, 4);
    row.height = sz >= 16 ? 36 : 28;
    const cell = row.getCell(1);
    cell.value = text;
    cell.font = titleFont(fgHex, sz, true);
    cell.fill = titleFill(bgHex);
    cell.alignment = { vertical: 'middle', wrapText: false };
    return row;
  }

  function addSectionBanner(text) {
    const row = ws.addRow([text, '', '', '']);
    ws.mergeCells(row.number, 1, row.number, 4);
    row.height = 24;
    const cell = row.getCell(1);
    cell.value = text;
    cell.font = titleFont(WHITE, 11, true);
    cell.fill = titleFill(MID_PURPLE);
    cell.alignment = { vertical: 'middle', wrapText: false };
    return row;
  }

  function addSpacer() {
    const row = ws.addRow(['', '', '', '']);
    row.height = 8;
    return row;
  }

  function addBodyRow(text, alt) {
    const bg = alt ? 'FAF8FF' : WHITE;
    const row = ws.addRow([text, '', '', '']);
    ws.mergeCells(row.number, 1, row.number, 4);
    const len = String(text || '').length;
    row.height = Math.max(20, Math.min(210, Math.ceil(len / 90) * 14 + 10));
    const cell = row.getCell(1);
    cell.value = text || '';
    cell.font = titleFont(BODY_TEXT, 10, false);
    cell.fill = titleFill(bg);
    cell.alignment = { vertical: 'top', wrapText: true };
    return row;
  }

  function addSubHeader(text) {
    const row = ws.addRow([text, '', '', '']);
    ws.mergeCells(row.number, 1, row.number, 4);
    row.height = 20;
    const cell = row.getCell(1);
    cell.value = text;
    cell.font = titleFont(DEEP_PURPLE, 10, true);
    cell.fill = titleFill(LAVENDER);
    cell.alignment = { vertical: 'top', wrapText: true };
    return row;
  }

  function addLabelValue(label, value, alt) {
    const bg = alt ? SURFACE : OFF_WHITE;
    const row = ws.addRow([label, value, '', '']);
    ws.mergeCells(row.number, 2, row.number, 4);
    row.height = 20;
    const lCell = row.getCell(1);
    lCell.value = label;
    lCell.font = titleFont(MID_PURPLE, 10, true);
    lCell.fill = titleFill(bg);
    lCell.alignment = { vertical: 'top', wrapText: false };
    const vCell = row.getCell(2);
    vCell.value = value || '';
    vCell.font = titleFont(BODY_TEXT, 10, false);
    vCell.fill = titleFill(alt ? 'FAF8FF' : WHITE);
    vCell.alignment = { vertical: 'top', wrapText: true };
    return row;
  }

  // Title
  addTitleRow('AdCraft — Advertising Plan', DEEP_PURPLE, WHITE, 16);
  addTitleRow(p.plan_name || '', MID_PURPLE, WHITE, 13);
  addSpacer();

  // Inputs
  const inputs = [
    ['Business Name', p.business_name || ''],
    ['Primary Goal', p.primary_goal || ''],
    ['Geography', p.geography || ''],
    ['Monthly Budget', p.monthly_ad_budget ? '$' + p.monthly_ad_budget : ''],
    ['Budget Tier', p.budget_tier || ''],
    ['Status', p.status || 'Ready']
  ];
  inputs.forEach((iv, i) => addLabelValue(iv[0], iv[1], i % 2 === 1));
  addSpacer();

  // Strategy
  addSectionBanner('Your Advertising Strategy');
  addBodyRow(p.your_advertising_strategy || '', false);
  addSpacer();

  // Opportunity
  addSectionBanner('The Opportunity');
  addBodyRow(p.the_opportunity || '', false);
  addSpacer();

  // What Advertising Needs to Do
  addSectionBanner('What Advertising Needs to Do');
  addBodyRow(p.what_advertising_needs_to_do || '', false);
  addSpacer();

  // Recommended Approach
  addSectionBanner('Recommended Approach');
  addBodyRow(p.recommended_approach || '', false);
  addSpacer();

  // Channels
  addSectionBanner('Where to Advertise');
  (p.recommended_channels || []).forEach((ch, i) => {
    addSubHeader((i + 1) + '. ' + (ch.channel || ''));
    const detail = (ch.role || '')
      + (ch.what_to_run ? '\nWhat to run: ' + ch.what_to_run : '')
      + (ch.cta ? '\nCTA: ' + ch.cta : '')
      + (ch.why ? '\nWhy it earns its place: ' + ch.why : '');
    addBodyRow(detail, i % 2 === 1);
  });
  addSpacer();

  // Budget
  addSectionBanner('Budget');
  const budgetHeaderRow = ws.addRow(['Channel', 'Monthly Investment', '% of Budget', 'Purpose']);
  budgetHeaderRow.height = 20;
  ['Channel', 'Monthly Investment', '% of Budget', 'Purpose'].forEach((h, c) => {
    const cell = budgetHeaderRow.getCell(c + 1);
    cell.value = h;
    cell.font = titleFont(WHITE, 10, true);
    cell.fill = titleFill(MID_PURPLE);
    cell.alignment = { vertical: 'middle', wrapText: false };
  });
  (p.budget || []).forEach((b, i) => {
    const bg = i % 2 === 0 ? WHITE : 'FAF8FF';
    const row = ws.addRow([b.channel || '', b.monthly_investment ? '$' + b.monthly_investment : '', b.percentage || '', b.purpose || '']);
    row.height = 20;
    [1,2,3,4].forEach(c => {
      const cell = row.getCell(c);
      cell.font = titleFont(BODY_TEXT, 10, false);
      cell.fill = titleFill(bg);
      cell.alignment = { vertical: 'top', wrapText: c === 4 };
    });
  });
  addSpacer();

  // Audiences
  addSectionBanner('Who to Target');
  (p.who_to_target || []).forEach((a, i) => {
    const row = ws.addRow([a.audience_group || '', a.description || '', '', '']);
    ws.mergeCells(row.number, 2, row.number, 4);
    const len = String(a.description || '').length;
    row.height = Math.max(20, Math.min(210, Math.ceil(len / 72) * 14 + 10));
    const lc = row.getCell(1);
    lc.value = a.audience_group || '';
    lc.font = titleFont(DEEP_PURPLE, 10, true);
    lc.fill = titleFill(LAVENDER);
    lc.alignment = { vertical: 'top', wrapText: true };
    const vc = row.getCell(2);
    vc.value = a.description || '';
    vc.font = titleFont(BODY_TEXT, 10, false);
    vc.fill = titleFill(i % 2 === 0 ? WHITE : 'FAF8FF');
    vc.alignment = { vertical: 'top', wrapText: true };
  });
  addSpacer();

  // Messaging
  addSectionBanner('What Your Ads Should Say');
  (p.messaging || []).forEach((m, i) => {
    const row = ws.addRow([m.territory || '', m.rationale || '', '', '']);
    ws.mergeCells(row.number, 2, row.number, 4);
    const len = String(m.rationale || '').length;
    row.height = Math.max(20, Math.min(210, Math.ceil(len / 72) * 14 + 10));
    const lc = row.getCell(1);
    lc.value = m.territory || '';
    lc.font = titleFont(DEEP_PURPLE, 10, true);
    lc.fill = titleFill(LAVENDER);
    lc.alignment = { vertical: 'top', wrapText: true };
    const vc = row.getCell(2);
    vc.value = m.rationale || '';
    vc.font = titleFont(BODY_TEXT, 10, false);
    vc.fill = titleFill(i % 2 === 0 ? WHITE : 'FAF8FF');
    vc.alignment = { vertical: 'top', wrapText: true };
  });
  addSpacer();

  // Creative
  if (p.creative) {
    addSectionBanner('What the Ads Should Look Like');
    addBodyRow(p.creative, false);
    addSpacer();
  }

  // Timing
  if (p.campaign_timing) {
    addSectionBanner('Campaign Timing');
    addBodyRow(p.campaign_timing, false);
    addSpacer();
  }

  // KPIs
  if (p.how_to_measure_success) {
    addSectionBanner('How to Measure Success');
    const bo = p.how_to_measure_success.business_outcomes || [];
    const ms = p.how_to_measure_success.media_signals || [];
    let kpiText = '';
    if (bo.length) kpiText += 'Business Outcomes:\n' + bo.map(x => '• ' + x).join('\n');
    if (ms.length) kpiText += (kpiText ? '\n\n' : '') + 'Media Signals:\n' + ms.map(x => '• ' + x).join('\n');
    addBodyRow(kpiText, false);
    addSpacer();
  }

  // What Not to Do
  if (p.what_i_would_not_do && p.what_i_would_not_do.length) {
    addSectionBanner('What I Would Not Do');
    p.what_i_would_not_do.forEach((w, i) => {
      const row = ws.addRow([w.tactic || '', w.reason || '', '', '']);
      ws.mergeCells(row.number, 2, row.number, 4);
      const len = String(w.reason || '').length;
      row.height = Math.max(20, Math.min(120, Math.ceil(len / 72) * 14 + 10));
      const lc = row.getCell(1);
      lc.value = w.tactic || '';
      lc.font = titleFont(DEEP_PURPLE, 10, true);
      lc.fill = titleFill(LAVENDER);
      lc.alignment = { vertical: 'top', wrapText: true };
      const vc = row.getCell(2);
      vc.value = w.reason || '';
      vc.font = titleFont(BODY_TEXT, 10, false);
      vc.fill = titleFill(i % 2 === 0 ? WHITE : 'FAF8FF');
      vc.alignment = { vertical: 'top', wrapText: true };
    });
    addSpacer();
  }

  // Smart Moves
  if (p.smart_next_moves && p.smart_next_moves.length) {
    addSectionBanner('Smart Next Moves');
    p.smart_next_moves.forEach((m, i) => addBodyRow((i + 1) + '. ' + m, i % 2 === 1));
    addSpacer();
  }

  // 90-Day Plan
  if (p.launch_plan) {
    addSectionBanner('90-Day Launch Plan');
    const phases = [
      ['Days 1–30: Launch', p.launch_plan.days_1_30],
      ['Days 31–60: Optimize', p.launch_plan.days_31_60],
      ['Days 61–90: Scale', p.launch_plan.days_61_90]
    ];
    phases.forEach((ph, i) => {
      const row = ws.addRow([ph[0], ph[1] || '', '', '']);
      ws.mergeCells(row.number, 2, row.number, 4);
      const len = String(ph[1] || '').length;
      row.height = Math.max(20, Math.min(210, Math.ceil(len / 72) * 14 + 10));
      const lc = row.getCell(1);
      lc.value = ph[0];
      lc.font = titleFont(DEEP_PURPLE, 10, true);
      lc.fill = titleFill(LAVENDER);
      lc.alignment = { vertical: 'top', wrapText: true };
      const vc = row.getCell(2);
      vc.value = ph[1] || '';
      vc.font = titleFont(BODY_TEXT, 10, false);
      vc.fill = titleFill(i % 2 === 0 ? WHITE : 'FAF8FF');
      vc.alignment = { vertical: 'top', wrapText: true };
    });
    addSpacer();
  }

  // Assumptions
  if (p.assumptions && p.assumptions.length) {
    addSectionBanner('Assumptions');
    p.assumptions.forEach((a, i) => addBodyRow('• ' + a, i % 2 === 1));
  }

  // ══════════════════════════════════════
  // SHEET 2: Raw Data
  // ══════════════════════════════════════
  const rd = wb.addWorksheet('Raw Data');
  rd.columns = [{ width: 28 }, { width: 100 }];

  const rdHdr = rd.addRow(['Field', 'Value']);
  rdHdr.height = 22;
  [1, 2].forEach(c => {
    const cell = rdHdr.getCell(c);
    cell.font = titleFont(WHITE, 10, true);
    cell.fill = titleFill(DEEP_PURPLE);
    cell.alignment = { vertical: 'middle' };
  });

  const rdFields = [
    ['Plan Name', p.plan_name || ''],
    ['Business Name', p.business_name || ''],
    ['Primary Goal', p.primary_goal || ''],
    ['Geography', p.geography || ''],
    ['Monthly Ad Budget', p.monthly_ad_budget ? '$' + p.monthly_ad_budget : ''],
    ['Budget Tier', p.budget_tier || ''],
    ['Status', p.status || 'Ready'],
    ['Plan Output', JSON.stringify(p, null, 2)]
  ];

  rdFields.forEach((f, i) => {
    const row = rd.addRow([f[0], f[1]]);
    row.height = i === 7 ? 120 : 15;
    const lc = row.getCell(1);
    lc.value = f[0];
    lc.font = titleFont(MID_PURPLE, 9, true);
    lc.fill = titleFill(i % 2 === 0 ? 'FAF8FF' : WHITE);
    lc.alignment = { vertical: 'top' };
    const vc = row.getCell(2);
    vc.value = f[1];
    vc.font = { name: 'Arial', size: 9, color: { argb: 'FF' + BODY_TEXT } };
    vc.alignment = { vertical: 'top', wrapText: true };
  });

  // Write to buffer
  const buffer = await wb.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const planName = (p.plan_name || 'AdCraft-Plan').replace(/[^a-zA-Z0-9 _\-]/g, '').replace(/\s+/g, '-');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${planName}.xlsx"`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: base64,
    isBase64Encoded: true
  };
};
