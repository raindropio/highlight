<svelte:options customElement="rdh-app" />

<script lang='ts'>
    import type { CustomHighlight } from '../types'
    import { createMarker, sweep } from '../ui/marker.svelte'
    import { createSelection } from '../ui/selection.svelte'
    import Toolbar from '../ui/toolbar.svelte'
    import Editor from '../ui/editor.svelte'
    import Navigation from '../ui/navigation.svelte'
    import MobileZoomLevel from '../ui/mobile-zoom-level.svelte'

    let { highlights = [], pro = false, nav = false, hideNewToolbar = false, onadd, onupdate, onremove } : {
        highlights?: CustomHighlight[]
        pro?: boolean
        nav?: boolean
        hideNewToolbar?: boolean
        onadd?: (highlight: CustomHighlight)=>void
        onupdate?: (highlight: CustomHighlight)=>void
        onremove?: (highlight: Pick<CustomHighlight, '_id'>)=>void
    } = $props()

    //a previous script copy can survive re-injection after an extension reload
    sweep()

    const marker = createMarker(()=>document.body, ()=>highlights)
    const selection = createSelection(marker)
    let draft = $state<CustomHighlight>()

    //local-first: a new highlight stays in the list under a temporary _id until the host
    //echoes the real list back; the host never sees it, so changes to a pending one stay local
    let seq = 0
    const pending = (_id?: string)=>!!_id?.startsWith('local-')

    function save(highlight: CustomHighlight) {
        //plain copy: resolves the lazy position of a new one; hosts decode payloads strictly (ios), so no undefined keys
        const item = Object.fromEntries(Object.entries(highlight).filter(([, value])=>value !== undefined)) as CustomHighlight
        if (!item.color) item.color = 'yellow'

        if (item._id == undefined) {
            highlights = [...highlights, { ...item, _id: `local-${++seq}` }]
            onadd?.(item)
        } else {
            highlights = highlights.map(h=>h._id == item._id ? item : h)
            if (!pending(item._id)) onupdate?.(item)
        }
        selection.clear()
    }

    function remove({ _id }: CustomHighlight) {
        highlights = highlights.filter(h=>h._id != _id)
        if (!pending(_id)) onremove?.({ _id })
        selection.clear()
    }

    function note(item: CustomHighlight) {
        draft = item
        selection.clear()
    }

    //element methods; scrollTo shadows the native one, nothing scrolls the element itself
    export function scrollTo(_id: string) {
        marker.scrollTo(_id)
    }

    export function addSelection(fields?: CustomHighlight) {
        if (selection.current) save({ ...selection.current.highlight, ...fields })
    }

    export function noteSelection() {
        if (selection.current) note({ ...selection.current.highlight })
    }

    //a page we don't control: content keeps arriving after load and navigation swaps it,
    //so re-scan on load/popstate and once more a while later
    let loadTimeout: ReturnType<typeof setTimeout> | undefined
    function scheduleRefresh() {
        clearTimeout(loadTimeout)
        loadTimeout = setTimeout(marker.refresh, 3000)
    }

    function onWindowLoad() {
        marker.refresh()
        scheduleRefresh()
    }

    $effect(()=>{
        //already loaded at mount: 'load' will never fire and the marker just rendered
        if (document.readyState == 'complete') scheduleRefresh()
        return ()=>clearTimeout(loadTimeout)
    })
</script>

<svelte:window
    onload={onWindowLoad}
    onpopstate={onWindowLoad} />

<MobileZoomLevel>
    <Toolbar
        {selection}
        {hideNewToolbar}
        oncolor={(s, color)=>save({ ...s.highlight, color })}
        onnote={s=>note({ ...s.highlight })}
        onremove={s=>remove(s.highlight)} />

    <Editor
        bind:draft
        {pro}
        onsubmit={()=>{
            if (draft) save({ ...draft })
            draft = undefined
        }}
        oncancel={()=>draft = undefined} />
    
    {#if nav}
        <Navigation {marker} />
    {/if}
</MobileZoomLevel>