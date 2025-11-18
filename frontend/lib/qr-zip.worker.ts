// qr-zip.worker.ts
import JSZip from 'jszip';
import QRCode from 'qrcode';

export default {};

self.onmessage = async function(e) {
  const { codes } = e.data;
  const zip = new JSZip();
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    try {
      const dataUrl = await QRCode.toDataURL(code, { width: 128, margin: 4 });
      const base64Data = dataUrl.split(',')[1];
      const filename = `qr-code-${code.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      zip.file(filename, base64Data, { base64: true });
      if ((i + 1) % 10 === 0 || i === codes.length - 1) {
        (self as any).postMessage({ type: 'progress', done: i + 1, total: codes.length });
      }
    } catch (err: any) {
      (self as any).postMessage({ type: 'error', error: err.message, index: i });
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  (self as any).postMessage({ type: 'done', blob });
}; 