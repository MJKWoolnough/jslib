package jslib

type Option func(*config)

func File(url string) Option {
	return func(c *config) {
		c.filesToDo = append(c.filesToDo, url)
	}
}

func NoExports(c *config) {
	c.bare = true
}
