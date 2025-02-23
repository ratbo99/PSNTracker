process.removeAllListeners('warning'); // Entfernt alle Warnungs-Listener - fetch is a experimental feature

// Module die wir benutzen
const express = require('express');
const app = express();
const http = require('http').Server(app);

app.engine('pug', require('pug').__express)

const path = require('path');
const fs = require('fs')

//import helper functions
const { getPlaytimeFormat, getDateFormat, writeData, saveConfig, loadConfig, colorize } = require('./utils');

const config = loadConfig();

//starte den webserver
var port = 3000;
if(config.hasOwnProperty("port")) port = config.port
const server = http.listen(port, () => {});

//socket.io konfiguration für ältere client js
const io = require('socket.io')(http, {
  cors: {
      origin: `http://localhost`,
      methods: ["GET", "POST"],
      transports: ['websocket', 'polling'],
      credentials: true
  },
  allowEIO3: true
});

//socket server events
io.on('connection', function (socket) {
  socket.on('showTrophies', function(data){
    config.showTrophies = data.showTrophies
    saveConfig(config)
  });
});

//Ein paar Variablen die wir brauchen
const AUTH_URI = "https://ca.account.sony.com/api/authz/v3/oauth";
const CLIENT_ID = "09515159-7237-4370-9b40-3806e67c0891";
const REDIRECT_URI = "com.scee.psxandroid.scecompcall://redirect";
const SCOPE = "psn:mobile.v2.core psn:clientapp";
const BASEURL = "https://m.np.playstation.com/api"

var playedGame = {}
var lastPlayedGame = {}
var trophySummary = {}
var trophies = {}
var trophyList = {}

//create and save tokens to minimize api calls for logins
const getToken = async () => {
  if(config.hasOwnProperty("tokens")) {
    let tokens = config.tokens;
    var now= Math.round(+new Date()/1000);
    if((tokens.expires_in)-now >= 0) {
      return tokens;			
    } else {			
      if((tokens.refresh_token_expires_in)-now >= 0) {
        //warnung 3 tage bevor 
        if((tokens.refresh_token_expires_in)-now >= 0 && (tokens.refresh_token_expires_in)-now <= 259200) { console.log("Refresh token läuft bald ab. Neuen NPSSO Cookie eintragen."); }
        try {
          const response = await fetch(`${AUTH_URI}/token`, {
            method: "POST",
            headers: {
              'Host': "ca.account.sony.com",
              'Referer': "https://my.playstation.com/",
              'Authorization': "Basic MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=",
              'Content-Type': "application/x-www-form-urlencoded",
            },
            body: `grant_type=refresh_token&scope=${SCOPE}&refresh_token=${tokens.refresh_token}&token_format=jwt`,
          });
          
          const res = await response.json();
          var now= Math.round(+new Date()/1000);
          res.expires_in=now + res.expires_in;
          res.refresh_token_expires_in=tokens.refresh_token_expires_in;
          config.tokens=res
          saveConfig(config)
          return res;
        } catch (err) {
          console.error(err.response.body);
        }			
      } else {
        console.error("Refresh Token abgelaufen. Neuen NPSSO Cookie eintragen.");
        delete config.tokens
        saveConfig(config)
        getToken(); //app beenden?
      }
    }
    return tokens
  } else {
    const redirectResponse = await fetch(`${AUTH_URI}/authorize?access_type=offline&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`, {
      method: "GET",
      headers: {
        Cookie: `npsso=${config.psnNPSSO}`, //ändern zu neuer config
      },
      redirect: "manual"
    });

    const code = redirectResponse.headers.get("location").match(/code=([A-Za-z0-9:\?_\-\.\/=]+)/)[1];

    const tokenResponse = await fetch(`${AUTH_URI}/token`, {
      method: "POST",
      headers: {
        'Host': "ca.account.sony.com",
        'Referer': "https://my.playstation.com/",
        'Authorization': "Basic MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=",
        'Content-Type': "application/x-www-form-urlencoded",
      },
      body: `code=${code}&grant_type=authorization_code&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&token_format=jwt`,
    });
    const tokens = await tokenResponse.json();

    var now = Math.round(+new Date()/1000);
    tokens.expires_in=now+tokens.expires_in;
    tokens.refresh_token_expires_in = now+tokens.refresh_token_expires_in;
    config.tokens = tokens
    saveConfig(config)
    return tokens
  }
};

