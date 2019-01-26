const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// create the schema
const NoteSchema = new Schema({
    note: {
        type: String,
    }
});

const Note = mongoose.model('Note', NoteSchema);
module.exports = Note;