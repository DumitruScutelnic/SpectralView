# 📊 SpectralView - OceanOptics Spectrometry Visualizer

> [!NOTE]  
> **SpectralView** è una web application client-side moderna, interattiva e ad alte prestazioni progettata per ricercatori, accademici e professionisti. Consente il caricamento, la visualizzazione interattiva, il confronto e l'esportazione avanzata dei dati di spettroscopia originati dai dispositivi **OceanOptics** in formato `.Reflection`.

L'applicazione è sviluppata in modalità **pure frontend** (HTML5, CSS3 vaniglia e JavaScript ES6+), il che la rende completamente autonoma, sicura per la privacy dei dati (tutte le elaborazioni avvengono localmente nel browser) e pronta per essere ospitata a costo zero su piattaforme di hosting statico come **GitHub Pages**.

---

## ✨ Caratteristiche Principali

### 📁 Ingestione Dati e Parsing Robusto
* **Drag & Drop Multi-file**: Carica simultaneamente molteplici file `.Reflection` trascinandoli nella zona di drop o selezionandoli tramite il selettore di file.
* **Filtrazione Intelligente**: Parser robusto che estrae in modo dinamico i metadati strumentali dall'header del file ed esclude automaticamente righe vuote, dati corrotti o valori infiniti (`-inf`, `inf`, `+inf`) per garantire che i grafici non subiscano distorsioni di scala.
* **Estrazione dei Metadati**: Parsing automatico di tutte le coppie chiave-valore presenti nell'intestazione del file (es. tempi di integrazione, medie spettrali, parametri di calibrazione dello spettrometro).

### 📈 Grafici Interattivi Comparativi
* **Rendering ad alta precisione**: Sviluppato su base **Chart.js** per visualizzare curve spettroscopiche fluide con tracciamento al passaggio del mouse.
* **Zoom Avanzato**: Zoom interattivo tramite trascinamento rettangolare del mouse (drag-to-zoom) e zoom tramite pinch/rotella di scorrimento, con supporto al ripristino istantaneo dello stato originale (*Reset Zoom*).
* **Controllo degli Assi**: Pannello dedicato per inserire limiti personalizzati per l'asse X (lunghezza d'onda in nanometri, *nm*) e per l'asse Y (riflettanza in percentuale, *%*), con funzione di ripristino della scala automatica.
* **Configurazione Grafica**: Comandi rapidi per attivare/disattivare la griglia e la legenda sul grafico.
* **Salvataggio PNG**: Esportazione istantanea dello stato corrente del grafico in un'immagine PNG ad alta risoluzione.

### 🎨 Gestione dei Campioni & Personalizzazione
* **Colori & Stili Linea**: Assegnazione automatica di colori unici a ciascun campione con possibilità per l'utente di modificare interattivamente il colore della linea e lo stile di tratteggio (continua, tratteggiata, punteggiata).
* **Ridenominazione Dinamica**: Modifica il nome del campione visualizzato direttamente dall'elenco per facilitare il confronto e l'esportazione pulita.
* **Visibilità Selettiva**: Mostra o nascondi le curve sul grafico con un singolo clic.
* **Ispezione Metadati**: Finestra modale moderna ed elegante che elenca nel dettaglio tutti i parametri estratti dall'intestazione del rispettivo file `.Reflection`.

### 💾 Esportazione Dati Avanzata
* **Allineamento Spettrale Grigliato**: Algoritmo che raccoglie tutti i campioni attivi e li allinea su una griglia di lunghezze d'onda comune ordinata in modo crescente, tollerando micro-variazioni grazie ad un raggruppamento con precisione spettrale fino al 4° decimale ($0.1\text{ pm}$). I valori mancanti vengono gestiti elegantemente come vuoti.
* **Esportazione CSV**: Genera un file CSV combinato con le lunghezze d'onda allineate in prima colonna e le percentuali di riflettanza dei campioni nelle colonne successive.
* **Esportazione Excel (.xlsx)**: Genera una cartella di lavoro Excel multipagina contenente:
  1. Il foglio **Dati Spettrali** con la tabella allineata e strutturata.
  2. Il foglio **Metadati Strumento** che affianca e confronta tutti i parametri strumentali e ambientali di ciascun file.

---

## 🛠️ Tecnologie Utilizzate

L'applicazione si basa esclusivamente su tecnologie web aperte e moderne:

