function RdCopyText(doc, text) {
    const textArea = doc.createElement('textarea')
    textArea.value = text
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'

    doc.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    doc.execCommand('copy')
    doc.body.removeChild(textArea)
}

function RdPrompt(placeholder, defaultValue='', callback){
    //electron
    if (rdhPlatform == 'electron') {
        const w = 350, h = 100
        const p = window.open('', 'prompt', `popup,frame=false,width=${w},height=${h},left=${(screen.width/2) - (w/2)},top=${(screen.height/2) - (h/2)}`)
        p.document.documentElement.innerHTML = `
        <meta name="color-scheme" content="light dark">
        <style>
            * {
                box-sizing: border-box;
                font: 14px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
                margin: 0;
            }
            html, body, form {
                width: 100vw;height: 100vh;height: -webkit-fill-available;
            }
            form {
                display: flex;
                flex-direction: column;
                padding: 1em;
                gap: 1em;
            }
            input[type="text"] {
                flex: 1;
                display: block;
                padding: .5em;
            }
            div {
                display: flex;
                justify-content: flex-end;
                gap: .5em;
            }
            input[type="submit"] {
                order: 1;
                font-weight: bold;
            }
        </style>
        <form><input type="text" autoFocus placeholder="${placeholder}" /><div><input type="submit" value="OK" /><button>Cancel</button></div></form>
        `
        const input = p.document.querySelector('input[type="text"]')
        input.value = defaultValue
        
        const form = p.document.querySelector('form')
        form.addEventListener('submit', function(e){
            e.preventDefault()
            if (p.closed) return
            callback(input.value)
            p.close()
        })

        const cancel = p.document.querySelector('button')
        cancel.addEventListener('click', function(e) {
            e.preventDefault()
            if (p.closed) return
            callback(defaultValue)
            p.close()
        })

        p.window.addEventListener('keydown', function(e) {
            if (e.code == 'Escape') cancel.click()
        })
        p.window.addEventListener('blur', ()=>{cancel.click()})
        return
    }

    const returnValue = prompt(placeholder, defaultValue)
    callback(returnValue === null ? defaultValue : returnValue) //ios send null if user tap cancel
    return
}

class RdTooltip {
    _parent = null //RdHighlight
    _menu = null
    _listeners = {} //{ onColorClick(color), onNoteClick(x,y), onCopyClick(), onRemoveClick() }

    _hidden = true
    _colors = ['yellow', 'blue', 'green', 'red']

    _classMenu = 'rdhm'
    _classButtonColor = 'rdhbh'
    _classButtonNote = 'rdhbn'
    _classButtonCopy = 'rdhbc'
    _classButtonRemove = 'rdhbr'
    _idCss = 'rdhss'
    _attrColor = 'data-rdhsc'

    constructor(parent, { onColorClick, onNoteClick, onCopyClick, onRemoveClick }) {
        this._parent = parent
        this._listeners = { onColorClick, onNoteClick, onCopyClick, onRemoveClick }

        //init
        this._initStyles()
        this._initMenu()

        //bind
        this.show = this.show.bind(this)
        this.hide = this.hide.bind(this)
        this._windowMouseDown = this._windowMouseDown.bind(this)
        this._windowResize = this._windowResize.bind(this)

        //events
        if (this._parent._isMobile){
            this._parent._document.removeEventListener('touchstart', this._windowMouseDown)
            this._parent._document.addEventListener('touchstart', this._windowMouseDown)
            this._parent._document.removeEventListener('touchend', this._windowMouseUp)
            this._parent._document.addEventListener('touchend', this._windowMouseUp)
        } else {
            this._parent._window.removeEventListener('mousedown', this._windowMouseDown)
            this._parent._window.addEventListener('mousedown', this._windowMouseDown)
        }
        this._parent._window.removeEventListener('resize', this._windowResize)
        this._parent._window.addEventListener('resize', this._windowResize)
    }

