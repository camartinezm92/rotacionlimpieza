import React from 'react';
import { Activity, ShieldAlert, Sparkles, Download, Upload, RotateCcw, Building2, FileSpreadsheet } from 'lucide-react';
import { formatCOP } from '../utils/calculations';

interface HeaderProps {
  totalDailyCostWithIva: number;
  criticalItemsCount: number;
  monthlyBudgetCap: number;
  onOpenAiChat: () => void;
  onResetToInitial: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onExportExcel: () => void;
  activeTab: string;
  setActiveTab: (tab: 'inventario' | 'planificador' | 'presupuesto' | 'auditoria' | 'ia') => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalDailyCostWithIva,
  criticalItemsCount,
  monthlyBudgetCap,
  onOpenAiChat,
  onResetToInitial,
  onExportData,
  onImportData,
  onExportExcel,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      {/* Top hospital banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/30">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> UCI Honda • Tolima
                </span>
                <span className="text-xs text-slate-400">Ing. Biomédica</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                BioStock CRM <span className="text-xs font-normal text-cyan-400 font-mono">v2.5</span>
              </h1>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 text-xs">
            {/* Daily spend metric */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Gasto Diario Estimado</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">{formatCOP(totalDailyCostWithIva)}/día</span>
            </div>

            {/* Budget Cap */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Techo Mensual Máx</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{formatCOP(monthlyBudgetCap)}</span>
            </div>

            {/* Critical stock indicator */}
            {criticalItemsCount > 0 ? (
              <div className="bg-rose-950/60 border border-rose-700/70 rounded-lg px-3 py-1.5 flex items-center gap-2 text-rose-300 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-rose-400">Stock Crítico (&lt;7d)</span>
                  <span className="text-sm font-bold">{criticalItemsCount} Insumos</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-medium">Stock Estable</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 ml-auto md:ml-0">
              <button
                onClick={onExportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 text-xs transition-all cursor-pointer"
                title="Descargar Plan de Compras Completo en Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>Descargar Excel</span>
              </button>

              <button
                onClick={onOpenAiChat}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 shadow-md shadow-purple-600/20 text-xs transition-all cursor-pointer"
                title="Abrir Asistente Clínico Inteligente"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Asistente IA</span>
              </button>

              <button
                onClick={onExportData}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Exportar respaldo JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onImportData}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Importar datos JSON"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onResetToInitial}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
                title="Restablecer al stock inicial provisto por UCI Honda"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 mt-4 pt-2 border-t border-slate-800/80 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'inventario'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>📦 Inventario & Stock Real</span>
            {criticalItemsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {criticalItemsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('planificador')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'planificador'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>📅 Planificador Rotativo (Max $3M)</span>
          </button>

          <button
            onClick={() => setActiveTab('presupuesto')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'presupuesto'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>💰 Presupuesto Mensual & Anual</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'auditoria'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>📈 Curvas de Consumo & Auditorías</span>
          </button>

          <button
            onClick={() => setActiveTab('ia')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ia'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-purple-300 hover:text-purple-100 hover:bg-purple-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Diagnóstico IA Gemini 3.8</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
