<script setup lang="ts">
import { QTable, QTableProps, useQuasar } from 'quasar';
import { Fairmodel, FairmodelVersion } from 'src/types';
import { fairmodelApiService } from 'src/utils/fairmodel.api.service';
import { fairmodelVersionApiService } from 'src/utils/fairmodelversion.api.service';
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
  
  tableOnRequest()
})

const getMetadataURL = (id: string) => {
  return `https://cedar.metadatacenter.org/instances/edit/https://repo.metadatacenter.org/template-instances/${id}`
}

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

// DIALOG: create fairmodel version
const dialogCreateFairmodelVersion = ref(false);
const newFairmodelVersionDefault = {
  update_description: '',
  update_type: '',
}
const newFairmodelVersionData = ref({...newFairmodelVersionDefault});

const createFairmodelVersion = async () => {
  const create = await fairmodelVersionApiService.create(fairmodel.value!.id, newFairmodelVersionData.value)
  if (create.status == 200) {
    $q.notify({type: 'positive', position: 'top-right', message: create.data.message})
    dialogCreateFairmodelVersion.value = false;
    newFairmodelVersionData.value = {...newFairmodelVersionDefault}
    tableRef.value?.requestServerInteraction()
  } else {
    $q.notify({type: 'warning', position: 'top-right', message: create.data.message}) 
  }
}

// DIALOG: set metadata
const setMetadataId = ref<FairmodelVersion['id']>()
const dialogSetMetadata = computed({
  get: () => setMetadataId.value !== undefined,
  set: (state: boolean) => setMetadataId.value = undefined // Always assume false when set directly
})
const actionSetMetadata = (version: FairmodelVersion) => {
  setMetadataId.value = version.id;
  Object.assign(setMetadataData, setMetadataDataDefault)
}
const setMetadataDataDefault = {
  metadata_id: '',
}
const setMetadataData = reactive({...setMetadataDataDefault})
const saveMetadata = async () => {
  const update = await fairmodelVersionApiService.update(
    fairmodel.value!.id,
    setMetadataId.value!,
    {metadata_id: setMetadataData.metadata_id}
  )
  if (update.status == 200) {
    $q.notify({type: 'positive', message: update.data.message})
    tableRef.value?.requestServerInteraction();
    dialogSetMetadata.value = false;
  } else {
    $q.notify({type: 'warning', message: update.data.message})
  }
}

// DIALOG: view metadata
const viewMetadataObject = ref<FairmodelVersion>();
const dialogViewMetadata = computed({
  get: () => viewMetadataObject.value !== undefined,
  set: (state: boolean) => viewMetadataObject.value = undefined // Always assume false when set directly
})
const actionViewMetadata = (version: FairmodelVersion) => {
  viewMetadataObject.value = {...version};
}

// DIALOG: set model file
// const dialogSetModel1 = ref(false);
const setModelDataDefault = {
  model_type: 'ONNX' as 'ONNX' | 'PMML',
  file: null as any | null
};
const setModelData = reactive({...setModelDataDefault})
const setModelObject = ref<FairmodelVersion>();
const dialogSetModel = computed({
  get: () => setModelObject.value !== undefined,
  set: (state: boolean) => setModelObject.value = undefined // Always assume false when set directly
})
const actionSetModel = (version: FairmodelVersion) => { 
  setModelObject.value = {...version};
  Object.assign(setModelData, setMetadataDataDefault);
}
const saveModelData = async () => {
  const upload = await fairmodelVersionApiService.uploadModel(fairmodel.value!.id, setModelObject.value!.id, setModelData)
  if (Math.floor(upload.status / 100) == 2) {
    $q.notify({type: 'positive', message: upload.data.message})
    tableRef.value?.requestServerInteraction();
    dialogSetModel.value = false;
  } else {
    $q.notify({type: 'warning', message: upload.data.message})
  }
}

