function MenuSeccion({ items = [], active = 0 }) {
  return (
    <div className="menu-panel">
      <ul className="section-list">
        {items.map((it, idx) => (
          <li key={it.label} className={idx === active ? 'section-item active' : 'section-item'}>
            <div>
              <span className="icon">{it.icon}</span>
              <span className="label">{it.label}</span>
            </div>
            {it.count != null && <span className="badge">{it.count}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MenuSeccion;

