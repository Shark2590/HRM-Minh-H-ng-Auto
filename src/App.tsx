/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { employeeService } from './lib/services';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './components/Login';
import Employees from './pages/hr/Employees';
import AddEmployee from './pages/hr/AddEmployee';
import Departments from './pages/hr/Departments';
import JobTitles from './pages/hr/JobTitles';
import EmployeeSettings from './pages/hr/EmployeeSettings';
import AttendanceCheckIn from './pages/attendance/AttendanceCheckIn';
import AttendanceTable from './pages/attendance/AttendanceTable';
import EmployeeShifts from './pages/attendance/EmployeeShifts';
import AttendanceSettings from './pages/attendance/AttendanceSettings';
import Payslips from './pages/payroll/Payslips';
import SalesBonus from './pages/payroll/SalesBonus';
import PayrollSettings from './pages/payroll/PayrollSettings';
import LeaveManagement from './pages/leave/LeaveManagement';
import GeneralSettings from './pages/Settings';
import Profile from './pages/Profile';

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('employee');
  const [loading, setLoading] = useState(true);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
         const empId = localStorage.getItem('loggedInEmpId');
         if (empId === 'ADMIN_GOOGLE' || empId === '0706919999') {
             setUserRole('admin');
         } else if (empId) {
             try {
                const emp = await employeeService.getById(empId);
                if (emp) setUserRole(emp.role);
             } catch (e) {
                console.error(e);
             }
         }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';

  const renderContent = () => {
    switch (currentPath) {
      case '/': return <Dashboard />;
      case '/profile': return <Profile />;
      
      // Features for everyone:
      case '/attendance/check-in': return <AttendanceCheckIn />;
      case '/attendance/employee-shifts': return <EmployeeShifts />;
      case '/payroll/payslips': return <Payslips />;
      case '/leave': return <LeaveManagement />;

      // Protected features:
      case '/hr/employees': 
        return isManagerOrAdmin ? <Employees 
          onAddEmployee={() => { setEditingEmployeeId(null); setCurrentPath('/hr/add'); }} 
          onEditEmployee={(id) => { setEditingEmployeeId(id); setCurrentPath('/hr/add'); }} 
        /> : <Dashboard />;
      case '/hr/add': return isManagerOrAdmin ? <AddEmployee editingEmployeeId={editingEmployeeId} onSaved={() => { setEditingEmployeeId(null); setCurrentPath('/hr/employees'); }} /> : <Dashboard />;
      case '/hr/departments': return isManagerOrAdmin ? <Departments /> : <Dashboard />;
      case '/hr/job-titles': return isManagerOrAdmin ? <JobTitles /> : <Dashboard />;
      case '/hr/settings': return isManagerOrAdmin ? <EmployeeSettings /> : <Dashboard />;
      case '/attendance/table': return isManagerOrAdmin ? <AttendanceTable /> : <Dashboard />;
      case '/attendance/settings': return isManagerOrAdmin ? <AttendanceSettings /> : <Dashboard />;
      case '/payroll/sales-bonus': return isManagerOrAdmin ? <SalesBonus /> : <Dashboard />;
      case '/payroll/settings': return isManagerOrAdmin ? <PayrollSettings /> : <Dashboard />;
      case '/settings': return isManagerOrAdmin ? <GeneralSettings /> : <Dashboard />;
      
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
      {renderContent()}
    </Layout>
  );
}

