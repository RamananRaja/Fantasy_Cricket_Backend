const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema ({
    unique_id: {
        type: Number,
        trim: true
    },
    date: {
        type: Date,
        trim: true
    },
    dateTimeGMT: {
        type: Date,
        trim: true
    },
    team_1: {
        type: String,
        trim: true
    },
    team_2: {
        type: String,
        trim: true
    },
    type: {
        type: String
    },
    squad: {
        type: Boolean,
    },
    toss_winner_team: {
        type: String
    },
    winner_team: {
        type: String
    },
    matchStarted: {
        type: Boolean
    }
})

const Contest = mongoose.model('contest', contestSchema);

module.exports = { Contest }