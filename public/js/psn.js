//var trophiesComplete = "";
var earnedTrophies = "";
var loadedGame = "";
var writeUpdate = false;
var interval = 5000;
var run = "";
var timer = "";

var startTime = "";
var endTime = "";

$.ajaxSetup ({
    // Disable caching of AJAX responses
    cache: false
});


function startBTN() {
    $('.start').prop('disabled', true);
    $('.start').addClass('button--loading');
    $('.stop').prop('disabled', false);
    $('.load').prop('disabled', true);
    $('.jdropdown-header').prop('disabled', true);        
    $('.titleInTxt').prop('disabled', true);
    $('.missingTrophies').prop('disabled', true);
    $('input[name=toggle]').attr("disabled",true);
    if($(".missingTrophies").is(":checked")) { 
        var npCommunicationId = $(".npCommunicationId").text(  );
        var npServiceName = $(".npServiceName").text(  );           
        socket.emit('missingTrophies', { npCommunicationId: npCommunicationId, npServiceName: npServiceName, update: "reload" });   
    }

    run = setInterval(track , interval);
    timer = setInterval(runTimer , 1000);
    socket.emit('startTimer', { data: $(".playTime").text()});
}
  //websocket auf node localhost
var socket = io('http://localhost');

socket.on('reload', function (data) {
  console.log("reload", data);
  window.location.reload();
});

socket.on('activeGame', function (data) {
    loadGame(data.activeGame[0],data.activeGame[1],data.activeGame[2]); 
    startBTN();        
  });

socket.on('trackResult', function (data) {
    writeUpdate = false;

    //get variables
    var npCommunicationId = $(".npCommunicationId").text(  );
    var npServiceName = $(".npServiceName").text(  );
    
    var platin = $(".platin").text().split(' / ');
    var gold = $(".gold").text().split(' / ');
    var silber = $(".silber").text().split(' / ');
    var bronze = $(".bronze").text().split(' / ');

    games=JSON.parse(data['titles']);
    console.log("titles:", games['trophyTitles']);
    
    games['trophyTitles'].forEach(game => {
        if(game['npCommunicationId']===npCommunicationId) {             
            if (game['earnedTrophies']['platinum'] != parseInt(platin[0])) { 
                    writeUpdate=true
                    updateGame(game,"platinum");
                    //socket.emit('writeTXT', {filename: "data/platingesamt.txt", data: trophiesComplete['earnedTrophies']['platinum'].toString()});
            }
            if (game['earnedTrophies']['gold'] != parseInt(gold[0])) { 
                writeUpdate=true
                updateGame(game,"gold");
            }
            if (game['earnedTrophies']['silver'] != parseInt(silber[0])) { 
                writeUpdate=true
                updateGame(game,"silver");
            }
            if (game['earnedTrophies']['bronze'] != parseInt(bronze[0])) { 
                writeUpdate=true
                updateGame(game,"bronze");
                console.log("bronze update");
            }       
        }
    });
    if (writeUpdate === true) {
        socket.emit('trophySummary');
        if($(".missingTrophies").is(":checked")) {          
            socket.emit('missingTrophies', { npCommunicationId: npCommunicationId, npServiceName: npServiceName, update: "update" });   
        }
    }
});

function track() {
    socket.emit('trackGames', {l: 1, o: 0}); 
}	

function runTimer() {
    var timerValue = $('.playTime').text().split(":");
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
    $('.playTime').text(hours+":"+minutes+":"+seconds);
    $('.start').prop('disabled', true);
}

