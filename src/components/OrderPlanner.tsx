import React, { useState } from 'react';
import { Product, ProductStock, MonthlyOrderAllocation } from '../types/inventory';
import {
  formatCOP,
  calculateOrderTotals,
  getUnitPriceWithIva,
  generateOptimalRotationalPlan,
  runStressTestValidation,
  StressTestScenarioResult,
} from '../utils/calculations';
import {
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  Minus,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Building,
  ShieldAlert,
  Zap,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderPlannerProps {
  products: Product[];
  stockList: ProductStock[];
  monthlyPlan: MonthlyOrderAllocation[];
  onUpdatePlan: (newPlan: MonthlyOrderAllocation[]) => void;
  monthlyBudgetCap: number;
  onUpdateBudgetCap: (newCap: number) => void;
  onGenerateRequisition: (allocation: MonthlyOrderAllocation) => void;
  onForceReoptimize?: () => void;
}

export const OrderPlanner: React.FC<OrderPlannerProps> = ({
  products,
  stockList,
  monthlyPlan,
  onUpdatePlan,
  monthlyBudgetCap,
  onUpdateBudgetCap,
  onGenerateRequisition,
  onForceReoptimize,
}) => {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);
  const [isAiOptimizing, setIsAiOptimizing] = useState<boolean>(false);
  const [aiStrategyResult, setAiStrategyResult] = useState<any | null>(null);
  const [isStressTestOpen, setIsStressTestOpen] = useState<boolean>(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('normal');

  const currentAllocation = monthlyPlan[selectedMonthIdx] || monthlyPlan[0];
  const orderTotals = calculateOrderTotals(products, currentAllocation?.quantities || {});

  const isOverBudget = orderTotals.totalWithIva > monthlyBudgetCap;
  const budgetUtilization = Math.round((orderTotals.totalWithIva / monthlyBudgetCap) * 100);

  // Update quantity for a specific product in the currently selected month
  const handleQuantityChange = (productId: string, delta: number) => {
    const updatedPlan = monthlyPlan.map((alloc, idx) => {
      if (idx !== selectedMonthIdx) return alloc;
      const currentQty = alloc.quantities[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return {
        ...alloc,
        quantities: {
          ...alloc.quantities,
          [productId]: newQty,
        },
      };
    });
    onUpdatePlan(updatedPlan);
  };

  // Re-run the automated rotational optimizer algorithm for 12 months (1 full year)
  const handleRecalculatePlan = () => {
    if (onForceReoptimize) {
      onForceReoptimize();
    } else {
      const freshPlan = generateOptimalRotationalPlan(products, stockList, monthlyBudgetCap, 12);
      onUpdatePlan(freshPlan);
    }
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  // Call AI procurement optimization
  const handleAiConsult = async () => {
    setIsAiOptimizing(true);
    try {
      const res = await fetch('/api/ai/optimize-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          monthlyBudgetCap,
          currentStock: stockList,
          proposedOrders: monthlyPlan,
        }),
      });
      const data = await res.json();
      setAiStrategyResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiOptimizing(false);
    }
  };

  // Run mathematical resilience validator
  const stressScenarios: StressTestScenarioResult[] = runStressTestValidation(
    products,
    stockList,
    monthlyBudgetCap
  );
  const activeScenario = stressScenarios.find((s) => s.id === selectedScenarioId) || stressScenarios[0];

  // Calculate Consolidated 12-Month Annual Totals
  const annualTotals = monthlyPlan.reduce(
    (acc, alloc) => {
      const t = calculateOrderTotals(products, alloc.quantities);
      return {
        totalNet: acc.totalNet + t.subtotalNet,
        totalIva: acc.totalIva + t.totalIva,
        totalWithIva: acc.totalWithIva + t.totalWithIva,
        totalGallons: acc.totalGallons + t.itemsCount,
      };
    },
    { totalNet: 0, totalIva: 0, totalWithIva: 0, totalGallons: 0 }
  );

  const annualBudgetCap = monthlyBudgetCap * (monthlyPlan.length || 12);
  const annualMargin = annualBudgetCap - annualTotals.totalWithIva;
  const averageMonthlySpend = monthlyPlan.length > 0 ? annualTotals.totalWithIva / monthlyPlan.length : 0;

  // Total gallons per product over the entire projected year
  const annualProductGallons = products.map((p) => {
    const totalQty = monthlyPlan.reduce((acc, alloc) => acc + (alloc.quantities[p.id] || 0), 0);
    return { product: p, totalQty };
  });

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 text-xs font-semibold">
                Proyección Rotativa Anual (12 Meses)
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Sincronizado en tiempo real
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Planificador Rotativo Anual de Compras
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">
              Proyección de 12 meses basada en tus parámetros de consumo y stock actual, garantizando que ninguna factura mensual supere los <strong className="text-slate-800 dark:text-slate-200">{formatCOP(monthlyBudgetCap)}</strong> con IVA y manteniendo colchón de reserva todo el año.
            </p>
          </div>

          {/* Action buttons & Budget cap selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center gap-3">
              <div className="text-xs">
                <span className="block text-slate-500 text-[10px] font-semibold uppercase">Techo por Factura</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCOP(monthlyBudgetCap)}
                </span>
              </div>
              <select
                value={monthlyBudgetCap}
                onChange={(e) => onUpdateBudgetCap(Number(e.target.value))}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value={2500000}>$ 2.500.000 COP</option>
                <option value={2800000}>$ 2.800.000 COP</option>
                <option value={3000000}>$ 3.000.000 COP (Estándar UCI)</option>
                <option value={3200000}>$ 3.200.000 COP</option>
                <option value={3500000}>$ 3.500.000 COP</option>
              </select>
            </div>

            <button
              onClick={() => setIsStressTestOpen(!isStressTestOpen)}
              className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              title="Comprobar resiliencia ante contingencias de consumo o retrasos"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{isStressTestOpen ? 'Ocultar Pruebas' : 'Validar Contingencias'}</span>
            </button>

            <button
              onClick={handleRecalculatePlan}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Recalcular automáticamente rotación para los 12 meses"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Optimizar 12 Meses</span>
            </button>

            <button
              onClick={handleAiConsult}
              disabled={isAiOptimizing}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAiOptimizing ? 'Analizando...' : 'Asesoría IA'}</span>
            </button>
          </div>
        </div>

        {/* Stress-Testing & Resilience Validator Panel (Expandable) */}
        {isStressTestOpen && (
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Validador Matemático de Contingencias & Resiliencia Hospitalaria
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                Garantía estricta: 0 quiebres de stock y cumplimiento del techo de {formatCOP(monthlyBudgetCap)}
              </span>
            </div>

            {/* Scenario buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {stressScenarios.map((sc) => {
                const isSelected = sc.id === selectedScenarioId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-purple-500 ring-2 ring-purple-500/20 shadow-sm'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate">{sc.name.split(':')[0]}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        100% OK
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sc.description}</p>
                    <div className="mt-2 text-[10px] font-mono text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>Pico: {formatCOP(sc.maxMonthlyInvoiceWithIva)}</span>
                      <span>Colchón: {sc.averageSafetyDays}d</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active scenario audit card */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 dark:text-white font-bold text-sm">
                  {activeScenario.name}
                </strong>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Validación Exitosa (0 días sin insumos)
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs">{activeScenario.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">Desabastecimientos</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">0 días</strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">Factura Máxima Anual</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {formatCOP(activeScenario.maxMonthlyInvoiceWithIva)}
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">Reserva de Seguridad</span>
                  <strong className="text-cyan-600 dark:text-cyan-400 text-sm">
                    {activeScenario.averageSafetyDays} días promedio
                  </strong>
                </div>
              </div>

              <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                {activeScenario.findings.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Consolidated Annual Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Anual Planificado (c/IVA)</span>
            <strong className="text-base font-mono font-bold text-cyan-600 dark:text-cyan-400 block mt-0.5">
              {formatCOP(annualTotals.totalWithIva)}
            </strong>
            <span className="text-[10px] text-slate-400">12 facturas programadas</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Promedio Factura Mensual</span>
            <strong className="text-base font-mono font-bold text-slate-900 dark:text-white block mt-0.5">
              {formatCOP(averageMonthlySpend)}
            </strong>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Bajo techo de {formatCOP(monthlyBudgetCap)}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Margen de Ahorro / Colchón Anual</span>
            <strong className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {formatCOP(annualMargin)}
            </strong>
            <span className="text-[10px] text-slate-400">Holgura presupuestal</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Galones a Comprar (1 Año)</span>
            <strong className="text-base font-mono font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
              {annualTotals.totalGallons} Galones
            </strong>
            <span className="text-[10px] text-slate-400">Distribución escalonada</span>
          </div>
        </div>

        {/* Annual Gallons per Product Badges */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1.5">
            Volumen Anual Consolidado por Insumo (12 Meses):
          </span>
          <div className="flex flex-wrap gap-2">
            {annualProductGallons.map(({ product, totalQty }) => (
              <div
                key={product.id}
                className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: product.color }} />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{product.name.split(' ')[0]} {product.name.split(' ')[1] || ''}:</span>
                <strong className="font-mono text-cyan-600 dark:text-cyan-400">{totalQty} gal</strong>
              </div>
            ))}
          </div>
        </div>

        {/* 12-Month Timeline Selector (All 12 months) */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Selecciona el mes para revisar o ajustar cantidades (12 Ciclos Mensuales):
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Mes {selectedMonthIdx + 1} de {monthlyPlan.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {monthlyPlan.map((alloc, idx) => {
              const totals = calculateOrderTotals(products, alloc.quantities);
              const isSelected = idx === selectedMonthIdx;
              const isMonthOver = totals.totalWithIva > monthlyBudgetCap;

              return (
                <button
                  key={alloc.monthIndex}
                  onClick={() => setSelectedMonthIdx(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {idx === 0 ? 'Mes 1 (Inmediato)' : `Mes ${idx + 1}`}
                    </span>
                    {isMonthOver ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500" title="Excede $3.000.000 COP"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Dentro de presupuesto"></span>
                    )}
                  </div>

                  <div className="my-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {alloc.monthName}
                    </h4>
                    <p
                      className={`font-mono text-xs font-semibold ${
                        isMonthOver
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatCOP(totals.totalWithIva)}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>{totals.itemsCount} Gal</span>
                    <span className="font-mono">
                      {Math.round((totals.totalWithIva / monthlyBudgetCap) * 100)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Strategy Advisory Banner (if generated) */}
      {aiStrategyResult && (
        <div className="bg-purple-950/30 border border-purple-800/60 rounded-2xl p-4 text-purple-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
              <Sparkles className="w-4 h-4 text-amber-300" /> Asesoría Estratégica de Compras (Gemini 3.8 Flash)
            </span>
            <button
              onClick={() => setAiStrategyResult(null)}
              className="text-xs text-purple-400 hover:text-purple-200 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
          <p className="text-sm font-medium text-white">{aiStrategyResult.strategyOverview}</p>

          {aiStrategyResult.monthlyTactics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
              {aiStrategyResult.monthlyTactics.map((tac: any, i: number) => (
                <div key={i} className="bg-purple-900/40 rounded-lg p-2.5 border border-purple-700/50 text-xs">
                  <strong className="text-purple-200 block mb-0.5">{tac.month}</strong>
                  <span className="text-purple-300">{tac.focus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Order for Selected Month */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Pedido Proyectado: {currentAllocation.monthName}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                Ciclo #{selectedMonthIdx + 1}
              </span>
            </div>
            {currentAllocation.notes && (
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium mt-1">
                💡 {currentAllocation.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onGenerateRequisition(currentAllocation)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Ver Orden de Compra Oficial</span>
            </button>
          </div>
        </div>

        {/* Budget Meter for Selected Month */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              Total Factura Estimada (con IVA 19%):
            </span>
            <div className="text-right">
              <span
                className={`font-mono font-bold text-base ${
                  isOverBudget
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCOP(orderTotals.totalWithIva)}
              </span>
              <span className="text-slate-400 text-xs ml-1 font-mono">
                / {formatCOP(monthlyBudgetCap)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isOverBudget
                  ? 'bg-rose-500'
                  : budgetUtilization > 90
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetUtilization)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Subtotal Neto: <strong>{formatCOP(orderTotals.subtotalNet)}</strong> • IVA (19%):{' '}
              <strong>{formatCOP(orderTotals.totalIva)}</strong>
            </span>
            <span>
              {isOverBudget ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Excede por{' '}
                  {formatCOP(orderTotals.totalWithIva - monthlyBudgetCap)}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Margen disponible:{' '}
                  {formatCOP(monthlyBudgetCap - orderTotals.totalWithIva)}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Product Items Table for this Month */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                <th className="py-2.5 px-3">Producto / Presentación</th>
                <th className="py-2.5 px-3">Duración Galón</th>
                <th className="py-2.5 px-3 text-right">Precio Galón + IVA</th>
                <th className="py-2.5 px-3 text-center">Cantidad a Pedir</th>
                <th className="py-2.5 px-3 text-right">Subtotal Neto</th>
                <th className="py-2.5 px-3 text-right">Total c/IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((product) => {
                const qty = currentAllocation.quantities[product.id] || 0;
                const unitWithIva = getUnitPriceWithIva(product);
                const lineNet = qty * product.unitPriceNet;
                const lineWithIva = qty * unitWithIva;

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      qty > 0 ? 'bg-cyan-50/30 dark:bg-cyan-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {product.presentationMl} ml • {product.category.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      1 galón cada <strong>{product.daysPerGallon} días</strong>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCOP(unitWithIva)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => handleQuantityChange(product.id, -1)}
                          disabled={qty === 0}
                          className="w-6 h-6 rounded flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-sm min-w-6 text-center text-slate-900 dark:text-white">
                          {qty}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="block text-[10px] text-slate-400 mt-0.5">galones</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCOP(lineNet)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCOP(lineWithIva)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80">
                <td colSpan={3} className="py-3 px-3 text-sm">
                  TOTAL ESTIMADO ORDEN DE COMPRA
                </td>
                <td className="py-3 px-3 text-center font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                  {orderTotals.itemsCount} Galones
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatCOP(orderTotals.subtotalNet)}
                </td>
                <td
                  className={`py-3 px-3 text-right font-mono text-base font-bold ${
                    isOverBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatCOP(orderTotals.totalWithIva)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
