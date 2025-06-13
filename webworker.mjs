import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs";

let pyodideReadyPromise = loadPyodide().then((pyodide) => {
  let mountDir = "/home/pyodide";
  pyodide.FS.mkdirTree(mountDir);
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, {}, mountDir);
  return pyodide;
});

self.onmessage = async (event) => {
  // make sure loading is done
  const pyodide = await pyodideReadyPromise;
  const { id, python, context } = event.data;
  pyodide.FS.syncfs(true, async (err) => {
    // Now load any packages we need, run the code, and send the result back.
    await pyodide.loadPackagesFromImports(python);
    // make a Python dictionary with the data from `context`
    const dict = pyodide.globals.get("dict");
    const globals = dict(Object.entries(context));
    let msg;
    try {
      // Execute the python code in this context
      const result = await pyodide.runPythonAsync(python, { globals });
      msg = { result, id };
    } catch (error) {
      msg = { error: error.message, id };
    }
    pyodide.FS.syncfs(false, (err) => {
      self.postMessage(msg);
    });
  });
};
