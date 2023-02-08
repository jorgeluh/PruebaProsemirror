// Funcionalidad básica
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// Plugins
import { Schema } from "prosemirror-model";
import { addMentionNodes, addTagNodes, getMentionsPlugin } from "prosemirror-mentions";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-example-setup/style/style.css";

// Módulos propios
import { crearMenu } from "./menu";
import { agregarNodosLista, listaOrdenada } from "./listas";

let esquema = new Schema({
    nodes: agregarNodosLista(addTagNodes(addMentionNodes(schema.spec.nodes)), "paragraph block*", "block"),
    marks: schema.spec.marks
});

let generarHtmlMenciones = elementos => `<div class="suggestion-item-list">${
    elementos.map(elemento => `<div class="suggestion-item">${elemento.name}</div>`).join("")}</div>`;

let pluginMenciones = getMentionsPlugin({
    getSuggestions: (type, text, done) => {
        setTimeout(() => {
            if (type === "mention") {
                done([{ name: "Jorge Lu", id: 107, email: "jlu@canella.com.gt" }, { name: "Juan Pérez", id: 108, email: "jperez@canella.com.gt" }]);
            }
        }, 0);
    },
    getSuggestionsHTML: (items, type) => {
        if (type === "mention") {
            return generarHtmlMenciones(items);
        }

        return "";
    }
});

let coleccionPlugins = crearMenu(esquema);
coleccionPlugins.unshift(pluginMenciones);

let state = EditorState.create({
    schema: esquema,
    plugins: coleccionPlugins
});
let vista = new EditorView(document.body, { state });