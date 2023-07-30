const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rejectSchema = new Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    returned: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
var Rejects = mongoose.model('Reject',rejectSchema);

module.exports = Rejects;