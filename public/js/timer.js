var interval = 1000;
var run = "";
var timer = "";

var startTime = "";
var endTime = "";

var socket = io('http://localhost');

socket.on('startTimer', function (data) {
      console.log("start timer", data);
      $('.timer').text(data['data']);
      timer = setInterval(runTimer , 1000);
});

socket.on('stopTimer', function (data) {
      console.log("stop timer", data);
      clearInterval(timer);
});

socket.on('updateTimer', function (data) {
    console.log(data);
    $('.timer').text(data['playTime']);
    //timer = setInterval(runTimer , 1000);
});

//socket.emit('update', { data: 'ok' });

function runTimer() {
      var timerValue = $('.timer').text().split(":");
      var hours = parseInt(timerValue[0]);
      var minutes = parseInt(timerValue[1]);
      var seconds = parseInt(timerValue[2]);
      if(seconds==59) {
          seconds=0;
          if(minutes==59) {
              minutes=0;
              hours+=1;
          } else {
              minutes+=1; 
          }
      } else {
          seconds+=1;
      }
      if(hours<10) hours = "0"+hours;
      if(minutes<10) minutes = "0"+minutes;
      if(seconds<10) seconds = "0"+seconds;
      $('.timer').text(hours+":"+minutes+":"+seconds);
}