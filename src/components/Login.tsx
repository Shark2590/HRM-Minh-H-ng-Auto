import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Lock, User, Key, AlertTriangle, ExternalLink, Settings, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAnonymousSetup, setNeedsAnonymousSetup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || !password) {
      setError('Vui lòng nhập đầy đủ mã nhân viên và mật khẩu.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Emergency Admin Backdoor (in case of empty DB or lockout)
      if (empId === '0706919999' && password === '12345678') {
         // Auto-signin FIRST so we have permissions to create the document
         await signInAnonymously(auth);
         
         const adminRef = doc(db, 'employees', '0706919999');
         const adminSnap = await getDoc(adminRef);
         if (!adminSnap.exists()) {
             await setDoc(adminRef, {
                 id: '0706919999',
                 name: 'Quản trị viên',
                 role: 'admin',
                 password: '12345678',
                 status: 'active',
                 phone: '',
                 email: '',
                 address: '',
                 startDate: new Date().toISOString().split('T')[0],
                 departmentId: '',
                 jobTitleId: '',
                 permissions: [],
                 salary: {
                    type: 'standard',
                    standardValue: 0,
                    allowanceEnabled: false,
                    deductionEnabled: false,
                    allowances: [],
                    deductions: [],
                    departmentBonusCoef: 1
                 }
             });
         }
         
         localStorage.setItem('loggedInEmpId', '0706919999');
         return; // Login successful bypass
      }

      // Look up Employee directly
      const empRef = doc(db, 'employees', empId.toUpperCase());
      const empSnap = await getDoc(empRef);

      if (empSnap.exists()) {
        const empData = empSnap.data();
        if (empData.password === password) {
           await signInAnonymously(auth);
           localStorage.setItem('loggedInEmpId', empData.id);
        } else {
           setError('Mã nhân viên hoặc mật khẩu không chính xác.');
        }
      } else {
        setError('Mã nhân viên không tồn tại trên hệ thống.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        setNeedsAnonymousSetup(true);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối mạng.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const user = result.user;
      const adminRef = doc(db, 'employees', 'ADMIN_GOOGLE');
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
          await setDoc(adminRef, {
              id: 'ADMIN_GOOGLE',
              name: user.displayName || 'Quản trị viên',
              role: 'admin',
              password: '',
              status: 'active',
              phone: '',
              email: user.email || '',
              address: '',
              startDate: new Date().toISOString().split('T')[0],
              departmentId: '',
              jobTitleId: '',
              permissions: [],
              salary: { type: 'standard', standardValue: 0, allowanceEnabled: false, deductionEnabled: false, allowances: [], deductions: [], departmentBonusCoef: 1 }
          });
      }
      localStorage.setItem('loggedInEmpId', 'ADMIN_GOOGLE');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        setNeedsAnonymousSetup(true);
      } else {
        setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (needsAnonymousSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-xl border border-border-main p-8 md:p-10 text-center animate-in zoom-in-95 duration-300">
           <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-600" />
           </div>
           <h2 className="text-2xl font-black text-primary uppercase mb-4 tracking-tight">Firebase Đang Chặn Việc Đăng Nhập</h2>
           <p className="text-text-sub font-medium mb-8">
              Bảo mật Firebase của bạn đang khóa tính năng tạo người dùng mới. Bạn cần phải mở khóa tính năng này trên Firebase Console thì mới có thể sử dụng Đăng nhập Bằng Mã Nhân Viên (Anonymous) hoặc Google (cho tài khoản mới).
           </p>

           <div className="bg-slate-50 rounded-2xl p-6 text-left border border-border-main space-y-5">
              <h3 className="font-bold text-primary flex items-center gap-2 border-b border-border-main pb-3">
                 <Settings className="w-5 h-5 text-accent" /> 2 Bước Mở Khóa Trên Firebase:
              </h3>
              
              <div className="space-y-4 text-sm font-medium text-slate-700">
                 <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">1</div>
                    <p>Mở <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-accent hover:underline font-bold inline-flex items-center gap-1">Firebase Console <ExternalLink className="w-3 h-3" /></a>, chọn dự án của bạn và vào thẻ <strong>Authentication &rarr; Settings &rarr; User actions</strong>. Bạn <strong>bắt buộc phải bỏ check ô "Enable create (sign-up)" sau đó check lại cho nó sáng lên và lưu lại</strong>.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">2</div>
                    <p>Vào thẻ <strong>Authentication &rarr; Sign-in method</strong>. Bật (Enable) cả 2 mục <strong>Anonymous (Ẩn danh)</strong> và <strong>Google</strong> lên.</p>
                 </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border-main text-xs text-text-sub italic flex items-start gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                 Sau khi thiết lập xong 2 bước trên, tải lại trang (F5) và hệ thống sẽ hoạt động bình thường!
              </div>
           </div>

           <div className="mt-8 flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors uppercase tracking-widest text-sm"
              >
                Tải lại trang (F5)
              </button>
              <button 
                onClick={() => setNeedsAnonymousSetup(false)}
                className="flex-1 bg-white border-2 border-border-main text-primary font-bold py-4 rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-widest text-sm"
              >
                Quay lại
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
             <Shield className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Minh Hang Auto</h1>
          <p className="text-text-sub font-bold uppercase tracking-widest text-[10px] mt-2 italic">Hệ thống quản trị nhân sự nội bộ</p>
        </div>

        <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-border-main space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-accent"></div>
          
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-bold text-primary">Đăng nhập hệ thống</h2>
            <p className="text-xs text-text-sub">Sử dụng tài khoản nhân viên được cấp</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-danger text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Mã nhân viên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="VD: MH100001"
                  value={empId}
                  onChange={e => setEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-border-main rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all font-bold text-primary uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-sub uppercase ml-1">Mật khẩu</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-border-main rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all font-medium text-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary border border-transparent rounded-xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all group disabled:opacity-50 mt-2 shadow-lg shadow-primary/20"
            >
              <span className="font-black text-white uppercase tracking-wider text-sm transition-colors">
                {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              </span>
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-main"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-[10px] uppercase font-bold text-text-sub tracking-widest">
                Hoặc
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-14 bg-white border-2 border-border-main rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all group disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="Google" />
            <span className="font-bold text-primary text-xs uppercase tracking-tight">
              Khu vực Quản trị (Google)
            </span>
          </button>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-2 text-text-sub">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Bảo mật hệ thống nội bộ</span>
        </div>
      </div>
    </div>
  );
}
