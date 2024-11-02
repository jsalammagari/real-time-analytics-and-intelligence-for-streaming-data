import React from 'react';
import { Typography, Card, CardContent, Grid, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';

// Sample data for visualizations
const lineChartData = [
  { name: 'Jan', value: 30 },
  { name: 'Feb', value: 50 },
  { name: 'Mar', value: 40 },
  { name: 'Apr', value: 60 },
  { name: 'May', value: 80 },
  { name: 'Jun', value: 70 },
];

const pieChartData = [
  { name: 'Category A', value: 400 },
  { name: 'Category B', value: 300 },
  { name: 'Category C', value: 300 },
  { name: 'Category D', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard() {
  return (
    <Box sx={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Real time analytics and intelligence of streaming data
      </Typography>
      <Grid container spacing={3}>
        
        {/* KPI Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              transition: 'transform 0.3s',
              '&:hover': { transform: 'scale(1.05)' },
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '15px',
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon style={{ fontSize: 50, color: '#1976d2' }} />
              <Typography variant="h6" sx={{ fontWeight: '600', color: '#555' }}>
                KPI 1
              </Typography>
              <Typography variant="body2" sx={{ color: '#777', marginTop: '8px' }}>
                Description of KPI 1
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              transition: 'transform 0.3s',
              '&:hover': { transform: 'scale(1.05)' },
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '15px',
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon style={{ fontSize: 50, color: '#ff9800' }} />
              <Typography variant="h6" sx={{ fontWeight: '600', color: '#555' }}>
                KPI 2
              </Typography>
              <Typography variant="body2" sx={{ color: '#777', marginTop: '8px' }}>
                Description of KPI 2
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              transition: 'transform 0.3s',
              '&:hover': { transform: 'scale(1.05)' },
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '15px',
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <ShowChartIcon style={{ fontSize: 50, color: '#4caf50' }} />
              <Typography variant="h6" sx={{ fontWeight: '600', color: '#555' }}>
                KPI 3
              </Typography>
              <Typography variant="body2" sx={{ color: '#777', marginTop: '8px' }}>
                Description of KPI 3
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Line Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ padding: '20px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: '600', color: '#555', textAlign: 'center' }}>
              Monthly Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#1976d2" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ padding: '20px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: '600', color: '#555', textAlign: 'center' }}>
              Distribution of Categories
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}

export default Dashboard;
