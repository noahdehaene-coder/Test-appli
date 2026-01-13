# Smart Absence Filtering Implementation

## Problem Statement
When multiple groups of the same course meet at different times on the same day (e.g., TD1 8-9:30am, TD2 10-11:30am), if a student from TD2 joins TD1 exceptionally:
- They should NOT be marked absent from TD2 if they attended TD1
- Previously: Absence would still show in TD2 even though student attended another session of the same course

## Solution
Implemented intelligent absence filtering logic that:
1. For each absence record, checks if the student attended ANY other session of the same course on the same day
2. If yes, excludes the absence from results (filters it out)
3. If no, includes the absence in results

## Implementation Details

### Files Modified

#### 1. `src/course_material/course_material.service.ts` - `getAbsencesByStudent()`
**Purpose**: Get all absences for a specific student  
**Changes**:
- Fetches all slots in database to determine attendance (student attended if NOT marked absent)
- Builds a set of "date|courseId" pairs where student attended at least one session
- Filters absences: excludes any absence where student attended same course same day

**Logic Flow**:
```
1. Get all absence records for student
2. Get all slots + all presences (absences) for this student
3. Identify "attended slots" = slots where student is NOT marked absent
4. Build set: {date|courseId} for each attended slot
5. Filter absences: keep only if {date|courseId} NOT in set
```

#### 2. `src/presence/presence.service.ts` - `getAbsencesByCourse()`
**Purpose**: Get all absences for a specific course  
**Changes**:
- For each student with absences, determines if they attended ANY session of that course on that day
- Filters out absences where attendance occurred
- Optimized: builds attendance maps once per student instead of per absence

**Logic Flow**:
```
1. Get all absences for course
2. Get all slots for course
3. For each student with absences:
   - Find slots where student did NOT have absence
   - Mark those dates as "attended"
4. Filter absences: exclude if student attended on that date
```

#### 3. `src/presence/presence.service.ts` - `getByYear()`
**Purpose**: Get all absences for students in a specific year (semesters)  
**Changes**:
- Applied same filtering logic across entire year
- Queries slots from both semesters in the year
- Filters same-day course attendance across all courses in the year

**Logic Flow**: Same as above but:
- Operates on two semesters at once
- Checks attendance across ALL courses in those semesters
- More complex query with semester-level filtering

## Data Model Context

### Attendance Tracking
- **No explicit attendance table**: System tracks attendance implicitly
- **Absence = presence record**: `presence` model stores ABSENCES only
- **Attendance = no presence record**: If student has no `presence` record for a slot, they attended

### Key Relationships
```
student --[many]-- presence --[many]-- slot
              |                           |
              └--[belongs to slot]-- slot_session_type --[belongs to]-- course_material
```

## Edge Cases Handled

1. **Student in only one group**: Works normally - absence shows if not attending
2. **Student in multiple groups, attended one**: Absence filtered out for others
3. **Student absent from all groups same day**: Absence still shows (correct behavior)
4. **Different time slots same course same day**: Attendance in any slot cancels absence in all slots
5. **NULL attendance data**: Set operations handle gracefully with optional chaining

## Performance Notes

- **getAbsencesByStudent**: Fetches all slots once (∼O(n) where n = total slots)
- **getAbsencesByCourse**: Builds attendance map per student (∼O(m·n) where m = students, n = slots for course)
- **getByYear**: More complex but still reasonable for typical dataset sizes

For large datasets (>10k slots), consider optimizing with database-level aggregations.

## Testing Recommendations

1. **Scenario 1**: Student attends TD1 (8am), marked absent from TD2 (10am) same day
   - Expected: Absence filtered out ✓

2. **Scenario 2**: Student absent from both TD1 and TD2 same day
   - Expected: Both absences show ✓

3. **Scenario 3**: Student attends one group session, no absence in another
   - Expected: No absence records (baseline) ✓

4. **Scenario 4**: Different courses same time - attendance doesn't affect other course absences
   - Expected: Both absence records show (not same course) ✓

## Future Enhancements

- Add database-level filtering to improve performance
- Create explicit attendance records for better auditability
- Add time-range checks (only count attendance within reasonable time window)
- Create admin dashboard showing filtered vs unfiltered absence counts
