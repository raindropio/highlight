class RdHotkey {
    _parent = null //RdHighlight

    constructor(parent) {
        this._parent = parent

        //bind
        this._onKeyDown = this._onKeyDown.bind(this)

        //add event listeners
        this._parent._window.removeEventListener('keydown', this._onKeyDown)
        this._parent._window.addEventListener('keydown', this._onKeyDown)
    }

    _onKeyDown(e) {
        if (e.code == 'KeyS' && e.altKey && e.shiftKey){
            e.preventDefault()
            e.stopPropagation()
            this._parent.addSelection()
        }
    }
}

class RdSelect {
    _parent = null //RdHighlight
    _menu = null

    _colors = ['yellow', 'blue', 'green', 'red']

    _idMenu = 'rdhm'
    _classButtonHighligh = 'rdhbh'
    _idButtonNote = 'rdhbn'
    _idCss = 'rdhss'
    _attrColor = 'data-rdhsc'

    constructor(parent) {
        this._parent = parent

        //init
        this._initStyles()
        this._initMenu()

        //bind
        this.render = this.render.bind(this)
        this._onSelectionChange = this._onSelectionChange.bind(this)

        //add event listeners
        this._parent._document.removeEventListener('selectionchange', this._onSelectionChange)
        this._parent._document.addEventListener('selectionchange', this._onSelectionChange)
    }

    render() {
        const selection = this._parent._window.getSelection()

        //remove if no selection yet
        if (!this._parent.enabled || !selection.toString().trim()){
            if (this._menu) this._menu.setAttribute('hidden', 'true')
            return
        }

        //position menu
        const { x, y, width } = selection.getRangeAt(0).getBoundingClientRect()
        let left = this._parent._window.scrollX+x+width
        let top = this._parent._window.scrollY+y-32
        if (this._parent._window.outerWidth <= left + 64) left = left - 64
        if (this._parent._window.scrollY > top) top = this._parent._window.scrollY
        this._menu.setAttribute('style', `left: ${left}px !important; top: ${top}px !important;`)
        this._menu.removeAttribute('hidden')
    }

    /* User changed document selection event */
    _onSelectionChange() {
        clearTimeout(this._selectTimeout)
        this._selectTimeout = setTimeout(
            this.render,
            this._parent._window.getSelection().isCollapsed ? 0 : 250
        )
    }

    /* Buttons */
    _addClick(e) {
        e.preventDefault()
        this._parent.addSelection({
            color: e.currentTarget.getAttribute(this._attrColor) || ''
        })
    }

    _addNoteClick(e) {
        e.preventDefault()
        this._parent.noteSelection()
    }

    /* Menu */
    _initMenu() {
        if (this._menu)
            return

        //create menu
        this._menu = this._parent._document.createElement('menu')
        this._menu.id = this._idMenu
        this._menu.setAttribute('hidden', 'true')
        this._menu.innerHTML = `
            <li title="Add highlight...">
                ${this._colors.map(color=>`
                    <button class="${this._classButtonHighligh}" ${this._attrColor}="${color}"></button>
                `).join('')}
            </li>
            
            <button id="${this._idButtonNote}" title="Add note...">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <g fill-rule="evenodd">
                        <path fill-rule="nonzero" d="M15 1a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3v1.9a1 1 0 0 1-1.6.7L10.2 16H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3h11Zm0 1H4c-1 0-2 .8-2 1.9V13c0 1 .8 2 1.9 2h6.7l3.4 2.9V15h1c1 0 2-.8 2-1.9V4c0-1-.8-2-1.9-2H15Z"/>
                        <path d="M10 5v3h3v1h-3v3H9V9H6V8h3V5h1Z"/>
                    </g>
                </svg>
            </button>
        `
        this._parent._container.appendChild(this._menu)

        //add click events
        this._menu.querySelectorAll(`.${this._classButtonHighligh}`)
            .forEach(e=>{
                this._addClick = this._addClick.bind(this)
                e.removeEventListener('click', this._addClick)
                e.addEventListener('click', this._addClick)
            })

        this._menu.querySelectorAll(`#${this._idButtonNote}`)
            .forEach(e=>{
                this._addNoteClick = this._addNoteClick.bind(this)
                e.removeEventListener('click', this._addNoteClick)
                e.addEventListener('click', this._addNoteClick)
            })
    }

