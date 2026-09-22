// Minimal WebGL adapter. Windowing, input, callbacks and GLFW live in glfw.js.
export class GL {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl2', { alpha: false, antialias: true })
        if (!this.gl) throw new Error('micro needs WebGL 2')
        this.module = null; this.objects = new Map(); this.nextObject = 1
    }
    setModule(module) { this.module = module; return this }
    _memory() { return new Uint8Array(this.module?.exports?.memory?.buffer || 0) }
    _view() { const m = this._memory(); return m.length ? new DataView(m.buffer) : null }
    _readString(ptr) { const m = this._memory(); let end = ptr; while (m[end]) end++; return new TextDecoder().decode(m.subarray(ptr, end)) }
    _readPointer(ptr) { return this._view()?.getUint32(ptr, true) || 0 }
    _writeInt(ptr, value) { if (ptr) this._view()?.setInt32(ptr, value, true) }
    _handle(value) { const id = this.nextObject++; this.objects.set(id, value); return id }
    _object(id) { return this.objects.get(id) }
    _bufferData(target, size, ptr, usage) {
        const bytes = this._memory()
        const data = ptr ? bytes.subarray(ptr, ptr + size) : size
        this.gl.bufferData(target, data, usage)
    }
    _texImage(args) {
        const upload = args.slice()
        // Native code passes a WASM pointer; WebGL expects an ArrayBufferView.
        const ptr = upload[8], bytes = this._memory()
        upload[8] = ptr ? bytes.subarray(ptr, ptr + upload[3] * upload[4] * 4) : null
        return this.gl.texImage2D(...upload)
    }
    getImports() {
        const g = this.gl, c = this
        const imports = {
            glEnable: x => { if (x !== 0x809d) g.enable(x) }, glDisable: x => { if (x !== 0x809d) g.disable(x) }, glBlendFunc: (a, b) => g.blendFunc(a, b), glDepthFunc: x => g.depthFunc(x),
            glClearColor: (r, x, b, a) => g.clearColor(r, x, b, a), glClear: x => g.clear(x), glViewport: (x, y, w, h) => g.viewport(x, y, w, h),
            glCreateProgram: () => c._handle(g.createProgram()), glCreateShader: type => c._handle(g.createShader(type)),
            glShaderSource: (shader, _count, strings) => g.shaderSource(c._object(shader), c._readString(c._readPointer(strings))), glCompileShader: shader => g.compileShader(c._object(shader)),
            glAttachShader: (program, shader) => g.attachShader(c._object(program), c._object(shader)), glLinkProgram: program => g.linkProgram(c._object(program)),
            glDeleteShader: shader => g.deleteShader(c._object(shader)), glUseProgram: program => g.useProgram(c._object(program)),
            glGenVertexArrays: (_n, ptr) => c._writeInt(ptr, c._handle(g.createVertexArray())), glBindVertexArray: id => g.bindVertexArray(c._object(id)),
            glGenBuffers: (_n, ptr) => c._writeInt(ptr, c._handle(g.createBuffer())), glBindBuffer: (target, id) => g.bindBuffer(target, c._object(id)),
            glBufferData: (target, size, ptr, usage) => c._bufferData(target, size, ptr, usage), glEnableVertexAttribArray: index => g.enableVertexAttribArray(index),
            glVertexAttribPointer: (...args) => g.vertexAttribPointer(...args), glGenTextures: (_n, ptr) => c._writeInt(ptr, c._handle(g.createTexture())),
            glBindTexture: (target, id) => g.bindTexture(target, c._object(id)), glTexParameteri: (target, pname, value) => g.texParameteri(target, pname, value === 0x812d ? 0x812f : value),
            glTexImage2D: (...args) => c._texImage(args), glDrawElements: (...args) => g.drawElements(...args), glGetError: () => g.getError()
        }
        return { env: imports, glew: imports, opengl: imports }
    }
}
