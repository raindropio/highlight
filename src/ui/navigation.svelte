<script lang="ts">
    import type { Store } from '@/store.svelte'
    import { colors } from '@/config'
    import { scrollToId } from '@/marker'

    //properties
    let { store } : { store: Store } = $props()

    const onClick = (e: MouseEvent)=>{
        const id = (e.target as HTMLElement).getAttribute('data-highlight')
        if (!id) return
        e.preventDefault()
        scrollToId(id)
    }
</script>

{#if store.nav}
<nav role="presentation" onclick={onClick}>
    {#each store.highlights as highlight(highlight._id)}
        <div
            data-highlight={highlight._id}
            style="top: var(--highlight-{highlight._id}-top); --color: {colors.get(highlight.color!) || highlight.color}"
            ></div>
    {/each}
</nav>
{/if}

<style>
    nav {
        all: unset;
    }
    
    div {
        position: fixed;
        right: 0;
        width: 24px;
        height: 20px;
        display: flex;
        justify-content: flex-end;
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
        width: 16px;
        background: var(--color);
        transition: width .15s ease-in-out;
    }

    div:hover::before {
        width: 100%;
    }
</style>