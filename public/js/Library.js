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