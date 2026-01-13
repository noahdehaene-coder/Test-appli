<template>
  <main class="left" v-if="group && semester">
    <div class="container">
      
      <div class="left-container">
        <h1>Membres de {{ group.name }}</h1>
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
import { useRoute } from 'vue-router';
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';

import { getGroupById, getAllGroupsBySemester, getGroups } from '../shared/fetchers/groups';
import { getStudentsByGroupId, getStudents } from '../shared/fetchers/students';
import { getSemesterById } from '../shared/fetchers/semesters';
import { postInscription, deleteInscriptionById, putInscriptionAndDeleteOldInscription, getInscriptions } from '../shared/fetchers/inscriptions';

const route = useRoute();
const currentGroupId = route.params.id;

const group = ref(null);
const semester = ref(null);
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
  await loadMainData();
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
      
      // Créer une map des noms de groupes par ID
      const groupNameMap = new Map(allGroups.map(g => [g.id, g.name]));
      
      // Filtrer les inscriptions qui ne sont PAS dans des groupes administratifs
      const realInscriptions = allInscriptions.filter(i => {
        const groupName = groupNameMap.get(i.group_id);
        return groupName && !excludedGroups.includes(groupName);
      });
      
      const studentIdsWithRealGroup = new Set(realInscriptions.map(i => i.student_id));
      rawStudents = allStudents.filter(s => !studentIdsWithRealGroup.has(s.id));
      
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
</script>

<style scoped>
@import url("../shared/shared.css");

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