const express = require("express");
const router = express.Router();
const {
  realizarCanje,
  obtenerCanjesUsuario,
  obtenerCanjesTienda,
  verificarDisponibilidadCanje
} = require("../controllers/canjeController");

// ======================
// RUTAS DE CANJES
// ======================

// POST /api/canjes - Realizar nuevo canje
router.post("/", realizarCanje);

// POST /api/canjes/verificar - Verificar disponibilidad de canje
router.post("/verificar", verificarDisponibilidadCanje);

// GET /api/canjes/usuario/:id_usuario - Obtener canjes por usuario
router.get("/usuario/:id_usuario", obtenerCanjesUsuario);

// GET /api/canjes/tienda/:id_tienda - Obtener canjes por tienda
router.get("/tienda/:id_tienda", obtenerCanjesTienda);

module.exports = router;