export const mobile = 
    //@ts-ignore
    navigator?.userAgentData?.mobile ? true :
    /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)

export const ios = /iPhone OS/.test(navigator.userAgent)