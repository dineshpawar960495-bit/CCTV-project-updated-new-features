const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // or 'bcryptjs' depending on what you installed

// IMPORTANT: Replace this with your exact MongoDB connection string from server.js
const MONGO_URI = 'mongodb://127.0.0.1:27017/sentinel'; 

// Define the User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Use existing model if available, otherwise create a new one
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'dinesh@123gmail.com' });
    if (existingUser) {
      console.log('User already exists in the database.');
      process.exit(0);
    }

    // Hash the password (standard for Node.js auth)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456789', salt);

    // Create the user
    await User.create({
      name: 'dinesh pawar',
      email: 'dinesh@123gmail.com',
      password: hashedPassword
    });

    console.log('SUCCESS: Admin user Dinesh Pawar has been added to the database.');
    process.exit(0);

  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

seedAdmin();