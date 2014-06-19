<?php 

function connect_db($path){
  $db_name = 'bitvotedb'; 
  // use the @ to suppress php/psql error message
  $lines = file($path);
  $master_usr = $lines[0];
  $master_pwd = $lines[1];
        
  $con = @pg_connect("host=localhost dbname=$db_name user=$master_usr password=$master_pwd");    
  return $con;
}

function pad($topad, $n){
  $resp = strval($topad);
  $len = strlen($resp);
  while ($len < $n){
    $resp = "0" . $resp;
    $len ++;
  }
  return $resp;
}


function seconds_to_time($seconds){
  $hours = (int) ($seconds / 3600);
  $minutes = (int) (($seconds - $hours * 3600)/60);
  $seconds = $seconds - $minutes*60 - $hours*3600;
  return pad($hours, 2) . ":" . pad($minutes, 2) . ":" . pad($seconds, 2);
}

function list_vote_chain(){
  echo "\n";
  if (($con = connect_db('auth.txt'))){
	$sql = "SELECT * FROM votes";
	$result = pg_query($con, $sql);
	while($row = pg_fetch_array($result)){
	  $url = $row[0];
	  $time = $row[1]; // convert to time format
	  $time_str = seconds_to_time($time);
	  echo "$time_str <a href='http://$url'>http://$url</a>\n";
	}
  }
}

function get_users_ip(){
  echo htmlspecialchars($_SERVER['REMOTE_ADDR']);
}

?>
