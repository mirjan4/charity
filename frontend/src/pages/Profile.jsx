import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { User, Smartphone, Lock, Save, Key } from "lucide-react";

export default function Profile() {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        username: user?.username || "",
        password: "",
        password_confirmation: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password.length < 4) {
             return toast.error("Password must be at least 4 characters");
        }
        if (formData.password !== formData.password_confirmation) {
            return toast.error("Passwords do not match");
        }

        setLoading(true);
        try {
            const { data } = await api.post("/profile/update", formData);
            setUser(data.user);
            toast.success("Profile updated successfully");
            setFormData(prev => ({ ...prev, password: "", password_confirmation: "" }));
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-slate-500 font-medium">Manage your personal identity and security</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-8 space-y-8">
                        {/* Name & Username Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    <User size={14} className="text-primary-500" /> Full Name
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    className="input-field !bg-slate-50/50 border-transparent focus:border-primary-500 focus:bg-white transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    <Smartphone size={14} className="text-primary-500" /> Username (Phone)
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    className="input-field !bg-slate-50/50 border-transparent focus:border-primary-500 focus:bg-white transition-all"
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        {/* Security Section */}
                        <div className="space-y-6">
                            <h3 className="flex items-center gap-3 text-sm font-black text-slate-800 uppercase tracking-tight">
                                <Key size={18} className="text-indigo-500" /> Password Updates
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        <Lock size={14} className="text-indigo-500" /> New Password
                                    </label>
                                    <input 
                                        type="password" 
                                        placeholder="Leave blank to keep current"
                                        className="input-field !bg-slate-50/50 border-transparent focus:border-indigo-500 focus:bg-white transition-all"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Confirm New Password
                                    </label>
                                    <input 
                                        type="password" 
                                        className="input-field !bg-slate-50/50 border-transparent focus:border-indigo-500 focus:bg-white transition-all"
                                        value={formData.password_confirmation}
                                        onChange={e => setFormData({...formData, password_confirmation: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-[10px] font-bold text-slate-400 max-w-[200px]">
                            Last updated identity syncs across the whole platform
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn-primary py-3.5 px-10 rounded-2xl shadow-lg shadow-primary-200 flex items-center gap-3 font-black uppercase text-xs tracking-widest group"
                        >
                            {loading ? "Saving Changes..." : "Update Account"}
                            <Save size={18} className={`${loading ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`} />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
