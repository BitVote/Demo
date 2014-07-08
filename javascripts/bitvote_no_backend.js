//TODO unlike the name, it is currently actually used..

var var_from_time = 0;
function from_time()
{   return var_from_time; }

var participated = {};

//Pretends that a transactions, moving the vote-time forward by the amount sent.
function pretend_transact(vote_for, amount)
{  //Lol @ javascript dumb.
    participated[vote_for] = {'amount':amount, 'passed':false};
    var_from_time = from_time()/1 + amount/1;
}

//Pretends to actually spends the vote-time.
function do_spend_time(vote_for, amount)
{   
    if(amount < power_available())  // Have enough.
    {
        pretend_transact(vote_for, amount);
        update_progress();
    }
}

var bitvote_address = "TODO"; // bitvotes address to contact.
//secretToAddress(_a):
var own_address = "TODO";   //Own address.

function power_available()  // Amount of time available to spend.
{   return Math.floor(date.getTime()/1000 - from_time()); }

var var_registered = 0;
function registered()
{   return var_registered; }

function power_spent()
{   return from_time()/1 - registered()/1; }
