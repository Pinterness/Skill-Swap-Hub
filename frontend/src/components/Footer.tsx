import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Cột 1: Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Skill-Swap-Hub
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Nền tảng kết nối cộng đồng, trao đổi kỹ năng và cùng nhau phát
              triển. Dạy điều bạn giỏi, học điều bạn cần hoàn toàn miễn phí.
            </p>
          </div>

          {/* Cột 2: Điều hướng */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Khám phá</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#kham-pha"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Cách hoạt động
                </a>
              </li>
              <li>
                <a
                  href="#cong-dong"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Cộng đồng tiêu biểu
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Tìm kiếm kỹ năng
                </a>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Kết nối</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
            <p className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" /> support@skillswap.com
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Skill-Swap-Hub. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Chính sách bảo mật
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Điều khoản sử dụng
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
