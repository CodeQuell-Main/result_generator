const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const dotenv = require('dotenv');
const passport = require('passport');

// Load env vars
dotenv.config({ quiet: true });

// Import database connection
const { testConnection } = require('./config/db');

// Import passport config
require('./config/passport')(passport);

// Import routes
const indexRoutes = require('./routes/indexRoute');
const authRoutes = require('./routes/authRoute');
const adminRoutes = require('./routes/adminRoute');
const teacherRoutes = require('./routes/teacherRoute');
const studentRoutes = require('./routes/studentRoute');

const app = express();

// Static folder for HTML files and assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '8mb' }));

// Express session middleware
app.use(session({
  secret: process.env.SECRET_KEY || 'change-me',
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables middleware for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/teacher', teacherRoutes);
app.use('/student', studentRoutes);

// Test database connection and start server
testConnection()
  .then((connected) => {
    if (connected) {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, console.log(`Server started on port ${PORT}`));
    } else {
      console.error('Failed to connect to database');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });