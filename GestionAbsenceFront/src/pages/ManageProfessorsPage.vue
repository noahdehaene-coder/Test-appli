<template>
  <main class="left admin-container">
    <h1>Gérer les Professeurs</h1>
    
    <section class="form-section">
      <h2>Créer un nouveau professeur</h2>
      <form @submit.prevent="handleCreateProfessor" class="create-form">
        <div class="form-group">
          <label for="prof-name">Nom complet</label>
          <input id="prof-name" type="text" v-model="newProfName" required />
        </div>
        <div class="form-group">
          <label for="prof-email">Email (identifiant)</label>
          <input id="prof-email" type="email" v-model="newProfEmail" required />
        </div>
        <div class="form-group">
          <label for="prof-password">Mot de passe temporaire</label>
          <input id="prof-password" type="password" v-model="newProfPassword" required />
        </div>
        <button type="submit" class="button" :disabled="isCreating">
          {{ isCreating ? 'Création...' : 'Créer le professeur' }}
        </button>
        <div v-if="createError" class="error-message">{{ createError }}</div>
      </form>
    </section>

    <hr />

    <section class="list-section">
      <h2>Liste des professeurs existants</h2>
      
      <div v-if="isLoading" class="loading-message">
        Chargement de la liste...
      </div>
      
      <div v-else-if="professors.length === 0" class="empty-state">
        Aucun professeur n'a été créé.
      </div>

      <ul v-else class="professor-list">
        <li v-for="prof in professors" :key="prof.id" class="professor-item">
          <div class="prof-info">
            <strong>{{ prof.name }}</strong>
            <br />
            <small>{{ prof.email }}</small>
          </div>
          <button class="button danger-button" @click="handleDeleteProfessor(prof.id)">
            Supprimer
          </button>
        </li>
      </ul>
    </section>

  </main>
</template>

<script setup>
// Importez les fonctions du nouveau fetcher 'user.js'
// (Adaptez le chemin si vous avez créé le store différemment)
import { 
  fetchProfessors, 
  createProfessor, 
  deleteProfessor 
} from '../shared/fetchers/user'; 
import { ref, onMounted } from 'vue';

const professors = ref([]);
const isLoading = ref(true);
const isCreating = ref(false);
const createError = ref(null);

// Références pour le formulaire de création
const newProfName = ref('');
const newProfEmail = ref('');
const newProfPassword = ref('');

/**
 * Charge ou recharge la liste des professeurs depuis le backend.
 */
async function loadProfessors() {
  isLoading.value = true;
  professors.value = await fetchProfessors();
  isLoading.value = false;
}

// Charge la liste au montage de la page
onMounted(loadProfessors);

/**
 * Gère la soumission du formulaire de création.
 */
async function handleCreateProfessor() {
  isCreating.value = true;
  createError.value = null;
  try {
    await createProfessor({
      name: newProfName.value,
      email: newProfEmail.value,
      password: newProfPassword.value
    });
    
    // Réinitialiser le formulaire
    newProfName.value = '';
    newProfEmail.value = '';
    newProfPassword.value = '';
    
    // Recharger la liste
    await loadProfessors();

  } catch (error) {
    createError.value = 'Erreur : ' + error.message;
    console.error(error);
  } finally {
    isCreating.value = false;
  }
}

/**
 * Gère la suppression d'un professeur.
 * @param {number} id - L'ID du professeur à supprimer.
 */
async function handleDeleteProfessor(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce professeur ?\nCette action est irréversible.")) {
    try {
      await deleteProfessor(id);
      // Recharger la liste après suppression
      await loadProfessors();
    } catch (error) {
      alert("Erreur lors de la suppression : " + error.message);
      console.error(error);
    }
  }
}
</script>

<style scoped>
@import url('../shared/shared.css');

.admin-container {
  max-width: 900px;
  margin: 2rem auto;
}

.form-section, .list-section {
  padding: 2rem;
  border: 1px solid var(--color-3, #ccc);
  border-radius: 8px;
  background-color: var(--color-6, #fff);
  margin-bottom: 2rem;
}

.create-form {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 2 colonnes */
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid var(--color-3, #ccc);
  border-radius: 5px;
  font-size: 1rem;
}

.create-form .button {
  grid-column: 2 / 3; /* Placer le bouton sous la 2e colonne */
  align-self: end;
}

hr {
  border: 0;
  border-top: 1px solid var(--color-3, #eee);
  margin: 2rem 0;
}

.professor-list {
  list-style: none;
  padding: 0;
}

.professor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-3, #ccc);
  margin-bottom: 0.5rem;
  border-radius: 5px;
}

.prof-info small {
  color: var(--color-2, #555);
}

.danger-button {
  background-color: #d9534f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.danger-button:hover {
  background-color: #c9302c;
}

.error-message {
  color: red;
  grid-column: 1 / 3;
}
</style>