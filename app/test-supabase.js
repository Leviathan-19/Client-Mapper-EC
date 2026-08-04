// test-supabase.js
// ------------------------------------------------------------
// Script de depuración para validar que el device_id
// devuelve el nombre del usuario asociado (tabla usuarios).
// ------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config(); // carga variables .env (SUPABASE_URL, SUPABASE_ANON_KEY)

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ ERROR: No se encuentran las variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Consulta a Supabase para obtener el nombre del usuario asociado a un device_id.
 * @param {string} deviceId - El device_id que aparece en la tabla whitelist.
 * @returns {Promise<string|null>} - Nombre del usuario o null si no se encuentra.
 */
async function obtenerNombre(deviceId) {
  try {
    console.log(`🔎 Consultando whitelist para device_id = ${deviceId}`);

    const { data, error, status } = await supabase
      .from("whitelist")
      // join explícito con la tabla usuarios para obtener el campo nombre
      .select("estado, usuario_id, usuarios(nombre)")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (error) {
      // ------------------------------------------------
      // Manejo de errores de RLS / permisos
      // ------------------------------------------------
      if (status === 42501) {
        console.error(
          "❌ PERMISO NEGADO (RLS). La política para la tabla 'usuarios' probablemente falta."
        );
      } else {
        console.error(`❌ Error de consulta (status ${status}):`, error.message);
      }
      return null;
    }

    if (!data) {
      console.warn("⚠️ No se encontró registro en whitelist para ese device_id.");
      return null;
    }

    // ------------------------------------------------
    // Extraer nombre del usuario
    // ------------------------------------------------
    let nombre = "Desconocido";

    // Caso 1: la relación llega como array (PostgREST la devuelve así)
    if (data.usuarios && Array.isArray(data.usuarios) && data.usuarios.length > 0) {
      nombre = data.usuarios[0].nombre;
    } else if (data.usuario_id) {
      // Caso 2: segunda consulta directa a usuarios
      const { data: usr, error: usrErr, status: usrStatus } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", data.usuario_id)
        .maybeSingle();

      if (usrErr) {
        if (usrStatus === 42501) {
          console.error(
            "❌ PERMISO NEGADO (RLS) al leer tabla 'usuarios'."
          );
        } else {
          console.error(`❌ Error al consultar usuarios (status ${usrStatus}):`, usrErr.message);
        }
      } else if (usr && usr.nombre) {
        nombre = usr.nombre;
      }
    }

    console.log(`✅ Nombre encontrado: ${nombre}`);
    return nombre;
  } catch (e) {
    console.error("❌ EXCEPCIÓN INESPERADA:", e);
    return null;
  }
}

// ------------------------------------------------------------
// Entrada de línea de comandos
// ------------------------------------------------------------
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Uso: node test-supabase.js <device_id>");
  process.exit(1);
}

const deviceId = args[0];
obtenerNombre(deviceId).then((nombre) => {
  if (nombre) {
    console.log(`\n✨ Resultado final → Usuario: ${nombre}`);
  } else {
    console.log("\n⚡️ No se pudo obtener el nombre del usuario.");
  }
});
