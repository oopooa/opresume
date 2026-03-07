import { LangSwitcher } from './LangSwitcher';

export { FloatingToolbar } from './FloatingToolbar';

export function Toolbar() {
  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-4 print:hidden">
      <img src="/logo.webp" alt="logo" className="h-6" />
      <LangSwitcher />
    </header>
  );
}