    /* Styles */
    _initStyles() {
        if (this._parent._container.querySelector(`#${this._idCss}`))
            return

        const style = this._parent._document.createElement('style')
        style.id = this._idCss
        style.innerHTML = `
            #${this._idMenu} {
                position: absolute !important;
                display: flex !important;
                
                z-index: 99999999 !important;
                background-color: transparent !important;
                margin: 4px !important;
                width: auto !important;
                height: auto !important;
                left: 0 !important; top: 0 !important;
                box-shadow: none !important;
                animation: none !important;
                transition: opacity .15s ease-in-out !important;
                border: 0 !important;
                padding: 0 !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
            }
            #${this._idMenu}, #${this._idMenu}:after {
                border-radius: 6px !important;
            }
            #${this._idMenu}:after {
                content: '' !important;
                position: absolute !important;
                left: 0 !important; top: 0 !important; right: 0 !important; bottom: 0 !important;
                z-index: -1 !important;
                background-color: Menu !important;
                box-shadow: 0 0 0 0.5px GrayText, 0 5px 30px rgb(0 0 0 / 30%) !important;
            }
            @supports (backdrop-filter: blur(20px)) {
                #${this._idMenu}:after { opacity: .6 !important; }
            }
            @supports (-webkit-backdrop-filter: blur(20px)) {
                #${this._idMenu}:after {
                    opacity: .6 !important;
                    background-color: Window !important;
                }
            }
            #${this._idMenu}, #${this._idMenu} * {
                box-sizing: border-box !important;
                user-select: none !important;
                -webkit-user-select: none !important;
            }
            #${this._idMenu}[hidden] {
                pointer-events: none !important;
                opacity: 0 !important;
            }

            /* Dropdown */
            #${this._idMenu} > li {
                border-top-left-radius: 6px !important;
                display: block !important;
                max-height: 32px !important;
                transition: max-height .15s ease-in !important;
                transition-delay: .25s !important;
                overflow: hidden !important;
            }

            #${this._idMenu} > li:hover:not(:active) {
                max-height: ${this._colors.length * 32}px !important;
            }

            /* Buttons */
            #${this._idMenu} button {
                cursor: pointer !important;
                color: WindowText !important;
                width: 32px !important;
                height: 32px !important;
                appearance: none !important;
                background: transparent !important;
                border: 0 !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: background .1s linear, color .1s linear !important;
                filter: none !important;
            }
            #${this._idMenu} button:hover {
                background: rgba(100,100,100,.3) !important;
            }
            #${this._idMenu} button:active {
                filter: brightness(50%) !important;
            }

            #${this._idMenu} * {
                fill: currentColor !important;
            }

            /* Color */
            #${this._idMenu} button[${this._attrColor}]:before {
                content: '' !important;
                display: block !important;
                width: 18px !important;
                height: 18px !important;
                border-radius: 18px !important;
                box-shadow: inset 0 0 0 0.5px rgba(0,0,0,.4) !important;
                background-image: linear-gradient(to bottom, rgba(255,255,255,.5) 0, rgba(255,255,255,.4) 100%) !important;
            }
            ${this._colors.map(color=>`
                #${this._idMenu} button[${this._attrColor}=${color}]:before { background-color: ${color} !important; }
            `).join('')}
        `
        this._parent._container.appendChild(style)
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
    onEdit = ()=>{} //(id)=>{}
    onAdd = ()=>{} //({text,color,note})=>{}

    constructor(container) {
        this._container = container
        this._document = this._container.ownerDocument
        this._window = this._document.defaultView

        //init select menu / hotkeys
        this._select = new RdSelect(this)
        this._hotkey = new RdHotkey(this)

        //bind
        this._markClick = this._markClick.bind(this)
        this._navClick = this._navClick.bind(this)
    }

    /* Mark highlight array of { text, color, _id } */
    apply(highlights=[]) {
        this.reset()
        this._initStyles()

        for(const highlight of highlights)
            this.mark(
                this._getCanditates(
                    this._getTextNodes(this._container),
                    highlight.text
                ),
                highlight
            )
    }

    /* Test */
    test(text) {
        const nodes = this._getTextNodes(this._container)
        const candidates = this._getCanditates(nodes, text)
        return candidates.size > 0
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
        const mark = this._container.querySelector(`mark[${this._attrId}="${id}"]`)
        mark.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        })
    }

    /* Add selection */
    addSelection(details={}) {
        if (typeof this.onAdd != 'function') return

        const selection = this._window.getSelection()
        const text = selection.toString().trim()

        if (!this.test(text)) {
            alert('⚠️ Unfortunately we can\'t add this text')
            return
        }
        
        this.onAdd({ ...details, text })
        selection.removeAllRanges()
    }

    noteSelection() {
        if (!this.pro)
            return alert(`Notes/annotations only available in Pro plan`)

        const note = prompt('Add note', '')||''
        if (note.trim())
            this.addSelection({
                note
            })
    }

    copySelection() {
        this._document.execCommand('copy')
    }

    /* Wrap all canditates in <mark> tag */
    mark(candidates, { _id, color, note }) {
        let i = 0
        
        for(const [node, phrase] of candidates){
            //create text range to be highlighted
            var range = new Range()
            range.setStart(
                node, 
                i == 0 ? 
                    Math.max(node.textContent.indexOf(phrase), 0) : 
                    0
            )
            range.setEnd(
                node, 
                i == candidates.size-1 ? 
                    Math.min(node.textContent.lastIndexOf(phrase) + phrase.length, node.textContent.length) : 
                    node.textContent.length
            )

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
            if (i == candidates.size-1 && note)
                mark.insertAdjacentHTML('beforeend', `<svg class="${this._classNoteIcon}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
                    <path d="M8 0a2 2 0 0 1 2 2v8L6 8H2a2 2 0 0 1-2-2V2C0 .9.9 0 2 0h6Zm0 1H2a1 1 0 0 0-1 .9V6c0 .5.4 1 .9 1h4.3L9 8.4V2c0-.5-.4-1-.9-1H8Z"/>
                </svg>`)

            //nav
            if (this.nav && i == 0){
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

            i++
        }
    }

    /* Mark click event listener */
    _markClick(e) {
        if (typeof this.onEdit != 'function') return
        e.preventDefault()
        e.stopPropagation()
        if (e.target.tagName == 'A') return
        const mark = e.currentTarget
        const id = mark.getAttribute(this._attrId)
        this.onEdit(id)
    }

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
                cursor: pointer !important;
            }
            mark[${this._attrId}][title] {
                cursor: context-menu !important;
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
    /* -> Map<node:phrase> */
    _getCanditates(nodes, source) {
        let candidates = new Map()
        let carret = 0

        for(const node of nodes){
            let matches = 0

            //clear candidates if current node includes full phrase
            //otherwise start node can be invalid
            if (
                carret &&
                node.textContent.includes(source.substring(0, carret+1).trim())
            ) {
                carret = 0
                candidates.clear()
            }

            do {
                //ignore any whitespace
                if (!source[carret].trim()) {
                    matches++
                    carret++
                    continue
                }

                const phrase = source.substring(carret-matches, carret+1)

                //phrase included
                if (node.textContent.includes(phrase)){
                    matches++
                    carret++
                    candidates.set(node, phrase)
                }
                //not found
                else {
                    if (
                        !matches &&
                        carret < source.length
                    ) {
                        carret = 0
                        candidates.clear()
                    }
                    break
                }
            } while (carret < source.length)

            if (carret >= source.length)
                break
        }

        return candidates
    }

    /* Find all text nodes only */
    _getTextNodes(node) {
        if (!node || !node.childNodes) return
        const textNodes = []
        for(const child of node.childNodes)
            switch(child.nodeType) {
                case 1: //element node
                    if (child.offsetParent)
                        textNodes.push(...this._getTextNodes(child)); 
                    break
                case 3: //text node
                    if (child.textContent.trim())
                        textNodes.push(child)
                    break
            }
        return textNodes
    }
}


