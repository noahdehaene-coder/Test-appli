<template>
  <main class="left">
    <div class="header">
      <h1>Récapitulatif des absences en {{ courseName }} ({{ sessionType }})</h1>
    </div>

    <div class="search-container">
      <SearchIcon class="search-icon" />
      <input type="search" v-model="searchQuery" placeholder="Rechercher un.e étudiant.e" class="search-bar" />
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Étudiant.e</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="absence in filteredAbsences" :key="absence.id">
            <td>{{ formatDate(absence.date) }}</td>
            <td>{{ absence.name }}</td>
          </tr>
          <tr v-if="filteredAbsences.length === 0">
            <td colspan="2" class="no-absences">Aucune absence trouvée pour cette matière.</td>
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

// Importe les fonctions (maintenant corrigées)
import { getStudentsByCourseId } from '@/shared/fetchers/students';
import { getAbsenceByCourse } from '@/shared/fetchers/presence';

const route = useRoute();
const courseId = Number(route.params.id); 
const courseName = ref("Chargement..."); 
const sessionType = ref(""); 

// --- CORRECTION : Initialisation avec [] au lieu de null ---
const absencesList = ref([]);
const studentsList = ref([]);
// --- FIN CORRECTION ---

const searchQuery = ref("");

onMounted(async () => {
  if (isNaN(courseId)) {
    console.error("ID de cours invalide");
    return;
  }
  
  // Appelle les API avec l'ID corrigé
  absencesList.value = await getAbsenceByCourse(courseId) || [];
  studentsList.value = await getStudentsByCourseId(courseId) || [];

  // Met à jour les noms pour l'affichage (si les listes ne sont pas vides)
  if (absencesList.value.length > 0) {
    courseName.value = absencesList.value[0].course_material;
    sessionType.value = absencesList.value[0].session_type;
  } else if (studentsList.value.length > 0) {
    // Logique de repli (vous devrez peut-être ajuster le fetcher)
    // courseName.value = studentsList.value[0].course_name; 
  } else {
    courseName.value = "Inconnue";
  }
});

// Filtre pour la recherche (maintenant sûr)
const filteredAbsences = computed(() =>
  absencesList.value.filter(absence =>
    // CORRECTION : Ajout d'une vérification (au cas où)
    absence && absence.name && absence.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

// Formate la date
function formatDate(dateString) {
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
</style>