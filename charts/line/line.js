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
* 3)  Mostriamo le statistiche dello stato 1 con la possibilità di confrontare l'andamento 
*     di brani scelti dall'utente e non presi dalla top 5.
*     Eventi:
*         - Il passaggio del mouse su una linea mostra la finestra di stato con il numero 
*           di ascolti nella data selezionata.
*         - Il click su una linea/etichetta imposta il brano collegato come selezionato. 
*           I grafici mostreranno quindi le statistiche relative allo stato selezionato.
*         - Il click su un brano in lista lo rimuove dal grafico, se invece il brano non 
*           è in lista allora lo aggiungo.
---------------------------------------------------------------------------------------- */
/**
 * Oggetto di base per il nostro grafico di tipo Map.
 *
 * @constructor
 */
function Line() {
	// grafico è l'oggetto che utilizziamo per esportare i metodi pubblici
	var grafico             = {};
	
	/* Inizio variabili private */
	
	// L'oggetto che rappresenta il grafico di tipo line
	var lineChart           = nv.models.lineWithFocusChart()
											.x(function(d){
												return new Date(d.x);
											});
											
	// Funzione utilizzata per il parse delle date	
	var dateParser          = d3.time.format("%Y-%m-%d").parse;
	
	/* Fine variabili private */
	
	/* Inizio eventi */
	
	// Evento lanciato quando viene selezionato un paese
	var countryChangedEvent = {};
	
	// Evento lanciato quando viene selezionata una traccia
	var trackChangedEvent   = {};
	
	// Evento lanciato quando cambiamo lo stato di visualizzazione del grafico
	var stateChangedEvent   = {};
	
	// Lancia l'evento relativo al cambio dello stato di visualizzazione del grafico
	function fireStateChanged(){
		stateChangedEvent = new CustomEvent('line.stateChanged', {
	            detail: {
	                'state': currentStatus
	            },
	            bubbles: true,
	            cancelable: true
	        });
	    document.dispatchEvent(stateChangedEvent);
	}
	
	// Lancia l'evento relativo al cambio del brano selezionato
	function fireTrackChanged(){
		trackChangedEvent = new CustomEvent('line.trackChanged', {
	        detail: {
	            'track': selectedTrack
	        },
	        bubbles: true,
	        cancelable: true
	    });
	    document.dispatchEvent(trackChangedEvent); // Lancio l'evento relativo alla selezione del brano
	}
	
	// Lancia l'evento relativo al cambio del paese selezionato
	function fireCountryChanged(){
	    countryChangedEvent = new CustomEvent('line.countryChanged', {
	        detail: {
	            'country': selectedCountry
	        },
	        bubbles: true,
	        cancelable: true
	    });
	    document.dispatchEvent(countryChangedEvent); // Lancio l'evento relativo al cambio del paese selezionato
	}
	
	/* Fine eventi */
	
	/* Inizio funzioni private */
	
	// Recupera l'artwork del brano a partire dall'oggetto che mostro sul grafico
	function getArtworkFromKey(key){
		return testData().filter(function(el){ return el.key == key; })[0].artwork;
	}
		
		
	function testData() {
		return [
				{
					key: "Clean Bandit - Rather Be",
					values: [
						{
							x: "2014-04-27",
							y: 2504054
						},
						{
							x: "2014-04-20",
							y: 1905117
						},
						{
							x: "2014-04-13",
							y: 1513407
						},
						{
							x: "2014-04-06",
							y: 893984
						}
					],
					artwork: "http://o.scdn.co/300/f6c9e55802a1dbf3c4a346dd58097ad0cafe9a94"
				},
				{
					key: "Calvin Harris - Summer",
					values: [
						{
							x: "2014-04-27",
							y: 1504054
						},
						{
							x: "2014-04-20",
							y: 805117
						},
						{
							x: "2014-04-13",
							y: 713407
						},
						{
							x: "2014-04-06",
							y: 593984
						}
					],
					artwork: "http://o.scdn.co/300/f6c9e55802a1dbf3c4a346dd58097ad0cafe9a94"
				},
				{
					key: "David Guetta - Bad",
					values: [
						{
							x: "2014-04-27",
							y: 1504054
						},
						{
							x: "2014-04-20",
							y: 505117
						},
						{
							x: "2014-04-13",
							y: 213407
						},
						{
							x: "2014-04-06",
							y: 93984
						}
					],
					artwork: "http://o.scdn.co/300/f6c9e55802a1dbf3c4a346dd58097ad0cafe9a94"
				},
				{
					key: "Iggy Azalea - Fancy",
					values: [
						{
							x: "2014-04-27",
							y: 2504054
						},
						{
							x: "2014-04-20",
							y: 1405117
						},
						{
							x: "2014-04-13",
							y: 513407
						},
						{
							x: "2014-04-06",
							y: 293984
						}
					],
					artwork: "http://o.scdn.co/300/d71d05ded1704bcf849465dd5e76e196847d1c0a"
				}
		];
	}
	/* Fine funzioni private */
	
	/* Inizio funzioni pubbliche */
	
	// Cambiamo lo stato di visualizzazione del grafico rimuovendo i dati vecchi e inserendo quelli nuovi con delle animazioni
	grafico.changeStatus = function(newStatus){
		switch(newStatus){
			case 1:{
				setStatus1();
				break;
			}
			case 2:{
				exitStatus1();
				setStatus2();
				break;
			}
		}
		fireStateChanged();
	};
	
	// Se siamo in modalità mosaico devo rimuovere le trasformazioni dall'oggetto SVG
	grafico.toMosaic = function(){
		d3.selectAll("#lineChart").transition().duration(250).style("transform", "translate(-5,1)scale(0.72,0.725)");	
	};
	
	// Se siamo in modalità intera devo aggiungere le trasformazioni dall'oggetto SVG
	grafico.toFull = function(){
		d3.selectAll("#lineChart").transition().duration(250).style("transform", "translate(-10,0)scale(0.72,0.68)");		
	};
	
	/* Fine funzioni pubbliche */
	
	/* Main */
	
	// La funzione principale da chiamare per disegnare il grafico.
	grafico.draw = function(){		
	    // Creo il grafico a partire dai dati topografici
	    d3.json("sample-data/line-data.json", function (error, data) {	  	
    		nv.addGraph(function(){
    			// Imposto i margini del grafico
		    	lineChart.margin({bottom: 40, left:50});
		    	// Mi serve il massimo degli ascolti per impostare il dominio di visualizzazione su y
		    	var maxStreams = d3.extent(data, function(d,i){ 
		    										return d.values[i].y;
		    									 })[1];
		    	// Adesso posso impostare il dominio su y
		    	lineChart.yDomain([0, maxStreams*(6/5)]); // Aggiungo qualcosa al massimo altrimenti il valore più alto sarebbe quasi fuori dalla visualizzazione
		    	// Imposto il formato dell'asse x utilizzando delle date
		    	lineChart.lines.xScale(d3.time.scale());
		    	// Formatto i tick dell'asse x e scelgo i valori da mostrare
		    	lineChart.xAxis.tickFormat(function(d) {
						        return d3.time.format("%d-%m-%Y")(new Date(d)); 
						   })
						   .tickValues(function(d,i){
								var tmp = d[i].values.map(function(el){ return el.x;});
								var res = [];					
								res.concat.apply(res, tmp);					
								return res;
						   });
				// Imposto l'asse x per il secondo grafico
				lineChart.lines2.xScale(d3.time.scale());
				lineChart.x2Axis.tickFormat(function(d) { 
								return d3.time.format("%d-%m-%Y")(new Date(d)); 
							})
							.tickValues(function(d,i){
								var tmp = d[i].values.map(function(el){ return el.x;});
								var res = [];
								res.concat.apply(res, tmp);
								return res; 
				   			});
				// Imposto il formato dei tick per gli assi y
				lineChart.yAxis.tickFormat(d3.format(".2s"));
				lineChart.y2Axis.tickFormat(d3.format(".2s"));
				// Definisco il contenuto dei tooltip
				lineChart.tooltipContent(function(key, y, e, graph) {
					console.log("TOOLTIP!");
		            var x = d3.time.format("%d-%m-%Y")(new Date(graph.point.x));
		            var y = String(graph.point.y);
		            var y = String(graph.point.y)  + ' ascolti';				
		            tooltip_str = '<center><image src="' + getArtworkFromKey(key) + '"/><br/><b>'+key+'</b></br>' + y + ' il ' + x + '</center>';
		            return tooltip_str;
	    		});    		
				// Finalizzo il grafico e lo aggiungo alla pagina
				d3.select('#lineChart svg')
				  .datum(data)
				  .transition()
				  .duration(500)
				  .call(lineChart)
				  .style({ 'width': 1200, 'height': 520 });			 
				// Sposto le label dell'asse x più in basso
				d3.selectAll('.nv-x.nv-axis > g').attr('transform', 'translate(0,10)');					  
				//nv.utils.windowResize(chart.update);	
				return lineChart;
    		});
	    });
	};

	return grafico;
}