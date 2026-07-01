import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Users, FileText, BarChart2, ShieldOff, Shield, EyeOff, Eye } from 'lucide-react';

const API = 'http://localhost:5000/api';

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
    status: 'active' | 'blocked';
    createdAt: string;
    stats: { totalTaught: number; totalLearned: number; averageRating: number };
}

interface Post {
    _id: string;
    title: string;
    author: { _id: string; username: string; email: string };
    status: string;
    isHidden: boolean;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    blockedUsers: number;
    totalPosts: number;
    hiddenPosts: number;
    totalSessions: number;
    completedSessions: number;
}

export default function AdminPage() {
    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const [tab, setTab] = useState<'stats' | 'users' | 'posts'>('stats');
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (tab === 'stats') fetchStats();
        if (tab === 'users') fetchUsers();
        if (tab === 'posts') fetchPosts();
    }, [tab]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/admin/stats`, { headers });
            setStats(res.data.stats);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/admin/users`, { headers });
            setUsers(res.data.users);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/admin/posts`, { headers });
            setPosts(res.data.posts);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleBlockUser = async (userId: string) => {
        try {
            const res = await axios.put(`${API}/admin/users/${userId}/block`, {}, { headers });
            setSuccess(res.data.message);
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Lỗi hệ thống');
        }
    };

    const handleHidePost = async (postId: string) => {
        try {
            const res = await axios.put(`${API}/admin/posts/${postId}/hide`, {}, { headers });
            setSuccess(res.data.message);
            fetchPosts();
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Lỗi hệ thống');
        }
    };

    const initials = (name: string) => name.slice(0, 2).toUpperCase();

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 w-fit">
                {(['stats', 'users', 'posts'] as const).map(t => (
                    <button key={t}
                        onClick={() => { setTab(t); setSuccess(''); setError(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        {t === 'stats' ? <><BarChart2 className="w-4 h-4" /> Thống kê</>
                            : t === 'users' ? <><Users className="w-4 h-4" /> Người dùng</>
                            : <><FileText className="w-4 h-4" /> Bài đăng</>}
                    </button>
                ))}
            </div>

            {/* Alerts */}
            {success && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 text-sm">{success}</div>
            )}
            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}

            {loading && (
                <div className="text-center py-20">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                </div>
            )}

            {/* ── Tab: Thống kê ── */}
            {tab === 'stats' && !loading && stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Tổng người dùng',    value: stats.totalUsers,        color: 'text-blue-500',   bg: 'bg-blue-500/10' },
                        { label: 'Tài khoản bị khóa',  value: stats.blockedUsers,      color: 'text-red-400',    bg: 'bg-red-500/10' },
                        { label: 'Tổng bài đăng',       value: stats.totalPosts,        color: 'text-green-500',  bg: 'bg-green-500/10' },
                        { label: 'Bài đăng bị ẩn',     value: stats.hiddenPosts,       color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                        { label: 'Tổng buổi học',       value: stats.totalSessions,     color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        { label: 'Buổi học hoàn thành', value: stats.completedSessions, color: 'text-primary',    bg: 'bg-primary/10' },
                    ].map(item => (
                        <div key={item.label} className="bg-secondary rounded-2xl p-5">
                            <p className="text-xs text-muted-foreground mb-2">{item.label}</p>
                            <p className={`text-3xl font-semibold ${item.color}`}>{item.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab: Người dùng ── */}
            {tab === 'users' && !loading && (
                <div className="flex flex-col gap-3">
                    {users.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-border rounded-2xl text-sm text-muted-foreground">
                            Không có người dùng nào
                        </div>
                    ) : users.map(u => (
                        <div key={u._id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0">
                                {initials(u.username)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-medium">{u.username}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                        u.status === 'active'
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-red-50 text-red-500 border-red-100'
                                    }`}>
                                        {u.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Dạy: {u.stats?.totalTaught ?? 0} • Học: {u.stats?.totalLearned ?? 0} • Rating: {u.stats?.averageRating ?? '—'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground">
                                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                <button onClick={() => handleBlockUser(u._id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                        u.status === 'active'
                                            ? 'border border-red-200 text-red-400 hover:bg-red-50'
                                            : 'border border-green-200 text-green-500 hover:bg-green-50'
                                    }`}>
                                    {u.status === 'active'
                                        ? <><ShieldOff className="w-3.5 h-3.5" /> Khóa</>
                                        : <><Shield className="w-3.5 h-3.5" /> Mở khóa</>
                                    }
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab: Bài đăng ── */}
            {tab === 'posts' && !loading && (
                <div className="flex flex-col gap-3">
                    {posts.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-border rounded-2xl text-sm text-muted-foreground">
                            Không có bài đăng nào
                        </div>
                    ) : posts.map(post => (
                        <div key={post._id} className={`bg-card border rounded-2xl p-4 flex items-start gap-4 ${post.isHidden ? 'opacity-60 border-border' : 'border-border'}`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium truncate">{post.title}</span>
                                    {post.isHidden && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                                            Đã ẩn
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Đăng bởi: {post.author?.username} • {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <button onClick={() => handleHidePost(post._id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground shrink-0">
                                {post.isHidden
                                    ? <><Eye className="w-3.5 h-3.5" /> Hiện</>
                                    : <><EyeOff className="w-3.5 h-3.5" /> Ẩn</>
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}