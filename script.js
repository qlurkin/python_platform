import * as monaco from "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/+esm";
import { asyncRun } from "./workerApi.mjs";

const myEditor = monaco.editor.create(document.getElementById("editor"), {
  value: `print("Hello World!")`,
  language: "python",
  automaticLayout: true,
});

const scripts = {};

async function loadScripts(url) {
  if (!scripts[url]) {
    const response = await fetch(url);
    scripts[url] = await response.text();
  }
  return scripts[url];
}

async function preScript(args) {
  const script = await loadScripts("./pre_script.py");
  const { result, error } = await asyncRun(script, { args });
  return { result, error };
}

async function readFile(filename) {
  const script = await loadScripts("./read_file.py");
  const { result, error } = await asyncRun(script, { filename });
  return { result, error };
}

async function saveFile(filename, content) {
  const script = await loadScripts("./save_file.py");
  const { result, error } = await asyncRun(script, { filename, content });
  return { result, error };
}

const commands = {
  python: async (args) => {
    const { result, error } = await asyncRun(myEditor.getValue(), {});
    return { result, error };
  },
  cat: async () => {
    const result = myEditor.getValue();
    const error = undefined;
    return { result, error };
  },
  cd: async (args) => {
    const dest = args[0];
    const src = await loadScripts("./cd.py");
    const { result, error } = await asyncRun(src, { dest });
    document.getElementById("cwd").innerHTML = result;
    return { error };
  },
  code: async (args) => {
    const filename = args[0];
    const { result, error } = await readFile(filename);
    myEditor.setValue(result);
    document.getElementById("filename").innerHTML = filename;
    return { error };
  },
};

commands.help = async () => {
  let result = `Available commands:`;
  for (let cmd in commands) {
    result += "\n  - " + cmd;
  }
  const error = undefined;
  return { result, error };
};

const history = [];
let history_index = 0;

const cmd_input = document.getElementById("cmd");

function mod(n, m) {
  return ((n % m) + m) % m;
}

cmd_input.addEventListener("keydown", (event) => {
  if (history.length > 0) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      history_index -= 1;
      history_index = mod(history_index, history.length);
      cmd_input.value = history[history_index];
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      history_index += 1;
      history_index = mod(history_index, history.length);
      cmd_input.value = history[history_index];
    }
  }
});

document
  .getElementById("cmd-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const cmd = data.get("cmd");
    cmd_input.value = "";
    console.log(`> ${cmd}`);
    const index = history.indexOf(cmd);
    if (index !== -1) {
      history.splice(index, 1);
    }
    history.push(cmd);
    history_index = 0;

    const parts = cmd.split(" ");
    if (commands[parts[0]]) {
      const { result, error } = await commands[parts[0]](parts.slice(1));
      if (result) console.log(result);
      if (error) console.log(error);
    } else {
      console.log(`Unknown command "${cmd}"`);
    }
  });
