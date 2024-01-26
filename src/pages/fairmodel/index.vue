<script setup lang="ts">
import { QTable, QTableProps, useQuasar } from 'quasar';
import { Fairmodel } from 'src/types';
import { fairmodelApiService } from 'src/utils/fairmodel.api.service';
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar()
const router = useRouter();

const newFairmodelDefault = {
  name: '',
  description: ''
}

const newFairmodel = ref({...newFairmodelDefault})

const createNewDialog = ref(false)
const editDialog = ref(false);
const editFairmodel = ref<null | Fairmodel>(null);

const createFairmodel = async () => {
  const create = await fairmodelApiService.create(newFairmodel.value)
  if (create.status == 200) {
    if (create.data.message) {
      $q.notify({type: 'positive', position: 'top-right', message: create.data.message})
    }
    tableRef.value?.requestServerInteraction()
    createNewDialog.value = false;
    newFairmodel.value = {...newFairmodelDefault};
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

const saveEditFairmodel = async () => {
  if (!editFairmodel.value) return;
  const update = await fairmodelApiService.update(
    editFairmodel.value.id,
    { name: editFairmodel.value?.name, description: editFairmodel.value?.description }
  )
  if (update.status == 200) {
    $q.notify({type: 'positive', position: 'top-right', message: update.data.message});
    tableRef.value?.requestServerInteraction()
    editDialog.value = false;
  } else {
    $q.notify({type: 'warning', position: 'top-right', message: update.data.message ?? 'An error occured'})
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
  filter: {
    owned: true
  }
})

watch(() => table.filter.owned, () => tableRef.value?.requestServerInteraction());

const tableOnRequest = async () => {
  table.loading = true;
  const index = await fairmodelApiService.index(table.filter);
  if (index.status == 200) {
    table.rows = index.data.fairmodels;
    table.loading = false;
  } else {
    table.loading = false;
    throw Error("Failed to get data from server")
  }
}

const actionEdit = (row: Fairmodel) => {
  editFairmodel.value = row;
  editDialog.value = true;
}

const actionDelete = (row: Fairmodel) => {
  $q.dialog({
    title: 'Alert',
    message: 'Are you sure you want to delete this fairmodel?',
    cancel: true
  }).onOk(async () => {
    const del = await fairmodelApiService.delete(row.id)
    if (del.status === 200) {
      $q.notify({type: 'positive', position: 'top-right', message: del.data.message})
      tableRef.value?.requestServerInteraction()
    } else {
      $q.notify({type: 'warning', position: 'top-right', message: del.data.message})
    }
  })
}

const actionView = (row: Fairmodel) => {
  router.push(`/fairmodel/${row.id}/`)
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
              <div class="text-h5">Create new fairmodel</div>
              <q-form
                @submit="createFairmodel"
                class="q-gutter-md"
              >
                <q-input
                  v-model="newFairmodel.name"
                  label="Model name"
                />
                <q-input
                  v-model="newFairmodel.description"
                  textarea
                  label="Model description"
                />
                <q-btn type="submit" color="primary" label="Submit" />
              </q-form>
            </q-card-section>
          </q-card>
        </q-dialog>

        <q-dialog v-model="editDialog">
          <q-card style="width: 64rem" v-if="editFairmodel">
            <q-card-section>
              <div class="text-h5">Edit fairmodel {{ editFairmodel.id.substring(0, 8) }}...</div>
              <q-form
                @submit="saveEditFairmodel"
                class="q-gutter-md"
              >
                <q-input
                  v-model="editFairmodel.name"
                  label="Fairmodel name"
                />
                <q-input
                  v-model="editFairmodel.description"
                  textarea
                  label="Fairmodel description"
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
              <template v-slot:top-right>
                <q-toggle
                  v-model="table.filter.owned"
                  label="My Fairmodels"
                />

              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn size="sm" flat rounded icon="visibility" @click="actionView(props.row)"></q-btn>
                  <q-btn size="sm" flat rounded icon="mode_edit" @click="actionEdit(props.row)"></q-btn>
                  <q-btn size="sm" flat rounded icon="delete" @click="actionDelete(props.row)"></q-btn>
                </q-td>
              </template>
            </q-table>
          </div>
        </div>
        
      </div>
    </div>
  </q-page>
</template>

