// Future ZIP-backed filesystem. Kept separate from the directory filesystem.
export class PakFS {
    constructor(data) { this.data = data }
    _path(path) {
        const out = []
        for (const part of String(path).replace(/\\/g, '/').split('/')) {
            if (!part || part === '.') continue
            if (part === '..') out.pop(); else out.push(part)
        }
        return out.join('/') || '.'
    }
    readFileSync(path) {
        if (this._path(path) !== 'pak0') throw Object.assign(new Error('ENOENT: ' + path), { code: 'ENOENT' })
        return this.data.slice()
    }
    statSync(path) {
        if (this._path(path) === 'pak0') return { size: this.data.length, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false }
        if (this._path(path) === '.') return { size: 0, isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false }
        throw Object.assign(new Error('ENOENT: ' + path), { code: 'ENOENT' })
    }
    readdirSync(path) { return this._path(path) === '.' ? [{ name: 'pak0', isFile: () => true, isDirectory: () => false }] : [] }
}

export async function loadPak(url = './pak0') {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Unable to load ' + url)
    return new PakFS(new Uint8Array(await response.arrayBuffer()))
}
