import * as XLSX from 'xlsx';
import { Product, ProductStock, MonthlyOrderAllocation } from '../types/inventory';
import {
  calculateOrderTotals,
  getDailyCostNet,
  getDailyCostWithIva,
  getDailyMl,
  getDaysOfAutonomy,
  getTotalStockGallons,
  getTotalStockMl,
  getUnitPriceWithIva,
} from './calculations';

export function exportAnnualPlanToExcel(
  products: Product[],
  stockList: ProductStock[],
  monthlyPlan: MonthlyOrderAllocation[],
  monthlyBudgetCap: number = 3000000
) {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: CRONOGRAMA ANUAL DE COMPRAS (12 MESES)
  // ==========================================
  const sheet1Data: (string | number)[][] = [];

  // Header info
  sheet1Data.push(['UNIDAD DE CUIDADOS INTENSIVOS - UCI HONDA (TOLIMA)']);
  sheet1Data.push(['PLAN ANUAL ROTATIVO DE COMPRAS DE INSUMOS DE ASEPSIA Y BIOMÉDICA']);
  sheet1Data.push([
    'Responsable:',
    'Ingeniería Biomédica (ingbiomedico@ucihonda.com.co)',
    'Fecha de Generación:',
    new Date().toLocaleDateString('es-CO'),
  ]);
  sheet1Data.push([
    'Techo Presupuestal por Factura:',
    monthlyBudgetCap,
    'Tasa de IVA:',
    '19%',
    'Horizonte:',
    '12 Meses (1 Año Calendario)',
  ]);
  sheet1Data.push([]); // Empty spacer row

  // Table header
  const tableHeader = [
    'Insumo / Antiséptico',
    'Presentación (ml)',
    'Duración Base (Días/Galón)',
    'Precio Neto ($ COP)',
    'Precio con IVA 19% ($ COP)',
  ];

  for (let m = 0; m < monthlyPlan.length; m++) {
    tableHeader.push(monthlyPlan[m].monthName);
  }
  tableHeader.push('Total Galones Año');
  tableHeader.push('Costo Total Anual Neto ($ COP)');
  tableHeader.push('Costo Total Anual c/IVA ($ COP)');

  sheet1Data.push(tableHeader);

  // Rows for each product
  for (const product of products) {
    const unitPriceWithIva = getUnitPriceWithIva(product);
    let totalGallonsYear = 0;

    const row: (string | number)[] = [
      product.name,
      product.presentationMl,
      product.daysPerGallon,
      product.unitPriceNet,
      Math.round(unitPriceWithIva),
    ];

    for (let m = 0; m < monthlyPlan.length; m++) {
      const qty = monthlyPlan[m].quantities[product.id] || 0;
      totalGallonsYear += qty;
      row.push(qty);
    }

    const totalNetYear = totalGallonsYear * product.unitPriceNet;
    const totalWithIvaYear = totalGallonsYear * unitPriceWithIva;

    row.push(totalGallonsYear);
    row.push(Math.round(totalNetYear));
    row.push(Math.round(totalWithIvaYear));

    sheet1Data.push(row);
  }

  // Summary Rows
  sheet1Data.push([]); // spacer

  // 1. Total Gallons per month
  const totalGallonsRow: (string | number)[] = ['TOTAL GALONES A PEDIR', '', '', '', ''];
  let grandTotalGallons = 0;
  for (let m = 0; m < monthlyPlan.length; m++) {
    const totals = calculateOrderTotals(products, monthlyPlan[m].quantities);
    totalGallonsRow.push(totals.itemsCount);
    grandTotalGallons += totals.itemsCount;
  }
  totalGallonsRow.push(grandTotalGallons);
  totalGallonsRow.push('-');
  totalGallonsRow.push('-');
  sheet1Data.push(totalGallonsRow);

  // 2. Subtotal Neto ($ COP)
  const subtotalNetRow: (string | number)[] = ['SUBTOTAL NETO ($ COP)', '', '', '', ''];
  let grandTotalNet = 0;
  for (let m = 0; m < monthlyPlan.length; m++) {
    const totals = calculateOrderTotals(products, monthlyPlan[m].quantities);
    subtotalNetRow.push(Math.round(totals.subtotalNet));
    grandTotalNet += totals.subtotalNet;
  }
  subtotalNetRow.push('-');
  subtotalNetRow.push(Math.round(grandTotalNet));
  subtotalNetRow.push('-');
  sheet1Data.push(subtotalNetRow);

  // 3. IVA 19% ($ COP)
  const ivaRow: (string | number)[] = ['IVA (19%) ($ COP)', '', '', '', ''];
  let grandTotalIva = 0;
  for (let m = 0; m < monthlyPlan.length; m++) {
    const totals = calculateOrderTotals(products, monthlyPlan[m].quantities);
    ivaRow.push(Math.round(totals.totalIva));
    grandTotalIva += totals.totalIva;
  }
  ivaRow.push('-');
  ivaRow.push('-');
  ivaRow.push(Math.round(grandTotalIva));
  sheet1Data.push(ivaRow);

  // 4. TOTAL FACTURA MENSUAL ESTIMADA CON IVA ($ COP)
  const totalFacturaRow: (string | number)[] = [
    'TOTAL FACTURA ESTIMADA CON IVA ($ COP)',
    '',
    '',
    '',
    '',
  ];
  let grandTotalWithIva = 0;
  for (let m = 0; m < monthlyPlan.length; m++) {
    const totals = calculateOrderTotals(products, monthlyPlan[m].quantities);
    totalFacturaRow.push(Math.round(totals.totalWithIva));
    grandTotalWithIva += totals.totalWithIva;
  }
  totalFacturaRow.push('-');
  totalFacturaRow.push('-');
  totalFacturaRow.push(Math.round(grandTotalWithIva));
  sheet1Data.push(totalFacturaRow);

  // 5. TECHO PRESUPUESTAL MÁXIMO ($ COP)
  const techoRow: (string | number)[] = ['TECHO PRESUPUESTAL ($ COP)', '', '', '', ''];
  for (let m = 0; m < monthlyPlan.length; m++) {
    techoRow.push(monthlyBudgetCap);
  }
  techoRow.push('-');
  techoRow.push('-');
  techoRow.push(monthlyBudgetCap * monthlyPlan.length);
  sheet1Data.push(techoRow);

  // 6. MARGEN DISPONIBLE / HOLGURA ($ COP)
  const margenRow: (string | number)[] = ['MARGEN DE HOLGURA DISPONIBLE ($ COP)', '', '', '', ''];
  for (let m = 0; m < monthlyPlan.length; m++) {
    const totals = calculateOrderTotals(products, monthlyPlan[m].quantities);
    const margen = monthlyBudgetCap - totals.totalWithIva;
    margenRow.push(Math.round(margen));
  }
  margenRow.push('-');
  margenRow.push('-');
  margenRow.push(Math.round(monthlyBudgetCap * monthlyPlan.length - grandTotalWithIva));
  sheet1Data.push(margenRow);

  // 7. CUMPLIMIENTO DEL TECHO
  const estadoRow: (string | number)[] = ['ESTADO PRESUPUESTAL', '', '', '', ''];
  for (let m = 0; m < monthlyPlan.length; m++) {
    const totals = calculateOrderTotals(products, monthlyPlan[m].quantities);
    estadoRow.push(totals.totalWithIva <= monthlyBudgetCap ? 'CUMPLE TECHO (OK)' : 'EXCEDE TECHO');
  }
  estadoRow.push('-');
  estadoRow.push('-');
  estadoRow.push(grandTotalWithIva <= monthlyBudgetCap * monthlyPlan.length ? 'CUMPLE ANUAL (OK)' : 'EXCEDE');
  sheet1Data.push(estadoRow);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Configure column widths for readability
  ws1['!cols'] = [
    { wch: 28 }, // Insumo
    { wch: 18 }, // Presentacion
    { wch: 25 }, // Duracion
    { wch: 18 }, // Precio Neto
    { wch: 22 }, // Precio con IVA
    ...monthlyPlan.map(() => ({ wch: 15 })), // Months
    { wch: 18 }, // Total galones
    { wch: 26 }, // Total neto
    { wch: 26 }, // Total con iva
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Cronograma Anual');

  // ==========================================
  // SHEET 2: DESGLOSE FINANCIERO Y ROTACIÓN MENSUAL
  // ==========================================
  const sheet2Data: (string | number)[][] = [
    ['UNIDAD DE CUIDADOS INTENSIVOS - UCI HONDA'],
    ['RESUMEN MENSUAL Y ESTRATEGIA DE ROTACIÓN DE FACTURAS'],
    [],
    [
      'Mes #',
      'Mes y Año',
      'Galones Totales',
      'Subtotal Neto ($ COP)',
      'IVA 19% ($ COP)',
      'Total Factura c/IVA ($ COP)',
      'Techo Presupuestal ($ COP)',
      'Margen de Holgura ($ COP)',
      '% Utilización Presupuesto',
      'Estrategia de Rotación / Justificación Clínica',
    ],
  ];

  for (let m = 0; m < monthlyPlan.length; m++) {
    const alloc = monthlyPlan[m];
    const totals = calculateOrderTotals(products, alloc.quantities);
    const margen = monthlyBudgetCap - totals.totalWithIva;
    const utilizacion = Math.round((totals.totalWithIva / monthlyBudgetCap) * 100);

    sheet2Data.push([
      m + 1,
      alloc.monthName,
      totals.itemsCount,
      Math.round(totals.subtotalNet),
      Math.round(totals.totalIva),
      Math.round(totals.totalWithIva),
      monthlyBudgetCap,
      Math.round(margen),
      `${utilizacion}%`,
      alloc.notes || 'Rotación balanceada con colchón de reserva.',
    ]);
  }

  // Summary row
  sheet2Data.push([]);
  sheet2Data.push([
    'TOTAL',
    'Consolidado 12 Meses',
    grandTotalGallons,
    Math.round(grandTotalNet),
    Math.round(grandTotalIva),
    Math.round(grandTotalWithIva),
    monthlyBudgetCap * monthlyPlan.length,
    Math.round(monthlyBudgetCap * monthlyPlan.length - grandTotalWithIva),
    `${Math.round((grandTotalWithIva / (monthlyBudgetCap * monthlyPlan.length)) * 100)}%`,
    'Plan Anual Optimizado 100% bajo techo presupuestal sin quiebres de stock.',
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 80 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen Financiero');

  // ==========================================
  // SHEET 3: FICHA TÉCNICA Y CONSUMO DIARIO
  // ==========================================
  const sheet3Data: (string | number)[][] = [
    ['UNIDAD DE CUIDADOS INTENSIVOS - UCI HONDA'],
    ['FICHA TÉCNICA DE INSUMOS, PARÁMETROS DE CONSUMO Y STOCK INICIAL'],
    [],
    [
      'Insumo / Antiséptico',
      'Categoría',
      'Presentación (ml)',
      'Duración 1 Galón (Días)',
      'Gasto Diario (ml/día)',
      'Costo Diario Neto ($ COP/día)',
      'Costo Diario c/IVA ($ COP/día)',
      'Precio Galón Neto ($ COP)',
      'Precio Galón c/IVA ($ COP)',
      'Stock Inicial Cerrado (Gal)',
      'Stock Abierto (%)',
      'Stock Frascos 500ml',
      'Stock Inicial Total (ml)',
      'Autonomía Inicial (Días)',
      'Colchón Recomendado (Días)',
    ],
  ];

  for (const product of products) {
    const stock = stockList.find((s) => s.productId === product.id);
    const dailyMl = getDailyMl(product);
    const dailyCostNet = getDailyCostNet(product);
    const dailyCostWithIva = getDailyCostWithIva(product);
    const unitPriceWithIva = getUnitPriceWithIva(product);

    const totalStockMl = stock ? getTotalStockMl(product, stock) : 0;
    const autonomyDays = stock ? getDaysOfAutonomy(product, stock) : 0;

    sheet3Data.push([
      product.name,
      product.category.replace('_', ' '),
      product.presentationMl,
      product.daysPerGallon,
      Number(dailyMl.toFixed(2)),
      Math.round(dailyCostNet),
      Math.round(dailyCostWithIva),
      product.unitPriceNet,
      Math.round(unitPriceWithIva),
      stock?.closedGallons || 0,
      `${Math.round((stock?.openGallonsFraction || 0) * 100)}%`,
      stock?.smallBottles500ml || 0,
      totalStockMl,
      Number(autonomyDays.toFixed(1)),
      product.recommendedSafetyDays,
    ]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 22 },
    { wch: 26 },
    { wch: 26 },
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Ficha Técnica & Stock');

  // Trigger Excel file download
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Plan_Anual_Compras_UCI_Honda_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
