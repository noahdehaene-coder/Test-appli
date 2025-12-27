<template>
  <main class="left container">
    <div class="header-section">
      <h1>Mes matières favorites</h1>
      <p>Cochez les matières que vous enseignez. Seules ces matières apparaîtront lorsque vous ferez l'appel.</p>
    </div>

    <div v-if="loading" class="loading">Chargement des données...</div>

    <form v-else @submit.prevent="savePreferences">
      
      <div v-for="semester in semesters" :key="semester.id" class="semester-block">
        <h2 class="semester-title">{{ semester.name }}</h2>
        
        <div class="subjects-grid">
          <div 
            v-for="subject in getSubjectsForSemester(semester.id)" 
            :key="subject.id" 
            class="checkbox-wrapper"
          >
            <input 
              type="checkbox" 
              :id="'subj-' + subject.id" 
              :value="subject.id"
              v-model="selectedSubjectIds"
            />
            <label :for="'subj-' + subject.id">{{ subject.name }}</label>
          </div>
          
          <p v-if="getSubjectsForSemester(semester.id).length === 0" class="no-data">
            Aucune matière disponible.
          </p>
        </div>
      </div>

      <div class="actions">
        <router-link :to="{ name: 'ProfessorDashboard' }" class="button secondary-button">
          Annuler
        </router-link>
        <button type="submit" class="button primary-button">
          Enregistrer mes choix
        </button>
      </div>
    </form>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// Assure-toi que ces chemins correspondent à ton arborescence
import { getCourseMaterials } from '../shared/fetchers/course_material';
import { getAllSemesters } from '../shared/fetchers/semesters';

const router = useRouter();
const loading = ref(true);

const semesters = ref([]);
const allSubjects = ref([]);
const selectedSubjectIds = ref([]); 

// Clé unique pour sauvegarder dans le navigateur
const STORAGE_KEY = 'prof_preferred_subjects';

onMounted(async () => {
  try {
    // 1. Récupération des semestres et des matières
    const [fetchedSemesters, fetchedSubjects] = await Promise.all([
      getAllSemesters(),
      getCourseMaterials()
    ]);

    semesters.value = fetchedSemesters;
    allSubjects.value = fetchedSubjects;

    // 2. Chargement des préférences existantes
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      selectedSubjectIds.value = JSON.parse(saved);
    } else {
      // Optionnel : Si rien n'est coché, on peut tout cocher par défaut
      // selectedSubjectIds.value = allSubjects.value.map(s => s.id);
    }
  } catch (e) {
    console.error("Erreur de chargement", e);
  } finally {
    loading.value = false;
  }
});

// Filtre les matières pour l'affichage par semestre
function getSubjectsForSemester(semesterId) {
  return allSubjects.value.filter(s => s.semester_id === semesterId);
}

// Sauvegarde dans le navigateur et retour au dashboard
function savePreferences() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSubjectIds.value));
  // Petit délai pour l'UX
  setTimeout(() => {
    router.push({ name: 'ProfessorDashboard' });
  }, 200);
}
</script>

<style scoped>
@import url('../shared/shared.css');

.container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.header-section { margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
.semester-block { margin-bottom: 2rem; background: #fff; padding: 1.5rem; border-radius: 8px; border: 1px solid #e5e7eb; }
.semester-title { margin-top: 0; color: var(--color-2); border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1rem; }
.subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.checkbox-wrapper { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 4px; transition: background 0.2s; }
.checkbox-wrapper:hover { background-color: #f3f4f6; }
.checkbox-wrapper input { width: 1.2rem; height: 1.2rem; cursor: pointer; }
.checkbox-wrapper label { cursor: pointer; user-select: none; font-size: 0.95rem; }
.no-data { font-style: italic; color: #888; font-size: 0.9rem; }
.actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; }
.primary-button { background-color: var(--color-1); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 5px; cursor: pointer; font-size: 1rem; }
.secondary-button { background-color: #6c757d; color: white; text-decoration: none; padding: 0.8rem 1.5rem; border-radius: 5px; display: inline-block; }
.loading { text-align: center; color: #666; margin-top: 3rem; }
</style>