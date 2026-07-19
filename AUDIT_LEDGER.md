# 📘 Registro de Auditoría de Software & Arquitectura Global (Audit Ledger)
## ZenitLabs - Sistema Modular en Tiempo Real para Gestión de Órdenes y Negocios
**Fecha de Creación:** 15 de Julio de 2026  
**Versión de Sistema:** v1.5 (Modular Core)  
**Autoridad de Auditoría:** Software Security & Compliance Board (ZenitLabs)

---

## 1. Declaración de Misión y Enfoque Modular (SaaS Multi-Inquilino)
El sistema **ZenitLabs** está concebido como una plataforma de software versátil y adaptable (SaaS). Originalmente configurado para la gestión de flujos de trabajo de una **Floristería Profesional**, el core del software ha sido reestructurado para admitir una **Arquitectura de Micro-Módulos Pluggables**. 

A través de un **Asistente de Configuración (Wizard Config)** y una **Tienda de Módulos (Module Store)** integrados en el núcleo, cualquier negocio puede habilitar o deshabilitar extensiones (inventarios, finanzas, coordinaciones de logística o personalizaciones sectoriales) sin comprometer el rendimiento del núcleo ni alterar la base de datos central.

---

## 2. Diagrama y Flujo de Arquitectura Técnica

```
                    ┌─────────────────────────┐
                    │  Navegador del Cliente  │
                    │   (React 19 + Vite)     │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │  Canal de Tiempo Real │       │    Motor de Estado    │
     │   (Supabase Pub/Sub)  │       │     Local In-Memory   │
     └───────────┬───────────┘       └───────────┬───────────┘
                 │                               │
                 │ (Eventos insert/update)       │ (Simulación de
                 │                               │  pedidos offline)
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │     Base de Datos     │       │   Local Storage Sync  │
     │    Cloud Supabase     │       │  (Módulos y Config)   │
     └───────────────────────┘       └───────────────────────┘
```

El software implementa un mecanismo de **conmutación de tolerancia a fallas (failover)**:
1. **Canal Activo (Cloud Sync):** Si las variables de entorno de Supabase están configuradas en `supabaseClient.ts`, el sistema establece conexión bilateral en tiempo real usando sockets de Postgres.
2. **Canal Pasivo (Offline Engine):** Si no hay conexión o no está configurado el cliente, el sistema inicia un motor de simulación local que produce pedidos e incrementa estados operacionales con hilos autónomos (`setInterval`), lo que asegura la operabilidad continua del frontend para pruebas y demostraciones de preventa.

---

## 3. Diccionario de Datos & Mapeo de Esquemas (Base de Datos)
El sistema opera con una base de datos PostgreSQL de Supabase. A continuación se expone el mapeo crítico entre los nombres de columnas en la nube (en español) y las variables lógicas tipadas en TypeScript (`Order` interface):

| Columna en Supabase (DB) | Propiedad TypeScript (`src/types.ts`) | Tipo de Datos | Descripción / Propósito de Auditoría |
| :--- | :--- | :--- | :--- |
| `id` | `id` | `string` / `bigint` | Identificador único incremental de la orden. |
| `nombreCliente` | `customer_name` | `string` | Nombre del comprador principal del pedido. |
| `customer_email` | `customer_email` | `string` | Correo de contacto (por defecto `sin@email.com`). |
| `nroCliente` | `customer_phone` | `string` (nullable) | Teléfono de contacto del comprador. |
| `direccionEntrega` | `delivery_address` | `string` | Dirección de despacho (o 'Entrega en Tienda'). |
| `pedido` | `pedido` / `items` | `string` / `JSON` | Listado serializado de productos/arreglos florales. |
| `precioFacturado` | `total_price` | `number` | Monto bruto cobrado por los productos del pedido. |
| `deliveryFacturado` | `deliveryFacturado` | `number` | Tarifa de despacho cobrada al cliente. |
| `status` | `status` | `OrderStatus` | Estados del ciclo de vida: `pending` (Pendiente), `preparing` (En preparación), `shipped` (Enviado), `delivered` (Entregado), `cancelled` (Cancelado). |
| `priority` | `priority` | `OrderPriority` | Prioridades críticas: `low`, `medium`, `high`, `critical`. |
| `fechaCreacion` | `created_at` | `string` (timestamp) | Fecha ISO de inserción de la orden. |
| `dedicatoria` | `dedicatoria` | `string` (nullable) | Mensaje impreso en tarjeta (módulo floristería). |
| `personalizacion` | `personalizacion` | `string` (nullable) | Ajustes de diseño de producto (módulo floristería). |
| `numeroRosas` | `numeroRosas` | `number` (nullable) | Cantidad física de flores (módulo floristería). |
| `colorRosas` | `colorRosas` | `string` (nullable) | Color botánico elegido (módulo floristería). |
| `nombreReceptor` | `nombreReceptor` | `string` (nullable) | Destinatario final de la entrega. |
| `tlfReceptor` | `tlfReceptor` | `string` (nullable) | Teléfono de contacto del destinatario. |
| `entregaTienda` | `entregaTienda` | `boolean` | Bandera booleana si es retiro local. |
| `entregaSorpresa` | `entregaSorpresa` | `boolean` | Bandera para entregas secretas (módulo floristería). |
| `metodoPago` | `metodoPago` | `string` | Método de cobro (Pago Móvil, Efectivo, Zelle, etc). |
| `imageRef` | `imageRef` | `string` (URL) | Imagen referencial del arreglo / producto. |
| `notaEntrega` | `notaEntrega` | `string` | Indicaciones especiales para el motorizado de delivery. |

