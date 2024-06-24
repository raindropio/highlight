import type { RaindropHighlight } from '@/types'
import { aim, rangeToText } from '@/marker'

export type Store = {
    highlights: RaindropHighlight[],
    pro: boolean,
    nav: boolean,
    readonly draft: RaindropHighlight|undefined,

    find: (range: Range)=>RaindropHighlight|undefined,
    upsert: (highlight: RaindropHighlight)=>void,
    remove: (highlight: RaindropHighlight)=>void,

    setDraft: (highlight: RaindropHighlight)=>void,
    draftSubmit: ()=>void,
    draftCancel: ()=>void
}

export function createStore(
    onAdd: (highlight: RaindropHighlight)=>void, 
    onUpdate: (highlight: RaindropHighlight)=>void, 
    onRemove: (highlight: { _id: RaindropHighlight['_id'] })=>void
): Store {
    //state
    let highlights: RaindropHighlight[] = $state([])
    let pro = $state(false)
    let nav = $state(false)
    let draft: RaindropHighlight|undefined = $state(undefined)

    //actions
    function find(range: Range): RaindropHighlight|undefined {
        //existings
        const _id = aim(range)
        if (_id) return highlights.find(h=>h._id == _id)

        //new
        const text = rangeToText(range).trim()
        if (!text) return
        return { text: rangeToText(range).trim() }
    }

    function upsert(highlight: RaindropHighlight) {
        const item: RaindropHighlight = {
            ...(highlight._id ? { _id: highlight._id } : {}),
            ...(highlight.text ? { text: highlight.text } : {}),
            ...(highlight.note ? { note: highlight.note } : {}),
            color: highlight.color || 'yellow',
            //ignore all unknown fields (otherwise breaks ios)
        }
        if (!item.text) return

        const index = highlights.findIndex(h=>
            h._id == item._id || 
            h.text?.toLocaleLowerCase().trim() === item.text?.toLocaleLowerCase().trim()
        )

        if (index != -1){
            highlights[index] = item
            onUpdate(item)
        } else {
            highlights.push(item)
            onAdd(item)
        }
    }

    function remove({ _id }: RaindropHighlight) {
        highlights = highlights.filter(h=>h._id != _id)
        onRemove({ _id })
    }

    //draft actions
    function setDraft(highlight: RaindropHighlight) {
        draft = JSON.parse(JSON.stringify(highlight))
    }

    function draftSubmit() {
        if (!draft) return
        upsert(draft)
        draft = undefined
    }

    function draftCancel() {
        draft = undefined
    }

    return {
        get highlights() { return highlights },
        set highlights(value: RaindropHighlight[]) { highlights = value },
        get pro() { return pro },
        set pro(value: boolean) { pro = value },
        get nav() { return nav },
        set nav(value: boolean) { nav = value },
        get draft() { return draft },

        find,
        upsert,
        remove,

        setDraft,
        draftSubmit,
        draftCancel
    }
}