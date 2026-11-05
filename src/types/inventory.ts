export interface Product {
  id: string;
  name: string;
  category: 'antiseptico' | 'desinfectante' | 'enzimatico' | 'gel_conductor' | 'desengrasante';
  presentationMl: number; // e.g. 3750 or 3650
  daysPerGallon: number; // days it takes to consume 1 gallon (editable by user)
  originalDaysPerGallon?: number; // baseline reference days
  unitPriceNet: number; // Price in COP before IVA
  ivaRate: number; // 0.19 for 19%
  color: string;
  description: string;
  recommendedSafetyDays: number; // safety buffer in days (e.g. 10 - 15 days)
}

export interface ProductStock {
  productId: string;
  closedGallons: number;
  openGallonsFraction: number; // 0 to 1 (e.g. 1 for full open, 0.5 for 50%)
  smallBottles500ml: number; // frascos de 500 ml
  lastUpdated: string;
}

export interface MonthlyOrderAllocation {
  monthIndex: number; // 0 = Current month, 1 = Next month, etc.
  monthName: string;
  year: number;
  quantities: Record<string, number>; // productId -> gallons to order
  notes?: string;
  isConfirmed?: boolean;
}

export interface StockAuditLog {
  id: string;
  date: string;
  productId: string;
  actualStockMl: number;
  expectedStockMl: number;
  deviationPercent: number; // ((actual - expected) / expected) * 100
  notes: string;
  severity: 'normal' | 'alerta_leve' | 'critico';
}

export interface AiAlert {
  product: string;
  severity: 'baja' | 'media' | 'alta';
  title: string;
  description: string;
}

export interface AiAnalysisReport {
  summary: string;
  alerts: AiAlert[];
  aiRecommendations: string[];
  projectedOutlook?: string;
  fallback?: boolean;
}
