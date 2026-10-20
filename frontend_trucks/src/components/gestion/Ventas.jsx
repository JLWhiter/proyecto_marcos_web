import { useState } from 'react';

export default function Ventas() {
  const [items, setItems] = useState([
    { id: 1, codigo: 'P001', descripcion: 'Producto A', cantidad: 1, precioFinalSugerido: 100 },
  ]);

  const updatePrecio = (id, value) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, precioFinalSugerido: Number(value) } : it));
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Ventas</h2>
      <table className="table table-bordered table-striped">
        <thead className="table-dark">
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio final sugerido</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td>{it.codigo}</td>
              <td>{it.descripcion}</td>
              <td>{it.cantidad}</td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  value={it.precioFinalSugerido}
                  onChange={e => updatePrecio(it.id, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary">Registrar venta</button>
    </div>
  );
}
