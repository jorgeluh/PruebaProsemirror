import OrderedMap from "orderedmap";
import { Attrs, Fragment, Node, NodeRange, NodeSpec, NodeType, ResolvedPos, Slice } from "prosemirror-model";
import { bulletList, listItem} from "prosemirror-schema-list";
import { Command, EditorState, Transaction } from "prosemirror-state";
import { canSplit, findWrapping, ReplaceAroundStep } from "prosemirror-transform";

/**
 * Define los posibles tipos de lista en los que se puede envolver un nodo.
 */
export enum tipoListaOrdenada {
    /**
     * Lista de números arábigos (1., 2., 3., ...) Es la opción predeterminada.
     */
    arabigos = "1",

    /**
     * Lista de números romanos en minúscula (i., ii., iii., ...).
     */
    romanosMinusculas = "i",

    /**
     * Lista de números romanos en mayúscula (I., II., III., ...).
     */
    romanosMayusculas = "I",

    /**
     * Lista alfabética en minúscula (a., b., c., ...).
     */
    alfabetoMinusculas = "a",

    /**
     * Lista alfabética en mayúscula (A., B., C., ...).
     */
    alfabetoMayusculas = "A",
}

/**
 * Recibe un objeto y un conjunto de propiedades adicionales que se desean agregarle y retorna un nuevo objeto con la combinación de ambos.
 * @param objeto El objeto a cuya copia se agregan las propiedades adicionales.
 * @param propiedades Las propiedades que se desea agregar al objeto original.
 * @returns Un nuevo objeto que tiene todas las propiedades del original, además de las indicadas.
 */
function agregarPropiedades(objeto: { [propiedad: string]: any }, propiedades: { [propiedad: string]: any }): { [propiedad: string]: any } {
    let copia: { [propiedad: string]: any } = {};
    for (let propiedad in objeto) {
        copia[propiedad] = objeto[propiedad];
    }

    for (let propiedad in propiedades) {
        copia[propiedad] = propiedades[propiedad];
    }

    return copia;
}

/**
 * Especificación de {@link prosemirror-model#NodeSpec | tipo de nodo} de ProseMirror especial para listas ordenadas (`<ol>`) que además
 * soporta un atributo para el tipo (`type`) de la lista.
 */
export const listaOrdenada = {
    attrs: {
        order: { default: 1 },
        tipo: { default: tipoListaOrdenada.arabigos },
    },
    parseDOM: [{
        tag: "ol",
        getAttrs(dom: HTMLElement) {
            return {
                order: dom.hasAttribute("start") ? +dom.getAttribute("start")! : 1,
                tipo: dom.hasAttribute("type") ? +dom.getAttribute("type")! : tipoListaOrdenada.arabigos,
            }
        }
    }],
    toDOM: nodo => {
        if (nodo.attrs.tipo == tipoListaOrdenada.arabigos) {
            return nodo.attrs.order == 1 ? ["ol", 0] : ["ol", { start: nodo.attrs.order }, 0];
        } else {
            return nodo.attrs.order == 1 ?
                ["ol", { type: nodo.attrs.tipo }, 0] :
                ["ol", { type: nodo.attrs.tipo, start: nodo.attrs.order }, 0];
        }
    },
} as NodeSpec;

/**
 * Permite agregar los nodos de listas numeradas y de viñetas con tipos a los nodos de un esquema.
 * @param nodos Los nodos del esquema de documento.
 * @param contenido El contenido del elemento de la lista.
 * @param grupoLista Los grupos a los que se pueden aplicar los nodos.
 * @returns El listado de nodos original más los tipos de nodos de listas ordenadas y de viñetas con tipos.
 */
export function agregarNodosListas(nodos: OrderedMap<NodeSpec>, contenido: string, grupoLista?: string): OrderedMap<NodeSpec> {
    return nodos.append({
        lista_ordenada: agregarPropiedades(listaOrdenada, { content: "list_item+", group: grupoLista }),
        bullet_list: agregarPropiedades(bulletList, { content: "list_item+", group: grupoLista }),
        list_item: agregarPropiedades(listItem, { content: contenido }),
    });
}