const getAccountId = async (psnID) => {
  const tokens = await getToken();
  //url für eigenen account: https://dms.api.playstation.com/api/v1/devices/accounts/me
  return fetch(`https://us-prof.np.community.playstation.net/userProfile/v1/users/${psnID}/profile2?fields=npId,onlineId,accountId,avatarUrls,plus,aboutMe,languagesUsed,trophySummary(@default,level,progress,earnedTrophies),isOfficiallyVerified,personalDetail(@default,profilePictureUrls),personalDetailSharing,personalDetailSharingRequestMessageFlag,primaryOnlineStatus,presences(@default,@titleInfo,platform,lastOnlineDate,hasBroadcastData),requestMessageFlag,blocking,friendRelation,following,consoleAvailability`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.access_token}`,
    },
    responseType: "json"
  })
    .then((res) => res.json() )
    .then((data) => {
      config.psnLanguage = data.profile.languagesUsed[0].replace("de","de-DE")
      config.accountID = data.profile.accountId
      saveConfig(config);
      return data.profile.accountId;
    })
    .catch((err) => {
      console.error("Unable to fetch -", err);
    })
}

const updateGame = async (game, changes) => { 

        if (changes.length >= 1 || changes.includes("titleID")) {

          const totalEarnedTrophies = Object.values(game.earnedTrophies).reduce((sum, value) => sum + value, 0);
          const totalDefinedTrophies = Object.values(game.definedTrophies).reduce((sum, value) => sum + value, 0);
          writeData(`data/titel.txt`,`${game.titleName} ${config.seperator} ${totalEarnedTrophies} / ${totalDefinedTrophies} ${config.seperator} ${game.progress}%`);
          changes.forEach(change => {
                // es kommt ein array an - ["earned.gold","earned.platinum"...]
                let parts = change.split(".")
                if(parts[0]==="earnedTrophies") {
                  let str = `${game.earnedTrophies[parts[1]]}/${game.definedTrophies[parts[1]]}`                  
                  writeData(`data/${parts[1]}.txt`,str);
                  if(parts[1]==="platinum") writeData(`data/platingesamt.txt`,trophySummary.earnedTrophies.platinum);
                }
          });

          trophySummary = await fetchPSNData(`${BASEURL}/trophy/v1/users/${config.accountID}/trophySummary`);

          readline.cursorTo(process.stdout, 0, 11);
          process.stdout.clearLine(0);
          process.stdout.write(`🎉 Level: ${trophySummary.trophyLevel} (${trophySummary.progress}%) | 💎 ${trophySummary.earnedTrophies.platinum} 🥇 ${trophySummary.earnedTrophies.gold} 🥈 ${trophySummary.earnedTrophies.silver} 🥉 ${trophySummary.earnedTrophies.bronze}`);
          readline.cursorTo(process.stdout, 0, 13);
          process.stdout.clearLine(0);
          process.stdout.write(`🏆 ${game.titleName} (Fortschritt: ${game.progress}% | Spielzeit: ${game.playDuration} | Wie oft: ${game.playCount})\n`);
          readline.cursorTo(process.stdout, 0, 14);
          process.stdout.clearLine(0);
          process.stdout.write(`💎 ${game.earnedTrophies.platinum}/${game.definedTrophies.platinum} 🥇 ${game.earnedTrophies.gold}/${game.definedTrophies.gold} 🥈 ${game.earnedTrophies.silver}/${game.definedTrophies.silver} 🥉 ${game.earnedTrophies.bronze}/${game.definedTrophies.bronze}\n`);

          io.sockets.emit("updateOverlay",game);
          getTrophies(playedGame);

        }
};

async function checkForChanges() {
    
    var presence = await fetchPSNData(`${BASEURL}/userProfile/v1/internal/users/${config.accountID}/basicPresences?type=primary`);
    try {
      if(presence.basicPresence.gameTitleInfoList[0].npTitleId && presence.basicPresence.gameTitleInfoList[0].npTitleId != lastPlayedGame.titleID) {
        trophyList = {}
        playedGame.titleID = presence.basicPresence.gameTitleInfoList[0].npTitleId;
        playedGame.titleName = presence.basicPresence.gameTitleInfoList[0].titleName;
      }
  
      var data = [];
      data.push(await fetchPSNData(`${BASEURL}/trophy/v1/users/${config.accountID}/titles/trophyTitles?npTitleIds=${playedGame.titleID}`));
      data.push(await fetchPSNData(`${BASEURL}/gamelist/v2/users/${config.accountID}/titles?categories=ps4_game,ps5_native_game&limit=1&offset=0`));

      playedGame.playDuration = getPlaytimeFormat(data[1].titles[0].playDuration)
      playedGame.playCount = data[1].titles[0].playCount;
      try {playedGame.progress = data[0].titles[0].trophyTitles[0].progress } catch { playedGame.progress = 0 }
      try {playedGame.earnedTrophies = data[0].titles[0].trophyTitles[0].earnedTrophies} catch { playedGame.earnedTrophies = {bronze: 0, silver: 0, gold: 0, platinum: 0} }
      try {playedGame.definedTrophies = data[0].titles[0].trophyTitles[0].definedTrophies } catch { playedGame.definedTrophies = {bronze: 0, silver: 0, gold: 0, platinum: 0} }
      try {playedGame.npServiceName =  data[0].titles[0].trophyTitles[0].npServiceName } catch { playedGame.npServiceName="trophy2" }
      try {playedGame.npCommunicationId =  data[0].titles[0].trophyTitles[0].npCommunicationId } catch {playedGame.npCommunicationId=lastPlayedGame.npCommunicationId }
      updateGame(playedGame,getChangedKeys(lastPlayedGame,playedGame));
      lastPlayedGame = structuredClone(playedGame) 

    } catch(err) {
      readline.cursorTo(process.stdout, 0, 13);
      process.stdout.clearLine(0);
      process.stdout.write(colorize(`kein Spiel gestartet`,"red"));
      readline.cursorTo(process.stdout, 0, 14);
      process.stdout.clearLine(0);

      playedGame.earnedTrophies = {bronze: 0, silver: 0, gold: 0, platinum: 0} 
      playedGame.definedTrophies = {bronze: 0, silver: 0, gold: 0, platinum: 0}
      playedGame.npServiceName = "trophy2"
      io.sockets.emit("updateOverlay",playedGame);
      io.sockets.emit("updateTrophies",1);
      writeData(`data/platinum.txt`,"0 / 0");
      writeData(`data/gold.txt`,"0 / 0");
      writeData(`data/bronze.txt`,"0 / 0");
      writeData(`data/silver.txt`,"0 / 0");
      writeData(`data/titel.txt`,"kein Spiel gestartet");
      playedGame = {}
      trophyList = {}
    }
}

async function getTrophies(game) {

  if(Object.keys(trophyList).length === 0) {
    var trophySet = [];
    trophySet.push(await fetchPSNData(`${BASEURL}/trophy/v1/npCommunicationIds/${game.npCommunicationId}/trophyGroups/all/trophies?npServiceName=${game.npServiceName}`));
    trophySet.push(await fetchPSNData(`${BASEURL}/trophy/v1/npCommunicationIds/${game.npCommunicationId}/trophyGroups`));

    if(trophySet[1].hasOwnProperty('error')) {
      trophyList = trophySet[0].trophies
    } else {
      const trophyGroupMap = Object.fromEntries(
        trophySet[1].trophyGroups.map(group => [group.trophyGroupId, group.trophyGroupName])
      );
      const mergedTrophyList = trophySet[0].trophies.map(trophy => ({
        ...trophy,
        trophyGroupName: trophyGroupMap[trophy.trophyGroupId] || null
      }));
      trophyList = structuredClone(mergedTrophyList)
    }
  }

  fetchPSNData(`${BASEURL}/trophy/v1/users/${config.accountID}/npCommunicationIds/${game.npCommunicationId}/trophyGroups/all/trophies?npServiceName=${game.npServiceName}`).then((trophySet) => {
    const mergedTrophies = trophyList.map(definedTrophy => {
      const earnedTrophy = trophySet.trophies.find(t => t.trophyId === definedTrophy.trophyId);      
      return {
        ...definedTrophy,
        progress: earnedTrophy?.progress || false,
        progressRate: earnedTrophy?.progressRate || false,
        earned: earnedTrophy?.earned || false,
        earnedDateTime: earnedTrophy?.earnedDateTime && getDateFormat(earnedTrophy.earnedDateTime) || null,
        trophyRare: earnedTrophy?.trophyRare || null,
        trophyEarnedRate: earnedTrophy?.trophyEarnedRate || null
      };
    });
    trophies = structuredClone(mergedTrophies)
    io.sockets.emit("updateTrophies",1);
  });
}

const fetchPSNData = async (url) => {
  const tokens = await getToken(); 
  return fetch(url, {
    method: "GET", // Specify request method
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.access_token}`,
      "Accept-Language": "de-DE",
    },
    responseType: "json"
  })
    .then((res) => res.json() )
    .then((data) => {
      return data            
    })
    .catch((err) => {
      console.log("Unable to fetch -", err);
    })     
};

