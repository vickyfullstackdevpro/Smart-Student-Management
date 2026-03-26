/// <reference types="vite/client" />
import { supabase } from '../supabase';
import { UserRole, Student, Faculty, Principal, GatePassRequest, PendingRequest, RequestStatus, StudentSubject, HallTicketRequest, NoDueStatus, PaperType } from '../types';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export const fetchStudents = async (): Promise<Student[]> => {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('students')
    .select('*, users(*)');
    
  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }
  
  return data.map((s: any) => ({
    ...s,
    ...s.users,
    role: UserRole.STUDENT,
    id: s.id
  })) as unknown as Student[];
};

export const fetchFaculty = async (): Promise<Faculty[]> => {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('faculty')
    .select('*, users(*)');
    
  if (error) {
    console.error("Error fetching faculty:", error);
    return [];
  }
  
  return data.map((f: any) => ({
    ...f,
    ...f.users,
    role: UserRole.FACULTY,
    id: f.id
  })) as unknown as Faculty[];
};

// --- AUTHENTICATION ---

export const loginUser = async (role: UserRole, idStr: string, passwordStr: string) => {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

  if (role === UserRole.STUDENT) {
    const { data, error } = await supabase
      .from('students')
      .select('*, users(*)')
      .eq('reg_no', idStr)
      .eq('dob', passwordStr)
      .single();
      
    if (error || !data) throw new Error("Invalid Student credentials");
    
    return {
      ...data,
      ...data.users,
      role: UserRole.STUDENT,
      id: data.id // Ensure ID is mapped correctly
    } as unknown as Student;
  } 
  else if (role === UserRole.FACULTY || role === UserRole.WARDEN) {
    const { data, error } = await supabase
      .from('faculty')
      .select('*, users(*)')
      .eq('username', idStr)
      .eq('password', passwordStr)
      .single();

    if (error || !data) throw new Error("Invalid Faculty credentials");

    return {
      ...data,
      ...data.users,
      role: UserRole.FACULTY,
      id: data.id
    } as unknown as Faculty;
  }
  else if (role === UserRole.PRINCIPAL) {
    // For Principal, we might just check a specific record or hardcode for now
    // Assuming a principal record in users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'PRINCIPAL')
      .eq('email', idStr) // Assuming email is used for principal login in DB
      .single();
      
    if (error || !data) throw new Error("Invalid Principal credentials");
    return data as unknown as Principal;
  }
  
  throw new Error("Invalid role");
};

// --- REQUESTS (GATE PASS / OUTPASS) ---

export const fetchGatePassRequests = async (): Promise<GatePassRequest[]> => {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('requests')
    .select('*, students(name, department, college_class, section)');
    
  if (error) {
    console.error("Error fetching requests:", error);
    return [];
  }
  
  return data.map((req: any) => ({
    id: req.id,
    studentId: req.student_id,
    studentName: req.students?.name || 'Unknown',
    type: req.type,
    reason: req.reason,
    date: req.date,
    status: req.status,
    hodApproval: req.hod_approval,
    wardenApproval: req.warden_approval,
    createdAt: req.created_at,
    department: req.students?.department,
    collegeClass: req.students?.college_class,
    section: req.students?.section
  }));
};

export const createGatePassRequest = async (req: GatePassRequest) => {
  if (!isSupabaseConfigured()) return req;
  
  const { data, error } = await supabase
    .from('requests')
    .insert([{
      student_id: req.studentId,
      type: req.type,
      reason: req.reason,
      date: req.date,
      status: req.status,
      hod_approval: req.hodApproval,
      warden_approval: req.wardenApproval
    }])
    .select('*, students(name, department, college_class, section)')
    .single();
    
  if (error) throw error;
  
  return {
    id: data.id,
    studentId: data.student_id,
    studentName: data.students?.name || req.studentName,
    type: data.type,
    reason: data.reason,
    date: data.date,
    status: data.status,
    hodApproval: data.hod_approval,
    wardenApproval: data.warden_approval,
    createdAt: data.created_at,
    department: data.students?.department || req.department,
    collegeClass: data.students?.college_class || req.collegeClass,
    section: data.students?.section || req.section
  } as GatePassRequest;
};

export const updateRequestStatus = async (requestId: string, updates: any) => {
  if (!isSupabaseConfigured()) return;
  
  const { error } = await supabase
    .from('requests')
    .update(updates)
    .eq('id', requestId);
    
  if (error) throw error;
};

// --- NO DUES CLEARANCE ---

export const fetchStudentSubjects = async (): Promise<StudentSubject[]> => {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('student_subjects')
    .select('*');
    
  if (error) {
    console.error("Error fetching student subjects:", error);
    return [];
  }
  
  return data.map((ss: any) => ({
    id: ss.id,
    studentId: ss.student_id,
    subjectId: ss.subject_id,
    subjectName: ss.subject_name,
    isArrear: ss.is_arrear,
    type: ss.is_arrear ? PaperType.ARREAR : PaperType.CURRENT,
    noDueStatus: ss.no_due_status
  }));
};

