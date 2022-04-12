require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const cookieSession = require('cookie-session');

app.use(cookieSession({
    name: 'session',
	secret: process.env.SESSION_SECRET
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
const { body, query, validationResult } = require('express-validator');
const { redirect } = require('express/lib/response');


const nunjucks = require('nunjucks');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});


const con = require('./database.js');
const pm = require('./passwordManager.js');

const MOOD_RESET = 15; // in minutes
const allMoods = ["happy", "sad", "tired", "angry", "stressed"];


app.post('/signup',
    [
        body('username').notEmpty().trim().escape(),
        body('password').notEmpty().trim().escape(),
        body('confirm').notEmpty().trim().escape(),
    ],
    (req, res) => {

        var username = req.body.username;
        var password = req.body.password;
        var confirm = req.body.confirm;

        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            firstError = errors.array()[0];
            return res.json({
                signupSuccess: false,
                alert: `${firstError.msg}: ${firstError.param}`
            });
        }


        // Check credentials
        if (username.length < 3 || username.length > 24) {
            return res.json({
                signupSuccess: false,
                alert: "userLen"
            });
        }

        else if (username.search(/^[a-zA-Z0-9-_]+$/) === -1) {
            return res.json({
                signupSuccess: false,
                alert: "userChars"
            });
        }
        else if (password.length < 6 || password.length > 50) {
            return res.json({
                signupSuccess: false,
                alert: "passwordLen"
            });
        }
        else if (password !== confirm) {
            return res.json({
                signupSuccess: false,
                alert: "wrongConfirm"
            });
        }

        con.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
            if (err) throw err;
    
            if (result.length > 0) {
                return res.json({
                    signupSuccess: false,
                    alert: "userExists"
                });
            }
        });

        pm.hashPassword(password)
            .then(pass_hash => {
                con.query('INSERT INTO users (username, pass_hash) VALUES (?, ?)', [username, pass_hash], (err, result) => {
                    if (err) throw err;

                    return res.json({signupSuccess: true});
                });
            });


    }
);


app.post('/login',
    [
        body('username').notEmpty().trim().escape(),
        body('password').notEmpty().trim().escape(),
    ],
    (req, res) => {

        var username = req.body.username;
        var password = req.body.password;

        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            firstError = errors.array()[0];
            return res.json({
                authSuccess: false,
                alert: `${firstError.msg}: ${firstError.param}`
            });
        }


        con.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
            if (err) throw err;
    
            if (result.length === 0) {
                return res.json({
                    authSuccess: false,
                    alert: "noUser"
                });
            }
            else {
                pm.checkPassword(password, result[0].pass_hash)
                    .then(correctPw => {
                        if (correctPw) {

                            return res.json({
                                authSuccess: true
                            });
                        }
                        else {
                            return res.json({
                                authSuccess: false,
                                alert: "wrongPassword"
                            });
                        }
                    })
            }
        });

    }
);

// CURRENT MOOD
app.post('/select_mood', [
        body('username').notEmpty().trim().escape(),
        body('password').notEmpty().trim().escape(),
        body('mood').notEmpty().trim().escape()
    ],
    (req, res) => {

        var username = req.body.username;
        var password = req.body.password;
        var mood = req.body.mood;

        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            firstError = errors.array()[0];
            return res.json({authorized: false});
        }


        if (!allMoods.includes(mood)) {
            return res.json({
                authorized: true,
                success: false,
                alert: "invalidMood"
            });
        }

        checkAccount(username, password, (authorized) => {
            if (!authorized) {
                return res.json({authorized: false});
            }
            else {

                con.query('SELECT id FROM users WHERE username = ?', [username], (err, result) => {
                    if (err) throw err;

                    var user_id = result[0].id;

                    con.query('INSERT INTO all_moods (mood, user_id) VALUES (?, ?)', [mood, user_id], (err, result) => {
                        if (err) throw err;

                        con.query('REPLACE INTO current_moods (mood, user_id) VALUES (?, ?)', [mood, user_id], (err, result) => {

                            return res.json({
                                authorized: true,
                                success: true
                            });
                        });
                    }); 
                });

            }
        });
    }
);

