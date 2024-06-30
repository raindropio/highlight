<script lang="ts">
    import type { Store } from '@/store.svelte'
    import { colors } from '@/config'
    import isMobile from '@/modules/is-mobile'

    //properties
    let { store } : { store: Store } = $props()

    //state
    let dialogRef: HTMLDialogElement
    let submitButtonRef: HTMLButtonElement
    let compact = $state(true)

    $effect(() => {
        if (store.draft) {
            compact = true
            dialogRef?.showModal()
        }
        else
            dialogRef?.close()
    })

    //internal
    function onDialogClose(e: Event & { currentTarget: HTMLDialogElement }) {
        const value = e.currentTarget.returnValue
        e.currentTarget.returnValue = ''

        setTimeout(value ? store.draftSubmit : store.draftCancel, 200)
    }

    function onDialogMouseDown(e: MouseEvent & { currentTarget: HTMLDialogElement }) {
        const rect = e.currentTarget.getBoundingClientRect();
        if (!(rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX && e.clientX <= rect.left + rect.width)) {
            e.preventDefault()
            e.currentTarget.close()
        }
    }

    function onNoteKeyDown(e: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
        if (!isMobile()) {
            e.stopImmediatePropagation()
            e.stopPropagation()

            if (e.key == 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (submitButtonRef)
                    e.currentTarget.closest('form')?.requestSubmit(submitButtonRef)
            }
        }
    }
</script>

<!-- svelte-ignore a11y_autofocus -->

<dialog
    bind:this={dialogRef}
    class:mobile={isMobile()}
    role="presentation"
    onclose={onDialogClose}
    onmousedown={onDialogMouseDown}>
    <header>{store.draft?._id ? 'Edit' : 'New'} highlight</header>

    <form method="dialog">
        {#if store.draft}
            <blockquote 
                role="presentation"
                class:compact={compact}
                onclick={()=>compact = false}>
                {store.draft?.text?.trim() || ''}
            </blockquote>

            <fieldset class="color">
                {#each colors as [value, col]}
                    <input 
                        type="radio" 
                        name="color" 
                        bind:group={store.draft!.color}
                        {value}
                        style="--color: {col}" />
                {/each}
            </fieldset>

            <textarea
                class="note"
                autofocus
                rows="4"
                maxlength="5000"
                placeholder="Notes (optional)"
                disabled={!store.pro}
                bind:value={store.draft!.note}
                onkeydown={onNoteKeyDown}></textarea>

            {#if !store.pro}
                <div class="unlock">
                    <a href="https://raindrop.io/pro/buy" target="_blank">Upgrade to Pro</a> to unlock annotation
                </div>
            {/if}
        {/if}

        <footer>
            <button formnovalidate>
                Cancel <sup>esc</sup>
            </button>
            
            <button 
                bind:this={submitButtonRef} 
                type="submit" 
                value="OK">
                {store.draft?._id ? 'Update' : 'Create'} <sup>&crarr;</sup>
            </button>
        </footer>
    </form>
</dialog>

<style>
    * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
    }

    dialog {
        --bg-light: rgb(245, 245, 245);
        --bg-dark: rgb(35, 35, 35);
        --fg-light: black;
        --fg-dark: white;
        --control-bg-light: rgb(230, 230, 230);
        --control-bg-dark: rgb(55, 55, 55);

        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;
        font-size: 18px;
        line-height: 1.4;
        border: none;
        border-radius: .5em;
        padding: 0;
        overscroll-behavior: none;

        color: var(--fg-light);

        @supports(color: light-dark(white,black)) {
            color: light-dark(var(--fg-light), var(--fg-dark));
        }
    }

    dialog.mobile {
        left: 0;right: 0;bottom: 0;top: 0;
        width: 100%;
        margin: 0;
        max-width: 100%;
        max-height: 100%;
        border-radius: 0;
        bottom: auto;
    }

    dialog, header {
        background: var(--bg-light);

        @supports(color: light-dark(white,black)) {
            background: light-dark(var(--bg-light), var(--bg-dark));
        }
    }

    [open] {
        box-shadow: 0 0 0 .5px rgba(60, 60, 60, .9), 0 3px 10px rgba(0,0,0,.05), 0 7px 15px -3px rgba(0,0,0,.15);
    }

    ::backdrop {
        background-color: rgba(0,0,0,.3);
    }

    header {
        margin: 0;
        padding: 1em;
        font-weight: bold;
        position: sticky;
        top: 0;
    }

    @supports(animation-timeline: scroll()) {
        header {
            animation: header-scroll linear both;
            animation-timeline: scroll();
            animation-range: 0 1px;
        }
    }

    @keyframes header-scroll {
        to {
            box-shadow: 0 .5px 0 rgba(0,0,0,.2);
        }
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1em;
        padding: 1em;
        padding-top: 0;
    }

    .color {
        all: unset;
        display: flex;
        gap: .75em;
    }

    .color input[type="radio"] {
        cursor: pointer;
        appearance: none;
        user-select: none;
        -webkit-user-select: none;
        margin: 0;
        background: Canvas;
        box-shadow: inset 0 0 0 1em var(--color);
        transition: box-shadow .2s ease-in-out;
        width: 2em;
        height: 2em;
        border-radius: 50%;
    }

    .color input[type="radio"]:checked {
        box-shadow: inset 0 0 0 .5em var(--color);
    }

    .color input[type="radio"]:active {
        transform: translateY(1px);
    }

    blockquote, .note, button {
        background: var(--control-bg-light);

        @supports(color: light-dark(white,black)) {
            background: light-dark(var(--control-bg-light), var(--control-bg-dark));
        }
    }

    blockquote {
        white-space: pre-wrap;
        margin: 0;
        min-width: 100%;
        width: 0;
        font-size: 16px;
    }

    blockquote.compact {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        overflow: clip;
    }

    blockquote, .note {
        border-radius: .5em;
        padding: .5em .6em;
    }

    .note {
        min-width: min(21em, 70vw);
        min-height: 4lh;
        appearance: none;
        border: 0;
        font: inherit;
        color: inherit;
        display: block;
        scroll-margin-top: 100vh;
        transition: background .15s ease-in-out, box-shadow .15s ease-in-out;
    }

    .note:focus {
        background: transparent;
    }
    
    footer {
        all: unset;
        display: flex;
        justify-content: flex-end;
        gap: .75em;
    }

    button {
        appearance: none;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        border: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
        padding: .25em .75em;
        border-radius: .5em;
    }

    button:active {
        transform: translateY(1px);
    }

    button sup {
        margin-left: .25em;
        vertical-align: text-top;
        opacity: .5;
    }

    dialog.mobile button sup {
        display: none;
    }

    button[value] {
        background: blue;
        background: AccentColor;
        color: white;
    }

    .unlock {
        font-size: .75em;
        color: GrayText;
    }

    /* animation */
    dialog, ::backdrop {
        transition: 
            display .2s allow-discrete ease-in-out, 
            overlay .2s allow-discrete ease-in-out, 
            opacity .2s ease-in-out,
            transform .2s ease-in-out,
            box-shadow .2s ease-in-out;
        opacity: 0;
    }

    dialog {
        transform: translateY(1em);
    }

    [open],
    [open]::backdrop {
        opacity: 1;
        transform: translateY(0);
    }

    @starting-style {
        [open],
        [open]::backdrop {
            opacity: 0;
        }

        [open] {
            transform: translateY(-1em);
        }
    }

    @supports not selector(::highlight(a)) {
        dialog, dialog::backdrop {
            animation: simple-appear .2s forwards;
        }
        @keyframes simple-appear {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    }
</style>