export const upsertStudentSubjectNoDue = async (
  studentId: string, 
  subjectId: string, 
  subjectName: string, 
  status: NoDueStatus,
  isArrear: boolean = false
) => {
  if (!isSupabaseConfigured()) return;
  
  // First check if it exists
  const { data: existing } = await supabase
    .from('student_subjects')
    .select('id')
    .eq('student_id', studentId)
    .eq('subject_id', subjectId)
    .single();
    
  if (existing) {
    const { error } = await supabase
      .from('student_subjects')
      .update({ no_due_status: status })
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  } else {
    const { data, error } = await supabase
      .from('student_subjects')
      .insert([{
        student_id: studentId,
        subject_id: subjectId,
        subject_name: subjectName,
        no_due_status: status,
        is_arrear: isArrear
      }])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }
};

// --- PENDING SIGNUP REQUESTS ---

export const fetchPendingRequests = async (): Promise<PendingRequest[]> => {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('pending_requests')
    .select('*');
    
  if (error) {
    console.error("Error fetching pending requests:", error);
    return [];
  }
  
  return data.map((req: any) => ({
    id: req.id,
    name: req.name,
    role: req.role,
    username: req.username,
    regNo: req.reg_no,
    password: req.password,
    department: req.department,
    section: req.section,
    collegeClass: req.college_class,
    dob: req.dob,
    email: req.email,
    phone: req.phone,
    gender: req.gender,
    residentialStatus: req.residential_status,
    facultyRole: req.faculty_role
  }));
};

export const createPendingRequest = async (req: PendingRequest) => {
  if (!isSupabaseConfigured()) return req;
  
  const { data, error } = await supabase
    .from('pending_requests')
    .insert([{
      name: req.name,
      role: req.role,
      username: req.username,
      reg_no: req.regNo,
      password: req.password,
      department: req.department,
      section: req.section,
      college_class: req.collegeClass,
      dob: req.dob,
      email: req.email,
      phone: req.phone,
      gender: req.gender,
      residential_status: req.residentialStatus,
      faculty_role: req.facultyRole
    }])
    .select()
    .single();
    
  if (error) throw error;
  return {
    ...req,
    id: data.id
  };
};

export const approvePendingRequest = async (req: PendingRequest) => {
  if (!isSupabaseConfigured()) return;

  // 1. Create User record
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([{
      name: req.name,
      role: req.role,
      email: req.email,
      phone: req.phone
    }])
    .select()
    .single();

  if (userError) throw userError;

  // 2. Create Student or Faculty record
  if (req.role === UserRole.STUDENT) {
    const { error: studentError } = await supabase
      .from('students')
      .insert([{
        id: userData.id,
        reg_no: req.regNo,
        dob: req.dob,
        department: req.department,
        section: req.section,
        college_class: req.collegeClass,
        roll_no: `ROLL${Date.now().toString().slice(-4)}`,
        college: 'Mahendra Engineering College',
        gender: req.gender,
        residential_status: req.residentialStatus,
        performance_score: 70,
        attendance: 100
      }]);
    if (studentError) throw studentError;
  } else {
    const { error: facultyError } = await supabase
      .from('faculty')
      .insert([{
        id: userData.id,
        username: req.username,
        password: req.password,
        faculty_role: req.facultyRole,
        department: req.department
      }]);
    if (facultyError) throw facultyError;
  }

  // 3. Delete from pending_requests
  const { error: deleteError } = await supabase
    .from('pending_requests')
    .delete()
    .eq('id', req.id);

  if (deleteError) throw deleteError;
};

export const rejectPendingRequest = async (id: string) => {
  if (!isSupabaseConfigured()) return;
  
  const { error } = await supabase
    .from('pending_requests')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};

export const fetchHallTicketRequests = async (): Promise<HallTicketRequest[]> => {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('hall_ticket_requests')
    .select('*');
    
  if (error) {
    console.error("Error fetching hall ticket requests:", error);
    return [];
  }
  
  return data.map((req: any) => ({
    id: req.id,
    studentId: req.student_id,
    studentName: req.student_name,
    department: req.department,
    collegeClass: req.college_class,
    section: req.section,
    status: req.status,
    createdAt: req.created_at
  }));
};

export const createHallTicketRequest = async (req: HallTicketRequest) => {
  if (!isSupabaseConfigured()) return req;
  
  const { data, error } = await supabase
    .from('hall_ticket_requests')
    .insert([{
      student_id: req.studentId,
      student_name: req.studentName,
      department: req.department,
      college_class: req.collegeClass,
      section: req.section,
      status: req.status
    }])
    .select()
    .single();
    
  if (error) throw error;
  return {
    id: data.id,
    studentId: data.student_id,
    studentName: data.student_name,
    department: data.department,
    collegeClass: data.college_class,
    section: data.section,
    status: data.status,
    createdAt: data.created_at
  };
};

export const updateHallTicketRequestStatus = async (id: string, status: RequestStatus) => {
  if (!isSupabaseConfigured()) return;
  
  const { error } = await supabase
    .from('hall_ticket_requests')
    .update({ status })
    .eq('id', id);
    
  if (error) throw error;
};
