<template>
  <main class="left">
    <div class="header">
      <h1>Mes Absences</h1>
    </div>

    <div class="filters-container">
      <div class="search-container">
        <SearchIcon class="search-icon" />
        <input type="search" v-model="searchQuery" placeholder="Rechercher une matière" class="search-bar" />
      </div>
    </div>

    <div class="table-container">
      <div v-if="loading" class="loading-state">Chargement...</div>
      
      <table v-else>
        <thead>
          <tr>
            <th>Date</th>
            <th>Matière</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(absence, index) in filteredAbsences" :key="index">
            <td>{{ formatDate(absence.date) }}</td>
            <td>{{ absence.course_material || 'Matière inconnue' }}</td>
            <td>{{ absence.session_type }}</td>
            
            <td>
              <span :class="['status-badge', absence.justified ? 'justified' : 'unjustified']">
                {{ absence.justified ? 'Justifiée' : 'Non justifiée' }}
              </span>
            </td>

            <td>
              <div v-if="!absence.justified">
                <label :for="'file-' + absence.slot_id" class="button-upload" :class="{ 'uploading': uploadingId === absence.slot_id }">
                  {{ uploadingId === absence.slot_id ? 'Envoi...' : '📤 Justifier' }}
                </label>
                <input 
                  :id="'file-' + absence.slot_id" 
                  type="file" 
                  accept="application/pdf"
                  class="hidden-input"
                  :disabled="uploadingId === absence.slot_id"
                  @change="(e) => handleUpload(e, absence.slot_id)"
                />
              </div>
              <div v-else-if="absence.justificationFile" class="file-info">
                 📄 Reçu
              </div>
            </td>
          </tr>
          <tr v-if="filteredAbsences.length === 0">
            <td colspan="5" class="no-absences">Aucune absence enregistrée.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup>
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '../store/auth'; // Assurez-vous d'avoir accès au store Auth
import { getStudentAbsences } from '@/shared/fetchers/presence'; // On utilisera la nouvelle fonction ici
import { uploadJustification } from '@/shared/fetchers/presence';

const absencesList = ref([]);
const searchQuery = ref("");
const loading = ref(true);
const uploadingId = ref(null);

onMounted(async () => {
  const userStored = localStorage.getItem('user');
  
  if (userStored) {
    const user = JSON.parse(userStored);
    
    if (user.studentId) {
      try {
        absencesList.value = await getStudentAbsences(user.studentId);
      } catch (e) {
        console.error("Erreur fetch absences", e);
      }
    } else {
      console.warn("Utilisateur connecté mais pas de studentId trouvé.");
    }
  }
  loading.value = false;
});

const handleUpload = async (event, slotId) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert("Seuls les fichiers PDF sont acceptés.");
        return;
    }

    uploadingId.value = slotId;

    try {
        await uploadJustification(slotId, file);
        
        // Mise à jour locale immédiate pour l'expérience utilisateur
        const abs = absencesList.value.find(a => a.slot_id === slotId);
        if (abs) {
            abs.justified = true;
            abs.justificationFile = "sent";
        }
        
    } catch (error) {
        console.error(error);
        alert("Erreur lors de l'envoi.");
    } finally {
        uploadingId.value = null;
    }
};

const filteredAbsences = computed(() => {
  return absencesList.value.filter(absence => {
    const matName = absence.course || absence.course_material || "";
    return matName.toLowerCase().includes(searchQuery.value.toLowerCase());
  });
});

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'
  });
}
</script>

<style scoped>
@import url("../shared/shared.css");

.header { margin-bottom: 2rem; }
.filters-container { margin-bottom: 2rem; }
.search-container { margin-bottom: 0; }

table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
th, td { border: 1px solid var(--color-3); padding: 0.75rem 1rem; text-align: left; }
th { background-color: var(--color-5); }
tbody tr:nth-child(even) { background-color: var(--color-6); }
.no-absences { text-align: center; font-style: italic; padding: 2rem; }

/* Styles spécifiques aux étudiants */
.status-badge {
    padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.9em;
}
.justified { background-color: #d4edda; color: #155724; }
.unjustified { background-color: #f8d7da; color: #721c24; }

.button-upload {
    display: inline-block; padding: 0.4rem 0.8rem;
    background-color: var(--color-2); color: white;
    border-radius: 4px; cursor: pointer; font-size: 0.9rem;
    transition: background 0.2s;
}
.button-upload:hover { background-color: var(--color-1); }
.button-upload.uploading { background-color: var(--color-3); cursor: wait; }

.hidden-input { display: none; }
.file-info { font-size: 0.9rem; color: var(--color-1); }
</style>