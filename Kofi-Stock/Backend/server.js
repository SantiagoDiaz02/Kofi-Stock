import express from "express";
import fileUpload from "express-fileupload";
import xlsx from "xlsx";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.json());

// Variables de entorno (pueden completarse luego en Render)
const TOKEN = process.env.TELEGRAM_TOKEN || "8403372468:AAGRxMC8YSHZUV7ywvAWOpiPnj1qmp7U2gs";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "7939024042";

// Función para enviar alerta a Telegram
async function sendTelegramAlert(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
    console.log("✅ Alerta enviada:", message);
  } catch (error) {
    console.error("❌ Error al enviar alerta:", error.message);
  }
}

// Ruta para procesar archivo Excel
app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("No se subió ningún archivo.");
  }

  try {
    const workbook = xlsx.read(req.files.file.data, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Validar columnas esperadas
    if (!data[0] || !("Producto" in data[0]) || !("Stock" in data[0]) || !("Mínimo" in data[0] || "Minimo" in data[0])) {
      return res.status(400).json({
        success: false,
        error: "El archivo debe tener las columnas: Producto, Stock y Mínimo.",
      });
    }

    // Buscar productos con stock bajo
    const lowStock = data.filter(
      (p) => p.Stock < (p.Mínimo || p.Minimo)
    );

    // Enviar alertas si hay productos con stock bajo
    for (const item of lowStock) {
      const nombre = item.Producto || item.Product || "Producto desconocido";
      const stock = item.Stock ?? "N/A";
      const minimo = item.Mínimo || item.Minimo || "N/A";
      await sendTelegramAlert(
        `⚠️ *Alerta de stock bajo*\nProducto: ${nombre}\nStock actual: ${stock}\nMínimo: ${minimo}`
      );
    }

    res.json({ success: true, lowStock });
  } catch (err) {
    console.error("❌ Error al procesar el archivo:", err.message);
    res.status(500).json({ success: false, error: "Error procesando el archivo." });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor Kofi-Stock activo en puerto ${PORT}`));
