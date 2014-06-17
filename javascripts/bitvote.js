//Note; just mucked up for now.


var date = new Date();

var elements = {}

function ge(element_id)  // Assumes ids do not get added afterwards!
{  got = elements[element_id]
   if(got == null)
   { element = document.getElementById(element_id);
     if(element == null)
     { elements[element_id] = 'none'; }
     else
     { elements[element_id] = element
       got = element;
     }
   }
   else if(got == 'none')
   { return null; }
   return got
}

function ge_set_innerHTML(element_id, innerHTML, className)
{ got = ge(element_id)
  if( got!=null )
  { if(innerHTML != null){ got.innerHTML = innerHTML; }
    if(className != null){ got.className = className; }
  }
}

var spend_time  = document.getElementById("spend_time");
var spend_addr  = document.getElementById("spend_addr");

var amount_note     = document.getElementById("amount_note");
var spend_addr_note = document.getElementById("spend_addr_note");

var increment_buttons_p = false;
var increment_buttons = [["+1min", 60], ["+10min", 600], ["+1hour", 3600], 
                         ["+1day", 86400], ["+1month", 2592000]]

function to_time_string(t, upto)
{
    s  = Math.floor(t);
    m  = Math.floor(s/60);
    h  = Math.floor(m/60);
    d  = Math.floor(h/24);

    s = (s%60).toString();
    m = (m%60).toString();
    h = (h%24).toString();
    if( s.length == 1 ){ s = '0' + s; }
    if( m.length == 1 ){ m = '0' + m; }
    if( h.length == 1 ){ h = '0' + h; }
    
    str = d + ' days, ' + h + ':' + m + ':' + s;
    return str;
}

function update_power_time()
{   
    date = new Date();
    registered_date = new Date(1000*registered())
    ge_set_innerHTML("register_time", registered_date.toLocaleString());
    ge_set_innerHTML("power_time",    to_time_string(power_available()));
    ge_set_innerHTML("spent_time",    to_time_string(power_spent()));
    ge_set_innerHTML("current_time",  date.toLocaleString());
}

function notition(element, className, innerHTML)
{
    element.innerHTML = innerHTML;
    element.className = className;
}


var old_spend_val = 0;
var wrong_cnt = 0, wait_time = 4;
function update_spend_time_wrong_amount(which)
{
    notition(amount_note, 'wrong', which);
    if( !ge('spend_time_show').hidden )
    { spend_time.value = old_spend_val; }
    wrong_cnt = wait_time;
}

function update_spend_time()
{     
    update_power_time();

    if( spend_time.value == 0 && spend_time.value!='0' )  //TODO get something decent.
    { return update_spend_time_wrong_amount('Not a number'); }
    else if( spend_time.value < 0 )  // Reset stuff that is disallowed.
    { return update_spend_time_wrong_amount('Negative disallowed'); }
    else if( spend_time.value > power_available() )
    { return update_spend_time_wrong_amount('Dont have that much'); }
    else if( wrong_cnt <= 0 )
    { pct = (100*spend_time.value/power_available()).toString().substr(0,4)
      notition(amount_note, 'note', '(' + pct + '%)');
      old_spend_val = spend_time.value;
    }
    else{ wrong_cnt -= 1; }  // Countdown to zero.
    ge_set_innerHTML('spend_time_show', to_time_string(spend_time.value));
    if( increment_buttons_p )
    {   t = power_available()/1 - spend_time.value/1;
        for(var i = 0 ; i< increment_buttons.length ; i++)
        {  if( t < increment_buttons[i][1] ) // Not enough for adding this much.
           { ge_set_innerHTML(increment_buttons[i][0], null, 'grey_button'); }
           else
           { ge_set_innerHTML(increment_buttons[i][0], null, ''); }
        }
    }
}

