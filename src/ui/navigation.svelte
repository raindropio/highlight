<script lang='ts'>
    import type { Marker } from './marker.svelte'
    import { colors } from '../config'

    let { marker } : { marker: Marker } = $props()

    let resized = $state(0)
    const items = $derived.by(()=>{
        //re-run on resize
        resized
        const height = document.documentElement.scrollHeight
        return [...marker.found].map(([highlight, range])=>({
            highlight,
            top: (100 / height * (window.scrollY + range.getBoundingClientRect().top - 10)).toFixed(2),
            color: colors.get(highlight.color!) || highlight.color || colors.get('yellow')
        }))
    })

    const onClick = (e: MouseEvent)=>{
        const index = (e.target as HTMLElement).getAttribute('data-index')
        if (index == null) return
        e.preventDefault()
        marker.scrollTo(items[+index].highlight)
    }
</script>

<svelte:window onresize={()=>resized++} />

<nav role="presentation" onclick={onClick}>
    {#each items as { highlight, top, color }, index (highlight)}
        <div
            data-index={index}
            style="top: {top}%; --color: {color}"
            ></div>
    {/each}
</nav>

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