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
                            <option value="" disabled>-- Choisir un semestre --</option>
                            <option v-for="semester in semesters" :key="semester.id" :value="semester.id">
                                {{ semester.name }}</option>
                        </select>
                    </div>
                </form>
            </div>

            <div class="right-column">
                <h2>Sélectionnez ses groupes</h2>
                <div class="search-container">
                    <SearchIcon class="search-icon" />
                    <input class="search-bar" type="search" v-model="searchQuery" placeholder="Rechercher un groupe" />
                </div>
                
                <div v-if="!semesterStudentId" style="margin-top: 1rem; color: #666; font-style: italic;">
                    Veuillez sélectionner un semestre à gauche pour voir les groupes disponibles.
                </div>

                <ul v-else class="list-groups">
                    <li v-for="group in filteredGroups" :key="group.id">
                        <input type="checkbox" :id="`group-${group.id}`" :value="group.id" v-model="studentGroupsIds">
                        <label :for="`group-${group.id}`">{{ group.name }}</label>
                    </li>
                    <li v-if="filteredGroups.length === 0" style="padding: 10px; text-align: center;">
                        Aucun groupe trouvé pour ce semestre.
                    </li>
                </ul>
            </div>
        </div>

        <div class="btn">
            <button @click="submit" class="button">Enregistrer</button>
        </div>
    </main>
</template>

<script setup>
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getStudentById, postStudent, putStudentById } from '../shared/fetchers/students';
import { getGroupsByStudentId, getAllGroupsBySemester, getGroupById } from '../shared/fetchers/groups';
import { getAllSemesters } from '../shared/fetchers/semesters';
import { postInscription, deleteInscriptionById, getInscriptions } from '../shared/fetchers/inscriptions';

const student = ref(null);
const semesters = ref([]);
const groups = ref([]); // Contient TOUS les groupes du semestre sélectionné
const studentGroupsIds = ref([]); // IDs des groupes cochés (Inscriptions voulues)
const initialEnrolledIds = ref([]); // Pour savoir ce qu'il faut supprimer/ajouter à la fin

const searchQuery = ref("");
const router = useRouter();
const route = useRoute();

const studentId = Number(route.params.id);
const isNewStudent = computed(() => studentId === 0);
const semesterStudentId = ref("");

onMounted(async () => {
    semesters.value = await getAllSemesters() || [];

    if (!isNewStudent.value) {
        student.value = await getStudentById(studentId);
        
        const currentGroups = await getGroupsByStudentId(studentId) || [];
        studentGroupsIds.value = currentGroups.map(g => g.id);
        initialEnrolledIds.value = [...studentGroupsIds.value];

        if (currentGroups.length > 0) {
            const firstGroup = currentGroups[0];
            if (firstGroup.semester_id) {
                semesterStudentId.value = firstGroup.semester_id;
            } else {
                const details = await getGroupById(firstGroup.id);
                semesterStudentId.value = details.semester_id;
            }
        } else {
        }
    } else {
        student.value = { id: 0, student_number: "", name: "" };
        if (semesters.value.length > 0) semesterStudentId.value = semesters.value[0].id;
    }

    if (semesterStudentId.value) {
        await loadSemesterGroups(semesterStudentId.value);
    }
});

watch(semesterStudentId, async (newVal) => {
    if (newVal) {
        await loadSemesterGroups(newVal);
    } else {
        groups.value = [];
    }
});

async function loadSemesterGroups(semId) {
    try {
        const year = Math.ceil(semId / 2);
        const allGroupsInYear = await getAllGroupsBySemester(year) || [];
        groups.value = allGroupsInYear.filter(group => group.semester_id === semId);
    } catch (e) {
        console.error("Erreur chargement groupes du semestre", e);
        groups.value = [];
    }
}

const filteredGroups = computed(() =>
    groups.value.filter(group =>
        group.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

async function submit() {
    let currentStudentId = studentId;
    try {
        if (isNewStudent.value) {
            // C'est ici qu'on applique la règle de gestion pour la CRÉATION
            const newStudent = await postStudent({
                name: student.value.name,
                student_number: student.value.student_number,
                // AJOUT : Le mot de passe est défini comme étant le numéro étudiant
                password: student.value.student_number 
            });
            currentStudentId = newStudent.id;
        } else {
            // Pour la MODIFICATION, on ne touche pas au mot de passe ici
            await putStudentById(currentStudentId, {
                name: student.value.name,
                student_number: student.value.student_number
            });
        }

        // Le reste de la fonction pour les inscriptions aux groupes reste inchangé
        const oldIds = initialEnrolledIds.value; 
        const newIds = studentGroupsIds.value;   

        const toAdd = newIds.filter(id => !oldIds.includes(id));
        for (const groupId of toAdd) {
            await postInscription(currentStudentId, groupId);
        }

        const toRemove = oldIds.filter(id => !newIds.includes(id));
        for (const groupId of toRemove) {
            await deleteInscriptionById(currentStudentId, groupId);
        }

        alert("Modifications enregistrées avec succès !");
        router.push({ name: 'SelectStudentModification' });

    } catch (error) {
        console.error("Erreur lors de l'enregistrement :", error);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}
</script>

<style scoped>
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
    margin-bottom: 0.5rem;
    padding: 0.5rem;       
    display: flex;        
    align-items: center;
}

.list-groups>li input {
    margin-right: 10px;
    margin-left: 0;
    flex: 0;
    width: auto;
}

.search-bar {
    margin-left: 0;
}

.btn {
    margin-top: 2rem;
    text-align: center;
}
</style>