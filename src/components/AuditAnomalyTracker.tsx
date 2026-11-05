import React, { useState } from 'react';
import { Product, ProductStock, StockAuditLog, MonthlyOrderAllocation, AiAnalysisReport } from '../types/inventory';
import {
  formatCOP,
  formatNumber,
  getDailyMl,
  getTotalStockMl,
} from '../utils/calculations';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Info,
  ShieldAlert,
  Layers,
} from 'lucide-react';

interface AuditAnomalyTrackerProps {
  products: Product[];
  stockList: ProductStock[];
  auditLogs: StockAuditLog[];
  monthlyPlan?: MonthlyOrderAllocation[];
  onAddAuditLog: (log: StockAuditLog) => void;
  onDeleteAuditLog: (id: string) => void;
  monthlyBudgetCap: number;
}

export const AuditAnomalyTracker: React.FC<AuditAnomalyTrackerProps> = ({
  products,
  stockList,
  auditLogs,
  monthlyPlan = [],
  onAddAuditLog,
  onDeleteAuditLog,
  monthlyBudgetCap,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'quirucidal_jabon');
  const [auditDate, setAuditDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [closedGallons, setClosedGallons] = useState<number>(1);
  const [openFraction, setOpenFraction] = useState<number>(0.5); // 50%
  const [smallBottles, setSmallBottles] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [chartMode, setChartMode] = useState<'sawtooth' | 'burndown'>('sawtooth');

  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<AiAnalysisReport | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Helper: calculate expected stock on auditDate considering initial stock, daily burn rate, and scheduled replenishments
  const calculateExpectedStock = (product: Product, dateStr: string): number => {
    const baselineStock = stockList.find((s) => s.productId === product.id);
    const initialMl = baselineStock ? getTotalStockMl(product, baselineStock) : product.presentationMl * 2;
    const now = new Date();
    const target = new Date(dateStr);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dailyMl = getDailyMl(product);

    if (diffDays <= 0) {
      return initialMl;
    }

    // How many 30-day replenishment orders arrived before target date?
    const cyclesElapsed = Math.floor(diffDays / 30);
    let replenishmentMl = 0;
    for (let c = 0; c < cyclesElapsed && c < monthlyPlan.length; c++) {
      const orderQty = monthlyPlan[c]?.quantities[product.id] || 0;
      replenishmentMl += orderQty * product.presentationMl;
    }

    const netExpected = initialMl - dailyMl * diffDays + replenishmentMl;
    return Math.max(0, netExpected);
  };

  const handleRegisterAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const actualMl =
      closedGallons * selectedProduct.presentationMl +
      openFraction * selectedProduct.presentationMl +
      smallBottles * 500;

    const expectedMl = calculateExpectedStock(selectedProduct, auditDate);
    const deviationPercent = expectedMl > 0 ? ((actualMl - expectedMl) / expectedMl) * 100 : 0;

    let severity: 'normal' | 'alerta_leve' | 'critico' = 'normal';
    // If actual is significantly less than expected, overconsumption / leak / surge
    if (deviationPercent < -25 || deviationPercent > 40) {
      severity = 'critico';
    } else if (deviationPercent < -12 || deviationPercent > 20) {
      severity = 'alerta_leve';
    }

    const newLog: StockAuditLog = {
      id: 'audit_' + Date.now(),
      date: auditDate,
      productId: selectedProductId,
      actualStockMl: actualMl,
      expectedStockMl: expectedMl,
      deviationPercent,
      notes: notes || 'Conteo físico de verificación de inventario UCI Honda',
      severity,
    };

    onAddAuditLog(newLog);
    setNotes('');
  };

  const handleRunAiAudit = async () => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/ai/analyze-consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          audits: auditLogs,
          monthlyBudgetCap,
          simulationHorizonMonths: 12,
        }),
      });
      const data = await res.json();
      setAiReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Filter logs for selected product
  const productLogs = auditLogs
    .filter((log) => log.productId === selectedProductId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Data for chart visualization
  const currentStock = stockList.find((s) => s.productId === selectedProductId);
  const initialStockMl = currentStock ? getTotalStockMl(selectedProduct, currentStock) : selectedProduct.presentationMl * 2;
  const dailyMl = getDailyMl(selectedProduct);
  const safetyBufferMl = (selectedProduct.recommendedSafetyDays || 12) * dailyMl;

  // Timeline horizon for chart
  const horizonDays = chartMode === 'sawtooth' ? 180 : Math.max(45, Math.ceil((initialStockMl / (dailyMl || 1)) * 1.2));
  const chartWidth = 650;
  const chartHeight = 240;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  // Compute maximum ML for Y axis scaling
  // In sawtooth mode, calculate max stock reached across the 6 cycles
  let peakStockMl = initialStockMl;
  let runningSimMl = initialStockMl;
  for (let m = 0; m < 6; m++) {
    const qty = monthlyPlan[m]?.quantities[selectedProduct.id] || 0;
    runningSimMl = Math.max(0, runningSimMl - dailyMl * 30) + qty * selectedProduct.presentationMl;
    if (runningSimMl > peakStockMl) peakStockMl = runningSimMl;
  }
  const maxMl = Math.max(peakStockMl * 1.25, selectedProduct.presentationMl * 3, safetyBufferMl * 2);

  const getX = (days: number) => paddingLeft + (days / horizonDays) * (chartWidth - paddingLeft - paddingRight);
  const getY = (ml: number) => chartHeight - paddingBottom - (ml / maxMl) * (chartHeight - paddingTop - paddingBottom);

  // Generate sawtooth curve path points (Day 0 to Day 180)
  const sawtoothPoints: { x: number; y: number }[] = [];
  let currentSimMl = initialStockMl;
  sawtoothPoints.push({ x: getX(0), y: getY(currentSimMl) });

  for (let day = 1; day <= horizonDays; day++) {
    currentSimMl = Math.max(0, currentSimMl - dailyMl);
    // At day 30, 60, 90, 120, 150, 180 replenishment arrives
    if (day % 30 === 0) {
      const monthIdx = (day / 30) - 1;
      const orderQty = monthlyPlan[monthIdx]?.quantities[selectedProduct.id] || 0;
      sawtoothPoints.push({ x: getX(day), y: getY(currentSimMl) });
      currentSimMl += orderQty * selectedProduct.presentationMl;
      sawtoothPoints.push({ x: getX(day), y: getY(currentSimMl) });
    }
  }
  sawtoothPoints.push({ x: getX(horizonDays), y: getY(currentSimMl) });

  const sawtoothSvgPath = sawtoothPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  // Pure burn-down line to zero
  const daysToZero = dailyMl > 0 ? initialStockMl / dailyMl : 999;
  const burnDownEndX = getX(Math.min(horizonDays, daysToZero));
  const burnDownEndY = getY(0);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-xs font-semibold">
                Control Metrológico & Auditoría Clínica
              </span>
              <span className="text-xs text-slate-500 font-mono">Curvas Real vs Teórico</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Detección de Anomalías y Curvas de Consumo
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">
              Registra los conteos físicos periódicos (ej. fin de mes, marzo). La plataforma proyecta la curva esperada según la duración teórica de cada galón y alerta automáticamente si hay sobreconsumo (posible fuga, desperdicio o pico de aislamiento en UCI) o subconsumo.
            </p>
          </div>

          <button
            onClick={handleRunAiAudit}
            disabled={isAnalyzingAi}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/20"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isAnalyzingAi ? 'Auditoría IA en proceso...' : 'Auditoría Profunda con IA'}</span>
          </button>
        </div>
      </div>

      {/* AI Report Display if available */}
      {aiReport && (
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-700/50 rounded-2xl p-5 shadow-lg text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <h3 className="font-bold text-base text-white">
                Informe de Auditoría Clínica Asistida por IA
              </h3>
            </div>
            <button
              onClick={() => setAiReport(null)}
              className="text-xs text-purple-300 hover:text-white cursor-pointer"
            >
              Cerrar informe
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-purple-900/30 p-3 rounded-xl border border-purple-800/40">
            {aiReport.summary}
          </p>

          {/* Alerts Grid */}
          {aiReport.alerts && aiReport.alerts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiReport.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    alert.severity === 'alta'
                      ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                      : alert.severity === 'media'
                      ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
                      : 'bg-blue-950/40 border-blue-700/60 text-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="uppercase text-[10px] tracking-wider">{alert.product}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded uppercase ${
                        alert.severity === 'alta'
                          ? 'bg-rose-800 text-white'
                          : alert.severity === 'media'
                          ? 'bg-amber-800 text-white'
                          : 'bg-blue-800 text-white'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <strong className="block text-white text-xs">{alert.title}</strong>
                  <p className="text-[11px] leading-tight text-slate-300">{alert.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {aiReport.aiRecommendations && (
            <div className="pt-2">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                Recomendaciones Clínicas & Biomédicas
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {aiReport.aiRecommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Input Form & Interactive SVG Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Add Count (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Registrar Conteo de Auditoría
            </h3>
          </div>

          <form onSubmit={handleRegisterAudit} className="space-y-3.5 text-xs">
            {/* Product selection */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Insumo a Auditar:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (1 galón cada {p.daysPerGallon} días)
                  </option>
                ))}
              </select>
            </div>

            {/* Date selection */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Fecha del Conteo Físico:
              </label>
              <input
                type="date"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Physical Count inputs */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">
                  Galones Cerrados
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={closedGallons}
                  onChange={(e) => setClosedGallons(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">
                  Abierto (%)
                </label>
                <select
                  value={openFraction}
                  onChange={(e) => setOpenFraction(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center font-mono text-xs text-slate-900 dark:text-white"
                >
                  <option value={0}>0 (Vacío)</option>
                  <option value={0.25}>25% (1/4)</option>
                  <option value={0.5}>50% (1/2)</option>
                  <option value={0.75}>75% (3/4)</option>
                  <option value={1.0}>100% (Lleno)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">
                  Frascos 500ml
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={smallBottles}
                  onChange={(e) => setSmallBottles(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Observaciones Clínicas / Causa del Conteo:
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Auditoría de fin de mes, se observó incremento en consumo por camas aisladas en UCI..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm text-xs"
            >
              Registrar & Evaluar Desviación
            </button>
          </form>
        </div>

        {/* Right: SVG Consumption Curve & Diagnostic Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Curva de Dinámica Hospitalaria: {selectedProduct.name}
              </h3>
              <p className="text-xs text-slate-500">
                Consumo: {formatNumber(dailyMl, 1)} ml/día (1 galón cada {selectedProduct.daysPerGallon} días)
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setChartMode('sawtooth')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  chartMode === 'sawtooth'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Onda de Reposición (180d)
              </button>
              <button
                onClick={() => setChartMode('burndown')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  chartMode === 'burndown'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Agotamiento Puro
              </button>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-800 overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[550px]"
            >
              {/* Axes */}
              <line
                x1={paddingLeft}
                y1={getY(0)}
                x2={chartWidth - paddingRight}
                y2={getY(0)}
                stroke="#94a3b8"
                strokeWidth="1.5"
              />
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={chartHeight - paddingBottom}
                stroke="#94a3b8"
                strokeWidth="1.5"
              />

              {/* Grid horizontal ticks */}
              {[0, 0.33, 0.66, 1.0].map((ratio, idx) => {
                const mlVal = maxMl * ratio;
                const yPos = getY(mlVal);
                return (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={chartWidth - paddingRight}
                      y2={yPos}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                    >
                      {Math.round(mlVal)}ml
                    </text>
                  </g>
                );
              })}

              {/* Grid vertical ticks (days) */}
              {[0, 30, 60, 90, 120, 150, 180].filter(d => d <= horizonDays).map((d) => {
                const xPos = getX(d);
                return (
                  <g key={d}>
                    <line
                      x1={xPos}
                      y1={paddingTop}
                      x2={xPos}
                      y2={chartHeight - paddingBottom}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={xPos}
                      y={chartHeight - paddingBottom + 14}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                    >
                      +{d}d
                    </text>
                  </g>
                );
              })}

              {/* Red Safety Buffer Line */}
              <line
                x1={paddingLeft}
                y1={getY(safetyBufferMl)}
                x2={chartWidth - paddingRight}
                y2={getY(safetyBufferMl)}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              <text
                x={chartWidth - paddingRight - 4}
                y={getY(safetyBufferMl) - 4}
                textAnchor="end"
                fontSize="8"
                fontWeight="bold"
                fill="#f43f5e"
              >
                Colchón Seguridad ({Math.round(safetyBufferMl)} ml)
              </text>

              {/* Dynamic Curves */}
              {chartMode === 'sawtooth' ? (
                <>
                  <path
                    d={sawtoothSvgPath}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />
                  {/* Replenishment dots at 30d increments */}
                  {[30, 60, 90, 120, 150].filter(d => d <= horizonDays).map((d) => (
                    <circle
                      key={d}
                      cx={getX(d)}
                      cy={getY(0)}
                      r="2"
                      fill="#06b6d4"
                    />
                  ))}
                </>
              ) : (
                <>
                  {/* Pure burn line */}
                  <line
                    x1={getX(0)}
                    y1={getY(initialStockMl)}
                    x2={burnDownEndX}
                    y2={burnDownEndY}
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                </>
              )}

              {/* Initial stock marker */}
              <circle
                cx={getX(0)}
                cy={getY(initialStockMl)}
                r="5"
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Real audited data points */}
              {productLogs.map((log) => {
                const now = new Date();
                const logDate = new Date(log.date);
                const diffDays = Math.round((logDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const clampedDays = Math.min(horizonDays, Math.max(0, diffDays));
                const x = getX(clampedDays);
                const y = getY(log.actualStockMl);

                const isAnomalous = Math.abs(log.deviationPercent) > 20;

                return (
                  <g key={log.id} className="cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill={isAnomalous ? '#ef4444' : '#8b5cf6'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill={isAnomalous ? '#ef4444' : '#8b5cf6'}
                    >
                      {Math.round(log.actualStockMl)}ml ({log.deviationPercent > 0 ? '+' : ''}
                      {log.deviationPercent.toFixed(0)}%)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend and explanation */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-medium">
                <span className="w-3 h-0.5 bg-cyan-500 inline-block"></span> Onda de Consumo + Compras
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="w-3 h-0.5 border-b border-rose-500 border-dashed inline-block"></span> Umbral de Seguridad
              </span>
              <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Auditoría Normal
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Alerta de Desviación
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              {daysToZero < 999 ? `Autonomía actual: ${daysToZero.toFixed(1)} días` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Audit History Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Historial de Auditorías & Registro de Desviaciones
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {auditLogs.length} registros auditados
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Aún no has registrado conteos periódicos. Usa el formulario superior para registrar el primer conteo de prueba.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Insumo</th>
                  <th className="py-2.5 px-3 text-right">Stock Físico</th>
                  <th className="py-2.5 px-3 text-right">Stock Esperado</th>
                  <th className="py-2.5 px-3 text-center">Desviación</th>
                  <th className="py-2.5 px-3">Diagnóstico / Observación</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => {
                  const prod = products.find((p) => p.id === log.productId) || products[0];
                  const isSevere = log.severity === 'critico';
                  const isModerate = log.severity === 'alerta_leve';

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {log.date}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {prod.name}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatNumber(log.actualStockMl, 0)} ml
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {formatNumber(log.expectedStockMl, 0)} ml
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                            isSevere
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : isModerate
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {log.deviationPercent > 0 ? '+' : ''}
                          {log.deviationPercent.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {log.notes}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onDeleteAuditLog(log.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
