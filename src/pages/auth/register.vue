<script setup lang="ts">
import { watch } from 'fs';
import { useQuasar } from 'quasar';
import { authService } from 'src/utils/auth.service';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const email = ref('');
const password1 = ref('');
const password2 = ref('');

const loading = ref(false);

const field_errors = reactive<Record<'email' | 'password1' | 'password2', string[]>>({
  email: [],
  password1: [],
  password2: []
})

const register = async () => {
  loading.value = true;
  try {
    const register = await authService.register(email.value, password1.value, password2.value);
    if (register.status) {
      $q.notify({type: 'positive', position: 'top-right', message: 'Succesfully registered'})
      router.push('/')
    } else {
      if (register.errors) {
        for (let field of ['email', 'password1', 'password2'] as const) {
          field_errors[field] = register.errors[field] ?? []
        }
      }
      $q.notify({type: 'warning', position: 'top-right', message: 'Could not process your request. Please double-check your details'})
    }
  } catch (e) {
    $q.notify({type: 'negative', position: 'top-right', message: 'There was an error processing your request'})
  }
  loading.value = false;
}
</script>

<template>
  <q-page class="row items-center justify-evenly bg-grey-1">
    <q-card class="col-3 q-pa-lg rounded-lg">
      <span>{{ JSON.stringify(field_errors) }}</span>
      <div class="text-center font-mono">[fair4ai logo]</div>
      <div class="text-center text-h5 text-bold q-mt-sm q-mb-lg">Sign up</div>
      
      <q-form
        class="q-gutter-sm"
        @submit="register" 
      >
        <q-input
          filled
          v-model="email"
          label="Email"
          :error-message="field_errors['email'].join('\n')"
          :error="field_errors['email'].length > 0"
        />

        <q-input
          filled
          type="password"
          v-model="password1"
          label="Password"
          lazy-rules
          :error-message="field_errors['password1'].join('\n')"
          :error="field_errors['password1'].length > 0"
        />
        <q-input
          filled
          type="password"
          v-model="password2"
          label="Repeat password"
          lazy-rules
          :error-message="field_errors['password2'].join('\n')"
          :error="field_errors['password2'].length > 0"
        />

        <div class="q-mt-md">
          <q-btn class="full-width" label="Register" type="submit" color="primary" :loading="loading" />
        </div>

        <p class="text-subtitle1 text-center q-mt-md">Already have an account? <router-link class="text-indigo" to="/auth/login">Sign in</router-link></p>

      </q-form>

    </q-card>
  </q-page>
</template>

