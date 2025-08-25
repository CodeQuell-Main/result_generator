const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Teacher Dashboard - serve HTML
router.get('/', ensureAuthenticated, ensureRole('teacher'), teacherController.dashboard);

// API endpoints
router.get('/classes', ensureAuthenticated, ensureRole('teacher'), teacherController.getClasses);
router.get('/exams/:class_id', ensureAuthenticated, ensureRole('teacher'), teacherController.getExams);

// Upload marks
router.post('/upload-marks', ensureAuthenticated, ensureRole('teacher'), upload.single('file'), teacherController.uploadMarks);

// Publish exam
router.post('/exam/:exam_id/publish', ensureAuthenticated, ensureRole('teacher'), teacherController.publishExam);

module.exports = router;