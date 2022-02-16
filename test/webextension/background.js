const browser = window.browser || window.chrome

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

browser.runtime.onMessage.addListener(({ type, payload }, sender)=>{
    if (sender.id != browser.runtime.id || typeof type != 'string') return

    switch(type) {
        case 'RDH_READY':
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'RDH_CONFIG',
                payload: {
                    enabled: true,
                    nav: true,
                    pro: true
                }
            })
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'RDH_APPLY',
                payload: highlights
            })
        break

        case 'RDH_EDIT':
            if (confirm(`Remove ${payload._id}?`)){
                highlights = highlights.filter(({ _id }) => _id != payload._id)
                browser.tabs.sendMessage(sender.tab.id, {
                    type: 'RDH_APPLY',
                    payload: highlights
                })
            }
        break

        case 'RDH_ADD':
            highlights.push({
                ...payload,
                _id: String(new Date().getTime())
            })
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'RDH_APPLY',
                payload: highlights
            })
        break
    }
})

const highlighCurrentPageSelection = function() {
    function addSelection() {
        browser.tabs.query({active: true, currentWindow: true}, ([tab])=>{
            browser.tabs.sendMessage(tab.id, {
                type: 'RDH_ADD_SELECTION'
            }, done=>{
                if (!done && confirm('Please reload page to start using highlights'))
                    browser.tabs.reload()
            })
        })
    }

    browser.permissions.contains({
        permissions: ['tabs']
    }, have=>{
        if (have)
            addSelection()
        else
            browser.permissions.request({
                permissions: ['tabs']
            }, granted=>{
                if (granted)
                    addSelection()
            })
    })
}

//hotkeys
browser.commands.onCommand.addListener(command=>{
    switch(command) {
        case 'highlight':
            highlighCurrentPageSelection()
        break
    }
})

//contextmenus
browser.contextMenus.create({
    id: "highlight",
    title: "Add highlight",
    contexts: ["selection"]
})

browser.contextMenus.onClicked.addListener(function(info) {
    switch (info.menuItemId) {
        case "highlight":
            highlighCurrentPageSelection()
        break;
    }
})