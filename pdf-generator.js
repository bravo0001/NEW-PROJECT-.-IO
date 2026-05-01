// ═══════════════════════════════════════════════════
// APL Nexus — PDF Report Generator
// ═══════════════════════════════════════════════════

import { jsPDF } from 'jspdf';
import { store } from './store.js';

const COLORS = {
  primary: [99, 102, 241],
  purple: [168, 85, 247],
  dark: [10, 10, 15],
  cardBg: [22, 22, 31],
  text: [240, 240, 245],
  muted: [139, 139, 160],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  white: [255, 255, 255],
};

function addHeader(doc, title) {
  // Gradient bar at top
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 8, 'F');
  doc.setFillColor(...COLORS.purple);
  doc.rect(105, 0, 105, 8, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text('APL Nexus', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text('Activity & Program Intelligence Report', 14, 28);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 50);
  doc.text(title, 14, 42);

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 48);

  // Separator line
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  doc.line(14, 52, 196, 52);

  return 58; // Return Y position after header
}

function addFooter(doc, pageNum) {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(`APL Nexus Report — Page ${pageNum} of ${pageCount}`, 14, 288);
  doc.text(`Confidential`, 196, 288, { align: 'right' });
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.2);
  doc.line(14, 284, 196, 284);
}

function addSectionTitle(doc, y, title) {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, y, 3, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 50);
  doc.text(title, 20, y + 5.5);
  doc.setDrawColor(230, 230, 240);
  doc.setLineWidth(0.2);
  doc.line(14, y + 10, 196, y + 10);
  return y + 16;
}

function addField(doc, y, label, value) {
  if (!value || value === 'undefined' || value === 'null') return y;
  if (y > 270) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(label.toUpperCase(), 16, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 60);
  const lines = doc.splitTextToSize(String(value), 170);
  doc.text(lines, 16, y + 5);
  return y + 5 + (lines.length * 4.2) + 4;
}

function addMultiLineField(doc, y, label, value) {
  if (!value) return y;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(label.toUpperCase(), 16, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 60);

  const textLines = value.split('\n');
  for (const line of textLines) {
    const wrapped = doc.splitTextToSize(line.replace(/^[•\-]\s*/, '  •  '), 172);
    for (const wl of wrapped) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(wl, 16, y);
      y += 4.2;
    }
  }
  return y + 4;
}

function addMetricRow(doc, y, items) {
  if (y > 255) { doc.addPage(); y = 20; }
  const colWidth = 178 / items.length;
  items.forEach((item, i) => {
    const x = 16 + (i * colWidth);
    // Box background
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(x, y, colWidth - 4, 18, 2, 2, 'F');
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(item.label, x + 4, y + 5.5);
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 50);
    doc.text(String(item.value), x + 4, y + 13);
  });
  return y + 24;
}

// ═══════════════════════════════════════════
// Generate PDF for a single APL
// ═══════════════════════════════════════════
export function generateAPLReport(aplId) {
  const a = store.getAPL(aplId);
  if (!a) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = addHeader(doc, a.name);

  // Key Metrics
  y = addMetricRow(doc, y, [
    { label: 'Type', value: a.type || '—' },
    { label: 'Participants', value: `${a.actualParticipants || '—'} / ${a.expectedParticipants || '—'}` },
    { label: 'Success Rating', value: `${a.successRating || '—'} / 10` },
    { label: 'Feedback', value: `${a.feedbackScore || '—'} / 5` },
  ]);
  y = addMetricRow(doc, y, [
    { label: 'Date', value: new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { label: 'Duration', value: a.duration || '—' },
    { label: 'Budget Planned', value: `₹${(a.budgetPlanned || 0).toLocaleString()}` },
    { label: 'Budget Actual', value: `₹${(a.budgetActual || 0).toLocaleString()}` },
  ]);

  // Section A: Metadata
  y = addSectionTitle(doc, y, 'A. Event Metadata');
  y = addField(doc, y, 'Location', a.location);
  y = addField(doc, y, 'Target Audience', a.targetAudience);
  y = addField(doc, y, 'Tags', (a.tags || []).map(t => '#' + t).join('  '));
  y = addField(doc, y, 'Status', a.status);

  // Section B: Objectives & Outcomes
  y = addSectionTitle(doc, y, 'B. Objectives & Outcomes');
  y = addMultiLineField(doc, y, 'Objectives', a.objectives);
  y = addMultiLineField(doc, y, 'Outcomes', a.outcomes);

  // Section C: Execution
  y = addSectionTitle(doc, y, 'C. Execution Details');
  y = addMultiLineField(doc, y, 'Key Activities', a.activities);
  y = addMultiLineField(doc, y, 'Resource Utilization', a.resourceUtilization);
  y = addField(doc, y, 'Timeline Adherence', a.timelineAdherence);

  // Section D: Participation
  y = addSectionTitle(doc, y, 'D. Participation Analysis');
  y = addMultiLineField(doc, y, 'Demographics', a.demographics);
  y = addField(doc, y, 'Engagement Level', a.engagementLevel);

  // Section E: Learnings
  y = addSectionTitle(doc, y, 'E. Key Learnings');
  y = addMultiLineField(doc, y, 'What Worked Well ✓', a.whatWorked);
  y = addMultiLineField(doc, y, 'What Didn\'t Work ✗', a.whatDidntWork);
  y = addMultiLineField(doc, y, 'Unexpected Insights', a.unexpectedInsights);

  // Section F: Impact
  y = addSectionTitle(doc, y, 'F. Impact Assessment');
  y = addMultiLineField(doc, y, 'Immediate Outcomes', a.immediateOutcomes);
  y = addMultiLineField(doc, y, 'Follow-up Actions', a.followUpActions);
  y = addMultiLineField(doc, y, 'Long-term Value', a.longTermValue);

  // Section H: Recommendations
  y = addSectionTitle(doc, y, 'H. Recommendations');
  y = addMultiLineField(doc, y, 'Recommendations', a.recommendations);

  // Section G: Photos
  if (a.photos && a.photos.length > 0) {
    y = addSectionTitle(doc, y, `G. Event Photos (${a.photos.length})`);
    for (const photo of a.photos) {
      try {
        const src = photo.url || photo;
        // Only base64 images can be embedded directly in jsPDF
        if (src.startsWith('data:image')) {
          if (y > 200) { doc.addPage(); y = 20; }
          doc.addImage(src, 'JPEG', 16, y, 80, 60);
          if (photo.caption) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...COLORS.muted);
            doc.text(photo.caption, 16, y + 63);
          }
          y += 68;
        } else {
          // External URLs — add as text links
          y = addField(doc, y, photo.caption || 'Photo', src);
        }
      } catch { /* skip failed images */ }
    }
  }

  // Add footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  doc.save(`APL-Report-${a.name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}.pdf`);
}

