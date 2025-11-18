// qr-zip.worker.js
// Web Worker for generating QR PNGs and zipping them

importScripts('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
importScripts('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js');

self.onmessage = async function(e) {
  const { codes } = e.data;
  const zip = new self.JSZip();
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    try {
      const dataUrl = await self.QRCode.toDataURL(code, { width: 128, margin: 4 });
      const base64Data = dataUrl.split(',')[1];
      const filename = `qr-code-${code.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      zip.file(filename, base64Data, { base64: true });
      if ((i + 1) % 10 === 0 || i === codes.length - 1) {
        self.postMessage({ type: 'progress', done: i + 1, total: codes.length });
      }
    } catch (err) {
      self.postMessage({ type: 'error', error: err.message, index: i });
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  self.postMessage({ type: 'done', blob });
}; 