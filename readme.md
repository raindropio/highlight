# Highlight
Should be injected an Iframe or in Electron WebView

### Subscribe to events
    - { type: 'RDH_READY' }                                   Highlighter is ready to receive incoming msgs
    - { type: 'RDH_EDIT', payload: { _id } }                  Edit specific highlight
    - { type: 'RDH_ADD', payload: { text, color, note } }     Add new highlight

### Supported events
    - { type: 'RDH_CONFIG', payload: { enabled: true, nav: true, pro: true } }
    - { type: 'RDH_APPLY', payload: [[...{_id, text, color, note}]] }
    - { type: 'RDH_SCROLL', payload: { _id } }

### Use as an extension inject script
```js
    browser.runtime.onMessage.addListener(({ type, payload }, sender)=>{
        if (sender.id != browser.runtime.id || typeof type != 'string') return
    })

    browser.runtime.sendMessage(null, { type: 'some', payload: {} })
```

### Iframe
Example in `test/iframe` folder

```js
    window.addEventListener('message', ({data, source}) => {
        if (typeof data != 'object' || typeof data.type != 'string') return
        const { type, payload } = data
    })

    iframe.postMessage({ type: 'some', payload: {} }, '*')
```

### Use in electron
```js
    <webview src="..." preload="./highlight.js"></webview>

    webview.addEventListener('ipc-message', ({ channel, args=[] }) => {
        if (channel != 'RDH') return
        const [{ type, payload }] = args
    })

    webview.send('RDH', { type: 'some', payload: {} })
```