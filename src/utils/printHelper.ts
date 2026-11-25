/**
 * Utility to handle printing both in standalone tabs / mobile browsers
 * and inside sandboxed preview iframes (such as Google AI Studio).
 */

export const isRunningInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const printElement = (elementId: string, documentTitle = 'Report'): void => {
  const element = document.getElementById(elementId);

  // If in mobile browser or standalone tab (top level window)
  if (!isRunningInIframe()) {
    window.print();
    return;
  }

  // If inside an iframe (like AI Studio preview):
  // Browsers block window.print() inside sandboxed iframes without allow-modals.
  // We extract the styled HTML and open it in a clean standalone window/tab to print.
  if (!element) {
    try {
      window.print();
    } catch (e) {
      console.warn('window.print() blocked by iframe sandbox', e);
    }
    return;
  }

  const contentHtml = element.innerHTML;
  const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${documentTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        background-color: #ffffff;
        color: #1c1917;
        margin: 0;
        padding: 24px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }
      @media print {
        @page {
          size: auto;
          margin: 12mm;
        }
        body {
          padding: 0 !important;
        }
        .no-print {
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="max-w-4xl mx-auto">
      ${contentHtml}
    </div>
    <div class="no-print mt-8 pt-4 border-t border-stone-200 text-center text-xs text-stone-500">
      <button onclick="window.print()" style="background:#b45309;color:white;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;border:none;margin-bottom:12px;">
        Click to Print / Save as PDF
      </button>
      <p>If the print dialog did not open automatically, click the button above.</p>
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          try {
            window.print();
          } catch (err) {
            console.error(err);
          }
        }, 400);
      };
    </script>
  </body>
