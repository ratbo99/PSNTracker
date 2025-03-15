const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function colorize(text, color) {
  return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

//Funktion zum Normalisieren der Spielzeit
function getPlaytimeFormat(timestr) {
  if(timestr) 
  {
    if (timestr === 'PT0S') return '00:00:00';
  
    const getMatch = (regex) => {
      const match = timestr.match(regex);
      return match ? match[1] : 0;
    };
  
    const padZero = (num) => (num < 10 ? '0' + num : num);
  
    const hours = padZero(getMatch(/T(\d+)H/));
    const minutes = padZero(getMatch(/(?:H|T)(\d+)M/));
    const seconds = padZero(getMatch(/(?:M|H|T)(\d+)S/));
  
    return `${hours}:${minutes}:${seconds}`;
  } else {
    return null;
  }
}

//Funktion zum Normalisieren des Datums
function getDateFormat(dateString) {

   // manuelles umwandeln, da pkg nur en localisiert ist.
   try{
    const date = new Date(dateString);

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Monate sind 0-basiert
    const yyyy = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${dd}.${mm}.${yyyy} ${hh}:${min}:${ss}`;
   } catch (error) {
      console.error(error);
   }
}

const path = require('path');
const fs = require('fs');

const configDir = './data/db';
//const configPath = `${configDir}/config.json`;

const baseCacheDir = './data/db/cache';

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const configExists = (file) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({}, null, 2));
  }
};

// Speichert ein Objekt in der JSON-Datei
const saveFile = (file, data) => fs.writeFileSync(`${configDir}/${file}`, JSON.stringify(data, null, 2));

// Lädt das Objekt aus der JSON-Datei
const loadFile = (file) => {
  configExists(`${configDir}/${file}`);
  return JSON.parse(fs.readFileSync(`${configDir}/${file}`, 'utf8'));
};

function writeData(filename, data) {
  const dir = path.dirname(filename);

  // Stellt sicher, dass das Verzeichnis existiert
  fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) throw err;

      // Schreibt die Datei
      fs.writeFile(filename, data.toString(), (err) => {
          if (err) throw err;
      });
  });
}

const addASecond = (time) => {
  let [hours, minutes, seconds] = time.split(':').map(Number);
  
  seconds++; // Eine Sekunde hinzufügen
  if (seconds >= 60) {
    seconds = 0;
    minutes++;
  }
  if (minutes >= 60) {
    minutes = 0;
    hours++;
  }

  // Formatierung sicherstellen, immer zweistellig
  return [hours, minutes, seconds]
    .map(unit => String(unit).padStart(2, '0'))
    .join(':');
};


var http = require('http');
var https = require('https');
var Stream = require('stream').Transform;

// Funktion zum Erstellen von Unterordnern (library, trophies etc.)
function ensureCacheFolder(subfolder) {
  const folderPath = path.join(baseCacheDir, subfolder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
}

// Bild herunterladen und im spezifischen Ordner speichern
async function cacheImage(url, subfolder, file) {
  const cacheDir = ensureCacheFolder(subfolder);
  const filePath = path.join(cacheDir, file+'.png');

  if (fs.existsSync(filePath)) {
    //console.log('Serving from cache:', filePath);
    return '/' + filePath.replace(/\\/g, '/');
  }

  try {
    var client = http;
    if (url.toString().indexOf('https') === 0){
      client = https;
     }
  
    client.request(url, function(response) {                                        
      var data = new Stream();                                                    
  
      response.on('data', function(chunk) {                                       
         data.push(chunk);                                                         
      });                                                                         
  
      response.on('end', function() {                                           
         fs.writeFileSync(filePath, data.read());                               
      });                                                                         
   }).end();
    //console.log('Fetched and cached:', filePath);
    // return './' + filePath.replace(/\\/g, '/');
    return url;
  } catch (error) {
    console.error('Error fetching image:', error);
    return url; // Fallback zur Original-URL
  }
}

module.exports = { getPlaytimeFormat, getDateFormat, writeData, saveFile, loadFile, colorize, addASecond, cacheImage };