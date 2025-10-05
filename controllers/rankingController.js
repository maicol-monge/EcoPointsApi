const { db } = require("../config/db");

// ======================
// RANKING - Controladores
// ======================

// Obtener ranking de tiendas por puntos redimidos (canjeados)
const obtenerRankingTiendas = async (req, res) => {
  try {
    const { limit = 50, desde, hasta } = req.query;

    const conditions = ["c.estado = 'A'", "t.estado = 'A'"];
    const params = [];

    if (desde) {
      params.push(desde);
      conditions.push(`c.fecha >= $${params.length}`);
    }
    if (hasta) {
      params.push(hasta);
      conditions.push(`c.fecha <= $${params.length}`);
    }

    params.push(limit);

    const query = `
      SELECT 
        t.id_tienda,
        t.nombre AS tienda_nombre,
        t.direccion,
        t.municipio,
        t.departamento,
        t.pais,
        COALESCE(SUM(c.puntos_usados), 0) AS puntos_redimidos,
        COUNT(c.id_canje) AS total_canjes,
        COUNT(DISTINCT c.id_usuario) AS usuarios_unicos,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.puntos_usados), 0) DESC, COUNT(c.id_canje) DESC) AS posicion
      FROM Tienda t
      JOIN Canjes c ON c.id_tienda = t.id_tienda
      WHERE ${conditions.join(' AND ')}
      GROUP BY t.id_tienda, t.nombre, t.direccion, t.municipio, t.departamento, t.pais
      ORDER BY puntos_redimidos DESC, total_canjes DESC
      LIMIT $${params.length}
    `;

    const resultado = await db.query(query, params);

    res.json({
      success: true,
      data: resultado.rows
    });

  } catch (error) {
    console.error('Error al obtener ranking de tiendas:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener ranking de usuarios por puntos
const obtenerRankingUsuarios = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const ranking = await db.query(
      `SELECT 
         u.id_usuario, u.nombre, u.apellido, u.puntos_acumulados,
         ROW_NUMBER() OVER (ORDER BY u.puntos_acumulados DESC) as posicion,
         COUNT(r.id_reciclaje) as total_reciclajes,
         COALESCE(SUM(r.peso), 0) as peso_total_reciclado
       FROM Usuarios u
       LEFT JOIN Reciclajes r ON u.id_usuario = r.id_usuario AND r.estado = 'A'
       WHERE u.estado = 'A'
       GROUP BY u.id_usuario, u.nombre, u.apellido, u.puntos_acumulados
       ORDER BY u.puntos_acumulados DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: ranking.rows
    });

  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener posición específica de un usuario
const obtenerPosicionUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const posicion = await db.query(
      `WITH ranking AS (
         SELECT 
           u.id_usuario, u.nombre, u.apellido, u.puntos_acumulados,
           ROW_NUMBER() OVER (ORDER BY u.puntos_acumulados DESC) as posicion
         FROM Usuarios u
         WHERE u.estado = 'A'
       )
       SELECT * FROM ranking WHERE id_usuario = $1`,
      [id_usuario]
    );

    if (posicion.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    res.json({
      success: true,
      data: posicion.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener posición:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Actualizar historial de puntajes
const actualizarHistorialPuntaje = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de usuario requerido" 
      });
    }

    // Obtener puntos actuales del usuario
    const usuario = await db.query(
      'SELECT puntos_acumulados FROM Usuarios WHERE id_usuario = $1 AND estado = $2',
      [id_usuario, 'A']
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    // Obtener posición actual
    const posicion = await db.query(
      `SELECT COUNT(*) + 1 as posicion
       FROM Usuarios 
       WHERE puntos_acumulados > $1 AND estado = 'A'`,
      [usuario.rows[0].puntos_acumulados]
    );

    // Insertar en historial
    const historial = await db.query(
      `INSERT INTO HistorialPuntaje 
       (id_usuario, puntosmaximos, posicion, estado) 
       VALUES ($1, $2, $3, 'A') 
       RETURNING *`,
      [id_usuario, usuario.rows[0].puntos_acumulados, posicion.rows[0].posicion]
    );

    res.status(201).json({
      success: true,
      message: "Historial actualizado exitosamente",
      data: historial.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar historial:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

// Obtener historial de puntajes de un usuario
const obtenerHistorialUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const historial = await db.query(
      `SELECT * FROM HistorialPuntaje 
       WHERE id_usuario = $1 AND estado = 'A'
       ORDER BY fecha_actualizacion DESC`,
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

// Obtener estadísticas del ranking
const obtenerEstadisticasRanking = async (req, res) => {
  try {
    const estadisticas = await db.query(`
      SELECT 
        COUNT(*) as total_usuarios,
        MAX(puntos_acumulados) as puntos_maximos,
        AVG(puntos_acumulados) as promedio_puntos,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY puntos_acumulados) as mediana_puntos
      FROM Usuarios 
      WHERE estado = 'A' AND puntos_acumulados > 0
    `);

    const topUsuarios = await db.query(`
      SELECT nombre, apellido, puntos_acumulados,
             ROW_NUMBER() OVER (ORDER BY puntos_acumulados DESC) as posicion
      FROM Usuarios 
      WHERE estado = 'A'
      ORDER BY puntos_acumulados DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        estadisticas_generales: estadisticas.rows[0],
        top_10_usuarios: topUsuarios.rows
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del ranking:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

module.exports = {
  obtenerRankingTiendas,
  obtenerRankingUsuarios,
  obtenerPosicionUsuario,
  actualizarHistorialPuntaje,
  obtenerHistorialUsuario,
  obtenerEstadisticasRanking
};