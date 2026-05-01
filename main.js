import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import { store } from './store.js';
import { renderDashboard, renderAPLsList, renderCreateForm, renderAnalytics, renderTimeline, renderLearnings, renderAPLDetail } from './pages.js';
import { renderChatWidget, initChatEvents } from './chatbot.js';
import { generateAPLReport, generateSummaryReport } from './pdf-generator.js';
import { compressImage, resolveImageUrl, scrapeUrl, isGoogleDriveUrl, parseGoogleDriveUrl } from './media-manager.js';

// Temporary photos array for the current form
let formPhotos = [];

const container = document.getElementById('page-container');
const mainContent = document.getElementById('main-content');
let currentPage = 'dashboard';
let currentEditId = null;

// Inject chat widget
mainContent.insertAdjacentHTML('beforeend', renderChatWidget());
initChatEvents();

function navigate(page, params) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));

  switch (page) {
    case 'dashboard': container.innerHTML = renderDashboard(); initDashboardCharts(); break;
    case 'apls': container.innerHTML = renderAPLsList(params?.search); break;
    case 'create': container.innerHTML = renderCreateForm(params?.editId); initFormEvents(); break;
    case 'analytics': container.innerHTML = renderAnalytics(); initAnalyticsCharts(); break;
    case 'timeline': container.innerHTML = renderTimeline(); break;
    case 'learnings': container.innerHTML = renderLearnings(); break;
    case 'detail': container.innerHTML = renderAPLDetail(params?.id); break;
  }
  container.scrollTop = 0;
  updateStorageInfo();
}

// Chart colors
const C = { purple:'#a855f7', blue:'#3b82f6', green:'#10b981', amber:'#f59e0b', red:'#ef4444', pink:'#ec4899', indigo:'#6366f1' };
const chartDefaults = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#8b8ba0', font:{family:'Inter'} } } }, scales:{ x:{ ticks:{color:'#5a5a70'}, grid:{color:'rgba(255,255,255,0.04)'} }, y:{ ticks:{color:'#5a5a70'}, grid:{color:'rgba(255,255,255,0.04)'} } } };

function initDashboardCharts() {
  const stats = store.getStats();
  // Types pie chart
  const typesCtx = document.getElementById('chart-types');
  if (typesCtx) {
    new Chart(typesCtx, { type:'doughnut', data:{ labels:Object.keys(stats.types), datasets:[{ data:Object.values(stats.types), backgroundColor:[C.purple,C.blue,C.green,C.amber,C.pink,C.indigo,C.red], borderWidth:0, borderRadius:4 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{color:'#8b8ba0',font:{family:'Inter'},padding:16} } } }
    });
  }
  // Trend chart
  const trendCtx = document.getElementById('chart-trend');
  if (trendCtx) {
    const months = Object.keys(stats.monthlyData).sort();
    new Chart(trendCtx, { type:'line', data:{ labels:months.map(m=>{const[y,mo]=m.split('-');return new Date(y,mo-1).toLocaleDateString('en-IN',{month:'short',year:'2-digit'})}),
      datasets:[{ label:'Participants', data:months.map(m=>stats.monthlyData[m].participants), borderColor:C.purple, backgroundColor:'rgba(168,85,247,0.1)', fill:true, tension:0.4, pointRadius:5, pointBackgroundColor:C.purple }] },
      options:chartDefaults });
  }
}

