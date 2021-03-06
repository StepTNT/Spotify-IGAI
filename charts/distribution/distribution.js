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

	// Il paese attualmente selezionato
	var currentCountry = {};

	// La data attualmente selezionata
	var selectedDate = {};

	// I dati json che stiamo utilizzando al momento per il nostro grafico
	var currentData = {};

	// L'URL di base per accedere alla cache delle immagini
	var imageCacheBaseUrl = "../image_cache.php?image=";

	// L'URL di base che Sptoify usa per le immagini
	var spotifyImageBaseUrl = "http://o.scdn.co/300/";

	/* Fine variabili private */

	/* Inizio eventi */

	// Evento lanciato quando viene selezionato un paese
	var countryChangedEvent = {};

	// Evento lanciato quando viene selezionata una traccia
	var trackChangedEvent = {};

	// Evento lanciato quando cambiamo lo stato di visualizzazione del grafico
	var stateChangedEvent = {};

	// Evento lanciato quando cambia lo stato di caricamento dei dati
	var dataLoadingEvent = {};

	// Evento lanciato quando muovo il mouse su un pallino del grafico
	var mouseEvent = {};

	// Lancia l'evento relativo al cambio dello stato di visualizzazione del grafico
	function fireStateChanged() {
		stateChangedEvent = new CustomEvent('distribution.stateChanged', {
			detail : {
				'state' : currentStatus,
				'data' : currentData
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
	}

	// Lancia l'evento relativo all'inizio del caricamento dei dati
	function fireMouseEvent(isMouseOut, point) {
		if (!isMouseOut) {
			mouseEvent = new CustomEvent('mousePopoverStarted', {
				detail : {
					target : point,
					graph : 3
				},
				bubbles : true,
				cancelable : true
			});
		} else {
			mouseEvent = new CustomEvent('mousePopoverFinished', {
				detail : {
					target : point
				},
				bubbles : true,
				cancelable : true
			});
		}
		document.dispatchEvent(mouseEvent);
	}

	/* Fine eventi */

	/* Inizio funzioni private */

	// Converte l'URI di un'immagine nell'URI relativo alla cache
	function convertURIToCache(uri) {
		return uri.replace(spotifyImageBaseUrl, imageCacheBaseUrl);
	}

	// Restituisce l'oggetto sul quale si trova il mouse. E' un piccolo hack perchè nvd3.js non espone alcun metodo per sapere su quale pallino siamo
	function getMouseOverPoint(graph) {
		// Devo trovare l'oggetto giusto per attaccare il popover quindi lo scelgo in base all'indice della serie
		var seriesIndex = graph.seriesIndex;
		var points = $(".nv-point");
		// Prendo tutti i punti del grafico
		var resultPoints = [];
		for (var i = 0; i < points.length; i++) {
			var pointData = points[i].__data__;
			if (pointData.series == seriesIndex) {
				// Questo è il punto su cui si trova il mouse.
				// Nel grafico Distribution ci sono casi in cui abbiamo più di un risultato e quello corretto è l'ultimo quindi devo usare un array
				resultPoints.push(points[i]);
			}
		}
		return resultPoints[resultPoints.length - 1];
	}

	// Imposta il primo stato di visualizzazione
	function setStatus1() {
		var date = ($.isEmptyObject(selectedDate)) ? "max" : selectedDate;
		fireDataLoadingEvent(true);
		d3.json("../distribution.php?date=" + date, function(error, data) {
			currentData = data;
			// Mi serve il massimo degli ascolti per impostare il dominio di visualizzazione su y
			var maxStreams = d3.extent(data, function(d,i){
			return d.values[0].y;
			})[1];
			var maxPlays = d3.extent(data, function(d,i){
			return d.values[0].x;
			})[1];

			// Adesso posso impostare il dominio su y (ascolti)
			distributionChart.yDomain([0, maxStreams * (6 / 5)]);
			// Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione
			distributionChart.xDomain([0, maxPlays * (6 / 5)]);
			// (condivisioni)

			d3.select('#distributionChart').datum(data).transition().duration(500).call(distributionChart);
			// Sposto le label dell'asse x più in basso
			d3.selectAll('.nv-x.nv-axis > g').attr('transform', 'translate(0,10)');
			fireDataLoadingEvent(false);
			fireStateChanged();
		});
	};

	// Imposta il secondo stato di visualizzazione
	function setStatus2() {
		// Creo il grafico
		var date = ($.isEmptyObject(selectedDate)) ? "max" : selectedDate;
		fireDataLoadingEvent(true);
		d3.json("../distribution.php?country=" + selectedCountry.id + "&date=" + date, function(error, data) {
			currentData = data;
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

			d3.select('#distributionChart').datum(data).transition().duration(500).call(distributionChart).style({
				'width' : 1200,
				'height' : 520
			});
			// Sposto le label dell'asse x più in basso
			d3.selectAll('.nv-x.nv-axis > g').attr('transform', 'translate(0,10)');
			fireDataLoadingEvent(false);
			fireStateChanged();
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
	};

	// Imposta la traccia selezionata nel grafico
	grafico.setSelectedTrack = function(track) {
		// Non esiste la traccia selezionata nel grafico Distribution
	};

	// Imposta il paese selezionato nel grafico
	grafico.setSelectedCountry = function(country) {
		selectedCountry = country;
	};

	// Imposta la data selezionata nel grafico
	grafico.setSelectedDate = function(date) {
		selectedDate = date;
	};

	// Se siamo in modalità mosaico devo rimuovere la legenda
	grafico.toMosaic = function() {
		distributionChart.showLegend(false);
		distributionChart.update();
	};

	// Se siamo in modalità intera devo mostrare la legenda
	grafico.toFull = function() {
		distributionChart.showLegend(true);
		distributionChart.update();
	};

	/* Fine funzioni pubbliche */

	/* Main */

	// La funzione principale da chiamare per disegnare il grafico.
	grafico.draw = function() {
		// Creo il grafico
		fireDataLoadingEvent(true);
		d3.json("../distribution.php", function(error, data) {
			currentData = data;
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

				// Formatto i tick dell'asse x e scelgo i valori da mostrare
				distributionChart.xAxis.tickFormat(d3.format(".2s"));
				distributionChart.xAxis.axisLabel("Ascolti").axisLabelDistance(40);
				// Imposto il formato dei tick per l'asse y
				distributionChart.yAxis.tickFormat(d3.format(".2s"));
				distributionChart.yAxis.axisLabel("Condivisioni").axisLabelDistance(20);
				// Definisco il contenuto dei tooltip
				distributionChart.tooltipContent(function(key, y, e, graph) {
					var track = data.filter(function(el){ return el.key == key; })[0];
					var artistName = key.split(" - ")[0];
					var songTitle = key.split(" - ")[1];
					var tooltipTitle = "<div style='white-space: nowrap;'><center><p><b>" + artistName + "</b></p><p>" + songTitle + "</p></center></div>";
					var tooltipContent = '<div style="width: 150px; height: 150px"><img src="' + convertURIToCache(track.artwork) + '" style="width: 150px; height: 150px"/>';
					var tooltip_str = '<div class="popover fade bottom in" style="display: block !important; top:30px; left:-90px; visibility: visible !important;"><div class="arrow" style="left: 50% !important"></div><h3 class="popover-title">' + tooltipTitle + '</h3><div class="popover-content">' + tooltipContent + '</div></div>';
					return tooltip_str;
				});

				// Finalizzo il grafico e lo aggiungo alla pagina
				d3.select('#distributionChart').datum(data).call(distributionChart);
				nv.utils.windowResize(distributionChart.update);

				// Il click su un pallino deve impostare il brano come selezionato, quindi lo cambio e lancio l'evento. Prima di cambiare, però, normalizzo l'oggetto
				distributionChart.scatter.dispatch.on('elementClick', function(e) {
					selectedTrack = e.series;
					var data = e.series.key.split(" - ");
					selectedTrack.track_name = data[1];
					selectedTrack.artist_name = data[0];
					selectedTrack.num_streams = e.point.y;
					selectedTrack.artwork_url = convertURIToCache(e.series.artwork);
					selectedDate = e.point.x;
					fireTrackChanged();
				});
				fireDataLoadingEvent(false);
				fireStateChanged();
				return distributionChart;
			});
		});
	};

	return grafico;
}