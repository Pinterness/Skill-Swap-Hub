// Định nghĩa cấu trúc chuẩn của một Bài đăng
export interface User {
  _id: string;
  username: string;
  avatar?: string;
}

export interface Post {
  _id: string;
  title: string;
  description: string;
  skillsRequired: string[]; // Kỹ năng muốn học
  skillsOffered: string[];  // Kỹ năng có thể dạy
  author: User;
  createdAt: string;
}