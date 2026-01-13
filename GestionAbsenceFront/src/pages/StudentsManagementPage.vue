<!--Page de gestion des étudiant.e.s pour ajouter des étudiant.e.s et des groupes avec les listes des étudiant.e.s joints au groupe-->
<template>
    <main class="left">

        <div class="header-section">
            <h1>Création des classes</h1>

            <div>
                <button class="button" id="refresh-ade-btn" @click="refreshADE">Supprimer les matières</button>
                <button class="button" id="refresh-bdd-btn" @click="viderBDD">Supprimer les étudiant·e·s et les groupes</button>
            </div>
        </div>

        <PromoSelector v-model="selectedSemesterForStudents" />

        <form @submit.prevent="submitStudents" class="file-upload-form">
            <div class="file-upload-section">
                <label :for="'upload-' + selectedSemesterForStudents">Importer le fichier csv pour {{
                    selectedSemesterForStudents }} :</label>
                <input type="file" accept=".csv" class="file-upload" :id="'upload-' + selectedSemesterForStudents"
                    @change="fileChange($event, selectedSemesterForStudents)" ref="studentFileInput">
                <button type="submit" class="button" :disabled="loadingStudents">
                    <span v-if="loadingStudents" class="loader"></span>
                    <span v-else>Envoyer le fichier</span>
                </button>
            </div>
        </form>

        <h1>Création des groupes</h1>

        <PromoSelector v-model="selectedSemesterForGroups" />

        <form @submit.prevent="submitGroup" class="file-upload-form">
            <div class="file-group-name">
                <input type="text" class="group-name" placeholder="Renseigner le nom du groupe" v-model="groupName">
                <button type="button" class="button" id="group-name-btn" @click="createGroup">Créer le groupe</button>
            </div>
            <div class="file-upload-section">
                <label :for="'upload-' + selectedSemesterForGroups">Importer le fichier csv des étudiant.e.s du
                    groupe :</label>
                <input type="file" accept=".csv" class="file-upload" :id="'upload-' + selectedSemesterForGroups"
                    @change="fileChange($event, selectedSemesterForGroups)" ref="groupFileInput">
                <button type="submit" class="button" :disabled="loadingGroups">
                    <span v-if="loadingGroups" class="loader"></span>
                    <span v-else>Envoyer le fichier</span>
                </button>
            </div>
        </form>
    </main>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PromoSelector from '@/shared/components/PromoSelector.vue';
import { deleteStudents, postStudentsCSV } from '@/shared/fetchers/students';
import { deleteGroups, postGroupWithSemesterName } from '@/shared/fetchers/groups';
import { deleteInscriptions, postInscriptionsCSV } from '@/shared/fetchers/inscriptions';
import { deleteSessionType } from '@/shared/fetchers/session_type';
import { deleteCourseMaterial } from '@/shared/fetchers/course_material';
import { deleteSlots } from '@/shared/fetchers/slots';
import { deletePresences } from '@/shared/fetchers/presence';

async function refreshADE() {
    const confirmRefresh = window.confirm("⚠️ Cette action va supprimer les matières et leurs données de la BDD. Vous ne pourrez pas revenir en arrière ! Êtes-vous sûr.e ?");
    if (confirmRefresh) {
        try {
            await deleteCourseMaterial();
            await deleteSessionType();
            alert("✅ Matières supprimées avec succès !");
        } catch (error) {
            alert("❌ Erreur lors de la suppression : " + error.message);
        }
    }
}

async function viderBDD() {
    const confirmRefresh = window.confirm("⚠️ Cette action va supprimer les étudiant·e·s et les groupes de la BDD. Vous ne pourrez pas revenir en arrière ! Êtes-vous sûr·e ?");
    if (confirmRefresh) {
        try {
            await deleteInscriptions();
            await deletePresences();
            await deleteStudents();
            await deleteSlots();
            await deleteGroups();
            alert("✅ Base de données vidée avec succès !");
        } catch (error) {
            alert("❌ Erreur lors du vidage : " + error.message);
        }
    }
}

