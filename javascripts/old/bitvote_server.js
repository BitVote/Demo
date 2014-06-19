// 'Middle end' between the backend and front end.
// Basically, the thing that talks to Ethereum, or in the PoC versions,
// whatever we use there.

// NOTE: really inconvenient without good state-of-blockchain tracking.
//Has a 'server backend.

function new_request() {
    if (window.XMLHttpRequest)
        return new XMLHttpRequest();
    else
        return new ActiveXObject("Microsoft.XMLHTTP");
}

// * POST when writing to database, GET when reading
// * 
function httprequest(what, state_change, send, how) {
    if( how == null ) {
        if( send == null ) 
            how = "GET";
        else
            how = "PUT";
    }
    xmlhttp = new_request();
    xmlhttp.open(how, "ajax/" + what, true, state_change);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send);   
}

var var_from_time = 0;
var var_registered = 0;

function get_state() {
    httprequest("TIME_AND_REGISTERED", function() {
    if (xmlhttp.readyState === 4){
        list = xmlhttp.responseText.split(','); 
        var_from_time  = list[0]/1;  //(/1 stupid destringify)
        var_registered = list[1]/1;
    }})
}

var participated = {}; // Note; probably stuffing these in a cookie?

function transact(vote_for, amount)
{  
    participated[vote_for] = {'amount':amount, 'passed':false};
    httprequest("SENDVOTE", null, vote_for + ' ' + amount);

    var_from_time = from_time()/1 + amount/1;
}

function from_time()
{   return var_from_time; }

function registered()
{   return var_registered; }

//Pretends to actually spends the vote-time.
function do_spend_time(vote_for, amount)
{   
    if(amount < power_available())  // Have enough.
    {
        transact(vote_for, amount);
        update_progress();
    }
}

var bitvote_address = "TODO"; // bitvotes address to contact.
//secretToAddress(_a):
var own_address = "TODO";   //Own address.

/*
function power_available()  // Amount of time available to spend.
{   return Math.floor(date.getTime()/1000 - from_time()); }

function power_spent()
{   return from_time()/1 - registered()/1; }
*/
