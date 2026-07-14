import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertOctagon, 
  Package, 
  ShoppingBag, 
  CheckCircle, 
  RefreshCw,
  Bell,
  Euro,
  ArrowLeftRight
} from 'lucide-react';
import { Order, DashboardMetrics, RealTimeNotification } from '../types';
import { calculateMetrics } from '../utils/mockData';

interface DashboardProps {
  orders: Order[];
  notifications: RealTimeNotification[];
  clearNotifications: () => void;
  triggerMockOrder: () => void;
}

export default function Dashboard({ 
  orders, 
  notifications, 
  clearNotifications,
  triggerMockOrder
}: DashboardProps) {
  const metrics = useMemo(() => calculateMetrics(orders), [orders]);

  // --- Exchange Rates State & Fetcher ---
  const [exchangeState, setExchangeState] = useState({
    usd_bcv: 42.15,
    eur_bcv: 45.40,
    binance: 44.90,
    lastUpdated: '',
    loading: true,
    isMock: false,
  });

  const [calcUsd, setCalcUsd] = useState<string>('100');
  const [calcRateType, setCalcRateType] = useState<'usd' | 'eur' | 'binance'>('usd');
  const [isInputInBs, setIsInputInBs] = useState<boolean>(false);

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
            // Fallback for USD Oficial if direct endpoint wasn't used or failed
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

            // Find Euro
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

  // Color constants matching our ZenitLabs theme
  const COLORS = {
    pending: '#fbbf24',    // Amber
    preparing: '#3b82f6',  // Blue
    shipped: '#8b5cf6',    // Purple
    delivered: '#10b981',  // Emerald
    cancelled: '#f43f5e',  // Rose
    critical: '#ef4444',   // Red
  };

  // 1. Data for Status Pie Chart
  const statusChartData = useMemo(() => {
    return [
      { name: 'Pendientes', value: metrics.pendingOrdersCount, color: COLORS.pending },
      { name: 'Preparando', value: metrics.preparingOrdersCount, color: COLORS.preparing },
      { name: 'Enviadas', value: metrics.shippedOrdersCount, color: COLORS.shipped },
      { name: 'Entregadas', value: metrics.deliveredOrdersCount, color: COLORS.delivered },
      { name: 'Canceladas', value: metrics.cancelledOrdersCount, color: COLORS.cancelled },
    ].filter(item => item.value > 0);
  }, [metrics]);

  // 2. Data for Hourly/Temporal Area Chart
  const timelineChartData = useMemo(() => {
    // Group orders by hour of creation (simulated timeline)
    const hourGroups: { [key: string]: { orders: number; revenue: number } } = {};
    
    // Seed standard hours for a complete visual graph
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    hours.forEach(h => {
      hourGroups[h] = { orders: 0, revenue: 0 };
    });

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const hour = date.getHours();
      // Map to closest seed hour
      let key = '12:00';
      if (hour < 9) key = '08:00';
      else if (hour < 11) key = '10:00';
      else if (hour < 13) key = '12:00';
      else if (hour < 15) key = '14:00';
      else if (hour < 17) key = '16:00';
      else if (hour < 19) key = '18:00';
      else key = '20:00';

      if (hourGroups[key]) {
        hourGroups[key].orders += 1;
        if (order.status !== 'cancelled') {
          hourGroups[key].revenue += order.total_price;
        }
      }
    });

    return Object.entries(hourGroups).map(([hour, data]) => ({
      hour,
      'Órdenes': data.orders,
      'Ingresos ($)': data.revenue,
    }));
  }, [orders]);

  // 3. Priority distribution chart data
  const priorityChartData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    orders.forEach(o => {
      counts[o.priority] += 1;
    });
    return [
      { name: 'Baja', 'Órdenes': counts.low, color: '#94a3b8' },
      { name: 'Media', 'Órdenes': counts.medium, color: '#38bdf8' },
      { name: 'Alta', 'Órdenes': counts.high, color: '#f59e0b' },
      { name: 'Crítica', 'Órdenes': counts.critical, color: '#ef4444' },
    ];
  }, [orders]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Sistema Operativo • ZenitLabs</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl md:text-3xl tracking-tight text-white mt-1">
            Panel de Operaciones en Tiempo Real
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Supervisa métricas de rendimiento, flujos de pedidos y sincronización de infraestructura.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase text-slate-200">System Online</span>
          </div>
          <button
            id="trigger-mock-order-btn"
            onClick={triggerMockOrder}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-98 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 animate-spin-slow" />
            <span>Simular Entrada Orden</span>
          </button>
        </div>
      </div>

      {/* Tasas de Cambio & Calculadora Section */}
      <div className="bg-slate-900 border border-slate-950 p-6 rounded-3xl space-y-6 relative overflow-hidden group">
        {/* Decorative subtle background gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${exchangeState.isMock ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${exchangeState.isMock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </span>
              <h3 className="font-sans font-black text-lg text-white tracking-tight">
                Módulo de Tasas Cambiarias
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tasas oficiales y paralelas de referencia para transacciones en bolívares (Bs.).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="text-[10px] font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-950 text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 w-full sm:w-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              {exchangeState.isMock ? (
                <span className="text-amber-400 font-semibold">Demo (Fallbacks)</span>
              ) : (
                <span className="text-emerald-400 font-semibold">API Activa (ve.dolarapi.com)</span>
              )}
              {exchangeState.lastUpdated && `• ${exchangeState.lastUpdated}`}
            </div>
            <button
              onClick={fetchRates}
              disabled={exchangeState.loading}
              className={`p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-950 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-mono font-semibold w-full sm:w-auto ${exchangeState.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Sincronizar tasas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${exchangeState.loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>
        </div>

        {/* Outer Layout: Grid with 2 parts: 3 Rate Cards + 1 Conversion Calculator */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* 3 Rate Cards (flex-grow) */}
          <div className="w-full lg:flex-[3] flex flex-col sm:flex-row gap-4">
            
            {/* CARD 1: Dólar BCV */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-950 hover:border-cyan-500/20 hover:bg-slate-950/80 transition-all flex flex-col justify-between group/card relative overflow-hidden w-full sm:flex-1 min-w-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover/card:bg-cyan-500/10 transition-colors" />
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase">Dólar BCV</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-500/10 font-semibold font-mono">Oficial</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/5 group-hover/card:scale-105 transition-transform duration-300">
                  <DollarSign className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  {exchangeState.loading ? (
                    <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl font-black text-white tracking-tight font-mono group-hover/card:text-cyan-400 transition-colors">
                      Bs. {exchangeState.usd_bcv.toFixed(2)}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tasa oficial del BCV</p>
                </div>
              </div>
            </div>

            {/* CARD 2: Euro BCV */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-950 hover:border-indigo-500/20 hover:bg-slate-950/80 transition-all flex flex-col justify-between group/card relative overflow-hidden w-full sm:flex-1 min-w-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover/card:bg-indigo-500/10 transition-colors" />
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase">Euro BCV</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-950/40 text-indigo-400 border border-indigo-500/10 font-semibold font-mono">Oficial</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/5 group-hover/card:scale-105 transition-transform duration-300">
                  <Euro className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  {exchangeState.loading ? (
                    <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl font-black text-white tracking-tight font-mono group-hover/card:text-indigo-400 transition-colors">
                      Bs. {exchangeState.eur_bcv.toFixed(2)}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tasa oficial europea</p>
                </div>
              </div>
            </div>

            {/* CARD 3: Binance (Paralelo) */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-950 hover:border-amber-500/20 hover:bg-slate-950/80 transition-all flex flex-col justify-between group/card relative overflow-hidden w-full sm:flex-1 min-w-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover/card:bg-amber-500/10 transition-colors" />
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase">Binance P2P</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-400 border border-amber-500/10 font-semibold font-mono">Paralelo</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/5 group-hover/card:scale-105 transition-transform duration-300">
                  <DollarSign className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  {exchangeState.loading ? (
                    <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl font-black text-white tracking-tight font-mono group-hover/card:text-amber-400 transition-colors">
                      Bs. {exchangeState.binance.toFixed(2)}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Promedio paralelo de referencia</p>
                </div>
              </div>
            </div>

          </div>

          {/* Quick-Converter Section (flex-1) */}
          <div className="w-full lg:flex-1 p-5 rounded-2xl bg-slate-950 border border-slate-950 flex flex-col justify-between relative overflow-hidden group/calc">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500 opacity-20" />
            
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Conversor de Divisas</span>
              </div>

              {/* Conversion rate selection */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-950">
                <button
                  type="button"
                  onClick={() => setCalcRateType('usd')}
                  className={`py-1.5 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${calcRateType === 'usd' ? 'bg-cyan-600/25 text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
                >
                  Dólar
                </button>
                <button
                  type="button"
                  onClick={() => setCalcRateType('eur')}
                  className={`py-1.5 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${calcRateType === 'eur' ? 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
                >
                  Euro
                </button>
                <button
                  type="button"
                  onClick={() => setCalcRateType('binance')}
                  className={`py-1.5 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${calcRateType === 'binance' ? 'bg-amber-600/25 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
                >
                  Binance
                </button>
              </div>

              {/* Input for selected currency value with Swap button on the left */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInputInBs(prev => !prev)}
                  className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-950 hover:border-slate-800 hover:text-white text-slate-400 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  title="Cambiar dirección de conversión"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500`}>
                    {isInputInBs ? 'Bs.' : (calcRateType === 'eur' ? '€' : '$')}
                  </span>
                  <input
                    type="text"
                    value={calcUsd}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                        setCalcUsd(val);
                      }
                    }}
                    placeholder={
                      isInputInBs 
                        ? 'Monto en Bs.' 
                        : (calcRateType === 'eur' ? 'Monto en EUR' : calcRateType === 'binance' ? 'Monto en USD (Binance)' : 'Monto en USD')
                    }
                    className={`w-full bg-slate-900 border border-slate-950 focus:border-slate-800 rounded-xl py-2 ${isInputInBs ? 'pl-11' : 'pl-7'} pr-4 text-xs text-white font-mono placeholder-slate-600 focus:outline-none transition-all`}
                  />
                </div>
              </div>
            </div>

            {/* Output value */}
            <div className="mt-4 pt-3 border-t border-slate-900 flex flex-col justify-end">
              <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">
                {isInputInBs 
                  ? `Equivalente en ${calcRateType === 'usd' ? 'Dólares' : calcRateType === 'eur' ? 'Euros' : 'USD (Binance)'}` 
                  : 'Equivalente en Bolívares'}
              </span>
              <span className={`text-xl font-extrabold tracking-tight font-mono truncate mt-0.5 ${calcRateType === 'usd' ? 'text-cyan-400' : calcRateType === 'eur' ? 'text-indigo-400' : 'text-amber-400'}`}>
                {isInputInBs ? (calcRateType === 'eur' ? '€' : '$') : 'Bs.'} {(() => {
                  const num = parseFloat(calcUsd || '0');
                  const multiplier = 
                    calcRateType === 'usd' ? exchangeState.usd_bcv : 
                    calcRateType === 'eur' ? exchangeState.eur_bcv : 
                    exchangeState.binance;
                  
                  const result = isInputInBs 
                    ? (multiplier > 0 ? num / multiplier : 0) 
                    : (num * multiplier);

                  return result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric CARD 1: Total Revenue (col-span-2 row-span-1) */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between min-h-[160px] group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase">
              Ingresos Totales (Neto)
            </span>
            <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +18.4%
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white tracking-tight font-sans">
                ${metrics.totalRevenue.toLocaleString()}
              </span>
              <span className="text-slate-500 text-xs">USD acumulado</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric CARD 2: Total Orders (col-span-1 row-span-1) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between min-h-[160px] group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase">
              Órdenes Registradas
            </span>
            <span className="text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg text-xs font-semibold">
              +12% hist.
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white tracking-tight font-sans">
                {metrics.totalOrders}
              </span>
              <span className="text-slate-500 text-xs">activas</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric CARD 3: Avg Prep Time (col-span-1 row-span-1) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between min-h-[160px] group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase">
              Promedio Prep.
            </span>
            <span className="text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg text-xs font-semibold">
              Obj: &lt;30m
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white tracking-tight font-sans">
                {metrics.avgPreparationTime}m
              </span>
              <span className="text-slate-500 text-xs">por pedido</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Timeline Revenue/Volume Chart (col-span-2 row-span-2) */}
        <div className="md:col-span-2 lg:row-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans font-bold text-base text-white">Cronograma de Pedidos</h3>
              <p className="text-xs text-slate-400">Distribución de ingresos y volumen por hora de carga</p>
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-indigo-500" />
                <span className="text-slate-400">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-purple-500" />
                <span className="text-slate-400">Órdenes</span>
              </div>
            </div>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="Ingresos ($)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area yAxisId="right" type="monotone" dataKey="Órdenes" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Notifications / Logs Feed (col-span-2 row-span-3) */}
        <div className="md:col-span-2 lg:row-span-3 p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col hover:border-slate-700/80 transition-all overflow-hidden h-[540px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-400" />
              <h3 className="font-sans font-bold text-lg text-white">Eventos en Tiempo Real</h3>
            </div>
            {notifications.length > 0 && (
              <button
                id="clear-notifications-btn"
                onClick={clearNotifications}
                className="text-xs text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Bell className="h-8 w-8 opacity-25 mb-2 animate-pulse" />
                <p className="text-xs">Esperando nuevos eventos del sistema...</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const borderStyles = {
                  info: 'border-l-indigo-500 bg-indigo-950/10 hover:bg-indigo-950/15',
                  success: 'border-l-emerald-500 bg-emerald-950/10 hover:bg-emerald-950/15',
                  warning: 'border-l-amber-500 bg-amber-950/10 hover:bg-amber-950/15',
                  error: 'border-l-rose-500 bg-rose-950/10 hover:bg-rose-950/15',
                };
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-xl border border-slate-800/65 border-l-3 transition-colors flex gap-3 ${borderStyles[notif.type]}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-200 truncate">{notif.title}</p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                      {notif.orderId && (
                        <div className="mt-1.5 flex">
                          <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-slate-300 font-mono">
                            {notif.orderId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status / Alerts (col-span-1 row-span-1) */}
        <div className={`rounded-3xl p-6 flex flex-col justify-center items-center text-center border transition-all ${
          metrics.criticalOrdersCount > 0
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700/80'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            metrics.criticalOrdersCount > 0
              ? 'bg-rose-500/20 text-rose-400 animate-pulse'
              : 'bg-slate-850 text-slate-400'
          }`}>
            <AlertOctagon className="h-6 w-6" />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            metrics.criticalOrdersCount > 0 ? 'text-rose-400' : 'text-slate-400'
          }`}>
            Alertas Críticas
          </span>
          <p className="text-white text-3xl font-black mt-1">
            {metrics.criticalOrdersCount}
          </p>
          <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
            {metrics.criticalOrdersCount > 0 ? 'Requieren intervención' : 'Sistema en rango seguro'}
          </p>
        </div>

        {/* Order Status Distribution Chart (col-span-1 row-span-1) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700/80 transition-all min-h-[180px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase">Fases Operativas</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Activas</span>
          </div>

          <div className="h-28 relative flex items-center justify-center my-1">
            {statusChartData.length === 0 ? (
              <div className="text-center text-slate-500">
                <p className="text-[10px]">Sin datos</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-white font-mono">{metrics.totalOrders}</span>
              <span className="text-[8px] text-slate-500 font-semibold uppercase">Total</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap text-[9px] text-slate-400">
            {statusChartData.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority analysis chart (col-span-2 row-span-1) */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col hover:border-slate-700/80 transition-all justify-between min-h-[200px]">
          <div>
            <h3 className="font-sans font-bold text-sm text-white">Severidad del Backlog</h3>
            <p className="text-[10px] text-slate-400">Distribución de pedidos según nivel de prioridad</p>
          </div>

          <div className="h-24 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} barSize={16}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="Órdenes" radius={[3, 3, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
