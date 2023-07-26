package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"golang.org/x/net/websocket"
	"vimagination.zapto.org/jsonrpc"
	"vimagination.zapto.org/tsserver"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	m := http.NewServeMux()
	m.Handle("/", http.FileServer(http.FS(tsserver.WrapFS(os.DirFS("./")))))
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
		postData, _ := io.ReadAll(r.Body)
		json.NewEncoder(w).Encode(struct {
			Method        string     `json:"method"`
			Auth          string     `json:"auth,omitempty"`
			ContentType   string     `json:"contentType,omitempty"`
			ContentLength int64      `json:"contentLength,omitempty"`
			Form          url.Values `json:"form,omitempty"`
			PostForm      url.Values `json:"postForm,omitempty"`
			PostData      string     `json:"postData,omitempty"`
		}{
			Method:        r.Method,
			Auth:          r.Header.Get("Authorization"),
			ContentType:   r.Header.Get("Content-Type"),
			ContentLength: r.ContentLength,
			Form:          r.Form,
			PostForm:      r.PostForm,
			PostData:      string(postData),
		})
	}))
	m.Handle("/socket", websocket.Handler(func(conn *websocket.Conn) {
		conn.SetDeadline(time.Now().Add(time.Second * 60))
		io.Copy(conn, conn)
	}))
	m.Handle("/socket-close", websocket.Handler(func(conn *websocket.Conn) { conn.Close() }))
	m.Handle("/rpc", websocket.Handler(func(conn *websocket.Conn) {
		var jrpc *jsonrpc.Server
		conn.SetDeadline(time.Now().Add(time.Second * 60))
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
			case "close":
				conn.Close()
				return nil, nil
			}
			return nil, jsonrpc.Error{
				Code:    1,
				Message: "unknown endpoint",
				Data:    method,
			}
		}))
		jrpc.Handle()
	}))
	audio, _ := base64.StdEncoding.DecodeString("UklGRiwAAABXQVZFZm10IBAAAAABAAIARKwAABCxAgAEABAAZGF0YQgAAAAAAAAAAAD//w==")
	m.Handle("/AUDIO", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "audio/wav")
		w.Header().Add("Content-Length", strconv.FormatUint(uint64(len(audio)), 10))
		w.Write(audio)
	}))
	image, _ := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAACklEQVR4AWNoAAAAggCBTBfX3wAAAABJRU5ErkJggg==")
	m.Handle("/IMAGE", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "image/png")
		w.Header().Add("Content-Length", strconv.FormatUint(uint64(len(image)), 10))
		w.Write(image)
	}))
	return http.ListenAndServe(":8080", m)
}