    show(x, y, activeColor='', activeNote=false, activeRemove=false) {
        //position
        let left = x
        let top = y
        //center on mobile
        if (this._parent._isMobile) left = x - (this._menu.offsetWidth/2)
        //prevent showing outside of a screen
        let minX = this._parent._window.scrollX + 10
        let maxX = minX + this._parent._window.innerWidth - this._menu.offsetWidth - 10
        if (left < minX) left = minX; if (left > maxX) left = maxX
        let minY = this._parent._window.scrollY + 10
        let maxY = minY + this._parent._window.innerHeight - this._menu.offsetHeight - 10
        if (top < minY) top = minY; if (top > maxY) top = maxY
        //apply position
        this._menu.setAttribute('style', `left: ${left}px !important; top: ${top}px !important;`)

        //color active
        this._menu.querySelectorAll(`[${this._attrColor}]`).forEach(e=>e.removeAttribute('data-active'))
        if (activeColor) {
            const color = this._menu.querySelector(`[${this._attrColor}="${activeColor.trim()}"]`)
            if (color) color.setAttribute('data-active', 'true')
        }

        //note active
        const note = this._menu.querySelector(`.${this._classButtonNote}`)
        if (activeNote)
            note.setAttribute('data-badge', '1')
        else
            note.removeAttribute('data-badge')

        //remove button visibility
        const remove = this._menu.querySelector(`.${this._classButtonRemove}`)
        remove.setAttribute('hidden', activeRemove ? 'false' : 'true')

        //menu visibility
        this._menu.removeAttribute('hidden')
        this._hidden = false
    }

    hide() {
        if (this._menu) {
            this._hidden = true
            this._menu.setAttribute('hidden', 'true')
        }
    }

    /* Window events */
    _windowMouseDown(e) {
        if (this._hidden) return
        if (e.target == this._menu) return
        if (this._menu.contains(e.target)) return

        this.hide()
    }

    _windowResize() {
        if (this._hidden) return
        this.hide()
    }

    /* Buttons */
    _colorClick(e) {
        e.preventDefault()
        if (typeof this._listeners.onColorClick != 'function') return
        this._listeners.onColorClick(e.currentTarget.getAttribute(this._attrColor) || '')
    }

    _noteClick(e) {
        e.preventDefault()
        if (typeof this._listeners.onNoteClick != 'function') return
        this._listeners.onNoteClick(e.screenX - 14, e.screenY - 14)
    }

    _copyClick(e) {
        e.preventDefault()
        if (typeof this._listeners.onCopyClick != 'function') return
        this._listeners.onCopyClick()
    }

    _removeClick(e) {
        e.preventDefault()
        if (typeof this._listeners.onRemoveClick != 'function') return
        this._listeners.onRemoveClick()
    }

    /* Menu */
    _initMenu() {
        if (this._menu)
            return

        //create menu
        this._menu = this._parent._document.createElement('menu')
        this._menu.className = this._classMenu
        this._menu.setAttribute('hidden', 'true')
        this._menu.innerHTML = `
            <li title="Add highlight to Raindrop.io">
                ${this._colors.map(color=>`
                    <button class="${this._classButtonColor}" ${this._attrColor}="${color}"><span /></button>
                `).join('')}
            </li>
            
            <button class="${this._classButtonNote}" title="Add annotation to Raindrop.io">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M10,2 C14.418278,2 18,5.581722 18,10 C18,14.418278 14.418278,18 10,18 C8.57827688,18 7.24317393,17.629135 6.08615605,16.9788699 L2,18 L3.0222629,13.9158589 C2.37129574,12.7583762 2,11.4225485 2,10 C2,5.581722 5.581722,2 10,2 Z M10,3 C6.13400675,3 3,6.13400675 3,10 C3,11.1072789 3.25670533,12.1753459 3.74159283,13.1395754 L3.89387602,13.4256645 L4.08897687,13.7725727 L3.375,16.625 L6.22947002,15.9123036 L6.57609819,16.107115 C7.61276874,16.6897427 8.78268976,17 10,17 C13.8659932,17 17,13.8659932 17,10 C17,6.13400675 13.8659932,3 10,3 Z M6,9 C6.55228475,9 7,9.44771525 7,10 C7,10.5522847 6.55228475,11 6,11 C5.44771525,11 5,10.5522847 5,10 C5,9.44771525 5.44771525,9 6,9 Z M10,9 C10.5522847,9 11,9.44771525 11,10 C11,10.5522847 10.5522847,11 10,11 C9.44771525,11 9,10.5522847 9,10 C9,9.44771525 9.44771525,9 10,9 Z M14,9 C14.5522847,9 15,9.44771525 15,10 C15,10.5522847 14.5522847,11 14,11 C13.4477153,11 13,10.5522847 13,10 C13,9.44771525 13.4477153,9 14,9 Z"/></svg>
            </button>

            <button class="${this._classButtonCopy}" title="Copy text">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill-rule="evenodd" d="M2 11.5c0 .8.7 1.5 1.5 1.5H7v-1H3.5a.5.5 0 0 1-.5-.5v-8c0-.3.2-.5.5-.5h8c.3 0 .5.2.5.5V7H8.5C7.7 7 7 7.7 7 8.5v8c0 .8.7 1.5 1.5 1.5h8c.8 0 1.5-.7 1.5-1.5v-8c0-.8-.7-1.5-1.5-1.5H13V3.5c0-.8-.7-1.5-1.5-1.5h-8C2.7 2 2 2.7 2 3.5v8Zm6-3c0-.3.2-.5.5-.5h8c.3 0 .5.2.5.5v8c0 .3-.2.5-.5.5h-8a.5.5 0 0 1-.5-.5v-8Z"/></svg>
            </button>

            <button class="${this._classButtonRemove}" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill-rule="evenodd" d="M5.5 2a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9ZM2 4.5c0-.3.2-.5.5-.5h15a.5.5 0 0 1 0 1H16v12c0 .6-.4 1-1 1H5a1 1 0 0 1-1-1V5H2.5a.5.5 0 0 1-.5-.5ZM5 5h10v12H5V5Z"/></svg>
            </button>
        `
        this._parent._container.appendChild(this._menu)

        //add click events
        this._menu.querySelectorAll(`.${this._classButtonColor}`)
            .forEach(e=>{
                this._colorClick = this._colorClick.bind(this)
                e.removeEventListener('mousedown', this._colorClick)
                e.addEventListener('mousedown', this._colorClick)
            })

        this._menu.querySelectorAll(`.${this._classButtonNote}`)
            .forEach(e=>{
                this._noteClick = this._noteClick.bind(this)
                e.removeEventListener('mousedown', this._noteClick)
                e.addEventListener('mousedown', this._noteClick)
            })

        this._menu.querySelectorAll(`.${this._classButtonCopy}`)
            .forEach(e=>{
                if (typeof this._listeners.onCopyClick == 'function') {
                    this._copyClick = this._copyClick.bind(this)
                    e.removeEventListener('mousedown', this._copyClick)
                    e.addEventListener('mousedown', this._copyClick)
                } else {
                    e.setAttribute('hidden', 'true')
                }
            })

        this._menu.querySelectorAll(`.${this._classButtonRemove}`)
            .forEach(e=>{
                this._removeClick = this._removeClick.bind(this)
                e.removeEventListener('mousedown', this._removeClick)
                e.addEventListener('mousedown', this._removeClick)
            })
    }

