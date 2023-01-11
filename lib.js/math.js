import {bindElement} from './dom.js';

export const ns = "http://www.w3.org/1998/Math/MathML",
[math, maction, annotation, annotationXML, menclose, merror, mfenced, mfrac, mi, mmultiscripts, mn, mo, mover, mpadded, mphantom, mprescripts, mroot, mrow, ms, semantics, mspace, msqrt, mstyle, msub, msup, msubsup, mtable, mtd, mtext, mtr, munder, munderover] = "math maction annotation annotation-xml menclose merror mfenced mfrac mi mmultiscripts mn mo mover mpadded mphantom mprescripts mroot mrow ms semantics mspace msqrt mstyle msub msup msubsup mtable mtd mtext mtr munder munderover".split(" ").map(e => bindElement(ns, e));
