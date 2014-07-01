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
	$query = "SELECT artwork as Artwork, popularity as Popularity, 0 as Aperture, plays as Plays, shares as Shares, date as DateTimeOriginal, artist as Artist, title as Track
			 FROM chart c, track t
			 WHERE date in (select max(date) from chart)
			 and countryID = '" . $country . "'
			 and c.trackUri = t.uri";
	$result = $mysqli->query($query);
	$res = "[";
	$rows = $result->fetch_all(MYSQLI_ASSOC);
	foreach($rows as $row){		
		$res .= json_encode($row) . ",";
	}	
	$res .= "]";
	echo "\n" . str_replace(",]", "]", str_replace(",,", ",", $res));		
		
?>