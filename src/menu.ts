import { baseKeymap } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { ellipsis, emDash, InputRule, inputRules, smartQuotes, wrappingInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { NodeType, Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";

export function crearMenu(esquema: Schema): Plugin[] {
    let plugins: Plugin[] = [
        history(),
        keymap({ "Mod-z": undo, "Mod-y": redo }),
        keymap(baseKeymap),
        crearPluginEdicion(esquema),
    ];
    return plugins;
}

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

function crearReglaListaOrdenada(tipo: NodeType): InputRule {
    return wrappingInputRule(
        /^(\d+)\.\s$/,
        tipo,
        coincidencia => ({ order: +coincidencia[1] }),
        (coincidencia, nodo) => nodo.childCount + nodo.attrs.order == +coincidencia[1]);
}

function crearReglaListaVinietas(tipo: NodeType): InputRule {
    return wrappingInputRule(/^\s*([-+*])\s$/, tipo);
}