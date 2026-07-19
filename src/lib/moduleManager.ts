export interface AppModule {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  iconName: string; // 'LayoutDashboard' | 'ShoppingCart' | 'Flower' | 'Boxes' | 'Coins' | 'Users' | 'TrendingUp'
  isPremium: boolean;
  isAlwaysActive: boolean;
  category: 'core' | 'vertical' | 'operational' | 'financial' | 'analytics';
  enabled: boolean;
}

export interface BusinessVertical {
  id: string;
  name: string;
  description: string;
  iconName: string;
  recommendedModules: string[];
  defaultOrderItems: { name: string; price: number }[];
}

export const APP_MODULES: AppModule[] = [
  {
    id: 'core-orders',
    name: 'Gestión de Órdenes (Core)',
    description: 'Tablero operativo esencial para el registro, tránsito y seguimiento de pedidos.',
    longDescription: 'El motor principal de ZenitLabs. Proporciona el pipeline de órdenes, métricas básicas de rendimiento, panel en tiempo real y persistencia en base de datos en la nube (Supabase).',
    iconName: 'ShoppingCart',
    isPremium: false,
    isAlwaysActive: true,
    category: 'core',
    enabled: true
  },
  {
    id: 'floristry-addons',
    name: 'Personalizador de Pedidos / Regalos',
    description: 'Campos de personalización para mensajes de regalo, dedicatorias y empaques sorpresa.',
    longDescription: 'Añade campos de datos a tus pedidos. Habilita notas de dedicatoria, color o variante especial del producto, datos específicos del destinatario final, opción de entrega sorpresa y especificaciones de empaque a la medida.',
    iconName: 'Gift',
    isPremium: false,
    isAlwaysActive: false,
    category: 'vertical',
    enabled: true // Active by default for the current business
  },
  {
    id: 'inventory-module',
    name: 'Control de Inventario',
    description: 'Seguimiento de materia prima (componentes, empaques, insumos) y stock de productos.',
    longDescription: 'Optimiza tu almacén en tiempo real. Configura alertas de stock mínimo para evitar desabastecimiento de insumos clave en temporadas de alta demanda.',
    iconName: 'Boxes',
    isPremium: true,
    isAlwaysActive: false,
    category: 'operational',
    enabled: false
  },
  {
    id: 'finance-module',
    name: 'Contabilidad y Finanzas',
    description: 'Gestión de caja chica, egresos por insumos, reportes tributarios e ingresos.',
    longDescription: 'Módulo financiero integrado. Registra egresos, controla el flujo de caja diario en múltiples monedas (dólares, bolívares), y genera reportes de utilidad neta listos para auditorías.',
    iconName: 'Coins',
    isPremium: true,
    isAlwaysActive: false,
    category: 'financial',
    enabled: false
  },
  {
    id: 'admin-module',
    name: 'Asignación de Personal y Delivery',
    description: 'Gestión de personal asignado a empaque/preparación y transportistas de reparto.',
    longDescription: 'Coordinación logística interna. Permite asignar responsables de preparación a cada pedido y asociar transportistas específicos a cada ruta, actualizando el estado de entrega en tiempo real.',
    iconName: 'Users',
    isPremium: true,
    isAlwaysActive: false,
    category: 'operational',
    enabled: false
  },
  {
    id: 'analytics-module',
    name: 'Estadísticas e Inteligencia',
    description: 'Análisis predictivo de ventas, productos populares y rendimiento del equipo.',
    longDescription: 'Decisiones basadas en datos. Visualiza los productos con mayor rotación, proyecta la demanda para fechas festivas o de alta transaccionalidad y mide los tiempos de preparación por operario.',
    iconName: 'TrendingUp',
    isPremium: true,
    isAlwaysActive: false,
    category: 'analytics',
    enabled: false
  }
];

export const BUSINESS_VERTICALS: BusinessVertical[] = [
  {
    id: 'gifts-custom',
    name: 'Boutique de Regalos y Personalizados',
    description: 'Ideal para tiendas de regalos, obsequios y productos bajo demanda. Activa campos para dedicatorias, variantes de color y coordinación de entregas sorpresa.',
    iconName: 'Gift',
    recommendedModules: ['core-orders', 'floristry-addons', 'inventory-module', 'admin-module'],
    defaultOrderItems: [
      { name: 'Arreglo de Regalo Premium', price: 45 },
      { name: 'Caja de Obsequios Sorpresa', price: 60 },
      { name: 'Kit de Dulces Personalizado', price: 55 },
      { name: 'Peluche de Felpa Grande', price: 40 }
    ]
  },
  {
    id: 'general-gift',
    name: 'Tienda de Regalos y E-commerce',
    description: 'Optimizado para boutiques de obsequios, chocolates y desayunos sorpresa. Mantiene notas de dedicatoria pero oculta variables botánicas.',
    iconName: 'Gift',
    recommendedModules: ['core-orders', 'inventory-module', 'finance-module'],
    defaultOrderItems: [
      { name: 'Caja de Chocolates Gourmet', price: 25 },
      { name: 'Desayuno Sorpresa Deluxe', price: 45 },
      { name: 'Oso de Peluche Gigante', price: 35 },
      { name: 'Globo Metálico Personalizado', price: 8 }
    ]
  },
  {
    id: 'general-retail',
    name: 'Comercio General / Retail',
    description: 'Flujo estándar para tiendas de ropa, tecnología o artículos del hogar. Interfaz limpia enfocada puramente en clientes, productos y entregas de dirección.',
    iconName: 'Store',
    recommendedModules: ['core-orders', 'inventory-module', 'finance-module', 'analytics-module'],
    defaultOrderItems: [
      { name: 'Suscripción Mensual Premium', price: 15 },
      { name: 'Pack de Envases Eco-Amigables', price: 30 },
      { name: 'Servicio de Despacho Express', price: 10 }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'zenitlabs_active_modules';

export function getActiveModules(): string[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading active modules from localStorage:', e);
  }
  // Default active modules: core-orders and customization addons
  return ['core-orders', 'floristry-addons'];
}

export function saveActiveModules(modules: string[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(modules));
  } catch (e) {
    console.error('Error saving active modules to localStorage:', e);
  }
}

export function toggleModuleInStorage(moduleId: string, enable: boolean): string[] {
  const active = getActiveModules();
  let updated: string[];
  
  if (enable) {
    if (!active.includes(moduleId)) {
      updated = [...active, moduleId];
    } else {
      updated = active;
    }
  } else {
    updated = active.filter(id => id !== moduleId);
  }
  
  saveActiveModules(updated);
  return updated;
}