function getChangedKeys(obj1, obj2) {
  function flattenObject(obj, prefix = '') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        Object.assign(acc, flattenObject(value, fullPath));
      } else {
        acc[fullPath] = value;
      }
      return acc;
    }, {});
  }

  const flatObj1 = flattenObject(obj1);
  const flatObj2 = flattenObject(obj2);
  const changedKeys = [];

  const allKeys = new Set([...Object.keys(flatObj1), ...Object.keys(flatObj2)]);

  allKeys.forEach(key => {
    if (!(key in flatObj1)) {
      changedKeys.push(key);
    } else if (!(key in flatObj2)) {
      changedKeys.push(key);
    } else if (flatObj1[key] !== flatObj2[key]) {
      changedKeys.push(key);
    }
  });

  return changedKeys;
}

const readline = require('readline');

// Erstellen eines Readline-Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Funktion, um eine Frage zu stellen
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const init = async () => {
  try {
    console.log("Bitte psnID, NPSSO Cookie eingeben!")
    psnID = await askQuestion('psnID: ');
    psnNPSSO = await askQuestion('npsso: ');

    config.psnID = psnID
    config.psnNPSSO = psnNPSSO
    config.seperator = "*"
    config.showTrophies = true
    config.port = port

    saveConfig(config);

  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    rl.close(); // Beendet das Readline-Interface
    return config.psnID
  }
};

