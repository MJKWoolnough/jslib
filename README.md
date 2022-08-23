# JSLib

JSLib is a collection of lightweight JavaScript/Typescript modules and scripts for web development.

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

# Scripts

|  Script      |  Description  |
|--------------|---------------|
| circular     | This script walks a javascript import tree to determine if there are any circular imports, which may cause initialisation problems. The first argument specified the root script. |
| html         | This script generates the html module, either from a in-built list of HTML tags, or from a supplied list as the first argument and the output filename as the second |
| requiredHTML | This script walks a javascript import tree to determine which imports from the `html` module are being used. Can be used as the first argument to the `html` script. |
| requiredSVG  | This script walks a javascript import tree to determine which imports from the `svg` module are being used. Can be used as the first argument to the `svg` script. |
| svg          | This script generates the svg module, either from a in-built list of SVG tags, or from a supplied list as the first argument and the output filename as the second
|

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

## <a name="context">context</a>

The context module has functions to create custom context menus. This module is due for a rewrite, so the current API may change.

This module directly import the `dom` and `html` modules, and relies on the `load`.

|  Export   |  Description  |
|-----------|---------------|
| (default) | this function takes a parent Element, an array of a pair of coords for a starting position of the menu, and a List. |
| item      | this function takes a name, action and an optional object containing the optional fields of the `Item` type, and creates an `Item`. |
| menu      | this function takes a name, list and an optional object containing the optional fields of the `Menu` type, and creates an `Menu`.

### Types

|  Export  |  Description  |
|----------|---------------|
| Item     | This type represents a menu item, containing the following fields:<br>`action`: a function, called with no params, is called when the item is activated.<br>`classes`: an optional string of classes that are set on the menu item.<br>`disabled`: an optional boolean to disable the item.<br>`id`: an optional string to be set as the id of the menu item.<br>`name`: this string is the content of the item. |
| List     | This type is a recursive array of Items and Menus. |
| Menu     | This type represents a menu item, containing the following fields:<br>`classes`: an optional string of classes that are set on the menu item.<br>`disabled`: an optional boolean to disable the item.<br>`id`: an optional string to be set as the id of the menu item.<br>`list`: an array of Item and Menu elements that are a submenu.<br>`name`: this string is the content of the item. |

## <a name="dom">dom</a>

The dom module can be used to manipulate DOM elements.

|  Export                |  Description  |
|------------------------|---------------|
| amendNode              | This function takes a Node or EventTarget, and either a Props and Children params, or just a Children param. It returns the passed Node or EventTarger with the changes applied. |
| autoFocus              | This function queues a focus method call to the passed element, and will call select on any HTMLInputElement or HTMLTextAreaElement, unless false is passed as the second param. |
| clearNode              | This function acts similarly to amendNode, but clears the element of children before adding more. |
| createDocumentFragment | This function takes an optional Children param and returns a DocumentFragment that contains the children. |
| event                  | This functions takes a Function or EventListenerObject, and a bitmask created from the below values to set event options. Optionally, a third param, an AbortSignal, can be passed to set the `signal` event property. |
| eventCapture           | Can be passed to the event function to set the `capture` property on an event. |
| eventOnce              | Can be passed to the event function to set the `once` property on an event. |
| eventPassive           | Can be passed to the event function to set the `passive` property on an event. |
| eventRemove            | Can be passed to the event function to set the event to be removed. |

### Types

|  Export     |  Description  |
|-------------|---------------|
| Children    | This type is a string, Node, NodeList, HTMLCollection, or a recursive array of those. |
| DOMBind     | This type represents a binding of either amendNode or clearNode with the first param bound. |
| Props       | A PropsObject or NamedNodeMap. |
| PropsObject | An object of strings to values to be set. The key determines what type the value should be.<br>`on*`: used to set events. Can be a Function, EventListenerObject, or the output of the event function.<br>`class`: An array of strings, or a DOMTokenList, to be used to toggle classes. If a class begins with a `!`, the class will be removed, if the class begins with a `~`, the class will be toggles, otherwise the class will be set.<br>`style`: A CSSStyleDeclaration can be used to set the style directly, or an Object can be used to set individual style properties.<br>For any key, a string or any object with a toString method can be used to set the field explicitly, a number can be used and converted to a string, a boolean can be used to toggle an attribute, and a undefined value can be used to remove an attribute. |

