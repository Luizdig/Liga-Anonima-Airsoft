import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Feed from "./pages/Feed";
import Gallery from "./pages/Gallery";
import Store from "./pages/Store";
import StoreDetail from "./pages/StoreDetail";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Honor from "./pages/Honor";
import Profile from "./pages/Profile";
import GameDetail from "./pages/GameDetail";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Trophy, Calendar, Newspaper, Images, ShoppingCart, Shield, Menu, X, User, Star } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/", label: "Início", icon: Trophy },
  { path: "/honra", label: "Honra", icon: Star },
  { path: "/jogos", label: "Jogos", icon: Calendar },
  { path: "/feed", label: "Feed", icon: Newspaper },
  { path: "/galeria", label: "Galeria", icon: Images },
  { path: "/loja", label: "Loja", icon: ShoppingCart },
];

function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-military-bg/95 backdrop-blur-md border-b border-military-border">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/manus-storage/logo_6be0edc5.png"
            alt="L.A.A. Logo"
            className="w-10 h-10 rounded-full border-2 border-green-neon/50 group-hover:border-green-neon transition-colors"
          />
          <div className="hidden sm:block">
            <h1 className="font-display font-bold text-lg text-green-neon tracking-wider text-glow-subtle">
              L.A.A.
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Liga Anônima de Airsoft
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-green-neon hover:bg-accent-green/10 gap-2 font-display text-xs tracking-wider uppercase"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="border-green-dim text-green-neon hover:bg-green-neon hover:text-military-bg font-display text-xs tracking-wider"
              >
                <Shield className="w-4 h-4 mr-2" />
                ADMIN
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href={`/perfil/${user?.id}`}>
                <span className="text-sm text-muted-foreground hover:text-green-neon flex items-center gap-2 transition-colors">
                  <User className="w-4 h-4" />
                  {user?.name?.split(" ")[0] || "Membro"}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }}>
                Sair
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="default"
                size="sm"
                className="bg-green-neon text-military-bg font-display text-xs tracking-wider hover:bg-green-glow"
              >
                ENTRAR
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-green-neon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-military-surface border-t border-military-border">
          <nav className="container px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-green-neon hover:bg-accent-green/10 gap-2 font-display text-xs tracking-wider uppercase"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-green-neon hover:bg-green-neon hover:text-military-bg gap-2 font-display text-xs tracking-wider uppercase"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  ADMIN
                </Button>
              </Link>
            )}
            {!isAuthenticated && (
              <Link href="/login">
                <Button
                  variant="default"
                  className="w-full bg-green-neon text-military-bg font-display text-xs tracking-wider"
                  onClick={() => setMobileOpen(false)}
                >
                  ENTRAR
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <Link href={`/perfil/${user?.id}`}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-green-neon hover:bg-green-neon/10 gap-2 font-display text-xs tracking-wider uppercase"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  MEU PERFIL
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/honra" component={Honor} />
          <Route path="/jogos" component={Games} />
          <Route path="/jogos/:id" component={GameDetail} />
          <Route path="/feed" component={Feed} />
          <Route path="/galeria" component={Gallery} />
          <Route path="/loja" component={Store} />
          <Route path="/loja/:id" component={StoreDetail} />
          <Route path="/perfil/:userId" component={Profile} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/login" component={Login} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="border-t border-military-border bg-military-bg py-6 mt-auto">
        <div className="container px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src="/manus-storage/logo_6be0edc5.png"
              alt="L.A.A."
              className="w-8 h-8 rounded-full opacity-50"
            />
            <span className="font-display text-sm text-green-neon/60 tracking-widest">
              L.A.A.
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Liga Anônima de Airsoft - Todos os direitos reservados &copy; 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Layout />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
