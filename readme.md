# Highlight
Should be injected an Iframe or in Electron WebView

## Subscribe to events
- { action: 'rdh-ready' }                                   Highlighter is ready to receive incoming msgs
- { action: 'rdh-edit', payload: { _id } }                  Edit specific highlight
- { action: 'rdh-add', payload: { text, color, note } }     Add new highlight

## Supported events
- { action: 'rdh-config', payload: { enabled: true, pro: true } }
- { action: 'rdh-apply', payload: [[...{_id, text, color, note}]] }

## Use in webpage
```js
window.addEventListener('message', ({data, source}) => {
    if (typeof data != 'object' || typeof data.action != 'string') return
    const { action, payload } = data
})

iframe.postMessage({ action: 'some', payload: {} }, '*')
```

## Use in electron
```js
<webview src="..." preload="./highlight.js"></webview>

webview.addEventListener('ipc-message', event => {
    if (event.channel != 'rdh') return
    const [{ action, payload }] = event.args
})

webview.send('rdh', { action: 'some', payload: {} })
```