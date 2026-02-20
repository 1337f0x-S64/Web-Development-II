const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    age: {
        type:Number,
        required: true,
        minlength: 18
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return v.includes("@");
            },
            message: "Invalid email format"
        }
    },

    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {timeseries: true});

module.exports = mongoose.model("User", userSchema);