export enum UserRole {
  PRINCIPAL = 'PRINCIPAL',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
  WARDEN = 'WARDEN'
}

export enum FacultyRole {
  HOD = 'HOD',
  PROFESSOR = 'Professor',
  ASSOCIATE_PROFESSOR = 'Associate Professor',
  ASSISTANT_PROFESSOR = 'Assistant Professor',
  WARDEN = 'Warden',
  OFFICE = 'Office'
}

export enum Department {
  CSE = 'CSE',
  AIML = 'AI & ML',
  IT = 'Information Technology',
  ECE = 'Electronics & Comm',
  EEE = 'Electrical & Electronics',
  MECH = 'Mechanical',
  CIVIL = 'Civil'
}

export enum Section {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHERS = 'Others'
}

export enum ResidentialStatus {
  DAY_SCHOLAR = 'Day Scholar',
  HOSTELER = 'Hosteler'
}

export enum RequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum RequestType {
  GATE_PASS = 'Gate Pass',
  OUTPASS = 'Outpass'
}

export enum NoDueStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  DECLINED = 'Declined'
}

export enum PaperType {
  CURRENT = 'Current',
  ARREAR = 'Arrear'
}

export interface StudentSubject {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  isArrear: boolean;
  type: PaperType;
  noDueStatus: NoDueStatus;
  subject?: Subject;
}

export interface HallTicketRequest {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  collegeClass: string;
  section: string;
  status: RequestStatus;
  createdAt: string;
  student?: Student;
}

export interface GatePassRequest {
  id: string;
  studentId: string;
  studentName: string;
  type: RequestType;
  reason: string;
  date: string;
  status: RequestStatus;
  hodApproval: RequestStatus;
  wardenApproval?: RequestStatus; // Only for Outpass
  createdAt: string;
  department: Department;
  collegeClass: string;
  section: Section;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  aiScore?: number;
}

export interface Principal extends User {
  role: UserRole.PRINCIPAL;
  username: string;
  password?: string;
  bio?: string;
}

export interface Faculty extends User {
  role: UserRole.FACULTY;
  username: string; // Used for login
  facultyRole: FacultyRole;
  department: Department;
  bio?: string;
  academicDetails?: string;
  email?: string;
  phone?: string;
}

export interface FeeDetail {
  id: string;
  description: string;
  amount: number;
  status: 'Paid' | 'Pending';
  date?: string;
}

export interface DocumentCopy {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface ResultCopy {
  id: string;
  semester: string;
  gpa: number;
  subjects: { name: string; grade: string; marks: number }[];
}

export interface InternalMark {
  subject: string;
  marks: number;
  total: number;
}

export interface AttendanceRecord {
  date: string;
  status: 'Present' | 'Absent';
  period?: string;
}

export interface ClassAdvisorMapping {
  department: Department;
  collegeClass: string;
  section: Section;
  facultyId: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: Department;
  semester: string;
}

export interface FacultyClassMapping {
  id: string;
  facultyId: string;
  subjectId: string;
  department: Department;
  collegeClass: string;
  section: Section;
}

export interface Student extends User {
  role: UserRole.STUDENT;
  department: Department;
  section: Section; 
  collegeClass: string; // e.g. "IV Year"
  regNo: string; // Login ID
  dob: string; // Password (DDMMYYYY)
  rollNo: string;
  college: string;
  email: string;
  phone: string;
  gender: Gender;
  residentialStatus: ResidentialStatus;
  performanceScore: number; // Mock score 0-100
  attendance: number; // Mock %
  bio?: string;
  fees?: FeeDetail[];
  documents?: DocumentCopy[];
  results?: ResultCopy[];
  internalMarks?: InternalMark[];
  attendanceHistory?: AttendanceRecord[];
}

export interface Alumni extends Student {
  graduationYear: string;
  archivedAt: string;
}

export interface PendingRequest {
  id: string;
  name: string;
  role: UserRole;
  // Common fields
  username?: string; // For faculty
  regNo?: string;    // For student
  password?: string; // Stored temporarily until approval
  // Student specific
  department?: Department;
  section?: Section;
  collegeClass?: string;
  dob?: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  residentialStatus?: ResidentialStatus;
  // Faculty specific
  facultyRole?: FacultyRole;
}

export interface Submission {
  id: string;
  studentId: string;
  title: string;
  type: 'Assignment' | 'Project' | 'Certificate' | 'Link';
  date: string;
  fileName?: string;
  link?: string;
  description?: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  timestamp: string;
  senderName: string;
}

export interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedPath: string;
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  amount: number;
  description: string;
  date: string;
  type: 'Credit' | 'Debit';
}

// Gemini Types
export interface LiveConfig {
  voiceName?: string;
}