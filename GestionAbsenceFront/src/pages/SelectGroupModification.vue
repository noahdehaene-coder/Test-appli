<!--Page de sélection d'un groupe pour le modifier-->
<template>
  <main class="left">
    <div class="page-header">
      <h1>Sélectionner le groupe à modifier</h1>
      
      <RouterLink to="/modification/groupe/0" class="btn-add">
        + Créer un groupe
      </RouterLink>
    </div>

    <div class="sections-container">
      <div class="section">
        <h2>Groupes de L1</h2>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="selectedGroupL1" placeholder="Rechercher un groupe de L1">
        </div>
        <ul class="list">
          <li v-for="groupL1 in filteredGroupsL1" :key="groupL1.id">
            <RouterLink :to="`/modification/groupe/${groupL1.id}`" class="router-link">{{ groupL1.name }}
            </RouterLink>
          </li>
        </ul>
      </div>

      <div class="section">
        <h2>Groupes de L2</h2>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="selectedGroupL2" placeholder="Rechercher un groupe de L2">
        </div>
        <ul class="list">
          <li v-for="groupL2 in filteredGroupsL2" :key="groupL2.id">
            <RouterLink :to="`/modification/groupe/${groupL2.id}`" class="router-link">{{ groupL2.name }}
            </RouterLink>
          </li>
        </ul>
      </div>

      <div class="section">
        <h2>Groupes de L3</h2>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="selectedGroupL3" placeholder="Rechercher un groupe de L3">
        </div>
        <ul class="list">
          <li v-for="groupL3 in filteredGroupsL3" :key="groupL3.id">
            <RouterLink :to="`/modification/groupe/${groupL3.id}`" class="router-link">{{ groupL3.name }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { getAllGroupsBySemester } from '@/shared/fetchers/groups';

const groupsL1 = ref([]);
const groupsL2 = ref([]);
const groupsL3 = ref([]);

const excludedGroups = ['L1S1', 'L1S2', 'L2S3', 'L2S4', 'L3S5', 'L3S6'];

onMounted(async () => {
  groupsL1.value = await getAllGroupsBySemester(1);
  groupsL2.value = await getAllGroupsBySemester(2);
  groupsL3.value = await getAllGroupsBySemester(3);
});

// Filtrage des groupes selon la search-bar et selon la promo
const selectedGroupL1 = ref('');
const filteredGroupsL1 = computed(() =>
  groupsL1.value.filter(g =>
    g.name.toLowerCase().includes(selectedGroupL1.value.toLowerCase()) &&
    !excludedGroups.includes(g.name)
  ));

const selectedGroupL2 = ref('');
const filteredGroupsL2 = computed(() =>
  groupsL2.value.filter(g =>
    g.name.toLowerCase().includes(selectedGroupL2.value.toLowerCase()) &&
    !excludedGroups.includes(g.name)
  ));

const selectedGroupL3 = ref('');
const filteredGroupsL3 = computed(() =>
  groupsL3.value.filter(g =>
    g.name.toLowerCase().includes(selectedGroupL3.value.toLowerCase()) &&
    !excludedGroups.includes(g.name)
  ));
</script>

<style scoped>
@import url("../shared/shared.css");

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-right: 1rem;
}

.btn-add {
  background-color: var(--color-2);
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
  background-color: var(--color-1);
}

.btn-add:active {
  transform: translateY(1px);
}

@media (max-width: 900px) {
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-add {
    width: 100%;
    text-align: center;
    box-sizing: border-box;
  }

  .sections-container {
    flex-direction: column;
    height: auto;
    gap: 2rem;
    padding-bottom: 2rem;
  }

  .section {
    width: 100%;
    height: 400px;
    box-sizing: border-box;
  }
}
</style>