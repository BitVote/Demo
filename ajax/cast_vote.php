<?php include_once('../bitvote.php');

function cast_vote($url, $usr_id, $time_spent, $time_reg){

	// check if user exists (if not, create user)
	// check if url exists (if not, create url)
	// add vote

	if (($con=connect_db('../auth.txt'))){
		$result = pg_prepare($con, "check_user", 'SELECT * FROM users where id = $1');
		$result = pg_execute($con, "check_user", array($usr_id));
		$usr_entry = pg_fetch_array($result);

		if (!$usr_entry){
			// create user, dock spent
		}
		else{
			// update user, dock spent
		}
		/*
		$id = $usr_entry[0];
		$spent = $usr_entry[1];
		$reg = $usr_entry[2];

		echo json_encode(array("usr"=>$id, "spent"=>$spent, "reg"=>$reg, "b"=>$b));
		*/
		$result = pg_prepare($con, "check_url", 'SELECT * FROM votes where url = $1');
		$result = pg_execute($con, "check_user", array($url));
		$url_entry = pg_fetch_array($result);
		
		if (!$url_entry){
			//create url entry, add vote time
		}
		else{
			//update vote time
		}


	}

}





cast_vote($_POST['url'], $_POST['usr_id'], $POST['time_spent'], $_POST['time_reg']);
?>
