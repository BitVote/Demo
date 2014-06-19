
function new_request() {
    if (window.XMLHttpRequest)
        return new XMLHttpRequest();
    else
        return new ActiveXObject("Microsoft.XMLHTTP");
}

function lookup_user(usr_id, cur_time){
    xmlhttp = new_request();
    xmlhttp.onreadystatechange=function(){
        if (xmlhttp.readyState==4 && xmlhttp.status==200){
	    usr_details = JSON.parse(xmlhttp.responseText);
	    console.log(usr_details);
	    spent_time = usr_details['spent'];
	    reg_time = usr_details['reg'];
	    update_power_time();
	    create_increment_buttons();
	    periodic_interrupt();
        }
    }
    var query_string = "usr_id="+encodeURIComponent(usr_id)+"&cur_time="+encodeURIComponent(cur_time);
    xmlhttp.open("POST", "ajax/lookup_user.php", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.setRequestHeader("Content-length", query_string.length);
    xmlhttp.send(query_string);
    return false;

}

function cast_vote(url, spent, usr_id){
    xmlhttp = new_request();
    xmlhttp.onreadystatechange=function(){
        if (xmlhttp.readyState==4 && xmlhttp.status==200){
		console.log(xmlhttp.responseText);
		response = JSON.parse(xmlhttp.responseText);
		spent = parseInt(response['spent']);
		spent_time = parseInt(spent_time) + spent;
		participated[response['url']] = {'amount':spent, 'passed':false};
		update_progress();
		
        }
    }
    var query_string = "url="+encodeURIComponent(url)+"&usr_id="+encodeURIComponent(usr_id)+"&time_spent="+encodeURIComponent(spent)+"&time_reg="+encodeURIComponent(reg_time);
    xmlhttp.open("POST", "ajax/cast_vote.php", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.setRequestHeader("Content-length", query_string.length);
    xmlhttp.send(query_string);
    return false;
}
