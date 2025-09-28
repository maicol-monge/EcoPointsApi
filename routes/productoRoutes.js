const express = require("express");
const router = express.Router();
const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  buscarProductos
} = require("../controllers/productoController");

// ======================
// RUTAS DE PRODUCTOS
// ======================

// POST /api/productos - Crear nuevo producto
router.post("/", crearProducto);

// GET /api/productos - Obtener todos los productos
router.get("/", obtenerProductos);

// GET /api/productos/buscar?q=termino - Buscar productos
router.get("/buscar", buscarProductos);

// GET /api/productos/:id_producto - Obtener producto por ID
router.get("/:id_producto", obtenerProductoPorId);

module.exports = router;