package jslib

import "vimagination.zapto.org/javascript"

type Option func(*config)

func File(url string) Option {
	return func(c *config) {
		c.addURL(url)
	}
}

func NoExports(c *config) {
	c.bare = true
}

func Loader(l func(string) (*javascript.Module, error)) Option {
	return func(c *config) {
		c.loader = l
	}
}

func ParseDynamic(c *config) {
	c.parseDynamic = true
}
