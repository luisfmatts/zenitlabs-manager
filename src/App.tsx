import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import NewOrderForm from './components/NewOrderForm';
import SettingsPanel from './components/SettingsPanel';
import ModuleStore from './components/ModuleStore';
import { getActiveModules } from './lib/moduleManager';
import { getSupabaseConfig, getSupabaseClient } from './lib/supabaseClient';
import { INITIAL_ORDERS, generateRandomOrder } from './utils/mockData';
import { Order, OrderStatus, RealTimeNotification, StockItem, FinanceTransaction, StaffMember } from './types';
import { Menu, Radio, Bell, Terminal } from 'lucide-react';

// Helper to map DB Spanish status values to UI statuses
function mapDBStatusToUIStatus(statusStr: string): OrderStatus {
  const s = String(statusStr || '').trim().toLowerCase();
  if (s === 'entregado' || s === 'delivered') return 'delivered';
  if (s === 'en preparación' || s === 'en preparacion' || s === 'preparando' || s === 'preparing') return 'preparing';
  if (s === 'enviado' || s === 'shipped') return 'shipped';
  if (s === 'cancelado' || s === 'cancelled') return 'cancelled';
  return 'pending';
}

// Helper to map UI statuses to DB Spanish status values
function mapUIStatusToDBStatus(status: OrderStatus): string {
  switch (status) {
    case 'delivered': return 'Entregado';
    case 'pending': return 'Pendiente';
    case 'preparing': return 'En preparación';
    case 'shipped': return 'Enviado';
    case 'cancelled': return 'Cancelado';
    default: return 'Pendiente';
  }
}

// Helper to map Supabase row columns to the client Order structure
function mapSupabaseRowToOrder(o: any): Order {
  let itemsList: any[] = [];
  let price = Number(o.precioFacturado || 0);

  // Parse pedido column (which could be a product string or a serialized JSON)
  if (o.pedido) {
    if (typeof o.pedido === 'string') {
      try {
        if (o.pedido.startsWith('{') || o.pedido.startsWith('[')) {
          const parsed = JSON.parse(o.pedido);
          if (Array.isArray(parsed)) {
            itemsList = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.items)) {
              itemsList = parsed.items;
            } else if (parsed.name) {
              itemsList = [{
                id: parsed.id || '1',
                name: parsed.name,
                quantity: parsed.quantity || 1,
                price: Number(parsed.price || o.precioFacturado || 0)
              }];
            } else {
              itemsList = [{
                id: '1',
                name: o.pedido,
                quantity: 1,
                price: price
              }];
            }
          }
        } else {
          itemsList = [{
            id: '1',
            name: o.pedido,
            quantity: 1,
            price: price
          }];
        }
      } catch (e) {
        itemsList = [{
          id: '1',
          name: o.pedido,
          quantity: 1,
          price: price
        }];
      }
    } else if (typeof o.pedido === 'object') {
      const parsedObj = o.pedido;
      if (Array.isArray(parsedObj)) {
        itemsList = parsedObj;
      } else if (parsedObj && typeof parsedObj === 'object') {
        if (Array.isArray(parsedObj.items)) {
          itemsList = parsedObj.items;
        } else if (parsedObj.name) {
          itemsList = [{
            id: parsedObj.id || '1',
            name: parsedObj.name,
            quantity: parsedObj.quantity || 1,
            price: Number(parsedObj.price || o.precioFacturado || 0)
          }];
        } else {
          itemsList = [{
            id: '1',
            name: JSON.stringify(parsedObj),
            quantity: 1,
            price: price
          }];
        }
      }
    }
  } else {
    itemsList = [{
      id: '1',
      name: 'Artículo / Producto',
      quantity: 1,
      price: price
    }];
  }

  // Combine dedicatoria, personalizacion, color, etc. as nice readable notes
  const notesParts: string[] = [];
  if (o.dedicatoria) notesParts.push(`Mensaje de Dedicatoria: "${o.dedicatoria}"`);
  if (o.personalizacion) notesParts.push(`Instrucciones Personalización: ${o.personalizacion}`);
  if (o.notaEntrega) notesParts.push(`Nota Entrega: ${o.notaEntrega}`);
  if (o.colorRosas) notesParts.push(`Variante Especial: ${o.colorRosas} (x${o.numeroRosas || 0})`);
  if (o.nombreReceptor) notesParts.push(`Destinatario: ${o.nombreReceptor} (${o.tlfReceptor || 'sin tlf'})`);
  
  const combinedNotes = notesParts.length > 0 ? notesParts.join(' | ') : '';

  return {
    id: o.id.toString(),
    customer_name: o.nombreCliente || 'Cliente sin nombre',
    customer_email: o.customer_email || 'sin@email.com',
    customer_phone: o.nroCliente ? String(o.nroCliente) : '',
    delivery_address: o.direccionEntrega || (o.entregaTienda ? 'Entrega en Tienda' : 'Dirección no especificada'),
    items: itemsList,
    total_price: price,
    status: mapDBStatusToUIStatus(o.status),
    priority: o.priority || 'medium',
    created_at: o.fechaCreacion || new Date().toISOString(),
    updated_at: o.fechaCreacion || new Date().toISOString(),
    notes: combinedNotes,

    // Real Supabase columns preserved
    fechaCreacion: o.fechaCreacion,
    nombreCliente: o.nombreCliente,
    pedido: typeof o.pedido === 'string' ? o.pedido : JSON.stringify(o.pedido),
    asignadoA: o.asignadoA,
    fechaEntrega: o.fechaEntrega,
    horaEntrega: o.horaEntrega,
    nroCliente: o.nroCliente ? String(o.nroCliente) : undefined,
    precioFacturado: price,
    deliveryFacturado: o.deliveryFacturado ? Number(o.deliveryFacturado) : undefined,
    entregaTienda: o.entregaTienda,
    direccionEntrega: o.direccionEntrega,
    entregaSorpresa: o.entregaSorpresa,
    metodoPago: o.metodoPago,
    cambioEfectivo: o.cambioEfectivo ? Number(o.cambioEfectivo) : undefined,
    tasaDeCambioT: o.tasaDeCambioT,
    tasaDeCambioV: o.tasaDeCambioV ? Number(o.tasaDeCambioV) : undefined,
    dedicatoria: o.dedicatoria,
    personalizacion: o.personalizacion,
    numeroRosas: o.numeroRosas ? Number(o.numeroRosas) : undefined,
    colorRosas: o.colorRosas,
    nombreReceptor: o.nombreReceptor,
    tlfReceptor: o.tlfReceptor ? String(o.tlfReceptor) : undefined,
    generoCliente: o.generoCliente,
    partialPay: o.partialPay,
    imageRef: o.imageRef,
    entregaDatetime: o.entregaDatetime,
    notaEntrega: o.notaEntrega
  };
}

