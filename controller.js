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
	var trackCover   = $("#trackCover");
	// L'oggetto DOM che contiene il nome dell'artista del brano selezionato
	var trackArtist  = $("#trackArtist");
	// L'oggetto DOM che contiene il titolo del brano selezionato
	var trackTitle   = $("#trackTitle");
	// L'oggetto DOM che contiene il numero di ascolti del brano selezionato
	var trackPlays   = $("#trackPlays");	
	
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
	controller.registerMapChart = function(map){
		mapChart = map;
	};
	// Registra il grafico force in modo da poterci lavorare
	controller.registerForceChart = function(force){
		forceChart = force;
	};
	// Registra il grafico line in modo da poterci lavorare
	controller.registerLineChart = function(line){
		lineChart = line;
	};
	// Registra il grafico distribution in modo da poterci lavorare
	controller.registerDistributionChart = function(distribution){
		distributionChart = distribution;
	};
	
	/* FIne metodi pubblici */
	
	/* Inizio gestione eventi */
	
	// E' stata selezionata una nuova traccia, quindi devo aggiornare i grafici
	controller.trackChanged = function(newTrack){
		electedTrack = newTrack;
		// Aggiorno il grafico map
		mapChart.setSelectedTrack(newTrack);
		mapChart.changeStatus(2);
		// Aggiorno il grafico force
		forceChart.setSelectedTrack(newTrack); //TODO: da implementare		
		// Aggiorno il grafico line
		lineChart.setSelectedTrack(newTrack); //TODO: da implementare
		lineChart.changeStatus(2);
		// Aggiorno l'header
		$("#trackTitle").animate().html("Titolo: " + newTrack.track_name);
		$("#trackArtist").animate().html("Artista: " + newTrack.artist_name);
		$("#trackPlays").animate().html("Ascolti: " + newTrack.num_streams);
		$("#trackCover").animate().attr("src", newTrack.artwork_url);
	};
	
	// E' stato selezionato unun nuovo paese
	controller.countryChanged = function(newCountry){
		//controller.selectedTrack = newTrack;
		selectedCountry = newCountry;
		// Aggiorno il grafico map
		/*mapChart.setSelectedTrack(newTrack); //TODO: da implementare
		mapChart.changeStatus(2);
		// Aggiorno il grafico force
		forceChart.setSelectedTrack(newTrack); //TODO: da implementare*/		
		// Aggiorno il grafico line
		lineChart.setSelectedCountry(newCountry);	
		distributionChart.setSelectedCountry(newCountry);		
		// Aggiorno l'header
		if(!$.isEmptyObject(newCountry)){
			lineChart.changeStatus(2);
			distributionChart.changeStatus(2);	
			$("#countryFlag").attr("class", "flag-icon flag-icon-" + newCountry.id);
			$("#countryName").html("Paese : " + newCountry.properties.name);
		} else {
			lineChart.changeStatus(1);
			distributionChart.changeStatus(1);
			mapChart.changeStatus(1);	
		}		
	};
	
	// E' stata selezionata una nuova data
	controller.dateChanged = function(newDate){
		var d = newDate;
	    var curr_date = d.getDate();
	    var curr_month = d.getMonth() + 1; //Months are zero based
	    var curr_year = d.getFullYear();							    
		selectedDate = curr_year + "-" + curr_month + "-" + curr_date;
		/*mapChart.setSelectedDate(selectedDate);
		mapChart.changeStatus(1);
		distributionChart.setSelectedDate(selectedDate);
		distributionChart.changeStatus(2); */		
	};
	
	/* Fine gestione eventi */
	
	return controller;
}
