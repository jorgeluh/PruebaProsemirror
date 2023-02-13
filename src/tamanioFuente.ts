import OrderedMap from "orderedmap";
import { Mark, MarkSpec } from "prosemirror-model";

/**
 * Agrega la marca para modificar el tamaño de la fuente a los nodos del esquema del documento.
 * @param marcas El conjunto de marcas del esquema al que se agregan las marcas para tamaño de fuente.
 * @returns El conjunto de marcas recibido más la marca para cambiar el tamaño de la fuente.
 */
export function agregarMarcaTamanioFuente(marcas: OrderedMap<MarkSpec>): OrderedMap<MarkSpec> {
    return marcas.append({
        tamanio_fuente: {
            attrs: { tamanioFuente: {} },
            // TODO: agregar función parseDOM.
            toDOM: function(nodo: Mark) {
                return ["span", { style: `font-size: ${nodo.attrs.tamanioFuente}px;` }, 0];
            },
        },
    });
}