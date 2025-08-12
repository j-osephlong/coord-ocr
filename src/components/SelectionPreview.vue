<script setup lang="ts">
import { assert } from '@/utils';
import { useObjectUrl, useDebounceFn } from '@vueuse/core';
import type Cropper from 'cropperjs';
import { onMounted, ref, useTemplateRef } from 'vue';

const previewRef = useTemplateRef("selection-preview")
const selectionBlob = defineModel<Blob | null>('blob', {default: null})
const selectionObjectURL = useObjectUrl(selectionBlob)

async function showPreview() {
	assert(previewRef.value)
	const selection = props.cropper.getCropperSelection();
	const canvas = await props.cropper.getCropperSelection()?.$toCanvas({width: previewRef.value.width * 2, height: previewRef.value.height * 2})
	assert(canvas)
	// threshold(canvas, 220)
	canvas.toBlob((blob) => {
		assert(previewRef.value)
		assert(selection)
		selectionBlob.value = blob
		previewRef.value.height = (selection.height / selection.width) * previewRef.value.width
	})
}
const showPreviewDebounced = useDebounceFn(showPreview, 200)

const props = defineProps<{
    cropper: Cropper,
}>()

onMounted(() => {
	const selection = props.cropper.getCropperSelection()
	assert(selection)
	const cropperImage = props.cropper.getCropperImage()
	assert(cropperImage)
	selection?.addEventListener("change", showPreviewDebounced)
	cropperImage?.addEventListener("transform", showPreviewDebounced)

})
</script>

<template>
    <img ref="selection-preview" id="selection-preview" :src="selectionObjectURL" />
</template>

<style scoped lang="scss">
#selection-preview {
	width: 5in;
	min-height: 1px;
	background-color: white;
	border: 1px solid var(--color-border);
	filter: drop-shadow(10px 10px 10px 10px);
	&:hover {
		opacity: .3;
	}
}
</style>
