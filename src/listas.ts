import OrderedMap from "orderedmap";
import { Attrs, Fragment, NodeRange, NodeSpec, NodeType, Slice } from "prosemirror-model";
import { orderedList } from "prosemirror-schema-list";
import { Command, EditorState, Transaction } from "prosemirror-state";
import { canSplit, findWrapping, ReplaceAroundStep } from "prosemirror-transform";
import { bulletList, listItem} from "prosemirror-schema-list";

/**
 * Define los posibles tipos de lista en los que se puede envolver un nodo.
 */
export enum TipoListaOrdenada {
    arabigos = "1",
    romanosMinusculas = "i",
    romanosMayusculas = "I",
    alfabetoMinusculas = "a",
    alfabetoMayusculas = "A",
    ////circulo = "circle",
    ////disco = "disc",
    ////cuadrado = "square",
}

function add(obj: {[prop: string]: any}, props: {[prop: string]: any}) {
    let copy: {[prop: string]: any} = {}
    for (let prop in obj) copy[prop] = obj[prop]
    for (let prop in props) copy[prop] = props[prop]
    return copy
  }

export function agregarNodosLista(nodes: OrderedMap<NodeSpec>, itemContent: string, listGroup?: string): OrderedMap<NodeSpec> {
    return nodes.append({
      lista_ordenada: add(listaOrdenada, {content: "list_item+", group: listGroup}),
      ordered_list: add(orderedList, {content: "list_item+", group: listGroup}),
      bullet_list: add(bulletList, {content: "list_item+", group: listGroup}),
      list_item: add(listItem, {content: itemContent})
    })
  }

export const listaOrdenada = {
  attrs: {
    order: { default: 1 },
    tipo: { default: TipoListaOrdenada.romanosMinusculas },
  },
  parseDOM: [{
    tag: "ol",
    getAttrs(dom: HTMLElement) {
      return {
        order: dom.hasAttribute("start") ? +dom.getAttribute("start")! : 1,
        tipo: dom.hasAttribute("type") ? +dom.getAttribute("type")! : TipoListaOrdenada.arabigos,
      }
    }
  }],
  toDOM: nodo => {
    if (nodo.attrs.tipo == TipoListaOrdenada.arabigos) {
      return nodo.attrs.order == 1 ? [ "ol", 0 ] : [ "ol", { start: nodo.attrs.order }, 0 ];
    } else {
      return nodo.attrs.order == 1 ?
        [ "ol", { type: nodo.attrs.tipo }, 0 ] :
        [ "ol", { type: nodo.attrs.tipo, start: nodo.attrs.order }, 0 ];
    }
  },
} as NodeSpec;

export function envolverEnLista(listType: NodeType, attrs: Attrs | null = null): Command {
    return function(state: EditorState, dispatch?: (tr: Transaction) => void) {
      let {$from, $to} = state.selection
      let range = $from.blockRange($to), doJoin = false, outerRange = range
      if (!range) return false
      // This is at the top of an existing list item
      if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
        // Don't do anything if this is the top of the list
        if ($from.index(range.depth - 1) == 0) return false
        let $insert = state.doc.resolve(range.start - 2)
        outerRange = new NodeRange($insert, $insert, range.depth)
        if (range.endIndex < range.parent.childCount)
          range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth)
        doJoin = true
      }
      let wrap = findWrapping(outerRange!, listType, attrs, range)
      if (!wrap) return false
      if (dispatch) dispatch(doWrapInList(state.tr, range, wrap, doJoin, listType).scrollIntoView())
      return true
    }
  }

function doWrapInList(tr: Transaction, range: NodeRange, wrappers: {type: NodeType, attrs?: Attrs | null}[],
    joinBefore: boolean, listType: NodeType) {
let content = Fragment.empty
for (let i = wrappers.length - 1; i >= 0; i--)
content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content))

tr.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end,
              new Slice(content, 0, 0), wrappers.length, true))

let found = 0
for (let i = 0; i < wrappers.length; i++) if (wrappers[i].type == listType) found = i + 1
let splitDepth = wrappers.length - found

let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent
for (let i = range.startIndex, e = range.endIndex, first = true; i < e; i++, first = false) {
if (!first && canSplit(tr.doc, splitPos, splitDepth)) {
tr.split(splitPos, splitDepth)
splitPos += 2 * splitDepth
}
splitPos += parent.child(i).nodeSize
}
return tr
}