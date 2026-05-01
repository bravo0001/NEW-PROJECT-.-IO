// ═══════════════════════════════════════════════════
// APL Nexus — Media Manager (Web Scraper, Google Drive, Photos)
// ═══════════════════════════════════════════════════

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// ─── Google Drive URL Conversion ───
export function parseGoogleDriveUrl(url) {
  if (!url) return null;
  let fileId = null;

  // Format: https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) fileId = fileMatch[1];

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileId && openMatch) fileId = openMatch[1];

  // Format: https://drive.google.com/uc?id=FILE_ID
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

export function isGoogleDriveUrl(url) {
  return url && url.includes('drive.google.com');
}

// Convert any image source to an embeddable URL
export function resolveImageUrl(url) {
  if (!url) return url;
  if (isGoogleDriveUrl(url)) {
    const parsed = parseGoogleDriveUrl(url);
    return parsed ? parsed.thumbnail : url;
  }
  return url;
}

// ─── Web Scraper ───
export async function scrapeUrl(url) {
  try {
    const proxyUrl = CORS_PROXY + encodeURIComponent(url);
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract metadata
    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const description = doc.querySelector('meta[name="description"]')?.content
      || doc.querySelector('meta[property="og:description"]')?.content || '';
    const ogImage = doc.querySelector('meta[property="og:image"]')?.content || '';

    // Extract all images
    const images = [];
    doc.querySelectorAll('img[src]').forEach(img => {
      let src = img.src;
      // Fix relative URLs
      try {
        src = new URL(src, url).href;
      } catch { /* skip */ }
      if (src && src.startsWith('http') && !src.includes('data:') && !src.includes('svg+xml')) {
        const alt = img.alt || '';
        images.push({ src, alt });
      }
    });

    // Add OG image first if it exists
    if (ogImage) {
      images.unshift({ src: ogImage, alt: 'Cover image' });
    }

    // Extract text content
    const body = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    const textContent = body?.textContent?.replace(/\s+/g, ' ').trim().substring(0, 2000) || '';

    // Extract headings
    const headings = [];
    doc.querySelectorAll('h1, h2, h3').forEach(h => {
      const text = h.textContent?.trim();
      if (text && text.length > 2 && text.length < 200) headings.push(text);
    });

    return {
      success: true,
      url,
      title,
      description,
      images: images.slice(0, 20), // max 20 images
      headings: headings.slice(0, 10),
      textContent: textContent.substring(0, 1500),
    };
  } catch (err) {
    return { success: false, error: err.message, url };
  }
}

// ─── Photo Utilities ───

// Compress and convert image file to base64 (max 400KB)
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
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Load image as base64 from URL (for PDF embedding)
export function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
