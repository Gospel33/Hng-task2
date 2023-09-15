const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const crypto = require('crypto'); // Node.js built-in module for crypto operations

const app = express();

app.use(bodyParser.json());

// Generate a random JWT secret key and store it securely (replace this with your preferred method)
const secretKey = crypto.randomBytes(32).toString('hex');

// Replace 'mongodb://localhost/mydatabase' with your actual MongoDB connection string
const dbURI = 'mongodb://localhost/mydatabase';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const personSchema = new mongoose.Schema({
  name: String,
  age: Number,
});

const Person = mongoose.model('Person', personSchema);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secretKey,
    },
    (jwt_payload, done) => {
      User.findById(jwt_payload.sub)
        .then((user) => {
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        })
        .catch((err) => {
          return done(err, false);
        });
    }
  )
);

app.post(
  '/api/persons',
  passport.authenticate('jwt', { session: false }),
  [
    body('name').notEmpty().isString(),
    body('age').notEmpty().isInt(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, age } = req.body;
    const person = new Person({ name, age });

    person.save()
      .then((savedPerson) => res.status(201).json(savedPerson))
      .catch((err) => res.status(500).json({ error: 'Error creating a person' }));
  }
);

// Implement other CRUD routes for persons here

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


