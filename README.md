# JSLib

JSLib is a collection of lightweight JavaScript/Typescript modules and scripts for web development.

# Modules

|  Module                                     |  Description  |
|---------------------------------------------|---------------|
| [bbcode](#bbcode)                           | A BBCode parser. |
| [bbcode_tags](#bbcode_tags)                 | A collection of BBCode tags. |
| [conn](#conn)                               | Convenience wrappers around [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) and [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket). |
| [css](#css)                                 | A simple CSS management library. |
| [dom](#dom)                                 | Functions for manipulating the DOM. |
| [drag](#drag)                               | Library for making browser Drag'n'Drop easier to use. |
| [events](#events)                           | Functions to simplify starting & stopping global keyboard and mouse events. |
| [fraction](#fraction)                       | An infinity precision fractional math type. |
| [html](#html)                               | Functions to create HTML elements. |
| [inter](#inter)                             | Classes to provide different type of internal communication. |
| [load](#load)                               | Used for initialisation. |
| [menu](#menu)                               | Library for creating right-click menus. |
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
| requiredHTML | This script walks a javascript import tree to determine which imports from the [html](#html) module are being used. Can be used as the first argument to the `html` script. |
| requiredSVG  | This script walks a javascript import tree to determine which imports from the [svg](#svg) module are being used. Can be used as the first argument to the `svg` script. |
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
| [process](#bbcode_process) | Function | Intended for tag parsers, appends parse BBCode to the passed [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node). |
| [TagFn](#bbcode_tagfn) | Type | A type representing a tag handler. |
| text | Symbol | A [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) used to indicate the text processor in the Parsers type passed to the [(default)](#bbcode_default) parsing function. |
| [Tokeniser](#bbcode_tokeniser) | Type | Intended for tag parsers, this type represents the token generator. |

### Example
```typescript
import bbcode from './bbcode.js';
import {all} from './bbcode_tags.js';

bbcode(all, "[b]Hello[/b], [u]World[/u]")
```

The above will return a [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) containing the following:
```html
<span style="font-weight: bold">Hello</span>, <span style="text-decoration: underline">World</span>
```

### <a name="bbcode_default">(default)</a>

```typescript
(parsers: Parsers, text: string) => DocumentFragment;
```

This function parses the given text according, handling the tags with the given parsers, and appending all generated [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)s to a [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment), which is returned.

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

This type represents an Object, which contains the tag parsers for specific tags and the text processor. This object **must** contain the text [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol), specifying a text formatting function, which takes a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) to be appended to, and the string to be formatted. In addition, this object should contain string keys, which correspond to tag names, the values of which should be [TagFn](#bbcode_tagfn)s.

### <a name="bbcode_process">process</a>
```typescript
<T extends Node>(node: T, t: Tokeniser, p: Parsers, closeTag?: string) => T;
```

Intended for tag parsers, this function takes a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node), a [Tokeniser](#bbcode_tokeniser), a [Parsers](#bbcode_parsers) object and a closing tag name. It will run the tokeniser, handling tags according to the [Parsers](#bbcode_parsers) object, attaching the results to the passed [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node), until it reaches a [CloseTag](#bbcode_closetag) matching the name specified, when it will return the original [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) passed.

### <a name="bbcode_tagfn">tagFn</a>
```typescript
(node: Node, t: Tokeniser, p: Parsers) => void;
```

A function that takes a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node), a [Tokeniser](#bbcode_tokeniser), and a [Parsers](#bbcode_parsers) object. This function should process tokens from the [Tokeniser](#bbcode_tokeniser), appending to the [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node), until its tag data finishes. This function should return nothing.

### <a name="bbcode_tokeniser">Tokeniser</a>
```typescript
Generator<OpenTag | CloseTag | string, void, true | 1 | undefined>;
```

This type is a generator that will yield a token, which will either be a [CloseTag](#bbcode_closetag), [OpenTag](#bbcode_opentag), or string. When calling next on this Generator, you can pass in *true* to the *next* method retrieve the last token generated. If you pass in `1` to the `next` method, when it has just outputted an [OpenTag](#bbcode_opentag), the processor will not move passed the corresponding [CloseTag](#bbcode_closetag) until `1` is again passed to the `next` method.

## <a name="bbcode_tags">bbcode_tags</a>

This module contains many standard [BBCode](https://en.wikipedia.org/wiki/BBCode) tags parsers, and a default text processor.

This module directly imports the [bbcode](#bbcode), [dom](#dom), and [html](#html) modules.

|  Export       |  Type    |  Description  |
|---------------|----------|---------------|
| all           | [Parsers](#bbcode_parsers) | An object which contains all of the tag processors and the text processor. |
| none          | [TagFn](#bbcode_tagfn) | A special tag processor that ignores the tag and continues processing the inner text. |
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

The conn module contains some convenience wrappers around [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) and [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

This module directly imports the [inter](#inter) module.

|  Exports  |  Type  |  Description  |
|-----------|--------|---------------|
| [HTTPRequest](#conn_httprequest) | Function | The function provides a promise base wrapper to [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest). |
| [Properties](#conn_properties) | Type | This object is passed to a HTTPRequest to modify its options. |
| [WS](#conn_ws) | Function | This function provides a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) based initialiser for WSConn. |
| [WSConn](#conn_wsconn) | Class | This class extends the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) class. |

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

In its simplest incarnation, this function takes a URL a returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) which will return the string response from that URL. However, the passed [Properties](#conn_properties) object can modify both how the request is sent and the response interpreted.

#### Examples
```typescript
import {HTTPRequest} from './conn.js';

HTTPRequest("conn.js").then(data => console.log(data));
```

In this example to source code of the conn.js library will be printed to the console.

```typescript
import {HTTPRequest} from './conn.js';

HTTPRequest("conn.js", {method: "HEAD", response: "xh"}).then(xh => console.log(xh.getResponseHeader("Content-Length")));
```

In this example a HEAD request is used to get print the size of conn.js library to the console.

```typescript
import {HTTPRequest} from './conn.js';

const data = new FormData();

data.append("search", "name");

HTTPRequest<{names: string; count: number}>("/postHandler", {method: "POST", response: "json", data}).then(data => console.log(data.count));
```

In this example data is sent to a post handler, returning a JSON response which is automatically parsed.

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
| response          | This determines the expected return type of the promise. One of `text`, `xml`, `json`, `blob`, `arraybuffer`, `document`, or `xh`. The default is `text` and `xh` simply returns the [XMLHTTPRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) object as a response. Response type `json` will parse the retrieved text as JSON and return the parsed object. |
| onuploadprogress  | This sets an event handler to monitor any upload progress. |
|ondownloadprogress | This sets an event handler to monitor any download process. |
| data              | This is an [XMLHttpRequestBodyInit](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#body) and is send as the body of the request. |
| signal            | An [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to be used to cancel any request. |

### <a name="conn_ws">WS</a>
```typescript
(url: string) => new Promise<WSConn>;
```

This function takes a url and returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) which will resolve with an initiated [WSConn](#conn_wsconn) on a successful connection.

### <a name="conn_wsconn">WSConn</a>

WSConn extends the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) class, allowing for the passed URL to be relative to the current URL.

In addition, it adds a method:
```typescript
when<T = any, U = any>(ssFn?: (data: MessageEvent) => T, eeFn?: (data: string) => U) => Subscription<MessageEvent>;
```

This method acts like the [then](#inter_subscription_then) method of the [Subscription](#inter_subscription) class from the [inter](#inter) module, taking an optional success function, which will receive a MessageEvent object, and an optional error function, which will receive an error string. The method returns a [Subscription](#inter_subscription) object with the success and error functions set to those provided.

## <a name="css">css</a>

This module contains a simple class for generating CSS style elements.

This module directly imports the [html](#html) module, and indirectly imports the [dom](#dom) module.

|  Export   |  Type    |  Description  |
|-----------|----------|---------------|
| [(default)](#css_css)| Class | The CSS class handles a collection of CSS declarations to be rendered into a [style](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style) element. |
| add       | Function | The [add](#css_css_add) method of a default instance of the default [CSS](#css_css) class. |
| query     | Function | The [query](#css_css_query) method of a default instance of the default [CSS](#css_css) class. |
| id        | Function | The [id](#css_css_id) method of a default instance of the default [CSS](#css_css) class. |
| ids       | Function | The [ids](#css_css_id) method of a default instance of the default [CSS](#css_css) class. |
| render    | Function | The [render](#css_css_render) method of a default instance of the default [CSS](#css_css) class. |

### <a name="css_css">CSS</a>

|  Method  |  Description  |
|----------|---------------|
| [add](#css_css_add) | A method to add a CSS declaration. |
| [constructor](#css_css_constructor) | Used to create a new instance of the class. |
| [id](#css_css_id) | Creates a unique ID within this instance. |
| [ids](#css_css_ids) | Creates multiple unique IDs within this instance. |
| [query](#css_css_query) | A method to add a CSS media query section. |
| [render](#css_css_render) | Compiles all of the CSS declarations into a [style](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style) element. |
| toString | Returns the CSS declarations as a compiled string. |

#### <a name="css_css_add">add</a>
```typescript
class CSS {
	add(selector: string, def: Def): this;
}
```

This method takes a CSS selector string and a [Def](#css_def) object containing all of the style information. The CSS instance if returned for simple method chaining.

#### <a name="css_css_constructor">constructor</a>
```typescript
class CSS {
	constructor(prefix = "", idStart = 0);
}
```

The constructor takes an optional prefix, which will be applied to all returns from the [id](#css_css_id) method. It will default to the underscore character if it is not provided or if the prefix given is not allowed for classes or IDs.

The idStart param defines the starting ID for returns from the [id](#css_css_id) method.

#### <a name="css_css_id">id</a>
```typescript
class CSS {
	id(): string;
}
```

This method will return sequential unique ids to be used as either class names or element IDs. The prefix of the string will be as provided to the [constructor](#css_css_constructor) and the suffix will be an increasing number starting at the value provided to the [constructor](#css_css_constructor).

#### <a name="css_css_ids">id</a>
```typescript
class CSS {
	ids(n: number): string[];
}
```

This method will return a number (n) of unique ids, as per the [id](#css_css_id) method.

#### <a name="css_css_quert">query</a>
```typescript
class CSS {
	query(query: string, defs: Record<string, Def>): this;
}

```

This method adds a [Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries) section to the CSS object, filled with the styling generated by the defs object, as per the [add](#css_css_add) method. Does not currently support nested at-rule queries.

#### <a name="css_css_render">render</a>
```typescript
class CSS {
	render(): HTMLStyleElement;
}
```

This method generates a new [HTMLStyleElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLStyleElement) that contains all of the data currently supplied to the class.

### <a name="css_def">Def</a>
```typescript
interface Def {
	[key: string]: Value | Def;
}
```

This unexported interface defines the structure of the CSS data provided to the [add](#css_css_add) method.

The key can refer to property name or an extended selector.

When the key is a property name, the value will be a [Value](#css_value) type.

When the key is an extended selector, it will be logically appended to the current selector and processed as in a call to the [add](#css_css_add) method with the value Def. The logical appending splits both the parent and extended selectors at the ',' seperator and concatenates all pairs together, seperated by ',' seperators.

### <a name="css_value">Value</a>
```typescript
type Value = string | number | ToString;
```

This unexported type represents a CSS value, as either a string, number or any object with the toString [method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString).

## <a name="dom">dom</a>

The dom module can be used to manipulate DOM elements.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| [amendNode](#dom_amendnode) | Function | This convenience function modifies a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) or EventTarget. |
| [autoFocus](#dom_autofocus) | Function | This function queues a focus method call to the passed element. |
| <a name="dom_clearnode">clearNode</a> | Function | This function acts identically to [amendNode](#dom_amendnode) except that it clears any children before amending. |
| [Bind](#dom_bind) | Type | Objects that implement this type can be used with [amendNode](#dom_amendnode)/[clearNode](#dom_clearnode) to create Children and Attributes that can be updated just by setting a value. |
| [bind](#dom_bind_fn) | Function | Creates bound text objects that can be used with [amendNode](#dom_amendnode)/[clearNode](#dom_clearnode) functions. |
| [bindElement](#dom_bindelement) | Function | This function simplifies binding of [amendNode](#dom_amendnode). |
| [Children](#dom_children) | Type | This type is a string, [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node), [NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList), [HTMLCollection](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection), or a recursive array of those. |
| [createDocumentFragment](#dom_createdocumentfragment) | Function | This convenience function creates a [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment). |
| [DOMBind](#dom_dombind) | Type | This type represents a binding of either [amendNode](#dom_amendnode) or [clearNode](#dom_clearnode) with the first param bound. |
| [event](#dom_event) | Function | This helper function helps with setting up events for [amendNode](#dom_amendnode). |
| eventCapture | Number | Can be passed to the [event](#dom_event) function to set the `capture` property on an event. |
| eventOnce | Number | Can be passed to the [event](#dom_event) function to set the `once` property on an event. |
| eventPassive | Number| Can be passed to the [event](#dom_event) function to set the `passive` property on an event. |
| eventRemove | Number | Can be passed to the [event](#dom_event) function to set the event to be removed. |
| <a name="dom_props">Props</a> | Type | A [PropsObject](#dom_propsobject) or [NamedNodeMap](https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap). |
| [PropsObject](#dom_propsobject) | Type | This object is used to set attributes and events on a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) or EventTarget with the [amendNode](#dom_amendnode) and [clearNode](#dom_clearnode) functions. |

### <a name="dom_amendnode">amendNode</a>
```typescript
interface {
	<T extends EventTarget>(element: T, properties: Record<`on${string}`, EventListenerObject | EventArray | Function>): T;
	<T extends Node>(element: T, properties?: Props, children?: Children): T;
	<T extends Node>(element: T, children?: Children): T;
	<T extends Node>(element?: T | null, properties?: Props | Children, children?: Children): T;
}
```

This fuction is used to set attributes and children on [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)s, and events on [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)s and other [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)s.

If the element passed is a [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) or [SVGElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement), then a properties param is processed, applying attributes as per the [PropsObject](#dom_propsobject) type. Likewise, any events are set or unset on a passed [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget), as per the [PropsObject](#dom_propsobject) type.

For any Node, the children are set according to the [Children](#dom_children) value.

This function returns the element passed to it.

NB: Due to how this function uses instanceof to determine what can be applied to it, it will fail in unexpected ways with types created from proxies of the DOM classes, such as those used with [window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)

### <a name="dom_autofocus">autoFocus</a>
```typescript
<T extends FocusElement>(node: T, inputSelect = true) => T;
```

This queues a focus method call to the passed element, and will call select on any [HTMLInputElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement) or [HTMLTextAreaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement), unless false is passed as the second param.

### <a name="dom_bind">Bind</a>
```typescript
export type Bind<T extends ToString = ToString> {
	value: T;
	constructor(value: T);
	toString(): string;
}
```

Onjects that implement this type can be used in place of both property values and Children in calls to [amendNode](#dom_amendnode) and [clearNode](#dom_clearnode), as well as the bound element functions from the [html.js](#html) and [svg.js](#svg) modules.

When the value on the class is changed, the values of the properties and the child nodes will update accordingly.

### <a name="dom_bind">bind</a>
```typescript
<T extends ToString = ToString>(t: T): Bind<T>;
(strings: TemplateStringsArray, ...bindings: (Bind | ToString)[]): Binder;
```

This function can be used either as a normal function, binding a single value, or as a template tag function.

When used normally, this function takes a single starting value and returns a [Bind](#dom_bind) class with that value set.

When used as a tag function, this function will return a type that is bound to all Bind expressions used within the template.

Both returned types can be used as attributes or children in amendNode and clearNode calls.

### <a name="dom_bindelement">bindElement</a>
```typescript
<T extends Element>(ns: string, value: string) => DOMBind<T>;
```

This function binds the amendNode function with the first argument to to `document.createElementNS(ns, value)`. In addition, this function sets the name of the function to `value`.

### <a name="dom_children">Children</a>
```typescript
string | Node | NodeList | HTMLCollection | Children[];
```

This type is a string, [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node), [NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList), [HTMLCollection](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection), or a recursive array of those.

### <a name="dom_createdocumentfragment">createDocumentFragment</a>
```typescript
(children?: Children) => DocumentFragment;
```

This function creates a [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) that contains any [Children](#dom_children) passed to it, as with [amendNode](#dom_amendnode).

### <a name="dom_dombind">DOMBind</a>
```typescript
interface <T extends Node> {
	(properties?: Props, children?: Children): T;
	(children?: Children): T;
}
```

This utility type is useful for any function that wants to call [amendNode](#dom_amendNode) or [clearNode](#dom_clearnode) with the first param set by that function, as used in the [html](#html) and [svg](#svg) modules.

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

The keys of this type refer to the attribute names that are to be set. The key determines what type the value should be:

|  Key  |  Description  |
|-------|---------------|
| `on*` | Used to set events. Can be a Function, [EventListenerObject](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#the_event_listener_callback), or [EventArray](#dom_eventarray).|
| `class` | An array of strings, a [DOMTokenList](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList), or an object with string keys and boolean or undefined values, to be used to toggle classes. For the array and DOMTokenList, if a class begins with a `!`, the class will be removed, if the class begins with a `~`, the class will be toggled, otherwise the class will be set. For the object, a value that equates to true will set the class, and a value that equates to false (except nullables, which will toggle the class) will unset the class. |
| `style` | A [CSSStyleDeclaration](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration) can be used to set the style directly, or an Object can be used to set individual style properties. |
| `*` | For any key, a string or any object with a toString method can be used to set the field explicitly, a number can be used and converted to a string, a boolean can be used to toggle an attribute, and a undefined value can be used to remove an attribute. |

## <a name="drag">drag</a>

The drag module aids with handling [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent)s, allowing the transfer of complex objects without having to resort to encoding as JSON.

|  Export        |  Type  |  Description  |
|----------------|--------|---------------|
| [DragTransfer](#drag_dragtransfer) | Class | This class creates a management object for a particular class of dragged objects. |
| [DragFiles](#drag_dragfiles) | Class | This class helps with dragged [File](https://developer.mozilla.org/en-US/docs/Web/API/File)s. |
| [setDragEffect](#drag_setdrageffect | Function | This function creates a helper function with sets the drop effect icon in a [dragover](https://developer.mozilla.org/en-US/docs/Web/API/Document/dragover_event) event. |

### <a name="drag_checkeddragevent">CheckedDragEvent</a>
```typescript
interface CheckedDragEvent extends DragEvent {
	dataTransfer: DataTransfer;
}
```

This unexported type is used by [DragFiles](#drag_dragfiles) [is](#drag_dragfiles_is) method to mark the [DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) as existing on a [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent).

### <a name="drag_checkeddt">CheckedDT</a>
```typescript
interface CheckedDT<T> extends DragTransfer<T> {
	get(e: DragEvent): T;
}
```

This unexported type is used by [DragTransfer](#drag_dragtransfer)s [is](#drag_dragtransfer_is) method to mark the DragTransfers [get](#drag_dragtransfer_get) method as guaranteed to return a T.

### <a name="drag_dragtransfer">DragTransfer</a>

The DragTransfer class is used to register and handle drag targets for drop targets to retrieve. It has the following methods:

|  Method  |  Description  |
|----------|---------------|
| constructor | The `constructor` takes a format string which uniquely identifies the drag type, as per the [DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer)s [setData](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setData) method. |
| [deregister](#drag_dragtransfer_deregister) | The method unregisters a [Transfer](#drag_transfer) type registered with the [register](#drag_dragtransfer_register) method. |
| [get](#drag_dragtransfer_get) | The method is to be used during a [DragOver](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event) or [drop](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event) event to get a drag object. |
| [is](#drag_dragtransfer_is) | This method determines if the dragged object is registered with this object. |
| [register](#drag_dragtransfer_register) | This method is used to register objects for dragging. |
| [set](#drag_dragtransfer_set) | The method is used during a [dragstart](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragstart_event) event to mark an object as being dragged. |

### <a name="drag_dragtransfer_deregister">deregister</a>
```typescript
export class DragTransfer<T = any> {
	deregister(key: string): void;
}
```

This method takes the key returned from the [register](#drag_dragtransfer_register) method and stops it from being used as a drag target. Required for an item to be garbage collected.

### <a name="drag_dragtransfer_get">get</a>
```typescript
export class DragTransfer<T = any> {
	get(e: DragEvent): T | undefined;
}
```

The get method finds the key associated with this objects format and returns the object linked to it, if available. Returns undefined if the DragEvent has not got this objects format registered, or the key is invalid.

The [preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) method of the [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent) object is called during this method.

### <a name="drag_dragtransfer_is">is</a>
```typescript
export class DragTransfer<T = any> {
	is(e: DragEvent): this is CheckedDT<T>;
}
```

To be used in [dragover](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event) and [drop](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event) events, this method determines is the passed [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent)'s [DataTransfer.types](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/types) array contains this objects format string, marking this object as a [CheckedDT](#drag_checkeddt) type.

### <a name="drag_dragtransfer_register">register</a>
```typescript
export class DragTransfer<T = any> {
	register(t: Transfer<T> | () => T): string;
}
```

This method registers a [Transfer](#drag_transfer) object, or a function that returns T, to this handler and returns a unique key for this objects format. The key can be used with both the [set](#drag_dragtransfer_set) and [deregister](#drag_dragtransfer_deregister) methods.

### <a name="drag_dragtransfer_set">set</a>
```typescript
export class DragTransfer<T = any> {
	set(e: DragEvent, key: string, icon?: HTMLDivElement, xOffset = -5, yOffset = -5): void;
}
```

This method is used during a [dragstart](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragstart_event) to mark the object being dragged. Requires the [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event) and the key returned from the [register](#drag_dragtransfer_register) method, and optionally takes a drag icon [div](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement) and x and y offsets from the cursor.

## <a name="drag_dragfiles">DragFiles</a>

This class allows for easier use of the [files](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/files) property of the [DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) object.

|  Field  |  Type  |  Description  |
|---------|--------|---------------|
| [asForm](#drag_dragfiles_asform) | Method | This method creates a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) with passed files attached. |
| constructor | Constructor | Takes a spread of mime types that this object will match files against. |
| [is](#drag_dragfiles_is) | Method | This method determines if a [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event) contains files that match the allowed mime types. |
| mimes | Array | This array is the list of mime types passed to the constructor. |

### <a name="drag_dragfiles_asform">asForm</a>
```typescript
class DragFiles {
	asForm(e: DragEvent, name: string): FormData;
}
```

This method attaches all files on the [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event) to a returned [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) data object under the name provided.

The [preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) method of the [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent) object is called during this method.

### <a name="drag_dragfiles_is">is</a>
```typescript
class DragFiles {
	is(e: DragEvent): e is CheckedDragEvent;
}
```

This method checks all items attached to the [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event), returning true is all items are files that match the mime types provided to the constructor, and false otherwise.

This method also marks the DragEvent as a [CheckedDragEvent](#drag_checkdragevent) if it returns true.

## <a name="drag_setdrageffect">setDragEffect</a>
```typescript
(effects: Partial<Record<typeof DataTransfer.prototype.dropEffect, (DragTransfer | DragFiles)[]>>) => (e: DragEvent) => boolean;
```

This method takes an object of dropEffect keys to arrays of [DragTransfer](#drag_dragtransfer) and [DragFiles](#drag_dragfiles) objects, and returns a function. The function is to be called during a [dragover](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event) event to set the dropEffect on the passed [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event). The icon set is determined by the first DragTransfer or DragFiles object whose format is set on the event.

### <a name="drag_transfer">Transfer</a>
```typescript
interface Transfer<T> {
	transfer(): T;
}
```

The unexported Transfer interface describes an object that will transfer a T to a caller of [DragTransfer](#drag_dragtransfer)<T>.get.

## <a name="events">events</a>

The event module is used for easy creation of global events.

|  Export        |  Type  |  Description  |
|----------------|--------|---------------|
| [hasKeyEvent](#events_haskeyevent) | Method | This function returns true if any function is currently active for the passed key. |
| [keyEvent](#events_keyevent) | Method | Used for setting up keyboard event handlers. |
| [mouseDragEvent](#events_mousedragevent) | Method | Used to handle mouse drag events. |
| [mouseMoveEvent](#events_mousemoveevent) | Method | Used to handle mouse move events. |
| mouseX | Number | The current X coordinate of the mouse. |
| mouseY | Number | The current Y coordinate of the mouse. |

### <a name="events_haskeyevent">hasKeyEvent</a>
```typescript
(key: string) => boolean;
```

This function returns true if any function is currently active for the passed key.

### <a name="events_keyevent">keyEvent</a>
```typescript
(key: string | string[], onkeydown?: (e: KeyboardEvent) => void, onkeyup?: (e: KeyboardEvent) => void, once = false) => [() => void, (now = true) => void];
```

This function takes a key combination or array of key combinations, an optional [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) function to act as the keydown event handler, an optional [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) function to act as the keyup handler, and an optional boolean (default false) to determine if the event only runs one time per activation.

The key combinations are strings which can contain key names as determined by the [KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) value, and can be prefixed by any number of the following: `Alt+`, `Option+`, `Control+`, `Ctrl+`, `Command+`, `Meta+`, `Super+`, `Windows+`, and `Shift+`.

The function returns an array of two functions, the first of which activates the event, the second of which deactivates the event and will run any keyup event handler unless false is passed into the function.

NB: If the window loses focus, the module will generate a keyup event. This can be detected be checking the [Event.isTrusted](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted) field.

### <a name="events_mousedragevent">mouseDragEvent</a>
```typescript
(button: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15, onmousemove?: (e: MouseEvent) => void, onmouseup: (e: MouseEvent) => void = () => {}) => [() => void, (now = true) => void];
```

This function takes a mouse button (0..15), an optional [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) function to act as the mousemove event handler, and an optional function to be run on mouseup.

The function returns an array of two functions, the first of which activates the event, the second of which deactivates the event and will run any mouseup event handler unless false is passed into the function.

NB: If the window loses focus, the module will generate a mouseup event. This can be detected be checking the [Event.isTrusted](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted) field.

### <a name="events_mousemoveevent">mouseMoveEvent</a>
```typescript
(onmousemove: (e: MouseEvent) => void, onend?: () => void) => [() => void, (now = true) => void];
```

This function takes a [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) function and an optional function which will be run when the event deactivates.

The function returns an array of two functions, the first of which activates the event, the second of which deactivates the event and will run any mouseup event handler unless false is passed into the function.

NB: If the window loses focus, the module will run the onend function.

## <a name="fraction">fraction</a>

The fraction module exports a default class to act as a fractional, infinite precision number type.

|  Field  |  Type   |  Description  |
|---------|---------|---------------|
| [add](#fraction_add) | Method | Adds fractions together. |
| [cmp](#fraction_cmp) | Method | Compares two Fractions. |
| [constructor](#fraction_constructor) | Constructor | Creates new Fractions. |
| [div](#fraction_div) | Method | Divide one Fraction by another. |
| [isNaN](#fraction_isnan) | Method | Determines if a Fraction is NotANumber. |
| [max](#fraction_max) | Static Method | Get the larger of two Fractions. |
| [min](#fraction_min) | Static Method | Get the smaller of two Fractions. |
| [mul](#fraction_mul) | Method | Multiply Fractions together. |
| NaN | Static Fraction | A Fraction representing [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN). |
| one | Static Fraction | A Fraction representing 1. |
| [sign](#fraction_sign) | Method | Returns the sign of the Fraction. |
| [sub](#fraction_sub) | Method | Subtract one Fraction from another. |
| [Symbol.toPrimitive](#fraction_tofloat) | Method | Converts a Fraction to a Number. |
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

The constructor of Fraction takes a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) numerator and an optional [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) denominator and returns a Fraction accordingly. A zero (0n) denominator would create a Fraction equivalant of [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN).

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

The isNaN method returns true if the Fraction is equivalant to [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN), which is when the denominator is equal to zero.

### <a name="fraction_max">max</a>
```typescript
class Fraction {
	static max(a: Fraction, b: Fraction) => Fraction;
}
```

This static method returns the larger of the two passed Fraction, or [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN) is either param is equivalant to [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN).

### <a name="fraction_min">min</a>
```typescript
class Fraction {
	static min(a: Fraction, b: Fraction) => Fraction;
}
```

This static method returns the smaller of the two passed Fraction, or [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN) is either param is equivalant to [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN).

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

### <a name="fraction_tofloat">Symbol.toPrimitive</a>
```typescript
class Fraction {
	[Symbol.toPrimitive]() => number;
}
```

This method returns a normal javascript number representation of the Fraction value, to 5 decimal places.

## <a name="html">html</a>

The html module exports function for the creation of [HTMLElements](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement).

This module directly imports the [dom](#dom) module.

|  Export  |  Type | Description  |
|----------|-------|--------------|
| ns | String | This constant contains the XMLNamespace of HTMLElements. |
| [a](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) [abbr](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr) [address](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address) [area](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area) [article](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article) [aside](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside) [audio](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio) [b](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b) [base](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base) [bdi](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi) [bdo](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo) [blockquote](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote) [body](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body) [br](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br) [button](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) [canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) [caption](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption) [cite](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite) [code](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code) [col](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col) [colgroup](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup) [data](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data) [datalist](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist) [dd](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd) [del](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del) [details](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) [dfn](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn) [dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) [div](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div) [dl](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl) [dt](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt) [em](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em) [embed](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed) [fieldset](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) [figcaption](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption) [figure](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure) [footer](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer) [form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) [h1](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1) [h2](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2) [h3](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3) [h4](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4) [h5](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5) [h6](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6) [head](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head) [header](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header) [hgroup](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup) [hr](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr) [html](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html) [i](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i) [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) [img](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) [input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) [ins](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins) [kbd](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd) [label](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) [legend](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend) [li](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li) [link](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link) [main](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main) [map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map) [mark](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark) [menu](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu) [meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta) [meter](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter) [nav](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) [noscript](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript) [object](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object) [ol](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol) [optgroup](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup) [option](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option) [output](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) [p](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p) [picture](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture) [pre](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre) [progress](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress) [q](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q) [rp](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp) [rt](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt) [ruby](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby) [s](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s) [samp](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp) [script](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) [section](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section) [select](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select) [slot](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) [small](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small) [source](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source) [span](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span) [strong](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong) [style](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style) [sub](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub) [summary](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary) [sup](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup) [table](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) [tbody](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody) [td](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td) [template](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) [textarea](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea) [tfoot](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot) [th](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th) [thead](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead) [time](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time) [title](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title) [tr](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr) [track](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track) [u](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u) [ul](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul) [video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) [wbr](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr) | [DOMBind](#dom_dombind) | Each of these exports is a function which can take either a [Props](#dom_props) param and a [Children](#dom_children) param, or just a [Children](#dom_children) param, both as defined in the [dom](#dom) module, returning an HTMLElement of the exported name, with the attributes and children set. |
| vare | [DOMBind](#dom_dombind) | This function is as above, for the [var](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var) [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement). |

## <a name="inter">inter</a>

The inter module provides classes to aid with communication between otherwise unrelated modules.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| [Pipe](#inter_pipe) | Class | A simple communication class for sending data to multiple clients. |
| [Requester](#inter_requester) | Class | A simple communication class for multiple clients to request data from a server. |
| [Subscription](#inter_subscription) | Class | This class provides a multi-firing version of a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). |
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

The Subscription Class is similar to the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) class, but any success and error functions can be called multiple times.

|  Method  |  Type  |  Description  |
|----------|--------|---------------|
| [bind](#inter_subscription_bind) | Static Method | This method binds the then, error, and cancel functions. |
| [cancel](#inter_subscription_cancel) | Method | This method sends a cancel signal up the Subscription chain. |
| [catch](#inter_subscription_catch) | Method | This method acts like the [Promise.catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch) method. |
| [constructor](#inter_subscription_constructor) | Constructor | This constructs a new Subscription. |
| [finally](#inter_subscription_finally) | Method | This method acts like the [Promise.finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally) method. |
| [merge](#inter_subscription_merge) | Static Method | This combines several Subscriptions into one. |
| [splitCancel](#inter_subscription_splitcancel) | Method | This method set all child Subscription objects to remove themselves from this Subscription using the cancel method. |
| [then](#inter_subscription_then) | Method | This method acts like the [Promise.then](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) method. |

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

The catch method act similarly to the catch method of the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) class, except that it can be activated multiple times.

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

The finally method act similarly to the finally method of the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) class, except that it can be activated multiple times.

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

The then method act similarly to the then method of the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) class, except that it can be activated multiple times.

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

The load module contains a single default export, a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) which is resolved when the page finished loading.

## <a name="menu">menu</a>

The menu module adds custom elements to create context-menus.

This module directly imports the [css](#css), [dom](#dom) and [html](#html) modules.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| item | Function | A [DOMBind](#dom_dombind) that creates an [ItemElement](#menu_itemelement). |
| [ItemElement](#menu_itemelement) | Class | Defines a menu item. |
| menu | Function | A [DOMBind](#dom_dombind) that creates a [MenuElement](#menu_menuelement). |
| [MenuElement](#menu_menuelement) | Class | Defines a menu. |
| MenuItems | Type | Type of children applicable to a [MenuElement](#menu_menuelement). Allows [ItemElement](#menu_itemelement), [SubMenuElement](#menu_submenuelement), and recursive arrays of both. |
| submenu | Function | A [DOMBind](#dom_dombind) that creates a [SubMenuElement](menu_submenuelement). |
| [SubMenuElement](#menu_submenuelement) | Defines a submenu. |
| SubMenuItems | Type | Type of children applicable to a [SubMenuElement](#menu_submenuelement). Allows [ItemElement](#menu_itemelement), [MenuElement](#menu_menuelement), and recursive arrays of both. |

### <a name="menu_itemelement">ItemElement</a>

The ItemElement class represents items within a menu. It can be used either directly in a [MenuElement](#menu_menuelement), or in a [SubMenuElement](#menu_submenuelement) as its representative element. It can contain any structure, which will be what appears in the menu.

The action of the element is defined with a custom 'select' event, which is called when the element is selected. Unless the 'select' event cancels the event (preventDefault) the menu will close after the event is executed.

When used directly in a [MenuElement](#menu_menu_element), the 'key' attribute sets a possible quick access key, values of which should be one of the [Keyboard event key values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).

When used directly in a [MenuElement](#menu_menu_element), the 'disable' attribute makes the item unselectable and unfocusable.

### <a name="menu_menuelement">MenuElement</a>

The MenuElement class represents a context-menu that is displayed as a hovering list on the page. It can contain any number of [ItemElement](#menu_itemelement)s and [SubMenuElement](#menu_submenuelement)s, which will be the elements of the list.

When the MenuElement is attached to the DOM (non-[SubMenuElement](#menu_submenuelement)) is will use any 'x' and 'y' attributes on the element to determine the location of the menu on screen. It will attempt to place, within the [offsetParent](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent), the top-left corner of the menu at the 'x' and 'y' coordinates specified, but will try the right corners if there is not enough space to the left and the bottom corners if there is not enough space below. If there is not enough space for the menu, the fallback coordinates for both attributes is 0, 0.

### <a name="menu_SubMenuelement">SubMenuElement</a>

The SubMenuElement class defines an element which is a MenuItem. It It should contain a single [ItemElement](#menu_itemelement) and a single [MenuElement](#menu_menuelement).

The ItemElement will be displayed in the parent [MenuElement](#menu_menuelement) and the child MenuElement will be the menu that is displayed when this element is selected. The placement works similarly to that of [MenuElement](#menu_menuelement), in that it will attempt to put the top-left corner of the new menu at the top-right of the SubMenuElement selected, moving up as necessary, and will move to the left of the SubMenuElement is there is not enough space to the right.

The 'key' attribute sets a possible quick access key, values of which should be one of the [Keyboard event key values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).

The 'disable' attribute makes the item unselectable and unfocusable.

## <a name="nodes">nodes</a>

The nodes module contains Classes for aiding in the accessing of DOM [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)s.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| <a name="nodes_node">node</a> | Symbol | This [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) is used to specify the [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) of a type. |
| [NodeArray](#nodes_nodearray) | Class | This Class provides [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)-like access to DOM [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)s. |
| [NodeMap](#nodes_nodemap) | Class | This Class provides [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)-like access to DOM [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)s. |
| noSort | Function | A sorting function that does no sorting. |
| stringSort | Function | A function to sort strings. |

### <a name="nodes_nodearray">NodeArray</a>

This class provides [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)-like access to DOM [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)s, allowing them to be sorted and accessed via position-based indexes.

This type implements all fields and methods of the [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) interface, except for the following changes:

|  Field  |  Type  |  Differences |
|---------|--------|--------------|
| [node]  | Node   | New field to access base [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node). |
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

The NodeArray constructor takes a parent element, onto which all [Item](#nodes_item) elements will be attached, an optional starting sort function, and an optional set of starting elements of type `T`.

The sorting function is used to order [Item](#nodes_item)s as they are inserted.

The NodeArray type is wrapped with a Proxy to implement [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)-like indexing.

#### <a name="nodes_nodearray_from">from</a>
```typescript
class NodeArray<T extends Item, H extends Node = Node> implements Array<T> {
	static from<_, H extends Node = Node>(parent: H) => NodeArray<Item, H>;
	static from<T extends Item, H extends Node = Node>(parent: H, itemFn: (node: Node) => T|undefined) => NodeArray<T, H>;
	static from<T extends Item = Item, H extends Node = Node>(parent: H, itemFn = (n: Node) => ({[node]: n})) => NodeArray<T, H>;
}
```

This function will create a NodeArray from the given parent [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node), iterating over every child and running the itemFn to generate an [Item](#nodes_item)  to be append to the NodeArray.

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

The sort method works much like the [Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) method, but new items will be inserted according to the sorting function provided.

Running this function with no param will result in the NodeArray being re-sorted according to the existing sorting function.

### <a name="nodes_nodemap">NodeMap</a>

This class provides [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)-like access to DOM [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)s, allowing them to be sorted and accessed via keys.

This type implements all fields and methods of the [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) interface, except for the following changes:

|  Field  |  Type  |  Differences |
|---------|--------|--------------|
| [node]  | Node   | New field to access base [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node). |
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

The NodeMap constructor takes a parent element, onto which all [Item](#nodes_item) elements will be attached, an optional starting sort function, and an optional set of starting elements of type `T`.

The sorting function is used to order [Item](#nodes_item)s as they are inserted.

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

This unexported type satifies any type has used the [node](#nodes_node) [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) to delegate a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) element.

## <a name="rpc">rpc</a>

The rpc module implements a JSON RPC class.

This module directly imports the [inter](#inter) module.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| [RPC](#rpc_rpc) | Class | A connection neutral JSON RPC class. |
| <a name="rpc_rpcerror">RPCError</a> | Class | This class is the error type for RPC, and contains a `code` number, `message` string, and a data field for any addition information of the error. |

### <a name="rpc_rpc_conn">Conn</a>
```typescript
interface {
	close: () => void;
	send: (data: string) => void;
	when: (sFn: (data: {data: string}) => void, eFn: (error: string) => void) => void;
}
```

This unexported type is the interface used by [RPC](#rpc_rpc) to send and receive data. This is implemented by [WSConn](#conn_wsconn).

### <a name="rpc_rpc">RPC</a>

|  Method  |  Description  |
|----------|---------------|
| [await](#rpc_rpc_await) | Used to wait for a specific message. |
| close | Closes the RPC connection. |
| constructor | Creates an RPC object with a [Conn](#rpc_conn). |
| reconnect | Reuses the RPC object with a new [Conn](#rpc_conn). |
| [request](#rpc_rpc_request) | Calls a remote procedure and waits for a response. |
| [subscribe](#rpc_rpc_subscribe) | Returns data each time a message with a specific ID is received. |

#### <a name="rpc_rpc_await">await</a>
```typescript
class RPC {
	await<T = any>(id: number) => Promise<T>;
}
```

The await method will wait for a message with a matching ID, which must be negative, and resolve the promise with the data that message contains.

#### <a name="rpc_rpc_request">request</a>
```typescript
class RPC {
	request<T = any>(method: string, params?: any) => Promise<T>;
}
```

The request method calls the remote procedure named by the `method` param, and sends the `params` data, JSON encoded, to it.

The Promise will resolve with the returned data from from the remote procedure call.

#### <a name="rpc_rpc_subscribe">subscribe</a>
```typescript
class RPC {
	subscribe<T = any>(id: number) => Subscription<T>;
}
```

The subscribe method will wait for a message with a matching ID, which must be negative, and resolve the [Subscription](#inter_subscription) with the data that message contains for each message with that ID.

## <a name="settings">settings</a>

The settings module exports convenience classes around the [window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) API.

|  Export  |  Description  |
|----------|---------------|
| BoolSetting | Class for storing Boolean values, which simply applies typing to the unexported base [Setting](#settings_setting) class. |
| [IntSetting](#settings_intsetting) | Class for storing Integer values. |
| [JSONSetting](#settings_jsonsetting) | Class for storing JSON values. |
| [NumberSetting](#settings_numbersetting) | Class for storing Number values. |
| [StringSetting](#settings_stringsetting) | Class for storing String values. |

### <a name="settings_boolsetting">BoolSetting</a>
```typescript
class BoolSetting extends Setting<boolean> {
	constructor(name: string);
}
```
The BoolSetting class `constructor` just takes a name, and otherwise just extends the base [Setting](#settings_setting) class with the `boolean` type.

### <a name="settings_intsetting">IntSetting</a>
```typescript
class IntSetting extends Setting<number> {
	constructor(name: string, starting = 0, min = -Infinity, max = Infinity);
}
```

The IntSetting class extends the `constructor` of [Setting](#settings_setting) to, in addition to the string name and optional number starting value, take optional min and max numbers to be used for validation.

In addition, the `set` method will validate any values passed to it, making sure they value is an integer and satisfies the follow inequality:

`min <= value <= max`

Otherwise this class just extends the base [Setting](#settings_setting) class with the `number` type.

### <a name="settings_jsonsetting">JSONSetting</a>
```typescript
class JSONSetting<T> extends Setting<T> {
	constructor(name: string, starting: T, validator: (v: any) => v is T);
}
```

The JSONSetting class extends the `constructor` of [Setting](#settings_setting) to, in addition to the string name and default starting value, takes a required validator function to confirm the retrieved value is of type `T`.

Otherwise this class just extends the base [Setting](#settings_setting) class with the `T` type.

### <a name="settings_numbersetting">NumberSetting</a>
```typescript
class NumberSetting extends Setting<number> {
	constructor(name: string, starting = 0, min = -Infinity, max = Infinity);
}
```

The NumberSetting class extends the `constructor` of [Setting](#settings_setting) to, in addition to the string name and optional number starting value, take optional min and max numbers to be used for validation.

In addition, the `set` method will validate any values passed to it, making sure the value satisfies the follow inequality:

`min <= value <= max`

Otherwise this class just extends the base [Setting](#settings_setting) class with the `number` type.

### <a name="settings_setting">Setting</a>

The unexported Setting class is extended by the various typed child Setting classes.

All methods return `this` to allow for method chaining.

|  Field  |  Type  |  Description  |
|-------------|-------------|---------------|
| constructor | Constructor | Takes a setting string name and a starting value of a type defined by the child class. |
| name        | String      | The name of the setting. |
| remove      | Method      | Removes the setting from localStorage. |
| set         | Method      | Sets a new value to a Setting. |
| value       | T           | The value of the setting, type defined by the child class. |
| [wait](#settings_setting_wait) | Method | Registers a function to receive updated values. |

### <a name="settings_setting_wait">wait</a>
```typescript
class Setting<T> {
	wait(fn: (value: T) => void) => Setting<T>;
}
```

The wait method takes a function to be called on every setting value change. It will be immediately called with the current value.

### <a name="settings_stringsetting">StringSetting</a>

The StringSetting class simply extends the [Setting](#settings_setting) class with a default of empty string ("").

## <a name="svg">svg</a>

The svg module exports function for the create of SVGElements.

This module directly imports the [dom](#dom) module.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| ns | String | This constant contains the XMLNamespace of SVGElements. |
| [a](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/a) [animate](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animate) [animateMotion](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateMotion) [animateTransform](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateTransform) [circle](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle) [clipPath](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/clipPath) [defs](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs) [desc](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc) [ellipse](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/ellipse) [feBlend](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feBlend) [feColorMatrix](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix) [feComponentTransfer](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComponentTransfer) [feComposite](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComposite) [feConvolveMatrix](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feConvolveMatrix) [feDiffuseLighting](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDiffuseLighting) [feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDisplacementMap) [feDistantLight](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDistantLight) [feDropShadow](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDropShadow) [feFlood](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFlood) [feFuncA](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncA) [feFuncB](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncB) [feFuncG](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncG) [feFuncR](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncR) [feGaussianBlur](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur) [feImage](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feImage) [feMerge](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMerge) [feMergeNode](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMergeNode) [feMorphology](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMorphology) [feOffset](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feOffset) [fePointLight](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/fePointLight) [feSpecularLighting](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpecularLighting) [feSpotLight](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpotLight) [feTile](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTile) [feTurbulence](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence) [filter](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter) [foreignObject](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject) [g](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g) [image](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/image) [line](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/line) [linearGradient](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient) [marker](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker) [mask](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask) [metadata](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/metadata) [mpath](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mpath) [path](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path) [pattern](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/pattern) [polygon](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polygon) [polyline](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline) [radialGradient](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/radialGradient) [rect](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect) [script](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/script) [set](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/set) [stop](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/stop) [style](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/style) [svg](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) [switch](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/switch) [symbol](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol) [text](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text) [textPath](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/textPath) [title](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title) [tspan](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/tspan) [use](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use) [view](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/view) | [DOMBind](#dom_dombind) | Each of these exports is a function which can take either a [Props](#dom_props) param and a [Children](#dom_children) param, or just a [Children](#dom_children) param, both as defined in the [dom](#dom) module, returning an SVGElement of the exported name, with the attributes and children set. |
| switche | [DOMBind](#dom_dombind) | This function is as above, for the [switch](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/switch) SVGElement. |
| svgData | Function | This function takes either a [SVGSVGElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement) or a [SVGSymbolElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGSymbolElement) and returns a URL encoded SVG data string. |

## <a name="windows">windows</a>

The windows module adds custom elements to implement a windowing system.

This module directly imports the [css](#css), [dom](#dom), [html](#html), and [svg](#svg) modules.

|  Export  |  Type  |  Description  |
|----------|--------|---------------|
| <a name="windows_defaulticon">defaultIcon</a> | String | The current default window icon. |
| desktop | Function | A [DOMBind](#dom_dombind) that creates a DesktopElement. Registered with customElements as `windows-desktop`. |
| <a name="windows_desktopelement">DesktopElement</a> | Class | This class creates a desktop-like space with a [ShellElement](#windows_shellelement). |
| setDefaultIcon | Function | This function sets the deaultIcon variable. |
| [setLanguage](#windows_setlanguage) | Function | Sets the language items used by the [ShellElement](#windows_shellelement) and [WindowElement](#windows_windowelement) classes. |
| shell | Function | A [DOMBind](#dom_dombind) that creates a ShellElement. |
| [ShellElement](#windows_shellelement) | Class | A class to create a shell for [WindowElement](#windows_windowelement)s to exist within. Extends [BaseElement](#windows_baseelement). Registered with customElements as `windows-shell`. |
| [WindowElement](#windows_windowelement) | Class | This class represents a movable window with user specified contents. Extends [BaseElement](#windows_baseelement). Registered with customElements as `windows-window`. |
| windows | Function | A [DOMBind](#dom_dombind) that creates a WindowElement. |

### <a name="windows_baseelement">BaseElement</a>

This unexported class provides some methods for both [WindowElement](#windows_windowelement) and [ShellElement](#windows_shellelement).

|  Method  |  Description  |
|----------|---------------|
| [alert](#windows_baseelement_alert) | Creates a popup message window.
| [confirm](#windows_baseelement_confirm) | Creates a popup confirmation window. |
| [prompt](#windows_baseelement_prompt) | Creates a popup window that asks for input. |

#### <a name="windows_baseelement_alert">alert</a>
```typescript
class BaseElement extends HTMLElement {
	alert(title: string, message: string, icon?: string) => Promise<boolean>;
}
```

The alert method adds an [alert](https://developer.mozilla.org/en-US/docs/Web/API/Window/alert)-like window to the [WindowElement](#windows_windowelement) or [ShellElement](#windows_shellelement) it was called upon.

The button text is set to the `OK` field of the language object, which can be set with [setLanguage](#windows_setlanguage).

The returned [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) will resolve to true if the button is clicked, and false if the dialog window was closed.

#### <a name="windows_baseelement_confirm">confirm</a>
```typescript
class BaseElement extends HTMLElement {
	confirm(title: string, message: string, icon?: string) => Promise<boolean>;
}
```

The confirm method adds a [confirm](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm)-like window to the [WindowElement](#windows_windowelement) or [ShellElement](#windows_shellelement) it was called upon.

The text of the two buttons is set to the `OK` and `CANCEL` fields of the language object, which can be set with [setLanguage](#windows_setlanguage).

The returned [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) will resolve to true if the `OK` button is clicked, and false if the `CANCEL` button was clicked or the dialog window was closed.

#### <a name="windows_baseelement_prompt">prompt</a>
```typescript
class BaseElement extends HTMLElement {
	prompt(title: string, message: string, defaultValue = "", icon?: string) => Promise<string | null>;
}
```

The prompt method adds a [prompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt)-like window to the [WindowElement](#windows_windowelement) or [ShellElement](#windows_shellelement) it was called upon.

The button text is set to the `OK` field of the language object, which can be set with [setLanguage](#windows_setlanguage).

The returned [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) will resolve to the text entered if the `OK` button is clicked, or null if the dialog window was closed.

### <a name="windows_setlanguage">setLanguage</a>
```typescript
(language: {
	CANCEL?: string;
	CLOSE?: string;
	MAXIMISE?: string;
	MINIMISE?: string;
	OK?: string;
	RESTORE?: string;
}) => void;
```

The setLanguage function sets the language items used by the [ShellElement](#windows_shellelement) and [WindowElement](#windows_windowelement) classes.

### <a name="windows_shellelement">ShellElement</a>

The ShellElement class is a CustomElement that can contain a single [DesktopElement](#windows_desktopelement) and any number of  [WindowElement](#windows_windowelement)s.


This element handles the follow attributes.

|  Attribute     |  Type  |  Description  |
|----------------|--------|---------------|
| -\-shell-height | Number | Used to specify the internal height of the `Shell`. |
| -\-shell-width  | Number | Used to specify the internal width of the `Shell`. |

In addition to the methods provided by [BaseElement](#windows_baseelement), the following methods are provided:

|  Method        |  Description  |
|----------------|---------------|
| addWindow      | Adds a [WindowElement](#windows_windowelement) to the Shell and focuses it. |
| realignWindows | Repositions all [WindowElements](#windows_windowelement) within the Shell to make sure they are all visible. |

### <a name="windows_windowelement">WindowElement</a>

The WindowElement class is a CustomElement that be added to a [ShellElement](#windows_shellelement) to provide a window-like interface to the contents of the element.

The [ShellElement](#windows_shellelement) will determine whether `Windows` can be minimised and how they are handled when they are. The [ShellElement](#windows_shellelement) of this module disables minimising. It can be enabled by using the ShellElement of either the [windows_taskbar](#windows_taskbar) or [windows_taskmanager](#windows_taskmanager) modules.

This element handles the follow attributes:

|  Attribute       |  Type  |  Description  |
|------------------|--------|---------------|
| -\-window-height | Number | CSS: Specifies the height of the `Window`. |
| -\-window-left   | Number | CSS: Specifies the `x` coordinate of the `Window`. |
| -\-window-top    | Number | CSS: Specifies the `y` coordinate of the `Window`. |
| -\-window-width  | Number | CSS: Specifies the width of the `Window`. |
| hide-close       | Toggle | Hides the `Close` button. |
| hide-maximise    | Toggle | Hides the `Maximise` button. |
| hide-minimise    | Toggle | Hides the `Minimise` button. |
| hide-titlebar    | Toggle | Hides the titlebar. |
| maximised        | Toggle | The window will expand to the size of the [ShellElement](#windows_shellelement). |
| minimised        | Toggle | The window will be hidden and it will be up to the shell to allow restoring it. |
| resizable        | Toggle | Allows the `Window` to be resized. |
| window-icon      | String | Sets the window icon. |
| window-title     | String | Sets the window title. |

Hover text on the default buttons can be modified via the [setLanguage](#windows_setlanguage) function.

The following entries affect this element:

|  Entry     |  Default Value  |  Description  |
|------------|-----------------|---------------|
| `CLOSE`    | "Close"         | Hover text on the 'Close Window' button. |
| `MAXIMISE` | "Maximise"      | Hover text on the 'Maximise Window' button. |
| `MINIMISE` | "Minimise"      | Hover text on the 'Minimise Window' button. |
| `RESTORE`  | "Restore"       | Hover text on the 'Restore Window' button. |

The following customs events can be dispatched:

|  Event  |  Description  |
|---------|---------------|
| close   | Dispatched when either the `Close` button is clicked or the [close](#windows_windowelement_close) method is called. |
| moved   | Dispatched when the `Window` is dragged around within the shell. |
| remove  | Dispatched when the `Window` is removed from the DOM. |
| resized | Dispatched when the `Window` is resized. |

In addition to the methods provided by [BaseElement](#windows_baseelement), the following methods are provided:

|  Method  |  Description  |
|----------|---------------|
| [addControlButton](#windows_windowelement_addcontrolbutton) | Adds an additional, custom control button to the titlebar. |
| [addWindow](#windows_windowelement_addwindow) | Adds a [WindowElement](#windows_windowelement) to the `Window` as a child window. |
| [close](#windows_windowelement_close) | Closes the `Window`. |
| [focus](#windows_windowelement_focus) | Brings the `Window` to the top of the window stack on the [ShellElement](#windows_shellelement). |

### <a name="windows_windowelement_addcontrolbutton">addControlButton</a>
```typescript
class WindowElement extends BaseElement {
	addControlButton(icon: string, onclick: (this: WindowElement) => void, title?: string) => () => void;
}
```

The addControlButton method adds additional buttons to the titlebar of the `Window`.

The returned function can be called to remove the button.

### <a name="windows_windowelement_addwindow">addWindow</a>
```typescript
class WindowElement extends BaseElement {
	addWindow(w: WindowElement) => boolean;
}
```

The addWindow method adds a `Window` as a child. If there is already a child, it is added as a child of that `Window`.

Returns true if the `Window` was added, false otherwise.

### <a name="windows_windowelement_close">close</a>
```typescript
class WindowElement extends BaseElement {
	close() => boolean;
}
```

The close method will attempt to close the `Window`. If the `Window` has a child, that will be focussed instead.

When attempting to close, a cancellable `close` event is dispatched to the WindowElement.  If the event is cancelled, the `Window` will remain open.

Returns true if the `Window` was closed, false otherwise.

### <a name="windows_windowelement_focus">focus</a>
```typescript
class WindowElement extends BaseElement {
	focus() => void;
}
```

The focus method will bring the unset a minimise attribute and bring the deepest child to the top of the window stack.

## <a name="windows_taskbar">windows_taskbar</a>

The windows_taskbar module provides a replacement for the [windows](#windows) module [ShellElement](#windows_shellelement) that provides a taskbar for `Windows` to be managed from and allows the `Windows` to be minimised. The exports are the same as the [windows](#windows) module, except for the changes below.

This module directly imports the [css](#css), [dom](#dom),[html](#html), [menu](#menu) and [windows](#windows) modules.

|  Export      |  Type    |  Description |
|--------------|----------|--------------|
| setLanguage  | Function | A replacement for the [setLanguage](#windows_setlanguage) function, which in addition to calling the original, sets the language entries used for the context menu for the items on the taskbar. The menu access keys are set to the first character of the entry. |
| shell        | Function | A [DOMBind](#dom_dombind) that creates a ShellElement. |
| ShellElement | Class    | A drop-in replacement for the [windows](#windows) module [ShellElement](#windows_shellelement). Registered with customElements as `windows-shell-taskbar`. |

The ShellElement class can accept the following attributes:

|  Attribute  |  Description  |
|-------------|---------------|
| autohide    | When set this attribute will hide the taskbar when it is not being hovered over. |
| side        | When set to one of left, right, or top, is used to change the side on which the taskbar will reside. It defaults to the bottom. |
| hide        | This attribute can be set to one of icon or title, which will hide either the icon or the text title of the window on the taskbar. |

In addition the taskbar-size style var can be used to set the width (or height, if vertical) of the taskbar.

## <a name="windows_taskmanager">windows_taskmanager</a>

The windows_taskmanager module provides a replacement for the [windows](#windows) module [ShellElement](#windows_shellelement) that allows `Windows` to be minimised within the shell, appearing as just the title-bar at the bottom of the shell.aThe exports are the same as the [windows](#windows) module, except for the changes below.

This module directly imports the [css](#css), [dom](#dom),[html](#html), and [windows](#windows) modules.

|  Export      |  Type    |  Description |
|--------------|----------|--------------|
| shell        | Function | A [DOMBind](#dom_dombind) that creates a ShellElement. |
| ShellElement | Class    | A drop-in replacement for the [windows](#windows) module [ShellElement](#windows_shellelement). Registered with customElements as `windows-shell-taskmanager`. |

NB: Any [custom control buttons](#windows_windowelement_addcontrolbutton) will not be displayed on the title-bar while minimised.
