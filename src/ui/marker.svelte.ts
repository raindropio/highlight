import type { CustomHighlight } from '../types'
import { colors } from '../config'
import findTextRanges from '../modules/find-text-ranges'
import SafeCSSHighlights from '../modules/safe-css-highlights'

export const isSupported = !!globalThis.CSS?.highlights

//per-instance prefix; NAMESPACE matches every instance
const NAMESPACE = /^rh-\d{10,}-/
let seq = 0

//_id and color come from external payloads and are interpolated into CSS — allow only safe values
function safeCssId(_id: CustomHighlight['_id'], fallback: string) {
    return typeof _id == 'string' && /^[\w-]+$/.test(_id) ? _id : fallback
}

function safeCssColor(color: CustomHighlight['color']) {
    return colors.get(color!) ||
        (color && CSS.supports?.('color', color) ? color : colors.get('yellow')!)
}

function rangeText(range: Range) {
    const div = document.createElement('div')
    div.appendChild(range.cloneContents())
    //svg specific
    div.querySelectorAll('tspan').forEach(e=>e.outerHTML=`<span>${e.innerHTML}</span>`)
    div.querySelectorAll('text').forEach(e=>e.outerHTML=`<div>${e.innerHTML}</div>`)
    //innerText needs layout, but the element doesn't have to be in the viewport
    div.style.cssText = 'position:fixed;left:-99999px;top:0'
    document.body.appendChild(div)
    const text = div.innerText
    div.remove()
    return text
}

//leftovers of a previous script copy (extension reload); call before creating markers
export function sweep() {
    document.head.querySelectorAll('style[id^="rh-"]').forEach(elem=>{
        if (NAMESPACE.test(elem.id)) elem.remove()
    })
    SafeCSSHighlights.clear(NAMESPACE)
}

export type Marker = ReturnType<typeof createMarker>

//create during component init: re-renders when root or highlights change, cleans up on destroy.
//highlights are matched by identity, so pass the same objects you keep in your list. one marker per root
export function createMarker(root: ()=>Element | null | undefined, highlights: ()=>CustomHighlight[]) {
    const prefix = `rh-${Date.now()}-${++seq}-`

    //rendered highlight -> live range
    let found = $state.raw<ReadonlyMap<CustomHighlight, Range>>(new Map())

    function cleanup() {
        SafeCSSHighlights.clear(prefix)
        document.getElementById(prefix)?.remove()
        found = new Map()
    }

    function render() {
        const el = root()
        const list = highlights()
        if (!el || !isSupported || !list.length) return cleanup()

        SafeCSSHighlights.clear(prefix)

        const textsRanges = findTextRanges(el, list.map(({ text })=>text || ''))
        const next = new Map<CustomHighlight, Range>()
        const rules: string[] = []

        for (let i = 0; i < list.length; i++) {
            const ranges = textsRanges[i]
            if (!ranges.length) continue

            const highlight = list[i]
            const { _id, color, note, position = 0 } = highlight
            const cssId = `${prefix}${safeCssId(_id, `local-${i}`)}`
            const range = ranges[position] || ranges[0]
            const highlightColor = safeCssColor(color)

            SafeCSSHighlights.set(cssId, range)
            next.set(highlight, range)

            rules.push(`
                ::highlight(${cssId}) {
                    all: unset;
                    background-color: color-mix(in srgb, ${highlightColor}, transparent 60%) !important;
                    ${note ? `text-decoration: underline wavy; -webkit-text-decoration: underline wavy;` : ''}
                    text-decoration-thickness: from-font;
                }

                /* fuck you dark reader */
                html[data-darkreader-scheme="dark"] ::highlight(${cssId}) {
                    color: CanvasText !important;
                }

                /* pdf render */
                .pdf ::highlight(${cssId}) {
                    background-color: color-mix(in srgb, ${highlightColor}, transparent 60%) !important;
                    color: transparent !important;
                }
            `)
        }

        let style = document.getElementById(prefix)
        if (!style) {
            style = document.createElement('style')
            style.id = prefix
            document.head.appendChild(style)
        }
        style.innerHTML = rules.join('\n')

        found = next
    }

    $effect(render)
    $effect(()=>cleanup)

    return {
        get root() { return root() },
        get found() { return found },

        rect(highlight: CustomHighlight) {
            return found.get(highlight)?.getBoundingClientRect()
        },

        //exact selection of a highlight, or a click (collapsed range) inside it
        at(range: Range) {
            for (const [highlight, rendered] of found) {
                const ss = range.compareBoundaryPoints(Range.START_TO_START, rendered)
                const ee = range.compareBoundaryPoints(Range.END_TO_END, rendered)
                if ((ss == 0 && ee == 0) || (range.collapsed && ss >= 0 && ee <= 0))
                    return highlight
            }
        },

        textOf: rangeText,

        //occurrence index; a full scan of root, resolve only when saving
        positionOf(range: Range) {
            const el = root()
            const text = rangeText(range).trim()
            if (!el || !text) return
            const [ranges] = findTextRanges(el, [text])
            //found range must lie within the selection: selections often include extra
            //whitespace (double-click) or element-level boundaries (triple-click)
            const position = ranges.findIndex(r=>
                r.compareBoundaryPoints(Range.START_TO_START, range) >= 0 &&
                r.compareBoundaryPoints(Range.END_TO_END, range) <= 0
            )
            return position == -1 ? undefined : position
        },

        scrollTo(target: CustomHighlight | string) {
            for (const [highlight, range] of found)
                if (highlight === target || (typeof target == 'string' && highlight._id == target)) {
                    range.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    return
                }
        },

        refresh: render
    }
}