import React, { useState, useEffect } from 'react';
import { Typography, Card, CardContent, Radio, FormControlLabel, Grid, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DATA_SOURCE_URL,SELECTED_SOURCE_URL } from '../config'

function DataSourceSelection() {
  const navigate = useNavigate();
  const [dataSources, setDataSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(DATA_SOURCE_URL)
      .then(response => {
        setDataSources(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data sources:', error);
        setLoading(false);
      });
  }, []);

  const handleRadioChange = (event) => {
    setSelectedSource(event.target.value);
  };

  const handleSubmit = () => {
    if (!selectedSource) {
      alert("Please select a data source.");
    } else {
      axios.post(SELECTED_SOURCE_URL, { selectedSources: selectedSource})
        .then(response => {
          console.log('Selected data source submitted successfully:', response.data);
          navigate(`/dashboard?selected=${selectedSource}`);
        })
        .catch(error => {
          console.error('Error submitting selected source:', error);
          alert('An error occurred while submitting the data source');
        });
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
                      <Radio
                        checked={selectedSource === dataSource.id.toString()}
                        onChange={handleRadioChange}
                        value={dataSource.id}
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
