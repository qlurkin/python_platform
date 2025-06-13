import * as monaco from "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/+esm";
import { asyncRun } from "./workerApi.mjs";

const myEditor = monaco.editor.create(document.getElementById("editor"), {
  value: `with open("/home/caca", "w") as file:
    file.write("merde")`,
  language: "python",
  automaticLayout: true,
});

const commands = {
  python: async () => {
    const { result, error } = await asyncRun(myEditor.getValue(), {});
    return { result, error };
  },
  cat: async () => {
    const result = myEditor.getValue();
    const error = undefined;
    return { result, error };
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
    if (commands[cmd]) {
      const { result, error, fs } = await commands[cmd]();
      if (result) console.log(result);
      if (error) console.log(error);
      if (fs) console.log();
    } else {
      console.log(`Unknown command "${cmd}"`);
    }
  });
