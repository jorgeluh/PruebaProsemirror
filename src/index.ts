// Funcionalidad básica
import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// Plugins
import { addTagNodes, addMentionNodes } from "prosemirror-mentions";

// Módulos propios
import { crearMenu } from "./menu";
import { agregarNodosListas } from "./listas";
import { crearPluginMenciones } from "./menciones";

// Estilos
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-example-setup/style/style.css";

// El esquema que define la estructura posible del documento.
let esquema = new Schema({
    nodes: agregarNodosListas(addTagNodes(addMentionNodes(schema.spec.nodes)), "paragraph block*", "block"),
    marks: schema.spec.marks,
});

// Se agregan los plugins por medio de funciones propias para crear el editor y configurar el plugin de menciones.
let coleccionPlugins = crearMenu(esquema);
coleccionPlugins.unshift(crearPluginMenciones([
    { name: "Jorge Lu", id: 107, email: "jlu@canella.com.gt" },
    { name: "Juan Pérez", id: 108, email: "jperez@canella.com.gt" },
]));

// Se crea el estado inicial del documento.
let state = EditorState.create({
    schema: esquema,
    plugins: coleccionPlugins,
});

// El editor se agrega al cuerpo del HTML con el estado inicial configurado.
let vista = new EditorView(document.body, { state });