import * as monaco from "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/+esm";
import { asyncRun } from "./workerApi.mjs";

const spinner = document.getElementById("spinner");
document.body.removeChild(spinner);

const editor_element = document.createElement("div");
editor_element.id = "editor";
document.body.appendChild(editor_element);

const myEditor = monaco.editor.create(editor_element, {
  value: `print('Hello world!')`,
  language: "python",
  automaticLayout: true,
});

const run_btn = document.createElement("button");
run_btn.innerHTML = "Run";
document.body.appendChild(run_btn);
run_btn.addEventListener("click", async () => {
  const { result, error } = await asyncRun(myEditor.getValue(), {});
  console.log(result);
  console.log(error);
});
