<template>
  <!-- Mode CRÉATION -->
  <main class="left" v-if="isCreating">
    <div class="header-creation">
      <h1>Créer un nouveau groupe</h1>
    </div>

    <div class="creation-form">
      <div class="form-group">
        <label for="group-name">Nom du groupe</label>
        <input 
          id="group-name" 
          v-model="newGroupName" 
          type="text" 
          placeholder="Ex: TD1, TP A, Groupe 1, etc."
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="semester-select">Semestre</label>
        <select 
          id="semester-select" 
          v-model="newGroupSemesterId" 
          class="form-select"
        >
          <option :value="null" disabled>-- Sélectionner un semestre --</option>
          <option v-for="sem in allSemesters" :key="sem.id" :value="sem.id">
            {{ sem.name }}
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button @click="cancelCreate" class="button secondary-btn">
          Annuler
        </button>
        <button @click="createNewGroup" class="button primary-btn" :disabled="!newGroupName || !newGroupSemesterId">
          Créer le groupe
        </button>
      </div>
    </div>
  </main>

  <!-- Mode MODIFICATION -->
  <main class="left" v-else-if="group && semester">
    <div class="header-with-delete">
      <h1>Modification du groupe {{ group.name }}</h1>
      <button @click="deleteGroup" class="button delete-group-btn" title="Supprimer ce groupe">
        Supprimer le groupe
      </button>
    </div>
    
    <div class="container">
      
      <div class="left-container">
        <h2>Membres de {{ group.name }}</h2>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchQuery1" placeholder="Filtrer la liste..." />
        </div>
        <ul class="list">
          <li v-for="student in filteredStudentsInGroup" :key="student.id" class="students-list">
            <div class="student-list-container">
              <div class="student-info">
                {{ student.name }}
              </div>
              <div class="student-group-number">
                <p>{{ group.name }}</p>
              </div>
            </div>
            <button @click="deleteStudent(student)" class="button delete-btn" title="Retirer du groupe">
              ×
            </button>
          </li>
        </ul>
      </div>

      <div class="right-container">
        <h1>Autres étudiants</h1>
        
        <div class="select-container">
          <select v-model="selectedSource" @change="loadRightList" class="group-select">
            <option value="" disabled>-- Choisir une source --</option>
            <option value="no_group">Étudiants sans groupe</option>
            <option disabled>--- Groupes du semestre ---</option>
            <option v-for="g in sourceGroups" :key="g.id" :value="g.id">
              Groupe {{ g.name }}
            </option>
          </select>
        </div>

        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchQuery2" placeholder="Rechercher un.e étudiant.e" />
        </div>

        <div v-if="loadingRight" class="loading-text">Chargement...</div>

        <ul v-else class="list">
          <li v-for="student in filteredStudentsInOtherGroups" :key="student.id" class="students-list">
            <div class="student-list-container">
              <div class="student-info">
                {{ student.name }}
              </div>
              <div class="student-group-number">
                <p>{{ student.originalGroupName || 'Sans groupe' }}</p>
              </div>
            </div>
            
            <div class="action-buttons">
              <button 
                @click="addStudent(student, false)" 
                class="button add-btn" 
                title="Ajouter (L'étudiant sera dans les deux groupes)"
              >
                +
              </button>

              <button 
                v-if="student.originalGroupId" 
                @click="addStudent(student, true)" 
                class="button move-btn" 
                title="Déplacer (Quitte ce groupe)"
              >
                ←
              </button>
            </div>
          </li>
          <li v-if="filteredStudentsInOtherGroups.length === 0 && selectedSource" class="empty-msg">
            Aucun étudiant disponible dans cette source.
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';

import { getGroupById, getAllGroupsBySemester, getGroups, deleteGroupById } from '../shared/fetchers/groups';
import { getStudentsByGroupId, getStudents } from '../shared/fetchers/students';
import { getSemesterById } from '../shared/fetchers/semesters';
import { getAllSemesters } from '../shared/fetchers/semesters';
import { postInscription, deleteInscriptionById, putInscriptionAndDeleteOldInscription, getInscriptions } from '../shared/fetchers/inscriptions';
import { postGroupWithSemesterName } from '../shared/fetchers/groups';

const route = useRoute();
const router = useRouter();
const currentGroupId = route.params.id;
const isCreating = ref(currentGroupId === '0');

const group = ref(null);
const semester = ref(null);
const allSemesters = ref([]);
const newGroupName = ref('');
const newGroupSemesterId = ref(null);
const studentsInGroup = ref([]);

const sourceGroups = ref([]);
const selectedSource = ref('');
const studentsInRightList = ref([]);
const loadingRight = ref(false);

const searchQuery1 = ref('');
const searchQuery2 = ref('');

