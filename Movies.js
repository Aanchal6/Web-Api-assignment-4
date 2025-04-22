const express = require('express');
const mongoose = require('mongoose');
const Movie = require('./models/Movie'); // Ensure correct path
require('dotenv').config();

const app = express();
app.use(express.json()); 

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.DB);
//     console.log("Connected to MongoDB");
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//     process.exit(1); // Exit the process if the connection fails (optional)
//   }
// };

// connectDB();

// Routes for movies
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/movies/:title', async (req, res) => {
  try {
    const movie = await Movie.findOne({ title: req.params.title });
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/movies', async (req, res) => {
  try {
    const { title, releaseDate, genre, actors } = req.body;
    if (!title || !releaseDate || !genre || !actors) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newMovie = new Movie({ title, releaseDate, genre, actors });
    await newMovie.save();
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/movies/:title', async (req, res) => {
  try {
    const updatedMovie = await Movie.findOneAndUpdate(
      { title: req.params.title },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMovie) return res.status(404).json({ message: 'Movie not found' });
    res.json(updatedMovie);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/movies/:title', async (req, res) => {
  try {
    const deletedMovie = await Movie.findOneAndDelete({ title: req.params.title });
    if (!deletedMovie) return res.status(404).json({ message: 'Movie not found' });
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));