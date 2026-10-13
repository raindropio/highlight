# Highlight

Finds saved highlights in a page, marks them with the CSS Custom Highlight API and lets the user add, recolor, annotate and remove them with an inline toolbar. Without the API nothing is rendered.

Two ways to use it:
- **Svelte primitives + ui components** (`src/ui`): you own the list of highlights and compose what you need, with the built-in ui or your own.
- **Embed bundle** (`src/embed` → `dist/highlight.js`): a ready assembly of the same parts for injection into third-party pages (web extension, iframe, electron, wkwebview, react native), driven over messages.

## Svelte

The list is yours and is never mutated: the ui only hands you what to save. Every item needs an `_id`, one marker per root.

```svelte
<script lang='ts'>
    import { createMarker, createSelection, Toolbar, Editor, Navigation, MobileZoomLevel, type CustomHighlight } from 'highlight'

    let article = $state<HTMLElement>()
    let highlights = $state<CustomHighlight[]>([])
    let draft = $state<CustomHighlight>()

    const marker = createMarker(()=>article, ()=>highlights)
    const selection = createSelection(marker)

    function save(item: CustomHighlight) {
        if (item._id == undefined) highlights.push({ ...item, _id: crypto.randomUUID() })
        else highlights[highlights.findIndex(h=>h._id == item._id)] = item
        selection.clear()
    }
</script>

<article bind:this={article}>...</article>

<MobileZoomLevel>
    <Toolbar {selection}
        oncolor={(s, color)=>save({ ...s.highlight, color })}
        onnote={s=>{ draft = { ...s.highlight }; selection.clear() }}
        onremove={s=>{ highlights = highlights.filter(h=>h != s.highlight); selection.clear() }} />
    <Editor bind:draft pro onsubmit={()=>{ if (draft) save({ ...draft }); draft = undefined }} oncancel={()=>draft = undefined} />
    <Navigation {marker} />
</MobileZoomLevel>
```

#### Primitives
Create them during component init: they re-render and clean up with the component.

    createMarker(()=>root, ()=>highlights)
        .found                    rendered highlight → live Range, keyed by the objects from your list
        .rect(highlight)          viewport rect
        .at(range)                rendered highlight under a range
        .textOf(range)            text as the user sees it
        .positionOf(range)        occurrence index of the range text inside root (a full scan)
        .scrollTo(highlight|_id)
        .refresh()                re-scan, e.g. after root content changed

    createSelection(marker)
        .current                  { range, rect, highlight } or undefined
                                  range: snapshot of the user selection, rect: viewport coordinates
                                  highlight: the object from your list under the selection, or (no _id)
                                  a new { text, position } from the selected text (no color, yellow is the default);
                                  position is resolved on first read, it costs a full scan
        .clear()

    isSupported                   CSS Custom Highlight API available

#### Ui
Built on the primitives above; draw your own from `selection.current` and `marker.found` instead.

    Toolbar          { selection, hideNewToolbar?, oncolor?, onnote?, onremove? }   callbacks get the Selection
    Editor           { bind:draft, pro?, onsubmit, oncancel }   color + note dialog for a draft highlight; notes need pro
    Navigation       { marker }   minimap on the right edge, positions relative to document
    MobileZoomLevel  wrapper that counters pinch-zoom scale for the ui inside

Demo: `npm run test:component` (`test/component`)

## Embed bundle
```
npm run build
cd dist/
```

#### Subscribe to events
    - { type: 'RDH_READY', payload: { url } }                          Ready to receive incoming msgs
    - { type: 'RDH_ADD', payload: { text, color, position?, note? } }  Add new highlight; the host assigns _id and sends the list back with RDH_APPLY
    - { type: 'RDH_UPDATE', payload: { _id, text, color, ... } }       Update specific highlight, the full object with changes applied
    - { type: 'RDH_REMOVE', payload: { _id } }                         Remove specific highlight

#### Supported events
    - { type: 'RDH_CONFIG', payload: { enabled: true, nav: true, pro: true, hide_new_toolbar: false } }
    - { type: 'RDH_APPLY', payload: [...{ _id, text, color, note, position }] }
    - { type: 'RDH_SCROLL', payload: { _id } }
    - { type: 'RDH_ADD_SELECTION', payload?: { color, note } }   Save the current selection, payload fields applied
    - { type: 'RDH_NOTE_SELECTION' }                               Open the editor for the current selection

Unknown fields in payloads are dropped.

#### Use as an webextension inject script
Example in `test/webextension` folder

```js
    browser.runtime.onMessage.addListener(({ type, payload }, sender)=>{
        if (sender.id != browser.runtime.id || typeof type != 'string') return
    })

    browser.tabs.sendMessage(sender.tab.id, { type: 'some', payload: {} })
```

#### Iframe
Example in `test/iframe` folder

```js
    window.addEventListener('message', ({data, source}) => {
        if (typeof data != 'object' || typeof data.type != 'string') return
        const { type, payload } = data
    })

    iframe.postMessage({ type: 'some', payload: {} }, '*')
```

#### Use in electron
Example in `test/electron` folder

```js
    <webview src="..." preload="./highlight.js"></webview>

    webview.addEventListener('ipc-message', ({ channel, args=[] }) => {
        if (channel != 'RDH') return
        const [{ type, payload }] = args
    })

    webview.send('RDH', { type: 'some', payload: {} })
```

#### Use in React Native
```js
    <WebView 
        ref={ref}
        onMessage={({ nativeEvent })=>{
            const data = JSON.parse(nativeEvent.data)
            if (typeof data != 'object' || typeof data.type != 'string') return
            const { type, payload } = data
        }} />

    import js from './highlight.string.js'
    ref.current.injectJavaScript(`${js}; true`)

    ref.current.injectJavaScript(`window.ReactNativeWebViewSendMessage(${JSON.stringify({ type: 'some', payload: {} })}); true`)
```