window.onload = function(){
    document.querySelectorAll(".searchbutton").forEach(i => i.addEventListener(
        "click",
        e => {
            alert(e.currentTarget.dataset.myDataContent);
        }));
    socket.emit('trophySummary')
    $( ".start" ).click(function() {
        $('.start').prop('disabled', true);
        $('.start').addClass('button--loading');
        $('.stop').prop('disabled', false);
        $('.load').prop('disabled', true);
        $('.jdropdown-header').prop('disabled', true);        
        $('.titleInTxt').prop('disabled', true);
        $('.missingTrophies').prop('disabled', true);
        $('input[name=toggle]').attr("disabled",true);
        if($(".missingTrophies").is(":checked")) { 
            var npCommunicationId = $(".npCommunicationId").text(  );
            var npServiceName = $(".npServiceName").text(  );           
            socket.emit('missingTrophies', { npCommunicationId: npCommunicationId, npServiceName: npServiceName, update: "reload" });   
        }

        run = setInterval(track , interval);
        timer = setInterval(runTimer , 1000);
        socket.emit('startTimer', { data: $(".playTime").text()}); 
    });
    $( ".stop" ).click(function() {
        $('.start').prop('disabled', false);
        $('.start').removeClass('button--loading');
        $('.stop').prop('disabled', true);
        $('.load').prop('disabled', false);
        $('.jdropdown-header').prop('disabled', false);
        $('.titleInTxt').prop('disabled', false);
        $('.missingTrophies').prop('disabled', false);
        $('input[name=toggle]').attr("disabled",false);
        socket.emit('playTime', { npCommunicationId: loadedGame["npCommunicationId"], data: JSON.stringify($(".playTime").text())});
        socket.emit('stopTimer', { data: $(".playTime").text()}); 
        clearInterval(run);
        clearInterval(timer);
    });
    document.getElementById("dialog-trigger").addEventListener("click", (function() {
        document.getElementById("dialog-result").innerText = "",
        document.getElementById("dialog").showModal()
    }
    )),
    document.getElementById("dialog").addEventListener("close", (function(e) {
        console.log(e.target.returnValue);
        if(e.target.returnValue==100) {
            //socket.emit('gameList', {l: 100, o: 0});
            socket.emit('gameList', {l: 1600, o: 'all'});    
        }
        if(e.target.returnValue=='all') {
            console.log("get all games");
            //FIX to get gamelist complete
            //socket.emit('gameList', {l: 1600, o: 'all'}); 
            socket.emit('getPlaytime', { data: "ok" });  
        }
    }
    ));
    document.getElementById("addnotes").addEventListener("click", (function() {

        document.getElementById("dialog-notes").innerText = "";
        document.getElementById("notes").showModal(); 
        if(loadedGame) {
            $('#notes').find('header').text("Kommentar für "+$(".gameTitle").text()+" hinzufügen?");
            $(".addNotes").html( '<textarea name="noteText" id="noteText" placeholder="Kommentar eingeben..."></textarea>' );
            fetch("../data/db/gamesComments.json", {cache: "no-cache"})
            .then(response => response.text())
            .then(text => {
                data=JSON.parse(text);
                if (data.hasOwnProperty(loadedGame["npCommunicationId"])) {
                    //console.log(JSON.parse(data[loadedGame["npCommunicationId"]]));
                    $("#noteText").val(JSON.parse(data[loadedGame["npCommunicationId"]]));
                }
                return
            }) 
        } else {
            $(".addNotes").text( "Bitte Spiel laden." ); 
        }       
    }
    )),
    document.getElementById("notes").addEventListener("close", (function(e) {
        if(e.target.returnValue=="save") {
            socket.emit('saveNotes', { npCommunicationId: loadedGame["npCommunicationId"], data: JSON.stringify($("#noteText").val())});
        }

    }
    ));

    document.getElementById("changeTimer").addEventListener("click", (function() {

        document.getElementById("dialog-timer").innerText = "";
        document.getElementById("timer").showModal(); 
        if(loadedGame) {
            console.log("load timer");
            //$(".addTimer").text( $('.playTime').text()); 
            var timerValue = $('.playTime').text().split(":");  
            $(".hours").val(timerValue[0]);
            $(".minutes").val(timerValue[1]);  
            $(".seconds").val(timerValue[2]); 
            $(".searchResults").css('display','none');       
        } else {
             
        }       
    }
    )),

    document.querySelectorAll('.resultButton').forEach(el => el.addEventListener('click', event => {
      console.log(event.target.getAttribute("data-duration"));
    }));
    document.getElementById("timer").addEventListener("close", (function(e) {
        if(e.target.returnValue==="save") {
            var hours = parseInt($(".hours").val());
            var minutes = parseInt($(".minutes").val());
            var seconds = parseInt($(".seconds").val());
            if(hours<10) hours = "0"+hours;
            if(minutes<10) minutes = "0"+minutes;
            if(seconds<10) seconds = "0"+seconds; 
            $('.playTime').text(hours+":"+minutes+":"+seconds);
            socket.emit('playTime', { npCommunicationId: loadedGame["npCommunicationId"], data: JSON.stringify($(".playTime").text())}); 
        }
        if(e.target.returnValue && e.target.returnValue!="save" && e.target.returnValue!="search" && e.target.returnValue!="no") {
            var info =e.target.returnValue.split("||");
            $('.playTime').text(info[1]);
            socket.emit('playTime', { npCommunicationId: loadedGame["npCommunicationId"], data: JSON.stringify($(".playTime").text())});
            socket.emit('saveIds', { npCommunicationId: loadedGame["npCommunicationId"], data: info[0]});
            //console.log(e.target.returnValue);
        }
        if(e.target.returnValue==="search") {
            document.getElementById("timer").showModal();
            fetch("../data/db/playTimeResults.json", {cache: "no-cache"})
                .then(response => response.text())
                .then(text => {
                    data=JSON.parse(text);
                    return
            }).then( () => {
                //console.log(data);
                var finalResults = [];
                var result = findObjects(data, 'localizedName', $('.gameTitle').text(), finalResults);
                //console.log(finalResults);
                var html="Ergebnisse:"+finalResults.length+"<br /><form><table style=\"width: 400px;\">";
                html+="<tr>";
                html+="<td style=\"width: 130px;\" style=\"border: 1px solid white;\">TitleId</td>";
                html+="<td style=\"width: 130px;\" style=\"border: 1px solid white;\">Spielzeit</td>";
                html+="<td style=\"width: 60px;\" style=\"border: 1px solid white;\">gespielt</td>";
                html+="<td style=\"width: 80px;\"></td>";
                html+="</tr>";
                finalResults.forEach(result => {
                    if(result["playDuration"]==="PT0S") {
                        var playTimeFormat = "00:00:00";
                    } else {
                        var playTimeFormat = getPlaytimeFormat(result["playDuration"]);
                    }
                    html+="<tr>";
                    html+="<td>"+result["titleId"]+"</td>";
                    html+="<td>"+playTimeFormat+"</td>";
                    html+="<td>"+result["playCount"]+"</td>";
                    html+="<td><button class=\"resultButton\" value=\""+result["titleId"]+"||"+playTimeFormat+"\"><i class=\"fa fa-check\"></i></button></td>";
                    html+="</tr>";  
                });
                html+="</table></form>";
                $(".searchResults").html(html);
                $(".searchResults").css('display','');
            });  
        }

    }
    ));

    $('.titleInTxt').change(function() {
        if($(this).is(":checked")) {
           localStorage.setItem('inTitle', 'yes');
        } else {
            localStorage.setItem('inTitle', 'no');
        }
        if(loadedGame) {
            updateGame(loadedGame,"gesamt");    
        }
     });
     if (localStorage.inTitle === 'yes') {
         //console.log("checked");
        $('.titleInTxt').attr('checked', true);
     } else {
        console.log("unchecked");
        $('.titleInTxt').attr('checked', false);
    }
    $('.missingTrophies').change(function() {
        if($(this).is(":checked")) {
           localStorage.setItem('missingTrophies', 'yes');
        } else {
            localStorage.setItem('missingTrophies', 'no');
            socket.emit('missingTrophies', { npCommunicationId: '', npServiceName: '', update: "reload" }); 
        }
     });
     if (localStorage.missingTrophies === 'yes') {
         //console.log("checked");
        $('.missingTrophies').attr('checked', true);
     } else {
        //console.log("unchecked");
        $('.missingTrophies').attr('checked', false);
    }
}

