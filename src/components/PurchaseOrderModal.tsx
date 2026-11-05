import React, { useState } from 'react';
import { Product, MonthlyOrderAllocation } from '../types/inventory';
import {
  formatCOP,
  calculateOrderTotals,
  getUnitPriceWithIva,
} from '../utils/calculations';
import { X, Printer, Copy, Check, Building2, ShieldCheck, AlertCircle } from 'lucide-react';

interface PurchaseOrderModalProps {
  allocation: MonthlyOrderAllocation;
  products: Product[];
  monthlyBudgetCap: number;
  onClose: () => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  allocation,
  products,
  monthlyBudgetCap,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const totals = calculateOrderTotals(products, allocation.quantities);
  const isOverBudget = totals.totalWithIva > monthlyBudgetCap;

  const orderItems = products
    .filter((p) => (allocation.quantities[p.id] || 0) > 0)
    .map((p) => {
      const qty = allocation.quantities[p.id];
      const lineNet = qty * p.unitPriceNet;
      const unitWithIva = getUnitPriceWithIva(p);
      const lineWithIva = qty * unitWithIva;
      return {
        product: p,
        qty,
        lineNet,
        unitWithIva,
        lineWithIva,
      };
    });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      `REQUISICIÓN DE COMPRA DE INSUMOS HOSPITALARIOS - UCI HONDA`,
      `Periodo: ${allocation.monthName} (Ciclo #${allocation.monthIndex + 1})`,
      `Solicitante: Ing. Biomédico (ingbiomedico@ucihonda.com.co)`,
      `Fecha: ${new Date().toLocaleDateString('es-CO')}`,
      `----------------------------------------------------`,
      `DETALLE DE PRODUCTOS:`,
      ...orderItems.map(
        (item) =>
          `- ${item.product.name} (${item.product.presentationMl} ml): ${item.qty} galón(es) | Unit c/IVA: ${formatCOP(
            item.unitWithIva
          )} | Total: ${formatCOP(item.lineWithIva)}`
      ),
      `----------------------------------------------------`,
      `SUBTOTAL NETO: ${formatCOP(totals.subtotalNet)}`,
      `IVA (19%): ${formatCOP(totals.totalIva)}`,
      `TOTAL FACTURA ESTIMADA: ${formatCOP(totals.totalWithIva)}`,
      `TECHO PRESUPUESTAL MENSUAL: ${formatCOP(monthlyBudgetCap)}`,
      `ESTADO: ${isOverBudget ? 'EXCEDE TECHO' : 'DENTRO DE PRESUPUESTO'}`,
      `NOTAS: ${allocation.notes || 'Rotación programada para garantía de stock y colchón de seguridad.'}`,
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Action Bar (hidden when printing) */}
        <div className="print:hidden p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Orden de Compra Programada ({allocation.monthName})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Texto
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Requisición
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 print:text-black print:bg-white print:p-0">
          {/* Hospital Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 print:text-black">
                UCI HONDA S.A.S. • DEPARTAMENTO DE INGENIERÍA BIOMÉDICA
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                REQUISICIÓN FORMAL DE COMPRA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-gray-600">
                Insumos Antisépticos, Desinfectantes y Soluciones Hospitalarias Críticas
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-0.5 font-mono">
              <div>
                <strong>Requisición N°:</strong> REQ-{new Date().getFullYear()}-{allocation.monthIndex + 1}
              </div>
              <div>
                <strong>Periodo Programado:</strong> {allocation.monthName}
              </div>
              <div>
                <strong>Fecha Emisión:</strong> {new Date().toLocaleDateString('es-CO')}
              </div>
              <div>
                <strong>Responsable:</strong> Ing. Biomédico UCI
              </div>
            </div>
          </div>

          {/* Strategic Context Note */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <strong>Justificación Técnica de Rotación:</strong>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              {allocation.notes ||
                'Adquisición mensual calibrada bajo esquema de rotación continua. Garantiza disponibilidad ininterrumpida para desinfección de camas, quirófano e instrumental quirúrgico con un colchón de contingencia superior a 12 días.'}
            </p>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3">Ítem / Descripción</th>
                <th className="py-2.5 px-3">Presentación</th>
                <th className="py-2.5 px-3 text-center">Cant. Solicitada</th>
                <th className="py-2.5 px-3 text-right">Precio Galón + IVA</th>
                <th className="py-2.5 px-3 text-right">Total c/IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {orderItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold">
                    {item.product.name}
                    <div className="text-[10px] font-normal text-slate-500">
                      Rotación estimada: 1 galón cada {item.product.daysPerGallon} días
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{item.product.presentationMl} ml</td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono">
                    {item.qty} Galón(es)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {formatCOP(item.unitWithIva)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {formatCOP(item.lineWithIva)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <td colSpan={2} className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">
                  Subtotal Neto:
                </td>
                <td className="py-2 px-3 text-center font-mono font-bold">
                  {totals.itemsCount} Galones
                </td>
                <td colSpan={2} className="py-2 px-3 text-right font-mono font-semibold">
                  {formatCOP(totals.subtotalNet)}
                </td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-800/80">
                <td colSpan={3} className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">
                  Impuesto IVA (19%):
                </td>
                <td colSpan={2} className="py-2 px-3 text-right font-mono font-semibold">
                  {formatCOP(totals.totalIva)}
                </td>
              </tr>
              <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t border-slate-300 dark:border-slate-700">
                <td colSpan={3} className="py-3 px-3 text-sm">
                  TOTAL APROBADO CON IVA:
                </td>
                <td colSpan={2} className="py-3 px-3 text-right font-mono text-base text-cyan-600 dark:text-cyan-400">
                  {formatCOP(totals.totalWithIva)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Budget Compliance Alert */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-300">
              Límite Presupuestal Autorizado por Dirección Financiera:
            </span>
            <div className="flex items-center gap-2">
              <strong className="font-mono">{formatCOP(monthlyBudgetCap)}</strong>
              {!isOverBudget ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> CUMPLE TECHO
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> EXCEDE TECHO
                </span>
              )}
            </div>
          </div>

          {/* Signatures block */}
          <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
              <div className="font-bold">Ing. Biomédico</div>
              <div className="text-[10px] text-slate-500">UCI Honda • Solicitante</div>
            </div>

            <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
              <div className="font-bold">Coordinación Médica UCI</div>
              <div className="text-[10px] text-slate-500">Visto Bueno Sanitario</div>
            </div>

            <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
              <div className="font-bold">Gerencia General / Compras</div>
              <div className="text-[10px] text-slate-500">Autorización de Pago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
