import React, { useState } from 'react';
import { Product, ProductStock } from '../types/inventory';
import {
  formatCOP,
  formatNumber,
  getDailyMl,
  getDailyCostWithIva,
  getDailyCostNet,
  getUnitPriceWithIva,
  getTotalStockMl,
  getTotalStockGallons,
  getDaysOfAutonomy,
  getAutonomyStatus,
  getStockoutDate,
} from '../utils/calculations';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Droplet,
  Edit3,
  Flame,
  Plus,
  Minus,
  Search,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

interface StockOverviewProps {
  products: Product[];
  stockList: ProductStock[];
  onUpdateStock: (productId: string, updates: Partial<ProductStock>) => void;
  onOpenEditModal: (product: Product, stock: ProductStock, defaultTab?: 'stock' | 'duracion') => void;
  onSelectForAudit: (productId: string) => void;
  onOpenCalibrationModal: () => void;
}

export const StockOverview: React.FC<StockOverviewProps> = ({
  products,
  stockList,
  onUpdateStock,
  onOpenEditModal,
  onSelectForAudit,
  onOpenCalibrationModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredProducts = products.filter((p) => {
    const stock = stockList.find((s) => s.productId === p.id);
    const autonomy = stock ? getDaysOfAutonomy(p, stock) : 0;
    const status = getAutonomyStatus(autonomy).status;

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 border border-slate-700/80 rounded-2xl p-5 shadow-lg text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold">
                UCI Honda • Gestión de Desinfectantes & Antisépticos
              </span>
              <span className="text-xs text-slate-400 font-mono">Total: 8 Productos</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Control de Inventario & Consumo Diario
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Monitoreo continuo de autonomía real basado en la tasa de rotación por galón. Las alertas visuales señalan desabastecimiento inminente para no interrumpir la asepsia de camas y quirófano.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-rose-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-semibold">Urgencia Inmediata:</span>
              </div>
              <p className="text-slate-300 leading-tight">
                <strong className="text-white">Quiruger Plus</strong> (5 días restantes) y{' '}
                <strong className="text-white">Quirucidal Jabón</strong> (6.8 días restantes)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por producto (ej. Jabón, Supragel, Enziger)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="antiseptico">Antisépticos</option>
            <option value="desinfectante">Desinfectantes</option>
            <option value="enzimatico">Enzimáticos</option>
            <option value="gel_conductor">Gel Conductor</option>
            <option value="desengrasante">Desengrasante</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">Todos los estados</option>
            <option value="critico">Crítico (&lt; 7 días)</option>
            <option value="bajo">Atención (8-15 días)</option>
            <option value="optimo">Óptimo (16-45 días)</option>
            <option value="holgado">Reserva Amplia (&gt; 45 días)</option>
          </select>

          <button
            type="button"
            onClick={onOpenCalibrationModal}
            className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
            title="Abrir tabla para calibrar cuántos días dura 1 galón de cada insumo"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Calibrar Días/Galón</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const stock = stockList.find((s) => s.productId === product.id) || {
            productId: product.id,
            closedGallons: 0,
            openGallonsFraction: 0,
            smallBottles500ml: 0,
            lastUpdated: new Date().toISOString(),
          };

          const dailyMl = getDailyMl(product);
          const dailyCostWithIva = getDailyCostWithIva(product);
          const dailyCostNet = getDailyCostNet(product);
          const priceWithIva = getUnitPriceWithIva(product);
          const totalMl = getTotalStockMl(product, stock);
          const totalGallons = getTotalStockGallons(product, stock);
          const daysAutonomy = getDaysOfAutonomy(product, stock);
          const statusInfo = getAutonomyStatus(daysAutonomy);
          const stockoutDate = getStockoutDate(daysAutonomy);

          const isDurationModified = product.originalDaysPerGallon
            ? product.daysPerGallon !== product.originalDaysPerGallon
            : false;

          // Progress percentage towards 30 days
          const progressPercent = Math.min(100, Math.round((daysAutonomy / 45) * 100));

          return (
            <div
              key={product.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative"
            >
              {/* Colored Category Indicator Bar */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: product.color }}
              />

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                {/* Header: Title & Autonomy badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {product.presentationMl} ml • {product.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1.5 leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {product.description}
                  </p>
                </div>

                {/* Consumption & Financial Metrics */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-cyan-500" /> Tasa de Consumo:
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(product, stock, 'duracion')}
                      className="font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 group cursor-pointer text-right"
                      title="Haz clic para ajustar cuántos días dura 1 galón en la realidad"
                    >
                      <span>
                        1 galón /{' '}
                        <strong className="text-cyan-600 dark:text-cyan-400 underline decoration-dotted underline-offset-2">
                          {product.daysPerGallon} días
                        </strong>
                      </span>
                      <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>

                  {isDurationModified && (
                    <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono text-right -mt-1">
                      (Calibrado de base: {product.originalDaysPerGallon}d)
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Droplet className="w-3.5 h-3.5 text-blue-500" /> Consumo diario:
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {formatNumber(dailyMl, 1)} ml/día
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[11px] text-slate-500">Costo Diario (con IVA):</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCOP(dailyCostWithIva)}/día
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span>Precio Unitario Neto:</span>
                    <span className="font-mono">{formatCOP(product.unitPriceNet)} + IVA</span>
                  </div>
                </div>

                {/* Autonomy Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> Autonomía estimada:
                    </span>
                    <span className="font-bold font-mono text-sm text-slate-900 dark:text-white">
                      {daysAutonomy.toFixed(1)} días
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        daysAutonomy <= 7
                          ? 'bg-rose-500'
                          : daysAutonomy <= 15
                          ? 'bg-amber-500'
                          : daysAutonomy <= 45
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(5, progressPercent)}%` }}
                    />
                  </div>

                  {/* Stockout Date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> Agotamiento:
                    </span>
                    <span
                      className={`font-medium ${
                        daysAutonomy <= 7
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {stockoutDate.toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Current Stock Breakdown */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Stock Disponible Actual:</span>
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      {formatNumber(totalMl, 0)} ml (~{totalGallons.toFixed(2)} gal)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-1 border border-slate-100 dark:border-slate-700">
                      <span className="block text-slate-400">Cerrados</span>
                      <strong className="text-xs text-slate-900 dark:text-white font-mono">
                        {stock.closedGallons}
                      </strong>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-1 border border-slate-100 dark:border-slate-700">
                      <span className="block text-slate-400">Destapado</span>
                      <strong className="text-xs text-slate-900 dark:text-white font-mono">
                        {stock.openGallonsFraction > 0
                          ? `${Math.round(stock.openGallonsFraction * 100)}%`
                          : '0'}
                      </strong>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-1 border border-slate-100 dark:border-slate-700">
                      <span className="block text-slate-400">500 ml</span>
                      <strong className="text-xs text-slate-900 dark:text-white font-mono">
                        {stock.smallBottles500ml}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Quick Stock Controls & Edit Button */}
                <div className="pt-2 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        onUpdateStock(product.id, {
                          closedGallons: Math.max(0, stock.closedGallons - 1),
                        })
                      }
                      title="Restar 1 galón cerrado"
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono px-1">Galón</span>
                    <button
                      onClick={() =>
                        onUpdateStock(product.id, {
                          closedGallons: stock.closedGallons + 1,
                        })
                      }
                      title="Sumar 1 galón cerrado"
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectForAudit(product.id)}
                      title="Registrar auditoría física de este producto"
                      className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline px-1.5 py-1 rounded cursor-pointer"
                    >
                      Auditar
                    </button>
                    <button
                      onClick={() => onOpenEditModal(product, stock)}
                      className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 transition-colors cursor-pointer"
                      title="Editar cantidades exactas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
