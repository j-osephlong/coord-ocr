<script setup lang="ts">
import ResearchCheckerApp from './components/ResearchCheckerApp.vue';


</script>

<template>
	<div id="body">
		<nav>
			<h2>DMSE Web Utilities</h2>
		</nav>
		<div id="sections">
			<div class="card">
				<h3>Manhole Solver</h3>
				<a href="https://j-osephlong.github.io/manhole-solver/" target="_blank">Click to Open</a>
			</div>
			<div class="card">
				<h3>Plan Coordinate Table OCR</h3>
				<a href="https://j-osephlong.github.io/coord-ocr/" target="_blank">Click to Open</a>
			</div>
			<div class="card">
				<h3>Research Checker</h3>
				<ResearchCheckerApp />
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
#body {
	width: 100%;

	nav {
		padding: 16px 0px;
		h2 {
			font-weight: 600;
		}
	}
}

#sections {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