// Groupes "administratifs" à exclure du filtre "sans groupe"
const excludedGroups = ['L1S1', 'L1S2', 'L2S3', 'L2S4', 'L3S5', 'L3S6'];

onMounted(async () => {
  if (isCreating.value) {
    // Mode création : charger tous les semestres
    allSemesters.value = await getAllSemesters();
  } else {
    // Mode modification
    await loadMainData();
  }
});

async function loadMainData() {
  if (!currentGroupId) return;

  try {
    group.value = await getGroupById(currentGroupId);
    semester.value = await getSemesterById(group.value.semester_id);

    const studentsIn = await getStudentsByGroupId(currentGroupId);
    studentsInGroup.value = studentsIn.map(s => ({ ...s, name: s.name }));

    // Convertir semester_id (1-6) en année (1-3)
    // S1,S2 -> année 1 | S3,S4 -> année 2 | S5,S6 -> année 3
    const year = Math.ceil(group.value.semester_id / 2);
    const allGroupsInSemester = await getAllGroupsBySemester(year);
    sourceGroups.value = allGroupsInSemester.filter(g => g.id !== parseInt(currentGroupId));

    if (selectedSource.value) {
      await loadRightList();
    }

  } catch (error) {
    console.error("Erreur chargement principal:", error);
  }
}


async function loadRightList() {
  if (!selectedSource.value) return;
  
  loadingRight.value = true;
  studentsInRightList.value = [];

  try {
    let rawStudents = [];
    let groupInfo = null;

    if (selectedSource.value === 'no_group') {
      const [allStudents, allInscriptions, allGroups] = await Promise.all([
        getStudents(),
        getInscriptions(),
        getGroups()
      ]);
      
      const targetSemesterId = group.value?.semester_id;

      // Récupérer les groupes administratifs du semestre cible
      const adminGroupsInSemester = allGroups.filter(g =>
        g.semester_id === targetSemesterId && excludedGroups.includes(g.name)
      );

      // Récupérer tous les étudiants inscrits dans les groupes admin (ils appartiennent à ce semestre)
      const adminInscriptions = allInscriptions.filter(i =>
        adminGroupsInSemester.some(g => g.id === i.group_id)
      );
      const studentIdsInThisSemester = new Set(adminInscriptions.map(i => i.student_id));

      // Récupérer les groupes non-administratifs du semestre cible
      const nonAdminGroupsInSemester = allGroups.filter(g =>
        g.semester_id === targetSemesterId && !excludedGroups.includes(g.name)
      );

      // Récupérer les étudiants avec un groupe non-admin dans ce semestre
      const nonAdminInscriptions = allInscriptions.filter(i =>
        nonAdminGroupsInSemester.some(g => g.id === i.group_id)
      );
      const studentIdsWithRealGroup = new Set(nonAdminInscriptions.map(i => i.student_id));

      // Étudiants du semestre sans groupe non-administratif
      rawStudents = allStudents.filter(s =>
        studentIdsInThisSemester.has(s.id) && !studentIdsWithRealGroup.has(s.id)
      );
      
    } else {
      const groupId = selectedSource.value;
      const sourceGroup = sourceGroups.value.find(g => g.id == groupId);
      if (sourceGroup) groupInfo = { id: sourceGroup.id, name: sourceGroup.name };
      
      rawStudents = await getStudentsByGroupId(groupId);
    }

    studentsInRightList.value = rawStudents.map(s => ({
      ...s,
      name: s.name,
      originalGroupId: groupInfo ? groupInfo.id : null,
      originalGroupName: groupInfo ? groupInfo.name : null
    }));

  } catch (error) {
    console.error("Erreur chargement liste droite:", error);
  } finally {
    loadingRight.value = false;
  }
}


const filteredStudentsInGroup = computed(() => {
  return studentsInGroup.value
    .filter(s => 
      s.name.toLowerCase().includes(searchQuery1.value.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));
});

const filteredStudentsInOtherGroups = computed(() => {
  const currentMemberIds = new Set(studentsInGroup.value.map(s => s.id));

  return studentsInRightList.value
    .filter(s => {
      if (currentMemberIds.has(s.id)) return false;
      return s.name.toLowerCase().includes(searchQuery2.value.toLowerCase());
    })
    .sort((a, b) => a.name.localeCompare(b.name));
});


async function deleteStudent(student) {
  if (!confirm(`Retirer ${student.name} du groupe ?`)) return;
  try {
    await deleteInscriptionById(student.id, currentGroupId);
    await loadMainData();
  } catch (e) {
    console.error(e);
    alert("Erreur suppression.");
  }
}