    /* Styles */
    _initStyles() {
        if (this._parent._container.querySelector(`#${this._idCss}`))
            return

        const style = this._parent._document.createElement('style')
        style.id = this._idCss
        style.innerHTML = `
            :root {
                --r-menu-bg: Canvas;
                --r-menu-color: FieldText;
                --r-menu-active: GrayText;
                --r-menu-item-width: 30px;
                --r-menu-item-height: 30px;
                --r-menu-border-radius: 8px;
            }
            @supports (background-color: -apple-system-control-background) {
                :root {
                    --r-menu-bg: -apple-system-control-background;
                }
            }

            /* mobile */
            @media (pointer: coarse) {
                /* android */
                @supports not (-webkit-backdrop-filter: blur(0)) {
                    :root {
                        --r-menu-item-width: 44px;
                        --r-menu-item-height: 48px;
                        --r-menu-border-radius: 24px;
                    }
                    /* android preferes system theme */
                    @media (prefers-color-scheme: dark) {
                        :root {
                            --r-menu-bg: #282828;
                            --r-menu-color: white;
                            --r-menu-active: rgba(255,255,255,.2);
                        }
                    }
                    @media (prefers-color-scheme: light) {
                        :root {
                            --r-menu-bg: white;
                            --r-menu-color: black;
                            --r-menu-active: rgba(0,0,0,.2);
                        }
                    }
                }

                /* ios */
                @supports (-webkit-backdrop-filter: blur(0)) {
                    :root {
                        /* ios safari always black */
                        --r-menu-bg: black;
                        --r-menu-color: white;
                        --r-menu-active: rgba(255,255,255,.3);
                        --r-menu-item-width: 44px;
                        --r-menu-item-height: 38px;
                        --r-menu-border-radius: 8px;
                    }
                }
            }

            .${this._classMenu} {
                position: absolute !important;
                display: flex !important;
                
                z-index: 99999999 !important;
                background-color: var(--r-menu-bg) !important;
                background-image: linear-gradient(to bottom, rgba(255,255,255,.1) 0, rgba(255,255,255,.1) 100%) !important;
                box-shadow: 0 0 0 .5px rgba(0,0,0,.15), 0 .5px 0 rgba(0,0,0,.1), 0 6px 12px rgba(0,0,0,.1), 0 10px 20px rgba(0,0,0,.05) !important;
                margin: 4px !important;
                width: auto !important;
                height: auto !important;
                left: 0 !important; top: 0 !important;
                animation: none !important;
                transition: opacity .1s ease-in-out, transform .1s ease-in-out !important;
                will-change: opacity;
                border: 0 !important;
                padding: 0 !important;
                border-radius: var(--r-menu-border-radius) !important;
                overflow: hidden !important;
            }
            .${this._classMenu}, .${this._classMenu} * {
                margin: 0 !important;
            }
            .${this._classMenu}, .${this._classMenu} * {
                box-sizing: border-box !important;
                user-select: none !important;
                -webkit-user-select: none !important;
            }
            .${this._classMenu}[hidden='true'] {
                transition-duration: .2s !important;
                pointer-events: none !important;
                opacity: 0 !important;
            }
            .${this._classMenu}[hidden='false'] {
                opacity: 1 !important;
            }

            /* Dropdown */
            .${this._classMenu} > li {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
            }

            /* Dropdown grow down on desktop on hover */
            @media (pointer: fine) {
                .${this._classMenu} > li {
                    display: grid !important;
                    max-height: var(--r-menu-item-height) !important;
                    transition: max-height .2s ease-in-out !important;
                    transition-delay: .25s !important;
                    will-change: max-height;
                    overflow: hidden !important;
                }
                .${this._classMenu} > li:hover {
                    transition-delay: .15s !important;
                    max-height: ${this._colors.length * 32}px !important;
                }
            }

            /* Buttons */
            .${this._classMenu} button {
                -webkit-tap-highlight-color: transparent !important;
                flex-shrink: 0 !important;
                cursor: default !important;
                color: var(--r-menu-color) !important;
                width: var(--r-menu-item-width) !important;
                height: var(--r-menu-item-height) !important;
                appearance: none !important;
                background: transparent !important;
                border: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: none !important;
                will-change: background, color;
                filter: none !important;
                position: relative !important;
            }
            .${this._classMenu} button:hover {
                background: rgba(150,150,150,.2) !important;
            }
            .${this._classMenu} button:active {
                background: var(--r-menu-active) !important;
            }
            .${this._classMenu} button[hidden='true'] {
                display: none !important;
            }
            .${this._classMenu} button[hidden='false'] {
                display: flex !important;
            }
            .${this._classMenu} button[data-badge]:before {
                content: "" !important;
                width: 12px !important;
                height: 12px !important;
                border-radius: 6px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: red !important;
                color: white !important;
                position: absolute !important;
                top: 3px !important;
                right: 2px !important;
                font-size: 11px !important;
                line-height: 11px !important;
                font-weight: 600 !important;
            }
            @media (pointer: fine) {
                .${this._classMenu} button[data-active='true'] {
                    order: -1 !important;
                }
            }
            @media (pointer: coarse) {
                .${this._classMenu} button[data-active='true'] {
                    display: none !important;
                }
            }

            .${this._classMenu} * {
                fill: var(--r-menu-color) !important;
            }

            /* Color */
            .${this._classMenu} button[${this._attrColor}] span {
                position: relative !important;
                background-image: linear-gradient(to bottom, rgba(255,255,255,.3) 0, rgba(255,255,255,.3) 100%) !important;
            }
            .${this._classMenu} button[${this._attrColor}] span,
            .${this._classMenu} button[${this._attrColor}] span:before {
                display: block !important;
                width: 17px !important;
                height: 17px !important;
                border-radius: 17px !important;
            }
            ${this._colors.map(color=>`
                .${this._classMenu} button[${this._attrColor}=${color}] span { background-color: ${color} !important; }
            `).join('')}
            .${this._classMenu} button[${this._attrColor}] span:before {
                position: absolute !important;
                content: '' !important;
                left: 0 !important; top: 0 !important; right: 0 !important; bottom: 0 !important;
                box-shadow: inset 0 0 0 .5px var(--r-menu-color) !important;
                opacity: .35;
                mix-blend-mode: multiply;
            }
        `
        this._parent._container.appendChild(style)
    }
}

