<script setup lang="ts">
import { QTable, QTableProps, useQuasar } from 'quasar';
import { modelApiService } from 'src/utils/model.api.service';
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar()
const router = useRouter();

</script>

<template>
  <q-page>
    <div class="row justify-center q-mt-xl">
      <div class="col-md-6">
        <h4 class="text-bold q-mt-md q-mb-lg">Fairmodel</h4>
      </div>
    </div>
  </q-page>
</template>