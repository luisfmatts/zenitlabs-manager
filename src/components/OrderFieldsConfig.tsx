import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Sparkles, 
  Check, 
  X, 
  Edit2, 
  Trash, 
  Folder,
  FolderPlus,
  GripVertical,
  Layers,
  Settings,
  HelpCircle,
  Columns,
  ChevronUp,
  ChevronDown,
  User,
  CreditCard,
  SlidersHorizontal,
  Gift,
  ShoppingBag,
  Truck,
  Calendar,
  MapPin,
  Phone,
  Heart,
  Info,
  Package,
  Tag,
  DollarSign,
  MessageSquare,
  Star,
  Clock,
  Smile,
  FileText,
  Camera,
  Image as ImageIcon,
  Award,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  loadOrderFields, 
  saveOrderFields, 
  loadOrderCategories, 
  saveOrderCategories, 
  OrderField 
} from '../lib/orderFields';

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

const AVAILABLE_ICONS = Object.keys(ICON_COMPONENTS);

// Mock order for live high-fidelity preview
const MOCK_ORDER: Record<string, any> = {
  id: 'order-sample777',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  pedido: 'Arreglo Imperial "Esencia Floral"',
  status: 'preparing',
  priority: 'critical',
  imageRef: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=400',
  clienteNombre: 'Sofía Rodríguez',
  customer_phone: '+34 612 345 678',
  customer_email: 'sofia.rod@example.com',
  direccionEntrega: 'Paseo de la Castellana 120, Madrid',
  entregaTienda: false,
  entregaSorpresa: true,
  dedicatoria: '¡Feliz Aniversario, amor! Gracias por pintar mis días con los colores más alegres del jardín. Te amo.',
  partialPay: true,
  custom_fields: {
    envolturaEspecial: 'Papel Coreano de Seda Rosa',
    tarjetaEspecial: 'Caligrafía Escrita a Mano',
    choferAsignado: 'Carlos Mendoza',
    horarioEspecial: '14:00 - 16:00 hs',
    dedicatoriaText: '¡Feliz Aniversario, amor!'
  },
  // Map flat values too for flexibility
  envolturaEspecial: 'Papel Coreano de Seda Rosa',
  tarjetaEspecial: 'Caligrafía Escrita a Mano',
  choferAsignado: 'Carlos Mendoza',
  horarioEspecial: '14:00 - 16:00 hs'
};

const MANDATORY_KEYS = ['customer_name', 'pedido', 'fechaEntrega', 'horaEntrega', 'total_price'];

