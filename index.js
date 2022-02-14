const express = require('express');
const app = express();
const cors = require('cors');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
require('dotenv').config();

const Note = require('./models/note.js');

mongoose.connect(process.env.MONGODB_CONNECTION_URI, () =>
  console.log('CONNECTED TO DB.')
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send({ message: 'hit api' });
});

app.get('/notes', async (req, res) => {
  const notes = await Note.find({ user: 'jordan' });

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

app.delete('/note/:id/delete', async (req, res) => {
  let id = mongoose.Types.ObjectId(req.params.id);

  Note.deleteOne({ _id: id }, function (err) {
    if (err) console.log(err);
    res.json({ message: 'success' });
  });
});

app.listen(5000, () => console.log('server listening on port 5000'));