async function createNewGroup() {
  if (!newGroupName.value || !newGroupSemesterId.value) {
    alert("Veuillez remplir tous les champs");
    return;
  }

  try {
    // Trouver le nom du semestre sélectionné
    const selectedSemester = allSemesters.value.find(s => s.id === parseInt(newGroupSemesterId.value));
    if (!selectedSemester) {
      alert("Semestre invalide");
      return;
    }

    // Créer le groupe
    const newGroup = await postGroupWithSemesterName(selectedSemester.name, newGroupName.value);
    
    if (newGroup) {
      alert(`Le groupe "${newGroupName.value}" a été créé avec succès !`);
      router.push({ name: 'SelectGroupModification' });
    }
  } catch (e) {
    console.error(e);
    alert("Erreur lors de la création du groupe.");
  }
}

function cancelCreate() {
  router.push({ name: 'SelectGroupModification' });
}

async function addStudent(student, isMove) {
  let msg = isMove 
    ? `DÉPLACER ${student.name} de ${student.originalGroupName} vers ${group.value.name} ?`
    : `AJOUTER ${student.name} à ${group.value.name} ?`;
  
  if (!confirm(msg)) return;

  try {
    if (isMove && student.originalGroupId) {
      await putInscriptionAndDeleteOldInscription(student.id, student.originalGroupId, currentGroupId);
    } else {
      await postInscription(student.id, currentGroupId);
    }
    await loadMainData();
  } catch (e) {
    console.error(e);
    alert("Erreur opération.");
  }
}

async function deleteGroup() {
  const confirmMsg = `⚠️ ATTENTION : Supprimer le groupe "${group.value.name}" ?\n\nCette action est irréversible et supprimera toutes les inscriptions des étudiants à ce groupe.`;
  
  if (!confirm(confirmMsg)) return;
  
  try {
    await deleteGroupById(currentGroupId);
    alert(`Le groupe "${group.value.name}" a été supprimé avec succès.`);
    router.push({ name: 'SelectGroupModification' });
  } catch (e) {
    console.error(e);
    alert("Erreur lors de la suppression du groupe.");
  }
}
</script>

<style scoped>
@import url("../shared/shared.css");

/* ===== Styles CRÉATION ===== */
.header-creation {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.header-creation h1 {
  margin: 0;
  color: var(--color-1);
}

.creation-form {
  max-width: 600px;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-1);
  box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.secondary-btn {
  background-color: #6c757d;
  color: white;
  flex: 1;
}

.secondary-btn:hover {
  background-color: #5a6268;
}

.primary-btn {
  background-color: var(--color-1);
  color: white;
  flex: 1;
}

.primary-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Styles MODIFICATION ===== */
.header-with-delete {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.header-with-delete h1 {
  margin: 0;
}

.delete-group-btn {
  background-color: #dc2626;
  color: white;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  border: none;
  border-radius: 5px;
  width: auto !important;
  min-width: fit-content;
  display: inline-block;
}

.delete-group-btn:hover {
  background-color: #b91c1c;
}

.container {
  display: grid;
  grid-template-columns: 50% 50%;
  gap: 2rem;

}

/* Styles du Select */
.select-container {
  margin-bottom: 1rem;
  width: 100%; /* S'aligne avec la barre de recherche */
}

.group-select {
  width: 80%; /* Même largeur que search-container */
  padding: 0.7rem;
  border: 1px solid var(--color-3);
  border-radius: 8px;
  background-color: white;
  font-size: 1rem;
  color: black;
  outline: none;
  cursor: pointer;
}

.search-container {
  display: flex; align-items: center; background-color: white;
  border: 1px solid var(--color-3); border-radius: 8px;
  padding: 0.5rem 1rem; margin-bottom: 1rem; width: 80%;
}

.list {
  width: 80%;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
}

.student-list-container {
  margin-bottom: 0;
  font-size: 1.15rem;
}

.students-list {
  list-style-type: none;
  border: solid lightgray;
  background-color: var(--color-6);
  border-radius: 5px;
  margin-bottom: 1rem;
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-info {
  font-weight: bold;
}

.student-group-number {
  font-size: 0.9rem;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 0.5rem; /* Espace entre les boutons */
}

.button {
  cursor: pointer;
  border: none;
  border-radius: 5px;
  width: 30px;
  height: 30px;
  color: white;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0;
}

.button:hover {
  opacity: 0.9;
}

.add-btn {
  background-color: #388e3c; /* Vert pour Ajouter */
}

.move-btn {
  background-color: rgb(218, 116, 14);
}

/* Bouton rouge pour la suppression (colonne de gauche) */
.left-container .button {
  background-color: rgb(255, 0, 0); 
}


.search-container {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid var(--color-3);
  border-radius: 8px;
  padding: 0.5rem 0.5rem;
  margin-bottom: 1rem;
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--color-2);
  margin-right: 0.5rem;
  margin-top: 0.7rem;
}

.search-bar {
  border: none;
  outline: none;
  width: 100%;
  color: black;
  font-size: 1rem;
  margin-bottom: 0rem;
}
</style>