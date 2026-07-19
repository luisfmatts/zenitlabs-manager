import React from 'react';
import { LayoutDashboard, ShoppingCart, PlusCircle, Database, Menu, X, Radio, ArrowRightLeft, Wand2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSupabaseConnected: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  orderCount: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isSupabaseConnected,
  isOpen,
  setIsOpen,
  orderCount
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Gestión de Órdenes', icon: ShoppingCart, badge: orderCount },
    { id: 'create', label: 'Nueva Orden', icon: PlusCircle },
    { id: 'database', label: 'Conexión Supabase', icon: Database },
    { id: 'module-store', label: 'Tienda y Asistente', icon: Wand2 },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false); // Close drawer on mobile
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Container */}
      <aside
        id="sidebar-container"
        className={`fixed top-0 bottom-0 left-0 w-72 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="h-20 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/5 p-1.5">
              <img 
                src="https://cdn.prod.website-files.com/68daa376ee2e97c41b60cdd3/68dac75db17af64821b4c9c8_zenitlabs-logo-symbol-color.svg" 
                alt="ZenitLabs Logo" 
                className="h-7 w-7 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-sans font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ZenitLabs
              </span>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                v1.2 Real-time
              </p>
            </div>
          </div>

          <button
            id="close-sidebar-btn"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Real-time Status Badge */}
        <div className="p-4 mx-4 mt-6 rounded-2xl border border-slate-800 bg-slate-800/40 backdrop-blur flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSupabaseConnected ? 'bg-emerald-400' : 'bg-indigo-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isSupabaseConnected ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {isSupabaseConnected ? 'Supabase Conectado' : 'ZenitLabs Engine'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono truncate">
              {isSupabaseConnected ? 'Sincronización cloud activa' : 'Simulando en memoria local'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}-btn`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 rounded-xl'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                      isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile card & Footer */}
        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900">
          <div className="bg-slate-800/50 p-4 rounded-2xl mb-3 border border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-indigo-400 flex items-center justify-center text-xs font-bold text-white">AR</div>
              <div>
                <p className="text-sm font-semibold text-white">Alex Rivera</p>
                <p className="text-xs text-slate-500">Admin Mode</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <ArrowRightLeft className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">Sincronizador ZenitLabs</p>
              <p className="text-[10px] text-slate-500 font-mono">Bilateral • Tiempo real</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
