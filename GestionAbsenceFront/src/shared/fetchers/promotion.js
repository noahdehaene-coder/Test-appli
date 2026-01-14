// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Promeut les étudiants d'un semestre spécifique
 * @param {number} year - L'année (1, 2 ou 3)
 * @param {number} semester - Le semestre (1, 3 ou 5)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function promoteSemester(year, semester) {
  try {
    const response = await fetch(`http://localhost:3000/promotion/semester/${year}/${semester}`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la promotion du semestre');
    }
    
    return data;
  } catch (error) {
    console.error('Erreur dans promoteSemester:', error);
    throw error;
  }
}

/**
 * Promeut tous les étudiants d'une année académique
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function promoteYear() {
  try {
    const response = await fetch('http://localhost:3000/promotion/year', {
      method: 'POST',
      headers: getAuthHeader()
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la promotion de l\'année');
    }
    
    return data;
  } catch (error) {
    console.error('Erreur dans promoteYear:', error);
    throw error;
  }
}
