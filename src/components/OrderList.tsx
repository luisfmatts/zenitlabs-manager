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
  ArrowLeft,
  Copy,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Settings,
  Gift,
  ShoppingBag,
  Heart,
  Info,
  Layers,
  Package,
  Tag,
  DollarSign,
  Smile,
  FileText,
  Camera,
  Image as ImageIcon,
  Award,
  Plus,
  Pencil
} from 'lucide-react';
import { Order, OrderStatus, StaffMember } from '../types';
import { CopyableText } from './CopyableText';
import { loadOrderFields, loadOrderCategories, OrderField } from '../lib/orderFields';
import OrderFieldsConfig from './OrderFieldsConfig';

// Dynamic Icon Mapping for category customizer integration
const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'User': User,
  'Sparkles': Sparkles,
  'CreditCard': CreditCard,
  'SlidersHorizontal': SlidersHorizontal,
  'Gift': Gift,
  'ShoppingBag': ShoppingBag,
  'Truck': Truck,
  'Calendar': Calendar,
  'MapPin': MapPin,
  'Phone': Phone,
  'Heart': Heart,
  'Info': Info,
  'Layers': Layers,
  'Package': Package,
  'Tag': Tag,
  'DollarSign': DollarSign,
  'MessageSquare': MessageSquare,
  'Star': Star,
  'Clock': Clock,
  'Smile': Smile,
  'FileText': FileText,
  'Camera': Camera,
  'Image': ImageIcon,
  'Award': Award
};

const getCategoryColorClass = (catName: string, index: number): string => {
  if (catName === 'Cliente') return 'text-indigo-400';
  if (catName === 'Detalles') return 'text-pink-400';
  if (catName === 'Logística') return 'text-purple-400';
  if (catName === 'Otros') return 'text-violet-400';
  const colors = ['text-cyan-400', 'text-amber-400', 'text-emerald-400', 'text-rose-400', 'text-sky-400', 'text-indigo-400'];
  return colors[index % colors.length];
};

interface OrderListProps {
  orders: Order[];
  updateOrderStatus: (id: string, newStatus: OrderStatus) => void;
  isFloristryEnabled?: boolean;
  staff?: StaffMember[];
  assignStaffToOrder?: (orderId: string, staffId: string) => Promise<void> | void;
  activeModules?: string[];
  onEditOrder?: (order: Order) => void;
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

const getOrderCurrencySymbol = (order: Order) => {
  const t = String(order.tasaDeCambioT || '').toLowerCase();
  if (t.includes('eur') || t.includes('euro')) {
    return '€';
  }
  return '$';
};

const formatDivisaValue = (val: number, order: Order) => {
  const symbol = getOrderCurrencySymbol(order);
  if (symbol === '€') {
    return `€ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    const isInteger = val % 1 === 0;
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: isInteger ? 0 : 1, maximumFractionDigits: 2 })}`;
  }
};

const formatSpanishDateWithWeekday = (dateStr?: string) => {
  if (!dateStr) return '';
  let date: Date | null = null;
  const parts = dateStr.split('/');
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    date = new Date(year, month, day);
  } else {
    const partsHyphen = dateStr.split('-');
    if (partsHyphen.length === 3) {
      const year = parseInt(partsHyphen[0], 10);
      const month = parseInt(partsHyphen[1], 10) - 1;
      const day = parseInt(partsHyphen[2], 10);
      date = new Date(year, month, day);
    } else {
      date = new Date(dateStr);
    }
  }

