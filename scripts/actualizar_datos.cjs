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
    // Copiar también a dist/ si existe
    const destinoDist = path.join(__dirname, "..", "dist", "datos_meteorologicos.json");
    if (fs.existsSync(path.join(__dirname, "..", "dist"))) {
        fs.copyFileSync(destino, destinoDist);
        console.log("✅ Archivo datos_meteorologicos.json movido a /dist");
    } else {
        console.warn("⚠️ La carpeta dist/ no existe. No se copió el JSON a dist/");
    }
    fs.unlinkSync(origen);
} else {
    console.error("❌ No se encontró datos_meteorologicos.json en scripts/");
}