import { useEffect, useState } from 'react';
import { fetchDataSources } from '../services/api';

const DataSourceSelection = () => {
  const [dataSources, setDataSources] = useState([]);

  useEffect(() => {
    fetchDataSources().then(response => setDataSources(response.data));
  }, []);

  return (
    <div>
      {dataSources.map(ds => (
        <div key={ds.id}>
          <input type="checkbox" /> {ds.name}
        </div>
      ))}
    </div>
  );
};

export default DataSourceSelection;