function getPlaytimeFormat(timestr) {
    
    if(timestr.includes('H')) {
        var hours = timestr.match(/T(.*?)H/i)[1]; 
    } else {
        var hours = 0;
    }

    if(timestr.includes('M')) {
        if(timestr.includes('H')) {
            var minutes = timestr.match(/H(.*?)M/i)[1]; 
        } else {
            var minutes = timestr.match(/T(.*?)M/i)[1]; 
        }

    } else {
        var minutes = 0;
    }

    if(timestr.includes('S')) {
        if(timestr.includes('M')) {
            var seconds = timestr.match(/M(.*?)S/i)[1];
        } else if((timestr.includes('H'))) {
            var seconds = timestr.match(/H(.*?)S/i)[1];
        } else {
            var seconds = timestr.match(/H(.*?)S/i)[1];
        }
    } else {
        var seconds = 0;
    }                           

    if(hours<10) hours = "0"+hours;
    if(minutes<10) minutes = "0"+minutes;
    if(seconds<10) seconds = "0"+seconds;
    return hours+":"+minutes+":"+seconds;

}

function param(name) {
    return (location.search.split(name + '=')[1] || '').split('&')[0];
}

  function findObjects(obj, targetProp, targetValue, finalResults) {

    function getObject(theObject) {
      let result = null;
      if (theObject instanceof Array) {
        for (let i = 0; i < theObject.length; i++) {
          getObject(theObject[i]);
        }
      } else {
        for (let prop in theObject) {
          if (theObject.hasOwnProperty(prop)) {
            //console.log(prop + ': ' + theObject[prop]);
            if (prop === targetProp) {
              //console.log('--found id');
              if (theObject[prop] === targetValue) {
                //console.log('----found porop', prop, ', ', theObject[prop]);
                finalResults.push(theObject);
              }
            }
            if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
              getObject(theObject[prop]);
            }
          }
        }
      }
    }
  
    getObject(obj);
  
  }

