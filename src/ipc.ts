import type { RaindropHighlight } from '@/types'

export default function(receive: (event: AnyEventReceived)=>void) {
    //extension inject script
    if (
        //@ts-ignore
        (typeof chrome == 'object' && chrome.runtime && chrome.runtime.onMessage) || 
        //@ts-ignore
        (typeof browser == 'object' && browser.runtime && browser.runtime.onMessage)
    ) {
        //@ts-ignore
        const { runtime } = (typeof browser == 'object' ? browser : chrome)

        const onMessage = (event: AnyEventReceived, sender: any) => {
            if (sender.id != runtime.id) return //only messages from bg script of current extension allowed
            if (typeof event.type !== 'string') return
            receive(event)
        }
        runtime.onMessage.removeListener(onMessage)
        runtime.onMessage.addListener(onMessage)
    
        return (event: SendAnyEvent)=>
            runtime.sendMessage(null, event)
    }

    //wkwebview
    //@ts-ignore
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.rdh) {
        //@ts-ignore
        window.rdhSend = receive

        return (event: SendAnyEvent)=>
            //@ts-ignore
            window.webkit.messageHandlers.rdh.postMessage(event)
    }

    //electron
    if (
        //@ts-ignore
        (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') ||
        (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) ||
        (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0)
    ) {
        const { ipcRenderer } = require('electron')    
        const onMessage = (_: any, event: AnyEventReceived) => receive(event)
        ipcRenderer.removeListener('RDH', onMessage)
        ipcRenderer.on('RDH', onMessage)

        return (event: SendAnyEvent)=>
            ipcRenderer.sendToHost('RDH', event)
    }

    //reactnative
    if ('ReactNativeWebView' in window) {
        //@ts-ignore
        window.ReactNativeWebViewSendMessage = receive

        return (event: SendAnyEvent)=>
            //@ts-ignore
            window.ReactNativeWebView.postMessage(JSON.stringify(event))
    }

    //iframe
    if (window.self !== window.top) {
        const onMessage = ({ data, source }: MessageEvent<AnyEventReceived>) => {
            if (source !== window.parent || typeof data !== 'object' || typeof data.type !== 'string') return
            receive(data)
        }
        window.removeEventListener('message', onMessage)
        window.addEventListener('message', onMessage)

        return (event: SendAnyEvent)=>
            window.parent.postMessage(event, '*')
    }

    throw new Error('unsupported platform')
}



//received events
type ApplyEventReceived = {
    type: 'RDH_APPLY'
    payload: RaindropHighlight[]
}

type ConfigEventReceived = {
    type: 'RDH_CONFIG'
    payload: {
        enabled?: boolean
        pro?: boolean
        nav?: boolean
    }
}

type ScrollEventReceived = {
    type: 'RDH_SCROLL'
    payload: {
        _id: RaindropHighlight['_id']
    }
}

type AddSelectionEventReceived = {
    type: 'RDH_ADD_SELECTION'
    payload?: RaindropHighlight
}

type NoteSelectionEventReceived = {
    type: 'RDH_NOTE_SELECTION'
}

type AnyEventReceived = ApplyEventReceived | ConfigEventReceived | ScrollEventReceived | AddSelectionEventReceived | NoteSelectionEventReceived

//send events
type SendReadyEvent = {
    type: 'RDH_READY',
    payload: {
        url: string
    }
}

type SendAddEvent = {
    type: 'RDH_ADD'
    payload: RaindropHighlight
}

type SendUpdateEvent = {
    type: 'RDH_UPDATE'
    payload: RaindropHighlight
}

type SendRemoveEvent = {
    type: 'RDH_REMOVE'
    payload: {
        _id: RaindropHighlight['_id']
    }
}

type SendAnyEvent = SendReadyEvent | SendAddEvent | SendUpdateEvent | SendRemoveEvent