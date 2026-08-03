# Cliente Mapper EC

Bienvenido al repositorio del proyecto **Cliente Mapper EC**, un ERP dinámico móvil enfocado en el registro y gestión de visitas a clientes. 

El núcleo del sistema es su arquitectura **100% Offline-First y Serverless**, lo que significa que la app es completamente funcional y rápida sin necesidad de conexión a internet, sincronizando los datos directamente con la nube (Supabase) únicamente cuando la red está disponible.

## Estado Actual del Proyecto: (Fase 1 - En Progreso)

Actualmente nos encontramos en la Fase 1 del proyecto (Arquitectura Base y Entorno de Desarrollo). Hasta el momento se ha avanzado con lo siguiente:

1. **Arquitectura Definida:** Se re-estructuró la propuesta original para eliminar los intermediarios (backend tradicional) logrando un diseño mucho más eficiente usando Supabase + Base de Datos Local.
2. **Esquema de Base de Datos:** Se definieron y estructuraron todas las tablas necesarias (usando UUIDs), y se preparó el código SQL.
3. **Control de Acceso:** Se conceptualizó e incluyó un sistema de login basado en Hardware (`whitelist`) en lugar de usuarios y contraseñas tradicionales para facilitar el acceso offline.
4. **Proyecto Expo (Frontend):** Se inicializó exitosamente el proyecto base de React Native dentro de la carpeta `app/` utilizando la versión 54 de Expo y el template de TypeScript.

## Estructura del Repositorio (Archivos Documentales)

*   [`Arquitectura_ERP_Visitas.md`](./Arquitectura_ERP_Visitas.md): El documento principal y detallado con las reglas del sistema, lógica de sincronización, esquema relacional y Fases de Desarrollo.
*   [`supabase.txt`](./supabase.txt): Archivo SQL puro listo para copiarse y ejecutarse en Supabase y así crear las tablas (`empresas`, `usuarios`, `whitelist`, `clientes`, `visitas`, etc).
*   [`commands.txt`](./commands.txt): Registro documental.
*   `/app`: La carpeta que contiene todo el código fuente de la aplicación móvil de React Native.

## Próximos Pasos a Ejecutar

Para finalizar la **Fase 1**, necesitamos:

- [ ] Instalar la librería cliente de Supabase dentro del proyecto móvil (`/app`).
- [ ] Instalar la librería para capturar el ID único del dispositivo móvil (Android ID / UUID).
- [ ] Programar la lógica inicial: Que la app lea su ID, lo envíe a Supabase y consulte si se encuentra en estado 'activo' dentro de la tabla `whitelist`.
- [ ] Elegir e instalar el motor de sincronización (WatermelonDB o PowerSync).
