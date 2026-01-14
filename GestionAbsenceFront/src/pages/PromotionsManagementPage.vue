<template>
  <div class="promotions-container">
    <h2>Gérer les Promotions</h2>
    <p class="description">
      Effectuez les promotions des étudiants à la fin de chaque semestre ou année.
    </p>

    <!-- Section Promotions par Semestre -->
    <section class="section">
      <h3>Promotions par Semestre</h3>
      <p class="section-description">
        Effectuez la promotion des étudiants d'un semestre impair au semestre suivant.
        Cela supprime tous les groupes du semestre actuel et assigne les étudiants au groupe classe du semestre suivant.
      </p>

      <div class="promotion-grid">
        <!-- Promotion L1S1 -> L1S2 -->
        <div class="promotion-card">
          <h4>Licence 1, Semestre 1</h4>
          <p>Promeut les étudiants de <strong>L1S1 vers L1S2</strong></p>
          <button 
            @click="confirmPromotion('semester', 1, 1)"
            :disabled="isLoading"
            class="btn btn-primary"
          >
            {{ isLoading && activePromotion === 'semester-1-1' ? 'En cours...' : 'Promouvoir L1S1' }}
          </button>
        </div>

        <!-- Promotion L2S3 -> L2S4 -->
        <div class="promotion-card">
          <h4>Licence 2, Semestre 3</h4>
          <p>Promeut les étudiants de <strong>L2S3 vers L2S4</strong></p>
          <button 
            @click="confirmPromotion('semester', 2, 3)"
            :disabled="isLoading"
            class="btn btn-primary"
          >
            {{ isLoading && activePromotion === 'semester-2-3' ? 'En cours...' : 'Promouvoir L2S3' }}
          </button>
        </div>

        <!-- Promotion L3S5 -> L3S6 -->
        <div class="promotion-card">
          <h4>Licence 3, Semestre 5</h4>
          <p>Promeut les étudiants de <strong>L3S5 vers L3S6</strong></p>
          <button 
            @click="confirmPromotion('semester', 3, 5)"
            :disabled="isLoading"
            class="btn btn-primary"
          >
            {{ isLoading && activePromotion === 'semester-3-5' ? 'En cours...' : 'Promouvoir L3S5' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Section Promotion d'Année -->
    <section class="section">
      <h3>Promotion d'Année Complète</h3>
      <p class="section-description">
        Effectuez la promotion de tous les étudiants à la fin de l'année académique.
        <br>
        <strong>Attention :</strong> Les étudiants de L3S6 seront supprimés (fin de licence).
        <br>
        Les L1S2 deviennent L2S3 et les L2S4 deviennent L3S5.
      </p>

      <div class="promotion-card full-width danger">
        <h4>Nouvelle Année Académique</h4>
        <p class="warning-text">
          ⚠️ Cette action supprimera les étudiants en fin de licence (L3S6) et promouvra tous les autres.
          <br>
          Tous les groupes actuels seront supprimés et recréés.
        </p>
        <button 
          @click="confirmPromotion('year')"
          :disabled="isLoading"
          class="btn btn-danger"
        >
          {{ isLoading && activePromotion === 'year' ? 'En cours...' : 'Promouvoir Nouvelle Année' }}
        </button>
      </div>
    </section>

    <!-- Messages de feedback -->
    <div v-if="successMessage" class="alert alert-success">
      ✓ {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="alert alert-error">
      ✗ {{ errorMessage }}
    </div>

    <!-- Modal de confirmation -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>Confirmer la promotion</h3>
        <p>{{ confirmMessage }}</p>
        <div class="modal-actions">
          <button @click="closeModal" class="btn btn-secondary">Annuler</button>
          <button @click="executePromotion" class="btn btn-danger">Confirmer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { promoteSemester, promoteYear } from '../shared/fetchers/promotion';

const isLoading = ref(false);
const activePromotion = ref(null);
const successMessage = ref('');
const errorMessage = ref('');
const showConfirmModal = ref(false);
const confirmMessage = ref('');
let pendingPromotion = null;

const confirmPromotion = (type, year = null, semester = null) => {
  pendingPromotion = { type, year, semester };

  if (type === 'semester') {
    confirmMessage.value = `Êtes-vous sûr de vouloir promouvoir les étudiants de L${year}S${semester} vers L${year}S${semester + 1} ? \n\nCette action va :\n- Supprimer tous les groupes du semestre S${semester}\n- Passer les étudiants au groupe classe L${year}S${semester + 1}\n\nCette action est irréversible.`;
    } else if (type === 'year') {
      confirmMessage.value = `Êtes-vous sûr de vouloir effectuer la promotion de nouvelle année ? \n\nCette action va :\n- Supprimer les étudiants de L3S6 (fin de licence)\n- Passer L1S2 -> L2S3\n- Passer L2S4 -> L3S5\n- Supprimer tous les groupes actuels et les recréer\n\nCette action est irréversible.`;
    }

  showConfirmModal.value = true;
};

const closeModal = () => {
  showConfirmModal.value = false;
  pendingPromotion = null;
};

const executePromotion = async () => {
  if (!pendingPromotion) return;

  isLoading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  
  if (pendingPromotion.type === 'semester') {
    activePromotion.value = `semester-${pendingPromotion.year}-${pendingPromotion.semester}`;
  } else {
    activePromotion.value = 'year';
  }

  try {
    let data;
    if (pendingPromotion.type === 'semester') {
      data = await promoteSemester(pendingPromotion.year, pendingPromotion.semester);
    } else {
      data = await promoteYear();
    }

    successMessage.value = data.message;
    alert('✓ ' + data.message);
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
  } catch (error) {
    errorMessage.value = error.message || 'Erreur de connexion avec le serveur';
    setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  } finally {
    isLoading.value = false;
    activePromotion.value = null;
    closeModal();
  }
};
</script>

<style scoped>
@import url('../shared/shared.css');

.promotions-container {
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

h2 {
  color: black;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.description {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  border-left: 4px solid var(--color-1, #005a8f);
}

.section h3 {
  color: black;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
}

.section-description {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.promotion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.promotion-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.promotion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.promotion-card h4 {
  color: black;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.promotion-card p {
  color: #666;
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  flex-grow: 1;
}

.promotion-card.full-width {
  grid-column: 1 / -1;
}

.promotion-card.danger {
  background-color: #fff5f5;
  border-left: 4px solid #d32f2f;
}

.warning-text {
  color: #d32f2f;
  font-weight: 500;
  margin-bottom: 1rem;
}

.btn {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background-color: var(--color-1, #005a8f);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #003f5c;
}

.btn-danger {
  background-color: #d32f2f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #b71c1c;
}

.btn-secondary {
  background-color: #999;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #777;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1.5rem;
  font-weight: 500;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  color: var(--color-1, #005a8f);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.modal-content p {
  color: #666;
  margin-bottom: 1.5rem;
  white-space: pre-wrap;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-actions .btn {
  flex: 1;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .promotions-container {
    padding: 1rem;
  }

  .promotion-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-width: 90%;
  }
}
</style>
