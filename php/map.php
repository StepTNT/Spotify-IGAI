<?php

	$username = "root";
	$password = "";
	$host = "localhost";
	$database = "analisi_immagini";
	
	$mysqli = new mysqli($host, $username, $password, $database);
	
	if($mysqli->connect_error){
		die("Connect error (" . $mysqli->connect_errorno . ")" .$mysqli->connect_error);
	}
	
	$state = (isset($_GET["state"])) ? $_GET["state"] : 1;
	$query = "";
	if($state == 1){
		//Stato 1
		$country = (isset($_GET["country"])) ? $_GET["country"] : "gl";
		$date = (isset($_GET["date"])) ? $_GET["date"] : "max";
		if($date == "max"){
			$query = "(SELECT * 
					FROM chart as c1
					INNER JOIN (
						SELECT countryId, max(plays) as num_streams
						FROM chart
						where date in (select max(date) from chart)
						GROUP BY (countryId)
					) as c2
					INNER JOIN (
						SELECT uri as track_url, artist as artist_name, title as track_name, album as album_name, artwork as artwork_url
						FROM track
					) as t
					ON c1.countryId = c2.countryId
					and c1.plays = num_streams
					and t.track_url = c1.trackUri
					WHERE c1.countryId <> 'gl'
					ORDER BY c1.countryId desc)";
		} else {
			$query = "(SELECT * 
					FROM chart as c1
					INNER JOIN (
						SELECT countryId, max(plays) as num_streams
						FROM chart
						where date = '" . $date . "'
						GROUP BY (countryId)
					) as c2
					INNER JOIN (
						SELECT uri as track_url, artist as artist_name, title as track_name, album as album_name, artwork as artwork_url
						FROM track
					) as t
					ON c1.countryId = c2.countryId
					and c1.plays = num_streams
					and t.track_url = c1.trackUri
					WHERE c1.countryId <> 'gl'
					ORDER BY c1.countryId desc)"; 
		}
	} else {
		//Stato 2
		$trackUri = (isset($_GET["trackUri"])) ? $_GET["trackUri"] : "null";
		$query = "select t.uri as track_url, artist as artist_name, title as track_name, countryId, sum(plays) as num_streams
					from chart c, track t
					where c.trackUri = \"" . $trackUri . "\" and countryId <> 'gl' and c.trackUri = t.uri
					group by countryId";
	}		
	
	$result = $mysqli->query($query);
	$res = "[";
	$rows = $result->fetch_all(MYSQLI_ASSOC);
	foreach($rows as $row){
		$res .= json_encode($row) . ",";
	}	
	$res .= "]";
	echo str_replace(",]", "]", str_replace(",,", ",", $res));
?>