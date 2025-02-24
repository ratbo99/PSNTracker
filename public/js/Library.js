let isHidden = false; // Status-Tracker
function showRandom() {
    const spans = document.querySelectorAll('span');
    
    if (!isHidden) {
      // Alle ausblenden
      spans.forEach(span => {
        span.style.display = 'none';
      });
  
      // Zufälliges Element auswählen und einblenden
      const randomIndex = Math.floor(Math.random() * spans.length);
      spans[randomIndex].style.display = 'block';
      isHidden = true;
    } else {
      // Alle wieder einblenden
      spans.forEach(span => {
        span.style.display = 'block';
      });
      isHidden = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Funktion zum Filtern der <span>-Elemente und Zähler aktualisieren
    function filterSpans(searchString) {
        const spans = document.querySelectorAll('span');
        let visibleCount = 0;

        spans.forEach(span => {
            const textContent = span.textContent || span.innerText;
            const isVisible = textContent.toLowerCase().includes(searchString.toLowerCase());
            span.style.display = isVisible ? '' : 'none';
            
            if (isVisible) {
                visibleCount++; // Zähler für sichtbare Elemente
            }
        });

        // Anzahl der sichtbaren <span>-Elemente in das <div> mit der Klasse "count" schreiben
        document.querySelector('.count').textContent = `${visibleCount} Einträge`;
    }

    // Event-Listener fürs Eingabefeld
    document.getElementById('filterInput').addEventListener('input', (e) => {
        filterSpans(e.target.value);
    });
});