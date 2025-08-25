const { StudentClass, Exam, Result, Subject, User, Classroom } = require('../models');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Student dashboard - serve HTML
exports.dashboard = async (req, res) => {
  res.sendFile(path.join(__dirname, '../templates/students.html'));
};

// Get student profile
exports.getProfile = async (req, res) => {
  try {
    const student = await User.findByPk(req.user.id);
    
    // Get student's class
    const studentClass = await StudentClass.findOne({
      student_id: req.user.id
    });

    let className = null;
    if (studentClass) {
      const classroom = await Classroom.findByPk(studentClass.class_id);
      className = classroom ? classroom.name : null;
    }

    const profile = {
      name: student.name,
      username: student.username,
      email: student.email,
      class: className
    };

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available exams for student
exports.getExams = async (req, res) => {
  try {
    // Get classes student is in
    const studentClasses = await StudentClass.findAll({
      student_id: req.user.id
    });

    const classIds = studentClasses.map(sc => sc.class_id);

    // Get published exams for those classes
    const exams = await Exam.findAll({
      classroom_id: classIds,
      published: true,
      order: [['exam_date', 'DESC']]
    });

    // Get classroom details for each exam
    const examData = [];
    for (const exam of exams) {
      const classroom = await Classroom.findByPk(exam.classroom_id);
      examData.push({
        id: exam.id,
        name: exam.name,
        exam_date: exam.exam_date,
        class: classroom ? classroom.name : 'Unknown'
      });
    }

    res.json(examData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get exam results for student
exports.getResults = async (req, res) => {
  try {
    const { exam_id } = req.params;
    const student_id = req.user.id;

    const exam = await Exam.findByPk(exam_id);
    if (!exam || !exam.published) {
      return res.status(404).json({ message: 'Exam not found or not published' });
    }

    // Check if student is in the class of this exam
    const isInClass = await StudentClass.findOne({
      student_id, class_id: exam.classroom_id
    });

    if (!isInClass) {
      return res.status(403).json({ message: 'You are not in this class' });
    }

    // Get results
    const results = await Result.findAll({
      exam_id, student_id
    });

    // Get subject details for each result
    const resultData = [];
    for (const result of results) {
      const subject = await Subject.findByPk(result.subject_id);
      if (subject) {
        resultData.push({
          subject: subject.name,
          code: subject.code,
          marks: parseFloat(result.marks),
          max_marks: subject.max_marks
        });
      }
    }

    res.json(resultData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate PDF
exports.generatePDF = async (req, res) => {
  try {
    const { exam_id } = req.params;
    const student_id = req.user.id;

    const exam = await Exam.findByPk(exam_id);
    if (!exam || !exam.published) {
      return res.status(404).json({ message: 'Exam not found or not published' });
    }

    // Check if student is in the class of this exam
    const isInClass = await StudentClass.findOne({
      student_id, class_id: exam.classroom_id
    });

    if (!isInClass) {
      return res.status(403).json({ message: 'You are not in this class' });
    }

    // Get results
    const results = await Result.findAll({
      exam_id, student_id
    });

    // Get subject details for each result
    const resultData = [];
    for (const result of results) {
      const subject = await Subject.findByPk(result.subject_id);
      if (subject) {
        resultData.push({
          subject: subject.name,
          code: subject.code,
          marks: parseFloat(result.marks),
          max_marks: subject.max_marks
        });
      }
    }

    const total = resultData.reduce((sum, result) => sum + result.marks, 0);
    const max_total = resultData.reduce((sum, result) => sum + result.max_marks, 0);

    // Get student and class info
    const student = await User.findByPk(student_id);
    const studentClass = await StudentClass.findOne({
      student_id
    });

    let className = 'Not assigned';
    if (studentClass) {
      const classroom = await Classroom.findByPk(studentClass.class_id);
      className = classroom ? classroom.name : 'Not assigned';
    }

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Exam Results</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Exam Results: ${exam.name}</h1>
        <p><strong>Student:</strong> ${student.name}</p>
        <p><strong>Roll Number:</strong> ${student.username}</p>
        <p><strong>Class:</strong> ${className}</p>
        <p><strong>Exam Date:</strong> ${exam.exam_date}</p>
        
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Code</th>
              <th>Marks</th>
              <th>Max Marks</th>
            </tr>
          </thead>
          <tbody>
            ${resultData.map(result => `
              <tr>
                <td>${result.subject}</td>
                <td>${result.code}</td>
                <td>${result.marks}</td>
                <td>${result.max_marks}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Total</strong></td>
              <td><strong>${total}</strong></td>
              <td><strong>${max_total}</strong></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    // Generate PDF with puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Send PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${student.username}-${exam.name.replace(/\s/g, '_')}.pdf`
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};