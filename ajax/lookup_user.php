<?php include_once('../bitvote.php');

function lookup_user($usr_id, $cur_time){
	// check if user exists (if not, create user)
	// check if url exists (if not, create url)
	// add vote
	if (($con=connect_db('../auth.txt'))){
		$result = pg_prepare($con, "check_user", 'SELECT * FROM users where id = $1');
		$result = pg_execute($con, "check_user", array($usr_id));
		$usr_entry = pg_fetch_array($result);
		pg_free_result($result);
		if (!$usr_entry){
			$result = pg_prepare($con, "reg_user", 'INSERT INTO users VALUES ($1, $2, $3)');
			$result = pg_execute($con, "reg_user", array($usr_id, 0, (int)$cur_time));
			pg_free_result($result);

			$id = $usr_id;
			$spent = 0;
			$reg = $cur_time;
		}
		else{
			$id = $usr_entry[0];
			$spent = $usr_entry[1];
			$reg = $usr_entry[2];
		}
		echo json_encode(array("usr"=>$id, "spent"=>$spent, "reg"=>$reg));

	}
	else
		echo json_encode(array("fuck"=>"nuts"));

}

lookup_user($_POST['usr_id'], $_POST['cur_time']);
?>
