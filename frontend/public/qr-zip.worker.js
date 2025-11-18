// qr-zip.worker.js (static asset, using local files)
importScripts('/jszip.min.js');
importScripts('/qrcode-generator.js');

self.onmessage = async function(e) {
  const { codes } = e.data;
  const zip = new self.JSZip();
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    try {
      // 0 = typeNumber auto, 'L' = low error correction
      const qr = self.qrcode(0, 'L');
      qr.addData(code);
      qr.make();
      // 4 = 128x128 (see qrcode-generator docs)
      const dataUrl = qr.createDataURL(4);
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