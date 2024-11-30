import * as modern from './modern'
import * as legacy from './legacy'
import findTextRanges from './find-text-ranges'
import type { RaindropHighlight } from '@/types'

//Rendering
function _apply(highlights: RaindropHighlight[]) {
    if (modern.isSupported)
        return modern.apply(highlights)
    return legacy.apply(highlights)
}

export function apply(highlights: RaindropHighlight[]) {
    return _apply(highlights)
}

export function cleanup() {
    if (modern.isSupported)
        return modern.cleanup()
    return legacy.cleanup()
}

//Helpers
export function scrollToId(highlightId: string) {
    if (modern.isSupported)
        return modern.scrollToId(highlightId)
    return legacy.scrollToId(highlightId)
}

//Ranges
export function getCurrentRange(): Range | undefined {
    const selection = document.getSelection()
    if (!selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    //ignore contenteditable elements
    if (
        (range?.commonAncestorContainer?.nodeType == 1 ? range?.commonAncestorContainer as HTMLElement : range?.commonAncestorContainer?.parentElement)
            ?.closest('[contenteditable=""], [contenteditable=true]')
    ) return
    return range
}

export function resetCurrentRange() {
    const selection = document.getSelection()
    if (!selection?.rangeCount) return
    selection.removeAllRanges()
}

export function aim(range: Range): RaindropHighlight['_id']|undefined {
    if (modern.isSupported)
        return modern.aim(range)
    return legacy.aim(range)
}

export function rangeToText(range?: Range) {
    if (!range)
        return ''

    var div: HTMLDivElement|undefined = document.createElement('div')
    div.appendChild( range.cloneContents().cloneNode(true) )
    //svg specific
    div.querySelectorAll('tspan').forEach(e=>e.outerHTML=`<span>${e.innerHTML}</span>`)
    div.querySelectorAll('text').forEach(e=>e.outerHTML=`<div>${e.innerHTML}</div>`)
    document.body.appendChild(div)
    
    const text = div.innerText

    document.body.removeChild(div)
    div = undefined

    return text
}

export function rangeIndex(range?: Range) {
    if (!range) return
    const text = rangeToText(range)
    if (!text) return

    const [ranges] = findTextRanges([text])
    const index = ranges.findIndex(r=>{
        const ss = r.compareBoundaryPoints(Range.START_TO_START, range)
        const ee = r.compareBoundaryPoints(Range.END_TO_END, range)
        return ((ss==0 && ee==0) || (range?.collapsed && ss >= 0 && ee <= 0))
    })
    return index == -1 ? undefined : index
}