/**
 * Modifica una transacción para envolver al nodo del rango en una lista.
 * @param transaccion La transacción a la que se agrega la operación de envolver un nodo en la lista.
 * @param rango El rango del nodo que se envolverá en la lista.
 * @param envolotorios El envoltorio válido para envolver el contenido seleccionado en un nodo del tipo indicado.
 * @param unir Indica si la lista se debe unir a otra (`true`) o no.
 * @param tipoLista El tipo de nodo de lista.
 * @returns La transacción original más la operación para envolver el contenido en un nodo lista del tipo indicado.
 */
function ejecutarEnvolverEnLista(
    transaccion: Transaction,
    rango: NodeRange,
    envolotorios: { type: NodeType, attrs?: Attrs | null }[],
    unir: boolean,
    tipoLista: NodeType): Transaction {
    
    let contenido: Fragment = Fragment.empty;
    for (let i: number = envolotorios.length - 1; i >= 0; i--) {
        contenido = Fragment.from(envolotorios[i].type.create(envolotorios[i].attrs, contenido));
    }

    transaccion.step(
        new ReplaceAroundStep(rango.start - (unir ? 2 : 0), rango.end, rango.start, rango.end,
        new Slice(contenido, 0, 0),
        envolotorios.length,
        true));

    let encontrado: number = 0;
    for (let i: number = 0; i < envolotorios.length; i++) {
        if (envolotorios[i].type == tipoLista) {
            encontrado = i + 1;
        }
    }

    let profundidadDivision: number = envolotorios.length - encontrado;
    let posicionDivision: number = rango.start + envolotorios.length - (unir ? 2 : 0);
    let padre: Node = rango.parent;
    for (let i: number = rango.startIndex, posicionFin: number = rango.endIndex, primero: boolean = true;
        i < posicionFin; i++, primero = false) {
        if (!primero && canSplit(transaccion.doc, posicionDivision, profundidadDivision)) {
            transaccion.split(posicionDivision, profundidadDivision);
            posicionDivision += 2 * profundidadDivision;
        }

        posicionDivision += padre.child(i).nodeSize;
    }

    return transaccion;
}

/**
 * Crea el comando para envolver el nodo donde se encuentra el cursor en una lista según el tipo de nodo y atributo de tipo de lista
 * indicados.
 * @param tipoLista El tipo de nodo (que debe ser un tipo de lista válido).
 * @param atributos Los atributos del nodo, donde se incluye el `tipo` de lista.
 * @returns El comando para envolver un nodo en una lista ordenada o de viñetas.
 */
export function envolverEnLista(tipoLista: NodeType, atributos: Attrs | null = null): Command {
    return function(estadoEditor: EditorState, ejecutar?: (transaccion: Transaction) => void): boolean {
        let { $from, $to } = estadoEditor.selection;
        let rango: NodeRange | null = $from.blockRange($to);
        let unir: boolean = false;
        let rangoExterior: NodeRange | null = rango;
        if (!rango) {
            return false;
        }

        // Esto es al inicio de un elemento de lista existente.
        if (rango.depth >= 2 && $from.node(rango.depth - 1).type.compatibleContent(tipoLista) && rango.startIndex == 0) {
            // No hacer nada si este es el inicio de la lista.
            if ($from.index(rango.depth - 1) == 0) {
                return false;
            }
            
            let $insert: ResolvedPos = estadoEditor.doc.resolve(rango.start - 2);
            rangoExterior = new NodeRange($insert, $insert, rango.depth);
            if (rango.endIndex < rango.parent.childCount) {
              rango = new NodeRange($from, estadoEditor.doc.resolve($to.end(rango.depth)), rango.depth);
            }

            unir = true;
        }

        let envoltorio = findWrapping(rangoExterior!, tipoLista, atributos, rango);
        if (!envoltorio) {
            return false;
        }

        if (ejecutar) {
            ejecutar(ejecutarEnvolverEnLista(estadoEditor.tr, rango, envoltorio, unir, tipoLista).scrollIntoView());
        }

        return true;
    }
}