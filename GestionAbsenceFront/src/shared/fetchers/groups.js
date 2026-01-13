// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Récupère tous les groupes.
 */
export async function getGroups() {
    try {
        const response = await fetch("http://localhost:3000/group", {
            method: 'GET',
            headers: getAuthHeader() // Corrigé
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des groupes : ", error);
    }
}
export const getAllGroups = getGroups; // ALIAS

/**
 * Récupère tous les groupes pour une ANNÉE donnée (L1, L2, ou L3).
 */
export async function getAllGroupsBySemester(year) {
    try {
        const response = await fetch(`http://localhost:3000/group/by-semester/${year}`, {
            method: 'GET',
            headers: getAuthHeader() 
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors du chargement des groupes par semestre :', error);
    }
}
export const getGroupByYear = getAllGroupsBySemester; // ALIAS

/**
 * Récupère un groupe par son ID.
 */
export async function getGroupById(id) {
    try {
        const response = await fetch(`http://localhost:3000/group/${id}`, {
             method: 'GET',
             headers: getAuthHeader() // Corrigé
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors du chargement du groupe :', error);
    }
}

/**
 * Récupère tous les groupes dans lesquels un.e étudiant.e est inscrit.e.
 */
export async function getGroupsByStudentId(id) {
    try {
        const response = await fetch(`http://localhost:3000/group/by-student/${id}`, {
             method: 'GET',
             headers: getAuthHeader() // Corrigé
        });
        if (!response.ok) { // Gère les 404
            throw new Error(`Erreur ${response.status} lors de la récupération des groupes de l'étudiant`);
        }
        const data = await response.json();
        return data; // Renvoie directement les données (le .map était un bug)
    } catch (error) {
        console.error('Erreur lors du chargement des groupes de l\'étudiant : ', error);
        return []; // Renvoie un tableau vide en cas d'erreur
    }
}


/**
 * Crée un groupe lié à un nom de semestre.
 */
export async function postGroupWithSemesterName(semester, name) {
    try {
        const response = await fetch("http://localhost:3000/group/from-semester-name", {
            method: "POST",
            headers: getAuthHeader(), // Corrigé
            body: JSON.stringify({
                semester_name: semester,
                name: name
            })
        })
        if (!response.ok) {
            throw new Error("Erreur lors de l'envoi du groupe");
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de l'envoi du groupe :", error);
    }
}

/**
 * Inscrit UN étudiant dans UN groupe.
 */
export async function putStudentInGroup(studentId, groupId) {
    try {
        const response = await fetch(`http://localhost:3000/inscription/many/${groupId}`, {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify([studentId]) 
        });
        if (!response.ok) throw new Error("Erreur lors de l'inscription de l'étudiant");
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de l'inscription de l'étudiant :", error);
    }
}

/**
 * Supprime UN étudiant d'UN groupe.
 */
export async function deleteStudentFromGroup(studentId, groupId) {
    try {
        const response = await fetch(`http://localhost:3000/inscription/${studentId}/${groupId}`, {
            method: "DELETE",
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression de l'étudiant du groupe");
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la suppression de l'étudiant du groupe :", error);
    }
}

/**
 * Supprime tous les groupes.
 */
export async function deleteGroups() {
    try {
        const response = await fetch(`http://localhost:3000/group`, {
            method: "DELETE",
            headers: getAuthHeader() // Corrigé
        })
        if (!response.ok) {
            throw new Error("Erreur lors de la suppression des groupes");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression des groupes:", error);
        throw error;
    }
}

/**
 * Supprime un groupe par son ID.
 */
export async function deleteGroupById(groupId) {
    try {
        const response = await fetch(`http://localhost:3000/group/${groupId}`, {
            method: "DELETE",
            headers: getAuthHeader()
        });
        if (!response.ok) {
            throw new Error("Erreur lors de la suppression du groupe");
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la suppression du groupe:", error);
        throw error;
    }
}