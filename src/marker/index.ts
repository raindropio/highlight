import * as modern from './modern'
import * as legacy from './legacy'
import throttle from 'lodash-es/throttle'
import type { RaindropHighlight } from '@/types'

function _apply(highlights: RaindropHighlight[]) {
    if (modern.isSupported)
        return modern.apply(highlights)
    return legacy.apply(highlights)
}
const _applyThrottled = throttle(_apply, 500)

export function apply(highlights: RaindropHighlight[]) {
    if (highlights.length)
        return _applyThrottled(highlights)
    return _apply(highlights)
}

export function scrollToId(highlightId: string) {
    if (modern.isSupported)
        return modern.scrollToId(highlightId)
    return legacy.scrollToId(highlightId)
}

function aim(range: Range) {
    if (modern.isSupported)
        return modern.aim(range)
    return legacy.aim(range)
}

export function getSelected() {
    const range = (()=>{
        const selection = document.getSelection()
        if (!selection?.rangeCount) return null
        return selection.getRangeAt(0)
    })()

    //maybe user clicked or selected existing highlight?            
    if (range) {
        const overlapped = aim(range)
        if (overlapped)
            return { range, id: overlapped }
    }

    //set text selection
    if (range && !range.collapsed && range.toString().trim())
        return { range }
    else
        return
}

export function rangeToText(range?: Range) {
    if (!range)
        return ''

    var div: HTMLDivElement|undefined = document.createElement('div')
    div.appendChild( range.cloneContents().cloneNode(true) )
    document.body.appendChild(div)
    
    const text = div.innerText

    document.body.removeChild(div)
    div = undefined

    return text
}