// DASHBOARD
app.post('/dashboard',
    [
        body('username').notEmpty().trim().escape(),
        body('password').notEmpty().trim().escape(),
    ],
    (req, res) => {

        var username = req.body.username;
        var password = req.body.password;

        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            firstError = errors.array()[0];
            return res.json({authorized: false});
        }


        checkAccount(username, password, (authorized) => {
            if (!authorized) {
                return res.json({authorized: false});
            }
            else {

                con.query('SELECT id FROM users WHERE username = ?', [username], (err, result) => {
                    if (err) throw err;

                    var user_id = result[0].id;

                    con.query('SELECT username FROM users WHERE id IN (SELECT requester_id FROM pending_friendships WHERE requestee_id = ?)', [user_id], async (err, result) => {
                        if (err) throw err;

                        var pendingRequests = result;

                        con.query("SELECT mood, last_updated FROM current_moods WHERE user_id IN (SELECT id FROM users WHERE username = ?)", [username], (err, result) => {
                            if (err) throw err;

                            var currentMood = result[0];

                            // Check if time elapsed since last updated is > mood reset OR if user is new
                            var remindChange = false;
                            
                            if (currentMood == undefined || Date.now() - new Date(currentMood.last_updated) > 1000 * 60 * MOOD_RESET) {
                                remindChange = true;
                            }

                            // get all friends' data 
                            con.query(`SELECT users.username, current_moods.mood, current_moods.last_updated FROM current_moods
                            INNER JOIN users ON current_moods.user_id = users.id
                            WHERE current_moods.user_id IN ((SELECT user2_id AS friend_id FROM friendships WHERE user1_id = ?) UNION
                            (SELECT user1_id FROM friendships WHERE user2_id = ?))
                            ORDER BY current_moods.last_updated DESC`, [user_id, user_id], (err, result) => {
                                if (err) throw err;

                                var friendMoods = result;

                                return res.json({
                                    authorized: true,
                                    pendingRequests: pendingRequests,
                                    currentMood: currentMood,
                                    friendMoods: friendMoods,
                                    remindChange: remindChange
                                });
                            });
                        });
                        
                    });
                });
            }
        });


    }
);

app.post('/add_friend', 
    [
        body('username').notEmpty().trim().escape(),
        body('password').notEmpty().trim().escape(),
        body('frienduser').trim().escape(), // check for empty later so it doesn't mix with the auth vali
    ],
    (req, res) => {
    
        var username = req.body.username;
        var password = req.body.password;
        var frienduser = req.body.frienduser;

        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            firstError = errors.array()[0];
            return res.json({authorized: false});
        }

        checkAccount(username, password, (authorized) => {
            if (!authorized) {
                return res.json({authorized: false});
            }
            else {

                if (frienduser === "") {
                    return res.json({
                        authorized: true,
                        added: false,
                        alert: "noName"
                    });
                }
        
                con.query('SELECT id FROM users WHERE username = ?', [username], (err, result) => {
                    if (err) throw err;
        
                    var user_id = result[0].id;
        
                    con.query('SELECT id FROM users WHERE username = ?', [frienduser], (err, result) => {
                        if (err) throw err;
        
                        if (result.length === 0) {
                            return res.json({
                                authorized: true,
                                added: false,
                                alert: "noUser"
                            });
                        }
        
                        var friend_id = result[0].id;
        
                        if (friend_id === user_id) {
                            return res.json({
                                authorized: true,
                                added: false,
                                alert: "selfAdd"
                            });
                        }
        
                        // con.query(`(SELECT user2_id AS friend_id FROM friendships WHERE user1_id = ?) UNION
                        // (SELECT user1_id FROM friendships WHERE user2_id = ?)`, [user_id, user_id], (err, result) => {
                        con.query(`SELECT * FROM friendships WHERE
                        (user1_id = ? AND user2_id = ?)
                        OR (user2_id = ? AND user1_id = ?)`, [user_id, friend_id, user_id, friend_id], (err, result) => {
                            if (err) throw err;

                            if (result.length > 0) {
                                return res.json({
                                    authorized: true,
                                    added: false,
                                    alert: "alreadyFriends"
                                });
                            }
        
                            con.query('SELECT * FROM pending_friendships WHERE requestee_id = ? AND requester_id = ?', [friend_id, user_id], (err, result) => {
                                if (err) throw err;
                
                                if (result.length > 0) {
                                    return res.json({
                                        authorized: true,
                                        added: false,
                                        alert: "alreadyAdding"
                                    });
                                }
                
                                con.query('INSERT INTO pending_friendships (requestee_id, requester_id) VALUES (?, ?)', [friend_id, user_id], (err, result) => {
                                    if (err) throw err;
                    
                                    return res.json({
                                        authorized: true,
                                        added: true
                                    });
                                });
                            });
                        });
                    });
                });

            }
        });

    }
);

