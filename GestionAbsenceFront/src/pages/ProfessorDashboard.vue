<template>
  <main class="left dashboard-container">
    <h1>Tableau de bord Professeur</h1>
    <p>Bienvenue sur votre espace de gestion des absences.</p>

    <div class="create-call-section">
      <button class="button primary-button" @click="goToCreateCall">
        + Créer un nouvel appel
      </button>
      <p>Créez un appel pour un groupe, une matière et une date de votre choix.</p>

      <button class="button primary-button" @click="configure">
        Mes matières
      </button>
      <p>Sélectionner/Modifier vos matières</p>
    </div>

    <hr />

    <div v-if="todayCalls.length > 0" class="today-calls-section">
      <h2>Appels d'aujourd'hui (En cours)</h2>
      <p class="info-text">Vous pouvez modifier les appels créés aujourd'hui.</p>
      
      <div class="recent-calls-list">
        <div v-for="slot in todayCalls" :key="slot.id" class="recent-call-item active-call">
          <div class="call-info">
            <strong>{{ slot.slot_session_type?.session_type_course_material?.name || 'Cours' }}</strong> 
            <span class="text-muted">({{ slot.slot_session_type?.sessionTypeGlobal?.name }})</span>
            <br />
            <small>{{ slot.slot_group?.name || 'Groupe' }}</small> 
          </div>

          <div class="slot-time">
              🕒 {{ formatTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
          </div>

          <button class="button secondary-button" @click="editExistingCall(slot)">
            Reprendre l'appel
          </button>
        </div>
      </div>
    </div>

    <hr v-if="recentCalls.length > 0" />

    <div v-if="recentCalls.length > 0" class="recent-calls-section">
      <h2>Relancer un appel récent</h2>
      <p class="info-text">Cliquez sur un modèle pour créer un appel aujourd'hui. N'oubliez pas de modifier les horaires si nécessaire.</p>
      
      <div class="recent-calls-list">
        <div v-for="call in recentCalls" :key="call.id" class="recent-call-item">
          
          <div class="call-info">
            <strong>{{ call.courseName }}</strong>
            <span class="text-muted"> - {{ call.sessionType }}</span>
            <br>
            <small>{{ call.groupName }}</small>
          </div>

          <div class="time-selector">
            <div class="time-field">
              <label>Début</label>
              <input type="time" v-model="call.inputStart" class="time-input">
            </div>
            <div class="time-field">
              <label>Fin</label>
              <input type="time" v-model="call.inputEnd" class="time-input">
            </div>
          </div>

          <button class="button action-button" @click="startRecentCall(call)">
            Lancer
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading && todayCalls.length === 0" class="empty-state">
      Aucun appel récent trouvé.
    </div>
    
    <div v-if="isLoading" class="loading-message">Chargement...</div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { getUser } from '@/shared/fetchers/user';
import { fetchRecentCalls, fetchSlotsByDate } from '@/shared/fetchers/slots'; 

const router = useRouter();
const professorName = ref("");
const recentCalls = ref([]);
const todayCalls = ref([]);
const isLoading = ref(true);

function getTimeFromIso(isoString) {
  if (!isoString) return "08:00"; 
  const date = new Date(isoString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

onMounted(async () => {
  try {
    const user = await getUser();
    if (user) {
      professorName.value = user.name;
      
      const today = new Date().toISOString().split('T')[0]; // Date YYYY-MM-DD

      const [rawRecentCalls, rawTodaySlots] = await Promise.all([
        fetchRecentCalls(),
        fetchSlotsByDate(today)
      ]);
      
      recentCalls.value = (rawRecentCalls || []).map(call => ({
        ...call,
        inputStart: call.start_time ? getTimeFromIso(call.start_time) : "08:00",
        inputEnd: call.end_time ? getTimeFromIso(call.end_time) : "10:00"
      }));

      todayCalls.value = rawTodaySlots || [];
    }
  } catch (error) {
    console.error("Erreur chargement dashboard :", error);
  } finally {
    isLoading.value = false;
  }
});

function goToCreateCall() { router.push('/call/new'); }
function configure() { router.push('/configuration/matieres'); }

/**
 * LANCE UN NOUVEL APPEL BASÉ SUR LE MODÈLE ET L'HEURE CHOISIE
 */
function startRecentCall(callTemplate) {
  const now = new Date();
  const dateYMD = now.toISOString().split('T')[0];

  const startIso = new Date(`${dateYMD}T${callTemplate.inputStart}:00`).toISOString();
  const endIso = new Date(`${dateYMD}T${callTemplate.inputEnd}:00`).toISOString();

  router.push({
    name: 'CallPage', 
    params: {
      groupId: callTemplate.groupId,
      groupName: callTemplate.groupName || 'Groupe',
      courseName: callTemplate.courseName || 'Cours',
      sessionTypeName: callTemplate.sessionType || 'Cours', 
      sessionTypeGlobalId: callTemplate.sessionTypeGlobalId,
      date: now.toISOString(),
      
      startTime: startIso,
      endTime: endIso
    }
  });
}

/**
 * REPREND UN APPEL DÉJÀ CRÉÉ AUJOURD'HUI
 */
function editExistingCall(slot) {
  const dateIso = new Date(slot.date).toISOString();
  const safeStart = slot.start_time ? new Date(slot.start_time).toISOString() : dateIso;
  const safeEnd = slot.end_time ? new Date(slot.end_time).toISOString() : dateIso;

  router.push({
    name: 'CallPage', 
    params: {
      groupId: slot.group_id || slot.slot_group?.id,
      groupName: slot.slot_group?.name,
      courseName: slot.slot_session_type?.session_type_course_material?.name,
      sessionTypeName: slot.slot_session_type?.sessionTypeGlobal?.name, 
      sessionTypeGlobalId: slot.slot_session_type?.sessionTypeGlobal?.id, 
      date: dateIso,
      startTime: safeStart,
      endTime: safeEnd
    }
  });
}
</script>

<style scoped>
@import url("../shared/shared.css");

.dashboard-container {
  max-width: 800px;
  margin: 2rem auto;
}

.create-call-section {
  background-color: var(--color-6, #f9f9f9);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
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
  gap: 0.8rem;
}

/* Style de la carte */
.recent-call-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 1px solid #ddd;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  gap: 1rem;
  flex-wrap: wrap; /* Important pour mobile */
}

.active-call {
  border-left: 5px solid var(--color-1, #005a8f);
  background-color: #eef6fc;
}

.call-info {
  flex: 1;
  min-width: 150px;
}

.text-muted {
  color: #777;
  font-size: 0.9em;
}

.slot-time {
  color: #555;
  font-weight: bold;
  margin-top: 5px;
}

/* --- Style des sélecteurs d'heure --- */
.time-selector {
  display: flex;
  gap: 10px;
  background: transparent;
  padding: 5px 10px;
  border-radius: 6px;
  align-items: center;
}

.time-field {
  display: flex;
  flex-direction: column;
}

.time-field label {
  font-size: 0.7rem;
  color: #666;
  margin-bottom: 2px;
}

.time-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 3px;
  color: #333;
  cursor: pointer;
}

/* Bouton Modifier (Contour bleu, fond blanc) */
.secondary-button {
  background-color: white;
  border: 1px solid var(--color-1, #005a8f);
  color: var(--color-1, #005a8f);
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.action-button {
  background-color: var(--color-1, #005a8f);
  color: white;
  white-space: nowrap;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>