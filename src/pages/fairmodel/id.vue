<script setup lang="ts">
import { QTable, QTableProps, useQuasar } from 'quasar';
import { Fairmodel, FairmodelVersion, MetadataMappedLinks, MetadataVariable, ModelVariable } from 'src/types';
import { client } from 'src/utils/client';
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
  update_type: 'patch',
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
const loadingSaveMetadata = ref(false);
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
  loadingSaveMetadata.value = true;
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
  
  loadingSaveMetadata.value = false;
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
    link.download = `${fairmodel.value?.name.replace(/\s+/, '-')}-${viewModelObject.value!.version}.${viewModelObject.value!.model_type == 'ONNX' ? 'onnx' : 'pmml'}`;
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
});
const openLinkDialog = (version: FairmodelVersion) => {
  linkModelObject.value = {...version}

  linkModelVariablesLoading.value = true;
  fairmodelVersionApiService.getVariables(fairmodel.value!.id, version.id)
    .then((vars) => {
      linkModelVariables.value = vars.data.variables
      linkModelVariablesLoading.value = false;
    })
}

type VariableDirectionContainer = {
  metadata: Array<MetadataVariable>
  model: Array<ModelVariable>
}
type FairmodelVersionVariables = {
  input: VariableDirectionContainer,
  output: VariableDirectionContainer,
}
const linkModelVariablesLoading = ref(false);
const linkModelVariables = ref<FairmodelVersionVariables>();
const buttonSaveModelVariablesLinkLoading = ref(false);

const modelLinkedVarName = (type: 'input' | 'output', index: number) => {
  return computed({
    get(): string | null {
      return linkModelVariables.value![type].metadata[index].linked_model_var?.name ?? null;
    },
    set(value: string | null) {
      if (!value) {
        delete linkModelVariables.value![type].metadata[index].linked_model_var;
      } else {
        linkModelVariables.value![type].metadata[index].linked_model_var = {
          name: value,
          linked_dim_index: undefined,
          linked_dim_start: undefined,
          linked_dim_end: undefined
        }
      }
    }
  });
}

const getMetadataVariable = (direction: 'input' | 'output', index: number): MetadataVariable | undefined => {
  const metadata_var = linkModelVariables.value![direction].metadata[index];
  return metadata_var;
}

const getLinkedModelVariable = (direction: 'input' | 'output', index: number): ModelVariable | undefined => {
  const model_name = getMetadataVariable(direction, index)?.linked_model_var?.name
  if (!model_name) return undefined;
  return linkModelVariables.value![direction].model.find(x => x.name == model_name)!;
}

const linkedModelVariableAllDimensions = (direction: 'input' | 'output', index: number): number => {
  const modelVariable = getLinkedModelVariable(direction, index);
  if (!modelVariable) return 0;
  const fixedDims = modelVariable.type.tensorType?.shape?.dim.length;
  return fixedDims ? fixedDims : 0;
}

const linkedModelVariableSizeOfDimension = (direction: 'input' | 'output', index: number, dimensionIdx?: number | undefined): number => {
  const modelVariable = getLinkedModelVariable(direction, index);
  if (modelVariable == undefined)
    throw Error("Model variable could not be infered");
  if (dimensionIdx == undefined)
    dimensionIdx = getMetadataVariable(direction, index)!.linked_model_var!.linked_dim_index;
  if (dimensionIdx == undefined)
    throw Error("Argument dimensionIdx was not provided and could not be inferred")

  const dimValue = modelVariable.type?.tensorType?.shape?.dim[dimensionIdx].dimValue ?? 0;
  return dimValue;
}

const linkedModelVariableFixedDimensions = (direction: 'input' | 'output', index: number): number => {
  const modelVariable = getLinkedModelVariable(direction, index);
  if (!modelVariable) return 0;
  const fixedDims = (modelVariable.type.tensorType?.shape?.dim as Array<any>).filter(x => x.dimValue).length;
  console.log(modelVariable.type.tensorType?.shape?.dim)
  return fixedDims ? fixedDims : 0;
}

const saveModelVariableLinks = () => {
  const mapLinks = (combination: VariableDirectionContainer): MetadataMappedLinks => {
    return combination.metadata
      .map(meta => ({metadata_id: meta.id, link: meta.linked_model_var}))
      .filter(item => item.link && Object.keys(item.link).length > 0) as MetadataMappedLinks
  }

  const links: {input: MetadataMappedLinks, output: MetadataMappedLinks} = {
    input: mapLinks(linkModelVariables.value!.input),
    output: mapLinks(linkModelVariables.value!.output)
  }
  
  buttonSaveModelVariablesLinkLoading.value = true;
  fairmodelVersionApiService.saveLinks(fairmodel.value!.id, linkModelObject.value!.id, links)
    .then(() => {
      linkModelObject.value = undefined;
      buttonSaveModelVariablesLinkLoading.value = false;
      $q.notify({type: 'positive', message: "Successfully saved variable links"});
    })
}

