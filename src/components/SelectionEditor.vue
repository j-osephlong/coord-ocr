<script setup lang="ts">
import { useTextareaAutosize } from '@vueuse/core';
import { useTemplateRef } from 'vue';
import SquareBtn from './SquareBtn.vue';

const text = defineModel<string>({required: true})
const textarea = useTemplateRef('textarea')
useTextareaAutosize({element: textarea,input: text})

const emit = defineEmits<{
    copy: [text: string]
}>()

function copy() {
    navigator.clipboard.writeText(text.value)
    emit("copy", text.value)
}
</script>

<template>
    <div class="editor">
        <textarea ref="textarea" v-model="text"></textarea>
        <SquareBtn @click="copy" class="copy-btn">Copy</SquareBtn>
    </div>
</template>

<style scoped lang="scss">
.editor {
    position: relative;

    .copy-btn {
        position: absolute;
        bottom: .75rem;
        right: .75rem;
        border-width: 2px;
        padding: .75rem;
    }
}
</style>
