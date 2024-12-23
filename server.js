// Module die wir benutzen
const express = require('express');
const app = express();
const http = require('http').Server(app);
const { Database } = require("ark.db");

app.engine('pug', require('pug').__express)

var ProgressBar = require('progress');

//socket.io konfiguration für ältere client js
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});

const path = require('path');
const fs = require('fs')
var fsPath = require('fs-path');

require('paint-console');

if (!fs.existsSync('./data/db')){
  fs.mkdirSync('./data/db', { recursive: true });
}

// Datenbanken definieren
const dbConfig = new Database("data/db/config.json");

// enthält fehlende Trophies für gewähltes Spiel > wird erstellt aus trophyInfos Daten
const dbmissingTrophies = new Database("data/db/gameMissingTrophies.json");

// enthält komplette Trophyliste für Spiel (npcommunicationid)
const dbTrophyInfos = new Database("data/db/gamesInfos.json");

// enthält Daten zu erspielten Trophies je Game > für alle geladenen
const dbGames = new Database("data/db/gamesList.json");

// enthält Keypaar npCommunicationId / Cusa // TODO: ändere laden aller Spielzeiten in download json > search after cusas
const dbIds = new Database("data/db/gamesIds.json");

// Kommentare zu Spielen > manuell gesetzt
const dbComments = new Database("data/db/gamesComments.json");

// Regionen zu Spielen > manuell gesetzt
const dbRegions = new Database("data/db/gamesRegions.json");

// Regionen zu Spielen > manuell gesetzt
const dbplayTime = new Database("data/db/gamesplayTime.json");


const server = http.listen(80, () => {
  splashscreen();
});

function splashscreen() {

  console.clear();
  console.info(`\n+-+-+-+RatBo\'s+-+-+-+\r\n|P|S|N|T|r|a|c|k|e|r|\r\n+-+-+-+-+-+-+-+-+-+-+`);    
  console.info(`\nPSNTracker > http://localhost/psn`);
  console.info(`fehlende Trophäen > http://localhost/missing`);
  console.info(`Spielzeit > http://localhost/timer`);
  console.info(`Trophäenoverlay > http://localhost/overlay\n`);
  
  dbplayTime.all();
  var i = 0;
  var titles = [];
  var times = dbplayTime.all();
  times = Object.entries(times);
  times.forEach(game => {
    var npCommunicationId = game[0];
    var time = JSON.parse(game[1]);
    var timestamp = time.split(":");
    var hours = parseInt(timestamp[0])*60*60;
    var minutes = parseInt(timestamp[1])*60;
    var seconds = parseInt(timestamp[2]);
    timestamp = hours+minutes+seconds;
    if(dbGames.has(npCommunicationId)) {  
      var game = JSON.parse(dbGames.get(npCommunicationId));
      titles.push([game['trophyTitleName'], timestamp, time ]);
    }
  });
  var x =titles.sort(function(a,b){ return b[1] > a[1] ? 1 : -1; });
  x.length=15;
  console.warn("\nTop",x.filter(Boolean).length,"Spielzeit:",'\n');
  var timesTable = {};
  i=1;
  x.forEach(game => {  timesTable[i]=[game[0],game[2]]; i++; });
  console.table(timesTable);
  console.log("\n");
}

//Template Engine Pug
app.set('view engine', 'pug');
//Sichtbar für Browser
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, '.','views'));
// -> weiteren Ordner für Browser > anders als oben um in compilierter form zugriff zu haben
app.use('/data', express.static(path.join(process.cwd(), '/data')));


var psnID = "";
var accountId = "";
var PSN_NPSSO = "";
//var socketToken = "";

//var queue = [];
//var running = false;

// Config von dbConfig holen, oder erstellen, falls nicht vorhanden
if(dbConfig.has("npsso")) PSN_NPSSO = dbConfig.get("npsso");
if(dbConfig.has("psnID")) psnID = dbConfig.get("psnID");


