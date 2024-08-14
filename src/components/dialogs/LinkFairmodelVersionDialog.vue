<script setup lang="ts">
import { useQuasar } from 'quasar';
import { FairmodelVersion, MetadataMappedLinks, MetadataVariable, MetadataVariableMetadata, ModelVariable } from 'src/types';
import { fairmodelVersionApiService } from 'src/utils/fairmodelversion.api.service';
import { computed, ref, watch } from 'vue';

const $q = useQuasar()

const props = defineProps<{
  fairmodelId: string
}>();

const linkModelObject = defineModel<FairmodelVersion>();

const dialogLinkModel = computed({
  get: () => linkModelObject.value !== undefined,
  set: (state: boolean) => linkModelObject.value = undefined // Always assume false when set directly
});

watch(() => dialogLinkModel.value, () => {
  if (!dialogLinkModel.value) return;

  linkModelVariablesLoading.value = true;
  fairmodelVersionApiService.getVariables(props.fairmodelId, linkModelObject.value!.id)
    .then((res) => {
      if (res.status < 200 || res.status >= 300) {
        $q.notify({type: 'negative', message: res.data.message ?? 'Failed retrieving link data for this item'});
        dialogLinkModel.value = false;
      } else {
        linkModelVariables.value = res.data.variables
        linkModelVariablesLoading.value = false;
      }

      linkModelVariablesLoading.value = false;
    })
})

type VariableDirectionContainer = {
  metadata: Array<MetadataVariable>
  model: Array<ModelVariable>
}
type FairmodelVersionVariables = {
  input: VariableDirectionContainer,
  output: VariableDirectionContainer,
}
const linkModelVariablesLoading = ref(false);
const linkModelVariables = ref<FairmodelVersionVariables>({
  input: {metadata: [], model: []},
  output: {metadata: [], model: []}
});
const buttonSaveModelVariablesLinkLoading = ref(false);

const modelLinkedVarName = (direction: 'input' | 'output', index: number) => {
  return computed({
    get(): string | null {
      return linkModelVariables.value![direction].metadata[index].linked_model_var?.name ?? null;
    },
    set(value: string | null) {
      if (!value) {
        delete linkModelVariables.value![direction].metadata[index].linked_model_var;
      } else {
        linkModelVariables.value![direction].metadata[index].linked_model_var = {
          name: value,
          linked_dim_index: undefined,
          linked_dim_start: undefined,
          linked_dim_end: undefined
        }
      }
    }
  });
}

