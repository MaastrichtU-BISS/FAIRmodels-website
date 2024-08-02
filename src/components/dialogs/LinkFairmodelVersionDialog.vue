<script setup lang="ts">
import { useQuasar } from 'quasar';
import { FairmodelVersion, MetadataMappedLinks, MetadataVariable, ModelVariable } from 'src/types';
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
  fairmodelVersionApiService.saveLinks(props.fairmodelId, linkModelObject.value!.id, links)
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

        <q-inner-loading :showing="linkModelVariablesLoading" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>