// DIALOG: view model file
const viewModelObject = ref<FairmodelVersion>();
const dialogViewModel = computed({
  get: () => viewModelObject.value !== undefined,
  set: (state: boolean) => viewModelObject.value = undefined // Always assume false when set directly
})
const actionViewModel = (version: FairmodelVersion) => { 
  viewModelObject.value = {...version};
}
const downloadLoading = ref(false);
const downloadViewModel = async () => {
  downloadLoading.value = true;
  const down = await fairmodelVersionApiService.downloadModel(fairmodel.value!.id, viewModelObject.value!.id);
  if (down.status == 200) {
    const blob = new Blob([down.data], { type: down.headers['content-type'] });
    const link = document.createElement('a');
    link.download = `${fairmodel.value?.name.replace(/\s+/, '-')}-${viewModelObject.value!.version}.${viewModelObject.value!.model_type == 'ONNX' ? 'onnx' : 'pb'}`;
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

const linkModelObject = ref<FairmodelVersion>();
const dialogLinkModel = computed({
  get: () => linkModelObject.value !== undefined,
  set: (state: boolean) => linkModelObject.value = undefined // Always assume false when set directly
})
const actionLink = (version: FairmodelVersion) => {
  linkModelObject.value = {...version}
}
</script>

<template>
  <q-page v-if="fairmodel">
    <div class="row justify-center q-mt-xl">
      <div class="col-md-6">
        <h4 class="text-bold q-mt-md q-mb-lg">Fairmodel {{ fairmodel.name }}</h4>

        <q-btn color="primary" label="New Version" @click="dialogCreateFairmodelVersion = true" />

        <q-dialog v-model="dialogCreateFairmodelVersion">
          <q-card style="width: 64rem">
            <q-card-section>
              <div class="text-h5">Create new fairmodel version</div>
              <q-form
                @submit="createFairmodelVersion"
                class="q-gutter-md"
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
        
        <q-dialog v-model="dialogSetMetadata">
          <q-card style="width: 64rem">
            <q-card-section>
              <div class="text-h5">Set metadata</div>
              <q-form
                @submit="saveMetadata"
                class="q-gutter-md"
              >
                <q-input
                  v-model="setMetadataData.metadata_id"
                  filled
                  label="CEDAR metadata ID"
                />

                <q-btn type="submit" color="primary" label="Submit" />
              </q-form>
            </q-card-section>
          </q-card>
        </q-dialog>

        <q-dialog v-model="dialogViewMetadata">
          <q-card style="width: 64rem" v-if="viewMetadataObject">
            <q-card-section>
              <div class="text-h5">Metadata for {{ viewMetadataObject.version }}</div>
              <div
                class="q-gutter-md q-mt-lg"
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

                <q-field
                  filled
                  readonly
                >
                  <template v-slot:control>
                    {{ getMetadataURL(viewMetadataObject.metadata_id) }}
                  </template>
                  <template v-slot:append>
                    <q-btn
                      :href="getMetadataURL(viewMetadataObject.metadata_id)"
                      target="_blank"
                      icon="open_in_new"
                      round 
                      flat
                    />
                  </template>
                </q-field>
              </div>

              <div class="q-mt-md">Some more info here...</div>
            </q-card-section>
          </q-card>
        </q-dialog>
        
        <q-dialog v-model="dialogSetModel">
          <q-card style="width: 64rem">
            <q-card-section>
              <div class="text-h5">Set model file</div>
              <q-form
                @submit="saveModelData"
                class="q-gutter-md"
              >
                <q-select filled v-model="setModelData.model_type" :options="['ONNX', 'PMML']" label="Model type" />
                <q-file filled v-model="setModelData.file" label="File"></q-file>

                <q-btn type="submit" color="primary" label="Submit" />
              </q-form>
            </q-card-section>
          </q-card>
        </q-dialog>

        <q-dialog v-model="dialogLinkModel">
          <q-card style="width: 64rem">
            <q-card-section>
              <div class="text-h5">Link Model Features</div>
              
              <div>In this dialog you can link input and output features of the set metadata and uploaded model.</div>.

              <div>Model type: {{ viewModelObject?.model_type }}</div>
            
              <q-btn class="q-mt-md" color="primary" label="Done"></q-btn>
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
              <template v-slot:body-cell-metadata="props">
                <q-td :props="props">
                  <q-btn v-if="(props.row as FairmodelVersion).metadata_id == null" color="grey-7" size="md" flat rounded icon="check_box_outline_blank" @click="actionSetMetadata(props.row)">
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      Set metadata
                    </q-tooltip>
                  </q-btn>
                  <q-btn v-else color="green-10" flat rounded size="md" icon="check_box" @click="actionViewMetadata(props.row)">
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      View metadata
                    </q-tooltip>
                  </q-btn>
                </q-td>
              </template>
              <template v-slot:body-cell-model="props">
                <q-td :props="props">
                  <q-btn v-if="!(props.row as FairmodelVersion).has_model" color="grey-7" size="md" flat rounded icon="check_box_outline_blank" @click="actionSetModel(props.row)">
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      Set model
                    </q-tooltip>
                  </q-btn>
                  <q-btn v-else color="green-10" flat rounded size="md" icon="check_box" @click="actionViewModel(props.row)">
                    <q-tooltip anchor="top middle" :offset="[0, 25]">
                      View model
                    </q-tooltip>
                  </q-btn>
                </q-td>
              </template>`
              
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <!-- <q-btn size="sm" flat rounded icon="delete" @click="actionDelete(props.row)"></q-btn> -->
                  <q-btn size="md" flat rounded icon="link" color="indigo-8" @click="actionLink(props.row)">
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