const dimensionOptions = (direction: 'input' | 'output', index: number) => {
  return computed(() => {
    const arr = Array(linkedModelVariableAllDimensions(direction, index))
      .fill(0)
      .map((_, n) => n);
    
    return arr.map(n => {
      console.log("n is", n)
      const dimSize = linkedModelVariableSizeOfDimension(direction, index, n);
      return {
        value: n, 
        label: `Dimension ${n}` + (dimSize > 0 ? ` (has length ${dimSize})` : ''),
        disable: dimSize == 0
      }
    })
  })
}

const changeDimensionOption = (direction: 'input' | 'output', index: number) => {
  console.log("TO DO")
  if (getMetadataVariable(direction, index)?.linked_model_var?.linked_dim_index != undefined) {
    getMetadataVariable(direction, index)!.linked_model_var!.linked_dim_start = 0;
    getMetadataVariable(direction, index)!.linked_model_var!.linked_dim_end = 0;
  }
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

                <q-btn :loading="loadingSaveMetadata" type="submit" color="primary" label="Submit" />
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
        
        <q-dialog v-model="dialogViewModel">
          <q-card style="width: 64rem" v-if="viewModelObject">
            <q-card-section>
              <div class="text-h5">View model file</div>
              <div class="q-gutter-md">
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

        <q-dialog v-model="dialogLinkModel">
          <q-card style="min-width: 64rem">
            <q-card-section>
              <div class="text-h4">Link Model Features</div>
              
              <p>In this dialog you can link input and output features of the set metadata and uploaded model.</p>

              <p class="mb-">Model type: <strong>{{ linkModelObject?.model_type }}</strong></p>

              <template v-if="linkModelVariables">
                <template v-for="direction in (['input', 'output'] as const)" :key="direction">
                  <div class="text-h5">{{ direction[0].toUpperCase() + direction.slice(1) }} variables</div>
                  <div
                    class="q-pa-md q-mb-sm bg-blue-2"
                    style="display: flex; align-items: start; border-radius: 3px;"
                    v-for="(varMeta, i) of linkModelVariables[direction].metadata" :key="varMeta.id"
                  >
                    <span style="width: 50%">
                      <span style="display: block; font-weight: 700;">{{ varMeta.name }}</span>
                      <span style="opacity: 0.5">{{ varMeta.id }}</span>
                    </span>
                    <div style="width: 50%">
                      <q-select
                        style="width: 100%"
                        clearable filled
                        v-model="modelLinkedVarName(direction, i).value"
                        :options="linkModelVariables[direction].model.map(x => x.name)"
                      />
                      <div v-if="linkedModelVariableFixedDimensions(direction, i) > 0">
                        <span style="display: block" class="q-my-sm">This variable has <strong>{{ linkedModelVariableFixedDimensions(direction, i) }}</strong> dimensions with fixed length. Specify to which dimension and indices of this dimension this variable corresponds:</span>
                        <q-select
                          v-model="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_index"
                          :options="dimensionOptions(direction, i).value"
                          emit-value
                          @update:model-value="changeDimensionOption(direction, i)"
                        />
                        <div v-if="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_index" class="q-mt-sm" style="display: flex; justify-content: space-between; align-items: center;">
                          <q-input
                            class="inline"
                            filled
                            v-model.number="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_start"
                            :min="0"  
                            :max="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_end ?? (linkedModelVariableSizeOfDimension(direction, i) - 1)"
                            type="number"
                          />
                          <span>untill</span>
                          <q-input
                            class="inline"
                            filled
                            v-model.number="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_end"
                            :min="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_start ?? 0"
                            :max="(linkedModelVariableSizeOfDimension(direction, i) - 1)"
                            type="number"
                          />
                        </div>

                        <!-- doesn't work exactly
                        <q-select
                          class="inline" filled
                          v-model="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_start"
                          use-input
                          :options="Array(linkedModelVariableDimensions(direction, i)).fill(0).map((_, n) => ({value: n+1, label: n+1, disable: n+1 > linkModelVariables![direction].metadata[i].linked_model_var!.linked_dim_end}))"
                        />
                        <q-select
                          class="inline" filled
                          v-model="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_end"
                          use-input
                          :options="Array(linkedModelVariableDimensions(direction, i)).fill(0).map((_, n) => ({value: n+1, label: n+1, disable: n+1 < linkModelVariables![direction].metadata[i].linked_model_var!.linked_dim_start}))"
                        />
                        -->
                      </div>
                      <div v-if="modelLinkedVarName(direction, i).value && linkedModelVariableFixedDimensions(direction, i) == 0">
                        <span style="display: block" class="q-my-sm">This variable has no fixed dimensions.</span>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            
              <q-btn class="q-mt-md" color="primary" label="Save" @click="saveModelVariableLinks"></q-btn>

              <q-inner-loading :showing="linkModelVariablesLoading" />
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
                  <q-btn size="md" flat rounded icon="link" color="indigo-8" @click="openLinkDialog(props.row)">
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