---

## 4. Medidas de Seguridad, Iframe Sandbox y Cumplimiento
El aplicativo implementa lineamientos estrictos de protección de datos de cara al usuario final y de seguridad del sistema de renderizado:
- **Image Referrer Policy:** En cumplimiento con las directivas de privacidad del navegador, todas las imágenes (`<img>`) incorporan la propiedad `referrerPolicy="no-referrer"` para proteger los tokens y URLs firmadas de almacenamiento (CDN) contra fugas operativas.
- **Protección contra Overflow Visual:** Se ha implementado `overflow-hidden` en las tarjetas de detalle de órdenes para asegurar que imágenes o metadatos de grandes dimensiones no causen distorsiones en el contenedor padre.
- **Validación de Identidad e Idempotencia:** Las inserciones en tiempo real incorporan validaciones de duplicidad (idempotency checks) basadas en el ID de la orden, previniendo duplicados visuales en la lista activa cuando coinciden triggers optimistas del cliente con eventos concurrentes de Supabase.

---

## 5. Registro Histórico de Cambios (Changelog de Auditoría)

### [v1.0] - Conexión Cloud Supabase
- Integración del cliente Supabase con políticas RLS activas en Postgres.
- Creación de tabla `orders` para sincronización bilateral de datos.

### [v1.1] - Motor de Simulación en Memoria
- Implementación del plan de contingencia offline.
- Simulación adaptativa de tránsito de estados y flujo de clientes concurrentes.

### [v1.2] - Panel Operacional Optimizado
- Incorporación de barra de métricas, distribución de prioridades críticas y logs detallados en tiempo real.

### [v1.3] - Scroll Independiente de Backlog (Desktop)
- Ajuste estructural para permitir que el listado de órdenes en pantallas de escritorio tenga un scroll vertical independiente con altura alineada al panel de detalle.
- Prevención de re-scrolling en el body de la página, mejorando la usabilidad de operadores multitarea.

### [v1.4] - Prevención de Overflow en Imágenes y Estabilidad de Vista
- Solución de problemas de desbordamiento de imágenes en la cabecera del detalle de órdenes en el panel lateral.
- Estabilización del viewport para evitar saltos bruscos de la vista al cerrar o abrir el detalle.

### [v1.5] - Reestructuración Modular y Configuración por Asistente (Wizard)
- **Hito de Ingeniería de Software:** Creación de `/src/lib/moduleManager.ts` para habilitar componentes de forma condicional.
- Creación del **Asistente de Configuración (Wizard Setup)** para cambiar la naturaleza del negocio (Floristería profesional, tienda general de regalos, o comercio estándar) de forma dinámica.
- Implementación de la **Tienda de Módulos (Module Store)** que actúa como un catálogo para simular la instalación de módulos operativos (Inventario, Finanzas, Logística de Personal) con vistas funcionales de prueba de concepto para previsualizar el valor antes de adquirirlos.
- Registro y despliegue del presente archivo de auditoría `/AUDIT_LEDGER.md` como contexto interpretable.

