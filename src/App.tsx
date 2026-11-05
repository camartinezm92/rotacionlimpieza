import React, { useState, useEffect } from 'react';
import { Product, ProductStock, MonthlyOrderAllocation, StockAuditLog } from './types/inventory';
import { INITIAL_PRODUCTS, INITIAL_STOCK, DEFAULT_MONTHLY_BUDGET_CAP } from './data/initialData';
import {
  generateOptimalRotationalPlan,
  getDailyCostWithIva,
  getDaysOfAutonomy,
} from './utils/calculations';
import { Header } from './components/Header';
import { StockOverview } from './components/StockOverview';
import { OrderPlanner } from './components/OrderPlanner';
import { BudgetSummary } from './components/BudgetSummary';
import { AuditAnomalyTracker } from './components/AuditAnomalyTracker';
import { AiBiomedicalAdvisor } from './components/AiBiomedicalAdvisor';
import { EditStockModal } from './components/EditStockModal';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { DurationCalibrationModal } from './components/DurationCalibrationModal';

export default function App() {
  // Configurable Products with Editable Baseline Durations & Prices
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('biostock_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  // Persistent Stock State
  const [stockList, setStockList] = useState<ProductStock[]>(() => {
    try {
      const saved = localStorage.getItem('biostock_stock');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STOCK;
  });

  // Persistent Monthly Budget Cap ($3.000.000 COP default)
  const [monthlyBudgetCap, setMonthlyBudgetCap] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('biostock_cap');
      if (saved) return Number(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_MONTHLY_BUDGET_CAP;
  });

  // Persistent Monthly Rotational Plan (Proyección a 12 Meses / 1 Año)
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyOrderAllocation[]>(() => {
    try {
      const saved = localStorage.getItem('biostock_plan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 12) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return generateOptimalRotationalPlan(INITIAL_PRODUCTS, INITIAL_STOCK, DEFAULT_MONTHLY_BUDGET_CAP, 12);
  });

  // Track if user explicitly locked manual quantity overrides
  const [isManualOverrideActive, setIsManualOverrideActive] = useState<boolean>(false);

  // Persistent Audit Logs (seeded with sample initial audits including March projection requested by user)
  const [auditLogs, setAuditLogs] = useState<StockAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('biostock_audits');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'init_audit_1',
        date: new Date().toISOString().split('T')[0],
        productId: 'quiruger_plus',
        actualStockMl: 1825, // 50% de galón provisto por el usuario
        expectedStockMl: 1825,
        deviationPercent: 0,
        notes: 'Conteo inicial verificado: 50% de galón en frasco abierto (5 días de autonomía crítica).',
        severity: 'normal',
      },
      {
        id: 'init_audit_2',
        date: new Date().toISOString().split('T')[0],
        productId: 'quirucidal_jabon',
        actualStockMl: 4250, // 1 destapado + 1 frasco de 500ml
        expectedStockMl: 4250,
        deviationPercent: 0,
        notes: 'Conteo inicial verificado: 1 galón destapado + 1 frasco de 500ml (6.8 días de autonomía).',
        severity: 'normal',
      },
      {
        id: 'init_audit_3',
        date: '2026-03-15',
        productId: 'quirucidal_jabon',
        actualStockMl: 1200,
        expectedStockMl: 3125,
        deviationPercent: -61.6,
        notes: 'Auditoría de marzo: Desviación detectada por aceleración de consumo (ingreso de pacientes en aislamiento estricto en UCI). Alerta sobreconsumo.',
        severity: 'critico',
      },
    ];
  });

  const [activeTab, setActiveTab] = useState<'inventario' | 'planificador' | 'presupuesto' | 'auditoria' | 'ia'>('inventario');

  // Modals state
  const [editingModal, setEditingModal] = useState<{
    product: Product;
    stock: ProductStock;
    defaultTab?: 'stock' | 'duracion';
  } | null>(null);

  const [viewingRequisition, setViewingRequisition] = useState<MonthlyOrderAllocation | null>(null);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);

  // AUTO-SYNCHRONIZATION: Whenever products, stockList or monthlyBudgetCap change,
  // automatically re-run the 12-month rotational plan optimizer so all tabs stay 100% in sync
  useEffect(() => {
    if (!isManualOverrideActive) {
      const freshPlan = generateOptimalRotationalPlan(products, stockList, monthlyBudgetCap, 12);
      setMonthlyPlan(freshPlan);
    }
  }, [products, stockList, monthlyBudgetCap, isManualOverrideActive]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('biostock_products', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('biostock_stock', JSON.stringify(stockList));
    } catch (e) {
      console.error(e);
    }
  }, [stockList]);

  useEffect(() => {
    try {
      localStorage.setItem('biostock_plan', JSON.stringify(monthlyPlan));
    } catch (e) {
      console.error(e);
    }
  }, [monthlyPlan]);

  useEffect(() => {
    try {
      localStorage.setItem('biostock_audits', JSON.stringify(auditLogs));
    } catch (e) {
      console.error(e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('biostock_cap', monthlyBudgetCap.toString());
    } catch (e) {
      console.error(e);
    }
  }, [monthlyBudgetCap]);

  // Aggregate metrics (dynamically derived from current products & stock)
  const totalDailyCostWithIva = products.reduce((sum, p) => sum + getDailyCostWithIva(p), 0);

  const criticalItemsCount = products.filter((p) => {
    const s = stockList.find((item) => item.productId === p.id);
    const days = s ? getDaysOfAutonomy(p, s) : 0;
    return days <= 7;
  }).length;

  // Product parameter update helper (days per gallon, prices, safety buffer)
  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    );
  };

  // Stock update helper
  const handleUpdateStock = (productId: string, updates: Partial<ProductStock>) => {
    setStockList((prev) =>
      prev.map((s) => (s.productId === productId ? { ...s, ...updates, lastUpdated: new Date().toISOString() } : s))
    );
  };

  // Combined stock + product updater
  const handleSaveStockAndProduct = (
    productId: string,
    stockUpdates: Partial<ProductStock>,
    productUpdates?: Partial<Product>
  ) => {
    if (productUpdates) {
      handleUpdateProduct(productId, productUpdates);
    }
    if (stockUpdates) {
      handleUpdateStock(productId, stockUpdates);
    }
  };

  // Direct AI action executor (e.g. user clicks "Aplicar Quigrass a 90 días y Stock = 0")
  const handleApplyAiAction = (action: any) => {
    if (action.type === 'UPDATE_PRODUCT_AND_STOCK') {
      if (action.productId && action.productUpdates) {
        setProducts((prev) =>
          prev.map((p) => (p.id === action.productId ? { ...p, ...action.productUpdates } : p))
        );
      }
      if (action.productId && action.stockUpdates) {
        setStockList((prev) =>
          prev.map((s) =>
            s.productId === action.productId
              ? { ...s, ...action.stockUpdates, lastUpdated: new Date().toISOString() }
              : s
          )
        );
      }
      // Force recalculation immediately
      const updatedProducts = products.map((p) =>
        p.id === action.productId ? { ...p, ...action.productUpdates } : p
      );
      const updatedStock = stockList.map((s) =>
        s.productId === action.productId ? { ...s, ...action.stockUpdates } : s
      );
      const newPlan = generateOptimalRotationalPlan(updatedProducts, updatedStock, monthlyBudgetCap, 12);
      setMonthlyPlan(newPlan);
      setIsManualOverrideActive(false);
    } else if (action.type === 'NAVIGATE_TAB') {
      setActiveTab(action.tab);
    }
  };

  // Reset all durations to the initial theoretical base
  const handleResetAllDurations = () => {
    if (window.confirm('¿Restablecer las tasas de consumo de todos los insumos a los días base iniciales provistos por UCI Honda?')) {
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          daysPerGallon: p.originalDaysPerGallon || p.daysPerGallon,
        }))
      );
      setIsManualOverrideActive(false);
    }
  };

  // Reset to initial exact data
  const handleResetToInitial = () => {
    if (window.confirm('¿Deseas restablecer el inventario y las tasas de duración a los valores iniciales provistos por UCI Honda?')) {
      setProducts(INITIAL_PRODUCTS);
      setStockList(INITIAL_STOCK);
      setIsManualOverrideActive(false);
      const newPlan = generateOptimalRotationalPlan(INITIAL_PRODUCTS, INITIAL_STOCK, monthlyBudgetCap, 12);
      setMonthlyPlan(newPlan);
    }
  };

  // Export JSON backup
  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      institution: 'UCI Honda Tolima',
      responsible: 'ingbiomedico@ucihonda.com.co',
      monthlyBudgetCap,
      products,
      stockList,
      monthlyPlan,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BioStock_UCI_Honda_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.products) setProducts(parsed.products);
          if (parsed.stockList) setStockList(parsed.stockList);
          if (parsed.monthlyPlan) setMonthlyPlan(parsed.monthlyPlan);
          if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
          if (parsed.monthlyBudgetCap) setMonthlyBudgetCap(parsed.monthlyBudgetCap);
          alert('¡Datos de inventario y calibración importados con éxito!');
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Open audit modal for product
  const handleSelectForAudit = (productId: string) => {
    setActiveTab('auditoria');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Header
        totalDailyCostWithIva={totalDailyCostWithIva}
        criticalItemsCount={criticalItemsCount}
        monthlyBudgetCap={monthlyBudgetCap}
        onOpenAiChat={() => setActiveTab('ia')}
        onResetToInitial={handleResetToInitial}
        onExportData={handleExportData}
        onImportData={handleImportData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inventario' && (
          <StockOverview
            products={products}
            stockList={stockList}
            onUpdateStock={handleUpdateStock}
            onOpenEditModal={(p, s, tab) => setEditingModal({ product: p, stock: s, defaultTab: tab })}
            onSelectForAudit={handleSelectForAudit}
            onOpenCalibrationModal={() => setIsCalibrationOpen(true)}
          />
        )}

        {activeTab === 'planificador' && (
          <OrderPlanner
            products={products}
            stockList={stockList}
            monthlyPlan={monthlyPlan}
            onUpdatePlan={(newPlan) => {
              setMonthlyPlan(newPlan);
              setIsManualOverrideActive(true);
            }}
            monthlyBudgetCap={monthlyBudgetCap}
            onUpdateBudgetCap={setMonthlyBudgetCap}
            onGenerateRequisition={(alloc) => setViewingRequisition(alloc)}
            onForceReoptimize={() => {
              setIsManualOverrideActive(false);
              const fresh = generateOptimalRotationalPlan(products, stockList, monthlyBudgetCap, 12);
              setMonthlyPlan(fresh);
            }}
          />
        )}

        {activeTab === 'presupuesto' && (
          <BudgetSummary
            products={products}
            monthlyBudgetCap={monthlyBudgetCap}
            monthlyPlan={monthlyPlan}
          />
        )}

        {activeTab === 'auditoria' && (
          <AuditAnomalyTracker
            products={products}
            stockList={stockList}
            auditLogs={auditLogs}
            monthlyPlan={monthlyPlan}
            onAddAuditLog={(log) => setAuditLogs((prev) => [log, ...prev])}
            onDeleteAuditLog={(id) => setAuditLogs((prev) => prev.filter((l) => l.id !== id))}
            monthlyBudgetCap={monthlyBudgetCap}
          />
        )}

        {activeTab === 'ia' && (
          <AiBiomedicalAdvisor
            products={products}
            stockList={stockList}
            monthlyPlan={monthlyPlan}
            monthlyBudgetCap={monthlyBudgetCap}
            onApplyAiAction={handleApplyAiAction}
          />
        )}
      </main>

      {/* Modals */}
      {editingModal && (
        <EditStockModal
          product={editingModal.product}
          stock={editingModal.stock}
          onClose={() => setEditingModal(null)}
          onSave={handleSaveStockAndProduct}
        />
      )}

      {isCalibrationOpen && (
        <DurationCalibrationModal
          products={products}
          onUpdateProduct={handleUpdateProduct}
          onResetAllDurations={handleResetAllDurations}
          onClose={() => setIsCalibrationOpen(false)}
        />
      )}

      {viewingRequisition && (
        <PurchaseOrderModal
          allocation={viewingRequisition}
          products={products}
          monthlyBudgetCap={monthlyBudgetCap}
          onClose={() => setViewingRequisition(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs py-4 text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            BioStock CRM • Unidad de Cuidados Intensivos (UCI Honda, Tolima) • Insumos de Asepsia & Biomédica
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Techo: {DEFAULT_MONTHLY_BUDGET_CAP.toLocaleString('es-CO')} COP</span>
            <span>IVA: 19%</span>
            <span>Sincronización en tiempo real</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
