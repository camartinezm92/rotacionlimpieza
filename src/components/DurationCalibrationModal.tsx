import React from 'react';
import { Product } from '../types/inventory';
import { formatCOP, getUnitPriceWithIva } from '../utils/calculations';
import { X, Clock, Check, RotateCcw, Info, Sparkles } from 'lucide-react';

interface DurationCalibrationModalProps {
  products: Product[];
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onResetAllDurations: () => void;
  onClose: () => void;
}

export const DurationCalibrationModal: React.FC<DurationCalibrationModalProps> = ({
  products,
  onUpdateProduct,
  onResetAllDurations,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Calibración de Duración Base (Días por Galón)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajusta cuántos días dura realmente 1 galón en UCI Honda para recalcular el gasto diario y rotación.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetAllDurations}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors cursor-pointer"
              title="Restablecer todos los insumos a los días teóricos iniciales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Días Iniciales</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Banner */}
        <div className="p-4 bg-cyan-50/70 dark:bg-cyan-950/30 border-b border-cyan-100 dark:border-cyan-900/50 flex items-start gap-3 text-xs text-cyan-950 dark:text-cyan-200">
          <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong>Parámetro Maestro de Consumo:</strong> Los días que definas aquí son la base sobre la cual el CRM calcula el consumo diario (ml/día), el gasto diario ($ COP/día con IVA), los días de autonomía del stock y la rotación mensual bajo el techo de $3.000.000 COP. Puedes modificar cualquier producto cuando notes que la realidad de la UCI cambia.
          </div>
        </div>

        {/* Table of all 8 products */}
        <div className="p-4 sm:p-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-semibold">
                <th className="py-2.5 px-3">Insumo Hospitalario</th>
                <th className="py-2.5 px-3">Presentación</th>
                <th className="py-2.5 px-3 text-center">Duración Base Inicial</th>
                <th className="py-2.5 px-3 text-center w-40">Duración Real (Días)</th>
                <th className="py-2.5 px-3 text-right">Consumo Diario</th>
                <th className="py-2.5 px-3 text-right">Gasto Diario c/IVA</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((product) => {
                const safeDays = product.daysPerGallon > 0 ? product.daysPerGallon : 1;
                const dailyMl = product.presentationMl / safeDays;
                const unitWithIva = getUnitPriceWithIva(product);
                const dailyCostWithIva = unitWithIva / safeDays;
                const isModified = product.originalDaysPerGallon
                  ? product.daysPerGallon !== product.originalDaysPerGallon
                  : false;

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isModified ? 'bg-cyan-50/20 dark:bg-cyan-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: product.color }}
                        />
                        <div>
                          <strong className="text-slate-900 dark:text-white block">
                            {product.name}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            {product.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-500">
                      {product.presentationMl} ml
                    </td>

                    <td className="py-3 px-3 text-center text-slate-500 font-mono">
                      cada {product.originalDaysPerGallon || product.daysPerGallon} días
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={product.daysPerGallon}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              onUpdateProduct(product.id, { daysPerGallon: val });
                            }
                          }}
                          className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-center font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 pr-1">
                          días
                        </span>
                      </div>
                      {isModified && (
                        <span className="block text-[9px] text-cyan-600 dark:text-cyan-400 font-medium mt-0.5">
                          ✓ Ajustado
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {dailyMl.toFixed(1)} ml/día
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCOP(dailyCostWithIva)}/día
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isModified && product.originalDaysPerGallon && (
                        <button
                          onClick={() =>
                            onUpdateProduct(product.id, {
                              daysPerGallon: product.originalDaysPerGallon!,
                            })
                          }
                          className="text-[10px] text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          title="Restablecer a días originales"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Base</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            * Cualquier cambio se guarda automáticamente y actualiza de inmediato inventario, curvas y plan de compras.
          </span>
          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Listo / Cerrar Calibrador
          </button>
        </div>
      </div>
    </div>
  );
};
