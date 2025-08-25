const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

// Admin Dashboard - serve HTML
router.get('/', ensureAuthenticated, ensureRole('admin'), adminController.dashboard);

// API endpoints
router.get('/classes', ensureAuthenticated, ensureRole('admin'), adminController.getClasses);

// Create User
router.post('/user/create', ensureAuthenticated, ensureRole('admin'), adminController.createUser);

// Create Class
router.post('/class/create', ensureAuthenticated, ensureRole('admin'), adminController.createClass);

// Create Subject
router.post('/subject/create', ensureAuthenticated, ensureRole('admin'), adminController.createSubject);

// Create Exam
router.post('/exam/create', ensureAuthenticated, ensureRole('admin'), adminController.createExam);

// Publish Exam
router.post('/exam/:exam_id/publish', ensureAuthenticated, ensureRole('admin'), adminController.publishExam);

module.exports = router;