if(!psnID || !PSN_NPSSO) {
    dbConfig.set("npsso","xxxNPSSOxxx");
    dbConfig.set("psnID","xxxPSNIDxxx");
    console.error("data/config.json: PSNID, NPSSO eintragen");
    sleep(5000);
    process.exit();
}
if(psnID==="xxxPSNIDxxx" || PSN_NPSSO==="xxxNPSSOxxx") {
    console.error("data/config.json: Bitte korrekte PSNID, NPSSO eintragen.");
    sleep(5000);
    process.exit();
}

//definiere express routen
app.get('/timer', function (req, res) {
  res.render('timer', {title: 'Spielzeit Timer'});
});

app.get('/overlay', function (req, res) {
  res.render('overlay', {title: 'Trophy Overlay'});
});

// Seite für fehlende Trophäen
app.get('/missing', function (req, res) {
    var missingTrophies = dbmissingTrophies.all();
    try {
      res.render('missing', {results: missingTrophies[0], title: 'Fehlende Trophäen', count: missingTrophies[0].length});
    }
    catch (e) {
      res.render('missing', {results: missingTrophies[0], title: 'Fehlende Trophäen', count: 0});
    }
});

app.get('/missingupdate', function (req, res) {
  var missingTrophies = dbmissingTrophies.all();
  try {
    res.render('missingupdate', {results: missingTrophies[0], title: 'Fehlende Trophäen', count: missingTrophies[0].length});
  }
  catch (e) {
    res.render('missingupdate', {results: missingTrophies[0], title: 'Fehlende Trophäen', count: 0});
  }
});

var playTime=[];
var idString ="";

app.get('/psn', function (req, res) {
    playTime.length=0;
    getPlaytime(5,0).then(r => {
        idString=""; 
        r['titles'].forEach(game => {          
          playTime.push([game["titleId"],game["playDuration"],game["name"]]);
          idString+=game["titleId"]+"%2C";
        });
        return playTime
    }).then(playTime => { 
        getnpCommunicationId(idString.substr(0,idString.length-3)).then(r => {
          r['titles'].forEach(game => {
            try {
                game['trophyTitles'][0]['npTitleId']=game['npTitleId'];
                dbGames.set(game['trophyTitles'][0]['npCommunicationId'], JSON.stringify(game['trophyTitles'][0]));
                dbIds.set(game['trophyTitles'][0]['npCommunicationId'],game['npTitleId']);
                playTime.forEach(entry => {
                  if(entry[0]===game['npTitleId']) {
                    var playTimeFormat = getPlaytimeFormat(entry[1]);                  
                    dbplayTime.set(game['trophyTitles'][0]['npCommunicationId'], "\""+playTimeFormat+"\"");
                  }
                });
           }
           catch (e) {
              //console.log(e);
              console.error(playTime[0][2],"konnte nicht geladen werden. Bitte Trophäen syncronisieren und PSNTracker neu laden.");
           }              
          });

          var titles = [];
          games = Object.entries(dbGames.all());
          games.forEach(game => {
            game = JSON.parse(game[1]);  
            var title = [game['trophyTitleName'],game['npCommunicationId'],Date.parse(game['lastUpdatedDateTime'])]
            titles.push(title);
            return
           });
           if(req.query.sort==="asc") {
            var x =titles.sort(function(a,b){ return a[0] > b[0] ? 1 : -1; }); 
          } else if(req.query.sort==="desc") {
            var x =titles.sort(function(a,b){ return b[0] > a[0] ? 1 : -1; }); 
          } else {
            var x =titles.sort(function(a,b){ return b[2] > a[2] ? 1 : -1; }); 
          }
          res.render('psn', {title: 'PSN Trophy Tracker', results: x, count: games.length});
          return;
        });
    }); 
      
  
    }) 

function getPlaytimeFormat(timestr) {
  if(timestr==="PT0S") {
    return "00:00:00";
  } else {
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
        var seconds = timestr.match(/PT(.*?)S/i)[1];
      }
    } else {
      var seconds = 0;
    }
      if(hours<10) hours = "0"+hours;
      if(minutes<10) minutes = "0"+minutes;
      if(seconds<10) seconds = "0"+seconds;
      return hours+":"+minutes+":"+seconds;
  }
}

var current = 0;
var bar = "";
var loader="";

