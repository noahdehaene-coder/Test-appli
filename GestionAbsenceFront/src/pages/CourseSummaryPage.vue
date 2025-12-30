<template>
  <main class="left" v-if="courseName !== 'Chargement...'">
    <div class="header">
      <h1>Récapitulatif des absences en {{ courseName }}</h1>
    </div>

    <div class="filters-container">
      
      <div class="search-container">
        <SearchIcon class="search-icon" />
        <input type="search" v-model="searchQuery" placeholder="Rechercher un.e étudiant.e" class="search-bar" />
      </div>

      <div class="session-type-filter">
        <label>Filtrer par type de session :</label>
        <div class="session-type-options">
          <label v-for="type in uniqueSessionTypes" :key="type" class="checkbox-label">
            <input type="checkbox" :value="type" v-model="selectedSessionTypes">
            {{ type }}
          </label>
        </div>
      </div>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Étudiant.e</th>
            <th>Type de Session</th>
            <th>Absence</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="absence in filteredAbsences" :key="absence.id">
            <td>{{ formatDateTime(absence.date, absence.start_time, absence.end_time) }}</td>
            <td>{{ absence.name }}</td>
            <td>{{ absence.session_type }}</td>
            <td 
              class="justification-cell" 
              :class="{ 'is-justified': absence.justified, 'is-unjustified': !absence.justified }"
              @click="toggleJustification(absence)"
              title="Cliquer pour modifier"
            >
              {{ absence.justified ? 'Justifiée' : 'Non justifiée' }}
            </td>
          </tr>
          <tr v-if="filteredAbsences.length === 0">
            <td colspan="4" class="no-absences">Aucune absence trouvée pour cette matière.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
  
  <main class="left" v-else>
      <h1>Chargement des récapitulatifs...</h1>
  </main>
</template>

<script setup>
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

import { getStudentsByCourseId } from '@/shared/fetchers/students';
import { getAbsenceByCourse } from '@/shared/fetchers/presence';

import { updatePresenceJustification } from '@/shared/fetchers/presence';

const route = useRoute();
const courseId = Number(route.params.id); 
const courseName = ref("Chargement...");

const selectedSessionTypes = ref([]);

const absencesList = ref([]);
const studentsList = ref([]);

const searchQuery = ref("");

const uniqueSessionTypes = computed(() => {
  const types = new Set();
  absencesList.value.forEach(absence => {
    if (absence.session_type) { 
      types.add(absence.session_type);
    }
  });
  return Array.from(types);
});

onMounted(async () => {
  if (isNaN(courseId)) {
    console.error("ID de cours invalide");
    return;
  }
  
  absencesList.value = await getAbsenceByCourse(courseId) || [];
  studentsList.value = await getStudentsByCourseId(courseId) || [];

  if (absencesList.value.length > 0) {
    courseName.value = absencesList.value[0].course_material;
  } else if (studentsList.value.length > 0) {

  } else {
    courseName.value = "Inconnue";
  }
});

async function toggleJustification(absence) {
  const newState = !absence.justified;
  
  absence.justified = newState;

  try {
    await updatePresenceJustification(absence.student_id, absence.slot_id, newState);
  } catch (e) {
    absence.justified = !newState;
    alert("Erreur lors de la modification.");
  }
}

const filteredAbsences = computed(() => {
  
  const typeFilterActive = selectedSessionTypes.value.length > 0; 
  
  return absencesList.value.filter(absence => {
    
    const matchesName = absence && absence.name && absence.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    const matchesType = 
        !typeFilterActive 
        || selectedSessionTypes.value.includes(absence.session_type);
    
    return matchesName && matchesType;
  });
});

// Formate la date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Fonction d'affichage Date + Heures
function formatDateTime(dateString, startString, endString) {
  if (!dateString) return "";
  const dateObj = new Date(dateString);
  const dateText = dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  if (startString && endString) {
    const s = new Date(startString).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    const e = new Date(endString).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    return `${dateText} (${s} - ${e})`;
  }
  return dateText;
}
</script>

<style scoped>
@import url("../shared/shared.css");

.header {
  margin-bottom: 2rem;
}

.search-container {
  margin-bottom: 1rem;
}

.table-container {
  width: 100%;
  overflow-x: auto; 
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid var(--color-3, #ccc);
  padding: 0.75rem 1rem;
  text-align: left;
}

th {
  background-color: var(--color-5, #f0f0f0);
}

tbody tr:nth-child(even) {
  background-color: var(--color-6, #f9f9f9);
}

.no-absences {
  text-align: center;
  font-style: italic;
  color: var(--color-2, #555);
}

.justification-cell {
  cursor: pointer;
  font-weight: bold;
  user-select: none; /* Empêche la sélection du texte au double-clic */
  transition: opacity 0.2s;
}

.justification-cell:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.is-justified {
  color: #27ae60; /* Vert */
}

.is-unjustified {
  color: #c0392b; /* Rouge */
}

.session-type-filter label { font-weight: bold; display: block; margin-bottom: 0.5rem; }
.session-type-options { display: flex; flex-wrap: wrap; gap: 1rem; }
.checkbox-label {
  display: flex; align-items: center; gap: 0.5rem; font-weight: normal; cursor: pointer;
  background-color: var(--color-6, #f9f9f9); padding: 0.5rem 1rem; border-radius: 5px; border: 1px solid var(--color-3, #ccc);
}
.checkbox-label:hover { background-color: var(--color-5, #f0f0f0); }

</style>