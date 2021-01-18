const mongoose = require('mongoose');

const MatchDetailSchema = new mongoose.Schema({
    data: {
        bowling: {
            NB: {
                type: Date
            },
            WD: {
              type: Date
            },
            six: {
              type: Number
            },
            four: {
              type: Number
            },
            zero: {
                type: Number
            },
            W: {
                type: Date
            },
            R: {
                type: String
            },
            M: {
                type: Date
            },
            O: {
                type: Date
            },
            bowler: {
                type: String
            },
            pid: {
                type: String
            }
        },
        batting: {
            SR: {
                type: Number
            },
            six: {
                type: Number
            },
            four: {
                type: Number
            },
            M: {
                type: Number
            },
            B: {
                type: Number
            },
            R: {
                type: Number
            },
            batsman: {
                type: String
            },
            pid: {
                type: String
            }
        }
    }
})