class RdSelection {
    _parent = null //RdHighlight
    _tooltip = null

    constructor(parent) {
        this._parent = parent
        this._tooltip = new RdTooltip(parent, {
            onColorClick: color=>this._parent.addSelection({ color }),
            onNoteClick: (x, y)=>this._parent.noteSelection(x, y)
        })

        //bind
        this.render = this.render.bind(this)
        this._onSelectionChange = this._onSelectionChange.bind(this)

        //add event listeners
        this._parent._document.removeEventListener('selectionchange', this._onSelectionChange)
        this._parent._document.addEventListener('selectionchange', this._onSelectionChange)
        this._parent._window.removeEventListener('focus', this.render)
        this._parent._window.addEventListener('focus', this.render)
        this._parent._window.removeEventListener('blur', this.render)
        this._parent._window.addEventListener('blur', this.render)

        //try
        this._onSelectionChange()
    }

    have() {
        const selection = this._parent._window.getSelection()
        return selection && selection.rangeCount>0 && !selection.isCollapsed && selection.toString().trim().length>0
    }

    render() {
        //remove tooltip if no selection yet
        if (!this._parent.enabled || 
            !this.have() || 
            !this._parent._document.hasFocus()){
            this._tooltip.hide()
            return
        }

        //position menu
        const selection = this._parent._window.getSelection()
        const { x, y, width, height } = selection.getRangeAt(0).getBoundingClientRect()
        let left = this._parent._window.scrollX+x+width
        let top = this._parent._window.scrollY+y-32

        //mobile
        if (this._parent._isMobile){
            left = this._parent._window.scrollX+x+(width/2)
            top = this._parent._window.scrollY+y+height+(y > 80 ? 16 : 80)
        }

        this._tooltip.show(left, top)
    }

