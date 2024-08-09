import {tags} from './dom.js';

/**
 * The math module exports function for the creation of {@link https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement | MathMLElement)s.
 *
 * @module math
 * @requires module:dom
 */
/** */

export const
/** This constant contains the XMLNamespace of MathMLElements. */
ns = "http://www.w3.org/1998/Math/MathML",
{annotation, "annotation-xml": annotationXML, maction, math, merror, mfrac, mi, mmultiscripts, mn, mo, mover, mpadded, mphantom, mprescripts, mroot, mrow, ms, mspace, msqrt, mstyle, msub, msubsup, msup, mtable, mtd, mtext, mtr, munder, munderover, semantics} = tags(ns);
