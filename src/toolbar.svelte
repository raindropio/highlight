<script lang="ts">
    import type { Store } from '@/store.svelte'
    import { colors } from '@/config'
    import type { RaindropHighlight } from './types'

    //properties
    let { store } : { store: Store } = $props()

    //state
    let dialogRef: HTMLDialogElement
    let temp: RaindropHighlight|undefined = $state(undefined)

    //internal
    function onDialogClose(e: Event & { currentTarget: HTMLDialogElement }) {
        const value = e.currentTarget.returnValue
        e.currentTarget.returnValue = ''

        switch (value) {
            case 'add':
                store.addSelected()
            break

            case 'note':
                store.draftSelected()
            break

            case 'remove':
                store.removeSelected()
            break

            default:
                if (colors.has(value)) {
                    store.colorSelected(value)
                    return
                }

                store.unselect()
            break
        }
    }

    $effect(() => {
        if (store.selected){
            temp = store.selected.highlight

            dialogRef.inert = true
            dialogRef?.show()
            dialogRef.inert = false

            const sp = store.selected.range.getBoundingClientRect()
            const l = Math.max(sp.x, 10) + window.scrollX
            const r = window.innerWidth - Math.max(sp.x, 10) - window.scrollX - sp.width
            const t = Math.max(sp.y, 40) + window.scrollY + sp.height + 4
            const b = window.innerHeight - Math.max(sp.y, 40) - window.scrollY + 4
            const leftSide = l < (window.innerWidth/2 + window.scrollX)
            const upSide = t < (window.innerHeight/2 + window.scrollY)

            dialogRef?.style.setProperty('left', leftSide ? `${l}px` : 'unset')
            dialogRef?.style.setProperty('right', leftSide ? 'unset' : `${r}px`)
            dialogRef?.style.setProperty('top', upSide ? `${t}px` : 'unset')
            dialogRef?.style.setProperty('bottom', upSide ? 'unset' : `${b}px`)
        }
        else
            dialogRef?.close()
    })
</script>

