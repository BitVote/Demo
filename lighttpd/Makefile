
default: compile

compile: test.fastcgi

test.fastcgi: testfastcgi.c
	gcc -I/usr/include/fastcgi -lfcgi testfastcgi.c -o test.fastcgi

syntax_check:
	lighttpd -t -f lighttpd.conf
run:
	lighttpd -D -f lighttpd.conf
