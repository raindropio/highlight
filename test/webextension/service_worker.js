const browser = globalThis.browser || globalThis.chrome

let highlights = []

browser.runtime.onMessage.addListener(({ type, payload }, sender)=>{
    console.log(type, payload)
    if (sender.id != browser.runtime.id || typeof type != 'string') return

    switch(type) {
        case 'RDH_READY':
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'RDH_CONFIG',
                payload: {
                    enabled: true, //highlights.length ? true : false,
                    nav: true,
                    pro: false
                }
            })
            browser.tabs.sendMessage(sender.tab.id, {
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

            browser.tabs.sendMessage(sender.tab.id, {
                type: 'RDH_APPLY',
                payload: highlights
            })
        break

        case 'RDH_REMOVE':
            highlights = highlights.filter(({ _id }) => _id != payload._id)
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'RDH_APPLY',
                payload: highlights
            })
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