function update_spend_addr()
{
    update_power_time();
    if( spend_addr.value == '' )
    { notition(spend_addr_note, 'hint', 'Needs recipient'); }
    else if( participated[spend_addr.value] == null )
    { notition(spend_addr_note, 'note', '(ok)'); }
    else
    { notition(spend_addr_note, 'wrong', 'Already voted for'); }
}

function spend_time_button()
{
    if( spend_addr.value == '' )  // Voting to nothing makes no sense.
    {   spend_addr_note.className = 'wrong';
        return; 
    }
    if( spend_time.value == 0 ) //Cannot spend zero amount.
    {   return update_spend_time_wrong_amount('Cannot spend zero vote-time'); }

    update_spend_time();

    // TODO check:
    // * validity of address? (though suppose Ethereum might implement it)
    // * against accidental repeat?
    // * against spending limit of topic?
    if( participated[spend_addr.value] == null )
    { do_spend_time(spend_addr.value, spend_time.value); }
    spend_time.value = '0' ; //Reset the amount.
    spend_addr.value = '';
    update_spend_addr();
}

function update_progress()
{
    progress_innerHTML = '';
    passed_innerHTML = '';
    for(var key in participated)
    {
        obj = participated[key];
        if( obj.passed )
        {    passed_innerHTML += '<tr><td>' + key + '</td><td>' +
                                  to_time_string(obj.amount) + '</td></tr>'; }
        else
        {    progress_innerHTML += '<tr><td>' + key + '</td><td>' + 
                                   to_time_string(obj.amount) + '</td></tr>'; }
    }
    if( passed_innerHTML != '' )
    {   ge_set_innerHTML("passed",
                         '<h4>Votes arrived</h4><table>' + passed_innerHTML + '</table>');
    }
    if( progress_innerHTML != '' )
    {   ge_set_innerHTML("progress",
                         '<h4>Votes underway</h4><table>' + progress_innerHTML + '</table>');
    }
}

function voting(which)
{
    document.getElementById("voting_whole").hidden = which;
    document.getElementById("registering_whole").hidden = !which;
}

var interrupt_interval = 1000;
function periodic_interrupt()
{   
    update_spend_time();
    setTimeout(periodic_interrupt, interrupt_interval);
}

function create_increment_buttons()
{
    element = document.getElementById("increment_buttons");
    if( element!=null )
    {   increment_buttons_p = true;
        string = "";
        for(var i = 0 ; i< increment_buttons.length ; i++)
        {  info = increment_buttons[i];
           string += '<button id="' + info[0];
           string += '" onclick="add_amount(' + info[1] + ')">'
           if(info.length == 2)
           {  string += info[0]; }
           else
           {  string += info[2]; }
           string += '</button>';
        }
        element.innerHTML = string;
    }
}

function register()
{   var_from_time = date.getTime()/1000;
    var_registered = var_from_time;
    voting(false);
    update_power_time();
    create_increment_buttons();
    
    periodic_interrupt();
}

voting(from_time() == 0);
spend_time.value= old_spend_val;

// Buttons!

//Add amounts.
function add_amount(amount)
{   spend_time.value = spend_time.value/1 + amount;
    update_spend_time();
}


var cur_fraction = 0;  //Fractions that rotate/
function rotating_button_to_fraction()
{   fractions = [10, 25, 50, 100];

    spend_time.value = Math.round(fractions[cur_fraction]*power_available()/100);
    cur_fraction += 1;
    if(cur_fraction > fractions.length - 1)
    {  cur_fraction = 0; }
    text = 'to ' + fractions[cur_fraction] + '%';
    if( text == 'to 100%' ){ text = 'ALL'; }
    ge_set_innerHTML("to_fraction", text);
    update_spend_time();
}

function toggle_manual()
{
    spend_time.hidden = !spend_time.hidden;
    show = ge('spend_time_show');
    show.hidden = !spend_time.hidden;
    if( show.hidden ){ ge_set_innerHTML('toggle_manual', '&rarr;Show'); }
    else{ ge_set_innerHTML('toggle_manual', '&rarr;Manual'); }
}

update_spend_addr();
