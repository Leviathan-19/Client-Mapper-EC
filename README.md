# Cliente Mapper EC

Bienvenido al repositorio del proyecto **Cliente Mapper EC**, un ERP dinámico móvil enfocado en el registro y gestión de visitas a clientes.

El núcleo del sistema es su arquitectura **100% Offline-First y Serverless**, lo que significa que la app es completamente funcional y rápida sin necesidad de conexión a internet, sincronizando los datos directamente con la nube (Supabase) únicamente cuando la red está disponible.

---

## 📈 Estado de Fases de Desarrollo

### 🟢 Fase 1: Entorno de Desarrollo y Control de Acceso (Completado)

- Estructura de base de datos relacional definida y creada en Supabase (`empresas`, `usuarios`, `whitelist`, etc.).
- Lógica del `Android_ID` / `Vendor_ID` implementada en la inicialización móvil.
- Políticas RLS en Supabase para proteger e insertar de forma autónoma solicitudes en `whitelist`.
- Interfaz básica móvil para solicitar acceso al sistema y notificar estados (Pendiente, Activo, Revocado).

### 🟢 Fase 2: Configuración del Motor Offline - PowerSync (Completado)

- Instalación de `@powersync/react-native` y del motor nativo JSI `@powersync/op-sqlite`.
- Esquema de base de datos local en SQLite definido en `app/powerSyncSchema.ts`, espejeando todas las tablas del negocio (`clientes`, `rutas`, `visitas`, `productos`, `whitelist`, `usuarios`).
- Conector de Supabase-PowerSync creado en `app/powerSync.ts` utilizando la autenticación mediante tokens JWT (`getSupabaseToken`).

### 🟢 Fase 3: Validaciones Multitenant y Sincronización Inicial (Completado)

- **Consulta Relacional Multi-nivel**: Obtención del nombre del usuario y su empresa mediante un join relacional en una sola llamada inicial.
- **Checklist de Validaciones**:
  1.  🛜 **Internet**: Verificación de conectividad real mediante un ping ultrarrápido (HTTP HEAD con timeout).
  2.  👤 **Usuario**: Comprobación de que el dispositivo esté asignado a un usuario real en Supabase.
  3.  🏢 **Empresa**: Validación de que el usuario tenga un `empresa_id` asignado.
- **Sincronización Automatizada**: Si todas las validaciones son exitosas, la app inicializa la base SQLite local (`powerSync.init()`) e inicia la sincronización de red (`startSync()`) descargando los datos locales de forma segura y aislada por empresa.
- **UI Premium**: Panel de bienvenida interactivo que muestra el estado en tiempo real de cada paso y botón de reintento en caso de error.

### 🟢 Fase 4: Enrutamiento y Contexto de Sesión (Completado)

- Instalación y configuración de **React Navigation** (`@react-navigation/native-stack`) para transiciones nativas y manejo del historial de navegación (botón Atrás).
- Implementación de `SessionContext` para lectura y persistencia de `usuario_id` y `empresa_id` usando `AsyncStorage`.
- **Bypass de Sincronización**: Almacenamiento del estado `isInitialSyncComplete` para saltar la pantalla de `Check_sync` en inicios posteriores y enrutar directamente al `MainMenu`.
- **Menú Principal Moderno**: Cuadrícula de opciones (Clientes, Rutas, Visitas, Productos) y un indicador semafórico que monitorea la conexión a internet cada 30 segundos.

### 🟢 Fase 5: Módulo CRUD de Clientes Offline-First (Completado)

- Integración total de operaciones CRUD mediante `powerSync.execute()` para inserciones y modificaciones 100% locales en SQLite.
- Consultas ultra-rápidas y reactivas usando `usePowerSyncWatchedQuery`.
- Auto-generación de IDs universales (`UUID v4`) del lado del cliente al crear registros sin internet.
- Lógica de "Tombstone" (Soft Delete en SQLite) delegada a PowerSync para eliminar registros de la nube al recuperar conectividad.
- **Formulario Completo**: Modificado para almacenar campos de contacto del cliente (`cedula`, `correo`, `telefono`) localmente y sincronizarlos correctamente.

### 🟢 Fase 6: Autenticación Segura, RLS y Multi-tenant (Completado)

- **Vínculo Seguro de Autenticación**: Lógica basada en Supabase Anonymous Auth (`signInAnonymously`) vinculada al usuario de la base de datos local usando la función segura RPC `vincular_usuario_auth(p_device_id)` que registra el `auth.uid()` en la tabla `usuarios.auth_user_id`.
- **Seguridad RLS (Supabase)**: Habilitación de políticas a nivel de fila (*Row Level Security*) para restringir que los usuarios solo puedan leer o modificar la información de clientes que pertenezcan a su misma `empresa_id`.
- **Reglas de Sincronización Avanzadas**: Archivo `sync-rules.yaml` parametrizado dinámicamente mediante `request.user_id()` para generar cubos de datos aislados a nivel corporativo (`company_data` y `user_whitelist`), evitando fugas de datos y permitiendo que todos los usuarios de la misma empresa visualicen la información compartida (clientes, productos, etc.).
- **Espejeo de Esquemas**: Actualización de `powerSyncSchema.ts` (añadiendo la columna `auth_user_id`) para evitar inconsistencias de sincronización nativa (Schema Mismatch).
- **Publicación de Datos (Logical Replication)**: Integración de tablas críticas en la publicación de PostgreSQL `powersync` para la correcta recepción de mutaciones del lado del servidor.

