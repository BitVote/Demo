import pyethereum
from random import randrange
t = pyethereum.tester

s = t.state()
c2 = s.contract('bitvote.se', t.k0)
c = s.contract('any_per_id.se', t.k0)

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

def ae(a, b, cond=None, what="N/A"):
    if (a !=b if cond == None else not cond):
        print(map(hex,a), "vs", map(hex,b), ":", what)
        print('-', map(stri,a), "vs", map(stri,b), ":", what)        
        assert False

def store(index, contract=c):
    return int(s.block.get_storage_data(contract, index))

def i_store(index, contract=c):
    return int(store(index, contract))
#ret = s.send(t.k0, c, 0, ["derp"])
#print(ret)
#print(map(stri, ret))

for x in [[1,2], []]:
    ae(s.send(t.k0, c, 0, x), [i("initializer bad")])
ae(s.send(t.k0, c, 0, [c]), [i("initialized")])
assert i_store(0, c) == 0

ret = s.send(t.k2, c, 0, [])  # Doesnt return anything, wtf.
print(ret)
print(map(stri, ret))