const updateModelLinkedVarName = (direction: 'input' | 'output', i: number) => {
  const options = dimensionOptions(direction, i).value.filter(x => !x.disable);
  if (options.length > 0) {
    linkModelVariables.value[direction].metadata[i].linked_model_var!.linked_dim_index = options[0].value;
    linkModelVariables.value[direction].metadata[i].linked_model_var!.linked_dim_start = 0;
    linkModelVariables.value[direction].metadata[i].linked_model_var!.linked_dim_end = 0;
  }
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

const updateDimensionSize = (bound: 'start' | 'end', direction: 'input' | 'output', i: number, e: any) => {
  if (!linkModelVariables.value) throw Error("linkModelVariables not defined")
  
  if (bound == 'start') {
    if (e > linkModelVariables.value[direction].metadata[i].linked_model_var!.linked_dim_end!)
      linkModelVariables.value[direction].metadata[i].linked_model_var!.linked_dim_end = e;
  } else if (bound == 'end') {
    if (e < linkModelVariables.value[direction].metadata[i].linked_model_var!.linked_dim_start!)
      linkModelVariables.value[direction].metadata[i].linked_model_var!.linked_dim_start = e;
  }
}

const linkedModelVariableFixedDimensions = (direction: 'input' | 'output', index: number): number => {
  const modelVariable = getLinkedModelVariable(direction, index);
  if (!modelVariable) return 0;
  if (!modelVariable.type.tensorType) return 0;
  const fixedDims = (modelVariable.type.tensorType.shape?.dim as Array<any>).filter(x => x.dimValue).length;
  return fixedDims ? fixedDims : 0;
}

const saveModelVariableLinks = () => {
  const mapLinks = (combination: VariableDirectionContainer): MetadataMappedLinks => {
    return combination.metadata
      .map(metavar => ({
        metadata_id: metavar.id,
        link: metavar.linked_model_var,
        meta: metavar.meta
      }))
      .filter(item => item.link && Object.keys(item.link).length > 0) as MetadataMappedLinks
  }

  const links: {input: MetadataMappedLinks, output: MetadataMappedLinks} = {
    input: mapLinks(linkModelVariables.value!.input),
    output: mapLinks(linkModelVariables.value!.output)
  }
  
  buttonSaveModelVariablesLinkLoading.value = true;
  fairmodelVersionApiService.saveLinks(props.fairmodelId, linkModelObject.value!.id, links)
    .then((res) => {
      if (res.status >= 200 && res.status <= 299) {
        linkModelObject.value = undefined;
        buttonSaveModelVariablesLinkLoading.value = false;
        $q.notify({type: 'positive', message: "Successfully saved variable links"});
      } else {
        $q.notify({type: 'negative', message: "Something went wrong!"})
      }
    })
}

const dimensionOptions = (direction: 'input' | 'output', index: number) => {
  return computed(() => {
    const arr = Array(linkedModelVariableAllDimensions(direction, index))
      .fill(0)
      .map((_, n) => n);
    
    return arr.map(n => {
      const dimSize = linkedModelVariableSizeOfDimension(direction, index, n);
      return {
        value: n, 
        label: `Dimension ${n}` + (dimSize > 0 ? ` (has length ${dimSize})` : ''),
        disable: dimSize == 0
      }
    })
  })
}

const updateDimensionOption = (direction: 'input' | 'output', index: number) => {
  if (getMetadataVariable(direction, index)?.linked_model_var?.linked_dim_index != undefined) {
    getMetadataVariable(direction, index)!.linked_model_var!.linked_dim_start = 0;
    getMetadataVariable(direction, index)!.linked_model_var!.linked_dim_end = 0;
  }
}

const updateVariableType = (direction: 'input' | 'output', i: number, type: MetadataVariableMetadata['type']) => {
  if (type == undefined) {
    linkModelVariables.value[direction].metadata[i].meta = undefined;
  } else if (type == 'CATEGORICAL') {
    linkModelVariables.value[direction].metadata[i].meta = {
      type: 'CATEGORICAL',
      categories: [],
    }
  } else if (type == 'NUMERICAL') {
    linkModelVariables.value[direction].metadata[i].meta = {
      type: 'NUMERICAL',
      unit: '',
    }
  }
}

const isVariableConfigured = computed(() => (direction: 'input' | 'output', i: number) => {
  if (!linkModelVariables.value[direction].metadata[i].meta)
    return false;

  if (!linkModelVariables.value[direction].metadata[i].linked_model_var)
    return false;

  return true;
})

// type MappedCategory = {
//   key: string,
//   value: string,
// }

// const newCategoryField = ref<Record<string, MappedCategory>>();

</script>

<template>
  <q-dialog v-model="dialogLinkModel" no-esc-dismiss>
    <q-card style="min-width: 64rem">
      <q-card-section>
        <div class="text-h4">Link Model Features</div>
        
        <p>In this dialog you can link input and output features of the set metadata and uploaded model.</p>

        <p>Model type: <strong>{{ linkModelObject?.model_type }}</strong></p>

        <template v-if="linkModelVariables">
          <template v-for="direction in (['input', 'output'] as const)" :key="direction">
            <div class="text-h5 q-mb-md">{{ direction[0].toUpperCase() + direction.slice(1) }} variables</div>
            <div style="display: flex; border-radius: 3px;" class="text-weight-medium bg-grey-4 q-mb-sm">
              <span style="width: 50%;" class="q-px-md q-py-sm">Metadata</span>
              <span style="width: 50%;" class="q-px-md q-py-sm">Model</span>
            </div>
            <div
              class="q-mb-sm row"
              :class="isVariableConfigured(direction, i) ? 'bg-green-1' : 'aaabg-amber-2 bg-grey-2'"
              v-for="(varMeta, i) of linkModelVariables[direction].metadata" :key="varMeta.id"
            >
              <div class="col q-pa-md" style="border-right: 2px solid rgba(0, 0, 0, 0.1);">
                <div>
                  <span style="display: block; font-weight: 700;">{{ varMeta.name }}</span>
                  <span style="opacity: 0.5">{{ varMeta.id }}</span>
                </div>
                <div class="q-mt-md">
                  <q-btn-toggle
                    :model-value="linkModelVariables[direction].metadata[i].meta?.type ?? undefined"
                    @update:model-value="(v) => updateVariableType(direction, i, v)"
                    toggle-color="blue-grey-10"
                    color="blue-grey-5"
                    no-caps
                    clearable
                    :options="[
                      {label: 'Categorical', value: 'CATEGORICAL'},
                      {label: 'Numerical', value: 'NUMERICAL'}
                    ]"
                  />
                  <div v-if="!linkModelVariables[direction].metadata[i].meta">
                    <p class="q-my-md text-caption">Select a data-type for this variable</p>
                  </div>
                  <div v-else-if="linkModelVariables[direction].metadata[i].meta.type == 'CATEGORICAL'">
                    <p class="q-my-md text-caption">Specify the categories for this categorical variable:</p>
                    <q-select
                      label="Categories"
                      filled dense
                      v-model="linkModelVariables[direction].metadata[i].meta.categories"
                      use-input
                      use-chips
                      multiple
                      hide-dropdown-icon
                      input-debounce="0"
                      new-value-mode="add-unique"
                    />
                    <!-- 
                    <div v-for="category in linkModelVariables[direction].metadata[i].meta.categories" :key="category">
                      {{ category }}
                    </div>
                    <div style="display: flex;">
                      <q-input
                        class="q-ml-sm"
                        label="Name"
                        filled dense
                        v-model="newCategoryField[direction].metadata[i].meta"
                      />
                      <q-input
                        class="q-ml-sm"
                        label="Value"
                        filled dense
                        v-model="linkModelVariables[direction].metadata[i].meta"
                      />
                      <q-btn class="q-ml-sm">Add</q-btn>
                    </div>
                      -->
                  </div>
                  <div v-else-if="linkModelVariables[direction].metadata[i].meta.type == 'NUMERICAL'">
                    <p class="q-my-md text-caption">Specify the unit for this numerical variable:</p>
                    <q-input
                      label="Unit"
                      filled dense
                      v-model="linkModelVariables[direction].metadata[i].meta.unit"
                    />
                  </div>
                </div>
              </div>
              <div class="col q-pa-md">
                <q-select
                  style="width: 100%"
                  clearable filled
                  label="Model variable"
                  v-model="modelLinkedVarName(direction, i).value"
                  @update:model-value="updateModelLinkedVarName(direction, i)"
                  :options="linkModelVariables[direction].model.map(x => x.name)"
                />
                <div v-if="linkedModelVariableFixedDimensions(direction, i) > 0">
                  <span style="display: block" class="q-my-sm">This variable has <strong>{{ linkedModelVariableFixedDimensions(direction, i) }}</strong> dimensions with fixed length. Specify to which dimension and indices of this dimension this variable corresponds:</span>
                  <q-select
                    filled
                    v-model="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_index"
                    :options="dimensionOptions(direction, i).value"
                    emit-value
                    @update:model-value="updateDimensionOption(direction, i)"
                  />
                  <div v-if="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_index" class="q-mt-sm" style="display: flex; justify-content: space-between; align-items: center;">
                    <q-input
                      class="inline"
                      filled
                      v-model.number="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_start"
                      @update:model-value="e => updateDimensionSize('start', direction, i, e)"
                      :min="0"  
                      :max="(linkedModelVariableSizeOfDimension(direction, i) - 1)"
                      type="number"
                    />
                    <span>untill</span>
                    <q-input
                      class="inline"
                      filled
                      v-model.number="linkModelVariables[direction].metadata[i].linked_model_var!.linked_dim_end"
                      @update:model-value="e => updateDimensionSize('end', direction, i, e)"
                      :min="0"
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
        <q-btn class="q-mt-md q-ml-sm" color="grey-8" label="Cancel" @click="dialogLinkModel = false"></q-btn>

        <q-inner-loading :showing="linkModelVariablesLoading" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>