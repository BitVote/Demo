import pyethereum
from random import randrange
t = pyethereum.tester

# TODO.. all these convenience definitions are quite rough..

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

def ae(a, b, cond=None, what="N/A"):
    if (a !=b if cond == None else not cond):
        print(map(hex,a), "vs", map(hex,b), ":", what)
        print('-', map(stri,a), "vs", map(stri,b), ":", what)        
        assert False

def store(index, contract=c):
    result = int(s.block.get_storage_data(contract, index))
    if contract == c:
        ae(s.send(t.k9, contract, 0, [i("account"), index]), [result],
           None, "store mismatch")
    return result

def i_store(index, contract=c):
    return int(store(index, contract))

def str_store(index, contract=c):
    return stri(store(index, contract))

def addr_store(index, contract=c):
    return hex(store(index, contract))[2:-1]

def reset():
    global c,s
    s = t.state()
    c = s.contract('bitvote.se', t.k0)

LARGE = 1152921504606846976

def non_exist_vote_count(j=None):
    if not j:
        j = (i_store(0x40) - 0x60)/224
    ae(s.send(t.k9, c, 0, [i("vote_count"), j]),
        [i("That topic doesnt exist yet.")], "getting vote count nonexistance failed.")

def non_exist_vote(j=None):
    if not j:
        j = (i_store(0x40) - 0x60)/224
    ae(s.send(t.k9, c, 0, [i("vote"), j, randrange(0,10)]), [i("That topic doesnt exist yet.")])

def too_long_topic():
#    list = 0
#    for i in range(224 + randrange(1,10)):
#        list.append("bla")
    ae(s.send(t.k9, c, 0, map(lambda i : i, range(224 + randrange(1,10)))),
       [i("too long topic string")])

# def not_registered(addr):
#    s.send(addr, [i("vote"),

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

    # Ways you cannot set the one per ID.
    ae(s.send(t.k0, c, 0, []), [i("OnePerIDSet bad")])
    ae(s.send(t.k0, c, 0, [randrange(LARGE)]), [i("OnePerIDSet bad")])

def no_topics_yet():
    non_exist_vote_count(0)
    non_exist_vote(0)

def start():
    reset()
    check()
    ae(i_store(0x00), 0)
    assert addr_store(0x20) == t.a0
    ae(i_store(0x40), 0x60)
    no_topics_yet()

c2 = s.contract('any_per_id.se', t.k0)  # TODO test of that alone.

def initialize():
    start()
    c2 = s.contract('any_per_id.se', t.k0)
    assert addr_store(0, c2) == t.a0
    # Gives himself full power, the bastard.
    ae(s.send(t.k0, c, 0, [c2, t.a0]), [i("changed!")])
    assert addr_store(0x00) == c2 and addr_store(0x20) == t.a0
    check()
    for x in [[1,2], []]:
        ae(s.send(t.k0, c2, 0, x), [i("initializer bad")])
    ae(s.send(t.k0, c2, 0, [c]), [i("initialized")])
    assert i_store(0, c2) == 0
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
    
    j = i_store(0x40)
    if len(args) > 224 - 0x20:
        ae(s.send(t.k2, c, 0, args), ["too long topic string"])
        assert i_store(0x40) == j  # Cant have added it anyway.
        check()
    elif len(args) > 3:
        ae(s.send(t.k2, c, 0, args), ["topic set"])
        assert i_store(0x40) == j + 224   # Must have indeed moved forwar.d
        check()
    #else: # Could be any of the other commands.

initialize()
add_topic()
