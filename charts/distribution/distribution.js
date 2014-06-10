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
	var grafico             = {};
	
	/* Inizio variabili private */
	
	var mydata;
    var rolleddate;
    var rolledcam;
    var rolledlens;
    // Il range sull'asse x
    var distxscale;
    // Il range sull'asse y
    var distyscale;
    var distxaxis;
    var distyaxis;
    var radscale;
    var distrad = {max:50,min:5};
    // Scala di colori utilizzata nel grafico
    var color;
    // La larghezza del grafico
    var pagewidth = 1200;
    // L'altezza del grafico
    var distheight = 520;
    var barwidth=10;
    var margin = {top:25,bottom:25,left:50,right:25};
    var radius = 175;
    // L'oggetto grafico principale
    var distribution;	
    var tooltip = d3.select("#popup");
	
	// Il brano selezionato
	var selectedTrack         = {};
	
	// Lo stato di visualizzazione in cui si trova il grafico
	var currentStatus         = 1;   
					
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
	
	// Imposta il primo stato di visualizzazione
	function setStatus1(){
		currentStatus = 1;
		d3.json("sample-data/world-top/latest.json", function(error, data){
			
		});
	}
	
	function circleMouseOver(){
		tooltip.style("visibility", "visible"); 
        d3.select(this)
            .style("stroke","#CC333F")
            .style("stroke-width","2");
                   
	}
	
	function circleMouseMove(d){
		tooltip.style("top", (d3.event.pageY-d3.select(this).attr('cy'))+"px")
			   .style("left",(d3.event.pageX+10)+"px")
			   .style("z-index", 1000);        
        tooltip.select("#popFocalLength").text(d.Plays);
        tooltip.select("#popIso").text(d.Shares);
        tooltip.select("#popCamera").text(d.Artist);
        tooltip.select("#popLens").text(d.Track);
        tooltip.select("#thumb").attr("src",d.Artwork);
	}
	
	function circleMouseOut(){
		tooltip.style("visibility", "hidden");
        distribution.selectAll("circle")
                    .style("stroke-width",0);
        tooltip.select("#thumb").attr("src","thumbnails/loading.gif");
	}
	
	// Nascondo i cerchi e il tooltip
	function exitStatus1(){

	}
	
	// Imposta il secondo stato di visualizzazione
	function setStatus2(){
		currentStatus = 2;
		d3.json("sample-data/world-top/latest.json", function(error, data){

		});
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
		d3.select("#distributionChart").transition().duration(250).attr("style", "width: 1200px; height: 520px; transform: translate(-290px, -140px) scale(0.5, 0.5);");		
	};
	
	// Se siamo in modalità intera devo aggiungere le trasformazioni dall'oggetto SVG
	grafico.toFull = function(){
		d3.select("#distributionChart").transition().duration(250).attr("style","width: 1200px; height: 520px; transform: translate(-120px, -10px);");		
	};
	
	/* Fine funzioni pubbliche */
	
	/* Main */
	
	// La funzione principale da chiamare per disegnare il grafico.
	grafico.draw = function(){		
	    // Creo la mappa a partire dai dati topografici
	    d3.csv("sample-data/data_updated.csv", function (error, data) {
	    	// Formatto le date
	    	data.forEach(function(d){
                d.date=new Date(d.DateTimeOriginal.split(":").slice(0,2).join("-"));
            });
            // Memorizzo i dati in una variabile
            mydata = data;
            rolleddate = d3.nest()
			                .key(function(d) {return d.date;})
			                .rollup(function(leaves){return leaves.length;})
			                .entries(data);
			rolledcam = d3.nest()
			                .key(function(d) {return d.Artist;})
			                .rollup(function(leaves){return leaves.length;})
			                .entries(data);
			rolledlens = d3.nest()
			                .key(function(d) {return d.Track;})
			                .rollup(function(leaves){return leaves.length;})
			                .entries(data);
			rolleddate.sort(function(a,b){
				              a = new Date(a.key);
				              b = new Date(b.key);
				              return a<b?-1:a>b?1:0;
            				});
           // Creo la scala di colori da utilizzare nel grafico
           color = d3.scale.ordinal()
           					.range(["#EDC951","#EB6841","#CC333F","#00A0B0"]);
           // Creo l'elemento SVG
           distribution = d3.select("#distributionChart")
           						.append("svg")
				                .attr("width",pagewidth)
				                .attr("height",distheight);
		   // Creo i range di visualizzazione
		   distxscale = d3.scale.linear()
                .range([0,pagewidth-margin.left-margin.right])
                .domain([0,d3.max(data,function(d){return +d.Plays;})*(4/3)]); // Aumentiamo il range per evitare che i valori più alti siano mostrati quasi fuori dall'area disegnabile
			
            distyscale = d3.scale.linear()
                .range([distheight-margin.top-margin.bottom,0])
			    .domain([0,d3.max(data,function(d){return +d.Shares;})*(4/3)]);
			    
			radscale = d3.scale.linear()
	    	    .rangeRound([distrad.min,distrad.max])
	    	    .domain([d3.min(data,function(d){return +d.Popularity;}),d3.max(data,function(d){return +d.Popularity;})]);

            distxaxis = d3.svg.axis()
                .scale(distxscale)
                .orient("bottom")
                .ticks(5);
            // Posiziono gli assi
            var distaxispos = distheight - margin.bottom;
            distribution.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + margin.left + "," + distaxispos + ")")
                .call(distxaxis);
            
            distyaxis = d3.svg.axis()
                .scale(distyscale)
                .orient("left")
                .ticks(5)
				.tickFormat(d3.format("s")); //Formattiamo le migliaia come "k", quindi 10000 diventa 10k
				
			distribution.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(distyaxis);
            // Creo un pallino per ogni brano
            distribution.selectAll("circle").data(data).enter()
                .append("circle")
                .attr("cx",function(d){ return distxscale(d.Plays) + margin.left;})
                .attr("cy",function(d){ return distyscale(d.Shares) + margin.top;})
                .attr("r",0)
                .style("fill-opacity",0.3)
                .style("fill",function(d){return color(d.Artist);})
                .on("mouseover", circleMouseOver)
                .on("mousemove", circleMouseMove)
	            .on("mouseout", circleMouseOut);
	        // Dopo aver creato i cerchi li mostro con un'animazione
			distribution.selectAll("circle")
						.transition()
						.duration(1000)
						.attr("r",function(d){
							return distrad.max/(d.Popularity*2.5);
						});
		});		
	};
	
	return grafico;
}