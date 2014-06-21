/* ----------------------------------------------------------------------------------------
* Created by Stefano on 26/05/2014.
*
* Fonte: http://www.tnoda.com/blog/2013-12-07
*
* Descrizione:
* Mappa del mondo con ogni paese come oggetto cliccabile. E' supportato lo zoom sul paese
* insieme ad un tooltip da mostrare al passaggio del mouse.
*
* Stati:
* 1)  Su ogni stato, tra quelli per i quali abbiamo i dati, mostriamo un cerchio contenente
*     la copertina del disco più suonato.
*     Eventi:
*         - Passando il mouse sulla copertina mostriamo un tooltip con la copertina
*           completa, i dati del disco e il numero di ascolti.
*	      - Passando il mouse sullo stato mostriamo un tooltip con il nome dello stato e il
*		    numero di ascolti totali in quello stato
*		  - Il click sulla copertina imposta il brano come selezionato, cambiando lo stato
*		    degli altri grafici
*		  - Il click sullo stato lo imposta come selezionato. I grafici mostreranno quindi
*		    le statistiche relative allo stato selezionato.
* 2)  Coloriamo ogni stato in base alla popolarità del brano in quello stato. Ad una
*     popolarità più elevata corrisponde un colore più intenso. La popolarità è calcolata
*     come somma degli ascolti tra tutte le settimane per le quali abbiamo dei dati.
*     Eventi:
*         - Passando il mouse sullo stato viene mostrato un tooltip con il numero di
*           ascolti per quello stato.
*         - Il click sullo stato lo imposta come selezionato. I grafici mostreranno le
*           statistiche relative al brano nello stato selezionato.
---------------------------------------------------------------------------------------- */
/**
 * Oggetto di base per il nostro grafico di tipo Map.
 *
 * @constructor
 */
