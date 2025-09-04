import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Plus, 
  Wallet, 
  Shield,
  PieChart,
  Image,
  Users,
  TrendingUp,
  User, 
  LogOut,
  ArrowLeft 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  showBackButton?: boolean;
  title?: string;
}

export function Navigation({ showBackButton = false, title }: NavigationProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/create-summary", icon: Plus, label: "Create" },
    { path: "/defi-dashboard", icon: PieChart, label: "DeFi" },
    { path: "/nft-gallery", icon: Image, label: "NFTs" },
    { path: "/governance", icon: Users, label: "DAO" },
    { path: "/social-trading", icon: TrendingUp, label: "Trading" },
    { path: "/web3-wallet", icon: Shield, label: "Wallet" },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Back button or Navigation */}
          <div className="flex items-center space-x-4">
            {showBackButton ? (
              <div className="flex items-center space-x-3">
                <Link href="/">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-gray-900 dark:text-white hover:bg-white/10"
                    onClick={() => {
                      console.log('Back to home clicked');
                      window.location.href = '/';
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                {title && (
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <Button
                      size="sm"
                      variant={location === item.path ? "secondary" : "ghost"}
                      className={`text-gray-900 dark:text-white ${
                        location === item.path 
                          ? "bg-white/20 hover:bg-white/30" 
                          : "hover:bg-white/10"
                      }`}
                      onClick={() => {
                        console.log('Navigating to:', item.path);
                        window.location.href = item.path;
                      }}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} alt={user?.username} />
                <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 dark:text-white text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                <p className="text-xs text-slate-300">{user?.email}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-900 dark:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}