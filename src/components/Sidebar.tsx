import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  Share2, 
  CheckCircle2, 
  ArrowRightLeft, 
  Server, 
  Database,
  Shield
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/dag-health', label: 'DAG Health', icon: Network },
  { path: '/propagation', label: 'Propagation & P2P', icon: Share2 },
  { path: '/consensus', label: 'Consensus & Finality', icon: CheckCircle2 },
  { path: '/transactions', label: 'Transaction Pipeline', icon: ArrowRightLeft },
  { path: '/rpc', label: 'RPC / API', icon: Server },
  { path: '/storage', label: 'Storage & DB', icon: Database },
  { path: '/security', label: 'Security / Abuse', icon: Shield },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-grafana-dark border-r border-grafana-border h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4 border-b border-grafana-border">
        <h1 className="text-xl font-bold text-white">BlockDAG Monitor</h1>
        <p className="text-sm text-grafana-textSecondary">Node Dashboard</p>
      </div>
      <nav className="p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded mb-1 transition-colors ${
                  isActive
                    ? 'bg-grafana-primary text-white'
                    : 'text-grafana-textSecondary hover:bg-grafana-border hover:text-grafana-text'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

