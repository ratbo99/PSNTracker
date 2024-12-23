var socket = io('http://localhost');

socket.on('reload', function (data) {
  $('.container').load( "missingupdate", function(data) {
    $( '.container' ).html( data );    
  });
});
socket.on('update', function (data) {
  $('.container').load( "missingupdate", function(data) {
    $( '.container' ).html( data );    
  });
});