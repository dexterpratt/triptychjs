<?php
$psicquic_base = "http://www.ebi.ac.uk/Tools/webservices/psicquic/intact/webservices/current/search/query/";

if(isset($_REQUEST['name'])){
	$name = $_REQUEST['name'];
} else {
	$name = "BRCA2";
} 

$query_url = $psicquic_base . $name . "?format=xgmml";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $query_url);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$xml = curl_exec($ch);
curl_close($ch);

echo $xml;
?>