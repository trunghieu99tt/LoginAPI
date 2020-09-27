const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
    jwtCode: {
        type: String,
        required: [true, "Please provide jwtCode"],
    },
    expiredDate: {
        type: Date,
        required: true,
    },
});

const Session = mongoose.model("Session", SessionSchema);

module.exports = Session;
