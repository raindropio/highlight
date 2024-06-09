export default function() {
    //@ts-ignore
    if (navigator?.userAgentData?.mobile)
        return true

    return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)
}