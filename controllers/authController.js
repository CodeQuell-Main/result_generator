const passport = require('passport');
const path = require('path');
const { User } = require('../models');

// Login page
exports.loginPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../templates/login.html'));
};

// Login handler
exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(`/login?error=${encodeURIComponent(info.message)}`);
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      // Redirect based on role
      if (user.role === 'admin') {
        return res.redirect('/admin');
      } else if (user.role === 'teacher') {
        return res.redirect('/teacher');
      } else {
        return res.redirect('/student');
      }
    });
  })(req, res, next);
};

// Logout handler
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login?success=' + encodeURIComponent('You are logged out'));
  });
};