/* Auto-init for embeded pages */
window.onload = function() {
    //generic event handlers
    let embeded = false
    let send = ()=>{}       //(action,payload)
    let receive = ()=>{}    //(action,payload)

    //electron
    if (typeof require == 'function') {
        embeded = true
        
        const { ipcRenderer } = require('electron')
        send = (action, payload) => ipcRenderer.sendToHost('rdh', { action, payload })
        ipcRenderer.on('rdh', (_, data) => receive(data.action, data.payload))
    }
    //iframe
    else if (window.self !== window.top) {
        embeded = true

        send = (action, payload)=>
            window.parent.postMessage({ action, payload }, '*')

        window.addEventListener('message', ({ data, source }) => {
            if (source !== window.parent || typeof data !== 'object' || typeof data.action !== 'string') return
            if (typeof data.payload != 'undefined' && typeof data.payload != 'object') return
            receive(data.action, data.payload)
        })
    }

    //init
    if (!embeded) return

    const rdh = new RdHighlight(document.body)
    rdh.onEdit = (_id) => send('rdh-edit', { _id })
    rdh.onAdd = (details) => send('rdh-add', details)

    receive = (action, payload)=>{
        switch(action) {
            case 'rdh-apply':
                rdh.apply(payload)
            break

            case 'rdh-config':
                if (typeof payload.enabled == 'boolean')
                    rdh.enabled = payload.enabled
                if (typeof payload.pro == 'boolean')
                    rdh.pro = payload.pro
                if (typeof payload.nav == 'boolean')
                    rdh.nav = payload.nav
            break

            case 'rdh-scroll':
                rdh.scrollToId(payload._id)
            break
        }
    }

    //ready
    send('rdh-ready')
}