const selectedSemesterForStudents = ref('S1')

const selectedSemesterForGroups = ref('S1')

const uploadedFiles = reactive({})
const studentFileInput = ref(null);
const groupFileInput = ref(null);
const loadingStudents = ref(false);
const loadingGroups = ref(false);

function fileChange(event, semester) {
    const file = event.target.files[0]
    if (file) {
        uploadedFiles[semester] = file
    }
}

async function submitStudents() {
    const semester = selectedSemesterForStudents.value;
    const fichier = uploadedFiles[semester];

    if (!fichier) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    loadingStudents.value = true;
    try {
        await postStudentsCSV(fichier);

        const semesterNumber = parseInt(semester.replace('S', ''), 10);
        const year = Math.ceil(semesterNumber / 2); 
        const groupName = `L${year}${semester}`;

        const newGroup = await postGroupWithSemesterName(semester, groupName);
        console.log(`Groupe ${groupName} créé avec l'ID : ${newGroup.id}`);

        await postInscriptionsCSV(newGroup.id, fichier);

        alert(`Succès ! Les étudiant·e·s ont été importé·e·s et le groupe "${groupName}" a été créé avec ses inscrit·e·s.`);

        studentFileInput.value.value = '';
        uploadedFiles[selectedSemesterForStudents.value] = null;

    } catch (error) {
        console.error("Erreur lors de l'importation complète : ", error);
        alert("❌ Erreur : " + (error.message || "Une erreur est survenue lors de l'importation"));
    } finally {
        loadingStudents.value = false;
    }
}

const groupName = ref('');
const createdGroup = ref(null);

async function createGroup() {
    if (!groupName.value) {
        alert("Veuillez entrer un nom de groupe.");
        return;
    }
    try {
        createdGroup.value = await postGroupWithSemesterName(selectedSemesterForGroups.value, groupName.value);
        alert("✅ Groupe créé avec succès !");
    } catch (error) {
        console.error("Erreur lors de la création du groupe : ", error);
        alert("❌ Erreur : " + (error.message || "Echec de la création du groupe"));
    }
}

async function submitGroup() {
    if (!groupName.value.trim()) {
        alert("❌ Vous ne pouvez pas déposer de fichier pour un groupe sans le créer avant.");
        return;
    }

    const fichier = uploadedFiles[selectedSemesterForGroups.value];
    if (!fichier) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }
    
    loadingGroups.value = true;
    try {
        await postInscriptionsCSV(createdGroup.value.id, fichier);
        alert("✅ Fichier envoyé avec succès.");

        groupFileInput.value.value = '';
        uploadedFiles[selectedSemesterForGroups.value] = null;
        groupName.value = '';
    } catch (error) {
        console.error("Erreur lors de l'envoi du fichier : ", error);
        alert("❌ Erreur : " + (error.message || "Échec de l'envoi du fichier"));
    } finally {
        loadingGroups.value = false;
    }
}
</script>

<style scoped>
@import url("../shared/shared.css");

.header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.header-section>div {
    display: flex;
    gap: 1rem;
}

#refresh-bdd-btn {
    background-color: var(--color-7);
}

#refresh-bdd-btn:hover {
    background-color: var(--color-6);
}

.file-upload-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
}

.file-upload-section,
.file-group-name {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.file-upload-section>label {
    color: black;
    border-radius: 5px;
    font-size: 1.25rem;
}

.file-upload {
    cursor: pointer;
}

.group-name {
    padding: 0.75rem;
    font-size: 1rem;
    width: max-content;
    border-radius: 5px;
    background-color: var(--color-6);
    border: solid black 2px;
}

#group-name-btn {
    margin: 0;
}

.button {
    align-self: center;
    width: max-content;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.loader {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top: 2px solid black;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>