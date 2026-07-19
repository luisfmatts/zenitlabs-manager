import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Check, 
  Trash2,
  AlertCircle,
  Gift,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  Store,
  Image,
  Upload,
  Loader2,
  Lock,
  Sparkles,
  Clipboard
} from 'lucide-react';
import { PRODUCTS, generateRandomOrder } from '../utils/mockData';
import { Order, OrderItem, OrderPriority } from '../types';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabaseClient';

interface NewOrderFormProps {
  onAddOrder: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
  orderToEdit?: Order | null;
  setActiveTab: (tab: string) => void;
  isFloristryEnabled?: boolean;
  addNotification?: (
    type: 'info' | 'success' | 'warning' | 'error', 
    title: string, 
    message: string, 
    orderId?: string
  ) => void;
  exchangeState?: {
    usd_bcv: number;
    eur_bcv: number;
    binance: number;
    lastUpdated: string;
    loading: boolean;
    isMock: boolean;
  };
}

// Phone Number formatting helper
const formatPhone = (val: string) => {
  const clean = val.replace(/\D/g, '');
  if (clean.length === 0) return '';
  if (clean.length <= 4) {
    return clean;
  }
  if (clean.length <= 11) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return `+${clean.slice(0, 2)} ${clean.slice(2, 6)}-${clean.slice(6, 13)}`;
};

