//also evaluated during ssr
const nav = globalThis.navigator

export const mobile = 
    //@ts-ignore
    nav?.userAgentData?.mobile ? true :
    /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(nav?.userAgent ?? '')

export const ios = /iPhone OS/.test(nav?.userAgent ?? '')