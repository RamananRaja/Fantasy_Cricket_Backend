const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { mongoose } = require('./db/mongoose');

//LOAD IN MONGOOSE MODELS
const { Contest, Players, User, UserTeam } = require('./db/models');
const { forEach } = require('lodash');

/*LOAD MIDDLEWARE*/
app.use(bodyParser.json());

//CORS headers middleware
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Request-With, x-access-token, x-refresh-token, content-type, Accept, _id");
    res.header("Access-Control-Expose-Headers", "x-refresh-token, x-access-token");
    res.header("Access-Control-Allow-Credentials", true);

    next();
});

//Verify REFRESH TOKEN MIDDLEWARE (which will be verifying the session)
let verifySession = (req, res, next) => {
    //grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');
    //grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if(!user) {
            //user couldn't be found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }
        //if the code reaches here - the user was found
        //therefore the refresh token exists in the database - but we still have to check if it has expired or not
        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        
        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if(session.token === refreshToken) {
                //check if the session has expired
                if(User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    //refresh token ahas not expired
                    isSessionValid = true;
                }
            }
        });

        if(isSessionValid) {
            //console.log("user valid");
            //the session is VALID - call next() to continue with processing this web request
            next();
        } else {
            //the session is not valid
            return Promise.reject({
                'error':'refresh token has expired or the session is invalid'
            })
        }
    }).catch((e) => {
        res.status(401).send(e);
    })
}

/*END MIDDLEWARE*/

/* USER ROUTES */
/**
 * POST /users
 * Purpose: Signup
 */
app.post('/users/signup',(req,res) => {
    //User Signup

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        //Session created succesfully - refreshToken returned
        //now we generate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            //access auth token generated successfully, now we return an object containg the auth tokens
            return {accessToken, refreshToken}
        });
    }).then((authToken) => {
        //Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authToken.refreshToken)
            .header('x-access-token', authToken.accessToken)
            .send(newUser);
    }).catch((e) => {
        //console.log(e);
        res.status(400).send(e);
    })
})

/**
 * POST /users/login
 * Purpose: Login
 */
app.post('/users/login', (req,res) => {
    let email = req.body.email;
    let password = req.body.password;

    //console.log('control here in db');
    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            //Session created successfully - refreshToken returned
            //now we generate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                //access auth token generated successfully, now we return an object containing the auth tokens
                return { accessToken, refreshToken }
            });
        }).then((authToken) => {
            //Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
            res
                .header('x-refresh-token', authToken.refreshToken)
                .header('x-access-token', authToken.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/**
 * GET /users/me/access-token
 * Purpose: generates and returns an access token
 */
app.get('/users/me/access-token', verifySession,(req,res) => {
    //we know that the user/caller is authenticated and we have the user_id and user object availabe to us
    //console.log(accessToken);
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})
/*END USER ROUTES */

/*ROUTE HANDLERS*/

/**
 * POST /contest
 * PURPOSE: Save all matches to db
 */
app.post(`/contest`, async(req, res) => {
    console.log('storing matches (contest) called in db');
    let matches = req.body.matches;
    matches.forEach(async (matches) => {
        const is_exist = await Contest.count({ unique_id: matches.unique_id});
        if(is_exist>=1) {

        } else {
            const newContest = new Contest({
                "unique_id": matches.unique_id,
                "date": matches.date,
                "dateTimeGMT": matches.dateTimeGMT,
                "team_1": matches.team_1,
                "team_2": matches.team_2,
                "type": matches.type,
                "squad": matches.squad,
                "toss_winner_team": matches.toss_winner_team,
                "winner_team": matches.winner_team,
                "matchStarted": matches.matchStarted

            });
            //console.log(newContest);
            newContest.save().then().catch((err)=>{console.log(err);})
        }
    });
    res.send(matches);
});
/**
 * POST /team
 * PURPOSE: Save team to db
 */
app.post(`/team`, (req, res) => {
    let team = req.body.team;
    let userId = req.body.userId;
    let userName = req.body.userName;
    let contestId = req.body.contestId;
    let team_1 = req.body.team_1;
    let team_2 = req.body.team_2;
    let newTeam = new UserTeam({ 'contestId': contestId, 'userName': userName, 'team_1': team_1, 'team_2': team_2, 'userId': userId, 'squad': team});
    
    newTeam.save().then((detail) => {
        //console.log(detail);
    }).catch((e) => {
        console.log(e);
    })
})


/**
 * POST /getjoinedcontest
 * PURPOSE: Get contest joined by user
 */
app.post(`/getjoinedcontest`, (req, res) => {
    let userId = req.body.userId;
    
    console.log('get joined contest');

    UserTeam.find({ userId: userId }).then((contest) => {
        /*let team_1 = contest['team_1'];
        let team_2 = contest.team_2;
        let total_credits = contest.total_credits;

        console.log("team 1:",team_1);
        console.log("team 2:",team_2);
        console.log("total credits:",total_credits);*/
        console.log(contest);
        res.send(contest);
    })
})

/** /getprofile
 * PURPOSE: Get Profile information of user
 */
app.post(`/getprofile`, (req,res) => {
    let userId = req.body.userId;

    console.log('get profile called');

    User.find().then((user) => {
        console.log(user);
        res.send(user);
    })
    
})


app.post(`/updateContest`, async(req, res) => {
    let contest = req.body.contest;
    const data = req.body.data;
    const batting = data.batting;
    const bowling = data.bowling;

    contest.squad.forEach(async(player) => {
        player.playerCredit = 0;
        await batting.forEach(async(innings) => {
           await innings.scores.forEach(async(score) => {
                
                if (Number(score.pid) == player.pid) {
                    player.playerCredit += score.R + ((score.R / 50) * 4) + (score['4s'] * 5) + (score['6s'] * 8);
                }
            });
        });
        await bowling.forEach(async(innings) => {
            await innings.scores.forEach(async(stat) => {
                 if (Number(stat.pid) == player.pid) {
                     player.playerCredit += (stat.W * 25) + ((stat.W / 4) * 100) + (stat.M * 4);
                 }
             });
         });
         
    });
    contest.totalCredit = 0;
    contest.squad.forEach((player) => {
        contest.totalCredit += player.playerCredit;
    });
    
    await UserTeam.updateOne({ contestId: contest.contestId, userId: contest.userId }, {$set: contest});
    
    /*
    
    console.log(batting.length);
    console.log(batting[0].scores.length);*/
    
    //FOR
    /*for(i=0; i<contest.squad.length; i++) {
        //console.log(contest.squad[i].pid);
        for(j=0; j<batting[1].scores.length; j++) {
            //console.log("contest Squad: ",contest.squad[i].pid, "batting squad: ", Number(batting[1].scores[j].pid));
            if(Number(contest.squad[i].pid) === Number(batting[1].scores[j].pid)) {
                console.log("******")
                console.log(contest.squad[i].pid, batting[1].scores[j].pid);
            }
        }
        
    }*/
    //console.log(batting[0].scores[0].pid);

    res.send(contest);
});

/**
 * 
 */
app.post(`/leadercontest`, (req, res) => {
    UserTeam.find({
        contestId: req.body.contestId
    }).then((contest) => {
        contest.sort(sortByProperty("totalCredit"));
        res.send(contest);
    })
    
})
const sortByProperty = function(prop) {
    return function(a, b) {
        if (a[prop] > b[prop]) {
            return -1;
        } else if (a[prop] < b[prop]){
            return 1;
        }
        return 0;
    }
}



app.listen(3000, () => {
    console.log("SERVER IS LISTENING IN PORT 3000");
})