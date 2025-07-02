const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Ejecutar el script Python
console.log("Ejecutando el script Python...");
execSync("python scripts/generar_datos.py", { stdio: "inherit" });

// Mover el archivo JSON a la carpeta public/
const origen = path.join(__dirname, "datos_meteorologicos.json");
const destino = path.join(__dirname, "..", "public", "datos_meteorologicos.json");

if (fs.existsSync(origen)) {
    fs.copyFileSync(origen, destino);
    console.log("✅ Archivo datos_meteorologicos.json copiado a /public");
    fs.unlinkSync(origen);
} else {
    console.error("❌ No se encontró datos_meteorologicos.json en scripts/");
}