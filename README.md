# Cliente Mapper EC

Bienvenido al repositorio del proyecto **Cliente Mapper EC**, un ERP dinámico móvil enfocado en el registro y gestión de visitas a clientes. 

El núcleo del sistema es su arquitectura **100% Offline-First y Serverless**, lo que significa que la app es completamente funcional y rápida sin necesidad de conexión a internet, sincronizando los datos directamente con la nube (Supabase) únicamente cuando la red está disponible.

---

## 📈 Estado de Fases de Desarrollo

### 🟢 Fase 1: Entorno de Desarrollo y Control de Acceso (Completado)
*   Estructura de base de datos relacional definida y creada en Supabase (`empresas`, `usuarios`, `whitelist`, etc.).
*   Lógica del `Android_ID` / `Vendor_ID` implementada en la inicialización móvil.
*   Políticas RLS en Supabase para proteger e insertar de forma autónoma solicitudes en `whitelist`.
*   Interfaz básica móvil para solicitar acceso al sistema y notificar estados (Pendiente, Activo, Revocado).

### 🟢 Fase 2: Configuración del Motor Offline - PowerSync (Completado)
*   Instalación de `@powersync/react-native` y del motor nativo JSI `@powersync/op-sqlite`.
*   Esquema de base de datos local en SQLite definido en `app/powerSyncSchema.ts`, espejeando todas las tablas del negocio (`clientes`, `rutas`, `visitas`, `productos`, `whitelist`, `usuarios`).
*   Conector de Supabase-PowerSync creado en `app/powerSync.ts` utilizando la autenticación mediante tokens JWT (`getSupabaseToken`).

### 🟢 Fase 3: Validaciones Multitenant y Sincronización Inicial (Completado)
*   **Consulta Relacional Multi-nivel**: Obtención del nombre del usuario y su empresa mediante un join relacional en una sola llamada inicial.
*   **Checklist de Validaciones**:
    1.  🛜 **Internet**: Verificación de conectividad real mediante un ping ultrarrápido (HTTP HEAD con timeout).
    2.  👤 **Usuario**: Comprobación de que el dispositivo esté asignado a un usuario real en Supabase.
    3.  🏢 **Empresa**: Validación de que el usuario tenga un `empresa_id` asignado.
*   **Sincronización Automatizada**: Si todas las validaciones son exitosas, la app inicializa la base SQLite local (`powerSync.init()`) e inicia la sincronización de red (`startSync()`) descargando los datos locales de forma segura y aislada por empresa.
*   **UI Premium**: Panel de bienvenida interactivo que muestra el estado en tiempo real de cada paso y botón de reintento en caso de error.

---

## 📂 Archivos y Estructura del Repositorio

*   [`Arquitectura_ERP_Visitas.md`](./Arquitectura_ERP_Visitas.md): Flujo de trabajo, geolocalización, diagramas y fases de desarrollo del proyecto.
*   `/docs`: Documentación y configuración.
    *   [`supabase.txt`](./docs/supabase.txt): Scripts DDL completos (tablas, llaves primarias/foráneas, y políticas RLS para lectura y escritura).
    *   [`dictionary.txt`](./docs/dictionary.txt): Diccionario de datos exhaustivo de las tablas y campos del ERP.
    *   [`commands.txt`](./docs/commands.txt): Comandos comunes para desarrollo y pruebas.
*   `/scripts`: Scripts utilitarios de prueba y mantenimiento.
    *   [`test-supabase.js`](./scripts/test-supabase.js): Prueba de conexión básica.
    *   [`test-supabase-join.js`](./scripts/test-supabase-join.js): Prueba de joins relacionales para validación offline-first.
*   `/app`: Código fuente del cliente móvil Expo / React Native.
    *   `/assets`: Archivos estáticos como el logotipo de la aplicación (`logo_clientmapper_purple.png`).
    *   `App.tsx`: Pantalla principal, lógica de whitelist, validación de internet/usuarios y panel de sincronización.
    *   `powerSyncSchema.ts`: Definición del esquema local de tablas SQLite para sincronización offline.
    *   `powerSync.ts`: Inicialización de `PowerSyncDatabase` con el adaptador de alto rendimiento `op-sqlite` y el conector JWT de Supabase.

---

## 🔍 Guía de Pruebas Manuales (Fase 3)

Puedes probar los diferentes comportamientos del checklist en tu emulador modificando la base de datos de Supabase:

1.  **Sin Internet**: Apaga la conexión Wi-Fi de tu emulador. La app bloqueará el inicio mostrando 🔴 en **Conectividad de Red**.
2.  **Sin Usuario**: En la tabla `whitelist` de Supabase, pon `usuario_id = NULL` para el dispositivo correspondiente. Al reintentar, se bloqueará con 🔴 en **Asignación de Usuario**.
3.  **Sin Empresa**: En la tabla `usuarios`, pon `empresa_id = NULL` para el usuario asignado. El checklist se detendrá en 🔴 para **Empresa Autorizada**.
4.  **Sincronización Exitosa**: Asegúrate de tener internet, y de que la relación de dispositivo-usuario-empresa sea completamente válida. Todos los indicadores se pondrán en verde (🟢) e iniciará la descarga en segundo plano.

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
    *Nota: Si te pregunta por el archivo Keystore de Android, selecciona que Expo lo gestione automáticamente.*

Al terminar, la terminal te entregará un link de descarga y un código QR para instalar la APK en tu dispositivo móvil.

### Opción B: Emular Localmente con Código Nativo
Para correr y compilar la app directamente en un emulador local de Android Studio con el SDK instalado:
```bash
npx expo run:android
```
