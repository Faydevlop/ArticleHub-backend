const mongoose = require('mongoose');
const { Schema } = mongoose;

const articleSchema = new Schema({
  articleName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default:0
  },
  dislikes: {
    type: Number,
    default:0
  },
  images: {
    type: [String], // Array of image URLs
    required: false,
  },
  category: {
    type: [String],
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId, // Reference to the user who created it
    ref: 'User',
    required: true,
  },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reportBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
