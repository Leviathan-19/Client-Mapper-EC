# Cliente Mapper EC

Bienvenido al repositorio del proyecto **Cliente Mapper EC**, un ERP dinámico móvil enfocado en el registro y gestión de visitas a clientes. 

El núcleo del sistema es su arquitectura **100% Offline-First y Serverless**, lo que significa que la app es completamente funcional y rápida sin necesidad de conexión a internet, sincronizando los datos directamente con la nube (Supabase) únicamente cuando la red está disponible.

## Estado Actual del Proyecto: (Fase 1 Completada - Inicio de Fase 2)

Actualmente hemos concluido la Fase 1 del proyecto (Arquitectura Base y Entorno de Desarrollo). Hasta el momento se ha avanzado con lo siguiente:

1. **Arquitectura Definida:** Se re-estructuró la propuesta original para eliminar los intermediarios (backend tradicional) logrando un diseño mucho más eficiente usando Supabase + Base de Datos Local.
2. **Esquema de Base de Datos:** Se definieron y estructuraron todas las tablas necesarias (usando UUIDs), y se preparó el código SQL.
3. **Control de Acceso:** Se conceptualizó e incluyó un sistema de login basado en Hardware (`whitelist`) en lugar de usuarios y contraseñas tradicionales para facilitar el acceso offline.
4. **Proyecto Expo (Frontend):** Se inicializó exitosamente el proyecto base de React Native dentro de la carpeta `app/` utilizando la versión 54 de Expo y el template de TypeScript.

## Estructura del Repositorio (Archivos Documentales)

*   [`Arquitectura_ERP_Visitas.md`](./Arquitectura_ERP_Visitas.md): El documento principal y detallado con las reglas del sistema, lógica de sincronización, esquema relacional y Fases de Desarrollo.
*   [`supabase.txt`](./supabase.txt): Archivo SQL puro listo para copiarse y ejecutarse en Supabase y así crear las tablas (`empresas`, `usuarios`, `whitelist`, `clientes`, `rutas`, `visitas`, etc).
*   [`dictionary.txt`](./dictionary.txt): Diccionario de datos que explica cada tabla, atributo y el flujo lógico de la aplicación (incluyendo la lógica de Rutas y validaciones del dispositivo).
*   [`commands.txt`](./commands.txt): Registro documental.
*   `/app`: La carpeta que contiene todo el código fuente de la aplicación móvil de React Native.

## Hitos Alcanzados (Fase 1)

- [x] Configuración de la estructura de tablas y relaciones en Supabase, incorporando el modelo de `rutas` y control de acceso por `whitelist`.
- [x] Configuración de Políticas de Seguridad (RLS) en la tabla `whitelist` permitiendo a los dispositivos nuevos registrarse automáticamente como `'pendiente'`.
- [x] Instalación de la librería cliente de Supabase (`@supabase/supabase-js`) y librerías de identificación (`expo-application`, `expo-device`).
- [x] Programación de la lógica inicial en `App.tsx`: La app lee su ID, solicita acceso si no existe, o ingresa si fue aprobado por el administrador.
- [x] Elección del motor de sincronización Offline-First: Se decidió avanzar con **PowerSync** dada su perfecta integración con Supabase.

## Próximos Pasos (Fase 2 - Configuración Offline)

Para avanzar con la **Fase 2**, necesitamos:

- [ ] Instalar e inicializar la librería de **PowerSync** en el proyecto React Native.
- [ ] Conectar PowerSync con Supabase configurando las credenciales de conexión JWT.
- [ ] Crear el esquema de base de datos local en SQLite (a través de PowerSync) espejeando las tablas de `clientes`, `rutas`, `visitas`, `productos`, etc.
- [ ] Desarrollar la lógica principal tras el inicio de sesión para que PowerSync comience a descargar los datos iniciales y se mantenga sincronizado.
