const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Login Page
router.get('/login', authController.loginPage);

// Login Handle
router.post('/login', authController.login);

// Logout Handle
router.get('/logout', authController.logout);

module.exports = router;