// ═══════════════════════════════════════════
// Generate summary PDF for all APLs
// ═══════════════════════════════════════════
export function generateSummaryReport() {
  const apls = store.getAllAPLs();
  const stats = store.getStats();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = addHeader(doc, 'APL Portfolio Summary Report');

  // Overview metrics
  y = addMetricRow(doc, y, [
    { label: 'Total APLs', value: stats.total },
    { label: 'Total Participants', value: stats.totalParticipants.toLocaleString() },
    { label: 'Avg Rating', value: `${stats.avgRating} / 10` },
    { label: 'Total Budget', value: `₹${(stats.totalBudget / 1000).toFixed(0)}K` },
  ]);

  // APL Table
  y = addSectionTitle(doc, y, 'All APLs Overview');

  // Table header
  doc.setFillColor(240, 240, 248);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  const cols = [14, 80, 110, 130, 150, 170];
  const headers = ['Name', 'Type', 'Date', 'Participants', 'Rating', 'Budget'];
  headers.forEach((h, i) => doc.text(h.toUpperCase(), cols[i] + 2, y + 5.5));
  y += 10;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  apls.forEach(a => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setTextColor(50, 50, 60);
    doc.text(doc.splitTextToSize(a.name, 62)[0], cols[0] + 2, y + 4);
    doc.text(a.type || '—', cols[1] + 2, y + 4);
    doc.text(new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }), cols[2] + 2, y + 4);
    doc.text(String(a.actualParticipants || '—'), cols[3] + 2, y + 4);

    // Color-coded rating
    const rating = a.successRating || 0;
    doc.setTextColor(...(rating >= 8 ? COLORS.success : rating >= 5 ? COLORS.warning : COLORS.danger));
    doc.text(`${rating}/10`, cols[4] + 2, y + 4);
    doc.setTextColor(50, 50, 60);

    doc.text(`₹${((a.budgetActual || 0) / 1000).toFixed(0)}K`, cols[5] + 2, y + 4);

    doc.setDrawColor(235, 235, 240);
    doc.setLineWidth(0.15);
    doc.line(14, y + 7, 196, y + 7);
    y += 9;
  });

  y += 8;

  // Top Learnings Section
  y = addSectionTitle(doc, y, 'Key Learnings Across All APLs');

  const allWorked = apls.filter(a => a.whatWorked).slice(0, 3);
  const allDidnt = apls.filter(a => a.whatDidntWork).slice(0, 3);

  if (allWorked.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.success);
    doc.text('What Worked Well:', 16, y);
    y += 5;
    allWorked.forEach(a => {
      y = addField(doc, y, a.name, a.whatWorked.split('\n')[0]);
    });
  }

  if (allDidnt.length) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.danger);
    doc.text('Areas for Improvement:', 16, y);
    y += 5;
    allDidnt.forEach(a => {
      y = addField(doc, y, a.name, a.whatDidntWork.split('\n')[0]);
    });
  }

  // Footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  doc.save(`APL-Summary-Report-${new Date().toISOString().split('T')[0]}.pdf`);
}
