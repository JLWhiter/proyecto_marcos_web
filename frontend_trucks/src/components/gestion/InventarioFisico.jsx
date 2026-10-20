import { useEffect, useState } from 'react';

export default function InventarioFisico() {
  const [codigo, setCodigo] = useState('A2');
  const [rows, setRows] = useState([]);

  const buscar = () => {
    fetch(`/api/v1/gestion/inventario/ubicacion/${codigo}`)
      .then(r => r.json())
      .then(setRows);
  };

  useEffect(() => { buscar(); }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-3">Inventario físico por ubicación</h2>
      <div className="input-group mb-3">
        <input className="form-control" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ubicación (ej. A2)" />
        <button className="btn btn-outline-secondary" onClick={buscar}>Buscar</button>
      </div>
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Código</th>
            <th>Ubicación</th>
            <th>Descripción</th>
            <th>Unidad de medida</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.id}>
              <td>{p.codigo}</td>
              <td>{p.ubicacion?.codigo}</td>
              <td>{p.descripcion}</td>
              <td>{p.unidadMedida}</td>
              <td>{p.stockActual}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
