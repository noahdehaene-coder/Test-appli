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
            <th>Absence</th>
            <th>Justificatif</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(absence, index) in filteredAbsences" :key="index">
            <td>{{ formatDateTime(absence.date, absence.start_time, absence.end_time) }}</td>
            <td>{{ absence.course_material || 'Matière inconnue' }}</td>
            <td>{{ absence.session_type }}</td>
            <td 
              class="justification-cell" 
              :class="{ 'is-justified': absence.justified, 'is-unjustified': !absence.justified }"
              @click="toggleJustification(absence)"
              title="Cliquer pour modifier"
            >
              {{ absence.justified ? 'Justifiée' : 'Non justifiée' }}
            </td>
            <td>
              <button 
                v-if="absence.justificationFile" 
                @click="downloadFile(absence)" 
                class="download-btn"
                title="Télécharger le PDF"
              >
                📄 Voir le PDF
              </button>
              <span v-else class="no-file">-</span>
            </td>
          </tr>
          <tr v-if="filteredAbsences.length === 0">
            <td colspan="5" class="no-absences">Aucune absence trouvée pour cet.te étudiant.e.</td>
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

import { updatePresenceJustification } from '@/shared/fetchers/presence';

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

const downloadFile = async (absence) => {
  try {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/presence/download/${absence.student_id}/${absence.slot_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Erreur lors du téléchargement');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Justificatif_${absence.course_material}_${formatDate(absence.date)}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    console.error(error);
    alert("Impossible de télécharger le fichier (peut-être introuvable sur le serveur).");
  }
};

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

async function toggleJustification(absence) {
  const newState = !absence.justified;
  absence.justified = newState;

  try {
    const sId = absence.student_id || studentId; 
    await updatePresenceJustification(sId, absence.slot_id, newState);
  } catch (e) {
    absence.justified = !newState;
    alert("Erreur lors de la modification.");
  }
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fonction principale qui combine Date + Heures
function formatDateTime(dateString, startString, endString) {
  if (!dateString) return "";
  
  const dateObj = new Date(dateString);
  const dateText = dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Si on a les heures, on les ajoute entre parenthèses
  if (startString && endString) {
    return `${dateText} ${formatTime(startString)}-${formatTime(endString)}`;
  }
  
  return dateText;
}

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

.justification-cell {
  cursor: pointer;
  font-weight: bold;
  user-select: none;
  transition: opacity 0.2s;
}
.justification-cell:hover {
  opacity: 0.8;
  text-decoration: underline;
}
.is-justified { color: #27ae60; }
.is-unjustified { color: #c0392b; }

.download-btn {
  background-color: var(--color-2, #0056b3);
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.download-btn:hover {
  background-color: var(--color-1, #003d82);
}

.no-file {
  color: #999;
  font-style: italic;
  font-size: 0.85rem;
}
</style>