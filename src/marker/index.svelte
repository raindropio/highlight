<script lang="ts">
    import * as highlighter from './highlighter'
    import type { Store } from '@/store.svelte'
    import throttle from 'lodash-es/throttle'

    //properies
    let { store }: { store: Store } = $props()

    //state
    let wait = $state(false)

    //actions
    $effect(() => {
        //scroll to id
        if (store.scrollToId) {
            highlighter.scrollToId(store.scrollToId)
            store.scrollToId = undefined
        }
    })

    //apply highlights
    $effect(() => { highlighter.smartApply(store.highlights) })

    //apply highlights again
    let loadTimeout: number|undefined
    function onWindowLoad() {
        highlighter.smartApply(store.highlights)
        clearTimeout(loadTimeout)
        loadTimeout = setTimeout(() => highlighter.smartApply(store.highlights), 3000)
    }

    //reset selection
    function onMouseDown() {
        wait = true
    }

    function onMouseUp() {
        wait = false
        onSelectionChangeThrottled()
    }

    function onSelectionChange() {
        if (wait) {
            store.unselect()
            return
        }

        requestAnimationFrame(() => {
            const range = (()=>{
                const selection = document.getSelection()
                if (!selection?.rangeCount) return null
                return selection.getRangeAt(0)
            })()

            //maybe user clicked or selected existing highlight?            
            if (range) {
                const overlapped = highlighter.aim(range)
                if (overlapped) {
                    const highlight = store.highlights.find(h => h._id == overlapped)
                    if (highlight) {
                        store.select(range, highlight)
                        return
                    }
                }
            }

            //set text selection
            if (range && !range.collapsed && range.toString().trim())
                store.select(range)
            else
                store.unselect()
        })
    }

    //get selected range or clicked highlight
    const onSelectionChangeThrottled = throttle(onSelectionChange, 200, { leading: true, trailing: true })
</script>

<svelte:window
    onload={onWindowLoad}
    onpopstate={onWindowLoad} />

<svelte:document 
    onmousedown={onMouseDown}
    ontouchstart={onMouseDown}
    onmouseup={onMouseUp}
    ontouchend={onMouseUp}
    ontouchcancel={onMouseUp}
    onselectionchange={onSelectionChangeThrottled} />