// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Récupère tous les étudiant.e.s.
 */
export async function getStudents() {
    try {
        const response = await fetch("http://localhost:3000/student", {
            method: 'GET',
            headers: getAuthHeader()
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des étudiant.e.s : ", error);
    }
}
export const getAllStudents = getStudents; // ALIAS

/**
 * Récupère un.e étudiant.e par son ID.
 */
export async function getStudentById(id) {
    try {
        const response = await fetch(`http://localhost:3000/student/${id}`, {
            method: 'GET',
            headers: getAuthHeader()
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération de l'étudiant.e : ", error);
    }
}

/**
 * Récupère tous les étudiant.e.s d'un groupe via l'ID du groupe.
 */
export async function getStudentsByGroupId(groupId) {
    try {
        const response = await fetch(`http://localhost:3000/student/by-group/${groupId}`, {
            method: 'GET',
            headers: getAuthHeader()
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des étudiant.e.s : ", error);
    }
}

/**
 * Récupère les étudiant.e.s qui sont dans le même semestre que le groupe
 * mais PAS dans le groupe lui-même.
 */
export async function getStudentsSameOtherGroup(groupId) {
    try {
        const response = await fetch(`http://localhost:3000/student/by-group-other/${groupId}`, {
            method: 'GET',
            headers: getAuthHeader()
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des autres étudiant.e.s : ", error);
    }
}

// +++ CORRECTION DE L'URL (by-course -> by-course_material) +++
/**
 * Récupère les étudiant.e.s inscrits à une matière (par ID de matière).
 * (Corrige l'erreur de CourseSummaryPage.vue)
 */
export async function getStudentsByCourseId(courseId) {
    try {
        // CORRECTION : L'URL est 'by-course_material'
        const response = await fetch(`http://localhost:3000/student/by-course_material/${courseId}`, {
            method: 'GET',
            headers: getAuthHeader()
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des étudiant.e.s par matière : ", error);
    }
}
// ALIAS pour CourseSummaryPage.vue
export const getStudentsBySemesterCourse = getStudentsByCourseId;
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/**
 * Ajoute une liste d'étudiant.e.s (CSV) pour un semestre donné.
 */
export async function postStudents(students, semesterId) {
    try {
        const response = await fetch(`http://localhost:3000/student/many/${semesterId}`, {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify(
                students
            )
        })
        if (!response.ok) {
            throw new Error("Erreur lors de l'envoi des étudiant.e.s");
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de l'envoi des étudiant.e.s :", error);
    }
}
export const postStudentsCSV = postStudents; // ALIAS

/**
 * Crée UN.E seul.e étudiant.e.
 */
export async function postStudent(studentData) {
    try {
        const response = await fetch(`http://localhost:3000/student`, {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify(studentData)
        });
        if (!response.ok) throw new Error("Erreur lors de la création de l'étudiant");
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la création de l'étudiant :", error);
    }
}

/**
 * Met à jour UN.E étudiant.e par son ID.
 */
export async function putStudent(id, studentData) {
    try {
        const response = await fetch(`http://localhost:3000/student/${id}`, {
            method: "PUT",
            headers: getAuthHeader(),
            body: JSON.stringify(studentData)
        });
        if (!response.ok) throw new Error("Erreur lors de la mise à jour de l'étudiant");
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'étudiant :", error);
    }
}
export const putStudentById = putStudent; // ALIAS

/**
 * Supprime tous les étudiant.e.s de la table student.
 */
export async function deleteStudents() {
    try {
        const response = await fetch(`http://localhost:3000/student`, {
            method: "DELETE",
            headers: getAuthHeader()
        })
        if (!response.ok) {
            throw new Error("Erreur lors de la suppression des étudiant.e.s");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression des étudiant.e.s:", error);
    }
}