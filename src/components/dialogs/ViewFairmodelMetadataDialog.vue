<script setup lang="ts">
import { FairmodelVersion } from 'src/types';
import { computed } from 'vue';

const viewMetadataObject = defineModel<FairmodelVersion>();

const dialogViewMetadata = computed({
  get: () => viewMetadataObject.value !== undefined,
  set: (state: boolean) => viewMetadataObject.value = undefined // Always assume false when set directly
})

const getMetadataURL = (id: string) => {
  return `https://cedar.metadatacenter.org/instances/edit/https://repo.metadatacenter.org/template-instances/${id}`
}
</script>

<template>
  <q-dialog v-model="dialogViewMetadata">
  <q-card style="width: 64rem" v-if="viewMetadataObject">
    <q-card-section>
      <div class="text-h5">Metadata for {{ viewMetadataObject.version }}</div>
      <div
        class="q-gutter-md q-mt-sm"
      >
        <q-field
          label="CEDAR metadata ID"
          filled stack-label
          readonly
        >
          <template v-slot:control>
            {{viewMetadataObject.metadata_id}}
          </template>
        </q-field>

        <div class="row no-wrap">
          <q-field
            filled
            readonly
          >
            <template v-slot:control>
              {{ getMetadataURL(viewMetadataObject.metadata_id) }}
            </template>
          </q-field>
          <q-btn
            class="self-center q-ml-md"
            :href="getMetadataURL(viewMetadataObject.metadata_id)"
            target="_blank"
            icon="open_in_new"
            round 
            flat
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</q-dialog>
</template>