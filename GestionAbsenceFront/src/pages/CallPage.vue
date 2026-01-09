<template>
    <main class="page-layout">
        
        <div class="main-call-area">
            <h1>Appel pour {{ sessionTypeName }} {{ courseName }}</h1>
            <h2>{{ groupName }}</h2>

            <div class="call-container-flex">
            <div class="left">
                
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
                                <label>
                                    {{ student.name }}
                                    <span v-if="student.isExtra" class="extra-badge">(Invité)</span>
                                </label>
                            </div>
                        </div>
                    </li>
                </ul>
                <button v-if="!callSaved" id="btn-save" class="button" @click="saveCallAndGoBack">Sauvegarder l'appel</button>

            </div>
            <aside class="sidebar-students">
            <h3>Ajouter un étudiant</h3>
            
            <div class="search-container sidebar-search">
                <SearchIcon class="search-icon" />
                <input class="search-bar" type="text" v-model="sidebarSearch" placeholder="Nom ou numéro...">
            </div>

            <div class="other-students-list">
                <div 
                    v-for="student in filteredOtherStudents" 
                    :key="student.id" 
                    class="sidebar-student-item"
                >
                    <div class="student-details">
                        <span class="student-name">{{ student.name }}</span>
                        <span class="student-num">{{ student.student_number }}</span>
                    </div>
                    <button class="add-btn" @click="addStudentToCall(student)">+</button>
                </div>
                
                <p v-if="filteredOtherStudents.length === 0" class="no-result">
                    {{ otherStudents.length === 0 ? 'Pas d\'autre étudiant' : 'Aucun résultat' }}
                </p>
            </div>
        </aside>
        </div>
        </div>

        

    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { getStudentsByGroupId, getStudentsSameOtherGroup } from '@/shared/fetchers/students'; // Import de la fonction existante
import { postSlot, searchSlot } from '@/shared/fetchers/slots';
import { getAbsencesBySlotId, updateAbsences } from '@/shared/fetchers/presence';

const router = useRouter();
const route = useRoute();

const groupId = parseInt(route.params.groupId);
const groupName = route.params.groupName;
const courseName = route.params.courseName;
const sessionTypeName = route.params.sessionTypeName;
const sessionTypeGlobalId = parseInt(route.params.sessionTypeGlobalId);
const date = route.params.date;
const startTimeParam = route.params.startTime;
const endTimeParam = route.params.endTime;

const students = ref([]);
const presentStudentsId = ref([]);
const searchQuery = ref("");
const callSaved = ref(false);
const slot = ref(null);

const otherStudents = ref([]);
const sidebarSearch = ref("");

onMounted(async () => {
    const slotData = await searchSlot(groupId, courseName, sessionTypeGlobalId, date);
    if (slotData) {
        slot.value = slotData;
        const [studentsData, presenceData] = await Promise.all([
            getStudentsByGroupId(groupId),
            getAbsencesBySlotId(slotData.id)
        ]);
        students.value = studentsData;
        
        const absentIds = presenceData.map(p => p.student_id);
        presentStudentsId.value = studentsData
            .filter(s => !absentIds.includes(s.id))
            .map(s => s.id);
            
    } else {
        students.value = await getStudentsByGroupId(groupId);
    }

    if (groupId) {
        const others = await getStudentsSameOtherGroup(groupId);
        otherStudents.value = others.filter(s => !students.value.some(inList => inList.id === s.id));
    }
});

const filteredStudents = computed(() => {
    return students.value.filter(student => 
        student.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const allSelected = computed(() => {
    return filteredStudents.value.length > 0 && 
           filteredStudents.value.every(student => presentStudentsId.value.includes(student.id));
});

function selectAll() {
    if (allSelected.value) {
        presentStudentsId.value = [];
    } else {
        presentStudentsId.value = filteredStudents.value.map(s => s.id);
    }
}

const filteredOtherStudents = computed(() => {
    const search = sidebarSearch.value.toLowerCase();
    return otherStudents.value.filter(s => {
        if (students.value.some(existing => existing.id === s.id)) return false;
        
        return s.name.toLowerCase().includes(search) || 
               (s.student_number && s.student_number.toString().includes(search));
    });
});

function addStudentToCall(studentToAdd) {
    students.value.push({
        ...studentToAdd,
        isExtra: true
    });
    
    presentStudentsId.value.push(studentToAdd.id);
    
}

const absentStudentsId = computed(() => {
    return students.value
        .filter(student => !presentStudentsId.value.includes(student.id))
        .map(student => student.id);
});

async function saveCallAndGoBack() {
    if (!slot.value) {
        const slotData = {
            group_id: groupId,
            courseName: courseName,
            session_type_id: sessionTypeGlobalId,
            date: date,
            start_time: startTimeParam || date, 
            end_time: endTimeParam || date
        };
        slot.value = await postSlot(slotData);
    }
    
    await updateAbsences(slot.value.id, absentStudentsId.value);
    
    callSaved.value = true;
    router.push({ name: 'ProfessorDashboard' });
}
</script>

<style scoped>
@import url("../shared/shared.css");

.call-container-flex {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 40px;
}

.left {
    flex: 2;
}


.sidebar-students {
    flex: 1;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    position: sticky;
    top: 20px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.h3{
    text-align: center;
}

#select-all { margin-bottom: 1rem; }

.list-presence {
    list-style-type: none;
    width: 100%;
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
    background-color: var(--color-6);
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 10px;
    cursor: pointer;
}

input[type="checkbox"]:checked {
    background-color: #27ae60;
    border-color: #27ae60;
    position: relative;
}

input[type="checkbox"]:checked::after {
    content: '✔';
    color: white;
    font-size: 1rem;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.student-list-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
}

.student-info {
    display: flex;
    align-items: center;
}

.search-container {
    display: flex;
    align-items: center;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 0.5rem;
    margin-bottom: 1rem;
    width: 100%;
}

.search-icon {
    width: 1.2rem;
    height: 1.2rem;
    margin-right: 0.5rem;
}

.search-bar {
    border: none;
    outline: none;
    width: 100%;
    font-size: 1rem;
}

/* NOUVEAUX STYLES POUR LA SIDEBAR */
.sidebar-desc {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 10px;
}

.sidebar-search {
    margin-bottom: 10px;
    padding: 5px;
}

.other-students-list {
    overflow-y: auto; /* Scroll si la liste est longue */
    flex: 1;
}

.sidebar-student-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #eee;
    background: #fdfdfd;
}

.sidebar-student-item:hover {
    background: #f0f8ff;
}

.student-details {
    display: flex;
    flex-direction: column;
}

.student-name { font-weight: bold; font-size: 0.9rem; }
.student-num { font-size: 0.8rem; color: #888; }

.add-btn {
    background-color: var(--color-1, #005a8f);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px; height: 24px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-btn:hover { background-color: #004066; }

.extra-badge {
    font-size: 0.8rem;
    color: #e67e22;
    font-weight: bold;
    margin-left: 5px;
}

.no-result {
    text-align: center;
    color: #999;
    font-style: italic;
    margin-top: 1rem;
}
</style>