import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Flower, 
  Boxes, 
  Coins, 
  Users, 
  TrendingUp, 
  Gift, 
  Store, 
  Wand2, 
  Check, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  Info, 
  Plus, 
  Package, 
  Trash2, 
  Download, 
  UserCheck, 
  TrendingDown 
} from 'lucide-react';
import { 
  AppModule, 
  BUSINESS_VERTICALS, 
  APP_MODULES, 
  getActiveModules, 
  saveActiveModules, 
  toggleModuleInStorage 
} from '../lib/moduleManager';
import { StockItem, FinanceTransaction, StaffMember } from '../types';

interface ModuleStoreProps {
  onModulesChanged: (activeIds: string[]) => void;
  addNotification: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => void;
  setMockItemsTemplate?: (items: { name: string; price: number }[]) => void;
  stock?: StockItem[];
  setStock?: React.Dispatch<React.SetStateAction<StockItem[]>>;
  transactions?: FinanceTransaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<FinanceTransaction[]>>;
  staff?: StaffMember[];
  setStaff?: React.Dispatch<React.SetStateAction<StaffMember[]>>;
}

export default function ModuleStore({ 
  onModulesChanged, 
  addNotification,
  setMockItemsTemplate,
  stock = [],
  setStock,
  transactions = [],
  setTransactions,
  staff = [],
  setStaff
}: ModuleStoreProps) {
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<'store' | 'wizard'>('store');
  
  // Wizard states
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedVertical, setSelectedVertical] = useState<string>('florist');
  
  // Sandbox states for premium modules
  const [activeSandboxModule, setActiveSandboxModule] = useState<string | null>(null);
  
  // Inventory sandbox state (Fase 3 Core: sync to shared state)
  const inventoryStock = stock;
  const setInventoryStock = setStock || (() => {});
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<number>(50);
  const [newItemMin, setNewItemMin] = useState<number>(10);

  // Finance sandbox state (Fase 3 Core: sync to shared state)
  const financeTransactions = transactions;
  const setFinanceTransactions = setTransactions || (() => {});
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState<number>(0);
  const [finType, setFinType] = useState<'income' | 'expense'>('income');

  // Staff/Delivery sandbox state (Fase 3 Core: sync to shared state)
  const staffMembers = staff;
  const setStaffMembers = setStaff || (() => {});

  useEffect(() => {
    const active = getActiveModules();
    setActiveIds(active);
  }, []);

  const handleToggleModule = (moduleId: string) => {
    const isCurrentlyActive = activeIds.includes(moduleId);
    
    // Prevent disabling core
    if (moduleId === 'core-orders') {
      addNotification('warning', 'Módulo Requerido', 'La Gestión de Órdenes (Core) no puede ser desactivada.');
      return;
    }

    const updated = toggleModuleInStorage(moduleId, !isCurrentlyActive);
    setActiveIds(updated);
    onModulesChanged(updated);

    if (!isCurrentlyActive) {
      addNotification('success', 'Módulo Activado', `El módulo "${APP_MODULES.find(m => m.id === moduleId)?.name}" se ha habilitado correctamente.`);
    } else {
      addNotification('info', 'Módulo Desactivado', `Se ha deshabilitado el módulo "${APP_MODULES.find(m => m.id === moduleId)?.name}".`);
    }
  };

  // Run business vertical automatic configuration setup
  const handleApplyVertical = () => {
    const vertical = BUSINESS_VERTICALS.find(v => v.id === selectedVertical);
    if (!vertical) return;

    // Save configuration modules
    saveActiveModules(vertical.recommendedModules);
    setActiveIds(vertical.recommendedModules);
    onModulesChanged(vertical.recommendedModules);

    // Update items templates if callback provided
    if (setMockItemsTemplate) {
      setMockItemsTemplate(vertical.defaultOrderItems);
    }

    addNotification(
      'success', 
      `Perfil Configurado: ${vertical.name}`, 
      `El asistente configuró exitosamente ZenitLabs para un modelo de negocio de ${vertical.name}.`
    );
    
    setWizardStep(3);
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingCart': return <ShoppingCart className="h-5 w-5 text-indigo-400" />;
      case 'Flower': return <Flower className="h-5 w-5 text-pink-400" />;
      case 'Boxes': return <Boxes className="h-5 w-5 text-amber-400" />;
      case 'Coins': return <Coins className="h-5 w-5 text-emerald-400" />;
      case 'Users': return <Users className="h-5 w-5 text-violet-400" />;
      case 'TrendingUp': return <TrendingUp className="h-5 w-5 text-cyan-400" />;
      case 'Gift': return <Gift className="h-5 w-5 text-rose-400" />;
      case 'Store': return <Store className="h-5 w-5 text-blue-400" />;
      default: return <Wand2 className="h-5 w-5 text-slate-400" />;
    }
  };

  // Add stock item handler
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    const item = {
      id: Math.random().toString(),
      name: newItemName,
      qty: newItemQty,
      min: newItemMin,
      unit: 'unidades'
    };
    setInventoryStock([...inventoryStock, item]);
    setNewItemName('');
    addNotification('success', 'Inventario Actualizado', `Se ha agregado "${newItemName}" con stock inicial de ${newItemQty}.`);
  };

  // Add transaction handler
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finDesc || finAmount <= 0) return;
    const trans = {
      id: Math.random().toString(),
      type: finType,
      desc: finDesc,
      amount: finAmount,
      date: 'Ahora mismo'
    };
    setFinanceTransactions([trans, ...financeTransactions]);
    setFinDesc('');
    setFinAmount(0);
    addNotification('success', 'Movimiento Registrado', `Transacción contable agregada por $${finAmount}.`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Mode Swapper */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
              Gestor de Módulos & Wizards
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                SaaS Ready
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Adapta la plataforma a las necesidades operativas de tu comercio o habilita características personalizadas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => { setCurrentTab('store'); setActiveSandboxModule(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'store' 
                ? 'bg-slate-950 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tienda de Módulos
          </button>
          <button
            onClick={() => { setCurrentTab('wizard'); setActiveSandboxModule(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'wizard' 
                ? 'bg-slate-950 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5 text-indigo-400" />
            Asistente Config (Wizard)
          </button>
        </div>
      </div>

      {/* Main Tab Rendering */}
      {currentTab === 'store' && !activeSandboxModule && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {APP_MODULES.map((module) => {
            const isActive = activeIds.includes(module.id);
            return (
              <div 
                key={module.id}
                className={`rounded-2xl border transition-all p-6 flex flex-col justify-between ${
                  isActive 
                    ? 'bg-indigo-950/10 border-indigo-500/20 shadow-indigo-950/10 shadow-lg' 
                    : 'bg-slate-950/20 border-slate-900/60 hover:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-900">
                      {getModuleIcon(module.iconName)}
                    </div>
                    {module.isAlwaysActive ? (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-semibold">
                        Core Vital
                      </span>
                    ) : module.isPremium ? (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-950/50 border border-indigo-900 text-indigo-300 font-semibold flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> Premium Trial
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-900 text-emerald-400 font-semibold">
                        Gratuito
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{module.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{module.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-900 flex items-center justify-between gap-3">
                  {module.isAlwaysActive ? (
                    <button className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-500 cursor-not-allowed w-full text-center">
                      Habilitado por Defecto
                    </button>
                  ) : module.isPremium ? (
                    <div className="flex items-center gap-2 w-full">
                      <button 
                        onClick={() => setActiveSandboxModule(module.id)}
                        className="flex-1 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-center"
                      >
                        Probar Sandbox
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggleModule(module.id)}
                      className={`w-full text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                        isActive 
                          ? 'bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border-rose-500/20' 
                          : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      {isActive ? 'Desactivar Módulo' : 'Activar Módulo'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RENDER ACTIVE SANDBOXES */}
      {currentTab === 'store' && activeSandboxModule === 'inventory-module' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sandbox Header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Boxes className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Prueba Interactiva: Control de Inventario</h2>
                <p className="text-xs text-slate-400">Verifica cómo se gestiona la floristería de forma inteligente con materias primas.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveSandboxModule(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              ← Volver al Catálogo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock List Panel */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Inventario de Flores & Insumos</h3>
              
              <div className="space-y-3">
                {inventoryStock.map(item => {
                  const isLow = item.qty <= item.min;
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        isLow 
                          ? 'bg-amber-950/10 border-amber-500/20 shadow-lg shadow-amber-950/5' 
                          : 'bg-slate-900/40 border-slate-900'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Mínimo requerido: {item.min} {item.unit}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-xs font-bold ${isLow ? 'text-amber-400' : 'text-slate-300'}`}>
                            {item.qty} {item.unit}
                          </p>
                          {isLow && (
                            <span className="text-[9px] text-amber-500 font-mono flex items-center gap-1 justify-end mt-0.5">
                              <AlertCircle className="h-2.5 w-2.5" /> Stock Mínimo
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              setInventoryStock(prev => prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 10 } : i));
                              addNotification('info', 'Reabastecimiento', `Se añadieron +10 unidades de ${item.name}.`);
                            }}
                            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs"
                          >
                            +10
                          </button>
                          <button 
                            onClick={() => {
                              if (item.qty <= 0) return;
                              setInventoryStock(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 5) } : i));
                              if (item.qty - 5 <= item.min) {
                                addNotification('warning', 'Alerta de Insumos', `¡Atención! "${item.name}" ha caído por debajo del nivel mínimo establecido.`);
                              }
                            }}
                            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs"
                          >
                            -5
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Addition panel */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
              <form onSubmit={handleAddStock} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Añadir Nuevo Insumo</h3>
                
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Nombre del Insumo</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Clavel Rosado, Papel Kraft"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-900 bg-slate-900/60 text-slate-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Cant. Inicial</label>
                    <input 
                      type="number"
                      min={1}
                      required
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-900 bg-slate-900/60 text-slate-100 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Stock Mínimo</label>
                    <input 
                      type="number"
                      min={1}
                      required
                      value={newItemMin}
                      onChange={(e) => setNewItemMin(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-900 bg-slate-900/60 text-slate-100 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full text-xs font-bold py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Agregar Item
                </button>
              </form>

              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-[11px] text-indigo-400 mt-6 leading-relaxed">
                <Info className="h-4 w-4 inline mr-1.5 mb-0.5" />
                Este módulo se sincroniza con el catálogo de órdenes: cuando una orden es marcada como <strong>"En Preparación"</strong>, automáticamente descuenta los insumos botánicos del stock.
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'store' && activeSandboxModule === 'finance-module' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sandbox Header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Prueba Interactiva: Contabilidad y Finanzas</h2>
                <p className="text-xs text-slate-400">Controla egresos, ingresos y descarga reportes de auditoría financiera listos para el fisco.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveSandboxModule(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              ← Volver al Catálogo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ledger Transactions */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200">Asiento Libro Diario (Demo Sandbox)</h3>
                
                {/* Simulated Cash Balance */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono block">Caja Chica Estimada</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    ${(financeTransactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 150)).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {financeTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-900 bg-slate-900/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-950/40 border border-emerald-900 text-emerald-400' : 'bg-rose-950/40 border border-rose-900 text-rose-400'}`}>
                        {t.type === 'income' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{t.desc}</p>
                        <span className="text-[9px] text-slate-500 font-mono">{t.date}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold font-mono ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Input form */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Registrar Operación</h3>
                
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Tipo de Movimiento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setFinType('income')}
                      className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        finType === 'income' 
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                          : 'border-slate-800 text-slate-500 bg-slate-900/40'
                      }`}
                    >
                      Ingreso
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFinType('expense')}
                      className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        finType === 'expense' 
                          ? 'bg-rose-950/40 border-rose-500 text-rose-400' 
                          : 'border-slate-800 text-slate-500 bg-slate-900/40'
                      }`}
                    >
                      Egreso
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Detalle / Concepto</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Compra papel celofán, Pago Delivery"
                    value={finDesc}
                    onChange={(e) => setFinDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-900 bg-slate-900/60 text-slate-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Monto (USD)</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={finAmount || ''}
                    onChange={(e) => setFinAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-900 bg-slate-900/60 text-slate-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full text-xs font-bold py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-1.5"
                >
                  Registrar Transacción
                </button>
              </form>

              <button 
                type="button"
                onClick={() => addNotification('success', 'Reporte Contable', 'Se ha preparado un informe tributario de auditoría (PDF) descargable en tu escritorio.')}
                className="w-full mt-6 text-xs font-semibold py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Generar Balance de Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'store' && activeSandboxModule === 'admin-module' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sandbox Header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-violet-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Prueba Interactiva: Despacho & Personal</h2>
                <p className="text-xs text-slate-400">Monitorea y asigna repartidores o diseñadores de arreglos a cada órden.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveSandboxModule(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              ← Volver al Catálogo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Staff List */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Asignaciones en Tiempo Real</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffMembers.map(member => (
                  <div key={member.id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{member.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{member.role}</p>
                      </div>
                      
                      <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded ${
                        member.status === 'En Ruta' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        member.status === 'Preparando' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        member.status === 'Disponible' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {member.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Pedido Vinculado: <strong className="text-slate-300">{member.orderId}</strong></span>
                      <button 
                        onClick={() => {
                          const states = ['Disponible', 'Preparando', 'En Ruta', 'Descanso'];
                          const next = states[(states.indexOf(member.status) + 1) % states.length];
                          setStaffMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: next } : m));
                          addNotification('info', 'Actualización de Personal', `${member.name} cambió su estado operacional a: ${next.toUpperCase()}`);
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        Alternar Estado
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanatory manual */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Asistente Logístico de Despachos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta característica conecta a tus floristas y transportistas de delivery con un panel dedicado.
                </p>
                
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 text-indigo-400 mt-0.5">✓</div>
                    <p>Notificaciones push SMS / WhatsApp automáticas para el cliente cuando el repartidor inicia la ruta.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 text-indigo-400 mt-0.5">✓</div>
                    <p>Confirmación física fotográfica en el punto de entrega vinculada a la base de datos Supabase.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/40 text-[11px] text-slate-400 leading-relaxed">
                <UserCheck className="h-4.5 w-4.5 text-indigo-400 inline mr-2 mb-0.5" />
                Habilita este módulo de logística para optimizar las rutas y reducir en hasta un 35% los reclamos por demoras en envíos.
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'store' && activeSandboxModule === 'analytics-module' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sandbox Header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Prueba Interactiva: Inteligencia y Estadísticas</h2>
                <p className="text-xs text-slate-400">Previsiones de venta inteligentes basadas en datos históricos de tus arreglos florales.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveSandboxModule(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              ← Volver al Catálogo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top items chart */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-200">Productos con Mayor Rotación (Este Mes)</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Ramo de 24 Rosas Rojas</span>
                    <span className="font-bold text-white font-mono">48 Órdenes ($2,160)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800/60">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Arreglo Imperial de Girasoles</span>
                    <span className="font-bold text-white font-mono">32 Órdenes ($1,920)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800/60">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Cesta de Tulipanes Mixtos</span>
                    <span className="font-bold text-white font-mono">18 Órdenes ($990)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800/60">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" style={{ width: '35%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Caja de Rosas Arcoiris</span>
                    <span className="font-bold text-white font-mono">12 Órdenes ($660)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800/60">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Predictor Panel */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Previsión Algorítmica</h3>
                
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/40 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Proyección Día de las Madres</span>
                  <p className="text-xs text-slate-300">
                    El sistema proyecta un incremento de demanda botánica de un <strong className="text-emerald-400">420%</strong>. Se aconseja pre-ordenar inventario con 12 días de anticipación.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/40 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Hora Pico de Pedidos</span>
                  <p className="text-xs text-slate-300">
                    Las <strong>10:00 AM - 12:30 PM</strong> agrupan el 65% de la carga operativa de ensamble diario.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => addNotification('success', 'Inteligencia de Negocio', 'Informe demográfico de clientes generado con éxito.')}
                className="w-full text-xs font-semibold py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all mt-6"
              >
                Analizar Tiempos de Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WIZARD SETUP TAB */}
      {currentTab === 'wizard' && (
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
              <span>CONFIGURACIÓN PASO {wizardStep} DE 3</span>
              <span>{wizardStep === 1 ? 'Selección de Negocio' : wizardStep === 2 ? 'Revisión de Módulos' : 'Plataforma Lista'}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 rounded-full" 
                style={{ width: `${(wizardStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: SELECT VERTICAL */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">¿Cuál es el giro o tipo de tu negocio?</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Elige un perfil para ajustar automáticamente la interfaz, activar campos específicos de datos y pre-cargar platillas de productos óptimas.
                </p>
              </div>

              <div className="space-y-4">
                {BUSINESS_VERTICALS.map(vert => (
                  <label 
                    key={vert.id}
                    onClick={() => setSelectedVertical(vert.id)}
                    className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                      selectedVertical === vert.id 
                        ? 'bg-indigo-950/15 border-indigo-500/40 shadow-md' 
                        : 'bg-slate-900/20 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-900 text-indigo-400">
                      {vert.iconName === 'Flower' ? <Flower className="h-5 w-5" /> : vert.iconName === 'Gift' ? <Gift className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{vert.name}</span>
                        {selectedVertical === vert.id && (
                          <span className="p-1 rounded-full bg-indigo-500/20 text-indigo-400">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{vert.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-900">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  Continuar Asistente <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFY RECOMMENDED MODULES */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Módulos Recomendados Habilitados</h2>
                <p className="text-xs text-slate-400 mt-1">
                  De acuerdo a tu perfil de <strong>"{BUSINESS_VERTICALS.find(v => v.id === selectedVertical)?.name}"</strong>, habilitaremos los siguientes módulos funcionales:
                </p>
              </div>

              <div className="space-y-3.5">
                {APP_MODULES.filter(m => 
                  BUSINESS_VERTICALS.find(v => v.id === selectedVertical)?.recommendedModules.includes(m.id)
                ).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-indigo-950/20 bg-indigo-950/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-900">
                        {getModuleIcon(m.iconName)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-400">{m.description}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                      Se Activará
                    </span>
                  </div>
                ))}

                {/* Modules that will be disabled */}
                {APP_MODULES.filter(m => 
                  !m.isAlwaysActive && !BUSINESS_VERTICALS.find(v => v.id === selectedVertical)?.recommendedModules.includes(m.id)
                ).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-900 bg-slate-900/10 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-900">
                        {getModuleIcon(m.iconName)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-400">{m.description}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
                      Desactivado
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Atrás
                </button>
                <button
                  onClick={handleApplyVertical}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  Aplicar Configuración <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ALL READY */}
          {wizardStep === 3 && (
            <div className="text-center py-6 space-y-6">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <Check className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">¡Configuración Aplicada Exitosamente!</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  La arquitectura del sistema se ha adecuado para el perfil de <strong>"{BUSINESS_VERTICALS.find(v => v.id === selectedVertical)?.name}"</strong>. Los módulos recomendados se han registrado en local.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/40 text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                {selectedVertical === 'florist' ? (
                  <span>Se activaron los formularios botánicos (color/numero de rosas, notas de tarjeta, destinatario). Tu base de datos e interfaz gráfica están optimizadas para la florería.</span>
                ) : (
                  <span>Se han deshabilitado y ocultado de forma limpia las secciones botánicas para una experiencia general optimizada de comercio general. ¡Tu catálogo y flujo ahora lucen limpios!</span>
                )}
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => { setWizardStep(1); setCurrentTab('store'); }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
                >
                  Ir al Administrador de Módulos
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
