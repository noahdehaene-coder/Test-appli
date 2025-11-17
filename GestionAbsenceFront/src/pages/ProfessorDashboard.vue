<template>
  <main class="left dashboard-container">
    <h1>Tableau de bord Professeur</h1>
    <p>Bienvenue sur votre espace de gestion des absences.</p>

    <div class="create-call-section">
      <button class="button primary-button" @click="goToCreateCall">
        + Créer un nouvel appel
      </button>
      <p>Créez un appel pour un groupe, une matière et une date de votre choix.</p>
    </div>

    <hr />

    <h2>Reprendre un appel (Modèles)</h2>
    
    <div v-if="isLoading" class="loading-message">
      Chargement de vos appels récents...
    </div>

    <div v-else-if="recentCalls.length === 0" class="empty-state">
      Vous n'avez pas encore d'appel enregistré.
    </div>

    <div v-else class="recent-calls-list">
      <p>Cliquez sur "Lancer" pour démarrer un appel pour aujourd'hui avec les mêmes paramètres de groupe et de matière.</p>
      <div v-for="call in recentCalls" :key="call.key" class="recent-call-item">
        <span>
          <strong>{{ call.courseName }}</strong> ({{ call.sessionType }})
          <br />
          <small>{{ call.groupName }}</small>
        </span>
        <button class="button" @click="startRecentCall(call)">Lancer (Aujourd'hui)</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// Importe la nouvelle fonction de votre fetcher de 'slots'
import { fetchRecentCalls } from '../shared/fetchers/slots';

const router = useRouter();
const recentCalls = ref([]);
const isLoading = ref(true);

/**
 * Au chargement de la page, récupère les modèles d'appels récents
 * pour ce professeur depuis le backend.
 */
onMounted(async () => {
  isLoading.value = true;
  recentCalls.value = await fetchRecentCalls();
  isLoading.value = false;
});

/**
 * Redirige vers la page de création d'appel manuelle.
 */
function goToCreateCall() {
  router.push({ name: 'CreateCallPage' }); // Route définie dans routes.js
}

/**
 * Démarre un appel basé sur un modèle récent, en utilisant la date du jour.
 * @param {object} callTemplate - Le modèle d'appel (groupe, matière, etc.)
 */
function startRecentCall(callTemplate) {
  // Le backend s'attend à un format de date ISO string
  const today = new Date().toISOString(); 
  
  // Navigue vers la page d'appel existante avec les paramètres pré-remplis
  router.push({
    name: 'CallPage', // La route vers CallPage.vue
    params: {
      groupId: callTemplate.groupId,
      groupName: callTemplate.groupName,
      courseName: callTemplate.courseName,
      sessionType: callTemplate.sessionType,
      date: today // Le paramètre important : la date
    }
  });
}
</script>

<style scoped>
@import url('../shared/shared.css');

.dashboard-container {
  max-width: 800px;
  margin: 2rem auto;
}

.create-call-section {
  background-color: var(--color-6, #f9f9f9);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.create-call-section p {
  margin-top: 0.5rem;
  color: var(--color-2, #555);
}

.primary-button {
  background-color: var(--color-1, #005a8f);
  color: white;
  font-size: 1.1rem;
  padding: 0.75rem 1.25rem;
}

hr {
  border: 0;
  border-top: 1px solid var(--color-3, #eee);
  margin: 2rem 0;
}

.loading-message, .empty-state {
  color: var(--color-2, #555);
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

.recent-calls-list > p {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.recent-call-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-3, #ccc);
  margin-bottom: 0.5rem;
  border-radius: 5px;
  background-color: var(--color-6, #fff);
}

.recent-call-item small {
  color: var(--color-2, #555);
}
</style>