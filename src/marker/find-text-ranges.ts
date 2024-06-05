const blacklistedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'OPTION']

export default function(texts: string[]) {
    const state: { start: [Node, number]|null, end: [Node, number]|null, shift: number }[] = texts.map(()=>({ start: null, end: null, shift: 0 }))
    const ranges: Range[][] = texts.map(() => [])

    const treeWalker = document.createTreeWalker(
        document.body, 
        //only text nodes
        NodeFilter.SHOW_TEXT,
        //skip blacklisted tags
        (node) =>
            //@ts-ignore
            blacklistedTags.includes(node.parentNode?.tagName) || !node.parentNode?.checkVisibility() ? 
                NodeFilter.FILTER_REJECT : 
                NodeFilter.FILTER_ACCEPT
    )

    let node: Node | null
    while (node = treeWalker.nextNode()) {
        if (!node?.nodeValue) continue

        //iterate over text node chars
        for (let i = 0; i < node.nodeValue.length; i++) {
            const char = node.nodeValue[i].toLocaleLowerCase().trim()

            //skip spaces
            if (!char) continue

            //search all texts simultaneously
            texts.forEach((text, j) => {
                //skip spaces
                while (text[state[j].shift] && !text[state[j].shift].trim()) state[j].shift++;
                let matched = text[state[j].shift]?.toLocaleLowerCase() === char

                if (matched) {
                    //start (first char match)
                    if (!state[j].shift) state[j].start = [node!, i];
                    else state[j].end = [node!, i];

                    //move to next char
                    state[j].shift++;
                }

                //end (enire text match)
                if (state[j].shift >= text.length) {
                    const range = document.createRange()
                    range.setStart(state[j].start![0], state[j].start![1])
                    range.setEnd(state[j].end![0], state[j].end![1]+1)
                
                    if (
                        !range.collapsed && 
                        range.commonAncestorContainer.parentElement?.checkVisibility()
                    )
                        ranges[j].push(range)
                    else
                        range.detach()

                    //complete
                    matched = false
                }

                //mismatch or complete, restart to find next match
                if (!matched) {
                    state[j].shift = 0
                    state[j].start = null
                    state[j].end = null
                }
            })
        }
    }

    return ranges;
}