function initAnalyticsCharts() {
  const stats = store.getStats();
  const apls = store.getAllAPLs();
  // Ratings bar
  const ratingsCtx = document.getElementById('chart-ratings');
  if (ratingsCtx) {
    new Chart(ratingsCtx, { type:'bar', data:{ labels:apls.map(a=>a.name.substring(0,20)),
      datasets:[{ label:'Rating /10', data:apls.map(a=>a.successRating||0), backgroundColor:apls.map(a=>(a.successRating||0)>=8?C.green:(a.successRating||0)>=5?C.amber:C.red), borderRadius:6, barPercentage:0.6 }] },
      options:{...chartDefaults, plugins:{legend:{display:false}}} });
  }
  // Budget comparison
  const budgetCtx = document.getElementById('chart-budget');
  if (budgetCtx) {
    new Chart(budgetCtx, { type:'bar', data:{ labels:apls.map(a=>a.name.substring(0,20)),
      datasets:[
        { label:'Planned', data:apls.map(a=>(a.budgetPlanned||0)/1000), backgroundColor:'rgba(99,102,241,0.3)', borderRadius:6, barPercentage:0.6 },
        { label:'Actual', data:apls.map(a=>(a.budgetActual||0)/1000), backgroundColor:C.indigo, borderRadius:6, barPercentage:0.6 }
      ] }, options:chartDefaults });
  }
  // Tags chart
  const tagsCtx = document.getElementById('chart-tags');
  if (tagsCtx) {
    const tagEntries = Object.entries(stats.tags).sort((a,b)=>b[1]-a[1]).slice(0,15);
    new Chart(tagsCtx, { type:'bar', data:{ labels:tagEntries.map(e=>'#'+e[0]),
      datasets:[{ label:'Frequency', data:tagEntries.map(e=>e[1]), backgroundColor:C.purple, borderRadius:6, barPercentage:0.5 }] },
      options:{...chartDefaults, indexAxis:'y', plugins:{legend:{display:false}}} });
  }
}