    /* User changed document selection event */
    _onSelectionChange() {
        clearTimeout(this._selectTimeout)
        this._tooltip.hide()
        this._selectTimeout = setTimeout(this.render, this.have() ? (this._parent._isMobile ? 400 : 250) : 0)
    }
}

/*
    How to use?
        const rdh = new RdHighlight(document.body)
        rdh.enabled = true
        rdh.pro = true
        rdh.nav = true

        rdh.apply([...{_id, text, color, note}])
        rdh.onEdit = (id) => {}
        rdh.onAdd = ({text, color, note}) => {}
*/
class RdHighlight {
    _container = null
    _window = null
    _document = null
    _isMobile = matchMedia('(pointer:coarse)').matches

    _selection = null
    _tooltip = null
    _activeMarkId = null

    _attrId = 'data-rdhid'
    _idCss = 'rdhs'
    _cssColorVar = '--rdhc'
    _classNoteIcon = 'rdhni'
    _classNav = 'rdhnav'

    //configuration
    enabled = false
    pro = false
    nav = false

    //events
    onUpdate = ()=>{} //({_id, note...})=>{}
    onRemove = ()=>{} //({_id})=>{}
    onAdd = ()=>{} //({text,color,note})=>{}

    constructor(container) {
        this._container = container
        this._document = this._container.ownerDocument
        this._window = this._document.defaultView

        //bind
        this._markClick = this._markClick.bind(this)
        this._markColorClick = this._markColorClick.bind(this)
        this._markNoteClick = this._markNoteClick.bind(this)
        this._markCopyClick = this._markCopyClick.bind(this)
        this._markRemoveClick = this._markRemoveClick.bind(this)
        this._navClick = this._navClick.bind(this)

        //init select menu
        this._selection = new RdSelection(this)
        this._tooltip = new RdTooltip(this, {
            onColorClick: this._markColorClick,
            onNoteClick: this._markNoteClick,
            onCopyClick: this._markCopyClick,
            onRemoveClick: this._markRemoveClick
        })
    }

    /* Mark highlight array of { text, color, _id } */
    apply(highlights=[]) {
        this.reset()
        this._initStyles()

        if (Array.isArray(highlights))
            for(const highlight of highlights)
                this.mark(
                    this._getRanges(
                        this._getTextNodes(this._container),
                        highlight.text
                    ),
                    highlight
                )
    }

    /* Test */
    test(text='') {
        if (text.length > 5000) return false
        const nodes = this._getTextNodes(this._container)
        const ranges = this._getRanges(nodes, text)
        return ranges.length > 0
    }

    getSelectionText(validate=false) {
        const selection = this._window.getSelection()
        if (!selection.rangeCount) return

        //selection.getRangeAt(0).toString() better vs just selection.toString() 
        //s.range gets text without any css text transform applied. important!
        const text = selection.getRangeAt(0).toString().trim()
        if (validate && !this.test(text)) {
            alert('Unfortunately we can\'t add this text')
            return
        }
        return text
    }

    /* Clean up all existing mark's */
    reset() {
        this._container.querySelectorAll(`mark[${this._attrId}]`)
            .forEach(e=>e.outerHTML = e.innerText)
        this._container.querySelectorAll(`.${this._classNav}`)
            .forEach(e=>e.remove())
    }

    /* Scroll to id */
    scrollToId(id) {
        if (!id) return

        const mark = this._container.querySelector(`mark[${this._attrId}="${String(id)}"]`)
        if (mark)
            mark.scrollIntoView(
                !(navigator.vendor||'').includes('Apple') ?
                    { behavior: 'smooth', block: 'center' } :
                    {}
            )
    }

