<template>
  <main class="left" v-if="group && semester">
    <div class="container">
      <div class="left-container">
        <h1>Liste des étudiant.e.s {{ group.name }} {{ semester.name }}</h1>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchQuery1" placeholder="Rechercher un.e étudiant.e" />
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
            <button @click="deleteStudent(student)" class="button" id="delete-btn">
              ×
            </button>
          </li>
        </ul>
      </div>

      <div class="right-container">
        <h1>Liste des autres étudiant.e.s</h1>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchQuery2" placeholder="Rechercher un.e étudiant.e" />
        </div>
        <ul class="list">
          <li v-for="student in filteredStudentsOutsideGroup" :key="student.id" class="students-list">
            <div class="student-list-container">
              <div class="student-info">
                {{ student.name }}
              </div>
              <div class="student-group-number" v-if="student.originalGroupId">
                <p>{{ student.originalGroupName }}</p>
              </div>
            </div>
            <button @click="addStudent(student)" class="button" id="add-btn">
              +
            </button>
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup>
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getStudentsByGroupId, getStudentsSameOtherGroup } from '../shared/fetchers/students';
import { getGroupById } from '../shared/fetchers/groups';
import { getSemesterById } from '../shared/fetchers/semesters';
import { postInscription, putInscriptionAndDeleteOldInscription, deleteInscriptionById } from '../shared/fetchers/inscriptions';

const route = useRoute();
const groupId = Number(route.params.id);

const studentsInGroup = ref([]);
const studentsOutsideGroup = ref([]);

const searchQuery1 = ref("");
const searchQuery2 = ref("");

const group = ref([]);
const semester = ref(null);
const currentGroupId = groupId;

/**
 * Charge toutes les listes
 */
async function loadLists() {
  studentsInGroup.value = await getStudentsByGroupId(currentGroupId) || [];
  studentsOutsideGroup.value = await getStudentsSameOtherGroup(currentGroupId) || [];
}

onMounted(async () => {
  group.value = await getGroupById(currentGroupId);
  if (group.value) {
    semester.value = await getSemesterById(group.value.semester_id);
  }
  await loadLists();
});


const filteredStudentsInGroup = computed(() =>
  studentsInGroup.value.filter(student =>
    student.name.toLowerCase().includes(searchQuery1.value.toLowerCase())
  )
);
const filteredStudentsOutsideGroup = computed(() =>
  studentsOutsideGroup.value.filter(student =>
    student.name.toLowerCase().includes(searchQuery2.value.toLowerCase())
  )
);

/**
 * Supprime un étudiant du groupe
 */
async function deleteStudent(student) {
  const confirmDelete = confirm(`Voulez-vous vraiment supprimer ${student.name} du groupe ?`);
  if (!confirmDelete) return;

  try {
    await deleteInscription(student.id, currentGroupId);
    await loadLists();
  } catch (error) {
    console.error("Erreur lors de la suppression de l'inscription :", error);
    alert("La suppression a échoué. Veuillez réessayer.");
  }
}

/**
 * Ajoute un étudiant au groupe
 */
async function addStudent(student) {
  const confirmAdd = confirm(`Voulez-vous ajouter ${student.name} au groupe ?`);
  if (!confirmAdd) return;

  try {
    if (student.originalGroupId) {
      await putInscriptionAndDeleteOldInscription(student.id, student.originalGroupId, currentGroupId);
    } else {
      await postInscription(student.id, currentGroupId);
    }
    await loadLists();
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'inscription :", error);
    alert("L'ajout a échoué. Veuillez réessayer.");
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
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#add-btn {
  color: var(--color-8);
  border-color: var(--color-8);
}

#delete-btn {
  color: var(--color-7);
  border-color: var(--color-7);
}

.button {
  margin: 0;
  padding: 0.3rem;
  font-size: 1.4rem;
  background-color: var(--color-6);
}

.button:hover {
  background-color: var(--color-5);
}
</style>