<?php
$ch = curl_init("http://localhost:8000/events/stream");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
// timeout so it doesn't hang forever
curl_setopt($ch, CURLOPT_TIMEOUT, 3);
$res = curl_exec($ch);
echo "Response:\n";
echo $res;
