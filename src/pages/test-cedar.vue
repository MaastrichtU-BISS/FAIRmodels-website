<script setup lang="ts">
import CedarEmbeddableEditor from 'src/components/CedarEmbeddableEditor.vue';
import { ref } from 'vue';

</script>

<template>
  <q-page>
    <div class="row justify-center q-mt-xl">
      <div class="col-md-5">
        <h4 class="text-bold q-mt-md q-mb-lg">Testing the CEDAR component</h4>
        <CedarEmbeddableEditor />
      </div>
    </div>
  </q-page>
</template>