$(document).ready(function() {
    $("input[name=toggle]").change(function(){
        if($(this).attr('value')==="add") {
            console.log("todo: add notes function for games");
        } else {
            window.location.href = window.location.origin + window.location.pathname + $(this).attr('data');
        }
    });
    $("input[name=region]").change(function(){
        if(loadedGame) {    
            socket.emit('saveRegion', { npCommunicationId: loadedGame["npCommunicationId"], data: JSON.stringify($(this).attr('value'))});
            //console.log($(this).attr('value'));
        }
    });

    if(param("sort")==="asc") {
        $('input[name=toggle]:nth-child(1)').attr('checked', 'checked');
    } else if(param("sort")==="desc") {
        $('input[name=toggle]:nth-child(5)').attr('checked', 'checked');
    } else {
        $('input[name=toggle]:nth-child(3)').attr('checked', 'checked');
    }

    $(function () {
        $("#games").on('change', function (evt) {
          //console.log($(this).val(),$('#games').find(':selected').text(),$('#games').find(':selected').attr('data-timestamp'));
          loadGame($('#games').find(':selected').text(), $(this).val(), $('#games').find(':selected').attr('data-timestamp'));
        })
    })
    var menu = jSuites.dropdown(document.getElementById('games'), {
        autocomplete: true,
        width: '335px',
        fullscreen: true,
        onopen: function() {
            if($('.jdropdown-header').attr('disabled')) {
                console.log("disabled");
                menu.close()
            }            
        },
        onchange: function(el,val) {
            var selected = Object.entries(val['value']);
            console.log(selected[0][1]);
            if(selected[0][1]!="Bitte Spiel wählen...") loadGame(selected[0][1], selected[0][0], $('#games').find('[value='+selected[0][0]+']').attr('data-timestamp'));
        },
    });

    //check for started game
    socket.emit('checkPresence');
});

function loadGame(title, npCommunicationId, timestamp) {
    console.log(npCommunicationId);
    fetch("../data/db/gamesList.json", {cache: "no-cache"})
        .then(response => response.text())
        .then(text => {
            data=JSON.parse(text);
            //console.log(JSON.parse(data[npCommunicationId]));
            updateGame(JSON.parse(data[npCommunicationId]),"all");
            loadedGame =JSON.parse(data[npCommunicationId]);
            /*var lastPlayed= new Date(Date.parse(loadedGame["lastUpdatedDateTime"])).toLocaleString();
            console.log(lastPlayed);*/
            $('.start').prop('disabled', false);
            $(".gameInfos").css('display', "block");
            return
    }).then( () => {
        fetch("../data/db/gamesComments.json", {cache: "no-cache"})
            .then(response => response.text())
            .then(text => {
                data=JSON.parse(text);
                if (data.hasOwnProperty(loadedGame["npCommunicationId"])) {
                    var comment=JSON.parse(data[loadedGame["npCommunicationId"]]);
                }
                if(comment) { console.log(comment); $('.notes-toggle').css('color', 'green'); } else { $('.notes-toggle').css('color', 'white'); }
                return
        }); 
    }).then( () => {
        fetch("../data/db/gamesRegions.json", {cache: "no-cache"})
            .then(response => response.text())
            .then(text => {
                data=JSON.parse(text);
                if (data.hasOwnProperty(loadedGame["npCommunicationId"])) {
                    var region=JSON.parse(data[loadedGame["npCommunicationId"]]);
                } else {
                    region = "eu";
                }
                if(region==="eu") $('#eu').prop('checked', true);
                if(region==="na") $('#na').prop('checked', true);
                if(region==="as") $('#as').prop('checked', true);
                return
        }); 
    }).then( () => {
        fetch("../data/db/gamesplayTime.json", {cache: "no-cache"})
            .then(response => response.text())
            .then(text => {
                data=JSON.parse(text);
                if (data.hasOwnProperty(loadedGame["npCommunicationId"])) {
                    var playTime=JSON.parse(data[loadedGame["npCommunicationId"]]);                    
                    $('.playTime').text(playTime);
                    socket.emit('updateTimer', { playTime });
                } else {
                    $('.playTime').text("00:00:00");
                }
                return
        }); 
        if($(".missingTrophies").is(":checked")) { 
            socket.emit('missingTrophies', { npCommunicationId: loadedGame["npCommunicationId"], npServiceName: loadedGame["npServiceName"], update: "reload" });
        }
    });    
}

