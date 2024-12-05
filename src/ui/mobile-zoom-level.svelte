<script lang="ts">
    let { children } = $props()
    let zoomLevel = $state(1)

    $effect(() => {
        function updateZoomLevel() {
            zoomLevel = 1/(window.visualViewport?.scale||1)
        }
        window.visualViewport?.addEventListener('resize', updateZoomLevel)
        return () => window.visualViewport?.removeEventListener('resize', updateZoomLevel)
    })
</script>

<div
    style:--mobile-zoom-level="{zoomLevel}">
    {@render children?.()}
</div>

<style>
    div {
        display: contents;
    }
</style>