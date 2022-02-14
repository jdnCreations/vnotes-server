const mongoose = require('mongoose');
const { Schema } = mongoose;

const noteSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  agent: {
    type: String,
    required: true,
  },
  map: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
