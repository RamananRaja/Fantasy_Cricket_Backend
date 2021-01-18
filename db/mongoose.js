//This file will handle connection logic to mongodb database

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/FantasyCricket', {useNewUrlParser: true}).then(() => {
    console.log("connected to Mongodb successfully");
}).catch((e) => {
    console.log("Error while attempting to connect to Mongodb");
    console.log(e);
});

//To prevent deprecation warnings (from MongoDB native driver)
mongoose.set('useCreateIndex',true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);

module.exports = { mongoose };