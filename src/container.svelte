<svelte:options customElement="rdh-container" />

<script lang="ts">
    import type { Store } from '@/store.svelte'
    import Marker from '@/marker/index.svelte'
    import Toolbar from '@/toolbar.svelte'
    import Modal from '@/modal.svelte'
    import Navigation from '@/navigation.svelte';

    let { store } : { store: Store } = $props()
</script>

<Marker {store} />
<Toolbar {store} />
<Modal {store} />
<Navigation {store} />