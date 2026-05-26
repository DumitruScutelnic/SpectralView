/**
 * app.js
 * Coordinatore principale dell'applicazione SpectralView.
 * Gestisce lo stato globale dei campioni, l'interfaccia utente (UI),
 * gli eventi di Drag & Drop e le interazioni con i moduli Parser, Chart ed Exporter.
 */

// Le funzioni esterne (parseReflectionFile, initChart, updateChartData, ecc.) sono caricate globalmente via index.html per supportare il caricamento locale offline.

// --- STATO DELL'APPLICAZIONE ---
const state = {
    activeSpectra: [],
    isDarkMode: true
};

// Palette di colori vibranti neon per i grafici (esclusi toni blu dominanti come iniziali)
const defaultColors = [
    '#10b981', // Neon Emerald Green
    '#a855f7', // Neon Purple/Violet
    '#14b8a6', // Teal
    '#f59e0b', // Neon Amber/Orange
    '#ec4899', // Neon Pink/Rose
    '#eab308', // Neon Yellow
    '#06b6d4', // Cyan
    '#6366f1', // Indigo
    '#f43f5e'  // Neon Crimson
];
let colorIndex = 0;

// --- ELEMENTI DEL DOM ---
const DOM = {
    themeToggle: document.getElementById('theme-toggle'),
    sunIcon: document.querySelector('.sun-icon'),
    moonIcon: document.querySelector('.moon-icon'),
    
    toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
    sidebarToggleIcon: document.getElementById('sidebar-toggle-icon'),
    
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('file-input'),
    
    samplesCount: document.getElementById('samples-count'),
    samplesList: document.getElementById('samples-list'),
    noSamplesView: document.getElementById('no-samples-view'),
    
    gridToggle: document.getElementById('grid-toggle'),
    legendToggle: document.getElementById('legend-toggle'),
    resetZoomBtn: document.getElementById('reset-zoom-btn'),
    captureChartBtn: document.getElementById('capture-chart-btn'),
    
    exportCsvBtn: document.getElementById('export-csv-btn'),
    exportXlsxBtn: document.getElementById('export-xlsx-btn'),
    
    metadataModal: document.getElementById('metadata-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    metadataModalGrid: document.getElementById('metadata-modal-grid'),
    modalTitleText: document.getElementById('modal-title-text'),
    
    // Campi per i limiti degli assi
    xMinInput: document.getElementById('x-min-input'),
    xMaxInput: document.getElementById('x-max-input'),
    yMinInput: document.getElementById('y-min-input'),
    yMaxInput: document.getElementById('y-max-input'),
    applyLimitsBtn: document.getElementById('apply-limits-btn'),
    clearLimitsBtn: document.getElementById('clear-limits-btn')
};

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carica preferenza tema salvata (con try-catch per robustezza su file://)
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            state.isDarkMode = savedTheme === 'dark';
        } else {
            state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    } catch (e) {
        console.warn("Impossibile accedere a localStorage. Uso preferenza di sistema.", e);
        state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme(state.isDarkMode);

    // 2. Inizializza il Grafico Chart.js nel canvas
    const canvas = document.getElementById('spectral-chart');
    initChart(canvas, state.isDarkMode);

    // 3. Associa tutti gli eventi della UI
    bindEvents();
    
    // Aggiorna inizialmente l'abilitazione dei bottoni
    updateExportButtonsState();
});

// --- APPLICAZIONE TEMA (LIGHT/DARK) ---
function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        DOM.sunIcon.style.display = 'block';
        DOM.moonIcon.style.display = 'none';
        DOM.themeToggle.setAttribute('aria-label', 'Attiva modalità chiara');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        DOM.sunIcon.style.display = 'none';
        DOM.moonIcon.style.display = 'block';
        DOM.themeToggle.setAttribute('aria-label', 'Attiva modalità scura');
    }
    
    // Rinfresca il tema delle griglie del grafico
    updateChartTheme(isDark);
}

