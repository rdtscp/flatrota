var mongoose = require('mongoose');
var bcrypt   = require('bcrypt');
var crypto   = require('crypto');

var Schema   = mongoose.Schema;

var userSchema = mongoose.Schema ({
    username: {
        type: String,
        unique: true
    },
    password: String,
    authToken: String
});

// Checks if a password and a hash match.
userSchema.statics.checkPassword = (password, hash, cb) => {
    bcrypt.compare(password, hash, (err, res) => {
        cb(err, res)
    });
}

// Hashes a password.
userSchema.statics.hashPassword = (password, cb) => {
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
            cb(null, hash);
        });
    });
}

userSchema.statics.generateToken = (cb) => {
    crypto.randomBytes(256, (err, buf) => {
        if (err) cb(err);
        else cb(null, buf.toString('hex'));
    });
}

var User = mongoose.model('User', userSchema);

module.exports = User;