| Tecnologia | Ruolo nell'Applicazione | Note |
| :--- | :--- | :--- |
| **HTML5** | Struttura semantica dell'applicazione | Accessibilità (Aria-labels, ruoli) e SEO integrati. |
| **CSS3 (Custom)** | Design system premium, layout responsivo e animazioni | Supporto nativo alle variabili CSS, responsive design a doppia colonna e modalità Light/Dark automatica e manuale. |
| **JavaScript (ES6+)** | Logica di business, parser ed eventi | Architettura modulare vanilla, priva di framework pesanti. |
| **Chart.js** | Motore di rendering dei grafici | Utilizzato tramite CDN per massimizzare la velocità di caricamento. |
| **Chartjs-Plugin-Zoom** | Funzionalità di pan & zoom | Consente l'analisi spettrale di dettaglio su aree specifiche dello spettro. |
| **SheetJS (xlsx)** | Generazione ed esportazione di file Excel | Consente la creazione di fogli di calcolo `.xlsx` complessi lato client. |

---

## 📂 Struttura del Progetto

```text
aSpectralView/
├── index.html          # Struttura HTML dell'applicazione principale e modali
├── css/
│   └── style.css       # Design system, variabili HSL, temi Light/Dark e layout
├── js/
│   ├── app.js          # Controller centrale dell'applicazione e gestione eventi UI
│   ├── parser.js       # Algoritmo di lettura e sanitizzazione dei file .Reflection
│   ├── chart-manager.js# Integrazione di Chart.js, configurazione zoom e personalizzazioni
│   └── exporter.js     # Allineatore spettrale ed esportatore CSV/Excel (SheetJS)
└── README.md           # Questa documentazione
```

---

## 🚀 Come Eseguire l'Applicazione

### Esecuzione in Locale
L'applicazione è progettata per essere totalmente indipendente e può funzionare anche senza una connessione Internet (utilizzando le copie memorizzate nella cache delle librerie CDN o scaricandole).

1. Clona o scarica questa cartella sul tuo computer.
2. Fai doppio clic sul file `index.html` per aprirlo direttamente nel tuo browser preferito (Chrome, Firefox, Safari, Edge).
3. In alternativa, per un'esperienza di sviluppo ottimale con ricarica automatica, puoi servirlo tramite un server locale leggero (es. estensione *Live Server* in VS Code, o tramite il comando `npx serve .` in terminale).

### Pubblicazione su GitHub Pages
Per ospitare SpectralView pubblicamente:
1. Crea un nuovo repository su GitHub.
2. Esegui il push del codice del progetto sul repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SpectralView"
   git remote add origin https://github.com/tuo-username/tuo-repo.git
   git branch -M main
   git push -u origin main
   ```
3. Vai nelle **Settings** del tuo repository su GitHub, seleziona **Pages** dal menu laterale e imposta la sorgente su `Deploy from a branch`, scegliendo il branch `main` (cartella root `/`).
4. Entro pochi minuti, la tua applicazione sarà online all'indirizzo `https://tuo-username.github.io/tuo-repo/`.

---

## 📄 Struttura dei File `.Reflection` Supportati

L'applicazione supporta i file generati dal software dei sistemi spettrometrici **OceanOptics**. L'header viene estratto dinamicamente riga per riga fino a quando il parser non rileva la riga magica `>>>>>Begin Spectral Data<<<<<`. Di seguito è riportato un esempio del formato atteso:

```text
User: Admin
Date: Tue May 26 11:25:00 CEST 2026
Integration Time (usec): 100000
Spectrometer: HR4000
>>>>>Begin Spectral Data<<<<<
Wavelength (nm),Reflectance (%)
200.1234,12.34
200.5678,14.56
...
1100.9999,95.12
```

---

## 📄 Licenza e Diritti Commerciali

Questo progetto è rilasciato sotto una **Licenza Proprietaria e Non-Commerciale Source-Available** (disponibile nel file [LICENSE](file:///Users/admin/Sites/WebApp/SpectralView/LICENSE)).

* **Diritti Riservati**: Tutti i diritti di sfruttamento commerciale sono riservati in via esclusiva a **Dumitru Scutelnic**.
* **Uso Consentito**: È concesso a chiunque di visualizzare, scaricare, eseguire e modificare il codice sorgente esclusivamente per scopi personali, accademici, didattici o di ricerca scientifica non commerciale.
* **Uso Commerciale**: Qualsiasi utilizzo commerciale, inclusa la vendita, il noleggio, il bundling, l'hosting come servizio (SaaS) o lo sfruttamento economico del software richiedono una licenza commerciale separata e un accordo scritto con il titolare del copyright.

---

## 💡 Contributi e Sviluppi Futuri
I contributi sono sempre i benvenuti! Se desideri proporre miglioramenti o segnalare bug:
1. Apri una **Issue** descrivendo l'anomalia o la proposta di funzionalità.
2. Invia una **Pull Request** dopo aver effettuato il fork del progetto e applicato le tue modifiche in un branch dedicato.

---

*Sviluppato con passione per semplificare l'analisi dei dati spettroscopici.* 🔬✨
