<template>
  <main class="left create-call-container">
    <h1>Créer un nouvel appel</h1>
    <p>Sélectionnez les informations pour le créneau que vous souhaitez créer.</p>

    <form @submit.prevent="startCall" class="call-form">
      
      <div class="form-group">
        <label for="session-select">1. Type de session</label>
        <select id="session-select" v-model="selectedSessionTypeGlobalId" required>
          <option :value="null" disabled>-- Choisir un type --</option>
          <option v-for="session in globalSessionTypes" :key="session.id" :value="session.id">
            {{ session.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="group-select">2. Groupe</label>
        <select 
          id="group-select" 
          v-model="selectedGroupId" 
          required
          :disabled="!selectedSessionTypeGlobalId"
        >
          <option :value="null" disabled>
            {{ selectedSessionTypeGlobalId ? '-- Choisir un groupe --' : '-- Veuillez d\'abord choisir un type de session --' }}
          </option>
          <option v-for="group in filteredGroups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
        <small v-if="isCM" class="text-info">
          Pour un CM, seules les promotions entières (ex: L1S1) sont proposées.
        </small>
      </div>

      <div class="form-group">
        <label for="course-select">3. Matière</label>
        <select 
          id="course-select" 
          v-model="selectedCourseId" 
          required 
          :disabled="!selectedGroupId"
        >
          <option :value="null" disabled>
            {{ selectedGroupId ? '-- Choisir une matière --' : '-- Veuillez d\'abord choisir un groupe --' }}
          </option>
          <option v-for="subject in filteredSubjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
        
        <small v-if="selectedGroupId && filteredSubjects.length === 0" class="text-warning">
          Aucune matière trouvée. Vérifiez que la matière est au même semestre que le groupe, ou ajoutez-la dans "Configurer mes matières".
        </small>
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
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getGroups } from '../shared/fetchers/groups';
import { getGlobalSessionTypes } from '../shared/fetchers/session_type';
import { getCourseMaterials } from '../shared/fetchers/course_material';

const router = useRouter();

// Données
const groups = ref([]);
const globalSessionTypes = ref([]);
const allSubjects = ref([]); // Contiendra UNIQUEMENT les matières préférées (si configurées)

// Sélection
const selectedGroupId = ref(null);
const selectedCourseId = ref(null);
const selectedSessionTypeGlobalId = ref(null);
const selectedDate = ref(new Date().toISOString().split('T')[0]); 

// Clé de stockage
const STORAGE_KEY = 'prof_preferred_subjects';

/**
 * LOGIQUE 1 : Chargement et Application des Préférences
 */
onMounted(async () => {
  // 1. Charger toutes les données brutes depuis le serveur
  let rawSubjects = [];
  
  [groups.value, globalSessionTypes.value, rawSubjects] = await Promise.all([
    getGroups(),
    getGlobalSessionTypes(),
    getCourseMaterials()
  ]);

  // 2. Filtrer selon les préférences du prof
  const savedPreferences = localStorage.getItem(STORAGE_KEY);
  if (savedPreferences) {
    const preferredIds = JSON.parse(savedPreferences);
    
    // Si la liste des favoris n'est pas vide, on filtre
    if (preferredIds.length > 0) {
      allSubjects.value = rawSubjects.filter(subj => preferredIds.includes(subj.id));
    } else {
      // Si la liste est vide (l'utilisateur a tout décoché), on montre tout par sécurité
      allSubjects.value = rawSubjects;
    }
  } else {
    // Si pas de config, on montre tout
    allSubjects.value = rawSubjects;
  }
});

/**
 * LOGIQUE 2 : CM = Classe Entière
 */
const isCM = computed(() => {
  if (!selectedSessionTypeGlobalId.value) return false;
  const type = globalSessionTypes.value.find(t => t.id === selectedSessionTypeGlobalId.value);
  return type && (type.name.toUpperCase() === 'CM' || type.name.toLowerCase().includes('magistral'));
});

const filteredGroups = computed(() => {
  if (!groups.value) return [];
  if (isCM.value) {
    // Regex pour L1S1, M2S3 etc.
    return groups.value.filter(g => /^[LM]\d+S\d+$/i.test(g.name));
  }
  return groups.value;
});

/**
 * LOGIQUE 3 : Filtrage par Semestre
 * On filtre la liste (déjà restreinte aux favoris) par le semestre du groupe
 */
const filteredSubjects = computed(() => {
  if (!selectedGroupId.value) return [];
  
  const currentGroup = groups.value.find(g => g.id === selectedGroupId.value);
  if (!currentGroup) return [];

  return allSubjects.value.filter(subject => subject.semester_id === currentGroup.semester_id);
});

// Watchers pour reset les champs en cascade
watch(selectedSessionTypeGlobalId, () => { selectedGroupId.value = null; });
watch(selectedGroupId, () => { selectedCourseId.value = null; });

// Validation
function startCall() {
  if (!selectedGroupId.value || !selectedCourseId.value || !selectedSessionTypeGlobalId.value || !selectedDate.value) {
    alert("Veuillez remplir tous les champs.");
    return;
  }
  
  const selectedGroup = groups.value.find(g => g.id === selectedGroupId.value);
  const selectedSession = globalSessionTypes.value.find(s => s.id === selectedSessionTypeGlobalId.value);
  const selectedSubject = allSubjects.value.find(s => s.id === selectedCourseId.value);
  
  if (!selectedGroup || !selectedSession || !selectedSubject) {
     alert("Erreur données."); return;
  }

  router.push({
    name: 'CallPage',
    params: {
      groupId: selectedGroupId.value,
      groupName: selectedGroup.name,
      courseName: selectedSubject.name,
      sessionTypeGlobalId: selectedSessionTypeGlobalId.value, 
      sessionTypeName: selectedSession.name, 
      date: new Date(selectedDate.value).toISOString()
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
.form-group input:disabled, .form-group select:disabled { background-color: #e9ecef; cursor: not-allowed; color: #6c757d; }
.text-info { color: var(--color-2, #005a8f); font-style: italic; font-size: 0.85rem; margin-top: 0.25rem; }
.text-warning { color: #d9534f; font-style: italic; font-size: 0.85rem; margin-top: 0.25rem; }
.primary-button { background-color: var(--color-1, #005a8f); color: white; font-size: 1.1rem; padding: 0.75rem 1.25rem; cursor: pointer; margin-top: 1rem; }
</style>