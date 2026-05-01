import { store } from './store.js';
import { resolveImageUrl } from './media-manager.js';

export function renderDashboard() {
  const stats = store.getStats();
  const recent = store.getAllAPLs().slice(0, 5);
  return `
    <div class="page-header"><h1>📊 <span>Dashboard</span></h1></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon icon-purple">📋</div><div class="stat-value">${stats.total}</div><div class="stat-label">Total APLs</div></div>
      <div class="stat-card"><div class="stat-icon icon-blue">👥</div><div class="stat-value">${stats.totalParticipants.toLocaleString()}</div><div class="stat-label">Total Participants</div></div>
      <div class="stat-card"><div class="stat-icon icon-green">⭐</div><div class="stat-value">${stats.avgRating}</div><div class="stat-label">Avg Rating /10</div></div>
      <div class="stat-card"><div class="stat-icon icon-amber">💰</div><div class="stat-value">₹${(stats.totalBudget/1000).toFixed(0)}K</div><div class="stat-label">Total Budget</div></div>
    </div>
    <div class="grid-2">
      <div class="card"><h3 style="margin-bottom:16px;">Recent APLs</h3>
        ${recent.map(a => `<div class="learning-card clickable" data-view="${a.id}" style="cursor:pointer">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>${a.name}</strong><span class="badge badge-${a.successRating >= 8 ? 'success' : a.successRating >= 5 ? 'warning' : 'danger'}">${a.successRating}/10</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">${a.type} • ${new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} • ${a.actualParticipants || 0} participants</div>
        </div>`).join('')}
      </div>
      <div class="card"><h3 style="margin-bottom:16px;">APL Types Distribution</h3>
        <div class="chart-container"><canvas id="chart-types"></canvas></div>
      </div>
    </div>
    <div class="card" style="margin-top:20px"><h3 style="margin-bottom:16px;">Participation Trend</h3>
      <div class="chart-container"><canvas id="chart-trend"></canvas></div>
    </div>`;
}

