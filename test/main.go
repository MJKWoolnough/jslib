package main

import (
	"fmt"
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
	return http.ListenAndServe(":8080", m)
}
