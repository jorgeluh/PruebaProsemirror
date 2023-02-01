// Funcionalidad básica
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// Plugins
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-example-setup/style/style.css";

let state = EditorState.create({
    schema,
    plugins: exampleSetup({ schema: schema })
});
let vista = new EditorView(document.body, { state });