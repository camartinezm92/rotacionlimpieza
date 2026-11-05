import React, { useState } from 'react';
import { Product, ProductStock } from '../types/inventory';
import {
  formatCOP,
  formatNumber,
  getTotalStockMl,
} from '../utils/calculations';
import { X, Check, Clock, Package, RotateCcw, AlertCircle, Info } from 'lucide-react';

interface EditStockModalProps {
  product: Product;
  stock: ProductStock;
  onClose: () => void;
  onSave: (
    productId: string,
    stockUpdates: Partial<ProductStock>,
    productUpdates?: Partial<Product>
  ) => void;
}

export const EditStockModal: React.FC<EditStockModalProps> = ({
  product,
  stock,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'duracion'>('stock');

  // Stock State
  const [closedGallons, setClosedGallons] = useState<number>(stock.closedGallons);
  const [openFraction, setOpenFraction] = useState<number>(stock.openGallonsFraction);
  const [smallBottles, setSmallBottles] = useState<number>(stock.smallBottles500ml);

  // Product Calculation Base Parameters (Days per gallon, price, safety buffer)
  const [daysPerGallon, setDaysPerGallon] = useState<number>(product.daysPerGallon);
  const [unitPriceNet, setUnitPriceNet] = useState<number>(product.unitPriceNet);
  const [recommendedSafetyDays, setRecommendedSafetyDays] = useState<number>(product.recommendedSafetyDays);

  // Compute live preview based on modified values
  const previewStock: ProductStock = {
    ...stock,
    closedGallons,
    openGallonsFraction: openFraction,
    smallBottles500ml: smallBottles,
  };

  const previewTotalMl = getTotalStockMl(product, previewStock);
  const safeDays = daysPerGallon > 0 ? daysPerGallon : 1;
  const previewDailyMl = product.presentationMl / safeDays;
  const previewAutonomy = previewDailyMl > 0 ? previewTotalMl / previewDailyMl : 0;

  const unitWithIva = unitPriceNet * (1 + product.ivaRate);
  const previewDailyCostWithIva = unitWithIva / safeDays;
  const previewMonthlyCostWithIva = previewDailyCostWithIva * 30;

  const isDurationModified = product.originalDaysPerGallon
    ? daysPerGallon !== product.originalDaysPerGallon
    : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stockUpdates: Partial<ProductStock> = {
      closedGallons,
      openGallonsFraction: openFraction,
      smallBottles500ml: smallBottles,
      lastUpdated: new Date().toISOString(),
    };

    const productUpdates: Partial<Product> = {
      daysPerGallon: safeDays,
      unitPriceNet,
      recommendedSafetyDays,
    };

    onSave(product.id, stockUpdates, productUpdates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: product.color }}
            />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                {product.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                Presentación: {product.presentationMl} ml • {product.category.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stock Físico Actual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('duracion')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'duracion'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Tasa de Duración (Días Base)</span>
            {isDurationModified && (
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Dynamic Live Banner */}
          <div className="bg-gradient-to-r from-cyan-950/30 via-slate-900 to-blue-950/30 border border-cyan-800/50 rounded-xl p-3.5 flex items-center justify-between text-white shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-cyan-300 block">
                Stock Total Físico
              </span>
              <strong className="text-base font-mono font-bold text-white">
                {formatNumber(previewTotalMl, 0)} ml
              </strong>
            </div>

            <div className="text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-300 block">
                Tasa Base Calibrada
              </span>
              <strong className="text-sm font-mono font-bold text-cyan-300">
                1 galón / {daysPerGallon} días
              </strong>
              <span className="block text-[10px] text-slate-400 font-mono">
                ({previewDailyMl.toFixed(1)} ml/día)
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-cyan-300 block">
                Autonomía Resultante
              </span>
              <strong
                className={`text-base font-mono font-bold ${
                  previewAutonomy <= 7
                    ? 'text-rose-400'
                    : previewAutonomy <= 15
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {previewAutonomy.toFixed(1)} días
              </strong>
            </div>
          </div>

          {/* TAB 1: Stock Actual */}
          {activeTab === 'stock' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Galones Completos Cerrados (Sellados):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={closedGallons}
                    onChange={(e) => setClosedGallons(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center font-mono font-bold text-sm text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-500 shrink-0 font-mono">
                    × {product.presentationMl} ml
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Galón Abierto / Destapado en Uso:
                </label>
                <select
                  value={openFraction}
                  onChange={(e) => setOpenFraction(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-medium text-slate-900 dark:text-white"
                >
                  <option value={0}>0% (Sin galón abierto)</option>
                  <option value={0.25}>25% (Aprox 1/4 galón ~{Math.round(product.presentationMl * 0.25)} ml)</option>
                  <option value={0.5}>50% (Aprox 1/2 galón ~{Math.round(product.presentationMl * 0.5)} ml)</option>
                  <option value={0.75}>75% (Aprox 3/4 galón ~{Math.round(product.presentationMl * 0.75)} ml)</option>
                  <option value={1.0}>100% (Galón recién destapado completo: {product.presentationMl} ml)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Frascos Menores de 500 ml:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={smallBottles}
                    onChange={(e) => setSmallBottles(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center font-mono font-bold text-sm text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-500 shrink-0 font-mono">
                    × 500 ml ({smallBottles * 500} ml total)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Tasa de Duración & Parámetros Base */}
          {activeTab === 'duracion' && (
            <div className="space-y-3.5">
              {/* Highlight explaining that this changes the base calculation */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 p-3 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Calibración de Realidad Hospitalaria:</strong>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Si en la práctica de UCI este insumo dura más o menos tiempo de lo estimado inicialmente (ej. si Quirucidal jabón dura 5 días en vez de 6, o 8 días), ajusta los días aquí. El CRM recalculará automáticamente el consumo diario en ml, el gasto por día y las órdenes rotativas.
                  </p>
                </div>
              </div>

              {/* Days per gallon input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    ¿Cuántos días dura 1 Galón ({product.presentationMl} ml)?:
                  </label>
                  {product.originalDaysPerGallon && isDurationModified && (
                    <button
                      type="button"
                      onClick={() => setDaysPerGallon(product.originalDaysPerGallon!)}
                      className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Restaurar base ({product.originalDaysPerGallon}d)
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={daysPerGallon}
                    onChange={(e) => setDaysPerGallon(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-cyan-500 rounded-lg p-2.5 text-center font-mono font-bold text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-bold shrink-0">
                    DÍAS
                  </span>
                </div>
              </div>

              {/* Calculated Results Box */}
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Nuevo Consumo Diario:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {previewDailyMl.toFixed(1)} ml/día ({ (1 / safeDays).toFixed(4) } gal/día)
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Nuevo Costo Diario c/IVA:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {formatCOP(previewDailyCostWithIva)}/día
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Proyección Mensual (30 días):</span>
                  <strong className="text-cyan-600 dark:text-cyan-400">
                    {formatCOP(previewMonthlyCostWithIva)}/mes
                  </strong>
                </div>
              </div>

              {/* Price and safety buffer adjustment */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-semibold mb-1">
                    Precio Neto Unitario ($ COP):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={unitPriceNet}
                    onChange={(e) => setUnitPriceNet(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-center text-slate-900 dark:text-white font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5 text-center">
                    + IVA = {formatCOP(unitWithIva)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-semibold mb-1">
                    Colchón de Seguridad (Días):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={recommendedSafetyDays}
                    onChange={(e) => setRecommendedSafetyDays(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-center text-slate-900 dark:text-white font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5 text-center">
                    Margen para compras tardías
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              * Los cambios actualizan todos los módulos del CRM
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar & Recalcular</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
