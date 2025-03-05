export default function throttle<T extends (...args: any) => any>(callee: T, timeout: number) {
    let timer: any = null
    let firstTime = true

    return function perform(...args: any) {
        if (timer) return
        
        if (firstTime) {
            callee(...args)
            firstTime = false
        } else {
            clearTimeout(timer)
            timer = setTimeout(() => {
                callee(...args)
                clearTimeout(timer)
                timer = null
            }, timeout)
        }
    }
}