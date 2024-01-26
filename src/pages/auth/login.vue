<script setup lang="ts">
import { useQuasar } from 'quasar';
import { LoginErrorKeys, authService } from 'src/utils/auth.service';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const email = ref('');
const password = ref('');

const loading = ref(false);

const default_field_errors = {
  email: [],
  password: [],
  non_field_errors: [],
};
const field_errors = reactive<Record<LoginErrorKeys, string[]>>(default_field_errors)

const login = async () => {
  loading.value = true;
  Object.assign(field_errors, default_field_errors);
  try {
    const login = await authService.login(email.value, password.value);
    if (login.status) {
      $q.notify({type: 'positive', position: 'top-right', message: 'Welcome back'})
      router.push('/')
    } else {
      for (let field of ['email', 'password', 'non_field_errors'] as LoginErrorKeys[]) {
        field_errors[field] = login.errors[field] ?? []
      }
      $q.notify({type: 'warning', position: 'top-right', message: 'Could not process your request. Please double-check your details'})
    }
  } catch (e) {
    $q.notify({type: 'negative', position: 'top-right', message: `There was an error processing your request: ${(e as Error).message}`})
  }
  loading.value = false;
}
</script>


<template>
  <q-page class="row items-center justify-evenly bg-grey-1">
    <q-card class="col-3 q-pa-lg rounded-lg">
      <div class="text-center font-mono">[fair4ai logo]</div>
      <div class="text-center text-h5 text-bold q-mt-sm q-mb-lg">Sign in</div>
      
      <q-form
        class="q-gutter-sm"
        @submit="login"
      >
        <q-input
          filled
          v-model="email"
          label="Email"
          hide-bottom-space
          :error-message="field_errors['email'].join('\n')"
          :error="field_errors['email'].length > 0"
        />

        <q-input
          filled
          type="password"
          v-model="password"
          label="Password"
          hide-bottom-space
          :error-message="field_errors['password'].join('\n')"
          :error="field_errors['password'].length > 0"
        />

        <div class="q-mt-md flex justify-center">
          <q-btn label="Login" type="submit" color="primary" :loading="loading" class="full-width"/>
          <!-- <q-btn label="Reset password" type="reset" color="primary" flat class="q-ml-sm" /> -->
        </div>

        <p class="text-subtitle1 text-center q-mt-md">Don't have an account yet? <router-link class="text-indigo" to="/auth/register">Sign up</router-link></p>

      </q-form>

    </q-card>
  </q-page>
</template>

