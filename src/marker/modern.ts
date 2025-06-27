import type { RaindropHighlight } from '@/types'
import { colors } from '@/config'
import findTextRanges from './find-text-ranges'

export const cssprefix = `rh-${new Date().getTime()}-`

export const isSupported =
    'highlights' in CSS
    && !('InternalError' in window && 'browser' in window) // disable for Firefox web extension, buggy

export function apply(highlights: RaindropHighlight[]) {
    //@ts-ignore
    if (!highlights.length && !CSS.highlights.size)
        return

    //global style
    const cssRules = []

    //clear all css custom highlights
    CSS.highlights.clear()

    if (highlights.length) {
        //find text ranges
        const textsRanges = findTextRanges(
            highlights.map(({ text }) => text || '')
        )

        //create css custom highlights
        for(const i in highlights) {
            const ranges = textsRanges[i]
            if (!ranges.length) continue

            const { _id, color, note, position=0 } = highlights[i]
            const cssId = `${cssprefix}${_id}`
            const range = ranges?.[position] || ranges[0]

            CSS.highlights.set(cssId, new Highlight(range))

            const pos = range.getBoundingClientRect()

            cssRules.push(`
                ::highlight(${cssId}) {
                    all: unset;
                    background-color: color-mix(in srgb, ${colors.get(color!) || color || 'yellow'}, white 60%) !important;
                    color: color-mix(in srgb, ${colors.get(color!) || color || 'yellow'}, black 80%) !important;
                    ${note ? `text-decoration: underline wavy; -webkit-text-decoration: underline wavy;` : ''}
                    text-decoration-thickness: from-font;
                }

                /* fuck you dark reader */
                html[data-darkreader-scheme="dark"] ::highlight(${cssId}) {
                    color: CanvasText !important;
                }

                /* pdf render */
                .pdf ::highlight(${cssId}) {
                    background-color: color-mix(in srgb, ${colors.get(color!) || color || 'yellow'}, transparent 60%) !important;
                    color: transparent !important;
                }

                :root {
                    --highlight-${_id}-top: ${(100/document.documentElement.scrollHeight * (window.scrollY + pos.top - 10)).toFixed(2)}%;
                }
            `)

            //free up memory
            for(const range of ranges)
                range.detach()
        }
    }

    //apply global style
    const style = (()=>{
        let elem = document.getElementById(cssprefix)
        if (!elem) {
            elem = document.createElement('style')
            elem.id = cssprefix
            document.head.appendChild(elem)
        }
        return elem
    })()

    style.innerHTML = cssRules.join('\n')
}

export function cleanup() {
    document.getElementById(cssprefix)?.remove()
}

export function scrollToId(highlightId: string) {
    let found = false

    CSS.highlights.forEach((highlight, hid) => {
        if (found) return

        const id = hid.replace(cssprefix, '')
        if (highlightId != id) return
        
        for(const range of highlight) {
            (range as Range).startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            found = true
            break
        }
    })
}

export function aim(range: Range): RaindropHighlight['_id']|undefined {
    let overlapped: string|undefined

    CSS.highlights.forEach((highlight, hid) => {
        if (overlapped) return

        for(const highlightRange of highlight) {
            if (overlapped) return

            const ss = range.compareBoundaryPoints(Range.START_TO_START, highlightRange as Range)
            const ee = range.compareBoundaryPoints(Range.END_TO_END, highlightRange as Range)
            if ((ss==0 && ee==0) || (range?.collapsed && ss >= 0 && ee <= 0))
                overlapped = hid.replace(cssprefix, '')
        }
    })

    if (overlapped)
        return overlapped.replace(cssprefix, '')

    return
}