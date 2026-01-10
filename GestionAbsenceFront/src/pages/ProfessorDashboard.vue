<template>
  <div class="dashboard-wrapper">
    <!-- Colonne gauche : Contenu principal -->
    <main class="left dashboard-container">
      <h1>Tableau de bord Professeur·e <span v-if="professorName" class="professor-name-title">- {{ professorName }}</span></h1>
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
        <h2>Lancer un appel</h2>
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

    <!-- Colonne droite : Appels de la semaine -->
    <aside class="week-calls-sidebar">
      <h2>Appels partagés</h2>
      <p class="info-text">Appels de vos matières (semaine dernière et cette semaine)</p>
      
      <div v-if="weekSlots.length > 0" class="week-slots-list">
        <div v-for="slot in weekSlots" :key="slot.id" class="week-slot-item" @click="openWeekCall(slot)">
          <div class="week-slot-date">
            {{ formatDate(slot.date) }} - {{ formatTime(slot.start_time) }}
          </div>
          <div class="week-slot-info">
            <strong>{{ slot.slot_session_type?.session_type_course_material?.name || 'Cours' }}</strong>
            <span class="text-muted"> ({{ slot.slot_session_type?.sessionTypeGlobal?.name }})</span>
            <br />
            <small>{{ slot.slot_group?.name || 'Groupe' }}</small>
            <br />
            <small class="professor-name">{{ slot.professor?.name || 'Professeur' }}</small>
          </div>
        </div>
      </div>
      
      <div v-else-if="!isLoading" class="empty-state">
        Aucun appel cette semaine.
      </div>
      
      <div v-if="isLoading" class="loading-message">Chargement...</div>
    </aside>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { getUser } from '@/shared/fetchers/user';
import { fetchRecentCalls, fetchSlotsByDate, fetchWeekSlots } from '@/shared/fetchers/slots'; 

const router = useRouter();
const professorName = ref("");
const recentCalls = ref([]);
const todayCalls = ref([]);
const weekSlots = ref([]);
const isLoading = ref(true);
const currentUserId = ref(null);
const STORAGE_KEY = 'prof_preferred_subjects'; // Clé pour récupérer les matières configurées

/**
 * Arrondit l'heure actuelle au quart d'heure le plus proche
 * et retourne un objet avec start et end (+1h30)
 */
function getRoundedTimeDefaults() {
  const now = new Date();
  const minutes = now.getMinutes();
  
  // Arrondir au quart d'heure le plus proche (0, 15, 30, 45)
  let roundedMinutes;
  if (minutes < 8) roundedMinutes = 0;
  else if (minutes < 23) roundedMinutes = 15;
  else if (minutes < 38) roundedMinutes = 30;
  else if (minutes < 53) roundedMinutes = 45;
  else {
    roundedMinutes = 0;
    now.setHours(now.getHours() + 1);
  }
  
  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  
  const startTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  // Ajouter 1h30
  now.setMinutes(now.getMinutes() + 90);
  const endTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  return { startTime, endTime };
}

