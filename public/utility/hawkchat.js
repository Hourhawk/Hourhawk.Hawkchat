var socket = io();

/* clientId */
var clientId;
socket.on('clientId', function($clientId) {
	clientId = $clientId;
});
/* clientId */
/* loginId */
var loginId;
/* loginId */
/*  form-response */
socket.on('form-response', function($data) {
	$('#signup-error').html($data['message']);
	$('#signup-error').removeClass('hide');
});
/* form-response */
/* signup-btn */
$('#signup-btn').click(function() {
	socket.emit('signup-btn', {email:$('#signup-email').val(), password:$('#signup-password').val(), affiliation:$('#signup-affiliation').val()})
});
/* signup-btn */