<script setup lang="ts">
</script>

<template>
    <button><slot></slot></button>
</template>

<style scoped lang="scss">
button {
    border-radius: 0;
    border-style: solid;
    border-color: var(--color-border);
    border-width: 1px;
    background-color: white;
    padding: .2rem .6rem;

    &:hover {
        background-color: var(--vt-c-white-mute);
    }
}
</style>
