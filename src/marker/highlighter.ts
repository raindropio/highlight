import * as modern from './modern'
import * as legacy from './legacy'
import throttle from 'lodash-es/throttle'
import type { RaindropHighlight } from '@/types'

export function apply(highlights: RaindropHighlight[]) {
    if (modern.isSupported)
        return modern.apply(highlights)

    return legacy.apply(highlights)
}

const applyThrottled = throttle(apply, 500)

export function smartApply(highlights: RaindropHighlight[]) {
    if (highlights.length)
        return applyThrottled(highlights)
    return apply(highlights)
}

export function scrollToId(highlightId: string) {
    if (modern.isSupported)
        return modern.scrollToId(highlightId)

    return legacy.scrollToId(highlightId)
}

export function aim(range: Range) {
    if (modern.isSupported)
        return modern.aim(range)
    
    return legacy.aim(range)
}