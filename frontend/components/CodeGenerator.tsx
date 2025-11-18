"use client";
import React, { useState, useEffect } from 'react';
import { Loader2, Wrench, Upload, Download, Copy, Eye, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

const allowedChars = 'ABCDEFGHJKMNPQRSTUVWXYZ123456789';



// Types pour les lignes de chaises et les codes générés
type ChairLine = {
  [key: string]: { start: number; end: number };
};

type ChairLinesConfig = {
  C0: ChairLine;
  C1: ChairLine;
  C2: ChairLine;
};

const chairLines: ChairLinesConfig = {
  C0: { A: { start: 1, end: 33 }, B: { start: 1, end: 43 }, C: { start: 1, end: 43 }, D: { start: 1, end: 43 }, E: { start: 1, end: 43 }, F: { start: 1, end: 43 }, G: { start: 1, end: 43 }, H: { start: 1, end: 36 }, I: { start: 1, end: 48 }, J: { start: 1, end: 48 }, K: { start: 1, end: 48 }, L: { start: 1, end: 48 } },
  C1: { A: { start: 1, end: 62 }, B: { start: 1, end: 62 }, C: { start: 1, end: 62 }, D: { start: 1, end: 62 }, E: { start: 1, end: 62 }, F: { start: 1, end: 62 }, G: { start: 1, end: 62 }, H: { start: 1, end: 66 }, I: { start: 1, end: 66 }, J: { start: 1, end: 66 }, K: { start: 1, end: 65 }, L: { start: 1, end: 65 } },
  C2: { A: { start: 1, end: 62 }, B: { start: 1, end: 62 }, C: { start: 1, end: 62 }, D: { start: 1, end: 62 }, E: { start: 1, end: 62 }, F: { start: 1, end: 62 }, G: { start: 1, end: 62 }, H: { start: 1, end: 63 }, I: { start: 1, end: 64 }, J: { start: 1, end: 64 }, K: { start: 1, end: 64 }, L: { start: 1, end: 64 } },
};

// Configuration des tribunes
const tribuneSeats = {
  G3: 1439, G4: 1361, G5: 867, G6: 1008, G8: 1037,
  C1: 762, C2: 753, C0: 519, H0: 54, L0: 200, V0: 80
};

// Configuration des numéros incrémentaux
const incrementalStartNumbers = {
  C1: 1, C2: 763, C0: 1516, H0: 2035, L0: 2089,
  G3: 2289, G4: 3728, G5: 5089, G6: 5956, G8: 6964, V0: 8001
};

// Configuration des noms de fichiers et zones
const fileNameMapping = {
  C1: 'Chaise1_Porte1', C2: 'Chaise2_Porte1', C0: 'Centrale_Porte1',
  H0: 'Honneur_Porte1', L0: 'Loges_Porte1', V0: 'AccesVoiture',
  G3: 'Gradins3_Porte2', G4: 'Gradins4_Porte3', G5: 'Gradins5_Porte3',
  G6: 'Gradins6_Porte4', G8: 'Gradins8_Porte4'
};

// Configuration des noms de zones pour l'export Excel
const zoneNameMapping = {
  C1: 'Chaise 1', C2: 'Chaise 2', C0: 'Centrale',
  H0: 'Honneur', L0: 'Loges', V0: 'Parking',
  G3: 'Gradins 3', G4: 'Gradins 4', G5: 'Gradins 5',
  G6: 'Gradins 6', G8: 'Gradins 8'
};

function generateRandomString() {
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
  }
  return result;
}

function generatePIN() {
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const numbers = '123456789';
  const allChars = letters + numbers;
  let pin = '';
  let hasLetter = false;
  let hasNumber = false;
  
  for (let i = 0; i < 4; i++) {
    const char = allChars.charAt(Math.floor(Math.random() * allChars.length));
    pin += char;
    if (letters.includes(char)) hasLetter = true;
    if (numbers.includes(char)) hasNumber = true;
  }
  
  pin += '-';
  
  for (let i = 0; i < 4; i++) {
    const char = allChars.charAt(Math.floor(Math.random() * allChars.length));
    pin += char;
    if (letters.includes(char)) hasLetter = true;
    if (numbers.includes(char)) hasNumber = true;
  }
  
  if (!hasLetter || !hasNumber) return generatePIN();
  return pin;
}

function generateSequentialSerial(startNumber: number) {
  return startNumber.toString().padStart(4, '0');
}

function generateRandomSerial() {
  return (Math.floor(Math.random() * 9999) + 1).toString().padStart(4, '0');
}

