/**
 * chart-manager.js
 * Wrapper modulo per la gestione del grafico scientifico Chart.js.
 * Supporta zoom/pan interattivi, cambi di stile delle linee e cambi tema dinamici.
 */

let chartInstance = null;
let gridVisible = true;
let legendVisible = true;

// Definizioni dei colori del tema per il grafico
const themeColors = {
    dark: {
        grid: 'rgba(255, 255, 255, 0.07)',
        ticks: '#94a3b8', // slate-400
        title: '#f8fafc', // slate-50
        tooltipBg: '#0f172a', // slate-900
        tooltipBorder: 'rgba(255, 255, 255, 0.1)',
        tooltipText: '#f8fafc'
    },
    light: {
        grid: 'rgba(15, 23, 42, 0.07)',
        ticks: '#475569', // slate-600
        title: '#0f172a', // slate-900
        tooltipBg: '#ffffff',
        tooltipBorder: 'rgba(15, 23, 42, 0.1)',
        tooltipText: '#0f172a'
    }
};

/**
 * Inizializza il grafico Chart.js nel canvas specificato
 */
function initChart(canvasElement, isDarkMode) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const currentColors = isDarkMode ? themeColors.dark : themeColors.light;

    const config = {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300 // transizione fluida ma scattante
            },
            parsing: false, // Disabilita parsing automatico per massimizzare le performance con 2000+ punti
            normalized: true, // I dati sono pre-ordinati per asse X (lunghezza d'onda cresce sempre)
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true, // Attiva per impostazione predefinita, posizionata con stile premium
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: currentColors.title,
                        font: {
                            family: 'IBM Plex Sans, sans-serif',
                            size: 11,
                            weight: '500'
                        },
                        boxWidth: 30,  // Lunghezza della linea per evidenziare i tratteggi
                        boxHeight: 2,   // Altezza ridotta a 2px per disegnare una linea orizzontale reale
                        usePointStyle: false // Disattiva i cerchietti per tracciare le linee reali dei campioni
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: currentColors.tooltipBg,
                    titleColor: currentColors.title,
                    bodyColor: currentColors.tooltipText,
                    borderColor: currentColors.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        title: function(context) {
                            return `Lunghezza d'onda: ${parseFloat(context[0].parsed.x).toFixed(2)} nm`;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += `${parseFloat(context.parsed.y).toFixed(3)} %`;
                            }
                            return label;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        threshold: 10
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            mode: 'x' // Zoom orizzontale comodo con rotellina
                        },
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(113, 113, 122, 0.15)', // Zinc-500 traslucido
                            borderColor: 'rgba(113, 113, 122, 0.4)',
                            borderWidth: 1,
                            mode: 'xy' // Permette zoom rettangolare in entrambe le direzioni trascinando
                        },
                        pinch: {
                            enabled: true,
                            mode: 'xy'
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 200,
                    max: 1100,
                    title: {
                        display: true,
                        text: 'Lunghezza d\'onda (nm)',
                        color: currentColors.title,
                        font: {
                            family: 'IBM Plex Sans, sans-serif',
                            size: 14,
                            weight: '600'
                        }
                    },
                    ticks: {
                        color: currentColors.ticks,
                        font: {
                            family: 'IBM Plex Sans, sans-serif'
                        }
                    },
                    grid: {
                        color: gridVisible ? currentColors.grid : 'transparent',
                        drawBorder: false
                    }
                },
                y: {
                    type: 'linear',
                    min: 0,
                    max: 110,
                    title: {
                        display: true,
                        text: 'Riflettanza (%)',
                        color: currentColors.title,
                        font: {
                            family: 'IBM Plex Sans, sans-serif',
                            size: 14,
                            weight: '600'
                        }
                    },
                    ticks: {
                        color: currentColors.ticks,
                        font: {
                            family: 'IBM Plex Sans, sans-serif'
                        }
                    },
                    grid: {
                        color: gridVisible ? currentColors.grid : 'transparent',
                        drawBorder: false
                    }
                }
            }
        }
    };

    chartInstance = new Chart(canvasElement, config);
    return chartInstance;
}

/**
 * Aggiorna lo stile del tema (grid e scritte dell'asse) al passaggio light/dark
 */
