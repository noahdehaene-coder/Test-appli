// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Récupère toutes les matières (pour les nouvelles pages comme CreateCallPage)
 */
export async function getCourseMaterials() {
    try {
        const response = await fetch('http://localhost:3000/course_material', {
            method: 'GET',
            headers: getAuthHeader() // Sécurisation
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur de chargement des matières:', error);
    }
}


export const getAllCourses = getCourseMaterials;

/**
 * Récupère les matières pour un étudiant (pour corriger StudentSummaryPage.vue)
 */
export async function getCoursesByStudent(studentId) {
    try {
        const response = await fetch(`http://localhost:3000/course_material/by-student/${studentId}`, {
            method: 'GET',
            headers: getAuthHeader() // Sécurisation
        });

        if (!response.ok) {
            console.error(`Erreur HTTP ${response.status} lors de la récupération des cours`);
            return [];
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur de chargement des matières du semestre de l\'étudiant:', error);
        return [];
    }
}

/**
 * Récupère les matières pour un semestre donné
 */
export async function getCourseMaterialBySemester(semesterId) {
    try {
        const response = await fetch(`http://localhost:3000/course_material/by-semester/${semesterId}`, {
            method: 'GET',
            headers: getAuthHeader() // Sécurisation
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des matières : ", error);
    }
}

/**
 * Supprime toutes les matières de la table course_material.
 */
export async function deleteCourseMaterial() {
    try {
        const response = await fetch("http://localhost:3000/course_material/all", {
            method: "DELETE",
            headers: getAuthHeader() // Sécurisation
        });
        if (!response.ok) {
            throw new Error("Erreur lors de la suppression des matières");
        }
    } catch (error) {
        console.error(error);
    }
}