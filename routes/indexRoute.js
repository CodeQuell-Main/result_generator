const express = require('express');
const router = express.Router();

// Redirect root to login
router.get('/', (req, res) => {
  res.redirect('/login');
});

module.exports = router;