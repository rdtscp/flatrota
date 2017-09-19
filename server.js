/***************************************\
              Server Setup
\***************************************/

var app         = require('express')();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var socketio    = require('socket.io');

var server      = require('http').Server(app);
var io          = socketio(server);

app.use(bodyParser.json());
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost:27017/flatrota', {useMongoClient: true});

/* Import Models */
const User      = require('./models/user.js');
const Resource  = require('./models/resource.js');

/***************************************\
           Socket/Notif Handler
\***************************************/

var notifQ = [];

// Connect to Server via Socket.
io.on('connection', (socket) => {
    var Username;
    /* Login to the Server via Socket.
     *  params: {
     *      data: The User's authToken.
     *  }
     */ 
    socket.on('login', (data) => {
        // Find User based on provided authToken.
        User.findOne({
            authToken: data
        }).exec((err, user) => {
            if (err) console.log(err);
            else if (user) {
                Username = user.username;
                console.log(user.username + ' has logged in.');
                // Subscribe User's Socket Room.
                socket.join(user.username);
                /* Check if this User has any pending Notifications. */
                for (var i=0; i < notifQ.length; i++) {
                    // If we have a notification for this User, send it to their Socket Room.
                    if (notifQ[i].name == user.username) {
                        console.log('sending notification : ' + user.username + ': It is your turn to buy: ' + notifQ[i].quantity + ' of ' + notifQ[i].resource);
                        io.to(user.username).emit('inc_notif', notifQ[i]);
                    }
                }
            }
        });
    });
    /* Acknowledge receipt of a Notification. */
    socket.on('received_notif', (notification) => {
        console.log('notification received: ' + notification.name + ': It is your turn to buy: ' + notification.quantity + ' of ' + notification.resource);
        // Remove this notification from the Queue.
        var removeIndex = notifQ.indexOf(notification);
        notifQ.splice(removeIndex, 1);
        console.log('Notification Queue:');
        console.log(notifQ);
    });
    /* Handle Log Out */
    socket.on('disconnect', () => {
        console.log(Username + ' has disconnected.');
    })
});


/***************************************\
                  API
\***************************************/

// RECEIVES: authToken of a User.
// RETURNS : True/False if that authToken is valid for a User.
app.post('/token', (req, res) => {
    var authToken = req.body.authToken;
    User.findOne({
        authToken: authToken
    }).exec((err, user) => {
        if (err) console.log(err);
        else if (user) res.send({ valid: true });
        else res.send({ valid: false });
    })
});

// RECEIVES: Username and Password of a specific User.
// RETURNS : Error/Warning message, authToken of User account.
app.post('/login', (req, res) => {
    uname = req.body.username;
    pword = req.body.password;
    console.log('Login Request for: ' + uname);
    // Find the requested User.
    User.findOne({
        username: uname
    }).exec((err, user) => {
        if (err) console.log(err);
        else if (!user) {
            console.log('Invalid username or password')
            res.send({
                err: false,
                warning: true,
                msg: 'Invalid Username or Password'
            });
        }
        else {
            // Check submitted password.
            User.checkPassword(pword, user.password, (err, match) => {
                if (err) console.log(err);
                else if (match) {
                    console.log('Sending ' + user.username + ' their authToken.')
                    res.send({
                        err: false,
                        warning: false,
                        authToken: user.authToken
                    });
                } else {
                    res.send({
                        err: false,
                        warning: true,
                        msg: 'Invalid Username or Password'
                    });
                }
            });
        }
    });
});

// RECEIVES: Username and Password to create a User under.
// RETURNS : Error/Warning message, authToken of created account.
app.post('/register', (req, res) => {
    uname = req.body.username;
    pword = req.body.password;
    if (uname == undefined || pword == undefined) {
        res.send({
            err: false,
            warning: true,
            msg: 'Invalid username or password'
        });
    }
    console.log('Register Request for: ' + uname);
    // Check User does not exist.
    User.findOne({
        username: uname
    }).exec((err, user) => {
        if (err) console.log(err);
        else if (user) {
            res.send({
                err: false,
                warning: true,
                msg: 'User already exists with that Username'
            });
        }
        else {
            // Get hash of Users password.
            User.hashPassword(pword, (err, hash) => {
                if (err) console.log(err);
                else {
                    // Generate User an authToken.
                    User.generateToken((err, authToken) => {
                        if (err) console.log(err);
                        else {
                            // Create the new User.
                            var user = new User({
                                username: uname,
                                password: hash,
                                authToken: authToken
                            });
                            // Save the new user.
                            user.save((err) => {
                                if (err) res.send({ err: true, warning: false, msg: err });
                                else {
                                    res.send({
                                        err: false,
                                        warning: false,
                                        msg: 'Succesfully Created Account.',
                                        authToken: authToken
                                    });
                                }
                            });
                            /* Register this User for all resources. */
                            // Get all Resources.
                            Resource.find().exec((err, resources) => {
                                // Loop through the Resources.
                                resources.forEach((resource) => {
                                    // Add the new User to the current resource Rota.
                                    resource.rota.push(user.username);
                                    resource.save((err) => { if (err) console.log(err); });
                                });
                            });
                        }
                    });
                }
            });
        }
    });
});

