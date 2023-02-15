import { getMentionsPlugin } from "prosemirror-mentions";
import { Plugin } from "prosemirror-state";

/**
 * Estructura que deben tener los elementos para el plugin de menciones.
 */
export interface miembroMencion {
    /**
     * El nombre o texto que se muestra después de la @ en el editor al buscar y aceptar la mención en el editor.
     */
    name: string,

    /**
     * El identificador único del elemento de la mención.
     */
    id: any,

    /**
     * El correo electrónico del miembro de la mención.
     */
    email: string,
}

/**
 * Función empleada para mostrar los miembros de la mención en el editor.
 * @param elementos La lista de elementos que se muestran en la lista de menciones tras teclear @ en el editor.
 * @returns Una función que recibe el listado de miembros para las menciones como parámetro y responde con una cadena para mostrarlos en el
 * editor.
 */
let generarHtmlMenciones: Function = (elementos: miembroMencion[]) =>
    `<div class="suggestion-item-list">${elementos.map(elemento => `<div class="suggestion-item">${elemento.name}</div>`).join("")}</div>`;

/**
 * Crea el plugin de menciones para poder integrarlo a la lista de plugins del estado del editor.
 * @param elementos El listado de miembros disponibles en las menciones del editor.
 * @returns El plugin de menciones configurado con los miembros indicados.
 */
export function crearPluginMenciones(elementos: miembroMencion[]): Plugin {
    return getMentionsPlugin({
        getSuggestions: (tipo: string, texto: string, terminado: Function) => {
            setTimeout(() => {
                if (tipo === "mention") {
                    terminado([elementos]);
                }
            }, 0);
        },
        getSuggestionsHTML: (elementos: miembroMencion[], tipo: string) => {
            if (tipo === "mention") {
                return generarHtmlMenciones(elementos);
            }

            return "";
        }
    });
}