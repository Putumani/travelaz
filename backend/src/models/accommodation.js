const mongoose = require('mongoose');

const accommodationSchema = new mongoose.Schema({
  city: String,
  name: String,
  price: Number,
  rating: Number,
  imageUrl: String,
  description: String,
});

module.exports = mongoose.model('Accommodation', accommodationSchema);