function updateGame(data,update) {
    //console.log(data);
    $(".gameTitle").text( data['trophyTitleName'] );
    $(".npCommunicationId").text( data['npCommunicationId'] );
    $(".npServiceName").text( data['npServiceName'] );
    $('.gamefield').addClass('loaded');
    var platinumText = data['earnedTrophies']['platinum'] + " / " + data['definedTrophies']['platinum']; 
    $(".platin").text( platinumText );
    var goldText = data['earnedTrophies']['gold'] + " / " + data['definedTrophies']['gold']; 
    $(".gold").text( goldText ); 
    var silberText = data['earnedTrophies']['silver'] + " / " + data['definedTrophies']['silver']; 
    $(".silber").text( silberText );
    var bronzeText = data['earnedTrophies']['bronze'] + " / " + data['definedTrophies']['bronze']; 
    $(".bronze").text( bronzeText );
    
    console.log(data['npServiceName']);
    $(".platin").removeClass().addClass("platin").addClass(data['npServiceName']);
    /*$(".gold").removeClass().addClass("platin").addClass(data['npServiceName']);
    $(".silber").removeClass().addClass("platin").addClass(data['npServiceName']);
    $(".bronze").removeClass().addClass("platin").addClass(data['npServiceName']);*/



    var gesamt=data['earnedTrophies']['platinum']+data['earnedTrophies']['gold']+data['earnedTrophies']['silver']+data['earnedTrophies']['bronze'];
    var gesamtall=data['definedTrophies']['platinum']+data['definedTrophies']['gold']+data['definedTrophies']['silver']+data['definedTrophies']['bronze'];
    
    if ($('input.titleInTxt').is(':checked')) {
        socket.emit('writeTXT', {filename: "data/gesamt.txt", data: data['trophyTitleName'] + " * " + gesamt + " / " + gesamtall + " * " + data['progress'] + "%"})
    } else {
        socket.emit('writeTXT', {filename: "data/gesamt.txt", data: gesamt + " / " + gesamtall + " * " + data['progress'] + "%"})
    }

    if(update=="all") {
        socket.emit('writeTXT', {filename: "data/platin.txt", data: platinumText})
        socket.emit('writeTXT', {filename: "data/gold.txt", data: goldText})
        socket.emit('writeTXT', {filename: "data/silber.txt", data: silberText})
        socket.emit('writeTXT', {filename: "data/bronze.txt", data: bronzeText})
    }
    if(update=="platinum") {
        socket.emit('writeTXT', {filename: "data/platin.txt", data: platinumText})
    }
    if(update=="gold") {
        socket.emit('writeTXT', {filename: "data/gold.txt", data: goldText})
    }
    if(update=="silver") {
        socket.emit('writeTXT', {filename: "data/silber.txt", data: silberText})
    }
    if(update=="bronze") {
        socket.emit('writeTXT', {filename: "data/bronze.txt", data: bronzeText})
    }
    
    socket.emit('updateOverlay', { platinum: platinumText, gold: goldText, silber: silberText, bronze: bronzeText,  npServiceName: data['npServiceName']});
}
