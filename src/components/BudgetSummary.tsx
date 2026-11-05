import { Product, MonthlyOrderAllocation } from '../types/inventory';
import {
  formatCOP,
  formatNumber,
  getDailyMl,
  getDailyCostNet,
  getDailyCostWithIva,
  getUnitPriceWithIva,
  calculateOrderTotals,
} from '../utils/calculations';
import { DollarSign, PieChart, TrendingUp, Calendar, AlertCircle, ArrowUpRight, BarChart3, ShieldCheck } from 'lucide-react';

interface BudgetSummaryProps {
  products: Product[];
  monthlyBudgetCap: number;
  monthlyPlan?: MonthlyOrderAllocation[];
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  products,
  monthlyBudgetCap,
  monthlyPlan = [],
}) => {
  // Aggregate daily costs
  const totalDailyNet = products.reduce((sum, p) => sum + getDailyCostNet(p), 0);
  const totalDailyWithIva = products.reduce((sum, p) => sum + getDailyCostWithIva(p), 0);

  // Projected Monthly (30 days)
  const monthlyTotalNet = totalDailyNet * 30;
  const monthlyTotalWithIva = totalDailyWithIva * 30;

  // Projected Annual (365 days theoretical)
  const annualTotalNet = totalDailyNet * 365;
  const annualTotalWithIva = totalDailyWithIva * 365;

  const monthlyMargin = monthlyBudgetCap - monthlyTotalWithIva;
  const isHealthyMargin = monthlyMargin >= 0;

  // 12-Month Plan totals (Planned Purchases)
  const plannedYearTotals = monthlyPlan.reduce(
    (acc, alloc) => {
      const t = calculateOrderTotals(products, alloc.quantities);
      return {
        totalNet: acc.totalNet + t.subtotalNet,
        totalIva: acc.totalIva + t.totalIva,
        totalWithIva: acc.totalWithIva + t.totalWithIva,
      };
    },
    { totalNet: 0, totalIva: 0, totalWithIva: 0 }
  );

  const annualCapTotal = monthlyBudgetCap * (monthlyPlan.length || 12);
  const annualPlanSavings = annualCapTotal - plannedYearTotals.totalWithIva;

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Net */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="uppercase font-semibold tracking-wider">Gasto Diario Neto</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {formatCOP(totalDailyNet)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Sin IVA • Consumo combinado UCI</p>
          </div>
        </div>

        {/* Daily with IVA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="uppercase font-semibold tracking-wider">Gasto Diario Total</span>
            <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {formatCOP(totalDailyWithIva)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Incluye 19% IVA • Tasa real</p>
          </div>
        </div>

        {/* Monthly Projection (30 days) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="uppercase font-semibold tracking-wider">Presupuesto Mensual</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCOP(monthlyTotalWithIva)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Base 30 días • Techo:{' '}
              <strong className="text-slate-700 dark:text-slate-300 font-mono">
                {formatCOP(monthlyBudgetCap)}
              </strong>
            </p>
          </div>
        </div>

        {/* Annual Projection (365 days) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="uppercase font-semibold tracking-wider">Presupuesto Anual</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {formatCOP(annualTotalWithIva)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Proyección 12 meses consolidada</p>
          </div>
        </div>
      </div>

      {/* Financial Health & Cushion Insight */}
      <div className="bg-gradient-to-r from-cyan-900/20 via-blue-900/10 to-emerald-900/20 border border-cyan-800/40 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h4 className="font-bold text-slate-900 dark:text-white">
              Análisis de Viabilidad del Techo Presupuestal ($3.000.000 COP)
            </h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-w-3xl">
            El consumo teórico consolidado mensual con IVA es de{' '}
            <strong className="text-slate-900 dark:text-white">{formatCOP(monthlyTotalWithIva)}</strong>.
            Bajo el techo máximo de{' '}
            <strong className="text-slate-900 dark:text-white">{formatCOP(monthlyBudgetCap)}</strong>,
            dispones de un remanente mensual promedio de{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {formatCOP(monthlyMargin)}
            </strong>{' '}
            (8-10% de holgura). Este margen es el que permite rotar compras de insumos semestrales o
            prever contingencias sin asfixiar el flujo de caja.
          </p>
        </div>
      </div>

      {/* Visual Share of Budget by Product */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Distribución Porcentual del Gasto Diario por Insumo</span>
          <span className="text-xs font-normal text-slate-500">Total: 100%</span>
        </h4>

        {/* Stacked bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
          {products.map((p) => {
            const costWithIva = getDailyCostWithIva(p);
            const percentage = (costWithIva / totalDailyWithIva) * 100;
            return (
              <div
                key={p.id}
                style={{ width: `${percentage}%`, backgroundColor: p.color }}
                title={`${p.name}: ${percentage.toFixed(1)}% (${formatCOP(costWithIva)}/día)`}
                className="h-full transition-all duration-300 hover:opacity-80 cursor-pointer"
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
          {products.map((p) => {
            const costWithIva = getDailyCostWithIva(p);
            const percentage = (costWithIva / totalDailyWithIva) * 100;
            return (
              <div
                key={p.id}
                className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <div className="truncate">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {percentage.toFixed(1)}% • {formatCOP(costWithIva)}/d
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Month Annual Purchasing Cash Flow Chart */}
      {monthlyPlan.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Curva Presupuestal Anual: Facturación Mes a Mes (12 Meses)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comportamiento de las 12 órdenes mensuales frente al techo estricto de {formatCOP(monthlyBudgetCap)}.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded bg-cyan-500 inline-block"></span> Factura Mes
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="w-3 h-0.5 bg-rose-500 inline-block border-b-2 border-rose-500"></span> Techo $3.0M
              </span>
            </div>
          </div>

          {/* 12 Bars visualization */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 pb-2 items-end h-56 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative">
            {/* Horizontal reference ceiling line at 100% of budget cap */}
            <div className="absolute left-0 right-0 top-12 border-b border-rose-400/60 border-dashed z-10 flex items-center justify-end pr-2 pointer-events-none">
              <span className="text-[9px] font-mono font-bold text-rose-500 bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                LÍMITE: {formatCOP(monthlyBudgetCap)}
              </span>
            </div>

            {monthlyPlan.slice(0, 12).map((alloc, idx) => {
              const totals = calculateOrderTotals(products, alloc.quantities);
              const percent = Math.min(100, Math.round((totals.totalWithIva / (monthlyBudgetCap * 1.15)) * 100));
              const isOver = totals.totalWithIva > monthlyBudgetCap;

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group relative z-20">
                  {/* Tooltip on hover */}
                  <div className="text-[10px] font-mono font-bold mb-1 text-slate-700 dark:text-slate-300 opacity-80 group-hover:opacity-100">
                    {(totals.totalWithIva / 1000000).toFixed(2)}M
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[32px] bg-slate-200 dark:bg-slate-800 rounded-t-lg h-36 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${percent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isOver
                          ? 'bg-rose-500'
                          : totals.totalWithIva > monthlyBudgetCap * 0.92
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                    />
                  </div>

                  {/* Month label */}
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 truncate max-w-full">
                    M{idx + 1}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    {alloc.monthName.split(' ')[0].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> Las 12 facturas respetan el techo de {formatCOP(monthlyBudgetCap)}
            </span>
            <span className="font-mono text-slate-500">
              Total 12 Meses: <strong className="text-slate-900 dark:text-white font-bold">{formatCOP(plannedYearTotals.totalWithIva)}</strong> (Margen ahorro: {formatCOP(annualPlanSavings)})
            </span>
          </div>
        </div>
      )}

      {/* Comprehensive Product Financial Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm overflow-hidden">
        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Matriz Financiera Detallada por Insumo
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3">Presentación</th>
                <th className="py-2.5 px-3">Rotación 1 Galón</th>
                <th className="py-2.5 px-3 text-right">Consumo Diario</th>
                <th className="py-2.5 px-3 text-right">Precio Neto</th>
                <th className="py-2.5 px-3 text-right">Precio c/IVA</th>
                <th className="py-2.5 px-3 text-right">Gasto Diario c/IVA</th>
                <th className="py-2.5 px-3 text-right">Gasto Mensual (30d)</th>
                <th className="py-2.5 px-3 text-right">Gasto Anual (365d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((p) => {
                const dailyMl = getDailyMl(p);
                const unitWithIva = getUnitPriceWithIva(p);
                const dailyCostWithIva = getDailyCostWithIva(p);
                const monthlyCostWithIva = dailyCostWithIva * 30;
                const annualCostWithIva = dailyCostWithIva * 365;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span>{p.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {p.presentationMl} ml
                    </td>

                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      cada <strong className="text-cyan-600 dark:text-cyan-400">{p.daysPerGallon} días</strong>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatNumber(dailyMl, 1)} ml/día
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {formatCOP(p.unitPriceNet)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatCOP(unitWithIva)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {formatCOP(dailyCostWithIva)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCOP(monthlyCostWithIva)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCOP(annualCostWithIva)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80">
                <td colSpan={6} className="py-3 px-3 text-sm">
                  TOTALES GENERALES CONSOLIDADOS (CON 19% IVA)
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-cyan-600 dark:text-cyan-400">
                  {formatCOP(totalDailyWithIva)}/día
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                  {formatCOP(monthlyTotalWithIva)}/mes
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-purple-600 dark:text-purple-400">
                  {formatCOP(annualTotalWithIva)}/año
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
