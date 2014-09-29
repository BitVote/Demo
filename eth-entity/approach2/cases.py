import pyethereum
from random import randrange
t = pyethereum.tester

# TODO.. all these convenience definitions are not well named and
#  not well located.

def i(str):
    s,f = 0, 1
    for i in range(len(str)):
        s += f*ord(str[len(str)-i-1])
        f *= 256
    return s

def stri(i):
    s=""
    while i > 0:
        s += chr(i%256)
        i /=256
    return "".join(reversed(s))

s = t.state()
c = s.contract('bitvote.se', t.k0)
c2 = s.contract('any_per_id.se', t.k0)  # TODO test of that alone.

def ae(a, b, cond=None, what="N/A"):
    if (a !=b if cond == None else not cond):
        print(map(hex,a), "vs", map(hex,b), ":", what)
        print('-', map(stri,a), "vs", map(stri,b), ":", what)        
        assert False

def store(index, contract=None):
    global c
    if contract == None:  # How the optional arguments worked bit me.
        contract = c      # (they work badly in Python)
    result = int(s.block.get_storage_data(contract, index))
    if contract == c:
        ae(s.send(t.k9, contract, 0, [i("account"), index]), [result],
           None, "store mismatch")
    return result

def i_store(index, contract=None):
    return int(store(index, contract))

def str_store(index, contract=None):
    return stri(store(index, contract))

def addr_store(index, contract=None):
    return hex(store(index, contract))[2:-1]

LARGE = 1152921504606846976

def non_exist_vote_count(j=None):
    if not j:
        j = (i_store(0x40) - 0x60)/224
    ae(s.send(t.k9, c, 0, [i("vote_count"), j]),
        [i("That topic doesnt exist yet.")],
        "getting vote count nonexistance failed.")

def non_exist_vote(j=None):
    if not j:
        j = (i_store(0x40) - 0x60)/224
    ae(s.send(t.k9, c, 0, [i("vote"), j, randrange(0,10)]),
       [i("That topic doesnt exist yet.")])

def expect_topic_count(n):
    ae([i_store(0x40)], [0x60 + 224*n])
    ae(s.send(t.k9, c, 0, [i("topic_count")]), [n])
    non_exist_vote(randrange(n, n+3))
    non_exist_vote_count(randrange(n, n+3))
    

def too_long_topic():
    ae(s.send(t.k9, c, 0, map(lambda i : i, range(224 + randrange(1,10)))),
       [i("too long topic string")])

def check():  # TODO this would be better with 'stateless call'
    # Smaller than large.
    ae(i_store(0x40), LARGE, i_store(0x40) < LARGE, "topic index unrealistic")
    # Thing that can happen in any case.
    non_exist_vote()
    non_exist_vote_count()
    too_long_topic()
    ae(s.send(t.k9, c, 0, [1, 2]), [i("anyone bad 1")])
    ae(s.send(t.k9, c, 0, [1, 2, 3]), [i("anyone bad 2")])
    ae(s.send(t.k9, c, 0, []), [i("anyone bad 3")])
    ae(s.send(t.k9, c, 0, [4]), [i("anyone bad 4")])

    # Ways you cannot set the one per ID.
    ae(s.send(t.k0, c, 0, []), [i("OnePerIDSet bad")])
    ae(s.send(t.k0, c, 0, [randrange(LARGE)]), [i("OnePerIDSet bad")])

def no_topics_yet():
    non_exist_vote_count(0)
    non_exist_vote(0)
    expect_topic_count(0)


def scenario_start():
    global c
    c = s.contract('bitvote.se', t.k0)
    check()
    ae(i_store(0x00), 0)
    assert addr_store(0x20) == t.a0
    ae(i_store(0x40), 0x60)
    no_topics_yet()

def initialize(have_topics=False):
    global c2
    c2 = s.contract('any_per_id.se', t.k0)
    # TODO check that it responds with "not initialized" when registering.
    assert addr_store(0, c2) == t.a0
    # Gives himself full power, the bastard.
    ae(s.send(t.k0, c, 0, [c2, t.a0]), [i("changed!")])
    assert addr_store(0x20) == t.a0
    assert addr_store(0x00) == c2
    check()
    for x in [[1,2], []]:
        ae(s.send(t.k0, c2, 0, x), [i("initializer bad")])
    ae(s.send(t.k0, c2, 0, [c]), [i("initialized")])
    assert i_store(0, c2) == 0
    
    if not have_topics:
        no_topics_yet()

def add_topic(string=None):
    if string == None:
        string = ""
        for j in range(randrange(20)):
            string += ["herp", "derp", "blurb", "bla"][randrange(4)]
    args = []
    while string != "":
        args.append(i(string[:32]))
        string = string[32:]
    while len(args) <= 3:
        args.append(i(""))
    
    j = i_store(0x40)
    if len(args) > 6:
        ae(s.send(t.k2, c, 0, args), [i("too long topic string")])
        assert i_store(0x40) == j  # Cant have added it anyway.
    elif len(args) > 3:
        ae(s.send(t.k2, c, 0, args), [i("topic set")])
        assert i_store(0x40) == j + 224   # Must have indeed moved forward.
        #TODO check message itself.
    else:
        print("na", len(args))
    check()

def scenario_create_topics(init_first=False):  # TODO has to work with `False` too.
    scenario_start()
    init_first = randrange(2)==1 if init_first == None else init_first
    if init_first:
        initialize()  # TODO first adding topics, then intializing?
    n = randrange(1,5)
    for j in range(n):
        expect_topic_count(j)
        add_topic()
    
    if not init_first:
        initialize(True)

    expect_topic_count(n)
    return n

def scenario_register():
    n = scenario_create_topics()
    ae(s.send(t.k2, c2, 0, []), [i("registered")])
    # TODO check timestamp on the account.
    check()
    return n

def scenario_vote():
    n = scenario_register()
    j = randrange(n)
    ae(s.send(t.k2, c2, 0, [i("vote"), j, 60]), [i("cannot spend more than you have")])
    s.mine(100)  # Get some time. TODO test not independent on block time right now.
    ae(s.send(t.k2, c2, 0, [i("vote"), j, 60]), [i("voted")]) # Vote 60s.
    #TODO

scenario_register()
