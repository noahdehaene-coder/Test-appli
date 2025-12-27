<template>
    <main class="left">
        <h1>Appel pour {{ sessionTypeName }} {{ courseName }}</h1>
        <div>
            <h2>{{ groupName }}</h2>
            <div class="search-container">
                <SearchIcon class="search-icon" />
                <input class="search-bar" type="search" v-model="searchQuery" placeholder="Rechercher un.e étudiant.e">
            </div>
            <button id="select-all" class="button" @click="selectAll">
                {{ allSelected ? "Déselectionner tou.te.s" : "Sélectionner tou.te.s" }}
            </button>
            <ul class="list-presence">
                <li v-for="student in filteredStudents" :key="student.id">
                    <div class="student-list-container">
                        <div class="student-info">
                            <input type="checkbox" :value="student.id" v-model="presentStudentsId">
                            <label>{{ student.name }}</label>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        <button v-if="!callSaved" id="btn-save" class="button" @click="saveCallAndGoBack">Sauvegarder l'appel</button>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { getStudentsByGroupId } from '@/shared/fetchers/students';
import { postSlot, searchSlot } from '@/shared/fetchers/slots';
import { updateAbsences, getAbsencesBySlotId } from '@/shared/fetchers/presence';

const studentsInGroup = ref([]); 
const searchQuery = ref("");
const route = useRoute();
const router = useRouter();

const groupName = route.params.groupName;
const groupId = Number(route.params.groupId);
const sessionTypeName = route.params.sessionTypeName;
const sessionTypeGlobalId = Number(route.params.sessionTypeGlobalId);
const courseName = route.params.courseName;
const date = route.params.date;

const slot = ref(null);
const presentStudentsId = ref([]);
const allSelected = ref(false);
const callSaved = ref(false);

onMounted(async () => {
    studentsInGroup.value = await getStudentsByGroupId(groupId);
    
    const existingSlot = await searchSlot(groupId, courseName, sessionTypeGlobalId, date);
    
    if (existingSlot) {
        slot.value = existingSlot;
        
        const existingAbsences = await getAbsencesBySlotId(slot.value.id);
        const absentIds = existingAbsences.map(p => p.student_id);
        
        presentStudentsId.value = studentsInGroup.value
            .filter(student => !absentIds.includes(student.id))
            .map(student => student.id);
            
    } else {
        slot.value = null;
        selectAll(); 
    }
});

const filteredStudents = computed(() =>
    studentsInGroup.value.filter(s =>
        s.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

const absentStudentsId = computed(() =>
    studentsInGroup.value
        .map(student => student.id)
        .filter(id => !presentStudentsId.value.includes(id))
);

function selectAll() { 
    const studentsIdInGroup = studentsInGroup.value.map(student => student.id);
    if (!allSelected.value) {
        presentStudentsId.value = studentsIdInGroup.slice();
    } else {
        presentStudentsId.value = [];
    }
    allSelected.value = !allSelected.value;
}

async function saveCallAndGoBack() {
    if (!slot.value) {
        slot.value = await postSlot(groupId, courseName, sessionTypeGlobalId, date);
    }
    
    await updateAbsences(slot.value.id, absentStudentsId.value);
    
    callSaved.value = true;
    router.go(-2);
}
</script>

<style scoped>
@import url("../shared/shared.css");

#select-all { margin-bottom: 1rem; }

.list-presence {
    list-style-type: none;
    width: 35%;
    font-size: 1rem;
    padding-left: 0;
}

.list-presence>li {
    background-color: var(--color-6);
    margin-bottom: 0.5rem;
    border-radius: 5px;
}

input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    border: 1px solid black;
    border-radius: 5px;
    background-color: var(--color-5);
    cursor: pointer;
    height: 1.5rem;
    width: 1.5rem;
}

input[type="checkbox"]:hover {
    background-color: var(--color-3);
}

input[type="checkbox"]:checked {
    background-color: var(--color-2);
}

input[type="checkbox"]:checked::after {
    content: '✓';
    display: block;
    text-align: center;
    font-size: 16px;
    color: var(--color-6);
    font-weight: bold;
}
</style>