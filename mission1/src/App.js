import React, { useState } from 'react';
import './App.css';
import logo from './images/logo.png'; // Adjust the path based on where you place the logo

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError(''); // Clear error on new file selection
  };

  const onFileUpload = () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.brand && data.vehicleType) {
          setResult(data);
        } else {
          setError('No prediction found.');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        setError('Error uploading file. Please try again.');
      });
  };

  return (
    <div className="App">
      <img src={logo} alt="Turners Cars Logo" className="logo" />
      <h1>Turners Cars Vehicle Identification</h1>
      <p>Please upload an image of your vehicle and we will help identify the vehicle type and brand.</p>
      <div>
        <input type="file" onChange={onFileChange} />
        <button onClick={onFileUpload}>Upload and Identify</button>
      </div>
      {result && (
        <div>
          <h3>Brand: {result.brand}</h3>
          <h3>Vehicle Type: {result.vehicleType}</h3>
        </div>
      )}
      {error && <div><h3 style={{ color: 'red' }}>Error: {error}</h3></div>}
    </div>
  );
}

export default App;
