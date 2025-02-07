<script lang="ts">
	import { enhance } from "$app/forms";
</script>
<h1>Setup</h1>
<p>Store the key to access models.</p>
<form method="post" use:enhance>
    <label>
        API key:
        <input name="apiKey" type="password" placeholder="Copy-paste your key here"/>
    </label>
    <button>Store</button>
</form>
<style>
</style>