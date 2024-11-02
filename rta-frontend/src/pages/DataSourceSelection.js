import React, { useState, useEffect } from 'react';
import { Typography, Card, CardContent, Checkbox, FormControlLabel, Grid, Button, Box } from '@mui/material';
import axios from 'axios';

function DataSourceSelection() {
  const [dataSources, setDataSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data sources from API on component mount
  // useEffect(() => {
  //   // Replace the URL with your API endpoint
  //   axios.get('/api/data-sources')
  //     .then(response => {
  //       setDataSources(response.data);
  //     })
  //     .catch(error => {
  //       console.error('Error fetching data sources:', error);
  //     });
  // }, []);

  useEffect(() => {
    const sampleDataSources = [
      { id: 1, name: 'IOT Data', description: 'Smoke detection dataset' },
      { id: 2, name: 'Financial data', description: 'Stock market data' },
      { id: 3, name: 'Health care data', description: 'Covid-19 cases in 2020' },
    ];
    setTimeout(() => {
      setDataSources(sampleDataSources);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCheckboxChange = (dataSourceId) => {
    setSelectedSources(prevSelectedSources => {
      if (prevSelectedSources.includes(dataSourceId)) {
        return prevSelectedSources.filter(id => id !== dataSourceId);
      } else {
        return [...prevSelectedSources, dataSourceId];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedSources.length === 0) {
      alert("Please select at least one data source.");
    } else {
      console.log('Selected Data Sources:', selectedSources);
      alert("Data sources selected: " + selectedSources.join(', '));
    }
  };

  return (
    <Box sx={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
        Data Source Selection
      </Typography>
      {loading ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', marginTop: '20px' }}>
          Loading data sources...
        </Typography>
      ) : dataSources.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', marginTop: '20px' }}>
          No data sources available.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {dataSources.map((dataSource) => (
            <Grid item xs={12} sm={6} md={4} key={dataSource.id}>
              <Card sx={{ 
                borderRadius: '15px', 
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', 
                padding: '10px', 
                transition: 'transform 0.3s',
                '&:hover': { transform: 'scale(1.05)' },
                backgroundColor: '#fafafa'
              }}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedSources.includes(dataSource.id)}
                        onChange={() => handleCheckboxChange(dataSource.id)}
                        color="primary"
                      />
                    }
                    label={dataSource.name}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {dataSource.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
        <Button
          variant="contained"
          color="primary"
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' },
            padding: '10px 20px',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
          onClick={handleSubmit}
        >
          Confirm Selection
        </Button>
      </Box>
    </Box>
  );
}

export default DataSourceSelection;
