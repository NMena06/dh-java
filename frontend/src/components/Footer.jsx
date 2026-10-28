export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-left">
        <img src="/logo.svg" alt="ReservaYa" className="footer-logo" />
        <span className="footer-copy">© {year} ReservaYa. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}