    /* Add selection */
    addSelection(details={}) {
        if (typeof this.onAdd != 'function') return

        const text = this.getSelectionText(true)
        if (!text) return

        this.onAdd({ ...details, text })
        this._window.getSelection().removeAllRanges()
    }

    noteSelection() {
        if (!this.pro)
            return alert(`Annotations available in Raindrop.io Pro`)

        const text = this.getSelectionText(true)
        if (!text) return

        RdPrompt('Notes', '', note=>{
            if (!(note||'').trim()) return
            this.onAdd({ note, text })
            this._window.getSelection().removeAllRanges()
        })
    }

    copySelection() {
        this._document.execCommand('copy')
    }

    /* Wrap all canditates in <mark> tag */
    mark(ranges, { _id, color, note }) {
        ranges.forEach((range, index)=>{
            //create mark tag
            const mark = this._document.createElement('mark')
            mark.setAttribute(this._attrId, _id)
            if (color && color != 'yellow')
                mark.setAttribute('style', `${this._cssColorVar}: ${color}`)
            if (note)
                mark.setAttribute('title', note)
            mark.addEventListener('click', this._markClick)
            mark.addEventListener('contextmenu', this._markClick)

            //wrap text in mark tag
            range.surroundContents(mark)

            //note icon for last
            if (index == ranges.length-1 && note)
                mark.insertAdjacentHTML('beforeend', `<svg class="${this._classNoteIcon}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
                    <path d="M8 0a2 2 0 0 1 2 2v8L6 8H2a2 2 0 0 1-2-2V2C0 .9.9 0 2 0h6ZM2 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
                </svg>`)

            //nav
            if (this.nav && index == 0){
                const nav = this._document.createElement('a')
                nav.className = this._classNav
                nav.setAttribute(this._attrId, _id)                    
                const pos = range.getBoundingClientRect()
                nav.setAttribute('style', `
                    ${color && color != 'yellow' ? `${this._cssColorVar}: ${color};`:''}
                    top: ${100/this._document.documentElement.scrollHeight * (this._window.scrollY + pos.top - 10)}%;
                `.trim())
                nav.addEventListener('click', this._navClick)
                this._container.appendChild(nav)
            }

            //free up memory
            range.detach()
        })
    }

    /* Mark mouse event listener */
    _markClick(e) {
        if (e.currentTarget.parentElement.tagName == 'A') return

        e.preventDefault()
        e.stopPropagation()

        const mark = e.currentTarget
        const id = mark.getAttribute(this._attrId)
        const color = (getComputedStyle(mark).getPropertyValue(this._cssColorVar) || 'yellow').trim()
        const hasNote = mark.hasAttribute('title')

        this._activeMarkId = id
        this._tooltip.show(e.pageX+5, e.pageY+5, color, hasNote, true)
    }

    _markColorClick(color) {
        if (!this._activeMarkId) return

        this.onUpdate({
            _id: this._activeMarkId,
            color
        })
        this._tooltip.hide()
    }

    _markNoteClick() {
        if (!this.pro)
            return alert(`Annotations available in Raindrop.io Pro`)
        if (!this._activeMarkId) return

        const mark = this._container.querySelector(`[${this._attrId}="${this._activeMarkId}"]`)
        const note = mark.getAttribute('title') || ''

        RdPrompt('Notes', note, updated=>{
            if (note != updated)
                this.onUpdate({
                    _id: this._activeMarkId,
                    note: updated
                })
        })
        this._tooltip.hide()
    }

    _markCopyClick() {
        if (!this._activeMarkId) return

        const elements = this._container.querySelectorAll(`mark[${this._attrId}="${this._activeMarkId}"]`)
        if (elements.length) {
            const range = new Range()
            range.setStartBefore(elements[0])
            range.setEndAfter(elements[elements.length-1])
            RdCopyText(this._document, range.toString())
            range.detach()
        }
        
        this._tooltip.hide()
    }

    _markRemoveClick() {
        if (!this._activeMarkId) return

        const mark = this._container.querySelector(`[${this._attrId}="${this._activeMarkId}"]`)
        let confirmed = true
        if (mark.hasAttribute('title'))
            try { confirmed = confirm('Remove highlight?') } catch(e) {}
        if (!confirmed) return

        this.onRemove({ _id: this._activeMarkId })
        this._tooltip.hide()
    }

    /* Navigation event listener */
    _navClick(e) {
        e.preventDefault()
        e.stopPropagation()
        const nav = e.currentTarget
        const id = nav.getAttribute(this._attrId)
        this.scrollToId(id)
    }

