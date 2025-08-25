const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

// Student Dashboard - serve HTML
router.get('/', ensureAuthenticated, ensureRole('student'), studentController.dashboard);

// API endpoints
router.get('/profile', ensureAuthenticated, ensureRole('student'), studentController.getProfile);
router.get('/exams', ensureAuthenticated, ensureRole('student'), studentController.getExams);
router.get('/results/:exam_id', ensureAuthenticated, ensureRole('student'), studentController.getResults);

// Download PDF
router.get('/download-pdf/:exam_id', ensureAuthenticated, ensureRole('student'), studentController.generatePDF);

module.exports = router;