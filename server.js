/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
require('dotenv').config();
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if the connection fails (optional)
  }
};

connectDB();

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            return res.status(500).send(err);
        }

        if (!user) {
            return res.status(401).send({ success: false, msg: 'User not found.' });
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({ success: true, token: 'JWT ' + token });
            } else {
                res.status(401).send({ success: false, msg: 'Authentication failed.' });
            }
        });
    });
});


router.post('/reviews', authJwtController.isAuthenticated, function(req, res) {
    if (!req.body.movieId || !req.body.username || !req.body.review || typeof req.body.rating === 'undefined') {
        return res.status(400).json({ message: 'Missing review fields' });
    }

    const newReview = new Review({
        movieId: req.body.movieId,
        username: req.body.username,
        review: req.body.review,
        rating: req.body.rating
    });

    newReview.save(function(err) {
        if (err) {
            res.status(500).json({ message: 'Error saving review', error: err });
        } else {
            res.json({ message: 'Review created!' });
        }
    });
});

router.get('/reviews', function(req, res) {
    Review.find({})
        .populate('movieId', 'title') // Optional: include movie title
        .exec(function(err, reviews) {
            if (err) {
                res.status(500).json({ message: 'Error fetching reviews', error: err });
            } else {
                res.json(reviews);
            }
        });
});
 
router.get('/movies/:id', function(req, res) {
    const includeReviews = req.query.reviews === 'true';

    if (includeReviews) {
        Movie.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'movieId',
                    as: 'reviews'
                }
            }
        ]).exec(function(err, result) {
            if (err) return res.status(500).json(err);
            res.json(result[0] || {});
        });
    } else {
        Movie.findById(req.params.id, function(err, movie) {
            if (err) return res.status(500).json(err);
            res.json(movie);
        });
    }
});




app.use('/', router);
// app.listen(process.env.PORT || 8080);
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; // for testing only


