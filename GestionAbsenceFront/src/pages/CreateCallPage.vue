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
        <label for="course-input">2. Matière</label>
        <input 
          id="course-input" 
          type="text" 
          v-model="selectedCourseName" 
          placeholder="Ex: Algèbre Linéaire" 
          required 
        />
        <small>Si la matière n'existe pas, elle sera créée automatiquement.</small>
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
// MODIFIÉ : Importe la nouvelle fonction
import { getGlobalSessionTypes } from '../shared/fetchers/session_type';

const router = useRouter();

// États pour les listes des menus déroulants
const groups = ref([]);
const globalSessionTypes = ref([]); // <-- NOUVEAU

// États pour les valeurs sélectionnées
const selectedGroupId = ref(null);
const selectedCourseName = ref('');
const selectedSessionTypeGlobalId = ref(null); // <-- MODIFIÉ
const selectedDate = ref(new Date().toISOString().split('T')[0]); 

/**
 * Au chargement, récupère les groupes et les types de session globaux.
 */
onMounted(async () => {
  // MODIFIÉ : Appelle la nouvelle fonction
  [groups.value, globalSessionTypes.value] = await Promise.all([
    getGroups(),
    getGlobalSessionTypes()
  ]);
});

/**
 * Valide la sélection et redirige vers la page d'appel.
 */
function startCall() {
  if (!selectedGroupId.value || !selectedCourseName.value || !selectedSessionTypeGlobalId.value || !selectedDate.value) {
    alert("Veuillez remplir tous les champs.");
    return;
  }
  
  const selectedGroup = groups.value.find(g => g.id === selectedGroupId.value);
  const selectedSession = globalSessionTypes.value.find(s => s.id === selectedSessionTypeGlobalId.value);
  
  if (!selectedGroup || !selectedSession) {
     alert("Erreur : groupe ou type de session non trouvé.");
     return;
  }

  const dateForUrl = new Date(selectedDate.value).toISOString();

  router.push({
    name: 'CallPage',
    params: {
      groupId: selectedGroupId.value,
      groupName: selectedGroup.name,
      courseName: selectedCourseName.value,
      // MODIFIÉ : On envoie l'ID du type de session
      sessionTypeGlobalId: selectedSessionTypeGlobalId.value, 
      // On envoie aussi le nom pour l'affichage
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