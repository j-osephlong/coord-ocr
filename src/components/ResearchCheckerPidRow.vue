<script setup lang="ts">
import type { PIDData } from '@/types/ResearchChecker';
import { computed } from 'vue';

const props = defineProps<{data: PIDData}>()
const upToDate = computed(() => props.data.reportedDateTimeLastUpdatedStr.split(" ")[0] == props.data.geonbDateLastUpdated)
</script>

<template>
    <tr>
        <td>{{ data.pid }}</td>
        <td>{{ data.reportedDateTimeLastUpdatedStr }}</td>
        <td>{{ data.found ? '✅' : '❌' }}</td>
        <td>{{ data.geonbDateLastUpdated }}</td>
        <td>{{ upToDate ? '✅' : '❌' }}</td>
    </tr>
</template>

<style scoped lang="scss">
</style>
