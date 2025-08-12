<script setup lang="ts">
import { computed, ref } from 'vue';
import SquareBtn from './SquareBtn.vue';
import { recognitionProgress } from '@/ocr';
import type { FormatConfig } from '@/reformat';

const props = defineProps<{
    fileName: string
}>()

const formatConfig = defineModel<FormatConfig>({
    required: true,
})

const emit = defineEmits<{
    read: []
}>()

</script>

<template>
    <div class="controls">
        <template v-if="recognitionProgress === null">
            <SquareBtn @click="emit('read')">Read</SquareBtn>
            <details>
                <summary>Options</summary>
                <div class="options">
                    <div class="option">
                        <label>Format</label>
                        <input v-model="formatConfig.format" type="text"></input>
                    </div>
                    <div class="option">
                        <label>ID column name</label>
                        <input v-model="formatConfig.idColumnName" type="text"></input>
                    </div>
                    <div class="option">
                        <label>Desc. column name</label>
                        <input v-model="formatConfig.descriptionColumnName" type="text"></input>
                    </div>
                    <div class="option">
                        <label>Number column names</label>
                        <input v-model="formatConfig.numberColumnNames" type="text"></input>
                    </div>
                    <div class="option">
                        <label>Append to description column</label>
                        <input v-model="formatConfig.appendToDescription" type="text"></input>
                    </div>
                    <div class="option">
                        <label>Raw</label>
                        <input v-model="formatConfig.raw" type="checkbox"></input>
                    </div>
                </div>
            </details>
        </template>
        <div v-else class="progress-text">
            Recognizing: {{ (recognitionProgress * 100).toFixed(0) }}%
        </div>
    </div>
</template>

<style scoped lang="scss">
.controls {
    display: flex;
    flex-direction: row;
    gap: .35rem;
    width: 100%;

    input[type=text] {
        border-radius: 0;
        border-style: solid;
        border-color: var(--color-background-soft);
        border-width: 1px;
        background-color: white;
    }

    & > * {
        filter: drop-shadow(10px 10px 10px 10px);
    }
}

.progress-text {
    background-color: var(--color-background-soft);
    border: 1px solid var(--color-border);
    padding: .2rem .4rem;
}
</style>
