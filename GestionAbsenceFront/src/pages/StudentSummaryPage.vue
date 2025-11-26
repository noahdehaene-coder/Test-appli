<template>
  <main class="left">
    <div class="header">
      <h1>Absences de {{ studentName }}</h1>
    </div>

    <div class="filters-container">
      <div class="search-container">
        <SearchIcon class="search-icon" />
        <input type="search" v-model="searchQuery" placeholder="Rechercher une matière" class="search-bar" />
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
            <th>Matière</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(absence, index) in filteredAbsences" :key="index">
            <td>{{ formatDate(absence.date) }}</td>
            <td>{{ absence.course_material || 'Matière inconnue' }}</td>
            <td>{{ absence.session_type }}</td>
          </tr>
          <tr v-if="filteredAbsences.length === 0">
            <td colspan="3" class="no-absences">Aucune absence trouvée pour cet.te étudiant.e.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup>
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

import { getStudentById } from '@/shared/fetchers/students';
import { getStudentAbsencesById } from '@/shared/fetchers/presence';

const route = useRoute();
const studentId = Number(route.params.id);
const studentName = ref("Chargement...");

const selectedSessionTypes = ref([]);
const absencesList = ref([]);
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
  if (isNaN(studentId)) {
    console.error("ID d'étudiant invalide");
    studentName.value = "Erreur ID";
    return;
  }

  try {
    const student = await getStudentById(studentId);
    if (student) {
      studentName.value = student.name;
    } else {
      studentName.value = "Étudiant introuvable";
    }

    absencesList.value = await getStudentAbsencesById(studentId) || [];
    
  } catch (error) {
    console.error("Erreur de chargement :", error);
    studentName.value = "Erreur";
  }
});

const filteredAbsences = computed(() => {
  const typeFilterActive = selectedSessionTypes.value.length > 0;

  return absencesList.value.filter(absence => {
    const matName = absence.course_material || "";
    const matchesSearch = matName.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesType = !typeFilterActive || selectedSessionTypes.value.includes(absence.session_type);

    return matchesSearch && matchesType;
  });
});

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
</script>

<style scoped>
@import url("../shared/shared.css");

.header { margin-bottom: 2rem; }
.filters-container { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
.search-container { margin-bottom: 0; }
.session-type-filter label { font-weight: bold; display: block; margin-bottom: 0.5rem; }
.session-type-options { display: flex; flex-wrap: wrap; gap: 1rem; }
.checkbox-label {
  display: flex; align-items: center; gap: 0.5rem; font-weight: normal; cursor: pointer;
  background-color: var(--color-6, #f9f9f9); padding: 0.5rem 1rem; border-radius: 5px; border: 1px solid var(--color-3, #ccc);
}
.checkbox-label:hover { background-color: var(--color-5, #f0f0f0); }
.table-container { width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid var(--color-3, #ccc); padding: 0.75rem 1rem; text-align: left; }
th { background-color: var(--color-5, #f0f0f0); }
tbody tr:nth-child(even) { background-color: var(--color-6, #f9f9f9); }
.no-absences { text-align: center; font-style: italic; color: var(--color-2, #555); }
</style>