## <a name="events">events</a>

The event module is used for easy creation of global events.

|  Export        |  Description  |
|----------------|---------------|
| hasKeyEvent    | This function returns true if any function is currently active for the passed key. |
| keyEvent       | This function takes a key combination or array of key combinations, an optional KeyboardEvent function to act as the keydown event handler, an optional KeyboardEvent function to act as the keyup handler, and an optional boolean (default false) to determine if the event only runs one time per activateion. The function returns an array of two functions, the first of which activates the event, the second of which deactivates the event and will run any keyup event handler unless false is passed into the function. The key combinations are strings which can contain key names as determined by the KeyboardEvent.key value, and can be prefixed by any number of the following: `Alt+`, `Option+`, `Control+`, `Ctrl+`, `Command+`, `Meta+`, `Super+`, `Windows+`, and `Shift+`. |
| mouseDragEvent | This function takes a mouse button (0..15), an optional MouseEvent function to act as the mousemove event handler, and an optional function to be run on mouseup. The function returns an array of two functions, the first of which activates the event, the second of which deactivates the event and will run any keyup event handler unless false is passed into the function. |
| mouseMoveEvent | This function takes a MouseEvent function and an option function which will be run when the event deactivates. The function returns an array of two functions, the first of which activates the event, the second of which deactivates the event and will run any keyup event handler unless false is passed into the function. |
| mouseX         | The current X coordinate of the mouse. |
| mouseY         | The current Y coordinate of the mouse. |


## <a name="fraction">fraction</a>

The fraction module exports a default class to act as a fractional, infinite precision number type.

|  Field       |  Description  |
|--------------|---------------|
| (construcor) | The constructor of the default class take a BigNum numerator and an optional BigNum denominator. |
| add/sub      | These methods add or subtract the passed Fraction to/from the Fraction. |
| cmp          | This method returns -1 if the Fraction is less than the passed Fraction, 0 if the Fraction is equal to the passed Fraction, 1 if the Fraction is greater than the passed Fraction, or NaN if either the Fraction or passed Fraction are NaN. |
| div/mul      | These methods divide or multiple Fraction param by the passed Fraction param. |
| isNaN        | This method returns true if the Fraction is NaN. |
| sign         | This method returns 1 if the Fraction is positive, -1 if the Fraction is negative, and NaN if the value is NaN. |
| toFloat      | This method returns a float representation of the Fraction to 5 decimal places. |

|  Static Field  |  Description  |
|----------------|---------------|
| max            | This function takes two Fraction types and returns the larger of the two. |
| min            | This function takes two Fraction types and returns the smaller of the two. |
| NaN            | This field is a Fraction representing the NaN value. |
| one            | This field is a Fraction representing 1. |
| zero           | This field is a Fraction representing 0. |

## <a name="html">html</a>

The html module exports function for the create of HTMLElements.

This module directly imports the `dom` module.

|  Export  |  Description  |
|----------|---------------|
| ns       | This constant contains the XMLNamespace of HTMLElements. |
| a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark marquee menu meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul video wbr | Each of these exports is a function which can take either a Props param and a Children param, or just a Children param, both as defined in the `dom` module, returning an HTMLElement of the exported name, with the attributes and children set. |
| vare     | This function is as above, for the `var` HTMLElement. |

## <a name="inter">inter</a>

## <a name="load">load</a>

## <a name="nodes">nodes</a>

## <a name="rpc">rpc</a>

## <a name="settings">settings</a>

## <a name="svg">svg</a>

The svg module exports function for the create of SVGElements.

This module directly imports the `dom` module.

|  Export  |  Description  |
|----------|---------------|
| ns       | This constant contains the XMLNamespace of HTMLElements. |
| a animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect set script stop style svg symbol text textPath title tspan use view | Each of these exports is a function which can take either a Props param and a Children param, or just a Children param, both as defined in the `dom` module, returning an SVGElement of the exported name, with the attributes and children set. |
| switche     | This function is as above, for the `switch` SVGElement. |
| svgData     | This function takes either a SVGSVGElement or a SVGSymbolElement and returns a URL encoded SVG data string. |

## <a name="windows">windows</a>

## <a name="windows_taskbar">windows_taskbar</a>

## <a name="windows_manager">windows_manager</a>
