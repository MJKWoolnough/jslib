# JSLib

JSLib is a collection of lightweight JavaScript/Typescript modules.

# Modules

|  Module             |  Description  |
|---------------------|---------------|
| [bbcode](#bbcode)                           | A BBCode parser. |
| [bbcode_tags](#bbcode_tags)                 | A collection of BBCode tags. |
| [conn](#conn)                               | Convenience wrappers around XMLHTTPRequest and WebSocket. |
| [context](#context)                         | Library for creating right-click menus. Needs rewriting. |
| [dom](#dom)                                 | Functions for manipulating the DOM. |
| [drag](#drag)                               | Library for making browser Drag'n'Drop easier to use. |
| [events](#events)                           | Functions to simplify starting & stopping global keyboard and mouse events. |
| [fraction](#fraction)                       | An infinity precision fractional math type. |
| [html](#html)                               | Functions to create HTML elements. |
| [inter](#inter)                             | Classes to provide different type of internal communication. |
| [load](#load)                               | Used for initialisation. |
| [nodes](#nodes)                             | Classes for handling of collections of DOM Nodes. |
| [rpc](#rpc)                                 | JSONRPC implementation. |
| [settings](#settings)]                      | Type-safe wrappers around localStorage. |
| [svg](#svg)                                 | Functions to create SVG elements. |
| [windows](#windows)                         | Custom Elements that act as application Windows. |
| [windows_taskbar](#windows_taskbar)         | Custom Element that lists Windows on a TaskBar. |
| [windows_taskmanager](#windows_taskmanager) | Custom Element that allows minimisation of Windows. |

## <a name="bbcode">bbcode</a>

This module contains a full BBCode parser, allowing for custom tags and text handling.

|  Export    |  Description  |
|------------|---------------|
| (default)  | This function takes a Parsers object and a string to be parsed, returning a DocumentFragment that contains the parsed structure. |
| isOpenTag  | Intended for tag parsers, this function takes a token that is outputted by a Tokeniser and returns true if the token is an OpenTag. |
| isCloseTag | Intended for tag parsers, this function takes a token that is outputted by a Tokeniser and returns true if the token is an CloseTag. |
| isString   | Intended for tag parsers, this function takes a token that is outputted by a Tokeniser and returns true if the token is a string. |
| process    | Intended for tag parsers, this function takes a Node, a Tokeniser, a Parsers object and a closing tag name. It will run the tokeniser, handling tags according to the Parsers object, attaching the results to the passed Node, until it reaches a Closing Tag matching the name specified, when it will return the original Node passed. |
| text       | A Symbol used to indicate the text processor in the Parsers type passed to the (default) parsing function. |

### Types

|  Export   |  Description  |
|-----------|---------------|
| CloseTag  | The type of a Closing Tag, an Object that contains a tagName (string) field, the name of the tag, and a fullText (string) field, that contains the entire text of the closing tag. |
| OpenTag   | The type of an Opening Tag, an Object that contains a tagName (string) field, the name of the tag, an attr (string \| null) field, which contains any attribute on the tag or null if there is no attribute, and a fullText (string) field, that contains the entire text of the opening tag. |
| Parsers   | An Object, which contains the tag parsers for specific tags and the text processor. This object **must** contain the text Symbol, specifying a text formatting function, which takes a Node to be appended to, and the string to be formatted. In addition, this object should contain string keys, which correspond to tag names, the values of which should be TagFn's. |
| TagFn     | A function that takes a Node, a Tokeniser, and a Parsers object. This function should process tokens from the Tokeniser, appending to the Node, until it's tag data finishes. This function should return nothing. |
| Tokeniser | This type is a generator that will yield a token, which will either be a CloseTag, OpenTag, or string. When calling next on this Generator, you can pass in *true* to the *next* method retrieve the last token generated. If you pass in *1* to the *next* method, when it has just outputted an OpenTag, the processor will not move passed the corresponding CloseTag until *1* is again passed to the *next* method. |

## <a name="bbcode_tags">bbcode_tags</a>

This module contains many standard BBCode tags parsers, and a default text processor.

This module directly imports the `bbcode`, `dom`, and `html` modules.

|  Export       |  Description  |
|---------------|---------------|
| all           | An object which contains all of the tag processors and the text processor. |
| text          | A text processor that converts all line breaks into HTMLBRElement's. |
| *             | All remaining exports are tag processors |

|  Tags         |  Description  |
|---------------|---------------|
| audio         | The *audio* tag processes its inner text as a URL and creates an HTMLAudoElement. |
| b             | The *b* tag sets bold on the contained data. |
| centre/center | The *centre* and *center* tags center the contained data. |
| colour/color  | The *colour* and *color* tags set the attribute of the tag as the font colour of the contained data. |
| font          | The *font* tag sets the font of the contained data. |
| full/justify  | The *full* and *justify* tags sets full alignment for the contained data. |
| h1...h6       | Tags *h1*, *h2*, *h3*, *h4*, *h5*, and *h6* create HTMLHeadingElement's around the contained data. |
| highlight     | The *highlight* tag highlights the contained data. |
| hr            | The *hr* tag inserts a horizontal rule, and has no Closing Tag. |
| i             | The *i* tag sets italic on the contained data. |
| img           | The *img* tag processes the contained text as a URL for an HTMLImageElement, and can optionally use the attribute to set the width and height of the image. The format for the attribute is `w`x`h` where either `w` or `h` can be omitted. |
| left          | The *left* tag sets left alignment for the contained data. |
| list          | The *list* tag creates a new list. The attribute determines what type of list, with no attribute resulting in an HTMLUListElement, and any of `a`, `A`, `i`, `I`, and `1` resulting in an HTMLOListElement with the type set the the specified value. Any children of the list should be wrapped in `[*] [/*]` tags, though the closing tag can be omitted. |
| quote         | The *quote* tag creates a HTMLQuoteElement around the contained data. Any attribute is created as an HTMLLegendElement as the first child. |
| right         | The *right* tag sets right alignment for the contained data. |
| s             | The *s* tag sets strike-through on the contained data. |
| size          | The *size* tag must have an attribute, which must be a number (0\<s<=100) and is used to determine the font-size (s/10em) on the contained data. |
| table         | The *table* tag is used to create an HTMLTableElement. This table allows *thead*, *tbody*, *tfoot*, *tr*, *th*, and *td*, all of which act like their HTML counterparts. |
| u             | The *u* tag sets underline on the contained data. |
| url           | The *url* tag creates an HTMLAnchorElement, with the href set to the attribute, wrapping the contained data. If no attribute is set, the URL is taken from the containing data. |

## <a name="conn">conn</a>

The conn module contains some convenience wrappers around XMLHTTPRequest and WebSocket.

This module directly imports the `inter` module.

|  Tags       |  Description  |
|-------------|---------------|
| HTTPRequest | The function provides a promise base wrapper to XMLHTTPRequest. It takes a URL and an optional Properties object. |
| Properties  | This object modifies an HTTPRequest. It allows setting of the following:<br>`method`: which can change the request method.<br>`user`: allows the setting of a Basic Authorization username.<br>`password`: allows the settings of a Basic Authorization password.<br>`headers`: an object to allow the setting or arbitrary headers.<br>`type`: sets the Content-Type of the request.<br>`response`: this determines the expected return type of the promise. One of `text`, `xml`, `json`, `blob`, `arraybuffer`, `document`, or `xh`. The default is `text` and `xh` simply returns the XMLHTTPRequest object as a response.<br>`onuploadprogress`: this sets an event handler to monitor any upload progress.<br>`ondownloadprogress`: this sets an event handler to monitor any download process.<br>`data`: this is an XMLHttpRequestBodyInit and is send as the body of the request.<br>`signal`: an AbortSignal to be used to cancel any request. |
| WS          | This function provides a Promise bases initialiser for WSConn. |
| WSConn      | This class extends the WebSocket class, allowing a relative URL to be used, and providing a Subscription based `when` method. |
