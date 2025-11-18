"use client";
import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Loader2, QrCode } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function QRCodeGenerator() {
  const [codes, setCodes] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]); // Pour les colonnes Excel
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 21;
  const qrRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<{done: number, total: number} | null>(null);

  // Nouvelle fonction pour gérer l'import Excel ou txt
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        setRows(json);
        // Trouver la colonne code (Code, QR_Code_Data, etc.)
        const codeCol = Object.keys(json[0] || {}).find(k => k.toLowerCase().includes('code')) || 'Code';
        setCodes(json.map((row: any) => row[codeCol]));
        setPage(1);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const lines = (reader.result as string).split('\n').map(l => l.trim()).filter(Boolean);
        const start = lines[0].toLowerCase().includes('generated codes') ? 1 : 0;
        const valid = lines.slice(start).filter(line => /^NTRX:[^:]+:[^:]+:[^:]+:[A-Z0-9]+$/.test(line));
        if (valid.length === 0) {
          setError('No valid codes found in the file.');
          setCodes([]);
          setRows([]);
        } else {
          setCodes(valid);
          setRows(valid.map(code => ({ Code: code })));
          setPage(1);
        }
      };
      reader.readAsText(file);
    }
  };

  const totalPages = Math.ceil(codes.length / perPage);
  const pagedCodes = codes.slice((page - 1) * perPage, page * perPage);
  const pagedRows = rows.slice((page - 1) * perPage, page * perPage);

  // Nouvelle fonction pour générer le QR en base64
  function generateQRBase64(text: string): string {
    const canvas = document.createElement('canvas');
    // @ts-ignore
    window.QRCode?.toCanvas(canvas, text, { width: 128, margin: 2, color: { dark: '#000', light: '#fff' } });
    return canvas.toDataURL('image/png');
  }

  // Export Excel enrichi avec QR_Image
  const handleDownloadExcelWithQR = async () => {
    if (!rows.length) return;
    const codeCol = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('code')) || 'Code';
    // Générer les QR base64 pour chaque ligne
    const rowsWithQR = await Promise.all(rows.map(async (row: any) => {
      let qrData = row[codeCol];
      // fallback si vide
      if (!qrData) qrData = row['Code'] || row['QR_Code_Data'];
      // Utiliser qrcode.react pour générer le QR en base64
      const canvas = document.createElement('canvas');
      // @ts-ignore
      await window.QRCode?.toCanvas(canvas, qrData, { width: 128, margin: 2, color: { dark: '#000', light: '#fff' } });
      return { ...row, QR_Image: canvas.toDataURL('image/png') };
    }));
    const ws = XLSX.utils.json_to_sheet(rowsWithQR);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QR_Codes');
    XLSX.writeFile(wb, `qr-codes-with-images-${rowsWithQR.length}.xlsx`);
  };

  const handleDownloadAll = () => {
    setDownloading(true);
    setProgress({ done: 0, total: codes.length });
    // Use the static worker from public/
    const worker = new Worker('/qr-zip.worker.js');
    worker.postMessage({ codes });
    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setProgress({ done: e.data.done, total: e.data.total });
      } else if (e.data.type === 'done') {
        setDownloading(false);
        setProgress(null);
        const blob = e.data.blob;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `qr-codes-all-${codes.length}.zip`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        worker.terminate();
      } else if (e.data.type === 'error') {
        setDownloading(false);
        setProgress(null);
        alert('Error generating QR codes: ' + e.data.error);
        worker.terminate();
      }
    };
  };

  return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <div className="w-full max-w-3xl bg-white/90 rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <QrCode className="h-12 w-12 text-primary mb-2" />
          <h1 className="text-3xl font-bold mb-1 text-center">QR Code Generator</h1>
          <p className="text-muted-foreground text-center max-w-xl">Importez un fichier texte ou Excel contenant vos codes uniques pour générer et télécharger facilement tous les QR codes correspondants.</p>
        </div>
        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <Input type="file" accept=".txt,.xlsx,.xls" onChange={handleFile} className="mb-4" />
          {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
        </div>
        {codes.length > 0 && (
          <div className="flex flex-col gap-2 mb-4 w-full mt-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">{codes.length}</span> codes | Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownloadAll} variant="outline" disabled={downloading}>
                  {downloading ? 'Preparing ZIP...' : 'Download All as ZIP'}
                </Button>
                <Button onClick={handleDownloadExcelWithQR} variant="outline" disabled={downloading}>
                  Télécharger Excel avec QR
                </Button>
              </div>
            </div>
            {downloading && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <Loader2 className="animate-spin w-4 h-4" />
                  Preparing ZIP, please wait...
                </div>
                {progress && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                    />
                  </div>
                )}
                {progress && (
                  <div className="text-xs text-gray-600 mt-1">{progress.done} / {progress.total} QR codes processed</div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {pagedRows.map((row, idx) => (
            <div key={idx} className="flex flex-col items-center p-2 border rounded bg-white/80">
              <QRCodeCanvas value={row[Object.keys(row).find(k => k.toLowerCase().includes('code')) || 'Code']} size={128} ref={el => { qrRefs.current[idx] = el }} />
              <div className="mt-2 text-xs break-all">{row[Object.keys(row).find(k => k.toLowerCase().includes('code')) || 'Code']}</div>
              {/* Afficher les autres colonnes utiles */}
              {Object.entries(row)
                .filter(([k, v]) => !k.toLowerCase().includes('code') && !k.toLowerCase().includes('qr_image') && v)
                .map(([k, v]) => (
                  <div key={k} className="text-xs text-gray-500">{k}: {String(v)}</div>
                ))}
            </div>
          ))}
        </div>
        {codes.length > perPage && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline">Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="outline">Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}