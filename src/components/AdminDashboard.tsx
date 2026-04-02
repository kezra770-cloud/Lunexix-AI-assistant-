import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Settings, Search, Trash2, Edit2, Check, X, User } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion } from 'motion/react';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('user');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push(doc.data() as UserData);
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: editRole
      });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: editRole } : u));
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this user's data? This cannot be undone.")) return;
    try {
      // Note: This only deletes the user document, not their subcollections or Firebase Auth account.
      // A full deletion would require a Cloud Function.
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            Admin Dashboard
          </h2>
          <p className="text-slate-400 mt-2">Manage users and platform settings.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{users.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Users</div>
            </div>
          </div>
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-2xl font-bold text-white">Active</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">System Status</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">User Management</h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-500 uppercase bg-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <span className="font-medium text-white">{user.displayName || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      {editingUser === user.uid ? (
                        <select 
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-sm text-white"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {user.role || 'user'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingUser === user.uid ? (
                          <>
                            <button onClick={() => handleUpdateRole(user.uid)} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingUser(null)} className="p-1.5 text-slate-400 hover:bg-white/10 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setEditingUser(user.uid); setEditRole(user.role || 'user'); }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              disabled={user.uid === auth.currentUser?.uid} // Prevent editing own role easily
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.uid)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              disabled={user.uid === auth.currentUser?.uid}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
