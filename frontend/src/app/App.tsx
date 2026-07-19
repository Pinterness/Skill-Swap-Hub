import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LandingPage from "../pages/LandingPage";
import DashboardPage from "../pages/DashboardPage";
import MatchPage from "../pages/MatchPage";
import ChatPage from "../pages/ChatPage";
import PostDetailPage from "../pages/PostDetailPage";
import ProfilePage from "../pages/ProfilePage";
import MainLayout from "../layouts/MainLayout";
import SessionPage from "../pages/SessionPage";
import CreatePostPage from "../pages/CreatePostPage";
import AdminPage from "../pages/AdminPage";
import PublicProfilePage from "../pages/PublicProfilePage";
import ReviewPage from "../pages/ReviewPage";
import { ChatNotificationProvider } from "../context/ChatNotificationContext";
import { ThemeProvider } from "../context/ThemeContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ChatNotificationProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/match"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MatchPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/chat"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ChatPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/review"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReviewPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/reviews/:userId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReviewPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/session"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SessionPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/post/create"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CreatePostPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/post/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PostDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/user/:userId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PublicProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ChatNotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
