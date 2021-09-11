# jslib
--
    import "vimagination.zapto.org/jslib"

Package jslib is a javascript packer and library for javascript projects

## Usage

```go
var (
	ErrNoFiles    = errors.New("no files")
	ErrInvalidURL = errors.New("added files must be absolute URLs")
)
```
Errors

```go
var (
	ErrInvalidExport = errors.New("invalid export")
)
```
Errors

#### func  NoExports

```go
func NoExports(c *config)
```
NoExports disables the creation of exports for any potential plugins

#### func  OSLoad

```go
func OSLoad(base string) func(string) (*javascript.Module, error)
```
OSLoad is the default loader for Package, with the base set to CWD

#### func  Package

```go
func Package(opts ...Option) (*javascript.Script, error)
```
Package packages up multiple javascript modules into a single file, renaming
bindings to simulate imports

#### func  ParseDynamic

```go
func ParseDynamic(c *config)
```
ParseDynamic turns on dynamic import/include parsing

#### func  Plugin

```go
func Plugin(m *javascript.Module, url string) (*javascript.Script, error)
```
Plugin converts a single javascript module to make use of the processed exports
from package

#### type Option

```go
type Option func(*config)
```

Option in a type that can be passed to Package to set an option

#### func  File

```go
func File(url string) Option
```
File is an Option that specifies a starting file for Package

#### func  Loader

```go
func Loader(l func(string) (*javascript.Module, error)) Option
```
Loader sets the func that will take URLs and produce a parsed module
