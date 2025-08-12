<script setup lang="ts">
import { type FormatConfig } from '@/reformat';
import { useTextareaAutosize } from '@vueuse/core';
import { useTemplateRef } from 'vue';
import SquareBtn from './SquareBtn.vue';
const LOG_TAG = "[Clipboard.vue]" as const;
const ZERO_CHAR_CODE = 97
const textarea = useTemplateRef('textarea')
const text = defineModel<string>({required: true})
const props = defineProps<{
    format: FormatConfig
}>()

useTextareaAutosize({element: textarea,input: text})

/**Sort rows by (1st) the text appended to the description column, 
 *  and (2nd) by the id column.
 * 
 * For both, try converting to number and, if failing, sort by string comparison.
 */
function sortRows() {
    const descIndex = props.format.format?.split(",").indexOf(props.format.descriptionColumnName)
    const idIndex = props.format.format?.split(",").indexOf(props.format.idColumnName)
    if (descIndex === undefined || descIndex == -1) return
    if (idIndex === undefined || idIndex == -1) return
    const getAppenededText = (splitLine: string[]) => {
        const desc = splitLine[descIndex]
        if (!desc || !desc.includes("/")) return ""
        const descSplit = desc.split("/")
        return descSplit[descSplit.length-1]
    }
    const compareAppendedText = (splitLineA: string[], splitLineB: string[]) => {
        const a = getAppenededText(splitLineA)
        const b = getAppenededText(splitLineB)
        try {
            const numA = Number(a)
            const numB = Number(b)
            return numA == numB ? 0 : numA > numB ? -1 : 1
        } catch {}
        return a.localeCompare(b) * -1 // mul by -1 for descending
    }
    const compareIdText = (splitLineA: string[], splitLineB: string[]) => {
        const a = splitLineA[idIndex]
        const b = splitLineB[idIndex]
        try {
            const numA = Number(a)
            const numB = Number(b)
            return numA == numB ? 0 : numA > numB ? 1 : -1
        } catch {}
        return a.localeCompare(b)
    }
    const splitLines = text.value.split("\n").map(l => l.split(","))
    const splitLinesPlanSorted = splitLines.sort((a, b) => compareAppendedText(a, b) || compareIdText(a, b))    
    return splitLinesPlanSorted.map(l => l.join(",")).join("\n")
}

function makeIdsUnique() {
    const idIndex = props.format.format?.split(",").indexOf(props.format.idColumnName)
    if (idIndex === undefined || idIndex == -1) return
    const rowsSorted = sortRows()?.split("\n")
    const newRows: string[] = []
    if (!rowsSorted) return
    const idCountMap = new Map<string, number>()
    for (const row of rowsSorted) {
        const rowSplit = row.split(",")
        const id = rowSplit[idIndex]
        const count = idCountMap.get(id) ?? -1
        if (count != -1) {
            rowSplit[idIndex] += String.fromCharCode(ZERO_CHAR_CODE + count)
        }
        // update count
        idCountMap.set(id, count+1)
        newRows.push(rowSplit.join(","))
    }
    text.value = newRows.join("\n")
}

function copy() {
    navigator.clipboard.writeText(text.value)
}
</script>

<template>
    <div class="clipboard-container">
        <details open>
            <summary>Clipboard</summary>
            <div class="clipboard-content">
                <textarea v-if="text" ref="textarea" v-model="text" />
                <div class="controls">
                    <SquareBtn @click="makeIdsUnique">Make IDs Unique</SquareBtn>
                    <SquareBtn @click="copy">Copy</SquareBtn>
                </div>
            </div>
        </details>

    </div>
</template>

<style scoped lang="scss">
textarea {
    width: 100%;
}

.clipboard-container {
    width: 4in;
    max-height: 50%;
}

.clipboard-content {
    display: flex;
    flex-direction: column;
    gap: .35rem;
}

.controls {
    display: flex;
    gap: .35rem;
    
}
</style>
