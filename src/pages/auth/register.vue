<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');
const password1 = ref('');
const password2 = ref('');
</script>

<template>
  <q-page class="row items-center justify-evenly bg-grey-1">
    <q-card class="col-3 q-pa-lg rounded-lg">
      <div class="text-center font-mono">[fair4ai logo]</div>
      <div class="text-center text-h5 text-bold q-mt-sm q-mb-lg">Sign up</div>
      
      <q-form
        class="q-gutter-sm"
      >
        <q-input
          filled
          v-model="email"
          label="Email"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please enter your email']"
        />

        <q-input
          filled
          type="password"
          v-model="password1"
          label="Password"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please enter your password']"
        />
        <q-input
          filled
          type="password"
          v-model="password2"
          label="Repeat password"
          lazy-rules
          :rules="[
            val => val && val.length > 0 || 'Please enter your password',
            val => val == password1 || 'Passwords do not match'
          ]"
        />

        <div class="q-mt-md">
          <q-btn class="full-width" label="Register" type="submit" color="primary"/>
        </div>

        <p class="text-subtitle1 text-center q-mt-md">Already have an account? <router-link class="text-indigo" to="/auth/login">Sign in</router-link></p>

      </q-form>

    </q-card>
  </q-page>
</template>

