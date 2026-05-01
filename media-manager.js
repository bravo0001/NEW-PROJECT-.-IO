// ═══════════════════════════════════════════════════
// APL Nexus — Media Manager (Web Scraper, Google Drive, Photos)
// ═══════════════════════════════════════════════════

const CORS_PROXY = 'https://corsproxy.io/?url=';

// ─── Google Drive URL Conversion ───
export function parseGoogleDriveUrl(url) {
  if (!url) return null;
  let fileId = null;

  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) fileId = fileMatch[1];
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileId && openMatch) fileId = openMatch[1];
  const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (!fileId && ucMatch) fileId = ucMatch[1];

  if (!fileId) return null;
  return {
    fileId,
    thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    directView: `https://lh3.googleusercontent.com/d/${fileId}`,
    download: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}

export function parseDriveFolderId(url) {
  if (!url) return null;
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function isGoogleDriveUrl(url) {
  return url && url.includes('drive.google.com');
}

export function resolveImageUrl(url) {
  if (!url) return url;
  if (isGoogleDriveUrl(url)) {
    const parsed = parseGoogleDriveUrl(url);
    return parsed ? parsed.thumbnail : url;
  }
  return url;
}

// ─── Google Drive Folder: Fetch photos ───
export async function fetchDriveFolderPhotos(folderUrl) {
  const folderId = parseDriveFolderId(folderUrl);
  if (!folderId) return { success: false, error: 'Invalid Google Drive folder URL', photos: [] };

  const photos = [];

  // Strategy 1: Try the embedded folder view
  try {
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
    const resp = await fetch(CORS_PROXY + encodeURIComponent(embedUrl));
    if (resp.ok) {
      const html = await resp.text();
      // Extract file IDs from the HTML — they appear in various patterns
      const idPattern = /\/file\/d\/([a-zA-Z0-9_-]{20,})/g;
      const ids = new Set();
      let m;
      while ((m = idPattern.exec(html)) !== null) ids.add(m[1]);

      // Also try alternate pattern for embedded views
      const altPattern = /\["([a-zA-Z0-9_-]{20,})","[^"]*\.(jpg|jpeg|png|gif|webp|heic)/gi;
      while ((m = altPattern.exec(html)) !== null) ids.add(m[1]);

      // Third pattern — array entries with IDs
      const arrPattern = /"([a-zA-Z0-9_-]{25,})"/g;
      const allMatches = [];
      while ((m = arrPattern.exec(html)) !== null) allMatches.push(m[1]);
      // Filter likely file IDs (Google Drive IDs are typically 33 chars)
      allMatches.filter(id => id.length >= 25 && id.length <= 45 && !id.includes(' '))
        .slice(0, 30).forEach(id => ids.add(id));

      for (const id of ids) {
        photos.push({
          url: `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
          thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w400`,
          fullUrl: `https://lh3.googleusercontent.com/d/${id}`,
          driveId: id,
          caption: '',
          type: 'gdrive',
        });
      }
    }
  } catch (e) { /* Strategy 1 failed */ }

  // Strategy 2: Try regular folder page
  if (photos.length === 0) {
    try {
      const resp = await fetch(CORS_PROXY + encodeURIComponent(folderUrl));
      if (resp.ok) {
        const html = await resp.text();
        const idPattern = /\["([a-zA-Z0-9_-]{20,})","([^"]*?)"\]/g;
        let m;
        const ids = new Set();
        while ((m = idPattern.exec(html)) !== null) {
          if (m[1].length >= 20 && m[1].length <= 50) ids.add(m[1]);
        }
        // Fallback: any 33-char alphanumeric string
        const rawIds = html.match(/[a-zA-Z0-9_-]{28,40}/g) || [];
        rawIds.slice(0, 50).forEach(id => {
          if (!id.includes('http') && !id.includes('function') && !id.includes('script'))
            ids.add(id);
        });

        for (const id of Array.from(ids).slice(0, 20)) {
          photos.push({
            url: `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w400`,
            fullUrl: `https://lh3.googleusercontent.com/d/${id}`,
            driveId: id,
            caption: '',
            type: 'gdrive',
          });
        }
      }
    } catch (e) { /* Strategy 2 failed */ }
  }

  if (photos.length === 0) {
    return {
      success: false,
      error: 'Could not extract photos automatically. The folder may not be public, or it uses a format we cannot parse. Try adding individual Google Drive photo links manually.',
      photos: [],
      folderId,
      manualHint: true,
    };
  }

  return { success: true, photos, folderId, count: photos.length };
}

// ─── Web Scraper (enhanced for Google event pages) ───
export async function scrapeUrl(url) {
  try {
    const proxyUrl = CORS_PROXY + encodeURIComponent(url);
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract metadata
    const title = doc.querySelector('meta[property="og:title"]')?.content
      || doc.querySelector('title')?.textContent?.trim() || '';
    const description = doc.querySelector('meta[property="og:description"]')?.content
      || doc.querySelector('meta[name="description"]')?.content || '';
    const ogImage = doc.querySelector('meta[property="og:image"]')?.content || '';
    const siteName = doc.querySelector('meta[property="og:site_name"]')?.content || '';

    // Extract all images
    const images = [];
    if (ogImage) images.push({ src: ogImage, alt: 'Cover image' });

    doc.querySelectorAll('img[src]').forEach(img => {
      let src = img.src;
      try { src = new URL(src, url).href; } catch { /* skip */ }
      if (src && src.startsWith('http') && !src.includes('data:') && !src.includes('svg+xml')
        && !src.includes('1x1') && !src.includes('pixel') && !src.includes('tracking')) {
        images.push({ src, alt: img.alt || '' });
      }
    });

    // Extract structured data (JSON-LD)
    let eventData = {};
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'Event' || data['@type']?.includes('Event')) {
          eventData = {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            location: data.location?.name || data.location?.address?.addressLocality,
            organizer: data.organizer?.name,
            image: data.image,
          };
        }
      } catch { /* not valid JSON-LD */ }
    });

    // Extract headings
    const headings = [];
    doc.querySelectorAll('h1, h2, h3').forEach(h => {
      const text = h.textContent?.trim();
      if (text && text.length > 2 && text.length < 200) headings.push(text);
    });

    // Extract body text
    const body = doc.querySelector('article') || doc.querySelector('main') || doc.querySelector('[role="main"]') || doc.body;
    const textContent = body?.textContent?.replace(/\s+/g, ' ').trim().substring(0, 2000) || '';

    // Detect Google event pages
    const isGoogleEvent = url.includes('cloudonair') || url.includes('events.google')
      || url.includes('gdg.community') || url.includes('developers.google');

    return {
      success: true,
      url,
      title: eventData.name || title,
      description: eventData.description || description,
      images: images.slice(0, 20),
      headings: headings.slice(0, 10),
      textContent: textContent.substring(0, 1500),
      siteName,
      eventData,
      isGoogleEvent,
    };
  } catch (err) {
    return { success: false, error: err.message, url };
  }
}

// ─── Photo Utilities ───
export function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImageAsBase64(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      try { resolve(canvas.toDataURL('image/jpeg', 0.8)); }
      catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
