var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var resourceSchema = mongoose.Schema ({
    name: String,
    price: String,
    description: String,
    quantity: String,
    rota: [String]
});

resourceSchema.statics.generateRota = (creator, cb) => {
    // Get all users.
    Users.findAll({username: {'$ne':creator }}).exec((err, users) => {
    });
}

// Update rota.
resourceSchema.statics.updateRota = (resource, uname, quantity, cb) => {
    var rota = resource.rota;
    console.log(rota)
    var index = rota.indexOf(uname);
    var newRota = rota.splice(index, 1);
    newRota = replicateArray(newRota, quantity);
    newRota.push(uname);
    console.log(newRota);
}

// Credit to: https://stackoverflow.com/a/30229099
function replicateArray(array, n) {
    // Create an array of size "n" with undefined values
    var arrays = Array.apply(null, new Array(n)); 
  
    // Replace each "undefined" with our array, resulting in an array of n copies of our array
    arrays = arrays.map(function() { return array });
  
    // Flatten our array of arrays
    return [].concat.apply([], arrays);
}


var Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;