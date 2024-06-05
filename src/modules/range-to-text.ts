export default function(range?: Range) {
    if (!range)
        return ''

    var div: HTMLDivElement|undefined = document.createElement('div')
    div.appendChild( range.cloneContents().cloneNode(true) )
    document.body.appendChild(div)
    
    const text = div.innerText

    document.body.removeChild(div)
    div = undefined

    return text
}