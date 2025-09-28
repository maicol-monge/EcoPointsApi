require("dotenv").config(); //Cargar variables d entorno
const express = require("express"); //Crear servidor web
const cors = require("cors"); //Para permitir solicitudes desde otro dominio

const { db, testConnection } = require("./config/db");

// Importar todas las rutas
const usuarioRoutes = require("./routes/usuarioRoutes");
const tiendaRoutes = require("./routes/tiendaRoutes");
const productoRoutes = require("./routes/productoRoutes");
const reciclajeRoutes = require("./routes/reciclajeRoutes");
const canjeRoutes = require("./routes/canjeRoutes");
const objetoRoutes = require("./routes/objetoRoutes");
const rankingRoutes = require("./routes/rankingRoutes");
const imagenRoutes = require("./routes/imagenRoutes");

const app = express(); //Instancia del servidor

 //Evitar errores al consumir en Swift iOS y otras aplicaciones
const allowedOrigins = [
  'https://controlcitas-frontend-production.up.railway.app',
  'http://localhost:5173', // desarrollo web
  'http://localhost:3000', // desarrollo web alternativo
  // Agregar aquí otros orígenes según sea necesario
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origin (como aplicaciones móviles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, true); // Permitir todos los orígenes por ahora
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json()); //Recibir los datos en JSON

// Probar conexión a la base de datos PostgreSQL
testConnection().then(connected => {
  if (!connected) {
    console.error("⚠️  No se pudo conectar a la base de datos");
    console.error("📋 Verifica:");
    console.error("   - DATABASE_URL en el archivo .env");
    console.error("   - Estado de la base de datos en Render");
    console.error("   - Conectividad de red");
    // No salir inmediatamente, permitir que el servidor inicie
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});

// Rutas de la API de Reciclaje
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/tiendas", tiendaRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/reciclajes", reciclajeRoutes);
app.use("/api/canjes", canjeRoutes);
app.use("/api/objetos", objetoRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/imagenes", imagenRoutes);

// Ruta de estado de la API
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "API de EcoPoints funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});
