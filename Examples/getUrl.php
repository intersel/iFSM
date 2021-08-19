<?php
$homepage = file_get_contents('https://query1.finance.yahoo.com/v7/finance/chart/rwlk?range=2y&interval=1d&indicators=quote&includeTimestamps=true');
echo $homepage;
