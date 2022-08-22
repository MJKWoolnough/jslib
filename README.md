# JSLib

JSLib is a collection of lightweight JavaScript/Typescript modules.

# Modules

|  Module             |  Description  |
|---------------------|---------------|
| bbcode              | A BBCode parser. |
| bbcode_tags         | A collection of BBCode tags. |
| conn                | Convenience wrappers around XMLHTTPRequest and WebSocket. |
| context             | Library for creating right-click menus. Needs rewriting. |
| dom                 | Functions for manipulating the DOM. |
| drag                | Library for making browser Drag'n'Drop easier to use. |
| events              | Functions to simplify starting & stopping global keyboard and mouse events. |
| fraction            | An infinity precision fractional math type. |
| html                | Functions to create HTML elements. |
| inter               | Classes to provide different type of internal communication. |
| load                | Used for initialisation. |
| nodes               | Classes for handling of collections of DOM Nodes. |
| rpc                 | JSONRPC implementation. |
| settings            | Type-safe wrappers around localStorage. |
| svg                 | Functions to create SVG elements. |
| windows             | Custom Elements that act as application Windows. |
| windows_taskbar     | Custom Element that lists Windows on a TaskBar. |
| windows_taskmanager | Custom Element that allows minimisation of Windows. |

## bbcode

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
