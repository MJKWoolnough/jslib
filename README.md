# jslib
--
    import "vimagination.zapto.org/jslib"


## Usage

```go
var (
	ErrNotNeeded     = errors.New("not needed")
	ErrCircular      = errors.New("circular import")
	ErrInvalidPlugin = errors.New("plugin cannot have exports")
)
```
Errors

#### func  Loader

```go
func Loader(os ...Option) (*javascript.Module, error)
```
Loader creates a jslib loader with packed dependencies

#### func  Plugin

```go
func Plugin(m *javascript.Module) (*javascript.Module, error)
```
Plugin takes a single javascript module and converts it to a JSLib compatible
javascript module - useful for plugins. NB: Plugins can have no exports

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
