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


func register(client *redis.Client, id string) (int, error) {
	got, _ := _get_mov_time(client, id)
	if got == "" {
		now_t := time.Now().Unix()
		setstr := fmt.Sprintf("%d", now_t)
		client.Set(id, setstr).Result()
		return int(now_t), nil //strconv.Atoi(str)
	}
	return strconv.Atoi(got)
}


func _get_mov_time(client *redis.Client, id string) (string, error) {
	return client.Get(id).Result()
}
func get_mov_time(client *redis.Client, id string) (int, error) {
	mov_time, _ := _get_mov_time(client, id)
	if mov_time == "" {
		return register(client, id)
	} else {
		return strconv.Atoi(mov_time)
	}
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

		moving_time, _ := get_mov_time(client, from_id)
		now := int(time.Now().Unix())

		if now - moving_time > amount {

			// Take voting power from one.(the plus is correct, moves the moving time forward)
			post_moving_time, _ := client.IncrBy(from_id, int64(amount)).Result()
			if int64(post_moving_time) - int64(moving_time) != int64(amount) {
				log.Println("Warning, values not adding properly!",
					          moving_time, "-", post_moving_time, "!=", amount)
			}
			fmt.Fprintln(w, post_moving_time)

			recipient := strip_protocol(ir)  // Add it to the other.
			client.IncrBy(recipient, +int64(amount)).Result()
		} else {
			log.Println(w, "Insufficient voting time; ", now, "-", moving_time, ">", amount)
		}
	})

	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		val, _ := register(client, figure_id(r.RemoteAddr, sanitize(r.FormValue("id")), testing))
		fmt.Fprintln(w, val)
	})

	http.HandleFunc("/lookup_user", func(w http.ResponseWriter, r *http.Request) {

		from_id := figure_id(r.RemoteAddr, sanitize(r.FormValue("id")), testing)
		mov_time, _ := get_mov_time(client, from_id)
		fmt.Fprintln(w, mov_time)
	})

	http.HandleFunc("/topics", func(w http.ResponseWriter, r *http.Request) {
		// Number requested.(top first
		fmt.Fprintf(w, "N %q\n", string(r.FormValue("N")))
		//List all topics with amounts.
	})

	http.HandleFunc("/ska", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "../plain.html")
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}
