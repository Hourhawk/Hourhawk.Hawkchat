var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var shortid = require('shortid');
var mysql = require('mysql');
var validator = require("email-validator");
var bcrypt = require("bcrypt");

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hawkchat'
});

app.use(express.static('public'));
app.get('/', function(req, res) {
  res.send(__dirname + '/index.html');
});

http.listen(80, function(){
  console.log('listening on *:80');
});

function mysql_escape (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char;
        }
    });
}

var sockets = {};
io.on('connection', function(socket) {
  /* clientId */
  var clientId = shortid.generate();
  sockets[clientId] = {loggedin: false};
  socket.emit('clientId', clientId);
  /* clientId */
  /* signup-btn */
  socket.on('signup-btn', function($data) {
    if($data['email'] == "" || $data['password'] == "" || $data['affiliation'] == "") {
      socket.emit('form-response', {form:'signup-btn', message:'Please fill in all the fields.'});
      return;
    }
    if(!validator.validate($data['email'])) {
      socket.emit('form-response', {form:'signup-btn', message:'Please input a proper email so your account can be validated.'});
      return;
    }
    if($data['password'].length < 7) {
      socket.emit('form-response', {form:'signup-btn', message:'Your password must be at least seven characters long.'});
      return;
    }
    bcrypt.hash($data['password'], 10, function(err, hash) {
      if(err) {
        socket.emit('form-response', {form:'signup-btn', message:'There was a hashing error. Try again later.'});
        return;
      }
      connection.query("INSERT INTO users(email, password, affiliation) VALUES('" + $data['email'] + "','" + hash + "','" + $data['affiliation'] + "')", function(err, results, fields) {
        if(err) {
          socket.emit('form-response', {form:'signup-btn', message:'There was a database error. Try again later.'});
          return;
        }
        socket.emit('form-response', {form:'signup-btn', message:'You have succesfully signed up. You may now login.'});
      });
    });
  });
  /* signup-btn */
});