</html>`;

  try {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');

    if (!newWindow) {
      // If popup blocker intervened, try window.print directly
      window.print();
    }
  } catch (err) {
    console.error('Error opening printable tab:', err);
    window.print();
  }
};

export const downloadElementAsHtml = (
  elementId: string,
  filename = 'statement.html',
  documentTitle = 'Statement Report'
): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const contentHtml = element.innerHTML;
  const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${documentTitle}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        background-color: #ffffff;
        color: #1c1917;
        margin: 0;
        padding: 24px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }
      @media print {
        @page { size: auto; margin: 12mm; }
        body { padding: 0 !important; }
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="max-w-4xl mx-auto">
      ${contentHtml}
    </div>
    <div class="no-print mt-8 pt-4 border-t border-stone-200 text-center">
      <button onclick="window.print()" style="background:#b45309;color:white;padding:10px 20px;border-radius:10px;font-weight:bold;cursor:pointer;border:none;">
        Print / Save as PDF
      </button>
    </div>
  </body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a);
  }, 1500);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export interface GeneratePdfResult {
  blob: Blob;
  file: File;
  blobUrl: string;
  filename: string;
}

/**
 * Converts ANY CSS color (including Tailwind v4 oklch, oklab, color-mix, lab, lch)
 * into a standard rgb()/rgba() string via a 1x1 2D canvas so html2canvas never
 * falls back to solid black (#000000).
 */
const createCssColorNormalizer = () => {
  const probeCanvas = document.createElement('canvas');
  probeCanvas.width = 1;
  probeCanvas.height = 1;
  const ctx = probeCanvas.getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, string>();

  return (value: string | null | undefined, fallback = 'transparent'): string => {
    if (!value) return fallback;
    const trimmed = value.trim();
    if (
      trimmed === '' ||
      trimmed === 'none' ||
      trimmed === 'transparent' ||
      trimmed === 'rgba(0, 0, 0, 0)'
    ) {
      return 'transparent';
    }

    const cached = cache.get(trimmed);
    if (cached) return cached;

    if (/^#[0-9a-f]{3,8}$/i.test(trimmed) || /^rgba?\(\s*\d+/i.test(trimmed)) {
      cache.set(trimmed, trimmed);
      return trimmed;
    }

    if (!ctx) return fallback;

    try {
      ctx.clearRect(0, 0, 1, 1);
      // Sentinel color to detect invalid/unparsed CSS color strings
      ctx.fillStyle = '#010203';
      ctx.fillStyle = trimmed;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

      // If browser failed to parse `trimmed` and left our sentinel color
      if (r === 1 && g === 2 && b === 3 && a === 255 && trimmed !== '#010203') {
        cache.set(trimmed, fallback);
        return fallback;
      }

      if (a === 0) {
        cache.set(trimmed, 'transparent');
        return 'transparent';
      }

      const resolved =
        a === 255
          ? `rgb(${r}, ${g}, ${b})`
          : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
      cache.set(trimmed, resolved);
      return resolved;
    } catch {
      cache.set(trimmed, fallback);
      return fallback;
    }
  };
};

/**
 * Finds a clean all-white horizontal scanline near `targetY` so multi-page PDFs
 * never slice through a line of text or table row.
 */
const findCleanPageBreakY = (
  ctx: CanvasRenderingContext2D,
  width: number,
  startY: number,
  idealEndY: number,
  maxScanUpPx = 140
): number => {
  const minY = Math.max(startY + 40, idealEndY - maxScanUpPx);
  const scanHeight = idealEndY - minY;
  if (scanHeight <= 0) return idealEndY;

  try {
    const imgData = ctx.getImageData(0, minY, width, scanHeight).data;
    // Scan from idealEndY upwards to find the lowest pure-white row
    for (let row = scanHeight - 1; row >= 0; row--) {
      const rowOffset = row * width * 4;
      let isWhiteRow = true;
      // Sample across the row (step by 2 pixels for speed)
      for (let x = 0; x < width; x += 2) {
        const idx = rowOffset + x * 4;
        if (imgData[idx] < 248 || imgData[idx + 1] < 248 || imgData[idx + 2] < 248) {
          isWhiteRow = false;
          break;
        }
      }
      if (isWhiteRow) {
        return minY + row;
      }
    }
  } catch {
    // Fallback if canvas read fails
  }
  return idealEndY;
};

/**
 * Triggers a reliable file download without prematurely revoking the Blob URL,
 * which prevents aborted/0-byte downloads on Android Chrome and mobile PWAs.
 */
export const triggerReliableDownload = (
  blob: Blob,
  filename: string,
  mimeType = 'application/pdf'
): string => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.type = mimeType;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (a.parentNode) {
      document.body.removeChild(a);
    }
  }, 1500);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);

  return url;
};

/**
 * Recursively sanitizes CSSStyleSheet rules in clonedDoc so html2canvas never encounters
 * unsupported Tailwind v4 functions (oklch, oklab, color-mix, lab, lch).
 */
const sanitizeClonedStylesheets = (
  clonedDoc: Document,
  view: Window,
  normalizeColor: (val: string | null | undefined, fallback?: string) => string
) => {
  const rootCs = view.getComputedStyle(clonedDoc.documentElement);

  const sanitizeRuleList = (rules: CSSRuleList | undefined) => {
    if (!rules) return;
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i] as any;
      if (rule.cssRules) {
        sanitizeRuleList(rule.cssRules);
      }
      if (rule.style) {
        const style: CSSStyleDeclaration = rule.style;
        for (let j = style.length - 1; j >= 0; j--) {
          const prop = style.item(j);
          const val = style.getPropertyValue(prop);
          if (!val) continue;

          if (prop.startsWith('--')) {
            if (/oklch|oklab|color-mix|\blab\(|\blch\(/i.test(val)) {
              const resolved = normalizeColor(rootCs.getPropertyValue(prop) || val, '');
              if (resolved) {
                clonedDoc.documentElement.style.setProperty(prop, resolved);
              }
              style.removeProperty(prop);
            }
          } else if (/oklch|oklab|color-mix|\blab\(|\blch\(/i.test(val)) {
            if (prop.includes('shadow') || prop.includes('gradient') || prop === 'background-image') {
              style.setProperty(prop, 'none');
            } else {
              const resolved = normalizeColor(val, '');
              if (resolved) {
                style.setProperty(prop, resolved);
              } else {
                style.removeProperty(prop);
              }
            }
          }
        }
      }
    }
  };

  try {
    const sheets = Array.from(clonedDoc.styleSheets);
    for (const sheet of sheets) {
      try {
        sanitizeRuleList(sheet.cssRules);
      } catch {
        // Ignore cross-origin sheets (e.g. Google Fonts)
      }
    }
  } catch {
    // Ignore stylesheet traversal errors
  }

  // Override Tailwind v4 shadow/ring/backdrop CSS variables cleanly
  const overrideStyle = clonedDoc.createElement('style');
  overrideStyle.textContent = `
    *, *::before, *::after {
      --tw-shadow: 0 0 #0000 !important;
      --tw-ring-shadow: 0 0 #0000 !important;
      --tw-inset-shadow: 0 0 #0000 !important;
      --tw-inset-ring-shadow: 0 0 #0000 !important;
      --tw-ring-offset-shadow: 0 0 #0000 !important;
      box-shadow: none !important;
      text-shadow: none !important;
      backdrop-filter: none !important;
    }
  `;
  clonedDoc.head.appendChild(overrideStyle);
};

export const captureElementAsCanvas = async (
  elementId: string
): Promise<HTMLCanvasElement> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} is not visible on screen.`);
  }

  const isInvoice = elementId === 'printable-invoice-area';
  const captureWidth = isInvoice ? 600 : 820;
  const viewportWidth = isInvoice ? 760 : 980;
  const normalizeColor = createCssColorNormalizer();

  const buildOptions = () => ({
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: viewportWidth,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc: Document) => {
      const view = clonedDoc.defaultView || window;

      clonedDoc.documentElement.style.backgroundColor = '#ffffff';
      clonedDoc.documentElement.style.overflow = 'visible';
      clonedDoc.documentElement.style.height = 'auto';
      clonedDoc.body.style.backgroundColor = '#ffffff';
      clonedDoc.body.style.color = '#1c1917';
      clonedDoc.body.style.margin = '0';
      clonedDoc.body.style.padding = '0';
      clonedDoc.body.style.overflow = 'visible';
      clonedDoc.body.style.height = 'auto';

      const clonedEl = clonedDoc.getElementById(elementId);
      if (!clonedEl) return;

      // Also sanitize ancestor wrappers (e.g. modal backdrop with bg-black/60 backdrop-blur-xs)
      let ancestor: HTMLElement | null = clonedEl.parentElement;
      while (ancestor && ancestor !== clonedDoc.body) {
        ancestor.style.backgroundColor = '#ffffff';
        ancestor.style.borderColor = 'transparent';
        ancestor.style.boxShadow = 'none';
        ancestor.style.filter = 'none';
        (ancestor.style as any).backdropFilter = 'none';
        ancestor.style.overflow = 'visible';
        ancestor.style.maxHeight = 'none';
        ancestor.style.height = 'auto';
        ancestor.style.position = 'static';
        ancestor.style.transform = 'none';
        ancestor.scrollTop = 0;
        ancestor.scrollLeft = 0;
        ancestor = ancestor.parentElement;
      }

      // Ensure fixed crisp paper layout regardless of mobile screen width
      clonedEl.style.width = `${captureWidth}px`;
      clonedEl.style.minWidth = `${captureWidth}px`;
      clonedEl.style.maxWidth = `${captureWidth}px`;
      clonedEl.style.backgroundColor = '#ffffff';
      clonedEl.style.color = '#1c1917';
      clonedEl.style.padding = '28px';
      clonedEl.style.margin = '0 auto';
      clonedEl.style.maxHeight = 'none';
      clonedEl.style.height = 'auto';
      clonedEl.style.overflow = 'visible';
      clonedEl.style.boxShadow = 'none';
      clonedEl.style.borderRadius = '0px';
      clonedEl.style.border = 'none';
      clonedEl.style.position = 'static';
      clonedEl.style.transform = 'none';

      const nodes: HTMLElement[] = [
        clonedEl,
        ...Array.from(clonedEl.querySelectorAll<HTMLElement>('*')),
      ];

      // Read and resolve computed styles BEFORE mutating inline styles or stylesheets
      const snapshots = nodes.map((el) => {
        const cs = view.getComputedStyle(el);
        return {
          el,
          bg: normalizeColor(cs.backgroundColor, 'transparent'),
          color: normalizeColor(cs.color, '#1c1917'),
          borderTopColor: normalizeColor(cs.borderTopColor, '#e7e5e4'),
          borderRightColor: normalizeColor(cs.borderRightColor, '#e7e5e4'),
          borderBottomColor: normalizeColor(cs.borderBottomColor, '#e7e5e4'),
          borderLeftColor: normalizeColor(cs.borderLeftColor, '#e7e5e4'),
          textDecorationColor: normalizeColor(cs.textDecorationColor, '#1c1917'),
          bgImage: cs.backgroundImage,
          overflowX: cs.overflowX,
          overflowY: cs.overflowY,
          textOverflow: cs.textOverflow,
          fill: cs.fill,
          stroke: cs.stroke,
        };
      });

      // Sanitize stylesheet rules & CSS variables in clonedDoc
      sanitizeClonedStylesheets(clonedDoc, view, normalizeColor);

      for (const s of snapshots) {
        const { el } = s;

        if (s.bgImage && s.bgImage !== 'none' && s.bgImage.includes('gradient')) {
          el.style.backgroundImage = 'none';
          el.style.backgroundColor = s.bg !== 'transparent' ? s.bg : '#b45309';
        } else {
          el.style.backgroundColor = s.bg;
        }

        el.style.color = s.color;
        el.style.borderTopColor = s.borderTopColor;
        el.style.borderRightColor = s.borderRightColor;
        el.style.borderBottomColor = s.borderBottomColor;
        el.style.borderLeftColor = s.borderLeftColor;
        el.style.outlineColor = 'transparent';
        el.style.textDecorationColor = s.textDecorationColor;

        el.style.boxShadow = 'none';
        el.style.textShadow = 'none';
        el.style.filter = 'none';
        (el.style as any).backdropFilter = 'none';

        if (s.overflowX === 'auto' || s.overflowX === 'scroll') {
          el.style.overflowX = 'visible';
        }
        if (s.overflowY === 'auto' || s.overflowY === 'scroll') {
          el.style.overflowY = 'visible';
        }
        if (s.textOverflow === 'ellipsis') {
          el.style.textOverflow = 'clip';
          el.style.whiteSpace = 'normal';
          el.style.overflow = 'visible';
          el.style.wordBreak = 'break-word';
        }

        if (el instanceof SVGElement) {
          if (s.stroke && s.stroke !== 'none') {
            el.style.stroke = normalizeColor(s.stroke, s.color);
          }
          if (s.fill && s.fill !== 'none') {
            el.style.fill = normalizeColor(s.fill, 'none');
          }
        }
      }
    },
  });

  // Try standard html2canvas first (all oklch/oklab/color-mix are normalized above);
  // fall back to html2canvas-oklch if any browser quirk occurs.
  try {
    const html2canvasMod = await import('html2canvas');
    const html2canvas = (html2canvasMod.default || html2canvasMod) as (
      el: HTMLElement,
      opts?: Record<string, any>
    ) => Promise<HTMLCanvasElement>;
    return await html2canvas(element, buildOptions());
  } catch (primaryErr) {
    console.warn('Primary html2canvas capture failed, trying fallback:', primaryErr);
    const oklchMod = await import('html2canvas-oklch');
    const html2canvasOklch = (oklchMod.default || oklchMod) as (
      el: HTMLElement,
      opts?: Record<string, any>
    ) => Promise<HTMLCanvasElement>;
    return await html2canvasOklch(element, buildOptions());
  }
};

