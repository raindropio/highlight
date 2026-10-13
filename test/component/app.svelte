<script lang='ts'>
    import { createMarker, createSelection, Toolbar, Editor, Navigation, MobileZoomLevel, type CustomHighlight } from 'highlight'

    let article = $state<HTMLElement>()

    let enabled = $state(true)
    let nav = $state(true)
    let pro = $state(true)
    let hideNewToolbar = $state(false)

    let highlights = $state<CustomHighlight[]>([
        { _id: '6214905ad0d91c0031e361b6', text: 'CSS', color: 'red', position: 2 },
        { _id: '6214906fd0d91c0031e361b7', text: "A Map's keys can be any value (including functions, objects, or any primitive)", note: 'sdfsdsdf' },
        { _id: '62149205d0d91c0031e361b8', text: 'The Map object holds key-value pairs and remembers the original insertion order of the keys.', color: 'yellow' },
        { _id: '62149205d0d91c0031e311b1', text: 'İki' },
        { _id: '62149205d0d91c0031e311b9', text: 'Map', color: 'blue' }
    ])
    let draft = $state<CustomHighlight>()

    //the list is ours: the ui only hands us what to save
    const marker = createMarker(()=>enabled ? article : undefined, ()=>highlights)
    const selection = createSelection(marker)

    function save(item: CustomHighlight) {
        if (item._id == undefined)
            highlights.push({ ...item, _id: String(Date.now()) })
        else
            highlights[highlights.findIndex(h=>h._id == item._id)] = item
        selection.clear()
    }

    function remove(item: CustomHighlight) {
        highlights = highlights.filter(h=>h._id != item._id)
        selection.clear()
    }

    function note(item: CustomHighlight) {
        draft = item
        selection.clear()
    }
</script>

<header>
    <b>Map</b> is outside the article: it must stay unhighlighted and selecting it must not open the toolbar

    <nav>
        <!-- mousedown on a button would collapse the selection the action is for -->
        <button onclick={()=>marker.scrollTo(highlights.at(-1)!)}>Scroll to last</button>
        <button onmousedown={e=>e.preventDefault()} onclick={()=>selection.current && save(selection.current.highlight)}>Add selected</button>
        <button onmousedown={e=>e.preventDefault()} onclick={()=>selection.current && note({ ...selection.current.highlight })}>Note selected</button>
        <label><input type="checkbox" bind:checked={enabled} /> enabled</label>
        <label><input type="checkbox" bind:checked={nav} /> nav</label>
        <label><input type="checkbox" bind:checked={pro} /> pro</label>
        <label><input type="checkbox" bind:checked={hideNewToolbar} /> hide new toolbar</label>
    </nav>
</header>

<main>
    <article bind:this={article}>
        <h1>12 Modern CSS One-Line Upgrades | Modern CSS Sometimes</h1>
        <p>Sometimes, improving your application CSS just takes a one-line upgrade or enhancement! Learn about 12 properties to start incorporating into your projects, and enjoy reducing technical debt, removing JavaScript, and scoring easy wins for user experience.</p>

        <!-- WebKit: bare text next to a block sibling ends up in an anonymous block, the highlight is registered but never painted -->
        <section><span style="display:block">block sibling</span>Bare text in an anonymous block<br><br><div>Same text in a real block paints fine</div></section>

        <h2>Map</h2>
        <p>The <strong><code>Map</code></strong> object holds <a href="/">key-value</a> pairs and remembers the original insertion order of the keys. Any value (both objects and <a href="/">primitive values</a>) may be used as either a key or a value.</p>

        <textarea>Something here</textarea>

        <p lang="tr">İki değişkenin bir çokludoğrusal haritası bir çiftdoğrusal haritadır. Daha genel bir ifade ile, k değişkeninin bir çokludoğrusal haritası k-doğrusal harita olarak adlandırılır.</p>

        <div contenteditable="true">Map blabla<b>aa</b></div>

        <p>One thing that comes up often is how they relate to scrollbars. For example, if an element is sized to 100vw and stretches edge-to-edge, that’s fine so long as the page doesn’t have a vertical scrollbar. If it does have a vertical scrollbar, then 100vw is too wide, and the presence of that vertical scrollbar triggers a horizontal scrollbar because viewport units don’t have an elegant/optional way of handling that.</p>

        <p style="text-transform: uppercase;">Another scenario involves mobile browsers. You might use viewport units to help you position a fixed footer along the bottom of the screen. But then browser chrome might come up (e.g. navigation, keyboard, etc), and it may cover the footer, because the mobile browser doesn’t consider anything changed about the viewport size.</p>

        <h3>Key equality</h3>
        <ul>
            <li>Key equality is based on the SameValueZero algorithm.</li>
            <li>A Map's keys can be any value (including functions, objects, or any primitive).</li>
        </ul>

        <p>It would be better to get some real cross-browser solution for this someday, but I don’t see any issues using this as an improvement. It’s weird to use a vendor-prefixed property as a progressive enhancement, but hey, the world is weird.</p>
        <p>It would be better to get some real cross-browser solution for this someday, but I don’t see any issues using this as an improvement. It’s weird to use a vendor-prefixed property as a progressive enhancement, but hey, the world is weird.</p>
    </article>

    <aside>
        <pre>{JSON.stringify(highlights, null, 2)}</pre>
    </aside>
</main>

{#if enabled}
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
{/if}

<style>
    :global(body) {
        margin: 0;
        font-family: system-ui, sans-serif;
    }

    header {
        padding: 1em;
        border-bottom: 1px solid color-mix(in srgb, currentColor 20%, transparent);
    }

    nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: .5em 1em;
        margin-top: .5em;
    }

    main {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 2em;
        padding: 1em;
    }

    article {
        max-width: 70ch;
        line-height: 1.5;
    }

    aside pre {
        position: sticky;
        top: 1em;
        font-size: 12px;
        white-space: pre-wrap;
    }
</style>