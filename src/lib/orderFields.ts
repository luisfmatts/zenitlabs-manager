import { Order } from '../types';

export interface OrderField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  category: string;
  showInList: boolean;     // Visibilidad en la lista de tarjetas
  showInDetails: boolean;  // Visibilidad en los detalles detallados
  visible: boolean;        // Si el campo está activo o deshabilitado/oculto temporalmente ("sin eliminar")
  isCustom: boolean;       // Si fue agregado por el usuario en tiempo real
  placeholder?: string;
}

export const DEFAULT_ORDER_FIELDS: OrderField[] = [
  {
    key: 'customer_name',
    label: 'Nombre de Cliente',
    type: 'text',
    category: 'Cliente',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Nombre completo del cliente'
  },
  {
    key: 'customer_phone',
    label: 'Teléfono',
    type: 'text',
    category: 'Cliente',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Ej: +34 600 000 000'
  },
  {
    key: 'customer_email',
    label: 'Correo Electrónico',
    type: 'text',
    category: 'Cliente',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'correo@ejemplo.com'
  },
  {
    key: 'generoCliente',
    label: 'Género Cliente',
    type: 'select',
    options: ['Hombre', 'Mujer', 'Otro'],
    category: 'Cliente',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Seleccione género'
  },
  {
    key: 'pedido',
    label: 'Detalle de Pedido (Resumen)',
    type: 'text',
    category: 'Detalles',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Arreglo floral, ramo de rosas...'
  },
  {
    key: 'fechaEntrega',
    label: 'Fecha de Entrega',
    type: 'date',
    category: 'Detalles',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false
  },
  {
    key: 'horaEntrega',
    label: 'Hora de Entrega',
    type: 'text',
    category: 'Detalles',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Ej: Mañana (9:00 - 12:00)'
  },
  {
    key: 'entregaTienda',
    label: 'Tipo de Entrega (Retiro Tienda)',
    type: 'boolean',
    category: 'Detalles',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false
  },
  {
    key: 'entregaSorpresa',
    label: 'Entrega Sorpresa',
    type: 'boolean',
    category: 'Detalles',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false
  },
  {
    key: 'numeroRosas',
    label: 'Cantidad de Rosas',
    type: 'number',
    category: 'Detalles',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Ej: 12, 24, 50'
  },
  {
    key: 'colorRosas',
    label: 'Color de las Rosas',
    type: 'text',
    category: 'Detalles',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Ej: Rojas, Blancas, Rosas'
  },
  {
    key: 'personalizacion',
    label: 'Detalles de Personalización',
    type: 'text',
    category: 'Detalles',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Papel, globos, cintas especiales...'
  },
  {
    key: 'nombreReceptor',
    label: 'Nombre de Receptor',
    type: 'text',
    category: 'Detalles',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: '¿Quién recibe el arreglo?'
  },
  {
    key: 'tlfReceptor',
    label: 'Teléfono de Receptor',
    type: 'text',
    category: 'Detalles',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Teléfono del receptor'
  },
  {
    key: 'dedicatoria',
    label: 'Dedicatoria de Tarjeta',
    type: 'text',
    category: 'Detalles',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Escribe el mensaje de la tarjeta de regalo...'
  },
  {
    key: 'direccionEntrega',
    label: 'Dirección de Entrega',
    type: 'text',
    category: 'Logística',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Dirección física completa o link'
  },
  {
    key: 'notaEntrega',
    label: 'Indicaciones de Entrega',
    type: 'text',
    category: 'Logística',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Ej: Llamar antes de llegar, dejar con el vigilante'
  },
  {
    key: 'precioFacturado',
    label: 'Precio Facturado (Base)',
    type: 'number',
    category: 'Logística',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: '0.00'
  },
  {
    key: 'deliveryFacturado',
    label: 'Costo de Delivery',
    type: 'number',
    category: 'Logística',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: '0.00'
  },
  {
    key: 'metodoPago',
    label: 'Método de Pago',
    type: 'text',
    category: 'Logística',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Bizum, Transferencia, Efectivo...'
  },
  {
    key: 'partialPay',
    label: 'Señado / Pago Parcial',
    type: 'boolean',
    category: 'Logística',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false
  },
  {
    key: 'total_price',
    label: 'Monto Total (USD/EUR)',
    type: 'number',
    category: 'Logística',
    showInList: true,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: '0.00'
  },
  {
    key: 'tasaDeCambioV',
    label: 'Tasa de Cambio (Bs. u otra)',
    type: 'number',
    category: 'Logística',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Tasa aplicada'
  },
  {
    key: 'asignadoA',
    label: 'Florista / Repartidor Asignado',
    type: 'text',
    category: 'Otros',
    showInList: false,
    showInDetails: true,
    visible: true,
    isCustom: false,
    placeholder: 'Nombre del florista/chofer'
  }
];

const LOCAL_STORAGE_KEY = 'zenit_orders_custom_fields';

export const loadOrderFields = (): OrderField[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as OrderField[];
      // Merge with default fields to ensure any missing system field is still present
      const merged = [...DEFAULT_ORDER_FIELDS];
      parsed.forEach(savedField => {
        const existingIdx = merged.findIndex(f => f.key === savedField.key);
        if (existingIdx >= 0) {
          // Update status
          merged[existingIdx] = { ...merged[existingIdx], ...savedField };
        } else if (savedField.isCustom) {
          // Add dynamic field
          merged.push(savedField);
        }
      });
      return merged;
    }
  } catch (e) {
    console.error('Error loading custom fields:', e);
  }
  return [...DEFAULT_ORDER_FIELDS];
};

export const saveOrderFields = (fields: OrderField[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fields));
    // Dispatch event to notify components
    window.dispatchEvent(new Event('zenit_orders_fields_updated'));
  } catch (e) {
    console.error('Error saving custom fields:', e);
  }
};

const LOCAL_CATEGORIES_KEY = 'zenit_orders_categories';

export const loadOrderCategories = (): string[] => {
  try {
    const saved = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (saved) {
      return JSON.parse(saved) as string[];
    }
  } catch (e) {
    console.error('Error loading custom categories:', e);
  }
  return ['Cliente', 'Detalles', 'Logística', 'Otros'];
};

export const saveOrderCategories = (categories: string[]): void => {
  try {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('zenit_orders_categories_updated'));
  } catch (e) {
    console.error('Error saving custom categories:', e);
  }
};

export const getFieldValue = (order: Order, key: string): any => {
  // Try dynamic metadata first (like dynamic keys in order or extra attributes)
  if (key in order) {
    return (order as any)[key];
  }
  // If not direct, check notes or other places, or custom storage
  const dynamicFields = (order as any).custom_fields || {};
  return dynamicFields[key];
};
