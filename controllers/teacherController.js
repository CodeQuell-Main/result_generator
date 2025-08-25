const { TeacherClass, Classroom, Exam, Subject, Result, User, StudentClass } = require('../models');
const ExcelJS = require('exceljs');
const path = require('path');
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

// Teacher dashboard - serve HTML
exports.dashboard = async (req, res) => {
  res.sendFile(path.join(__dirname, '../templates/teacher.html'));
};

// Get classes assigned to teacher
exports.getClasses = async (req, res) => {
  try {
    const teacherClasses = await TeacherClass.findAll({
      teacher_id: req.user.id
    });

    // Get classroom details for each teacher class
    const classes = [];
    for (const tc of teacherClasses) {
      const classroom = await Classroom.findByPk(tc.class_id);
      if (classroom) {
        classes.push(classroom);
      }
    }
    
    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get exams for a specific class
exports.getExams = async (req, res) => {
  try {
    const { class_id } = req.params;

    // Check if teacher is assigned to class
    const isAssigned = await TeacherClass.findOne({
      teacher_id: req.user.id, class_id
    });

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    const exams = await Exam.findAll({
      classroom_id: class_id,
      order: [['created_at', 'DESC']]
    });

    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload marks
exports.uploadMarks = async (req, res) => {
  try {
    const { class_id, exam_id } = req.body;

    // Check if teacher is assigned to class
    const isAssigned = await TeacherClass.findOne({
      teacher_id: req.user.id, class_id
    });

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    // Check exam
    const exam = await Exam.findByPk(exam_id);
    if (!exam || exam.classroom_id != class_id) {
      return res.status(400).json({ message: 'Exam does not belong to selected class' });
    }

    if (exam.published) {
      return res.status(400).json({ message: 'Exam already published' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read Excel file using ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    
    const worksheet = workbook.getWorksheet(1); // Get first worksheet
    if (!worksheet) {
      return res.status(400).json({ message: 'No worksheet found in Excel file' });
    }

    // Get headers from first row
    const headers = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value;
    });

    // Required columns
    const requiredColumns = ['StudentUsername', 'SubjectCode', 'Marks'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        message: `Excel missing columns: ${missingColumns.join(', ')}` 
      });
    }

    // Get subjects for this class
    const subjects = await Subject.findAll({
      classroom_id: class_id
    });
    const subjectMap = {};
    subjects.forEach(subject => {
      subjectMap[subject.code] = subject;
    });

    let upserts = 0;

    // Process each row starting from row 2 (skip header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rowData = {};
      
      // Extract data from each cell
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });

      const username = String(rowData.StudentUsername || '').trim();
      const subjectCode = String(rowData.SubjectCode || '').trim();
      const marks = parseFloat(rowData.Marks);

      if (!username || !subjectCode || isNaN(marks)) continue;

      // Find student
      const student = await User.findOne({
        username, role: 'student'
      });

      if (!student) continue;

      // Check if student is in class
      const isInClass = await StudentClass.findOne({
        student_id: student.id, class_id
      });

      if (!isInClass) continue;

      // Check subject
      const subject = subjectMap[subjectCode];
      if (!subject) continue;

      // Check if result exists
      const existingResult = await Result.findOne({
        exam_id: exam_id,
        student_id: student.id,
        subject_id: subject.id
      });

      if (existingResult) {
        existingResult.marks = marks;
        existingResult.uploaded_by = req.user.id;
        await Result.save(existingResult);
      } else {
        await Result.create({
          exam_id: exam_id,
          student_id: student.id,
          subject_id: subject.id,
          marks: marks,
          uploaded_by: req.user.id
        });
      }

      upserts++;
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: `Uploaded/updated ${upserts} marks` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Publish exam (teacher)
exports.publishExam = async (req, res) => {
  try {
    const { exam_id } = req.params;

    const exam = await Exam.findByPk(exam_id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if teacher is assigned to the class of this exam
    const isAssigned = await TeacherClass.findOne({
      teacher_id: req.user.id, class_id: exam.classroom_id
    });

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    await Exam.update(exam_id, { published: true });

    res.json({ message: 'Exam published successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};