import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { MarketingLayout } from "./components/layout/MarketingLayout";
import { AIExamsPage } from "./pages/AIExamsPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { DiagramPage } from "./pages/DiagramPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { InterviewPage } from "./pages/InterviewPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MarkerPage } from "./pages/MarkerPage";
import { MemoryPage } from "./pages/MemoryPage";
import { PastPapersPage } from "./pages/PastPapersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProgressPage } from "./pages/ProgressPage";
import { PYQMixPage } from "./pages/PYQMixPage";
import { QuestionBankPage } from "./pages/QuestionBankPage";
import { RevisionPage } from "./pages/RevisionPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SignupPage } from "./pages/SignupPage";
import { StickyNotesPage } from "./pages/StickyNotesPage";
import { TheoryPage } from "./pages/TheoryPage";
import { TutorPage } from "./pages/TutorPage";
import { UpgradePage } from "./pages/UpgradePage";

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      {/* Public auth pages — bare shell, no app or marketing chrome */}
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="home" element={<HomePage />} />
          <Route path="question-bank" element={<QuestionBankPage />} />
          <Route path="past-papers" element={<PastPapersPage />} />
          <Route path="pyq-mix" element={<PYQMixPage />} />
          <Route path="ai-exams" element={<AIExamsPage />} />
          <Route path="theory" element={<TheoryPage />} />
          <Route path="revision" element={<RevisionPage />} />
          <Route path="marker" element={<MarkerPage />} />
          <Route path="diagrams" element={<DiagramPage />} />
          <Route path="interview" element={<InterviewPage />} />
          <Route path="tutor" element={<TutorPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="notes" element={<StickyNotesPage />} />
          <Route path="upgrade" element={<UpgradePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        {/* Bare page, outside both shells — payment gets no distractions */}
        <Route path="upgrade/checkout" element={<CheckoutPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
