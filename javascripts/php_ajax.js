	  //echo "$time_str <a href='http://$url'>http://$url</a>\n";

function new_request() {
    if (window.XMLHttpRequest)
        return new XMLHttpRequest();
    else
        return new ActiveXObject("Microsoft.XMLHTTP");
}

function register_callback(xmlhttp, _func){
    xmlhttp.onreadystatechange=function(){
        if (xmlhttp.readyState==4 && xmlhttp.status==200){
		var res = JSON.parse(xmlhttp.responseText);
		_func(res);
        }
    }
}

function make_request(xmlhttp, method, path, async, params){
    xmlhttp.open(method, path, async);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var s = "", i = 0;
    for (var k in params){
        if (i > 0)
          s += "&";
        s += k+"="+encodeURIComponent(params[k]);
        i++;
    }
    //xmlhttp.setRequestHeader("Content-length", s.length);
    xmlhttp.send(s);
}


function lookup_user(usr_id, cur_time){
    xmlhttp = new_request();
    register_callback(xmlhttp, _lookup_user);
    make_request(xmlhttp, "POST", 'ajax/lookup_user.php', true, {"usr_id":usr_id, "cur_time":cur_time});
    return false;
}

function cast_vote(url, spent, usr_id){
    xmlhttp = new_request();
    register_callback(xmlhttp, _cast_vote);
    make_request(xmlhttp, "POST", 'ajax/cast_vote.php', true, {"url":url, "usr_id":usr_id, "time_spent":spent, "time_reg":reg_time});
    return false;
}
