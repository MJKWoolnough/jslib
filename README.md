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

|  Field  |  Type   |  Description  |
|---------|---------|---------------|
| [add](#fraction_add) | Method | Adds fractions together. |
| [cmp](#fraction_cmp) | Method | Compares two Fractions. |
| [constructor](#fraction_constructor) | Method | Creates new Fractions. |
| [div](#fraction_div) | Method | Divide one Fraction by another. |
| [isNaN](#fraction_isnan) | Method | Determines if a Fraction is NotANumber. |
| [max](#fraction_max) | Static Method | Get the larger of two Fractions. |
| [min](#fraction_min) | Static Method | Get the smaller of two Fractions. |
| [mul](#fraction_mul) | Method | Multiply Fractions together. |
| NaN | Static Fraction | A Fraction representing NaN. |
| one | Static Fraction | A Fraction representing 1. |
| [sign](#fraction_sign) | Method | Returns the sign of the Fraction. |
| [sub](#fraction_sub) | Method | Subtract one Fraction from another. |
| [toFloat](#fraction_tofloat) | Method | Converts a Fraction to a Number. |
| zero | Static Fraction | A Fraction representing 0. |

### <a name="fraction_add">add</a>
```typescript
class Fraction {
	add(num: Fraction) => Fraction;
}
```

The add method creates a new Fraction with the values set as the result of the addition of the two Fraction values.

### <a name="fraction_cmp">cmp</a>
```typescript
class Fraction {
	cmp(num: Fraction) => number;
}
```

The cmp method compares the base Fractions (A) to the passed Fraction (B), resulting in the following:

|  Comparison  |  Return Value  |
|--------------|----------------|
| A < B        | -1             |
| A == B       | 0              |
| A > B        | 1              |
| isNaN(A)     | NaN            |
| isNaN(B)     | NaN            |

### <a name="fraction_constructor">constructor</a>
```typescript
class Fraction {
	constructor(numerator: bigint, denominator: bigint = 1n);
}
```

The constructor of Fraction takes a BigInt numerator and an optional BigInt denominator and returns a Fraction accordingly. A zero (0n) denominator would create a Fraction equivelant of NaN.

### <a name="fraction_div">div</a>
```typescript
class Fraction {
	div(num: Fraction) => Fraction;
}
```

The div method creates a new Fraction with the values set as the result of the base Fraction divided by the passed Fraction.

For example:
```typescript
(new Fraction(2n)).div(new Fraction(3n) =~ new Fraction(2n, 3n);
```

### <a name="fraction_isnan">isNaN</a>
```typescript
class Fraction {
	isNaN() => boolean;
}
```

The isNaN method returns true if the Fraction is equivelant to NaN, which is when the denominator is equal to zero.

### <a name="fraction_max">max</a>
```typescript
class Fraction {
	static max(a: Fraction, b: Fraction) => Fraction;
}
```

This static method returns the larger of the two passed Fraction, or NaN is either param is equivelant to NaN.

### <a name="fraction_min">min</a>
```typescript
class Fraction {
	static min(a: Fraction, b: Fraction) => Fraction;
}
```

This static method returns the smaller of the two passed Fraction, or NaN is either param is equivelant to NaN.

### <a name="fraction_mul">mul</a>
```typescript
class Fraction {
	mul(num: Fraction) => Fraction;
}
```

The div method creates a new Fraction with the values set as the result of the base Fraction multiplied by the passed Fraction.

### <a name="fraction_sign">sign</a>
```typescript
class Fraction {
	sign() => number;
}
```

The sign method returns a number indicating the sign of the value:

|  Fraction Value  |  Return Value  |
|------------------|----------------|
| < 0              | -1             |
| = 0              | 0              |
| > 1              | 1              |
| NaN              | NaN            |

### <a name="fraction_sub">sub</a>
```typescript
class Fraction {
	sub(num: Fraction) => Fraction;
}
```

The sub method creates a new Fraction with the values set as the result of the passed Fraction subtracted from the base Fraction.


For example:
```typescript
(new Fraction(3n)).sub(new Fraction(2n) =~ new Fraction(1n);
```

### <a name="fraction_tofloat">toFloat</a>
```typescript
class Fraction {
	toFloat() => number;
}
```

The toFloat method returns a normal javascript number representation of the Fraction value, to 5 decimal places.

## <a name="html">html</a>

The html module exports function for the create of HTMLElements.

This module directly imports the [dom](#dom) module.

|  Export  |  Type | Description  |
|----------|-------|--------------|
| ns | String | This constant contains the XMLNamespace of HTMLElements. |
| a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark marquee menu meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul video wbr | [DOMBind](#dom_dombind) | Each of these exports is a function which can take either a [Props](#dom_props) param and a [Children](#dom_children) param, or just a [Children](#dom_children) param, both as defined in the [dom](#dom) module, returning an HTMLElement of the exported name, with the attributes and children set. |
| vare | [DOMBind](#dom_dombind) | This function is as above, for the `var` HTMLElement. |

## <a name="inter">inter</a>

The inter module provides classes to aid with communication between otherwise unrelated modules.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| [Pipe](#inter_pipe) | Class | A simple communication class for sending data to multiple clients. |
| [Requester](#inter_requester) | Class | A simple communication class for multiple clients to request data from a server. |
| [Subscription](#inter_subscription) | Class | This class provides a multi-firing version of a Promise. |
| [WaitGroup](#inter_waitgroup) | Class | This Class updates clients on the status of multiple threads of operation. |
| [WaitInfo](#inter_waitinfo) | Type | This type is the info delivered to clients of WaitGroup. |

### <a name="inter_pipe">Pipe</a>

The Pipe Class is used to pass values to multiple registered functions, and contains the following methods:

|  Method  |  Description  |
|----------|---------------|
| [bind](#inter_pipe_bind) | This method can create simple bound functions for the receive, remove, and send methods. |
| [receive](#inter_pipe_receive) | The method is used to register a function to receive data from the Pipe. |
| [remove](#inter_pipe_remove) | The method is used to unregister a function on the Pipe. |
| [send](#inter_pipe_send) |  This method sends data to all registered functions on the Pipe. |

#### <a name="inter_pipe_bind">bind</a>
```typescript
class Pipe<T> {
	bind(bindmask: 1) => [(data: T) => void, undefined, undefined];
	bind(bindmask: 2) => [undefined, (fn: (data: T) => void) => void, undefined];
	bind(bindmask: 3) => [(data: T) => void, (fn: (data: T) => void) => void, undefined];
	bind(bindmask: 4) => [undefined, undefined, (fn: (data: T) => void) => void];
	bind(bindmask: 5) => [(data: T) => void, undefined, (fn: (data: T) => void) => void];
	bind(bindmask: 6) => [undefined, (fn: (data: T) => void) => void, (fn: (data: T) => void) => void];
	bind(bindmask?: 7) => [(data: T) => void, (fn: (data: T) => void) => void, (fn: (data: T) => void) => void];
}
```

This method returns an Array of functions bound to the send, receive, and remove methods of the Pipe Class. The bindmask determines which methods are bound.

|  Mask Bit Value  |  Method  |
|------------------|----------|
| 1                | [send](#inter_pipe_send) |
| 2                | [receive](#inter_pipe_receive) |
| 4                | [remove](#inter_pipe_remove) |

The return will return the following:
[*send bound function*,  *receive bound function*, *remove bound function*]

#### <a name="inter_pipe_receive">receive</a>
```typescript
class Pipe<T> {
	receive(fn: (data: T) => void) => void;
}
```

The passed function will be registered on the Pipe and will receive any future values sent along it.

NB: The same function can be set multiple times, and will be for each time it is set.

#### <a name="inter_pipe_remove">remove</a>
```typescript
class Pipe<T> {
	remove(fn: (data: T) => void) => void;
}
```

The passed function will be unregistered from the Pipe and will no longer receive values sent along it.

NB: If the function is registered multiple times, only a single entry will be unregistered.

#### <a name="inter_pipe_send">send</a>
```typescript
class Pipe<T> {
	send(data: T) => void;
}
```

This function sends the data passed to any functions registered on the Pipe.

### <a name="inter_requester">Requester</a>

The Requester Class is used to allow a server to set a function or value for multiple clients to query and contains the following methods:

|  Method  |  Description  |
|----------|---------------|
| [request](#inter_requester_request) | This method is used to request data from the Requester object. |
| [responder](#inter_requester_responder) | This method is used to set either a responder function or value on the Requester object. |

#### <a name="inter_requester_request">request</a>
```typescript
class Requester<T, U extends any[] = any[]> {
	request(...data: U) => T;
}
```

The request method sends data to a set responder and receives a response. Will throw an error if no responder is set.

#### <a name="inter_requester_responder">responder</a>
```typescript
class Requester<T, U extends any[] = any[]> {
	responder(f: ((...data: U) => T) | T) => void;
}
```

The responder method sets either the function that will respond to any request, or the value that will be the response to any request.

### <a name="inter_subscription">Subscription</a>

The Subscription Class is similar to the Promise class, but any success and error functions can be called multiple times.


|  Method  |  Type  |  Description  |
|----------|--------|---------------|
| [bind](#inter_subscription_bind) | Static Method | This method binds the then, error, and cancel functions. |
| [cancel](#inter_subscription_cancel) | Method | This method sends a cancel signal up the Subscription chain. |
| [catch](#inter_subscription_catch) | Method | This method acts like the Promise.catch method. |
| [constructor](#inter_subscription_constructor) | Constructor | This constructs a new Subscription. |
| [finally](#inter_subscription_finally) | Method | This method acts like the Promise.finally method. |
| [merge](#inter_subscription_merge) | Static Method | This combines several Subscriptions into one. |
| [splitCancel](#inter_subscription_splitcancel) | Method | This method set all child Subscription objects to remove themselves from this Subscription using the cancel method. |
| [then](#inter_subscription_then) | Method | This method acts like the Promise.then method. |

#### <a name="inter_subscription_bind">bind</a>
```typescript
class Subscription<T> {
	static bind<T>(bindmask: 1) => [Subscription<T>, (data: T) => void, undefined, undefined];
	static bind<T>(bindmask: 2) => [Subscription<T>, undefined, (data: any) => void, undefined];
	static bind<T>(bindmask: 3) => [Subscription<T>, (data: T) => void, (data: any) => void, undefined];
	static bind<T>(bindmask: 4) => [Subscription<T>, undefined, undefined, (data: () => void) => void];
	static bind<T>(bindmask: 5) => [Subscription<T>, (data: T) => void, undefined, (data: () => void) => void];
	static bind<T>(bindmask: 6) => [Subscription<T>, undefined, (data: any) => void, (data: () => void) => void]; 
	static bind<T>(bindmask?: 7) => [Subscription<T>, (data: T) => void, (data: any) => void, (data: () => void) => void];
}
```

This method returns an Array of functions bound to the then, error, and cancel methods of the Subscription Class. The bindmask determines which methods are bound.

|  Mask Bit Value  |  Method  |
|------------------|----------|
| 1                | [then](#inter_subscription_then) |
| 2                | [error](#inter_subscription_error) |
| 4                | [cancel](#inter_subscription_cancel) |

The return will return the following:
[*then bound function*,  *error bound function*, *cancel bound function*]

#### <a name="inter_subscription_cancel">cancel</a>
```typescript
class Subscription<T> {
	cancel() => void;
}
```

This method sends a signal up the Subscription chain to the cancel function set during the construction of the original Subscription.

#### <a name="inter_subscription_catch">catch</a>
```typescript
class Subscription<T> {
	catch<TResult = never>(errorFn: (data: any) => TResult) => Subscription<T | TResult>;
}
```

The catch method act similarly to the catch method of the Promise class, except that it can be activated multiple times.

#### <a name="inter_subscription_constructor">constructor</a>
```typescript
class Subscription<T> {
	constructor(fn: (successFn: (data: T) => void, errorFn: (data: any) => void, cancelFn: (data: () => void) => void) => void)
}
```

The constructor of the Subscription class takes a function that receives success, error, and cancel functions.

The success function can be called multiple times and will send any params in the call on to any 'then' functions.

The error function can be called multiple times and will send any params in the call on to any 'catch' functions.

The cancel function can be called at any time with a function to deal with any cancel signals generated by this Subscription object, or any child Subscription objects.

#### <a name="inter_subscription_finally">finally</a>
```typescript
class Subscription<T> {
	finally(afterFn: () => void) => Subscription<T>
}
```

The finally method act similarly to the finally method of the Promise class, except that it can be activated multiple times.

#### <a name="inter_subscription_merge">merge</a>
```typescript
class Subscription<T> {
	static merge<T>(...subs: Subscription<T>[]) => Subscription<T>;
}
```

The merge static method combines any number of Subscription objects into a single subscription, so that all parent success and catch calls are combined, and any cancel signal will be sent to all parents.

#### <a name="inter_subscription_splitcancel">splitCancel</a>
```typescript
class Subscription<T> {
	splitCancel(cancelOnEmpty = false) => () => Subscription<T>;
}
```

This method creates a break in the cancel signal chain, so that any cancel signal simply removes that Subscription from it's parent.

The cancelOnEmpty flag, when true, will send an actual cancel signal all the way up the chain when called on the last split child.

#### <a name="inter_subscription_then">then</a>
```typescript
class Subscription<T> {
		then<TResult1 = T, TResult2 = never>(successFn?: ((data: T) => TResult1) | null, errorFn?: ((data: any) => TResult2) | null) => Subscription<TResult1 | TResult2>;
}
```

The then method act similarly to the then method of the Promise class, except that it can be activated multiple times.

### <a name="inter_waitgroup">WaitGroup</a>

The WaitGroup Class is used to wait for multiple asynchronous taks to complete.

|  Method  |  Type  |  Description  |
|----------|--------|---------------|
| [add](#inter_waitgroup_add) | Method | Adds to the number of tasks. |
| [done](#inter_waitgroup_done) | Method | Adds to the number of complete tasks. |
| [error](#inter_waitgroup_error) | Method | Adds to the number of failed tasks. |
| [onComplete](#inter_waitgroup_oncomplete) | Method | Callback method to be run on completion of all tasks. |
| [onupdate](#inter_waitgroup_onupdate) | Method | Callback method to be run on any change. |

#### <a name="inter_waitgroup_add">add</a>
```typescript
class WaitGroup {
	add() => void;
}
```

This method adds to the number of registered tasks.

#### <a name="inter_waitgroup_donn">done</a>
```typescript
class WaitGroup {
	done() => void;
}
```

This method adds to the number of complete tasks.

#### <a name="inter_waitgroup_error">error</a>
```typescript
class WaitGroup {
	error() => void;
}
```

This method adds to the number of failed tasks.

#### <a name="inter_waitgroup_oncomplete">onComplete</a>
```typescript
class WaitGroup {
	onComplete(fn: (wi: WaitInfo) => void) => () => void;
}
```

This method registers a function to run when all registered tasks are complete, successfully or otherwise.

This method returns a function to unregister the supplied function.

#### <a name="inter_waitgroup_onupdate">onUpdate</a>
```typescript
class WaitGroup {
	onUpdate(fn: (wi: WaitInfo) => void) => () => void;
}
```

This method registers a function to run whenever a task is added, completed, or failed.

This method returns a function to unregister the supplied function.

### <a name="inter_waitinfo">WaitInfo</a>

The WaitInfo type contains the following data:

|  Field  |  Type  |  Description  |
|---------|--------|---------------|
| done    | number | The number of complete tasks. |
| errors  | number | The number of failed tasks. |
| waits   | number | The total number of registered tasks. |

## <a name="load">load</a>

The load module should be included in a separate HTML script element on the page, , and it creates two globally accessible features, which can be added to a TypeScript file with the following declarations:

declare const pageLoad: Promise<void>;
declare const include: (url: string) => Promise<Object>;

|  Property  |  Description  |
|------------|---------------|
| include    | This function is an alias for the import function, but will be used by jspacker for all importing. |
| pageLoad   | This is a Promise which is resolved when the page finished loading. |

## <a name="nodes">nodes</a>

The nodes module contains Classes for aiding in the accessing of DOM Nodes.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| <a name="nodes_node">node</a> | Symbol | This Symbol is used to specify the Node of a type. |
| [NodeArray](#nodes_nodearray) | Class | This Class provides Array-like access to DOM Nodes. |
| [NodeMap](#nodes_nodemap) | Class | This Class provides Map-like access to DOM Nodes. |
| noSort | Function | A sorting function that does no sorting. |
| stringSort | Function | A function to sort strings. |

### <a name="nodes_nodearray">NodeArray</a>

This class provides Array-like access to DOM Nodes, allowing them to be sorted and accessed via position-based indexes.

This type implements all fields and methods of the Array interface, except for the following changes:

|  Field  |  Type  |  Differences |
|---------|--------|--------------|
| [node]  | Node   | New field to access base Node. |
| concat | Method | Returns a normal Array, not a NodeArray. |
| [constructor](#nodes_nodearray_constructor) | Constructor | Takes very different params to initialise a NodeArray. |
| copyWithin | Method | Not applicable and throws an error. |
| fill | Method | Not applicable and throws an error. |
| filterRemove | Method | New method that works like `filter` but also removes the filtered items. |
| [from](#nodes_nodearray_from) | Static Method | Takes very different params to initialise a NodeArray. |
| [reverse](#nodes_nodearray_reverse) | Method | Reverses the sorting of the [Item](#nodes_item)s. |
| slice | Method | Returns a normal Array, not a NodeArray. |
| [sort](#nodes_nodearray_sort) | Method | Sorts the [Item](#nodes_item)s. |

#### <a name="nodes_nodearray_constructor">constructor</a>
```typescript
class NodeArray<T extends Item, H extends Node = Node> implements Array<T> {
	constructor(parent: H, sort: (a: T, b: T) => number = noSort, elements: Iterable<T> = []);
}
```

The NodeArray constructor takes a parent element, onto which all [Item](https://stackedit.io/app#nodes_item) elements will be attached, an optional starting sort function, and an optional set of starting elements of type `T`.

The sorting function is used to order [Item](#nodes_item)s as they are inserted.

The NodeArray type is wrapped with a Proxy to implement Array-like indexing.

#### <a name="nodes_nodearray_from">from</a>
```typescript
class NodeArray<T extends Item, H extends Node = Node> implements Array<T> {
	static from<_, H extends Node = Node>(parent: H) => NodeArray<Item, H>;
	static from<T extends Item, H extends Node = Node>(parent: H, itemFn: (node: Node) => T|undefined) => NodeArray<T, H>;
	static from<T extends Item = Item, H extends Node = Node>(parent: H, itemFn = (n: Node) => ({[node]: n})) => NodeArray<T, H>;
}
```

This function will create a NodeArray from the given parent Node, iterating over every child and running the itemFn to generate an [Item](#nodes_item)  to be append to the NodeArray.

#### <a name="nodes_nodearray_reverse">reverse</a>
```typescript
class NodeArray<T extends Item, H extends Node = Node> implements Array<T> {
	reverse() => void;
}
```

The reverse method reverse the position of each [Item](#nodes_item) and reverses the sorting algorithm.

#### <a name="nodes_nodearray_sort">sort</a>
```typescript
class NodeArray<T extends Item, H extends Node = Node> implements Array<T> {
	sort(compareFunction?: (a: T, b: T) => number) => NodeArray<T>;
}
```

The sort method works much like the Array sort method, but new items will be inserted according to the sorting function provided.

Running this function with no param will result in the NodeArray being re-sorted according to the existing sorting function.

### <a name="nodes_nodemap">NodeMap</a>

This class provides Map-like access to DOM Nodes, allowing them to be sorted and accessed via keys.

This type implements all fields and methods of the Map interface, except for the following changes:

|  Field  |  Type  |  Differences |
|---------|--------|--------------|
| [node]  | Node   | New field to access base Node. |
| [constructor](#nodes_nodemap_constructor) | Constructor | Takes very different params to initialise a NodeMap. |
| [insertAfter](#nodes_nodemap_insertAfter) | Method | Inserts an [Item](#nodes_item) after another. |
| [insertBefore](#nodes_nodemap_insertbefore) | Method | Inserts an [Item](#nodes_item) before another. |
| [keyAt](#nodes_nodemap_keyat) | Method | Returns the key of the [Item](#nodes_item) at the specified position. |
| [position](#nodes_nodemap_position) | Method | Returns the position of the [Item](#nodes_item) specified by the key. |
| [reSet](#nodes_nodemap_reset) | Method | Changes the key for an item. |
| [reverse](#nodes_nodemap_reverse) | Method | Reverses the sorting of the [Item](#nodes_item)s. |
| [sort](#nodes_nodemap_sort) | Method | Sorts the [Item](#nodes_item)s. |

#### <a name="nodes_nodemap_constructor">constructor</a>
```typescript
class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	constructor(parent: H, sort: (a: T, b: T) => number = noSort, entries: Iterable<[K, T]> = []);
}
```

The NodeMap constructor takes a parent element, onto which all [Item](https://stackedit.io/app#nodes_item) elements will be attached, an optional starting sort function, and an optional set of starting elements of type `T`.

The sorting function is used to order [Item](https://stackedit.io/app#nodes_item)s as they are inserted.

#### <a name="nodes_nodemap_insertafter">insertAfter</a>
```typescript
class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	insertAfter(k: K, item: T, after: K) => boolean;
}
```

The insertAfter method will insert a new [Item](#nodes_item) after the [Item](#nodes_item) denoted by the `after` key.

The method will return true unless the `after` key cannot be found, in which case it will return false.

#### <a name="nodes_nodemap_insertbefore">insertBefore</a>
```typescript
class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	insertBefore(k: K, item: T, before: K) => boolean;
}
```

The insertBefore method will insert a new [Item](#nodes_item) before the [Item](#nodes_item) denoted by the `before` key.

The method will return true unless the `before` key cannot be found, in which case it will return false.

#### <a name="nodes_nodemap_keyAt">keyAt</a>
```typescript
class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	keyAt(pos: number) => T | undefined;
}
```

The keyAt method returns the position of the key in within the sorted [Item](#nodes_item). It returns undefined if there is nothing at the specified position.

#### <a name="nodes_nodemap_position">position</a>
```typescript
class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	position(key: K) => number;
}
```

The position method returns the current sorted position of the [Item](#nodes_item) described by the key.

#### <a name="nodes_nodemap_reset">reSet</a>
```typescript
class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	reSet(k: K, j: K) => void;
}
```

The reset method changes the key assigned to an [Item](#nodes_item) without performing any sorting.

#### <a name="nodes_nodemap_reverse">reverse</a>
```typescript
class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	reverse() => void;
}
```

The reverse method reverse the position of each [Item](#nodes_item) and reverses the sorting algorithm.

#### <a name="nodes_nodemap_sort">sort</a>
```typescript
class NodeMap<K, T extends Item, H extends Node = Node> implements Map<K, T> {
	sort(compareFunction?: (a: T, b: T) => number) => NodeMap<T>;
}
```

The sort method sorts the [Item](#nodes_item) s, and new items will be inserted according to the sorting function provided.

Running this function with no param will result in the NodeMap being re-sorted according to the existing sorting function.

### <a name="nodes_item">Item</a>
```typescript
interface {
	[node]: Node;
}
```

This unexported type satifies any type has used the [node](#nodes_node) Symbol to delegate a Node element.

## <a name="rpc">rpc</a>

## <a name="settings">settings</a>

## <a name="svg">svg</a>

The svg module exports function for the create of SVGElements.

This module directly imports the [dom](#dom) module.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| ns | String | This constant contains the XMLNamespace of SVGElements. |
| a animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect set script stop style svg symbol text textPath title tspan use view | [DOMBind](#dom_dombind) | Each of these exports is a function which can take either a [Props](#dom_props) param and a [Children](#dom_children) param, or just a [Children](#dom_children) param, both as defined in the [dom](#dom) module, returning an SVGElement of the exported name, with the attributes and children set. |
| switche | [DOMBind](#dom_dombind) | This function is as above, for the `switch` SVGElement. |
| svgData | Function | This function takes either a SVGSVGElement or a SVGSymbolElement and returns a URL encoded SVG data string. |

## <a name="windows">windows</a>

## <a name="windows_taskbar">windows_taskbar</a>

## <a name="windows_manager">windows_manager</a>
