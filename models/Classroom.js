const { pool } = require('../config/db');

class Classroom {
  static async create(classData) {
    const { name, code, academic_year, semester } = classData;
    
    const [result] = await pool.execute(
      'INSERT INTO classrooms (name, code, academic_year, semester, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, code, academic_year, semester]
    );
    
    return { id: result.insertId, name, code, academic_year, semester };
  }

  static async findByPk(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM classrooms WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findOne(where) {
    // Validate where object
    if (!where || typeof where !== 'object' || Object.keys(where).length === 0) {
      throw new Error('Invalid where clause: must provide non-empty object');
    }

    // Validate column names to prevent SQL injection
    const validColumns = ['id', 'name', 'code', 'academic_year', 'semester', 'created_at'];
    const conditions = [];
    const values = [];

    for (const [key, value] of Object.entries(where)) {
      if (!validColumns.includes(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
      conditions.push(`${key} = ?`);
      values.push(value);
    }

    if (conditions.length === 0) {
      throw new Error('No valid conditions provided');
    }

    const query = `SELECT * FROM classrooms WHERE ${conditions.join(' AND ')}`;
    const [rows] = await pool.execute(query, values);
    return rows[0] || null;
  }

  static async findAll(options = {}) {
    let query = 'SELECT * FROM classrooms';
    const values = [];

    if (options.where && typeof options.where === 'object' && Object.keys(options.where).length > 0) {
      // Validate column names
      const validColumns = ['id', 'name', 'code', 'academic_year', 'semester', 'created_at'];
      const conditions = [];
      
      for (const [key, value] of Object.entries(options.where)) {
        if (!validColumns.includes(key)) {
          throw new Error(`Invalid column name: ${key}`);
        }
        conditions.push(`${key} = ?`);
        values.push(value);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    if (options.order && Array.isArray(options.order)) {
      const orderClauses = [];
      for (const [field, direction] of options.order) {
        // Validate field name
        const validColumns = ['id', 'name', 'code', 'academic_year', 'semester', 'created_at'];
        if (!validColumns.includes(field)) {
          throw new Error(`Invalid order field: ${field}`);
        }
        // Validate direction
        const validDirections = ['ASC', 'DESC'];
        const dir = direction.toUpperCase();
        if (!validDirections.includes(dir)) {
          throw new Error(`Invalid order direction: ${direction}`);
        }
        orderClauses.push(`${field} ${dir}`);
      }
      if (orderClauses.length > 0) {
        query += ` ORDER BY ${orderClauses.join(', ')}`;
      }
    }

    const [rows] = await pool.execute(query, values);
    return rows;
  }

  static async update(id, updateData) {
    if (!id) {
      throw new Error('ID is required for update');
    }

    if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
      throw new Error('Update data is required');
    }

    // Validate column names
    const validColumns = ['name', 'code', 'academic_year', 'semester'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (!validColumns.includes(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE classrooms SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }
}

module.exports = Classroom;