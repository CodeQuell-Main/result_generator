const { pool } = require('../config/db');

async function initDatabase() {
  try {
    // Create tables using raw SQL
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher', 'student') NOT NULL,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) UNIQUE,
        active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Classrooms table
      CREATE TABLE IF NOT EXISTS classrooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        academic_year VARCHAR(9) NOT NULL,
        semester INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Teacher-Class assignments
      CREATE TABLE IF NOT EXISTS teacher_class (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        class_id INT NOT NULL,
        UNIQUE KEY unique_teacher_class (teacher_id, class_id),
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classrooms(id) ON DELETE CASCADE
      );

      -- Student-Class assignments
      CREATE TABLE IF NOT EXISTS student_class (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        UNIQUE KEY unique_student_class (student_id, class_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classrooms(id) ON DELETE CASCADE
      );

      -- Subjects table
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        name VARCHAR(120) NOT NULL,
        code VARCHAR(50) NOT NULL,
        max_marks INT NOT NULL DEFAULT 100,
        UNIQUE KEY unique_class_subject (classroom_id, code),
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
      );

      -- Exams table
      CREATE TABLE IF NOT EXISTS exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        name VARCHAR(120) NOT NULL,
        exam_date DATE NOT NULL,
        created_by INT NOT NULL,
        published BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE KEY unique_class_exam (classroom_id, name),
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Results table
      CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT NOT NULL,
        student_id INT NOT NULL,
        subject_id INT NOT NULL,
        marks DECIMAL(5,2) NOT NULL,
        grade VARCHAR(5),
        uploaded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE KEY unique_exam_student_subject (exam_id, student_id, subject_id),
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );
    `;

    // Split SQL into individual statements and execute
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
      }
    }

    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();