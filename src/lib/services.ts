import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  addDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  Employee, 
  Department, 
  JobTitle, 
  Shift, 
  Attendance, 
  LeaveRequest, 
  Payslip,
  DepartmentSettings,
  SalesBonusConfig
} from '../types';

// Generic service for common operations
const createService = <T extends { id?: string }>(collectionName: string) => {
  return {
    getAll: async () => {
      try {
        await auth.authStateReady();
        const q = query(collection(db, collectionName));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as T);
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error(JSON.stringify({
            error: error.message,
            operationType: 'list',
            path: collectionName,
            authInfo: {
              userId: auth.currentUser?.uid || 'anonymous',
              email: auth.currentUser?.email || '',
              emailVerified: auth.currentUser?.emailVerified || false,
              isAnonymous: auth.currentUser?.isAnonymous || true,
              providerInfo: auth.currentUser?.providerData.map(p => ({
                providerId: p.providerId,
                displayName: p.displayName || '',
                email: p.email || '',
              })) || []
            }
          }));
        }
        throw error;
      }
    },
    getById: async (id: string) => {
      try {
        await auth.authStateReady();
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? ({ ...docSnap.data(), id: docSnap.id } as T) : null;
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error(JSON.stringify({
            error: error.message,
            operationType: 'get',
            path: `${collectionName}/${id}`,
            authInfo: {
              userId: auth.currentUser?.uid || 'anonymous',
              email: auth.currentUser?.email || '',
              emailVerified: auth.currentUser?.emailVerified || false,
              isAnonymous: auth.currentUser?.isAnonymous || true,
              providerInfo: auth.currentUser?.providerData.map(p => ({
                providerId: p.providerId,
                displayName: p.displayName || '',
                email: p.email || '',
              })) || []
            }
          }));
        }
        throw error;
      }
    },
    create: async (data: T, customId?: string) => {
      try {
        if (customId) {
          await setDoc(doc(db, collectionName, customId), data);
          return customId;
        }
        const { id, ...dataToSave } = data as any;
        const docRef = await addDoc(collection(db, collectionName), dataToSave);
        return docRef.id;
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error(JSON.stringify({
            error: error.message,
            operationType: 'create',
            path: collectionName,
            authInfo: {
              userId: auth.currentUser?.uid || 'anonymous',
              email: auth.currentUser?.email || '',
              emailVerified: auth.currentUser?.emailVerified || false,
              isAnonymous: auth.currentUser?.isAnonymous || true,
              providerInfo: auth.currentUser?.providerData.map(p => ({
                providerId: p.providerId,
                displayName: p.displayName || '',
                email: p.email || '',
              })) || []
            }
          }));
        }
        throw error;
      }
    },
    update: async (id: string, data: Partial<T>) => {
      const docRef = doc(db, collectionName, id);
      try {
        await updateDoc(docRef, data as any);
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error(JSON.stringify({
            error: error.message,
            operationType: 'update',
            path: `${collectionName}/${id}`,
            authInfo: {
              userId: auth.currentUser?.uid || 'anonymous',
              email: auth.currentUser?.email || '',
              emailVerified: auth.currentUser?.emailVerified || false,
              isAnonymous: auth.currentUser?.isAnonymous || true,
              providerInfo: auth.currentUser?.providerData.map(p => ({
                providerId: p.providerId,
                displayName: p.displayName || '',
                email: p.email || '',
              })) || []
            }
          }));
        }
        throw error;
      }
    },
    delete: async (id: string) => {
      const docRef = doc(db, collectionName, id);
      try {
        await deleteDoc(docRef);
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error(JSON.stringify({
            error: error.message,
            operationType: 'delete',
            path: `${collectionName}/${id}`,
            authInfo: {
              userId: auth.currentUser?.uid || 'anonymous',
              email: auth.currentUser?.email || '',
              emailVerified: auth.currentUser?.emailVerified || false,
              isAnonymous: auth.currentUser?.isAnonymous || true,
              providerInfo: auth.currentUser?.providerData.map(p => ({
                providerId: p.providerId,
                displayName: p.displayName || '',
                email: p.email || '',
              })) || []
            }
          }));
        }
        throw error;
      }
    }
  };
};

export const employeeService = {
  ...createService<Employee>('employees'),
  getCount: async () => {
    const snapshot = await getDocs(collection(db, 'employees'));
    return snapshot.size;
  }
};

export const departmentService = createService<Department>('departments');
export const jobTitleService = createService<JobTitle>('jobTitles');
export const shiftService = createService<Shift>('shifts');
export const attendanceService = {
  ...createService<Attendance>('attendance'),
  getByDate: async (date: string) => {
    const q = query(collection(db, 'attendance'), where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Attendance);
  },
  getByEmployeeForMonth: async (employeeId: string, month: string) => {
    // month format YYYY-MM
    const q = query(
      collection(db, 'attendance'), 
      where('employeeId', '==', employeeId),
      where('date', '>=', `${month}-01`),
      where('date', '<=', `${month}-31`)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Attendance);
  }
};

export const leaveService = {
  ...createService<LeaveRequest>('leaveRequests'),
  getPending: async () => {
    const q = query(collection(db, 'leaveRequests'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as LeaveRequest);
  }
};

export const payrollService = createService<Payslip>('payslips');
export const salesBonusService = createService<SalesBonusConfig>('salesBonusConfigs');
export const companySettingsService = createService<any>('companySettings');
export const departmentSettingsService = {
  ...createService<DepartmentSettings>('departmentSettings'),
  getByMonthAndDept: async (month: string, departmentId: string) => {
    const q = query(
      collection(db, 'departmentSettings'), 
      where('month', '==', month),
      where('departmentId', '==', departmentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0 ? ({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as DepartmentSettings) : null;
  }
};
