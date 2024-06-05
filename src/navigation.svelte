<script lang="ts">
    import type { Store } from '@/store.svelte'
    import { colors } from '@/config'

    //properties
    let { store } : { store: Store } = $props()

    const onClick = (e: MouseEvent)=>{
        if (!store.nav) return
        const id = (e.target as HTMLElement).getAttribute('data-highlight')
        if (!id) return
        e.preventDefault()
        store.scrollToId = id
    }
</script>

<svelte:document onclick={onClick} />

{#if store.nav}
    {#each store.highlights as highlight(highlight._id)}
        <div 
            data-highlight={highlight._id}
            style="top: var(--highlight-{highlight._id}-top); --color: {colors.get(highlight.color) || highlight.color}"
            ></div>
    {/each}
{/if}

<style>
    div {
        position: fixed;
        right: 0;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        cursor: pointer;
        background: transparent;
        z-index: 99999999999999;
    }

    div::before {
        content: '';
        display: block;
        height: 3px;
        border-radius: 3px;
        width: 100%;
        background: var(--color);
    }
</style>