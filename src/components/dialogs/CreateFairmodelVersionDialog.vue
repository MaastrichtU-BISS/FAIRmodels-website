<script setup lang="ts">
import { useQuasar } from 'quasar';
import { fairmodelVersionApiService } from 'src/utils/fairmodelversion.api.service';
import { ref, watch } from 'vue';

const $q = useQuasar();

const props = defineProps<{fairmodelId: string}>();
const emit = defineEmits<{
  update: []
}>();

const dialogCreateFairmodelVersion = defineModel<boolean>()

const newFairmodelVersionDefault = {
  update_description: '',
  update_type: 'patch',
}

const newFairmodelVersionData = ref({...newFairmodelVersionDefault});

const createFairmodelVersion = async () => {
  const create = await fairmodelVersionApiService.create(props.fairmodelId, newFairmodelVersionData.value)
  if (create.status == 200) {
    $q.notify({type: 'positive', position: 'top-right', message: create.data.message})
    dialogCreateFairmodelVersion.value = false;
    newFairmodelVersionData.value = {...newFairmodelVersionDefault}
    emit('update');
  } else {
    $q.notify({type: 'warning', position: 'top-right', message: create.data.message}) 
  }
}
</script>

<template>
  <q-dialog v-model="dialogCreateFairmodelVersion">
    <q-card style="width: 64rem">
      <q-card-section>
        <div class="text-h5">Create new fairmodel version</div>
        <q-form
          @submit="createFairmodelVersion"
          class="q-gutter-md q-mt-sm"
        >
          <q-input
            v-model="newFairmodelVersionData.update_description"
            filled
            label="Update Description"
          />
          <q-radio v-model="newFairmodelVersionData.update_type" val="patch" label="Patch" />
          <q-radio v-model="newFairmodelVersionData.update_type" val="minor" label="Minor" />
          <q-radio v-model="newFairmodelVersionData.update_type" val="major" label="Major" />

          <q-btn type="submit" color="primary" label="Submit" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>