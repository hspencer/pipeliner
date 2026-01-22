
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Play, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Database,
  Square,
  Terminal,
  XCircle,
  Clock,
  Eraser,
  RefreshCw,
  Eye,
  Code,
  Image as ImageIcon,
  ChevronDown,
  Activity,
  Zap
} from 'lucide-react';
import { RowData, LogEntry } from './types';
import { generateNLUAndPrompt } from './services/geminiService';

const TIMEOUT_MS = 90000; // 90 segundos de timeout

const App: React.FC = () => {
  const [rows, setRows] = useState<RowData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [processingStats, setProcessingStats] = useState({ current: 0, total: 0, startTime: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showConsole) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showConsole]);

  const addLog = (type: 'info' | 'error' | 'success', message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const parseCSV = (text: string, delimiter: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          row.push(currentField);
          currentField = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          row.push(currentField);
          result.push(row);
          row = [];
          currentField = '';
          if (char === '\r') i++;
        } else if (char !== '\r') {
          currentField += char;
        }
      }
    }
    if (row.length > 0 || currentField !== '') {
      row.push(currentField);
      result.push(row);
    }
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog('info', `Importando Dataset: ${file.name}`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text.trim()) return;

      const delimiter = text.split('\n')[0].includes('\t') ? '\t' : ',';
      const parsedData = parseCSV(text, delimiter);
      
      const headers = parsedData[0].map(h => h.toLowerCase().trim());
      const spanishIdx = headers.findIndex(h => h.includes('español') || h.includes('spanish'));
      const englishIdx = headers.findIndex(h => h.includes('inglés') || h.includes('english'));
      const nluIdx = headers.findIndex(h => h === 'nlu');
      const visualIdx = headers.findIndex(h => h.includes('visual'));
      const promptIdx = headers.findIndex(h => h.includes('prompt'));
      const svgIdx = headers.findIndex(h => h === 'svg');
      const idIdx = headers.findIndex(h => h === 'id');

      const newRows: RowData[] = parsedData.slice(1).map((columns, i): RowData => {
        const clean = (val: string) => (val === '{empty}' || !val ? '' : val.trim());
        const nluRaw = clean(columns[nluIdx]);
        
        let nluData: RowData['nlu'] = nluRaw;
        try { if (nluRaw.startsWith('{')) nluData = JSON.parse(nluRaw); } catch (e) {}

        return {
          id: clean(columns[idIdx]) || `${i + 1}`,
          spanish: clean(columns[spanishIdx]),
          english: clean(columns[englishIdx]),
          nlu: nluData,
          visualElements: clean(columns[visualIdx]),
          imagePrompt: clean(columns[promptIdx]),
          svgCode: clean(columns[svgIdx]),
          status: (nluData && typeof nluData === 'object' ? 'completed' : 'idle') as any
        };
      }).filter(r => r.spanish || r.english);

      setRows(newRows);
      addLog('success', `Dataset cargado con ${newRows.length} registros.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const withTimeout = async (promise: Promise<any>, ms: number) => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT: El modelo tardó demasiado en responder.')), ms)
    );
    return Promise.race([promise, timeout]);
  };

  const processSingleRow = async (index: number, force: boolean = false) => {
    if (!force && (rows[index].status === 'completed' || rows[index].status === 'processing')) return;
    
    addLog('info', `[ID: ${rows[index].id}] Iniciando petición a Gemini...`);
    
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'processing', error: undefined };
      return updated;
    });

    try {
      // Usamos Promise.race para el timeout
      const result = await withTimeout(
        generateNLUAndPrompt(rows[index].spanish, rows[index].english),
        TIMEOUT_MS
      );
      
      setRows(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          nlu: result.nlu,
          visualElements: result.visualElements,
          imagePrompt: result.imagePrompt,
          svgCode: result.svgCode,
          status: 'completed'
        };
        return updated;
      });
      addLog('success', `[ID: ${rows[index].id}] Procesado correctamente.`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      addLog('error', `[ID: ${rows[index].id}] Falló: ${errorMsg}`);
      setRows(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].status = 'error';
          updated[index].error = errorMsg;
        }
        return updated;
      });
    }
  };

  const processRows = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStopRequested(false);
    
    const pendingRows = rows.filter(r => r.status !== 'completed');
    setProcessingStats({ current: 0, total: pendingRows.length, startTime: Date.now() });

    for (let i = 0; i < rows.length; i++) {
      if (stopRequested) {
        addLog('info', 'Parada de emergencia solicitada por el usuario.');
        break;
      }
      if (rows[i].status === 'completed') continue;
      
      setProcessingStats(prev => ({ ...prev, current: prev.current + 1 }));
      await processSingleRow(i);
    }
    
    setIsProcessing(false);
    setStopRequested(false);
    addLog('info', 'Lote de trabajo finalizado.');
  };

  const forceReset = () => {
    setIsProcessing(false);
    setStopRequested(false);
    setRows(prev => prev.map(r => r.status === 'processing' ? { ...r, status: 'error', error: 'Reset forzado' } : r));
    addLog('info', 'Sistema reseteado manualmente.');
  };

  const clearRows = () => {
    if (window.confirm('¿Borrar dataset?')) {
      setRows([]);
      addLog('info', 'Dataset vaciado.');
    }
  };

  const exportResults = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Español,Inglés,NLU,Visual Elements,Image Prompt,SVG"].join(",") + "\n"
      + rows.map(r => `"${r.id}","${r.spanish}","${r.english}","${(typeof r.nlu === 'object' ? JSON.stringify(r.nlu) : r.nlu || '').replace(/"/g, '""')}","${(r.visualElements || '').replace(/"/g, '""')}","${(r.imagePrompt || '').replace(/"/g, '""')}","${(r.svgCode || '').replace(/"/g, '""')}"`).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `picto_factory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white shadow-lg transition-colors ${isProcessing ? 'bg-indigo-600 animate-pulse' : 'bg-slate-900'}`}>
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">MediaFranca Architect</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                {isProcessing ? (
                  <>
                    <Activity size={10} className="text-indigo-500" /> 
                    Procesando {processingStats.current}/{processingStats.total}
                  </>
                ) : 'SVG Semantic Factory'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rows.length > 0 && (
              <div className="flex items-center gap-2">
                {!isProcessing ? (
                  <button onClick={processRows} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95">
                    <Play size={16} fill="currentColor" /> Procesar Todo
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setStopRequested(true)} disabled={stopRequested} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95">
                      <Square size={16} fill="currentColor" /> {stopRequested ? "Parando..." : "Detener"}
                    </button>
                    <button onClick={forceReset} title="Reset Forzado si se queda pegado" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg">
                      <Zap size={16} />
                    </button>
                  </div>
                )}
                <button onClick={exportResults} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                  <Download size={16} /> CSV
                </button>
              </div>
            )}
            <button onClick={clearRows} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Eraser size={20} /></button>
            <button onClick={() => setShowConsole(!showConsole)} className={`p-2 rounded-lg transition-colors ${showConsole ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}><Terminal size={20} /></button>
          </div>
        </div>
      </header>

      {isProcessing && (
        <div className="w-full h-1 bg-slate-100 overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
            style={{ width: `${(processingStats.current / processingStats.total) * 100}%` }}
          />
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-32">
        {rows.length === 0 ? (
          <div className="mt-20 max-w-xl mx-auto text-center bg-white p-12 rounded-3xl border border-slate-200 shadow-xl">
             <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Upload className="text-indigo-600" size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">Semantic Generator</h2>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">Arquitectura semántica de pictogramas con NLU embebido y diseño SVG jerárquico.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl">
                <FileText size={20} /> Importar Datos
              </button>
              <button onClick={() => setRows([{ id: `${Date.now()}`, spanish: '', english: '', status: 'idle' }])} className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 px-8 py-4 rounded-2xl font-bold transition-all">
                <Plus size={20} /> Nueva Fila
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.tsv,.txt" className="hidden" />
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, idx) => (
              <RowItem 
                key={row.id + idx} 
                row={row} 
                index={idx}
                onUpdate={(idx, field, value) => {
                  setRows(prev => {
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], [field]: value };
                    return updated;
                  });
                }}
                onDelete={(idx) => setRows(prev => prev.filter((_, i) => i !== idx))}
                onProcess={(force) => processSingleRow(idx, force)}
                disabled={isProcessing}
              />
            ))}
          </div>
        )}
      </main>

      {showConsole && (
        <div className="fixed bottom-0 left-0 right-0 h-80 bg-slate-900/95 backdrop-blur-md text-slate-300 border-t border-slate-700 shadow-2xl z-30 font-mono flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-800/50">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-400">
              <Terminal size={14} /> System Traceback
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => setLogs([])} className="text-[10px] text-slate-500 hover:text-slate-300 font-bold">Clear</button>
               <button onClick={() => setShowConsole(false)} className="text-slate-500 hover:text-white transition-colors"><XCircle size={18} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 space-y-2 text-[11px]">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 italic">No hay actividad registrada aún...</div>
            ) : logs.map(log => (
              <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-indigo-400'}>[{log.type.toUpperCase()}]</span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

const RowItem: React.FC<{
  row: RowData;
  index: number;
  onUpdate: (idx: number, field: any, value: string) => void;
  onDelete: (idx: number) => void;
  onProcess: (force: boolean) => void;
  disabled: boolean;
}> = ({ row, index, onUpdate, onDelete, onProcess, disabled }) => {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (row.status === 'processing') {
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [row.status]);

  const downloadSVG = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!row.svgCode) return;
    const blob = new Blob([row.svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `picto_${row.id}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all ${expanded ? 'border-indigo-200 shadow-xl' : 'border-slate-200 hover:border-slate-300 shadow-sm'} ${row.status === 'processing' ? 'ring-2 ring-indigo-500/20' : ''}`}>
      <div 
        className="p-4 flex items-center gap-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 text-center text-[10px] font-mono font-bold text-slate-400">{row.id}</div>
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Español</div>
            <input 
              value={row.spanish} 
              onClick={e => e.stopPropagation()}
              onChange={(e) => onUpdate(index, 'spanish', e.target.value)} 
              className="w-full bg-transparent text-sm font-medium text-slate-600 focus:outline-none" 
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">English</div>
            <input 
              value={row.english} 
              onClick={e => e.stopPropagation()}
              onChange={(e) => onUpdate(index, 'english', e.target.value)} 
              className="w-full bg-transparent text-sm font-black text-slate-800 focus:outline-none" 
            />
          </div>
        </div>

        <div className="w-32 flex justify-center">
          {row.svgCode ? (
            <div 
              className="w-12 h-12 bg-white border border-slate-100 rounded-lg shadow-sm p-0.5 flex items-center justify-center overflow-hidden"
              dangerouslySetInnerHTML={{ __html: row.svgCode.replace(/<svg/, '<svg width="100%" height="100%"') }}
            />
          ) : (
            <div className={`w-12 h-12 border border-dashed rounded-lg flex items-center justify-center text-slate-300 ${row.status === 'processing' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
              {row.status === 'processing' ? <Loader2 size={16} className="text-indigo-600 animate-spin" /> : <ImageIcon size={16} />}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {row.status === 'processing' ? (
            <div className="flex flex-col items-center">
              <Loader2 size={18} className="text-indigo-600 animate-spin" />
              <span className="text-[8px] font-mono font-bold mt-1 text-indigo-400">{elapsed}s</span>
            </div>
          ) : row.status === 'completed' ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : row.status === 'error' ? (
            <span title={row.error}><AlertCircle size={18} className="text-rose-500" /></span>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
          )}
          
          <div className="flex items-center gap-1 ml-4" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => onProcess(row.status === 'completed')} 
              disabled={disabled && row.status !== 'processing'} 
              className={`p-2 rounded-lg transition-colors ${row.status === 'processing' ? 'text-rose-400 hover:bg-rose-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
              title={row.status === 'processing' ? "Cancelar (Timeout simulado)" : "Procesar"}
            >
              {row.status === 'completed' ? <RefreshCw size={18} /> : row.status === 'processing' ? <Square size={16} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button onClick={() => onDelete(index)} disabled={disabled && row.status === 'processing'} className="p-2 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30"><Trash2 size={18} /></button>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-50 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Eye size={14} className="text-indigo-500" /> Visual Elements (Hierarchy)
                </label>
                <textarea 
                  value={row.visualElements || ''}
                  onChange={e => onUpdate(index, 'visualElements', e.target.value)}
                  placeholder={row.status === 'processing' ? "Esperando respuesta de Gemini..." : "Estructura visual..."}
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} className="text-indigo-500" /> Image Prompt (Layout & Style)
                </label>
                <textarea 
                  value={row.imagePrompt || ''}
                  onChange={e => onUpdate(index, 'imagePrompt', e.target.value)}
                  placeholder={row.status === 'processing' ? "Generando descripción..." : "Detalles del prompt..."}
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-indigo-500" /> SVG Preview
                </label>
                {row.svgCode && (
                  <button onClick={downloadSVG} className="text-indigo-600 hover:text-indigo-700 text-[10px] font-black uppercase flex items-center gap-1">
                    <Download size={12} /> Download
                  </button>
                )}
              </div>
              <div className="bg-white border-2 border-slate-100 rounded-2xl flex-1 min-h-[200px] flex items-center justify-center p-8 shadow-inner overflow-hidden relative">
                {row.status === 'processing' && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 animate-in fade-in duration-500">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Contactando Modelo</span>
                      <span className="text-[9px] font-mono text-slate-400">Tiempo transcurrido: {elapsed}s</span>
                    </div>
                  </div>
                )}
                <div className="w-full max-w-[160px] aspect-square" dangerouslySetInnerHTML={{ __html: row.svgCode || '' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} className="text-indigo-500" /> NLU Metadata
                  </label>
                  <button onClick={() => navigator.clipboard.writeText(JSON.stringify(row.nlu, null, 2))} className="text-indigo-600 text-[10px] font-bold disabled:opacity-30" disabled={!row.nlu}>Copy JSON</button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[10px] h-48 overflow-auto text-slate-600 shadow-inner">
                  {row.nlu ? <pre>{JSON.stringify(row.nlu, null, 2)}</pre> : <span className="text-slate-300 italic">Esperando datos...</span>}
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Code size={14} className="text-indigo-500" /> SVG XML Source
                  </label>
                  <button onClick={() => navigator.clipboard.writeText(row.svgCode || '')} className="text-indigo-600 text-[10px] font-bold disabled:opacity-30" disabled={!row.svgCode}>Copy XML</button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[9px] h-48 overflow-auto text-indigo-300 shadow-xl relative group">
                  {row.svgCode ? <pre className="whitespace-pre-wrap">{row.svgCode}</pre> : <span className="text-slate-700 italic">Esperando código...</span>}
                </div>
             </div>
          </div>

          {row.status === 'error' && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600 animate-in slide-in-from-bottom-2 duration-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div className="text-xs font-mono break-all">{row.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
