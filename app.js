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

const moodReset = 15; // in minutes
const allMoods = ["happy", "sad", "tired", "angry", "stressed"];

// // HOMEPAGE (REDIRECT TERMINAL)
// app.get('/', (req, res) => {
//     if (!req.session.loggedin) return res.redirect('/login?msg=protected');
    
//     con.query(`SELECT * FROM current_moods
//     WHERE last_updated > DATE_SUB(NOW(), INTERVAL ? MINUTE)
//     AND user_id IN (SELECT id FROM users WHERE username = ?)`, [moodReset, req.session.username], (err, result) => {
//         if (err) throw err;

//         if (result.length === 0) {
//             return res.redirect('/select_mood');
//         }
//         else {
//             return res.redirect('/dashboard');
//         }

//     })
// });

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
            return res.render('signup.html', {errorMessage: `${firstError.msg}: ${firstError.param}`});
        }


        // Check credentials
        if (username.length < 3 || username.length > 24) {
            return res.render('signup.html', {errorMessage: "Length must be between 3 and 24: username"});
        }

        else if (username.search(/^[a-zA-Z0-9-_]+$/) === -1) {
            return res.render('signup.html', {errorMessage: "Only letters, numbers, hyphen, and underscore allowed: username"});
        }
        else if (password.length < 6 || password.length > 50) {
            return res.render('signup.html', {errorMessage: "Length must be between 6 and 50: password"});
        }
        else if (password !== confirm) {
            return res.render('signup.html', {errorMessage: "Passwords must match"});
        }

        con.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
            if (err) throw err;
    
            if (result.length > 0) {
                return res.render('signup.html', {errorMessage: "Username already exists"});
            }
        });

        pm.hashPassword(password)
            .then(pass_hash => {
                con.query('INSERT INTO users (username, pass_hash) VALUES (?, ?)', [username, pass_hash], (err, result) => {
                    if (err) throw err;

                    return res.redirect('/login');
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
        // var remember = !!(req.body.remember); // force boolean

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

// LOGOUT
app.get('/logout', (req, res) => {
    req.session = null;
    return res.redirect('/login');
});

// CURRENT MOOD
app.get('/select_mood', query('mood').trim().escape(), (req, res) => {
    if (!req.session.loggedin) return res.redirect('/login?msg=protected');

    mood = req.query.mood;

    if (!allMoods.includes(mood)) {
        return res.render("current_mood.html", {moods: allMoods, loggedin: true});
    }

    

    con.query('SELECT id FROM users WHERE username = ?', [req.session.username], (err, result) => {
        if (err) throw err;

        var user_id = result[0].id;

        con.query('INSERT INTO all_moods (mood, user_id) VALUES (?, ?)', [mood, user_id], (err, result) => {
            if (err) throw err;

            con.query('REPLACE INTO current_moods (mood, user_id) VALUES (?, ?)', [mood, user_id], (err, result) => {

                return res.redirect('/dashboard');
            });
        }); 
    });

});

// DASHBOARD
app.get('/dashboard', query('msg').trim().escape(), (req, res) => {
    if (!req.session.loggedin) return res.redirect('/login?msg=protected');

    var msg = req.query.msg;
    var errorMessage = "";

    switch (msg) {
        case "nopending":
            errorMessage = "Couldn't find pending friend request!";
            break;
        case "accepted":
            errorMessage = "Accepted friend request!";
            break;
        case "declined":
            errorMessage = "Declined friend request!";
            break;
    }

    var friendIds = [];
    var pendingRequests;

    con.query('SELECT id FROM users WHERE username = ?', [req.session.username], (err, result) => {
        if (err) throw err;

        var user_id = result[0].id;

        con.query('SELECT username FROM users WHERE id IN (SELECT requester_id FROM pending_friendships WHERE requestee_id = ?)', [user_id], async (err, result) => {
            if (err) throw err;

            pendingRequests = result;

            con.query("SELECT mood, last_updated FROM current_moods WHERE user_id IN (SELECT id FROM users WHERE username = ?)", [req.session.username], (err, result) => {
                if (err) throw err;

                var currentMood = result[0];

                con.query(`SELECT users.username, current_moods.mood, current_moods.last_updated FROM current_moods
                INNER JOIN users ON current_moods.user_id = users.id
                WHERE current_moods.user_id IN ((SELECT user2_id AS friend_id FROM friendships WHERE user1_id = ?) UNION
                (SELECT user1_id FROM friendships WHERE user2_id = ?))
                ORDER BY current_moods.last_updated DESC`, [user_id, user_id], (err, result) => {
                    if (err) throw err;

                    var friendMoods = result;
                    return res.json({pendingRequests: pendingRequests, errorMessage: errorMessage, currentMood: currentMood, friendMoods: friendMoods});
                });
            });
            
        });
    });

});

app.get('/profile', (req, res) => {
    if (!req.session.loggedin) return res.redirect('/login?msg=protected');

    return res.render("profile.html", {loggedin: true});

});

app.get('/add_friend', (req, res) => {
    if (!req.session.loggedin) return res.redirect('/login?msg=protected');

    return res.render("add_friend.html", {loggedin: true});

});

app.post('/add_friend', body('frienduser').notEmpty().trim().escape(), (req, res) => {
    if (!req.session.loggedin) return res.redirect('/login?msg=protected');

    var frienduser = req.body.frienduser;

    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        firstError = errors.array()[0];
        return res.render('add_friend.html', {errorMessage: `${firstError.msg}: ${firstError.param}`, loggedin: true});
    }

    con.query('SELECT id FROM users WHERE username = ?', [req.session.username], (err, result) => {
        if (err) throw err;

        var user_id = result[0].id;

        con.query('SELECT id FROM users WHERE username = ?', [frienduser], (err, result) => {
            if (err) throw err;

            if (result.length === 0) {
                return res.render('add_friend.html', {errorMessage: "User doesn't exist!", loggedin: true});
            }

            var friend_id = result[0].id;

            if (friend_id === user_id) {
                return res.render('add_friend.html', {errorMessage: "Cannot add yourself!", loggedin: true});
            }

            con.query(`(SELECT user2_id AS friend_id FROM friendships WHERE user1_id = ?) UNION
            (SELECT user1_id FROM friendships WHERE user2_id = ?)`, [user_id, user_id], (err, result) => {
                if (err) throw err;

                if (result.length > 0) {
                    return res.render('add_friend.html', {errorMessage: "Already friends with this user!", loggedin: true});
                }

                con.query('SELECT * FROM pending_friendships WHERE requestee_id = ? AND requester_id = ?', [friend_id, user_id], (err, result) => {
                    if (err) throw err;
    
                    if (result.length > 0) {
                        return res.render('add_friend.html', {errorMessage: "Friend request already pending!", loggedin: true});
                    }
    
                    con.query('INSERT INTO pending_friendships (requestee_id, requester_id) VALUES (?, ?)', [friend_id, user_id], (err, result) => {
                        if (err) throw err;
        
                        return res.redirect('/dashboard');
                    });
                });
            });
        });
    });

});

app.get('/accept_friend', [
        query('accept').isBoolean(),
        query('frienduser').notEmpty().trim().escape()
    ], (req, res) => {
        if (!req.session.loggedin) return res.redirect('/login?msg=protected');

        var accept = (req.query.accept === "true");
        var frienduser = req.query.frienduser;

        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            firstError = errors.array()[0];
            return res.redirect('/dashboard');
        }

        con.query('SELECT * FROM pending_friendships WHERE requestee_id = (SELECT id FROM users WHERE username = ?) AND requester_id IN (SELECT id FROM users WHERE username = ?)', [req.session.username, frienduser], (err, result) => {
            if (err) throw err;

            if (result.length === 0) {
                return res.redirect("/dashboard?msg=nopending");
            }

            con.query(`DELETE FROM pending_friendships WHERE
            (requestee_id = (SELECT id FROM users WHERE username = ?) AND requester_id IN (SELECT id FROM users WHERE username = ?)) OR
            (requestee_id = (SELECT id FROM users WHERE username = ?) AND requester_id IN (SELECT id FROM users WHERE username = ?))`,
            [req.session.username, frienduser, frienduser, req.session.username], (err, result) => {
                if (err) throw err;

                if (accept) {
                    con.query("INSERT INTO friendships (user1_id, user2_id) VALUES ((SELECT id FROM users WHERE username = ?), (SELECT id FROM users WHERE username = ?))",
                    [req.session.username, frienduser, frienduser, req.session.username], (err, result) => {
                        if (err) throw err;

                        return res.redirect('/dashboard?msg=accepted');
                    });
                }
                else {
                    return res.redirect('/dashboard?msg=declined');
                }
                
            });
            
        });
});


app.listen(port, () => {
    console.log("App listening on port " + port);
});