export interface GenerateImageResult {
  blob: Blob;
  file: File;
  dataUrl: string;
  blobUrl: string;
  filename: string;
}

export const generateImageResult = async (
  elementId: string,
  filename = 'bill.png'
): Promise<GenerateImageResult | null> => {
  try {
    const canvas = await captureElementAsCanvas(elementId);
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))),
        'image/png'
      );
    });
    const cleanFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
    const file = new File([blob], cleanFilename, { type: 'image/png' });
    const blobUrl = URL.createObjectURL(blob);
    return { blob, file, dataUrl, blobUrl, filename: cleanFilename };
  } catch (err) {
    console.error('Error generating bill image:', err);
    return null;
  }
};

export const downloadElementAsImage = async (
  elementId: string,
  filename = 'bill.png'
): Promise<{
  success: boolean;
  filename: string;
  blob?: Blob;
  dataUrl?: string;
  blobUrl?: string;
  file?: File;
  error?: string;
}> => {
  const cleanFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
  try {
    const res = await generateImageResult(elementId, cleanFilename);
    if (!res) {
      return {
        success: false,
        filename: cleanFilename,
        error: 'Could not render image from screen.',
      };
    }
    triggerReliableDownload(res.blob, res.filename, 'image/png');
    return {
      success: true,
      filename: res.filename,
      blob: res.blob,
      dataUrl: res.dataUrl,
      blobUrl: res.blobUrl,
      file: res.file,
    };
  } catch (err: any) {
    console.error('Failed to download image:', err);
    return {
      success: false,
      filename: cleanFilename,
      error: err?.message || 'Image download failed',
    };
  }
};

