<script lang="ts">
    import Wheel from '$lib/components/wheel.svelte';

    const apiUrl = "https://api.bfl.ml/v1/flux-pro";
    const responseUrl = "https://api.bfl.ml/v1/get_result";
    
    let img: HTMLImageElement;
    let prompt = $state("");
    let imageReady = $state(false);
    let progress = $state(-1.0);

    let imageWidth = $state("1024");
    let imageHeight = $state("768");
    let promptUpsampling = $state(false);
    let seed = $state(0);
    let safetyTolerance = $state(0);
    let outputFormat = $state("jpeg");

    async function fetchResultWithRetry(taskId: string, apiKey: string) {
        const task = await fetch(
            `${responseUrl}?id=${taskId}`, {
                headers: {
                    "X-Key": apiKey,
                }
            }
        );
        const gen = await task.json();
        console.log(gen);
        if (gen.status === "Pending") {
            progress = gen.progress;
            setTimeout(fetchResultWithRetry, 1000, taskId, apiKey);
        } else if (gen.status === "Ready") {
            img.src = gen.result.sample;
            imageReady = true;
        }
    }

    async function submit() {
        imageReady = false;
        progress = -1;
        const result = await fetch("/api/bfl", { method: "POST" });
        const { apiKey } = await result.json();
        const task = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Key": apiKey,
            },
            body: JSON.stringify({
                "prompt": prompt,
                "width": parseInt(imageWidth),
                "height": parseInt(imageHeight),
            })
        });
        const taskMetadata = await task.json();
        await fetchResultWithRetry(taskMetadata.id, apiKey);
    }
</script>

<div class="container">
    <h1>Prompt</h1>
    <!-- svelte-ignore event_directive_deprecated -->
    <form on:submit|preventDefault={submit} class="prompt-form">
        <label>
            Type a description of an image to generate
            <input bind:value={prompt}
                name="query"
                placeholder="e.g. a cat with a hat" 
                autocomplete="off"/>
        </label>
        <fieldset class="image-settings">
            <legend>Image Settings</legend>
            <div class="settings-grid">
                <div class="settings-column">
                    <label>
                        Width: {imageWidth}px
                        <input 
                            bind:value={imageWidth} 
                            type="range" 
                            min="256" 
                            max="1440" 
                            step="32">
                        <div class="range-values">
                            <span>256</span>
                            <span>1440</span>
                        </div>
                    </label>

                    <label>
                        Height: {imageHeight}px
                        <input 
                            bind:value={imageHeight} 
                            type="range" 
                            min="256" 
                            max="1440" 
                            step="32">
                        <div class="range-values">
                            <span>256</span>
                            <span>1440</span>
                        </div>
                    </label>

                    <label>
                        Safety tolerance:
                        <input 
                            type="range" 
                            bind:value={safetyTolerance} 
                            min="0" 
                            max="6" 
                            step="1">
                        <div class="range-values">
                            <span>Strict (0)</span>
                            <span>Lenient (6)</span>
                        </div>
                    </label>
                </div>

                <div class="settings-column">
                    <label class="checkbox-label">
                        <input 
                            type="checkbox" 
                            bind:checked={promptUpsampling}>
                        Prompt upsampling
                    </label>

                    <label>
                        Seed (optional):
                        <input 
                            type="number" 
                            bind:value={seed} 
                            placeholder="e.g. 42">
                    </label>

                    <label>
                        Output format:
                        <select bind:value={outputFormat}>
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                        </select>
                    </label>
                </div>
            </div>
        </fieldset>
        <button 
            type="submit" class="submit-button" 
            disabled={prompt.length < 5 || (progress > 0 && progress < 1)}>
            Submit
        </button>
    </form>
    {#if !imageReady && progress > 0}
        <div class="wheel-wrapper">
            <Wheel bind:progress={progress} />
        </div>
    {/if}
    <img bind:this={img} alt="generated" class={["generated-image", imageReady ? "visible" : "hidden"]}/>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            'Open Sans',
            'Helvetica Neue',
            sans-serif;
    }

    .wheel-wrapper {
        display: flex;
        justify-content: center;
        margin: 2rem 0;
    }

    .generated-image.visible {
        display: block;
    }

    .generated-image.hidden {
        display: none;
    }

    .submit-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
        opacity: 0.5;
        pointer-events: none;
        color: #666;
        border: 1px solid #666;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        font-size: 1rem;
    }

    .prompt-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 2rem 0;
    }

    .image-settings {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
        background-color: #f9f9f9;
    }

    .settings-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .settings-column {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .checkbox-label {
        flex-direction: row;
        align-items: center;
        gap: 0.75rem;
    }

    .checkbox-label input[type="checkbox"] {
        width: auto;
        margin: 0;
    }

    input, select {
        width: 100%;
        padding: 0.5rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    input[type="range"] {
        margin: 0.5rem 0;
    }

    .range-values {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: #666;
    }

    button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        align-self: flex-start;
    }

    button:hover {
        background-color: #45a049;
    }

    .generated-image {
        max-width: 100%;
        margin-top: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
</style>