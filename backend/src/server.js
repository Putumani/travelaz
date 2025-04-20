const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Accommodation = require('../models/Accommodation');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get('/api/accommodations/:city', async (req, res) => {
  try {
    const city = req.params.city.toLowerCase();
    const accommodations = await Accommodation.find({ city });
    res.json(accommodations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));