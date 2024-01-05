<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');
const password = ref('');
</script>

<template>
  <q-page class="row items-center justify-evenly bg-grey-1">
    <q-card class="col-3 q-pa-lg rounded-lg">
      <div class="text-center font-mono">[fair4ai logo]</div>
      <div class="text-center text-h5 text-bold q-mt-sm q-mb-lg">Sign in</div>
      
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
          v-model="password"
          label="Password"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please enter your password']"
        />

        <div class="q-mt-md flex">
          <q-btn label="Login" type="submit" color="primary"/>
          <q-btn label="Reset password" type="reset" color="primary" flat class="q-ml-sm" />
        </div>

        <p class="text-subtitle1 text-center q-mt-md">Don't have an account yet? <router-link class="text-indigo" to="/auth/register">Sign up</router-link></p>

      </q-form>

    </q-card>
  </q-page>
</template>