app.post('/accept_friend',
    [
        body('username').notEmpty().trim().escape(),
        body('password').notEmpty().trim().escape(),
        body('frienduser').trim().escape(),
        body('accept').isBoolean()
    ],
    (req, res) => {

        var username = req.body.username;
        var password = req.body.password;
        var frienduser = req.body.frienduser;
        var accept = (req.body.accept === "true");
        

        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            firstError = errors.array()[0];
            return res.json({authorized: false});
        }

        checkAccount(username, password, (authorized) => {
            if (!authorized) {
                return res.json({authorized: false});
            }
            else {

                if (frienduser === "") {
                    return res.json({
                        authorized: true,
                        actionSuccess: false,
                        alert: "noFriendUser"
                    });
                }

                con.query('SELECT * FROM pending_friendships WHERE requestee_id = (SELECT id FROM users WHERE username = ?) AND requester_id IN (SELECT id FROM users WHERE username = ?)', [username, frienduser], (err, result) => {
                    if (err) throw err;

                    if (result.length === 0) {
                        return res.json({
                            authorized: true,
                            actionSuccess: false,
                            alert: "noPending"
                        });
                    }

                    con.query(`DELETE FROM pending_friendships WHERE
                    (requestee_id = (SELECT id FROM users WHERE username = ?) AND requester_id IN (SELECT id FROM users WHERE username = ?)) OR
                    (requestee_id = (SELECT id FROM users WHERE username = ?) AND requester_id IN (SELECT id FROM users WHERE username = ?))`,
                    [username, frienduser, frienduser, username], (err, result) => {
                        if (err) throw err;

                        if (accept) {
                            con.query("INSERT INTO friendships (user1_id, user2_id) VALUES ((SELECT id FROM users WHERE username = ?), (SELECT id FROM users WHERE username = ?))",
                            [username, frienduser], (err, result) => {
                                if (err) throw err;

                                return res.json({
                                    authorized: true,
                                    actionSuccess: true
                                });
                            });
                        }
                        else {
                            return res.json({
                                authorized: true,
                                actionSuccess: true
                            });
                        }
                        
                    });
                    
                });
            }
        });
    }
);


app.listen(port, () => {
    console.log("App listening on port " + port);
});









// checks account give username and password, boolean value given to callback
function checkAccount(username, password, callback) {
    con.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
        if (err) throw err;

        if (result.length === 0) {
            callback(false);
        }
        
        else {
            pm.checkPassword(password, result[0].pass_hash)
                .then(correctPw => {
                    if (correctPw) {
                        callback(true);
                    }
                    else {
                        callback(false);
                    }
                })
        }
    });
}