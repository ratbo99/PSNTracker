const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function colorize(text, color) {
  return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

//Funktion zum Normalisieren der Spielzeit
function getPlaytimeFormat(timestr) {
  if(timestr) 
  {
    if (timestr === "PT0S") return "00:00:00";
  
    const getMatch = (regex) => {
      const match = timestr.match(regex);
      return match ? match[1] : 0;
    };
  
    const padZero = (num) => (num < 10 ? "0" + num : num);
  
    const hours = padZero(getMatch(/T(\d+)H/));
    const minutes = padZero(getMatch(/(?:H|T)(\d+)M/));
    const seconds = padZero(getMatch(/(?:M|H|T)(\d+)S/));
  
    return `${hours}:${minutes}:${seconds}`;
  } else {
    return null
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
   } catch {

   }
   
    /*try {
      return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Europe/Berlin",
      }).format(date).replace(",", "");
    } catch(err) {
      console.log(err)
    }*/
}

const path = require('path');
const fs = require('fs')

const configDir = './data/db';
const configPath = `${configDir}/config.json`;

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const configExists = () => {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
  }
};

// Speichert ein Objekt in der JSON-Datei
const saveConfig = (data) => fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

// Lädt das Objekt aus der JSON-Datei
const loadConfig = () => {
  configExists();
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
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



module.exports = { getPlaytimeFormat, getDateFormat, writeData, saveConfig, loadConfig, colorize };