// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Récupère tous les créneaux (slots) pour une date donnée.
 */
export async function getSlots(date) {
    try {
        const response = await fetch(`http://localhost:3000/slot/by-date/${date}`, {
            method: 'GET',
            headers: getAuthHeader() // Sécurisé
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des créneaux : ", error);
    }
}

/**
 * Crée un créneau (slot) via les noms de session.
 */
export async function postSlot(groupId, courseName, sessionTypeGlobalId, date) {
    try {
        const response = await fetch(`http://localhost:3000/slot/by-session`, {
            method: "POST",
            headers: getAuthHeader(), // Sécurisé
            body: JSON.stringify({ 
                groupId: groupId,
                courseName: courseName,
                sessionTypeGlobalId: sessionTypeGlobalId, 
                date: date
            })
        })
        
        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error(`Erreur du serveur (400) : ${errorData.message || 'Bad Request'}`);
        }
        
        const text = await response.text();
        return text ? JSON.parse(text) : null;

    } catch (error) {
        console.error("Erreur lors de la création du créneau :", error);
    }
}

/**
 * Récupère les modèles d'appels récents pour le professeur connecté.
 */
export async function fetchRecentCalls() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("fetchRecentCalls : Utilisateur non connecté. Appel annulé.");
      return []; 
    }

    const response = await fetch(`http://localhost:3000/slot/recent-calls`, {
      method: 'GET',
      headers: getAuthHeader(), // Sécurisé
    });
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des appels récents");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Supprime tous les créneaux de la table slot.
 */
export async function deleteSlots() {
    try {
        const response = await fetch(`http://localhost:3000/slot`, {
            method: "DELETE",
            headers: getAuthHeader() // <-- CORRECTION : Ajout de l'authentification
        })
        if (!response.ok) {
            throw new Error("Erreur lors de la suppression des créneaux");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression des créneaux:", error);
    }
}