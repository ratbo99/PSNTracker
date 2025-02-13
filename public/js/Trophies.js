var socket = io(window.location.origin);

socket.on('updateTrophies', function (data) {
 loadTrophies()
});

function showTrophies(check) {
  var isChecked = document.getElementById("checkbox1").checked
  socket.emit('showTrophies', { showTrophies: isChecked});
  loadTrophies()
}

async function loadTrophies() {
  try {
      // Datei von localhost/trophies abrufen
      const response = await fetch(`${window.location.origin}/trophies`);
      if (!response.ok) {
          throw new Error(`HTTP-Fehler! Status: ${response.status}`);
      }
      
      // Antwort als Text auslesen
      const htmlText = await response.text();
      
      // Ein temporäres DOM-Element erstellen, um das HTML zu parsen
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      // Den gewünschten Inhalt extrahieren
      const containerContent = doc.querySelector('.container');
      
      if (containerContent) {
          // Das Ziel-Element auf der aktuellen Seite suchen
          const targetContainer = document.querySelector('.container');
          
          if (targetContainer) {
              // Inhalt ersetzen
              targetContainer.innerHTML = containerContent.innerHTML;
          } else {
              console.error('Kein .container-Element auf der aktuellen Seite gefunden.');
          }
      } else {
          console.error('Kein .container-Element in der abgerufenen Datei gefunden.');
      }
  } catch (error) {
      console.error('Fehler beim Laden der Trophäen:', error);
  }
}