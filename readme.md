# Highlight
Should be injected an Iframe or in Electron WebView

### Subscribe to events
    - { type: 'RDH_READY', payload: { url } }               Highlighter is ready to receive incoming msgs
    - { type: 'RDH_ADD', payload: { text, color, note } }   Add new highlight
    - { type: 'RDH_UPDATE', payload: { _id, note... } }     Update specific highlight, only updated fields are present in payload!
    - { type: 'RDH_REMOVE', payload: { _id } }              Remove specific highlight

### Supported events
    - { type: 'RDH_CONFIG', payload: { enabled: true, nav: true, pro: true } }
    - { type: 'RDH_APPLY', payload: [[...{_id, text, color, note}]] }
    - { type: 'RDH_SCROLL', payload: { _id } }
    - { type: 'RDH_ADD_SELECTION' }
    - { type: 'RDH_NOTE_SELECTION' }

### Use as an webextension inject script
Example in `test/webextension` folder

```js
    browser.runtime.onMessage.addListener(({ type, payload }, sender)=>{
        if (sender.id != browser.runtime.id || typeof type != 'string') return
    })

    browser.tabs.sendMessage(sender.tab.id, { type: 'some', payload: {} })
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
Example in `test/electron` folder

```js
    <webview src="..." preload="./highlight.js"></webview>

    webview.addEventListener('ipc-message', ({ channel, args=[] }) => {
        if (channel != 'RDH') return
        const [{ type, payload }] = args
    })

    webview.send('RDH', { type: 'some', payload: {} })
```

### Use in React Native
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