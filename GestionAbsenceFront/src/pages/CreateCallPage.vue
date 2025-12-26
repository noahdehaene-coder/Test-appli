<template>
  <main class="left create-call-container">
    <h1>Créer un nouvel appel</h1>
    <p>Sélectionnez les informations pour le créneau que vous souhaitez créer.</p>

    <form @submit.prevent="startCall" class="call-form">
      <div class="form-group">
        <label for="group-select">1. Groupe</label>
        <select id="group-select" v-model="selectedGroupId" required>
          <option :value="null" disabled>-- Choisir un groupe --</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="course-select">2. Matière</label>
        <select id="course-select" v-model="selectedCourseId" required>
          <option :value="null" disabled>-- Choisir une matière --</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="session-select">3. Type de session</label>
        <select id="session-select" v-model="selectedSessionTypeGlobalId" required>
          <option :value="null" disabled>-- Choisir un type --</option>
          <option v-for="session in globalSessionTypes" :key="session.id" :value="session.id">
            {{ session.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="date-select">4. Date de l'appel</label>
        <input id="date-select" type="date" v-model="selectedDate" required />
      </div>

      <button type="submit" class="button primary-button">
        Démarrer l'appel
      </button>
    </form>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getGroups } from '../shared/fetchers/groups';
import { getGlobalSessionTypes } from '../shared/fetchers/session_type';
import { getCourseMaterials } from '../shared/fetchers/course_material';

const router = useRouter();

// États pour les listes des menus déroulants
const groups = ref([]);
const globalSessionTypes = ref([]);
const subjects = ref([]); // AJOUT : Liste des matières

// États pour les valeurs sélectionnées
const selectedGroupId = ref(null);
const selectedCourseId = ref(null);
const selectedSessionTypeGlobalId = ref(null);
const selectedDate = ref(new Date().toISOString().split('T')[0]); 

/**
 * Au chargement, récupère les groupes, les types de session et les matières.
 */
onMounted(async () => {
  [groups.value, globalSessionTypes.value, subjects.value] = await Promise.all([
    getGroups(),
    getGlobalSessionTypes(),
    getCourseMaterials()
  ]);
});

/**
 * Valide la sélection et redirige vers la page d'appel.
 */
function startCall() {
  if (!selectedGroupId.value || !selectedCourseId.value || !selectedSessionTypeGlobalId.value || !selectedDate.value) {
    alert("Veuillez remplir tous les champs.");
    return;
  }
  
  const selectedGroup = groups.value.find(g => g.id === selectedGroupId.value);
  const selectedSession = globalSessionTypes.value.find(s => s.id === selectedSessionTypeGlobalId.value);
  const selectedSubject = subjects.value.find(s => s.id === selectedCourseId.value);
  
  if (!selectedGroup || !selectedSession || !selectedSubject) {
     alert("Erreur : groupe, matière ou type de session non trouvé.");
     return;
  }

  const dateForUrl = new Date(selectedDate.value).toISOString();

  router.push({
    name: 'CallPage',
    params: {
      groupId: selectedGroupId.value,
      groupName: selectedGroup.name,
      courseName: selectedSubject.name,
      sessionTypeGlobalId: selectedSessionTypeGlobalId.value, 
      sessionTypeName: selectedSession.name, 
      date: dateForUrl
    }
  });
}
</script>

<style scoped>
@import url('../shared/shared.css');
.create-call-container { max-width: 600px; margin: 2rem auto; }
.call-form { display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem; border: 1px solid var(--color-3, #ccc); border-radius: 8px; background-color: var(--color-6, #fff); }
.form-group { display: flex; flex-direction: column; }
.form-group label { margin-bottom: 0.5rem; font-weight: bold; color: var(--color-2, #555); }
.form-group input, .form-group select { padding: 0.75rem; border: 1px solid var(--color-3, #ccc); border-radius: 5px; font-size: 1rem; background-color: #fff; }
.form-group small { margin-top: 0.25rem; font-size: 0.8rem; color: #777; }
.primary-button { background-color: var(--color-1, #005a8f); color: white; font-size: 1.1rem; padding: 0.75rem 1.25rem; cursor: pointer; margin-top: 1rem; }
</style>