import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }) {
  return (
    <div className="h-screen w-screen flex bg-neutral-50 text-neutral-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <Topbar />

        {/* Content */}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
