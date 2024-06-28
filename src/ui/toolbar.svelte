<script lang="ts">
    import type { Store } from '@/store.svelte'
    import { colors } from '@/config'
    import type { RaindropHighlight } from '@/types'
    import throttle from '@/modules/throttle'
    import { getCurrentRange, resetCurrentRange } from '@/marker'
    import isMobile from '@/modules/is-mobile'

    //properties
    let { store } : { store: Store } = $props()

    //state
    let dialogRef: HTMLDialogElement
    let highlight: RaindropHighlight|undefined = $state(undefined)
    let wait = $state(false)

    //internal
    function onDialogClose(e: Event & { currentTarget: HTMLDialogElement }) {
        if (!highlight) return

        const value = e.currentTarget.returnValue
        e.currentTarget.returnValue = ''

        switch (value) {
            case 'add':
                store.upsert(highlight)
                resetCurrentRange()
            break

            case 'note':
                store.setDraft(highlight)
                resetCurrentRange()
            break

            case 'remove':
                store.remove(highlight)
                resetCurrentRange()
            break

            default:
                if (colors.has(value)) {
                    store.upsert({ ...highlight, color: value })
                    resetCurrentRange()
                    return
                }
            break
        }
    }

    //reset selection
    function onMouseDown() {
        wait = true
    }

    function onMouseUp() {
        wait = false
        setTimeout(onSelectionChange)
    }

    function onSelectionChange() {
        if (wait) {
            dialogRef?.close()
            return
        }

        requestAnimationFrame(() => {
            const range = getCurrentRange()
            const temp = range && store.find(range)

            //clicked nowhere
            if (!range || !temp?._id && !range.toString().trim()) {
                dialogRef?.close()
                return
            }

            highlight = temp

            dialogRef.inert = true
            dialogRef?.show()
            dialogRef.inert = false

            const popupW = 256
            const gap = 10

            const sp = range.getBoundingClientRect()
            const l = Math.min(Math.max(sp.x, gap) + window.scrollX, window.innerWidth + window.scrollX - popupW - gap)
            const r = Math.min(window.innerWidth - Math.max(sp.x, gap) - window.scrollX - sp.width, window.innerWidth - window.scrollX - popupW - gap)
            const t = Math.max(sp.y, 40) + window.scrollY + sp.height + 4
            const b = window.innerHeight - Math.max(sp.y, 40) - window.scrollY + 4
            const leftSide = l < (window.innerWidth/2 + window.scrollX)
            const upSide = t < (window.innerHeight/2 + window.scrollY)

            dialogRef?.style.setProperty('left', leftSide ? `${l}px` : 'unset')
            dialogRef?.style.setProperty('right', leftSide ? 'unset' : `${r}px`)
            dialogRef?.style.setProperty('top', upSide ? `${t}px` : 'unset')
            dialogRef?.style.setProperty('bottom', upSide ? 'unset' : `${b}px`)
        })
    }

    //get selected range or clicked highlight
    const onSelectionChangeThrottled = throttle(onSelectionChange, 200)
</script>

<svelte:document 
    onmousedown={onMouseDown}
    ontouchstart={onMouseDown}
    onmouseup={onMouseUp}
    ontouchend={onMouseUp}
    ontouchcancel={onMouseUp}
    onselectionchange={onSelectionChangeThrottled} />

<dialog
    bind:this={dialogRef}
    class:new={!highlight?._id}
    class:mobile={isMobile()}
    onclose={onDialogClose}>
    <form method="dialog">
        {#each colors as [value, col](value)}
            <button type="submit" {value}>
                <span
                    class="color"
                    class:active={value == highlight?.color} 
                    style="--color: {col}">
                </span>
            </button>
        {/each}

        <button type="submit" value="note" title="Add note">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                <g>
                    <path fill={highlight?.note ? "currentColor" : "none"} stroke-width={highlight?.note ? "0" : undefined} stroke-linecap="round" stroke-linejoin="round" d="M9,1.75C4.996,1.75,1.75,4.996,1.75,9c0,1.319,.358,2.552,.973,3.617,.43,.806-.053,2.712-.973,3.633,1.25,.068,2.897-.497,3.633-.973,.489,.282,1.264,.656,2.279,.848,.433,.082,.881,.125,1.338,.125,4.004,0,7.25-3.246,7.25-7.25S13.004,1.75,9,1.75Z"></path>
                    <path fill={highlight?.note ? "none" : "currentColor"} stroke-width="0" d="M9,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"></path>
                    <path fill={highlight?.note ? "none" : "currentColor"} stroke-width="0" d="M5.5,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"></path>
                    <path fill={highlight?.note ? "none" : "currentColor"} stroke-width="0" d="M12.5,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"></path>
                </g>
            </svg>
        </button>

        {#if highlight?._id}
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

    dialog.mobile {
        --control-size: 26px;
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
        color: var(--control-fg-light);

        @supports(color: light-dark(white,black)) {
            background: light-dark(var(--bg-light), var(--bg-dark));
            color: light-dark(var(--control-fg-light), var(--control-fg-dark));
        }
    }    

    dialog.mobile.new {
        position: fixed;
        top: auto !important;
        left: auto !important;
        right: 16px !important;
        bottom: 16px !important;
        margin-right: env(safe-area-inset-right);
        margin-bottom: env(safe-area-inset-bottom);
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

            @supports(color: light-dark(white,black)) {
                background: light-dark(var(--hover-bg-light), var(--hover-bg-dark));
            }
        }
    }

    button:active {
        transition: none;
        background: var(--active-bg-light);

        @supports(color: light-dark(white,black)) {
            background: light-dark(var(--active-bg-light), var(--active-bg-dark));
        }
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