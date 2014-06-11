/*-----------------------------------------------------------
 * Il controller si occupa di gestire le interazioni tra i
 * vari grafici.
 * Riceve gli eventi dalla pagina principale e aggiorna i
 * grafici in base al tipo di evento ricevuto. 
 * 
 ----------------------------------------------------------*/

function Controller(){
	// L'oggetto da esportare
	var controller = {};
	
	/* Inizio variabili private */
	
	// I grafici sui quali devo lavorare
	var mapChart,
		forceChart,
		lineChart,
		distributionChart;
		
	// Le variabili che rappresentano i dati selezionati dall'utente
	var selectedDate,
		selectedCountry,
		selectedTrack;
		
	// L'oggetto DOM che contiene l'immagine della bandiera del paese selezionato	
	var countryFlag  = $("#countryFlag");
	// L'oggetto DOM che contiene il nome del paese selezionato
	var countryName  = $("#countryName");
	// L'oggetto DOM che contiene il numero di ascolti per il paese selezionato
	var countryPlays = $("#countryPlays");
	
	// L'oggetto DOM che contiene l'immagine di copertina del selezionato
	var trackCover   = $("trackCover");
	// L'oggetto DOM che contiene il nome dell'artista del brano selezionato
	var trackArtist  = $("trackArtist");
	// L'oggetto DOM che contiene il titolo del brano selezionato
	var trackTitle   = $("trackTitle");
	// L'oggetto DOM che contiene il numero di ascolti del brano selezionato
	var trackPlays   = $("trackPlays");	
	
	/* Fine variaibli private */
	
	/* Inizio metodi privati */
	
	// Restituisce l'URL della bandiera del paese selezionato
	function getCountryFlag(country){
		
	}
	
	// Restituisce il nome completo del paese a partire dal codice ISO
	function getCountryName(country){
		
	}
	
	/* Fine metodi privati */
	
	/* Inizio metodi pubblici */
	
	// Registra il grafico map in modo da poterci lavorare
	controller.registerMapChart = function(mapChart){
		controller.mapChart = mapChart;
	};
	// Registra il grafico force in modo da poterci lavorare
	controller.registerForceChart = function(forceChart){
		controller.forceChart = forceChart;
	};
	// Registra il grafico line in modo da poterci lavorare
	controller.registerLineChart = function(lineChart){
		controller.lineChart = lineChart;
	};
	// Registra il grafico distribution in modo da poterci lavorare
	controller.registerDistributionChart = function(distributionChart){
		controller.distributionChart = distributionChart;
	};
	
	/* FIne metodi pubblici */
	
	/* Inizio gestione eventi */
	
	// E' stata selezionata una nuova traccia, quindi devo aggiornare i grafici
	controller.trackChanged = function(newTrack){
		controller.selectedTrack = newTrack;
		// Aggiorno il grafico map
		mapChart.setSelectedTrack(newTrack); //TODO: da implementare
		mapChart.changeStatus(2);
		// Aggiorno il grafico force
		forceChart.setSelectedTrack(newTrack); //TODO: da implementare		
		// Aggiorno il grafico line
		lineChart.setSelectedTrack(newTrack); //TODO: da implementare
		lineChart.changeStatus(2);
		// Aggiorno l'header
		trackTitle.animate().html(newTrack.track_title);
	};
	
	// E' stato selezionato unun nuovo paese
	controller.countryChanged = function(newTrack){
		controller.selectedTrack = newTrack;
		// Aggiorno il grafico map
		mapChart.setSelectedTrack(newTrack); //TODO: da implementare
		mapChart.changeStatus(2);
		// Aggiorno il grafico force
		forceChart.setSelectedTrack(newTrack); //TODO: da implementare		
		// Aggiorno il grafico line
		lineChart.setSelectedTrack(newTrack); //TODO: da implementare
		lineChart.changeStatus(2);
		// Aggiorno l'header
	};
	
	/* Fine gestione eventi */
	
	return controller;
}
