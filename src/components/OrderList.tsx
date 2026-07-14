import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Truck, 
  XCircle, 
  ChevronRight, 
  PackageCheck, 
  Play,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  AlertTriangle,
  ArrowLeftRight,
  User,
  Sparkles,
  CreditCard,
  Calendar,
  Clock,
  Star,
  Check,
  X,
  SlidersHorizontal,
  ArrowLeft
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { CopyableText } from './CopyableText';

interface OrderListProps {
  orders: Order[];
  updateOrderStatus: (id: string, newStatus: OrderStatus) => void;
}

// Spanish Date and Time formatting helpers
const formatSpanishDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (monthIndex >= 1 && monthIndex <= 12) {
      return `${day} ${months[monthIndex - 1]}`;
    }
  }
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = date.getDate();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${day} ${months[date.getMonth()]}`;
    }
  } catch (e) {}
  return dateStr;
};

const formatSpanishTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' becomes '12'
    return `${hours}:${minutes}${ampm}`;
  }
  return timeStr;
};

const formatCustomRangeInput = (start: string, end: string) => {
  const parseInputToSpanish = (inputStr: string) => {
    const parts = inputStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return formatSpanishDate(`${day}/${month}/${year}`);
    }
    return formatSpanishDate(inputStr);
  };
  const s = parseInputToSpanish(start);
  const e = parseInputToSpanish(end);
  if (s === e) return s;
  return `${s} - ${e}`;
};

export default function OrderList({ orders, updateOrderStatus }: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'all' | 'delivery' | 'tienda'>('all');
  const [partialPayFilter, setPartialPayFilter] = useState<boolean>(false);
  const [sorpresaFilter, setSorpresaFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('delivery_earliest');
  const [showFilterSection, setShowFilterSection] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'this_week' | 'this_month' | 'june' | 'july' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | null>(null);
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  // Cancellation hold states
  const cancelTimerRef = useRef<any>(null);
  const cancelIntervalRef = useRef<any>(null);
  const [cancelHoldProgress, setCancelHoldProgress] = useState(0);
  const [showCancelNotice, setShowCancelNotice] = useState(false);
  const isHoldingRef = useRef(false);

  const formatPhoneVisual = (phoneStr?: string) => {
    if (!phoneStr) return 'Sin número';
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    }
    if (cleaned.length > 3 && cleaned.length <= 7) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3)}`;
    } else if (cleaned.length > 7) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    }
    return phoneStr;
  };

  const cleanPhoneToNumbers = (phoneStr?: string) => {
    if (!phoneStr) return '';
    return phoneStr.replace(/\D/g, '');
  };

  const formatFullDateTime = (dateStr?: string) => {
    if (!dateStr) return 'No especificada';
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const startCancelHold = (e: React.MouseEvent | React.TouchEvent, order: Order) => {
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    isHoldingRef.current = true;
    setCancelHoldProgress(0);
    setShowCancelNotice(false);

    let currentProgress = 0;
    
    if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);

    cancelIntervalRef.current = setInterval(() => {
      currentProgress += (100 / 30); // 30 steps of 100ms = 3000ms
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(cancelIntervalRef.current!);
      }
      setCancelHoldProgress(Math.min(currentProgress, 100));
    }, 100);

    cancelTimerRef.current = setTimeout(() => {
      if (isHoldingRef.current) {
        handleCancel(order);
        setCancelHoldProgress(0);
        isHoldingRef.current = false;
        if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);
      }
    }, 3000);
  };

  const endCancelHold = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;

    if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);
    cancelTimerRef.current = null;
    cancelIntervalRef.current = null;

    if (cancelHoldProgress < 100) {
      setShowCancelNotice(true);
      setTimeout(() => setShowCancelNotice(false), 2500);
    }
    setCancelHoldProgress(0);
  };

  // Pagination & Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(15);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset pagination when filter criteria changes
  useEffect(() => {
    setVisibleCount(15);
  }, [searchTerm, selectedStatuses, deliveryTypeFilter, partialPayFilter, sorpresaFilter, sortBy, dateRangeFilter, customDateRange]);

  // Color mappings
  const STATUS_BADGES = {
    pending: { bg: 'bg-amber-400/10 border-amber-500/20 text-amber-400', hoverBg: 'hover:bg-amber-500/20', label: 'Pendiente' },
    preparing: { bg: 'bg-blue-400/10 border-blue-500/20 text-blue-400', hoverBg: 'hover:bg-blue-500/20', label: 'Preparando' },
    shipped: { bg: 'bg-purple-400/10 border-purple-500/20 text-purple-400', hoverBg: 'hover:bg-purple-500/20', label: 'Enviado' },
    delivered: { bg: 'bg-emerald-400/10 border-emerald-500/20 text-emerald-400', hoverBg: 'hover:bg-emerald-500/20', label: 'Entregado' },
    cancelled: { bg: 'bg-rose-400/10 border-rose-500/20 text-rose-400', hoverBg: 'hover:bg-rose-500/20', label: 'Cancelado' },
  };

  // Compute status counts across all orders
  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach(order => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Filter and Sort logic
  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      // Search match
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_phone && order.customer_phone.includes(searchTerm)) ||
        (order.pedido && order.pedido.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Multiple Statuses match
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(order.status);
      
      // Delivery type match
      const matchesTienda = 
        deliveryTypeFilter === 'all' || 
        (deliveryTypeFilter === 'tienda' && order.entregaTienda) ||
        (deliveryTypeFilter === 'delivery' && !order.entregaTienda);
        
      // Payment & Surprise match
      const matchesPartialPay = !partialPayFilter || order.partialPay;
      const matchesSorpresa = !sorpresaFilter || order.entregaSorpresa;

      // Date range filter
      let matchesDateRange = true;
      if (dateRangeFilter !== 'all') {
        const getOrderDeliveryDate = () => {
          if (order.entregaDatetime) {
            return new Date(order.entregaDatetime);
          }
          if (order.fechaEntrega) {
            try {
              const parts = order.fechaEntrega.split('/');
              if (parts.length === 3) {
                const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                const timeStr = order.horaEntrega || '00:00';
                return new Date(`${formatted}T${timeStr}`);
              }
            } catch (err) {}
          }
          return new Date(order.created_at);
        };
        const orderDate = getOrderDeliveryDate();
        
        if (dateRangeFilter === 'this_week') {
          // Current week is July 13th to July 19th, 2026.
          const startOfWeek = new Date('2026-07-13T00:00:00');
          const endOfWeek = new Date('2026-07-20T00:00:00');
          matchesDateRange = orderDate >= startOfWeek && orderDate < endOfWeek;
        } else if (dateRangeFilter === 'this_month') {
          // July 2026 (July is index 6)
          matchesDateRange = orderDate.getMonth() === 6 && orderDate.getFullYear() === 2026;
        } else if (dateRangeFilter === 'june') {
          // June 2026 (June is index 5)
          matchesDateRange = orderDate.getMonth() === 5 && orderDate.getFullYear() === 2026;
        } else if (dateRangeFilter === 'july') {
          // July 2026 (July is index 6)
          matchesDateRange = orderDate.getMonth() === 6 && orderDate.getFullYear() === 2026;
        } else if (dateRangeFilter === 'custom' && customDateRange) {
          const startDate = new Date(`${customDateRange.start}T00:00:00`);
          const endDate = new Date(`${customDateRange.end}T23:59:59`);
          matchesDateRange = orderDate >= startDate && orderDate <= endDate;
        }
      }

      return matchesSearch && matchesStatus && matchesTienda && matchesPartialPay && matchesSorpresa && matchesDateRange;
    });

    // Apply sorting (prioritize earliest/latest delivery times, but push finished orders to the bottom)
    result.sort((a, b) => {
      const isFinishedA = a.status === 'delivered' || a.status === 'cancelled';
      const isFinishedB = b.status === 'delivered' || b.status === 'cancelled';
      
      // If one is finished and the other is active, active one comes first (smaller index)
      if (isFinishedA !== isFinishedB) {
        return isFinishedA ? 1 : -1;
      }

      const parseDeliveryDate = (order: Order) => {
        if (order.entregaDatetime) {
          return new Date(order.entregaDatetime).getTime();
        }
        if (order.fechaEntrega) {
          try {
            const parts = order.fechaEntrega.split('/');
            if (parts.length === 3) {
              const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
              const timeStr = order.horaEntrega || '00:00';
              return new Date(`${formatted}T${timeStr}`).getTime();
            }
          } catch (err) {}
        }
        return new Date(order.created_at).getTime();
      };

      const dateA = parseDeliveryDate(a);
      const dateB = parseDeliveryDate(b);

      if (sortBy === 'delivery_earliest') {
        if (!isFinishedA) {
          return dateA - dateB; // Active ascending
        } else {
          return dateB - dateA; // Finished descending
        }
      }

      if (sortBy === 'delivery_latest') {
        return dateB - dateA;
      }
      
      if (sortBy === 'created_newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'created_oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'price_highest') {
        return b.total_price - a.total_price;
      }
      if (sortBy === 'price_lowest') {
        return a.total_price - b.total_price;
      }
      return 0;
    });

    return result;
  }, [orders, searchTerm, selectedStatuses, deliveryTypeFilter, partialPayFilter, sorpresaFilter, sortBy, dateRangeFilter, customDateRange]);

  // Handle intersection for infinite scrolling
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && filteredOrders.length > visibleCount && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + 15);
          setLoadingMore(false);
        }, 600);
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [filteredOrders.length, visibleCount, loadingMore]);

  const handleNextStatus = (order: Order) => {
    let nextStatus: OrderStatus | null = null;
    if (order.status === 'pending') nextStatus = 'preparing';
    else if (order.status === 'preparing') nextStatus = 'shipped';
    else if (order.status === 'shipped') nextStatus = 'delivered';
    
    if (nextStatus) {
      updateOrderStatus(order.id, nextStatus);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus, updated_at: new Date().toISOString() });
      }
    }
  };

  const handleCancel = (order: Order) => {
    updateOrderStatus(order.id, 'cancelled');
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder({ ...selectedOrder, status: 'cancelled', updated_at: new Date().toISOString() });
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
    }
  };
  // Master renderer for Order Detail Content (enhanced design for desktop side panel & tablet/mobile popups)
  const renderOrderDetailContent = (order: Order) => {
    const statusInfo = STATUS_BADGES[order.status];
    const fallbackImage = "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=600";

    return (
      <div className="flex flex-col text-slate-100 pb-10">
        {/* Top Header Image & Vignette */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-slate-900 shrink-0">
          <img 
            src={order.imageRef || fallbackImage} 
            alt="Referencia de Pedido" 
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5">
            <div className="flex flex-wrap gap-1.5 items-center">
              <CopyableText text={order.id}>
                <span className="bg-indigo-500/20 text-indigo-300 backdrop-blur-md border border-indigo-500/30 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest block">
                  Orden #{order.id.split('-')[1] || order.id.substring(0, 4)}
                </span>
              </CopyableText>
              
              {order.priority === 'critical' && (
                <span className="bg-rose-500/20 text-rose-300 backdrop-blur-md border border-rose-500/30 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest">
                  CRÍTICO
                </span>
              )}
            </div>
            <CopyableText text={order.pedido || (order.items && order.items[0]?.name) || 'Arreglo Floral'}>
              <h3 className="font-sans font-black text-lg sm:text-2xl text-white mt-1.5 drop-shadow-md leading-tight">
                {order.pedido || (order.items && order.items[0]?.name) || 'Arreglo Floral'}
              </h3>
            </CopyableText>
          </div>
        </div>

        {/* Action Bar / Status Dropdown */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-slate-950 border-b border-slate-900/60 flex items-center justify-between gap-3">
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${statusInfo.bg}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{statusInfo.label}</span>
              <span className="text-[8px] opacity-75">▼</span>
            </button>
            {statusMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-30 py-1.5 overflow-hidden">
                {(Object.keys(STATUS_BADGES) as OrderStatus[]).map((st) => {
                  const badge = STATUS_BADGES[st];
                  return (
                    <button
                      key={st}
                      onClick={() => {
                        handleStatusChange(order.id, st);
                        setStatusMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-slate-850 flex items-center gap-2.5 ${
                        order.status === st ? 'text-white font-bold bg-slate-850/80' : 'text-slate-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full border ${badge.bg.split(' ')[0]}`} />
                      <span>{badge.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Details Body */}
        <div className="px-4 py-4 sm:px-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* 1. Información del Cliente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-sans font-bold text-indigo-400 uppercase tracking-wider pb-1.5 border-b border-slate-900">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Información del Cliente</span>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-slate-500 text-xs shrink-0">Nombre Cliente:</span>
                <CopyableText text={order.customer_name} className="min-w-0">
                  <span className="font-bold text-slate-100 text-right block truncate">{order.customer_name}</span>
                </CopyableText>
              </div>
              
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-500 text-xs shrink-0">Teléfono:</span>
                <div className="flex items-center gap-2">
                  {(order.customer_phone || order.nroCliente) && (
                    <a
                      href={`tel:${cleanPhoneToNumbers(order.customer_phone || order.nroCliente)}`}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0"
                      title="Llamar"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <CopyableText text={cleanPhoneToNumbers(order.customer_phone || order.nroCliente)}>
                    <span className="font-bold text-slate-200">
                      {formatPhoneVisual(order.customer_phone || order.nroCliente)}
                    </span>
                  </CopyableText>
                </div>
              </div>

              {order.generoCliente && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Género:</span>
                  {order.generoCliente.toUpperCase().startsWith('H') ? (
                    <span className="w-5 h-5 rounded-full bg-blue-950/40 text-blue-400 border border-blue-500/20 flex items-center justify-center font-extrabold text-[10px] sm:text-xs">
                      H
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-pink-950/40 text-pink-400 border border-pink-500/20 flex items-center justify-center font-extrabold text-[10px] sm:text-xs">
                      M
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Detalles del Pedido */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-sans font-bold text-pink-400 uppercase tracking-wider pb-1.5 border-b border-slate-900">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Detalles del Pedido</span>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-slate-500 text-xs shrink-0">Pedido:</span>
                <CopyableText text={order.pedido || (order.items && order.items[0]?.name) || 'Arreglo Floral'} className="min-w-0">
                  <span className="font-bold text-slate-100 text-right block truncate">
                    {order.pedido || (order.items && order.items[0]?.name) || 'Arreglo Floral'}
                  </span>
                </CopyableText>
              </div>

              <div className="flex justify-between items-baseline gap-4">
                <span className="text-slate-500 text-xs shrink-0">Fecha Entrega:</span>
                <span className="font-bold text-amber-400 text-right">
                  {formatSpanishDate(order.fechaEntrega) || 'No especificada'}
                </span>
              </div>

              <div className="flex justify-between items-baseline gap-4">
                <span className="text-slate-500 text-xs shrink-0">Hora Entrega:</span>
                <span className="font-bold text-amber-400 text-right">
                  {formatSpanishTime(order.horaEntrega) || 'No especificada'}
                </span>
              </div>

              {/* Delivery type row */}
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-500 text-xs shrink-0">Tipo de Entrega:</span>
                {order.entregaTienda ? (
                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    🏬 Retiro en Tienda
                  </span>
                ) : (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    🚚 Envío a Domicilio
                  </span>
                )}
              </div>

              {/* Surprise delivery row */}
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-500 text-xs shrink-0">¿Es Sorpresa?:</span>
                {order.entregaSorpresa ? (
                  <span className="bg-rose-500/15 text-rose-400 border border-rose-500/35 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 animate-pulse">
                    🎁 ¡Es Sorpresa!
                  </span>
                ) : (
                  <span className="bg-slate-900 text-slate-500 border border-slate-800/80 px-2.5 py-1 rounded-xl text-[10px] font-medium flex items-center gap-1">
                    No Sorpresa
                  </span>
                )}
              </div>

              {order.numeroRosas !== undefined && (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Número de Rosas:</span>
                  <span className="font-bold text-rose-300">{order.numeroRosas}</span>
                </div>
              )}

              {order.colorRosas && (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Color de Rosas:</span>
                  <CopyableText text={order.colorRosas}>
                    <span className="font-bold text-slate-200">{order.colorRosas}</span>
                  </CopyableText>
                </div>
              )}

              {order.personalizacion && (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Personalización:</span>
                  <CopyableText text={order.personalizacion} className="min-w-0">
                    <span className="font-medium text-slate-300 text-right block truncate">{order.personalizacion}</span>
                  </CopyableText>
                </div>
              )}

              {order.nombreReceptor && (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Receptor:</span>
                  <CopyableText text={order.nombreReceptor} className="min-w-0">
                    <span className="font-bold text-slate-200 text-right block truncate">{order.nombreReceptor}</span>
                  </CopyableText>
                </div>
              )}

              {order.tlfReceptor && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Teléfono Receptor:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${cleanPhoneToNumbers(order.tlfReceptor)}`}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0"
                      title="Llamar"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <CopyableText text={cleanPhoneToNumbers(order.tlfReceptor)}>
                      <span className="text-slate-200 font-bold">{formatPhoneVisual(order.tlfReceptor)}</span>
                    </CopyableText>
                  </div>
                </div>
              )}

              {order.dedicatoria && (
                <div className="pt-1.5">
                  <span className="text-slate-500 text-xs block mb-1">Dedicatoria:</span>
                  <CopyableText text={order.dedicatoria}>
                    <div className="p-3 sm:p-4 rounded-xl border border-indigo-500/10 bg-indigo-950/5 relative overflow-hidden">
                      <p className="text-xs italic text-indigo-100/90 leading-relaxed font-sans">
                        "{order.dedicatoria}"
                      </p>
                    </div>
                  </CopyableText>
                </div>
              )}
            </div>
          </div>

          {/* 3. Logística y Pago */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-sans font-bold text-purple-400 uppercase tracking-wider pb-1.5 border-b border-slate-900">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Logística y Pago</span>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-500 text-xs shrink-0">Dirección:</span>
                <a 
                  href={order.direccionEntrega?.startsWith('http') ? order.direccionEntrega : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.direccionEntrega || order.delivery_address || '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold flex items-center gap-1 hover:bg-indigo-600/30 transition-all cursor-pointer shrink-0"
                >
                  <MapPin className="h-3 w-3" />
                  <span>Abrir en Maps</span>
                </a>
              </div>

              {order.notaEntrega || order.notes ? (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Nota de Entrega:</span>
                  <CopyableText text={order.notaEntrega || order.notes || ''} className="min-w-0">
                    <span className="font-bold text-slate-300 text-right block truncate">
                      {order.notaEntrega || order.notes}
                    </span>
                  </CopyableText>
                </div>
              ) : null}

              {order.precioFacturado !== undefined && (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Precio Facturado:</span>
                  <span className="text-slate-300 font-bold">
                    {order.tasaDeCambioT === 'EUR' ? '€' : '$'} {order.precioFacturado || order.total_price}
                  </span>
                </div>
              )}

              {order.deliveryFacturado !== undefined && (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Delivery cobrado:</span>
                  <span className="text-slate-300 font-bold">
                    {order.tasaDeCambioT === 'EUR' ? '€' : '$'} {order.deliveryFacturado}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline gap-4">
                <span className="text-slate-500 text-xs shrink-0">Método de Pago:</span>
                <span className="font-bold text-slate-300 text-right">{order.metodoPago || 'No especificado'}</span>
              </div>

              {order.partialPay && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Estado de Pago:</span>
                  <span className="bg-teal-500/15 border border-teal-500/20 text-teal-400 text-[10px] font-extrabold px-2 py-0.5 rounded-lg animate-pulse">
                    PAGO PARCIAL / SEÑADO
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start gap-4 border-t border-slate-900/65 pt-2 mt-2">
                <span className="text-slate-500 text-xs shrink-0">Ingreso total:</span>
                <div className="flex flex-col items-end">
                  <CopyableText text={`${order.tasaDeCambioT === 'EUR' ? '€' : '$'} ${order.total_price}`}>
                    <span className="font-black text-slate-100 text-sm sm:text-base">
                      {order.tasaDeCambioT === 'EUR' ? '€' : '$'} {order.total_price}
                    </span>
                  </CopyableText>
                  {order.tasaDeCambioV && (
                    <CopyableText text={`Bs. ${(order.total_price * order.tasaDeCambioV).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}>
                      <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-bold">
                        Bs. {(order.total_price * order.tasaDeCambioV).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </CopyableText>
                  )}
                </div>
              </div>

              {order.tasaDeCambioV && (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-slate-500 text-xs shrink-0">Tasa de Cambio:</span>
                  <span className="text-slate-300 text-right font-bold">
                    Bs. {order.tasaDeCambioV} | {order.tasaDeCambioT || 'EUR'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Log */}
        <div className="px-4 py-3 sm:px-5 border-t border-slate-900 bg-slate-950/40 flex items-center justify-between text-[9px] sm:text-[10px] font-sans text-slate-500 shrink-0">
          <span>Recibido: {formatFullDateTime(order.created_at)}</span>
          <span>Modificado: {formatFullDateTime(order.updated_at)}</span>
        </div>

        {/* State mutation buttons */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-slate-900 bg-slate-950 flex flex-col gap-2 shrink-0">
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex gap-2.5 items-center relative w-full">
              {/* Primary Next-Status Action Button */}
              <button
                onClick={() => handleNextStatus(order)}
                className={`flex-1 h-11 sm:h-12 px-4 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  order.status === 'pending'
                    ? 'bg-slate-950 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                    : order.status === 'preparing'
                    ? 'bg-slate-950 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                    : 'bg-slate-950 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white hover:border-purple-500'
                }`}
              >
                {order.status === 'pending' && (
                  <>
                    <Play className="h-4 w-4 fill-current text-amber-400 hover:text-inherit" />
                    <span>Comenzar Preparación</span>
                  </>
                )}
                {order.status === 'preparing' && (
                  <>
                    <Truck className="h-4 w-4 text-blue-400 hover:text-inherit" />
                    <span>Despachar Orden</span>
                  </>
                )}
                {order.status === 'shipped' && (
                  <>
                    <PackageCheck className="h-4 w-4 text-purple-400 hover:text-inherit" />
                    <span>Confirmar Entrega</span>
                  </>
                )}
              </button>

              {/* Solid Background Cancel Button without label */}
              <div className="relative shrink-0">
                <button
                  onMouseDown={(e) => startCancelHold(e, order)}
                  onMouseUp={endCancelHold}
                  onMouseLeave={endCancelHold}
                  onTouchStart={(e) => startCancelHold(e, order)}
                  onTouchEnd={endCancelHold}
                  onTouchCancel={endCancelHold}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md shadow-rose-600/10"
                  title="Mantén presionado para cancelar"
                >
                  <XCircle className="h-5 w-5" />
                </button>

                {showCancelNotice && (
                  <div className="absolute bottom-14 right-0 bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-bounce z-50 border border-rose-500">
                    ⚠️ Mantén presionado para cancelar la orden
                  </div>
                )}
                {cancelHoldProgress > 0 && (
                  <div className="absolute bottom-14 right-0 bg-slate-900 border border-rose-500 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-50 flex flex-col items-center gap-1">
                    <span>Cancelando... {Math.round(cancelHoldProgress)}%</span>
                    <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-rose-500 transition-all duration-100" style={{ width: `${cancelHoldProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(order.status === 'delivered' || order.status === 'cancelled') && (
            <div className="w-full text-center py-2 px-3 rounded-xl border border-slate-900 bg-slate-900/10 text-[10px] sm:text-xs text-slate-500 font-sans">
              Esta orden se encuentra en estado histórico ({order.status === 'delivered' ? 'ENTREGADA' : 'CANCELADA'}) y no admite nuevas mutaciones.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* 1. Mobile/Tablet Separate Order Details Page */}
      {selectedOrder && (
        <div className="block xl:hidden space-y-6 animate-fade-in">
          {/* Back Navigation Bar */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-900">
            <button
              onClick={() => setSelectedOrder(null)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Volver a Órdenes"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-6 w-px bg-slate-900" />
            <div className="min-w-0">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Pedido Seleccionado</span>
              <h3 className="font-sans font-black text-xs sm:text-sm text-white leading-tight truncate">
                ID: {selectedOrder.id} — {selectedOrder.customer_name}
              </h3>
            </div>
          </div>

          {/* Details Content (renders the existing detailed layout inline) */}
          <div className="rounded-2xl bg-slate-950 border border-slate-900 p-0 overflow-hidden shadow-2xl">
            {renderOrderDetailContent(selectedOrder)}
          </div>
        </div>
      )}

      {/* 2. Main Order List View (Hidden on mobile/tablet when an order is selected, but always visible on desktop) */}
      <div className={selectedOrder ? "hidden xl:block space-y-6" : "space-y-6"}>
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-white tracking-tight">Gestión de Ordenes</h2>
        </div>
        
        {/* Quick statistics count */}
        <div className="flex gap-2.5 text-[11px] font-mono text-slate-400">
          <div className="px-3 py-1.5 rounded-xl border border-slate-950 bg-slate-900/40">
            Filtradas: <span className="font-bold text-cyan-400">{filteredOrders.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl border border-slate-950 bg-slate-900/40">
            En Curso: <span className="font-bold text-amber-400">
              {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}
            </span>
          </div>
        </div>
      </div>

      {/* Grouping Status Filters and Search Bar with 8px vertical spacing */}
      <div className="flex flex-col gap-2 py-2">
        {/* 4. HORIZONTAL STATUS FILTER LIST (With permanent status-colored text and icons, and 8px mobile borders) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {(Object.keys(STATUS_BADGES) as OrderStatus[]).map((status) => {
            const badge = STATUS_BADGES[status];
            const isSelected = selectedStatuses.includes(status);
            const count = statusCounts[status];

            // Hide status if count is zero
            if (count === 0) return null;

            // Permanent status-specific coloring for text and icons
            let activeStyles = '';
            if (status === 'pending') {
              activeStyles = isSelected
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                : 'bg-amber-500/5 border-amber-500/15 text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30';
            } else if (status === 'preparing') {
              activeStyles = isSelected
                ? 'bg-blue-500/20 border-blue-500 text-blue-400 font-bold'
                : 'bg-blue-500/5 border-blue-500/15 text-blue-400/80 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30';
            } else if (status === 'shipped') {
              activeStyles = isSelected
                ? 'bg-purple-500/20 border-purple-500 text-purple-400 font-bold'
                : 'bg-purple-500/5 border-purple-500/15 text-purple-400/80 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30';
            } else if (status === 'delivered') {
              activeStyles = isSelected
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30';
            } else if (status === 'cancelled') {
              activeStyles = isSelected
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold'
                : 'bg-rose-500/5 border-rose-500/15 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30';
            }

            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                  } else {
                    setSelectedStatuses([...selectedStatuses, status]);
                  }
                }}
                className={`px-3 py-2 rounded-lg sm:rounded-xl border text-xs font-mono transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeStyles}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-current ${isSelected ? 'animate-pulse' : 'opacity-40'}`} />
                <span>{badge.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md sm:rounded-lg text-[10px] font-bold ${
                  isSelected ? 'bg-slate-950/80 text-white' : 'bg-slate-950/40 text-current/80'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
          {selectedStatuses.length > 0 && (
            <button
              onClick={() => setSelectedStatuses([])}
              className="p-2 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-950 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Eliminar filtro"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Standalone Search Bar and icon-only Filter button with perfectly matching heights */}
        <div className="flex flex-row gap-3">
          <div className="relative flex-1 h-11">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              id="order-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, cliente, producto..."
              className="w-full h-full pl-10 pr-4 rounded-lg sm:rounded-xl border border-slate-950 bg-slate-900 text-slate-100 placeholder-slate-600 text-xs focus:border-slate-800 focus:outline-none transition-all font-mono"
            />
          </div>
          
          <button
            onClick={() => setShowFilterSection(!showFilterSection)}
            className={`w-11 h-11 shrink-0 rounded-lg sm:rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
              showFilterSection 
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40' 
                : 'bg-slate-900 border-slate-950 hover:border-slate-900 text-slate-300 hover:text-white'
            }`}
            title="Filtros"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* 5. Clean Filter section below (with mobile 8px borders) */}
      {showFilterSection && (
        <div className="p-5 rounded-lg sm:rounded-2xl bg-slate-900/60 border border-slate-950 grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in shadow-xl">
          {/* Month/Week filter buttons */}
          <div className="md:col-span-12 space-y-2 pb-2 border-b border-slate-950/40">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Filtrar Pedidos por Fecha:</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'this_week', label: 'Esta Semana' },
                { id: 'this_month', label: 'Este Mes' },
                { id: 'june', label: 'Junio' },
                { id: 'july', label: 'Julio' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setDateRangeFilter(opt.id as any);
                    setCustomDateRange(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                    dateRangeFilter === opt.id
                      ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              {/* Calendario con Popover de Rango de Fechas */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowCalendarPopover(!showCalendarPopover)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                    dateRangeFilter === 'custom'
                      ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Seleccionar rango de fechas"
                >
                  {dateRangeFilter === 'custom' && customDateRange ? (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{formatCustomRangeInput(customDateRange.start, customDateRange.end)}</span>
                    </span>
                  ) : (
                    <>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Rango Personalizado</span>
                    </>
                  )}
                </button>

                {showCalendarPopover && (
                  <div className="absolute left-0 mt-2 p-4 rounded-xl bg-slate-950 border border-slate-900 shadow-2xl z-50 w-72 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-xs font-bold text-slate-300">Filtrar por Rango</span>
                      <button 
                        type="button"
                        onClick={() => setShowCalendarPopover(false)}
                        className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Desde:</label>
                        <input 
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Hasta:</label>
                        <input 
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTempStartDate('');
                          setTempEndDate('');
                          setCustomDateRange(null);
                          setDateRangeFilter('all');
                          setShowCalendarPopover(false);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-850 transition-all cursor-pointer"
                      >
                        Limpiar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (tempStartDate && tempEndDate) {
                            setCustomDateRange({ start: tempStartDate, end: tempEndDate });
                            setDateRangeFilter('custom');
                            setShowCalendarPopover(false);
                          }
                        }}
                        disabled={!tempStartDate || !tempEndDate}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sorting */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Ordenar Por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg sm:rounded-xl border border-slate-950 bg-slate-950 text-slate-200 text-xs focus:border-slate-800 focus:outline-none transition-colors font-mono"
            >
              <option value="delivery_earliest">Fecha de entrega: más pronta a más lejana</option>
              <option value="delivery_latest">Fecha de entrega: más lejana a más pronta</option>
              <option value="created_newest">Fecha de creación: más reciente</option>
              <option value="created_oldest">Fecha de creación: más antigua</option>
              <option value="price_highest">Monto total: mayor a menor</option>
              <option value="price_lowest">Monto total: menor a mayor</option>
            </select>
          </div>

          {/* Delivery type filter */}
          <div className="md:col-span-4 space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tipo de Entrega:</label>
            <select
              value={deliveryTypeFilter}
              onChange={(e) => setDeliveryTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg sm:rounded-xl border border-slate-950 bg-slate-950 text-slate-200 text-xs focus:border-slate-800 focus:outline-none transition-colors font-mono"
            >
              <option value="all">Todos los tipos</option>
              <option value="delivery">Domicilio (Delivery)</option>
              <option value="tienda">Retiro en Tienda</option>
            </select>
          </div>

          {/* Custom Stylized Checkboxes for toggles */}
          <div className="md:col-span-3 flex flex-col justify-end gap-3.5 pb-1">
            <label className="flex items-center gap-3 text-xs font-mono text-slate-300 cursor-pointer group select-none">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={partialPayFilter}
                  onChange={(e) => setPartialPayFilter(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                  partialPayFilter 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/25' 
                    : 'bg-slate-950 border-slate-800/80 group-hover:border-slate-700'
                }`}>
                  {partialPayFilter && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
              <span className="group-hover:text-slate-100 transition-colors">Pago Parcial</span>
            </label>

            <label className="flex items-center gap-3 text-xs font-mono text-slate-300 cursor-pointer group select-none">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={sorpresaFilter}
                  onChange={(e) => setSorpresaFilter(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                  sorpresaFilter 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/25' 
                    : 'bg-slate-950 border-slate-800/80 group-hover:border-slate-700'
                }`}>
                  {sorpresaFilter && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
              <span className="group-hover:text-slate-100 transition-colors">Entrega Sorpresa</span>
            </label>
          </div>
        </div>
      )}

      {/* Main operational grid layout (List + Detail Pane) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Order List (same row structure for mobile and tablet/desktop) */}
        <div className={`lg:col-span-12 ${selectedOrder ? 'xl:col-span-7' : 'xl:col-span-12'} transition-all duration-300 space-y-4`}>
          {filteredOrders.length === 0 ? (
            <div className="p-16 rounded-2xl border border-slate-950 bg-slate-900/15 text-center">
              <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center mx-auto text-slate-500 mb-3">
                <Search className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-200">No se encontraron órdenes</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Intenta limpiando los filtros o modificando tu búsqueda para encontrar lo que necesitas.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredOrders.slice(0, visibleCount).map((order) => {
                const statusInfo = STATUS_BADGES[order.status];
                const isSelected = selectedOrder?.id === order.id;
                const previewImage = order.imageRef || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=200";

                return (
                  <div
                    key={order.id}
                    id={`order-card-${order.id}`}
                    onClick={() => setSelectedOrder(isSelected ? null : order)}
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-2xl border transition-all cursor-pointer flex gap-3 sm:gap-4 items-center justify-between ${
                      isSelected 
                        ? 'bg-slate-900/70 border-indigo-500/55 shadow-lg shadow-indigo-500/5' 
                        : 'bg-slate-900/25 border-slate-950 hover:bg-slate-900/40 hover:border-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Square rounded bouquet thumbnail image on left (mobile responsive) */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border border-slate-950 shrink-0 relative bg-slate-950">
                        <img 
                          src={previewImage} 
                          alt="Vista previa" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Middle Column Block */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {/* Top Status badge (stylized box with background color) */}
                        <div className="mb-1.5 flex">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider ${statusInfo.bg}`}>
                            <span className="w-1 h-1 rounded-full bg-current" />
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Customer Name is now the main primary heading, product description is the subtitle */}
                        <h3 className="font-sans font-black text-xs sm:text-sm text-white truncate leading-tight">
                          {order.customer_name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5 font-medium leading-normal">
                          {order.pedido || (order.items && order.items[0]?.name) || 'Arreglo Floral'}
                        </p>

                        {/* Bottom line: Spanish Date and Time formatted (reduced spacing, gap-2 is 8px, gap-1 is 4px) */}
                        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-400 font-mono mt-1.5 whitespace-nowrap overflow-hidden">
                          <div className="flex items-center gap-1 shrink-0">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400" />
                            <span className="font-semibold text-slate-200">{formatSpanishDate(order.fechaEntrega)}</span>
                          </div>
                          {order.horaEntrega && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400" />
                              <span className="font-semibold text-slate-200">{formatSpanishTime(order.horaEntrega)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side block containing Price & Action button within the same padding layout */}
                    <div className="flex flex-col items-end justify-between shrink-0 self-stretch min-h-[56px] sm:min-h-[64px]">
                      <p className="font-sans font-black text-slate-300 text-[11px] sm:text-xs leading-none">
                        {order.tasaDeCambioT === 'EUR' ? '€' : '$'}{order.total_price.toLocaleString()}
                      </p>

                      <div onClick={(e) => e.stopPropagation()} className="mt-auto">
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            id={`progress-btn-${order.id}`}
                            onClick={() => handleNextStatus(order)}
                            className={`p-1.5 sm:p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                              order.status === 'pending'
                                ? 'bg-amber-400/10 hover:bg-blue-400/20 border-amber-500/20 hover:border-blue-500/40 text-amber-400 hover:text-blue-400 shadow-amber-500/5 hover:shadow-blue-500/5'
                                : order.status === 'preparing'
                                ? 'bg-blue-400/10 hover:bg-purple-400/20 border-blue-500/20 hover:border-purple-500/40 text-blue-400 hover:text-purple-400 shadow-blue-500/5 hover:shadow-purple-500/5'
                                : 'bg-purple-400/10 hover:bg-emerald-400/20 border-purple-500/20 hover:border-emerald-500/40 text-purple-400 hover:text-emerald-400 shadow-purple-500/5 hover:shadow-emerald-500/5'
                            }`}
                            title={
                              order.status === 'pending' ? 'Listo (Comenzar preparación)' :
                              order.status === 'preparing' ? 'Enviar (Despachar)' : 'Entregar (Confirmar entrega)'
                            }
                          >
                            {order.status === 'pending' && <Play className="h-3.5 w-3.5 fill-current text-amber-400 transition-colors" />}
                            {order.status === 'preparing' && <Truck className="h-3.5 w-3.5 text-blue-400 transition-colors" />}
                            {order.status === 'shipped' && <PackageCheck className="h-3.5 w-3.5 text-purple-400 transition-colors" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Infinite Scroll Sentinel & Loader */}
              {filteredOrders.length > visibleCount && (
                <div 
                  ref={sentinelRef} 
                  className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500"
                >
                  <div className="h-5 w-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <span className="text-[10px] font-mono tracking-wider uppercase">Cargando más órdenes...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Detailed Panel (Inline view for Desktop) */}
        {selectedOrder && (
          <div className="hidden xl:block xl:col-span-5 rounded-2xl bg-slate-950 border border-slate-900 shadow-2xl relative sticky top-24 overflow-hidden max-h-[calc(100vh-120px)] flex flex-col no-scrollbar">
            {/* Direct close button (floating glassmorphism X) */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700 hover:scale-110 active:scale-90 transition-all cursor-pointer shadow-xl"
              aria-label="Cerrar panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {renderOrderDetailContent(selectedOrder)}
            </div>
          </div>
        )}
      </div>

      </div> {/* Close 2. Main Order List View wrapper */}
    </div>
  );
}
