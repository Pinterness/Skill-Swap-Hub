import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Save, Plus, X, Star, BookOpen, Users } from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function ProfilePage() {
    const { token, user } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const [tab, setTab] = useState<'info' | 'skills' | 'certs' | 'stats'>('info');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Info
    const [username, setUsername] = useState(user?.username ?? '');
    const [avatar, setAvatar] = useState(user?.avatar ?? '');

    // Skills
    const [skillsOffered, setSkillsOffered] = useState<string[]>(user?.skillsOffered ?? []);
    const [skillsWanted, setSkillsWanted] = useState<string[]>(user?.skillsWanted ?? []);
    const [newOffered, setNewOffered] = useState('');
    const [newWanted, setNewWanted] = useState('');

    // Certificates
    const [certificates, setCertificates] = useState<any[]>(user?.certificates ?? []);
    const [showCertForm, setShowCertForm] = useState(false);
    const [newCert, setNewCert] = useState({
        name: '', issuer: '', issueDate: '', expiryDate: '', credentialUrl: ''
    });

    const initials = (name: string) => name.slice(0, 2).toUpperCase();

    // ── Handlers ──────────────────────────────────────────

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            setLoading(true);
            await axios.put(`${API}/user/profile`, { username, avatar }, { headers });
            localStorage.setItem('user', JSON.stringify({ ...user, username, avatar }));
            setSuccess('Cập nhật thành công!');
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Lỗi hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSkills = async () => {
        setError(''); setSuccess('');
        try {
            setLoading(true);
            await axios.put(`${API}/user/profile`, { skillsOffered, skillsWanted }, { headers });
            localStorage.setItem('user', JSON.stringify({ ...user, skillsOffered, skillsWanted }));
            setSuccess('Đã cập nhật kỹ năng!');
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Lỗi hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const addSkill = (type: 'offered' | 'wanted') => {
        if (type === 'offered' && newOffered.trim()) {
            setSkillsOffered(prev => [...prev, newOffered.trim()]);
            setNewOffered('');
        }
        if (type === 'wanted' && newWanted.trim()) {
            setSkillsWanted(prev => [...prev, newWanted.trim()]);
            setNewWanted('');
        }
    };

    const removeSkill = (type: 'offered' | 'wanted', skill: string) => {
        if (type === 'offered') setSkillsOffered(prev => prev.filter(s => s !== skill));
        if (type === 'wanted') setSkillsWanted(prev => prev.filter(s => s !== skill));
    };

    const handleAddCert = async () => {
        if (!newCert.name.trim()) return;
        setError(''); setSuccess('');
        try {
            setLoading(true);
            const res = await axios.post(`${API}/user/certificate`, newCert, { headers });
            setCertificates(res.data.certificates);
            setNewCert({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialUrl: '' });
            setShowCertForm(false);
            setSuccess('Đã thêm bằng cấp!');
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Lỗi hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCert = async (certId: string) => {
        setError(''); setSuccess('');
        try {
            const res = await axios.delete(`${API}/user/certificate/${certId}`, { headers });
            setCertificates(res.data.certificates);
            setSuccess('Đã xóa bằng cấp!');
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Lỗi hệ thống');
        }
    };

    const switchTab = (t: typeof tab) => {
        setTab(t);
        setSuccess('');
        setError('');
    };

    // ── Render ────────────────────────────────────────────

    return (
        <div className="p-6 max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-700 overflow-hidden">
                    {user?.avatar
                        ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        : initials(user?.username ?? 'U')
                    }
                </div>
                <div>
                    <h2 className="text-lg font-semibold">{user?.username}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 w-fit">
                {(['info', 'skills', 'certs', 'stats'] as const).map(t => (
                    <button key={t}
                        onClick={() => switchTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === t
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        {t === 'info' ? 'Thông tin'
                            : t === 'skills' ? 'Kỹ năng'
                            : t === 'certs' ? 'Bằng cấp'
                            : 'Thành tích'}
                    </button>
                ))}
            </div>

            {/* Alerts */}
            {success && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 text-sm">
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* ── Tab: Thông tin ── */}
            {tab === 'info' && (
                <form onSubmit={handleSaveInfo} className="space-y-4">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tên hiển thị</label>
                        <input type="text" value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Link Avatar (URL)</label>
                        <input type="text" value={avatar} placeholder="https://..."
                            onChange={e => setAvatar(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    <button type="submit" disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                        <Save className="w-4 h-4" />
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </form>
            )}

            {/* ── Tab: Kỹ năng ── */}
            {tab === 'skills' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-medium mb-3 text-green-600">Kỹ năng có thể dạy</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {skillsOffered.map(s => (
                                <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                                    {s}
                                    <button onClick={() => removeSkill('offered', s)}><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={newOffered} placeholder="Thêm kỹ năng..."
                                onChange={e => setNewOffered(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill('offered'))}
                                className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                            />
                            <button onClick={() => addSkill('offered')}
                                className="w-9 h-9 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-3 text-blue-600">Kỹ năng muốn học</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {skillsWanted.map(s => (
                                <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                    {s}
                                    <button onClick={() => removeSkill('wanted', s)}><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={newWanted} placeholder="Thêm kỹ năng..."
                                onChange={e => setNewWanted(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill('wanted'))}
                                className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                            />
                            <button onClick={() => addSkill('wanted')}
                                className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <button onClick={handleSaveSkills} disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                        <Save className="w-4 h-4" />
                        {loading ? 'Đang lưu...' : 'Lưu kỹ năng'}
                    </button>
                </div>
            )}

            {/* ── Tab: Bằng cấp ── */}
            {tab === 'certs' && (
                <div className="space-y-4">
                    {certificates.length === 0 && !showCertForm && (
                        <div className="text-center py-10 border border-dashed border-border rounded-2xl text-sm text-muted-foreground">
                            Chưa có bằng cấp nào
                        </div>
                    )}

                    {certificates.map((cert: any) => (
                        <div key={cert._id} className="bg-secondary rounded-xl p-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium">{cert.name}</p>
                                {cert.issuer && <p className="text-xs text-muted-foreground mt-0.5">{cert.issuer}</p>}
                                {cert.issueDate && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Cấp: {new Date(cert.issueDate).toLocaleDateString('vi-VN')}
                                        {cert.expiryDate && ` — Hết hạn: ${new Date(cert.expiryDate).toLocaleDateString('vi-VN')}`}
                                    </p>
                                )}
                                {cert.credentialUrl && (
                                    <a href={cert.credentialUrl} target="_blank" rel="noreferrer"
                                        className="text-xs text-primary hover:underline mt-1 inline-block">
                                        Xem chứng chỉ →
                                    </a>
                                )}
                            </div>
                            <button onClick={() => handleDeleteCert(cert._id)}
                                className="text-muted-foreground hover:text-red-400 transition-colors shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {showCertForm && (
                        <div className="bg-secondary rounded-xl p-4 space-y-3 border border-border">
                            <input type="text" placeholder="Tên bằng cấp / chứng chỉ *"
                                value={newCert.name}
                                onChange={e => setNewCert(p => ({ ...p, name: e.target.value }))}
                                className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                            />
                            <input type="text" placeholder="Nơi cấp (VD: Coursera, ĐHBK...)"
                                value={newCert.issuer}
                                onChange={e => setNewCert(p => ({ ...p, issuer: e.target.value }))}
                                className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Ngày cấp</label>
                                    <input type="date" value={newCert.issueDate}
                                        onChange={e => setNewCert(p => ({ ...p, issueDate: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Ngày hết hạn</label>
                                    <input type="date" value={newCert.expiryDate}
                                        onChange={e => setNewCert(p => ({ ...p, expiryDate: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm text-foreground"
                                    />
                                </div>
                            </div>
                            <input type="text" placeholder="Link chứng minh (URL)"
                                value={newCert.credentialUrl}
                                onChange={e => setNewCert(p => ({ ...p, credentialUrl: e.target.value }))}
                                className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleAddCert} disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Đang lưu...' : 'Lưu'}
                                </button>
                                <button onClick={() => setShowCertForm(false)}
                                    className="px-4 py-2 border border-border text-sm rounded-lg hover:bg-background transition-colors text-muted-foreground">
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}

                    {!showCertForm && (
                        <button onClick={() => setShowCertForm(true)}
                            className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border text-sm rounded-xl hover:border-primary hover:text-primary transition-colors text-muted-foreground w-full justify-center">
                            <Plus className="w-4 h-4" />
                            Thêm bằng cấp
                        </button>
                    )}
                </div>
            )}

            {/* ── Tab: Thành tích ── */}
            {tab === 'stats' && (
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-secondary rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Tổng buổi đã dạy</p>
                            <p className="text-2xl font-semibold">{user?.stats?.totalTaught ?? 0}</p>
                        </div>
                    </div>
                    <div className="bg-secondary rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Tổng buổi đã học</p>
                            <p className="text-2xl font-semibold">{user?.stats?.totalLearned ?? 0}</p>
                        </div>
                    </div>
                    <div className="bg-secondary rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Đánh giá trung bình</p>
                            <p className="text-2xl font-semibold">{user?.stats?.averageRating ?? '—'}</p>
                        </div>
                    </div>
                    <div className="bg-secondary rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Tổng lượt đánh giá</p>
                            <p className="text-2xl font-semibold">{user?.stats?.totalReviews ?? 0}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
