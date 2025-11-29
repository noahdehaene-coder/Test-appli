<template>
  <main class="left admin-container">
    <h1>Panneau d'Administration</h1>
    <p>Bienvenue, Gestionnaire. Sélectionnez une section à gérer.</p>
    
    <nav class="admin-nav">
      <router-link :to="{ name: 'ManageProfessors' }">
        Gérer les Professeurs
      </router-link>
      <router-link :to="{ name: 'StudentsManagement' }">
        Gérer les Étudiants
      </router-link>
      </nav>
    
    <div class="admin-content">
      <router-view></router-view>
    </div>
  </main>
</template>

<script setup>
</script>

<style scoped>
@import url('../shared/shared.css');

.admin-container {
  width: 100%;
  margin: 2rem 0;
  padding: 0 2rem;          
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.admin-nav {
  display: flex;
  flex-wrap: wrap; /* Gère le passage à la ligne sur mobile */
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-3, #eee);
  padding-bottom: 1rem;
}

.admin-nav a {
  text-decoration: none;
  color: var(--color-1, #005a8f);
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: background-color 0.2s, color 0.2s;
}

.admin-nav a:hover {
  background-color: var(--color-5, #f0f0f0);
}

/* Style pour le lien de la page active */
.admin-nav a.router-link-active {
  background-color: var(--color-1, #005a8f);
  color: white;
}
</style>