<dialog
    bind:this={dialogRef}
    class:new={!temp?._id}
    onclose={onDialogClose}>
    <form method="dialog">
        {#if temp?._id}
            {#each colors as [value, col](value)}
                <button type="submit" {value}>
                    <span
                        class="color"
                        class:active={value == temp.color} 
                        style="--color: {col}">
                    </span>
                </button>
            {/each}
        {:else}
            <button type="submit" value="add" title="Create highlight">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                    <g><path d="M12.974,8.731c-.474,3.691-3.724,4.113-6.974,3.519" fill="none" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2.75,15.25S4.062,3.729,15.25,2.75c-.56,.976-.573,2.605-.946,4.239-.524,2.011-2.335,2.261-4.554,2.261" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></g>
                </svg>
            </button>
        {/if}

        <button type="submit" value="note" title="Add note">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                <g>
                    <path fill={temp?.note ? "currentColor" : "none"} stroke-width={temp?.note ? "0" : undefined} stroke-linecap="round" stroke-linejoin="round" d="M9,1.75C4.996,1.75,1.75,4.996,1.75,9c0,1.319,.358,2.552,.973,3.617,.43,.806-.053,2.712-.973,3.633,1.25,.068,2.897-.497,3.633-.973,.489,.282,1.264,.656,2.279,.848,.433,.082,.881,.125,1.338,.125,4.004,0,7.25-3.246,7.25-7.25S13.004,1.75,9,1.75Z"></path>
                    <path fill={temp?.note ? "none" : "currentColor"} stroke-width="0" d="M9,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"></path>
                    <path fill={temp?.note ? "none" : "currentColor"} stroke-width="0" d="M5.5,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"></path>
                    <path fill={temp?.note ? "none" : "currentColor"} stroke-width="0" d="M12.5,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"></path>
                </g>
            </svg>
        </button>

        {#if temp?._id}
            <button type="submit" value="remove" title="Delete highlight">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                    <g><line x1="2.75" y1="4.25" x2="15.25" y2="4.25" fill="none" stroke-linecap="round" stroke-linejoin="round"></line><path d="M6.75,4.25v-1.5c0-.552,.448-1,1-1h2.5c.552,0,1,.448,1,1v1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"></path><path d="M13.5,6.75l-.4,7.605c-.056,1.062-.934,1.895-1.997,1.895H6.898c-1.064,0-1.941-.833-1.997-1.895l-.4-7.605" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></g>
                </svg>
            </button>
        {/if}
    </form>
</dialog>

<style>
    * {
        user-select: none;
        -webkit-user-select: none;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
    }

    dialog {
        --control-size: 16px;
        --padding-s: 6px;
        --padding-m: 8px;

        --bg-light: rgb(255, 255, 255);
        --bg-dark: rgb(60, 60, 60);
        --control-fg-light: rgb(65, 65, 65);
        --control-fg-dark: rgb(230, 230, 230);
        --hover-bg-light: rgba(0,0,0,.07);
        --hover-bg-dark: rgba(255,255,255,.1);
        --active-bg-light: rgba(0,0,0,.13);
        --active-bg-dark: rgba(255,255,255,.2);
    }

    @supports (background-color: -apple-system-control-background) {
        dialog {
            --bg-light: rgba(255, 255, 255, .8);
            --bg-dark: rgba(60, 60, 60, .8);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
    }

    @media (pointer: coarse) {
        dialog {
            --control-size: 26px;
        }
    }

    dialog {
        position: absolute;
        left: unset;
        top: unset;
        right: unset;
        bottom: unset;
        border: none;
        padding: 2px;
        border-radius: var(--control-size);
        overflow: clip;
        z-index: 999999999999999;

        background: var(--bg-light);
        background: light-dark(var(--bg-light), var(--bg-dark));
        color: var(--control-fg-light);
        color: light-dark(var(--control-fg-light), var(--control-fg-dark));
    }

    @media (pointer: coarse) {
        dialog.new {
            position: fixed;
            top: auto !important;
            left: auto !important;
            right: 16px !important;
            bottom: 16px !important;
            margin-right: env(safe-area-inset-right);
            margin-bottom: env(safe-area-inset-bottom);
        }
    }

    [open] {
        box-shadow: 0 0 0 .5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.05), 0 15px 40px rgba(0,0,0,.1);
    }

    form {
        display: flex;
        margin: 0;
        padding: 0;
    }

    button {
        border-radius: 8px;
        border: 0;
        background: transparent;
        cursor: pointer;
        appearance: none;
        touch-action: manipulation;
        width: calc(var(--control-size) + var(--padding-m)*2);
        height: calc(var(--control-size) + var(--padding-s)*2);
        padding: var(--padding-s) var(--padding-m);
        color: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .15s ease-in-out;
    }

    button:first-child {
        border-top-left-radius: var(--control-size);
        border-bottom-left-radius: var(--control-size);
    }

    button:last-child {
        border-top-right-radius: var(--control-size);
        border-bottom-right-radius: var(--control-size);
    }

    @media (pointer: fine) {
        button:hover {
            background: var(--hover-bg-light);
            background: light-dark(var(--hover-bg-light), var(--hover-bg-dark));
        }
    }

    button:active {
        transition: none;
        background: var(--active-bg-light);
        background: light-dark(var(--active-bg-light), var(--active-bg-dark));
    }

    svg {
        stroke: currentColor;
        stroke-width: 1.5px;
    }

    .color {
        pointer-events: none;
        content: '';
        display: block;
        width: 12px;
        height: 12px;
        box-shadow: inset 0 0 0 6px var(--color);
        transition: width .15s ease-in-out, height .15s ease-in-out;
        border-radius: 50%;
    }

    .color.active {
        width: 16px;
        height: 16px;
        box-shadow: inset 0 0 0 6px var(--color)
    }

    /* animation */
    dialog {
        transition: 
            display .25s allow-discrete ease-in-out, 
            overlay .25s allow-discrete ease-in-out, 
            box-shadow .25s allow-discrete ease-in-out, 
            transform .25s allow-discrete ease-in-out,
            opacity .25s ease-in-out;
        opacity: 0;
        transform: translateY(3px);
    }

    [open] {
        opacity: 1;
        transform: translateY(0);
    }

    dialog:not([open]) {
        transition-duration: .2s;
        pointer-events: none;
    }

    @starting-style {
        [open] {
            opacity: 0;
            transform: translateY(-3px);
        }
    }
</style>