export interface ShareMediaResult {
  success: boolean;
  sharedViaWebShare: boolean;
  canWebShareFiles: boolean;
  downloaded: boolean;
  filename: string;
  blob?: Blob;
  blobUrl?: string;
  dataUrl?: string;
  file?: File;
  whatsappUrl?: string;
  error?: string;
}

export const shareElementAsImage = async (
  elementId: string,
  filename: string,
  options: SharePdfOptions = {}
): Promise<ShareMediaResult> => {
  const cleanFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
  const res = await generateImageResult(elementId, cleanFilename);
  if (!res) {
    return {
      success: false,
      sharedViaWebShare: false,
      canWebShareFiles: false,
      downloaded: false,
      filename: cleanFilename,
      error: 'Failed to capture bill photograph from screen.',
    };
  }

  const nav = navigator as any;
  const canWebShareFiles =
    typeof nav.canShare === 'function' && Boolean(nav.canShare({ files: [res.file] }));

  if (canWebShareFiles) {
    try {
      await nav.share({
        files: [res.file],
        title: options.title || res.filename,
        text: options.text || 'Bill Image',
      });
      return {
        success: true,
        sharedViaWebShare: true,
        canWebShareFiles: true,
        downloaded: false,
        filename: res.filename,
        blob: res.blob,
        blobUrl: res.blobUrl,
        dataUrl: res.dataUrl,
        file: res.file,
        whatsappUrl: options.whatsappFallbackUrl,
      };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return {
          success: true,
          sharedViaWebShare: false,
          canWebShareFiles: true,
          downloaded: false,
          filename: res.filename,
          blob: res.blob,
          blobUrl: res.blobUrl,
          dataUrl: res.dataUrl,
          file: res.file,
          whatsappUrl: options.whatsappFallbackUrl,
        };
      }
      console.warn('WebShare image failed, falling back to download:', e);
    }
  }

  triggerReliableDownload(res.blob, res.filename, 'image/png');

  return {
    success: true,
    sharedViaWebShare: false,
    canWebShareFiles,
    downloaded: true,
    filename: res.filename,
    blob: res.blob,
    blobUrl: res.blobUrl,
    dataUrl: res.dataUrl,
    file: res.file,
    whatsappUrl: options.whatsappFallbackUrl,
  };
};

