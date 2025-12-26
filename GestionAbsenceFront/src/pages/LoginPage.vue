<template>
  <div class="page-wrapper">
    <main class="login-container">
      <h1>Connexion</h1>
      <p>Veuillez vous connecter pour accéder à l'application.</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email (ou identifiant UGA)</label>
          <input
            id="email"
            type="text"
            v-model="email"
            required
            placeholder="prénom.nom"
          />
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            v-model="password"
            required
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="button" :disabled="isLoading">
          {{ isLoading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth'; 

const router = useRouter();
const auth = useAuth();

const email = ref('');
const password = ref('');
const error = ref(null);
const isLoading = ref(false);

/**
 * Gère la soumission du formulaire de connexion.
 */
const handleLogin = async () => {
  error.value = null;
  isLoading.value = true;

  try {
    let finalEmail = email.value.trim();

    if (!finalEmail.includes('@')) {
      finalEmail = finalEmail + '@univ-grenoble-alpes.fr';
    } 
    
    const isStaff = finalEmail.endsWith('@univ-grenoble-alpes.fr');
    const isStudent = finalEmail.endsWith('@etu.univ-grenoble-alpes.fr');

    if (!isStaff && !isStudent) {
      error.value = "L'email doit être une adresse UGA (@univ-grenoble-alpes.fr ou @etu.univ-grenoble-alpes.fr)";
      isLoading.value = false;
      return;
    }

    const success = await auth.login(finalEmail, password.value);

    if (success) {
      const role = auth.userRole.value;

      if (role === 'GESTIONNAIRE') {
        router.push({ name: 'AdminDashboard' });
      } else if (role === 'ETUDIANT') {
        router.push({ name: 'MyAbsencesPage' }); 
      } else {
        router.push({ name: 'ProfessorDashboard' });
      }
    } else {
      error.value = 'Email ou mot de passe incorrect.';
    }
  } catch (err) {
    error.value = 'Une erreur est survenue. Veuillez réessayer.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
@import url('../shared/shared.css');
.page-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 70px); 
}
.login-container {
  max-width: 400px;
  width: 100%;
  padding: 2rem;
  border: 1px solid var(--color-3, #ccc);
  border-radius: 8px;
  background-color: var(--color-6, #fff);
}
h1 { text-align: center; color: var(--color-1, #333); }
p { text-align: center; margin-bottom: 2rem; }
.login-form { display: flex; flex-direction: column; gap: 1.5rem; }
.form-group { display: flex; flex-direction: column; }
.form-group label { margin-bottom: 0.5rem; font-weight: bold; color: var(--color-2, #555); }
.form-group input { padding: 0.75rem; border: 1px solid var(--color-3, #ccc); border-radius: 5px; font-size: 1rem; }
.button { padding: 0.75rem; font-size: 1.1rem; cursor: pointer; }
.button:disabled { background-color: var(--color-3, #ccc); cursor: not-allowed; }
.error-message { color: red; text-align: center; background-color: #ffeaea; padding: 0.75rem; border-radius: 5px; }
</style>