export default function OrderFieldsConfig() {
  const [fields, setFields] = useState<OrderField[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [activeIconPicker, setActiveIconPicker] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Record<string, boolean>>({});
  const [looseFieldsPosition, setLooseFieldsPosition] = useState<'top' | 'bottom'>('bottom');

  // Modals & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<OrderField | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form states for custom field
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [fieldType, setFieldType] = useState<OrderField['type']>('text');
  const [fieldCategory, setFieldCategory] = useState<string>('Detalles');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [fieldShowInList, setFieldShowInList] = useState(false);
  const [fieldShowInDetails, setFieldShowInDetails] = useState(true);

  // Drag states
  const [draggedFieldKey, setDraggedFieldKey] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [dragOverFieldKey, setDragOverFieldKey] = useState<string | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Collapsed categories state & category drag states
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    'Cliente': false,
    'Detalles': false,
    'Logística': false,
    'Otros': false
  });
  const [draggedCategoryName, setDraggedCategoryName] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    setFields(loadOrderFields());
    setCategories(loadOrderCategories());
    try {
      const savedHidden = localStorage.getItem('zenit_orders_hidden_categories');
      if (savedHidden) {
        setHiddenCategories(JSON.parse(savedHidden));
      }
    } catch (e) {
      console.error(e);
    }
    try {
      const savedPos = localStorage.getItem('zenit_orders_loose_position');
      if (savedPos === 'top' || savedPos === 'bottom') {
        setLooseFieldsPosition(savedPos);
      }
    } catch (e) {
      console.error(e);
    }
    try {
      const saved = localStorage.getItem('zenit_orders_category_icons');
      if (saved) {
        setCategoryIcons(JSON.parse(saved));
      } else {
        const defaults = {
          'Cliente': 'User',
          'Detalles': 'Sparkles',
          'Logística': 'CreditCard',
          'Otros': 'SlidersHorizontal'
        };
        setCategoryIcons(defaults);
        localStorage.setItem('zenit_orders_category_icons', JSON.stringify(defaults));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // CamelCase helper
  const toCamelCase = (str: string): string => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9 ]/g, "") // remove non-alphanumeric
      .split(' ')
      .filter(word => word.trim().length > 0)
      .map((word, idx) => idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  // Handle Label Change -> Auto Key
  const handleLabelChange = (val: string) => {
    setFieldLabel(val);
    if (!isKeyManuallyEdited && !editingField) {
      setFieldKey(toCamelCase(val));
    }
  };

  const triggerSuccessGlow = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Category Ordering Action
  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setCategories(updated);
    saveOrderCategories(updated);
    triggerSuccessGlow();
  };

  // Icon Selection
  const handleSelectIcon = (catName: string, iconName: string) => {
    const updated = { ...categoryIcons, [catName]: iconName };
    setCategoryIcons(updated);
    localStorage.setItem('zenit_orders_category_icons', JSON.stringify(updated));
    window.dispatchEvent(new Event('zenit_orders_categories_updated'));
    setActiveIconPicker(null);
    triggerSuccessGlow();
  };

  // Toggle visible/active status
  const handleToggleVisible = (key: string) => {
    const updated = fields.map(f => f.key === key ? { ...f, visible: !f.visible } : f);
    setFields(updated);
    saveOrderFields(updated);
    triggerSuccessGlow();
  };

  // Toggle list vis
  const handleToggleShowInList = (key: string) => {
    if (MANDATORY_KEYS.includes(key)) return;
    const updated = fields.map(f => f.key === key ? { ...f, showInList: !f.showInList } : f);
    setFields(updated);
    saveOrderFields(updated);
    triggerSuccessGlow();
  };

  // Toggle detail vis
  const handleToggleShowInDetails = (key: string) => {
    const updated = fields.map(f => f.key === key ? { ...f, showInDetails: !f.showInDetails } : f);
    setFields(updated);
    saveOrderFields(updated);
    triggerSuccessGlow();
  };

  // Toggle complete category/folder visibility
  const handleToggleCategoryVisible = (catName: string) => {
    const updated = { ...hiddenCategories, [catName]: !hiddenCategories[catName] };
    setHiddenCategories(updated);
    localStorage.setItem('zenit_orders_hidden_categories', JSON.stringify(updated));
    window.dispatchEvent(new Event('zenit_orders_categories_updated'));
    triggerSuccessGlow();
  };

  // Save custom field
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim() || !fieldKey.trim()) return;

    // Check unique key constraint on creation
    if (!editingField && fields.some(f => f.key.toLowerCase() === fieldKey.trim().toLowerCase())) {
      alert('Ya existe una columna con esta clave ID. Por favor escribe una diferente.');
      return;
    }

    if (editingField) {
      const updated = fields.map(f => {
        if (f.key === editingField.key) {
          return {
            ...f,
            label: fieldLabel,
            type: fieldType,
            category: fieldCategory,
            placeholder: fieldPlaceholder || undefined,
            options: fieldType === 'select' ? fieldOptions : undefined,
            showInList: MANDATORY_KEYS.includes(f.key) ? true : fieldShowInList,
            showInDetails: fieldShowInDetails
          };
        }
        return f;
      });
      setFields(updated);
      saveOrderFields(updated);
      setEditingField(null);
    } else {
      const newField: OrderField = {
        key: fieldKey.trim(),
        label: fieldLabel.trim(),
        type: fieldType,
        category: fieldCategory,
        placeholder: fieldPlaceholder || undefined,
        options: fieldType === 'select' ? fieldOptions : undefined,
        showInList: MANDATORY_KEYS.includes(fieldKey.trim()) ? true : fieldShowInList,
        showInDetails: fieldShowInDetails,
        visible: true,
        isCustom: true
      };
      const updated = [...fields, newField];
      setFields(updated);
      saveOrderFields(updated);
    }

    resetForm();
    setShowAddModal(false);
    triggerSuccessGlow();
  };

  // Edit fields
  const handleEditClick = (field: OrderField) => {
    setEditingField(field);
    setFieldLabel(field.label);
    setFieldKey(field.key);
    setIsKeyManuallyEdited(true);
    setFieldType(field.type);
    setFieldCategory(field.category || 'Sin categoría');
    setFieldPlaceholder(field.placeholder || '');
    setFieldOptions(field.options || []);
    setFieldShowInList(field.showInList);
    setFieldShowInDetails(field.showInDetails);
    setShowAddModal(true);
  };

  // Delete custom fields
  const handleDeleteCustomField = (key: string) => {
    if (confirm('¿Está seguro de que desea eliminar este campo personalizado? Se perderán las referencias a este dato.')) {
      const updated = fields.filter(f => f.key !== key);
      setFields(updated);
      saveOrderFields(updated);
      triggerSuccessGlow();
    }
  };

  // Add category/type
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.some(c => c.toLowerCase() === name.toLowerCase()) || name === 'Sin categoría') {
      alert('Este tipo de campo o categoría ya existe.');
      return;
    }

    const updated = [...categories, name];
    setCategories(updated);
    saveOrderCategories(updated);

    // Default icon setting
    const updatedIcons = { ...categoryIcons, [name]: 'Folder' };
    setCategoryIcons(updatedIcons);
    localStorage.setItem('zenit_orders_category_icons', JSON.stringify(updatedIcons));

    setNewCategoryName('');
    setShowAddCategoryModal(false);
    triggerSuccessGlow();
  };

  // Delete custom types
  const handleDeleteCategory = (catName: string) => {
    const catFields = fields.filter(f => f.category === catName);
    
    let confirmMsg = `¿Seguro que deseas eliminar la carpeta "${catName}"?`;
    if (catFields.length > 0) {
      confirmMsg = `¿Seguro que deseas eliminar la carpeta "${catName}"? Los ${catFields.length} campos dentro de ella se moverán a "Sin categoría".`;
    }

    if (confirm(confirmMsg)) {
      const updatedCategories = categories.filter(c => c !== catName);
      setCategories(updatedCategories);
      saveOrderCategories(updatedCategories);

      if (catFields.length > 0) {
        const updatedFields = fields.map(f => {
          if (f.category === catName) {
            return { ...f, category: 'Sin categoría' };
          }
          return f;
        });
        setFields(updatedFields);
        saveOrderFields(updatedFields);
      }
      
      triggerSuccessGlow();
    }
  };

  // Options helpers
  const handleAddOption = () => {
    if (newOptionText.trim() && !fieldOptions.includes(newOptionText.trim())) {
      setFieldOptions([...fieldOptions, newOptionText.trim()]);
      setNewOptionText('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFieldOptions(fieldOptions.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setFieldLabel('');
    setFieldKey('');
    setIsKeyManuallyEdited(false);
    setFieldType('text');
    setFieldCategory('Detalles');
    setFieldPlaceholder('');
    setFieldOptions([]);
    setNewOptionText('');
    setFieldShowInList(false);
    setFieldShowInDetails(true);
    setEditingField(null);
  };

  // Open creation modal pre-assigning category
  const handleAddInlineField = (categoryName: string) => {
    resetForm();
    setFieldCategory(categoryName);
    setShowAddModal(true);
  };

  // Drag and drop sorting mechanics
  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedFieldKey(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropField = (targetCategory: string, targetIndex: number) => {
    if (!draggedFieldKey) return;
    const sourceField = fields.find(f => f.key === draggedFieldKey);
    if (!sourceField) return;

    // Normalizing category save format
    const realTargetCategory = targetCategory === 'Sin categoría' ? '' : targetCategory;

    const remainingFields = fields.filter(f => f.key !== draggedFieldKey);
    const categoryFields = remainingFields.filter(f => f.category === realTargetCategory || (realTargetCategory === '' && !f.category));
    const otherFields = remainingFields.filter(f => f.category !== realTargetCategory && (realTargetCategory !== '' || f.category));

    const updatedCategoryFields = [...categoryFields];
    const insertAt = Math.max(0, Math.min(targetIndex, updatedCategoryFields.length));

    const updatedSourceField = { ...sourceField, category: realTargetCategory };
    updatedCategoryFields.splice(insertAt, 0, updatedSourceField);

    // Reconstruct fields maintaining sequence
    const reconstructed: OrderField[] = [];
    categories.forEach(cat => {
      if (cat === realTargetCategory) {
        reconstructed.push(...updatedCategoryFields);
      } else {
        reconstructed.push(...otherFields.filter(f => f.category === cat));
      }
    });

    // Loose fields
    if (realTargetCategory === '') {
      reconstructed.push(...updatedCategoryFields);
    } else {
      reconstructed.push(...otherFields.filter(f => !f.category || f.category === 'Sin categoría'));
    }

    // Keep any other remaining fields safe
    const categorizedKeys = new Set(reconstructed.map(f => f.key));
    fields.forEach(f => {
      if (!categorizedKeys.has(f.key)) {
        reconstructed.push(f.key === draggedFieldKey ? updatedSourceField : f);
      }
    });

    setFields(reconstructed);
    saveOrderFields(reconstructed);
    setDraggedFieldKey(null);
    triggerSuccessGlow();
  };

  const handleDropOnCategoryHeader = (categoryName: string) => {
    if (!draggedFieldKey) return;
    const sourceField = fields.find(f => f.key === draggedFieldKey);
    if (!sourceField) return;

    const realTarget = categoryName === 'Sin categoría' ? '' : categoryName;
    if (sourceField.category === realTarget) return;

    const updated = fields.map(f => {
      if (f.key === draggedFieldKey) {
        return { ...f, category: realTarget };
      }
      return f;
    });

    setFields(updated);
    saveOrderFields(updated);
    setDraggedFieldKey(null);
    triggerSuccessGlow();
  };

  // Preview helper values
  const getPreviewFieldValue = (field: OrderField) => {
    if (field.key in MOCK_ORDER) return MOCK_ORDER[field.key];
    if (MOCK_ORDER.custom_fields && field.key in MOCK_ORDER.custom_fields) {
      return MOCK_ORDER.custom_fields[field.key];
    }
    // Default mock representations
    if (field.type === 'boolean') return true;
    if (field.type === 'date') return '2026-07-20';
    if (field.type === 'number') return '150';
    if (field.type === 'select') return field.options?.[0] || 'Opción A';
    return 'Dato de Prueba';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT: Configurator Controls Panel (8cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Banner with info & action triggers */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
            <div>
              <span>Reordena los tipos e íconos presionando sus cabeceras.</span>
              {saveSuccess && (
                <span className="ml-2 inline-block bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full animate-pulse font-bold">
                  ¡Actualizado con éxito!
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => {
                  setNewCategoryName('');
                  setShowAddCategoryModal(!showAddCategoryModal);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all font-sans font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <FolderPlus className="h-4 w-4 text-indigo-400" />
                <span>NUEVA CARPETA</span>
              </button>

              <AnimatePresence>
                {showAddCategoryModal && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 z-[60] w-[280px] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <FolderPlus className="h-4 w-4 text-indigo-400" />
                        <span className="font-sans font-black text-xs text-white">Crear Tipo / Carpeta</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddCategoryModal(false)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <form onSubmit={handleAddCategorySubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block text-left">
                          Nombre del Tipo / Carpeta
                        </label>
                        <input
                          type="text"
                          required
                          autoFocus
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Ej: Embalaje, Finanzas..."
                          className="w-full h-9 px-3 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition-all"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddCategoryModal(false)}
                          className="flex-1 h-8 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-[10px] transition-all cursor-pointer uppercase"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-lg shadow-indigo-600/15 transition-all cursor-pointer uppercase"
                        >
                          Crear
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-sans font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              <Plus className="h-4 w-4" />
              <span>NUEVO CAMPO</span>
            </button>
          </div>
        </div>

        {/* Header block for the folder box */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
          <Layers className="h-4.5 w-4.5 text-indigo-400" />
          <div>
            <h3 className="font-sans font-black text-sm text-white">Estructura de Carpetas y Tipos</h3>
            <p className="text-[10px] text-slate-500">Organiza los campos en grupos, arrastra para ordenar y contrae las secciones.</p>
          </div>
        </div>

        {/* Loop over categories vertically */}
        {categories.map((catName, idx) => {
            const catFields = fields.filter(f => f.category === catName);
            const isOverThisCat = dragOverCategory === catName;
            const isSystemCat = ['Cliente', 'Detalles', 'Logística', 'Otros'].includes(catName);
            const IconComponent = ICON_COMPONENTS[categoryIcons[catName]] || Folder;
            const isCollapsed = !!collapsedCategories[catName];

            return (
              <div
                key={catName}
                onDragOver={(e) => { e.preventDefault(); setDragOverCategory(catName); }}
                onDragLeave={() => setDragOverCategory(null)}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  if (draggedFieldKey) {
                    handleDropOnCategoryHeader(catName);
                  } else if (draggedCategoryName && draggedCategoryName !== catName) {
                    const fromIdx = categories.indexOf(draggedCategoryName);
                    const toIdx = categories.indexOf(catName);
                    if (fromIdx !== -1 && toIdx !== -1) {
                      const updated = [...categories];
                      const [moved] = updated.splice(fromIdx, 1);
                      updated.splice(toIdx, 0, moved);
                      setCategories(updated);
                      saveOrderCategories(updated);
                      triggerSuccessGlow();
                    }
                  }
                  setDraggedCategoryName(null);
                  setDragOverCategory(null);
                }}
                className={`rounded-2xl border transition-all duration-300 bg-slate-950/40 ${
                  isOverThisCat 
                    ? 'border-indigo-500 bg-indigo-500/5 shadow-xl shadow-indigo-500/5' 
                    : 'border-slate-900 hover:border-slate-850'
                } ${hiddenCategories[catName] ? 'opacity-55 border-dashed border-rose-500/30' : ''}`}
              >
                {/* Header block with ordering and icon choice - Draggable for category reordering */}
                <div 
                  draggable
                  onDragStart={(e) => {
                    setDraggedCategoryName(catName);
                    e.dataTransfer.setData('text/plain', catName);
                  }}
                  onDragEnd={() => {
                    setDraggedCategoryName(null);
                  }}
                  className="p-3 flex items-center justify-between border-b border-slate-900/90 bg-slate-950/20 rounded-t-2xl relative cursor-grab active:cursor-grabbing hover:bg-slate-900/10 transition-colors"
                >
                  
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Clickable Icon that opens choices bubble */}
                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveIconPicker(activeIconPicker === catName ? null : catName)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer hover:border-slate-700"
                        title="Toca para cambiar ícono del tipo"
                      >
                        <IconComponent className="h-4 w-4" />
                      </button>

                      {/* Floating Choice Bubble Popover */}
                      <AnimatePresence>
                        {activeIconPicker === catName && (
                          <div className="absolute left-0 mt-2 z-50 p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-60">
                            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Cambiar Ícono</span>
                              <button onClick={() => setActiveIconPicker(null)} className="text-slate-500 hover:text-white">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto scrollbar-dark">
                              {AVAILABLE_ICONS.map(icName => {
                                const SelectionIcon = ICON_COMPONENTS[icName];
                                const isCurrent = categoryIcons[catName] === icName;
                                return (
                                  <button
                                    key={icName}
                                    type="button"
                                    onClick={() => handleSelectIcon(catName, icName)}
                                    className={`p-2 rounded-lg transition-all text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer ${
                                      isCurrent ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30' : 'border border-transparent'
                                    }`}
                                    title={icName}
                                  >
                                    <SelectionIcon className="h-3.5 w-3.5" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Header Title and count - Perfectly aligned & clicking here toggles expand/collapse */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCollapsedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
                      }}
                      className="flex items-center gap-2 min-w-0 select-none cursor-pointer flex-1 py-1"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-slate-700 shrink-0 mr-0.5" />
                      <span className="font-sans font-black text-xs text-white uppercase tracking-wider truncate leading-none">
                        {catName}
                      </span>
                      <span className="shrink-0 text-[9px] bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded-full font-mono text-slate-400 font-bold leading-none">
                        {catFields.length} {catFields.length === 1 ? 'campo' : 'campos'}
                      </span>
                      <span className="text-slate-600 hover:text-slate-400 shrink-0 transition-colors">
                        {isCollapsed ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronUp className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Category reordering, custom deletion) */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Move Category Buttons */}
                    <button
                      onClick={() => moveCategory(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-slate-900/60 border border-slate-900 hover:border-slate-800 hover:text-white text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Subir categoría"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveCategory(idx, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1 rounded bg-slate-900/60 border border-slate-900 hover:border-slate-800 hover:text-white text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Bajar categoría"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {/* Toggle Category Visibility (Hide/Show Whole Folder) */}
                    <button
                      onClick={() => handleToggleCategoryVisible(catName)}
                      className={`p-1 rounded border transition-colors cursor-pointer ${
                        !hiddenCategories[catName]
                          ? 'bg-slate-900/60 border-slate-900 text-slate-500 hover:text-slate-350 hover:border-slate-800'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:text-rose-300'
                      }`}
                      title={!hiddenCategories[catName] ? "Ocultar carpeta entera de los detalles" : "Mostrar carpeta en detalles"}
                    >
                      {!hiddenCategories[catName] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>

                    {/* Delete Category */}
                    <button
                      onClick={() => handleDeleteCategory(catName)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                      title="Eliminar este tipo/carpeta"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  </div>

                </div>

                {/* Thin rows list of fields - only if NOT collapsed */}
                {!isCollapsed && (
                  <div className="p-2 space-y-1 animate-fade-in">
                    {catFields.length > 0 ? (
                      catFields.map((field, fIdx) => {
                        const isDragged = draggedFieldKey === field.key;
                        const isOver = dragOverFieldKey === field.key;

                        return (
                          <div
                            key={field.key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, field.key)}
                            onDragEnd={() => { setDraggedFieldKey(null); setDragOverFieldKey(null); }}
                            onDragOver={(e) => { e.preventDefault(); setDragOverFieldKey(field.key); }}
                            onDragLeave={() => setDragOverFieldKey(null)}
                            onDrop={(e) => { 
                              e.stopPropagation(); 
                              handleDropField(catName, fIdx); 
                              setDragOverFieldKey(null); 
                            }}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg transition-all border ${
                              isOver 
                                ? 'bg-indigo-600/10 border-indigo-500/40 translate-x-1' 
                                : isDragged
                                  ? 'opacity-25 border-dashed border-slate-800'
                                  : 'border-transparent hover:bg-slate-900/30'
                            } ${!field.visible ? 'opacity-40' : ''}`}
                          >
                            {/* Label info */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <GripVertical className="h-3 w-3 text-slate-700 cursor-grab active:cursor-grabbing shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-sans font-semibold text-xs text-slate-300 truncate">
                                  {field.label}
                                </span>
                                <span className="text-[8.5px] text-slate-600 font-mono truncate">
                                  ID: {field.key}
                                </span>
                              </div>
                            </div>

                            {/* Action badges and visibilities */}
                            <div className="flex items-center gap-1 shrink-0">
                              
                              <span className="text-[8.5px] bg-slate-950/80 border border-slate-900 text-slate-500 px-1 py-0.2 rounded font-mono uppercase">
                                {field.type}
                              </span>

                              <button
                                onClick={() => field.visible && !MANDATORY_KEYS.includes(field.key) && handleToggleShowInList(field.key)}
                                disabled={!field.visible || MANDATORY_KEYS.includes(field.key)}
                                className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                  !field.visible
                                    ? 'bg-slate-950 text-slate-700 cursor-not-allowed'
                                    : MANDATORY_KEYS.includes(field.key)
                                      ? 'bg-indigo-600/20 border border-indigo-500/35 text-indigo-300 cursor-not-allowed'
                                      : field.showInList
                                        ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 cursor-pointer'
                                        : 'bg-slate-950 border border-slate-900 text-slate-500 cursor-pointer hover:text-slate-300'
                                }`}
                                title={MANDATORY_KEYS.includes(field.key) ? "Obligatorio en lista" : "Mostrar en tarjeta"}
                              >
                                {MANDATORY_KEYS.includes(field.key) ? 'Oblig.' : 'Lista'}
                              </button>

                              <button
                                onClick={() => field.visible && handleToggleShowInDetails(field.key)}
                                disabled={!field.visible}
                                className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                  !field.visible
                                    ? 'bg-slate-950 text-slate-700 cursor-not-allowed'
                                    : field.showInDetails
                                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 cursor-pointer'
                                      : 'bg-slate-950 border border-slate-900 text-slate-500 cursor-pointer hover:text-slate-300'
                                }`}
                                title="Mostrar en panel extendido"
                              >
                                Detalle
                              </button>

                              <button
                                onClick={() => handleToggleVisible(field.key)}
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  field.visible ? 'text-slate-500 hover:text-slate-300' : 'text-rose-400 hover:text-rose-300 bg-rose-500/5 border border-rose-500/10'
                                }`}
                              >
                                {field.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                              </button>

                              {field.isCustom && (
                                <div className="flex items-center gap-0.5 ml-1 border-l border-slate-900 pl-1.5">
                                  <button
                                    onClick={() => handleEditClick(field)}
                                    className="p-1 text-slate-500 hover:text-indigo-400 cursor-pointer"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomField(field.key)}
                                    className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </button>
                                </div>
                              )}

                            </div>

                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-[9px] text-slate-600 font-mono uppercase tracking-wider">
                        Tipo vacío.
                      </div>
                    )}

                    {/* Narrow borderless "+" button at the end of category stack */}
                    <div className="pt-1.5 border-t border-slate-900/50 mt-1 flex justify-center">
                      <button
                        onClick={() => handleAddInlineField(catName)}
                        className="w-full py-1 rounded hover:bg-indigo-600/10 text-slate-500 hover:text-indigo-400 transition-all font-mono font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                        title={`Añadir nuevo campo directamente a ${catName}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Añadir a {catName}</span>
                      </button>
                    </div>

                  </div>
                )}

              </div>
            );
        })}

        {/* Virtual category box: Fields outside of folder ("Sin categoría") */}
        {(() => {
          const looseFields = fields.filter(f => !f.category || f.category === 'Sin categoría');
          const isOverLoose = dragOverCategory === 'Sin categoría';
          const isCollapsed = !!collapsedCategories['Sin categoría'];

          return (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverCategory('Sin categoría'); }}
              onDragLeave={() => setDragOverCategory(null)}
              onDrop={(e) => { e.preventDefault(); handleDropOnCategoryHeader('Sin categoría'); setDragOverCategory(null); }}
              className={`rounded-2xl border transition-all duration-300 bg-slate-950/20 ${
                isOverLoose 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : 'border-dashed border-slate-800'
              }`}
            >
              <div 
                onClick={() => {
                  setCollapsedCategories(prev => ({ ...prev, 'Sin categoría': !prev['Sin categoría'] }));
                }}
                className="p-3 flex items-center justify-between border-b border-slate-900 bg-slate-950/10 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-sans font-black text-xs text-slate-400 uppercase tracking-wider truncate">
                    Campos sin Tipo (Sueltos)
                  </span>
                  <span className="shrink-0 text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-mono text-slate-500">
                    {looseFields.length}
                  </span>
                </div>
                <span className="text-slate-600 hover:text-slate-400 shrink-0 transition-colors">
                  {isCollapsed ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                </span>
              </div>

              {!isCollapsed && (
                <div className="p-2 space-y-1 animate-fade-in">
                  
                  {/* Loose fields positioning toggle bar */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-xl bg-slate-900/50 border border-slate-900 text-[10px]" onClick={(e) => e.stopPropagation()}>
                    <span className="text-slate-400 font-sans font-medium">Ubicación de campos sueltos en detalles:</span>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                      <button
                        type="button"
                        onClick={() => {
                          setLooseFieldsPosition('top');
                          localStorage.setItem('zenit_orders_loose_position', 'top');
                          window.dispatchEvent(new Event('zenit_orders_fields_updated'));
                        }}
                        className={`px-2 py-1 rounded font-sans font-bold transition-all cursor-pointer ${
                          looseFieldsPosition === 'top'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Al Principio
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLooseFieldsPosition('bottom');
                          localStorage.setItem('zenit_orders_loose_position', 'bottom');
                          window.dispatchEvent(new Event('zenit_orders_fields_updated'));
                        }}
                        className={`px-2 py-1 rounded font-sans font-bold transition-all cursor-pointer ${
                          looseFieldsPosition === 'bottom'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Al Final
                      </button>
                    </div>
                  </div>
                  {looseFields.length > 0 ? (
                    looseFields.map((field, fIdx) => {
                      const isDragged = draggedFieldKey === field.key;
                      const isOver = dragOverFieldKey === field.key;

                      return (
                        <div
                          key={field.key}
                          draggable
                          onDragStart={(e) => handleDragStart(e, field.key)}
                          onDragEnd={() => { setDraggedFieldKey(null); setDragOverFieldKey(null); }}
                          onDragOver={(e) => { e.preventDefault(); setDragOverFieldKey(field.key); }}
                          onDragLeave={() => setDragOverFieldKey(null)}
                          onDrop={(e) => { 
                            e.stopPropagation(); 
                            handleDropField('Sin categoría', fIdx); 
                            setDragOverFieldKey(null); 
                          }}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg transition-all border ${
                            isOver 
                              ? 'bg-indigo-600/10 border-indigo-500/40 translate-x-1' 
                              : isDragged
                                ? 'opacity-25 border-dashed border-slate-800'
                                : 'border-transparent hover:bg-slate-900/30'
                          } ${!field.visible ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <GripVertical className="h-3 w-3 text-slate-700 cursor-grab active:cursor-grabbing shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-sans font-semibold text-xs text-slate-300 truncate">
                                {field.label}
                              </span>
                              <span className="text-[8.5px] text-slate-600 font-mono truncate">
                                ID: {field.key}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[8.5px] bg-slate-950/80 border border-slate-900 text-slate-500 px-1.5 py-0.2 rounded font-mono uppercase">
                              {field.type}
                            </span>

                            <button
                              onClick={() => field.visible && !MANDATORY_KEYS.includes(field.key) && handleToggleShowInList(field.key)}
                              disabled={!field.visible || MANDATORY_KEYS.includes(field.key)}
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                !field.visible
                                  ? 'bg-slate-950 text-slate-700 cursor-not-allowed'
                                  : MANDATORY_KEYS.includes(field.key)
                                    ? 'bg-indigo-600/20 border border-indigo-500/35 text-indigo-300 cursor-not-allowed'
                                    : field.showInList
                                      ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 cursor-pointer'
                                      : 'bg-slate-950 border border-slate-900 text-slate-500 cursor-pointer'
                              }`}
                              title={MANDATORY_KEYS.includes(field.key) ? "Obligatorio en lista" : "Mostrar en tarjeta"}
                            >
                              {MANDATORY_KEYS.includes(field.key) ? 'Oblig.' : 'Lista'}
                            </button>

                            <button
                              onClick={() => field.visible && handleToggleShowInDetails(field.key)}
                              disabled={!field.visible}
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                !field.visible ? 'bg-slate-950 text-slate-700 cursor-not-allowed' :
                                field.showInDetails ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 cursor-pointer' :
                                'bg-slate-950 border border-slate-900 text-slate-500 cursor-pointer'
                              }`}
                            >
                              Detalle
                            </button>

                            <button
                              onClick={() => handleToggleVisible(field.key)}
                              className="p-1 rounded text-slate-500 hover:text-slate-300 cursor-pointer"
                            >
                              {field.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-[10px] text-slate-600 font-mono uppercase italic">
                      No hay campos sueltos. Arrastra campos aquí para sacarlos de sus carpetas.
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-slate-900/50 mt-1 flex justify-center">
                    <button
                      onClick={() => handleAddInlineField('Sin categoría')}
                      className="w-full py-1 rounded hover:bg-slate-850 text-slate-500 hover:text-slate-400 transition-all font-mono font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Añadir campo suelto</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          );
        })()}

      </div>

      {/* RIGHT: High-fidelity interactive preview panel (5cols) */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
        
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 shadow-xl space-y-4">
          
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
            <Columns className="h-4.5 w-4.5 text-indigo-400" />
            <div>
              <h3 className="font-sans font-black text-sm text-white">Vista Previa Interactiva</h3>
              <p className="text-[10px] text-slate-500">Visualiza en tiempo real los cambios sobre tarjetas y detalles.</p>
            </div>
          </div>

          {/* 1. Card List Preview Component */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
              A) Tarjeta en Lista (Resumen)
            </span>

            <div className="p-3.5 rounded-2xl border transition-all duration-300 flex gap-3.5 items-stretch justify-between bg-slate-900/40 border-slate-950 hover:bg-slate-900/60 shadow-xl relative overflow-hidden">
              
              {/* Left thumbnail image */}
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-950 shrink-0 relative bg-slate-950 self-center">
                <img src={MOCK_ORDER.imageRef} className="absolute inset-0 w-full h-full object-cover" />
              </div>

              {/* Middle contents */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                
                {/* Status and title */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase bg-amber-400/10 border-amber-500/20 text-amber-400">
                      <span className="w-1 h-1 rounded-full bg-amber-400" />
                      En preparación
                    </span>
                  </div>
                  {fields.find(f => f.key === 'customer_name')?.showInList !== false && (
                    <h3 className="font-sans font-black text-xs text-white truncate leading-tight">
                      {MOCK_ORDER.clienteNombre}
                    </h3>
                  )}
                  {fields.find(f => f.key === 'pedido')?.showInList !== false && (
                    <p className="text-[10px] text-slate-400 truncate font-medium">
                      {MOCK_ORDER.pedido}
                    </p>
                  )}
                </div>

                {/* Dynamic list fields preview */}
                <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mt-1.5 text-[9px] text-slate-400">
                  {fields.filter(f => f.showInList && f.visible && !['customer_name', 'pedido', 'fechaEntrega', 'horaEntrega', 'total_price', 'clienteNombre', 'created_at'].includes(f.key)).map(field => {
                    const val = getPreviewFieldValue(field);
                    let displayVal = String(val);
                    if (field.type === 'boolean') displayVal = val ? 'Sí' : 'No';

                    return (
                      <span key={field.key} className="bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-900/60 font-mono text-[8px]">
                        <strong className="text-slate-500">{field.label}:</strong> {displayVal}
                      </span>
                    );
                  })}
                  {/* No-fields in list message removed */}
                </div>

                {/* Footer details */}
                <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono mt-1.5">
                  {fields.find(f => f.key === 'fechaEntrega')?.showInList !== false && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span>17/07/2026</span>
                    </div>
                  )}
                  {fields.find(f => f.key === 'horaEntrega')?.showInList !== false && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span>14:00 - 16:00 hs</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Right side price & details btn */}
              <div className="flex flex-col items-end justify-between shrink-0 self-stretch min-h-[56px]">
                <p className="font-sans font-black text-slate-300 text-xs leading-none">
                  $150,000
                </p>
                <div className="mt-auto">
                  <button className="p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer bg-amber-400/10 border-amber-500/20 text-amber-400 hover:bg-amber-400/20">
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* 2. Order Detail Side Drawer Preview */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
              B) Ficha de Detalle Expandido
            </span>

            <div className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden shadow-lg flex flex-col">
              
              {/* Header mockup image */}
              <div className="relative h-28 bg-slate-900">
                <img src={MOCK_ORDER.imageRef} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                <div className="absolute bottom-2.5 left-3">
                  <span className="text-[9px] text-rose-400 font-mono font-extrabold uppercase bg-rose-950/40 border border-rose-900/60 px-1.5 py-0.5 rounded">CRÍTICO</span>
                  <h4 className="font-sans font-bold text-xs text-white mt-1">{MOCK_ORDER.pedido}</h4>
                </div>
              </div>

              {/* Detail Content loop based on order */}
              <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto scrollbar-dark">
                {categories.map((catName) => {
                  const catFields = fields.filter(f => f.category === catName && f.showInDetails && f.visible);
                  if (catFields.length === 0) return null;
                  const Icon = ICON_COMPONENTS[categoryIcons[catName]] || Folder;

                  return (
                    <div key={catName} className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider pb-1 border-b border-slate-900">
                        <Icon className="h-3 w-3" />
                        <span>{catName}</span>
                      </div>
                      <div className="space-y-1 text-[10px] sm:text-xs">
                        {catFields.map(field => {
                          const val = getPreviewFieldValue(field);
                          let displayVal = String(val);
                          if (field.type === 'boolean') displayVal = val ? 'Sí' : 'No';

                          return (
                            <div key={field.key} className="flex justify-between items-baseline gap-2 py-0.5">
                              <span className="text-slate-500 text-[10px] shrink-0">{field.label}:</span>
                              <span className="font-bold text-slate-300 truncate text-right">{displayVal}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Loose preview items */}
                {fields.some(f => (!f.category || f.category === 'Sin categoría') && f.showInDetails && f.visible) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-900">
                      <Layers className="h-3 w-3" />
                      <span>Campos Generales</span>
                    </div>
                    <div className="space-y-1 text-[10px] sm:text-xs">
                      {fields.filter(f => (!f.category || f.category === 'Sin categoría') && f.showInDetails && f.visible).map(field => {
                        const val = getPreviewFieldValue(field);
                        let displayVal = String(val);
                        if (field.type === 'boolean') displayVal = val ? 'Sí' : 'No';

                        return (
                          <div key={field.key} className="flex justify-between items-baseline gap-2 py-0.5">
                            <span className="text-slate-500 text-[10px] shrink-0">{field.label}:</span>
                            <span className="font-bold text-slate-300 truncate text-right">{displayVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Category Add Modal Removed (Moved to Inline Dropdown) */}

      {/* Slide-over Modal for Adding/Editing Field */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-950/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />

            {/* Modal Body */}
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 h-full flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    <h4 className="font-sans font-black text-md text-white">
                      {editingField ? 'Editar Campo' : 'Nuevo Campo de Datos'}
                    </h4>
                  </div>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveField} className="space-y-4">
                  
                  {/* Label Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Nombre Amigable para Mostrar
                    </label>
                    <input
                      type="text"
                      required
                      value={fieldLabel}
                      onChange={(e) => handleLabelChange(e.target.value)}
                      placeholder="Ej: Foto del Cliente"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* ID / Database Column Key Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Clave ID Única (Columna Base)
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsKeyManuallyEdited(!isKeyManuallyEdited)}
                        className="text-[9px] text-indigo-400 hover:underline cursor-pointer"
                        disabled={!!editingField}
                      >
                        {isKeyManuallyEdited ? 'Auto-generar' : 'Personalizar ID'}
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      disabled={!!editingField}
                      value={fieldKey}
                      onChange={(e) => {
                        setFieldKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''));
                        setIsKeyManuallyEdited(true);
                      }}
                      placeholder="ej: fotoDelCliente"
                      className={`w-full h-11 px-3.5 rounded-xl border bg-slate-950 text-slate-200 text-xs focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono ${
                        fields.some(f => f.key.toLowerCase() === fieldKey.trim().toLowerCase() && (!editingField || f.key.toLowerCase() !== editingField.key.toLowerCase()))
                          ? 'border-rose-500 focus:border-rose-500 text-rose-300'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {fields.some(f => f.key.toLowerCase() === fieldKey.trim().toLowerCase() && (!editingField || f.key.toLowerCase() !== editingField.key.toLowerCase())) && (
                      <p className="text-[10px] text-rose-400 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                        ⚠️ Este ID ya existe. Por favor introduce uno único.
                      </p>
                    )}
                    <p className="text-[9px] text-slate-500">
                      Será el identificador técnico en la base de datos de órdenes. No se admiten espacios ni caracteres especiales.
                    </p>
                  </div>

                  {/* Category select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Asignar Tipo / Carpeta
                    </label>
                    <select
                      value={fieldCategory}
                      onChange={(e) => setFieldCategory(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Sin categoría">Sin categoría</option>
                    </select>
                  </div>

                  {/* Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Tipo de Entrada / Selector
                    </label>
                    <select
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value as OrderField['type'])}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="text">Texto (Escritura Libre)</option>
                      <option value="number">Número (Valor numérico)</option>
                      <option value="date">Fecha (Calendario)</option>
                      <option value="boolean">Verdadero / Falso (Interruptor)</option>
                      <option value="select">Lista de Opciones (Menú desplegable)</option>
                    </select>
                  </div>

                  {/* Select options builder if Select type */}
                  {fieldType === 'select' && (
                    <div className="space-y-3 p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Opciones del Desplegable:
                      </label>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOptionText}
                          onChange={(e) => setNewOptionText(e.target.value)}
                          placeholder="Nueva opción..."
                          className="flex-1 h-9 px-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center"
                        >
                          Añadir
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {fieldOptions.map((opt, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                          >
                            <span>{opt}</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        {fieldOptions.length === 0 && (
                          <span className="text-[10px] text-slate-500 italic">No hay opciones guardadas.</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Placeholder Input */}
                  {fieldType !== 'boolean' && fieldType !== 'date' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Marcador de posición (Placeholder)
                      </label>
                      <input
                        type="text"
                        value={fieldPlaceholder}
                        onChange={(e) => setFieldPlaceholder(e.target.value)}
                        placeholder="Ej: Elegir color de papel..."
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* Visibilidad Switches in Form */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      ¿Dónde aparecerá por defecto?
                    </span>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <p className="font-bold text-slate-200">En tarjetas de la lista</p>
                        <p className="text-[10px] text-slate-500">Muestra una vista rápida en cada tarjeta resumen.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldShowInList(!fieldShowInList)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative focus:outline-none flex items-center ${
                          fieldShowInList ? 'bg-indigo-600' : 'bg-slate-950 border border-slate-800'
                        } cursor-pointer`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform duration-300 ${
                          fieldShowInList ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <p className="font-bold text-slate-200">En el panel de detalle extendido</p>
                        <p className="text-[10px] text-slate-500">Muestra la información completa en el lateral derecho de consulta.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldShowInDetails(!fieldShowInDetails)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative focus:outline-none flex items-center ${
                          fieldShowInDetails ? 'bg-indigo-600' : 'bg-slate-950 border border-slate-800'
                        } cursor-pointer`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform duration-300 ${
                          fieldShowInDetails ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-4 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 h-11 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs tracking-wider transition-all cursor-pointer uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!fieldLabel.trim() || !fieldKey.trim() || fields.some(f => f.key.toLowerCase() === fieldKey.trim().toLowerCase() && (!editingField || f.key.toLowerCase() !== editingField.key.toLowerCase()))}
                      className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wider shadow-lg shadow-indigo-600/15 transition-all cursor-pointer uppercase"
                    >
                      {editingField ? 'Guardar Cambios' : 'Añadir Campo'}
                    </button>
                  </div>

                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
