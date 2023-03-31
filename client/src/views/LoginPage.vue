<template>
  <div id="wrapper">
    <div id="logo"></div>
    <form
      action="#"
      id="login"
      class="col-s-8 col-m-6 col-l-5 col-xl-3"
      @submit.prevent="login"
    >
      <label for="username">Username</label>
      <div class="input-container">
        <input
          id="username"
          type="text"
          placeholder="Username"
          autocomplete="off"
          name="username"
          required
          autofocus
          v-model="username"
        />
        <span class="focus-border"></span>
      </div>

      <label for="password">Password</label>
      <div class="input-container">
        <input
          id="password"
          type="password"
          placeholder="Password"
          autocomplete="off"
          name="password"
          required
          v-model="password"
        />
        <span class="focus-border"></span>
      </div>

      <button id="submit" type="submit">Login</button>

      <!-- Error -->
      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import httpService from '@/services/http';
import { AxiosError } from 'axios';

export default defineComponent({
  name: 'LoginPage',
  data() {
    return {
      error: '',
      username: '',
      password: '',
    };
  },
  methods: {
    async login() {
      this.error = '';

      const body = {
        username: this.username,
        password: this.password,
      };

      try {
        await httpService.post(`/auth/login`, body);

        this.$router.push({ name: 'timeline' });
      } catch (err: unknown) {
        const error = err as AxiosError;
        if (error?.response?.status == 401) {
          this.error = 'Invalid username or password';
          this.password = '';
        }
      }
    },
  },
});
</script>

<style lang="scss" scoped>
#wrapper {
  padding: 10px;
  padding-top: 20px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

#logo {
  width: 75px;
  height: 75px;
  background-image: url('../assets/img/logo.png');
  background-size: contain;
}

#login {
  margin-top: 20px;
  padding: 2rem;
  border: 2px solid $secondary-color;
  display: flex;
  flex-direction: column;
}

input {
  height: 50px;
  width: 100%;
}

.input-container {
  position: relative;
}

input {
  margin-top: 10px;
  padding: 5px;
  font-size: 1.3rem;
  text-align: center;
  background: $secondary-color;
  color: $text-color;
  display: inline-block;
  border-bottom: 1px solid transparent;

  & ~ .focus-border {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: $accent-color;
    transition: 0.3s;
  }

  &:focus ~ .focus-border {
    width: 100%;
    left: 0;
  }
}

label {
  color: $text-color;
  font-family: roboto-500;
  font-size: 1.3rem;
  text-align: center;
}

label ~ label {
  margin-top: 30px;
}

#submit {
  margin-top: 30px;
  width: 100%;
  height: 50px;
  border: 1px solid $accent-color;
  background: none;
  color: $text-color;
  font-size: 1.3rem;
  font-family: roboto-500;
  transition: background-color 0.3s;

  &:hover,
  &:focus {
    background: $accent-color;
  }
}

/*
 Responsive
*/
@media only screen and (min-width: 768px) {
  #wrapper {
    padding-top: 150px;
  }
}

.error {
  margin-top: 1.5rem;
  width: 100%;
  color: $error-color;
  font-size: 1.3rem;
  text-align: center;
}
</style>
