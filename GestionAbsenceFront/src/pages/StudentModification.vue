<template>
    <main class="left">

        <div class="page-layout" v-if="student">
            <div class="left-column">
                <h2>Remplissez les informations de l'étudiant.e</h2>
                <form @submit.prevent="submit" class="container">
                    <div>
                        <label for="student_number">Numéro étudiant : </label>
                        <input type="text" id="student_number" v-model="student.student_number"
                            :placeholder="student.student_number ? '' : 'Numéro de l\'étudiant.e'" />
                    </div>
                    <div>
                        <label for="name">Nom et Prénom : </label>
                        <input type="text" id="name" v-model="student.name"
                            :placeholder="student.name ? '' : 'Nom de l\'étudiant.e'" />
                    </div>
                    <div>
                        <label>Semestre en cours : </label>
                        <select v-model="semesterStudentId">
                            <option v-for="semester in semesters" :key="semester.id" :value="semester.id">
                                {{ semester.name }}</option>
                        </select>
                    </div>
                </form>
            </div>

            <div class="right-column">
                <h2>Sélectionnez ses groupes et ses options</h2>
                <div class="search-container">
                    <SearchIcon class="search-icon" />
                    <input class="search-bar" type="search" v-model="searchQuery" placeholder="Rechercher un groupe" />
                </div>
                <ul class="list-groups">
                    <li v-for="group in filteredGroups" :key="group.id">
                        <input type="checkbox" :id="`group-${group.id}`" :value="group.id" v-model="studentGroupsIds">
                        <label :for="`group-${group.id}`">{{ group.name }}</label>
                    </li>
                </ul>

                <ul class="list-groups">
                    <li v-for="group in filteredOtherGroups" :key="group.id">
                        <input type="checkbox" :id="`group-${group.id}`" :value="group.id" v-model="studentGroupsIds">
                        <label :for="`group-${group.id}`">{{ group.name }}</label>
                    </li>
                </ul>
            </div>
        </div>

        <button @click="submit" class="button">Enregistrer</button>
    </main>
</template>

<script setup>
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Imports des fetchers
import { getStudentById, postStudent, putStudentById } from '../shared/fetchers/students';
import { getGroupsByStudentId, getAllGroups, getGroupById } from '../shared/fetchers/groups';
import { getAllSemesters } from '../shared/fetchers/semesters';
import { postInscription, deleteInscriptionById } from '../shared/fetchers/inscriptions';

const student = ref(null);
// --- CORRECTION : Initialisation avec [] au lieu de null ---
const semesters = ref([]); // Ligne 55
const groups = ref([]); // Ligne 56
const otherGroups = ref([]); // Ligne 57
// --- FIN CORRECTION ---
const studentGroupsIds = ref([]);
const searchQuery = ref("");
const router = useRouter();
const route = useRoute();

const studentId = Number(route.params.id); // Fonctionne maintenant (grâce à routes.js)
const isNewStudent = computed(() => studentId === 0);
const semesterStudentId = ref(null);

onMounted(async () => {
    semesters.value = await getAllSemesters() || [];

    if (!isNewStudent.value) {
        student.value = await getStudentById(studentId);
        // Utilise '|| []' pour s'assurer que c'est un tableau même si l'API échoue
        groups.value = await getGroupsByStudentId(studentId) || []; 
        studentGroupsIds.value = groups.value.map(g => g.id); // Ligne 82 (maintenant sûre)
        
        if (groups.value.length > 0) {
            const groupWithSemester = await getGroupById(groups.value[0].id);
            semesterStudentId.value = groupWithSemester.semester_id;
        } else if (student.value) {
            // (Logique alternative si besoin)
        }
    } else {
        student.value = {
            id: 0,
            student_number: "",
            name: "",
        };
        groups.value = await getAllGroups() || [];
    }
});

// Fonctions computed (fonctionnent maintenant)
const filteredGroups = computed(() =>
    groups.value.filter(group => // Ligne 110 (maintenant sûre)
        group.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);
const filteredOtherGroups = computed(() =>
    otherGroups.value.filter(group =>
        group.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

// Soumission du formulaire
async function submit() {
    let currentStudentId = studentId;
    try {
        if (isNewStudent.value) {
            const newStudent = await postStudent({
                name: student.value.name,
                student_number: student.value.student_number
            });
            currentStudentId = newStudent.id;
        } else {
            // Met à jour l'étudiant existant (en s'assurant que putStudentById est correct)
            await putStudentById(
                currentStudentId,
                { // Envoie un objet, pas des arguments séparés
                  name: student.value.name,
                  student_number: student.value.student_number
                }
            );
        }

        const originalGroupIds = groups.value.map(g => g.id);
        const newGroupIds = studentGroupsIds.value;

        const toAdd = newGroupIds.filter(id => !originalGroupIds.includes(id));
        for (const groupId of toAdd) {
            await postInscription(currentStudentId, groupId);
        }

        const toRemove = originalGroupIds.filter(id => !newGroupIds.includes(id));
        for (const groupId of toRemove) {
            await deleteInscriptionById(currentStudentId, groupId);
        }

        alert("Étudiant enregistré avec succès !");
        router.push({ name: 'SelectStudentModification' });

    } catch (error) {
        console.error("Erreur lors de l'enregistrement :", error);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}
</script>


<style scoped>
/* Style d'origine */
@import url("../shared/shared.css");

.page-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.container {
    display: flex;
    flex-direction: column;
    gap: 25px;
    font-size: 1.25rem;
}

.container div {
    display: flex;
    align-items: center;
}

label {
    flex: 1;
}

input {
    flex: 2;
    margin-left: 10px;
    padding: 0.5rem;
    font-size: 1rem;
    border-radius: 5px;
    background-color: var(--color-6);
}

select {
    flex: 2;
    background-color: var(--color-6);
    cursor: pointer;
    border-radius: 5px;
    padding: 0.5rem;
    font-size: 1rem;
    margin-left: 10px;
}

.list-groups {
    list-style-type: none;
    font-size: 1rem;
    padding-left: 1;
    margin: 0;
    width: 100%;
}

.list-groups {
    width: 70%;
}

.list-groups>li {
    background-color: var(--color-6);
    border-radius: 5px;
}

.search-bar {
    margin-left: 0;
}
</style>