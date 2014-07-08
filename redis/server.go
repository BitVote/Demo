package main

import (
	"time"
	"regexp"
	"strconv"
	"unicode/utf8"
	"fmt"
	"log"

	"github.com/go-redis/redis"
	"net/http"
)

func starts_with(match string, str string) bool {
	got := regexp.MustCompile(match).FindStringSubmatchIndex(str)
	if got == nil {
		return false
	}
	return got[0] == 0
}

func strip_protocol(str string) string {
	fmt.Println(len(str))
	switch {
	case starts_with("http://www.+", str):  //TODO how the hell to match the dot.
		return str[11:]
	case starts_with("https://www.+", str):
		return str[12:]
	}
	return str
}

func sanitize(in string) string { //For handling stuff in the addresses.
	if utf8.Valid([]byte(in)) {
		return string(in)
	} else {
		return ""
	}
}

func reg_id(id string) string { return fmt.Sprintf("reg_%s", id) }

func register(client *redis.Client, id string) (int, error) {
	got, _ := _get_spent_time(client, id)
	if got == "" {
		client.Set(id, "0").Result()
		cur_time_str := fmt.Sprintf("%d", time.Now().Unix())
		client.Set(reg_id(id), cur_time_str).Result()
		return int(0), nil //strconv.Atoi(str)
	}
	return strconv.Atoi(got)
}


func _get_spent_time(client *redis.Client, id string) (string, error) {
	return client.Get(id).Result()
}
func get_spent_time(client *redis.Client, id string) (int, error) {
	mov_time, _ := _get_spent_time(client, id)
	if mov_time == "" {
		return register(client, id)
	} else {
		return strconv.Atoi(mov_time)
	}
}

func get_reg_time(client *redis.Client, id string) (int, error) {
	x, _ := client.Get(reg_id(id)).Result()
	return strconv.Atoi(x)
}

func figure_id(remoteaddr string, given string, testing bool) string {
	from_id := sanitize(remoteaddr)
	if testing {
		alt_id := sanitize(given)
		if alt_id != "" {
			from_id = alt_id
		}
	}
	return from_id
}

func main() {
	
	testing := true
	
	client := redis.NewTCPClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "", // no password set
    DB:       0,  // use default DB
	})
	defer client.Close()

	http.HandleFunc("/spend_time", func(w http.ResponseWriter, r *http.Request) {
		ia, ir := sanitize(r.FormValue("a")), sanitize(r.FormValue("r"))
		from_id := figure_id(r.RemoteAddr, sanitize(r.FormValue("id")), testing)

		if ia == "" || ir == "" || from_id == "" { return } // If failed to sanitize/get.

		// Throwing ... Would be handy, this is cumbersome.
		amount, err := strconv.Atoi(ia)
		if err != nil { return }

		spent_time, _ := get_spent_time(client, from_id)
		reg_time, _ := get_reg_time(client, from_id)
		now := int(time.Now().Unix())

		if now - reg_time - spent_time >= amount {

			// Take voting power from one.(the plus is correct, moves the moving time forward)
			post_spent_time, _ := client.IncrBy(from_id, int64(amount)).Result()
			if int(post_spent_time) - spent_time != amount {
				log.Println("Warning, values not adding properly!",
					          post_spent_time, "-", spent_time, "!=", amount)
			}
			recipient := strip_protocol(ir)  // Add it to the other.
			client.IncrBy(recipient, +int64(amount)).Result()
			fmt.Fprintf(w, "{\"spent\":%v, \"reg\":%v, \"success\":true, id:\"%s\"}", 
				post_spent_time, reg_time, from_id)
		} else {
			log.Println(w, "Insufficient voting time; ", reg_time, "-", spent_time, "<", amount)
			fmt.Fprintf(w, "{\"spent\":%v, \"reg\":%v, \"success\":false, \"id\":\"%s\"}",  
				spent_time, reg_time, from_id)
		}
	})

	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		val, _ := register(client, figure_id(r.RemoteAddr, sanitize(r.FormValue("id")), testing))
		fmt.Fprintln(w, val)
	})

	http.HandleFunc("/lookup_user", func(w http.ResponseWriter, r *http.Request) {

		from_id := figure_id(r.RemoteAddr, sanitize(r.FormValue("id")), testing)
		spent_time, _ := get_spent_time(client, from_id)
		reg_time, _ := get_reg_time(client, from_id)
		fmt.Fprintf(w, "{\"spent\":%v, \"reg\":%v, \"id\":\"%s\"}", spent_time, reg_time, from_id)
	})

	http.HandleFunc("/topics", func(w http.ResponseWriter, r *http.Request) {
		// Number requested.(top first
		fmt.Fprintf(w, "N %q\n", string(r.FormValue("N")))
		//List all topics with amounts.
	})

//	http.Handle("/", http.FileServer(http.Dir(".")))
	http.Handle("/javascripts/", http.FileServer(http.Dir("..")))
	http.Handle("/images/", http.FileServer(http.Dir("..")))
	http.Handle("/stylesheets/", http.FileServer(http.Dir("..")))
	http.Handle("/", http.FileServer(http.Dir("files/")))

	log.Fatal(http.ListenAndServe(":8080", nil))
}
