<script setup lang="ts">
</script>

<template>
  <q-page>
    <div class="row justify-center q-mt-xl">
      <div class="col-10 col-lg-8 col-xl-6">
        <h4 class="text-bold q-mt-md q-mb-lg">Welcome to FAIRmodels / FAIR4AI</h4>
        <div class="text-subtitle1">Select what you want to do below</div>
        
        <div class="q-mt-lg row">
          <div class="col-6">
            <q-card flat bordered class="shadow-8">
              <q-card-section class="bg-primary text-white ">
                <div class="text-h5">Fairmodels</div>
              </q-card-section>
              <q-card-actions vertical>
                <router-link custom v-slot:default="props" to="/fairmodel">
                  <q-btn v-bind="props" outline color="primary">View Fairmodels</q-btn>
                </router-link>
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

