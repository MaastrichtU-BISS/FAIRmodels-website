<script setup lang="ts">
import { QTable, QTableProps, useQuasar } from 'quasar';
import { Fairmodel, FairmodelVersion } from 'src/types';
import { fairmodelApiService } from 'src/utils/fairmodel.api.service';
import { fairmodelVersionApiService } from 'src/utils/fairmodelversion.api.service';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CreateFairmodelVersionDialog from 'src/components/dialogs/CreateFairmodelVersionDialog.vue'
import SetFairmodelMetadataDialog from 'src/components/dialogs/SetFairmodelMetadataDialog.vue';
import ViewFairmodelMetadataDialog from 'src/components/dialogs/ViewFairmodelMetadataDialog.vue';
import SetFairmodelModelDialog from 'src/components/dialogs/SetFairmodelModelDialog.vue';
import ViewFairmodelModelDialog from 'src/components/dialogs/ViewFairmodelModelDialog.vue'
import LinkFairmodelVersionDialog from 'src/components/dialogs/LinkFairmodelVersionDialog.vue';

const $q = useQuasar()
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
  
  tableOnRequest()
})

const table = reactive({
  columns: [
    {name: 'id', label: 'Id', field: (row: FairmodelVersion) => row.id, align: 'left' },
    {name: 'version', label: 'Name', field: (row: FairmodelVersion) => row.version, align: 'left' },
    {name: 'update_desc', label: 'Update Description', field: (row: FairmodelVersion) => row.update_description, align: 'left' },
    {name: 'metadata', label: 'Cedar Metadata ID', field: (row: FairmodelVersion) => row.metadata_id == null ? 'false' : row.metadata_id, align: 'center' },
    {name: 'model', label: 'Model Representation', field: (row: FairmodelVersion) => row.has_model, align: 'center' },
    {name: 'actions', label: 'Actions', align: 'center' },
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

const dialogCreateFairmodelVersion = ref(false);
const showDialogCreateFairmodelVersion = () => {
  dialogCreateFairmodelVersion.value = true;
}

const dialogSetMetadataVersionId = ref<string>();
const showDialogSetMetadata = (version: FairmodelVersion) => {
  dialogSetMetadataVersionId.value = version.id
}

const dialogViewMetadataObject = ref<FairmodelVersion>();
const showDialogViewMetadata = (version: FairmodelVersion) => {
  dialogViewMetadataObject.value = {...version};
}

const dialogSetModelObject = ref<FairmodelVersion>();
const showDialogSetModel = (version: FairmodelVersion) => { 
  dialogSetModelObject.value = {...version};
}

const dialogViewModelObject = ref<FairmodelVersion>();
const showDialogViewModel = (version: FairmodelVersion) => { 
  dialogViewModelObject.value = {...version};
}

const dialogLinkModelObject = ref<FairmodelVersion>();
const showDialogLink = (version: FairmodelVersion) => {
  dialogLinkModelObject.value = {...version}
}

const refreshTable = () => {
  tableRef.value?.requestServerInteraction()
}
</script>

<template>
  <q-page v-if="fairmodel">
    <div class="row justify-center q-mt-xl">
      <div class="col-md-6">
        <h4 class="text-bold q-mt-mxd q-mb-lg">Fairmodel {{ fairmodel.name }}</h4>

        <q-btn color="primary" label="New Version" @click="showDialogCreateFairmodelVersion()" />

        <CreateFairmodelVersionDialog
          v-model="dialogCreateFairmodelVersion"
          :fairmodelId="fairmodel.id"
          @update="refreshTable()"
        />
        
        <SetFairmodelMetadataDialog
          v-model="dialogSetMetadataVersionId"
          :fairmodelId="fairmodel.id"
          @update="refreshTable()"
        />

        <ViewFairmodelMetadataDialog
          v-model="dialogViewMetadataObject"
          :fairmodelId="fairmodel.id"
        />
        
        <SetFairmodelModelDialog
          v-model="dialogSetModelObject"
          :fairmodelId="fairmodel.id"
          @update="refreshTable()"
        />
        
        <ViewFairmodelModelDialog
          v-model="dialogViewModelObject"
          :fairmodel="fairmodel"
        />

        <LinkFairmodelVersionDialog
          v-model="dialogLinkModelObject"
          :fairmodelId="fairmodel.id"
        />
        
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
              <template v-slot:body-cell-metadata="props">
                <q-td :props="props">
                  <q-btn
                    v-if="(props.row as FairmodelVersion).metadata_id == null"
                    color="grey-7"
                    size="md"
                    flat
                    rounded
                    icon="check_box_outline_blank"
                    @click="showDialogSetMetadata(props.row)"
                  >
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      Set metadata
                    </q-tooltip>
                  </q-btn>
                  <q-btn v-else color="green-10" flat rounded size="md" icon="check_box" @click="showDialogViewMetadata(props.row)">
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      View metadata
                    </q-tooltip>
                  </q-btn>
                </q-td>
              </template>
              <template v-slot:body-cell-model="props">
                <q-td :props="props">
                  <q-btn v-if="!(props.row as FairmodelVersion).has_model" color="grey-7" size="md" flat rounded icon="check_box_outline_blank" @click="showDialogSetModel(props.row)">
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      Set model
                    </q-tooltip>
                  </q-btn>
                  <q-btn v-else color="green-10" flat rounded size="md" icon="check_box" @click="showDialogViewModel(props.row)">
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      View model
                    </q-tooltip>
                  </q-btn>
                </q-td>
              </template>`
              
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <!-- <q-btn size="sm" flat rounded icon="delete" @click="actionDelete(props.row)"></q-btn> -->
                  <q-btn size="md" flat rounded icon="link" color="indigo-8" @click="showDialogLink(props.row)">
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      Link fields
                    </q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </div>
        </div>

      </div>
    </div>
  </q-page>
</template>