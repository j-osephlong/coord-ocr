<script setup lang="ts">
import "pdfjs-dist/build/pdf.worker.mjs";
import * as PDFJS from "pdfjs-dist"
import SquareBtn from "./SquareBtn.vue";
import { onMounted, ref, useTemplateRef } from "vue";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { PIDData, GeoNBFindReturn } from "@/types/ResearchChecker";
import ResearchCheckerPidRow from "./ResearchCheckerPidRow.vue";

const LOG_TAG = "[ResearchCheckerApp.vue]" as const;
const fileInputRef = useTemplateRef("fileInput")
const pids = ref<PIDData[]>([])

/** Returns 'LAST_UPDATE' date string from geonb for PID. */
async function checkGeoNB(pidInt: number): Promise<string> {
    console.debug(LOG_TAG, `Looking up ${pidInt} on GeoNB`);
    const url = new URL("https://geonb.snb.ca/arcgis/rest/services/GeoNB_SNB_Parcels/MapServer/find")
    url.searchParams.set("searchText", `${pidInt}`)
    url.searchParams.set("contains", "true")
    url.searchParams.set("searchFields", "PID_INT")
    url.searchParams.set("sr", "")
    url.searchParams.set("layers", "0")
    url.searchParams.set("returnGeometry", "false")
    url.searchParams.set("returnZ", "false")
    url.searchParams.set("returnM", "false")
    url.searchParams.set("f", "pjson")
    const data: GeoNBFindReturn = await (await fetch(url)).json()
    const result = data.results.find(i => Number.parseInt(i.attributes.PID_INT) == pidInt)
    if (!data || !result) {
        throw new Error("PID not found on GeoNB.")
    }
    return result.attributes.LAST_UPDATE
}

function triggerInput() {
    fileInputRef.value?.click()
}

function onPDFInputChange(e: Event) {
    const files = ((e as InputEvent).target as HTMLInputElement).files
    if (!files) return
    for (const file of files) {
        processPDF(file)
    }
}

function findReportedDate(text: TextItem[]) {
    let updatedLabelOrigin: [number, number] | null = null
    for (const item of text) {
        const itemOrigin: [number, number] = [item.transform[4], item.transform[5]]
        if (item.str.toLowerCase().includes("date last updated:") && !updatedLabelOrigin) {
            updatedLabelOrigin = itemOrigin
        }
        else if (
            !!updatedLabelOrigin &&
            itemOrigin[0] - updatedLabelOrigin[0] > 50 &&
            Math.abs(itemOrigin[1] - updatedLabelOrigin[1]) < 5 &&
            !!item.str.match(/\d{4}[-\s]\d{2}[-\s]\d{2}\s\d{2}:\d{2}:\d{2}/gm)?.length
        ) {
            return item.str.trim()
        }
    }  
    return null 
}

function findPID(text: TextItem[]) {
    let pidLabelOrigin: [number, number] | null = null
    for (const item of text) {
        const itemOrigin: [number, number] = [item.transform[4], item.transform[5]]
        if (item.str.toLowerCase().includes("pid:") && !pidLabelOrigin) {
            pidLabelOrigin = itemOrigin
        }
        else if (
            !!pidLabelOrigin &&
            itemOrigin[0] - pidLabelOrigin[0] > 50 &&
            Math.abs(itemOrigin[1] - pidLabelOrigin[1]) < 5 &&
            !!item.str.match(/^\s*\d{5,8}\s*$/gm)?.length
        ) {
            return item.str.trim()
        }
    }  
    return null 
}

async function processPDF(file: File) {
    console.debug(LOG_TAG, `Processing pdf ${file.name}.`);
    
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onerror = reject
        fileReader.onload = async function () {
            if (!this.result) reject("No result returned.")            
            resolve(this.result as ArrayBuffer)
        }
        fileReader.readAsArrayBuffer(file)
    })
    const typedArray = new Uint8Array(buffer)
    const document = await PDFJS.getDocument({
        cMapPacked: true,
        cMapUrl: 'js/vendor/pdfjs/cmaps/',
        data: typedArray,
    }).promise
    const page1 = await document.getPage(1)
    const text = await  page1.getTextContent()
    console.debug(LOG_TAG, JSON.stringify(text));
    
    console.debug(LOG_TAG, `Reading PDF ${file.name}.`);
    let pid: string | null = findPID(text.items as TextItem[])
    if (!pid)
        pid = findPID(text.items.toReversed() as TextItem[])
    let reportedDateLastUpdated: string | null = findReportedDate(text.items as TextItem[])
    if (!reportedDateLastUpdated)
        reportedDateLastUpdated = findReportedDate(text.items.toReversed() as TextItem[])
    if (text.items.length > 500) {
        alert(`PDF ${file.name} is unreadable (old format pdf).`)
        return
    }    
    if (!!pid && !!reportedDateLastUpdated) {
        let geoNBDate = null
        try {
            geoNBDate = await checkGeoNB(Number.parseInt(pid))
        } catch {}
        pids.value.push({
            pid,
            reportedDateTimeLastUpdatedStr: reportedDateLastUpdated,
            geonbDateLastUpdated: geoNBDate ?? "",
            found: geoNBDate !== null,
        })
    } else {
        console.debug(LOG_TAG, "PID", pid, "reportedDate", reportedDateLastUpdated);  
    }
}

</script>

<template>
	<div class="sub-card">
        <SquareBtn @click="triggerInput">Open Research 'Dated' Folder</SquareBtn>
        <input ref="fileInput" type="file" accept="application/pdf" multiple style="display: none;" @change="onPDFInputChange" />
        <p style="margin-left: 2px;">The research 'dated' folder is the folder that holds PID reports in research folder, and has a date for a name.</p>
        <table>
            <thead>
                <tr>
                    <th>PID</th>
                    <th>Our Date</th>
                    <th>Found on GeoNB</th>
                    <th>GeoNB Date</th>
                    <th>Up to Date</th>
                </tr>
            </thead>
            <tbody>
                <ResearchCheckerPidRow v-for="row in pids" :key="row.pid" :data="row" />
            </tbody>
        </table>
    </div>
</template>

<style scoped lang="scss">
.sub-card {
    padding: 8px;
    border: 1px var(--color-heading) dashed;
}
</style>
