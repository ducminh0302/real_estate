// Test data loading
fetch('/data/real-estate-data.json')
  .then(response => response.json())
  .then(data => {
    console.log('Data loaded successfully:');
    console.log('Project:', data.project_info.name);
    console.log('Total zones:', Object.keys(data.zones).length);
    console.log('Metadata:', data.metadata);
  })
  .catch(error => {
    console.error('Error loading data:', error);
  });