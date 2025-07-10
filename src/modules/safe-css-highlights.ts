/*
    Firefox > 140 support CSS.highlights, but it has a bug when it used in isolated environments (like Web Extensions)
*/

const isFirefox = 'InternalError' in window

class SafeCSSHighlights {
    #cache = new Map<string, Set<Range>>()

    get size() {
        return CSS.highlights.size
    }

    clear() {
        CSS.highlights.clear()

        if (isFirefox)
            this.#cache.clear()
    }

    set(name: string, ...ranges: Range[]) {
        CSS.highlights.set(name, new Highlight(...ranges))

        if (isFirefox)
            this.#cache.set(name, new Set(ranges))
    }

    get(name: string): Set<Range> | undefined {
        if (isFirefox)
            return this.#cache.get(name)
        
        return CSS.highlights.get(name) as any
    }

    has(name: string) {
        return CSS.highlights.has(name)
    }

    delete(name: string) {
        if (isFirefox)
            this.#cache.delete(name)

        return CSS.highlights.delete(name)
    }

    forEach(callback: (value: Set<Range>, key: string, parent: HighlightRegistry) => void) {
        if (isFirefox) {
            this.#cache.forEach((value, key) => {
                callback(value, key, CSS.highlights)
            })
            return
        }
        
        CSS.highlights.forEach(callback as any)
    }
}

export default new SafeCSSHighlights()