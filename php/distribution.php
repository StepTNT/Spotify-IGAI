<?php

	$username = "root";
	$password = "";
	$host = "localhost";
	$database = "analisi_immagini";
	
	$mysqli = new mysqli($host, $username, $password, $database);
	
	if($mysqli->connect_error){
		die("Connect error (" . $mysqli->connect_errorno . ")" .$mysqli->connect_error);
	}
		
	//Stato 1
	$query = "";
	$country = (isset($_GET["country"])) ? $_GET["country"] : "GL";
	$date = (isset($_GET["date"])) ? $_GET["date"] : "max";
	if($date == "max"){
		$query = "SELECT concat(artist, ' - ', title) as 'key', artwork, popularity, plays, shares, uri
				FROM chart c, track t
				WHERE date in (select max(date) from chart)
				and countryID = '" . $country . "'
				and c.trackUri = t.uri";
	} else {
		$query = "SELECT concat(artist, ' - ', title) as 'key', artwork, popularity, plays, shares, uri
				FROM chart c, track t
				WHERE date = \"" . $date . "\"
				and countryID = '" . $country . "'
				and c.trackUri = t.uri";
	}
	$result = $mysqli->query($query);
	$res = "[";
	$rows = $result->fetch_all(MYSQLI_ASSOC);
	foreach($rows as $row){		
		$res .= "{ \"key\": \"" . $row['key'] . "\", \"artwork\": \"" . $row['artwork'] . "\", \"track_url\": \"" . $row['uri'] . "\", ";
		$res .= "\"values\": ["; 
		$res .= "{ \"x\" : " . $row['plays'] . ", \"y\" :" . $row['shares'] . ", \"size\": " . $row['popularity'] . ", \"shape\": \"circle\"} ]},";
	}	
	$res .= "]";
	echo "\n" . str_replace(",]", "]", str_replace(",,", ",", $res));		
		
?>