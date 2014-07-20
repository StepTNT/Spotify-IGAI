/*-----------------------------------------------------------
 * Il controller si occupa di gestire le interazioni tra i
 * vari grafici.
 * Riceve gli eventi dalla pagina principale e aggiorna i
 * grafici in base al tipo di evento ricevuto.
 *
 ----------------------------------------------------------*/

function Controller() {
	// L'oggetto da esportare
	var controller = {};

	/* Inizio variabili private */

	// I grafici sui quali devo lavorare
	var mapChart, forceChart, lineChart, distributionChart;

	// Le variabili che rappresentano i dati selezionati dall'utente
	var selectedDate, selectedCountry, selectedTrack;

	var isPageReady = false;

	/* Fine variaibli private */

	/* Inizio metodi privati */

	// Restituisce l'URL della bandiera del paese selezionato
	function getCountryFlag(country) {

	}

	// Restituisce il nome completo del paese a partire dal codice ISO
	function getCountryName(country) {

	}

	/* Fine metodi privati */

	/* Inizio metodi pubblici */

	// Registra il grafico map in modo da poterci lavorare
	controller.registerMapChart = function(map) {
		mapChart = map;
	};
	// Registra il grafico force in modo da poterci lavorare
	controller.registerForceChart = function(force) {
		forceChart = force;
	};
	// Registra il grafico line in modo da poterci lavorare
	controller.registerLineChart = function(line) {
		lineChart = line;
	};
	// Registra il grafico distribution in modo da poterci lavorare
	controller.registerDistributionChart = function(distribution) {
		distributionChart = distribution;
	};

	/* FIne metodi pubblici */

	/* Inizio gestione eventi */

	// E' stata selezionata una nuova traccia, quindi devo aggiornare i grafici
	controller.trackChanged = function(newTrack, color) {
		notice = new jBox('Notice', {
			content : 'Selezionata nuova traccia: ' + newTrack.artist_name + " - " + newTrack.track_name,
			autoClose : 1000,
			color : color
		});
		notice.toggle();
		selectedTrack = newTrack;
		// Aggiorno il grafico map
		mapChart.setSelectedTrack(newTrack);
		mapChart.changeStatus(2);
		// Aggiorno il grafico line
		$(".nvtooltip").fadeOut();
		lineChart.setSelectedTrack(newTrack);
		lineChart.changeStatus(1);
		// Aggiorno l'header
		$("#track").fadeOut(function() {
			$("#trackTitle").html(newTrack.track_name);
			$("#trackArtist").html(newTrack.artist_name);
			$("#trackPlays").html(newTrack.num_streams);
			$("#trackCover").attr("src", newTrack.artwork_url);
			$("#track").fadeIn();
		});
		$("#country").fadeOut();
	};

	// E' stato selezionato unun nuovo paese
	controller.countryChanged = function(newCountry, color) {
		notice = new jBox('Notice', {
			content : 'Selezionato nuovo paese: ' + (($.isEmptyObject(newCountry)) ? "Global" : newCountry.properties.name),
			autoClose : 1000,
			color : color
		});
		notice.toggle();
		console.log($.isEmptyObject(selectedTrack));
		//controller.selectedTrack = newTrack;
		selectedCountry = newCountry;
		// Aggiorno il grafico line per rimuovere l'eventuale traccia selezionata in precedenza
		lineChart.setSelectedTrack({});		
		// Aggiorno il grafico line
		lineChart.setSelectedCountry(newCountry);
		distributionChart.setSelectedCountry(newCountry);
		// Aggiorno l'header
		if (!$.isEmptyObject(newCountry)) {
			lineChart.changeStatus(2);
			distributionChart.changeStatus(2);
			mapChart.changeStatus(1);
			$("#countryFlag").attr("class", "flag-icon flag-icon-" + newCountry.id);
			$("#countryName").html(newCountry.properties.name);			
		} else {
			lineChart.changeStatus(1);
			distributionChart.changeStatus(1);
			mapChart.changeStatus(1);
			$("#countryFlag").attr("class", "flag-icon flag-icon-global");
			$("#countryName").html("Global");
		}
		$("#track").fadeOut();
		$("#country").fadeIn();
	};

	// E' stata selezionata una nuova data
	controller.dateChanged = function(newDate, color) {
		notice = new jBox('Notice', {
			content : 'Selezionata nuova data: ' + newDate,
			autoClose : 1000,
			color : color
		});
		notice.toggle();
		selectedDate = newDate;
		mapChart.setSelectedDate(selectedDate);
		distributionChart.setSelectedDate(selectedDate);
		distributionChart.changeStatus(0);
		$("#countryDate").html(newDate);
	};

	// Aggiorna la tabaella target con i nuovi dati contenuti in data
	controller.updateTable = function(target, data) {
		var finalData = jQuery.extend(true, {}, data); // Ne faccio una copia altrimenti rischio di modificare i dati da visualizzare nel grafico
		var keys = Object.keys(data[0]);
		var result = "<thead>";
		for (var i = 0; i < keys.length; i++) {
			result += "<th>" + keys[i] + "</th>";
		} // Genero i nomi delle colonne a partire dal contenuto del JSON
		result += "</thead>";		
		$("#tabella" + target).empty(); // Svuoto il div dal codice html precedente e poi aggiungo quello aggiornato
		$("#tabella" + target).append("<table id=\"contenutoTabella" + target + "\" class=\"table table-bordered\"></table>");
		$("#contenutoTabella" + target).html(result);		
		if(target != 1){
			for(var i = 0; i<data.length; i++){
				// Il plugin non si comporta bene con i JSON che contengono array, quindi li dobbiamo convertire in stringhe per avere una visualizzazione accettabile
				finalData[i].values = JSON.stringify(data[i].values);
			}
		}
		$("#contenutoTabella" + target).dynatable({
			dataset : {
				records : finalData
			}
		});
	};

	// Function wrapping code.
	// fn - reference to function.
	// context - what you want "this" to be.
	// params - array of parameters to pass to function.
	controller.wrapFunction = function(fn, context, params) {
		return function() {
			fn.apply(context, params);
		};
	};

	// Coda con le funzioni da eseguire
	var funcQueue = [];

	// Esegue la funzione passata come parametro se la pagina è pronta, altrimenti la mette in coda
	controller.executeFunction = function(fn) {
		if (!isPageReady) {// La pagina non è pronta, funzione messa in coda
			funcQueue.push(fn);
		} else {
			fn();
		}
	};

	// Se ho ricevuto il messaggio che indica il completamento della pagina, allora devo eseguire anche le funzioni che erano in coda
	controller.notifyPageReady = function() {
		isPageReady = true;
		while (funcQueue.length > 0) {
			(funcQueue.shift())();
		}
	};
	/* Fine gestione eventi */

	/* Notice */
	// Usiamo questo oggetto per mostrare le notifiche ogni volta che succede qualcosa
	var notice = $('.tooltip').jBox('Notice');

	return controller;
}
