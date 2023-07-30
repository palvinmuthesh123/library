const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const acceptSchema = new Schema({
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
var Accepts = mongoose.model('Accept',acceptSchema);

module.exports=Accepts;