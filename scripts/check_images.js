const { supabase } = require('../src/config/supabaseClient');

async function check() {
  const { data, error } = await supabase.from('productos').select('*');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Productos:");
    data.forEach(p => {
      console.log(`ID: ${p.id} | Nombre: ${p.nombre} | Imagen URL: ${p.imagen_url}`);
    });
  }
}
check();