function initFormEvents() {
  const form = document.getElementById('apl-form');
  // Load existing photos if editing
  const editId = form.dataset.editId;
  if (editId) {
    const existing = store.getAPL(editId);
    formPhotos = existing?.photos ? [...existing.photos] : [];
  } else {
    formPhotos = [];
  }

  // Section tabs
  document.querySelectorAll('.section-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`[data-section-panel="${tab.dataset.section}"]`).classList.add('active');
    });
  });

  // Photo upload from file
  document.getElementById('photo-upload')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (formPhotos.length + files.length > 10) {
      showToast('Maximum 10 photos allowed.', 'error');
      return;
    }
    for (const file of files) {
      try {
        const dataUrl = await compressImage(file);
        formPhotos.push({ url: dataUrl, caption: file.name.replace(/\.[^.]+$/, ''), type: 'upload' });
      } catch { showToast('Failed to process: ' + file.name, 'error'); }
    }
    refreshPhotoGrid();
    showToast(`${files.length} photo(s) added!`, 'success');
  });

  // Photo from URL / Google Drive
  document.getElementById('btn-add-photo-url')?.addEventListener('click', () => {
    const input = document.getElementById('photo-url-input');
    const url = input.value.trim();
    if (!url) return;
    if (formPhotos.length >= 10) { showToast('Maximum 10 photos.', 'error'); return; }
    const resolved = resolveImageUrl(url);
    const type = isGoogleDriveUrl(url) ? 'gdrive' : 'url';
    formPhotos.push({ url: resolved, originalUrl: url, caption: '', type });
    refreshPhotoGrid();
    input.value = '';
    showToast(`Photo added from ${type === 'gdrive' ? 'Google Drive' : 'URL'}!`, 'success');
  });

  // Web scraper
  document.getElementById('btn-scrape')?.addEventListener('click', async () => {
    const url = document.getElementById('scraper-url-input').value.trim();
    if (!url) return;
    const resultsDiv = document.getElementById('scraper-results');
    resultsDiv.innerHTML = '<div class="scraper-loading">🔍 Scraping page...</div>';
    const result = await scrapeUrl(url);
    if (!result.success) {
      resultsDiv.innerHTML = `<div class="scraper-card"><p style="color:var(--danger)">❌ Failed: ${result.error}</p></div>`;
      return;
    }
    resultsDiv.innerHTML = `
      <div class="scraper-card">
        <h4>${result.title || 'No title'}</h4>
        <p>${result.description || result.textContent?.substring(0, 200) || 'No description found.'}</p>
        ${result.headings.length ? `<div style="margin-bottom:8px"><strong style="font-size:0.8rem;color:var(--text-muted)">HEADINGS:</strong> ${result.headings.slice(0,5).map(h=>`<span class="tag">${h}</span>`).join(' ')}</div>` : ''}
        <button type="button" class="btn btn-sm btn-secondary" id="btn-scrape-fill">📝 Auto-fill name & description</button>
        ${result.images.length ? `
          <div style="margin-top:12px"><strong style="font-size:0.8rem;color:var(--text-muted)">IMAGES FOUND (${result.images.length}) — click to add:</strong></div>
          <div class="scraper-images">
            ${result.images.slice(0,12).map((img,i) => `
              <div class="scraper-img-item" data-scraper-img="${i}">
                <img src="${img.src}" alt="${img.alt}" loading="lazy" onerror="this.parentElement.style.display='none'">
              </div>`).join('')}
          </div>` : ''}
      </div>`;

    // Auto-fill button
    document.getElementById('btn-scrape-fill')?.addEventListener('click', () => {
      const nameInput = form.querySelector('[name="name"]');
      const objInput = form.querySelector('[name="objectives"]');
      if (nameInput && !nameInput.value && result.title) nameInput.value = result.title;
      if (objInput && !objInput.value && result.description) objInput.value = result.description;
      showToast('Form auto-filled from scraped data!', 'success');
    });

    // Click scraped images to add as photos
    resultsDiv.querySelectorAll('[data-scraper-img]').forEach(el => {
      el.addEventListener('click', () => {
        if (formPhotos.length >= 10) { showToast('Max 10 photos.', 'error'); return; }
        const idx = parseInt(el.dataset.scraperImg);
        const img = result.images[idx];
        el.classList.toggle('selected');
        if (el.classList.contains('selected')) {
          formPhotos.push({ url: img.src, caption: img.alt || '', type: 'scraped' });
          refreshPhotoGrid();
          showToast('Photo added from scraped page!', 'success');
        }
      });
    });
  });

  // Submit — include photos
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {};
    for (const [k,v] of fd.entries()) {
      if (k === 'tags') data[k] = v.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean);
      else if (['expectedParticipants','actualParticipants','budgetPlanned','budgetActual','successRating'].includes(k)) data[k] = v ? Number(v) : null;
      else if (k === 'feedbackScore') data[k] = v ? parseFloat(v) : null;
      else data[k] = v;
    }
    data.photos = formPhotos;
    const eid = form.dataset.editId;
    if (eid) { store.updateAPL(eid, data); showToast('APL updated successfully!', 'success'); }
    else { store.createAPL(data); showToast('APL created successfully!', 'success'); }
    navigate('apls');
  });
}

function refreshPhotoGrid() {
  const grid = document.getElementById('photo-preview-grid');
  if (!grid) return;
  grid.innerHTML = formPhotos.map((p, i) => `
    <div class="photo-thumb" data-photo-idx="${i}">
      <img src="${p.url || p}" alt="${p.caption || 'Photo '+(i+1)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23888%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2212%22>Error</text></svg>'">
      <button type="button" class="photo-remove" data-remove-photo="${i}">✕</button>
    </div>`).join('');
  // Remove handlers
  grid.querySelectorAll('[data-remove-photo]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      formPhotos.splice(parseInt(btn.dataset.removePhoto), 1);
      refreshPhotoGrid();
      showToast('Photo removed.', 'info');
    });
  });
}

