import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthGuard, RequireSignedOut } from "@/components/layout/AuthGuard";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import Inquiries from "./pages/Inquiries";
import Bookings from "./pages/Bookings";

// ============================================================
// ROUTES (stage 12)
//   /login          → password screen (redirects away if authed)
//   /               → Dashboard        ┐
//   /applications   → Applications     ├ behind AuthGuard
//   /inquiries      → Inquiries        │  (stage 07: no data
//   /bookings       → Bookings         ┘   without a session)
//   *               → redirect to /
// ============================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Sonner richColors position="top-right" />
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireSignedOut>
              <Login />
            </RequireSignedOut>
          }
        />
        <Route element={<AuthGuard />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/inquiries" element={<Inquiries />} />
          <Route path="/bookings" element={<Bookings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