function Map() {
	// grafico è l'oggetto che utilizziamo per esportare i metodi pubblici
	var grafico             = {};
	
	/* Inizio variabili private */
	
	// Dimensioni della mappa
	var width                 = 940, 
	    height                = 400,
	    m_width               = $("#map").width * 0.8,
		m_height              = $("#map").height;	
	
	// La proiezione utilizzata dalla mappa
	var projection            = d3.geo.mercator()
									.scale(150)
									.translate([width/2,height/1.5]);
	var path                  = d3.geo.path()
									.projection(projection);
	
	// L'oggetto grafico SVG che conterrà la mappa
	var svg                   = d3.select("#mapChart")
									.append("svg")
									.attr("preserveAspectRatio","xMidYMid meet")
									.attr("viewBox","0 0 "+width+" "+height)
									.attr("width",m_width)
									.attr("height",m_width*height/width); //Questo dovrebbe sistemare il problema del taglio dell'Argentina
    
    // Creo il rettangolo per gestire gli eventi della mappa
	svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height)
        .on("click", country_clicked);
								
	// L'oggetto grafico sul quale verrà disegnata la mappa					
	var g                     = svg.append("g");					
	
	// Il tooltip da mostrare quando passo il mouse su una copertina
	var coverTooltip          = d3.select("body")
									.append("div")
			        				.attr("class", "mapTooltip")
			        				.style("opacity", 0)
			        				.style("z-index", 1000);
		        				
	var country               = {};
	
	// Il colore che utilizziamo per i paesi abilitati	        				
	var enabledCountryColor   = "#abf";
	
	// Il colore che utilizziamo per il paese selezionato
	var selectedCountryColor  = "orange";
	
	// Il colore che utilizziamo per il bordo del paese selezionato
	var selectedCountryStroke = "black";
	
	// Il colore di base per il bordo di un paese
	var defaultCountryStroke  = "white"; 
	        				
	// I paesi per i quali sono abilitate le interazioni con il mouse        				
	var enabledCountries      = [];     
	
	// Il paese selezionato
	var selectedCountry       = {};
	
	// Il brano selezionato
	var selectedTrack         = {};
	
	// Lo stato di visualizzazione in cui si trova il grafico
	var currentStatus         = undefined;   
					
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
		stateChangedEvent = new CustomEvent('map.stateChanged', {
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
		trackChangedEvent = new CustomEvent('map.trackChanged', {
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
	    countryChangedEvent = new CustomEvent('map.countryChanged', {
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
	
	// Recupera l'oggetto country a partire dal suo ID
	function getCountry(id){
		var countries = g.select("#countries")[0][0].children;
	    for (var i = 0; i < countries.length; i++) {
	        var country = countries[i];
	        if (country.id == id) return country.__data__;
	    }
	    return null;
	}
	
	// Recupera le coordinate del paese a partire dal suo ID
	function get_xyz(d){
		var bounds = path.bounds(d);
	    var w_scale = (bounds[1][0] - bounds[0][0]) / width;
	    var h_scale = (bounds[1][1] - bounds[0][1]) / height;
	    var z = .96 / Math.max(w_scale, h_scale);
	    var x = (bounds[1][0] + bounds[0][0]) / 2;
	    var y = (bounds[1][1] + bounds[0][1]) / 2 + (height / z / 6);
	    return [x, y, z];
	}
	
	// Gestisce il click su un paese
	function country_clicked(d){
		if (d && $.inArray(d.id, enabledCountries) == -1) return; // Nessuna interazione su questo paese perchè non abbiamo dati o perchè è satta disattivata esplicitamente
		g.selectAll(["#states", "#cities"]).remove();
		if (country) {
	        if (currentStatus != 2) // Se sono nello stato 2 non devo ricolorare i paesi visto che li ho colorati in base agli ascolti
	            g.selectAll("#" + country.id)
		            .transition()
		            .duration(500)
		            .style('display', null)
		            .style("fill", enabledCountryColor);
	    }
	
	    if (d && country !== d) { // Seleziono un paese
	        selectedCountry = d; // Imposto il paese come selezionato			
			fireCountryChanged();
	        var xyz = get_xyz(d);
	        country = d;
	        zoom(xyz);		
	        if (currentStatus != 2) // Se sono nello stato 2 non devo ricolorare i paesi visto che li ho colorati in base agli ascolti
	            g.selectAll("#" + country.id)
		            .transition()
		            .duration(500)
		            .style('fill', selectedCountryColor);
	        g.selectAll("#" + country.id) // Coloro il bordo di nero				
				.transition()
				.delay((grafico.statoCorrente != 1) ? 500 : 0)
	            .duration(500)
	            .style("stroke", selectedCountryStroke);
	
	    } else { // Deseleziono un paese
	        selectedCountry = {}; // Imposto il paese come selezionato
			fireCountryChanged();
	        var xyz = [width / 2, height / 1.5, 1];
	        if (currentStatus != 2) // Se sono nello stato 2 non devo ricolorare i paesi visto che li ho colorati in base agli ascolti
	            g.selectAll("#" + country.id)
		            .transition()
		            .duration(500)
		            .style('fill', enabledCountryColor);
	        g.selectAll("#" + country.id) // Rimuovo il colore dal bordo
	        	.transition()
	            .duration(500)
				.delay((currentStatus != 2) ? 500 : 0)
	            .style("stroke", null);
	        country = null;
	        zoom(xyz);
	    }
	}
	
	// Effettua lo zoom sulle coordinate indicate
	function zoom(xyz){
		g.transition()
	        .duration(750)
	        .attr("transform", "translate(" + projection.translate() + ")scale(" + xyz[2] +")translate(-" + xyz[0] + ",-" + xyz[1] + ")")
	        .selectAll(["#countries", "#states", "#cities"])
	        .style("stroke-width", 1.0 / xyz[2] + "px")
	        .selectAll(".city")
	        .attr("d", path.pointRadius(20.0 / xyz[2]));
	}
	
	// Imposta il primo stato di visualizzazione
	function setStatus1(){
		currentStatus = 1;
		d3.json("sample-data/world-top/latest.json", function(error, data){
			// Per poter scalare il raggio dei cerchi su ogni stato, ci serve sapere quale sarà il valore massimo degli ascolti
			var maxStreams = d3.max(data.tracks, function(d){
				return d.num_streams;
			});
			// Una volta ottenuto il massimo costruisco la funzione per scalare il raggio all'interno del dominio tra 0 e maxStreams
			var scale = d3.scale.linear()
									.domain([0, maxStreams])
									.range([2, 10]); // I nostri cerchi avranno un raggio tra 2 e 10 unità
			// Per poter utilizzare un'immagine di sfondo per i cerchi, è necessario usare i pattern SVG. Devo quindi definirli in modo dinamico
			data.tracks.forEach(function(d){
				// Devo scorrere tutte le tracce perchè devo creare un pattern per ogni traccia
				g.append("pattern")
					.attr("id", d.artwork_url) // Usiamo l'url come id visto che è univoco e non presenta spazi o caratteri vietati
					.attr("patternUnits", "userSpaceOnUse") //TODO: trovare un modo per spalmare l'immagine senza che sia ripetuta
					.attr("width", scale(d.num_streams))
					.attr("height", scale(d.num_streams))
					.append("image")
						.attr("xlink:href", d.artwork_url)
						.attr("src", d.artwork_url) //TODO: potrebbe essere anche rimosso, da verificare
	                    .attr("x", 0)
	                    .attr("y", 0)
	                    .attr("width", scale(d.num_streams))
	                    .attr("height", scale(d.num_streams));		                 
	           // Sfrutto questo ciclo per abilitare le interazioni sui paesi per i quali abbiamo dati
	           var currentCountry = getCountry(d.country);
	           if($.inArray(enabledCountries, currentCountry.id) == -1){
	               // Con questo controllo verifico se il paese è stato già abilitato in precedenza
	               g.selectAll("#" + currentCountry.id)
	                   .transition()
	                   .duration(1000)
	                   .ease("bounce")
	                   .style("fill", enabledCountryColor);
	               enabledCountries.push(currentCountry.id);
	           }	
	           // Creo i cerchi, uno per ogni brano presente nei dati. (Il formato dei dati non permette cerchi multipli sullo stesso paese!)
	           var circles = g.selectAll("circle")
	           					.data(data.tracks)
	           					.enter()
	           					.append("circle")
	           					.on("mouseover", function(d){
	           						circleMouseOver(d);
	           						})
	           					.on("mouseout", function(){
	           						circleMouseOut();
	           					})
	           					.on("mousemove", function(){
	           						circleMouseMove();
	           					}) 
	           					.on("click", function(d){
	           						circleMouseClick(d);
	           					})
	           					.style("stroke", selectedCountryStroke)
	           					.style("stroke-width", "0.5")
	           					.style("opacity", 0) // L'opacità iniziale è 0 perchè verrà animata successivamente
	           					.attr("id", "mapCircle") //TODO: force.css ridefinisce circle e mi colora anche questi di arancione -.-
	           					.attr("r", 0) // Come sopra, anche il raggio verrà animato
	           					.attr("cx", function(d){
	           						var coords = get_xyz(getCountry(d.country));
	           						return coords[0];
	           					})
	           					.attr("cy", function(d){
	           						var coords = get_xyz(getCountry(d.country));
	           						return coords[1];
	           					})
	           					.attr("fill", function(d){
	           						return "url(#" + d.artwork_url + ")";
	           					});
			});
			// Dopo aver creato i cerchi li devo mostrare con un'animazione
			d3.selectAll("circle")
				.transition()
				.delay(function(d){ // Utilizzando un delay che dipende dal numero di ascolti, mostro ogni cerchio in un istante diverso
					return Math.random() * Math.sqrt(d.num_streams);
				})
				.duration(750)
				.ease("bounce")
				.style("opacity", 1)
				.attr("r", function (d) { // Il raggio dipende dal numero di ascolti secondo la funzione di scaling definita prima
	                return scale(d.num_streams);
	            });
		});
	}
	
	// Quando il mouse entra nel cerchio mostro il tooltip
	function circleMouseOver(d){
		var top = ((d3.event.pageY > height) ? height : d3.event.pageY); // Evitiamo che il tooltip venga disegnato fuori dall'area visibile
		coverTooltip.transition()
	                    .duration(500)
	                    .style("opacity", .9); // Inizio l'animazione
	    coverTooltip.html("<div style='background-image:url(" + d.artwork_url +
	                        "); background-size: 100%; height: 150px; width: 150px;'></div>" +
	                        "<br/><div>" + "Artista   : " + d.artist_name + "<br/>" + "Album     : " + d.album_name +
	                        "<br/>" + "Titolo    : " + d.track_name + "<br/>" + "Ascolti   : " + d.num_streams +
	                        "<br/></div>")
	                        .style("left", (d3.event.pageX) + "px")
	                        .style("top", (top) + "px"); // Imposto l'HTML da mostrare
	    console.log("left = " + d3.event.pageX + ", top = " + top);
	}
	
	// Quando il mouse esce dal cerchio nascondo il tooltip
	function circleMouseOut(){
		coverTooltip.transition()
	                    .duration(500)
	                    .style("opacity", 0);
	}
	
	// Se il mouse si muove aggiorno la posizione del tooltip per seguire il mouse
	function circleMouseMove(){
		var top = ((d3.event.pageY > height) ? height : d3.event.pageY);
	    coverTooltip.style("left", (d3.event.pageX) + "px")
                    .style("top", (top) + "px");
	}
	
	// Il click del mouse cambia lo stato del grafico e imposta il brano come selezionato                    
	function circleMouseClick(d){
	   selectedTrack = d;
	    /*grafico.changeStatus(2);*/
	   fireTrackChanged();
	}
	
	// Nascondo i cerchi e il tooltip
	function exitStatus1(){
		coverTooltip.transition()
	            .duration(500)
	            .style("opacity", 0);
	    d3.selectAll("circle#mapCircle")
	        .transition()
	        .delay(function (d) { // Animo opacità e raggio in modo da nascondere i cerchi uno per volta
	            return Math.random() * Math.sqrt(d.num_streams / 10);
	        })
	        .duration(1000)
	        .style("opacity", 0)
	        .attr("r", 0);
   		// Devo resettare lo zoom e lo stato selezionato
   		if(country)
			country_clicked(country);
	}
	
	// Imposta il secondo stato di visualizzazione
	function setStatus2(){
		currentStatus = 2;
		d3.json("sample-data/world-top/latest.json", function(error, data){
			// Per costruire il range dei colori mi serve il numero massimo degli ascolti
			var maxStreams = d3.max(data.tracks, function (d) {
                return d.num_streams;
            });
            // Creo la scala con i colori utilizzando la libreria colorbrewer 
            //TODO: Abbiamo massimo 11 colori, potrebbe dare problemi se mostriamo più di 11 paesi, da verificare.
            var quantize = d3.scale.ordinal()
                .domain([0, maxStreams])
                .range(colorbrewer.Spectral[data.tracks.length]); 
            // Adesso posso colorare ogni paese utilizzando la funzione di quantizzazione
            data.tracks.forEach(function (d) {                
                g.selectAll("#" + getCountry(d.country).id)
                    .transition()
                    .duration(1000)
                    .ease("bounce")
                    .style("fill", quantize(d.num_streams));
            });
		});
	}
	/* Fine funzioni private */
	
	/* Inizio funzioni pubbliche */
	
	// Imposto la traccia selezionata e cambio lo stato del grafico
	grafico.setSelectedTrack = function(track){
		selectedTrack = track;
	};
	
	// Cambiamo lo stato di visualizzazione del grafico rimuovendo i dati vecchi e inserendo quelli nuovi con delle animazioni
	grafico.changeStatus = function(newStatus){
		switch(newStatus){
			case 1:{
				if(currentStatus == 1) return; // Siamo già nello stato 1
				setStatus1();
				break;
			}
			case 2:{
				if(currentStatus == 2) return; // Siamo già nello stato 2
				exitStatus1();
				setStatus2();
				break;
			}
		}
		currentStatus = newStatus;
		fireStateChanged();
	};
	
	// Se siamo in modalità mosaico devo rimuovere le trasformazioni dall'oggetto SVG
	grafico.toMosaic = function(){
		$("#mapChart").animate({"style": "margin: 5px; height: 260px;"}, 250);
		svg.transition().duration(250).attr("transform", "translate(30,0) scale(0.9,0.9)");
	};
	
	// Se siamo in modalità intera devo aggiungere le trasformazioni dall'oggetto SVG
	grafico.toFull = function(){
		$("#mapChart").animate({"style": "margin: 5px; height: 520px;"}, 250);
		svg.transition().duration(250).attr("transform", "translate(140,35) scale(0.8, 0.8)"); //Questo dovrebbe sistemare il problema del taglio dell'Argentina
	};
	
	/* Fine funzioni pubbliche */
	
	/* Main */
	
	// La funzione principale da chiamare per disegnare il grafico.
	grafico.draw = function(){		
	    // Creo la mappa a partire dai dati topografici
	    d3.json("charts/map/countries.topo.json", function (error, data) {
	        g.append("g")
	            .attr("id", "countries")
	            .selectAll("path")
	            .data(topojson.feature(data, data.objects.countries).features)
	            .enter()
	            .append("path")
	            .attr("id", function (d) {
	                return d.id;
	            })
	            .attr("d", path)
	            .on("click", function(d){
	            	country_clicked(d);
	            });
	    });
	    grafico.changeStatus(1); // Imposto lo stato di default
	    $(window).resize(function () {
	            var w = $("#map").width();
	            svg.attr("width", w);
	            svg.attr("height", w * height / width);
	    });
	};
	
	return grafico;
}