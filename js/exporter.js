/**
 * exporter.js
 * Modulo per l'esportazione dei dati spettrali in formato CSV ed Excel.
 * Allinea campioni multipli su una griglia di lunghezze d'onda comune.
 */

/**
 * Allinea le lunghezze d'onda dei campioni forniti in una griglia comune ordinata.
 * Raggruppa per precisione al 4° decimale (0.1 pm) per tollerare micro-variazioni.
 */
function alignSpectralData(activeSpectra) {
    if (activeSpectra.length === 0) return { headers: [], rows: [] };

    const wlMap = new Map(); // chiave: wl.toFixed(4) -> valore: { originalWl, values: { [spectrumId]: reflectance } }

    activeSpectra.forEach(spectrum => {
        spectrum.data.forEach(point => {
            const wlFixed = point.x.toFixed(4);
            if (!wlMap.has(wlFixed)) {
                wlMap.set(wlFixed, {
                    originalWl: point.x,
                    values: {}
                });
            }
            wlMap.get(wlFixed).values[spectrum.id] = point.y;
        });
    });

    // Ordina le lunghezze d'onda in ordine crescente
    const sortedWlKeys = Array.from(wlMap.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));

    const headers = ["Wavelength (nm)", ...activeSpectra.map(s => `${s.displayName} (%)`)];
    
    const rows = sortedWlKeys.map(wlKey => {
        const entry = wlMap.get(wlKey);
        const row = [entry.originalWl];
        
        activeSpectra.forEach(spectrum => {
            const val = entry.values[spectrum.id];
            // Se il valore esiste lo inserisce, altrimenti mette stringa vuota (nullo)
            row.push(val !== undefined ? val : "");
        });
        
        return row;
    });

    return { headers, rows };
}

/**
 * Esporta i campioni attivi in un file CSV combinato
 */
function exportToCSV(activeSpectra) {
    if (activeSpectra.length === 0) return;

    const { headers, rows } = alignSpectralData(activeSpectra);
    
    // Costruisce il contenuto CSV
    let csvContent = headers.join(",") + "\r\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\r\n";
    });

    // Crea il blob e avvia il download nel browser
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Imposta nome del file basato sulla data corrente
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `spettri_confronto_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Esporta i campioni attivi in un file Excel (.xlsx) con fogli separati per dati e metadati
 */
function exportToExcel(activeSpectra) {
    if (activeSpectra.length === 0) return;

    if (typeof XLSX === 'undefined') {
        alert("La libreria di esportazione Excel (SheetJS) non è ancora caricata. Riprova tra qualche istante.");
        return;
    }

    const wb = XLSX.utils.book_new();

    // 1. Foglio Dati Spettrali
    const { headers, rows } = alignSpectralData(activeSpectra);
    const spectralSheetData = [headers, ...rows];
    const wsSpectral = XLSX.utils.aoa_to_sheet(spectralSheetData);
    XLSX.utils.book_append_sheet(wb, wsSpectral, "Dati Spettrali");

    // 2. Foglio Metadati dello Strumento
    // Trova l'unione di tutte le chiavi dei metadati presenti nei campioni
    const metadataKeysSet = new Set();
    activeSpectra.forEach(s => {
        Object.keys(s.metadata).forEach(k => metadataKeysSet.add(k));
    });
    const metadataKeys = Array.from(metadataKeysSet);

    // Costruisce la tabella dei metadati
    const metaHeaders = ["Parametro Metadato", ...activeSpectra.map(s => s.displayName)];
    const metaRows = [
        ["Nome File Originale", ...activeSpectra.map(s => s.fileName)]
    ];

    metadataKeys.forEach(key => {
        const row = [key];
        activeSpectra.forEach(s => {
            row.push(s.metadata[key] || "N/D");
        });
        metaRows.push(row);
    });

    const wsMetadata = XLSX.utils.aoa_to_sheet([metaHeaders, ...metaRows]);
    XLSX.utils.book_append_sheet(wb, wsMetadata, "Metadati Strumento");

    // Genera il file Excel e avvia il download
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `spettri_confronto_${dateStr}.xlsx`);
}
