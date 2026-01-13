erDiagram
    User ||--o| Student : "possède un profil"
    User ||--o{ ProfessorPreference : "définit"
    
    Semester ||--o{ Group : "contient"
    Semester ||--o{ ProfessorPreference : "est lié à"

    Group ||--o{ Inscription : "a des inscrits"
    Student ||--o{ Inscription : "est inscrit dans"

    Group ||--o{ Slot : "a des créneaux"
    SessionType ||--o{ Slot : "définit le type de"

    Slot ||--o{ Presence : "enregistre"
    Student ||--o{ Presence : "a une présence/absence"
    
    Slot ||--o{ CourseMaterial : "possède"

    User {
        String id PK
        String email
        String password
        String first_name
        String last_name
        Enum role "ADMIN, MANAGER, PROFESSOR, STUDENT"
    }

    Student {
        String id PK
        String student_number "Unique"
        String user_id FK "Optionnel (Link vers User)"
    }

    Group {
        String id PK
        String name
        String semester_id FK
    }

    Semester {
        String id PK
        String name
        DateTime start_date
        DateTime end_date
    }

    Inscription {
        String student_id FK
        String group_id FK
        Composite PK "(student_id, group_id)"
    }

    Slot {
        String id PK
        DateTime start_time
        DateTime end_time
        String subject_name
        String group_id FK
        String session_type_id FK
    }

    SessionType {
        String id PK
        String name "Ex: CM, TD, TP"
    }

    Presence {
        String id PK
        Boolean is_present
        Boolean is_justified
        String justification_path "Chemin du fichier PDF"
        String student_id FK
        String slot_id FK
    }

    CourseMaterial {
        String id PK
        String file_path
        String slot_id FK
    }

    ProfessorPreference {
        String id PK
        String subject_code
        String user_id FK
        String semester_id FK
    }