// --- ASSOCIAZIONE DEGLI EVENTI ---
function bindEvents() {
    // Bottone cambio tema
    DOM.themeToggle.addEventListener('click', () => {
        state.isDarkMode = !state.isDarkMode;
        try {
            localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
        } catch (e) {
            console.warn("Impossibile salvare la preferenza del tema in localStorage.", e);
        }
        applyTheme(state.isDarkMode);
    });

    // Bottone Mostra/Nascondi Barra Laterale
    DOM.toggleSidebarBtn.addEventListener('click', () => {
        const appContainer = document.querySelector('.app-container');
        const isCollapsed = appContainer.classList.toggle('sidebar-collapsed');
        
        if (isCollapsed) {
            DOM.sidebarToggleIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />`;
            DOM.toggleSidebarBtn.setAttribute('title', 'Mostra barra laterale');
            DOM.toggleSidebarBtn.setAttribute('aria-label', 'Mostra barra laterale');
        } else {
            DOM.sidebarToggleIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />`;
            DOM.toggleSidebarBtn.setAttribute('title', 'Nascondi barra laterale');
            DOM.toggleSidebarBtn.setAttribute('aria-label', 'Nascondi barra laterale');
        }
        
        // Forza ridimensionamento del grafico dopo la fine della transizione CSS (0.35s)
        setTimeout(() => {
            if (window.chartInstance) {
                window.chartInstance.resize();
            }
        }, 360);
    });

    // Clic sulla dropzone per aprire il browser file
    DOM.dropzone.addEventListener('click', () => {
        DOM.fileInput.click();
    });

    // Selezione file da browser
    DOM.fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        DOM.fileInput.value = ''; // Resetta l'input per permettere lo stesso file due volte
    });

    // Eventi Drag & Drop sulla Dropzone
    ['dragenter', 'dragover'].forEach(eventName => {
        DOM.dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            DOM.dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        DOM.dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            DOM.dropzone.classList.remove('dragover');
        }, false);
    });

    DOM.dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);

    // Controlli del grafico
    DOM.gridToggle.addEventListener('change', (e) => {
        toggleGrid(e.target.checked);
    });

    DOM.legendToggle.addEventListener('change', (e) => {
        toggleLegend(e.target.checked);
    });

    DOM.resetZoomBtn.addEventListener('click', () => {
        resetChartZoom();
    });

    DOM.captureChartBtn.addEventListener('click', () => {
        const imageURL = exportChartAsImage();
        if (imageURL) {
            const link = document.createElement('a');
            link.download = `spettro_grafico_${new Date().toISOString().slice(0,10)}.png`;
            link.href = imageURL;
            link.click();
        }
    });

    // Pulsanti di Esportazione
    DOM.exportCsvBtn.addEventListener('click', () => {
        const visibleSpectra = state.activeSpectra.filter(s => s.visible);
        exportToCSV(visibleSpectra);
    });

    DOM.exportXlsxBtn.addEventListener('click', () => {
        const visibleSpectra = state.activeSpectra.filter(s => s.visible);
        exportToExcel(visibleSpectra);
    });

    // Modal chiusura
    DOM.modalCloseBtn.addEventListener('click', closeModal);
    DOM.metadataModal.addEventListener('click', (e) => {
        if (e.target === DOM.metadataModal) {
            closeModal();
        }
    });
    
    // Gestione ESC per chiudere il modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.metadataModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Controllo dei limiti degli assi X e Y
    DOM.applyLimitsBtn.addEventListener('click', () => {
        const xMin = DOM.xMinInput.value.trim() !== '' ? parseFloat(DOM.xMinInput.value) : null;
        const xMax = DOM.xMaxInput.value.trim() !== '' ? parseFloat(DOM.xMaxInput.value) : null;
        const yMin = DOM.yMinInput.value.trim() !== '' ? parseFloat(DOM.yMinInput.value) : null;
        const yMax = DOM.yMaxInput.value.trim() !== '' ? parseFloat(DOM.yMaxInput.value) : null;
        
        setAxisLimits(xMin, xMax, yMin, yMax);
    });

    DOM.clearLimitsBtn.addEventListener('click', () => {
        DOM.xMinInput.value = '';
        DOM.xMaxInput.value = '';
        DOM.yMinInput.value = '';
        DOM.yMaxInput.value = '';
        
        setAxisLimits(null, null, null, null);
    });
}

