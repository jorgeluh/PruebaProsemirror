import OrderedMap from "orderedmap";
import { MarkSpec } from "prosemirror-model";

/**
 * Agrega la marca para modificar el tamaño de la fuente al esquema del documento.
 * @param marcas El conjunto de marcas al que se agregan las marcas para tamaño de fuente.
 * @returns El conjunto de marcas recibido más la marca para cambiar el tamaño de la fuente.
 */
export function agregarMarcaTamanioFuente(marcas: OrderedMap<MarkSpec>): OrderedMap<MarkSpec> {
    return marcas.append({
        tamanio_fuente: {
            attrs: { tamanioFuente: {} },
            // TODO: agregar función parseDOM.
            toDOM(nodo) {
                return ["span", { style: `font-size: ${nodo.attrs.tamanioFuente}px` }, 0];
            },
        },
    });
}