// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Récupère la liste de tous les professeurs.
 */
export async function fetchProfessors() {
  try {
    const response = await fetch('http://localhost:3000/users/professors', {
      method: 'GET',
      headers: getAuthHeader() // Sécurisation
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des professeurs');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Crée un nouveau professeur.
 */
export async function createProfessor(data) { // data = { name, email, password }
  try {
    const response = await fetch('http://localhost:3000/users/professor', {
      method: 'POST',
      headers: getAuthHeader(), // Sécurisation
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur lors de la création du professeur');
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Supprime un professeur par son ID.
 */
export async function deleteProfessor(id) {
  try {
    const response = await fetch(`http://localhost:3000/users/professor/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader() // Sécurisation
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression du professeur');
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}