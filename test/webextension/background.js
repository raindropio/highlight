const browser = window.browser || window.chrome

let highlights = []

browser.runtime.onMessage.addListener(({ type, payload }, sender)=>{
    if (sender.id != browser.runtime.id || typeof type != 'string') return

    switch(type) {
        case 'RDH_READY':
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'RDH_CONFIG',
                payload: {
                    enabled: highlights.length ? true : false,
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
                type: 'RDH_CONFIG',
                payload: {
                    enabled: true
                }
            })
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'RDH_APPLY',
                payload: highlights
            })
        break
    }
})

//hotkeys
browser.commands.onCommand.addListener(command=>{
    switch(command) {
        case 'highlight':
            browser.permissions.request({ permissions: ['tabs'] }, granted=>{
                if (!granted) {
                    alert('Permission is required')
                } else {
                    browser.tabs.query({ active: true, currentWindow: true }, ([tab])=>{
                        browser.tabs.sendMessage(tab.id, {
                            type: 'RDH_ADD_SELECTION'
                        })
                    })
                }
            })
        break
    }
})

//contextmenus
browser.contextMenus.create({
    id: "highlight",
    title: "Add highlight",
    contexts: ["selection"]
})

browser.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
        case "highlight":
            browser.permissions.request({ permissions: ['tabs'] }, granted=>{
                if (!granted) {
                    alert('Permission is required')
                } else {
                    browser.tabs.sendMessage(tab.id, {
                        type: 'RDH_ADD_SELECTION'
                    })
                }
            })
        break;
    }
})