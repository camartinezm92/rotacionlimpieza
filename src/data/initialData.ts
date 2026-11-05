import { Product, ProductStock } from '../types/inventory';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'quirucidal_jabon',
    name: 'Quirucidal Jabón Antiséptico',
    category: 'antiseptico',
    presentationMl: 3750,
    daysPerGallon: 6,
    originalDaysPerGallon: 6,
    unitPriceNet: 154391,
    ivaRate: 0.19,
    color: '#0284c7', // Sky blue
    description: 'Jabón antiséptico quirúrgico y lavado clínico de manos en UCI. Máxima rotación hospitalaria.',
    recommendedSafetyDays: 12,
  },
  {
    id: 'quiruger_plus',
    name: 'Quiruger Plus Desinfectante',
    category: 'desinfectante',
    presentationMl: 3650, // 3650 ml provisto explícitamente por el usuario
    daysPerGallon: 10,
    originalDaysPerGallon: 10,
    unitPriceNet: 70544,
    ivaRate: 0.19,
    color: '#0d9488', // Teal
    description: 'Desinfectante de superficies hospitalarias de alta eficiencia (amonio cuaternario de última generación).',
    recommendedSafetyDays: 15,
  },
  {
    id: 'supragel',
    name: 'Supragel Galón (Gel Conductor/Médico)',
    category: 'gel_conductor',
    presentationMl: 3750,
    daysPerGallon: 7,
    originalDaysPerGallon: 7,
    unitPriceNet: 118701,
    ivaRate: 0.19,
    color: '#6366f1', // Indigo
    description: 'Gel conductor para ultrasonido, monitoreo fisiológico y lubricación de procedimientos en UCI.',
    recommendedSafetyDays: 14,
  },
  {
    id: 'alcohol_70',
    name: 'Alcohol Antiséptico al 70%',
    category: 'antiseptico',
    presentationMl: 3750,
    daysPerGallon: 10,
    originalDaysPerGallon: 10,
    unitPriceNet: 45179,
    ivaRate: 0.19,
    color: '#3b82f6', // Blue
    description: 'Alcohol etílico al 70% para asepsia rápida, antisepsia de piel y desinfección de puertos venosos.',
    recommendedSafetyDays: 15,
  },
  {
    id: 'quineutrim',
    name: 'Quineutrim Galón (Detergente Neutro)',
    category: 'desinfectante',
    presentationMl: 3750,
    daysPerGallon: 20,
    originalDaysPerGallon: 20,
    unitPriceNet: 127632,
    ivaRate: 0.19,
    color: '#10b981', // Emerald
    description: 'Detergente neutro para limpieza de superficies delicadas, carcasas de equipos biomédicos y monitores.',
    recommendedSafetyDays: 15,
  },
  {
    id: 'quirucidal_solucion',
    name: 'Quirucidal Solución Desinfectante',
    category: 'desinfectante',
    presentationMl: 3750,
    daysPerGallon: 30,
    originalDaysPerGallon: 30,
    unitPriceNet: 120350,
    ivaRate: 0.19,
    color: '#0891b2', // Cyan
    description: 'Solución antiséptica y desinfectante de alto espectro para inmersión y superficies críticas.',
    recommendedSafetyDays: 20,
  },
  {
    id: 'enziger',
    name: 'Enziger Jabón Enzimático',
    category: 'enzimatico',
    presentationMl: 3750,
    daysPerGallon: 30,
    originalDaysPerGallon: 30,
    unitPriceNet: 297000,
    ivaRate: 0.19,
    color: '#8b5cf6', // Purple
    description: 'Detergente multienzimático para lavado y remoción de materia orgánica en instrumental quirúrgico.',
    recommendedSafetyDays: 20,
  },
  {
    id: 'quigrass',
    name: 'Quigrass Desengrasante Grado Hospitalario',
    category: 'desengrasante',
    presentationMl: 3750,
    daysPerGallon: 180, // Cada 180 días (semestral)
    originalDaysPerGallon: 180,
    unitPriceNet: 261827,
    ivaRate: 0.19,
    color: '#d97706', // Amber
    description: 'Desengrasante desincrustante industrial para mantenimiento profundo y áreas de lavado.',
    recommendedSafetyDays: 30,
  },
];

export const INITIAL_STOCK: ProductStock[] = [
  {
    productId: 'quirucidal_jabon',
    closedGallons: 0,
    openGallonsFraction: 1.0, // 1 galón destapado
    smallBottles500ml: 1, // 1 frasco de 500 ml
    lastUpdated: new Date().toISOString(),
  },
  {
    productId: 'quirucidal_solucion',
    closedGallons: 1, // 1 cerrado
    openGallonsFraction: 1.0, // 1 destapado
    smallBottles500ml: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    productId: 'enziger',
    closedGallons: 3, // 3 tapados
    openGallonsFraction: 0,
    smallBottles500ml: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    productId: 'quineutrim',
    closedGallons: 1, // 1 cerrado
    openGallonsFraction: 1.0, // 1 destapado
    smallBottles500ml: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    productId: 'supragel',
    closedGallons: 2, // 2 galones tapados
    openGallonsFraction: 0,
    smallBottles500ml: 16, // 16 frascos de 500 ml
    lastUpdated: new Date().toISOString(),
  },
  {
    productId: 'alcohol_70',
    closedGallons: 3, // 3 galones tapados
    openGallonsFraction: 0,
    smallBottles500ml: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    productId: 'quiruger_plus',
    closedGallons: 0,
    openGallonsFraction: 0.5, // Frasco abierto al 50% de un galón
    smallBottles500ml: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    productId: 'quigrass',
    closedGallons: 1, // Se establece 1 galón base para rotación semestral de 180 días
    openGallonsFraction: 0,
    smallBottles500ml: 0,
    lastUpdated: new Date().toISOString(),
  },
];

// Presupuesto mensual por defecto según especificación del usuario
export const DEFAULT_MONTHLY_BUDGET_CAP = 3000000; // $3.000.000 COP
