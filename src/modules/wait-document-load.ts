export default function() {
    return new Promise<void>(res=>{
        function OnDOMContentLoaded() {
            window.removeEventListener('DOMContentLoaded', OnDOMContentLoaded)
            res()
        }
    
        if (document.readyState == 'loading') {
            window.removeEventListener('DOMContentLoaded', OnDOMContentLoaded)
            window.addEventListener('DOMContentLoaded', OnDOMContentLoaded, { once: true })
        } else
            res()
    })
}