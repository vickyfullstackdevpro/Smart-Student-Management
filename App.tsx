import React, { useState, useEffect } from 'react';
import { User, Faculty, Student, Principal, UserRole, FacultyRole, Department, Section, Submission, Message, PendingRequest, ClassAdvisorMapping, Subject, FacultyClassMapping, NoDueStatus, PaperType, StudentSubject, HallTicketRequest } from './types';
import { LogIn, UserPlus, Users, FileText, Activity, Upload, LogOut, CheckCircle, AlertCircle, Plus, MessageSquare, Trash2, Phone, Mail, ArrowLeft, X, Check, XCircle, Folder, Link as LinkIcon, Edit3, User as UserIcon, Settings, BookOpen, MapPin, Eye, EyeOff, Bot, Send, UserCheck, ShieldCheck, FileCheck, Ticket, ChevronLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import { queryDatabase, analyzeStudentData } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Gender, ResidentialStatus, RequestStatus, RequestType, GatePassRequest, Transaction } from './types';

// --- MOCK DATA ---
const MOCK_PRINCIPAL: Principal & { password?: string } = {
  id: 'p1', name: 'Dr. Principal', role: UserRole.PRINCIPAL, username: 'principal', password: 'password@mit'
};

const generateDemoStudents = (): Student[] => {
  const students: Student[] = [];
  const departments = Object.values(Department);
  const years = ['I Year', 'II Year', 'III Year', 'IV Year'];
  const sections = Object.values(Section);

  let idCounter = 1;
  departments.forEach(dept => {
    years.forEach(year => {
      sections.forEach(section => {
        for (let i = 1; i <= 2; i++) {
          const id = `s${idCounter++}`;
          students.push({
            id,
            name: `Student ${idCounter} (${dept})`,
            role: UserRole.STUDENT,
            department: dept,
            section: section,
            collegeClass: year,
            regNo: `REG${1000 + idCounter}`,
            dob: '01012000',
            rollNo: `${dept.substring(0, 2)}${idCounter}`,
            college: 'Mahendra Engineering College',
            email: `student${idCounter}@example.com`,
            phone: `98765432${idCounter.toString().padStart(2, '0')}`,
            gender: idCounter % 2 === 0 ? Gender.MALE : Gender.FEMALE,
            residentialStatus: idCounter % 3 === 0 ? ResidentialStatus.HOSTELER : ResidentialStatus.DAY_SCHOLAR,
            performanceScore: Math.floor(Math.random() * 40) + 60,
            attendance: Math.floor(Math.random() * 20) + 80,
            bio: 'I am a dedicated student pursuing my degree with passion.',
            fees: [
              { id: 'f1', description: 'Tuition Fee', amount: 55000, status: 'Paid', date: '2023-08-15' },
              { id: 'f2', description: 'Hostel Fee', amount: 45000, status: 'Pending' },
              { id: 'f3', description: 'Bus Fee', amount: 15000, status: 'Paid', date: '2023-09-01' },
              { id: 'f4', description: 'Training Fee', amount: 5000, status: 'Pending' },
              { id: 'f5', description: 'Breakage Fee', amount: 500, status: 'Pending' },
              { id: 'f6', description: 'Fine', amount: 200, status: 'Pending' }
            ],
            documents: [
              { id: 'd1', name: '10th Marksheet', type: 'PDF', url: '#' },
              { id: 'd2', name: '12th Marksheet', type: 'PDF', url: '#' },
              { id: 'd3', name: 'Transfer Certificate', type: 'PDF', url: '#' }
            ],
            results: [
              { id: 'r1', semester: 'Semester 1', gpa: 8.5, subjects: [{ name: 'Maths', grade: 'A', marks: 85 }, { name: 'Physics', grade: 'A+', marks: 92 }] },
              { id: 'r2', semester: 'Semester 2', gpa: 8.2, subjects: [{ name: 'Programming', grade: 'A', marks: 88 }, { name: 'Chemistry', grade: 'B+', marks: 78 }] }
            ],
            internalMarks: [
              { subject: 'Data Structures', marks: 45, total: 50 },
              { subject: 'Operating Systems', marks: 38, total: 50 }
            ],
            attendanceHistory: [
              { date: '2023-10-01', status: 'Present' },
              { date: '2023-10-02', status: 'Absent' }
            ]
          });
        }
      });
    });
  });
  return students;
};

const MOCK_STUDENTS: Student[] = generateDemoStudents();

const MOCK_FACULTY: (Faculty & { password?: string, email?: string, phone?: string, gender?: Gender })[] = [
  { id: 'f1', name: 'Dr. A. Sharma', role: UserRole.FACULTY, username: 'admin', password: 'admin', facultyRole: FacultyRole.HOD, department: Department.CSE, bio: 'HOD of CSE Department with 20 years of experience.', gender: Gender.MALE },
  { id: 'f2', name: 'Vicky', role: UserRole.FACULTY, username: 'Vicky', password: 'vicky@2007', facultyRole: FacultyRole.ASSISTANT_PROFESSOR, department: Department.CSE, bio: 'Assistant Professor specializing in AI and Machine Learning.', gender: Gender.MALE },
  { id: 'f3', name: 'Prof. J. Smith', role: UserRole.FACULTY, username: 'jsmith', password: 'password123', facultyRole: FacultyRole.PROFESSOR, department: Department.ECE, bio: 'Professor in ECE with a focus on Embedded Systems.', gender: Gender.MALE },
  { id: 'f4', name: 'CSE HOD', role: UserRole.FACULTY, username: 'csehod', password: 'cse@hod', facultyRole: FacultyRole.HOD, department: Department.CSE, bio: 'HOD of CSE Department.', gender: Gender.MALE },
  { id: 'f5', name: 'CSE Professor', role: UserRole.FACULTY, username: 'csef1', password: 'cse@f1', facultyRole: FacultyRole.PROFESSOR, department: Department.CSE, bio: 'Professor in CSE Department.', gender: Gender.MALE },
  { id: 'f_ashok', name: 'Ashok', role: UserRole.FACULTY, username: 'aksir', password: 'ak@sir', email: '1234@gmail.com', department: Department.CSE, facultyRole: FacultyRole.PROFESSOR, phone: '1234567890', bio: 'Professor in CSE Department.', gender: Gender.MALE },
  { id: 'f_warden', name: 'Hostel Warden', role: UserRole.FACULTY, username: 'warden', password: 'warden', department: Department.CSE, facultyRole: FacultyRole.WARDEN, bio: 'Hostel Warden responsible for student outpasses.', gender: Gender.MALE },
  { id: 'f_office', name: 'Office Admin', role: UserRole.FACULTY, username: 'office', password: 'office', department: Department.CSE, facultyRole: FacultyRole.OFFICE, bio: 'Office Administrator managing fees and records.', gender: Gender.FEMALE }
];

const MOCK_SUBMISSIONS: Submission[] = [
  { id: 'sub1', studentId: 's1', title: 'AI Ethics Paper', type: 'Assignment', date: '2023-10-10', fileName: 'ethics.pdf' },
  { id: 'sub2', studentId: 's1', title: 'Smart Home IoT', type: 'Project', date: '2023-11-05', fileName: 'iot_code.zip' }
];

const MOCK_SUBJECTS: Subject[] = [
  { id: 'sub1', name: 'Data Structures', code: 'CS101', department: Department.CSE, semester: 'Semester 3' },
  { id: 'sub2', name: 'Operating Systems', code: 'CS102', department: Department.CSE, semester: 'Semester 4' },
  { id: 'sub3', name: 'Database Management', code: 'CS103', department: Department.CSE, semester: 'Semester 4' }
];

const MOCK_MAPPINGS: FacultyClassMapping[] = [
  { id: 'm1', facultyId: 'f2', subjectId: 'sub1', department: Department.CSE, collegeClass: 'II Year', section: Section.A },
  { id: 'm2', facultyId: 'f2', subjectId: 'sub2', department: Department.CSE, collegeClass: 'II Year', section: Section.A },
  { id: 'm3', facultyId: 'f1', subjectId: 'sub1', department: Department.CSE, collegeClass: 'I Year', section: Section.A },
  { id: 'm4', facultyId: 'f1', subjectId: 'sub3', department: Department.CSE, collegeClass: 'III Year', section: Section.B }
];

const MOCK_STUDENT_SUBJECTS: StudentSubject[] = [
  { id: 'ss1', studentId: 's1', subjectId: 'sub1', subjectName: 'Data Structures', isArrear: false, type: PaperType.CURRENT, noDueStatus: NoDueStatus.PENDING },
  { id: 'ss2', studentId: 's1', subjectId: 'sub2', subjectName: 'Operating Systems', isArrear: true, type: PaperType.ARREAR, noDueStatus: NoDueStatus.PENDING },
  { id: 'ss3', studentId: 's1', subjectId: 'sub3', subjectName: 'Database Management', isArrear: false, type: PaperType.CURRENT, noDueStatus: NoDueStatus.PENDING }
];

const MOCK_HALL_TICKETS: HallTicketRequest[] = [];

// --- COMPONENTS ---

