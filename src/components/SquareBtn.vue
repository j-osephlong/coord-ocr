<script setup lang="ts">
</script>

<template>
    <button><slot></slot></button>
</template>

<style scoped lang="scss">
button {
    border-radius: 0;
    border-style: solid;
    border-color: var(--color-heading);
    border-width: 1px;
    background-color: white;
    border-radius: 2px;
    padding: .2rem .6rem;
    font-size: .8rem;

    &:hover {
        background-color: var(--vt-c-white-mute);
    }
}
</style>
