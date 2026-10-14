const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Grab the User model we created during the seed step
const User = mongoose.models.User; 

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Compare the plain text password with the hashed password in MongoDB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Success! Return user data (In production, you would attach a JWT token here)
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    console.error("Login Server Error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;