export const generatePdfBlob = async (
  elementId: string,
  filename = 'statement.pdf'
): Promise<GeneratePdfResult | null> => {
  try {
    const { jsPDF } = await import('jspdf');
    const canvas = await captureElementAsCanvas(elementId);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const marginMm = 10;
    const contentWidthMm = pageWidthMm - marginMm * 2;
    const maxPageHeightMm = pageHeightMm - marginMm * 2;

    const pxPerMm = canvas.width / contentWidthMm;
    const maxSliceHeightPx = Math.floor(maxPageHeightMm * pxPerMm);
    const canvasCtx = canvas.getContext('2d', { willReadFrequently: true });

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height) {
      const remainingPx = canvas.height - currentY;
      let sliceHeightPx = Math.min(maxSliceHeightPx, remainingPx);

      if (remainingPx > maxSliceHeightPx && canvasCtx) {
        const cleanBreakY = findCleanPageBreakY(
          canvasCtx,
          canvas.width,
          currentY,
          currentY + maxSliceHeightPx
        );
        sliceHeightPx = Math.max(100, cleanBreakY - currentY);
      }

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const pageCtx = pageCanvas.getContext('2d');
      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.96);
      const sliceHeightMm = sliceHeightPx / pxPerMm;

      if (pageIndex > 0) {
        pdf.addPage();
      }
      pdf.addImage(
        pageImgData,
        'JPEG',
        marginMm,
        marginMm,
        contentWidthMm,
        sliceHeightMm,
        undefined,
        'FAST'
      );

      currentY += sliceHeightPx;
      pageIndex++;
    }

    const pdfArrayBuffer = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const pdfFile = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);

    return { blob: pdfBlob, file: pdfFile, blobUrl, filename: cleanFilename };
  } catch (err: any) {
    console.error('Error generating PDF:', err);
    return null;
  }
};

