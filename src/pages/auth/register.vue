<script setup lang="ts">
import { useQuasar } from 'quasar';
import { RegisterErrorKeys, authService } from 'src/utils/auth.service';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const email = ref('');
const password1 = ref('');
const password2 = ref('');

const loading = ref(false);

const default_field_errors = {
  email: [],
  password1: [],
  password2: [],
  non_field_errors: [],
};
const field_errors = reactive<Record<RegisterErrorKeys, string[]>>(default_field_errors)

const register = async () => {
  loading.value = true;
  Object.assign(field_errors, default_field_errors);
  try {
    const register = await authService.register(email.value, password1.value, password2.value);
    if (register.status) {
      $q.notify({type: 'positive', position: 'top-right', message: 'Succesfully registered'})
      router.push('/')
    } else {
      for (let field of ['email', 'password1', 'password2', 'non_field_errors'] as RegisterErrorKeys[]) {
        field_errors[field] = register.errors[field] ?? []
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
      <div class="text-center text-h5 text-bold q-mt-sm q-mb-lg">Sign up</div>
      
      <q-form
        class="q-gutter-sm"
        @submit="register" 
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
          v-model="password1"
          label="Password"
          hide-bottom-space
          :error-message="field_errors['password1'].join('\n')"
          :error="field_errors['password1'].length > 0"
        />
        <q-input
          filled
          type="password"
          v-model="password2"
          label="Repeat password"
          hide-bottom-space
          :error-message="field_errors['password2'].join('\n')"
          :error="field_errors['password2'].length > 0"
        />

        <div class="q-mt-md">
          <q-btn class="full-width" label="Register" type="submit" color="primary" :loading="loading" />
        </div>

        <div
          class="q-field__bottom q-field--error"
          v-if="field_errors['non_field_errors'].length > 0"
        >
          <div
            class="text-red-9"
            v-for="(msg, key) of field_errors['non_field_errors']" :key="key"
          >
            {{ msg }}
          </div>
        </div>

        <p class="text-subtitle1 text-center q-mt-md">Already have an account? <router-link class="text-indigo" to="/auth/login">Sign in</router-link></p>
      </q-form>

    </q-card>
  </q-page>
</template>