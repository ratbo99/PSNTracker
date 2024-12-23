var socket = io('http://localhost');


socket.on('updateOverlay', function (data) {
    console.log(data);
    $('.platin').text(data['platinum']);
    $('.gold').text(data['gold']);
    $('.silber').text(data['silber']);
    $('.bronze').text(data['bronze']);
    $(".platin").removeClass().addClass("platin").addClass(data['npServiceName']);
});