function getTimeFromIso(isoString) {
  if (!isoString) {
    const defaults = getRoundedTimeDefaults();
    return defaults.startTime;
  }
  const date = new Date(isoString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  return date.toLocaleDateString('fr-FR', options);
}

onMounted(async () => {
  try {
    const user = await getUser();
    console.log('👤 Utilisateur récupéré:', user);
    if (user) {
      professorName.value = user.name;
      console.log('👤 Nom du professeur défini:', professorName.value);
      currentUserId.value = user.id;
      
      const today = new Date().toISOString().split('T')[0]; // Date YYYY-MM-DD

      // Récupérer le jour de la semaine actuel (0 = dimanche, 1 = lundi, etc.)
      const todayDayOfWeek = new Date().getDay();
      
      const [rawRecentCalls, rawTodaySlots, rawWeekSlots] = await Promise.all([
        fetchRecentCalls(todayDayOfWeek),
        fetchSlotsByDate(today),
        fetchWeekSlots()
      ]);
      
      const defaults = getRoundedTimeDefaults();
      
      recentCalls.value = (rawRecentCalls || []).map(call => ({
        ...call,
        inputStart: call.start_time ? getTimeFromIso(call.start_time) : defaults.startTime,
        inputEnd: call.end_time ? getTimeFromIso(call.end_time) : defaults.endTime
      }));

      todayCalls.value = rawTodaySlots || [];
      
      // Récupérer les matières configurées du professeur
      const savedPreferences = localStorage.getItem(STORAGE_KEY);
      const preferredSubjectIds = savedPreferences ? JSON.parse(savedPreferences) : [];
      
      // Filtrer les appels de la semaine :
      // 1. Exclure ceux du professeur connecté
      // 2. Ne garder que les appels des matières configurées (si des préférences existent)
      let filteredWeekSlots = (rawWeekSlots || []).filter(slot => slot.professorId !== currentUserId.value);
      
      if (preferredSubjectIds.length > 0) {
        filteredWeekSlots = filteredWeekSlots.filter(slot => {
          const courseMaterialId = slot.slot_session_type?.session_type_course_material?.id;
          return courseMaterialId && preferredSubjectIds.includes(courseMaterialId);
        });
      }
      
      weekSlots.value = filteredWeekSlots;
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

/**
 * OUVRE UN APPEL DE LA SEMAINE (DEPUIS LA SIDEBAR)
 */
function openWeekCall(slot) {
  // Utiliser la date actuelle au lieu de la date de l'appel original
  const now = new Date();
  const dateIso = now.toISOString();
  const dateYMD = now.toISOString().split('T')[0];
  
  // Extraire les heures de l'appel original
  const originalStart = new Date(slot.start_time);
  const originalEnd = new Date(slot.end_time);
  
  const startHours = originalStart.getHours().toString().padStart(2, '0');
  const startMinutes = originalStart.getMinutes().toString().padStart(2, '0');
  const endHours = originalEnd.getHours().toString().padStart(2, '0');
  const endMinutes = originalEnd.getMinutes().toString().padStart(2, '0');
  
  // Créer les nouvelles dates avec les heures originales mais la date d'aujourd'hui
  const startIso = new Date(`${dateYMD}T${startHours}:${startMinutes}:00`).toISOString();
  const endIso = new Date(`${dateYMD}T${endHours}:${endMinutes}:00`).toISOString();

  router.push({
    name: 'CallPage', 
    params: {
      groupId: slot.group_id || slot.slot_group?.id,
      groupName: slot.slot_group?.name,
      courseName: slot.slot_session_type?.session_type_course_material?.name,
      sessionTypeName: slot.slot_session_type?.sessionTypeGlobal?.name, 
      sessionTypeGlobalId: slot.slot_session_type?.sessionTypeGlobal?.id, 
      date: dateIso,
      startTime: startIso,
      endTime: endIso
    }
  });
}
</script>

<style scoped>
@import url("../shared/shared.css");

.dashboard-wrapper {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 1200px) {
  .dashboard-wrapper {
    grid-template-columns: 1fr;
  }
  
  .week-calls-sidebar {
    max-height: 500px;
  }
}

.dashboard-container {
  max-width: 100%;
  margin: 0;
}

.professor-name-title {
  color: var(--color-1, #005a8f);
  font-weight: normal;
}

.week-calls-sidebar {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  position: sticky;
  top: 2rem;
}

.week-calls-sidebar h2 {
  margin-top: 0;
  font-size: 1.3rem;
  color: #333;
}

.week-slots-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.week-slot-item {
  background: white;
  border-left: 4px solid #FF8C00;
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.week-slot-item:hover {
  background-color: #f9f9f9;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  transform: translateX(2px);
}

.week-slot-date {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
  text-transform: capitalize;
}

.week-slot-info {
  margin-bottom: 0.5rem;
}

.week-slot-info strong {
  color: #254e70ff;
  font-size: 0.95rem;
}

.week-slot-time {
  font-size: 0.85rem;
  color: #555;
  font-weight: 500;
}

.professor-name {
  color: #666;
  font-style: italic;
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