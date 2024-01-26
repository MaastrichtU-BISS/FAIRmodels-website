<script setup lang="ts">
import { QTable, QTableProps, useQuasar } from 'quasar';
import { Fairmodel, FairmodelVersion } from 'src/types';
import { fairmodelApiService } from 'src/utils/fairmodel.api.service';
import { fairmodelVersionApiService } from 'src/utils/fairmodelversion.api.service';
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar()
const router = useRouter();
const route = useRoute();

const fairmodel = ref<null | Fairmodel>(null);
const tableRef = ref<QTable | null>(null);

onMounted(async () => {
  if (Array.isArray(route.params.fairmodel_id)) return;

  const get = await fairmodelApiService.get(route.params.fairmodel_id)
  if (get.status == 200) {
    fairmodel.value = get.data.fairmodel;
  } else {
    $q.notify({type: 'warning', message: get.data.message})
    return
  }

  const index = await fairmodelVersionApiService.index(fairmodel.value!.id, table.filter);
  console.log(index);

  tableRef.value?.requestServerInteraction()
})

const table = reactive({
  columns: [
    {name: 'id', label: 'Id', field: (row: FairmodelVersion) => row.id, align: 'left' },
    {name: 'version', label: 'Name', field: (row: FairmodelVersion) => row.version, align: 'left' },
    {name: 'update_desc', label: 'Update Description', field: (row: FairmodelVersion) => row.update_description, align: 'left' },
    {name: 'metadata_id', label: 'Cedar Metadata ID', field: (row: FairmodelVersion) => row.metadata_id === '' ? 'false' : row.metadata_id, align: 'left' },
    {name: 'onnx', label: 'ONNX representation', field: (row: FairmodelVersion) => row.has_onnx, align: 'left' },
    {name: 'actions', label: 'Actions', align: 'right' },
  ] as QTableProps['columns'],
  rows: [],
  loading: true,
  filter: {}
})

const tableOnRequest = async () => {
  if (!fairmodel.value) return;

  table.loading = true;
  const index = await fairmodelVersionApiService.index(fairmodel.value.id, table.filter);
  if (index.status == 200) {
    table.rows = index.data.fairmodelversions;
    table.loading = false;
  } else {
    table.loading = false;
    throw Error("Failed to get data from server")
  }
}

const createFairmodelVersionDialog = ref(false);
const newFairmodelVersionDefault = {
  update_description: '',
  update_type: '',
}

const newFairmodelVersionData = ref({...newFairmodelVersionDefault});

const createFairmodelVersion = async () => {
  const create = await fairmodelVersionApiService.create(fairmodel.value!.id, newFairmodelVersionData.value)
  if (create.status == 200) {
    $q.notify({type: 'positive', position: 'top-right', message: create.data.message})
    createFairmodelVersionDialog.value = false;
    newFairmodelVersionData.value = {...newFairmodelVersionDefault}
    tableRef.value?.requestServerInteraction()
  } else {
    $q.notify({type: 'warning', position: 'top-right', message: create.data.message}) 
  }
}

</script>

<template>
  <q-page v-if="fairmodel">
    <div class="row justify-center q-mt-xl">
      <div class="col-md-6">
        <h4 class="text-bold q-mt-md q-mb-lg">Fairmodel {{ fairmodel.name }}</h4>
        <pre>{{ JSON.stringify(fairmodel) }}</pre>

        <q-btn color="primary" label="Create new Fairmodel Version" @click="createFairmodelVersionDialog = true" />

        <q-dialog v-model="createFairmodelVersionDialog">
          <q-card style="width: 64rem">
            <q-card-section>
              <div class="text-h5">Create new fairmodel version</div>
              <q-form
                @submit="createFairmodelVersion"
                class="q-gutter-md"
              >
                <q-input
                  v-model="newFairmodelVersionData.update_description"
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

        <div class="q-mt-lg row">
          <div class="col">
            <q-table
              flat bordered
              ref="tableRef"
              title="Fairmodels versions"
              :rows="table.rows"
              :columns="table.columns"
              row-key="id"
              :loading="table.loading"
              @request="tableOnRequest"
              :pagination="{rowsPerPage: 10}"
            >
              <!-- <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn size="sm" flat rounded icon="mode_edit" @click="actionEdit(props.row)"></q-btn>
                  <q-btn size="sm" flat rounded icon="delete" @click="actionDelete(props.row)"></q-btn>
                  <q-btn size="sm" flat rounded icon="visibility" @click="actionView(props.row)"></q-btn>
                </q-td>
              </template> -->
            </q-table>
          </div>
        </div>

      </div>
    </div>
  </q-page>
</template>