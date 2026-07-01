import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PostGrid from '../components/feed/PostGrid';
import AuthForm from '../components/auth/AuthForm';
import { Post } from '../types';

export default function LandingPage() {
    const [query, setQuery] = useState('');
    const [showAuth, setShowAuth] = useState(false);
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
    const navigate = useNavigate();

    const dummyPosts: Post[] = [
        {
            _id: '1',
            title: 'Cần người hướng dẫn ReactJS thực tế',
            description: 'Mình đã học xong cơ bản nhưng cần người review code và hướng dẫn làm project thực tế.',
            skillsRequired: ['ReactJS', 'Code Review'],
            skillsOffered: ['Tiếng Anh', 'Figma'],
            author: { _id: 'u1', username: 'Alex_Dev', avatar: 'https://i.pravatar.cc/150?u=alex' },
            createdAt: new Date().toISOString()
        },
        {
            _id: '2',
            title: 'Giao tiếp Tiếng Anh đổi lấy UI/UX Design',
            description: 'Mình là giáo viên Tiếng Anh (IELTS 7.5). Muốn tìm bạn designer để trao đổi.',
            skillsRequired: ['UI/UX Design', 'Wireframing'],
            skillsOffered: ['IELTS Speaking', 'Ngữ pháp'],
            author: { _id: 'u2', username: 'Sarah_English' },
            createdAt: new Date().toISOString()
        },
        {
            _id: '3',
            title: 'Trao đổi kỹ năng Backend (Node.js) & Marketing',
            description: 'Mình rành về Node.js, MongoDB nhưng đang loay hoay không biết cách quảng bá sản phẩm.',
            skillsRequired: ['Marketing', 'SEO'],
            skillsOffered: ['Node.js', 'MongoDB'],
            author: { _id: 'u3', username: 'CodeMaster', avatar: 'https://i.pravatar.cc/150?u=code' },
            createdAt: new Date().toISOString()
        }
    ];

    const handleAuthSuccess = () => {
        setShowAuth(false);
        navigate('/dashboard');
    };

    return (
        <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary/30 text-foreground font-['DM_Sans']">

            {/* Hiệu ứng ánh sáng nền */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

            {/* Navbar được đóng đinh (Sticky) */}
            <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
                <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold font-['Outfit'] tracking-wide">SkillSwap</span>
                    </div>

                    <div className="hidden md:flex gap-8 font-medium text-muted-foreground">
                        <a href="#kham-pha" className="hover:text-primary transition-colors">Khám phá</a>
                        <a href="#cong-dong" className="hover:text-primary transition-colors">Cộng đồng</a>
                        <a href="#ve-chung-toi" className="hover:text-primary transition-colors">Về chúng tôi</a>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => { setAuthTab('login'); setShowAuth(true); }}
                            className="px-5 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                            Đăng nhập
                        </button>
                        <button
                            onClick={() => { setAuthTab('register'); setShowAuth(true); }}
                            className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,107,74,0.2)] hover:shadow-[0_0_30px_rgba(255,107,74,0.4)] hover:-translate-y-0.5 cursor-pointer">
                            Tham gia miễn phí
                        </button>
                    </div>
                </nav>
            </div>

            {/* Hero */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 text-center max-w-4xl mx-auto py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 shadow-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm text-secondary-foreground tracking-tight font-['DM_Mono']">
                        Cộng đồng 10.000+ thành viên
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                >
                    <h1 className="text-5xl md:text-7xl font-extrabold font-['Outfit'] leading-[1.1] mb-6">
                        Trao đổi kỹ năng <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            Kết nối tri thức
                        </span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
                >
                    Nền tảng chia sẻ kỹ năng thực tế. Bạn có chuyên môn, người khác đang cần.
                    Hãy kết nối, học hỏi chéo và cùng nhau phát triển không giới hạn.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                    className="w-full max-w-2xl relative flex items-center group"
                >
                    <div className="absolute left-5 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Search className="w-6 h-6" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Bạn muốn học kỹ năng gì? (VD: ReactJS, Tiếng Anh...)"
                        className="w-full h-16 pl-14 pr-40 rounded-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground text-base placeholder:text-muted-foreground/50 shadow-xl"
                    />
                    <button className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer">
                        Tìm ngay
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-10 flex flex-wrap justify-center items-center gap-3"
                >
                    <span className="text-sm text-muted-foreground mr-2 font-['DM_Mono']">Nổi bật:</span>
                    {['UI/UX Design', 'Giao tiếp tiếng Anh', 'Node.js', 'Figma'].map((skill) => (
                        <span key={skill}
                            className="px-4 py-1.5 rounded-full text-sm font-['DM_Mono'] bg-secondary/40 border border-border hover:border-primary/50 hover:text-primary transition-colors cursor-pointer text-muted-foreground">
                            {skill}
                        </span>
                    ))}
                </motion.div>
            </main>

            {/* Post Grid */}
            <PostGrid posts={dummyPosts} />

            {/* Auth Modal */}
            {showAuth && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <AuthForm
                        onClose={() => setShowAuth(false)}
                        defaultTab={authTab}
                        onSuccess={handleAuthSuccess}
                    />
                </div>
            )}
        </div>
    );
}