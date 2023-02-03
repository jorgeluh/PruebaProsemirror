import { baseKeymap, toggleMark } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { history, redo, undo } from "prosemirror-history";
import { ellipsis, emDash, InputRule, inputRules, smartQuotes, wrappingInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { icons, IconSpec, menuBar, MenuElement, MenuItem, MenuItemSpec } from "prosemirror-menu";
import { MarkType, NodeType, Schema } from "prosemirror-model";
import { Command, EditorState, Plugin } from "prosemirror-state";

/**
 * Determina si una línea se inició con un dígito seguido de un punto para iniciar una lista numerada.
 * @param tipo El tipo de nodo al que será aplicada la regla.
 * @returns La regla que cambia el bloque de texto a una lista numerada.
 */
function crearReglaListaOrdenada(tipoNodo: NodeType): InputRule {
    return wrappingInputRule(
        /^(\d+)\.\s$/,
        tipoNodo,
        coincidencia => ({ order: +coincidencia[1] }),
        (coincidencia, nodo) => nodo.childCount + nodo.attrs.order == +coincidencia[1]);
}

/**
 * Determina si una línea se inició con algún caracter determinado para iniciar una lista de viñetas.
 * @param tipoNodo El tipo de nodo al que será aplicada la regla.
 * @returns La regla que cambia el bloque de texto a una lista de viñetas.
 */
function crearReglaListaVinietas(tipoNodo: NodeType): InputRule {
    return wrappingInputRule(/^\s*([-+*])\s$/, tipoNodo);
}

/**
 * Crea el {@link prosemirror-state#Plugin plugin} que aplica reglas de reemplazo de texto.
 * @param esquema El esquema de ProseMirror para el documento. Es necesario para reconocer los tipos de nodos y marcas que soporta.
 * @returns El plugin con reglas de reemplazo de texto en el editor.
 */
function crearPluginEdicion(esquema: Schema): Plugin {
    let rules: InputRule[] = smartQuotes.concat(ellipsis, emDash);
    let tipoNodo: any;
    if (tipoNodo = esquema.nodes.ordered_list) {
       rules.push(crearReglaListaOrdenada(tipoNodo));
    }

    if (tipoNodo = esquema.nodes.bullet_list) {
        rules.push(crearReglaListaVinietas(tipoNodo));
    }

    return inputRules({ rules });
}

/**
 * Implementación de función {@link prosemirror-menu#MenuItemSpec.active } que se usa para determinar si la opción se encuentra habilitada o
 * no según el estado del editor (incluyendo la posición del cursor).
 * @param estado El estado del editor.
 * @param tipoMarca El tipo de marca (propiedad de texto) del nodo.
 * @returns Un valor que indica si el control se encuentra activo (habilitado) o no.
 */
function marcarActivo(estado: EditorState, tipoMarca: MarkType): boolean {
    let { from, $from, to, empty } = estado.selection;
    if (empty) {
        return !!tipoMarca.isInSet(estado.storedMarks || $from.marks());
    } else {
        return estado.doc.rangeHasMark(from, to, tipoMarca);
    }
}

/**
 * Crea un elemento de tipo botón para la barra de herramientas del editor.
 * @param tipoMarca El tipo de marca (propiedad de texto) del nodo.
 * @param titulo El título o texto descriptivo del botón.
 * @param icono El icono del botón.
 * @returns Un {@link prosemirror-menu#MenuItem } que representa un botón con texto, un icono y una propiedad del texto que altera.
 */
function crearBoton(tipoMarca: MarkType, titulo: string, icono: IconSpec): MenuItem {
    let comando: Command = toggleMark(tipoMarca);
    let propiedadesBoton: MenuItemSpec = {
        active(state: EditorState) { return marcarActivo(state, tipoMarca); },
        enable: estadoEditor => comando(estadoEditor),
        icon: icono,
        label: titulo,
        run: toggleMark(tipoMarca),
        select: estadoEditor => comando(estadoEditor),
        title: titulo,
    };
    return new MenuItem(propiedadesBoton);
}

/**
 * Crea una colección de {@link prosemirror-menu#MenuElement elementos de menú} que conformarán el contenido de la barra de herramientas del
 * editor.
 * @param esquema El esquema de ProseMirror para el documento. Es necesario para reconocer los tipos de nodos y marcas que soporta.
 * @returns Los elementos que conforman la barra de herramientas del editor.
 */
function crearElementosMenu(esquema: Schema): MenuElement[][] {
    return [[ crearBoton(esquema.marks.strong, "Negrita", icons.strong) ]];
}

/**
 * Crea una lista de {@link prosemirror-state#Plugin | plugins} de ProseMirror que definen el menú de opciones y algunos plugins básicos
 * para permitir la edición.
 * @param esquema El esquema de ProseMirror para el documento. Es necesario para reconocer los tipos de nodos y marcas que soporta.
 * @returns Una lista inicial de plugins que se usan al crear el {@link prosemirror-state#EditorState | estado} del editor.
 */
export function crearMenu(esquema: Schema): Plugin[] {
    let plugins: Plugin[] = [
        crearPluginEdicion(esquema),
        history(),
        keymap({ "Mod-z": undo, "Mod-y": redo }),
        keymap(baseKeymap),
        dropCursor(),
        gapCursor(),
    ];
    plugins.push(menuBar({ content: crearElementosMenu(esquema) }));
    return plugins;
}