//socket server events
io.on('connection', function (socket) {
    console.log(socket.request.headers.referer, "verbunden.");

    socket.on("disconnect", () => {
      if(socket.request.headers.referer == "http://localhost/psn") { clearInterval(loader); socket.broadcast.emit('stopTimer', 'ok'); }
    });

    socket.on('update', function(data){
        socket.broadcast.emit('update', { data: 'ok' });
    });

      socket.on('reload', function(data){
        socket.broadcast.emit('reload', { data: 'ok' });
    });

    socket.on('checkPresence', function(data){
      getPrecense().then(t => {
        try {
          if(t["basicPresence"]["gameTitleInfoList"][0]["npTitleId"]) {
            getnpCommunicationId(t["basicPresence"]["gameTitleInfoList"][0]["npTitleId"]).then(r => {
              let activeGame = [r["titles"][0]["trophyTitles"][0]["trophyTitleName"],r["titles"][0]["trophyTitles"][0]["npCommunicationId"],Date.parse(r["titles"][0]["trophyTitles"][0]['lastUpdatedDateTime'])];
              socket.emit('activeGame', { activeGame });
            });
          }
        }
        catch (e) {
          console.log("kein Spiel gestartet");
        }
      });
    });

    socket.on('saveNotes', function(data){
        console.log("update Notes DB", data);
        dbComments.set(data['npCommunicationId'], data['data']); 
    });
  
    socket.on('saveRegion', function(data){
      dbRegions.set(data['npCommunicationId'], data['data']); 
    });
  
    socket.on('saveIds', function(data){
      dbIds.set(data['npCommunicationId'], data['data']); 
    });
  
    socket.on('playTime', function(data){
      dbplayTime.set(data['npCommunicationId'], data['data']); 
    });
  
    socket.on('startTimer', function(data){
      socket.broadcast.emit('startTimer', data);
      const P = ['\\', '|', '/', '-'];
      let y = 0;
      loader = setInterval(() => {
        process.stdout.write(`\r${P[y++]}`);
        y %= P.length;
      }, 250);
    });
  
    socket.on('stopTimer', function(data){
      socket.broadcast.emit('stopTimer', data); 
      clearInterval(loader);
    });

    socket.on('updateTimer', function(data){
      socket.broadcast.emit('updateTimer', data); 
    });

    socket.on('updateOverlay', function(data){
      socket.broadcast.emit('updateOverlay', data); 
    });

    socket.on('trophySummary', function(){
        trophySummary().then(r => {          
            writeData('data/trophies.json', JSON.stringify(r));
            var str = JSON.parse(r["earnedTrophies"]["platinum"]);
            writeData("data/platingesamt.txt",str.toString());
            summary=JSON.stringify(r); 
            socket.emit('trophySummaryResult', { summary });
        });      
      });

      socket.on('missingTrophies', function(data){
        if(data['npServiceName']=="") {
            dbmissingTrophies.clear();
            socket.broadcast.emit(data['update'], { data: 'ok' });
        } else {
            getMissingTrophies(data['npCommunicationId'],data['npServiceName']).then(r => {       
                dbmissingTrophies.set("0",r);
                socket.broadcast.emit(data['update'], { data: 'ok' });        
                summary=JSON.stringify(r);
                socket.emit('missingTrophiesResult', { summary });
            });
        }
      });

      socket.on('writeTXT', function(data){
        writeData(data['filename'],data['data']); 
      });
    let titleChange = "";
    socket.on('trackGames', function(data){
      getPrecense().then(t => {
        try {
          if(t["basicPresence"]["gameTitleInfoList"][0]["npTitleId"]) {
            if(titleChange!="" && t["basicPresence"]["gameTitleInfoList"][0]["npTitleId"]!=titleChange) { console.log("\nchange Game"); socket.emit('reload', { data: 'ok' }); }
            titleChange=t["basicPresence"]["gameTitleInfoList"][0]["npTitleId"];
          }
        }
        catch (e) {
          console.log("kein Spiel gestartet");
        }
      });
        gameList(data["l"],data["o"]).then(r => {  
          titles=JSON.stringify(r);
          socket.emit('trackResult', { titles });
          r['trophyTitles'].forEach(game => {
            //console.log(game);
            dbGames.set(game['npCommunicationId'], JSON.stringify(game));          
          });     
        });      
    });

    socket.on('gameList', function(data){
        var titles = [];
        if(data["o"]==="all") {
          console.info("Lade Spieleliste");
          for (var i = 0; i <= Math.ceil(data["l"]/800)-1; i++) {
            var limit = 800;
            var offset = limit*i;
            gameList(limit,offset).then(r => {
              r['trophyTitles'].forEach(game => {
                dbGames.set(game['npCommunicationId'], JSON.stringify(game));
            });  
            }); 
         }
         socket.emit('reload', { data: 'ok' }); 
        } else {
          gameList(data["l"],data["o"]).then(r => {
            var count=r['totalItemCount'];
            r['trophyTitles'].forEach(game => {
              dbGames.set(game['npCommunicationId'], JSON.stringify(game));
            });   
            socket.emit('reload', { data: 'ok' });    
          });
        }
            
      });

      var ids = [];
      var searchIds = [];

      socket.on('getPlaytime', function(data){
        console.info("Lade Spielzeiten");
        getPlaytime(1,0).then(r => {
            //console.log(r);
            return r
          }).then(playTime => {
            var total = playTime["totalItemCount"];
            bar = new ProgressBar('Spielzeiten werden geladen [:bar] :current/:total (:percent - :eta)', {
              complete: '=',
              incomplete: ' ',
              width: 50,
              total: total
            });
            for (var i = 0; i <= Math.ceil(playTime["totalItemCount"]/200); i++) {
              var limit = 200;
              var offset = (limit*i);
              if(offset>0) offset+=1;
              if(offset>playTime["totalItemCount"]) offset = playTime["totalItemCount"];
              //console.log(limit,offset);
              getPlaytime(limit,offset).then(r => {
                writeData("./data/db/playTimeResults.json",JSON.stringify(r));                
                ids = JSON.stringify(dbIds.all());
                r['titles'].forEach(game => {
                    if(ids.includes(game["titleId"])) {
                    } else {
                        searchIds.push(game["titleId"]);
                    }
                });
                loadPlayTimes(groupArr(searchIds,5), r);
            }); 
            }        
          });
          
      })
});

