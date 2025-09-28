const { db } = require("../config/db");

// ======================
// PRODUCTOS - Controladores
// ======================

// Crear producto (para tiendas)
const crearProducto = async (req, res) => {
  try {
    const { id_tienda, nombre, descripcion, costo_puntos, stock, imagen } = req.body;

    if (!id_tienda || !nombre || !costo_puntos || !stock) {
      return res.status(400).json({ 
        success: false, 
        message: "Tienda, nombre, costo en puntos y stock son requeridos" 
      });
    }

    // Verificar que la tienda existe
    const tiendaExiste = await db.query(
      'SELECT id_tienda FROM reciclaje.Tienda WHERE id_tienda = $1 AND estado = $2',
      [id_tienda, 'A']
    );

    if (tiendaExiste.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Tienda no encontrada" 
      });
    }

    // Insertar producto
    const resultado = await db.query(
      `INSERT INTO reciclaje.Productos 
       (id_tienda, nombre, descripcion, costo_puntos, stock, imagen, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, 'A') 
       RETURNING *`,
      [id_tienda, nombre, descripcion, costo_puntos, stock, imagen]
    );

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener todos los productos disponibles
const obtenerProductos = async (req, res) => {
  try {
    const productos = await db.query(
      `SELECT p.*, t.nombre as tienda_nombre, t.direccion as tienda_direccion
       FROM reciclaje.Productos p
       JOIN reciclaje.Tienda t ON p.id_tienda = t.id_tienda
       WHERE p.estado = 'A' AND p.stock > 0 AND t.estado = 'A'
       ORDER BY p.nombre`
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

// Obtener producto por ID
const obtenerProductoPorId = async (req, res) => {
  try {
    const { id_producto } = req.params;

    const producto = await db.query(
      `SELECT p.*, t.nombre as tienda_nombre, t.direccion as tienda_direccion
       FROM reciclaje.Productos p
       JOIN reciclaje.Tienda t ON p.id_tienda = t.id_tienda
       WHERE p.id_producto = $1 AND p.estado = 'A' AND t.estado = 'A'`,
      [id_producto]
    );

    if (producto.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Producto no encontrado" 
      });
    }

    res.json({
      success: true,
      data: producto.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Actualizar stock de producto (función interna)
const actualizarStock = async (id_producto, cantidad, operacion = 'restar') => {
  try {
    const query = operacion === 'restar' 
      ? 'UPDATE reciclaje.Productos SET stock = stock - $1 WHERE id_producto = $2 AND stock >= $1'
      : 'UPDATE reciclaje.Productos SET stock = stock + $1 WHERE id_producto = $2';
    
    const resultado = await db.query(query, [cantidad, id_producto]);
    return resultado.rowCount > 0;
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return false;
  }
};

// Buscar productos por nombre
const buscarProductos = async (req, res) => {
  try {
    const { q } = req.query; // query parameter

    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: "Parámetro de búsqueda requerido" 
      });
    }

    const productos = await db.query(
      `SELECT p.*, t.nombre as tienda_nombre, t.direccion as tienda_direccion
       FROM reciclaje.Productos p
       JOIN reciclaje.Tienda t ON p.id_tienda = t.id_tienda
       WHERE (LOWER(p.nombre) LIKE LOWER($1) OR LOWER(p.descripcion) LIKE LOWER($1))
         AND p.estado = 'A' AND p.stock > 0 AND t.estado = 'A'
       ORDER BY p.nombre`,
      [`%${q}%`]
    );

    res.json({
      success: true,
      data: productos.rows
    });

  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarStock,
  buscarProductos
};