// 1. Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title?: string, message?: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
            <Trash2 size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title || 'Confirm Delete'}</h3>
          <p className="text-gray-500 text-sm mb-6">
            {message || 'Are you sure you want to delete this record? This action cannot be undone.'}
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition">
              No, Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition">
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Login / Sign Up Component
const Login = ({ onLogin, facultyList, studentList, principal, onRequestSignup, showSuccess, showError }: { onLogin: (user: User) => void, facultyList: any[], studentList: Student[], principal: Principal, onRequestSignup: (req: PendingRequest) => void, showSuccess: (msg: string) => void, showError: (msg: string) => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  
  // Login State
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign Up State
  const [newName, setNewName] = useState('');
  const [newRegNo, setNewRegNo] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState<Gender>(Gender.MALE);
  const [newResStatus, setNewResStatus] = useState<ResidentialStatus>(ResidentialStatus.DAY_SCHOLAR);
  const [newDept, setNewDept] = useState<Department>(Department.CSE);
  const [newYear, setNewYear] = useState<string>('I Year');
  const [newSection, setNewSection] = useState<Section>(Section.A);
  const [newFacultyRole, setNewFacultyRole] = useState<FacultyRole>(FacultyRole.ASSISTANT_PROFESSOR);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Fallback to Mock Data
      if (role === UserRole.PRINCIPAL) {
        if (principal.username === id && (principal as any).password === password) {
          onLogin(principal);
        } else {
          setError('Invalid Principal credentials');
        }
      } else if (role === UserRole.FACULTY) {
        const faculty = facultyList.find(f => f.username === id && f.password === password);
        if (faculty) onLogin(faculty);
        else setError('Invalid Faculty credentials');
      } else {
        const student = studentList.find(s => s.rollNo === id && s.dob === password);
        if (student) onLogin(student);
        else setError('Invalid Student credentials (ID: Roll number, Pass: DOB)');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newName || !newEmail || !newPhone) {
        setError("All fields are required.");
        return;
    }

    if (role === UserRole.FACULTY) {
        if (!id || !password) { setError("Username and Password are required."); return; }
        if (facultyList.some(f => f.username === id)) {
            setError("Username already exists. Please choose another.");
            return;
        }
    } else {
        if (!newRegNo || !newDob) { setError("Roll number and DOB are required."); return; }
        if (studentList.some(s => s.regNo === newRegNo)) {
            setError("Student with this Register Number already exists.");
            return;
        }
    }

    const req: PendingRequest = {
      id: `req${Date.now()}`,
      name: newName,
      role: role,
      password: role === UserRole.FACULTY ? password : newDob, 
      username: role === UserRole.FACULTY ? id : undefined,
      regNo: role === UserRole.STUDENT ? newRegNo : undefined,
      dob: role === UserRole.STUDENT ? newDob : undefined,
      department: newDept,
      section: role === UserRole.STUDENT ? newSection : undefined,
      email: newEmail,
      phone: newPhone,
      collegeClass: role === UserRole.STUDENT ? newYear : 'I Year',
      gender: newGender,
      residentialStatus: role === UserRole.STUDENT ? newResStatus : undefined,
      facultyRole: role === UserRole.FACULTY ? newFacultyRole : undefined
    };
    onRequestSignup(req);
    setSuccessMsg("Request sent! Please wait for approval.");
    setIsSignUp(false); // Switch back to login
    setNewName(''); setId(''); setPassword(''); setNewRegNo(''); setNewDob(''); setNewEmail(''); setNewPhone('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Mahendra Analytics</h1>
          <p className="text-blue-100 mt-1">Student Management Portal</p>
        </div>
        
        <div className="p-8">
          {/* Sign In / Sign Up Toggle */}
          <div className="flex justify-center mb-6 border-b">
             <button onClick={() => { setIsSignUp(false); setError(''); setSuccessMsg(''); }} className={`pb-2 px-4 font-bold ${!isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Sign In</button>
             <button onClick={() => { setIsSignUp(true); setError(''); setSuccessMsg(''); setRole(UserRole.STUDENT); }} className={`pb-2 px-4 font-bold ${isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Sign Up</button>
          </div>

          {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm rounded flex items-center gap-2"><CheckCircle size={16}/> {successMsg}</div>}
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

          {/* Role Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            {!isSignUp && (
              <button 
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${role === UserRole.PRINCIPAL ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                onClick={() => setRole(UserRole.PRINCIPAL)}
              >
                Principal
              </button>
            )}
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${role === UserRole.FACULTY ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
              onClick={() => setRole(UserRole.FACULTY)}
            >
              Faculty
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${role === UserRole.STUDENT ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
              onClick={() => setRole(UserRole.STUDENT)}
            >
              Student
            </button>
          </div>

          {isSignUp ? (
             /* SIGN UP FORM */
             <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-gray-500">Full Name</label>
                   <input required type="text" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                
                {role === UserRole.FACULTY ? (
                  <>
                    <div>
                       <label className="text-xs font-bold text-gray-500">Username</label>
                       <input required type="text" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={id} onChange={e => setId(e.target.value)} />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-500">Password</label>
                       <div className="relative">
                        <input required type={showPassword ? "text" : "password"} className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Department</label>
                        <select className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newDept} onChange={e => setNewDept(e.target.value as Department)}>
                           {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Role</label>
                        <select className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newFacultyRole} onChange={e => setNewFacultyRole(e.target.value as FacultyRole)}>
                           {Object.values(FacultyRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-xs font-bold text-gray-500">Email</label>
                           <input required type="email" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500">Phone</label>
                           <input required type="tel" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                        </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Roll number</label>
                        <input required type="text" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newRegNo} onChange={e => setNewRegNo(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">DOB (DDMMYYYY)</label>
                        <input required type="text" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newDob} onChange={e => setNewDob(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Department</label>
                        <select className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newDept} onChange={e => setNewDept(e.target.value as Department)}>
                           {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Year</label>
                        <select className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newYear} onChange={e => setNewYear(e.target.value)}>
                           {['I Year', 'II Year', 'III Year', 'IV Year'].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Section</label>
                        <select className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newSection} onChange={e => setNewSection(e.target.value as Section)}>
                           {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-xs font-bold text-gray-500">Email</label>
                           <input required type="email" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500">Phone</label>
                           <input required type="tel" className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-xs font-bold text-gray-500">Gender</label>
                           <select className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2" value={newGender} onChange={e => setNewGender(e.target.value as Gender)}>
                              <option value={Gender.MALE}>Male</option>
                              <option value={Gender.FEMALE}>Female</option>
                              <option value={Gender.OTHERS}>Others</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500">Residential Status</label>
                           <div className="flex gap-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input type="radio" name="resStatus" value={ResidentialStatus.DAY_SCHOLAR} checked={newResStatus === ResidentialStatus.DAY_SCHOLAR} onChange={() => setNewResStatus(ResidentialStatus.DAY_SCHOLAR)} /> Day Scholar
                              </label>
                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input type="radio" name="resStatus" value={ResidentialStatus.HOSTELER} checked={newResStatus === ResidentialStatus.HOSTELER} onChange={() => setNewResStatus(ResidentialStatus.HOSTELER)} /> Hosteler
                              </label>
                           </div>
                        </div>
                    </div>
                  </>
                )}

                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-lg mt-4">
                   Send Request
                </button>
             </form>
          ) : (
             /* SIGN IN FORM */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    {role === UserRole.FACULTY ? 'Username / ID' : role === UserRole.PRINCIPAL ? 'Principal ID' : 'User ID'}
                  </label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    {role === UserRole.FACULTY || role === UserRole.PRINCIPAL ? 'Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg disabled:opacity-50">
                  {loading ? 'Logging in...' : 'Login securely'}
                </button>
             </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- AI Chatbot Component ---
const Chatbot = ({ students, facultyList }: { students: Student[], facultyList: Faculty[] }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await queryDatabase(input, students, facultyList);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl flex flex-col h-[600px] border border-indigo-100 overflow-hidden animate-fade-in">
      <div className="bg-indigo-600 p-4 text-white flex items-center gap-2">
        <MessageSquare size={20} />
        <h3 className="font-bold">Staff AI Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <p>Ask me anything about students or faculty.</p>
            <p className="text-xs mt-2">Example: "List students with attendance below 75%"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
               <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                  <Markdown>{m.text}</Markdown>
               </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg border border-gray-200 animate-pulse flex gap-2 items-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
        <input 
          type="text" 
          className="flex-1 bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
          placeholder="Type your query..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Plus size={20} className="rotate-45" />
        </button>
      </form>
    </div>
  );
};

// 3. Faculty Dashboard
const FacultyDashboard = ({ 
    user, students, submissions, facultyList, pendingRequests, gatePassRequests, setStudents, setFacultyList, setPendingRequests, setGatePassRequests, messages, setUser,
    studentSubjects, setStudentSubjects, hallTicketRequests, setHallTicketRequests, subjects, setSubjects, facultyMappings, setFacultyMappings,
    classAdvisors, setClassAdvisors, transactions, setTransactions, showSuccess, showError
  }: { 
    user: Faculty | Principal, students: Student[], submissions: Submission[], facultyList: any[], pendingRequests: PendingRequest[], gatePassRequests: GatePassRequest[],
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>, setFacultyList: any, setPendingRequests: any, setGatePassRequests: any, messages: Message[], setUser: any,
    studentSubjects: StudentSubject[], setStudentSubjects: React.Dispatch<React.SetStateAction<StudentSubject[]>>, hallTicketRequests: HallTicketRequest[], setHallTicketRequests: React.Dispatch<React.SetStateAction<HallTicketRequest[]>>,
    subjects: Subject[], setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>, facultyMappings: FacultyClassMapping[], setFacultyMappings: React.Dispatch<React.SetStateAction<FacultyClassMapping[]>>,
    classAdvisors: ClassAdvisorMapping[], setClassAdvisors: React.Dispatch<React.SetStateAction<ClassAdvisorMapping[]>>,
    transactions: Transaction[], setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
    showSuccess: (msg: string) => void, showError: (msg: string) => void
  }) => {
  
  const [view, setView] = useState<'profile' | 'home' | 'manage' | 'attendance' | 'faculty_list' | 'students' | 'subjects' | 'mappings' | 'requests' | 'ai_chat' | 'no_dues' | 'hall_tickets' | 'warden_hostel' | 'office_mgmt'>('home');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<FacultyClassMapping | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  
  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'student' | 'faculty' | 'subject' | 'mapping'} | null>(null);

  // Forms
  const [newStudent, setNewStudent] = useState<Partial<Student>>({ role: UserRole.STUDENT, department: Department.CSE, section: Section.A, collegeClass: 'I Year' });
  const [newFaculty, setNewFaculty] = useState<{name: string, username: string, password: string, department: Department, facultyRole: FacultyRole}>({ name: '', username: '', password: '', department: Department.CSE, facultyRole: FacultyRole.ASSISTANT_PROFESSOR });
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({ name: '', code: '', semester: '1' });
  const [newMapping, setNewMapping] = useState<Partial<FacultyClassMapping>>({ facultyId: '', subjectId: '', collegeClass: 'I Year', section: Section.A });
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingMapping, setEditingMapping] = useState<FacultyClassMapping | null>(null);

  const [bio, setBio] = useState((user as Faculty).bio || '');
  const [academicDetails, setAcademicDetails] = useState((user as Faculty).academicDetails || '');

  const [attendanceData, setAttendanceData] = useState<{[key: string]: 'Present' | 'Absent'}>({});

  const [officeSearch, setOfficeSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [editingFees, setEditingFees] = useState<{studentId: string, feeId: string, amount: number, description: string} | null>(null);

  const submitAttendance = () => {
    showSuccess("Attendance Submitted Successfully!");
    setAttendanceData({});
  };

  const handleSetClassAdvisor = (year: string, section: Section, facultyId: string) => {
    const newMapping: ClassAdvisorMapping = {
      department: (user as Faculty).department,
      collegeClass: year,
      section,
      facultyId
    };
    setClassAdvisors(prev => {
      const filtered = prev.filter(m => !(m.collegeClass === year && m.section === section && m.department === newMapping.department));
      return [...filtered, newMapping];
    });
    showSuccess("Class Advisor Assigned!");
  };

  const handleSaveProfile = () => {
    if (user.role === UserRole.FACULTY) {
      const updatedUser = { ...user, bio, academicDetails };
      setUser(updatedUser);
      setFacultyList((prev: any[]) => prev.map(f => f.id === user.id ? updatedUser : f));
      showSuccess("Profile Saved Successfully");
    }
  };

  const runAnalysis = async (student: Student) => {
    setAnalyzing(true);
    try {
      const studentSubs = submissions.filter(s => s.studentId === student.id);
      const result = await analyzeStudentData(student, studentSubs);
      setAiAnalysis(result);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.regNo || !newStudent.dob || !newStudent.email || !newStudent.phone) {
        return;
    }
    if (students.some(s => s.regNo === newStudent.regNo)) {
        return;
    }

    const student: Student = {
        ...newStudent,
        id: `s${Date.now()}`,
        role: UserRole.STUDENT,
        performanceScore: 70, 
        attendance: 100, 
        collegeClass: newStudent.collegeClass || 'I Year',
        rollNo: `ROLL${Date.now().toString().slice(-4)}`,
        college: 'Mahendra Engineering College',
        department: newStudent.department || Department.CSE,
        section: newStudent.section || Section.A,
    } as Student;

    setStudents(prev => [...prev, student]);
    setNewStudent({ role: UserRole.STUDENT, department: Department.CSE, section: Section.A, collegeClass: 'I Year' });
    showSuccess("Student Added Successfully");
  };

  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.username || !newFaculty.password) {
        return;
    }
    if (facultyList.some(f => f.username === newFaculty.username)) {
        return;
    }

    const isHOD = user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD;
    const dept = isHOD ? (user as Faculty).department : newFaculty.department;

    const facultyId = `f${Date.now()}`;
    setFacultyList((prev: any[]) => [...prev, { ...newFaculty, department: dept, id: facultyId, role: UserRole.FACULTY, bio: '', academicDetails: '' }]);
    
    // Assign default mappings for new faculty
    const defaultMapping: FacultyClassMapping = {
      id: `m${Date.now()}`,
      facultyId: facultyId,
      subjectId: 'sub1', // Default to first mock subject
      department: dept,
      collegeClass: 'I Year',
      section: Section.A
    };
    setFacultyMappings(prev => [...prev, defaultMapping]);

    setNewFaculty({ name: '', username: '', password: '', department: Department.CSE, facultyRole: FacultyRole.ASSISTANT_PROFESSOR });
    showSuccess("Faculty Added Successfully");
  };

  const approveRequest = async (req: PendingRequest) => {
    if (req.role === UserRole.STUDENT) {
        const student: Student = {
            id: req.id,
            name: req.name,
            role: UserRole.STUDENT,
            department: req.department!,
            section: req.section || Section.A,
            collegeClass: req.collegeClass || 'I Year',
            regNo: req.regNo!,
            dob: req.dob || '00000000',
            rollNo: 'TEMP',
            college: 'Mahendra Engineering College',
            email: req.email || '',
            phone: req.phone || '',
            gender: req.gender || Gender.MALE,
            residentialStatus: req.residentialStatus || ResidentialStatus.DAY_SCHOLAR,
            performanceScore: 0,
            attendance: 0
        };
        setStudents(prev => [...prev, student]);
    } else {
        const faculty = {
            id: req.id,
            name: req.name,
            role: UserRole.FACULTY,
            username: req.username!,
            password: req.password!,
            department: req.department!,
            facultyRole: req.facultyRole!,
            email: req.email || '',
            phone: req.phone || '',
            bio: '',
            academicDetails: ''
        };
        setFacultyList((prev: any[]) => [...prev, faculty]);
    }
    setPendingRequests((prev: PendingRequest[]) => prev.filter(r => r.id !== req.id));
    showSuccess("Request Approved and User Created!");
  };

  const rejectRequest = async (id: string) => {
    setPendingRequests((prev: PendingRequest[]) => prev.filter(r => r.id !== id));
    showSuccess("Request Rejected");
  };

  // CRUD for Subjects
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code) return;
    const subject: Subject = {
      id: editingSubject ? editingSubject.id : `sub${Date.now()}`,
      name: newSubject.name,
      code: newSubject.code,
      department: (user as Faculty).department,
      semester: newSubject.semester || '1'
    };
    if (editingSubject) {
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? subject : s));
      setEditingSubject(null);
      showSuccess("Subject Updated Successfully");
    } else {
      setSubjects(prev => [...prev, subject]);
      showSuccess("Subject Added Successfully");
    }
    setNewSubject({ name: '', code: '', semester: '1' });
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setNewSubject({ name: subject.name, code: subject.code, semester: subject.semester });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CRUD for Mappings
  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapping.facultyId || !newMapping.subjectId) return;
    const mapping: FacultyClassMapping = {
      id: editingMapping ? editingMapping.id : `map${Date.now()}`,
      facultyId: newMapping.facultyId,
      subjectId: newMapping.subjectId,
      department: (user as Faculty).department,
      collegeClass: newMapping.collegeClass || 'I Year',
      section: newMapping.section || Section.A
    };
    if (editingMapping) {
      setFacultyMappings(prev => prev.map(m => m.id === editingMapping.id ? mapping : m));
      setEditingMapping(null);
      showSuccess("Mapping Updated Successfully");
    } else {
      setFacultyMappings(prev => [...prev, mapping]);
      showSuccess("Mapping Added Successfully");
    }
    setNewMapping({ facultyId: '', subjectId: '', collegeClass: 'I Year', section: Section.A });
  };

  const handleEditMapping = (mapping: FacultyClassMapping) => {
    setEditingMapping(mapping);
    setNewMapping({ facultyId: mapping.facultyId, subjectId: mapping.subjectId, collegeClass: mapping.collegeClass, section: mapping.section });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Delete Modal
  const initiateDelete = (id: string, type: 'student' | 'faculty' | 'subject' | 'mapping') => {
    setItemToDelete({ id, type });
  };

  // Confirm Delete
  const confirmDelete = () => {
    if (!itemToDelete) return;
    const { id, type } = itemToDelete;
    if (type === 'student') {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudent?.id === id) setSelectedStudent(null);
    } else if (type === 'faculty') {
      setFacultyList((prev: any[]) => prev.filter(f => f.id !== id));
    } else if (type === 'subject') {
      setSubjects(prev => prev.filter(s => s.id !== id));
      // Also remove mappings for this subject
      setFacultyMappings(prev => prev.filter(m => m.subjectId !== id));
    } else if (type === 'mapping') {
      setFacultyMappings(prev => prev.filter(m => m.id !== id));
    }
    setItemToDelete(null);
    showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} Deleted Successfully`);
  };

  const removeFaculty = (id: string) => {
    initiateDelete(id, 'faculty');
  };

  const renderProfile = () => {
    if (user.role === UserRole.PRINCIPAL) {
      return (
        <div className="bg-white rounded-xl shadow p-8 text-center animate-fade-in">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-3xl mx-auto mb-4">
            {user.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
          <p className="text-gray-500 mb-6">Principal</p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Welcome to the Principal Dashboard. You have full access to all departments, faculty, and student records.
          </p>
        </div>
      );
    }

    const facultyUser = user as Faculty;
    return (
      <div className="bg-white rounded-xl shadow p-8 animate-fade-in">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-3xl">
            {facultyUser.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{facultyUser.name}</h2>
            <p className="text-indigo-600 font-medium">{facultyUser.facultyRole} - {facultyUser.department}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                <textarea 
                  className="w-full border border-gray-300 rounded p-3 text-gray-700 h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your bio..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Academic Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Qualifications & Experience</label>
                <textarea 
                  className="w-full border border-gray-300 rounded p-3 text-gray-700 h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your academic details..."
                  value={academicDetails}
                  onChange={(e) => setAcademicDetails(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSaveProfile} className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 transition">Save Profile</button>
        </div>
      </div>
    );
  };

  const renderAttendanceUI = () => {
    const currentDept = user.role === UserRole.FACULTY ? (user as Faculty).department : selectedDept;
    if (!currentDept || !selectedYear || !selectedSection) {
      return (
        <div className="bg-white rounded-xl shadow p-8 text-center animate-fade-in">
          <Activity size={48} className="mx-auto text-indigo-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Class to Take Attendance</h3>
          <p className="text-gray-500 mb-6">Please go to the Students tab and select a specific department, year, and section first.</p>
          <button onClick={() => setView('students')} className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 transition">Go to Students</button>
        </div>
      );
    }

    const sectionStudents = students.filter(s => s.department === currentDept && s.collegeClass === selectedYear && s.section === selectedSection);

    return (
      <div className="bg-white rounded-xl shadow p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Take Attendance</h2>
            <p className="text-gray-500">{currentDept} - {selectedYear} - Section {selectedSection}</p>
          </div>
          <button onClick={submitAttendance} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 transition flex items-center gap-2">
            <Check size={20} /> Submit Attendance
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-bold text-gray-600">Roll No</th>
                <th className="p-4 font-bold text-gray-600">Name</th>
                <th className="p-4 font-bold text-gray-600 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {sectionStudents.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-700 font-medium">{s.rollNo}</td>
                  <td className="p-4 text-gray-800">{s.name}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setAttendanceData(prev => ({...prev, [s.id]: 'Present'}))}
                        className={`w-10 h-10 rounded-full font-bold transition flex items-center justify-center ${attendanceData[s.id] === 'Present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'}`}
                      >
                        P
                      </button>
                      <button 
                        onClick={() => setAttendanceData(prev => ({...prev, [s.id]: 'Absent'}))}
                        className={`w-10 h-10 rounded-full font-bold transition flex items-center justify-center ${attendanceData[s.id] === 'Absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'}`}
                      >
                        A
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHODManage = () => {
    const isHOD = user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD;
    if (!isHOD) return null;

    const dept = (user as Faculty).department;
    const deptFaculty = facultyList.filter(f => f.department === dept);

    return (
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900"><Settings size={20}/> Assign Class Advisors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['I Year', 'II Year', 'III Year', 'IV Year'].map(year => (
            <div key={year} className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-bold text-gray-700 mb-3">{year}</h4>
              <div className="space-y-3">
                {Object.values(Section).map(sec => {
                  const currentAdvisor = classAdvisors.find(m => m.collegeClass === year && m.section === sec && m.department === dept);
                  return (
                    <div key={sec} className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium w-12">Sec {sec}</span>
                      <select 
                        className="flex-1 bg-white text-gray-900 border border-gray-300 p-1 rounded text-sm"
                        value={currentAdvisor?.facultyId || ''}
                        onChange={(e) => handleSetClassAdvisor(year, sec, e.target.value)}
                      >
                        <option value="">Select Advisor</option>
                        {deptFaculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSubjectManagement = () => {
    const isHOD = user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD;
    if (!isHOD) return null;
    const dept = (user as Faculty).department;
    const deptSubjects = subjects.filter(s => s.department === dept);

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-900">
            <BookOpen size={24} /> {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h3>
          <form onSubmit={handleAddSubject} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Subject Name</label>
              <input required placeholder="e.g. Data Structures" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Subject Code</label>
              <input required placeholder="e.g. CS8391" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Semester</label>
              <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={newSubject.semester} onChange={e => setNewSubject({...newSubject, semester: e.target.value})}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold rounded py-2 hover:bg-indigo-700 transition shadow-md">
                {editingSubject ? 'Update' : 'Add Subject'}
              </button>
              {editingSubject && (
                <button type="button" onClick={() => { setEditingSubject(null); setNewSubject({name:'', code:'', semester:'1'}); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition">Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800">Department Subjects ({dept})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                  <th className="p-4 font-bold">Code</th>
                  <th className="p-4 font-bold">Subject Name</th>
                  <th className="p-4 font-bold">Semester</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deptSubjects.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400">No subjects defined yet.</td></tr>
                )}
                {deptSubjects.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-sm font-bold text-indigo-600">{s.code}</td>
                    <td className="p-4 text-gray-800 font-medium">{s.name}</td>
                    <td className="p-4 text-gray-600">Semester {s.semester}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditSubject(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"><Edit3 size={18}/></button>
                        <button onClick={() => initiateDelete(s.id, 'subject')} className="p-2 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFacultyMapping = () => {
    const isHOD = user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD;
    if (!isHOD) return null;
    const dept = (user as Faculty).department;
    const deptFaculty = facultyList.filter(f => f.department === dept);
    const deptSubjects = subjects.filter(s => s.department === dept);
    const deptMappings = facultyMappings.filter(m => m.department === dept);

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-900">
            <MapPin size={24} /> {editingMapping ? 'Edit Mapping' : 'Map Faculty to Class'}
          </h3>
          <form onSubmit={handleAddMapping} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Faculty</label>
              <select required className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={newMapping.facultyId} onChange={e => setNewMapping({...newMapping, facultyId: e.target.value})}>
                <option value="">Select Faculty</option>
                {deptFaculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Subject</label>
              <select required className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={newMapping.subjectId} onChange={e => setNewMapping({...newMapping, subjectId: e.target.value})}>
                <option value="">Select Subject</option>
                {deptSubjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Year</label>
              <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={newMapping.collegeClass} onChange={e => setNewMapping({...newMapping, collegeClass: e.target.value})}>
                {['I Year', 'II Year', 'III Year', 'IV Year'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Section</label>
              <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={newMapping.section} onChange={e => setNewMapping({...newMapping, section: e.target.value as Section})}>
                {Object.values(Section).map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold rounded py-2 hover:bg-indigo-700 transition shadow-md">
                {editingMapping ? 'Update' : 'Map Class'}
              </button>
              {editingMapping && (
                <button type="button" onClick={() => { setEditingMapping(null); setNewMapping({facultyId:'', subjectId:'', collegeClass:'I Year', section: Section.A}); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition">Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800">Class Mappings ({dept})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                  <th className="p-4 font-bold">Faculty</th>
                  <th className="p-4 font-bold">Subject</th>
                  <th className="p-4 font-bold">Class</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deptMappings.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400">No mappings created yet.</td></tr>
                )}
                {deptMappings.map(m => {
                  const faculty = facultyList.find(f => f.id === m.facultyId);
                  const subject = subjects.find(s => s.id === m.subjectId);
                  return (
                    <tr key={m.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">{faculty?.name.charAt(0)}</div>
                          <span className="text-gray-800 font-medium">{faculty?.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-800 font-medium">{subject?.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{subject?.code}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">{m.collegeClass} - {m.section}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditMapping(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"><Edit3 size={18}/></button>
                          <button onClick={() => initiateDelete(m.id, 'mapping')} className="p-2 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRequests = () => {
    const filteredRequests = gatePassRequests.filter(r => {
      if (user.role === UserRole.PRINCIPAL) return true;
      if (user.role === UserRole.FACULTY) {
        if (user.facultyRole === FacultyRole.HOD) return r.department === user.department;
        if (user.facultyRole === FacultyRole.WARDEN) return r.type === RequestType.OUTPASS;
        return false;
      }
      return false;
    });

    const handleApprove = async (req: GatePassRequest) => {
      let hodApp = req.hodApproval;
      let wardenApp = req.wardenApproval;
      
      if (user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD) hodApp = RequestStatus.APPROVED;
      if (user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.WARDEN) wardenApp = RequestStatus.APPROVED;
      
      let overall = RequestStatus.PENDING;
      if (req.type === RequestType.GATE_PASS) {
        if (hodApp === RequestStatus.APPROVED) overall = RequestStatus.APPROVED;
      } else {
        if (hodApp === RequestStatus.APPROVED && wardenApp === RequestStatus.APPROVED) overall = RequestStatus.APPROVED;
      }
      
      const updates = { hodApproval: hodApp, wardenApproval: wardenApp, status: overall };

      setGatePassRequests((prev: GatePassRequest[]) => prev.map(r => r.id === req.id ? { ...r, ...updates } : r));
      showSuccess("Request Approved");
    };

    const handleReject = async (req: GatePassRequest) => {
      let hodApp = req.hodApproval;
      let wardenApp = req.wardenApproval;
      
      if (user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD) hodApp = RequestStatus.REJECTED;
      if (user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.WARDEN) wardenApp = RequestStatus.REJECTED;
      
      const updates = { hodApproval: hodApp, wardenApproval: wardenApp, status: RequestStatus.REJECTED };

      setGatePassRequests((prev: GatePassRequest[]) => prev.map(r => r.id === req.id ? { ...r, ...updates } : r));
      showSuccess("Request Rejected");
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-indigo-900">Student Requests</h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                <th className="p-4 font-bold">Student</th>
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Reason</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No pending requests.</td></tr>
              )}
              {filteredRequests.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{r.studentName}</p>
                    <p className="text-xs text-gray-500">{r.department} • {r.collegeClass}</p>
                  </td>
                  <td className="p-4 font-bold text-gray-800">{r.type}</td>
                  <td className="p-4 text-gray-600 max-w-xs truncate">{r.reason}</td>
                  <td className="p-4 text-gray-600">{r.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      r.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' :
                      r.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r)} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition"><Check size={18}/></button>
                      <button onClick={() => handleReject(r)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"><X size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleUpdateNoDue = async (studentId: string, subjectId: string, status: NoDueStatus) => {
    const subject = subjects.find(s => s.id === subjectId);
    const subjectName = subject?.name || 'Unknown Subject';

    setStudentSubjects(prev => {
      const existing = prev.find(ss => ss.studentId === studentId && ss.subjectId === subjectId);
      if (existing) {
        return prev.map(ss => ss.id === existing.id ? { ...ss, noDueStatus: status } : ss);
      } else {
        return [...prev, {
          id: `ss${Date.now()}`,
          studentId,
          subjectId,
          subjectName,
          isArrear: false,
          type: PaperType.CURRENT,
          noDueStatus: status
        }];
      }
    });
    showSuccess(`No Dues status updated to ${status}`);
  };

  const renderNoDues = () => {
    if (user.role === UserRole.FACULTY) {
      const myMappings = facultyMappings.filter(m => m.facultyId === user.id);
      
      if (!selectedMapping) {
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">My Assigned Classes (No Dues Clearance)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myMappings.map(mapping => {
                const subject = subjects.find(s => s.id === mapping.subjectId);
                return (
                  <div key={mapping.id} onClick={() => setSelectedMapping(mapping)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">{subject?.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{mapping.collegeClass} - Section {mapping.section}</p>
                    <p className="text-sm text-gray-500">{mapping.department}</p>
                  </div>
                );
              })}
              {myMappings.length === 0 && <p className="text-gray-500">No classes assigned.</p>}
            </div>
          </div>
        );
      }

      const classStudents = students.filter(s => s.department === selectedMapping.department && s.collegeClass === selectedMapping.collegeClass && s.section === selectedMapping.section);
      const subject = subjects.find(s => s.id === selectedMapping.subjectId);

      return (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex items-center gap-4 border-b pb-4">
            <button onClick={() => setSelectedMapping(null)} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={20} /></button>
            <h2 className="text-2xl font-bold text-gray-900">No Dues Clearance: {subject?.name} ({selectedMapping.collegeClass} - {selectedMapping.section})</h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Roll number</th>
                  <th className="p-4 font-semibold text-gray-600">Name</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classStudents.map(student => {
                  const studentSubject = studentSubjects.find(ss => ss.studentId === student.id && ss.subjectId === selectedMapping.subjectId);
                  const status = studentSubject?.noDueStatus || NoDueStatus.PENDING;
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-900 font-medium">{student.rollNo}</td>
                      <td className="p-4 text-gray-600">{student.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${status === NoDueStatus.APPROVED ? 'bg-green-100 text-green-700' : status === NoDueStatus.DECLINED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateNoDue(student.id, selectedMapping.subjectId, NoDueStatus.APPROVED)} className={`px-3 py-1 rounded text-sm font-medium transition ${status === NoDueStatus.APPROVED ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'}`}>Approve</button>
                          <button onClick={() => handleUpdateNoDue(student.id, selectedMapping.subjectId, NoDueStatus.DECLINED)} className={`px-3 py-1 rounded text-sm font-medium transition ${status === NoDueStatus.DECLINED ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'}`}>Decline</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No students found in this class.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderHallTickets = () => {
    if (user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD) {
      const deptRequests = hallTicketRequests.filter(r => {
        const student = students.find(s => s.id === r.studentId);
        return student?.department === user.department;
      });

      const handleApproveHallTicket = async (reqId: string) => {
        setHallTicketRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: RequestStatus.APPROVED } : r));
        showSuccess("Hall Ticket Approved & Generated!");
      };

      return (
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Hall Ticket Requests</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Roll number</th>
                  <th className="p-4 font-semibold text-gray-600">Name</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deptRequests.map(req => {
                  const student = students.find(s => s.id === req.studentId);
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-900 font-medium">{student?.rollNo}</td>
                      <td className="p-4 text-gray-600">{student?.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {req.status === RequestStatus.PENDING && (
                          <button onClick={() => handleApproveHallTicket(req.id)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition">
                            Approve
                          </button>
                        )}
                        {req.status === RequestStatus.APPROVED && (
                          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <FileCheck size={14} /> Generated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {deptRequests.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hall ticket requests found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderWardenHostel = () => {
    const hostelStudents = students.filter(s => s.residentialStatus === ResidentialStatus.HOSTELER);
    const years = ['I Year', 'II Year', 'III Year', 'IV Year'];

    return (
      <div className="space-y-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-indigo-900 border-b pb-4">Hostel Students Directory</h2>
        {years.map(year => {
          const yearStudents = hostelStudents.filter(s => s.collegeClass === year);
          if (yearStudents.length === 0) return null;
          return (
            <div key={year} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-700 bg-gray-100 p-2 rounded">{year}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {yearStudents.map(s => (
                  <div key={s.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.rollNo} | {s.department}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Phone:</span> {s.phone}</p>
                      <p><span className="font-medium">Email:</span> {s.email}</p>
                      <p className="mt-2 text-xs italic text-gray-500 line-clamp-2">{s.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOfficeMgmt = () => {
    const filteredStudents = students.filter(s => 
      s.rollNo.toLowerCase().includes(officeSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(officeSearch.toLowerCase())
    );

    const handleUpdateFee = (studentId: string, feeId: string, newAmount: number, description: string) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const fee = student.fees?.find(f => f.id === feeId);
      if (!fee) return;

      const oldAmount = fee.amount;
      const diff = newAmount - oldAmount;

      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            fees: s.fees?.map(f => f.id === feeId ? { ...f, amount: newAmount, status: newAmount === 0 ? 'Paid' : 'Pending' } : f)
          };
        }
        return s;
      }));

      // Add to transaction history
      const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        studentId,
        studentName: student.name,
        rollNo: student.rollNo,
        amount: Math.abs(diff),
        description: `Fee update for ${description}: ${oldAmount} -> ${newAmount}`,
        date: new Date().toISOString(),
        type: diff < 0 ? 'Credit' : 'Debit'
      };
      setTransactions(prev => [newTransaction, ...prev]);
      setEditingFees(null);
      showSuccess("Fee Updated Successfully!");
    };

    const groupedStudents: {[dept: string]: {[year: string]: {[sec: string]: Student[]}}} = {};
    filteredStudents.forEach(s => {
      if (!groupedStudents[s.department]) groupedStudents[s.department] = {};
      if (!groupedStudents[s.department][s.collegeClass]) groupedStudents[s.department][s.collegeClass] = {};
      if (!groupedStudents[s.department][s.collegeClass][s.section]) groupedStudents[s.department][s.collegeClass][s.section] = [];
      groupedStudents[s.department][s.collegeClass][s.section].push(s);
    });

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <h2 className="text-2xl font-bold text-indigo-900">Office Management</h2>
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search Roll No / Name..." 
              className="w-full bg-white text-gray-900 border border-gray-300 p-2 pl-8 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={officeSearch}
              onChange={e => setOfficeSearch(e.target.value)}
            />
            <Bot size={18} className="absolute left-2 top-2.5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Student Fee Records</h3>
            {officeSearch.trim() !== '' ? (
              <div className="space-y-3">
                {filteredStudents.map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.rollNo} | {s.department} | {s.collegeClass} | Sec {s.section}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold">Total Pending</p>
                        <p className="text-lg font-bold text-red-600">
                          ₹{s.fees?.filter(f => f.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0) || 0}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {s.fees?.map(f => (
                        <div key={f.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <span className="text-gray-700">{f.description}</span>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${f.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{f.amount}
                            </span>
                            <button 
                              onClick={() => setEditingFees({ studentId: s.id, feeId: f.id, amount: f.amount, description: f.description })}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="p-8 text-center text-gray-400 italic">
                    No students found matching "{officeSearch}".
                  </div>
                )}
              </div>
            ) : (
              Object.entries(groupedStudents).map(([dept, years]) => (
                <div key={dept} className="space-y-4">
                  <h4 className="text-lg font-bold text-indigo-700 bg-indigo-50 p-2 rounded">{dept} Department</h4>
                  {Object.entries(years).map(([year, sections]) => (
                    <div key={year} className="ml-4 space-y-3">
                      <h5 className="font-bold text-gray-600 border-l-4 border-indigo-300 pl-2">{year}</h5>
                      {Object.entries(sections).map(([sec, studentList]) => (
                        <div key={sec} className="ml-4 space-y-2">
                          <p className="text-sm font-medium text-gray-500">Section {sec}</p>
                          <div className="grid grid-cols-1 gap-3">
                            {studentList.map(s => (
                              <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="font-bold text-gray-800">{s.name}</p>
                                    <p className="text-xs text-gray-500">{s.rollNo}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Total Pending</p>
                                    <p className="text-lg font-bold text-red-600">
                                      ₹{s.fees?.filter(f => f.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0) || 0}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {s.fees?.map(f => (
                                    <div key={f.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                      <span className="text-gray-700">{f.description}</span>
                                      <div className="flex items-center gap-3">
                                        <span className={`font-bold ${f.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                                          ₹{f.amount}
                                        </span>
                                        <button 
                                          onClick={() => setEditingFees({ studentId: s.id, feeId: f.id, amount: f.amount, description: f.description })}
                                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                        >
                                          <Edit3 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Transaction History</h3>
              <div className="relative w-40">
                <input 
                  type="text" 
                  placeholder="Search History..." 
                  className="w-full bg-white text-gray-900 border border-gray-300 p-1 pl-6 text-xs rounded focus:ring-2 focus:ring-indigo-500"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
                <Activity size={12} className="absolute left-2 top-2 text-gray-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                {transactions
                  .filter(t => 
                    t.studentName.toLowerCase().includes(historySearch.toLowerCase()) ||
                    t.rollNo.toLowerCase().includes(historySearch.toLowerCase()) ||
                    t.description.toLowerCase().includes(historySearch.toLowerCase())
                  )
                  .map(t => (
                  <div key={t.id} className="p-4 border-b last:border-0 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm text-gray-800">{t.studentName}</p>
                      <p className={`text-xs font-bold ${t.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'Credit' ? '-' : '+'} ₹{t.amount}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{t.rollNo} | {new Date(t.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-600 italic">{t.description}</p>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="p-8 text-center text-gray-400 italic">
                    No transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fee Edit Modal */}
        {editingFees && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Fee: {editingFees.description}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500"
                    value={editingFees.amount}
                    onChange={e => setEditingFees({ ...editingFees, amount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setEditingFees(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleUpdateFee(editingFees.studentId, editingFees.feeId, editingFees.amount, editingFees.description)}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (view === 'ai_chat') return <Chatbot students={students} facultyList={facultyList} />;
    if (view === 'requests') return renderRequests();
    if (view === 'attendance') return renderAttendanceUI();
    if (view === 'profile') return renderProfile();
    if (view === 'manage') return renderManage();
    if (view === 'students') return renderHome();
    if (view === 'subjects') return renderSubjectManagement();
    if (view === 'mappings') return renderFacultyMapping();
    if (view === 'no_dues') return renderNoDues();
    if (view === 'hall_tickets') return renderHallTickets();
    if (view === 'warden_hostel') return renderWardenHostel();
    if (view === 'office_mgmt') return renderOfficeMgmt();
    
    if (view === 'faculty_list' && (user.role === UserRole.PRINCIPAL || (user as Faculty).facultyRole === FacultyRole.HOD)) {
      if (selectedFaculty) {
        return (
          <div className="animate-fade-in">
            <button onClick={() => setSelectedFaculty(null)} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} /> Back to Faculty Directory
            </button>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-3xl">
                  {selectedFaculty.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">{selectedFaculty.name}</h2>
                  <p className="text-indigo-600 font-medium text-lg">
                    {selectedFaculty.facultyRole} 
                    {selectedFaculty.facultyRole !== FacultyRole.WARDEN && selectedFaculty.facultyRole !== FacultyRole.OFFICE ? ` - ${selectedFaculty.department}` : ''}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Contact Information</h3>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail size={18} className="text-indigo-500"/> {(selectedFaculty as any).email || `${selectedFaculty.username}@mit.edu`}
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone size={18} className="text-indigo-500"/> {(selectedFaculty as any).phone || '+91 98765 43210'}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Professional Details</h3>
                  <p className="text-gray-600"><span className="font-bold">Bio:</span> {selectedFaculty.bio || 'No bio available.'}</p>
                  <p className="text-gray-600"><span className="font-bold">Academic Details:</span> {selectedFaculty.academicDetails || 'No academic details available.'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      const hods = facultyList.filter(f => f.facultyRole === FacultyRole.HOD);
      const faculties = facultyList.filter(f => f.facultyRole !== FacultyRole.HOD);

      return (
        <div className="bg-white rounded-xl shadow p-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-indigo-900">Faculty Directory</h2>
          
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                Heads of Departments (HODs)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hods.map(f => (
                  <div key={f.id} onClick={() => setSelectedFaculty(f)} className="p-6 bg-gray-50 rounded-xl border hover:shadow-lg transition cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{f.name}</h3>
                        <p className="text-xs text-indigo-600 font-medium">{f.facultyRole}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-bold">Dept:</span> {f.department}</p>
                      <p className="italic line-clamp-2 text-xs">"{f.bio || 'No bio available.'}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                Faculties
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {faculties.map(f => (
                  <div key={f.id} onClick={() => setSelectedFaculty(f)} className="p-6 bg-gray-50 rounded-xl border hover:shadow-lg transition cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{f.name}</h3>
                        <p className="text-xs text-indigo-600 font-medium">{f.facultyRole}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {f.facultyRole !== FacultyRole.WARDEN && f.facultyRole !== FacultyRole.OFFICE && (
                        <p><span className="font-bold">Dept:</span> {f.department}</p>
                      )}
                      <p className="italic line-clamp-2 text-xs">"{f.bio || 'No bio available.'}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      );
    }
    
    // HOME VIEW (Bio & Stats)
    if (view === 'home' && !selectedDept && !selectedYear && !selectedSection && !selectedStudent) {
      const facultyUser = user as Faculty;
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl shadow p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-3xl">
                {facultyUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{facultyUser.name}</h2>
                <p className="text-indigo-600 font-medium">
                  {facultyUser.facultyRole} 
                  {facultyUser.facultyRole !== FacultyRole.WARDEN && facultyUser.facultyRole !== FacultyRole.OFFICE ? ` - ${facultyUser.department}` : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Bio</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{bio || 'No bio provided.'}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Academic Details</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{academicDetails || 'No academic details provided.'}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
              <h4 className="text-gray-500 text-sm font-bold uppercase">Total Students</h4>
              <p className="text-3xl font-bold text-gray-800">{user.role === UserRole.PRINCIPAL ? students.length : students.filter(s => s.department === facultyUser.department).length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
              <h4 className="text-gray-500 text-sm font-bold uppercase">Pending Requests</h4>
              <p className="text-3xl font-bold text-gray-800">{user.role === UserRole.PRINCIPAL ? pendingRequests.length : pendingRequests.filter(r => r.department === facultyUser.department).length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
              <h4 className="text-gray-500 text-sm font-bold uppercase">Department</h4>
              <p className="text-xl font-bold text-gray-800">{user.role === UserRole.PRINCIPAL ? 'ALL DEPARTMENTS' : facultyUser.department}</p>
            </div>
          </div>
        </div>
      );
    }

    return renderHome();
  };

  const renderHome = () => {
    if (selectedStudent) {
      // LEVEL 4: FULL STUDENT DETAIL VIEW
      return (
        <div className="animate-fade-in">
          <button onClick={() => setSelectedStudent(null)} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} /> Back to Section {selectedSection} List
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               {/* Header Card */}
               <div className="bg-white rounded-xl shadow-lg p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={120} /></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                       <h2 className="text-3xl font-bold text-gray-800">{selectedStudent.name}</h2>
                       <p className="text-gray-500 text-lg">{selectedStudent.department} • Section {selectedStudent.section} • {selectedStudent.collegeClass}</p>
                     </div>
                     <div className="flex gap-3">
                       <button onClick={() => initiateDelete(selectedStudent.id, 'student')} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-200">
                         <Trash2 size={18} /> Remove
                       </button>
                     </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded">
                      <Mail size={18} className="text-indigo-500"/> {selectedStudent.email}
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded">
                      <Phone size={18} className="text-indigo-500"/> {selectedStudent.phone}
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded">
                      <span className="font-bold text-gray-500">Roll number:</span> {selectedStudent.rollNo}
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded">
                      <span className="font-bold text-gray-500">DOB:</span> {selectedStudent.dob.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3')}
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded">
                      <span className="font-bold text-gray-500">Residential Status:</span> {selectedStudent.residentialStatus}
                    </div>
                  </div>
               </div>

               {/* Stats & AI */}
               <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">AI Performance Monitor</h3>
                    <button onClick={() => runAnalysis(selectedStudent)} disabled={analyzing} className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200">
                      {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-3xl font-bold text-blue-600">{selectedStudent.performanceScore}%</div>
                        <div className="text-xs text-blue-400 uppercase font-bold">Academic Score</div>
                     </div>
                     <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-3xl font-bold text-green-600">{selectedStudent.attendance}%</div>
                        <div className="text-xs text-green-400 uppercase font-bold">Attendance</div>
                     </div>
                  </div>
                  {aiAnalysis && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 leading-relaxed"><span className="font-bold text-indigo-600">AI Summary:</span> {aiAnalysis.summary}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-bold text-green-700 mb-1">Strengths</p>
                          <ul className="list-disc pl-4 text-gray-600">{aiAnalysis.strengths.map((s:string, i:number) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div>
                          <p className="font-bold text-red-700 mb-1">Weaknesses</p>
                          <ul className="list-disc pl-4 text-gray-600">{aiAnalysis.weaknesses.map((s:string, i:number) => <li key={i}>{s}</li>)}</ul>
                        </div>
                      </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Sidebar: Messages & Files */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow p-4">
                 <h3 className="font-bold text-gray-700 mb-3">Messages</h3>
                 <div className="h-40 overflow-y-auto space-y-2 border-t pt-2">
                    {messages.filter(m => m.fromId === selectedStudent.id || m.toId === selectedStudent.id).length === 0 && <p className="text-gray-400 text-xs">No messages yet.</p>}
                    {messages.filter(m => m.fromId === selectedStudent.id || m.toId === selectedStudent.id).map(m => (
                      <div key={m.id} className={`text-xs p-2 rounded ${m.fromId === user.id ? 'bg-indigo-100 ml-4' : 'bg-gray-100 mr-4'}`}>
                         <p className="font-bold">{m.senderName}</p>
                         <p>{m.content}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                 <h3 className="font-bold text-gray-700 mb-3">Submissions</h3>
                 <div className="space-y-2 max-h-80 overflow-y-auto">
                    {submissions.filter(s => s.studentId === selectedStudent.id).map(s => (
                      <div key={s.id} className="p-3 bg-gray-50 rounded border flex items-start gap-3">
                         <div className="mt-1">
                           {s.type === 'Link' ? <LinkIcon size={16} className="text-blue-500"/> : <FileText size={16} className="text-gray-400"/>}
                         </div>
                         <div className="flex-1 overflow-hidden">
                           <p className="font-medium text-sm truncate">{s.title}</p>
                           <p className="text-xs text-gray-500">{s.type} • {s.date}</p>
                           {s.type === 'Link' && s.link && (
                               <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline truncate block mt-1 hover:text-blue-800">
                                   {s.link}
                               </a>
                           )}
                           {s.description && <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">"{s.description}"</p>}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const currentDept = user.role === UserRole.FACULTY ? (user as Faculty).department : selectedDept;

    if (currentDept && selectedYear && selectedSection) {
        // LEVEL 4: STUDENTS LIST (Filtered by Dept, Year & Section)
        const sectionStudents = students.filter(s => s.department === currentDept && s.collegeClass === selectedYear && s.section === selectedSection);
        return (
            <div className="animate-fade-in">
               <button onClick={() => setSelectedSection(null)} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft size={20} /> Back to Sections
               </button>
               <h2 className="text-2xl font-bold mb-6 text-indigo-900">{currentDept} - {selectedYear} - Section {selectedSection}</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectionStudents.map(s => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition cursor-pointer border border-transparent hover:border-indigo-500 group relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); initiateDelete(s.id, 'student'); }} 
                            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition z-10 bg-white rounded-full shadow-sm"
                        >
                            <Trash2 size={16} />
                        </button>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
                              {s.name.charAt(0)}
                           </div>
                           <div>
                             <h3 className="font-bold text-gray-800">{s.name}</h3>
                             <p className="text-sm text-gray-500">Reg: {s.regNo}</p>
                           </div>
                        </div>
                     </div>
                  ))}
                  {sectionStudents.length === 0 && (
                     <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed">No students found in Section {selectedSection}.</div>
                  )}
               </div>
            </div>
        )
    }

    if (currentDept && selectedYear) {
      // LEVEL 3: SECTIONS GRID
      return (
        <div className="animate-fade-in">
          <button onClick={() => setSelectedYear(null)} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} /> Back to Years
          </button>
          <h2 className="text-2xl font-bold mb-6 text-indigo-900">{currentDept} - {selectedYear} Sections</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(Section).map(section => {
               // Count students in this section
               const count = students.filter(s => s.department === currentDept && s.collegeClass === selectedYear && s.section === section).length;
               return (
                  <div key={section} onClick={() => setSelectedSection(section)} className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition border hover:border-indigo-400 flex flex-col items-center justify-center h-40">
                     <Folder size={40} className="text-indigo-200 mb-2"/>
                     <h3 className="font-bold text-xl text-gray-800">Section {section}</h3>
                     <p className="text-gray-500 text-sm mt-1">{count} Students</p>
                  </div>
               )
            })}
          </div>
        </div>
      );
    }

    if (currentDept) {
      // LEVEL 2: YEARS GRID
      const years = ['I Year', 'II Year', 'III Year', 'IV Year'];
      return (
        <div className="animate-fade-in">
          {user.role === UserRole.PRINCIPAL && (
            <button onClick={() => { setSelectedDept(null); setSelectedYear(null); setSelectedSection(null); }} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} /> Back to Departments
            </button>
          )}
          <h2 className="text-2xl font-bold mb-6 text-indigo-900">{currentDept} Years</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {years.map(year => {
               // Count students in this year
               const count = students.filter(s => s.department === currentDept && s.collegeClass === year).length;
               return (
                  <div key={year} onClick={() => { setSelectedYear(year); setSelectedSection(null); }} className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition border hover:border-indigo-400 flex flex-col items-center justify-center h-40">
                     <Folder size={40} className="text-indigo-200 mb-2"/>
                     <h3 className="font-bold text-xl text-gray-800">{year}</h3>
                     <p className="text-gray-500 text-sm mt-1">{count} Students</p>
                  </div>
               )
            })}
          </div>
        </div>
      );
    }

    // LEVEL 1: DEPARTMENT CATEGORIES (DEFAULT FOR PRINCIPAL)
    return (
      <div className="animate-fade-in space-y-8">
         {/* Faculty Bio Card */}
         <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-600 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 text-center md:text-left">
               <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
               <p className="text-indigo-600 font-medium mb-2">
                 {user.role === UserRole.PRINCIPAL ? 'Principal' : (user as Faculty).facultyRole} 
                 {user.role === UserRole.PRINCIPAL ? ' • All Departments' : 
                  ((user as Faculty).facultyRole === FacultyRole.WARDEN || (user as Faculty).facultyRole === FacultyRole.OFFICE) ? '' : 
                  ` • ${(user as Faculty).department}`}
               </p>
               <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic border border-gray-100">
                  "{user.bio || 'Welcome to your dashboard. Manage your department and students effectively.'}"
               </div>
            </div>
         </div>

         <h2 className="text-2xl font-bold mb-6 text-gray-800">Departments</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(Department).map(dept => (
              <div key={dept} onClick={() => { setSelectedDept(dept); setSelectedYear(null); setSelectedSection(null); }} className="bg-white rounded-xl shadow-md p-8 cursor-pointer hover:-translate-y-1 transition hover:shadow-xl border-t-4 border-indigo-500">
                 <h3 className="text-xl font-bold text-gray-800 mb-2">{dept}</h3>
                 <p className="text-gray-500 text-sm">{students.filter(s => s.department === dept).length} Students Total</p>
                 <div className="mt-4 flex justify-end">
                    <span className="text-indigo-600 text-sm font-medium">View Years &rarr;</span>
                 </div>
              </div>
            ))}
         </div>
      </div>
    );
  };

  const renderManage = () => {
    const isPrincipal = user.role === UserRole.PRINCIPAL;
    const isFaculty = user.role === UserRole.FACULTY;
    const isHOD = isFaculty && (user as Faculty).facultyRole === FacultyRole.HOD;
    const canManageFaculty = isPrincipal || isHOD;
    
    const visibleRequests = pendingRequests.filter(req => {
        if (isPrincipal) return true;
        if (isHOD) return req.department === (user as Faculty).department;
        if (isFaculty) return req.role === UserRole.STUDENT && req.department === (user as Faculty).department;
        return false;
    });

    const visibleFaculty = facultyList.filter(f => {
        if (isPrincipal) return true;
        if (isHOD) return f.department === (user as Faculty).department;
        return false;
    });

    return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      
      {/* PENDING APPROVALS */}
      <div className="lg:col-span-2 bg-yellow-50 rounded-xl shadow p-6 border border-yellow-200">
         <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-800"><AlertCircle size={20}/> Pending Sign-Up Requests</h3>
         {visibleRequests.length === 0 && <p className="text-gray-500 text-sm">No pending requests.</p>}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {visibleRequests.map(req => (
                 <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                    <div>
                        <p className="font-bold text-gray-800">{req.name} <span className="text-xs bg-gray-200 px-2 rounded">{req.role}</span></p>
                        <p className="text-xs text-gray-500">{req.role === UserRole.STUDENT ? `${req.regNo} - ${req.department} (Sec ${req.section})` : `${req.username} - ${req.facultyRole} (${req.department})`}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => approveRequest(req)} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check size={18}/></button>
                        <button onClick={() => rejectRequest(req.id)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"><X size={18}/></button>
                    </div>
                 </div>
             ))}
         </div>
      </div>

      {/* Manage Students */}
      <div className="bg-white rounded-xl shadow p-6">
         <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900"><UserPlus size={20}/> Add Student</h3>
         <form onSubmit={handleAddStudent} className="space-y-4">
            <input required placeholder="Full Name" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newStudent.name || ''} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
            <input required placeholder="Roll number (Login ID)" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newStudent.rollNo || ''} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} />
            <div className="grid grid-cols-1 gap-2">
               <input required placeholder="DOB (DDMMYYYY) - Password" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newStudent.dob || ''} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
               <input required placeholder="Email" className="bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newStudent.email || ''} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
               <input required placeholder="Phone" className="bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newStudent.phone || ''} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-2">
                <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newStudent.department || ''} onChange={e => setNewStudent({...newStudent, department: e.target.value as Department})}>
                    {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newStudent.collegeClass || ''} onChange={e => setNewStudent({...newStudent, collegeClass: e.target.value})}>
                    {['I Year', 'II Year', 'III Year', 'IV Year'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newStudent.section || ''} onChange={e => setNewStudent({...newStudent, section: e.target.value as Section})}>
                    {Object.values(Section).map(s => <option key={s} value={s}>Sec {s}</option>)}
                </select>
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold rounded py-2 hover:bg-indigo-700">Add Student</button>
         </form>
      </div>

      {/* Manage Faculty */}
      {canManageFaculty && (
      <div className="bg-white rounded-xl shadow p-6">
         <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900"><UserPlus size={20}/> Add Faculty</h3>
         <form onSubmit={handleAddFaculty} className="space-y-4">
            <input required placeholder="Faculty Name" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} />
            <input required placeholder="Username (Login ID)" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newFaculty.username} onChange={e => setNewFaculty({...newFaculty, username: e.target.value})} />
            <input required placeholder="Password" type="password" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newFaculty.password} onChange={e => setNewFaculty({...newFaculty, password: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
                <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value as Department})} disabled={isHOD}>
                    {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={newFaculty.facultyRole} onChange={e => setNewFaculty({...newFaculty, facultyRole: e.target.value as FacultyRole})}>
                    {Object.values(FacultyRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold rounded py-2 hover:bg-indigo-700">Create Faculty</button>
         </form>

         {renderHODManage()}

         <div className="mt-8">
            <h4 className="font-bold text-gray-700 mb-2">Existing Faculty</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
               {visibleFaculty.map(f => (
                 <div key={f.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                    <span className="text-sm font-medium">{f.name} ({f.username}) - {f.department}</span>
                    {f.id !== user.id && (
                       <button onClick={() => removeFaculty(f.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                    )}
                 </div>
              ))}
            </div>
         </div>
      </div>
      )}

      {/* DELETE MODAL */}
      <DeleteConfirmationModal 
        isOpen={!!itemToDelete} 
        onClose={() => setItemToDelete(null)} 
        onConfirm={confirmDelete}
        title={`Delete ${itemToDelete?.type ? itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1) : ''}`}
        message={`Are you sure you want to remove this ${itemToDelete?.type}? This action cannot be undone.`}
      />
    </div>
  )};

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      {/* DELETE MODAL */}
      <DeleteConfirmationModal 
        isOpen={!!itemToDelete} 
        onClose={() => setItemToDelete(null)} 
        onConfirm={confirmDelete}
        title={`Delete ${itemToDelete?.type ? itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1) : ''}`}
        message={`Are you sure you want to remove this ${itemToDelete?.type}? This action cannot be undone.`}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Faculty Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user.name}</p>
        </div>
        <div className="flex flex-wrap bg-white rounded-lg p-1 shadow-sm border gap-1 w-full sm:w-auto">
           <button 
             onClick={() => setView('profile')} 
             className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'profile' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <UserIcon size={16} className="inline mr-2"/> Profile
           </button>
           {user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.WARDEN && (
              <button 
                onClick={() => setView('warden_hostel')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'warden_hostel' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Users size={16} className="inline mr-2"/> Hostel Students
              </button>
            )}
            {user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.OFFICE && (
              <button 
                onClick={() => setView('office_mgmt')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'office_mgmt' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Settings size={16} className="inline mr-2"/> Office Mgmt
              </button>
            )}
           <button 
             onClick={() => setView('home')} 
             className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'home' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <Activity size={16} className="inline mr-2"/> Home
           </button>
           {(user.role === UserRole.PRINCIPAL || (user.role === UserRole.FACULTY && (user as Faculty).facultyRole !== FacultyRole.WARDEN && (user as Faculty).facultyRole !== FacultyRole.OFFICE)) && (
             <button 
               onClick={() => { setView('students'); setSelectedDept(null); setSelectedYear(null); setSelectedSection(null); setSelectedStudent(null); }} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'students' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <Users size={16} className="inline mr-2"/> Students
             </button>
           )}
           {user.role === UserRole.FACULTY && (user as Faculty).facultyRole !== FacultyRole.WARDEN && (user as Faculty).facultyRole !== FacultyRole.OFFICE && (
             <button 
               onClick={() => { setView('no_dues'); setSelectedMapping(null); }} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'no_dues' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <FileCheck size={16} className="inline mr-2"/> No Dues
             </button>
           )}
           {user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD && (
             <button 
               onClick={() => setView('hall_tickets')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'hall_tickets' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <Ticket size={16} className="inline mr-2"/> Hall Tickets
             </button>
           )}
           {user.role === UserRole.FACULTY && (user as Faculty).facultyRole !== FacultyRole.WARDEN && (user as Faculty).facultyRole !== FacultyRole.OFFICE && (
             <button 
               onClick={() => setView('attendance')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'attendance' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <CheckCircle size={16} className="inline mr-2"/> Attendance
             </button>
           )}
           {(user.role === UserRole.PRINCIPAL || (user.role === UserRole.FACULTY && ((user as Faculty).facultyRole === FacultyRole.HOD || (user as Faculty).facultyRole === FacultyRole.WARDEN))) && (
             <button 
               onClick={() => setView('requests')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'requests' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <FileText size={16} className="inline mr-2"/> Requests
             </button>
           )}
           {user.role === UserRole.PRINCIPAL && (
             <button 
               onClick={() => setView('faculty_list')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'faculty_list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <Users size={16} className="inline mr-2"/> Faculty List
             </button>
           )}
           {user.role === UserRole.FACULTY && (user as Faculty).facultyRole === FacultyRole.HOD && (
             <>
               <button 
                 onClick={() => setView('subjects')} 
                 className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'subjects' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 <BookOpen size={16} className="inline mr-2"/> Subjects
               </button>
               <button 
                 onClick={() => setView('mappings')} 
                 className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'mappings' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 <MapPin size={16} className="inline mr-2"/> Mappings
               </button>
             </>
           )}
           {(user.role === UserRole.PRINCIPAL || (user.role === UserRole.FACULTY && (user as Faculty).facultyRole !== FacultyRole.WARDEN && (user as Faculty).facultyRole !== FacultyRole.OFFICE)) && (
             <button 
               onClick={() => setView('manage')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'manage' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <Users size={16} className="inline mr-2"/> Manage
             </button>
           )}
           <button 
             onClick={() => setView('ai_chat')} 
             className={`px-4 py-2 rounded-md text-sm font-medium transition flex-1 sm:flex-none ${view === 'ai_chat' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <MessageSquare size={16} className="inline mr-2"/> AI Chat
           </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

// 4. Student Dashboard
const StudentDashboard = ({ 
    user, submissions, facultyList, gatePassRequests, onUpload, onSendMessage, onSendGatePassRequest,
    studentSubjects, hallTicketRequests, setHallTicketRequests, showSuccess, showError
  }: { 
    user: Student, submissions: Submission[], facultyList: Faculty[], gatePassRequests: GatePassRequest[],
    onUpload: (sub: Submission) => void, onSendMessage: (toId: string, content: string) => void,
    onSendGatePassRequest: (req: GatePassRequest) => void,
    studentSubjects: StudentSubject[], hallTicketRequests: HallTicketRequest[], setHallTicketRequests: React.Dispatch<React.SetStateAction<HallTicketRequest[]>>,
    showSuccess: (msg: string) => void, showError: (msg: string) => void
  }) => {
  
  const [view, setView] = useState<'home' | 'requests' | 'no_dues'>('home');
  // FAB State
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [requestType, setRequestType] = useState<RequestType>(RequestType.GATE_PASS);
  const [requestReason, setRequestReason] = useState('');
  const [requestDate, setRequestDate] = useState('');
  
  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const req: GatePassRequest = {
      id: `req${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      type: requestType,
      reason: requestReason,
      date: requestDate,
      status: RequestStatus.PENDING,
      hodApproval: RequestStatus.PENDING,
      wardenApproval: requestType === RequestType.OUTPASS ? RequestStatus.PENDING : undefined,
      createdAt: new Date().toISOString(),
      department: user.department,
      collegeClass: user.collegeClass,
      section: user.section
    };
    onSendGatePassRequest(req);
    setShowRequestModal(false);
    setRequestReason('');
    setRequestDate('');
  };
  
  // Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<Submission['type']>('Assignment');
  const [uploadLink, setUploadLink] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  
  const [msgContent, setMsgContent] = useState('');
  const [msgRecipient, setMsgRecipient] = useState(facultyList[0]?.id || '');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    onUpload({
      id: `sub${Date.now()}`, 
      studentId: user.id, 
      title: uploadTitle, 
      type: uploadType,
      date: new Date().toISOString().split('T')[0], 
      fileName: uploadType === 'Link' ? '' : 'uploaded_file.pdf',
      link: uploadType === 'Link' ? uploadLink : undefined,
      description: uploadDescription
    });
    setUploadTitle(''); setUploadLink(''); setUploadDescription('');
    setShowUploadModal(false);
  };

  const handleSendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if(msgRecipient && msgContent) {
      onSendMessage(msgRecipient, msgContent);
      setMsgContent(''); setShowMessageModal(false);
    }
  };

  const renderRequests = () => {
    const myRequests = gatePassRequests.filter(r => r.studentId === user.id);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-900">My Requests</h2>
          <button onClick={() => setShowRequestModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-md">
            <Plus size={18} /> New Request
          </button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Reason</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">HOD Status</th>
                {user.residentialStatus === ResidentialStatus.HOSTELER && <th className="p-4 font-bold">Warden Status</th>}
                <th className="p-4 font-bold">Overall Status</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No requests found.</td></tr>
              )}
              {myRequests.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-gray-800">{r.type}</td>
                  <td className="p-4 text-gray-600 max-w-xs truncate">{r.reason}</td>
                  <td className="p-4 text-gray-600">{r.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      r.hodApproval === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' :
                      r.hodApproval === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{r.hodApproval}</span>
                  </td>
                  {user.residentialStatus === ResidentialStatus.HOSTELER && (
                    <td className="p-4">
                      {r.type === RequestType.OUTPASS ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          r.wardenApproval === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' :
                          r.wardenApproval === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{r.wardenApproval}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                  )}
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      r.status === RequestStatus.APPROVED ? 'bg-green-600 text-white' :
                      r.status === RequestStatus.REJECTED ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderNoDues = () => {
    const mySubjects = studentSubjects.filter(ss => ss.studentId === user.id);
    const allCleared = mySubjects.length > 0 && mySubjects.every(ss => ss.noDueStatus === NoDueStatus.APPROVED);
    const myHallTicketRequest = hallTicketRequests.find(req => req.studentId === user.id);

    const handleRequestHallTicket = async () => {
      if (!allCleared) {
        alert("You must clear all dues before requesting a hall ticket.");
        return;
      }
      const newReq: HallTicketRequest = {
        id: `htreq${Date.now()}`,
        studentId: user.id,
        studentName: user.name,
        department: user.department,
        collegeClass: user.collegeClass,
        section: user.section,
        status: RequestStatus.PENDING,
        createdAt: new Date().toISOString()
      };
      
      setHallTicketRequests([...hallTicketRequests, newReq]);
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-900">No Dues Clearance</h2>
          {myHallTicketRequest ? (
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg font-bold shadow-sm ${
                myHallTicketRequest.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' :
                myHallTicketRequest.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                Hall Ticket Status: {myHallTicketRequest.status}
              </div>
              {myHallTicketRequest.status === RequestStatus.APPROVED && (
                <button 
                  onClick={() => alert(`Downloading Hall Ticket for ${user.name}...\nSubjects:\n${mySubjects.map(s => `- ${s.subjectName} (${s.isArrear ? 'Arrear' : 'Current'})`).join('\n')}`)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-md"
                >
                  <FileText size={18} /> Download Hall Ticket
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={handleRequestHallTicket}
              disabled={!allCleared}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-md ${
                allCleared ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Ticket size={18} /> Request Hall Ticket
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                <th className="p-4 font-bold">Subject ID</th>
                <th className="p-4 font-bold">Subject Name</th>
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {mySubjects.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No subjects found.</td></tr>
              )}
              {mySubjects.map(ss => (
                <tr key={ss.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-600">{ss.subjectId}</td>
                  <td className="p-4 font-bold text-gray-800">{ss.subjectName}</td>
                  <td className="p-4 text-gray-600">{ss.isArrear ? 'Arrear' : 'Current'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ss.noDueStatus === NoDueStatus.APPROVED ? 'bg-green-100 text-green-700' :
                      ss.noDueStatus === NoDueStatus.DECLINED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ss.noDueStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const mySubmissions = submissions.filter(s => s.studentId === user.id);
  const data = [
    { name: 'Assignments', value: mySubmissions.filter(s => s.type === 'Assignment').length },
    { name: 'Projects', value: mySubmissions.filter(s => s.type === 'Project').length },
    { name: 'Certificates', value: mySubmissions.filter(s => s.type === 'Certificate').length },
    { name: 'Links', value: mySubmissions.filter(s => s.type === 'Link').length },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const pendingFeesTotal = user.fees?.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0) || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Student Portal</h1>
          <p className="text-gray-500">Roll number: {user.rollNo} | Dept: {user.department} (Sec {user.section})</p>
        </div>
        <div className="flex flex-wrap bg-white rounded-lg p-1 shadow-sm border gap-1">
          <button onClick={() => setView('home')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'home' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Dashboard</button>
          <button onClick={() => setView('requests')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'requests' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Requests</button>
          <button onClick={() => setView('no_dues')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'no_dues' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>No Dues</button>
        </div>
        <div className="flex items-center gap-4">
           {pendingFeesTotal > 0 ? (
             <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm">
               <AlertCircle size={20} /> Pending Fees: ₹{pendingFeesTotal.toLocaleString()}
             </div>
           ) : (
             <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm">
               <CheckCircle size={20} /> All Fees Paid
             </div>
           )}
        </div>
      </div>

      {view === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-xl p-6 border-t-4 border-indigo-600">
          <div className="flex flex-col items-center pb-6 border-b">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-3xl mb-4 shadow-inner">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-indigo-600 font-medium">{user.department} • {user.collegeClass}</p>
            <div className="mt-2 flex gap-2">
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold">Section {user.section}</span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-bold">Active</span>
            </div>
          </div>
          <div className="mt-6 space-y-4">
             <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100">
                <p className="font-bold text-xs uppercase text-gray-400 mb-2 flex items-center gap-2"><UserIcon size={14}/> About Me</p>
                <p className="italic">"{user.bio || 'I am a dedicated student pursuing my degree with passion.'}"</p>
             </div>
             <div className="space-y-2">
               <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-lg text-sm text-gray-700">
                 <Mail size={16} className="text-indigo-500"/> {user.email}
               </div>
               <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-lg text-sm text-gray-700">
                 <Phone size={16} className="text-indigo-500"/> {user.phone}
               </div>
             </div>
             <div className="pt-4 border-t space-y-3">
               <div className="flex justify-between items-center">
                 <span className="text-gray-500 text-sm font-medium">Attendance</span>
                 <div className="flex items-center gap-2">
                   <div className="w-24 bg-gray-200 rounded-full h-2">
                     <div className="bg-green-500 h-2 rounded-full" style={{ width: `${user.attendance}%` }}></div>
                   </div>
                   <span className="font-bold text-green-600 text-sm">{user.attendance}%</span>
                 </div>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-500 text-sm font-medium">Performance</span>
                 <div className="flex items-center gap-2">
                   <div className="w-24 bg-gray-200 rounded-full h-2">
                     <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${user.performanceScore}%` }}></div>
                   </div>
                   <span className="font-bold text-blue-600 text-sm">{user.performanceScore}/100</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="lg:col-span-2 space-y-6">
            {/* Academic & Internal Marks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-900"><Activity size={18}/> Internal Assessment</h3>
                  <div className="space-y-4">
                     {user.internalMarks?.map((m, i) => (
                       <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{m.subject}</span>
                            <span className="font-bold text-indigo-600">{m.marks}/{m.total}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                             <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(m.marks/m.total)*100}%` }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-900"><CheckCircle size={18}/> Fees & Payments</h3>
                  <div className="space-y-3">
                     {user.fees?.map((f, i) => (
                       <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <p className="font-bold text-sm text-gray-800">{f.description}</p>
                            <p className="text-[10px] text-gray-400">{f.date || 'Due Soon'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-600 text-sm">₹{f.amount.toLocaleString()}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${f.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {f.status}
                            </span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Results & Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-900"><FileText size={18}/> Semester Performance</h3>
                  <div className="space-y-4">
                     {user.results?.map((r, i) => (
                       <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition">
                          <div className="flex justify-between items-center mb-3">
                             <span className="font-bold text-gray-800">{r.semester}</span>
                             <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">GPA: {r.gpa}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             {r.subjects.map((s, si) => (
                               <div key={si} className="flex justify-between text-[11px] bg-white p-2 rounded border border-gray-100">
                                 <span className="text-gray-500 truncate mr-1">{s.name}</span>
                                 <span className="font-bold text-blue-700">{s.grade}</span>
                               </div>
                             ))}
                          </div>
                          <button className="w-full mt-3 text-xs text-blue-600 font-bold flex items-center justify-center gap-1 hover:underline">
                            <Upload size={12}/> Download Result Copy
                          </button>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-orange-900"><Folder size={18}/> Original Documents (Scanned)</h3>
                  <div className="grid grid-cols-2 gap-3">
                     {user.documents?.map((d, i) => (
                       <div key={i} className="group p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center hover:bg-white hover:border-orange-300 transition cursor-pointer">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-2 group-hover:scale-110 transition">
                            <FileText size={24} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 line-clamp-1">{d.name}</span>
                          <span className="text-[10px] text-gray-400 mt-1">{d.type} File</span>
                          <button className="mt-2 text-[10px] bg-orange-600 text-white px-3 py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition">View Copy</button>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText size={18}/> Submission History</h3>
              <div className="flex flex-col md:flex-row">
                 <div className="flex-1 space-y-3 max-h-60 overflow-y-auto pr-2">
                    {mySubmissions.length === 0 && <p className="text-gray-400 text-sm">No submissions yet. Use the + button.</p>}
                    {mySubmissions.map(s => (
                      <div key={s.id} className="flex justify-between items-start p-3 bg-gray-50 rounded border border-gray-100 mb-2">
                         <div className="flex-1 overflow-hidden">
                           <p className="font-medium text-gray-800 truncate">{s.title}</p>
                           <p className="text-xs text-gray-500">{s.type} • {s.date}</p>
                           {s.description && <p className="text-xs text-gray-600 mt-1 italic">"{s.description}"</p>}
                           {s.link && <a href={s.link} target="_blank" className="text-xs text-blue-500 underline block truncate mt-1">{s.link}</a>}
                         </div>
                         <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap ml-2">Submitted</span>
                      </div>
                    ))}
                 </div>
                 <div className="w-full md:w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={data} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                           {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                         </Pie>
                         <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center text-xs text-gray-400">Activity</p>
                 </div>
              </div>
            </div>
        </div>
      </div>
      )}
      {view === 'requests' && renderRequests()}
      {view === 'no_dues' && renderNoDues()}

      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end z-40">
        {showFabMenu && (
          <div className="mb-4 space-y-2 flex flex-col items-end animate-fade-in-up">
             <button onClick={() => { setShowRequestModal(true); setShowFabMenu(false); }} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50">
                Request <FileText size={18} className="text-purple-500"/>
             </button>
             <button onClick={() => { setShowMessageModal(true); setShowFabMenu(false); }} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50">
                Message Faculty <MessageSquare size={18} className="text-blue-500"/>
             </button>
             <button onClick={() => { setShowUploadModal(true); setShowFabMenu(false); }} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50">
                Upload Submission <Upload size={18} className="text-green-500"/>
             </button>
          </div>
        )}
        <button onClick={() => setShowFabMenu(!showFabMenu)} className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform ${showFabMenu ? 'bg-gray-700 rotate-45' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          <Plus size={28} />
        </button>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-lg">New Request</h3>
              <button onClick={() => setShowRequestModal(false)}><X/></button>
            </div>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Request Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-sm text-gray-700">
                    <input type="radio" name="reqType" value={RequestType.GATE_PASS} checked={requestType === RequestType.GATE_PASS} onChange={() => setRequestType(RequestType.GATE_PASS)} /> Gate Pass
                  </label>
                  {user.residentialStatus === ResidentialStatus.HOSTELER && (
                    <label className="flex items-center gap-1 text-sm text-gray-700">
                      <input type="radio" name="reqType" value={RequestType.OUTPASS} checked={requestType === RequestType.OUTPASS} onChange={() => setRequestType(RequestType.OUTPASS)} /> Outpass
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Date</label>
                <input required type="date" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={requestDate} onChange={e => setRequestDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Reason</label>
                <textarea required className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded h-24" placeholder="Explain why you need this pass..." value={requestReason} onChange={e => setRequestReason(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded py-3 hover:bg-indigo-700 transition shadow-lg">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">New Submission</h3><button onClick={() => setShowUploadModal(false)}><X/></button></div>
              <form onSubmit={handleUpload} className="space-y-4">
                 <input required className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" placeholder="Title" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}/>
                 
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Submission Type</label>
                    <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={uploadType} onChange={e => setUploadType(e.target.value as any)}>
                        <option value="Assignment">Assignment</option>
                        <option value="Project">Project</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Link">Link / URL</option>
                    </select>
                 </div>

                 {uploadType === 'Link' ? (
                    <div className="animate-fade-in space-y-4">
                        <input required type="url" className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" placeholder="https://..." value={uploadLink} onChange={e => setUploadLink(e.target.value)}/>
                        <textarea className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded h-20" placeholder="Description of your submission..." value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} />
                    </div>
                 ) : (
                    <div className="animate-fade-in space-y-4">
                        <input type="file" className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                        <textarea className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded h-20" placeholder="Optional Description..." value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} />
                    </div>
                 )}

                 <button className="w-full bg-indigo-600 text-white py-2 rounded font-bold">Submit</button>
              </form>
           </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Send Message</h3><button onClick={() => setShowMessageModal(false)}><X/></button></div>
              <form onSubmit={handleSendMsg} className="space-y-4">
                 <label className="text-sm font-bold text-gray-500">To Faculty</label>
                 <select className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded" value={msgRecipient} onChange={e => setMsgRecipient(e.target.value)}>
                    {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                 </select>
                 <textarea required className="w-full bg-white text-gray-900 border border-gray-300 p-2 rounded h-24" placeholder="Your message..." value={msgContent} onChange={e => setMsgContent(e.target.value)}/>
                 <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Send</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};


// 6. Main App Shell
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [facultyList, setFacultyList] = useState<any[]>(MOCK_FACULTY);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [gatePassRequests, setGatePassRequests] = useState<GatePassRequest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<StudentSubject[]>(MOCK_STUDENT_SUBJECTS);
  const [hallTicketRequests, setHallTicketRequests] = useState<HallTicketRequest[]>(MOCK_HALL_TICKETS);
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [facultyMappings, setFacultyMappings] = useState<FacultyClassMapping[]>(MOCK_MAPPINGS);
  const [classAdvisors, setClassAdvisors] = useState<ClassAdvisorMapping[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  useEffect(() => {
    // Reverted to mock data only
  }, []);

  useEffect(() => {
    // Reverted to mock data only
  }, [user]);

  const handleSendMessage = (toId: string, content: string) => {
    if(!user) return;
    const msg: Message = {
      id: `m${Date.now()}`, fromId: user.id, toId, content, timestamp: new Date().toISOString(), senderName: user.name
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleSendGatePassRequest = async (req: GatePassRequest) => {
    setGatePassRequests(prev => [...prev, req]);
  };

  const handleLogout = () => setUser(null);

  if (!user) return <Login onLogin={setUser} facultyList={facultyList} studentList={students} principal={MOCK_PRINCIPAL} showSuccess={showSuccess} showError={showError} onRequestSignup={async (req) => {
    setPendingRequests(prev => [...prev, req]);
    showSuccess("Signup Request Sent (Mock)");
  }} />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">M</div>
            <span className="font-bold text-xl tracking-tight text-indigo-900">Performance Analyser</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <main>
        {successMessage && (
          <div className="fixed top-20 right-4 z-50 animate-fade-in-up">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2">
              <CheckCircle size={20} />
              <span className="font-bold">{successMessage}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="fixed top-20 right-4 z-50 animate-fade-in-up">
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="font-bold">{errorMessage}</span>
            </div>
          </div>
        )}

        {user.role === UserRole.FACULTY || user.role === UserRole.PRINCIPAL || user.role === UserRole.WARDEN ? (
          <FacultyDashboard 
            user={user as Faculty | Principal} 
            students={students} 
            submissions={submissions}
            facultyList={facultyList}
            pendingRequests={pendingRequests}
            gatePassRequests={gatePassRequests}
            messages={messages}
            setStudents={setStudents}
            setFacultyList={setFacultyList}
            setPendingRequests={setPendingRequests}
            setGatePassRequests={setGatePassRequests}
            setUser={setUser}
            studentSubjects={studentSubjects}
            setStudentSubjects={setStudentSubjects}
            hallTicketRequests={hallTicketRequests}
            setHallTicketRequests={setHallTicketRequests}
            subjects={subjects}
            setSubjects={setSubjects}
            facultyMappings={facultyMappings}
            setFacultyMappings={setFacultyMappings}
            classAdvisors={classAdvisors}
            setClassAdvisors={setClassAdvisors}
            transactions={transactions}
            setTransactions={setTransactions}
            showSuccess={showSuccess}
            showError={showError}
          />
        ) : (
          <StudentDashboard 
            user={user as Student} 
            submissions={submissions}
            facultyList={facultyList}
            gatePassRequests={gatePassRequests}
            onUpload={(sub) => setSubmissions([...submissions, sub])}
            onSendMessage={handleSendMessage}
            onSendGatePassRequest={handleSendGatePassRequest}
            studentSubjects={studentSubjects}
            hallTicketRequests={hallTicketRequests}
            setHallTicketRequests={setHallTicketRequests}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}
      </main>
    </div>
  );
}