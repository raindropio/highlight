/*
    Firefox > 140 support CSS.highlights, but it has a bug when it used in isolated environments (like Web Extensions)
*/

const isFirefox = 'InternalError' in globalThis

//the registry can be shared with the page (main world), so every bulk
//operation is scoped to our own keys and never touches page-owned entries
class SafeCSSHighlights {
    #cache = new Map<string, Set<Range>>()

    hasAny(match: string | RegExp) {
        return this.#keys().some(key => this.#matches(key, match))
    }

    clear(match: string | RegExp) {
        for (const key of this.#keys())
            if (this.#matches(key, match)) {
                CSS.highlights.delete(key)
                this.#cache.delete(key)
            }
    }

    set(name: string, ...ranges: Range[]) {
        CSS.highlights.set(name, new Highlight(...ranges))

        if (isFirefox)
            this.#cache.set(name, new Set(ranges))
    }

    forEach(callback: (value: Set<Range>, key: string) => void, match: string | RegExp) {
        if (isFirefox) {
            this.#cache.forEach((value, key) => {
                if (this.#matches(key, match)) callback(value, key)
            })
            return
        }

        CSS.highlights.forEach((value, key) => {
            if (this.#matches(key, match)) callback(value as any, key)
        })
    }

    #matches(key: string, match: string | RegExp) {
        return typeof match == 'string' ? key.startsWith(match) : match.test(key)
    }

    #keys(): string[] {
        if (isFirefox)
            return [...this.#cache.keys()]
        return [...CSS.highlights.keys()]
    }
}

export default new SafeCSSHighlights()
