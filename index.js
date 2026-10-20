import { GL } from './gl.js'
import { GLFW } from './glfw.js'
import { WasiPreview1 } from './wasi.js'
//import { loadDirectoryFS } from './dir.js'
import { loadPak } from './pak.js'

let microModule

async function loadMicroWasm(canvas)
{
    const gl = new GL(canvas), fs = await loadPak(), wasi = new WasiPreview1({ fs }), glfw = new GLFW({ canvas })
    const glImports = gl.getImports()
    const env = { ...glImports.env, ...glfw,
        // Patch some symbols
        system: () => -1,
        clock: () => -1,
    }
    const imports = { env, glfw, glew: glImports.glew, opengl: glImports.opengl, wasi_snapshot_preview1: wasi }
    const response = await fetch("./micro.wasm");
    let result;
    try
    {
        result = await WebAssembly.instantiateStreaming(response, imports);
    }
    catch(error)
    {
        // A static server may not send application/wasm.  Keep the fallback
        // because it is useful during local development.
        const bytes = await (await fetch("./micro.wasm")).arrayBuffer();
        result = await WebAssembly.instantiate(bytes, imports);
    }

    microModule = result.instance;
    gl.setModule(microModule); glfw.start(microModule.exports); wasi.setup(microModule.exports);

    const api = microModule.exports;
    if(typeof api.micro_wasm_open !== 'function' ||
       typeof api.micro_wasm_frame !== 'function' ||
       typeof api.micro_wasm_close !== 'function')
        throw new Error('micro.wasm is missing the wasm glue exports; reload the updated micro.wasm')
    api.micro_wasm_open()
    const frameDuration = 1000 / 60
    let nextFrame = null
    const tick = (timestamp) => {
        if(nextFrame === null) nextFrame = timestamp
        if(timestamp < nextFrame)
        {
            requestAnimationFrame(tick)
            return
        }

        const running = api.micro_wasm_frame() !== 0
        nextFrame += frameDuration
        // Do not try to catch up with a large backlog after a pause or hitch.
        if(nextFrame < timestamp) nextFrame = timestamp + frameDuration
        if(running) requestAnimationFrame(tick)
        else api.micro_wasm_close()
    }
    if(typeof api.micro_wasm_frame === 'function')
    {
        requestAnimationFrame(tick)
    }
    window.addEventListener('unload', () => api.micro_wasm_close(), { once: true })
}

window.addEventListener("load", async () => {
    const canvas = document.createElement("canvas");
    canvas.id = "micro-canvas";
    Object.assign(canvas.style, {
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
        width: "min(100vw, 100vh)", height: "min(100vw, 100vh)",
        imageRendering: "pixelated"
    });
    document.body.replaceChildren(canvas);

    try
    {
        await loadMicroWasm(canvas);
    }
    catch(error)
    {
        console.error("Unable to load micro.wasm", error);
        document.body.append("Unable to load micro.wasm: " + error.message);
    }
});
