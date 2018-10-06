var socket = io();
/* clientId */
var clientId;
socket.on('clientId', function($clientId) {
	clientId = $clientId;
});
/* clientId */
/* cookie */
socket.on('cookie-create', function($cookies) {
	var cookieString = "";
	for(var cookie in $cookies) {
		var cookieKey = cookie;
		var cookieValue = $cookies[cookie];
		cookieString = cookieString + cookieKey + "=" + cookieValue + ";";
	}
	document.cookie = cookieString;
});
socket.on('cookie-destroy', function() {
	destroyCookies();
});
function destroyCookies() {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}
function getCookie($cookieName) {
	var cookies = document.cookie.split(";");
	for($cookie in cookies) {
		if(cookies[$cookie].indexOf($cookieName) != -1) {
			return cookies[$cookie].split("=")[1];
		}
	}
}
/* cookie */
/* login manager */
var userData;
if(window.location.href.indexOf("webpanel") != -1) {
	if(document.cookie.indexOf("hawkchat-loggedin-identifier") == -1) {
		window.location.replace('/login.html');
	} else {
		/* verify-hawkchat-loggedin-identifier */
		socket.on('verify-hawkchat-loggedin-identifier', function($userData) {
			if($userData == null) {
				destroyCookies();
				window.location.replace('/login.html');
			} else {
				userData = $userData;
				$('#navbar-logout-a').click(function() {
					destroyCookies();
					window.location.replace('/index.html');
				});
			}
		});
		var loggedInIdentifier = getCookie('hawkchat-loggedin-identifier');
		socket.emit('verify-hawkchat-loggedin-identifier', loggedInIdentifier);
		/* verify-hawkchat-loggedin-identifier */
	}
}
if(window.location.href.indexOf("signup") != -1) {
	destroyCookies();
}
/* login manager */
/*  form-response */
socket.on('form-response', function($data) {
	$('#' + $data['form']).html($data['message']);
	$('#' + $data['form']).removeClass('hide');
});
/* form-response */
/* signup-btn */
$('#signup-btn').click(function() {
	socket.emit('signup-btn', {email:$('#signup-email').val(), password:$('#signup-password').val(), affiliation:$('#signup-affiliation').val()})
});
/* signup-btn */
/* login-btn */
$('#login-btn').click(function() {
	socket.emit('login-btn', {email:$('#login-email').val(), password:$('#login-password').val()});
});
/* login-btn */
/* http-redirect */
socket.on('http-redirect', function($data) {
	setTimeout(function() {
		window.location.replace($data['page']);
	}, $data['time']);
});
/* http-direct */