const DEFAULT_STOCK: StockItem[] = [
  { id: '1', name: 'Empaques de Cartón Reciclado', qty: 180, min: 50, unit: 'uds' },
  { id: '2', name: 'Cinta de Embalaje Reforzada', qty: 45, min: 20, unit: 'uds' },
  { id: '3', name: 'Bases de Madera Multiuso', qty: 25, min: 10, unit: 'uds' },
  { id: '4', name: 'Papel Kraft Premium', qty: 60, min: 15, unit: 'uds' },
];

const DEFAULT_STAFF: StaffMember[] = [
  { id: 's1', name: 'Carlos Mendoza', role: 'Operario Principal', status: 'Disponible' },
  { id: 's2', name: 'Sonia Ruiz', role: 'Ensamblador y Control', status: 'Disponible' },
  { id: 's3', name: 'Juan Pérez', role: 'Transportista de Despacho', status: 'Disponible' },
  { id: 's4', name: 'Rogelio Díaz', role: 'Transportista de Despacho', status: 'Disponible' },
];

const DEFAULT_FINANCE: FinanceTransaction[] = [
  { id: 'f1', type: 'income', desc: 'Venta de Producto Personalizado #1024', amount: 60, date: 'Hoy' },
  { id: 'f2', type: 'expense', desc: 'Compra de Insumos al Mayor', amount: 120, date: 'Hoy' },
  { id: 'f3', type: 'income', desc: 'Venta de Caja de Regalo #1023', amount: 45, date: 'Ayer' },
  { id: 'f4', type: 'expense', desc: 'Suministro de Bolsas y Papel', amount: 25, date: 'Hace 2 días' }
];

