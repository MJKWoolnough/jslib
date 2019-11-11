# jslib
--
    import "vimagination.zapto.org/jslib"


## Usage

```go
var (
	ErrNotNeeded = errors.New("not needed")
	ErrCircular  = errors.New("circular import")
)
```
Errors

#### func  Loader

```go
func Loader(os ...Option) (*javascript.Module, error)
```
Loader creates a jslib loader with packed dependencies

#### type Option

```go
type Option func(c *config)
```

Option is an configuration option that changes how the jslib packer operates

#### func  File

```go
func File(url string) Option
```
File adds a file for packer to parse and pack

#### func  Get

```go
func Get(getter func(string) (*javascript.Module, error)) Option
```
Get provides the user a way to choose what data is loaded for a given URL

#### func  LoadFromOS

```go
func LoadFromOS() Option
```
LoadFromOS assumes that the layout of the files to pack are layed out the same
on both the filesystem and the web system
