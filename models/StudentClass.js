const { pool } = require('../config/db');

class StudentClass {
  static async create(data) {
    const { student_id, class_id } = data;
    
    const [result] = await pool.execute(
      'INSERT INTO student_class (student_id, class_id) VALUES (?, ?)',
      [student_id, class_id]
    );
    
    return { id: result.insertId, student_id, class_id };
  }

  static async findByPk(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM student_class WHERE id = ?',
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
    const validColumns = ['id', 'student_id', 'class_id'];
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

    const query = `SELECT * FROM student_class WHERE ${conditions.join(' AND ')}`;
    const [rows] = await pool.execute(query, values);
    return rows[0] || null;
  }

  static async findAll(options = {}) {
    let query = 'SELECT * FROM student_class';
    const values = [];

    if (options.where && typeof options.where === 'object' && Object.keys(options.where).length > 0) {
      // Validate column names
      const validColumns = ['id', 'student_id', 'class_id'];
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

  static async delete(where) {
    if (!where || typeof where !== 'object' || Object.keys(where).length === 0) {
      throw new Error('Invalid where clause: must provide non-empty object');
    }

    // Validate column names
    const validColumns = ['id', 'student_id', 'class_id'];
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

    const query = `DELETE FROM student_class WHERE ${conditions.join(' AND ')}`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }
}

module.exports = StudentClass;