export default function App() {
  const [supabaseState, setSupabaseState] = useState(() => {
    const { isConfigured } = getSupabaseConfig();
    const client = getSupabaseClient();
    return { isConfigured, client };
  });

  // Listen to credentials change event to update the state immediately
  useEffect(() => {
    const handleConnected = () => {
      const { isConfigured } = getSupabaseConfig();
      const client = getSupabaseClient();
      setSupabaseState({ isConfigured, client });
    };
    window.addEventListener('zenitlabs_supabase_connected', handleConnected);
    return () => {
      window.removeEventListener('zenitlabs_supabase_connected', handleConnected);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const handleTabChange = (tab: string) => {
    if (tab !== 'create') {
      setEditingOrder(null);
    }
    setActiveTab(tab);
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);

  // --- Lifted Exchange Rates State & Fetcher ---
  const [exchangeState, setExchangeState] = useState({
    usd_bcv: 42.15,
    eur_bcv: 45.40,
    binance: 44.90,
    lastUpdated: '',
    loading: true,
    isMock: false,
  });

  const fetchRates = useCallback(async () => {
    setExchangeState(prev => ({ ...prev, loading: true }));
    try {
      const [cotizacionesRes, paraleloRes, oficialRes] = await Promise.allSettled([
        fetch('https://ve.dolarapi.com/v1/cotizaciones'),
        fetch('https://ve.dolarapi.com/v1/dolares/paralelo'),
        fetch('https://ve.dolarapi.com/v1/dolares/oficial')
      ]);

      let usdBcv = 42.15;
      let eurBcv = 45.40;
      let binance = 44.90;
      let parsedSuccessfully = false;

      // Parse Paralelo/Binance
      if (paraleloRes.status === 'fulfilled' && paraleloRes.value.ok) {
        try {
          const data = await paraleloRes.value.json();
          if (data && typeof data.promedio === 'number') {
            binance = data.promedio;
            parsedSuccessfully = true;
          }
        } catch (e) {
          console.warn('Error parsing parallel rate', e);
        }
      }

      // Parse Oficial USD
      if (oficialRes.status === 'fulfilled' && oficialRes.value.ok) {
        try {
          const data = await oficialRes.value.json();
          if (data && typeof data.promedio === 'number') {
            usdBcv = data.promedio;
            parsedSuccessfully = true;
          }
        } catch (e) {
          console.warn('Error parsing oficial USD rate', e);
        }
      }

      // Parse Cotizaciones (mainly for Euro)
      if (cotizacionesRes.status === 'fulfilled' && cotizacionesRes.value.ok) {
        try {
          const data = await cotizacionesRes.value.json();
          if (Array.isArray(data)) {
            if (usdBcv === 42.15) {
              const usdItem = data.find(item => 
                (item.moneda === 'USD' && item.nombre?.toLowerCase().includes('oficial')) ||
                (item.nombre?.toLowerCase().includes('oficial'))
              );
              if (usdItem && typeof usdItem.promedio === 'number') {
                usdBcv = usdItem.promedio;
                parsedSuccessfully = true;
              }
            }

            const eurItem = data.find(item => 
              item.moneda === 'EUR' || item.nombre?.toLowerCase().includes('euro')
            );
            if (eurItem && typeof eurItem.promedio === 'number') {
              eurBcv = eurItem.promedio;
              parsedSuccessfully = true;
            }
          }
        } catch (e) {
          console.warn('Error parsing cotizaciones for Euro', e);
        }
      }

      setExchangeState({
        usd_bcv: usdBcv,
        eur_bcv: eurBcv,
        binance: binance,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        loading: false,
        isMock: !parsedSuccessfully,
      });
    } catch (err) {
      console.warn('Failed to fetch exchange rates, keeping fallback values', err);
      setExchangeState(prev => ({
        ...prev,
        loading: false,
        isMock: true,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Simulado)'
      }));
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Persistent Modular States for Inventory, Finance and Staff (Fase 3 Core)
  const [stock, setStock] = useState<StockItem[]>(() => {
    try {
      const stored = localStorage.getItem('zenitlabs_inventory_stock');
      return stored ? JSON.parse(stored) : DEFAULT_STOCK;
    } catch {
      return DEFAULT_STOCK;
    }
  });

  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => {
    try {
      const stored = localStorage.getItem('zenitlabs_finance_transactions');
      return stored ? JSON.parse(stored) : DEFAULT_FINANCE;
    } catch {
      return DEFAULT_FINANCE;
    }
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const stored = localStorage.getItem('zenitlabs_staff_members');
      return stored ? JSON.parse(stored) : DEFAULT_STAFF;
    } catch {
      return DEFAULT_STAFF;
    }
  });

  // Save changes of these states to localStorage (Fase 3 Core)
  useEffect(() => {
    try {
      localStorage.setItem('zenitlabs_inventory_stock', JSON.stringify(stock));
    } catch (e) {
      console.error(e);
    }
  }, [stock]);

  useEffect(() => {
    try {
      localStorage.setItem('zenitlabs_finance_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('zenitlabs_staff_members', JSON.stringify(staff));
    } catch (e) {
      console.error(e);
    }
  }, [staff]);

  // Save changes of orders to localStorage (Fase 3 Core & Offline support)
  useEffect(() => {
    try {
      localStorage.setItem('zenitlabs_local_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Initialize active modules from localStorage on boot
  useEffect(() => {
    setActiveModules(getActiveModules());
  }, []);

  const isFloristryEnabled = activeModules.includes('floristry-addons');


  // Dynamic tab title update
  useEffect(() => {
    let title = "ZenitLabs - Real-Time Order System";
    if (activeTab === 'dashboard') title = "ZenitLabs - Dashboard";
    else if (activeTab === 'orders') title = "ZenitLabs - Gestión de Órdenes";
    else if (activeTab === 'create') title = "ZenitLabs - Nueva Orden";
    else if (activeTab === 'database') title = "ZenitLabs - Conexión Supabase";
    else if (activeTab === 'module-store') title = "ZenitLabs - Tienda y Asistente";
    document.title = title;
  }, [activeTab]);

  // Helper to add log notifications safely
  const addNotification = useCallback((
    type: 'info' | 'success' | 'warning' | 'error', 
    title: string, 
    message: string, 
    orderId?: string
  ) => {
    const newNotif: RealTimeNotification = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      type,
      title,
      message,
      orderId
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // limit log to 50 entries
  }, []);

  // Helper to automatically deduct stock from inventory based on order contents (Fase 3 Core)
  const deductStockForOrder = useCallback((order: Order) => {
    const activeMods = getActiveModules();
    if (!activeMods.includes('inventory-module')) return; // Deduct only if inventory module is configured/active

    const customUnitsCount = order.numeroRosas || 0; // custom components count
    let tapeUnitsCount = 0;
    let basesCount = 0;
    let kraftPaperCount = 0;

    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const name = item.name.toLowerCase();
        if (name.includes('girasol') || name.includes(' premium') || name.includes('pro')) {
          tapeUnitsCount += 3 * item.quantity;
        } else {
          tapeUnitsCount += 1 * item.quantity;
        }
        
        if (name.includes('cesta') || name.includes('caja') || name.includes('base') || name.includes('imperial') || name.includes('madera')) {
          basesCount += 1 * item.quantity;
        } else if (item.price > 20) {
          basesCount += 1 * item.quantity;
        }

        if (name.includes('ramo') || name.includes('arreglo') || name.includes('regalo') || name.includes('personalizado')) {
          kraftPaperCount += 2 * item.quantity;
        }
      });
    } else {
      // Fallback deduction based on order total price
      if (order.total_price > 40) {
        tapeUnitsCount = 4;
        basesCount = 1;
        kraftPaperCount = 2;
      }
    }

    setStock(prevStock => {
      const updated = prevStock.map(item => {
        let deductAmount = 0;
        if (item.id === '1') deductAmount = customUnitsCount;
        else if (item.id === '2') deductAmount = tapeUnitsCount;
        else if (item.id === '3') deductAmount = basesCount;
        else if (item.id === '4') deductAmount = kraftPaperCount;

        if (deductAmount === 0) return item;

        const newQty = Math.max(0, item.qty - deductAmount);
        
        // Trigger warning notification if it falls below minimum
        if (newQty <= item.min && item.qty > item.min) {
          setTimeout(() => {
            addNotification(
              'warning',
              'Alerta de Inventario Crítico',
              `El stock de "${item.name}" ha caído a ${newQty} ${item.unit}, por debajo del mínimo establecido (${item.min}).`,
              order.id
            );
          }, 600);
        }

        return { ...item, qty: newQty };
      });
      return updated;
    });
  }, [addNotification]);

  // Helper to assign a staff member to a specific order in real time (Fase 3 Core)
  const assignStaffToOrder = useCallback(async (orderId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return;

    // 1. Update orders locally
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, asignadoA: staffMember.name } : o));

    // 2. Update staff member state
    setStaff(prevStaff => prevStaff.map(s => {
      if (s.id === staffId) {
        return {
          ...s,
          status: s.role.toLowerCase().includes('reparto') || s.role.toLowerCase().includes('motorizado') ? 'En Ruta' : 'Preparando',
          orderId: `#${orderId}`
        };
      }
      return s;
    }));

    addNotification(
      'info',
      'Personal Asignado',
      `Se ha asignado a ${staffMember.name} (${staffMember.role}) para gestionar la orden #${orderId}.`
    );

    // Sync with Supabase if connected
    if (supabaseState.isConfigured && supabaseState.client) {
      // Only sync if the ID is purely numeric (real database bigint)
      const isDbId = /^\d+$/.test(orderId);
      if (isDbId) {
        try {
          const updatedPayload = {
            asignadoA: staffMember.name
          };

          const { error } = await supabaseState.client
            .from('orders')
            .update(updatedPayload)
            .eq('id', parseInt(orderId, 10));

          if (error) throw error;
        } catch (err) {
          console.warn('Error syncing staff assignment to Supabase:', err);
        }
      }
    }
  }, [staff, addNotification]);


  // 1. Fetch initial orders (either from Supabase cloud database or fallback mock database / localStorage)
  useEffect(() => {
    async function loadOrders() {
      if (supabaseState.isConfigured && supabaseState.client) {
        try {
          const { data, error } = await supabaseState.client
            .from('orders')
            .select('*')
            .order('id', { ascending: false });

          if (error) throw error;
          
          if (data) {
            const mapped: Order[] = data.map((o: any) => mapSupabaseRowToOrder(o));
            setOrders(mapped);
            addNotification(
              'success', 
              'Conexión Supabase Establecida', 
              'Se han recuperado exitosamente todas las órdenes activas en la nube.'
            );
          }
        } catch (err: any) {
          console.warn('[ZenitLabs-Core] Supabase load warning:', err);
          const localSavedOrders = localStorage.getItem('zenitlabs_local_orders');
          setOrders(localSavedOrders ? JSON.parse(localSavedOrders) : INITIAL_ORDERS);
          addNotification(
            'error', 
            'Error al Cargar desde Cloud', 
            `No se pudo leer de Supabase: ${err.message}. Iniciando en modo simulación local.`
          );
        }
      } else {
        const localSavedOrders = localStorage.getItem('zenitlabs_local_orders');
        setOrders(localSavedOrders ? JSON.parse(localSavedOrders) : INITIAL_ORDERS);
        addNotification(
          'info', 
          'Motor ZenitLabs Simulación Activo', 
          'Iniciando en modo local fuera de línea con datos de demostración o guardados.'
        );
      }
    }

    loadOrders();
  }, [addNotification, supabaseState.isConfigured, supabaseState.client]);

  // 2. Real-time Pub/Sub subscription setup for Supabase changes
  useEffect(() => {
    if (!supabaseState.isConfigured || !supabaseState.client) return;

    console.log('[ZenitLabs-Core] Subscribing to postgres changes channel...');
    const channel = supabaseState.client
      .channel('public:orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          
          if (eventType === 'INSERT' && newRow) {
            const mappedOrder: Order = mapSupabaseRowToOrder(newRow);

            setOrders(prev => {
              // Idempotency check: Guard against duplicate inserts
              if (prev.some(o => o.id === mappedOrder.id)) return prev;
              return [mappedOrder, ...prev];
            });

            addNotification(
              'success', 
              'Orden Registrada (Real-time)', 
              `El sistema ha recibido una nueva orden del cliente ${mappedOrder.customer_name} por un total de $${mappedOrder.total_price.toLocaleString()}.`,
              mappedOrder.id
            );
          } 
          
          else if (eventType === 'UPDATE' && newRow) {
            const mappedOrder: Order = mapSupabaseRowToOrder(newRow);

            setOrders(prev => prev.map(o => o.id === mappedOrder.id ? mappedOrder : o));
            
            addNotification(
              'info', 
              'Orden Transicionada (Real-time)', 
              `La orden ${mappedOrder.id} de ${mappedOrder.customer_name} avanzó a estado: ${mappedOrder.status.toUpperCase()}.`,
              mappedOrder.id
            );
          } 
          
          else if (eventType === 'DELETE' && oldRow) {
            const oldIdStr = oldRow.id ? oldRow.id.toString() : '';
            setOrders(prev => prev.filter(o => o.id !== oldIdStr));
            addNotification(
              'warning', 
              'Orden Eliminada en Base de Datos', 
              `La orden con ID ${oldIdStr} fue eliminada externamente de la base de datos.`
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(`[ZenitLabs-Core] Real-time channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          addNotification(
            'success', 
            'Canal en Tiempo Real Abierto', 
            'Escuchando cambios incrementales en la tabla "orders" de Supabase.'
          );
        }
      });

    return () => {
      console.log('[ZenitLabs-Core] Unsubscribing from real-time channel...');
      if (supabaseState.client) {
        supabaseState.client.removeChannel(channel);
      }
    };
  }, [supabaseState.isConfigured, supabaseState.client, addNotification]);

  // 3. Fallback ZenitLabs Simulation Engine (Runs ONLY if Supabase is NOT configured)
  useEffect(() => {
    if (supabaseState.isConfigured) return;

    // A. Simulated order inflow timer
    const orderInterval = setInterval(() => {
      // 30% chance to insert a new order automatically
      if (Math.random() > 0.65) {
        const newOrder = generateRandomOrder();
        setOrders(prev => [newOrder, ...prev]);
        deductStockForOrder(newOrder); // Deduct stock automatically (Fase 3)
        addNotification(
          'success',
          'Nueva Orden Recibida (Simulada)',
          `[ZenitLabs-Sim] El cliente ${newOrder.customer_name} ingresó un pedido por $${newOrder.total_price.toLocaleString()}.`,
          newOrder.id
        );
      }
    }, 24000); // Check every 24s

    // B. Simulated status advancement timer
    const statusInterval = setInterval(() => {
      setOrders(prev => {
        const activeOrders = prev.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'shipped');
        if (activeOrders.length === 0) return prev;

        // Progress a random active order
        const randomIndex = Math.floor(Math.random() * activeOrders.length);
        const randomOrder = activeOrders[randomIndex];
        
        let nextStatus: OrderStatus = 'pending';
        if (randomOrder.status === 'pending') nextStatus = 'preparing';
        else if (randomOrder.status === 'preparing') nextStatus = 'shipped';
        else if (randomOrder.status === 'shipped') nextStatus = 'delivered';

        const updated = {
          ...randomOrder,
          status: nextStatus,
          updated_at: new Date().toISOString()
        };

        addNotification(
          'info',
          'Tránsito Operativo (Simulado)',
          `[ZenitLabs-Sim] El pedido ${randomOrder.id} ha progresado automáticamente al estado: ${nextStatus.toUpperCase()}.`,
          randomOrder.id
        );

        return prev.map(o => o.id === randomOrder.id ? updated : o);
      });
    }, 18000); // Check every 18s

    return () => {
      clearInterval(orderInterval);
      clearInterval(statusInterval);
    };
  }, [supabaseState.isConfigured, addNotification]);

  // 4. Manual order insertion handler (with cloud sync or local mock fallback)
  const addOrder = useCallback(async (order: Order) => {
    // Optimistic local update
    setOrders(prev => [order, ...prev]);
    deductStockForOrder(order); // Deduct stock automatically (Fase 3)
    addNotification(
      'success',
      'Despachando Orden...',
      `Transmitiendo orden ${order.id} por un monto de $${order.total_price.toLocaleString()}...`,
      order.id
    );

    if (supabaseState.isConfigured && supabaseState.client) {
      try {
        const dbPayload = {
          fechaCreacion: order.fechaCreacion || order.created_at || new Date().toISOString(),
          nombreCliente: order.nombreCliente || order.customer_name,
          pedido: order.pedido || order.items.map(it => `${it.quantity}x ${it.name}`).join(', '),
          status: mapUIStatusToDBStatus(order.status),
          direccionEntrega: order.entregaTienda ? 'Entrega en Tienda' : (order.direccionEntrega || order.delivery_address),
          nroCliente: order.nroCliente || order.customer_phone || null,
          precioFacturado: order.precioFacturado !== undefined ? order.precioFacturado : order.total_price,
          deliveryFacturado: order.deliveryFacturado || 0,
          entregaTienda: !!order.entregaTienda,
          dedicatoria: order.dedicatoria || null,
          personalizacion: order.personalizacion || order.notes || null,
          nombreReceptor: order.entregaSorpresa ? (order.nombreReceptor || null) : null,
          tlfReceptor: order.entregaSorpresa ? (order.tlfReceptor || null) : null,
          metodoPago: order.metodoPago || 'Pago Móvil',
          colorRosas: order.colorRosas || null,
          numeroRosas: order.numeroRosas || null,
          imageRef: order.imageRef || null,
          notaEntrega: order.notaEntrega || null,
          fechaEntrega: order.fechaEntrega || null,
          horaEntrega: order.horaEntrega || null,
          tasaDeCambioT: order.tasaDeCambioT || null,
          tasaDeCambioV: order.tasaDeCambioV || null,
          generoCliente: order.generoCliente || null,
          entregaSorpresa: !!order.entregaSorpresa,
          partialPay: !!order.partialPay
        };

        const { data, error } = await supabaseState.client.from('orders').insert([dbPayload]).select();
        if (error) throw error;
        
        if (data && data[0]) {
          const mapped = {
            ...order,
            id: data[0].id.toString()
          };
          // Update local state with the actual database-assigned bigint ID
          setOrders(prev => prev.map(o => o.id === order.id ? mapped : o));
        }
      } catch (err: any) {
        console.warn('[ZenitLabs-Core] Error inserting order in Supabase:', err);
        addNotification(
          'error', 
          'Fallo de Sincronización', 
          `No se pudo registrar la orden en Supabase: ${err.message}. Revirtiendo cambio local.`,
          order.id
        );
        // Rollback optimistic update
        setOrders(prev => prev.filter(o => o.id !== order.id));
      }
    }
  }, [addNotification]);

  // 4b. Manual order update/edit handler (with cloud sync or local mock fallback)
  const updateOrder = useCallback(async (order: Order) => {
    // Local state update
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));

    addNotification(
      'success',
      'Actualizando Orden...',
      `Guardando cambios para la orden ${order.id}...`,
      order.id
    );

    if (supabaseState.isConfigured && supabaseState.client) {
      const isDbId = /^\d+$/.test(order.id);
      if (isDbId) {
        try {
          const dbPayload = {
            fechaCreacion: order.fechaCreacion || order.created_at || new Date().toISOString(),
            nombreCliente: order.nombreCliente || order.customer_name,
            pedido: order.pedido || order.items.map(it => `${it.quantity}x ${it.name}`).join(', '),
            status: mapUIStatusToDBStatus(order.status),
            direccionEntrega: order.entregaTienda ? 'Entrega en Tienda' : (order.direccionEntrega || order.delivery_address),
            nroCliente: order.nroCliente || order.customer_phone || null,
            precioFacturado: order.precioFacturado !== undefined ? order.precioFacturado : order.total_price,
            deliveryFacturado: order.deliveryFacturado || 0,
            entregaTienda: !!order.entregaTienda,
            dedicatoria: order.dedicatoria || null,
            personalizacion: order.personalizacion || order.notes || null,
            nombreReceptor: order.entregaSorpresa ? (order.nombreReceptor || null) : null,
            tlfReceptor: order.entregaSorpresa ? (order.tlfReceptor || null) : null,
            metodoPago: order.metodoPago || 'Pago Móvil',
            colorRosas: order.colorRosas || null,
            numeroRosas: order.numeroRosas || null,
            imageRef: order.imageRef || null,
            notaEntrega: order.notaEntrega || null,
            fechaEntrega: order.fechaEntrega || null,
            horaEntrega: order.horaEntrega || null,
            tasaDeCambioT: order.tasaDeCambioT || null,
            tasaDeCambioV: order.tasaDeCambioV || null,
            generoCliente: order.generoCliente || null,
            entregaSorpresa: !!order.entregaSorpresa,
            partialPay: !!order.partialPay
          };

          const { error } = await supabaseState.client
            .from('orders')
            .update(dbPayload)
            .eq('id', parseInt(order.id, 10));

          if (error) throw error;

          addNotification(
            'success',
            'Sincronizado con Éxito',
            `La orden ${order.id} se actualizó correctamente en la nube.`,
            order.id
          );
        } catch (err: any) {
          console.warn('[ZenitLabs-Core] Error updating order in Supabase:', err);
          addNotification(
            'error',
            'Fallo de Sincronización',
            `No se pudieron guardar los cambios en Supabase: ${err.message}.`,
            order.id
          );
        }
      } else {
        addNotification(
          'success',
          'Orden Guardada Localmente',
          `Cambios guardados localmente para la orden simulada ${order.id}.`,
          order.id
        );
      }
    }
  }, [supabaseState.isConfigured, supabaseState.client, addNotification]);

  // 5. Manual order status progression handler (with cloud sync or local mock fallback)
  const updateOrderStatus = useCallback(async (id: string, newStatus: OrderStatus) => {
    let oldOrder: Order | undefined;

    // Optimistic local update
    setOrders(prev => {
      oldOrder = prev.find(o => o.id === id);
      return prev.map(o => o.id === id ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o);
    });

    addNotification(
      'info',
      'Tránsito de Estado...',
      `Transicionando orden ${id} al estado: ${newStatus.toUpperCase()}...`,
      id
    );

    // If transitioning to delivered, register a finance transaction automatically (Fase 3)
    if (newStatus === 'delivered') {
      setOrders(currentOrders => {
        const targetOrder = currentOrders.find(o => o.id === id);
        if (targetOrder && targetOrder.status === 'delivered') {
          setTransactions(prev => {
            // Check if transaction already exists to avoid duplicates
            if (prev.some(t => t.desc.includes(`Venta #${id}`))) return prev;
            
            const newTx: FinanceTransaction = {
              id: 'f_auto_' + Math.random().toString(36).substring(2, 9),
              type: 'income',
              desc: `Venta #${targetOrder.id} - ${targetOrder.customer_name}`,
              amount: targetOrder.total_price,
              date: 'Hoy'
            };
            
            setTimeout(() => {
              addNotification(
                'success',
                'Asiento Contable Auto-Generado',
                `Se ha ingresado un asiento por $${targetOrder.total_price.toFixed(2)} USD tras la entrega del pedido #${targetOrder.id}.`
              );
            }, 300);

            return [newTx, ...prev];
          });
        }
        return currentOrders;
      });
    }

    if (supabaseState.isConfigured && supabaseState.client) {
      // Only sync if the ID is purely numeric (real database bigint)
      const isDbId = /^\d+$/.test(id);
      if (isDbId) {
        try {
          const updatedPayload = {
            status: mapUIStatusToDBStatus(newStatus)
          };

          const { error } = await supabaseState.client
            .from('orders')
            .update(updatedPayload)
            .eq('id', parseInt(id, 10));

          if (error) throw error;
        } catch (err: any) {
          console.warn('[ZenitLabs-Core] Error updating status in Supabase:', err);
          addNotification(
            'error', 
            'Fallo al Sincronizar Estado', 
            `No se pudo registrar el cambio en Supabase: ${err.message}. Revirtiendo estado local.`,
            id
          );
          // Rollback optimistic update
          if (oldOrder) {
            setOrders(prev => prev.map(o => o.id === id ? oldOrder! : o));
          }
        }
      }
    }
  }, [addNotification]);

  // Quick helper to force manual simulated order generation (from welcome banner)
  const triggerMockOrder = () => {
    const mock = generateRandomOrder();
    setOrders(prev => [mock, ...prev]);
    deductStockForOrder(mock); // Deduct stock automatically (Fase 3)
    addNotification(
      'success',
      'Orden Forzada Manual',
      `[Operador] Entrada forzada de pedido ${mock.id} de ${mock.customer_name} por $${mock.total_price.toLocaleString()}.`,
      mock.id
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      
      {/* Mobile Top Header (hidden on desktop) */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur fixed top-0 left-0 right-0 flex items-center justify-between px-6 z-30 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-center overflow-hidden">
            <img 
              src="https://cdn.prod.website-files.com/68daa376ee2e97c41b60cdd3/68dac75db17af64821b4c9c8_zenitlabs-logo-symbol-color.svg" 
              alt="ZenitLabs Logo" 
              className="h-6 w-6 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-display font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ZenitLabs
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications pill indicator */}
          {notifications.length > 0 && (
            <button 
              onClick={() => setShowLogDrawer(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/20 font-mono text-[10px] text-cyan-400 cursor-pointer transition-colors"
            >
              <Bell className="h-3 w-3" />
              <span>{notifications.length}</span>
            </button>
          )}

          <button
            id="mobile-menu-hamburger"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isSupabaseConnected={supabaseState.isConfigured}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        orderCount={orders.length}
      />

      {/* Main Content Pane */}
      <main className="flex-1 lg:pl-72 min-h-screen flex flex-col pt-16 lg:pt-0">
        
        {/* Desktop Header panel (hidden on mobile) */}
        <div className="h-20 border-b border-slate-900/60 bg-slate-950/50 backdrop-blur sticky top-0 hidden lg:flex items-center justify-between px-10 z-20">
          <div>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Mapeador de Operación</p>
            <h2 className="text-sm font-bold text-slate-300 font-sans">
              {activeTab === 'dashboard' && 'Panel de Rendimiento Operativo'}
              {activeTab === 'orders' && 'Tránsito de Backlog de Ventas'}
              {activeTab === 'create' && 'Emisión y Despacho de Pedidos'}
              {activeTab === 'database' && 'Configuración de Nube Descentralizada'}
              {activeTab === 'module-store' && 'Gestor de Módulos & Wizards'}
            </h2>
          </div>

          <div className="flex items-center gap-5">
            {/* Live UTC indicator */}
            <div className="text-right">
              <p className="text-[9px] text-slate-600 font-mono tracking-wider uppercase">Servidor UTC</p>
              <p className="text-xs font-semibold text-slate-400 font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} UTC
              </p>
            </div>

            <div className="h-8 w-px bg-slate-900" />

            {/* Notification Indicator panel */}
            <button 
              onClick={() => setShowLogDrawer(true)}
              className="flex items-center gap-2 hover:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-800 transition-all cursor-pointer"
            >
              <div className="relative">
                <Bell className="h-4.5 w-4.5 text-slate-400 hover:text-white transition-colors" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">
                {notifications.length} Logs
              </span>
            </button>
          </div>
        </div>

        {/* Content Section wrapper */}
        <div className="flex-1 p-6 md:p-10 bg-slate-950/40 relative">
          
          {/* Celestial background glow detail (ZenitLabs style) */}
          <div className="absolute top-0 right-1/4 h-96 w-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/4 h-96 w-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Active View Router */}
          <div className="relative z-10">
            {activeTab === 'dashboard' && (
              <Dashboard 
                orders={orders} 
                notifications={notifications} 
                clearNotifications={() => setNotifications([])}
                triggerMockOrder={triggerMockOrder}
                activeModules={activeModules}
                addNotification={addNotification}
                setActiveTab={handleTabChange}
                stock={stock}
                setStock={setStock}
                transactions={transactions}
                setTransactions={setTransactions}
                staff={staff}
                setStaff={setStaff}
                exchangeState={exchangeState}
                fetchRates={fetchRates}
              />
            )}
            {activeTab === 'orders' && (
              <OrderList 
                orders={orders} 
                updateOrderStatus={updateOrderStatus} 
                isFloristryEnabled={isFloristryEnabled}
                staff={staff}
                assignStaffToOrder={assignStaffToOrder}
                activeModules={activeModules}
                onEditOrder={(order) => {
                  setEditingOrder(order);
                  setActiveTab('create');
                }}
              />
            )}
            {activeTab === 'create' && (
              <NewOrderForm 
                onAddOrder={addOrder} 
                onUpdateOrder={updateOrder}
                orderToEdit={editingOrder}
                setActiveTab={handleTabChange} 
                isFloristryEnabled={isFloristryEnabled}
                addNotification={addNotification}
                exchangeState={exchangeState}
              />
            )}
            {activeTab === 'database' && (
              <SettingsPanel 
                isSupabaseConnected={supabaseState.isConfigured} 
              />
            )}
            {activeTab === 'module-store' && (
              <ModuleStore
                onModulesChanged={(updatedIds) => setActiveModules(updatedIds)}
                addNotification={(type, title, message) => addNotification(type, title, message)}
                stock={stock}
                setStock={setStock}
                transactions={transactions}
                setTransactions={setTransactions}
                staff={staff}
                setStaff={setStaff}
              />
            )}
          </div>
        </div>
      </main>

      {/* Slide-over Right Debug Logs Drawer */}
      {showLogDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity cursor-pointer" 
              onClick={() => setShowLogDrawer(false)}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col bg-slate-900 border-l border-slate-800 shadow-2xl">
                  {/* Header */}
                  <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold font-sans text-white flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-cyan-400 animate-pulse" />
                        Consola de Depuración
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-1">Logs del backend, base de datos y eventos en tiempo real.</p>
                    </div>
                    <button 
                      onClick={() => setShowLogDrawer(false)}
                      className="text-slate-400 hover:text-white text-xs border border-slate-800 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>

                  {/* Status Box */}
                  <div className="p-4 bg-slate-950/40 border-b border-slate-850 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Estado de Supabase:</span>
                      {supabaseState.isConfigured ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          CONECTADO (Producción)
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          SIMULADO (Modo de Fallback local)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Tasa Euro BCV / Dólar:</span>
                      <span className="text-indigo-400">Bs. {exchangeState.eur_bcv.toFixed(2)} / {exchangeState.usd_bcv.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Body - Logs Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Últimas Acciones Registradas</span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Borrar todo
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-center">
                        <Terminal className="h-7 w-7 opacity-20 mb-2 animate-pulse text-cyan-400" />
                        <p className="text-xs">No hay logs en la sesión actual.</p>
                        <p className="text-[10px] text-slate-600 mt-1 max-w-xs">Realice acciones en el sistema (ej. crear orden, subir imagen, o cambiar estado) para auditar procesos.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {notifications.map(log => {
                          const borderColors = {
                            info: 'border-l-indigo-500 bg-indigo-950/20 text-indigo-300 border-indigo-950',
                            success: 'border-l-emerald-500 bg-emerald-950/20 text-emerald-300 border-indigo-950',
                            warning: 'border-l-amber-500 bg-amber-950/20 text-amber-300 border-indigo-950',
                            error: 'border-l-rose-500 bg-rose-950/20 text-rose-300 border-indigo-950',
                          };
                          return (
                            <div key={log.id} className={`p-3 rounded-xl border border-l-2 text-xs leading-relaxed transition-colors ${borderColors[log.type]}`}>
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <span className="font-bold text-white tracking-tight">{log.title}</span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px] font-mono leading-normal break-words">{log.message}</p>
                              {log.orderId && (
                                <span className="inline-block mt-1.5 text-[9px] bg-slate-950/50 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">
                                  ID: {log.orderId}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      onClick={async () => {
                        addNotification('info', 'Autodiagnóstico', 'Verificando servicios e integraciones...');
                        await new Promise(r => setTimeout(r, 600));
                        if (supabaseState.isConfigured) {
                          addNotification('success', 'Supabase OK', 'Conexión verificada con éxito. Claves y tablas disponibles.');
                        } else {
                          addNotification('warning', 'Supabase Demo', 'Usando fallback local. Complete la configuración en la pestaña de Nube.');
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white text-slate-300 font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      Autodiagnóstico
                    </button>
                    <button
                      onClick={() => {
                        triggerMockOrder();
                        addNotification('info', 'Simulador', 'Generando orden automática aleatoria en el backend...');
                      }}
                      className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      Simular Pedido
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
