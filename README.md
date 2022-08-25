# JSLib

JSLib is a collection of lightweight JavaScript/Typescript modules and scripts for web development.

# Modules

|  Module                                     |  Description  |
|---------------------------------------------|---------------|
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
| [settings](#settings)                       | Type-safe wrappers around localStorage. |
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
| svg          | This script generates the svg module, either from a in-built list of SVG tags, or from a supplied list as the first argument and the output filename as the second. |

## <a name="bbcode">bbcode</a>

This module contains a full [BBCode](https://en.wikipedia.org/wiki/BBCode) parser, allowing for custom tags and text handling.

|  Export    |  Type  | Description  |
|------------|--------|--------------|
| [(default)](#bbcode_default) | Function | This function is the main BBCode parsing function. |
| [CloseTag](#bbcode_closetag) | Type | The type represents a closing tag. |
| [isCloseTag](#bbcode_isCloseTag) | Function | Intended for tag parsers, this function determines if a token is a [CloseTag](#bbcode_closetag). |
| [isOpenTag](#bbcode_isOpenTag) | Function | Intended for tag parsers, this function determines if a token is an [OpenTag](#bbcode_opentag). |
| [isString](#bbcode_isString) | Function | Intended for tag parsers, this function determines if a token is a string. |
| [OpenTag](#bbcode_opentag) | Type | The type represents an opening tag. |
| [Parsers](#bbcode_parsers) | Type | This type is an object containing the handlers for various tag types. |
| [process](#bbcode_process) | Function | Intended for tag parsers, appends parse BBCode to the passed Node. |
| [TagFn](#bbcode_tagfn) | Type | A type representing a tag handler. |
| text | Symbol | A Symbol used to indicate the text processor in the Parsers type passed to the [(default)](#bbcode_default) parsing function. |
| [Tokeniser](#bbcode_tokeniser) | Type | Intended for tag parsers, this type represents the token generator. |

### <a name="bbcode_default">(default)</a>

```typescript
(parsers: Parsers, text: string) => DocumentFragment;
```

This function parses the given text according, handling the tags with the given parsers, and appending all generated Nodes to a DocumentFragment, which is returned.

### <a name="bbcode_closetag">CloseTag</a>

```typescript
{
	tagName: string;
	fullText: string;
}
```

The tagName is the simply the name of the tag being closed.

The fullText is the entire parsed text of the closing tag. This can be useful when skipping over tags and you just wish to print the unparsed text.

Example: `[b]Text[/b]` will result in:
```typescript
{
	tagName: "b",
	fullText: "[/b]"
}
```

### <a name="bbcode_isclosetag">isCloseTag</a>

```typescript
(t: OpenTag | CloseTag | string) => t is CloseTag;
```

This function returns true when passed a [CloseTag](#bbcode_closetag).

### <a name="bbcode_isopentag">isOpenTag</a>

```typescript
(t: OpenTag | CloseTag | string) => t is OpenTag;
```

This function returns true when passed an [OpenTag](#bbcode_opentag).

### <a name="bbcode_isstring">isString</a>

```typescript
(t: OpenTag | CloseTag | string) => t is string;
```

This function returns true when passed a string.

### <a name="bbcode_opentag">OpenTag</a>

```typescript
{
	tagName: string;
	attr: string;
	fullText: string;
}
```

The tagName is the simply the name of the tag being opened.

The attr is any attribute that was supplied with the opening tag.

The fullText is the entire parsed text of the opening tag. This can be useful when skipping over tags and you just wish to print the unparsed text.

Example: `[b]Text[/b]` will result in:
```typescript
{
	tagName: "b",
	fullText: "[b]"
}
```

Example: `[colour=#f00]Text[/colour]` will result in:
```typescript
{
	tagName: "colour",
	attr: "#f00",
	fullText: "[colour=#f00]"
}
```

### <a name="bbcode_parsers">Parsers</a>
```typescript
{
	[key: string]: TagFn;
	[text]: (node: Node, t: string) => void;
}
```

This type represents an Object, which contains the tag parsers for specific tags and the text processor. This object **must** contain the text Symbol, specifying a text formatting function, which takes a Node to be appended to, and the string to be formatted. In addition, this object should contain string keys, which correspond to tag names, the values of which should be [TagFn](#bbcode_tagfn)s.

### <a name="bbcode_process">process</a>
```typescript
<T extends Node>(node: T, t: Tokeniser, p: Parsers, closeTag?: string) => T;
```

Intended for tag parsers, this function takes a Node, a [Tokeniser](#bbcode_tokeniser), a [Parsers](#bbcode_parsers) object and a closing tag name. It will run the tokeniser, handling tags according to the [Parsers](#bbcode_parsers) object, attaching the results to the passed Node, until it reaches a [CloseTag](#bbcode_closetag) matching the name specified, when it will return the original Node passed.

### <a name="bbcode_tagfn">tagFn</a>
```typescript
(node: Node, t: Tokeniser, p: Parsers) => void;
```

A function that takes a Node, a [Tokeniser](#bbcode_tokeniser), and a [Parsers](#bbcode_parsers) object. This function should process tokens from the [Tokeniser](#bbcode_tokeniser), appending to the Node, until its tag data finishes. This function should return nothing.

### <a name="bbcode_tokeniser">Tokeniser</a>
```typescript
Generator<OpenTag | CloseTag | string, void, true | 1 | undefined>;
```

This type is a generator that will yield a token, which will either be a [CloseTag](#bbcode_closetag), [OpenTag](#bbcode_opentag), or string. When calling next on this Generator, you can pass in *true* to the *next* method retrieve the last token generated. If you pass in *1* to the *next* method, when it has just outputted an [OpenTag](#bbcode_opentag), the processor will not move passed the corresponding [CloseTag](#bbcode_closetag) until *1* is again passed to the *next* method.

## <a name="bbcode_tags">bbcode_tags</a>

This module contains many standard [BBCode](https://en.wikipedia.org/wiki/BBCode) tags parsers, and a default text processor.

This module directly imports the [bbcode](#bbcode), [dom](#dom), and [html](#html) modules.

|  Export       |  Type    |  Description  |
|---------------|----------|---------------|
| all           | [Parsers](#bbcode_parsers) | An object which contains all of the tag processors and the text processor. |
| text          | Function | A text processor that converts all line breaks into HTMLBRElement's. |
| *             | [TagFn](#bbcode_tagfn) | All remaining exports are tag processors |

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

This module directly imports the [inter](#inter) module.

|  Exports  |  Type  |  Description  |
|-----------|--------|---------------|
| [HTTPRequest](#conn_httprequest) | Function | The function provides a promise base wrapper to XMLHTTPRequest. |
| [Properties](#conn_properties) | Type | This object is passed to a HTTPRequest to modify its options. |
| [WS](#conn_ws) | Function | This function provides a Promise based initialiser for WSConn. |
| [WSConn](#conn_wsconn) | Class | This class extends the WebSocket class. |

### <a name="conn_httprequest">HTTPRequest</a>
```typescript
interface {
	(url: string, props?: Properties & {"response"?: "text" | ""}): Promise<string>;
	(url: string, props: Properties & {"response": "xml" | "document"}): Promise<XMLDocument>;
	(url: string, props: Properties & {"response": "blob"}): Promise<Blob>;
	(url: string, props: Properties & {"response": "arraybuffer"}): Promise<ArrayBuffer>;
	(url: string, props: Properties & {"response": "xh"}): Promise<XMLHttpRequest>;
	<T = any>(url: string, props: Properties & {"response": "json"}): Promise<T>;
}
```

In its simplest incarnation, this function takes a URL a returns a Promise which will return the string response from that URL. However, the passed [Properties](#conn_properties) object can modify both how the request is sent and the response interpreted.

### <a name="conn_properties">Properties</a>
```typescript
{
	method?: string;
	user?: string;
	password?: string;
	headers?: object;
	type?: string;
	response?: "" | "text" | "xml" | "json" | "blob" | "arraybuffer" | "document" | "xh";
	onuploadprogress?: (event: ProgressEvent) => void;
	ondownloadprogress?: (event: ProgressEvent) => void;
	data?: XMLHttpRequestBodyInit;
	signal?: AbortSignal;
}
```

This object modifies an HTTPRequest. It allows setting of the following:
|  Field            |  Description  |
|-------------------|---------------|
| method            | Can change the request method. |
| user              | Allows the setting of a Basic Authorization username.  |
| password          | Allows the settings of a Basic Authorization password. |
| headers           | An object to allow the setting or arbitrary headers. |
| type              | Sets the Content-Type of the request. |
| response          | This determines the expected return type of the promise. One of `text`, `xml`, `json`, `blob`, `arraybuffer`, `document`, or `xh`. The default is `text` and `xh` simply returns the XMLHTTPRequest object as a response. Response type `json` will parse the retrieved text as JSON and return the parsed object. |
| onuploadprogress  | This sets an event handler to monitor any upload progress. |
|ondownloadprogress | This sets an event handler to monitor any download process. |
| data              | This is an XMLHttpRequestBodyInit and is send as the body of the request. |
| signal            | An AbortSignal to be used to cancel any request. |

### <a name="conn_ws">WS</a>
```typescript
(url: string) => new Promise<WSConn>;
```

This function takes a url and returns a Promise which will resolve with an initiated [WSConn](#conn_wsconn) on a successful connection.

### <a name="conn_wsconn">WSConn</a>

WSConn extends the WebSocket class, allowing for the passed URL to be relative to the current URL.

In addition, it adds a method:
```typescript
when<T = any, U = any>(ssFn?: (data: MessageEvent) => T, eeFn?: (data: string) => U) => Subscription<MessageEvent>;
```

This method acts like the [then](#inter_subscription_then) method of the [Subscription](#inter_subscription) class from the [inter](#inter) module, taking an optional success function, which will receive a MessageEvent object, and an optional error function, which will receive an error string. The method returns a [Subscription](#inter_subscription) object with the success and error functions set to those provided.

## <a name="context">context</a>

The context module has functions to create custom context menus. This module is due for a rewrite, so the current API may change.

This module directly import the [dom](#dom) and [html](#html) modules, and relies on the [load](#load) module.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| [(default)](#context_default) | Function | This function produces a context menu, with mouse and keyboard navigation. |
| [item](#context_item) | Function | This function creates a menu item. |
| [Item](#context_item_type) | Type | This type represents a menu item. |
| [List](#context_list) | Type | This type is a recursive array of [Item](#context_item_type)s and [Menu](#content_menu_item)s. |
| [menu](#context_menu) | Function | This function creates a submenu item.
| [Menu](#context_menu_item) | Type | This type represents a submenu item. |

### <a name="context_default">(default)</a>
```typescript
(base: Element, coords: [number, number], list: List) => Promise<any>;
```

The default export function creates a Context Menu in the base element at the coords provided. The menu is filled with the items denoted by the [List](#context_list).

### <a name="context_item">item</a>
```typescript
(name: string, action: () => any, options: Options = {}) => Item;
```

This helper creates an [Item](#context_item_type) with the name and action set, with the [Options](#context_options) provided.

### <a name="context_item_type">Item</a>
```typescript
{
	classes?: string;
	id?: string;
	disabled?: boolean;
	name: string;
	action: () => any;
}
```

This type represents an item of a menu. The `classes`, `id`, and `disabled` fields are defined in the [Options](#context_options) type.

|  Field  |  Description  |
|---------|---------------|
| name    | This is the name in the item element. |
| action  | This is a function that will be called when an item is activated. It's return will be the return value of the Promise return by the [(default)](#context_default) function. |


### <a name="context_list">List</a>
```typescript
(Item | Menu | List)[];
```

This type is a recursive array of Items and Menus.

### <a name="context_menu">menu</a>
```typescript
(name: string, list: List, options: Options = {})
```

This helper creates an [Menu](#context_menu_type) with the name set, and with the [Options](#context_options) provided.

### <a name="context_menu_type">Menu</a>
```typescript
{
	classes?: string;
	id?: string;
	disabled?: boolean;
	name: string;
	list: (Item | Menu)[];
}
```

This type represents a submenu of a menu. The `classes`, `id`, and `disabled` fields are defined in the [Options](#context_options) type.

|  Field  |  Description  |
|---------|---------------|
| name    | This is the name in the item element. |
| list    | This is an array of the elements of the submenu |

### <a name="context_options">Options</a>
```typescript
{
	classes?: string;
	id?: string;
	disabled?: boolean;
}
```

This unexported type represents the options passed to the [item](#context_item) and [menu](#context_menu) functions.
|  Field   |  Description  |
|----------|---------------|
| classes  | This sets classes on the item or submenu elements.
| id       | This sets an ID on the item or submenu element.
| disabled | This disabled an item or submenu element.

## <a name="dom">dom</a>

The dom module can be used to manipulate DOM elements.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| [amendNode](#dom_amendnode) | Function | This convenience function modifies a Node or EventTarget. |
| [autoFocus](#dom-autofocus) | Function | This function queues a focus method call to the passed element. |
| <a name="dom_clearnode">clearNode</a> | Function | This function acts identically to [amendNode](#dom-amendnode) except that it clears any children before amending. |
| [Children](#dom_children) | Type | This type is a string, Node, NodeList, HTMLCollection, or a recursive array of those. |
| [createDocumentFragment](#dom_createdocumentfragment) | Function | This convenience function creates a DocumentFragment. |
| [DOMBind](#dom_dombind) | Type | This type represents a binding of either [amendNode](#dom_amendnode) or [clearNode](#dom_clearnode) with the first param bound. |
| [event](#dom_event) | Function | This helper function helps with setting up events for [amendNode](#dom_amendnode). |
| eventCapture | Number | Can be passed to the [event](#dom_event) function to set the `capture` property on an event. |
| eventOnce | Number | Can be passed to the [event](#dom_event) function to set the `once` property on an event. |
| eventPassive | Number| Can be passed to the [event](#dom_event) function to set the `passive` property on an event. |
| eventRemove | Number | Can be passed to the [event](#dom_event) function to set the event to be removed. |
| <a name="dom_props">Props</a> | Type | A [PropsObject](#dom_propsobject) or NamedNodeMap. |
| [PropsObject](#dom_propsobject) | Type | This object is used to set attributes and events on a Node or EventTarget with the [amendNode](#dom_amendnode) and [clearNode](#dom_clearnode) functions. |

### <a name="dom_amendnode">amendNode</a>
```typescript
interface {
	<T extends EventTarget>(element: T, properties: Record<`on${string}`, EventListenerObject | EventArray | Function>): T;
	<T extends Node>(element: T, properties?: Props, children?: Children): T;
	<T extends Node>(element: T, children?: Children): T;
	<T extends Node>(element?: T | null, properties?: Props | Children, children?: Children): T;
}
```

This fuction is used to set attributes and children on Nodes, and events on Nodes and other EventTargets.

If the element passed is a HTMLElement or SVGElement, then a properties param is processed, applying attributes as per the [PropsObject](#dom_propsobject) type. Likewise, any events are set or unset on a passed EventTarget, as per the [PropsObject](#dom_propsobject) type.

For any Node, the children are set according to the [Children](#dom_children) value.

This function returns the element passed to it.

NB: Due to how this function uses instanceof to determine what can be applied to it, it will fail in unexpected ways with types created from proxies of the DOM classes, such as those used with window.open().

### <a name="dom_autofocus">autoFocus</a>
```typescript
<T extends FocusElement>(node: T, inputSelect = true) => T;
```

This queues a focus method call to the passed element, and will call select on any HTMLInputElement or HTMLTextAreaElement, unless false is passed as the second param.

### <a name="dom_children">Children</a>
```typescript
string | Node | NodeList | HTMLCollection | Children[];
```

This type is a string, Node, NodeList, HTMLCollection, or a recursive array of those.

### <a name="dom_createdocumentfragment">createDocumentFragment</a>
```typescript
(children?: Children) => DocumentFragment;
```

This function creates a DocumentFragment that contains any [Children](#dom_children) passed to it, as with [amendNode](#dom_amendnode).

### <a name="dom_dombind">DOMBind</a>
```typescript
interface <T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children): T;
}
```

This utility type is useful for any function that wants to call amendNode or clearNode with the first param set by that function, as used in the [html](#html), [svg](#svg), and [windows](#windows) modules.

### <a name="dom_event">event</a>
```typescript
(fn: Function | EventListenerObject, options: number, signal?: AbortSignal): EventArray;
```

This helper function is used to create [EventArray](#dom_eventarray)s.

The options param is a bitmask created by ORing together the eventOnce, eventCapture, eventPassive, and eventRemove constants, as per need.

### <a name="dom_eventarray">EventArray</a>
```typescript
[EventListenerOrEventListenerObject, AddEventListenerOptions, boolean];
```

This type can be used to set events with [amendNode](#dom_amendnode) and [clearNode](#dom_clearnode). The boolean is true if the event is to be removed.

### <a name="dom_propsobject">PropsObject</a>
```typescript
Record<string, ToString | string[] | DOMTokenList | Function | EventArray | EventListenerObject | StyleObj | ClassObj | undefined>;
```

The keys of this type refer to the attribute names that are to be set. The key determines what type the value should be.
|  Key  |  Description  |
|-------|---------------|
| `on*` | Used to set events. Can be a Function, EventListenerObject, or [EventArray](#dom_eventarray).|
| `class` | An array of strings, or a DOMTokenList, to be used to toggle classes. If a class begins with a `!`, the class will be removed, if the class begins with a `~`, the class will be toggles, otherwise the class will be set. |
| `style` | A CSSStyleDeclaration can be used to set the style directly, or an Object can be used to set individual style properties. |
| `*` | For any key, a string or any object with a toString method can be used to set the field explicitly, a number can be used and converted to a string, a boolean can be used to toggle an attribute, and a undefined value can be used to remove an attribute. |

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

This module directly imports the [dom](#dom) module.

|  Export  |  Type | Description  |
|----------|-------|--------------|
| ns | String | This constant contains the XMLNamespace of HTMLElements. |
| a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark marquee menu meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul video wbr | [DOMBind](#dom_dombind) | Each of these exports is a function which can take either a [Props](#dom_props) param and a [Children](#dom_children) param, or just a [Children](#dom_children) param, both as defined in the [dom](#dom) module, returning an HTMLElement of the exported name, with the attributes and children set. |
| vare | [DOMBind](#dom_dombind) | This function is as above, for the `var` HTMLElement. |

## <a name="inter">inter</a>

## <a name="load">load</a>

The load module should be included in a seperate HTML script element on the page, , and it creates two globally accessible features, which can be added to a TypeScript file with the following declarations:

declare const pageLoad: Promise<void>;
declare const include: (url: string) => Promise<Object>;

|  Property  |  Description  |
|------------|---------------|
| include    | This function is an alias for the import function, but will be used by jspacker for all importing. |
| pageLoad   | This is a Promise which is resolved when the page finished loading. |

## <a name="nodes">nodes</a>

## <a name="rpc">rpc</a>

## <a name="settings">settings</a>

## <a name="svg">svg</a>

The svg module exports function for the create of SVGElements.

This module directly imports the [dom](#dom) module.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| ns       | String | This constant contains the XMLNamespace of SVGElements. |
| a animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect set script stop style svg symbol text textPath title tspan use view | [DOMBind](#dom_dombind) | Each of these exports is a function which can take either a [Props](#dom_props) param and a [Children](#dom_children) param, or just a [Children](#dom_children) param, both as defined in the [dom](#dom) module, returning an SVGElement of the exported name, with the attributes and children set. |
| switche     | [DOMBind](#dom_dombind) | This function is as above, for the `switch` SVGElement. |
| svgData     | Function | This function takes either a SVGSVGElement or a SVGSymbolElement and returns a URL encoded SVG data string. |

## <a name="windows">windows</a>

## <a name="windows_taskbar">windows_taskbar</a>

## <a name="windows_manager">windows_manager</a>
