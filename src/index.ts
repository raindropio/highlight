import '@webcomponents/custom-elements'
import waitDocumentLoad from '@/modules/wait-document-load'
import { createStore, type Store } from '@/store.svelte'
import '@/container.svelte'
import ipc from '@/ipc'

//receive events from ipc
const send = ipc(event=>{
    switch(event.type) {
        case 'RDH_APPLY':
            if (Array.isArray(event.payload))
                store.highlights = event.payload
        break

        case 'RDH_CONFIG':
            store.pro = event.payload.pro || false
            store.nav = event.payload.nav || false

            if (event.payload.enabled == true) {
                if (!document.body.contains(container))
                    document.body.appendChild(container)
            } else
                if (document.body.contains(container))
                    document.body.removeChild(container)
        break

        case 'RDH_SCROLL':
            if (typeof event.payload._id == 'string')
                store.scrollToId = event.payload._id
        break

        case 'RDH_ADD_SELECTION':
            store.addSelected()
        break

        case 'RDH_NOTE_SELECTION':
            store.draftSelected()
        break
    }
})

const store = createStore(
    highligh=>
        send({ type: 'RDH_ADD', payload: highligh }),
    highligh=>
        send({ type: 'RDH_UPDATE', payload: highligh }),
    ({ _id })=>
        send({ type: 'RDH_REMOVE', payload: { _id } })
)

const container = document.createElement('rdh-container') as HTMLElement & { store: Store }
container.store = store

waitDocumentLoad().then(()=>{
    send({ type: 'RDH_READY', payload: { url: location.href } })
})