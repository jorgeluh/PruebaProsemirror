import OrderedMap from "orderedmap";
import { Mark, MarkSpec } from "prosemirror-model";

/**
 * Define los posibles tipos de fuente que se pueden aplicar a un nodo.
 */
export enum tipoFuente {
    /**
     * Tipo de fuente "Arial" (o "sans-serif").
     */
    arial = "Arial, Helvetica, sans-serif",

    /**
     * Tipo de fuente "Times New Roman" (o "serif").
     */
    timesNewRoman = '"Times New Roman", Times, serif',

    /**
     * Tipo de fuente "Courier New" (o monoespaciado).
     */
    courierNew = '"Courier New", "Lucida Console", monospace',
}

/**
 * Agrega la marca para modificar el tipo de la fuente a los nodos del esquema del documento.
 * @param marcas El conjunto de marcas del esquema al que se agregan las marcas para tipo de fuente.
 * @returns El conjunto de marcas recibido más la marca para cambiar el tipo de la fuente.
 */
export function agregarMarcaTipoFuente(marcas: OrderedMap<MarkSpec>): OrderedMap<MarkSpec> {
    return marcas.append({
        tipo_fuente: {
            attrs: { tipoFuente: {} },
            // TODO: agregar función parseDOM.
            toDOM: function(nodo: Mark) {
                return ["span", { style: `font-family: ${nodo.attrs.tipoFuente};` }, 0];
            },
        },
    });
}