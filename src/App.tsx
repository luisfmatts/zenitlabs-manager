import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import NewOrderForm from './components/NewOrderForm';
import SettingsPanel from './components/SettingsPanel';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import { INITIAL_ORDERS, generateRandomOrder } from './utils/mockData';
import { Order, OrderStatus, RealTimeNotification } from './types';
import { Menu, Radio, Bell } from 'lucide-react';

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
      name: 'Arreglo Floral',
      quantity: 1,
      price: price
    }];
  }

  // Combine dedicatoria, personalizacion, color, etc. as nice readable notes
  const notesParts: string[] = [];
  if (o.dedicatoria) notesParts.push(`Dedicatoria: "${o.dedicatoria}"`);
  if (o.personalizacion) notesParts.push(`Personalización: ${o.personalizacion}`);
  if (o.notaEntrega) notesParts.push(`Nota Entrega: ${o.notaEntrega}`);
  if (o.colorRosas) notesParts.push(`Rosas: ${o.colorRosas} (x${o.numeroRosas || 0})`);
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

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Dynamic tab title update
  useEffect(() => {
    let title = "ZenitLabs - Real-Time Order System";
    if (activeTab === 'dashboard') title = "ZenitLabs - Dashboard";
    else if (activeTab === 'orders') title = "ZenitLabs - Gestión de Órdenes";
    else if (activeTab === 'create') title = "ZenitLabs - Nueva Orden";
    else if (activeTab === 'database') title = "ZenitLabs - Conexión Supabase";
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

  // 1. Fetch initial orders (either from Supabase cloud database or fallback mock database)
  useEffect(() => {
    async function loadOrders() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
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
          setOrders(INITIAL_ORDERS);
          addNotification(
            'error', 
            'Error al Cargar desde Cloud', 
            `No se pudo leer de Supabase: ${err.message}. Iniciando en modo simulación local.`
          );
        }
      } else {
        setOrders(INITIAL_ORDERS);
        addNotification(
          'info', 
          'Motor ZenitLabs Simulación Activo', 
          'Iniciando en modo local fuera de línea con datos de demostración.'
        );
      }
    }

    loadOrders();
  }, [addNotification]);

  // 2. Real-time Pub/Sub subscription setup for Supabase changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    console.log('[ZenitLabs-Core] Subscribing to postgres changes channel...');
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  // 3. Fallback ZenitLabs Simulation Engine (Runs ONLY if Supabase is NOT configured)
  useEffect(() => {
    if (isSupabaseConfigured) return;

    // A. Simulated order inflow timer
    const orderInterval = setInterval(() => {
      // 30% chance to insert a new order automatically
      if (Math.random() > 0.65) {
        const newOrder = generateRandomOrder();
        setOrders(prev => [newOrder, ...prev]);
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
  }, [isSupabaseConfigured, addNotification]);

  // 4. Manual order insertion handler (with cloud sync or local mock fallback)
  const addOrder = useCallback(async (order: Order) => {
    // Optimistic local update
    setOrders(prev => [order, ...prev]);
    addNotification(
      'success',
      'Despachando Orden...',
      `Transmitiendo orden ${order.id} por un monto de $${order.total_price.toLocaleString()}...`,
      order.id
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          fechaCreacion: order.created_at || new Date().toISOString(),
          nombreCliente: order.customer_name,
          pedido: order.items.map(it => `${it.quantity}x ${it.name}`).join(', '), // plain description like "Minigirasoles Margaritas"
          status: mapUIStatusToDBStatus(order.status),
          direccionEntrega: order.delivery_address,
          nroCliente: order.customer_phone || null,
          precioFacturado: order.total_price,
          deliveryFacturado: order.deliveryFacturado || 0,
          entregaTienda: order.delivery_address.toLowerCase().includes('tienda'),
          dedicatoria: order.notes || null,
          personalizacion: order.personalizacion || null,
          nombreReceptor: order.nombreReceptor || null,
          tlfReceptor: order.tlfReceptor || null,
          metodoPago: order.metodoPago || 'Pago Móvil',
          colorRosas: order.colorRosas || null,
          numeroRosas: order.numeroRosas || null,
          imageRef: order.imageRef || null,
          notaEntrega: order.notaEntrega || null
        };

        const { data, error } = await supabase.from('orders').insert([dbPayload]).select();
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

    if (isSupabaseConfigured && supabase) {
      try {
        const isNumericId = !isNaN(Number(id));
        const updatedPayload = {
          status: mapUIStatusToDBStatus(newStatus)
        };

        const query = supabase.from('orders').update(updatedPayload);
        const { error } = isNumericId 
          ? await query.eq('id', parseInt(id)) 
          : await query.eq('id', id);

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
  }, [addNotification]);

  // Quick helper to force manual simulated order generation (from welcome banner)
  const triggerMockOrder = () => {
    const mock = generateRandomOrder();
    setOrders(prev => [mock, ...prev]);
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
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 flex items-center justify-between px-6 z-30 lg:hidden">
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
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800/20 font-mono text-[10px] text-cyan-400">
              <Bell className="h-3 w-3" />
              <span>{notifications.length}</span>
            </div>
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
        setActiveTab={setActiveTab}
        isSupabaseConnected={isSupabaseConfigured}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        orderCount={orders.length}
      />

      {/* Main Content Pane */}
      <main className="flex-1 lg:pl-72 min-h-screen flex flex-col">
        
        {/* Desktop Header panel (hidden on mobile) */}
        <div className="h-20 border-b border-slate-900/60 bg-slate-950/50 backdrop-blur sticky top-0 hidden lg:flex items-center justify-between px-10 z-20">
          <div>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Mapeador de Operación</p>
            <h2 className="text-sm font-bold text-slate-300 font-display">
              {activeTab === 'dashboard' && 'Panel de Rendimiento Operativo'}
              {activeTab === 'orders' && 'Tránsito de Backlog de Ventas'}
              {activeTab === 'create' && 'Emisión y Despacho de Pedidos'}
              {activeTab === 'database' && 'Configuración de Nube Descentralizada'}
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="h-4.5 w-4.5 text-slate-400 hover:text-white transition-colors cursor-pointer" />
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
            </div>
          </div>
        </div>

        {/* Content Section wrapper */}
        <div className="flex-1 p-6 md:p-10 bg-slate-950/40 relative overflow-hidden">
          
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
              />
            )}
            {activeTab === 'orders' && (
              <OrderList 
                orders={orders} 
                updateOrderStatus={updateOrderStatus} 
              />
            )}
            {activeTab === 'create' && (
              <NewOrderForm 
                onAddOrder={addOrder} 
                setActiveTab={setActiveTab} 
              />
            )}
            {activeTab === 'database' && (
              <SettingsPanel 
                isSupabaseConnected={isSupabaseConfigured} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
