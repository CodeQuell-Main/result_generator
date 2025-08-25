const { User, TeacherClass, StudentClass } = require('../models');

// Ensure user is authenticated
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/login');
};

// Ensure user has specific role(s)
exports.ensureRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Please log in to view this resource');
      return res.redirect('/login');
    }
    
    if (!roles.includes(req.user.role)) {
      req.flash('error_msg', 'Unauthorized');
      return res.redirect('/dashboard');
    }
    
    next();
  };
};

// Check if teacher is assigned to class
exports.isTeacherOfClass = async (req, res, next) => {
  try {
    const classId = req.params.class_id || req.body.class_id;
    if (!classId) {
      req.flash('error_msg', 'Class ID is required');
      return res.redirect('/teacher');
    }

    const assignment = await TeacherClass.findOne({
      teacher_id: req.user.id,
      class_id: classId
    });
    
    if (!assignment && req.user.role !== 'admin') {
      req.flash('error_msg', 'You are not assigned to this class');
      return res.redirect('/teacher');
    }
    
    next();
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Server error');
    res.redirect('/teacher');
  }
};

// Check if student is in class
exports.isStudentInClass = async (req, res, next) => {
  try {
    const classId = req.params.class_id || req.body.class_id;
    if (!classId) {
      req.flash('error_msg', 'Class ID is required');
      return res.redirect('/student');
    }

    const assignment = await StudentClass.findOne({
      student_id: req.user.id,
      class_id: classId
    });
    
    if (!assignment && req.user.role !== 'admin') {
      req.flash('error_msg', 'You are not in this class');
      return res.redirect('/student');
    }
    
    next();
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Server error');
    res.redirect('/student');
  }
};