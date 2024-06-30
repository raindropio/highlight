<svelte:options customElement="rdh-ui" />

<script lang="ts">
    import type { Store } from '@/store.svelte'
    import { apply, cleanup } from '@/marker'
    import Toolbar from './toolbar.svelte'
    import Modal from './modal.svelte'
    import Navigation from './navigation.svelte'

    let { store } : { store: Store } = $props()

    //render highlights
    $effect(() => { apply(store.highlights) })

    //re-render when window is loaded/navigated
    let loadTimeout: number|undefined
    function onWindowLoad() {
        apply(store.highlights)
        clearTimeout(loadTimeout)
        loadTimeout = setTimeout(() => apply(store.highlights), 3000) as any as number
    }
    $effect.root(()=>{if (document.readyState) onWindowLoad()})

    //unmount
    $effect(()=>cleanup)
</script>

<svelte:window onload={onWindowLoad} onpopstate={onWindowLoad} />

<Toolbar {store} />
<Modal {store} />
<Navigation {store} />