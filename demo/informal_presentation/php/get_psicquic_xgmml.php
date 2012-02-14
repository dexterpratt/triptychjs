<?php
$psicquic_base = "http://www.ebi.ac.uk/Tools/webservices/psicquic/intact/webservices/current/search/query/";

if(isset($_REQUEST['name'])){
	$name = $_REQUEST['name'];
} else {
	$name = "E2F4";
} 

// check in cache

$cache_directory = "./cache/";

$cache_file = $cache_directory . $name . ".xgmml";

if (file_exists($cache_file)){
	$xml= file_get_contents($cache_file);
} else {
	$query_url = $psicquic_base . $name . "?format=xgmml";
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $query_url);
	curl_setopt($ch, CURLOPT_HEADER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$xml = curl_exec($ch);
	curl_close($ch);
	
	$output = fopen($cache_file, "w");
	fwrite($output, $xml);
	fclose($output);
}

echo $xml;
?>