// RECEIVES: Post request.
// RETURNS : All resources.
app.post('/resource/all', (req, res) => {
    // Get all resources; respond to client.
    Resource.find().exec((err, resources) => {
        res.send(resources);
    })
});

// RECEIVES: Name, Price,Description, Quantity params.
// RETURNS : New Resource item in JSON.
app.post('/resource/new', (req, res) => {
    // Parse Params.
    name        = req.body.name;
    price       = req.body.price;
    desc        = req.body.desc;
    quantity    = req.body.quantity;
    // Get all Users (Their username attribute only).
    User.find({}, {username: 1, _id: 0}).exec((err, users) => {
        // Create a list of usernames.
        var rota = users.map(u => u.username);
        // Declare the new Resource.
        var newResource = new Resource({
            name: name,
            price: price,
            description: desc,
            quantity: quantity,
            rota: rota
        });
        // Save the new Resource.
        newResource.save((err) => {
            if (err) res.send({ err: true, warning: false, msg: err });
            else {
                console.log('Created new item:');
                console.log(newResource);
                // Send a blank response
                res.send({ err: false, warning: false, msg: 'Created Resource: ' + name });
            }
        }); 
    });
});

// RECEIVES: authToken, resourceID, quantity params.
// RETURNS : If the topup was succesful.
app.post('/resource/topup', (req, res) => {
    // Parse Params.
    var authToken  = req.body.authToken;
    var resourceID = req.body.id;
    var quantity   = req.body.quantity;
    // Check we have all params.
    if (authToken == undefined || resourceID == undefined || quantity == undefined) {
        res.send({
            err: false,
            warning: true,
            msg: 'authToken, resourceID, or quantity was undefined.'
        });
    } else {
        // Find the User that is topping up this Resource.
        User.findOne({
            authToken: authToken
        }).exec((err, user) => {
            if (err) res.send({ err: true, warning: false, msg: err });
            else if (user) {
                var uname = user.username;
                // Get the resource.
                Resource.findById(resourceID).exec((err, resource) => {
                    if (err) res.send({ err: true, warning: false, msg: err });
                    else if (resource) {
                        // Update the Rota for this resource according to the User topping up, and how much they topped up.
                        Resource.updateRota(resource, uname, quantity, (err, updtdResource) => {
                            if (err) res.send({err: true, warning: false, msg: err});
                            else {
                                res.send({
                                    err: false,
                                    warning: false,
                                    msg: 'You have successfully topped up ' + quantity + ' of ' + updtdResource.name
                                });
                            }
                        });
                    } else {
                        res.send({
                            err: false,
                            warning: true,
                            msg: 'Resource to Topup could not be found.'
                        });
                    }
                });
            }
            else {
                res.send({
                    err: false,
                    warning: true,
                    msg: 'Your account could not be retrieved, please try logging in again.'
                })
            }
        });
    }
});

// RECEIVED: resourceID, authToken of requester.
// RETURNS : A message indicating if the notification has been sent/queued.
app.post('/resource/runout', (req, res) => {
    // Parse Params.
    var resourceID = req.body.id;
    var authToken  = req.body.authToken;
    // Get the requesting User.
    User.findOne({
        authToken: authToken
    }).exec((err, user) => {
        if (err) res.send({ err: true, warning: false, msg: err });
        else if (user) {
            // Get the specified Resource.
            Resource.findById(resourceID).exec((err, resource) => {
                if (err) res.send({ err: true, warning: false, msg: err });
                else if (resource) {
                    console.log('Request to topup [' + resource.name + '] from: ' + user.username);
                    console.log('Rota State:');
                    console.log(resource.rota);
                    // Add this notification to the queue.
                    var nextUserName = resource.rota[0];                    
                    notifQ.push({name: nextUserName, quantity: resource.quantity, resource: resource.name});
                    
                    console.log('Notification Queue:');
                    console.log(notifQ);
                    var nextNotif = notifQ[notifQ.length - 1];
                    // Try publishing this notification to the User.
                    io.to(nextUserName).emit('inc_notif', nextNotif);
                    console.log('sending notification : ' + nextNotif.name + ': It is your turn to buy: ' + nextNotif.quantity + ' of ' + nextNotif.resource);
                    res.send({ err: false, warning: false, msg: 'Flatmate has been queued/sent a notification!' });
                } else {
                    res.send({ err: false, warning: true, msg: 'Attempted to mark a Resource that does not exist as depleted.' });
                }
            });
        } else {
            res.send({
                err: false,
                warning: true,
                msg: 'Your account could not be retrieved, please try logging in again.'
            })
        }
    });
});


//*************************************\\
server.listen(1337, () => { console.log('Server Started on Port 1337...'); })