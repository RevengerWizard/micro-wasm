# micro-wasm

A browser port of the [micro](https://github.com/RevengerWizard/micro) pixel framework for the browser, using Javascript, WebAssembly and WebGL.

## Build

The build requires `make`, a WebAssembly-capable `clang` toolchain (for example, [WASI SDK](https://github.com/WebAssembly/wasi-sdk)), and the relocatable WASM library produced by micro.

Set `WASI_SYSROOT` to the WASI SDK sysroot and `LIBMICRO_WASM` to micro's relocatable WASM library, then run:

```sh
make
```

This creates `micro.wasm`. Use `make clean` to remove generated files.

## Running

Serve the project over HTTP; opening `index.html` directly will not work because the browser must fetch the WASM module and filesystem assets.

```sh
python -m http.server 8000
```

Open <http://localhost:8000/>. The browser loads `fs/index.json` and the files listed there as a read-only virtual filesystem. Add assets to `fs/` and list each path in `fs/index.json`.

## Project layout

- `micro.wasm` is the final WASI WebAssembly module
- `wasi.js` implements `wasi_snapshot_preview1`
- `glfw.js` implements the GLFW window, input, callbacks, resize, and state
- `gl.js` contains only the WebGL handlers used by micro
- `fs.js` provides a read-only filesystem loaded from `fs` folder
- `micro_wasm.c` is a statically linked browser glue
- `index.js` creates the canvas, imports the host implementations, loads WASM and drives frames
- `pak.js` provides a ZIP filesystem loaded from `pak0` file

The separate `pak.js`/`pak0` ZIP filesystem is retained for future use; the current build uses the directory filesystem.

## Resources

- [micro](https://github.com/RevengerWizard/micro)
- [easywasm/gl](https://github.com/easywasm/gl)
- [easywasm/wasi](https://github.com/easywasm/wasi)