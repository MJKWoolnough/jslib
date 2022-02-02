package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"

	"golang.org/x/net/websocket"
	"vimagination.zapto.org/jsonrpc"
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
			Method        string     `json:"method"`
			Auth          string     `json:"auth"`
			ContentType   string     `json:"contentType"`
			ContentLength int64      `json:"contentLength"`
			Form          url.Values `json:"form"`
			PostForm      url.Values `json:"postForm"`
		}{
			Method:        r.Method,
			Auth:          r.Header.Get("Authorization"),
			ContentType:   r.Header.Get("Content-Type"),
			ContentLength: r.ContentLength,
			Form:          r.Form,
			PostForm:      r.PostForm,
		})
	}))
	m.Handle("/socket", websocket.Handler(func(conn *websocket.Conn) { io.Copy(conn, conn) }))
	m.Handle("/rpc", websocket.Handler(func(conn *websocket.Conn) {
		var jrpc *jsonrpc.Server
		jrpc = jsonrpc.New(conn, jsonrpc.HandlerFunc(func(method string, data json.RawMessage) (interface{}, error) {
			switch method {
			case "static":
				return "123", nil
			case "echo":
				return data, nil
			case "broadcast":
				jrpc.Send(jsonrpc.Response{
					ID:     -1,
					Result: data,
				})
				return true, nil
			}
			return nil, jsonrpc.Error{
				Code:    1,
				Message: "unknown endpoint",
				Data:    method,
			}
		}))
		jrpc.Handle()
	}))
	return http.ListenAndServe(":8080", m)
}
