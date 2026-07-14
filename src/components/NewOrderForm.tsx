import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Check, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { PRODUCTS, generateRandomOrder } from '../utils/mockData';
import { Order, OrderItem, OrderPriority } from '../types';

interface NewOrderFormProps {
  onAddOrder: (order: Order) => void;
  setActiveTab: (tab: string) => void;
}

export default function NewOrderForm({ onAddOrder, setActiveTab }: NewOrderFormProps) {
  // Customer Details State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<OrderPriority>('medium');

  // Cart State (Quantities of products)
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);

  // Compute total price and items count
  const cartTotals = React.useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;
    const selectedItems: OrderItem[] = [];

    Object.keys(cart).forEach((id) => {
      const qty = cart[id] || 0;
      if (qty > 0) {
        const product = PRODUCTS.find(p => p.id === id);
        if (product) {
          totalItems += qty;
          totalPrice += product.price * qty;
          selectedItems.push({
            id: product.id,
            name: product.name,
            quantity: qty,
            price: product.price
          });
        }
      }
    });

    return { totalItems, totalPrice, selectedItems };
  }, [cart]);

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const removeCartItem = (productId: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!customerName.trim()) newErrors.name = 'El nombre de cliente es requerido.';
    
    if (!customerEmail.trim()) {
      newErrors.email = 'El correo electrónico es requerido.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      newErrors.email = 'Ingrese un formato de correo válido.';
    }

    if (!deliveryAddress.trim()) newErrors.address = 'La dirección de entrega es requerida.';
    if (cartTotals.selectedItems.length === 0) {
      newErrors.cart = 'Debe seleccionar al menos un producto para la orden.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const idNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: `ORD-${idNum}`,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || undefined,
      delivery_address: deliveryAddress,
      items: cartTotals.selectedItems,
      total_price: cartTotals.totalPrice,
      status: 'pending',
      priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: notes || undefined
    };

    onAddOrder(newOrder);
    setSuccess(true);

    // Reset states after brief transition
    setTimeout(() => {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setNotes('');
      setPriority('medium');
      setCart({});
      setSuccess(false);
      setActiveTab('orders'); // Redirect to order backlog
    }, 1500);
  };

  const loadDemoData = () => {
    const demo = generateRandomOrder();
    setCustomerName(demo.customer_name);
    setCustomerEmail(demo.customer_email);
    setCustomerPhone(demo.customer_phone || '');
    setDeliveryAddress(demo.delivery_address);
    setNotes('Demo cargado automáticamente para simplificar pruebas.');
    setPriority(demo.priority);
    
    const newCart: { [id: string]: number } = {};
    demo.items.forEach(it => {
      newCart[it.id] = it.quantity;
    });
    setCart(newCart);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-2xl text-white">Despacho de Nueva Orden</h2>
          <p className="text-sm text-slate-400">Crea pedidos de forma manual para su procesamiento y enrutamiento inmediato.</p>
        </div>
        <button
          type="button"
          onClick={loadDemoData}
          className="text-xs text-cyan-400 border border-cyan-800/40 bg-cyan-950/10 hover:bg-cyan-950/30 px-3.5 py-2 rounded-xl transition-all font-mono"
        >
          Cargar Datos Demo
        </button>
      </div>

      {success ? (
        <div className="p-12 text-center rounded-2xl border border-emerald-500/30 bg-emerald-950/10 max-w-xl mx-auto animate-bounce-slow">
          <div className="h-14 w-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="font-sans font-bold text-lg text-white">¡Orden Registrada!</h3>
          <p className="text-sm text-slate-400 mt-2">
            La orden ha sido creada y transmitida al backlog operativo. Redirigiendo a monitoreo...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/25 border border-slate-800/80 space-y-5">
              <h3 className="font-sans font-bold text-base text-slate-200 border-b border-slate-850 pb-2.5">
                Detalles del Destinatario
              </h3>
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Sofia Rodriguez"
                  className={`w-full px-3 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                    errors.name ? 'border-rose-500/60' : 'border-slate-800'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500 font-mono mt-1">{errors.name}</p>}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Correo Electrónico <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Ej. sofia@example.com"
                    className={`w-full px-3 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                      errors.email ? 'border-rose-500/60' : 'border-slate-800'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-rose-500 font-mono mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Teléfono (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej. +52 55 1234 5678"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Dirección de Despacho <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Ej. Av. de la Constitución 142, Ciudad de México"
                  className={`w-full px-3 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                    errors.address ? 'border-rose-500/60' : 'border-slate-800'
                  }`}
                />
                {errors.address && <p className="text-[11px] text-rose-500 font-mono mt-1">{errors.address}</p>}
              </div>

              {/* Priority & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold">Prioridad de Envío</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="low">Baja (Envío Normal)</option>
                    <option value="medium">Media (Envío Estándar)</option>
                    <option value="high">Alta (Envío Expreso)</option>
                    <option value="critical">Crítica (Despacho Inmediato)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Notas Internas
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Dejar con portería."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Inventory Cart selection */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/25 border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                <h3 className="font-sans font-bold text-base text-slate-200">Inventario y Pedido</h3>
                <span className="text-[10px] font-mono bg-cyan-950/40 text-cyan-400 border border-cyan-900/30 px-2 py-0.5 rounded-full font-semibold">
                  ZenitLabs Stock
                </span>
              </div>

              {/* Inventory items selection */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {PRODUCTS.map((prod) => {
                  const qty = cart[prod.id] || 0;
                  return (
                    <div
                      key={prod.id}
                      className="p-3 rounded-xl border border-slate-850/60 bg-slate-950/40 hover:bg-slate-950/80 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-200">{prod.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">${prod.price.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {qty > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => updateCartQty(prod.id, -1)}
                              className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-xs font-bold text-slate-200 font-mono w-4 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(prod.id, 1)}
                              className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCartItem(prod.id)}
                              className="h-8 w-8 rounded-lg border border-slate-850 bg-slate-950 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors ml-1"
                              title="Eliminar de la orden"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateCartQty(prod.id, 1)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.cart && (
                <div className="p-3 rounded-xl border border-rose-500/25 bg-rose-950/10 flex items-start gap-2 text-rose-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-mono">{errors.cart}</p>
                </div>
              )}

              {/* Cart Summary */}
              {cartTotals.selectedItems.length > 0 && (
                <div className="p-4 rounded-xl border border-cyan-900/30 bg-cyan-950/5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-cyan-950 pb-2">
                    <ShoppingCart className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Resumen del Pedido</span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs">
                    {cartTotals.selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-mono text-slate-400">${(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-cyan-950 font-bold text-white">
                    <span className="text-xs">Monto Total</span>
                    <span className="text-base text-cyan-400 font-mono">${cartTotals.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Submit Trigger */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Despachar Orden en Tiempo Real</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
