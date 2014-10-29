/* ----------------------------------------------------------------------------------------
* Created by Stefano on 10/06/2014.
*
* Fonte: http://www.tnoda.com/blog/2013-12-07
*
* Descrizione:
* Grafico che mostra la popolarità dei brani selezionati in base al tempo. Per ogni brano
* viene mostrata una linea che indica la sua popolarità, insieme ad un'etichetta che lo
* identifica. Abbiamo anche la possibilità di zoomare su una specifica settimana per vedere
* l'andamento più in dettaglio.
*
* Stati:
* 1)  Mostriamo i dati relativi ai primi 5 brani al mondo.
*     Eventi:
*         - Il passaggio del mouse su una linea mostra la finestra di stato con il numero di
*           ascolti nella data selezionata
*	      - Il click su una linea/etichetta imposta il brano collegato come selezionato.
*           I grafici mostreranno quindi le statistiche relative allo stato selezionato.
* 2)  Mostriamo le statistiche dello stato 1 ma riferite al singolo paese selezionato.
*     Eventi:
*         - Il passaggio del mouse su una linea mostra la finestra di stato con il numero
*           di ascolti nella data selezionata.
*         - Il click su una linea/etichetta imposta il brano collegato come selezionato.
*           I grafici mostreranno quindi le statistiche relative al brano nello stato
*           selezionato.
---------------------------------------------------------------------------------------- */
/**
 * Oggetto di base per il nostro grafico di tipo Map.
 *
 * @constructor
 */
