export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
export type OrderPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: OrderItem[];
  total_price: number;
  status: OrderStatus;
  priority: OrderPriority;
  created_at: string;
  updated_at: string;
  delivery_address: string;
  notes?: string;

  // Real-world Supabase columns from orders table
  fechaCreacion?: string;
  nombreCliente?: string;
  pedido?: string;
  asignadoA?: string;
  fechaEntrega?: string;
  horaEntrega?: string;
  nroCliente?: string;
  precioFacturado?: number;
  deliveryFacturado?: number;
  entregaTienda?: boolean;
  direccionEntrega?: string;
  entregaSorpresa?: boolean;
  metodoPago?: string;
  cambioEfectivo?: number;
  tasaDeCambioT?: string;
  tasaDeCambioV?: number;
  dedicatoria?: string;
  personalizacion?: string;
  numeroRosas?: number;
  colorRosas?: string;
  nombreReceptor?: string;
  tlfReceptor?: string;
  generoCliente?: string;
  partialPay?: boolean;
  imageRef?: string;
  entregaDatetime?: string;
  notaEntrega?: string;
  custom_fields?: Record<string, any>;
  [key: string]: any;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  avgPreparationTime: number; // in minutes
  pendingOrdersCount: number;
  preparingOrdersCount: number;
  shippedOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  criticalOrdersCount: number;
}

export interface RealTimeNotification {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  orderId?: string;
}

export interface StockItem {
  id: string;
  name: string;
  qty: number;
  min: number;
  unit: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  desc: string;
  amount: number;
  date: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: string;
  orderId?: string;
}
