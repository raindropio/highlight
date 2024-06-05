export type RaindropHighlight = {
    _id?: string
    text: string
    note: string
    color: string
}

export class ScrollToId extends Event {
    constructor(public _id: string) {
        super('rdscrolltoid')
        this._id = _id
    }
}