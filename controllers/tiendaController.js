const { db } = require("../config/db");
const bcrypt = require("bcryptjs");

// ======================
// TIENDAS - Controladores
// ======================

// Registrar tienda
const registrarTienda = async (req, res) => {
  try {
    const { nombre, direccion, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Nombre, correo y contraseña son requeridos" 
      });
    }

    // Verificar si la tienda ya existe
    const tiendaExistente = await db.query(
      'SELECT * FROM reciclaje.Tienda WHERE correo = $1',
      [correo]
    );

    if (tiendaExistente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Tienda ya registrada con este correo" 
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar tienda
    const resultado = await db.query(
      `INSERT INTO reciclaje.Tienda 
       (nombre, direccion, correo, password, estado) 
       VALUES ($1, $2, $3, $4, 'A') 
       RETURNING id_tienda, nombre, direccion, correo, fecha_registro`,
      [nombre, direccion, correo, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Tienda registrada exitosamente",
      data: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar tienda:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Login tienda
const loginTienda = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Correo y contraseña son requeridos" 
      });
    }

    // Buscar tienda
    const tienda = await db.query(
      'SELECT * FROM reciclaje.Tienda WHERE correo = $1 AND estado = $2',
      [correo, 'A']
    );

    if (tienda.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Credenciales inválidas" 
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, tienda.rows[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: "Credenciales inválidas" 
      });
    }

    // Excluir contraseña de la respuesta
    const { password: _, ...tiendaData } = tienda.rows[0];

    res.json({
      success: true,
      message: "Login exitoso",
      data: tiendaData
    });

  } catch (error) {
    console.error('Error en login tienda:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener todas las tiendas activas
const obtenerTiendas = async (req, res) => {
  try {
    const tiendas = await db.query(
      `SELECT id_tienda, nombre, direccion, correo, fecha_registro 
       FROM reciclaje.Tienda 
       WHERE estado = 'A' 
       ORDER BY nombre`
    );

    res.json({
      success: true,
      data: tiendas.rows
    });

  } catch (error) {
    console.error('Error al obtener tiendas:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener tienda por ID
const obtenerTiendaPorId = async (req, res) => {
  try {
    const { id_tienda } = req.params;

    const tienda = await db.query(
      `SELECT id_tienda, nombre, direccion, correo, fecha_registro 
       FROM reciclaje.Tienda 
       WHERE id_tienda = $1 AND estado = 'A'`,
      [id_tienda]
    );

    if (tienda.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Tienda no encontrada" 
      });
    }

    res.json({
      success: true,
      data: tienda.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener tienda:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener productos de una tienda
const obtenerProductosTienda = async (req, res) => {
  try {
    const { id_tienda } = req.params;

    const productos = await db.query(
      `SELECT id_producto, nombre, descripcion, costo_puntos, stock, imagen, fecha_creacion
       FROM reciclaje.Productos 
       WHERE id_tienda = $1 AND estado = 'A' AND stock > 0
       ORDER BY nombre`,
      [id_tienda]
    );

    res.json({
      success: true,
      data: productos.rows
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

module.exports = {
  registrarTienda,
  loginTienda,
  obtenerTiendas,
  obtenerTiendaPorId,
  obtenerProductosTienda
};