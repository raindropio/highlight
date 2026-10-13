import type { CustomHighlight } from '../types'
import type { Marker } from './marker.svelte'
import throttle from '../modules/throttle'

export type Selection = {
    //snapshot: the live selection may be gone by the time an action runs
    range: Range
    //viewport coordinates
    rect: DOMRect
    //the object from your list under the selection, or (no _id) a new { text, position }
    //from the selected text; its position is resolved on first read, that is a full scan of root
    highlight: CustomHighlight
}

export type SelectionStore = ReturnType<typeof createSelection>

function rangeIn(root: Element | null | undefined) {
    if (!root) return
    const selection = document.getSelection()
    if (!selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    if (!root.contains(range.commonAncestorContainer)) return
    const element = range.commonAncestorContainer.nodeType == Node.ELEMENT_NODE ?
        range.commonAncestorContainer as HTMLElement :
        range.commonAncestorContainer.parentElement
    if (element?.closest('[contenteditable=""], [contenteditable=true]')) return
    return range
}

//create during component init: listeners go away with the component
export function createSelection(marker: Marker) {
    let current = $state.raw<Selection | undefined>()
    //pointer is down: the selection is still being made
    let wait = false

    function update() {
        if (wait) {
            current = undefined
            return
        }

        requestAnimationFrame(()=>{
            const range = rangeIn(marker.root)
            if (!range) {
                current = undefined
                return
            }

            const snapshot = range.cloneRange()
            let highlight = marker.at(range)

            if (!highlight) {
                const text = range.toString().trim() ? marker.textOf(range).trim() : ''
                if (!text) {
                    current = undefined
                    return
                }

                let resolved: { position?: number } | undefined
                highlight = {
                    text,
                    get position() {
                        return (resolved ??= { position: marker.positionOf(snapshot) }).position
                    }
                }
            }

            current = {
                range: snapshot,
                rect: range.getBoundingClientRect(),
                highlight
            }
        })
    }

    const onSelectionChange = throttle(update, 200)
    const onPointerDown = ()=>{ wait = true }
    const onPointerUp = ()=>{
        wait = false
        setTimeout(update)
    }

    $effect(()=>{
        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('touchstart', onPointerDown, { passive: true })
        document.addEventListener('mouseup', onPointerUp)
        document.addEventListener('touchend', onPointerUp, { passive: true })
        document.addEventListener('touchcancel', onPointerUp, { passive: true })
        document.addEventListener('selectionchange', onSelectionChange)
        return ()=>{
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('touchstart', onPointerDown)
            document.removeEventListener('mouseup', onPointerUp)
            document.removeEventListener('touchend', onPointerUp)
            document.removeEventListener('touchcancel', onPointerUp)
            document.removeEventListener('selectionchange', onSelectionChange)
        }
    })

    return {
        get current() { return current },

        clear() {
            const selection = document.getSelection()
            if (selection?.rangeCount) selection.removeAllRanges()
            current = undefined
        }
    }
}