export const downloadElementAsPdf = async (
  elementId: string,
  filename = 'statement.pdf'
): Promise<{ success: boolean; filename: string; blobUrl?: string; error?: string }> => {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  try {
    const res = await generatePdfBlob(elementId, cleanFilename);
    if (!res) {
      return {
        success: false,
        filename: cleanFilename,
        error: 'Failed to generate PDF document from screen.',
      };
    }
    triggerReliableDownload(res.blob, res.filename, 'application/pdf');
    return { success: true, filename: res.filename, blobUrl: res.blobUrl };
  } catch (err: any) {
    console.error('Failed to download PDF:', err);
    return {
      success: false,
      filename: cleanFilename,
      error: err?.message || 'PDF download failed',
    };
  }
};

export interface SharePdfOptions {
  title?: string;
  text?: string;
  whatsappFallbackUrl?: string;
}

export type SharePdfResult = ShareMediaResult;

export const shareElementAsPdf = async (
  elementId: string,
  filename: string,
  options: SharePdfOptions = {}
): Promise<SharePdfResult> => {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const res = await generatePdfBlob(elementId, cleanFilename);
  if (!res) {
    return {
      success: false,
      sharedViaWebShare: false,
      canWebShareFiles: false,
      downloaded: false,
      filename: cleanFilename,
      error: 'Failed to generate PDF document from screen',
    };
  }

  const nav = navigator as any;
  const canWebShareFiles =
    typeof nav.canShare === 'function' && Boolean(nav.canShare({ files: [res.file] }));

  if (canWebShareFiles) {
    try {
      await nav.share({
        files: [res.file],
        title: options.title || res.filename,
        text: options.text || 'Sharing PDF document',
      });
      return {
        success: true,
        sharedViaWebShare: true,
        canWebShareFiles: true,
        downloaded: false,
        filename: res.filename,
        blob: res.blob,
        blobUrl: res.blobUrl,
        file: res.file,
        whatsappUrl: options.whatsappFallbackUrl,
      };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return {
          success: true,
          sharedViaWebShare: false,
          canWebShareFiles: true,
          downloaded: false,
          filename: res.filename,
          blob: res.blob,
          blobUrl: res.blobUrl,
          file: res.file,
          whatsappUrl: options.whatsappFallbackUrl,
        };
      }
      console.warn('WebShare failed, falling back to reliable download:', e);
    }
  }

  triggerReliableDownload(res.blob, res.filename, 'application/pdf');

  return {
    success: true,
    sharedViaWebShare: false,
    canWebShareFiles,
    downloaded: true,
    filename: res.filename,
    blob: res.blob,
    blobUrl: res.blobUrl,
    file: res.file,
    whatsappUrl: options.whatsappFallbackUrl,
  };
};
