const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('codequell@sgu', 10);
    await User.create({
      username: 'codequell',
      password: adminPassword,
      role: 'admin',
      name: 'CodeQuell Admin',
      email: 'admin@codequell.in'
    });

    // Create teacher user
    const teacherPassword = await bcrypt.hash('codequell@sgu', 10);
    await User.create({
      username: 'teacher',
      password: teacherPassword,
      role: 'teacher',
      name: 'Test Teacher',
      email: 'teacher@codequell.in'
    });

    // Create student user
    const studentPassword = await bcrypt.hash('codequell@sgu', 10);
    await User.create({
      username: 'student',
      password: studentPassword,
      role: 'student',
      name: 'Test Student',
      email: 'student@codequell.in'
    });

    console.log('Database seeded successfully');
    console.log('Admin: codequell / codequell@sgu');
    console.log('Teacher: teacher / codequell@sgu');
    console.log('Student: student / codequell@sgu');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();