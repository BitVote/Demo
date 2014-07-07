package main

import (
	"fmt"
	"html"
	"log"
//	"github.com/go-redis/redis"
	"net/http"
)
/*
client := redis.NewTCPClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "", // no password set
    DB:       0,  // use default DB
})
defer client.Close()

*/


func main() {

	http.HandleFunc("/bar", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, %q", html.EscapeString(r.URL.Path))
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}
