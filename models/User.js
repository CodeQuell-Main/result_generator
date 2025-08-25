const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, password, role, name, email } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role, name, email, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [username, hashedPassword, role, name, email]
    );
    
    return { id: result.insertId, username, role, name, email };
  }

  static async findByPk(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
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
    const validColumns = ['id', 'username', 'password', 'role', 'name', 'email', 'active', 'created_at'];
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

    const query = `SELECT * FROM users WHERE ${conditions.join(' AND ')}`;
    const [rows] = await pool.execute(query, values);
    return rows[0] || null;
  }

  static async findAll(options = {}) {
    let query = 'SELECT * FROM users';
    const values = [];

    if (options.where && typeof options.where === 'object' && Object.keys(options.where).length > 0) {
      // Validate column names
      const validColumns = ['id', 'username', 'password', 'role', 'name', 'email', 'active', 'created_at'];
      const conditions = [];
      
      for (const [key, value] of Object.entries(options.where)) {
        if (!validColumns.includes(key)) {
          throw new Error(`Invalid column name: ${key}`);
        }
        
        if (Array.isArray(value)) {
          // Handle IN clause for arrays
          const placeholders = value.map(() => '?').join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          values.push(...value);
        } else {
          conditions.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    if (options.order && Array.isArray(options.order)) {
      const orderClauses = [];
      for (const [field, direction] of options.order) {
        // Validate field name
        const validColumns = ['id', 'username', 'role', 'name', 'email', 'active', 'created_at'];
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
    const validColumns = ['username', 'password', 'role', 'name', 'email', 'active'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (!validColumns.includes(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
      
      if (key === 'password') {
        const hashedPassword = await bcrypt.hash(value, 10);
        fields.push(`${key} = ?`);
        values.push(hashedPassword);
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async validPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }
}

module.exports = User;