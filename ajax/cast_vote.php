<?php include_once('../bitvote.php');

function cast_vote($url, $usr_id, $time_spent, $time_reg){
	// check if user exists (if not, create user)
	// check if url exists (if not, create url)
	// add vote
	if (($con=connect_db('../auth.txt'))){
		$result = pg_prepare($con, "check_user", 'SELECT * FROM users where id = $1');
		$result = pg_execute($con, "check_user", array($usr_id));
		$usr_entry = pg_fetch_array($result);
		pg_free_result($result);
		if (!$usr_entry){
			$result = pg_prepare($con, "register_user", 'INSERT INTO users VALUES ($1, $2, $3)');
			$result = pg_execute($con, "register_user", array($usr_id, $time_spent, $time_reg));
			pg_free_result($result);
		}
		else{
			$time_already_spent = $usr_entry[1];	
			$new_time_spent = $time_already_spent + $time_spent;
			$result = pg_prepare($con, "update_user", 'UPDATE users SET time_spent=$2 WHERE id=$1');
			$result = pg_execute($con, "update_user", array($usr_id, $new_time_spent));
			pg_free_result($result);
		}
		$result = pg_prepare($con, "check_url", 'SELECT * FROM votes where url = $1');
		$result = pg_execute($con, "check_url", array($url));
		$url_entry = pg_fetch_array($result);
		pg_free_result($result);	
		if (!$url_entry){
			//create url entry, add vote time
			$result = pg_prepare($con, "register_url", 'INSERT INTO votes VALUES ($1, $2)');
			$result = pg_execute($con, "register_url", array($url, $time_spent));
			pg_free_result($result);
		}
		else{
			//update vote time
			$vote_count = $url_entry[1];	
			$new_count = $vote_count + $time_spent;
			$result = pg_prepare($con, "update_votes", 'UPDATE votes SET votes=$2 WHERE url=$1');
			$result = pg_execute($con, "update_votes", array($url, $new_count));
			pg_free_result($result);
		}
		$id = $usr_entry[0];
		$spent = $usr_entry[1];
		$reg = $usr_entry[2];
		echo json_encode(array("usr"=>$id, "spent"=>$time_spent, "reg"=>$reg, "url"=>$url));

	}

}

cast_vote($_POST['url'], $_POST['usr_id'], $_POST['time_spent'], $_POST['time_reg']);
?>
