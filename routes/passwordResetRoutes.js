const express = require("express");
const router = express.Router();
const { solicitarReset, validarToken, confirmarReset } = require("../controllers/passwordResetController");

// POST /api/password/solicitar - Solicitar restablecimiento (tipo: 'usuario'|'tienda', correo)
router.post("/solicitar", solicitarReset);

// GET /api/password/validar/:token - Validar token desde el frontend (React en Render)
router.get("/validar/:token", validarToken);

// POST /api/password/confirmar/:token - Confirmar restablecimiento con nueva contraseña
router.post("/confirmar/:token", confirmarReset);

module.exports = router;
