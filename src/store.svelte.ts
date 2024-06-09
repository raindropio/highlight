import type { RaindropHighlight } from '@/types'
import { getSelected, rangeToText } from '@/marker'

export type Store = {
    highlights: RaindropHighlight[],
    pro: boolean,
    nav: boolean,
    readonly draft: RaindropHighlight|undefined,

    addSelected: ()=>void,
    colorSelected: (color: string)=>void,
    removeSelected: ()=>void,

    draftSelected: ()=>void,
    draftSubmit: ()=>void,
    draftCancel: ()=>void
}

function rangeToHighlight(range: Range): RaindropHighlight {
    return {
        text: rangeToText(range).trim(),
        note: '',
        color: ''
    }
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

    //private
    function _upsert(highlight: RaindropHighlight) {
        const item = {
            ...highlight,
            text: highlight.text || '',
            note: highlight.note || '',
            color: highlight.color || 'yellow'
        }

        if (highlight._id) {
            const index = highlights.findIndex(h=>h._id == highlight._id)
            if (index != -1)
                highlights[index] = item
            onUpdate(item)
        } else {
            if (highlights.some(h=>h.text.toLocaleLowerCase().trim() == item.text.toLocaleLowerCase().trim()))
                return
            highlights.push(item)
            onAdd(item)
        }
    }

    function _delete(id: RaindropHighlight['_id']) {
        highlights = highlights.filter(h=>h._id != id)
        onRemove({ _id: id })
    }
    
    //selected actions
    function addSelected() {
        const { range, id } = getSelected()||{}
        if (!range || id) return
        _upsert(rangeToHighlight(range))
        document.getSelection()?.removeAllRanges()
    }

    function colorSelected(color: string) {
        const { range, id } = getSelected()||{}
        if (!range) return
        const highlight = id ? highlights.find(h=>h._id == id) : rangeToHighlight(range)
        if (!highlight) return
        _upsert({...highlight, color})
        document.getSelection()?.removeAllRanges()
    }

    function removeSelected() {
        const { id } = getSelected()||{}
        if (!id) return
        _delete(id)
        document.getSelection()?.removeAllRanges()
    }

    //draft actions
    function draftSelected() {
        const { range, id } = getSelected()||{}
        if (!range) return
        const highlight = id ? highlights.find(h=>h._id == id) : rangeToHighlight(range)
        if (!highlight) return

        draft = JSON.parse(JSON.stringify(highlight))
    }

    function draftSubmit() {
        if (!draft) return
        _upsert(draft)
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

        addSelected,
        colorSelected,
        removeSelected,

        draftSelected,
        draftSubmit,
        draftCancel
    }
}