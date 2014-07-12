/* ----------------------------------------------------------------------------------------
* Created by Stefano on 10/06/2014.
*
* Fonte: http://www.tnoda.com/blog/2013-12-07
*
* Descrizione:
* Grafico bidimensionale che mette in relazione due valori diversi relativi allo stesso
* oggetto. In questo caso possiamo confrontare il numero di ascolti con il numero di
* condivisioni, per ogni brano presente nella classifica per una certa data. Ad ogni pallino
* corrisponderà un brano.
*
* Stati:
* 1)  Mostriamo i dati relativi ai brani nella classifica dell'ultima data disponibile.
*     Eventi:
*         - Il passaggio del mouse sul pallino mostra una finestra tooltip con i dati del
*           brano collegato.
*	      - Il click del mouse sul pallino mostra i dati del brano correlato nella finestra
*           di stato e imposta il brano come selezionato.
* 2)  Come nello stato 1, solo che utilizziamo la data selezionata.
* 3)  Come nello stato 1, solo che ci limitiamo al paese selezionato (mantenendo la data)
---------------------------------------------------------------------------------------- */

/**
 * Oggetto di base per il nostro grafico di tipo Map.
 *
 * @constructor
 */
function Distribution() {
	// grafico è l'oggetto che utilizziamo per esportare i metodi pubblici
	var grafico = {};

	/* Inizio variabili private */

	// L'oggetto che rappresenta il grafico di tipo line
	var distributionChart = nv.models.scatterChart().showDistX(true).showDistY(true).useVoronoi(false).color(d3.scale.category20().range()).transitionDuration(300).showLegend(false);

	// Funzione utilizzata per il parse delle date
	var dateParser = d3.time.format("%Y-%m-%d").parse;

	// Lo stato di visualizzazione attuale
	var currentStatus = 1;

	var currentCountry = {};

	var selectedDate = {};

	/* Fine variabili private */

	/* Inizio eventi */

	// Evento lanciato quando viene selezionato un paese
	var countryChangedEvent = {};

	// Evento lanciato quando viene selezionata una traccia
	var trackChangedEvent = {};

	// Evento lanciato quando cambiamo lo stato di visualizzazione del grafico
	var stateChangedEvent = {};

	var dataLoadingEvent = {};

	// Lancia l'evento relativo al cambio dello stato di visualizzazione del grafico
	function fireStateChanged() {
		stateChangedEvent = new CustomEvent('distribution.stateChanged', {
			detail : {
				'state' : currentStatus
			},
			bubbles : true,
			cancelable : true
		});
		document.dispatchEvent(stateChangedEvent);
	}

	// Lancia l'evento relativo al cambio del brano selezionato
	function fireTrackChanged() {
		trackChangedEvent = new CustomEvent('distribution.trackChanged', {
			detail : {
				'track' : selectedTrack
			},
			bubbles : true,
			cancelable : true
		});
		document.dispatchEvent(trackChangedEvent);
		// Lancio l'evento relativo alla selezione del brano
	}

	// Lancia l'evento relativo al cambio del paese selezionato
	function fireCountryChanged() {
		countryChangedEvent = new CustomEvent('distribution.countryChanged', {
			detail : {
				'country' : selectedCountry
			},
			bubbles : true,
			cancelable : true
		});
		document.dispatchEvent(countryChangedEvent);
		// Lancio l'evento relativo al cambio del paese selezionato
	}

	// Lancia l'evento relativo all'inizio del caricamento dei dati
	function fireDataLoadingEvent(started) {
		if (started) {
			dataLoadingEvent = new CustomEvent('distribution.dataLoadingStarted', {
				detail : {
				},
				bubbles : true,
				cancelable : true
			});
		} else {
			dataLoadingEvent = new CustomEvent('distribution.dataLoadingFinished', {
				detail : {
				},
				bubbles : true,
				cancelable : true
			});
		}
		document.dispatchEvent(dataLoadingEvent);
		// Lancio l'evento relativo alla selezione del brano
	}

	/* Fine eventi */

	/* Inizio funzioni private */

	// Imposta il primo stato di visualizzazione
	function setStatus1() {
		var date = ($.isEmptyObject(selectedDate)) ? "max" : selectedDate;
		fireDataLoadingEvent(true);
		d3.json("http://stefano-pc/analisi-immagini/distribution.php?date=" + date, function(error, data) {
			// Mi serve il massimo degli ascolti per impostare il dominio di visualizzazione su y
			var maxStreams = d3.extent(data, function(d,i){
			return d.values[0].y;
			})[1];
			var maxPlays = d3.extent(data, function(d,i){
			return d.values[0].x;
			})[1];

			// Adesso posso impostare il dominio su y
			distributionChart.yDomain([0, maxStreams * (6 / 5)]);
			// Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione
			distributionChart.xDomain([0, maxPlays * (6 / 5)]);
			// Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione

			d3.select('#distributionChart').datum(data).transition().duration(500).call(distributionChart);
			//.style({ 'width': 1200, 'height': 520 });
			// Sposto le label dell'asse x più in basso
			d3.selectAll('.nv-x.nv-axis > g').attr('transform', 'translate(0,10)');
			fireDataLoadingEvent(false);
		});
	};

	// Imposta il secondo stato di visualizzazione
	function setStatus2() {
		// Creo il grafico
		var date = ($.isEmptyObject(selectedDate)) ? "max" : selectedDate;
		fireDataLoadingEvent(true);
		d3.json("http://stefano-pc/analisi-immagini/distribution.php?country=" + selectedCountry.id + "&date=" + date, function(error, data) {
			// Mi serve il massimo degli ascolti per impostare il dominio di visualizzazione su y
			var maxStreams = d3.extent(data, function(d,i){
			return d.values[0].y;
			})[1];
			var maxPlays = d3.extent(data, function(d,i){
			return d.values[0].x;
			})[1];

			// Adesso posso impostare il dominio su y
			distributionChart.yDomain([0, maxStreams * (6 / 5)]);
			// Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione
			distributionChart.xDomain([0, maxPlays * (6 / 5)]);
			// Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione

			d3.select('#distributionChart').datum(data).transition().duration(500).call(distributionChart).style({
				'width' : 1200,
				'height' : 520
			});
			// Sposto le label dell'asse x più in basso
			d3.selectAll('.nv-x.nv-axis > g').attr('transform', 'translate(0,10)');
			fireDataLoadingEvent(false);
		});
	}

	/* Fine funzioni private */

	/* Inizio funzioni pubbliche */

	// Cambiamo lo stato di visualizzazione del grafico rimuovendo i dati vecchi e inserendo quelli nuovi con delle animazioni
	grafico.changeStatus = function(newStatus) {
		if (newStatus == 0)
			newStatus = currentStatus;
		// Se è 0 vuol dire che devo aggiornare lo stato corrente perchè è stata cambiata la data
		currentStatus = newStatus;
		switch(newStatus) {
			case 1: {
				setStatus1();
				break;
			}
			case 2: {
				setStatus2();
				break;
			}
		}
		fireStateChanged();
	};

	grafico.setSelectedTrack = function(track) {

	};

	grafico.setSelectedCountry = function(country) {
		selectedCountry = country;
	};

	grafico.setSelectedDate = function(date) {
		selectedDate = date;
	};

	// Se siamo in modalità mosaico devo rimuovere le trasformazioni dall'oggetto SVG
	grafico.toMosaic = function() {
		//d3.selectAll("#distributionChart").transition().duration(250).style("transform", "translate(-5,1)scale(0.72,0.725)");
		distributionChart.showLegend(false);
		distributionChart.update();
	};

	// Se siamo in modalità intera devo aggiungere le trasformazioni dall'oggetto SVG
	grafico.toFull = function() {
		//d3.selectAll("#distributionChart").transition().duration(250).style("transform", "translate(-10,0)scale(0.72,0.68)");
		distributionChart.showLegend(true);
		distributionChart.update();
	};

	/* Fine funzioni pubbliche */

	/* Main */

	// La funzione principale da chiamare per disegnare il grafico.
	grafico.draw = function() {
		// Creo il grafico
		fireDataLoadingEvent(true);
		d3.json("http://stefano-pc/analisi-immagini/distribution.php", function(error, data) {
			nv.addGraph(function() {

				// Mi serve il massimo degli ascolti per impostare il dominio di visualizzazione su y
				var maxStreams = d3.extent(data, function(d,i){
				return d.values[0].y;
				})[1];
				var maxPlays = d3.extent(data, function(d,i){
				return d.values[0].x;
				})[1];

				// Adesso posso impostare il dominio su y
				distributionChart.yDomain([0, maxStreams * (6 / 5)]);
				// Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione
				distributionChart.xDomain([0, maxPlays * (6 / 5)]);
				// Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione

				// Formatto i tick dell'asse x e scelgo i valori da mostrare
				distributionChart.xAxis.tickFormat(d3.format(".2s"));
				// Imposto il formato dei tick per l'asse y
				distributionChart.yAxis.tickFormat(d3.format(".2s"));
				// Definisco il contenuto dei tooltip
				distributionChart.tooltipContent(function(key) {
					var track = data.filter(function(el){ return el.key == key; })[0];
					return '<div style="width: 200px; height: 230px"><img src="' + track.artwork + '" style="width: 200px; height: 200px"/></br>' + track.key + '</div>';
				});
				// Finalizzo il grafico e lo aggiungo alla pagina
				d3.select('#distributionChart').datum(data).call(distributionChart);

				nv.utils.windowResize(distributionChart.update);

				distributionChart.scatter.dispatch.on('elementClick', function(e) {
					console.log(e);
					// Il click su un pallino deve impostare il brano come selezionato, quindi lo cambio e lancio l'evento. Prima di cambiare, però, normalizzo l'oggetto
					selectedTrack = e.series;
					var data = e.series.key.split(" - ");
					selectedTrack.track_name = data[1];
					selectedTrack.artist_name = data[0];
					selectedTrack.num_streams = e.point.y;
					selectedTrack.artwork_url = e.series.artwork;
					selectedDate = e.point.x;
					console.log(selectedTrack);
					fireTrackChanged();
				});
				fireDataLoadingEvent(false);
				return distributionChart;
			});
		});
	};

	return grafico;
}