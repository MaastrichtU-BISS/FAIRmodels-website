<script setup lang="ts">
import { useQuasar } from 'quasar';
import { FairmodelVersion } from 'src/types';
import { fairmodelVersionApiService } from 'src/utils/fairmodelversion.api.service';
import { computed, reactive, watch } from 'vue';

const $q = useQuasar()

const props = defineProps<{
  fairmodelId: string
}>();
const emit = defineEmits<{
  update: []
}>();

const setModelObject = defineModel<FairmodelVersion>();

const dialogSetModel = computed({
  get: () => setModelObject.value !== undefined,
  set: (state: boolean) => setModelObject.value = undefined // Always assume false when set directly
})

watch(() => dialogSetModel.value, () => {
  Object.assign(setModelData, setModelDataDefault)
})

const setModelDataDefault = {
  model_type: 'ONNX' as 'ONNX' | 'PMML',
  file: null as any | null
};
const setModelData = reactive({...setModelDataDefault})

const saveModelData = async () => {
  const upload = await fairmodelVersionApiService.uploadModel(props.fairmodelId, setModelObject.value!.id, setModelData)
  if (Math.floor(upload.status / 100) == 2) {
    $q.notify({type: 'positive', message: upload.data.message})
    emit('update')
    dialogSetModel.value = false;
  } else {
    $q.notify({type: 'warning', message: upload.data.message})
  }
}
</script>

<template>
  <q-dialog v-model="dialogSetModel">
    <q-card style="width: 64rem">
      <q-card-section>
        <div class="text-h5">Set model file</div>
        <q-form
          @submit="saveModelData"
          class="q-gutter-md q-mt-sm"
        >
          <q-select filled v-model="setModelData.model_type" :options="['ONNX', 'PMML']" label="Model type" />
          <q-file filled v-model="setModelData.file" label="File"></q-file>

          <q-btn type="submit" color="primary" label="Submit" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>