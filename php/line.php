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
	$count = 0;
	//Stato 1
	$country = (isset($_GET["country"])) ? $_GET["country"] : "GL";
	$query = "select distinct c1.trackUri
			  from chart c1
			  inner join (
				select *
				from chart c2, track t2
				where c2.countryId = '" . $country . "' and t2.uri = c2.trackUri
				order by c2.plays desc
			  ) as top
			  on c1.trackUri = top.trackUri
			  limit 50";
	$result = $mysqli->query($query);
	$res = "[";
	$rows = $result->fetch_all(MYSQLI_ASSOC);
	foreach($rows as $row){		
		$newQuery = "select * from chart c, track t
					 where t.uri = '" . $row['trackUri'] .  "'
					 and c.countryId = 'GL'
					 and c.trackUri = t.uri
					 group by date";
		// Ci sono casi in cui esistono brani uguali ma con nome leggermente diverso, e uno dei duplicati non ha abbastanza dati per mostrare il grafico, quindi li filtro manualmente
		$newResult = $mysqli->query($newQuery);			
		if(mysqli_num_rows($newResult) > 1){
			$newRows = $newResult->fetch_all(MYSQLI_ASSOC);
			$res .= "{";
			$res .= "\"key\": \"" . $newRows[0]['artist'] . " - " . $newRows[0]['title'] . "\",";
			$res .= "\"values\": [";
			foreach($newRows as $newRow){
				$res .= "{";
				$res .= "\"x\":\"" . $newRow['date'] . "\",";
				$res .= "\"y\":\"" . $newRow['plays'] . "\"";
				$res .= "},";
			}
			$res .= "],";
			$res .= "\"artwork\": \"" . $newRows[0]['artwork'] . "\"},";
			$count += 1;
			//$res .= json_encode($row) . ",";	
		}
		if($count == 5) break;
	}	
	$res .= "]";
	echo "\n" . str_replace(",]", "]", str_replace(",,", ",", $res));		
		
?>