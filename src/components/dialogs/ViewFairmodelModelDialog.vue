<script setup lang="ts">
import { useQuasar } from 'quasar';
import { Fairmodel, FairmodelVersion } from 'src/types';
import { fairmodelVersionApiService } from 'src/utils/fairmodelversion.api.service';
import { computed, ref } from 'vue';

const $q = useQuasar()

const props = defineProps<{
  fairmodel: Fairmodel
}>()

const viewModelObject = defineModel<FairmodelVersion>()

const dialogViewModel = computed({
  get: () => viewModelObject.value !== undefined,
  set: (state: boolean) => viewModelObject.value = undefined // Always assume false when set directly
})

const downloadLoading = ref(false);
const downloadViewModel = async () => {
  downloadLoading.value = true;
  const down = await fairmodelVersionApiService.downloadModel(props.fairmodel.id, viewModelObject.value!.id);
  if (down.status == 200) {
    const blob = new Blob([down.data], { type: down.headers['content-type'] });
    const link = document.createElement('a');
    link.download = `${props.fairmodel.name.replace(/\s+/, '-')}-${viewModelObject.value!.version}.${viewModelObject.value!.model_type == 'ONNX' ? 'onnx' : 'pmml'}`;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    downloadLoading.value = false;
    // $q.notify({type: 'positive', message: 'Downloaded successfully'});
    // dialogViewModel.value = false;
  } else {
    $q.notify({type: 'warning', message: down.data.message})
  }
}

</script>

<template>
  <q-dialog v-model="dialogViewModel">
    <q-card style="width: 64rem" v-if="viewModelObject">
      <q-card-section>
        <div class="text-h5">View model file</div>
        <div class="q-gutter-md q-mt-sm">
          <q-field readonly filled v-model="viewModelObject.model_type" label="Model type">
            <template v-slot:control>
              {{ viewModelObject.model_type }}
            </template>
          </q-field>

          <q-btn label="Download" icon="download" color="primary" @click="downloadViewModel" />

        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>