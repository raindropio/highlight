import '@webcomponents/custom-elements'
import type { ComponentProps } from 'svelte'
import App from './app.svelte'
import ipc from './ipc'
import type { CustomHighlight } from '../types'

//properties set before the element is inserted are picked up when it connects
const app = document.createElement('rdh-app') as HTMLElement & App & ComponentProps<typeof App>

//host payloads are untrusted; the list also goes back to the host, and some hosts decode strictly (ios)
function pick(h: any): CustomHighlight {
    return {
        ...(typeof h?._id == 'string' ? { _id: h._id } : {}),
        ...(typeof h?.text == 'string' ? { text: h.text } : {}),
        ...(typeof h?.note == 'string' ? { note: h.note } : {}),
        ...(typeof h?.color == 'string' ? { color: h.color } : {}),
        ...(typeof h?.position == 'number' ? { position: h.position } : {})
    }
}

async function main() {
    //callbacks first: ipc can replay queued events synchronously before returning
    let send: Awaited<ReturnType<typeof ipc>> | undefined
    app.onadd = highlight=>
        send?.({ type: 'RDH_ADD', payload: highlight })
    app.onupdate = highlight=>
        send?.({ type: 'RDH_UPDATE', payload: highlight })
    app.onremove = ({ _id })=>
        send?.({ type: 'RDH_REMOVE', payload: { _id } })

    send = await ipc(event=>{
        switch(event.type) {
            case 'RDH_APPLY':
                if (Array.isArray(event.payload))
                    app.highlights = event.payload.map(pick).filter(h=>h.text?.trim())
            break

            case 'RDH_CONFIG':
                if (typeof event.payload.pro == 'boolean')
                    app.pro = event.payload.pro

                if (typeof event.payload.nav == 'boolean')
                    app.nav = event.payload.nav

                if (typeof event.payload.hide_new_toolbar == 'boolean')
                    app.hideNewToolbar = event.payload.hide_new_toolbar

                if (typeof event.payload.enabled == 'boolean') {
                    if (event.payload.enabled === true) {
                        if (!document.body.contains(app))
                            document.body.appendChild(app)
                    } else {
                        if (document.body.contains(app))
                            document.body.removeChild(app)
                    }
                }
            break

            //methods exist only while the element is inserted
            case 'RDH_SCROLL':
                if (typeof event.payload._id == 'string')
                    app.scrollTo?.(event.payload._id)
            break

            case 'RDH_ADD_SELECTION':
                app.addSelection?.(pick(event.payload))
            break

            case 'RDH_NOTE_SELECTION':
                app.noteSelection?.()
            break
        }
    })

    send({ type: 'RDH_READY', payload: { url: location.href } })
}

main()