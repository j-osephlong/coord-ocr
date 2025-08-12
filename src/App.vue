<script setup lang="ts">
import { onKeyDown, onKeyStroke, onKeyUp, useDebounceFn, useDropZone, useLocalStorage, useObjectUrl } from '@vueuse/core';
import { computed, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { getDocument } from 'pdfjs-dist';
import "pdfjs-dist/build/pdf.worker.mjs";
import Cropper, { CropperHandle } from 'cropperjs';
import { worker as ocrWorker, recognizeBlob } from './ocr';
import { assert } from './utils';
import SelectionPreview from './components/SelectionPreview.vue';
import OCRControls from './components/OCRControls.vue';
import SelectionEditor from './components/SelectionEditor.vue';
import DropZone from './components/DropZone.vue';
import Clipboard from './components/Clipboard.vue';
import { type FormatConfig, reformatText } from './reformat';

const cropper = shallowRef<Cropper>()
const cropperHandle = ref<CropperHandle>()
const fileName = ref<string>("")
const ocrOutput = ref<string>("")
const clipboardText = ref<string>("")
const selectionBlob = ref<Blob | null>(null)
const formatConfig = useLocalStorage<FormatConfig>("tablocr.format-config", {
    format: "P,E,N,D",
	idColumnName: "P",
	descriptionColumnName: "D",
	numberColumnNames: "E,N",
    raw: false,
})
watch(fileName, (name) => formatConfig.value.appendToDescription = name)

function setupCropper(canvas: HTMLCanvasElement) {
	cropper.value = new Cropper(canvas)
	const handle = cropper.value?.container.querySelector('cropper-handle')
	assert(handle)
	cropperHandle.value = handle as CropperHandle
	const selection = cropper.value.getCropperSelection()
	assert(selection)
	selection.zoomable = false
	setTimeout(() => selection.$clear(), 0)
}

function onImageLoaded(canvas: HTMLCanvasElement, name?: string) {
	// setup or reload cropper
	if (!cropper.value) {
		setupCropper(canvas)
	} else {
		cropper.value.getCropperImage()!.$image.src = canvas.toDataURL("image/png")
	}
	fileName.value = name?.split(".")[0] ?? ""
}

function runIfNotInputFocused(f: () => any) {
	const activeElmTag = document.activeElement?.tagName.toLowerCase()
	if (activeElmTag != "textarea" && activeElmTag != "input")
		f()
}

async function rotateClockwiseBy90() {
	const image = cropper.value?.getCropperImage()
	assert(image)
	image.$rotate(90 * Math.PI / 180)
	image.$center('contain')
}
onKeyStroke("r", () => {
	runIfNotInputFocused(rotateClockwiseBy90)
})

async function changeCropperTool(action: string) {
	assert(cropper.value)
	const handle = cropper.value.container.querySelector('cropper-handle') as CropperHandle;
	handle.action = action
}
onKeyDown("Shift", () => changeCropperTool("move"), {dedupe: true})
onKeyUp("Shift", () => changeCropperTool("select"), {dedupe: true})

async function runOCR() {
	if (!selectionBlob.value) return
	ocrOutput.value = (await recognizeBlob(selectionBlob.value)).text
    ocrOutput.value = reformatText(ocrOutput.value, formatConfig.value)
}
onKeyStroke("Enter", () => {
	runIfNotInputFocused(runOCR)
})

function addToList(text: string) {
	clipboardText.value += text
	clipboardText.value += '\n'
	ocrOutput.value = ""
}

</script>

<template>
    <DropZone @image-loaded="onImageLoaded">
		<div class="sidebar right">
            <SelectionPreview v-if="cropper" v-model:blob="selectionBlob" :cropper="cropper" />
            <OCRControls v-if="selectionBlob" v-model="formatConfig" :file-name="fileName" @read="runOCR()" />
            <SelectionEditor v-if="ocrOutput" v-model="ocrOutput" @copy="text => addToList(text)"/>
		</div>
		<div class="sidebar left">
			<Clipboard :format="formatConfig" v-model="clipboardText"/>
		</div>
		<div id="hints-container">
			<details open>
				<summary>Controls</summary>
				<div id="hints-content">
					<div>Press <kbd>R</kbd> to rotate 90°</div>
					<div>Press <kbd>Shift</kbd> to switch <b>cursor</b> to moving the image</div>
					<div>Press <kbd>Enter ↵</kbd> recognize text</div>
					Tesseract: {{ ocrWorker ? 'Ready' : 'Uninitialized' }}<br>
				</div>
			</details>
		</div>
	</DropZone>
</template>

<style scoped lang="scss">
.sidebar {
	z-index: 100;
	position: absolute;
	top: 0;
	margin: 2rem;
	display: flex;
	flex-direction: column;
	gap: .35rem;

	&.right {
		right: 0;
	}
	&.left {
		left: 0;
	}
}
#hints-container {
	z-index: 100;
	position: absolute;
	bottom: 0;
	left: 0;
	margin: 2rem;
}
#hints-content {
	display: flex;
	flex-direction: column;
	gap: .35rem;
	padding: .6rem;
	background-color: var(--color-background);
}
</style>
