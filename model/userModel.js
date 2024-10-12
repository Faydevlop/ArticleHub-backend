const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
  },
  profileUrl: {
    type: String,
    
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  interests: {
    type: [String], // Define interests as an array of strings
    default:['all']
  },
});

// Create a Mongoose model
const User = mongoose.model('User', userSchema);

module.exports = User;
