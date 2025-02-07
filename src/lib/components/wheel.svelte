<script lang="ts">
    let { progress = $bindable() } = $props();
    let normalizedProgress = $derived(Math.min(100, Math.max(0, progress * 100)));
    let strokeDashOffset = $derived(283 - (283 * normalizedProgress) / 100);
    let progressColor = $derived(normalizedProgress === 100 ? '#4CAF50' : '#2196F3');
</script>
<div class="wheel-container">
    <svg class="progress-wheel" viewBox="0 0 100 100">
        <circle
            class="background"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e6e6e6"
            stroke-width="10"
        />
        <circle
            class="progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={progressColor}
            stroke-width="10"
            stroke-dasharray="283"
            stroke-dashoffset={strokeDashOffset}
            transform="rotate(-90 50 50)"
        />
        <text
            x="50"
            y="50"
            text-anchor="middle"
            dominant-baseline="middle"
            class="progress-text"
        >
            {Math.round(normalizedProgress)}%
        </text>
    </svg>
</div>
<style>
    .wheel-container {
        width: 100px;
        height: 100px;
    }

    .progress-wheel {
        width: 100%;
        height: 100%;
    }

    .progress {
        transition: stroke-dashoffset 0.3s ease;
    }

    .progress-text {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 20px;
        fill: #333;
    }
</style>
