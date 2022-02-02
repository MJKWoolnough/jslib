package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	m := http.NewServeMux()
	m.Handle("/", http.FileServer(http.Dir("./")))
	m.Handle("/static", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.Write([]byte("123")) }))
	m.Handle("/echo", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ct := r.Header.Get("Content-Type")
		if ct != "" {
			w.Header().Add("Content-Type", ct)
		}
		io.Copy(w, r.Body)
		r.Body.Close()
	}))
	m.Handle("/request", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.ParseForm()
		json.NewEncoder(w).Encode(struct {
			Method        string      `json:"method"`
			Headers       http.Header `json:"headers"`
			ContentLength int64       `json:"contentLength"`
			Form          url.Values  `json:"form"`
			PostForm      url.Values  `json:"postForm"`
		}{
			Method:        r.Method,
			Headers:       r.Header,
			ContentLength: r.ContentLength,
			Form:          r.Form,
			PostForm:      r.PostForm,
		})
	}))
	return http.ListenAndServe(":8080", m)
}
