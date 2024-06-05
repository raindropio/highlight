import type { RaindropHighlight } from '@/types'
import rangeToText from '@/modules/range-to-text'

type Selected = {
    range: Range,
    highlight?: RaindropHighlight
} | undefined

export type Store = {
    highlights: RaindropHighlight[],
    pro: boolean,
    nav: boolean,
    readonly selected: Selected,
    readonly draft: RaindropHighlight|undefined,
    scrollToId: RaindropHighlight['_id']|undefined,

    select: (range: Range, highlight?: RaindropHighlight)=>void,
    unselect: ()=>void,

    addSelected: ()=>void,
    colorSelected: (color: string)=>void,
    removeSelected: ()=>void,

    draftSelected: ()=>void,
    draftSubmit: ()=>void,
    draftCancel: ()=>void
}

function normalizeHighlight(highlight: RaindropHighlight): RaindropHighlight {
    return {
        ...highlight,
        text: highlight.text || '',
        note: highlight.note || '',
        color: highlight.color || 'yellow'
    }
}

function selectedToHighlight(selected: Selected): RaindropHighlight {
    return normalizeHighlight(
        selected?.highlight ?
            selected.highlight :
            {
                text: rangeToText(selected?.range).trim(),
                note: '',
                color: ''
            }
    )
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
    let selected: Selected = $state(undefined)
    let draft: RaindropHighlight|undefined = $state(undefined)
    let scrollToId: RaindropHighlight['_id']|undefined = $state(undefined)
    
    //selected actions
    function addSelected() {
        if (!selected) return
        const highlight = selectedToHighlight(selected)

        if (!highlights.some(h=>h.text.toLocaleLowerCase().trim() == highlight.text.toLocaleLowerCase().trim()))
            onAdd(highlight)

        selected = undefined
        document.getSelection()?.removeAllRanges()
    }

    function colorSelected(color: string) {
        if (!selected) return
        onUpdate({ ...selectedToHighlight(selected), color })

        selected = undefined
        document.getSelection()?.removeAllRanges()
    }

    function removeSelected() {
        if (!selected?.highlight?._id) return
        onRemove({ _id: selected.highlight._id })
        
        selected = undefined
        document.getSelection()?.removeAllRanges()
    }

    function select(range: Range, highlight?: RaindropHighlight) {
        selected = {
            range,
            ...(highlight ? { highlight: JSON.parse(JSON.stringify(highlight)) } : {})
        }
    }

    function unselect() {
        if (selected)
            selected = undefined
    }

    //draft actions
    function draftSelected() {
        if (!selected) return
        draft = JSON.parse(JSON.stringify(selectedToHighlight(selected)))
        selected = undefined
    }

    function draftSubmit() {
        if (!draft) return
        if (draft._id)
            onUpdate(JSON.parse(JSON.stringify(draft)))
        else {
            if (!highlights.some(h=>h.text.toLocaleLowerCase().trim() == draft?.text?.toLocaleLowerCase().trim()))
                onAdd(JSON.parse(JSON.stringify(draft)))
        }
        draft = undefined
    }

    function draftCancel() {
        draft = undefined
    }

    return {
        get highlights() { return highlights },
        set highlights(value: RaindropHighlight[]) { highlights = value.map(normalizeHighlight) },
        get pro() { return pro },
        set pro(value: boolean) { pro = value },
        get nav() { return nav },
        set nav(value: boolean) { nav = value },
        get selected() { return selected },
        get draft() { return draft },
        get scrollToId() { return scrollToId },
        set scrollToId(value: RaindropHighlight['_id']|undefined) { scrollToId = value },

        select,
        unselect,

        addSelected,
        colorSelected,
        removeSelected,

        draftSelected,
        draftSubmit,
        draftCancel
    }
}