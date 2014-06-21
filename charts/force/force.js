/* ----------------------------------------------------------------------------------------
* Created by Stefano on 9/06/2014.
*
* Fonte: http://bl.ocks.org/paulovn/9686202
*
* Descrizione:
* Grafo che mostra i collegamenti tra i vari brani. Due brani sono collegati se c'è almeno 
* un utente di Twitter che li ha ascoltati entrambi.
*
* Stati:
* 1)  Mostriamo il grafo, centrandolo sul brano più suonato al mondo.
*     Eventi:
*         - Il passaggio del mouse su un nodo mostra le informazioni relative al brano 
*           collegato nella finestra di stato
*	      - Il click su un nodo imposta il brano ad esso collegato come brano selezionato. 
*           (funziona solo per i brani per i quali abbiamo i dati delle charts!)
* 2)  Come nello stato 1, ma centriamo il grafo sul brano selezionati
---------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   (c) Telefonica I+D, 2013
   Author: Paulo Villegas

   This script is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
   -------------------------------------------------------------------------- */

//TODO: sistemare i CSS
/**
 * Oggetto di base per il grafico Force
 * @constructor 
 */
function Force(){
	// grafico è l'oggetto che utilizziamo per esportare i metodi pubblici
	var grafico             = {};
	
	/* Inizio variabili private */
	
	// Dimensioni del grafo
	var width               = 1300,
		height              = 550;
		
	// Il limite massimo per lo zoom
	var	show_threshold      = 15;
	
	var currentOffset       = {x:0, y:0};
	var currentZoom         = 1.0;
	
	var xScale              = d3.scale.linear()
										.domain([0, width])
										.range([0, width]);
    
    var yScale              = d3.scale.linear()
										.domain([0, height])
										.range([0, height]);	
										
	var zoomScale           = d3.scale.linear()
										.domain([1,6])
										.range([1,10])
										.clamp(true);					
									
	// L'oggetto grafico che conterrà il grafo										
	var svg                 = d3.select("#forceChart").append("svg:svg")
													.attr('xmlns','http://www.w3.org/2000/svg')
													.attr("width", width)
													.attr("height", height)
													.attr("id","graph")
													.attr("viewBox", "0 0 " + width + " " + height)
													.attr("preserveAspectRatio", "xMidYMid meet");
													
	// Il pannello che contiene le informazioni sul brano selezionato													
	var infoBox             = d3.select("#trackInfo");			
	
	// Array che contiene i nodi del nostro grafo
	var nodeArray           = [];					
	
	// Array che contiene gli archi del nostro grafo
	var linkArray           = [];	
	
	// Il grafo
	var newtorkGraph        = {};
	
	// Gli oggetti grafici che rappresentano i nodi del grafo
	var graphNodes          = [];				 	
	
	// Gli oggetti grafici che rappresentano gli archi del grafo
	var graphLinks          = [];
	
	// Gli oggetti grafici che rappresentano le etichette dei nodi
	var graphLabels         = [];
	
	// L'oggetto che rappresenta il grafo
	var force               = d3.layout.force()
											//.charge(-320)
											.size( [width, height] )
											.linkStrength( function(d,idx) { return d.weight; } )
											.on("tick", function(){
												node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
											});												
	
	// La traccia selezionata
	var selectedTrack       = {};
	
	/* Fine variabili private */
	
	/* Inizio eventi */
	
	// Evento lanciato quando viene selezionata una traccia
	var trackChangedEvent   = {};
	
	// Evento lanciato quando cambiamo lo stato di visualizzazione del grafico
	var stateChangedEvent   = {};
	
	// Lancia l'evento relativo al cambio dello stato di visualizzazione del grafico
	function fireStateChanged(){
		stateChangedEvent = new CustomEvent('force.stateChanged', {
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
		trackChangedEvent = new CustomEvent('force.trackChanged', {
	        detail: {
	            'track': selectedTrack
	        },
	        bubbles: true,
	        cancelable: true
	    });
	    document.dispatchEvent(trackChangedEvent); // Lancio l'evento relativo alla selezione del brano
	}
	
	/* Fine eventi */
	
	/* Inizio funzioni private */
	
	// Recupera le dimensioni del viewport della finestra
	function getViewportSize( w ) {
		var w = w || window;
		if( w.innerWidth != null ) 
		  return { w: w.innerWidth, 
				   h: w.innerHeight,
				   x : w.pageXOffset,
				   y : w.pageYOffset 
				 };
		var d = w.document;
		if( document.compatMode == "CSS1Compat" )
		  return { w: d.documentElement.clientWidth,
				   h: d.documentElement.clientHeight,
				   x: d.documentElement.scrollLeft,
				   y: d.documentElement.scrollTop 
				 };
		else
		  return { w: d.body.clientWidth, 
				   h: d.body.clientHeight,
				   x: d.body.scrollLeft,
				   y: d.body.scrollTop
				 };
	}
	
	// Cambia lo stato di un pannello mostrandolo o nascondendolo
	//TODO: Avendo rimosso i pannelli extra questa funzione non serve, l'unico pannello che ho è quello con le info sul brano e quindi devo ripensarla
	function toggleDiv(id, status){
		var div = d3.select('div#'+id);
		if( status === undefined )
		  status = div.attr('class') == 'panel_on' ? 'off' : 'on';
		div.attr('class', 'panel_' + status);
		return false;
	}
	
	// Costruisce il codice HTML per  il pannello delle informazioni sul brano utilizzando i dati presi dall'oggetto n
	function getTrackInfo(n, nodeArray){
		var info = '<div id="cover">';
		if(n.artwork_url) // Inserisce la cover
		 	info += '<img class="cover" height="300" src="' + n.artwork_url + '" title="' + n.label + '"/>';
		else
			info += '<div class=t style="float: right">' + n.track_name + '</div>';
		// Inserisce le immagini per centrare il grafico e per chiudere il pannello
		//TODO: invece ti toggleDiv, visto che qua posso solo chiudere, metto una funzione che semplicemente nasconde il pannello
		info +=
		'<img src="charts/force/images/close.png" class="action" style="top: 0px;" title="close panel" onClick="toggleDiv(\'movieInfo\');"/>' +
		'<img src="charts/force/images/target-32.png" class="action" style="top: 280px;" title="center graph on movie" onclick="forceChart.selectTrack('+n.index+',true);"/>';
		info += '<br/></div><div style="clear: both;">';
		if(n.artist_name) // Inserisce il nome dell'artista
			info += '<div class=f><span class=l>Artista</span>: <span class=d>' + n.artist_name + '</span></div>';
		if(n.track_name) // Inserisce il nome della traccia
			info += '<div class=f><span class=l>Titolo</span>: <span class=c>' + n.track_name + '</span></div>';
		if(n.links) { // Genera e inserisce i links alle altre tracce collegate
		  info += '<div class=f><span class=l>Collegato con</span>: ';
		  n.links.forEach( function(idx) {
		      info += '[<a href="javascript:void(0);" onclick="forceChart.selectTrack('  
			  + idx + ',true);">' + nodeArray[idx].artist_name + " - " + nodeArray[idx].track_name + '</a>]';
		  });
		  info += '</div>';
		}
		return info;
	}
	
	// Gestisce l'evento di drag
	function forceDrag(d){
		offset = {x : currentOffset.x + d3.event.dx, y : currentOffset.y + d3.event.dy};
		repositionGraph(offset, undefined, 'drag');
	}
	
	// Gestisce l'evento di zoom
	function forceZoom(increment){
		newZoom = increment === undefined ? d3.event.scale : zoomScale(currentZoom+increment);
		if( currentZoom == newZoom )
			return;	// no zoom change
		// See if we cross the 'show' threshold in either direction
		if( currentZoom<show_threshold && newZoom>=show_threshold )
			svg.selectAll("g.label").classed('on',true);
		else if( currentZoom>=show_threshold && newZoom<show_threshold )
			svg.selectAll("g.label").classed('on',false);
		// See what is the current graph window size
		var s = getViewportSize();
		var newWidth  = s.w<width  ? s.w : width;
		var newHeight = s.h<height ? s.h : height;
    	// Compute the new offset, so that the graph center does not move
		zoomRatio = newZoom/currentZoom;
		newOffset = {x : currentOffset.x*zoomRatio + newWidth/2*(1-zoomRatio), y : currentOffset.y*zoomRatio + newHeight/2*(1-zoomRatio)};
		// Reposition the graph
		repositionGraph(newOffset, newZoom, "zoom");	
	}
	
	// Riposizione il grafo sul nuovo offset
	function repositionGraph(off, z, mode){
		// do we want to do a transition?
		var doTr = (mode == 'move');
		// drag: translate to new offset
		if(off !== undefined && (off.x != currentOffset.x || off.y != currentOffset.y)) {
			var g = d3.select('g.grpParent');
			if( doTr )
				var g = g.transition().duration(500);
			g.attr("transform", function(d) {return "translate("+off.x+","+off.y+")";});
			currentOffset.x = off.x;
			currentOffset.y = off.y;
		}
		// zoom: get new value of zoom
		if( z === undefined ) {
			if( mode != 'tick')
				return;	// no zoom, no tick, we don't need to go further
			z = currentZoom;
		  }
		else
			currentZoom = z;
		// move edges
		e = doTr ? graphLinks.transition().duration(500) : graphLinks;
		e.attr("x1", function(d) {return z*(d.source.x);})
		 .attr("y1", function(d) {return z*(d.source.y);})
		 .attr("x2", function(d) {return z*(d.target.x);})
		 .attr("y2", function(d) {return z*(d.target.y);});
		// move nodes
		n = doTr ? graphNodes.transition().duration(500) : graphNodes;
		n.attr("transform", function(d) {return "translate("+z*d.x+","+z*d.y+")";});
		// move labels
		l = doTr ? graphLabels.transition().duration(500) : graphLabels;
		l.attr("transform", function(d) { return "translate("+z*d.x+","+z*d.y+")";});	
	}
	
	// Evidenzia il brano selezionato
	function highlightGraphNode(node, on)
	{
		if(!node) return;
		// If we are to activate a movie, and there's already one active,
		// first switch that one off
		if( on && selectedTrack !== undefined ) {
		    highlightGraphNode( nodeArray[selectedTrack], false );
		}
		// locate the SVG nodes: circle & label group
		circle = d3.select( '#c' + node.index );
		label  = d3.select( '#l' + node.index );
	
        // activate/deactivate the node itself
		circle.classed( 'main', on );
		label.classed( 'on', on || currentZoom >= show_threshold );
		label.selectAll('text').classed( 'main', on );
		// activate all siblings
		Object(node.links).forEach( function(id) {
			d3.select("#c"+id).classed( 'sibling', on );
			label = d3.select('#l'+id);
			label.classed( 'on', on || currentZoom >= show_threshold );
			label.selectAll('text.nlabel').classed( 'sibling', on );
		});
		 // set the value for the current active movie
		 selectedTrack = on ? node.index : undefined;	  
	}
	
	// Mostra il pannello con le informazioni
	//TODO: questo dovrebbe essere sostituito dal pannello dell'header e quindi dovrebbe mostrare solo i link alle tracce collegate
	function showTrackPanel(node) {
		// Fill it and display the panel
		infoBox.html(getTrackInfo(node,nodeArray))
					.attr("class","panel_on");
	}
	
	/* Fine funzioni private */
	
	/* Inizio funzioni pubbliche */
	
	// Imposta la traccia come selezionata, evidenza il suo nodo e mostra il pannello con le informazioni
	grafico.selectTrack = function(new_idx, doMoveTo){
		// do we want to center the graph on the node?
		doMoveTo = doMoveTo || false;
		if( doMoveTo ) {
			s = getViewportSize();
			newWidth  = s.w<width ? s.w : width;
			newHeight = s.h<height ? s.h : height;
			offset = { x : s.x + newWidth/2  - nodeArray[new_idx].x*currentZoom,
			y : s.y + newHeight/2 - nodeArray[new_idx].y*currentZoom };
			repositionGraph( offset, undefined, 'move' );
		}
		// Now highlight the graph node and show its movie panel		
		highlightGraphNode(nodeArray[new_idx], true);
		showTrackPanel(nodeArray[new_idx]);
		fireTrackChanged();
	};
	
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
	
	// Imposta la traccia come selezionata
	grafico.setSelectedTrack = function(track){
		console.log(nodeArray);
		console.log(track);
		for(var index = 0; index<nodeArray.length; index++){
			var currentTrack = nodeArray[index];
			if(currentTrack.artist_name == track.artist_name && currentTrack.track_name == track.track_name){
				// Abbiamo trovato la traccia giusta
				grafico.selectTrack(index, true);
				selectedTrack = track;
				return;
			}
		}
	};
	
	// Se siamo in modalità mosaico devo rimuovere le trasformazioni dall'oggetto SVG
	grafico.toMosaic = function(){
		$("#sidepanel").fadeOut(250);	
		svg.transition().attr("transform", "translate(-330,-30) scale(0.8, 0.8)");	
	};
	
	// Se siamo in modalità intera devo aggiungere le trasformazioni dall'oggetto SVG
	grafico.toFull = function(){
		$("#sidepanel").fadeIn(250);
		svg.transition().attr("transform", "");
	};
	
	/* Fine funzioni pubbliche */
	
	/* Main */
	
	// La funzione principale da chiamare per disegnare il grafico.
	grafico.draw = function(){		
	    // Creo il grafo a partire dai dati sulla correlazione tra le tracce
	    d3.json("sample-data/track-links.json", function (error, data) {
	        // Definisco gli array dei nodi e degli archi
	        nodeArray = data.tracks;
	        linkArray = data.links;
	        // Calcolo il range degli streams, in modo da far dipendere le dimensioni dei nodi dal numero di ascolti della traccia
	        var streamsRange = d3.extent(data.tracks, function(el){
							       return el.num_streams;
							   });
			// Calcolo peso minimo e massimo degli archi
			minLinkWeight = Math.min.apply(null, linkArray.map(function(n) {return n.weight;}));
			maxLinkWeight = Math.max.apply(null, linkArray.map(function(n) {return n.weight;}));
			//Aggiungo nodi e archi al force layout e lo avvio
			force.nodes(nodeArray)
				  .links(linkArray)
				  .start();
			// Creo le funzioni per scalare il raggio dei nodi e la larghezza degli archi
			var node_size = d3.scale.linear()
									  .domain(streamsRange)	// usiamo il range degli streams calcolato prima
									  .range([25,50])
									  .clamp(true);
			var edge_width = d3.scale.pow()
									.exponent(8)
									.domain([minLinkWeight,maxLinkWeight])
									.range([1,3])
									.clamp(true);
			// Aggiungo la gestione del drag e dello zoom
			svg.call(d3.behavior.drag()
				  .on("drag", forceDrag));
			svg.call( d3.behavior.zoom()
				  .x(xScale)
				  .y(yScale)
				  .scaleExtent([1, 6])
				  .on("zoom", forceZoom) );		
			// Crea gli elementi da inserire nel layout (nodi e archi)							
			networkGraph = svg.append('svg:g')
									.attr('class','grpParent');
			// Archi
			graphLinks = networkGraph.append('svg:g').attr('class','grp gLinks')
										   .selectAll("line")
										   .data(linkArray)
										   .enter()
										   .append("line")
										   .style('stroke-width', function(d) {return edge_width(d.weight);})
										   .attr("class", "link");
			// Nodi
			graphNodes = networkGraph.append('svg:g').attr('class','grp gNodes')
										   .selectAll("circle")
										   .data( nodeArray, function(d){return d.track_name;})
										   .enter().append("svg:circle")
										   .attr('id', function(d) {return "c" + d.index;})
										   .attr('class', function(d) {return 'node level'+Math.round(Math.random()*10);})
										   .attr('r', function(d) {return node_size(d.num_streams);})
										   .attr('pointer-events', 'all')  										   
										   .on("click", function(d) {
										   		//showTrackPanel(d);
										   		console.log(d);
										   		selectedTrack = d;		
												fireTrackChanged();
										   	})
										   .on("mouseover", function(d) {highlightGraphNode(d,true,this);})
										   .on("mouseout",  function(d) {highlightGraphNode(d,false,this);});
			graphNodes.attr("class", "forceCircle");	//TODO: la classe non viene applicata e i cerchi restano tutti neri
			// Etichette
			graphLabels = networkGraph.append('svg:g')
											.attr('class','grp gLabel')
											.selectAll("g.label")
											.data( nodeArray, function(d){return d.track_name;} )
											.enter().append("svg:g")
											.attr('id', function(d) { return "l" + d.index; } )
											.attr('class','label');
	   
			shadows = graphLabels.append('svg:text')
									  .attr('x','-2em')
									  .attr('y','-.3em')
									  .attr('pointer-events', 'none') // they go to the circle beneath
									  .attr('id', function(d) { return "lb" + d.index; } )
									  .attr('class','nshadow')
									  .text( function(d) { return d.track_name; } );

			labels = graphLabels.append('svg:text')
								  .attr('x','-2em')
								  .attr('y','-.3em')
								  .attr('pointer-events', 'none') // they go to the circle beneath
								  .attr('id', function(d) { return "lf" + d.index; } )
								  .attr('class','nlabel')
								  .text( function(d) { return d.track_name; } );
								  
			// Avvio gli eventi relativi al force layout	
			force.on("tick", function() {
		    	repositionGraph(undefined,undefined,'tick');
			});									  
	    });
	};
	
	return grafico;
}
