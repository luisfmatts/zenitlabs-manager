import React, { useState } from 'react';
import { 
  Database, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { SUPABASE_SQL_SETUP } from '../utils/mockData';

interface SettingsPanelProps {
  isSupabaseConnected: boolean;
}

export default function SettingsPanel({ isSupabaseConnected }: SettingsPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      title: 'Crear Proyecto en Supabase',
      description: 'Inicia sesión en supabase.com y crea un nuevo proyecto de base de datos PostgreSQL.',
    },
    {
      title: 'Crear Tabla y Políticas SQL',
      description: 'Copia el script SQL provisto a la derecha y ejecútalo en la consola de SQL Editor de tu proyecto Supabase. Esto creará la tabla "orders", habilitará Row Level Security (RLS) y activará la replicación en tiempo real.',
    },
    {
      title: 'Configurar Variables de Entorno',
      description: 'Copia la URL del proyecto y la Anon Public API Key. Agrégalas a tu archivo ".env" local usando las claves VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (puedes basarte en el archivo de plantilla ".env.example").',
    },
    {
      title: 'Reiniciar el Servidor de Desarrollo',
      description: 'Una vez guardadas las variables, la aplicación se conectará automáticamente y transicionará del simulador local al almacenamiento en la nube en tiempo real.',
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="font-sans font-bold text-2xl text-white">Configuración del Backend en Tiempo Real</h2>
        <p className="text-sm text-slate-400">Guía de integración con Supabase para habilitar almacenamiento persistente distribuido.</p>
      </div>

      {/* Connection Status Banner */}
      <div className={`p-6 rounded-2xl border ${
        isSupabaseConnected 
          ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-300' 
          : 'bg-purple-950/15 border-purple-500/30 text-purple-300'
      } flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${
            isSupabaseConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
          }`}>
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-white">
              {isSupabaseConnected ? 'Sincronización Cloud Supabase Activa' : 'Ejecutando en Modo Simulación Local (ZenitLabs Engine)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {isSupabaseConnected 
                ? 'La aplicación se encuentra conectada de manera segura con tu instancia de base de datos Supabase. Todas las órdenes, creaciones y mutaciones de estado se transmiten en tiempo real de forma bilateral.' 
                : 'No se detectaron credenciales personalizadas de Supabase válidas en tu entorno. La aplicación está ejecutando un sofisticado motor de simulación local en memoria para que puedas interactuar con todas las capacidades de tiempo real sin configuración previa.'
              }
            </p>
          </div>
        </div>
        
        <div className="shrink-0 flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isSupabaseConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {isSupabaseConnected ? 'ONLINE' : 'SIMULATION'}
          </span>
        </div>
      </div>

      {/* Grid: Instructions vs SQL schema */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Step-by-Step Instructions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-800 space-y-5">
            <h3 className="font-sans font-bold text-base text-slate-200 border-b border-slate-850 pb-2.5 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              Guía de Conexión de Datos
            </h3>

            <div className="space-y-5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 font-mono text-xs text-cyan-400 font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{step.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl border border-slate-850 bg-slate-950/40 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-400">Nota de Seguridad:</span> En cumplimiento con nuestras estrictas directivas de seguridad, las claves de Supabase se procesan exclusivamente del lado del cliente de manera segura y no se exponen externamente.
              </p>
            </div>
          </div>
        </div>

        {/* Right: SQL Editor Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-300">Schema de Base de Datos SQL</span>
              </div>
              
              <button
                id="copy-sql-btn"
                type="button"
                onClick={handleCopySql}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-cyan-500/40 bg-slate-950 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer font-mono"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950/90 shadow-inner">
              <pre className="p-4 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-[380px] leading-relaxed select-all">
                {SUPABASE_SQL_SETUP}
              </pre>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Habilita lectura/escritura RLS</span>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <span>Abrir Supabase Console</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