// --- ELABORAZIONE DEI FILE CARICATI ---
function handleFiles(files) {
    const filesArray = Array.from(files);
    const reflectionFiles = filesArray.filter(file => {
        const extension = file.name.split('.').pop().toLowerCase();
        return extension === 'reflection';
    });

    if (reflectionFiles.length === 0 && filesArray.length > 0) {
        alert("Nessun file valido rilevato. Trascina solo file con estensione '.Reflection'.");
        return;
    }

    let parsedCount = 0;
    
    reflectionFiles.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const text = event.target.result;
                const spectrum = parseReflectionFile(text, file.name);
                
                // Assegna caratteristiche grafiche predefinite al nuovo campione
                spectrum.color = defaultColors[colorIndex % defaultColors.length];
                spectrum.lineStyle = 'solid';
                spectrum.lineWidth = 2;
                spectrum.visible = true;
                
                colorIndex++;
                
                // Salva nello stato globale
                state.activeSpectra.push(spectrum);
                parsedCount++;
                
                // Se tutti i file letti sono stati elaborati, aggiorna la UI
                if (parsedCount === reflectionFiles.length) {
                    onSpectraListChanged();
                }
            } catch (err) {
                console.error(err);
                alert(`Errore nel caricamento del file "${file.name}":\n${err.message}`);
            }
        };
        
        reader.onerror = function() {
            alert(`Errore di lettura del file ${file.name}`);
        };
        
        reader.readAsText(file);
    });
}

// --- REATTIVITÀ DELLO STATO ---
function onSpectraListChanged() {
    renderSamplesSidebar();
    updateChartData(state.activeSpectra);
    updateExportButtonsState();
    DOM.samplesCount.textContent = state.activeSpectra.length;
}

// --- ABILITAZIONE CONTROLLI ESPORTAZIONE ---
function updateExportButtonsState() {
    const hasVisibleSpectra = state.activeSpectra.some(s => s.visible);
    
    if (hasVisibleSpectra) {
        DOM.exportCsvBtn.removeAttribute('disabled');
        DOM.exportXlsxBtn.removeAttribute('disabled');
    } else {
        DOM.exportCsvBtn.setAttribute('disabled', 'true');
        DOM.exportXlsxBtn.setAttribute('disabled', 'true');
    }
}

