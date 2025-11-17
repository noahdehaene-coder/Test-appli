// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}


/**
 * Récupère la liste des types de session globaux (CM, TD, TP...).
 *
 * @async
 * @function
 * @returns {Promise<Object[]>} Une promesse contenant la liste { id, name }.
 */
export async function getGlobalSessionTypes() {
    try {
        const response = await fetch("http://localhost:3000/session_type/global-types", {
            method: 'GET',
            headers: getAuthHeader() // Sécurisation
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des types de sessions globaux : ", error);
    }
}


// ... (le reste de vos fonctions, getSessionTypes, refreshDataADE, etc.)

/**
 * Récupère tous les types de sessions (CM, TD, TP, ...).
 * C'EST CETTE FONCTION QUI CORRIGE L'ERREUR.
 * @async
 * @function
 * @returns {Promise<Object[]>} Une promesse contenant la liste des types de sessions.
 */
export async function getSessionTypes() {
    try {
        const response = await fetch("http://localhost:3000/session_type", {
            method: 'GET',
            headers: getAuthHeader() // Sécurisation
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des types de sessions : ", error);
    }
}

/**
 * Met à jour les données issues d'ADE (semestres, matières et types de séance).
 *
 * @async
 * @function
 * @returns {Promise<Object>} Une promesse contenant un objet avec les statistiques de mise à jour (nombre d’éléments ajoutés).
 */
export async function refreshDataADE() {
    try {
        const response = await fetch("http://localhost:3000/ade/refresh", {
            method: "POST",
            headers: getAuthHeader() // Sécurisation
        })
        if (!response.ok) {
            throw new Error("Erreur lors de la mise à jour des données issues d'ADE");
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la mise à jour des données issues d'ADE")
    }
}

/**
 * Supprime tous les types de session présents dans la table session_type.
 * * @async
 * @function
 * @returns {Promise<Object>} Une promesse contenant le nombre de lignes supprimées.
 */
export async function deleteSessionType() {
    try {
        const response = await fetch("http://localhost:3000/session_type/all", {
            method: "DELETE",
            headers: getAuthHeader() // Sécurisation
        })
        if (!response.ok) {
            throw new Error("Erreur lors de la suppression des types de sessions");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression des types de sessions:", error);
    }
}