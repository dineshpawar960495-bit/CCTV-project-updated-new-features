const express = require('express');
const router = express.Router();
const { registerUser, authUser, logoutUser } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);

module.exports = router;