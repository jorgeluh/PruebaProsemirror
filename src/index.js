// Funcionalidad básica
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// Plugins
import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";

let state = EditorState.create({
    schema,
    plugins: [
        history(),
        keymap({ "Mod-z": undo, "Mod-y": redo }),
        keymap(baseKeymap)
    ]
});
let vista = new EditorView(document.body, { state });