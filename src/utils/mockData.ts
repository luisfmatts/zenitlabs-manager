import { Order, OrderItem, DashboardMetrics, RealTimeNotification } from '../types';

export const PRODUCTS = [
  { id: 'p1', name: 'ZenitLabs Laptop Pro', price: 1499, category: 'Hardware' },
  { id: 'p2', name: 'Nebula Monitor 4K', price: 599, category: 'Display' },
  { id: 'p3', name: 'Quantum Mech Keyboard', price: 189, category: 'Peripherals' },
  { id: 'p4', name: 'Cosmos Wireless Mouse', price: 89, category: 'Peripherals' },
  { id: 'p5', name: 'Aurora RGB Headset', price: 129, category: 'Audio' },
  { id: 'p6', name: 'Stellar Desk Pad XL', price: 39, category: 'Accessories' },
];

export const CLIENT_NAMES = [
  'Sofia Rodriguez', 'Mateo Silva', 'Valentina Gomez', 'Santiago Ruiz', 'Camila Fernandez',
  'Alejandro Vega', 'Isabella Castillo', 'Sebastian Perez', 'Mariana Lopez', 'Diego Morales'
];

export const STREET_ADDRESSES = [
  'Av. de la Constitución 142, CDMX',
  'Calle San Martin 450, Buenos Aires',
  'Alameda Bernardo O’Higgins 1020, Santiago',
  'Paseo de la Reforma 89, CDMX',
  'Rua Augusta 1205, São Paulo',
  'Calle 72 #10-34, Bogotá',
  'Av. Larco 743, Lima',
  'Av. 18 de Julio 1920, Montevideo'
];

// Helper to generate recent ISO string relative to current time minus minutes
export function getPastTimeISO(minutesAgo: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-9842',
    customer_name: 'Sofia Rodriguez',
    customer_email: 'sofia.rod@example.com',
    customer_phone: '+52 55 1234 5678',
    delivery_address: 'Av. de la Constitución 142, CDMX',
    items: [
      { id: 'p1', name: 'ZenitLabs Laptop Pro', quantity: 1, price: 1499 },
      { id: 'p4', name: 'Cosmos Wireless Mouse', quantity: 1, price: 89 }
    ],
    total_price: 1588,
    status: 'pending',
    priority: 'high',
    created_at: getPastTimeISO(5), // 5 mins ago
    updated_at: getPastTimeISO(5),
    notes: 'Entregar en portería si no respondo al timbre.'
  },
  {
    id: 'ORD-9841',
    customer_name: 'Mateo Silva',
    customer_email: 'mateo.silva@example.com',
    customer_phone: '+54 11 9876 5432',
    delivery_address: 'Calle San Martin 450, Buenos Aires',
    items: [
      { id: 'p2', name: 'Nebula Monitor 4K', quantity: 2, price: 599 },
      { id: 'p3', name: 'Quantum Mech Keyboard', quantity: 1, price: 189 }
    ],
    total_price: 1387,
    status: 'preparing',
    priority: 'critical',
    created_at: getPastTimeISO(18), // 18 mins ago
    updated_at: getPastTimeISO(15),
    notes: 'URGENTE: Configuración de estación de trabajo crítica.'
  },
  {
    id: 'ORD-9840',
    customer_name: 'Valentina Gomez',
    customer_email: 'valen.gomez@example.com',
    delivery_address: 'Alameda Bernardo O’Higgins 1020, Santiago',
    items: [
      { id: 'p5', name: 'Aurora RGB Headset', quantity: 1, price: 129 }
    ],
    total_price: 129,
    status: 'shipped',
    priority: 'low',
    created_at: getPastTimeISO(45), // 45 mins ago
    updated_at: getPastTimeISO(20),
    notes: 'Favor de llamar al llegar.'
  },
  {
    id: 'ORD-9839',
    customer_name: 'Santiago Ruiz',
    customer_email: 'santiago.ruiz@example.com',
    customer_phone: '+57 300 123 4567',
    delivery_address: 'Calle 72 #10-34, Bogotá',
    items: [
      { id: 'p1', name: 'ZenitLabs Laptop Pro', quantity: 1, price: 1499 },
      { id: 'p6', name: 'Stellar Desk Pad XL', quantity: 1, price: 39 }
    ],
    total_price: 1538,
    status: 'delivered',
    priority: 'medium',
    created_at: getPastTimeISO(120), // 2 hours ago
    updated_at: getPastTimeISO(60),
    notes: ''
  },
  {
    id: 'ORD-9838',
    customer_name: 'Camila Fernandez',
    customer_email: 'camila.f@example.com',
    delivery_address: 'Av. Larco 743, Lima',
    items: [
      { id: 'p3', name: 'Quantum Mech Keyboard', quantity: 1, price: 189 },
      { id: 'p4', name: 'Cosmos Wireless Mouse', quantity: 1, price: 89 }
    ],
    total_price: 278,
    status: 'delivered',
    priority: 'medium',
    created_at: getPastTimeISO(180), // 3 hours ago
    updated_at: getPastTimeISO(110),
    notes: 'Dejar con guardia de seguridad.'
  },
  {
    id: 'ORD-9837',
    customer_name: 'Alejandro Vega',
    customer_email: 'ale.vega@example.com',
    delivery_address: 'Paseo de la Reforma 89, CDMX',
    items: [
      { id: 'p2', name: 'Nebula Monitor 4K', quantity: 1, price: 599 }
    ],
    total_price: 599,
    status: 'cancelled',
    priority: 'high',
    created_at: getPastTimeISO(240), // 4 hours ago
    updated_at: getPastTimeISO(230),
    notes: 'El cliente solicitó reembolso por error en dirección.'
  }
];

