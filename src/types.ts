export type SalaryType = 'shift' | 'hourly' | 'standard';
export type AllowanceType = 'daily' | 'monthly';
export type DeductionType = 'per_time' | 'monthly';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early' | 'leave' | 'unauthorized_absent';
export type Role = 'admin' | 'manager' | 'staff';

export interface Allowance {
  id: string;
  name: string;
  type: AllowanceType;
  amount: number;
}

export interface Deduction {
  id: string;
  name: string;
  type: DeductionType;
  amount: number;
}

export interface EmployeeAllowance {
  id: string;
  name: string; // e.g., 'Ăn trưa'
  type: 'daily' | 'monthly';
  amount: number;
}

export interface EmployeeDeduction {
  id: string;
  name: string; // e.g., 'Đi muộn', 'BHXH', 'Không mặc đồng phục'
  type: 'per_time' | 'monthly';
  amount: number;
}

export interface AssignedShift {
  shiftId: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
}

export interface Employee {
  id: string; // MH100001
  name: string;
  phone: string;
  email: string;
  address: string;
  password?: string;
  status: 'active' | 'inactive';
  startDate: string; // ISO string
  departmentId: string;
  jobTitleId: string;
  role?: Role;
  permissions?: string[];
  assignedShifts?: AssignedShift[]; // Shifts assigned to employee with specific days
  salary: {
    type: SalaryType;
    shiftValue: number;
    hourlyValue: number;
    standardValue: number; // monthly
    departmentBonusCoef: number; // 1 to 10
    allowanceEnabled: boolean;
    deductionEnabled: boolean;
    allowances: EmployeeAllowance[];
    deductions: EmployeeDeduction[];
  };
}

export interface Department {
  id: string;
  name: string;
  kpiBonus: number; // Default KPI bonus for this dept
}

export interface JobTitle {
  id: string;
  name: string;
  responsibilityBonus: number; // Percentage of department revenue
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  bufferMinutes: number; // Minutes before shift start allowed for check-in
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftId: string;
  clockIn?: string; // HH:mm
  clockOut?: string; // HH:mm
  status: AttendanceStatus;
  isOvertime: boolean;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftIds: string[];
  status: LeaveStatus;
  notes?: string;
  createdAt: string;
}

export interface PayrollPeriod {
  id: string;
  month: string; // YYYY-MM
  status: 'draft' | 'finalized';
}

export interface DepartmentSettings {
  id: string; // YYYY-MM_deptId
  month: string;
  departmentId: string;
  revenue: number;
  kpiBonus: number;
  tetBonusAmount?: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  periodId: string;
  baseSalary: number;
  allowanceTotal: number;
  deductionTotal: number;
  attendancePenalty: number; // Unapproved leave
  seniorityBonus: number;
  tetBonus: number;
  salesBonus: number;
  bonus: number; // Half of tet bonus distributed
  totalSalary: number;
}

export interface SalesBonusConfig {
  id: string;
  minSales: number;
  maxSales: number;
  bonusRate: number; // percentage
}

export interface CompanySettings {
  id: string; // 'general'
  lateCheckInMessage?: string;
  allowedLocation?: {
    lat: number;
    lng: number;
    radius: number; // default 200m
  };
}