    /* Styles */
    _initStyles() {
        if (this._container.querySelector(`#${this._idCss}`))
            return

        const style = this._document.createElement('style')
        style.id = this._idCss
        style.innerHTML = `
            mark[${this._attrId}], .${this._classNav}:before {
                background: var(${this._cssColorVar}, #ffee00) !important;
                user-select: none !important;
                -webkit-user-select: none !important;
            }
            mark[${this._attrId}] {
                background-image: linear-gradient(to bottom, rgba(255,255,255,.7) 0, rgba(255,255,255,.7) 100%) !important;
                color: black !important;
                -webkit-text-fill-color: black !important;
                cursor: pointer !important;
            }
            .${this._classNoteIcon} {
                display: inline !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;
                color: inherit !important;
                opacity: 0.5 !important;
                fill: currentColor !important;
                background: transparent !important;
                border-radius: 0 !important;
                margin-left: 0.3em !important;
                margin-right: 0.3em !important;
                width: 0.85em !important;
                height: 0.85em !important;
            }
            .${this._classNav} {
                position: fixed !important;
                right: 0px !important;
                padding: 10px !important;
                padding-right: 6px !important;
                cursor: pointer !important;
            }
            .${this._classNav}:before {
                content: '' !important;
                display: block !important;
                width: 10px !important;
                height: 10px !important;
                border-radius: 10px !important;
                box-shadow: 0 0 0 0.5px ButtonShadow, 0 5px 30px rgb(0 0 0 / 30%) !important;
                background-image: linear-gradient(to bottom, rgba(255,255,255,.2) 0, rgba(255,255,255,.2) 100%) !important;
            }
            .${this._classNav}:hover:before {
                background-image: linear-gradient(to bottom, rgba(255,255,255,.5) 0, rgba(255,255,255,.5) 100%) !important;
            }
            .${this._classNav}:active {
                filter: brightness(50%) !important;
            }
        `
        this._container.appendChild(style)
    }

    /* Find text nodes that match source text with match phrase */
    /* -> [Range] */
    _getRanges(nodes, source) {
        const sc = source.replace(/\s+/g, '')
        
        let merged = ''
        let pos = [] //[merged_char_pos: [node, char_pos]]
        for(var node of nodes) {
            //collect positions of each char
            for(const c in node.textContent) {
                const char = node.textContent[c]
                if (typeof char == 'string' && char.trim()) {
                    pos[merged.length] = [node, parseInt(c)]
                    merged+=char
                }
            }
        
            //check maybe match is already collected? get starting index
            const startIndex = merged.indexOf(sc)
            if (startIndex == -1) continue
        
            const matches = pos.slice(startIndex, startIndex + sc.length)
        
            //make candidates list with start end offset pos
            let candidates = new Map() //<node:[start,end]>
            matches.forEach((match, matchIndex)=>{
                let offset = candidates.get(match[0])||[-1, -1]
                //start offset
                if (offset[0]==-1)
                    offset[0] = match[1]
                //actual end offset
                if (matchIndex == matches.length-1)
                    offset[1] = match[1] + 1
                //default end offset
                else if (offset[1]==-1)
                    offset[1] = match[0].textContent.length
                candidates.set(match[0], offset)
            })
        
            //convert canditates to ranges
            return Array.from(candidates)
                .map(candidate=>{
                    const range = new Range()
                    range.setStart(candidate[0], candidate[1][0])
                    range.setEnd(candidate[0], candidate[1][1])
                    return range
                })
        }

        return []
    }

    /* Find all text nodes only */
    _getTextNodes(node) {
        if (!node || !node.childNodes) return
        const textNodes = []
        for(const child of node.childNodes)
            switch(child.nodeType) {
                case 1: //element node
                    if (
                        //child.offsetParent && //ignore invisible //BUGGGYYYYY!!!!
                        !child.hasAttribute(this._attrId) //ignore already marked elements
                    )
                        textNodes.push(...this._getTextNodes(child)); 
                    break
                case 3: //text node
                    textNodes.push(child)
                    break
            }
        return textNodes
    }
}


/* Auto-init for embeded pages */
let rdh
let rdhPlatform
let rdhEmbed = {
    enabled: false,
    wait: [],
    send: ()=>{},       //(type,payload)
    receive: ()=>{}    //(type,payload)
}