  if (date && !isNaN(date.getTime())) {
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  }
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
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${minutes} ${ampm}`;
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

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
  'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function OrderList({ 
  orders, 
  updateOrderStatus, 
  isFloristryEnabled = true,
  staff = [],
  assignStaffToOrder,
  activeModules = [],
  onEditOrder
}: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'all' | 'delivery' | 'tienda'>('all');
  const [partialPayFilter, setPartialPayFilter] = useState<boolean>(false);
  const [sorpresaFilter, setSorpresaFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('delivery');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterSection, setShowFilterSection] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | null>(null);
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  // Fields and customizer states
  const [showConfigPage, setShowConfigPage] = useState(false);
  const [configFields, setConfigFields] = useState<OrderField[]>([]);
  const [configCategories, setConfigCategories] = useState<string[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [hiddenCategories, setHiddenCategories] = useState<Record<string, boolean>>({});
  const [looseFieldsPosition, setLooseFieldsPosition] = useState<'top' | 'bottom'>('bottom');

  useEffect(() => {
    const updateFields = () => {
      setConfigFields(loadOrderFields());
      setConfigCategories(loadOrderCategories());
      try {
        const savedHidden = localStorage.getItem('zenit_orders_hidden_categories');
        if (savedHidden) {
          setHiddenCategories(JSON.parse(savedHidden));
        } else {
          setHiddenCategories({});
        }
      } catch (e) {
        console.error(e);
      }
      try {
        const savedPos = localStorage.getItem('zenit_orders_loose_position');
        if (savedPos === 'top' || savedPos === 'bottom') {
          setLooseFieldsPosition(savedPos);
        } else {
          setLooseFieldsPosition('bottom');
        }
      } catch (e) {
        console.error(e);
      }
      try {
        const saved = localStorage.getItem('zenit_orders_category_icons');
        if (saved) {
          setCategoryIcons(JSON.parse(saved));
        } else {
          setCategoryIcons({
            'Cliente': 'User',
            'Detalles': 'Sparkles',
            'Logística': 'CreditCard',
            'Otros': 'SlidersHorizontal'
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    updateFields();
    window.addEventListener('zenit_orders_fields_updated', updateFields);
    window.addEventListener('zenit_orders_categories_updated', updateFields);
    return () => {
      window.removeEventListener('zenit_orders_fields_updated', updateFields);
      window.removeEventListener('zenit_orders_categories_updated', updateFields);
    };
  }, []);

  // Cancellation hold states
  const cancelTimerRef = useRef<any>(null);
  const cancelIntervalRef = useRef<any>(null);
  const [cancelHoldProgress, setCancelHoldProgress] = useState(0);
  const [showCancelNotice, setShowCancelNotice] = useState(false);
  const isHoldingRef = useRef(false);

  useEffect(() => {
    setIsImageExpanded(false);
  }, [selectedOrder?.id]);

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

  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const handleCopyOrderDetails = (order: Order) => {
    const isSorpresa = !!order.entregaSorpresa;
    
    // 1. Persona a entregar: (si se trata de una entrega sorpresa, colocar nombre del receptor, si no, el del cliente)
    const personaEntregar = isSorpresa 
      ? (order.nombreReceptor || order.customer_name || order.nombreCliente || 'No especificado')
      : (order.customer_name || order.nombreCliente || 'No especificado');

    // 2. Teléfono: (el del cliente o receptor según el mismo criterio anterior)
    const telefono = isSorpresa
      ? (order.tlfReceptor || order.customer_phone || order.nroCliente || 'No especificado')
      : (order.customer_phone || order.nroCliente || 'No especificado');

    // 3. Dirección: (link de Maps)
    const address = order.direccionEntrega || order.delivery_address || '';
    const mapsLink = address?.startsWith('http') 
      ? address 
      : address 
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : 'No especificado';

    // 4. Entrega sorpresa: SI/NO
    const entregaSorpresaText = isSorpresa ? 'SI' : 'NO';

    // 5. Dia de entrega:
    const diaEntrega = formatSpanishDate(order.fechaEntrega) || 'No especificado';

    // 6. Hora de entrega:
    const horaEntrega = order.horaEntrega ? formatSpanishTime(order.horaEntrega) : 'No especificado';

    const textToCopy = `- Persona a entregar: ${personaEntregar}
- Teléfono: ${telefono}
- Dirección: ${mapsLink}
- Entrega sorpresa: ${entregaSorpresaText}
- Dia de entrega: ${diaEntrega}
- Hora de entrega: ${horaEntrega}`;

    const performCopy = () => {
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
        .then(performCopy)
        .catch(() => {
          const el = document.createElement('textarea');
          el.value = textToCopy;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          performCopy();
        });
    } else {
      const el = document.createElement('textarea');
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      performCopy();
    }
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
  }, [searchTerm, selectedStatuses, deliveryTypeFilter, partialPayFilter, sorpresaFilter, sortBy, sortOrder, dateRangeFilter, customDateRange]);

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
        } else if (dateRangeFilter.startsWith('month_')) {
          const monthIdx = parseInt(dateRangeFilter.split('_')[1], 10);
          matchesDateRange = orderDate.getMonth() === monthIdx && orderDate.getFullYear() === 2026;
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

      if (sortBy === 'delivery') {
        if (sortOrder === 'asc') {
          if (!isFinishedA) {
            return dateA - dateB; // Active ascending
          } else {
            return dateB - dateA; // Finished descending
          }
        } else {
          return dateB - dateA; // Descending
        }
      }

      if (sortBy === 'created') {
        const valA = new Date(a.created_at).getTime();
        const valB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }

      if (sortBy === 'price') {
        return sortOrder === 'desc' ? b.total_price - a.total_price : a.total_price - b.total_price;
      }

      return 0;
    });

    return result;
  }, [orders, searchTerm, selectedStatuses, deliveryTypeFilter, partialPayFilter, sorpresaFilter, sortBy, sortOrder, dateRangeFilter, customDateRange]);

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

  const getNonEmptyCategoryFields = (category: string, order: Order) => {
    return configFields.filter(f => {
      if (f.key === 'total_price') return false;

      const isInCategory = (category === 'Sin categoría' || category === '') 
        ? (!f.category || f.category === 'Sin categoría') 
        : f.category === category;

      if (!isInCategory || !f.showInDetails || !f.visible) return false;

      const val = order[f.key as keyof Order] ?? (order.custom_fields && (order.custom_fields as any)[f.key]);
      return val !== undefined && val !== null && val !== '';
    });
  };

  const renderCategoryFields = (category: string, order: Order) => {
    const catFields = getNonEmptyCategoryFields(category, order);
    if (catFields.length === 0) return null;

    return (
      <div className="space-y-1 text-xs sm:text-sm">
        {catFields.map(field => {
          const val = order[field.key as keyof Order] ?? (order.custom_fields && (order.custom_fields as any)[field.key]);
          if (val === undefined || val === null || val === '') return null;

          if (field.key === 'customer_phone' || field.key === 'tlfReceptor') {
            return (
              <div key={field.key} className="flex justify-between items-center gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0">{field.label}:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${cleanPhoneToNumbers(String(val))}`}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0"
                    title="Llamar"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                  <CopyableText text={cleanPhoneToNumbers(String(val))}>
                    <span className="font-bold text-slate-200">
                      {formatPhoneVisual(String(val))}
                    </span>
                  </CopyableText>
                </div>
              </div>
            );
          }

          if (field.key === 'dedicatoria') {
            return (
              <div key={field.key} className="py-0.5">
                <span className="text-slate-500 text-xs block mb-1">{field.label}:</span>
                <CopyableText text={String(val)}>
                  <div className="p-2.5 sm:p-3 rounded-xl border border-indigo-500/10 bg-indigo-950/5 relative overflow-hidden">
                    <p className="text-xs italic text-indigo-100/90 leading-relaxed font-sans">
                      "{val}"
                    </p>
                  </div>
                </CopyableText>
              </div>
            );
          }

          if (field.key === 'direccionEntrega' || field.key === 'delivery_address') {
            return (
              <div key={field.key} className="flex justify-between items-center gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0">{field.label}:</span>
                <a 
                   href={String(val).startsWith('http') ? String(val) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(val))}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold flex items-center gap-1 hover:bg-indigo-600/30 transition-all cursor-pointer shrink-0"
                >
                  <MapPin className="h-3 w-3" />
                  <span>Abrir en Maps</span>
                </a>
              </div>
            );
          }

          if (field.key === 'entregaTienda') {
            return (
              <div key={field.key} className="flex justify-between items-center gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0">{field.label}:</span>
                {val === true || val === 'true' ? (
                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    🏬 Retiro en Tienda
                  </span>
                ) : (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    🚚 Envío a Domicilio
                  </span>
                )}
              </div>
            );
          }

          if (field.key === 'entregaSorpresa') {
            return (
              <div key={field.key} className="flex justify-between items-center gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0">{field.label}:</span>
                {val === true || val === 'true' ? (
                  <span className="bg-rose-500/15 text-rose-400 border border-rose-500/35 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 animate-pulse">
                    🎁 ¡Es Sorpresa!
                  </span>
                ) : (
                  <span className="bg-slate-900 text-slate-500 border border-slate-800/80 px-2.5 py-1 rounded-xl text-[10px] font-medium flex items-center gap-1">
                    No Sorpresa
                  </span>
                )}
              </div>
            );
          }

          if (field.key === 'precioFacturado') {
            const rate = Number(order.tasaDeCambioV || 451.88);
            const showBs = String(order.metodoPago || '').toLowerCase().trim().includes('móvil') || String(order.metodoPago || '').toLowerCase().trim().includes('movil');
            const formattedUsd = formatDivisaValue(Number(val), order);
            const formattedBs = `Bs. ${(Number(val) * rate).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
            return (
              <div key={field.key} className="flex justify-between items-start gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0 mt-0.5">Precio Facturado:</span>
                <div className="text-right flex flex-col items-end gap-1">
                  <CopyableText text={formattedUsd}>
                    <span className="font-bold text-slate-200 block text-xs sm:text-sm">
                      {formattedUsd}
                    </span>
                  </CopyableText>
                  {showBs && (
                    <CopyableText text={formattedBs}>
                      <span className="font-bold text-slate-200 block text-xs sm:text-sm">
                        {formattedBs}
                      </span>
                    </CopyableText>
                  )}
                </div>
              </div>
            );
          }

          if (field.key === 'deliveryFacturado') {
            const formattedUsd = formatDivisaValue(Number(val), order);
            return (
              <div key={field.key} className="flex justify-between items-baseline gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0">Delivery cobrado:</span>
                <CopyableText text={formattedUsd}>
                  <span className="font-bold text-slate-200 text-right block truncate text-xs sm:text-sm">
                    {formattedUsd}
                  </span>
                </CopyableText>
              </div>
            );
          }

          if (field.key === 'partialPay') {
            if (val !== true && val !== 'true') return null;

            const basePrice = Number(order.precioFacturado || order.total_price || 0);
            const deliveryFee = Number(order.deliveryFacturado || 0);
            const rate = Number(order.tasaDeCambioV || 451.88);

            const ingresoTotalTienda = basePrice + deliveryFee;
            const pagoPendienteCliente = ingresoTotalTienda / 2;
            const showBs = String(order.metodoPago || '').toLowerCase().trim().includes('móvil') || String(order.metodoPago || '').toLowerCase().trim().includes('movil');
            const formattedUsd = formatDivisaValue(pagoPendienteCliente, order);
            const formattedBs = `Bs. ${(pagoPendienteCliente * rate).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;

            return (
              <React.Fragment key={field.key}>
                {/* Row 1: Pago sólo 50% */}
                <div className="flex justify-between items-center gap-4 py-0.5">
                  <span className="text-slate-500 text-xs shrink-0">Pago sólo 50%:</span>
                  <span className="bg-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <Check className="h-3 w-3" /> Sí
                  </span>
                </div>

                {/* Row 2: Pago pendiente de cliente */}
                <div className="flex justify-between items-start gap-4 py-1 border-t border-slate-900/40 mt-1">
                  <span className="text-slate-500 text-xs shrink-0 mt-0.5">Pago pendiente de cliente:</span>
                  <div className="text-right flex flex-col items-end gap-1">
                    <CopyableText text={formattedUsd}>
                      <span className="font-bold text-slate-200 block text-xs sm:text-sm">
                        {formattedUsd}
                      </span>
                    </CopyableText>
                    {showBs && (
                      <CopyableText text={formattedBs}>
                        <span className="font-bold text-slate-200 block text-xs sm:text-sm">
                          {formattedBs}
                        </span>
                      </CopyableText>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          }

          if (field.key === 'metodoPago') {
            return (
              <div key={field.key} className="flex justify-between items-baseline gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0">Método de Pago:</span>
                <span className="font-bold text-slate-200 text-right block truncate">
                  {String(val)}
                </span>
              </div>
            );
          }

          if (field.key === 'tasaDeCambioV') {
            return (
              <div key={field.key} className="flex justify-between items-baseline gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0">Tasa de Cambio:</span>
                <span className="font-bold text-slate-200 text-right block truncate">
                  Bs. {Number(val).toFixed(2)} | {order.tasaDeCambioT || 'Personalizada'}
                </span>
              </div>
            );
          }

          if (field.key === 'generoCliente') {
            const gen = String(val).toUpperCase();
            return (
              <div key={field.key} className="flex justify-between items-center gap-4 py-0.5">
                <span className="text-slate-500 text-xs shrink-0">{field.label}:</span>
                {gen.startsWith('H') ? (
                  <span className="w-5 h-5 rounded-full bg-blue-950/40 text-blue-400 border border-blue-500/20 flex items-center justify-center font-extrabold text-[10px] sm:text-xs">H</span>
                ) : gen.startsWith('M') ? (
                  <span className="w-5 h-5 rounded-full bg-pink-950/40 text-pink-400 border border-pink-500/20 flex items-center justify-center font-extrabold text-[10px] sm:text-xs">M</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">{val}</span>
                )}
              </div>
            );
          }

          // Default representation for normal text/number/dropdown values
          let displayVal = String(val);
          if (field.type === 'boolean') {
            displayVal = val === true || val === 'true' ? 'Sí' : 'No';
          } else if (field.type === 'date' || field.key === 'fechaEntrega') {
            displayVal = formatSpanishDateWithWeekday(displayVal);
          } else if (field.type === 'time' || field.key === 'horaEntrega') {
            displayVal = formatSpanishTime(displayVal);
          }

          return (
            <div key={field.key} className="flex justify-between items-baseline gap-4 py-0.5">
              <span className="text-slate-500 text-xs shrink-0">{field.label}:</span>
              <CopyableText text={displayVal} className="min-w-0">
                <span className="font-bold text-slate-200 text-right block truncate">{displayVal}</span>
              </CopyableText>
            </div>
          );
        })}
      </div>
    );
  };

  // Master renderer for Order Detail Content (enhanced design for desktop side panel & tablet/mobile popups)
  const renderOrderDetailContent = (order: Order) => {
    const statusInfo = STATUS_BADGES[order.status];
    const fallbackImage = "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=600";

    return (
      <div className="flex flex-col text-slate-100">
        {/* Top Header Image & Vignette */}
        <div 
          onClick={() => setIsImageExpanded(!isImageExpanded)}
          className={`relative w-full overflow-hidden bg-slate-950 shrink-0 transition-all duration-300 cursor-pointer ${
            isImageExpanded ? 'h-80 sm:h-[450px]' : 'h-48 sm:h-64'
          }`}
        >
          <img 
            src={order.imageRef || fallbackImage} 
            alt="Referencia de Pedido" 
            className={`w-full h-full select-none transition-all duration-300 object-cover ${
              isImageExpanded ? '' : 'hover:scale-105'
            }`}
            referrerPolicy="no-referrer"
            title={isImageExpanded ? "Toca para contraer imagen" : "Toca para ampliar imagen"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent pointer-events-none" />
          
          {/* FLOATING ORDER ID & PRIORITY in top-left corner of the box */}
          <div className="absolute top-4 left-4 z-40 flex flex-wrap gap-1.5 items-center" onClick={(e) => e.stopPropagation()}>
            <CopyableText text={order.id}>
              <span className="bg-slate-900/80 text-slate-300 backdrop-blur-md border border-slate-800/80 px-2.5 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest block">
                #{order.id.split('-')[1] || order.id.substring(0, 4)}
              </span>
            </CopyableText>
            
            {order.priority === 'critical' && (
              <span className="bg-rose-500/20 text-rose-300 backdrop-blur-md border border-rose-500/30 px-2.5 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest">
                CRÍTICO
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5" onClick={(e) => e.stopPropagation()}>
            {/* FLOATING STATUS DROPDOWN rendered above the title */}
            <div className="relative inline-block mb-2 z-40">
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold border cursor-pointer transition-all flex items-center gap-1.5 shadow-lg backdrop-blur-md bg-slate-950/80 hover:bg-slate-900/90 ${statusInfo.bg}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>{statusInfo.label}</span>
                <span className="text-[8px] opacity-75">▼</span>
              </button>
              {statusMenuOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-[99] py-1.5 overflow-hidden">
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

            <CopyableText text={order.pedido || (order.items && order.items[0]?.name) || 'Arreglo Floral'}>
              <h3 className="font-sans font-black text-lg sm:text-2xl text-white mt-1 drop-shadow-md leading-tight">
                {order.pedido || (order.items && order.items[0]?.name) || 'Arreglo Floral'}
              </h3>
            </CopyableText>
          </div>
        </div>

        {/* Main Details Body */}
        <div className="px-4 py-4 sm:px-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* Loose Fields at the TOP if selected */}
          {looseFieldsPosition === 'top' && getNonEmptyCategoryFields('Sin categoría', order).length > 0 && (
            <div className="space-y-3">
              {renderCategoryFields('Sin categoría', order)}
            </div>
          )}

          {configCategories.map((catName, idx) => {
            // Skip hidden categories
            if (hiddenCategories[catName]) return null;

            // Check if there are visible and NON-EMPTY fields in details for this category
            const hasFields = getNonEmptyCategoryFields(catName, order).length > 0;
            if (!hasFields) return null;

            const IconComponent = ICON_COMPONENTS[categoryIcons[catName]] || SlidersHorizontal;
            const colorClass = getCategoryColorClass(catName, idx);

            return (
              <div key={catName} className="space-y-3">
                <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-sans font-bold ${colorClass} uppercase tracking-wider pb-1.5 border-b border-slate-900`}>
                  <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>{catName}</span>
                </div>
                {renderCategoryFields(catName, order)}
              </div>
            );
          })}

          {/* Loose Fields at the BOTTOM if selected */}
          {looseFieldsPosition === 'bottom' && getNonEmptyCategoryFields('Sin categoría', order).length > 0 && (
            <div className="space-y-3">
              {renderCategoryFields('Sin categoría', order)}
            </div>
          )}

          {activeModules.includes('admin-module') && (
            <div className={looseFieldsPosition === 'top' ? 'pt-1' : 'border-t border-slate-900 pt-3'}>
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-500 text-xs shrink-0 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-violet-400" /> Asignado a:
                </span>
                <div className="flex items-center gap-1.5">
                  {order.asignadoA ? (
                    <span className="text-xs font-semibold text-slate-200 bg-violet-950/40 border border-violet-800/30 px-2 py-0.5 rounded-lg">
                      {order.asignadoA}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No asignado</span>
                  )}
                  
                  {order.status !== 'delivered' && order.status !== 'cancelled' && staff && staff.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value && assignStaffToOrder) {
                          assignStaffToOrder(order.id, e.target.value);
                        }
                      }}
                      defaultValue=""
                      className="text-[11px] bg-slate-900 border border-slate-800 rounded-lg py-1 px-1.5 outline-none text-slate-300 hover:border-violet-500/50 transition-all focus:border-violet-500 cursor-pointer"
                    >
                      <option value="" disabled>Asignar...</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Log */}
        <div className="px-4 py-3 sm:px-5 border-t border-slate-900 bg-slate-950/40 flex items-center justify-between text-[9px] sm:text-[10px] font-sans text-slate-500 shrink-0">
          <span>Recibido: {formatFullDateTime(order.created_at)}</span>
          <span>Modificado: {formatFullDateTime(order.updated_at)}</span>
        </div>
      </div>
    );
  };

  // State mutation actions rendered strictly at the bottom of the page
  const renderOrderActions = (order: Order) => {
    return (
      <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-900 shadow-xl flex flex-col gap-2 shrink-0">
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

        {onEditOrder && (
          <button
            onClick={() => onEditOrder(order)}
            className="w-full mt-1.5 h-10 px-4 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm bg-slate-900 hover:bg-slate-850 border border-slate-800/80 text-slate-300 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Editar Pedido</span>
          </button>
        )}
      </div>
    );
  };

  if (showConfigPage) {
    return (
      <div className="space-y-6 animate-fade-in text-slate-100">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-900">
          <button
            onClick={() => setShowConfigPage(false)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center"
            title="Volver a Órdenes"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-slate-900" />
          <div>
            <h2 className="font-sans font-black text-lg sm:text-2xl text-white tracking-tight">Configurar módulo de órdenes.</h2>
            <p className="text-[10px] sm:text-xs text-slate-500">Configura qué campos son visibles en la lista y en los detalles del pedido, y gestiona o crea nuevos campos.</p>
          </div>
        </div>
        <OrderFieldsConfig />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* 1. Mobile/Tablet Separate Order Details Page */}
      {selectedOrder && (
        <div className="block xl:hidden space-y-6 animate-fade-in">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-900">
            <div className="flex items-center gap-3 min-w-0">
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

            {/* Copy Button */}
            <button
              type="button"
              onClick={() => handleCopyOrderDetails(selectedOrder)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0 ml-2"
              title="Copiar información del pedido"
            >
              {copiedOrderId === selectedOrder.id ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="absolute -top-8 right-0 bg-emerald-600 border border-emerald-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow-xl pointer-events-none whitespace-nowrap z-50 animate-fade-in">
                    ¡Copiado!
                  </span>
                </>
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Details Content (renders the existing detailed layout inline) */}
          <div className="rounded-2xl bg-slate-950 border border-slate-900 p-0 overflow-hidden shadow-2xl">
            {renderOrderDetailContent(selectedOrder)}
          </div>

          {/* Action buttons at the bottom of the page */}
          {renderOrderActions(selectedOrder)}
        </div>
      )}

      {/* 2. Main Order List View (Hidden on mobile/tablet when an order is selected, but always visible on desktop) */}
      <div className={selectedOrder ? "hidden xl:block space-y-6" : "space-y-6"}>
        {/* Header Title */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="font-sans font-black text-2xl text-white tracking-tight">Gestión de Ordenes</h2>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Quick statistics count */}
            <div className="flex gap-2.5 text-[11px] font-mono text-slate-400">
              <div className="px-3 py-1.5 rounded-xl border border-slate-950 bg-slate-900/40">
                Mostrando: <span className="font-bold text-cyan-400">{filteredOrders.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl border border-slate-950 bg-slate-900/40">
                En Curso: <span className="font-bold text-amber-400">
                  {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}
                </span>
              </div>
            </div>

            {/* Config button (gear icon without label) */}
            <button
              onClick={() => setShowConfigPage(true)}
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl border border-slate-950 bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 transition-all flex items-center justify-center cursor-pointer shadow-md"
              title="Personalizar columnas y visibilidad"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
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

        {/* Standalone Search Bar, Customize, and icon-only Filter buttons with perfectly matching heights */}
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
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setDateRangeFilter(opt.id);
                    setCustomDateRange(null);
                    setShowMonthDropdown(false);
                    setShowCalendarPopover(false);
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

              {/* Month Dropdown ("Mes" button with dropdown of elapsed months this year) */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthDropdown(!showMonthDropdown);
                    setShowCalendarPopover(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                    dateRangeFilter.startsWith('month_')
                      ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>
                    {dateRangeFilter.startsWith('month_')
                      ? SPANISH_MONTHS[parseInt(dateRangeFilter.split('_')[1], 10)]
                      : 'Mes'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {showMonthDropdown && (
                  <div className="absolute left-0 mt-2 py-1.5 w-40 rounded-lg bg-slate-950 border border-slate-900 shadow-2xl z-50 overflow-hidden">
                    {SPANISH_MONTHS.slice(0, 7).map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDateRangeFilter(`month_${idx}`);
                          setCustomDateRange(null);
                          setShowMonthDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-900 font-mono ${
                          dateRangeFilter === `month_${idx}` ? 'text-indigo-400 font-bold bg-slate-900/50' : 'text-slate-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Calendario con Popover de Rango de Fechas */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => {
                    setShowCalendarPopover(!showCalendarPopover);
                    setShowMonthDropdown(false);
                  }}
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-lg sm:rounded-xl border border-slate-950 bg-slate-950 text-slate-200 text-xs focus:border-slate-800 focus:outline-none transition-colors font-mono appearance-none"
                >
                  <option value="delivery">Fecha de entrega</option>
                  <option value="created">Fecha de creación</option>
                  <option value="price">Monto total</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 rounded-lg sm:rounded-xl bg-slate-950 border border-slate-950 text-slate-400 hover:text-white hover:border-slate-900 transition-all cursor-pointer flex items-center justify-center shrink-0"
                title={sortOrder === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="h-4 w-4 text-indigo-400" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-indigo-400" />
                )}
              </button>
            </div>
          </div>

          {/* Delivery type filter */}
          <div className="md:col-span-4 space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tipo de Entrega:</label>
            <div className="relative">
              <select
                value={deliveryTypeFilter}
                onChange={(e) => setDeliveryTypeFilter(e.target.value as any)}
                className="w-full pl-3 pr-8 py-2.5 rounded-lg sm:rounded-xl border border-slate-950 bg-slate-950 text-slate-200 text-xs focus:border-slate-800 focus:outline-none transition-colors font-mono appearance-none"
              >
                <option value="all">Todos los tipos</option>
                <option value="delivery">Domicilio (Delivery)</option>
                <option value="tienda">Retiro en Tienda</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
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
        <div className={`lg:col-span-12 ${
          selectedOrder ? 'xl:col-span-7' : 'xl:col-span-12'
        } xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto xl:pr-2 scrollbar-dark transition-all duration-300 space-y-4`}>
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
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-2xl border transition-all cursor-pointer flex gap-3 sm:gap-4 items-stretch justify-between ${
                      isSelected 
                        ? 'bg-slate-900/70 border-indigo-500/55 shadow-lg shadow-indigo-500/5' 
                        : 'bg-slate-900/25 border-slate-950 hover:bg-slate-900/40 hover:border-slate-900'
                    }`}
                  >
                    <div className="flex items-stretch gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Square rounded bouquet thumbnail image on left (mobile responsive) */}
                      <div className="w-14 sm:w-16 rounded-lg sm:rounded-xl overflow-hidden border border-slate-950 shrink-0 relative bg-slate-950 self-stretch min-h-[56px] sm:min-h-[64px]">
                        <img 
                          src={previewImage} 
                          alt="Vista previa" 
                          className="absolute inset-0 w-full h-full object-cover"
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
                        {configFields.find(f => f.key === 'customer_name')?.showInList !== false && (
                          <h3 className="font-sans font-black text-xs sm:text-sm text-white truncate leading-tight">
                            {order.customer_name}
                          </h3>
                        )}
                        {configFields.find(f => f.key === 'pedido')?.showInList !== false && (
                          <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5 font-medium leading-normal">
                            {order.pedido || (order.items && order.items[0]?.name) || 'Arreglo Floral'}
                          </p>
                        )}

                        {/* Additional dynamic list fields */}
                        {(() => {
                          const additionalListFields = configFields.filter(f => 
                            f.showInList && 
                            f.visible && 
                            !['customer_name', 'pedido', 'fechaEntrega', 'horaEntrega', 'total_price', 'clienteNombre', 'created_at'].includes(f.key)
                          );
                          if (additionalListFields.length === 0) return null;

                          return (
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[9px] sm:text-[10px] text-slate-400">
                              {additionalListFields.map(field => {
                                const val = order[field.key as keyof Order] ?? (order.custom_fields && (order.custom_fields as any)[field.key]);
                                if (val === undefined || val === null || val === '') return null;

                                let displayVal = String(val);
                                if (field.type === 'boolean') {
                                  displayVal = val === true || val === 'true' ? 'Sí' : 'No';
                                } else if (field.type === 'date') {
                                  displayVal = formatSpanishDate(displayVal);
                                }

                                return (
                                  <span key={field.key} className="bg-slate-950/45 px-1.5 py-0.5 rounded border border-slate-900/50">
                                    <strong className="text-slate-500">{field.label}:</strong> {displayVal}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Bottom line: Spanish Date and Time formatted (reduced spacing, gap-2 is 8px, gap-1 is 4px) */}
                        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-400 font-mono mt-1.5 whitespace-nowrap overflow-hidden">
                          {configFields.find(f => f.key === 'fechaEntrega')?.showInList !== false && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400" />
                              <span className="font-semibold text-slate-200">{formatSpanishDate(order.fechaEntrega)}</span>
                            </div>
                          )}
                          {configFields.find(f => f.key === 'horaEntrega')?.showInList !== false && order.horaEntrega && (
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
                        {order.tasaDeCambioT === 'EUR' ? '€' : '$'}{(order.precioFacturado ?? order.total_price ?? 0).toLocaleString()}
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
          <div className="hidden xl:block xl:col-span-5 space-y-4 sticky top-24 xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto pr-2 scrollbar-dark pb-6 animate-fade-in">
            {/* Header bar for Desktop */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-900 bg-slate-950/20 backdrop-blur-sm p-3 rounded-2xl border border-slate-900/40">
              <div className="min-w-0">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Pedido Seleccionado</span>
                <h3 className="font-sans font-black text-xs sm:text-sm text-white leading-tight truncate">
                  ID: {selectedOrder.id.substring(0, 8)} — {selectedOrder.customer_name}
                </h3>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={() => handleCopyOrderDetails(selectedOrder)}
                  className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Copiar información del pedido"
                >
                  {copiedOrderId === selectedOrder.id ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="absolute -top-8 right-0 bg-emerald-600 border border-emerald-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow-xl pointer-events-none whitespace-nowrap z-50 animate-fade-in">
                        ¡Copiado!
                      </span>
                    </>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Cerrar panel"
                  title="Cerrar panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Information Box/Card - overflow-hidden prevents image corner bleeding/overflow */}
            <div className="rounded-2xl bg-slate-950 border border-slate-900 p-0 shadow-2xl relative overflow-hidden">
              {renderOrderDetailContent(selectedOrder)}
            </div>

            {/* Action buttons at the bottom of the page */}
            {renderOrderActions(selectedOrder)}
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
