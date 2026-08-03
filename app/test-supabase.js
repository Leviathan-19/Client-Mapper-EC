require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function testConnection() {
  console.log("Probando conexión a Supabase...");
  console.log("URL:", SUPABASE_URL);

  try {
    // Hacemos una petición simple REST a la tabla 'whitelist' (con un límite de 1 para no traer todo)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/whitelist?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log("\n✅ ¡CONEXIÓN EXITOSA! Las credenciales de tu .env son correctas.");
      const data = await response.json();
      console.log("Datos recibidos de Supabase:", data);
    } else {
      console.error("\n❌ ERROR DE CONEXIÓN. Las credenciales podrían estar mal.");
      console.error("Status:", response.status, response.statusText);
      const errorData = await response.json();
      console.error("Detalle:", errorData);
    }
  } catch (error) {
    console.error("\n❌ ERROR CRÍTICO. No se pudo hacer la petición. Verifica tu conexión a internet o la URL.");
    console.error(error.message);
  }
}

testConnection();
