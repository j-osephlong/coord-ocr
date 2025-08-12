import { createWorker, PSM, type Worker } from "tesseract.js";
import { ref, shallowRef } from "vue";
import { assert } from "./utils";

export const worker = shallowRef<Worker>()
export const recognitionProgress = ref<number|null>(null)
const LOG_TAG = "[ocr.ts]" as const;

createWorker('eng', 3, {
  logger: m => {
    console.log(m)
    recognitionProgress.value = m.progress
    if (m.progress == 1) {
        recognitionProgress.value = null
    }
  }, // Add logger here
  
}).then((_worker) => {
    worker.value = _worker
    worker.value.setParameters({
        "tessedit_pageseg_mode": PSM.SINGLE_BLOCK,
        tessedit_char_blacklist: "[],():;'\\/~`?<>+*-=^%$#@!“",
        'preserve_interword_spaces': "1",
    })
});

export async function recognizeBlob(b: Blob) {
    assert(worker.value)
    const { data } = await worker.value.recognize(b)
    return data
}