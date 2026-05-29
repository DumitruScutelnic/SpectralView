/**
 * parser.js
 * Parsing dei file spettrali OceanOptics (.Reflection) e Zeiss (.CSV).
 */

/**
 * Parser per file CSV Zeiss.
 * Formato: valori separati da ';', nessuna riga intestazione.
 * Colonna 0 = lunghezza d'onda (nm), colonne 1..N = misure ripetute → media.
 */
function parseZeissCSV(fileText, fileName) {
    const lines = fileText.split(/\r?\n/);
    const dataPoints = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(';');
        if (parts.length < 2) continue;

        const wavelength = parseFloat(parts[0].trim());
        if (isNaN(wavelength)) continue; // salta eventuali righe di intestazione

        let sum = 0;
        let count = 0;
        for (let j = 1; j < parts.length; j++) {
            const val = parseFloat(parts[j].trim());
            if (!isNaN(val) && isFinite(val)) {
                sum += val;
                count++;
            }
        }
        if (count === 0) continue;

        dataPoints.push({ x: wavelength, y: sum / count });
    }

    if (dataPoints.length === 0) {
        throw new Error("Il file non contiene dati spettrali validi o non è stato possibile leggerli.");
    }

    const id = 'spec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const displayName = fileName.replace(/\.[^/.]+$/, "");

    return { id, fileName, displayName, metadata: {}, data: dataPoints };
}

function parseReflectionFile(fileText, fileName) {
    const lines = fileText.split(/\r?\n/);
    const metadata = {};
    const dataPoints = [];
    let isSpectralDataSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Salta righe vuote prima della sezione dati
        if (!line && !isSpectralDataSection) continue;

        // Rileva l'inizio dei dati spettrali
        if (line.includes(">>>>>Begin Spectral Data<<<<<")) {
            isSpectralDataSection = true;
            continue;
        }

        if (!isSpectralDataSection) {
            // Parsing dell'intestazione (metadati)
            const colonIdx = line.indexOf(':');
            if (colonIdx !== -1) {
                const key = line.substring(0, colonIdx).trim();
                const value = line.substring(colonIdx + 1).trim();

                // Normalizza o formatta chiavi note se necessario
                metadata[key] = value;
            } else if (line) {
                // Inserisce righe informative generiche senza ":" se presenti
                metadata[`Info_${i}`] = line;
            }
        } else {
            if (!line) continue;

            // Supporta sia tab (formato OceanOptics nativo) che virgola
            const parts = line.includes('\t') ? line.split('\t') : line.split(',');
            if (parts.length >= 2) {
                const wlStr = parts[0].trim();
                const refStr = parts[1].trim();

                // Salta righe di intestazione testuali (es. "Wavelength\tIntensity")
                if (isNaN(parseFloat(wlStr))) continue;

                // Gestione dei valori mancanti o vuoti
                if (wlStr === '' || refStr === '') continue;

                // Gestione specifica per valori infiniti -inf, inf
                if (refStr.toLowerCase() === '-inf' || refStr.toLowerCase() === 'inf' || refStr.toLowerCase() === '+inf') {
                    continue; // Filtra ed esclude i punti infiniti per non rovinare la scala del grafico
                }

                const wavelength = parseFloat(wlStr);
                const reflectance = parseFloat(refStr);

                // Assicurati che i valori numerici siano validi e finiti
                if (!isNaN(wavelength) && isFinite(wavelength) && !isNaN(reflectance) && isFinite(reflectance)) {
                    dataPoints.push({
                        x: wavelength,
                        y: reflectance
                    });
                }
            }
        }
    }

    if (dataPoints.length === 0) {
        throw new Error("Il file non contiene dati spettrali validi o non è stato possibile leggerli.");
    }

    // Genera un ID unico per il campione caricato
    const id = 'spec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Nome del campione predefinito basato sul nome del file (senza estensione)
    const displayName = fileName.replace(/\.[^/.]+$/, "");

    return {
        id,
        fileName,
        displayName,
        metadata,
        data: dataPoints
    };
}
