<template>
  <nav class="navigation-bar">
    
    <a @click="handleTitleClick" class="title-navigation-bar" style="cursor: pointer;">
      Gestion des Absences MIASHS
    </a>
    
    <div class="navigation-router-link" v-if="isAuthenticated && userRole === 'GESTIONNAIRE'">
      <RouterLink to="/recapitulatifs" class="summary-navigation">Voir le récapitulatif des absences</RouterLink>
      <RouterLink to="/selection/etudiant" class="modification-navigation">Modifier étudiant.e</RouterLink>
      <RouterLink to="/selection/groupe" class="modification-navigation">Modifier groupe</RouterLink>
      <RouterLink :to="{ name: 'StudentsManagement' }" class="students-management">Gestion des étudiant.e.s</RouterLink>
    </div>

    <div class="navigation-router-link" v-else-if="isAuthenticated">
       <button @click="handleTitleClick" class="button logout-button">Déconnexion</button>
    </div>

    </nav>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router';


import { computed } from 'vue';
import { useAuth } from '../../store/auth'; 
const router = useRouter();
const auth = useAuth();

const isAuthenticated = computed(() => auth.isAuthenticated.value);
const userRole = computed(() => auth.userRole.value);


/**
 * Déconnecte l'utilisateur (s'il est connecté)
 * et le redirige vers la page de connexion.
 */
function handleTitleClick() {
  if (isAuthenticated.value) { 
    auth.logout();
  }
  // Dans tous les cas, redirige vers la page de connexion
  router.push({ name: 'Login' });
}
</script>


<style>

@import url("../shared.css");

/* Style pour la barre de navigation */
.navigation-bar {
  background-color: var(--color-2);
  padding: 10rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 1rem;
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
}

/*Style pour le titre de la barre de navigation */
.title-navigation-bar {
  text-decoration: none;
  font-size: 1.6rem;
  margin: 0;
  color: white;
}

/* Conteneur pour les RouterLink pour les mettre à droite */
.navigation-router-link {
  display: flex;
  gap: 0.7rem;
}

/* Style pour les RouterLink */

/* Style pour le RouterLink Recap et Modif*/
.summary-navigation,
.modification-navigation,
.students-management,
.drop-down-btn,
.logout-button { /* Ajout du style pour le nouveau bouton */
  text-decoration: none;
  color: black;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-family: inherit; /* S'assure que le bouton utilise la même police */
}

.summary-navigation,
.drop-down-btn {
  background-color: var(--color-1);
}

.modification-navigation,
.students-management,
.logout-button { /* Ajout du style pour le nouveau bouton */
  background-color: var(--color-4);
}

/* Effet au survol des RouterLink */

.title-navigation-bar:hover {
  color: var(--color-4);
}

.summary-navigation:hover,
.modification-navigation:hover,
.students-management:hover,
.drop-down-btn:hover,
.logout-button:hover { /* Ajout du style pour le nouveau bouton */
  background-color: var(--color-5);
}
</style>