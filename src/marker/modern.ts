import type { RaindropHighlight } from '@/types'
import { colors } from '@/config'
import findTextRanges from './find-text-ranges'

export const cssprefix = `rh-${new Date().getTime()}-`

export const isSupported = 'highlights' in CSS

export function apply(highlights: RaindropHighlight[]) {
    //@ts-ignore
    if (!highlights.length && !CSS.highlights.size)
        return

    //global style
    const cssRules = []

    //clear all css custom highlights
    //@ts-ignore
    CSS.highlights.clear()

    if (highlights.length) {
        //find text ranges
        const textsRanges = findTextRanges(
            highlights.map(({ text }) => text)
        )

        //create css custom highlights
        for(const i in highlights) {
            if (!textsRanges[i].length) continue

            const { _id, color } = highlights[i]
            const cssId = `${cssprefix}${_id}`

            //@ts-ignore
            CSS.highlights.set(cssId, new Highlight(...textsRanges[i]))

            const pos = textsRanges[i][0].getBoundingClientRect()

            cssRules.push(`
                ::highlight(${cssId}) {
                    all: unset;
                    background-color: color-mix(in srgb, ${colors.get(color) || color}, transparent 50%) !important;
                }

                :root {
                    --highlight-${_id}-top: ${(100/document.documentElement.scrollHeight * (window.scrollY + pos.top - 10)).toFixed(2)}%;
                }
            `)

            //free up memory
            for(const range of textsRanges[i])
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
    //@ts-ignore
    for(const [hid, highlight] of CSS.highlights){
        const id = hid.replace(cssprefix, '')
        if (highlightId != id) continue
        for(const range of highlight) {
            (range as Range).startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            break
        }
    }
}

export function aim(range: Range): RaindropHighlight['_id']|undefined {
    let overlapped

    //@ts-ignore
    for(const [hid, highlight] of CSS.highlights)
        for(const highlightRange of highlight) {
            const ss = range.compareBoundaryPoints(Range.START_TO_START, highlightRange)
            const ee = range.compareBoundaryPoints(Range.END_TO_END, highlightRange)
            if ((ss==0 && ee==0) || (range?.collapsed && ss >= 0 && ee <= 0))
                overlapped = [hid.replace(cssprefix, ''), highlightRange]
        }

    if (overlapped)
        return overlapped[0].replace(cssprefix, '')

    return
}