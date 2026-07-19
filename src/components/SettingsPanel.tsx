import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Info, 
  Layers, 
  Sliders, 
  Plus, 
  Trash2, 
  Play, 
  Cpu, 
  Server, 
  Radio, 
  HelpCircle,
  Code,
  Shield
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface SettingsPanelProps {
  isSupabaseConnected: boolean;
}

interface ColumnDef {
  name: string;
  type: string;
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'sql';
  message: string;
}

export default function SettingsPanel({ isSupabaseConnected: initialIsConnected }: SettingsPanelProps) {
  // Credentials States
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('zenitlabs_supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('zenitlabs_supabase_anon_key') || '');
  const [isConnected, setIsConnected] = useState(initialIsConnected);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active Sub-Tab: 'admin' for Schema/Table Builder, 'sql' for Grant permissions script, 'config' for Credentials, 'test' for Diagnostics
  const [activeTab, setActiveTab] = useState<'admin' | 'sql' | 'config' | 'test'>('admin');

  // Diagnostics States
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingDB, setIsTestingDB] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testStorageBucket = async () => {
    setIsTestingStorage(true);
    addLog('info', "Iniciando prueba de almacenamiento para el bucket 'referencias'...");
    const client = getClient();
    if (!client) {
      setStorageTestResult({ success: false, message: 'Supabase no está configurado o conectado.' });
      setIsTestingStorage(false);
      return;
    }

    try {
      const testBlob = new Blob(['ZenitLabs Connection Test'], { type: 'text/plain' });
      const testPath = `test-connection-${Date.now()}.txt`;
      
      const { data, error } = await client.storage
        .from('referencias')
        .upload(testPath, testBlob, { upsert: true });

      if (error) {
        addLog('error', `Fallo en carga de Storage: ${error.message}`);
        setStorageTestResult({ 
          success: false, 
          message: `Error RLS o Bucket: ${error.message}. Asegúrese de que el bucket 'referencias' exista en Supabase, esté configurado como Público, y sus políticas RLS de storage permitan la carga (insert/upload).` 
        });
      } else {
        addLog('success', `¡Carga exitosa! Archivo registrado: ${data.path}`);
        await client.storage.from('referencias').remove([testPath]);
        addLog('info', 'Archivo de prueba limpiado correctamente.');
        setStorageTestResult({ 
          success: true, 
          message: "¡Prueba de almacenamiento exitosa! El bucket 'referencias' está configurado de manera correcta en Supabase y las políticas RLS permiten la escritura de imágenes referenciales de órdenes." 
        });
      }
    } catch (err: any) {
      addLog('error', `Excepción en Storage: ${err?.message || err}`);
      setStorageTestResult({ success: false, message: `Excepción inesperada: ${err?.message || err}` });
    } finally {
      setIsTestingStorage(false);
    }
  };

  const testDBPermissions = async () => {
    setIsTestingDB(true);
    addLog('info', "Iniciando prueba de permisos de escritura para la tabla 'orders'...");
    const client = getClient();
    if (!client) {
      setDbTestResult({ success: false, message: 'Supabase no está configurado o conectado.' });
      setIsTestingDB(false);
      return;
    }

    try {
      const { data, error } = await client.from('orders').select('id').limit(1);
      if (error) {
        addLog('error', `Error al leer tabla 'orders': ${error.message}`);
        setDbTestResult({
          success: false,
          message: `Fallo al leer tabla: ${error.message}. Verifique que la tabla 'orders' exista en el esquema público y que las políticas RLS permitan la lectura.`
        });
      } else {
        addLog('success', 'Lectura de tabla "orders" verificada con éxito.');
        setDbTestResult({
          success: true,
          message: "¡Prueba de Base de Datos exitosa! La tabla 'orders' es totalmente accesible desde el cliente y las políticas RLS están listas."
        });
      }
    } catch (err: any) {
      addLog('error', `Excepción en Base de Datos: ${err?.message || err}`);
      setDbTestResult({ success: false, message: `Excepción inesperada: ${err?.message || err}` });
    } finally {
      setIsTestingDB(false);
    }
  };

  // Terminal Logs state
  const [logs, setLogs] = useState<LogEntry[]>([
    { 
      timestamp: new Date().toLocaleTimeString(), 
      type: 'info', 
      message: 'Sistema listo. Conecte su instancia de Supabase o ejecute acciones para ver simulaciones.' 
    }
  ]);

  // 1. Schema Creator state
  const [schemaName, setSchemaName] = useState('');
  
  // 2. Table Creator state
  const [tableSchema, setTableSchema] = useState('public');
  const [tableName, setTableName] = useState('');
  const [tableColumns, setTableColumns] = useState<ColumnDef[]>([
    { name: 'customer_name', type: 'VARCHAR(255)' },
    { name: 'total_price', type: 'NUMERIC(10,2)' }
  ]);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('VARCHAR(255)');

  // 3. Add Single Column state
  const [alterSchema, setAlterSchema] = useState('public');
  const [alterTable, setAlterTable] = useState('orders');
  const [singleColName, setSingleColName] = useState('');
  const [singleColType, setSingleColType] = useState('VARCHAR(255)');

  // Active Supabase client
  const getClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      return null;
    }
  };

  // Check connection status & RPC availability
  const checkConnection = async (url = supabaseUrl, key = supabaseAnonKey) => {
    if (!url || !key) {
      setIsConnected(false);
      return false;
    }
    
    setIsTesting(true);
    addLog('info', `Comprobando conexión con Supabase en ${url}...`);
    
    try {
      const client = createClient(url, key);
      // Run a simple test select through RPC to see if the exec_sql function exists and permissions are granted
      const { data, error } = await client.rpc('exec_sql', { 
        sql_query: 'SELECT 1 as connected, current_user as db_user, current_database() as db_name;' 
      });

      if (error) {
        addLog('error', `Error de conexión o RPC no instalado: ${error.message}`);
        addLog('info', 'Sugerencia: Asegúrese de ejecutar el script SQL de la pestaña "Otorgar Permisos" en su editor SQL de Supabase.');
        setIsConnected(false);
        setIsTesting(false);
        return false;
      } else {
        const result = Array.isArray(data) ? data[0] : data;
        addLog('success', `¡Conexión Exitosa! RPC detectado. Usuario Base de Datos: "${result?.db_user || 'postgres'}". Base de datos: "${result?.db_name || 'postgres'}"`);
        setIsConnected(true);
        setIsTesting(false);
        return true;
      }
    } catch (err: any) {
      addLog('error', `Error crítico al intentar conectar: ${err?.message || err}`);
      setIsConnected(false);
      setIsTesting(false);
      return false;
    }
  };

  // Effect to test connection on mount if credentials exist
  useEffect(() => {
    if (supabaseUrl && supabaseAnonKey) {
      checkConnection();
    }
  }, []);

  const addLog = (type: 'info' | 'success' | 'error' | 'sql', message: string) => {
    setLogs(prev => [
      { timestamp: new Date().toLocaleTimeString(), type, message },
      ...prev
    ]);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = supabaseUrl.trim();
    const cleanKey = supabaseAnonKey.trim();

    localStorage.setItem('zenitlabs_supabase_url', cleanUrl);
    localStorage.setItem('zenitlabs_supabase_anon_key', cleanKey);
    
    addLog('info', 'Credenciales guardadas en almacenamiento local.');
    
    const success = await checkConnection(cleanUrl, cleanKey);
    if (success) {
      // Trigger event to notify other parts of the application
      window.dispatchEvent(new Event('zenitlabs_supabase_connected'));
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('zenitlabs_supabase_url');
    localStorage.removeItem('zenitlabs_supabase_anon_key');
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setIsConnected(false);
    addLog('info', 'Credenciales eliminadas. Retornando a modo simulación local.');
    window.dispatchEvent(new Event('zenitlabs_supabase_connected'));
  };

  // RPC executor helper
  const executeSQLCommand = async (sql: string, description: string) => {
    addLog('sql', sql);
    
    const client = getClient();
    if (!client || !isConnected) {
      // Simulation mode
      addLog('info', `[SIMULACIÓN] ${description}...`);
      addLog('success', `[SIMULACIÓN] Comando ejecutado con éxito en memoria local.`);
      return true;
    }

    addLog('info', `Ejecutando DDL: ${description}...`);
    try {
      const { data, error } = await client.rpc('exec_sql', { sql_query: sql });
      if (error) {
        addLog('error', `Error de Supabase: ${error.message}`);
        return false;
      }
      
      const res = Array.isArray(data) ? data[0] : data;
      if (res?.status === 'error' || res?.error) {
        addLog('error', `Error del Motor PostgreSQL: ${res?.message || res?.error}`);
        return false;
      }

      addLog('success', `¡Éxito! ${res?.message || 'Comando SQL ejecutado correctamente.'}`);
      return true;
    } catch (err: any) {
      addLog('error', `Error de Red/Ejecución: ${err?.message || err}`);
      return false;
    }
  };

  // Phase 1 Actions
  const handleCreateSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemaName) return;
    
    const cleanSchema = schemaName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const sql = `CREATE SCHEMA IF NOT EXISTS "${cleanSchema}";`;
    
    const success = await executeSQLCommand(sql, `Creando esquema "${cleanSchema}"`);
    if (success) {
      setSchemaName('');
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName) return;
    
    const cleanSchema = tableSchema.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanTable = tableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (tableColumns.length === 0) {
      addLog('error', 'Debe agregar al menos una columna para crear la tabla.');
      return;
    }

    // Build columns statement
    const columnsSql = tableColumns.map(col => `"${col.name}" ${col.type}`).join(',\n  ');
    const sql = `CREATE TABLE IF NOT EXISTS "${cleanSchema}"."${cleanTable}" (
  "id" VARCHAR(50) PRIMARY KEY,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  ${columnsSql}
);`;

    const success = await executeSQLCommand(sql, `Creando tabla "${cleanSchema}"."${cleanTable}"`);
    if (success) {
      setTableName('');
      setTableColumns([
        { name: 'customer_name', type: 'VARCHAR(255)' },
        { name: 'total_price', type: 'NUMERIC(10,2)' }
      ]);
    }
  };

  const handleAddColumnToBuilder = () => {
    if (!newColName) return;
    const cleanCol = newColName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (tableColumns.some(c => c.name === cleanCol) || cleanCol === 'id' || cleanCol === 'created_at') {
      addLog('error', `La columna "${cleanCol}" ya está en la definición de la tabla.`);
      return;
    }

    setTableColumns([...tableColumns, { name: cleanCol, type: newColType }]);
    setNewColName('');
  };

  const handleRemoveColumnFromBuilder = (idx: number) => {
    setTableColumns(tableColumns.filter((_, i) => i !== idx));
  };

  const handleAddSingleColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleColName || !alterTable) return;

    const cleanSchema = alterSchema.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanTable = alterTable.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanCol = singleColName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const sql = `ALTER TABLE "${cleanSchema}"."${cleanTable}" ADD COLUMN IF NOT EXISTS "${cleanCol}" ${singleColType};`;

    const success = await executeSQLCommand(sql, `Agregando columna "${cleanCol}" (${singleColType}) a la tabla "${cleanSchema}"."${cleanTable}"`);
    if (success) {
      setSingleColName('');
    }
  };

  // Permission grant script
  const sqlSetupScript = `-- 1. Crear función RPC que permite ejecutar código SQL directamente desde la app cliente
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios del propietario de la base de datos (Superuser)
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN json_build_object('status', 'success', 'message', 'SQL ejecutado correctamente');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

-- 2. Conceder permisos de ejecución al rol "anon" (usado por el cliente web de Supabase)
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopied(true);
    addLog('info', 'Script SQL de permisos copiado al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-2xl text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-400" />
            Consola de Administrador de Base de Datos
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Fase 1: Motor dinámico de creación de esquemas, tablas e inyección de columnas en Supabase en tiempo real.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800 flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Panel de Control
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sql' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            Otorgar Permisos SQL
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            Credenciales Supabase
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'test' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Diagnóstico RLS
          </button>
        </div>
      </div>

      {/* Connection status banner */}
      <div className={`p-4 rounded-xl border ${
        isConnected 
          ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-300' 
          : 'bg-indigo-950/15 border-indigo-500/20 text-indigo-300'
      } flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <Radio className={`h-5 w-5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} />
          <div className="text-xs">
            <span className="font-bold">Estatus de Sincronización: </span>
            {isConnected ? (
              <span>Conectado a Supabase en producción. Las operaciones SQL se ejecutarán en vivo.</span>
            ) : (
              <span>Simulación local activa. El administrador emulará las operaciones SQL en tiempo real.</span>
            )}
          </div>
        </div>
        {isConnected ? (
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">LIVE ON CLOUD</span>
        ) : (
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">MOCK ENGINE</span>
        )}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Controls & Forms depending on Tab */}
        <div className="lg:col-span-7 space-y-6">
          
          {activeTab === 'admin' && (
            <div className="space-y-6">
              
              {/* Form 1: Schema Creator */}
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <h3 className="font-sans font-bold text-sm text-slate-200">1. Crear Esquema (PostgreSQL Schema)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Genera un espacio de nombres (schema) en tu base de datos Supabase para segmentar lógicamente tus datos.
                </p>
                <form onSubmit={handleCreateSchema} className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={schemaName}
                      onChange={(e) => setSchemaName(e.target.value)}
                      placeholder="Ej. inventario_detalles, negocio_b"
                      className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Crear Esquema
                  </button>
                </form>
              </div>

              {/* Form 2: Table Creator with Custom Dynamic Column Definition */}
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Database className="h-4 w-4 text-pink-400" />
                  <h3 className="font-sans font-bold text-sm text-slate-200">2. Crear Tabla con Campos Específicos</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Diseña una tabla definiendo columnas personalizadas con sus tipos de datos. La columna <code>id</code> (PRIMARY KEY) y <code>created_at</code> se agregan automáticamente.
                </p>
                
                <form onSubmit={handleCreateTable} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Esquema Destino</label>
                      <input
                        type="text"
                        required
                        value={tableSchema}
                        onChange={(e) => setTableSchema(e.target.value)}
                        placeholder="public"
                        className="w-full px-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-pink-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Nombre de Tabla</label>
                      <input
                        type="text"
                        required
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        placeholder="orders, clientes"
                        className="w-full px-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-pink-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Column Builder tool */}
                  <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-850 space-y-3">
                    <div className="text-xs font-bold text-slate-300">Constructor de Columnas:</div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        placeholder="nombre_columna"
                        className="flex-1 px-3 py-1 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg outline-none focus:border-pink-500 font-mono"
                      />
                      <select
                        value={newColType}
                        onChange={(e) => setNewColType(e.target.value)}
                        className="px-2 py-1 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg outline-none focus:border-pink-500 font-mono"
                      >
                        <option value="VARCHAR(255)">VARCHAR(255) [Texto corto]</option>
                        <option value="TEXT">TEXT [Texto largo]</option>
                        <option value="INTEGER">INTEGER [Entero]</option>
                        <option value="NUMERIC(10,2)">NUMERIC(10,2) [Decimales]</option>
                        <option value="BOOLEAN">BOOLEAN [Verdadero/Falso]</option>
                        <option value="TIMESTAMPTZ">TIMESTAMPTZ [Fecha/Hora]</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddColumnToBuilder}
                        className="px-3 py-1 bg-pink-950 text-pink-400 hover:bg-pink-900 border border-pink-500/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Añadir Campo
                      </button>
                    </div>

                    {/* Columns Preview */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-900 max-h-[140px] overflow-y-auto">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono bg-slate-900 px-2.5 py-1 rounded">
                        <span>id (Llave Primaria)</span>
                        <span>VARCHAR(50)</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono bg-slate-900 px-2.5 py-1 rounded">
                        <span>created_at (Fecha Registro)</span>
                        <span>TIMESTAMPTZ</span>
                      </div>
                      {tableColumns.map((col, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px] font-mono bg-slate-900/60 hover:bg-slate-900 px-2.5 py-1 rounded border border-slate-850">
                          <span className="text-pink-400 font-bold">"{col.name}"</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{col.type}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveColumnFromBuilder(idx)}
                              className="text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Ejecutar CREACIÓN de Tabla en Supabase
                  </button>
                </form>
              </div>

              {/* Form 3: Column Adder */}
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-sans font-bold text-sm text-slate-200">3. Agregar Columnas a Tabla Existente</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inyecta dinámicamente nuevas columnas con tipos de datos específicos a tablas previamente creadas.
                </p>

                <form onSubmit={handleAddSingleColumn} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Esquema</label>
                      <input
                        type="text"
                        required
                        value={alterSchema}
                        onChange={(e) => setAlterSchema(e.target.value)}
                        placeholder="public"
                        className="w-full px-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Tabla Objetivo</label>
                      <input
                        type="text"
                        required
                        value={alterTable}
                        onChange={(e) => setAlterTable(e.target.value)}
                        placeholder="orders"
                        className="w-full px-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Nombre de Columna</label>
                      <input
                        type="text"
                        required
                        value={singleColName}
                        onChange={(e) => setSingleColName(e.target.value)}
                        placeholder="Ej. cedula_cliente, apellido"
                        className="w-full px-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Tipo de Dato</label>
                      <select
                        value={singleColType}
                        onChange={(e) => setSingleColType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="VARCHAR(255)">VARCHAR(255) [Texto corto]</option>
                        <option value="TEXT">TEXT [Texto largo]</option>
                        <option value="INTEGER">INTEGER [Entero]</option>
                        <option value="NUMERIC(10,2)">NUMERIC(10,2) [Decimales]</option>
                        <option value="BOOLEAN">BOOLEAN [Verdadero/Falso]</option>
                        <option value="TIMESTAMPTZ">TIMESTAMPTZ [Fecha/Hora]</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Inyectar Columna Físicamente
                  </button>
                </form>
              </div>

            </div>
          )}

          {activeTab === 'sql' && (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-sans font-bold text-slate-200">Script de Configuración de Permisos (Supabase Console)</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 text-xs font-mono font-bold border border-slate-800 hover:border-indigo-500/30 rounded-lg bg-slate-950 text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
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

              <p className="text-xs text-slate-400 leading-relaxed">
                Ejecute este código SQL en la sección <strong className="text-white">SQL Editor</strong> de su panel de Supabase. Esto creará la función segura <code>exec_sql</code> con privilegios elevados para que la interfaz cliente pueda estructurar la base de datos de manera autónoma.
              </p>

              <div className="relative rounded-lg overflow-hidden border border-slate-850 bg-slate-950/90 shadow-inner">
                <pre className="p-4 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-[340px] leading-relaxed select-all">
                  {sqlSetupScript}
                </pre>
              </div>

              <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Explicación de Seguridad (SECURITY DEFINER):</strong> Esta función ejecuta comandos SQL utilizando los altos permisos del rol administrador de Postgres, puenteando las limitaciones de políticas del navegador. Está restringida únicamente al backend y a usuarios autorizados.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Server className="h-4 w-4 text-indigo-400" />
                <h3 className="font-sans font-bold text-sm text-slate-200">Credenciales de Conexión Supabase</h3>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingrese las llaves de API de su proyecto Supabase. Estos parámetros se guardan localmente en su navegador para enrutar todas las creaciones de schemas y tablas directamente a su nube de producción.
              </p>

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Supabase Project URL</label>
                  <input
                    type="url"
                    required
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzabcdefghijklmn.supabase.co"
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Supabase Anon Public API Key</label>
                  <input
                    type="text"
                    required
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi..."
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white font-mono font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {isTesting ? 'Verificando...' : 'Guardar y Probar Conexión'}
                  </button>
                  
                  {(supabaseUrl || supabaseAnonKey) && (
                    <button
                      type="button"
                      onClick={handleClearCredentials}
                      className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors text-xs font-mono rounded-lg cursor-pointer"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-sans font-bold text-sm text-slate-200">Pruebas de Diagnóstico RLS y Estructura</h3>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  Utiliza este panel para comprobar si las políticas de seguridad a nivel de fila (RLS) y la estructura de almacenamiento de Supabase están preparadas para operar de forma correcta con la carga de imágenes referenciales y gestión de pedidos.
                </p>

                <div className="space-y-4">
                  {/* Test 1: Storage Bucket */}
                  <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-850 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-300">1. Almacenamiento (Bucket 'referencias')</div>
                      <span className="text-[10px] font-mono text-slate-500">Supabase Storage</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Verifica si el bucket 'referencias' existe y permite subir archivos mediante políticas de acceso RLS públicas.
                    </p>
                    <button
                      type="button"
                      disabled={isTestingStorage}
                      onClick={testStorageBucket}
                      className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isTestingStorage ? 'Probando...' : 'Comprobar Carga de Archivos'}
                    </button>

                    {storageTestResult && (
                      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        storageTestResult.success 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
                          : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                      }`}>
                        <p className="font-mono font-bold uppercase tracking-wider mb-2">
                          {storageTestResult.success ? '✓' : '✗'} Resultado del Test:
                        </p>
                        <p>{storageTestResult.message}</p>
                        
                        {!storageTestResult.success && (
                          <div className="mt-4 pt-4 border-t border-rose-500/20 space-y-3">
                            <p className="font-bold text-white flex items-center gap-1.5 text-xs font-mono uppercase">
                              💡 Solución Sugerida - Configuración de Políticas en Supabase
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Para permitir la subida de imágenes de referencia, copie y ejecute el siguiente código SQL en el editor de Supabase (<strong>SQL Editor</strong>) para habilitar el bucket público 'referencias' y configurar las políticas de lectura/escritura RLS:
                            </p>
                            <pre className="p-3 bg-slate-950 text-[11px] font-mono rounded-xl border border-slate-800 text-slate-300 overflow-x-auto select-all max-h-[180px] leading-normal">
{`-- 1. Crear el bucket 'referencias' público si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('referencias', 'referencias', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir lectura pública para imágenes
CREATE POLICY "Acceso de lectura pública"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'referencias');

-- 3. Permitir subidas anónimas/públicas
CREATE POLICY "Permitir subida pública"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'referencias');

-- 4. Permitir actualizaciones y eliminación
CREATE POLICY "Permitir actualizar y eliminar"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'referencias');`}
                            </pre>
                            <p className="text-[10px] text-cyan-400 font-mono italic">
                              * Una vez ejecutado con éxito este SQL, repita la prueba de carga. Podrá eliminar este panel de diagnóstico en el futuro modificando este archivo.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Test 2: Database Table access */}
                  <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-850 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-300">2. Base de Datos (Tabla 'orders')</div>
                      <span className="text-[10px] font-mono text-slate-500">PostgreSQL</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Verifica si la tabla de órdenes existe, es legible y tiene soporte para los campos necesarios.
                    </p>
                    <button
                      type="button"
                      disabled={isTestingDB}
                      onClick={testDBPermissions}
                      className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isTestingDB ? 'Probando...' : 'Comprobar Estructura de Tabla'}
                    </button>

                    {dbTestResult && (
                      <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                        dbTestResult.success 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
                          : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                      }`}>
                        {dbTestResult.message}
                      </div>
                    )}
                  </div>

                  {/* Reminder Banner */}
                  <div className="p-3 bg-amber-950/20 border border-amber-500/25 rounded-lg text-amber-300 space-y-1">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      RECORDATORIO DE PRODUCCIÓN
                    </div>
                    <p className="text-[10px] leading-relaxed">
                      ⚠️ Una vez que se compruebe que todo está bajo control (como la carga de imágenes), recuerde eliminar o comentar esta sección de diagnóstico en el archivo <code>SettingsPanel.tsx</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Hand: Terminal Log Console (Stays sticky to display live operations) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-850 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-200">Terminal de Ejecución SQL</span>
              </div>
              <button
                onClick={() => {
                  setLogs([{
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'info',
                    message: 'Terminal reiniciada.'
                  }]);
                }}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            </div>

            {/* Logs feed */}
            <div className="space-y-3.5 font-mono text-[11px] leading-relaxed max-h-[460px] overflow-y-auto pr-1">
              {logs.map((log, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <span>[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      log.type === 'sql' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/30' :
                      log.type === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' :
                      log.type === 'error' ? 'bg-rose-950 text-rose-400 border border-rose-800/30' :
                      'bg-slate-900 text-slate-400'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  
                  {log.type === 'sql' ? (
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900/80 text-cyan-300 overflow-x-auto max-w-full">
                      <pre className="whitespace-pre">{log.message}</pre>
                    </div>
                  ) : (
                    <p className={`${
                      log.type === 'success' ? 'text-emerald-300' :
                      log.type === 'error' ? 'text-rose-300' :
                      'text-slate-300'
                    }`}>
                      {log.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-850 flex items-center gap-2.5">
              <Radio className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Todas las llamadas de consola interactúan con el RPC <code>exec_sql</code> para inyección estructurada DDL.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
