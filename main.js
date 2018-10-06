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
var loggedUsers = {};
io.on('connection', function(socket) {
  /* clientId */
  var clientId = shortid.generate() + shortid.generate() + shortid.generate();
  sockets[clientId] = {loggedIn: false, cookies:{}};
  socket.emit('clientId', clientId);
  /* clientId */
  /* signup-btn */
  socket.on('signup-btn', function($data) {
    if(sockets[clientId]['loggedIn']) {
      socket.emit('form-response', {form:'signup-error', message:'You have created the maximum number of accounts.'});
      return;
    }
    if($data['email'] == "" || $data['password'] == "" || $data['affiliation'] == "") {
      socket.emit('form-response', {form:'signup-error', message:'Please fill in all the fields.'});
      return;
    }
    if(!validator.validate($data['email'])) {
      socket.emit('form-response', {form:'signup-error', message:'Please input a proper email so your account can be validated.'});
      return;
    }
    if($data['password'].length < 7) {
      socket.emit('form-response', {form:'signup-error', message:'Your password must be at least seven characters long.'});
      return;
    }
    connection.query("SELECT * FROM users WHERE email='" + mysql_escape($data['email']) + "'", function(err, results, fields) {
      if(err) {
        socket.emit('form-response', {form:'signup-error', message:'There was a database error. Try again later.'});
        return;
      }
      if(results[0] != null) {
        socket.emit('form-response', {form:'signup-error', message:'Please use a different email. The one entered is already associated with an account.'});
        return;
      }
      bcrypt.hash($data['password'], 10, function(err, hash) {
        if(err) {
          socket.emit('form-response', {form:'signup-error', message:'There was a hashing error. Try again later.'});
          return;
        }
        connection.query("INSERT INTO users(email, password, affiliation) VALUES('" + mysql_escape($data['email']) + "','" + hash + "','" + mysql_escape($data['affiliation']) + "')", function(err, results, fields) {
          if(err) {
            socket.emit('form-response', {form:'signup-error', message:'There was a database error. Try again later.'});
            return;
          }
          connection.query("SELECT * FROM users WHERE email='" + mysql_escape($data['email']) + "'", function(err, results, fields) {
            if(err) {
              socket.emit('form-response', {form:'signup-error', message:'Your account was created but we had trouble logging you in. Please login manually.'});
              return;
            }
            sockets[clientId]['cookies']['hawkchat-loggedin-identifier'] = shortid.generate() + shortid.generate() + shortid.generate();
            sockets[clientId]['loggedIn'] = true;
            socket.emit('cookie-create', sockets[clientId]['cookies']);
            results[0]['password'] = null;
            loggedUsers[sockets[clientId]['cookies']['hawkchat-loggedin-identifier']] = results[0];
            socket.emit('form-response', {form:'signup-error', message:'You have succesfully signed up. Navigate to your web panel.'});
          });
        });
      });
    }); 
  });
  /* signup-btn */
  /* verify-hawkchat-loggedin-identifier */
  socket.on('verify-hawkchat-loggedin-identifier', function($loggedInIdentifier) {
    if(loggedUsers[$loggedInIdentifier] != null) {
      sockets[clientId]['loggedIn'] = true;
      sockets[clientId]['cookies']['hawkchat-loggedin-identifier'] = $loggedInIdentifier;
      socket.emit('verify-hawkchat-loggedin-identifier', loggedUsers[$loggedInIdentifier]);
    } else {
      socket.emit('verify-hawkchat-loggedin-identifier');
    }
  });
  /* verify-hawkchat-loggedin-identifier */
  /* login-btn */
  socket.on('login-btn', function($data) {
    if($data['email'] == "" || $data['password'] == "") {
      socket.emit('form-response', {form:'login-error', message:'Please fill in all the fields.'});
      return;
    }
    connection.query("SELECT * FROM users WHERE email='" + mysql_escape($data['email']) + "'", function(err, results, fields) {
      if(err) {
        socket.emit('form-response', {form:'login-error', message:'There was a database error. Try again later.'});
        return;
      }
      if(results[0] == null) {
        socket.emit('form-response', {form:'login-error', message:'No account is associated with that email.'});
        return;
      }
      bcrypt.compare($data['password'], results[0]['password'], function(err, res) {
        if(err) {
          socket.emit('form-response', {form:'login-error', message:'There was a hashing error. Try again later.'});
          return;
        }
        if(!res) {
          socket.emit('form-response', {form:'login-error', message:'The password you entered is incorrect.'});
          return;
        }
        sockets[clientId]['cookies']['hawkchat-loggedin-identifier'] = shortid.generate() + shortid.generate() + shortid.generate();
        sockets[clientId]['loggedIn'] = true;
        socket.emit('cookie-create', sockets[clientId]['cookies']);
        results[0]['password'] = null;
        loggedUsers[sockets[clientId]['cookies']['hawkchat-loggedin-identifier']] = results[0];
        socket.emit('http-redirect', {page:'/webpanel.html', time:1000});
        socket.emit('form-response', {form:'login-error', message:'You have succesfully logged in. Redirecting...'});
      });
    });
  });
  /* login-btn */
});