// --- RENDERING BARRA LATERALE CAMPIONI ---
function renderSamplesSidebar() {
    // Pulisce le schede correnti lasciando solo la vista vuota se non ci sono elementi
    const cards = DOM.samplesList.querySelectorAll('.sample-card');
    cards.forEach(card => card.remove());

    if (state.activeSpectra.length === 0) {
        DOM.noSamplesView.style.display = 'flex';
        return;
    } else {
        DOM.noSamplesView.style.display = 'none';
    }

    state.activeSpectra.forEach(spectrum => {
        const card = document.createElement('div');
        card.className = 'sample-card';
        card.setAttribute('data-id', spectrum.id);

        // Icona Visibilità
        const eyeIconSvg = spectrum.visible 
            ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" class="hidden-mode" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`;

        card.innerHTML = `
            <div class="sample-card-header">
                <!-- Selettore del colore interattivo -->
                <div class="color-badge-wrapper" style="background-color: ${spectrum.color}" title="Cambia colore della linea">
                    <input type="color" class="color-input-hidden" value="${spectrum.color}">
                </div>
                
                <!-- Input Nome Campione modificabile al volo -->
                <input type="text" class="sample-name-input" value="${spectrum.displayName}" title="Clicca per rinominare il campione">
                
                <div class="sample-actions">
                    <!-- Visibilità -->
                    <button class="action-btn visible-btn ${!spectrum.visible ? 'hidden-mode' : ''}" title="${spectrum.visible ? 'Nascondi dal grafico' : 'Mostra nel grafico'}">
                        ${eyeIconSvg}
                    </button>
                    <!-- Info Metadati -->
                    <button class="action-btn info-btn" title="Visualizza metadati dello strumento">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <!-- Elimina -->
                    <button class="action-btn delete-btn" title="Rimuovi questo spettro">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="sample-style-row">
                <!-- Dropdown stile linea -->
                <div class="style-select-group">
                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 500;">Stile:</span>
                    <select class="style-select line-style-dropdown">
                        <option value="solid" ${spectrum.lineStyle === 'solid' ? 'selected' : ''}>Continua</option>
                        <option value="dashed" ${spectrum.lineStyle === 'dashed' ? 'selected' : ''}>Tratti</option>
                        <option value="dotted" ${spectrum.lineStyle === 'dotted' ? 'selected' : ''}>Punti</option>
                    </select>
                </div>
                <!-- Dropdown spessore linea -->
                <div class="style-select-group">
                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 500;">Spessore:</span>
                    <select class="style-select line-width-dropdown">
                        <option value="1" ${spectrum.lineWidth === 1 ? 'selected' : ''}>1px</option>
                        <option value="2" ${spectrum.lineWidth === 2 ? 'selected' : ''}>2px</option>
                        <option value="3" ${spectrum.lineWidth === 3 ? 'selected' : ''}>3px</option>
                        <option value="4" ${spectrum.lineWidth === 4 ? 'selected' : ''}>4px</option>
                    </select>
                </div>
            </div>
        `;

        // -- ASSOCIAZIONE EVENTI DELLA SCHEDA DENTRO LA SIDEBAR --

        // Cambio Colore
        const colorInput = card.querySelector('.color-input-hidden');
        const colorBadge = card.querySelector('.color-badge-wrapper');
        colorInput.addEventListener('input', (e) => {
            const newColor = e.target.value;
            spectrum.color = newColor;
            colorBadge.style.backgroundColor = newColor;
            updateChartData(state.activeSpectra);
        });

        // Modifica Nome Campione
        const nameInput = card.querySelector('.sample-name-input');
        nameInput.addEventListener('change', (e) => {
            const newName = e.target.value.trim() || spectrum.fileName.replace(/\.[^/.]+$/, "");
            spectrum.displayName = newName;
            nameInput.value = newName;
            onSpectraListChanged();
        });

        // Mostra/Nascondi Spettro
        const visibleBtn = card.querySelector('.visible-btn');
        visibleBtn.addEventListener('click', () => {
            spectrum.visible = !spectrum.visible;
            onSpectraListChanged();
        });

        // Mostra Dettaglio Metadati (Modal)
        const infoBtn = card.querySelector('.info-btn');
        infoBtn.addEventListener('click', () => {
            openMetadataModal(spectrum);
        });

        // Elimina Spettro
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            state.activeSpectra = state.activeSpectra.filter(s => s.id !== spectrum.id);
            onSpectraListChanged();
        });

        // Cambio Stile della Linea (Trattini, punti, solid)
        const styleDropdown = card.querySelector('.line-style-dropdown');
        styleDropdown.addEventListener('change', (e) => {
            spectrum.lineStyle = e.target.value;
            updateChartData(state.activeSpectra);
        });

        // Cambio Spessore della Linea
        const widthDropdown = card.querySelector('.line-width-dropdown');
        widthDropdown.addEventListener('change', (e) => {
            spectrum.lineWidth = parseInt(e.target.value);
            updateChartData(state.activeSpectra);
        });

        DOM.samplesList.appendChild(card);
    });
}

// --- APERTURA FINESTRA MODALE DETTAGLI METADATI ---
function openMetadataModal(spectrum) {
    DOM.modalTitleText.textContent = `Metadati: ${spectrum.displayName}`;
    DOM.metadataModalGrid.innerHTML = '';

    // Aggiunge file di provenienza all'inizio
    const fileItem = document.createElement('div');
    fileItem.className = 'metadata-item';
    fileItem.innerHTML = `
        <div class="metadata-label">File di Provenienza</div>
        <div class="metadata-value">${spectrum.fileName}</div>
    `;
    DOM.metadataModalGrid.appendChild(fileItem);

    // Renderizza ogni chiave-valore presente nei metadati
    const keys = Object.keys(spectrum.metadata);
    
    if (keys.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.gridColumn = 'span 2';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '12px';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.textContent = "Nessun metadato rilevato nell'header di questo file.";
        DOM.metadataModalGrid.appendChild(emptyMsg);
    } else {
        keys.forEach(key => {
            // Salta chiavi autogenerate senza ":" originale se presenti
            if (key.startsWith('Info_')) return;

            const item = document.createElement('div');
            item.className = 'metadata-item';
            item.innerHTML = `
                <div class="metadata-label">${key}</div>
                <div class="metadata-value">${spectrum.metadata[key]}</div>
            `;
            DOM.metadataModalGrid.appendChild(item);
        });
    }

    DOM.metadataModal.classList.add('active');
    DOM.metadataModal.setAttribute('aria-hidden', 'false');
}

// --- CHIUSURA FINESTRA MODALE DETTAGLI METADATI ---
function closeModal() {
    DOM.metadataModal.classList.remove('active');
    DOM.metadataModal.setAttribute('aria-hidden', 'true');
}
