export default function Header({ title }) {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="UNTREF inicio">
        <span>UNTREF</span>
      </a>
      <div className="topbar-center">
        <span>{title}</span>
      </div>
    </header>
  );
}
