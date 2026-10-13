const blacklistedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'OPTION']

//"text we never touch" policy, shared by every walker in the module (matching AND wrapping)
export const textNodeFilter = (node: Node) =>
    (
        blacklistedTags.includes((node.parentNode as HTMLElement)?.tagName)
        || (node.parentNode as HTMLElement)?.contentEditable == 'true'
    ) ?
        NodeFilter.FILTER_REJECT :
        NodeFilter.FILTER_ACCEPT

/*
    Find each text within root, ignoring case and all whitespace.

    One TreeWalker pass condenses the page text into a single lowercased string
    with whitespace removed, plus an index of word "runs" (condensed position ->
    text node + original offset). Searching is then just native String.indexOf,
    and range boundaries are resolved with a binary search over the runs.
*/
export default function(root: Element, texts: string[]) {
    //nearest lang; it can be malformed (e.g. lang="en_US") — toLocaleLowerCase throws RangeError on invalid tags
    let locale: string | undefined = root.closest('[lang]')?.getAttribute('lang') || undefined
    try { if (locale) Intl.getCanonicalLocales(locale) } catch { locale = undefined }

    //whole-string lowercasing keeps context-sensitive mappings (greek final sigma) consistent on both sides
    const patterns = texts.map(text => text.toLocaleLowerCase(locale).replace(/\s+/g, ''))
    const ranges: Range[][] = patterns.map(() => [])
    if (!patterns.some(pattern => pattern.length)) return ranges

    //condensed document text + word runs
    const parts: string[] = []
    const runStarts: number[] = []   //condensed position of the run
    const runNodes: Node[] = []
    const runOffsets: number[] = []  //original offset of the run inside its node
    let length = 0

    const addRun = (text: string, node: Node, offset: number) => {
        parts.push(text)
        runStarts.push(length)
        runNodes.push(node)
        runOffsets.push(offset)
        length += text.length
    }

    const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, textNodeFilter)

    const words = /\S+/g
    let node: Node | null
    while (node = treeWalker.nextNode()) {
        const original = node.nodeValue
        if (!original) continue

        const lowered = original.toLocaleLowerCase(locale)

        if (lowered.length === original.length) {
            //fast path: offsets inside a run map 1:1 to the original text
            let match: RegExpExecArray | null
            words.lastIndex = 0
            while (match = words.exec(lowered))
                addRun(match[0], node, match.index)
        } else {
            //rare path: lowercasing changed the length (e.g. İ -> i̇) — emit exact per-unit runs
            for (let i = 0; i < original.length;) {
                const char = String.fromCodePoint(original.codePointAt(i)!)
                const low = char.toLocaleLowerCase(locale)
                if (low.trim())
                    for (let k = 0; k < low.length; k++)
                        addRun(low[k], node, i + Math.min(k, char.length - 1))
                i += char.length
            }
        }
    }

    const haystack = parts.join('')

    //condensed position -> [node, original offset]
    const resolve = (position: number): [Node, number] => {
        let lo = 0, hi = runStarts.length - 1
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1
            if (runStarts[mid] <= position) lo = mid
            else hi = mid - 1
        }
        return [runNodes[lo], runOffsets[lo] + (position - runStarts[lo])]
    }

    for (let j = 0; j < patterns.length; j++) {
        const pattern = patterns[j]
        if (!pattern.length) continue

        let index = 0
        while ((index = haystack.indexOf(pattern, index)) != -1) {
            const [startNode, startOffset] = resolve(index)
            const [endNode, endOffset] = resolve(index + pattern.length - 1)
            index += pattern.length

            const range = document.createRange()
            range.setStart(startNode, startOffset)
            range.setEnd(endNode, endOffset + 1)

            const startElement = startNode.parentElement
            if (
                !range.collapsed &&
                (startElement?.checkVisibility ? startElement.checkVisibility() : true)
            )
                ranges[j].push(range)
        }
    }

    return ranges;
}
