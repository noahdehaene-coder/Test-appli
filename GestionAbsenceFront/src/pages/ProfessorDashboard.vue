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

    <div v-if="todayCalls.length > 0" class="today-calls-section">
      <h2>Appels d'aujourd'hui (En cours)</h2>
      <p class="info-text">Vous pouvez modifier les appels créés aujourd'hui.</p>
      
      <div class="recent-calls-list">
        <div v-for="slot in todayCalls" :key="slot.id" class="recent-call-item active-call">
          <span>
            <strong>{{ slot.slot_session_type.session_type_course_material.name }}</strong> 
            ({{ slot.slot_session_type.sessionTypeGlobal.name }})
            <br />
            <small>{{ slot.slot_group.name }}</small>
          </span>
          
          <button class="button secondary-button" @click="editExistingCall(slot)">
            Modifier l'appel
          </button>
        </div>
      </div>
      <hr />
    </div>

    <h2>Reprendre un appel (Modèles)</h2>
    
    <div v-if="isLoading" class="loading-message">
      Chargement...
    </div>

    <div v-else-if="recentCalls.length === 0 && todayCalls.length === 0" class="empty-state">
      Vous n'avez pas encore d'appel enregistré.
    </div>

    <div v-else class="recent-calls-list">
      <p class="info-text">Cliquez sur "Lancer" pour créer un NOUVEL appel pour aujourd'hui sur ce modèle.</p>
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
// Assurez-vous que fetchSlotsByDate est bien exporté dans slots.js
import { fetchRecentCalls, fetchSlotsByDate } from '../shared/fetchers/slots';

const router = useRouter();
const recentCalls = ref([]);
const todayCalls = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  isLoading.value = true;
  
  // 1. Charger les modèles (Templates)
  recentCalls.value = await fetchRecentCalls();

  // 2. Charger les appels spécifiques D'AUJOURD'HUI pour les modifier
  const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  try {
    const slots = await fetchSlotsByDate(today);
    if (slots) {
      todayCalls.value = slots;
    }
  } catch (e) {
    console.error("Impossible de charger les appels du jour", e);
  }

  isLoading.value = false;
});

function goToCreateCall() {
  router.push({ name: 'CreateCallPage' });
}

/**
 * MODIFIER UN APPEL EXISTANT
 * Redirige vers CallPage avec les paramètres du slot existant.
 * La page CallPage détectera que le slot existe et chargera les cases déjà cochées.
 */
function editExistingCall(slot) {
  // On formate la date proprement pour l'URL
  const dateIso = new Date(slot.date).toISOString();

  router.push({
    name: 'CallPage', 
    params: {
      groupId: slot.group_id,
      groupName: slot.slot_group.name,
      courseName: slot.slot_session_type.session_type_course_material.name,
      sessionTypeName: slot.slot_session_type.sessionTypeGlobal.name, 
      sessionTypeGlobalId: slot.slot_session_type.sessionTypeGlobal.id, 
      date: dateIso
    }
  });
}

/**
 * LANCER UN NOUVEL APPEL (Basé sur un modèle)
 */
function startRecentCall(callTemplate) {
  const today = new Date().toISOString(); 
  
  router.push({
    name: 'CallPage', 
    params: {
      groupId: callTemplate.groupId,
      groupName: callTemplate.groupName,
      courseName: callTemplate.courseName,
      sessionTypeName: callTemplate.sessionType, 
      sessionTypeGlobalId: callTemplate.sessionTypeGlobalId, 
      date: today
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

.info-text {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.recent-calls-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-call-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-3, #ccc);
  border-radius: 5px;
  background-color: var(--color-6, #fff);
}

/* Style spécifique pour les appels du jour (bordure bleue pour les distinguer) */
.active-call {
  border-left: 5px solid var(--color-1, #005a8f);
  background-color: #eef6fc;
}

.recent-call-item small {
  color: var(--color-2, #555);
}

/* Bouton Modifier (Contour bleu, fond blanc) */
.secondary-button {
  background-color: white;
  border: 1px solid var(--color-1, #005a8f);
  color: var(--color-1, #005a8f);
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.secondary-button:hover {
  background-color: var(--color-1, #005a8f);
  color: white;
}
</style>