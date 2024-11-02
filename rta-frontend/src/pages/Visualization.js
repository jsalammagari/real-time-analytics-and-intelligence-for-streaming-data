import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const Visualization = ({ data }) => (
  <LineChart width={600} height={300} data={data}>
    <XAxis dataKey="time" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
);
export default Visualization;
