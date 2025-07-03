const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Detectar el comando de Python según el sistema operativo
const isWin = process.platform === "win32";
const pythonCmd = isWin ? "python" : "python3";

// Ejecutar el script Python
console.log("Ejecutando el script Python...");
execSync(`${pythonCmd} scripts/generar_datos.py`, { stdio: "inherit" });

// Mover el archivo JSON a la carpeta public/
const origen = path.join(__dirname, "datos_meteorologicos.json");
const destino = path.join(__dirname, "..", "public", "datos_meteorologicos.json");

if (fs.existsSync(origen)) {
    fs.copyFileSync(origen, destino);
    console.log("✅ Archivo datos_meteorologicos.json movido a /public");
    fs.unlinkSync(origen);
} else {
    console.error("❌ No se encontró datos_meteorologicos.json en scripts/");
}