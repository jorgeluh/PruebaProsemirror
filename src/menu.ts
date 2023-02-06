import { baseKeymap, chainCommands, exitCode, joinDown, joinUp, lift, selectParentNode, toggleMark } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { history, redo, undo } from "prosemirror-history";
import { ellipsis, emDash, InputRule, inputRules, smartQuotes, undoInputRule, wrappingInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { Dropdown, icons, IconSpec, menuBar, MenuElement, MenuItem, MenuItemSpec } from "prosemirror-menu";
import { MarkType, NodeType, Schema } from "prosemirror-model";
import { liftListItem, sinkListItem, splitListItem, wrapInList } from "prosemirror-schema-list";
import { Command, EditorState, Plugin } from "prosemirror-state";

/**
 * Determina si el cliente es un producto de Apple para identificar la tecla de comando o de control.
 */
const esMac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

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
 * @param texto El título o texto descriptivo del botón.
 * @param icono El icono del botón.
 * @returns Un {@link prosemirror-menu#MenuItem } que representa un botón con texto, un icono y una propiedad del texto que altera.
 */
function crearBotonParaMarca(tipoMarca: MarkType, texto: string, icono: IconSpec): MenuItem {
    let comando: Command = toggleMark(tipoMarca);
    let propiedadesBoton: MenuItemSpec = {
        active(state: EditorState) { return marcarActivo(state, tipoMarca); },
        enable: estadoEditor => comando(estadoEditor),
        icon: icono,
        label: texto,
        run: comando,
        select: estadoEditor => comando(estadoEditor),
        title: texto,
    };
    return new MenuItem(propiedadesBoton);
}

/**
 * Crea un elemento de tipo botón para la barra de herramientas del editor.
 * @param tipoNodo El tipo de nodo (propiedad de grupo de texto) del nodo.
 * @param texto El título o texto descriptivo del botón.
 * @param icono El icono del botón.
 * @returns Un {@link prosemirror-menu#MenuItem } que representa un botón con texto, un icono y una propiedad del texto que altera.
 */
function crearBotonParaNodo(tipoNodo: NodeType, texto: string, icono: IconSpec): MenuItem {
    let comando: Command = wrapInList(tipoNodo, { title: texto, icon: icono });
    let propiedadesBoton: MenuItemSpec = {
        enable: estadoEditor => comando(estadoEditor),
        icon: icono,
        label: texto,
        select: estadoEditor => comando(estadoEditor),
        run: comando,
    };
    return new MenuItem(propiedadesBoton);
}

/**
 * Crea una entrada de menú desplegable para la barra de herramientas que agrupa más opciones.
 * @param texto El texto que tendrá el menú desplegable.
 * @param contenido La colección de elementos de menú disponibles dentro del menú desplegable.
 * @returns Un elemento de menú que contiene a más opciones.
 */
function crearMenuDesplegable(texto: string, contenido: MenuElement[]): MenuElement {
    return new Dropdown(contenido, { label: texto, title: texto });
}

/**
 * Registra las teclas y combinaciones para ejecutar acciones específicas dentro del editor.
 * @param esquema El esquema de ProseMirror para el documento. Es al que se asocian los mapeos de teclas a
 * {@link prosemirror-state#Command | comandos}.
 * @returns El diccionario de mapeos de teclas o combinaciones de teclas a comandos.
 */
function construirMapeoTeclas(esquema: Schema): { [tecla: string]: Command } {
    let mapeos: { [tecla: string]: Command } = {};
    mapeos["Mod-z"] = undo;
    mapeos["Shift-Mod-z"] = redo;
    mapeos["Backspace"] = undoInputRule;
    if (!esMac) {
        mapeos["Mod-y"] = redo;
    }

    mapeos["Alt-ArrowUp"] = joinUp;
    mapeos["Alt-ArrowDown"] = joinDown;
    mapeos["Mod-BracketLeft"] = lift;
    mapeos["Escape"] = selectParentNode;

    mapeos["Mod-b"] = toggleMark(esquema.marks.strong);
    mapeos["Mod-B"] = toggleMark(esquema.marks.strong);
    mapeos["Mod-i"] = toggleMark(esquema.marks.em);
    mapeos["Mod-I"] = toggleMark(esquema.marks.em);

    let nuevaLinea: NodeType = esquema.nodes.hard_break;
    let comando: Command = chainCommands(exitCode, (estadoEditor, ejecucion) => {
        if (ejecucion) {
            ejecucion(estadoEditor.tr.replaceSelectionWith(nuevaLinea.create()).scrollIntoView());
        }

        return true;
    });
    mapeos["Mod-Enter"] = comando;
    mapeos["Shift-Enter"] = comando;
    if (esMac) {
        mapeos["Ctrl-Enter"] = comando;
    }

    mapeos["Enter"] = splitListItem(esquema.nodes.list_item);
    mapeos["Tab"] = sinkListItem(esquema.nodes.list_item);
    mapeos["Shift-Tab"] = liftListItem(esquema.nodes.list_item);

    return mapeos;
}

/**
 * Crea una colección de {@link prosemirror-menu#MenuElement elementos de menú} que conformarán el contenido de la barra de herramientas del
 * editor.
 * @param esquema El esquema de ProseMirror para el documento. Es necesario para reconocer los tipos de nodos y marcas que soporta.
 * @returns Los elementos que conforman la barra de herramientas del editor.
 */
function crearElementosMenu(esquema: Schema): MenuElement[][] {
    return [[
        crearBotonParaMarca(esquema.marks.strong, "Negrita", icons.strong),
        crearBotonParaMarca(esquema.marks.em, "Cursiva", icons.em),
    ], [
        crearMenuDesplegable("Listas numeradas", [
            crearBotonParaNodo(esquema.nodes.ordered_list, "Números arábigos", icons.orderedList),
            crearBotonParaNodo(esquema.nodes.bullet_list, "Números arábigos", icons.bulletList),
        ]),
    ]];
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
        keymap(construirMapeoTeclas(esquema)),
        keymap(baseKeymap),
        dropCursor(),
        gapCursor(),
        history(),
    ];
    plugins.push(menuBar({ content: crearElementosMenu(esquema) }));
    return plugins;
}