import type { RaindropHighlight } from '@/types'
import { colors } from '@/config'
import findTextRanges from './find-text-ranges'

const cssprefix = `rh-${new Date().getTime()}`

export function apply(highlights: RaindropHighlight[]) {
    const existing = (document.body.querySelectorAll(`.${cssprefix}`) as NodeListOf<HTMLElement>)

    if (!highlights.length && !existing.length)
        return

    //reset
    existing.forEach(e=>e.outerHTML = e.innerText)

    //global style
    const cssRules = []

    //find text ranges
    const textsRanges = findTextRanges(highlights.map(({ text }) => text||''))

    //create css custom highlights
    for(const i in highlights) {
        const { _id, color } = highlights[i]

        for(const range of textsRanges[i]) {
            const mark = document.createElement('mark')
            mark.className = cssprefix
            mark.setAttribute('data-id', String(_id))
            // range.surroundContents(mark)
            mark.append(range.extractContents())
            range.insertNode(mark)
            range.detach()
        }

        cssRules.push(`
            .${cssprefix}[data-id="${_id}"] {
                all: unset;
                display: inline-block;
                background-color: ${convertHexToRgba(colors.get(color!) || color, .5)} !important;
            }
        `)
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
    (document.body.querySelectorAll(`.${cssprefix}`) as NodeListOf<HTMLElement>)
        .forEach(e=>e.outerHTML = e.innerText)
    document.getElementById(cssprefix)?.remove()
}

export function scrollToId(highlightId: string) {
    const mark = document.body.querySelector(`.${cssprefix}[data-id="${highlightId}"]`)
    if (!mark) return

    mark.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function aim(range: Range): RaindropHighlight['_id']|undefined {
    const element = range.commonAncestorContainer.nodeType == Node.ELEMENT_NODE ? 
        range.commonAncestorContainer as HTMLElement : 
        range.commonAncestorContainer.parentElement

    if (
        element?.className == cssprefix
    ) {
        if (!range.collapsed) {
            const test = new Range()
            test.selectNodeContents(range.commonAncestorContainer)
            const ss = range.compareBoundaryPoints(Range.START_TO_START, test)
            const ee = range.compareBoundaryPoints(Range.END_TO_END, test)
            test.detach()
            if (ss != 0 || ee != 0) return
        }

        return element.getAttribute('data-id') || undefined
    }

    return
}

function convertHexToRgba(hex?: string, opacity?: number) {
    if (!hex) return hex
    const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}