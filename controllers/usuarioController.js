const { db } = require("../config/db");
const bcrypt = require("bcryptjs");

// ======================
// USUARIOS - Controladores
// ======================

// Registrar usuario
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, documento_tipo, documento_num, correo, password } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !documento_tipo || !documento_num || !correo || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son requeridos" 
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await db.query(
      'SELECT * FROM reciclaje.Usuarios WHERE documento_num = $1 OR correo = $2',
      [documento_num, correo]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Usuario ya registrado con este documento o correo" 
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const resultado = await db.query(
      `INSERT INTO reciclaje.Usuarios 
       (nombre, apellido, documento_tipo, documento_num, correo, password, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, 'A') 
       RETURNING id_usuario, nombre, apellido, correo, puntos_acumulados, fecha_registro`,
      [nombre, apellido, documento_tipo, documento_num, correo, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Login usuario
const loginUsuario = async (req, res) => {
  try {
    const { documento_num, password } = req.body;

    if (!documento_num || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Documento y contraseña son requeridos" 
      });
    }

    // Buscar usuario
    const usuario = await db.query(
      'SELECT * FROM reciclaje.Usuarios WHERE documento_num = $1 AND estado = $2',
      [documento_num, 'A']
    );

    if (usuario.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Credenciales inválidas" 
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, usuario.rows[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: "Credenciales inválidas" 
      });
    }

    // Excluir contraseña de la respuesta
    const { password: _, ...userData } = usuario.rows[0];

    res.json({
      success: true,
      message: "Login exitoso",
      data: userData
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener perfil de usuario
const obtenerPerfilUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const usuario = await db.query(
      `SELECT id_usuario, nombre, apellido, documento_tipo, documento_num, 
              correo, puntos_acumulados, fecha_registro 
       FROM reciclaje.Usuarios 
       WHERE id_usuario = $1 AND estado = 'A'`,
      [id_usuario]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    res.json({
      success: true,
      data: usuario.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Actualizar puntos de usuario (interno)
const actualizarPuntos = async (id_usuario, puntos, operacion = 'sumar') => {
  try {
    const query = operacion === 'sumar' 
      ? 'UPDATE reciclaje.Usuarios SET puntos_acumulados = puntos_acumulados + $1 WHERE id_usuario = $2'
      : 'UPDATE reciclaje.Usuarios SET puntos_acumulados = puntos_acumulados - $1 WHERE id_usuario = $2';
    
    await db.query(query, [puntos, id_usuario]);
    return true;
  } catch (error) {
    console.error('Error al actualizar puntos:', error);
    return false;
  }
};

// Obtener historial de reciclajes del usuario
const obtenerHistorialReciclajes = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const historial = await db.query(
      `SELECT r.id_reciclaje, r.peso, r.puntos_ganados, r.fecha, r.codigo_qr,
              o.nombre as objeto_nombre, o.descripcion as objeto_descripcion,
              t.nombre as tienda_nombre
       FROM reciclaje.Reciclajes r
       JOIN reciclaje.Objetos o ON r.id_objeto = o.id_objeto
       JOIN reciclaje.Tienda t ON r.id_tienda = t.id_tienda
       WHERE r.id_usuario = $1 AND r.estado = 'A'
       ORDER BY r.fecha DESC`,
      [id_usuario]
    );

    res.json({
      success: true,
      data: historial.rows
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener historial de canjes del usuario
const obtenerHistorialCanjes = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const historial = await db.query(
      `SELECT c.id_canje, c.puntos_usados, c.fecha,
              p.nombre as producto_nombre, p.descripcion as producto_descripcion,
              p.imagen as producto_imagen,
              t.nombre as tienda_nombre
       FROM reciclaje.Canjes c
       JOIN reciclaje.Productos p ON c.id_producto = p.id_producto
       JOIN reciclaje.Tienda t ON c.id_tienda = t.id_tienda
       WHERE c.id_usuario = $1 AND c.estado = 'A'
       ORDER BY c.fecha DESC`,
      [id_usuario]
    );

    res.json({
      success: true,
      data: historial.rows
    });

  } catch (error) {
    console.error('Error al obtener historial de canjes:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerPerfilUsuario,
  actualizarPuntos,
  obtenerHistorialReciclajes,
  obtenerHistorialCanjes
};