export function calculateMetrics(orders: Order[]): DashboardMetrics {
  const totalOrders = orders.length;
  // Exclude cancelled orders from revenue calculation
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_price, 0);

  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered');
  
  // Simulated average preparation/delivery time calculation
  const completedCount = orders.filter(o => o.status === 'delivered').length;
  const basePrepTime = completedCount > 0 ? 25 : 28;

  return {
    totalOrders,
    totalRevenue,
    avgPreparationTime: basePrepTime,
    pendingOrdersCount: orders.filter(o => o.status === 'pending').length,
    preparingOrdersCount: orders.filter(o => o.status === 'preparing').length,
    shippedOrdersCount: orders.filter(o => o.status === 'shipped').length,
    deliveredOrdersCount: orders.filter(o => o.status === 'delivered').length,
    cancelledOrdersCount: orders.filter(o => o.status === 'cancelled').length,
    criticalOrdersCount: orders.filter(o => o.priority === 'critical' && o.status !== 'delivered' && o.status !== 'cancelled').length,
  };
}

// Generate a random, realistic new order
export function generateRandomOrder(): Order {
  const idNum = Math.floor(1000 + Math.random() * 9000);
  const id = `ORD-${idNum}`;
  
  const clientName = CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)];
  const email = `${clientName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
  const address = STREET_ADDRESSES[Math.floor(Math.random() * STREET_ADDRESSES.length)];
  
  // Pick 1 to 3 random items
  const itemsCount = Math.floor(Math.random() * 3) + 1;
  const selectedItems: OrderItem[] = [];
  let totalPrice = 0;
  
  const shuffledProducts = [...PRODUCTS].sort(() => 0.5 - Math.random());
  for (let i = 0; i < itemsCount; i++) {
    const qty = Math.floor(Math.random() * 2) + 1;
    const p = shuffledProducts[i];
    selectedItems.push({
      id: p.id,
      name: p.name,
      quantity: qty,
      price: p.price
    });
    totalPrice += p.price * qty;
  }

  const priorities: Array<Order['priority']> = ['low', 'medium', 'high', 'critical'];
  const pWeights = [0.2, 0.5, 0.2, 0.1]; // weighted selection
  const rand = Math.random();
  let cumulative = 0;
  let priority: Order['priority'] = 'medium';
  
  for (let i = 0; i < priorities.length; i++) {
    cumulative += pWeights[i];
    if (rand <= cumulative) {
      priority = priorities[i];
      break;
    }
  }

  const now = new Date().toISOString();

  return {
    id,
    customer_name: clientName,
    customer_email: email,
    delivery_address: address,
    items: selectedItems,
    total_price: totalPrice,
    status: 'pending',
    priority,
    created_at: now,
    updated_at: now,
    notes: Math.random() > 0.6 ? 'Notas de entrega: Dejar en recepción.' : ''
  };
}

// SQL Script for easy user setup in Supabase SQL editor
export const SUPABASE_SQL_SETUP = `-- 1. Crear tabla de órdenes con la estructura real de ZenitLabs
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  "fechaCreacion" TIMESTAMPTZ DEFAULT NOW(),
  "nombreCliente" VARCHAR(255),
  pedido TEXT,
  "asignadoA" VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Pendiente',
  "fechaEntrega" DATE,
  "horaEntrega" TIME,
  "nroCliente" VARCHAR(50),
  "precioFacturado" NUMERIC(10, 2),
  "deliveryFacturado" NUMERIC(10, 2),
  "entregaTienda" BOOLEAN DEFAULT false,
  "direccionEntrega" TEXT,
  "entregaSorpresa" BOOLEAN DEFAULT false,
  "metodoPago" VARCHAR(50),
  "cambioEfectivo" NUMERIC(10, 2),
  "tasaDeCambioT" VARCHAR(50),
  "tasaDeCambioV" NUMERIC(10, 2),
  dedicatoria TEXT,
  personalizacion TEXT,
  "numeroRosas" INTEGER,
  "colorRosas" VARCHAR(50),
  "nombreReceptor" VARCHAR(255),
  "tlfReceptor" VARCHAR(50),
  "generoCliente" CHAR(1),
  "partialPay" BOOLEAN DEFAULT false,
  "imageRef" TEXT,
  "entregaDatetime" TIMESTAMPTZ,
  "notaEntrega" TEXT
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de acceso (Permitir lectura y escritura pública para el ejemplo)
CREATE POLICY "Permitir lectura para todos" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción para todos" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización para todos" ON orders
  FOR UPDATE USING (true);

-- 4. Habilitar la replicación en tiempo real para la tabla "orders"
alter publication supabase_realtime add table orders;
`;