### [v1.6] - Integración Dinámica de Micro-Módulos (Fase 1 Completada)
- **Sincronización de Estado Global:** Integración de la biblioteca de módulos con `/src/App.tsx`, manteniendo en tiempo real el listado de funcionalidades activas (`activeModules`) sincronizadas con `localStorage` y actualizables de inmediato tras cambios en la tienda o el asistente.
- **Formularios Adaptativos de Alta Densidad:** Modificación de `/src/components/NewOrderForm.tsx` para admitir campos específicos de floristería (nombre/teléfono del receptor final, color/número de rosas, dedicatoria de tarjetas de regalo, entregas sorpresa) únicamente si el módulo `floristry-addons` está activo. Al desactivarse, el formulario se contrae de forma fluida a un diseño de e-commerce genérico para retail.
- **Detalle de Pedidos Condicional:** Reestructuración de la renderización en `/src/components/OrderList.tsx` para mostrar u ocultar de manera dinámica los datos florales dentro del backlog de órdenes en pantallas táctiles y escritorio, facilitando una visualización simplificada de transacciones generales en otros modelos de negocio.
- **Enlace de Menú Unificado:** Integración del acceso al Asistente y Tienda en el menú lateral principal `/src/components/Sidebar.tsx` mediante el icono estandarizado `Wand2` ("Tienda y Asistente").

### [v1.7] - Dashboard Modular Adaptativo (Fase 2 Completada)
- **Modulación Visual del Dashboard:** Reestructuración de `/src/components/Dashboard.tsx` para admitir de forma condicional una sección de widgets dedicada a los micro-módulos operativos Premium y verticales que el usuario tiene activos en la plataforma.
- **Widget de Control de Inventario (`inventory-module`):** Monitoreo interactivo del stock de materias primas (rosas, girasoles, bases, cintas) con alertas dinámicas de stock mínimo, auto-descuentos automáticos basados en la preparación de pedidos y botones de reabastecimiento express sincronizados con el panel de notificaciones del sistema.
- **Widget Contable & Financiero (`finance-module`):** Panel para el seguimiento del Flujo de Caja Consolidado en tiempo real en USD y equivalentes en bolívares (Bs.) calculados dinámicamente según la API oficial de tasas cambiarias del BCV. Incluye un botón para simular egresos rápidos de caja chica.
- **Widget de Personal & Logística (`admin-module`):** Visualización del estado del personal del comercio (diseñadores de arreglos, floristas, transportistas de delivery motorizados) con botones interactivos para alternar su estado operativo y disparar logs del sistema.
- **Widget de Inteligencia Predictiva (`analytics-module`):** Muestra sugerencias operativas inteligentes y previsiones de demanda basadas en el análisis del catálogo de órdenes reales, detectando automáticamente el producto estrella con mayor rotación cargado en la base de datos de órdenes.
- **Widget de Métricas Botánicas (`floristry-addons`):** Estadísticas específicas del vertical floral como conteo acumulado de tallos de rosas solicitados en el día, cantidad y porcentaje de entregas sorpresa, y total de tarjetas de dedicatorias escritas.
- **Banner de Sugerencia SaaS Contextual:** Despliegue de un llamado de acción sumamente pulido y no intrusivo si no existen módulos Premium activos, permitiendo la navegación directa a la tienda de módulos.

### [v1.8] - Centralización de Datos e Interoperabilidad Operativa (Fase 3 Completada)
- **Hito de Integración de Flujo Cruzado:** Conexión exitosa de los sistemas satélite independientes (Inventario, Finanzas, Logística de Personal) con el ciclo de vida del flujo transaccional principal (`App.tsx`), sustituyendo los estados ficticios locales por un motor unificado y persistente en `localStorage`.
- **Deducción de Inventario en Tiempo Real:** Configuración de un hook inteligente (`deductStockForOrder`) que analiza la composición botánica detallada de un pedido al ser despachado o simulado, deduciendo automáticamente el conteo físico del inventario global. Emite alertas críticas de stock mínimo si algún insumo crucial desciende de su nivel seguro.
- **Integración de Registro Financiero Automatizado:** Cada vez que un operador marca una orden como entregada (`delivered`), el sistema genera automáticamente un asiento contable de tipo ingreso (`income`) en el libro diario de la tienda, consolidando el precio facturado directamente con el flujo de caja global.
- **Asignación Logística Directa de Personal:** Integración de un menú de asignación de repartidores y floristas reales dentro de la pantalla de detalle del Backlog de Órdenes (`OrderList.tsx`). Al asignar un colaborador a una orden, el sistema actualiza su estado operativo a "Preparando" o "En Ruta", lo asocia con el identificador del pedido y actualiza la base de datos para la visibilidad de toda la organización.
- **Interoperabilidad en Modo Sandbox:** Sincronización bilateral de la Tienda de Módulos (`ModuleStore.tsx`) para que cualquier adición de stock, egreso financiero o alternancia de turnos de personal en las pantallas interactivas de prueba se escriba inmediatamente en el almacenamiento compartido y se refleje en tiempo real en las métricas consolidadas del Dashboard.

