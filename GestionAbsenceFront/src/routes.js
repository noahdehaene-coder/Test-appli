import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from './pages/LoginPage.vue';
import ProfessorDashboard from './pages/ProfessorDashboard.vue';
import CreateCallPage from './pages/CreateCallPage.vue';
import SelectSubjectsPage from './pages/SelectSubjectsPage.vue';
import AdminDashboard from './pages/AdminDashboard.vue';
import ManageProfessorsPage from './pages/ManageProfessorsPage.vue';

import CallPage from './pages/CallPage.vue';
import StudentsManagementPage from './pages/StudentsManagementPage.vue';
import SummaryPage from './pages/SummaryPage.vue';
import SelectStudentModification from './pages/SelectStudentModification.vue';
import SelectGroupModification from './pages/SelectGroupModification.vue';
import GroupModification from './pages/GroupModification.vue';
import StudentModification from './pages/StudentModification.vue';
import CourseSummaryPage from './pages/CourseSummaryPage.vue';
import StudentSummaryPage from './pages/StudentSummaryPage.vue';
import MyAbsencesPage from './pages/MyAbsencesPage.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/',
    name: 'ProfessorDashboard',
    component: ProfessorDashboard,
    meta: { requiresAuth: true, role: 'PROFESSEUR' },
  },
  {
    path: '/configuration/matieres',
    name: 'SelectSubjectsPage',
    component: SelectSubjectsPage,
    meta: { requiresAuth: true, role: 'PROFESSEUR' },
  },
  {
    path: '/call/new',
    name: 'CreateCallPage',
    component: CreateCallPage,
    meta: { requiresAuth: true, role: 'PROFESSEUR' },
  },
  {
    path: '/call/:courseName/:sessionTypeName/:sessionTypeGlobalId/:groupName/:groupId/:date/:startTime/:endTime',
    name: 'CallPage',
    component: CallPage,
    meta: { requiresAuth: true },
    props: true,
  },
  { 
    path: '/mes-absences',
    name: 'MyAbsencesPage', 
    component: MyAbsencesPage, 
    meta: { requiresAuth: true, role: 'ETUDIANT' } 
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'GESTIONNAIRE' },
    children: [
       { 
         path: 'manage-professors', 
         name: 'ManageProfessors',
         component: ManageProfessorsPage 
       },
       { 
         path: 'manage-students', 
         name: 'StudentsManagement',
         component: StudentsManagementPage 
       },
       {
         path: '/recapitulatifs',
         name: 'Summary',
         component: SummaryPage
       },
       {
         path: '/recapitulatifs/matiere/:name/:id',
         name: 'CourseSummary',
         component: CourseSummaryPage,
       },
       {
         path: '/recapitulatifs/etudiant/:id', 
         name: 'StudentSummary',
         component: StudentSummaryPage,
       },
       {
         path: '/selection/etudiant',
         name: 'SelectStudentModification',
         component: SelectStudentModification
       },
       {
         path: '/selection/groupe',
         name: 'SelectGroupModification',
         component: SelectGroupModification
       },
       {
         path: '/modification/groupe/:id',
         name: 'GroupModification',
         component: GroupModification
       },
       {
         path: '/modification/etudiant/:id',
         name: 'StudentModification',
         component: StudentModification
       },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' });
  } 
  else if (to.meta.role && token && user.role !== to.meta.role) {
    if (user.role === 'GESTIONNAIRE') {
      next({ name: 'AdminDashboard' });
    } else if (user.role === 'ETUDIANT') {
      next({ name: 'MyAbsencesPage' });
    } else {
      next({ name: 'ProfessorDashboard' });
    }
  } 
  else if (to.name === 'Login' && token) {
     if (user.role === 'GESTIONNAIRE') {
      next({ name: 'AdminDashboard' });
    } else if (user.role === 'ETUDIANT') {
      next({ name: 'MyAbsencesPage' });
    } else {
      next({ name: 'ProfessorDashboard' });
    }
  }
  else {
    next();
  }
});

export default router;