const { pool } = require('../config/db');

class Subject {
  static async create(data) {
    const { classroom_id, name, code, max_marks = 100 } = data;
    
    const [result] = await pool.execute(
      'INSERT INTO subjects (classroom_id, name, code, max_marks) VALUES (?, ?, ?, ?)',
      [classroom_id, name, code, max_marks]
    );
    
    return { id: result.insertId, classroom_id, name, code, max_marks };
  }

  static async findByPk(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM subjects WHERE id = ?',
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
    const validColumns = ['id', 'classroom_id', 'name', 'code', 'max_marks'];
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

    const query = `SELECT * FROM subjects WHERE ${conditions.join(' AND ')}`;
    const [rows] = await pool.execute(query, values);
    return rows[0] || null;
  }

  static async findAll(options = {}) {
    let query = 'SELECT * FROM subjects';
    const values = [];

    if (options.where && typeof options.where === 'object' && Object.keys(options.where).length > 0) {
      // Validate column names
      const validColumns = ['id', 'classroom_id', 'name', 'code', 'max_marks'];
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
    const validColumns = ['classroom_id', 'name', 'code', 'max_marks'];
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
      `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    if (!id) {
      throw new Error('ID is required for delete');
    }

    const [result] = await pool.execute(
      'DELETE FROM subjects WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Subject;