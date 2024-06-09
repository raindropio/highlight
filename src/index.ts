import '@webcomponents/custom-elements'
import { createStore, type Store } from '@/store.svelte'
import { scrollToId } from '@/marker'
import '@/ui/index.svelte'
import ipc from '@/ipc'

(async()=>{
    //receive events from ipc
    const send = await ipc(event=>{
        switch(event.type) {
            case 'RDH_APPLY':
                if (Array.isArray(event.payload))
                    store.highlights = event.payload
            break

            case 'RDH_CONFIG':
                store.pro = event.payload.pro || false
                store.nav = event.payload.nav || false
            break

            case 'RDH_SCROLL':
                if (typeof event.payload._id == 'string')
                    scrollToId(event.payload._id)
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

    //append ui
    const ui = document.createElement('rdh-ui') as HTMLElement & { store: Store }
    ui.store = store
    document.body.appendChild(ui)

    send({ type: 'RDH_READY', payload: { url: location.href } })
})()