function showToast(msg, type='info') {
  const tc = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span><span>${msg}</span>`;
  tc.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(10px)'; setTimeout(()=>t.remove(),300); }, 3000);
}

function updateStorageInfo() {
  const count = store.getCount();
  document.getElementById('storage-text').textContent = `${count} APL${count!==1?'s':''} stored`;
  document.getElementById('storage-fill').style.width = `${Math.min(count*5,100)}%`;
}

// Global event delegation
document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { e.preventDefault(); navigate(nav.dataset.nav); return; }
  const view = e.target.closest('[data-view]');
  if (view) { e.preventDefault(); navigate('detail', {id:view.dataset.view}); return; }
  const edit = e.target.closest('[data-edit]');
  if (edit) { e.preventDefault(); navigate('create', {editId:edit.dataset.edit}); return; }
  const del = e.target.closest('[data-delete]');
  if (del) {
    e.preventDefault();
    if (confirm('Delete this APL permanently?')) {
      store.deleteAPL(del.dataset.delete);
      showToast('APL deleted.', 'info');
      navigate('apls');
    }
    return;
  }
  const pdfSingle = e.target.closest('[data-pdf-single]');
  if (pdfSingle) {
    e.preventDefault();
    generateAPLReport(pdfSingle.dataset.pdfSingle);
    showToast('PDF report downloaded!', 'success');
    return;
  }
  const pdfSummary = e.target.closest('[data-pdf-summary]');
  if (pdfSummary) {
    e.preventDefault();
    generateSummaryReport();
    showToast('Summary PDF downloaded!', 'success');
    return;
  }
  const filterType = e.target.closest('[data-filter-type]');
  if (filterType) {
    document.querySelectorAll('[data-filter-type]').forEach(f=>f.classList.remove('active'));
    filterType.classList.add('active');
    const type = filterType.dataset.filterType;
    const apls = type === 'all' ? store.getAllAPLs() : store.filterAPLs({type});
    // Re-render table body
    navigate('apls');
  }
  // Lightbox for gallery images
  const galleryItem = e.target.closest('[data-lightbox]');
  if (galleryItem) {
    const imgs = document.querySelectorAll('[data-lightbox]');
    const allSrcs = Array.from(imgs).map(el => el.querySelector('img')?.src).filter(Boolean);
    let idx = parseInt(galleryItem.dataset.lightbox);
    openLightbox(allSrcs, idx);
  }
});

function openLightbox(images, startIdx) {
  let idx = startIdx;
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  const render = () => {
    overlay.innerHTML = `
      <button class="lightbox-close">&times;</button>
      ${images.length > 1 ? `<button class="lightbox-nav lightbox-prev">&lsaquo;</button>` : ''}
      <img src="${images[idx]}" alt="Photo ${idx+1}">
      ${images.length > 1 ? `<button class="lightbox-nav lightbox-next">&rsaquo;</button>` : ''}
    `;
    overlay.querySelector('.lightbox-close').onclick = () => overlay.remove();
    overlay.querySelector('.lightbox-prev')?.addEventListener('click', (e) => { e.stopPropagation(); idx = (idx - 1 + images.length) % images.length; render(); });
    overlay.querySelector('.lightbox-next')?.addEventListener('click', (e) => { e.stopPropagation(); idx = (idx + 1) % images.length; render(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  };
  render();
  document.body.appendChild(overlay);
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); }
    if (e.key === 'ArrowLeft') { idx = (idx - 1 + images.length) % images.length; render(); }
    if (e.key === 'ArrowRight') { idx = (idx + 1) % images.length; render(); }
  });
}

// Sidebar nav
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => { e.preventDefault(); navigate(item.dataset.page); });
});

// Search
let searchTimeout;
document.getElementById('global-search').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const q = e.target.value.trim();
    if (q) navigate('apls', {search:q});
    else if (currentPage === 'apls') navigate('apls');
  }, 300);
});

// Export/Import
document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([store.exportData()], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `apl-nexus-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  showToast('Data exported!', 'success');
});
document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try { store.importData(ev.target.result); showToast('Data imported!', 'success'); navigate(currentPage); }
    catch(err) { showToast('Import failed: ' + err.message, 'error'); }
  };
  reader.readAsText(file);
});

// Sidebar toggle (mobile)
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Init
navigate('dashboard');
