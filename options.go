package jslib

import "vimagination.zapto.org/javascript"

// Option in a type that can be passed to Package to set an option
type Option func(*config)

// File is an Option that specifies a starting file for Package
func File(url string) Option {
	return func(c *config) {
		c.filesToDo = append(c.filesToDo, url)
	}
}

// NoExports disables the creation of exports for any potential plugins
func NoExports(c *config) {
	c.bare = true
}

// Loader sets the func that will take URLs and produce a parsed module
func Loader(l func(string) (*javascript.Module, error)) Option {
	return func(c *config) {
		c.loader = l
	}
}

// ParseDynamic turns on dynamic import/include parsing
func ParseDynamic(c *config) {
	c.parseDynamic = true
}
