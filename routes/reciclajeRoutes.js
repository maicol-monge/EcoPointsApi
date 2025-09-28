const express = require("express");
const router = express.Router();
const {
  registrarReciclaje,
  obtenerReciclajesUsuario,
  obtenerReciclajesTienda,
  obtenerEstadisticasReciclaje
} = require("../controllers/reciclajeController");

// ======================
// RUTAS DE RECICLAJES
// ======================

// POST /api/reciclajes - Registrar nuevo reciclaje
router.post("/", registrarReciclaje);

// GET /api/reciclajes/usuario/:id_usuario - Obtener reciclajes por usuario
router.get("/usuario/:id_usuario", obtenerReciclajesUsuario);

// GET /api/reciclajes/tienda/:id_tienda - Obtener reciclajes por tienda
router.get("/tienda/:id_tienda", obtenerReciclajesTienda);

// GET /api/reciclajes/estadisticas - Obtener estadísticas generales
router.get("/estadisticas", obtenerEstadisticasReciclaje);

module.exports = router;