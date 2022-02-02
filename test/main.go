package main

import (
	"fmt"
	"io"
	"net/http"
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
	m.Handle("/echo", http.HandlerFunc(echo))
	return http.ListenAndServe(":8080", m)
}

func echo(w http.ResponseWriter, r *http.Request) {
	ct := r.Header.Get("Content-Type")
	if ct != "" {
		w.Header().Add("Content-Type", ct)
	}
	io.Copy(w, r.Body)
	r.Body.Close()
}
