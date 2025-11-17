// store/auth.js
import { ref, computed } from 'vue';

// État global
const user = ref(JSON.parse(localStorage.getItem('user')));
const token = ref(localStorage.getItem('token'));

// Actions
export function useAuth() {
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Échec de la connexion');
      
      const data = await response.json();
      
      token.value = data.access_token;
      user.value = data.user; // { id, email, role }
      
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);

  return { login, logout, isAuthenticated, userRole, token };
}