### 🟢 Fase 7: Consola de Diagnóstico SQL y Testing (Completado)

- **Consola SQL Integrada**: Accesible desde el ícono de engranaje (configuración) en el `ProfileNavbar`. Permite ejecutar sentencias SELECT personalizadas, consultar tablas del motor SQLite (`sqlite_master`), visualizar colas de subida locales de PowerSync (`ps_crud`) y verificar en tiempo real el estado y estadísticas de red del conector.
- **Herramientas de Auditoría**: Implementación de scripts Node.js para inspeccionar la integridad del esquema en Supabase (`check-schema.js`) y auditar el mapeo relacional de datos (`check-data.js`).

---

## 📂 Archivos y Estructura del Repositorio

- [`Arquitectura_ERP_Visitas.md`](./Arquitectura_ERP_Visitas.md): Flujo de trabajo, geolocalización, diagramas y fases de desarrollo del proyecto.
- `/docs`: Documentación y configuración.
- `/scripts`: Scripts utilitarios de prueba y mantenimiento.
  - [`check-schema.js`](./scripts/check-schema.js): Compara las columnas de base de datos en Supabase con los esquemas móviles.
  - [`check-data.js`](./scripts/check-data.js): Diagnostica el mapeo de `auth_user_id` y relaciones multi-tenant entre usuarios y empresas.
- `/app`: Código fuente del cliente móvil Expo / React Native.
  - `/context`: `SessionContext.tsx` para proveer los datos de la sesión offline a todas las vistas.
  - `/hooks`: Lógica de inicialización (`useAppInit.ts`).
  - `/views`: Componentes segmentados por dominios (diseño, vista, lógica):
    - `Check_sync`: Tablero de estado inicial y descarga de SQLite.
    - `Main_menu`: Menú central del ERP y monitor de red.
      - `/Customers`: CRUD offline para la cartera de clientes.
      - `/SqlRunner`: Consola de administración local de bases de datos.
  - `powerSyncSchema.ts`: Definición del esquema local de tablas SQLite para sincronización offline.
  - `powerSync.ts`: Conector de sincronización que interactúa con la nube a través de tokens JWT firmados.

---

## 🛠️ Configuración de Seguridad y PowerSync Cloud

Para que la sincronización en tiempo real y offline-first funcione correctamente entre Supabase, PowerSync Cloud y la aplicación móvil, asegúrate de tener configurado lo siguiente:

1. **Publicación en Supabase**:
   Ejecuta el siguiente comando SQL en Supabase para habilitar la réplica lógica sobre las tablas críticas:
   ```sql
   ALTER PUBLICATION powersync ADD TABLE 
     public.clientes, 
     public.usuarios, 
     public.empresas, 
     public.rutas, 
     public.visitas, 
     public.productos, 
     public.visita_productos, 
     public.whitelist;
   ```
2. **Client Auth en PowerSync Cloud**:
   En el panel de control de tu instancia en PowerSync, ve a **Client Auth** e introduce los certificados del emisor de JWT (Supabase):
   * **JWKS URL**: `https://<tu-id-proyecto>.supabase.co/auth/v1/certs`
   * **Accepted JWT Audience**: `authenticated`

---

## 📦 Compilación de la APK para Dispositivos (EAS Build)

Al usar `@powersync/op-sqlite`, la aplicación contiene código nativo C++ de alto rendimiento (JSI). Por lo tanto, no es compatible con el entorno de pruebas de **Expo Go**. Debes generar una build nativa o emular de la siguiente forma:

### Opción A: Compilación en la Nube con EAS (Recomendado para APK)

1.  Instala de forma global las herramientas de Expo CLI y EAS CLI:
    ```bash
    npm install -g eas-cli
    ```
2.  Inicia sesión en tu cuenta de Expo (puedes crear una cuenta gratuita en [expo.dev](https://expo.dev)):
    ```bash
    eas login
    ```
3.  Enlaza el proyecto local a tu cuenta (ejecutar en la carpeta `app/`):
    ```bash
    eas project:init
    ```
4.  Genera la APK directamente en los servidores de Expo en la nube (el perfil `preview` está preconfigurado para generar una APK descargable):
    ```bash
    eas build --profile preview --platform android
    ```
    _Nota: Si te pregunta por el archivo Keystore de Android, selecciona que Expo lo gestione automáticamente._

Al terminar, la terminal te entregará un link de descarga y un código QR para instalar la APK en tu dispositivo móvil.

### Opción B: Emular Localmente con Código Nativo

Para correr y compilar la app directamente en un emulador local de Android Studio con el SDK instalado:

```bash
npx expo run:android
```
