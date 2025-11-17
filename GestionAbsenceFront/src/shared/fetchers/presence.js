// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Récupère toutes les absences pour une année donnée.
 */
export async function getAbsenceByYear(year) {
    try {
        const response = await fetch(`http://localhost:3000/presence/by-year/${year}`, {
            method: 'GET',
            headers: getAuthHeader() // Sécurisé
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des absences : ", error);
    }
}

/**
 * Récupère la liste des étudiant.e.s absent.e.s pour une matière donnée.
 */
export async function getStudentsAbsenceByCourse(courseId) {
    try {
        const response = await fetch(`http://localhost:3000/student/presence/course/${courseId}`, {
            method: 'GET',
            headers: getAuthHeader() // Sécurisé
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des absences : ", error);
    }
}

// +++ AJOUT DE L'ALIAS POUR L'ANCIENNE PAGE +++
// Exporte la même fonction sous l'ancien nom 'getAbsenceByCourse'
export const getAbsenceByCourse = getStudentsAbsenceByCourse;
// ++++++++++++++++++++++++++++++++++++++++++++++

/**
 * Récupère toutes les absences d’un.e étudiant.e via son identifiant.
 */
export async function getStudentAbsencesById(id) {
    try {
        const response = await fetch(`http://localhost:3000/course_material/presence/student/${id}`, {
            method: 'GET',
            headers: getAuthHeader() // Sécurisé
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des absences : ", error);
    }
}

/**
 * Envoie une liste d’absences pour un créneau donné.
 */
export async function postAbsence(slotId, idStudents) {
    try {
        const response = await fetch(`http://localhost:3000/presence/many/${slotId}`, {
            method: "POST",
            headers: getAuthHeader(), // Sécurisé
            body: JSON.stringify(
                idStudents
            )
        })
        if (!response.ok) {
            throw new Error("Erreur lors de l'envoi des absences");
        }
        const text = await response.text();
        if (text) {
            return JSON.parse(text);
        } else {
            return null;
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi des absences :", error);
    }
}

/**
 * Supprime toutes les absences dans la table presence de la base de données.
 */
export async function deletePresences() {
    try {
        const response = await fetch(`http://localhost:3000/presence`, {
            method: "DELETE",
            headers: getAuthHeader() // Sécurisé
        })
        if (!response.ok) {
            throw new Error("Erreur lors de la suppression des inscriptions");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression des inscriptions:", error);
    }
}