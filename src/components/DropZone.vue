<script setup lang="ts">
import { assert } from '@/utils';
import { useDropZone } from '@vueuse/core';
import { getDocument } from 'pdfjs-dist';
import { onMounted, useTemplateRef } from 'vue';

const dropZoneRef = useTemplateRef("drop-zone")
const canvasRef = useTemplateRef("pdf-loader")

const emit = defineEmits<{
    imageLoaded: [canvas: HTMLCanvasElement, fileName?: string]
}>()

const { isOverDropZone } = useDropZone(dropZoneRef, {
	onDrop,
	// specify the types of data to be received.
	dataTypes: ['application/pdf', 'image/png'],
	// control multi-file drop
	multiple: false,
	// whether to prevent default behavior for unhandled events
	preventDefaultForUnhandled: false,
})

onMounted(() => {
	// setup pasting functionality
	dropZoneRef.value?.addEventListener("paste", async (event) => {
		const clipboardItem = event.clipboardData?.items[0]
        if (clipboardItem) {
            loadPastedImageOntoCanvas(clipboardItem)
        }
	})
})

async function loadPastedImageOntoCanvas(item: DataTransferItem) {
    assert(canvasRef.value)
    // accept images only
    if (!item.type.startsWith("image/")) return
    const file = item.getAsFile()
    if (!file) {
        return
    }
    await loadImageOntoCanvas(file)
    emit("imageLoaded", canvasRef.value, "")
}

function loadPdfFirstPageOntoCanvas(file: File) {
	return new Promise<void>((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onerror = reject
		fileReader.onload = async function() {
			if (!this.result) return
			assert(canvasRef.value)
			const typedarray = new Uint8Array(this.result as ArrayBuffer);

			const pdf = await getDocument({ data: typedarray }).promise;
			const page = await pdf.getPage(1);
			const viewport = page.getViewport({ scale: 2 }); // Higher scale = higher quality
			const context = canvasRef.value.getContext('2d');
			assert(context)
			canvasRef.value.height = viewport.height;
			canvasRef.value.width = viewport.width;
			await page.render({ canvas: canvasRef.value, canvasContext: context, viewport: viewport }).promise;
			resolve()
		}
		fileReader.readAsArrayBuffer(file)
	})
} 

function loadImageOntoCanvas(file: File) {
	return new Promise<void>((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onerror = reject
		fileReader.onload = async function(result) {
			if (!this.result) return
			const image = new Image()
			image.onload = () => {
				assert(canvasRef.value)
				const context = canvasRef.value.getContext('2d');
				assert(context)
				canvasRef.value.width = image.width;
				canvasRef.value.height = image.height;
				context.drawImage(image,0,0);
				resolve()
			}
			image.src = this.result as string
		}
		fileReader.readAsDataURL(file)
	})
} 

async function onDrop(files: File[] | null) {
	if (!files) return
	assert(canvasRef.value)
	const file = files[0]
	// load dropped file onto canvas
	if (file.type == "application/pdf") {
		await loadPdfFirstPageOntoCanvas(file)
	} else {
		await loadImageOntoCanvas(file)
	}
    emit("imageLoaded", canvasRef.value, file.name)
}
</script>

<template>
    <div id="drop-zone" ref="drop-zone">
        <div id="drop-hint-text">
            <h1>Drop PDF/Image Here</h1>
            <h4>Or paste an image with <kbd>Ctrl</kbd> + <kbd>V</kbd></h4>
        </div>
        <div v-if="isOverDropZone" class="scrim" />
        <canvas id="pdf-loader" ref="pdf-loader" style="display: none;"></canvas>
        <slot />
    </div>
</template>

<style scoped lang="scss">
#drop-hint-text {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
    flex-direction: column;
	justify-content: center;
	align-items: center;
	font-size: 2rem;
}
#drop-zone {
	width: 100%;
	height: 100%;

	&:deep(cropper-canvas) {
		height: 100%;
	}

    .scrim {
        width: 100%;
        height: 100%;
        z-index: 1000;
        position: absolute;
        top: 0;
        left: 0;
		box-shadow: inset 0 0 172px #41b88380;
        touch-action: none;
        pointer-events: none;
    }
}
</style>