export default function NewOrderForm({ 
  onAddOrder, 
  onUpdateOrder,
  orderToEdit,
  setActiveTab, 
  isFloristryEnabled = true,
  addNotification,
  exchangeState = {
    usd_bcv: 42.15,
    eur_bcv: 45.40,
    binance: 44.90,
    lastUpdated: '',
    loading: false,
    isMock: true,
  }
}: NewOrderFormProps) {
  
  // 1. Core Fields
  const [nombreCliente, setNombreCliente] = useState('');
  const [generoCliente, setGeneroCliente] = useState('Mujer');
  const [nroCliente, setNroCliente] = useState('');
  const [pedido, setPedido] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [precioFacturado, setPrecioFacturado] = useState<number>(0);
  const [deliveryFacturado, setDeliveryFacturado] = useState<number>(0);

  // 2. Payments & Rates
  const [metodoPago, setMetodoPago] = useState('Pago Móvil');
  const [tasaDeCambioT, setTasaDeCambioT] = useState('Euro BCV');
  const [tasaDeCambioV, setTasaDeCambioV] = useState<number>(exchangeState.eur_bcv || 45.40);

  // 3. Toggles
  const [partialPay, setPartialPay] = useState(false);
  const [entregaTienda, setEntregaTienda] = useState(false);
  const [entregaSorpresa, setEntregaSorpresa] = useState(false);

  // 4. Conditional Fields
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [nombreReceptor, setNombreReceptor] = useState('');
  const [tlfReceptor, setTlfReceptor] = useState('');

  // 5. Additional Info
  const [personalizacion, setPersonalizacion] = useState('');
  const [notaEntrega, setNotaEntrega] = useState('');
  const [dedicatoria, setDedicatoria] = useState('');
  const [priority, setPriority] = useState<OrderPriority>('medium');

  // 6. Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [imageRef, setImageRef] = useState('');
  const [imageName, setImageName] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // 7. Cart / Inventory selection helper state
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  
  // Validation & feedback
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);

  const isEditMode = !!orderToEdit;

  // Sync with orderToEdit if in edit mode
  useEffect(() => {
    if (orderToEdit) {
      setNombreCliente(orderToEdit.customer_name || '');
      setGeneroCliente(orderToEdit.generoCliente || 'Mujer');
      setNroCliente(orderToEdit.customer_phone || orderToEdit.nroCliente || '');
      setPedido(orderToEdit.pedido || '');
      setFechaEntrega(orderToEdit.fechaEntrega || '');
      setHoraEntrega(orderToEdit.horaEntrega || '');
      setPrecioFacturado(orderToEdit.precioFacturado !== undefined ? orderToEdit.precioFacturado : orderToEdit.total_price);
      setDeliveryFacturado(orderToEdit.deliveryFacturado || 0);
      setMetodoPago(orderToEdit.metodoPago || 'Pago Móvil');
      setTasaDeCambioT(orderToEdit.tasaDeCambioT || 'Euro BCV');
      setTasaDeCambioV(orderToEdit.tasaDeCambioV ? Number(orderToEdit.tasaDeCambioV.toFixed(2)) : Number((exchangeState.eur_bcv || 45.40).toFixed(2)));
      setPartialPay(!!orderToEdit.partialPay);
      setEntregaTienda(!!orderToEdit.entregaTienda);
      setEntregaSorpresa(!!orderToEdit.entregaSorpresa);
      setDireccionEntrega(orderToEdit.direccionEntrega || orderToEdit.delivery_address || '');
      setNombreReceptor(orderToEdit.nombreReceptor || '');
      setTlfReceptor(orderToEdit.tlfReceptor || '');
      setPersonalizacion(orderToEdit.personalizacion || orderToEdit.notes || '');
      setNotaEntrega(orderToEdit.notaEntrega || '');
      setDedicatoria(orderToEdit.dedicatoria || '');
      setPriority(orderToEdit.priority || 'medium');
      setImageRef(orderToEdit.imageRef || '');
      setImageName(orderToEdit.imageRef ? 'imagen_existente.jpg' : '');
      setImagePreviewUrl('');
      setSelectedImageFile(null);
    } else {
      setNombreCliente('');
      setGeneroCliente('Mujer');
      setNroCliente('');
      setPedido('');
      setFechaEntrega('');
      setHoraEntrega('');
      setPrecioFacturado(0);
      setDeliveryFacturado(0);
      setMetodoPago('Pago Móvil');
      setTasaDeCambioT('Euro BCV');
      setTasaDeCambioV(Number((exchangeState.eur_bcv || 45.40).toFixed(2)));
      setPartialPay(false);
      setEntregaTienda(false);
      setEntregaSorpresa(false);
      setDireccionEntrega('');
      setNombreReceptor('');
      setTlfReceptor('');
      setPersonalizacion('');
      setNotaEntrega('');
      setDedicatoria('');
      setPriority('medium');
      setImageRef('');
      setImageName('');
      setImagePreviewUrl('');
      setSelectedImageFile(null);
      setCart({});
    }
  }, [orderToEdit, exchangeState]);

  // Sync tasaDeCambioV automatically with global exchangeState and tasaDeCambioT selection
  useEffect(() => {
    if (tasaDeCambioT === 'Euro BCV') {
      setTasaDeCambioV(Number((exchangeState.eur_bcv || 45.40).toFixed(2)));
    } else if (tasaDeCambioT === 'Dólar BCV') {
      setTasaDeCambioV(Number((exchangeState.usd_bcv || 42.15).toFixed(2)));
    } else if (tasaDeCambioT === 'Binance') {
      setTasaDeCambioV(Number((exchangeState.binance || 44.90).toFixed(2)));
    }
  }, [tasaDeCambioT, exchangeState]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        try {
          URL.revokeObjectURL(imagePreviewUrl);
        } catch (e) {}
      }
    };
  }, [imagePreviewUrl]);

  // Synchronize cart items with plain text "pedido" description
  useEffect(() => {
    const selectedItems: string[] = [];
    Object.keys(cart).forEach((id) => {
      const qty = cart[id] || 0;
      if (qty > 0) {
        const product = PRODUCTS.find(p => p.id === id);
        if (product) {
          selectedItems.push(`${qty}x ${product.name}`);
        }
      }
    });

    if (selectedItems.length > 0) {
      setPedido(selectedItems.join(', '));
      
      // Auto-calculate total price of selected inventory items
      let total = 0;
      Object.keys(cart).forEach((id) => {
        const qty = cart[id] || 0;
        const prod = PRODUCTS.find(p => p.id === id);
        if (prod) {
          total += prod.price * qty;
        }
      });
      setPrecioFacturado(total);
    }
  }, [cart]);

  // Dynamic Bolivares Calculator (Pago Móvil Only)
  const bolivaresCost = useMemo(() => {
    if (metodoPago !== 'Pago Móvil') return null;
    const totalDollars = Number(precioFacturado || 0) + Number(deliveryFacturado || 0);
    const rate = Number(tasaDeCambioV || 0);
    const rawCost = totalDollars * rate;
    
    return partialPay ? rawCost * 0.5 : rawCost;
  }, [metodoPago, precioFacturado, deliveryFacturado, tasaDeCambioV, partialPay]);

  // Add Item through Cart Selector
  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  // Set image file locally for delayed upload
  const handleImageFileLocal = (file: File) => {
    setSelectedImageFile(file);
    setImageName(file.name);
    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    } catch (e) {
      console.warn('Could not create object URL', e);
    }
  };

  // Upload image to Supabase Bucket 'referencias' locally
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFileLocal(file);
    }
  };

  // Paste image directly from clipboard locally
  const handleClipboardPaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `copiado-${Date.now()}.png`, { type });
            handleImageFileLocal(file);
            return;
          }
        }
      }
      if (addNotification) {
        addNotification('warning', 'Portapapeles Vacío', 'No se encontró ninguna imagen copiada en su portapapeles. Use Ctrl+V o copie una imagen primero.');
      }
    } catch (err: any) {
      console.warn('Could not read clipboard:', err);
      if (addNotification) {
        addNotification('error', 'Permiso Denegado', 'Asigne permisos para leer el portapapeles en su navegador.');
      }
    }
  };

  // Form Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!nombreCliente.trim()) {
      newErrors.nombreCliente = 'El nombre de cliente es requerido.';
    }
    if (!pedido.trim()) {
      newErrors.pedido = 'Escriba o seleccione los productos del pedido.';
    }
    if (!fechaEntrega) {
      newErrors.fechaEntrega = 'Especifique la fecha de entrega.';
    }
    if (!entregaTienda && !direccionEntrega.trim()) {
      newErrors.direccionEntrega = 'La dirección de entrega es requerida si no es entrega en tienda.';
    }
    if (entregaSorpresa) {
      if (!nombreReceptor.trim()) {
        newErrors.nombreReceptor = 'El nombre de la persona que recibe es requerido en entrega sorpresa.';
      }
      if (!tlfReceptor.trim()) {
        newErrors.tlfReceptor = 'El teléfono del receptor es requerido.';
      }
    }
    if (nroCliente && nroCliente.length > 14) {
      newErrors.nroCliente = 'El número de teléfono no puede exceder los 14 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      if (addNotification) {
        addNotification('warning', 'Validación Incompleta', 'Complete los campos obligatorios del pedido.');
      }
      return;
    }

    setIsUploading(true);
    let finalImageRef = imageRef;

    if (selectedImageFile) {
      if (addNotification) {
        addNotification('info', 'Subiendo Imagen', `Subiendo ${selectedImageFile.name} al bucket de Supabase...`);
      }

      try {
        const client = getSupabaseClient();
        if (!client) {
          // Simulation mode
          const simulatedUrl = `https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=600`;
          finalImageRef = simulatedUrl;
        } else {
          // Upload file to 'referencias' storage bucket
          const fileExt = selectedImageFile.name.split('.').pop() || 'jpg';
          const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
          const filePath = `${uniqueFileName}`;

          const { data, error } = await client.storage
            .from('referencias')
            .upload(filePath, selectedImageFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          // Obtain public url
          const { data: { publicUrl } } = client.storage
            .from('referencias')
            .getPublicUrl(filePath);

          finalImageRef = publicUrl;
        }
        if (addNotification) {
          addNotification('success', 'Imagen Registrada', 'La referencia se subió correctamente al bucket de Supabase.');
        }
      } catch (err: any) {
        console.error('Error uploading to Supabase Storage on submit:', err);
        if (addNotification) {
          addNotification('error', 'Fallo de Carga', `No se pudo guardar la imagen: ${err.message}`);
        }
        setIsUploading(false);
        return; // Prevent adding/updating order if image upload failed
      }
    }

    const idNum = isEditMode && orderToEdit ? orderToEdit.id : `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderItems: OrderItem[] = [];
    
    // Build array of items from selected cart or make a default dummy item matching the string description
    Object.keys(cart).forEach((id) => {
      const qty = cart[id] || 0;
      if (qty > 0) {
        const prod = PRODUCTS.find(p => p.id === id);
        if (prod) {
          orderItems.push({
            id: prod.id,
            name: prod.name,
            quantity: qty,
            price: prod.price
          });
        }
      }
    });

    if (orderItems.length === 0) {
      orderItems.push({
        id: 'manual-item',
        name: pedido.substring(0, 50),
        quantity: 1,
        price: precioFacturado
      });
    }

    const normalizedAddress = entregaTienda 
      ? 'Entrega en Tienda' 
      : (direccionEntrega.trim().startsWith('http') 
         ? direccionEntrega.trim() 
         : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionEntrega.trim())}`);

    const orderPayload: Order = {
      ...orderToEdit,
      id: idNum,
      customer_name: nombreCliente,
      customer_email: orderToEdit?.customer_email || `${nombreCliente.toLowerCase().replace(/\s+/g, '')}@example.com`,
      customer_phone: nroCliente || undefined,
      items: orderItems,
      total_price: precioFacturado,
      status: orderToEdit?.status || 'pending',
      priority: priority,
      created_at: orderToEdit?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      delivery_address: normalizedAddress,
      notes: personalizacion || undefined,

      // Standard and custom attributes synced to database schema
      fechaCreacion: orderToEdit?.fechaCreacion || new Date().toISOString(),
      nombreCliente,
      pedido,
      fechaEntrega,
      horaEntrega,
      nroCliente,
      precioFacturado,
      deliveryFacturado,
      entregaTienda,
      direccionEntrega: normalizedAddress,
      entregaSorpresa,
      metodoPago,
      tasaDeCambioT,
      tasaDeCambioV,
      dedicatoria: dedicatoria || undefined,
      personalizacion: personalizacion || undefined,
      nombreReceptor: entregaSorpresa ? nombreReceptor : undefined,
      tlfReceptor: entregaSorpresa ? tlfReceptor : undefined,
      generoCliente,
      partialPay,
      imageRef: finalImageRef || undefined,
      notaEntrega: notaEntrega || undefined
    };

    if (isEditMode && onUpdateOrder) {
      onUpdateOrder(orderPayload);
    } else {
      onAddOrder(orderPayload);
    }
    
    setSuccess(true);

    if (addNotification) {
      addNotification('success', isEditMode ? 'Pedido Actualizado' : 'Pedido Registrado', isEditMode ? `La orden ${idNum} de ${nombreCliente} fue actualizada con éxito.` : `La orden manual de ${nombreCliente} fue despachada.`);
    }

    // Reset states after brief transition
    setTimeout(() => {
      setNombreCliente('');
      setGeneroCliente('Mujer');
      setNroCliente('');
      setPedido('');
      setFechaEntrega('');
      setHoraEntrega('');
      setPrecioFacturado(0);
      setDeliveryFacturado(0);
      setMetodoPago('Pago Móvil');
      setTasaDeCambioT('Euro BCV');
      setTasaDeCambioV(Number((exchangeState.eur_bcv || 45.40).toFixed(2)));
      setPartialPay(false);
      setEntregaTienda(false);
      setEntregaSorpresa(false);
      setDireccionEntrega('');
      setNombreReceptor('');
      setTlfReceptor('');
      setPersonalizacion('');
      setNotaEntrega('');
      setDedicatoria('');
      setImageRef('');
      setImageName('');
      setImagePreviewUrl('');
      setSelectedImageFile(null);
      setCart({});
      setSuccess(false);
      setIsUploading(false);
      
      // Redirect to backlogs
      setActiveTab('orders');
    }, 1500);
  };

  // Helper: auto-generate structured test order
  const loadDemoData = () => {
    const demo = generateRandomOrder();
    setNombreCliente(demo.customer_name);
    setGeneroCliente(Math.random() > 0.5 ? 'Mujer' : 'Hombre');
    setNroCliente('0412' + Math.floor(1000000 + Math.random() * 9000000));
    setPedido(demo.items.map(it => `${it.quantity}x ${it.name}`).join(', '));
    
    // Set dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFechaEntrega(tomorrow.toISOString().split('T')[0]);
    setHoraEntrega('14:30');
    
    setPrecioFacturado(demo.total_price);
    setDeliveryFacturado(5);
    setMetodoPago('Pago Móvil');
    setTasaDeCambioT('Euro BCV');
    setTasaDeCambioV(exchangeState.eur_bcv || 45.40);
    setDireccionEntrega(demo.delivery_address);
    setPersonalizacion('Variante en tonos pastel con empaque kraft rústico.');
    setNotaEntrega('Entregar por la entrada de servicio.');
    setDedicatoria('¡Feliz aniversario! Gracias por estar a mi lado.');
    setPriority('medium');
    
    const newCart: { [id: string]: number } = {};
    demo.items.forEach(it => {
      newCart[it.id] = it.quantity;
    });
    setCart(newCart);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-slate-200">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-2xl text-white">{isEditMode ? 'Editar pedido' : 'Añadir nuevo pedido'}</h2>
        </div>
        <button
          type="button"
          onClick={loadDemoData}
          className="text-xs text-cyan-400 border border-cyan-800/40 bg-cyan-950/10 hover:bg-cyan-950/30 px-4 py-2.5 rounded-xl transition-all font-mono font-bold cursor-pointer shrink-0"
        >
          Cargar Datos Demo
        </button>
      </div>

      {success ? (
        <div className="p-12 text-center rounded-2xl border border-emerald-500/30 bg-emerald-950/10 max-w-xl mx-auto mt-10">
          <div className="h-14 w-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="font-sans font-bold text-lg text-white">
            {isEditMode ? '¡Pedido Actualizado con Éxito!' : '¡Pedido Registrado con Éxito!'}
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {isEditMode 
              ? 'Los cambios en la orden han sido guardados con éxito en la base de datos.'
              : 'La orden manual ha sido encriptada y transmitida con éxito a Supabase. Redirigiendo al backlog general de ventas...'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Complete structured form */}
          <div className="lg:col-span-12 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-6">
              
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-sans font-bold text-base text-slate-100 flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-cyan-400" />
                  Datos Básicos del Cliente
                </h3>
              </div>

              {/* Row 1: Nombre de cliente & Genero */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1">
                    Nombre del Cliente <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    placeholder="Ej. Sofia Rodriguez"
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                      errors.nombreCliente ? 'border-rose-500/60' : 'border-slate-800'
                    }`}
                  />
                  {errors.nombreCliente && <p className="text-[10px] text-rose-500 font-mono">{errors.nombreCliente}</p>}
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold">
                    Género
                  </label>
                  <select
                    value={generoCliente}
                    onChange={(e) => setGeneroCliente(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                  >
                    <option value="Mujer">Mujer</option>
                    <option value="Hombre">Hombre</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Telefono del cliente con contador max 14 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Teléfono del Cliente
                  </label>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                    nroCliente.length > 14 ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40' : 'bg-slate-950 text-slate-500 border border-slate-850'
                  }`}>
                    {nroCliente.length}/14
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={14}
                  value={nroCliente}
                  onChange={(e) => setNroCliente(formatPhone(e.target.value))}
                  placeholder="Ej. 0412-1234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
                {errors.nroCliente && <p className="text-[10px] text-rose-500 font-mono">{errors.nroCliente}</p>}
              </div>

              {/* Row 3: Pedido plain text description */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1">
                  Descripción del Pedido <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={pedido}
                  onChange={(e) => setPedido(e.target.value)}
                  placeholder="Ej. 12 Rosas Rojas Premium con florero de vidrio..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                    errors.pedido ? 'border-rose-500/60' : 'border-slate-800'
                  }`}
                />
                {errors.pedido && <p className="text-[10px] text-rose-500 font-mono">{errors.pedido}</p>}
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  Tip: Seleccionar o agregar productos desde el catálogo de la derecha sincronizará y actualizará esta descripción automáticamente.
                </p>
              </div>

              {/* Row 4: Fecha & Hora de Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Fecha de Entrega <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className={`w-full h-10 px-3.5 py-2 bg-slate-950 text-slate-200 border text-sm rounded-xl outline-none focus:border-cyan-500 transition-colors ${
                      errors.fechaEntrega ? 'border-rose-500/60' : 'border-slate-800'
                    }`}
                  />
                  {errors.fechaEntrega && <p className="text-[10px] text-rose-500 font-mono">{errors.fechaEntrega}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Hora de Entrega
                  </label>
                  <input
                    type="time"
                    value={horaEntrega}
                    onChange={(e) => setHoraEntrega(e.target.value)}
                    className="w-full h-10 px-3.5 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 5: Montos (Facturado & Delivery) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1">
                    Precio Facturado ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      required
                      min={0}
                      step="0.01"
                      value={precioFacturado || ''}
                      onChange={(e) => setPrecioFacturado(e.target.value ? Number(e.target.value) : 0)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1">
                    Costo Delivery ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={deliveryFacturado || ''}
                      onChange={(e) => setDeliveryFacturado(e.target.value ? Number(e.target.value) : 0)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Metodo de pago & Tasa de Cambio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850 pt-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                  >
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Binance">Binance</option>
                    <option value="Zelle">Zelle</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Wally">Wally</option>
                    <option value="Zinli">Zinli</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold">
                    Tasa de Cambio Referencial
                  </label>
                  <select
                    value={tasaDeCambioT}
                    onChange={(e) => setTasaDeCambioT(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                  >
                    <option value="Euro BCV">Euro BCV</option>
                    <option value="Dólar BCV">Dólar BCV</option>
                    <option value="Binance">Binance</option>
                    <option value="Personalizada">Personalizada</option>
                  </select>
                </div>
              </div>

              {/* Sub-row Rate Input & Bolivares Cost Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold">
                    Valor de Tasa de Cambio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={tasaDeCambioT !== 'Personalizada'}
                    value={tasaDeCambioV}
                    onChange={(e) => setTasaDeCambioV(Number(e.target.value || 0))}
                    className="w-full px-3.5 py-2 bg-slate-950 disabled:bg-slate-900/50 text-slate-200 disabled:text-slate-500 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 font-mono transition-all"
                  />
                </div>

                {/* Bolivares Cost Calculator Display (Pago Movil Only) - Styled nicely, compact */}
                {metodoPago === 'Pago Móvil' && bolivaresCost !== null && (
                  <div className="px-4 py-2 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex flex-col justify-center h-[58px] mt-auto">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-wider">Equivalente en Bolívares</span>
                    <span className="text-sm font-mono font-bold text-white mt-0.5">
                      {partialPay ? '50% en ' : ''}Bs. {bolivaresCost.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Switches Row: Reserva con el 50% & Entrega en Tienda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850 pt-5">
                
                {/* Switch: Reserva con el 50% */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Percent className="h-4 w-4 text-cyan-400" />
                      Reserva con el 50%
                    </span>
                    <span className="text-[10px] text-slate-500">Registra el pedido abonando la mitad</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPartialPay(!partialPay)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      partialPay ? 'bg-cyan-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        partialPay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch: Entrega en tienda */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-pink-400" />
                      Entrega en Tienda
                    </span>
                    <span className="text-[10px] text-slate-500">Ocultar dirección si retiran en local</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEntregaTienda(!entregaTienda)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      entregaTienda ? 'bg-pink-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        entregaTienda ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>

              {/* Conditional address field (Hides if Entrega en Tienda is ON) */}
              {!entregaTienda && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Dirección de Entrega <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required={!entregaTienda}
                    value={direccionEntrega}
                    onChange={(e) => setDireccionEntrega(e.target.value)}
                    placeholder="Ej. Av. Francisco de Miranda, Res. El Parque, Piso 4, Apt 42, Caracas"
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                      errors.direccionEntrega ? 'border-rose-500/60' : 'border-slate-800'
                    }`}
                  />
                  {errors.direccionEntrega && <p className="text-[10px] text-rose-500 font-mono">{errors.direccionEntrega}</p>}
                </div>
              )}

              {/* Switch: Entrega Sorpresa */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between border-t border-slate-850">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Gift className="h-4 w-4 text-purple-400" />
                    ¿Es una Entrega Sorpresa?
                  </span>
                  <span className="text-[10px] text-slate-500">Habilitar campos especiales para receptor anónimo</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEntregaSorpresa(!entregaSorpresa)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    entregaSorpresa ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      entregaSorpresa ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Conditional Receiver Details (Enabled if Entrega Sorpresa is ON) */}
              {entregaSorpresa && (
                <div className="p-4 rounded-xl bg-purple-950/5 border border-purple-900/20 space-y-4 animate-fade-in">
                  <h4 className="text-xs font-mono font-bold text-purple-400 uppercase">Detalles del Destinatario (Sorpresa)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Persona que Recibe <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required={entregaSorpresa}
                        value={nombreReceptor}
                        onChange={(e) => setNombreReceptor(e.target.value)}
                        placeholder="Ej. Sofia Rodriguez"
                        className={`w-full px-3 py-2 bg-slate-950 text-slate-200 border text-sm rounded-xl outline-none focus:border-purple-500 transition-colors ${
                          errors.nombreReceptor ? 'border-rose-500/60' : 'border-slate-800'
                        }`}
                      />
                      {errors.nombreReceptor && <p className="text-[10px] text-rose-500 font-mono">{errors.nombreReceptor}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Nro Tlf de Receptor <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required={entregaSorpresa}
                        value={tlfReceptor}
                        onChange={(e) => setTlfReceptor(formatPhone(e.target.value))}
                        placeholder="Ej. 0424-1234567"
                        className={`w-full px-3 py-2 bg-slate-950 text-slate-200 border text-sm rounded-xl outline-none focus:border-purple-500 transition-colors ${
                          errors.tlfReceptor ? 'border-rose-500/60' : 'border-slate-800'
                        }`}
                      />
                      {errors.tlfReceptor && <p className="text-[10px] text-rose-500 font-mono">{errors.tlfReceptor}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Customizable options & Additional logs */}
              <div className="border-t border-slate-850 pt-5 space-y-4">
                <h3 className="font-sans font-bold text-xs text-slate-300 uppercase font-mono tracking-wider">Detalles Adicionales del Pedido</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-cyan-400" /> Personalización
                    </label>
                    <input
                      type="text"
                      value={personalizacion}
                      onChange={(e) => setPersonalizacion(e.target.value)}
                      placeholder="Ej. Envolver con cinta de raso negra"
                      className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-pink-400" /> Nota de Entrega
                    </label>
                    <input
                      type="text"
                      value={notaEntrega}
                      onChange={(e) => setNotaEntrega(e.target.value)}
                      placeholder="Ej. Entregar antes del mediodía"
                      className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Dedicatoria para Tarjeta de Regalo</label>
                  <textarea
                    rows={2}
                    value={dedicatoria}
                    onChange={(e) => setDedicatoria(e.target.value)}
                    placeholder="Escriba aquí el mensaje emotivo para colocar en la tarjeta física del pedido..."
                    className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 text-sm rounded-xl outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Image Upload section for references bucket */}
              <div className="border-t border-slate-850 pt-5 space-y-4">
                <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                  <Image className="h-4 w-4 text-cyan-400" /> Imagen de Referencia de Flores
                </label>
                
                <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/30 text-center space-y-3 relative">
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2">
                      <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                      <p className="text-xs text-slate-400 font-mono animate-pulse">Guardando archivo en el bucket 'referencias'...</p>
                    </div>
                  ) : (imagePreviewUrl || imageRef) ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="relative">
                        <img 
                          src={imagePreviewUrl || imageRef} 
                          alt="Uploaded reference" 
                          className="h-28 w-28 object-cover rounded-xl border border-slate-800 shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => { setImageRef(''); setImageName(''); setSelectedImageFile(null); setImagePreviewUrl(''); }}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 mt-1">
                        <Check className="h-3 w-3" /> {imageName || 'imagen_cargada.jpg'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      <Upload className="h-8 w-8 text-slate-600" />
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Arrastre o cargue una imagen para el pedido</p>
                      </div>
                      
                      <div className="flex items-center gap-2.5 z-10">
                        <label className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-850 cursor-pointer transition-colors">
                          Seleccionar archivo
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageFileChange}
                            className="hidden" 
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleClipboardPaste}
                          className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-850 text-cyan-400 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                          Pegar Imagen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submission button at the end of form card */}
              <div className="border-t border-slate-850 pt-5">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-violet-600/15 hover:shadow-violet-600/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : isEditMode ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Guardar Cambios</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Añadir Orden</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </form>
      )}
    </div>
  );
}