function splashscreen() {
  console.clear();
  console.info(colorize(`+--+-+-+RatBo\'s+-+-+--+\r\n| P S N T r a c k e r |\r\n+--+-+-+-+-+-+-+-+-+--+\n`,"blue"));
  console.info(`Server läuft auf Port: ${config.port} - ändern in config.json\n`);  
  console.group("Öffne:");
  console.log(colorize(`Trophäenoverlay > http://localhost:${config.port}`,"green"));
  console.log(colorize(`Trophäenliste > http://localhost:${config.port}/trophies\n`,"green"));
  console.groupEnd();

  fetchPSNData(`${BASEURL}/trophy/v1/users/${config.accountID}/trophySummary`).then((data) => {
    trophySummary = data;
    writeData(`data/platingesamt.txt`,trophySummary.earnedTrophies.platinum);

    readline.cursorTo(process.stdout, 0, 11);
    process.stdout.clearLine(0);
    process.stdout.write(`🎉 Level: ${trophySummary.trophyLevel} (${trophySummary.progress}%) | 💎 ${trophySummary.earnedTrophies.platinum} 🥇 ${trophySummary.earnedTrophies.gold} 🥈 ${trophySummary.earnedTrophies.silver} 🥉 ${trophySummary.earnedTrophies.bronze}`);
    
  });

  // Starte Intervall
  setInterval(checkForChanges, "10000");
}

if(config.hasOwnProperty('accountID')) {
  splashscreen()
} else {
  init().then((psnID) => {
    getAccountId(psnID).then((data) => {
      console.log("PSN AccountID", data );
    }).then((data) => {
      splashscreen()
    })   
  });
}

//Express Stuff
//Template Engine Pug
app.set('view engine', 'pug');
//Sichtbar für Browser
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, '.','views'));
// -> weiteren Ordner für Browser > anders als oben um in compilierter form zugriff zu haben
app.use('/data', express.static(path.join(process.cwd(), '/data')));

// Pfad zur Log-Datei
const logFile = path.join(process.cwd(), 'data/db/error.log');

// Funktion zum Schreiben in die Log-Datei
function logErrorToFile(error) {
    const errorMessage = `[${new Date().toISOString()}] ${error.stack || error}\n`;
    fs.appendFileSync(logFile, errorMessage);
}

// Uncaught Exceptions abfangen - error Logging nach PSN Ausfall am 8.2.2025 hinzugefügt
process.on('uncaughtException', (error) => {
    logErrorToFile(error);
    readline.cursorTo(process.stdout, 0, 16);
    process.stdout.clearLine(0);
    process.stdout.write(colorize(`Uncaught Exception! Siehe error.log`,"red"))
   
    //process.exit(1); // Beendet das Programm mit Fehlercode
});

//trophy overlay - zeigt erspielte Trophäen
app.get('/', function (req, res) {
  if(playedGame.hasOwnProperty('titleID')) {
    res.render('overlay', {title: 'Overlay', game: playedGame, count: 1});
  } else {
    res.render('overlay', {title: 'Overlay', game: playedGame, count: 0});
  }
 });

 //zeigt trophäenliste zum gepeilten Spiel
 app.get('/trophies', function (req, res) {
  if(playedGame.hasOwnProperty('titleID')) {
    try {res.render('trophies', {title: 'Trophies', game: playedGame, trophies: trophies, count: trophies.length, unearnedCount: trophies.filter(trophy => !trophy.earned).length, showTrophies: config.showTrophies}); } catch (err) { console.log(err) }
  } else {
    res.render('trophies', {title: 'Trophies', game: playedGame, trophies: trophies, count: 0, unearnedCount: 0});
  }
 });