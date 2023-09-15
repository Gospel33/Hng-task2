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

// Replace this with your actual MongoDB Atlas connection string
const dbURI = 'mongodb+srv://OliverGospel:Somtochim33@cluster0.0o5nkbd.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the Person model and schema
const personSchema = new mongoose.Schema({
  name: String,
  age: String, // Age is now defined as a string
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

// Create a person
app.post(
  '/api/persons',
  passport.authenticate('jwt', { session: false }),
  [
    body('name').notEmpty().isString(),
    body('age').notEmpty().isString(), // Age is now validated as a string
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

// Get all persons
app.get('/api/persons', passport.authenticate('jwt', { session: false }), (req, res) => {
  Person.find()
    .then((persons) => res.json(persons))
    .catch((err) => res.status(500).json({ error: 'Error fetching persons' }));
});

// Get a person by ID
app.get('/api/persons/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const personId = req.params.id;

  Person.findById(personId)
    .then((person) => {
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      res.json(person);
    })
    .catch((err) => res.status(500).json({ error: 'Error fetching person' }));
});

// Update a person by ID
app.put('/api/persons/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const personId = req.params.id;

  // Assuming you want to update both name and age
  const { name, age } = req.body;

  Person.findByIdAndUpdate(personId, { name, age }, { new: true })
    .then((updatedPerson) => {
      if (!updatedPerson) {
        return res.status(404).json({ error: 'Person not found' });
      }
      res.json(updatedPerson);
    })
    .catch((err) => res.status(500).json({ error: 'Error updating person' }));
});

// Delete a person by ID
app.delete('/api/persons/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const personId = req.params.id;

  Person.findByIdAndRemove(personId)
    .then((removedPerson) => {
      if (!removedPerson) {
        return res.status(404).json({ error: 'Person not found' });
      }
      res.json({ message: 'Person removed successfully' });
    })
    .catch((err) => res.status(500).json({ error: 'Error removing person' }));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


