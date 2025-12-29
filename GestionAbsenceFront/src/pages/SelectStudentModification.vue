<template>
  <main class="left">
    <div class="page-header">
      <h1>Sélectionner un.e étudiant.e à modifier</h1>
      
      <RouterLink to="/modification/etudiant/0" class="btn-add">
        + Créer un étudiant
      </RouterLink>
    </div>

    <div v-if="loading" class="loading-container">
      Chargement de l'annuaire...
    </div>

    <div v-else class="sections-container">
      
      <div class="section">
        <div class="header-section">
          <h2>L1</h2>
          <span class="badge">{{ filteredL1.length }}</span>
        </div>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchL1" placeholder="Rechercher...">
        </div>
        <ul class="list">
          <li v-for="student in filteredL1" :key="student.id">
            <RouterLink :to="`/modification/etudiant/${student.id}`" class="router-link">
              <div class="student-info">
                <span class="name">{{ student.name }}</span>
                <span class="num">{{ student.student_number }}</span>
              </div>
            </RouterLink>
          </li>
          <li v-if="filteredL1.length === 0" class="empty-msg">Aucun étudiant trouvé.</li>
        </ul>
      </div>

      <div class="section">
        <div class="header-section">
          <h2>L2</h2>
          <span class="badge">{{ filteredL2.length }}</span>
        </div>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchL2" placeholder="Rechercher...">
        </div>
        <ul class="list">
          <li v-for="student in filteredL2" :key="student.id">
            <RouterLink :to="`/modification/etudiant/${student.id}`" class="router-link">
              <div class="student-info">
                <span class="name">{{ student.name }}</span>
                <span class="num">{{ student.student_number }}</span>
              </div>
            </RouterLink>
          </li>
          <li v-if="filteredL2.length === 0" class="empty-msg">Aucun étudiant trouvé.</li>
        </ul>
      </div>

      <div class="section">
        <div class="header-section">
          <h2>L3</h2>
          <span class="badge">{{ filteredL3.length }}</span>
        </div>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchL3" placeholder="Rechercher...">
        </div>
        <ul class="list">
          <li v-for="student in filteredL3" :key="student.id">
            <RouterLink :to="`/modification/etudiant/${student.id}`" class="router-link">
              <div class="student-info">
                <span class="name">{{ student.name }}</span>
                <span class="num">{{ student.student_number }}</span>
              </div>
            </RouterLink>
          </li>
          <li v-if="filteredL3.length === 0" class="empty-msg">Aucun étudiant trouvé.</li>
        </ul>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';

import { getStudents } from '@/shared/fetchers/students';
import { getGroups } from '@/shared/fetchers/groups';
import { getInscriptions } from '@/shared/fetchers/inscriptions';

const loading = ref(true);

const studentsL1 = ref([]);
const studentsL2 = ref([]);
const studentsL3 = ref([]);

const searchL1 = ref('');
const searchL2 = ref('');
const searchL3 = ref('');

onMounted(async () => {
  await loadData();
});

async function loadData() {
  try {
    loading.value = true;
    
    const [allStudents, allGroups, allInscriptions] = await Promise.all([
      getStudents(),
      getGroups(),
      getInscriptions()
    ]);

    allStudents.sort((a, b) => a.name.localeCompare(b.name));

    const groupSemesterMap = new Map();
    allGroups.forEach(g => {
      if (g.semester_id) groupSemesterMap.set(String(g.id), g.semester_id);
    });

    const l1 = [];
    const l2 = [];
    const l3 = [];

    for (const student of allStudents) {
      const myInscriptions = allInscriptions.filter(i => String(i.student_id) === String(student.id));
      
      let maxYear = 0;

      if (myInscriptions.length === 0) {
        maxYear = 1; 
      } else {
        for (const inscription of myInscriptions) {
          const semesterId = groupSemesterMap.get(String(inscription.group_id));
          if (semesterId) {
            // S1,S2 -> 1 | S3,S4 -> 2 | S5,S6 -> 3
            const year = Math.ceil(semesterId / 2);
            if (year > maxYear) maxYear = year;
          }
        }
        if (maxYear === 0) maxYear = 1;
      }

      if (maxYear === 3) l3.push(student);
      else if (maxYear === 2) l2.push(student);
      else l1.push(student); // L1 par défaut
    }

    studentsL1.value = l1;
    studentsL2.value = l2;
    studentsL3.value = l3;


  } catch (error) {
    console.error("Erreur chargement données:", error);
  } finally {
    loading.value = false;
  }
}

// Filtres
const filteredL1 = computed(() => filterList(studentsL1.value, searchL1.value));
const filteredL2 = computed(() => filterList(studentsL2.value, searchL2.value));
const filteredL3 = computed(() => filterList(studentsL3.value, searchL3.value));

function filterList(list, query) {
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(s => 
    s.name.toLowerCase().includes(q) || 
    String(s.student_number).includes(q)
  );
}
</script>

<style scoped>
@import url("../shared/shared.css");

.sections-container {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  height: 80vh;
}

.section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border: 2px solid var(--color-3);
  border-radius: 8px;
  padding: 1rem;
  overflow: hidden;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-3);
}

.header-section h2 {
  font-size: 1.2rem;
  margin: 0;
  color: black;
}

.badge {
  background-color: var(--color-2);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
}

.search-container {
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0rem;
  margin-bottom: 1rem;
}

.search-icon {
  width: 18px;
  height: 18px;
  color: #888;
  margin-right: 0.5rem;
}

.search-bar {
  border: none;
  background: transparent;
  outline: none;
  width: 90%;
  font-size: 0.95rem;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  width: 103%;
}

.list::-webkit-scrollbar { width: 6px; }
.list::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }

.list li {
  border-bottom: 1px solid #eee;
}

.list li:last-child {
  border-bottom: none;
}

.router-link {
  display: block;
  padding: 0.8rem 0.5rem;
  text-decoration: none;
  color: black;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.router-link:hover {
  background-color: #f0f7ff;
}

.student-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name { font-weight: 600; }
.num { font-size: 0.8rem; color: #888; background: transparent; padding: 2px 6px; border-radius: 4px; }

.loading-container, .empty-msg {
  text-align: center; color: #888; margin-top: 2rem; font-style: italic;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-right: 1rem; /* Petit espace à droite pour ne pas coller au bord */
}

.btn-add {
  background-color: var(--color-2); /* Utilise la couleur de vos badges */
  color: white;
  padding: 0.6rem 1.2rem;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: opacity 0.2s, transform 0.1s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-add:hover {
  opacity: 0.9;
  background-color: var(--color-1); /* Optionnel : change un peu la couleur au survol */
}

.btn-add:active {
  transform: translateY(1px);
}
</style>