function Line() {
	// grafico è l'oggetto che utilizziamo per esportare i metodi pubblici
	var grafico = {};

	/* Inizio variabili private */

	// L'oggetto che rappresenta il grafico di tipo line
	var lineChart = nv.models.lineChart().x(function(d) {
		return new Date(d.x);
	});

	// Funzione utilizzata per il parse delle date
	var dateParser = d3.time.format("%Y-%m-%d").parse;

	// Lo stato di visualizzazione attuale
	var currentStatus = 1;

	var selectedCountry = {};

	var selectedTrack = {};

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

	var dateChangedEvent = {};

	var dataLoadingEvent = {};

	// Lancia l'evento relativo al cambio dello stato di visualizzazione del grafico
	function fireStateChanged() {
		stateChangedEvent = new CustomEvent('line.stateChanged', {
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
		trackChangedEvent = new CustomEvent('line.trackChanged', {
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
		countryChangedEvent = new CustomEvent('line.countryChanged', {
			detail : {
				'country' : selectedCountry
			},
			bubbles : true,
			cancelable : true
		});
		document.dispatchEvent(countryChangedEvent);
		// Lancio l'evento relativo al cambio del paese selezionato
	}

	// Lancia l'evento relativo al cambio della data selezionata
	function fireDateChanged() {
		dateChangedEvent = new CustomEvent('line.dateChanged', {
			detail : {
				'date' : selectedDate
			},
			bubbles : true,
			cancelable : true
		});
		document.dispatchEvent(dateChangedEvent);
		// Lancio l'evento relativo al cambio del paese selezionato
	}

	// Lancia l'evento relativo all'inizio del caricamento dei dati
	function fireDataLoadingEvent(started) {
		if (started) {
			dataLoadingEvent = new CustomEvent('line.dataLoadingStarted', {
				detail : {
				},
				bubbles : true,
				cancelable : true
			});
		} else {
			dataLoadingEvent = new CustomEvent('line.dataLoadingFinished', {
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
	
	// Converte l'URI di un'immagine nell'URI relativo alla cache
	function convertURIToCache(uri){
		return uri.replace(spotifyImageBaseUrl, imageCacheBaseUrl);
	}

	// Imposta il primo stato di visualizzazione
	function setStatus1() {
		var trackUri = ($.isEmptyObject(selectedTrack)) ? "null" : selectedTrack.track_url;
		fireDataLoadingEvent(true);
		d3.json("../line.php?trackUri=" + trackUri, function(error, data) {
			currentData = data;			
			d3.select('#lineChart').datum(data).transition().duration(500).call(lineChart);
			// Sposto le label dell'asse x più in basso
			d3.selectAll('.nv-x.nv-axis > g').attr('transform', 'translate(0,10)');
			fireDataLoadingEvent(false);
			fireStateChanged();			
		});
	};

	// Imposta il secondo stato di visualizzazione
	function setStatus2() {
		// Creo il grafico
		fireDataLoadingEvent(true);
		d3.json("../line.php?country=" + selectedCountry.id, function(error, data) {
			currentData = data;			
			d3.select('#lineChart').datum(data).transition().duration(500).call(lineChart);
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

	grafico.setSelectedTrack = function(track) {
		selectedTrack = track;
	};

	grafico.setSelectedCountry = function(country) {
		selectedCountry = country;
	};

	// Se siamo in modalità mosaico devo rimuovere le trasformazioni dall'oggetto SVG
	grafico.toMosaic = function() {
		lineChart.update();
	};

	// Se siamo in modalità intera devo aggiungere le trasformazioni dall'oggetto SVG
	grafico.toFull = function() {
		lineChart.update();
	};

	/* Fine funzioni pubbliche */

	/* Main */

	// La funzione principale da chiamare per disegnare il grafico.
	grafico.draw = function() {
		// Creo il grafico
		fireDataLoadingEvent(true);
		d3.json("../line.php", function(error, data) {
			currentData = data;
			nv.addGraph(function() {
				// Imposto i margini del grafico
				lineChart.margin({
					bottom : 40,
					left : 50
				});
				// Mi serve il massimo degli ascolti per impostare il dominio di visualizzazione su y
				var maxStreams = d3.extent(data, function(d,i){
				return d.values[i].y;
				})[1];
				// Adesso posso impostare il dominio su y
				lineChart.yDomain([0, maxStreams * (6 / 5)]);
				// Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione
				// Imposto il formato dell'asse x utilizzando delle date
				lineChart.lines.xScale(d3.time.scale());
				// Formatto i tick dell'asse x e scelgo i valori da mostrare
				lineChart.xAxis.tickFormat(function(d) {
					return d3.time.format("%b %d")(new Date(d));
				});
				// Imposto il formato dei tick per l'asse y
				lineChart.yAxis.tickFormat(d3.format(".2s"));
				// Definisco il contenuto dei tooltip
				lineChart.tooltipContent(function(key, y, e, graph) {
					var x = d3.time.format("%d-%m-%Y")(new Date(graph.point.x));
					var y = String(graph.point.y);
					var y = String(graph.point.y) + ' ascolti';
					var artworks = data.filter(function(el) {
						return el.key == key;
					});
					tooltip_str = '<center><image style="height:150px; width:150px" src="' + ((!$.isEmptyObject(artworks)) ? convertURIToCache(artworks[0].artwork) : "") + '"/><br/><b>' + key + '</b></br>' + y + ' il ' + x + '</center>';
					return tooltip_str;
				});
				// Finalizzo il grafico e lo aggiungo alla pagina
				d3.select('#lineChart').datum(data).transition().duration(500).call(lineChart).style({
					'width' : 1200,
					'height' : 520
				});
				// Sposto le label dell'asse x più in basso
				d3.selectAll('.nv-x.nv-axis > g').attr('transform', 'translate(0,10)');
				nv.utils.windowResize(lineChart.update);

				lineChart.lines.dispatch.on('elementClick', function(e) {
					// Il click su un pallino deve impostare il brano come selezionato, quindi lo cambio e lancio l'evento. Prima di cambiare, però, normalizzo l'oggetto
					selectedTrack = e.series;
					var data = e.series.key.split(" - ");
					selectedTrack.track_name = data[1];
					selectedTrack.artist_name = data[0];
					selectedTrack.num_streams = e.point.y;
					selectedTrack.artwork_url = convertURIToCache(e.series.artwork);
					selectedDate = e.point.x;
					fireDateChanged();
					fireTrackChanged();
				});
				fireDataLoadingEvent(false);
				fireStateChanged();
				return lineChart;
			});
		});
	};

	return grafico;
}