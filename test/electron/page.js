let highlights = [
    {
        _id: 'asdas9329',
        text: `I spend all day long slinging URLs around. Mostly, when I copy and paste a URL it’s treated as a string of characters. But you and I know that a URL is heavy. A URL`,
        note: 'some note',
        color: 'blue'
    },
    {
        _id: '23dsfsdf',
        text: 'What Electric Tables Could Be'
    }
]

function scrollToLast() {
    const webview = document.getElementById('webview')
    webview.send('RDH', {
        type: 'RDH_SCROLL',
        payload: {
            _id: highlights[highlights.length-1]._id
        }
    })
}

window.onload = ()=>{
    const webview = document.getElementById('webview')

    webview.addEventListener('ipc-message', ({ channel, args=[] }) => {
        if (channel != 'RDH') return
        const [{ type, payload }] = args

        switch(type) {
            case 'RDH_READY':
                webview.send('RDH', {
                    type: 'RDH_CONFIG',
                    payload: {
                        enabled: true,
                        nav: true,
                        pro: true
                    }
                })
                webview.send('RDH', {
                    type: 'RDH_APPLY',
                    payload: highlights
                })
            break

            case 'RDH_UPDATE':
                let i = highlights.findIndex(({ _id }) => _id == payload._id)
                if (i != -1){
                    for(const [key,val] of Object.entries(payload))
                        highlights[i][key] = val
                }

                webview.send('RDH', {
                    type: 'RDH_APPLY',
                    payload: highlights
                })
            break

            case 'RDH_REMOVE':
                highlights = highlights.filter(({ _id }) => _id != payload._id)
                webview.send('RDH', {
                    type: 'RDH_APPLY',
                    payload: highlights
                })
            break

            case 'RDH_ADD':
                highlights.push({
                    ...payload,
                    _id: String(new Date().getTime())
                })
                webview.send('RDH', {
                    type: 'RDH_APPLY',
                    payload: highlights
                })
            break
        }
    })
}