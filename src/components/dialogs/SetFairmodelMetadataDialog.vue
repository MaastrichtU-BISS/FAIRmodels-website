<script setup lang="ts">
import { useQuasar } from 'quasar';
import { FairmodelVersion } from 'src/types';
import { fairmodelVersionApiService } from 'src/utils/fairmodelversion.api.service';
import { computed, reactive, ref, watch } from 'vue';

const $q = useQuasar();

const props = defineProps<{
  fairmodelId: string
}>();
const emit = defineEmits<{
  update: []
}>();

const dialogSetMetadataId = defineModel<string>();

const loadingSaveMetadata = ref(false);

const dialogSetMetadata = computed({
  get: () => dialogSetMetadataId.value !== undefined,
  set: (state: boolean) => dialogSetMetadataId.value = undefined // Always assume false when set directly
})

watch(() => dialogSetMetadata.value, () => {
  Object.assign(setMetadataData, setMetadataDataDefault)
})

const setMetadataDataDefault = {
  metadata_id: '',
}
const setMetadataData = reactive({...setMetadataDataDefault})

const saveMetadata = async () => {
  loadingSaveMetadata.value = true;
  const update = await fairmodelVersionApiService.update(
    props.fairmodelId,
    dialogSetMetadataId.value!,
    {...setMetadataData}
  )
  if (update.status == 200) {
    $q.notify({type: 'positive', message: update.data.message})
    dialogSetMetadata.value = false;
    emit('update')
  } else {
    $q.notify({type: 'warning', message: update.data.message})
  }
  
  loadingSaveMetadata.value = false;
}
</script>

<template>
  <q-dialog v-model="dialogSetMetadata">
    <q-card style="width: 64rem">
      <q-card-section>
        <div class="text-h5">Set metadata</div>
        <q-form
          @submit="saveMetadata"
          class="q-gutter-md q-mt-sm"
        >
          <q-input
            v-model="setMetadataData.metadata_id"
            filled
            label="CEDAR metadata ID"
          />

          <q-btn :loading="loadingSaveMetadata" type="submit" color="primary" label="Submit" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>