function groupArr(data, n) {
    var group = [];
    for (var i = 0, j = 0; i < data.length; i++) {
        if (i >= n && i % n === 0)
            j++;
        group[j] = group[j] || [];
        group[j].push(data[i])
    }
    return group;
}

const loadPlayTimes = async (searchIds, r) => {
    var content = r;
    searchIds.forEach(game => {
        //console.log(game.join('%2C'));
        getnpCommunicationId(game.join('%2C')).then(r => {
            r['titles'].forEach(game => {
                if(game['trophyTitles'][0]) {
                    var finalResults = [];
                    var result = findObjects(content, 'titleId', game['npTitleId'], finalResults);
                    finalResults.forEach(result => {
                    if(result["playDuration"]) {
                                    var playTimeFormat = getPlaytimeFormat(result["playDuration"]);                                   
                                    dbGames.set(game['trophyTitles'][0]['npCommunicationId'], JSON.stringify(game['trophyTitles'][0]));
                                    dbIds.set(game['trophyTitles'][0]['npCommunicationId'],game['npTitleId']);
                                    dbplayTime.set(game['trophyTitles'][0]['npCommunicationId'], "\""+playTimeFormat+"\"");
                                    //console.log(game['npTitleId'],"gespeichert");
                                    current++;
                                    bar.tick();
                                }
                    });
            }                
            });
            sleep(500);
          });
    });
    splashscreen();
    io.sockets.emit('reload',"ok"); //falsch?
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
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
            if (prop === targetProp) {
              if (theObject[prop] === targetValue) {
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

function writeData(filename, data){
    fsPath.writeFile(filename, data, function(err){
      if(err) {
        throw err;
      } else {
        //console.log('wrote a file like DaVinci drew machines');
      }
    });
  }

const got = require("got");
//const { timeStamp, count } = require('console');
//const { title } = require('process');

const AUTH_URI = "https://ca.account.sony.com/api/authz/v3/oauth";
const CLIENT_ID = "09515159-7237-4370-9b40-3806e67c0891";
const REDIRECT_URI = "com.scee.psxandroid.scecompcall://redirect";
const SCOPE = "psn:mobile.v2.core psn:clientapp";

//var tokens = [];

const authClient = got.extend({
    prefixUrl: "https://ca.account.sony.com/api/authz/v3/oauth",
    method: "POST",
    withCredentials: true,
    headers: {
        'Host': "ca.account.sony.com",
        'Referer': "https://my.playstation.com/",
        'Authorization':
            "Basic MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=",
        'Content-Type': "application/x-www-form-urlencoded",		
    },
});

const getToken = async () => {
    if(dbConfig.has("tokens")) {
	    let tokens = dbConfig.get("tokens");
	    var now= Math.round(+new Date()/1000);
	    //var expires = new Date(tokens.expires_in * 1000).toLocaleString()
	    //var refresh_expires = new Date(tokens.refresh_token_expires_in * 1000).toLocaleString()
	    if((tokens.expires_in)-now >= 0) {
			  return tokens;			
	    } else {			
        if((tokens.refresh_token_expires_in)-now >= 0) {
          if((tokens.refresh_token_expires_in)-now >= 0 && (tokens.refresh_token_expires_in)-now <= 259200) { console.log("refresh token läuft bald ab. bitte neue npsso eintragen."); }
          try {
            const res = await authClient("token", {
              body: `grant_type=refresh_token&scope=${SCOPE}&refresh_token=${tokens.refresh_token}&token_format=jwt`,
            }).json();
            var now= Math.round(+new Date()/1000);
            res["expires_in"]=now + res["expires_in"];
                      res["refresh_token_expires_in"]=tokens.refresh_token_expires_in;
            dbConfig.set("tokens",res);
            return res;
          } catch (err) {
            console.log(err.response.body);
				}			
			} else {
				console.log("refresh ungültig");
				dbConfig.delete("tokens")
				getToken();
			}
	    }
	    return tokens
    } else {
	    try {
            const redirectURI = await got("authorize", {
                prefixUrl: AUTH_URI,
                method: "GET",
                searchParams: {
                    access_type: "offline",
                    response_type: "code",
                    client_id: CLIENT_ID,
                    redirect_uri: REDIRECT_URI,
                    scope: SCOPE,
                },
                followRedirect: false,
                headers: {
                    Cookie: `npsso=${PSN_NPSSO}`,
                },
                responseType: "json",
            });
            const location = redirectURI.headers.location;
            console.log(location);
            const code = location.match(/code=([A-Za-z0-9:\?_\-\.\/=]+)/)[1];
            console.log(code);	
		    const tokens = await authClient("token", {
			    body: `code=${code}&grant_type=authorization_code&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&token_format=jwt`,
		    }).json();
		    var now = Math.round(+new Date()/1000);
		    tokens["expires_in"]=now+tokens.expires_in;
		    tokens["refresh_token_expires_in"] = now+tokens.refresh_token_expires_in;
		    dbConfig.set("tokens",tokens);
		    return tokens
        } catch (err) {
          console.log(err);
            throw new Error(err)
        }
    }
};

async function profile() {
  const tokens = await getToken();
  accessToken = tokens['access_token'];
  try {    
    //"https://us-prof.np.community.playstation.net/userProfile/v1/users" + psnID + "/profile2?fields=accountId,onlineId,currentOnlineId"
    const { body } = await got.get("https://dms.api.playstation.com/api/v1/devices/accounts/me",
      {
        headers: {
          Authorization: `Bearer ${tokens['access_token']}`,
        },
        responseType: "json",
      }
    );
    //console.log(body.accountId);
    accountId = body.accountId;
    return body.accountId;
  } catch (err) {
    console.log(err);
  }
}


//psn api verbinden
 if(!accountId) {
	profile().then(r => {
      console.log("PSN Api verbunden: ",r);
    });
 }

 const getPrecense = async () => {
  const tokens = await getToken();  
  try {
     const {body} = await got.get(
         "https://m.np.playstation.com/api/userProfile/v1/internal/users/"+accountId+"/basicPresences?type=primary",
         {
             headers: {
               Authorization: `Bearer ${tokens['access_token']}`,
                 "Accept-Language": "de-DE",
             },
             responseType: "json",
         }
     );
     return body;
 } catch (err) {
     console.log(err.response.body);
 }
};


const gameList = async (l,o) => {
   const tokens = await getToken();  
   try {
      const {body} = await got.get(
          "https://m.np.playstation.com/api/trophy/v1/users/"+accountId+"/trophyTitles?limit="+l+"&offset="+o,
          {
              headers: {
                Authorization: `Bearer ${tokens['access_token']}`,
                  "Accept-Language": "de-DE",
              },
              responseType: "json",
          }
      );
      return body;
  } catch (err) {
      console.log(err.response.body);
  }
};

const trophySummary = async () => {
  const tokens = await getToken();
 try {
     const {body} = await got.get(
         "https://m.np.playstation.com/api/trophy/v1/users/"+accountId+"/trophySummary",
         {
             headers: {
               Authorization: `Bearer ${tokens['access_token']}`,
                 "Accept-Language": "de-DE",
             },
             responseType: "json",
         }
     );
     return body;
 } catch (err) {
     console.log(err.response.body);
 }
};

const getPlaytime = async (l,o) => {
  const tokens = await getToken();
 try {
     const {body} = await got.get(
         "https://m.np.playstation.com/api/gamelist/v2/users/"+accountId+"/titles?categories=ps4_game,ps5_native_game&limit="+l+"&offset="+o,
         {
             headers: {
               Authorization: `Bearer ${tokens['access_token']}`,
                 "Accept-Language": "de-DE",
             },
             responseType: "json",
         }
     );
     return body;
 } catch (err) {
     console.log(err.response.body);
 }
};

const getnpCommunicationId = async (titleId) => {
  const tokens = await getToken();
 try {
     const {body} = await got.get(
         "https://m.np.playstation.com/api/trophy/v1/users/"+accountId+"/titles/trophyTitles?npTitleIds="+titleId,
         {
             headers: {
               Authorization: `Bearer ${tokens['access_token']}`,
                 "Accept-Language": "de-DE",
             },             
             responseType: "json",
         }         
     )
     return body;
 } catch (err) {
     console.log(err.response.body);
 }
};

const getMissingTrophies = async (npCommunicationId, npServiceName) => {
  const tokens = await getToken();
  if(dbTrophyInfos.has(npCommunicationId)) {
    var trophies = JSON.parse(dbTrophyInfos.get(npCommunicationId));
  } else {
    try {
      const {body} = await got.get(
          "https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/"+npCommunicationId+"/trophyGroups/all/trophies?npServiceName="+npServiceName,
          {
              headers: {
                Authorization: `Bearer ${tokens['access_token']}`,
                  "Accept-Language": "de-DE",
              },
              responseType: "json",
          }
      );
      var trophies = body;
      dbTrophyInfos.set(npCommunicationId, JSON.stringify(trophies));
      } catch (err) {
          console.log(err.response.body);
      }
  }  
  try {
        const {body} = await got.get(
            "https://m.np.playstation.com/api/trophy/v1/users/"+accountId+"/npCommunicationIds/"+npCommunicationId+"/trophyGroups/all/trophies?npServiceName="+npServiceName,
            {
                headers: {
                  Authorization: `Bearer ${tokens['access_token']}`,
                    "Accept-Language": "de-DE",
                },
                responseType: "json",
            }
        );
        var earned = body;
      } catch (err) {
        console.log(err.response.body);
      }
var t = [];
for (let x = 0; x < trophies["trophies"].length; x++) {
  var id=trophies["trophies"][x]['trophyId'];
  if (!earned["trophies"][id]['earned']) {
        t.push([id, trophies["trophies"][x]['trophyName'], trophies["trophies"][x]['trophyDetail'], trophies["trophies"][x]['trophyType'], trophies["trophies"][x]['trophyIconUrl']])
  }
}
return t
};




  







