export default function Header({ title, module, onModuleChange }) {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="UNTREF inicio">
        <span>UNTREF</span>
      </a>
      <div className="topbar-center">
        <span>{title}</span>
      </div>
      <nav className="module-tabs" aria-label="Módulos">
        <button className={module === 'distributions' ? 'active' : ''} onClick={() => onModuleChange('distributions')}>Distribuciones</button>
        <button className={module === 'thermodynamics' ? 'active' : ''} onClick={() => onModuleChange('thermodynamics')}>Termodinámica</button>
      </nav>
    </header>
  );
}