function updateChartTheme(isDarkMode) {
    if (!chartInstance) return;

    const currentColors = isDarkMode ? themeColors.dark : themeColors.light;

    // Aggiorna scale e scritte
    chartInstance.options.scales.x.title.color = currentColors.title;
    chartInstance.options.scales.x.ticks.color = currentColors.ticks;
    chartInstance.options.scales.x.grid.color = gridVisible ? currentColors.grid : 'transparent';

    chartInstance.options.scales.y.title.color = currentColors.title;
    chartInstance.options.scales.y.ticks.color = currentColors.ticks;
    chartInstance.options.scales.y.grid.color = gridVisible ? currentColors.grid : 'transparent';

    // Aggiorna tooltip
    chartInstance.options.plugins.tooltip.backgroundColor = currentColors.tooltipBg;
    chartInstance.options.plugins.tooltip.titleColor = currentColors.title;
    chartInstance.options.plugins.tooltip.bodyColor = currentColors.tooltipText;
    chartInstance.options.plugins.tooltip.borderColor = currentColors.tooltipBorder;

    // Aggiorna colore scritte legenda
    if (chartInstance.options.plugins.legend && chartInstance.options.plugins.legend.labels) {
        chartInstance.options.plugins.legend.labels.color = currentColors.title;
    }

    chartInstance.update('none'); // Aggiorna senza animazioni fastidiose per il tema
}

/**
 * Aggiorna i dati e lo stile delle linee del grafico in base alla lista dei campioni attivi
 */
function updateChartData(spectraList) {
    if (!chartInstance) return;

    // Filtra e mappa i campioni attivi per generare i dataset di Chart.js
    chartInstance.data.datasets = spectraList.map(spectrum => {
        // Converte lo stile della linea in array tratteggiato
        let borderDash = [];
        if (spectrum.lineStyle === 'dashed') {
            borderDash = [6, 6];
        } else if (spectrum.lineStyle === 'dotted') {
            borderDash = [2, 4];
        }

        return {
            label: spectrum.displayName,
            data: spectrum.data,
            borderColor: spectrum.color,
            borderWidth: parseFloat(spectrum.lineWidth) || 2,
            borderDash: borderDash,
            pointRadius: 0, // Nessun cerchietto per ottimizzare e pulire il grafico
            pointHoverRadius: 4, // Mostra pallino solo al passaggio del mouse
            tension: 0, // Mantiene l'andamento scientifico lineare raw
            hidden: !spectrum.visible,
            spanGaps: true // Permette di saltare punti null/mancanti senza spezzare la linea
        };
    });

    chartInstance.update();
}

/**
 * Resetta lo zoom al livello massimo che contiene tutti i dati
 */
function resetChartZoom() {
    if (chartInstance) {
        chartInstance.resetZoom();
    }
}

/**
 * Attiva o disattiva la griglia sul grafico
 */
function toggleGrid(show) {
    gridVisible = show;
    if (!chartInstance) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const currentColors = isDark ? themeColors.dark : themeColors.light;

    chartInstance.options.scales.x.grid.color = gridVisible ? currentColors.grid : 'transparent';
    chartInstance.options.scales.y.grid.color = gridVisible ? currentColors.grid : 'transparent';
    chartInstance.update();
}

/**
 * Esporta il grafico corrente come URL immagine PNG
 */
function exportChartAsImage() {
    if (!chartInstance) return null;
    
    const wasLegendVisible = legendVisible;
    
    // Forza temporaneamente l'attivazione della legenda se era nascosta
    if (!wasLegendVisible) {
        chartInstance.options.plugins.legend.display = true;
        chartInstance.update('none');
    }
    
    const imageURL = chartInstance.toBase64Image();
    
    // Ripristina lo stato reale preferito dall'utente per l'interazione sul sito
    if (!wasLegendVisible) {
        chartInstance.options.plugins.legend.display = false;
        chartInstance.update('none');
    }
    
    return imageURL;
}

/**
 * Imposta i limiti manuali degli assi X e Y nel grafico
 */
function setAxisLimits(xMin, xMax, yMin, yMax) {
    if (!chartInstance) return;

    // Gestione Asse X (Lunghezza d'onda)
    if (xMin !== null && !isNaN(xMin)) {
        chartInstance.options.scales.x.min = xMin;
    } else {
        delete chartInstance.options.scales.x.min;
    }
    
    if (xMax !== null && !isNaN(xMax)) {
        chartInstance.options.scales.x.max = xMax;
    } else {
        delete chartInstance.options.scales.x.max;
    }

    // Gestione Asse Y (Riflettanza)
    if (yMin !== null && !isNaN(yMin)) {
        chartInstance.options.scales.y.min = yMin;
    } else {
        delete chartInstance.options.scales.y.min;
    }
    
    if (yMax !== null && !isNaN(yMax)) {
        chartInstance.options.scales.y.max = yMax;
    } else {
        delete chartInstance.options.scales.y.max;
    }

    chartInstance.update();
}

/**
 * Attiva o disattiva la visualizzazione della legenda sul grafico
 */
function toggleLegend(show) {
    legendVisible = show;
    if (!chartInstance) return;

    chartInstance.options.plugins.legend.display = show;
    chartInstance.update();
}