// Fonction pour vérifier si un code QR existe déjà dans la base de données
async function checkQRCodeExists(qrCode: string): Promise<boolean> {
  try {
    // Vérification API contre la base de données existante
    const response = await fetch(`/api/qr-codes/check/${encodeURIComponent(qrCode)}`);
    if (response.ok) {
      const result = await response.json();
      return result.exists || false;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification du code QR:', error);
    return false;
  }
}

// Fonction pour vérifier plusieurs codes QR en lot
async function checkMultipleQRCodes(qrCodes: string[]): Promise<{ code: string; exists: boolean }[]> {
  try {
    const response = await fetch('/api/qr-codes/check-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codes: qrCodes }),
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.results || [];
    }
    return qrCodes.map(code => ({ code, exists: false }));
  } catch (error) {
    console.error('Erreur lors de la vérification en lot:', error);
    return qrCodes.map(code => ({ code, exists: false }));
  }
}



// Types pour les codes générés et fichiers traités
type CodeRow = {
  id: number;
  code: string;
  zone: string;
  chair?: string;
  serial?: string;
};

type ProcessedFile = {
  filename: string;
  workbook: XLSX.WorkBook;
  rowCount: number;
  existingColumns: string[];
  samplePins: string[];
};

export default function CodeGenerator() {
  // États existants
  const [prefix1] = useState('CSS');
  const [prefix2] = useState('SUB');
  const [prefix3, setPrefix3] = useState('H0');
  const [count, setCount] = useState<number>(54);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  

  
  // États existants pour les modes et options
  const [activeMode, setActiveMode] = useState('generate');
  const [includeSerial, setIncludeSerial] = useState(true);
  const [useSequentialSerial, setUseSequentialSerial] = useState(true);
  const [serialStartNumber, setSerialStartNumber] = useState<number>(8081);
  const [checkExistingCodes, setCheckExistingCodes] = useState(true);
  const [entryGate, setEntryGate] = useState<string>('');
  const [includeChaise, setIncludeChaise] = useState(true);
  const [tableRows, setTableRows] = useState<CodeRow[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);





  // Fonction de génération de codes
  const handleGenerate = async () => {
    setError('');
    setTableRows([]);
    setProgress(null);
    
    if (count < 1 || count > 100000) {
      setError('Le nombre de codes doit être compris entre 1 et 100 000.');
      return;
    }
    
    setGenerating(true);
    
    setTimeout(async () => {
      const codes: CodeRow[] = [];
      const unique = new Set<string>();
      const pinCodes = new Set<string>();
      
      // Génération des codes QR uniques avec garantie d'unicité
      const uniqueCodes: string[] = [];
      
      // Générer des codes uniques de 6 caractères comme N4UEFR
      
      for (let i = 0; i < count; i++) {
        let newCode: string;
        let attempts = 0;
        let isUnique = false;
        
        do {
          newCode = generateRandomString(); // Génère exactement 6 caractères
          attempts++;
          
          // Vérifier l'unicité dans la session actuelle
          isUnique = !uniqueCodes.includes(newCode);
          
          // Si activé, vérifier aussi contre la base de données existante
          if (isUnique && checkExistingCodes) {
            try {
              const existsInDB = await checkQRCodeExists(`NTRX:${prefix1}:${prefix2}:${prefix3}:${newCode}`);
              if (existsInDB) {
                isUnique = false;
                console.log(`Code ${newCode} existe déjà en base, régénération...`);
              }
            } catch (error) {
              console.warn('Impossible de vérifier en base, on continue...', error);
            }
          }
          
        } while (!isUnique && attempts < 200); // Augmenté à 200 tentatives
        
        // Si on n'a pas trouvé d'unicité après 200 tentatives, ajouter un suffixe unique
        if (!isUnique) {
          newCode = newCode + Math.random().toString(36).slice(-3);
        }
        
        uniqueCodes.push(newCode);
      }
      
      // Génération des numéros de série uniques si nécessaire
      let serialArray: string[] = [];
      if (includeSerial) {
        if (useSequentialSerial) {
          // Génération de numéros de série séquentiels
          for (let i = 0; i < count; i++) {
            serialArray.push(generateSequentialSerial(serialStartNumber + i));
          }
        } else {
          // Génération de numéros de série aléatoires
          const randomSerials = new Set<string>();
          while (randomSerials.size < count) {
            randomSerials.add(generateRandomSerial());
          }
          serialArray = Array.from(randomSerials);
        }
      }
      
      const qrArray = uniqueCodes;
      
      for (let i = 0; i < count; i++) {
        const qrData = `NTRX:${prefix1}:${prefix2}:${prefix3}:${qrArray[i]}`;
        
        // Génération chaise (seulement pour C0, C1, C2)
        let chairNumber = '';
        if (includeChaise && Object.prototype.hasOwnProperty.call(chairLines, prefix3)) {
          let currentIndex = i;
          const lines = Object.keys((chairLines as ChairLinesConfig)[prefix3 as keyof ChairLinesConfig]);
          for (const lineKey of lines) {
            const lineSize = (chairLines as ChairLinesConfig)[prefix3 as keyof ChairLinesConfig][lineKey].end - (chairLines as ChairLinesConfig)[prefix3 as keyof ChairLinesConfig][lineKey].start + 1;
            if (currentIndex < lineSize) {
              chairNumber = `${lineKey}${currentIndex + 1}`;
              break;
            }
            currentIndex -= lineSize;
          }
        }
        
        // Génération numéro de série
        let serialNumber = '';
        if (includeSerial) {
          if (useSequentialSerial) {
            serialNumber = serialArray[i];
          } else {
            const startNumber = (incrementalStartNumbers as Record<string, number>)[prefix3] || 1;
            serialNumber = (startNumber + i).toString().padStart(4, '0');
          }
        }
        
        codes.push({
          id: i + 1,
          code: qrData,
          zone: prefix3,
          chair: chairNumber || undefined,
          serial: serialNumber || undefined
        });
        
        // Progress update
        if (count > 1000 && i % 500 === 0) {
          setProgress({ done: i, total: count });
          await new Promise(res => setTimeout(res, 1));
        }
      }
      
      setTableRows(codes);
      setGenerating(false);
      setProgress(null);
    }, 100);
  };

  const handleCopy = () => {
    const headers = ['QR_Code_Data', 'Zone', 'Code_Zone', 'Porte_Entree'];
    const shouldShowChaiseColumn = includeChaise && Object.prototype.hasOwnProperty.call(chairLines, prefix3);
    if (shouldShowChaiseColumn) headers.push('Chaise');
    if (includeSerial) headers.push('Numero_de_serie');
    
    const csvContent = tableRows.map((row: CodeRow) => {
      let line = [
        row.code,
        (zoneNameMapping as Record<string, string>)[prefix3] || prefix3,
        prefix3,
        entryGate || ''
      ];
      if (shouldShowChaiseColumn && row.chair) line.push(row.chair);
      if (includeSerial && row.serial) line.push(row.serial);
      return line.join(',');
    }).join('\n');
    
    const fullCsv = headers.join(',') + '\n' + csvContent;
    navigator.clipboard.writeText(fullCsv);
    alert('Données copiées dans le presse-papier !');
  };

  const handleDownloadExcel = () => {
    if (!tableRows.length) return;
    
    const data = tableRows.map((row: CodeRow) => {
      const obj: any = { 
        QR_Code_Data: row.code,
        Zone: (zoneNameMapping as Record<string, string>)[prefix3] || prefix3,
        Code_Zone: prefix3,
        Porte_Entree: entryGate || ''
      };
      const shouldShowChaiseColumn = includeChaise && Object.prototype.hasOwnProperty.call(chairLines, prefix3);
      if (shouldShowChaiseColumn && row.chair) obj.Chaise = row.chair;
      if (includeSerial && row.serial) obj.Numero_de_serie = row.serial;
      return obj;
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QR_Codes');
    
    const fileName = (fileNameMapping as Record<string, string>)[prefix3] || prefix3;
    XLSX.writeFile(wb, `QRCode_${fileName}.xlsx`);
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const results: ProcessedFile[] = [];
    
    for (const file of files) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) continue;
        
        const existingColumns = Object.keys(jsonData[0] as object);
        if (existingColumns.includes('Code PIN')) continue;
        
        // Générer des codes PIN uniques
        const pins = new Set<string>();
        while (pins.size < jsonData.length) {
          pins.add(generatePIN());
        }
        const pinArray = Array.from(pins);
        
        const updatedData = (jsonData as object[]).map((row, index) => ({
          ...row,
          'Code PIN': pinArray[index]
        }));
        
        const newWs = XLSX.utils.json_to_sheet(updatedData);
        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, newWs, sheetName);
        
        results.push({
          filename: file.name,
          workbook: newWb,
          rowCount: jsonData.length,
          existingColumns,
          samplePins: pinArray.slice(0, 3)
        });
      } catch (error) {
        console.error('Erreur traitement fichier:', error);
      }
    }
    
    setProcessedFiles(results);
  };

  const downloadProcessedFile = (fileData: ProcessedFile) => {
    XLSX.writeFile(fileData.workbook, `Processed_${fileData.filename}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-6">
        {/* Generate Mode */}
        {activeMode === 'generate' && (
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-3xl">
              <div className="text-center mb-8">
                <Wrench className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Générateur de codes QR</h1>
                <p className="text-gray-600">Générez des codes QR uniques pour vos billets et abonnements.</p>
              </div>

              <div className="space-y-6">

                {/* Configuration des codes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code organisateur</label>
                    <Input value={prefix1} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code de zone</label>
                    <Input 
                      value={prefix3} 
                      onChange={(e) => setPrefix3(e.target.value.toUpperCase())}
                      placeholder="Ex: G3, G4, H0, C1..."
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Porte d'entrée</label>
                    <Input 
                      value={entryGate} 
                      onChange={(e) => setEntryGate(e.target.value)}
                      placeholder="Ex: Porte 2, Porte 3, Porte 4..."
                      className="capitalize"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de codes</label>
                    <Input 
                      type="number" 
                      value={count} 
                      onChange={(e) => setCount(Number(e.target.value))}
                      min={1}
                      max={100000}
                      placeholder="Ex: 1439, 1361, 867..."
                    />
                  </div>
                </div>

                

                {/* Options de génération */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inclure numéro de série</label>
                    <Select value={includeSerial.toString()} onValueChange={(v) => setIncludeSerial(v === 'true')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui - Avec numéros de série</SelectItem>
                        <SelectItem value="false">Non - QR codes uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vérifier codes existants</label>
                    <Select value={checkExistingCodes.toString()} onValueChange={(v) => setCheckExistingCodes(v === 'true')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui - Éviter les doublons en base</SelectItem>
                        <SelectItem value="false">Non - Vérification session uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {checkExistingCodes ? 'Vérifie contre la base de données existante' : 'Vérifie uniquement dans la session actuelle'}
                    </p>
                  </div>
                  {includeSerial && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de numéro de série</label>
                        <Select value={useSequentialSerial.toString()} onValueChange={(v) => setUseSequentialSerial(v === 'true')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Séquentiel (8081, 8082, 8083...)</SelectItem>
                            <SelectItem value="false">Aléatoire (0001-9999)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {useSequentialSerial && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de départ série</label>
                          <Input 
                            type="number" 
                            value={serialStartNumber} 
                            onChange={(e) => setSerialStartNumber(Number(e.target.value))}
                            min={1}
                            max={9999}
                            className="text-center"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Série générée: {serialStartNumber} à {serialStartNumber + count - 1}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inclure colonne Chaise</label>
                    <Select 
                      value={includeChaise.toString()} 
                      onValueChange={(v) => setIncludeChaise(v === 'true')}
                      disabled={!Object.prototype.hasOwnProperty.call(chairLines, prefix3)}
                    >
                      <SelectTrigger disabled={!Object.prototype.hasOwnProperty.call(chairLines, prefix3)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui - Avec numérotation des sièges</SelectItem>
                        <SelectItem value="false">Non - Sans numérotation des sièges</SelectItem>
                      </SelectContent>
                    </Select>
                    {!Object.prototype.hasOwnProperty.call(chairLines, prefix3) ? (
                      <p className="text-xs text-gray-500 mt-1">Option disponible uniquement pour Tribune centrale, Chaise 1 et Chaise 2</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Numérotation sièges (A1, B2, etc.)</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inclure Numéro de série</label>
                    <Select
                      value={includeSerial.toString()}
                      onValueChange={(v) => setIncludeSerial(v === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui - Avec numéro de série</SelectItem>
                        <SelectItem value="false">Non - Sans numéro de série</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Numéros incrémentaux sur 4 chiffres par zone (disponible pour toutes les zones)</p>
                  </div>
                </div>

                {/* Informations de format */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600">
                    <strong>Format QR:</strong> NTRX:CSS:SUB:{prefix3}:XXXXXX
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Où XXXXXX est un code unique de 6 caractères (ex: N4UEFR)
                  </p>
                </div>

                {/* Bouton générer */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-lg font-medium"
                >
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Génération...
                    </>
                  ) : (
                    'Générer les codes QR'
                  )}
                </Button>

                {/* Progress Bar */}
                {generating && progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center text-blue-600">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Génération en cours, veuillez patienter...
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                      />
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      {progress.done} / {progress.total} codes générés
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-6 border border-red-200 bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>                  
              )}

              {/* Results */}
              {tableRows.length > 0 && (
                <div className="mt-8 space-y-6">
                  <div className="font-semibold text-lg">
                    {tableRows.length} codes générés
                  </div>
                  
                  {/* Zone Information Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Zone:</span>
                        <div className="text-blue-900">{(zoneNameMapping as Record<string, string>)[prefix3] || prefix3}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Code Zone:</span>
                        <div className="text-blue-900 font-mono">{prefix3}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Porte d'entrée:</span>
                        <div className="text-blue-900">{entryGate || 'Non spécifiée'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Format QR:</span>
                        <div className="text-blue-900 font-mono">NTRX:CSS:SUB:{prefix3}:XXXXXX</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto rounded border">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left border">Code QR</th>
                          <th className="px-3 py-2 text-left border">Zone</th>
                          <th className="px-3 py-2 text-left border">Code Zone</th>
                          <th className="px-3 py-2 text-left border">Porte d'entrée</th>
                          {/* Fonction utilitaire pour savoir si la colonne Chaise doit être affichée */}
                          {(() => {
                            const shouldShowChaiseColumn = includeChaise && Object.prototype.hasOwnProperty.call(chairLines, prefix3);
                            return shouldShowChaiseColumn && <th className="px-3 py-2 text-left border">Chaise</th>;
                          })()}
                          {includeSerial && <th className="px-3 py-2 text-left border">Série</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.slice(0, 20).map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? '' : 'bg-gray-50'}>
                            <td className="px-3 py-2 border font-mono text-xs">{row.code}</td>
                            <td className="px-3 py-2 border">{(zoneNameMapping as Record<string, string>)[prefix3] || prefix3}</td>
                            <td className="px-3 py-2 border">{prefix3}</td>
                            <td className="px-3 py-2 border">{entryGate || '-'}</td>
                            {/* Fonction utilitaire pour savoir si la colonne Chaise doit être affichée */}
                            {(() => {
                              const shouldShowChaiseColumn = includeChaise && Object.prototype.hasOwnProperty.call(chairLines, prefix3);
                              return shouldShowChaiseColumn && row.chair && <td className="px-3 py-2 border">{row.chair}</td>;
                            })()}
                            {includeSerial && <td className="px-2 py-2 border">{row.serial}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {tableRows.length > 20 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... et {tableRows.length - 20} autres codes (voir fichier de téléchargement)
                    </p>
                  )}
                  
                  <div className="flex gap-3">
                    <Button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-700 text-white">
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger Excel
                    </Button>
                    <Button onClick={handleCopy} variant="outline">
                      <Copy className="mr-2 h-4 w-4" />
                      Copier en CSV
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Process Mode (inchangé) */}
        {activeMode === 'process' && (
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-3xl">
              <div className="text-center mb-8">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Traitement de fichiers</h1>
                <p className="text-gray-600">Ajoutez des codes PIN à vos fichiers Excel existants</p>
              </div>

              {/* Upload Zone */}
              <div 
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const files = Array.from(e.dataTransfer.files).filter(f => 
                    f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
                  );
                  if (files.length > 0) handleFileUpload(files);
                }}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionner vos fichiers Excel</h3>
                <p className="text-gray-600 mb-6">Glissez-déposez vos fichiers Excel ici ou cliquez pour sélectionner</p>
                
                <Button 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.xlsx,.xls';
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.files) {
                        const files = Array.from(target.files);
                        handleFileUpload(files);
                      }
                    };
                    input.click();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choisir les fichiers
                </Button>
              </div>

              {/* Processed Files */}
              {processedFiles.length > 0 && (
                <div className="mt-8 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">✅ {processedFiles.length} fichier(s) traité(s) avec succès !</p>
                  </div>
                  
                  {processedFiles.map((file, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">{file.filename}</h4>
                          <p className="text-gray-600 mb-3">{file.rowCount} lignes traitées</p>
                          
                          <div className="bg-gray-50 p-3 rounded mb-3">
                            <p className="text-sm text-gray-700">
                              <strong>Colonnes conservées:</strong> {file.existingColumns.join(', ')}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Colonne ajoutée:</strong> Code PIN
                            </p>
                          </div>
                          
                          <div className="text-sm">
                            <strong>Exemples de codes PIN:</strong> {file.samplePins.join(', ')}
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => downloadProcessedFile(file)}
                          className="bg-green-600 hover:bg-green-700 text-white ml-4"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}