const mongoose = require('mongoose');

const UserTeamSchema = new mongoose.Schema ({
    userId: {
        type: String,
        trim: true
    },
    userName: {
        type: String
    },
    contestId: {
        type: Number,
        trim: true
    },
    totalCredit: {
        type: Number,
        default: 0
    },
    team_1: {
        type: String
    },
    team_2: {
        type: String
    },
    squad: [{
        name: {
            type: String
        },
        pid: {
            type: Number
        },
        playerCredit: {
            type: Number,
            default: 0
        }
    }]
})

const UserTeam = mongoose.model('UserTeam', UserTeamSchema);
module.exports = { UserTeam };