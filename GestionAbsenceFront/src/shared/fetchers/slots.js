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
            headers: getAuthHeader()
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
export async function postSlot(slotData) {
    try {
        const response = await fetch(`http://localhost:3000/slot/by-session`, {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify({ 
                groupId: slotData.group_id,
                courseName: slotData.courseName || slotData.course_material_id, // Gère les deux cas
                sessionTypeGlobalId: slotData.session_type_id, 
                date: slotData.date,
                start_time: slotData.start_time,
                end_time: slotData.end_time
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
        throw error;
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
      headers: getAuthHeader(),
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

export async function fetchSlotsByDate(dateIsoString) {
    try {
        const response = await fetch(`http://localhost:3000/slot/my-slots/${dateIsoString}`, {
            method: 'GET',
            headers: getAuthHeader()
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Erreur fetch slots date", error);
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
            headers: getAuthHeader()
        })
        if (!response.ok) {
            throw new Error("Erreur lors de la suppression des créneaux");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression des créneaux:", error);
    }
}

export async function searchSlot(groupId, courseName, sessionTypeGlobalId, date) {
    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const response = await fetch(`${API_URL}/slot/search`, {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify({ 
                groupId, courseName, sessionTypeGlobalId, date 
            })
        });
        
        if (response.ok) {
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        }
        return null;
    } catch (error) {
        console.error("Erreur recherche slot :", error);
        return null;
    }
}