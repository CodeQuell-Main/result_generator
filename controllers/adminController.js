const { User, Classroom, TeacherClass, StudentClass, Subject, Exam, Result } = require('../models');
const { validationResult } = require('express-validator');
const path = require('path');

// Admin dashboard - serve HTML
exports.dashboard = async (req, res) => {
  res.sendFile(path.join(__dirname, '../templates/admin_dashboard.html'));
};

// API endpoint to get all classes
exports.getClasses = async (req, res) => {
  try {
    const classes = await Classroom.findAll({ 
      order: [['created_at', 'DESC']] 
    });
    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, name, email, class_id } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Create user
    const user = await User.create({ username, password, role, name, email });

    // If class_id is provided, assign user to class
    if (class_id && (role === 'teacher' || role === 'student')) {
      if (role === 'teacher') {
        await TeacherClass.create({ teacher_id: user.id, class_id });
      } else if (role === 'student') {
        await StudentClass.create({ student_id: user.id, class_id });
      }
    }

    res.json({ message: 'User created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create class
exports.createClass = async (req, res) => {
  try {
    const { name, code, academic_year, semester } = req.body;

    // Check if class exists
    const existingClass = await Classroom.findOne({ code });
    if (existingClass) {
      return res.status(400).json({ message: 'Class code already exists' });
    }

    const newClass = await Classroom.create({ name, code, academic_year, semester });
    res.json({ message: 'Class created successfully', class: newClass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create subject
exports.createSubject = async (req, res) => {
  try {
    const { classroom_id, name, code, max_marks } = req.body;

    // Check if subject exists for this class
    const existingSubject = await Subject.findOne({ classroom_id, code });
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject code already exists for this class' });
    }

    const subject = await Subject.create({ 
      classroom_id, 
      name, 
      code, 
      max_marks: max_marks || 100 
    });
    res.json({ message: 'Subject added successfully', subject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign teacher to class
exports.assignTeacher = async (req, res) => {
  try {
    const { teacher_id, class_id } = req.body;

    // Check if teacher exists and is a teacher
    const teacher = await User.findByPk(teacher_id);
    if (!teacher || teacher.role !== 'teacher') {
      req.flash('error_msg', 'Selected user is not a teacher');
      return res.redirect('/admin');
    }

    // Check if assignment already exists
    const existingAssignment = await TeacherClass.findOne({ teacher_id, class_id });
    if (existingAssignment) {
      req.flash('error_msg', 'Teacher is already assigned to this class');
      return res.redirect('/admin');
    }

    await TeacherClass.create({ teacher_id, class_id });
    req.flash('success_msg', 'Teacher assigned to class successfully');
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Server error');
    res.redirect('/admin');
  }
};

// Assign student to class
exports.assignStudent = async (req, res) => {
  try {
    const { student_id, class_id } = req.body;

    // Check if student exists and is a student
    const student = await User.findByPk(student_id);
    if (!student || student.role !== 'student') {
      req.flash('error_msg', 'Selected user is not a student');
      return res.redirect('/admin');
    }

    // Check if assignment already exists
    const existingAssignment = await StudentClass.findOne({ student_id, class_id });
    if (existingAssignment) {
      req.flash('error_msg', 'Student is already assigned to this class');
      return res.redirect('/admin');
    }

    await StudentClass.create({ student_id, class_id });
    req.flash('success_msg', 'Student assigned to class successfully');
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Server error');
    res.redirect('/admin');
  }
};

// Create exam
exports.createExam = async (req, res) => {
  try {
    const { classroom_id, name, exam_date, published } = req.body;

    // Check if exam exists for this class
    const existingExam = await Exam.findOne({ classroom_id, name });
    if (existingExam) {
      return res.status(400).json({ message: 'Exam already exists for this class' });
    }

    const exam = await Exam.create({
      classroom_id,
      name,
      exam_date,
      published: published === 'true',
      created_by: req.user.id
    });

    res.json({ message: 'Exam created successfully', exam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Publish exam
exports.publishExam = async (req, res) => {
  try {
    const { exam_id } = req.params;

    const exam = await Exam.findByPk(exam_id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    await Exam.update(exam_id, { published: true });

    res.json({ message: 'Exam published successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};