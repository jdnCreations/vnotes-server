const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const generatePassword = require('./lib/passwordUtils').generatePassword;
require('dotenv').config();

// auth stuff
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const MongoStore = require('connect-mongo');

const sessionStore = new MongoStore({
  mongoUrl: process.env.MONGODB_CONNECTION_URI,
  collectionName: 'sessions',
  autoRemove: 'native',
  // autoRemoveInterval: 5,
});

const Note = require('./models/note.js');
const User = require('./models/user.js');

mongoose.connect(process.env.MONGODB_CONNECTION_URI, () =>
  console.log('CONNECTED TO DB.')
);

// MIDDLEWARE

app.use(cookieParser(process.env.SESSION_SECRET));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

require('./passportConfig');

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('__method'));

// app.use((req, res, next) => {
//   // console.log(req.session);
//   // console.log(req.isAuthenticated());
//   next();
// });

// ROUTES

app.get('/', (req, res) => {
  console.log(req.session);
  let user = req.user;
  if (user) {
    console.log(req.user);
    res.json({ user: user.username });
  }
});

app.post('/notes', async (req, res) => {
  console.log(req.body);
  const notes = await Note.find({ user: req.body.user });

  res.send(notes);
});

app.post('/notes/agent/:agent', async (req, res) => {
  console.log(req.body);
  const notes = await Note.find({ user: req.body.user, agent: req.body.agent });

  res.send(notes);
});

app.post('/notes/map/:map', async (req, res) => {
  console.log('checking map notes');
  console.log(req.body);
  const notes = await Note.find({ user: req.body.user, map: req.body.map });

  res.send(notes);
});

app.post('/create-note', async (req, res) => {
  console.log(req.body);

  const { user, agent, map, text } = req.body;

  const newNote = new Note({
    user,
    agent,
    map,
    text,
  });

  newNote.save(function (err) {
    if (err) return err;
    res.json({ message: 'new note created!' });
  });
});

app.get('/note/:id', async (req, res) => {
  let id = mongoose.Types.ObjectId(req.params.id);
  const note = await Note.findOne({ _id: id });
  res.json(note);
});

app.put('/note/:id/update', async (req, res) => {
  console.log(req.body);
  let id = mongoose.Types.ObjectId(req.params.id);
  let query = { _id: id };
  const note = await Note.findOneAndUpdate(query, {
    agent: req.body.agent,
    map: req.body.map,
    text: req.body.text,
  });
  res.json(note);
});

app.delete('/note/:id/delete', async (req, res) => {
  let id = mongoose.Types.ObjectId(req.params.id);

  Note.deleteOne({ _id: id }, function (err) {
    if (err) console.log(err);
    res.json({ message: 'success' });
  });
});

// AUTHENTICATION ROUTES

app.post('/login', passport.authenticate('local'), (req, res, next) => {
  res.json({ username: req.user.username });
  req.session.username = req.user.username;
  next();
});

app.post('/register', (req, res) => {
  // new register

  const saltHash = generatePassword(req.body.password);

  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const newUser = new User({
    username: req.body.username,
    hash: hash,
    salt: salt,
    email: req.body.email,
  });

  newUser.save().then((user) => {
    console.log(user);
  });

  res.json({ username: newUser.username });
  req.session.username = req.user.username;
  console.log(req.session.passport.user);
});

app.post('/logout', (req, res) => {
  req.logout();
  req.session.destroy((err) => {
    if (err) return console.log(err);
    res.clearCookie(process.env.SESSION_SECRET);
    req.session = null;
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    res.send('User is authenticated');
    return next();
  }

  res.send('Not authenticated');
}

function requireAuth(req, res, next) {
  // const user = req.session.passport.user;
  if (
    req.session.passport.user == undefined ||
    req.session.passport.user == null
  ) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

const PORT = 5000 || process.env.PORT;

app.listen(PORT, () => console.log(`server listening on port ${PORT}`));
