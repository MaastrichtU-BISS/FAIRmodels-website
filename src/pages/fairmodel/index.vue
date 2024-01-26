<script setup lang="ts">
import { QTable, QTableProps, useQuasar } from 'quasar';
import { modelApiService } from 'src/utils/model.api.service';
import { onMounted, reactive, ref } from 'vue';

const $q = useQuasar()

// const data = ref('');
// const getData = async () => {
//   const index = await modelApiService.index()
//   if (index.status == 200) {
//     data.value = index.data
//   } else {
//     alert('ERROR:' + index.status)
//   }
// }

type Fairmodel = {
  id: string,
  name: string,
  description: string
}

const newModelDefault = {
  name: '',
  description: ''
}

const newModel = ref({...newModelDefault})

const createNewDialog = ref(false)

const createModel = async () => {
  const create = await modelApiService.create(newModel.value)
  if (create.status == 200) {
    if (create.data.message) {
      $q.notify({type: 'positive', position: 'top-right', message: create.data.message})
    }
    tableRef.value?.requestServerInteraction()
    createNewDialog.value = false;
    newModel.value = {...newModelDefault};
  } else {
    if (create.data.message) {
      $q.notify({type: 'warning', position: 'top-right', message: create.data.message})
    }

    if (create.data.detail) {
      for (let [key, errors] of Object.entries(create.data.detail as Record<string, string[]>) )
        $q.notify({type: 'warning', position: 'top-right', message: `Field ${key} has error(s): ${errors.join('\n')}`})
    }
  }

}

const tableRef = ref<QTable | null>(null);
onMounted(() => {
  tableRef.value?.requestServerInteraction()
})

const table = reactive({
  columns: [
    {name: 'id', label: 'Id', field: (row: Fairmodel) => row.id, align: 'left' },
    {name: 'name', label: 'Name', field: (row: Fairmodel) => row.name, align: 'left' },
    {name: 'desc', label: 'Description', field: (row: Fairmodel) => row.description, align: 'left' },
    {name: 'actions', label: 'Actions', align: 'right' },
  ] as QTableProps['columns'],
  rows: [],
  loading: true,
})

const tableOnRequest = async () => {
  table.loading = true;
  const index = await modelApiService.index();
  if (index.status == 200) {
    table.rows = index.data.fairmodels;
    table.loading = false;
  } else {
    table.loading = false;
    throw Error("Failed to get data from server")
  }
}

const performAction = (row: Fairmodel) => {
  alert(`Hi ${row.id}`)
}

</script>

<template>
  <q-page>
    <div class="row justify-center q-mt-xl">
      <div class="col-md-6">
        <h4 class="text-bold q-mt-md q-mb-lg">Fairmodels</h4>
        
        <q-btn color="primary" label="Create new" @click="createNewDialog = true" />

        <q-dialog v-model="createNewDialog">
          <q-card style="width: 64rem">
            <q-card-section>
              <div class="text-h5">Create new model</div>
              <q-form
                @submit="createModel"
                class="q-gutter-md"
              >
                <q-input
                  v-model="newModel.name"
                  label="Model name"
                />
                <q-input
                  v-model="newModel.description"
                  textarea
                  label="Model description"
                />
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
              title="Fairmodels"
              :rows="table.rows"
              :columns="table.columns"
              row-key="id"
              :loading="table.loading"
              @request="tableOnRequest"
              :pagination="{rowsPerPage: 10}"
            >
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn size="sm" flat rounded icon="mode_edit" @click="performAction(props.row)"></q-btn>
                  <q-btn size="sm" flat rounded icon="delete" @click="performAction(props.row)"></q-btn>
                  <q-btn size="sm" flat rounded icon="visibility" @click="performAction(props.row)"></q-btn>
                </q-td>
              </template>
            </q-table>
          </div>
        </div>
        
      </div>
    </div>
  </q-page>
</template>