//extension inject script
if (
    (typeof chrome == 'object' && chrome.runtime && chrome.runtime.onMessage) || 
    (typeof browser == 'object' && browser.runtime && browser.runtime.onMessage)
) {
    const { runtime } = (typeof browser == 'object' ? browser : chrome)
    rdhEmbed.enabled = true

    rdhEmbed.send = (type, payload)=>
        runtime.sendMessage(null, { type, payload })

    const onMessage = ({ type, payload }, sender) => {
        if (sender.id != runtime.id) return //only messages from bg script of current extension allowed
        if (typeof type !== 'string') return
        if (typeof payload != 'undefined' && typeof payload != 'object') return
        rdhEmbed.receive(type, payload)
    }
    runtime.onMessage.removeListener(onMessage)
    runtime.onMessage.addListener(onMessage)
    rdhPlatform = 'extension'
}

//wkwebview
else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.rdh) {
    rdhEmbed.enabled = true

    rdhEmbed.send = (type, payload)=>
        window.webkit.messageHandlers.rdh.postMessage({ type, payload })

    window.rdhSend = (data)=>rdhEmbed.receive(data.type, data.payload)
    //webView.evaluateJavaScript("window.rdhSend({ type: 'RDH_CONFIG', payload: { enabled: true } })")
    rdhPlatform = 'wkwebview'
}

//electron
else if (typeof require == 'function') {
    rdhEmbed.enabled = true
    
    const { ipcRenderer } = require('electron')
    rdhEmbed.send = (type, payload) => ipcRenderer.sendToHost('RDH', { type, payload })

    const onMessage = (_, data) => rdhEmbed.receive(data.type, data.payload)
    ipcRenderer.removeListener('RDH', onMessage)
    ipcRenderer.on('RDH', onMessage)
    rdhPlatform = 'electron'
}

//react native
else if ('ReactNativeWebView' in window) {
    rdhEmbed.enabled = true

    rdhEmbed.send = (type, payload)=>
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }))

    window.ReactNativeWebViewSendMessage = (data)=>rdhEmbed.receive(data.type, data.payload)
    rdhPlatform = 'reactnative'
}

//iframe
else if (window.self !== window.top) {
    rdhEmbed.enabled = true

    rdhEmbed.send = (type, payload)=>
        window.parent.postMessage({ type, payload }, '*')

    const onMessage = ({ data, source }) => {
        if (source !== window.parent || typeof data !== 'object' || typeof data.type !== 'string') return
        if (typeof data.payload != 'undefined' && typeof data.payload != 'object') return
        rdhEmbed.receive(data.type, data.payload)
    }
    window.removeEventListener('message', onMessage)
    window.addEventListener('message', onMessage)
    rdhPlatform = 'iframe'
}

if (rdhEmbed.enabled){
    rdhEmbed.receive = (type, payload)=>{
        //document is not ready yet, add to wait list
        if (!rdh){
            rdhEmbed.wait.push({ type, payload })
            return
        }

        switch(type) {
            case 'RDH_APPLY':
                rdh.apply(payload)
            break

            case 'RDH_CONFIG':
                if (typeof payload.enabled == 'boolean')
                    rdh.enabled = payload.enabled
                if (typeof payload.pro == 'boolean')
                    rdh.pro = payload.pro
                if (typeof payload.nav == 'boolean')
                    rdh.nav = payload.nav
            break

            case 'RDH_SCROLL':
                rdh.scrollToId(payload._id)
            break

            case 'RDH_ADD_SELECTION':
                rdh.addSelection(payload)
            break

            case 'RDH_NOTE_SELECTION':
                rdh.noteSelection()
            break
        }
    }

    function RdhOnDocumentLoad() {
        function Init() {
            window.removeEventListener('DOMContentLoaded', RdhOnDocumentLoad)

            rdh = new RdHighlight(document.body)
            rdh.onUpdate = details => rdhEmbed.send('RDH_UPDATE', details)
            rdh.onRemove = details => rdhEmbed.send('RDH_REMOVE', details)
            rdh.onAdd = details => rdhEmbed.send('RDH_ADD', details)

            //repeat waiting messages
            if (rdhEmbed.wait.length) {
                for(const { type, payload } of rdhEmbed.wait)
                    rdhEmbed.receive(type, payload)
                rdhEmbed.enabled = []
            }

            rdhEmbed.send('RDH_READY', { url: location.href })
        }

        //give some time to do other scripts
        clearTimeout(window._rh_delay)
        window._rh_delay = setTimeout(Init, 150)
    }
    
    if (document.readyState == 'loading') {
        window.removeEventListener('DOMContentLoaded', RdhOnDocumentLoad)
        window.addEventListener('DOMContentLoaded', RdhOnDocumentLoad)
    } else
        RdhOnDocumentLoad()
}