export function renderAPLsList(searchQuery) {
  const apls = searchQuery ? store.searchAPLs(searchQuery) : store.getAllAPLs();
  const types = store.getAllTypes();
  if (apls.length === 0) {
    return `<div class="page-header"><h1>📄 <span>All APLs</span></h1><button class="btn btn-primary" data-nav="create">+ New APL</button></div>
      <div class="empty-state"><div class="empty-state-icon">📋</div><h3>No APLs Found</h3><p>${searchQuery ? 'No results matching your search.' : 'Start by documenting your first APL.'}</p><button class="btn btn-primary" data-nav="create">Create First APL</button></div>`;
  }
  return `
    <div class="page-header"><h1>📄 <span>All APLs</span> <span style="font-size:0.9rem;color:var(--text-muted)">(${apls.length})</span></h1><div style="display:flex;gap:8px"><button class="btn btn-secondary" data-pdf-summary="true">📄 Summary PDF</button><button class="btn btn-primary" data-nav="create">+ New APL</button></div></div>
    <div class="filters-bar">
      <button class="filter-chip active" data-filter-type="all">All</button>
      ${types.map(t => `<button class="filter-chip" data-filter-type="${t}">${t}</button>`).join('')}
    </div>
    <div class="table-wrapper"><table class="data-table"><thead><tr>
      <th>Name</th><th>Type</th><th>Date</th><th>Participants</th><th>Rating</th><th>Budget</th><th>Actions</th>
    </tr></thead><tbody>
      ${apls.map(a => `<tr class="clickable" data-view="${a.id}">
        <td><strong>${a.name}</strong><div style="margin-top:2px">${(a.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join('')}</div></td>
        <td><span class="badge badge-info">${a.type||'—'}</span></td>
        <td>${new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
        <td>${a.actualParticipants||'—'}/${a.expectedParticipants||'—'}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="success-meter" style="width:60px"><div class="success-meter-fill ${a.successRating>=8?'meter-green':a.successRating>=5?'meter-yellow':'meter-red'}" style="width:${(a.successRating||0)*10}%"></div></div><span>${a.successRating||0}/10</span></div></td>
        <td>₹${((a.budgetActual||0)/1000).toFixed(0)}K</td>
        <td><button class="btn btn-sm btn-secondary" data-edit="${a.id}" onclick="event.stopPropagation()">Edit</button> <button class="btn btn-sm btn-danger" data-delete="${a.id}" onclick="event.stopPropagation()">Del</button></td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

export function renderGenerateReport() {
  return `
    <div class="page-header"><h1>🚀 <span>GDGC Event Report Generator</span></h1></div>
    <div class="gen-report-intro card" style="border-left:3px solid var(--accent-primary);margin-bottom:24px">
      <p style="color:var(--text-secondary);line-height:1.7;margin:0">
        <strong style="color:var(--text-primary)">Paste your event link + Google Drive photos folder</strong> — the system will automatically scrape the event details, fetch your photos, and generate a complete APL report with embedded images.
      </p>
    </div>
    <div class="grid-2" style="gap:20px;margin-bottom:24px">
      <div class="card">
        <h3 style="margin-bottom:16px">🌐 Step 1: Event URL</h3>
        <div class="form-group">
          <label class="form-label">Paste the event page link</label>
          <input class="form-input" id="gen-event-url" placeholder="https://cloudonair.withgoogle.com/events/..." style="font-size:0.85rem">
          <small style="color:var(--text-muted)">Supports Google CloudOnAir, GDG events, or any public event page.</small>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:16px">📁 Step 2: Drive Photos Folder</h3>
        <div class="form-group">
          <label class="form-label">Paste the Google Drive folder link</label>
          <input class="form-input" id="gen-drive-url" placeholder="https://drive.google.com/drive/folders/..." style="font-size:0.85rem">
          <small style="color:var(--text-muted)">The folder should be publicly shared (Anyone with the link).</small>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
      <button class="btn btn-primary btn-lg" id="btn-generate-report" style="min-width:220px">🚀 Generate Report</button>
      <button class="btn btn-secondary" id="btn-gen-scrape-only">🔍 Scrape Event Only</button>
      <button class="btn btn-secondary" id="btn-gen-photos-only">📷 Fetch Photos Only</button>
    </div>
    <div id="gen-progress" class="gen-progress"></div>
    <div id="gen-preview" class="gen-preview"></div>`;
}

export function renderCreateForm(editId) {
  const apl = editId ? store.getAPL(editId) : null;
  const v = (f) => apl ? (apl[f]||'') : '';
  const title = apl ? 'Edit APL' : 'Document New APL';
  const sections = ['Metadata','Objectives','Execution','Participation','Learnings','Impact','Recommendations','Media & Scraper'];
  const existingPhotos = apl ? (apl.photos || []) : [];
  return `
    <div class="page-header"><h1>${apl?'✏️':'➕'} <span>${title}</span></h1></div>
    <div class="section-tabs">${sections.map((s,i)=>`<button class="section-tab ${i===0?'active':''}" data-section="${i}">${s}</button>`).join('')}</div>
    <form id="apl-form" data-edit-id="${editId||''}">
      <div class="form-section active" data-section-panel="0">
        <div class="card"><h3 style="margin-bottom:20px">A. Event Metadata</h3>
          <div class="form-group"><label class="form-label">Event Name *</label><input class="form-input" name="name" required value="${v('name')}" placeholder="e.g., Annual Tech Summit 2026"></div>
          <div class="form-row form-row-3">
            <div class="form-group"><label class="form-label">Start Date *</label><input class="form-input" type="date" name="date" required value="${v('date')}"></div>
            <div class="form-group"><label class="form-label">End Date</label><input class="form-input" type="date" name="endDate" value="${v('endDate')}"></div>
            <div class="form-group"><label class="form-label">Duration</label><input class="form-input" name="duration" value="${v('duration')}" placeholder="e.g., 3 days"></div>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group"><label class="form-label">Location</label><input class="form-input" name="location" value="${v('location')}" placeholder="Venue, City"></div>
            <div class="form-group"><label class="form-label">Type</label><select class="form-select" name="type"><option value="">Select type</option>
              ${['Conference','Workshop','Training','Outreach','Campaign','Seminar','Meetup','Hackathon','Other'].map(t=>`<option ${v('type')===t?'selected':''}>${t}</option>`).join('')}
            </select></div>
          </div>
          <div class="form-group"><label class="form-label">Target Audience</label><input class="form-input" name="targetAudience" value="${v('targetAudience')}" placeholder="Who was this for?"></div>
          <div class="form-row form-row-3">
            <div class="form-group"><label class="form-label">Expected Participants</label><input class="form-input" type="number" name="expectedParticipants" value="${v('expectedParticipants')}"></div>
            <div class="form-group"><label class="form-label">Actual Participants</label><input class="form-input" type="number" name="actualParticipants" value="${v('actualParticipants')}"></div>
            <div class="form-group"><label class="form-label">Success Rating (1-10)</label><input class="form-input" type="number" name="successRating" min="1" max="10" value="${v('successRating')}"></div>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group"><label class="form-label">Planned Budget (₹)</label><input class="form-input" type="number" name="budgetPlanned" value="${v('budgetPlanned')}"></div>
            <div class="form-group"><label class="form-label">Actual Budget (₹)</label><input class="form-input" type="number" name="budgetActual" value="${v('budgetActual')}"></div>
          </div>
          <div class="form-group"><label class="form-label">Tags (comma-separated)</label><input class="form-input" name="tags" value="${(v('tags')||[]).join(', ')}" placeholder="e.g., technology, workshop, youth"></div>
        </div>
      </div>
      <div class="form-section" data-section-panel="1">
        <div class="card"><h3 style="margin-bottom:20px">B. Objectives & Outcomes</h3>
          <div class="form-group"><label class="form-label">Stated Objectives</label><textarea class="form-textarea" name="objectives" placeholder="What were the goals?">${v('objectives')}</textarea></div>
          <div class="form-group"><label class="form-label">Outcomes & Results</label><textarea class="form-textarea" name="outcomes" placeholder="What was actually achieved?">${v('outcomes')}</textarea></div>
          <div class="form-group"><label class="form-label">Feedback Score (out of 5)</label><input class="form-input" type="number" name="feedbackScore" min="0" max="5" step="0.1" value="${v('feedbackScore')}"></div>
        </div>
      </div>
      <div class="form-section" data-section-panel="2">
        <div class="card"><h3 style="margin-bottom:20px">C. Execution Details</h3>
          <div class="form-group"><label class="form-label">Key Activities / Sessions</label><textarea class="form-textarea" name="activities" placeholder="List the main activities...">${v('activities')}</textarea></div>
          <div class="form-group"><label class="form-label">Resource Utilization</label><textarea class="form-textarea" name="resourceUtilization" placeholder="People, equipment, partnerships used...">${v('resourceUtilization')}</textarea></div>
          <div class="form-group"><label class="form-label">Timeline Adherence</label><textarea class="form-textarea" name="timelineAdherence" placeholder="Was the schedule followed? Any delays?">${v('timelineAdherence')}</textarea></div>
        </div>
      </div>
      <div class="form-section" data-section-panel="3">
        <div class="card"><h3 style="margin-bottom:20px">D. Participation Analysis</h3>
          <div class="form-group"><label class="form-label">Demographics Breakdown</label><textarea class="form-textarea" name="demographics" placeholder="Age, gender, background distribution...">${v('demographics')}</textarea></div>
          <div class="form-group"><label class="form-label">Engagement Level</label><select class="form-select" name="engagementLevel">
            ${['','Low','Medium','Medium-High','High','Very High'].map(l=>`<option ${v('engagementLevel')===l?'selected':''}>${l}</option>`).join('')}
          </select></div>
        </div>
      </div>
      <div class="form-section" data-section-panel="4">
        <div class="card"><h3 style="margin-bottom:20px">E. Key Learnings</h3>
          <div class="form-group"><label class="form-label">What Worked Well ✅</label><textarea class="form-textarea" name="whatWorked" placeholder="Successes and highlights...">${v('whatWorked')}</textarea></div>
          <div class="form-group"><label class="form-label">What Didn't Work ❌</label><textarea class="form-textarea" name="whatDidntWork" placeholder="Challenges and failures...">${v('whatDidntWork')}</textarea></div>
          <div class="form-group"><label class="form-label">Unexpected Insights 💡</label><textarea class="form-textarea" name="unexpectedInsights" placeholder="Surprises and discoveries...">${v('unexpectedInsights')}</textarea></div>
        </div>
      </div>
      <div class="form-section" data-section-panel="5">
        <div class="card"><h3 style="margin-bottom:20px">F. Impact Assessment</h3>
          <div class="form-group"><label class="form-label">Immediate Outcomes</label><textarea class="form-textarea" name="immediateOutcomes" placeholder="Direct results...">${v('immediateOutcomes')}</textarea></div>
          <div class="form-group"><label class="form-label">Follow-up Actions</label><textarea class="form-textarea" name="followUpActions" placeholder="What needs to happen next?">${v('followUpActions')}</textarea></div>
          <div class="form-group"><label class="form-label">Long-term Value</label><textarea class="form-textarea" name="longTermValue" placeholder="Lasting impact...">${v('longTermValue')}</textarea></div>
        </div>
      </div>
      <div class="form-section" data-section-panel="6">
        <div class="card"><h3 style="margin-bottom:20px">H. Recommendations</h3>
          <div class="form-group"><label class="form-label">Recommendations for Future</label><textarea class="form-textarea" name="recommendations" style="min-height:150px" placeholder="Process improvements, resource optimization...">${v('recommendations')}</textarea></div>
          <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">
            ${['completed','in-progress','planned','cancelled'].map(s=>`<option ${v('status')===s?'selected':''}>${s}</option>`).join('')}
          </select></div>
        </div>
      </div>
      <div class="form-section" data-section-panel="7">
        <div class="card">
          <h3 style="margin-bottom:20px">G. Media & Web Scraper</h3>
          <div class="form-group">
            <label class="form-label">📷 Upload Photos</label>
            <input class="form-input" type="file" id="photo-upload" accept="image/*" multiple>
            <small style="color:var(--text-muted)">Upload event photos (auto-compressed). Max 10 photos.</small>
          </div>
          <div class="form-group">
            <label class="form-label">🔗 Add Photo from URL or Google Drive</label>
            <div style="display:flex;gap:8px">
              <input class="form-input" id="photo-url-input" placeholder="Paste image URL or Google Drive sharing link..." style="flex:1">
              <button type="button" class="btn btn-secondary" id="btn-add-photo-url">Add</button>
            </div>
            <small style="color:var(--text-muted)">Supports direct image URLs and Google Drive share links.</small>
          </div>
          <div id="photo-preview-grid" class="photo-grid">
            ${existingPhotos.map((p,i) => `
              <div class="photo-thumb" data-photo-idx="${i}">
                <img src="${resolveImageUrl(p.url || p)}" alt="${p.caption || 'Photo '+(i+1)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23888%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2212%22>Error</text></svg>'">
                <button type="button" class="photo-remove" data-remove-photo="${i}">✕</button>
              </div>`).join('')}
          </div>
          <hr style="border-color:var(--border-color);margin:24px 0">
          <h3 style="margin-bottom:16px">🌐 Web Scraper</h3>
          <div class="form-group">
            <label class="form-label">Scrape Event Page</label>
            <div style="display:flex;gap:8px">
              <input class="form-input" id="scraper-url-input" placeholder="https://event-website.com/..." style="flex:1">
              <button type="button" class="btn btn-primary" id="btn-scrape">🔍 Scrape</button>
            </div>
            <small style="color:var(--text-muted)">Extract title, description, and images from any event webpage.</small>
          </div>
          <div id="scraper-results" class="scraper-results"></div>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;justify-content:flex-end">
        <button type="button" class="btn btn-secondary" data-nav="apls">Cancel</button>
        <button type="submit" class="btn btn-primary btn-lg">${apl?'💾 Update APL':'✅ Save APL'}</button>
      </div>
    </form>`;
}

export function renderAnalytics() {
  const stats = store.getStats();
  const apls = store.getAllAPLs();
  const budgetEff = apls.filter(a=>a.budgetPlanned&&a.budgetActual).map(a=>({name:a.name.substring(0,25),eff:((a.budgetActual/a.budgetPlanned)*100).toFixed(0)}));
  return `
    <div class="page-header"><h1>📈 <span>Analytics</span></h1></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon icon-green">📊</div><div class="stat-value">${stats.avgFeedback}</div><div class="stat-label">Avg Feedback /5</div></div>
      <div class="stat-card"><div class="stat-icon icon-purple">🏷️</div><div class="stat-value">${Object.keys(stats.tags).length}</div><div class="stat-label">Unique Tags</div></div>
      <div class="stat-card"><div class="stat-icon icon-blue">📅</div><div class="stat-value">${Object.keys(stats.monthlyData).length}</div><div class="stat-label">Active Months</div></div>
      <div class="stat-card"><div class="stat-icon icon-amber">👤</div><div class="stat-value">${apls.length ? Math.round(stats.totalParticipants/apls.length) : 0}</div><div class="stat-label">Avg Participants</div></div>
    </div>
    <div class="grid-2">
      <div class="card"><h3 style="margin-bottom:16px">Success Ratings</h3><div class="chart-container"><canvas id="chart-ratings"></canvas></div></div>
      <div class="card"><h3 style="margin-bottom:16px">Budget Efficiency</h3><div class="chart-container"><canvas id="chart-budget"></canvas></div></div>
    </div>
    <div class="card" style="margin-top:20px"><h3 style="margin-bottom:16px">Tag Frequency</h3><div class="chart-container"><canvas id="chart-tags"></canvas></div></div>
    <div class="card" style="margin-top:20px"><h3 style="margin-bottom:16px">Budget Efficiency per APL</h3>
      ${budgetEff.map(b=>`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="width:200px;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.name}</span>
        <div class="success-meter" style="flex:1"><div class="success-meter-fill ${b.eff<=100?'meter-green':'meter-yellow'}" style="width:${Math.min(b.eff,100)}%"></div></div>
        <span style="font-size:0.85rem;font-weight:600;width:50px">${b.eff}%</span>
      </div>`).join('')}
    </div>`;
}

export function renderTimeline() {
  const apls = store.getAllAPLs();
  return `
    <div class="page-header"><h1>🕐 <span>Timeline</span></h1></div>
    ${apls.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🕐</div><h3>No timeline data</h3><p>Create APLs to see them here.</p></div>' :
    `<div class="timeline">${apls.map(a => `
      <div class="timeline-item" data-view="${a.id}">
        <div class="timeline-date">${new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
        <div class="timeline-title">${a.name}</div>
        <div class="timeline-meta">
          <span class="badge badge-info">${a.type||'Event'}</span>
          <span style="margin-left:8px">👥 ${a.actualParticipants||'?'}</span>
          <span style="margin-left:8px">⭐ ${a.successRating||'?'}/10</span>
        </div>
        <div style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary)">${(a.objectives||'').substring(0,120)}${(a.objectives||'').length>120?'...':''}</div>
      </div>`).join('')}</div>`}`;
}

export function renderLearnings() {
  const apls = store.getAllAPLs();
  const worked = [], didnt = [], insights = [];
  apls.forEach(a => {
    if (a.whatWorked) worked.push({text:a.whatWorked,source:a.name});
    if (a.whatDidntWork) didnt.push({text:a.whatDidntWork,source:a.name});
    if (a.unexpectedInsights) insights.push({text:a.unexpectedInsights,source:a.name});
  });
  const renderList = (items, type, label) => items.length === 0 ? '' : items.map(i=>`
    <div class="learning-card"><div class="learning-type ${type}">${label}</div>
    <div class="learning-text">${i.text.replace(/\n/g,'<br>')}</div>
    <div class="learning-source">From: ${i.source}</div></div>`).join('');
  return `
    <div class="page-header"><h1>📖 <span>Key Learnings</span></h1></div>
    <div class="grid-2">
      <div><h3 style="margin-bottom:16px;color:var(--success)">✅ What Worked</h3>${renderList(worked,'success','SUCCESS')}</div>
      <div><h3 style="margin-bottom:16px;color:var(--warning)">❌ What Didn't Work</h3>${renderList(didnt,'warning','NEEDS IMPROVEMENT')}</div>
    </div>
    <div style="margin-top:24px"><h3 style="margin-bottom:16px;color:var(--info)">💡 Unexpected Insights</h3>${renderList(insights,'insight','INSIGHT')}</div>`;
}

export function renderAPLDetail(id) {
  const a = store.getAPL(id);
  if (!a) return '<div class="empty-state"><h3>APL not found</h3></div>';
  const field = (label, val) => val ? `<div><div class="detail-item-label">${label}</div><div class="detail-item-value">${val}</div></div>` : '';
  const textBlock = (text) => text ? `<div style="font-size:0.9rem;line-height:1.7;white-space:pre-line">${text}</div>` : '<span style="color:var(--text-muted)">Not documented</span>';
  return `
    <div class="page-header">
      <div><button class="btn btn-sm btn-secondary" data-nav="apls" style="margin-bottom:8px">← Back</button><h1>${a.name}</h1></div>
      <div style="display:flex;gap:8px"><button class="btn btn-primary" data-pdf-single="${a.id}">📄 PDF Report</button><button class="btn btn-secondary" data-edit="${a.id}">✏️ Edit</button><button class="btn btn-danger" data-delete="${a.id}">🗑️ Delete</button></div>
    </div>
    <div class="detail-section"><div class="detail-section-title">A. Event Metadata</div><div class="detail-grid">
      ${field('Type',a.type)}${field('Date',new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}))}
      ${field('End Date',a.endDate?new Date(a.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'')}
      ${field('Duration',a.duration)}${field('Location',a.location)}${field('Target Audience',a.targetAudience)}
      ${field('Expected Participants',a.expectedParticipants)}${field('Actual Participants',a.actualParticipants)}
      ${field('Budget Planned','₹'+(a.budgetPlanned||0).toLocaleString())}${field('Budget Actual','₹'+(a.budgetActual||0).toLocaleString())}
      ${field('Success Rating',`${a.successRating}/10`)}${field('Feedback Score',`${a.feedbackScore}/5`)}
      ${field('Status',a.status)}
    </div><div style="margin-top:12px">${(a.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join(' ')}</div></div>
    ${(a.photos && a.photos.length > 0) ? `
    <div class="detail-section"><div class="detail-section-title">G. Event Photos</div>
      <div class="photo-gallery">
        ${a.photos.map((p,i) => `
          <div class="gallery-item" data-lightbox="${i}">
            <img src="${resolveImageUrl(p.url || p)}" alt="${p.caption || a.name + ' photo '+(i+1)}" loading="lazy" onerror="this.parentElement.style.display='none'">
            ${p.caption ? `<div class="gallery-caption">${p.caption}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>` : ''}
    <div class="grid-2">
      <div class="detail-section"><div class="detail-section-title">B. Objectives</div>${textBlock(a.objectives)}</div>
      <div class="detail-section"><div class="detail-section-title">B. Outcomes</div>${textBlock(a.outcomes)}</div>
    </div>
    <div class="detail-section"><div class="detail-section-title">C. Key Activities</div>${textBlock(a.activities)}</div>
    <div class="grid-2">
      <div class="detail-section"><div class="detail-section-title">C. Resources</div>${textBlock(a.resourceUtilization)}</div>
      <div class="detail-section"><div class="detail-section-title">C. Timeline Adherence</div>${textBlock(a.timelineAdherence)}</div>
    </div>
    <div class="grid-2">
      <div class="detail-section"><div class="detail-section-title">D. Demographics</div>${textBlock(a.demographics)}</div>
      <div class="detail-section"><div class="detail-section-title">D. Engagement</div>${textBlock(a.engagementLevel)}</div>
    </div>
    <div class="grid-2">
      <div class="detail-section card" style="border-left:3px solid var(--success)"><div class="detail-section-title">E. What Worked ✅</div>${textBlock(a.whatWorked)}</div>
      <div class="detail-section card" style="border-left:3px solid var(--danger)"><div class="detail-section-title">E. What Didn't Work ❌</div>${textBlock(a.whatDidntWork)}</div>
    </div>
    <div class="detail-section card" style="border-left:3px solid var(--info)"><div class="detail-section-title">E. Unexpected Insights 💡</div>${textBlock(a.unexpectedInsights)}</div>
    <div class="grid-2">
      <div class="detail-section"><div class="detail-section-title">F. Immediate Outcomes</div>${textBlock(a.immediateOutcomes)}</div>
      <div class="detail-section"><div class="detail-section-title">F. Follow-up Actions</div>${textBlock(a.followUpActions)}</div>
    </div>
    <div class="detail-section"><div class="detail-section-title">F. Long-term Value</div>${textBlock(a.longTermValue)}</div>
    <div class="detail-section card" style="border-left:3px solid var(--accent-primary)"><div class="detail-section-title">H. Recommendations</div>${textBlock(a.recommendations)}</div>`;
}
