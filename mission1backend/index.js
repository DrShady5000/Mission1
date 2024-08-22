const express = require('express'); 
const cors = require('cors'); 
const multer = require('multer'); 
const axios = require('axios'); 
const fs = require('fs'); 
const path = require('path'); 

const app = express(); 
const port = 5000; 

app.use(express.json()); 
app.use(cors()); 

const upload = multer({ dest: 'uploads/' }); // Configure Multer to save uploaded files to the 'uploads' directory

// Endpoint URL and prediction key for the Custom Vision API
const predictionEndpointUrl = 'https://sahilmission1-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/be826310-a117-4f55-a61c-1c19afb4aa71/classify/iterations/Iteration5/image';
const predictionKey = '6ae56eb03321442a90dc41d1771e576f';

// Function to classify tags into brand or vehicle type
function classifyTag(tag) {
  if (tag.startsWith('Brand_')) {
    return { type: 'brand', value: tag.replace('Brand_', '') }; // Extract brand name from tag
  } else if (tag.startsWith('Type_')) {
    return { type: 'vehicleType', value: tag.replace('Type_', '') }; // Extract vehicle type from tag
  }
  return null; // Return null if tag does not match expected format
}

// POST route to handle image uploads and classification
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded'); // Respond with error if no file is uploaded
  }

  try {
    // Construct the path to the uploaded image file
    const imagePath = path.join(__dirname, req.file.path);
    // Read the image file into a buffer
    const imageData = fs.readFileSync(imagePath);

    // Send the image data to the Azure Custom Vision API
    const response = await axios.post(
      predictionEndpointUrl,
      imageData,
      {
        headers: {
          'Prediction-Key': predictionKey, 
          'Content-Type': 'application/octet-stream', 
        },
      }
    );

    // Delete the uploaded file after processing
    fs.unlinkSync(imagePath);

    // Extract predictions from the API response
    const predictions = response.data.predictions;

    let brand = '';
    let vehicleType = '';

    // Variables to track the highest probability for each category
    let highestBrandProbability = 0;
    let highestTypeProbability = 0;

    // Process each prediction to determine the highest probability for brand and vehicle type
    predictions.forEach(prediction => {
      const classifiedTag = classifyTag(prediction.tagName);

      if (classifiedTag) {
        if (classifiedTag.type === 'brand' && prediction.probability > highestBrandProbability) {
          brand = classifiedTag.value; // Update brand with the highest probability
          highestBrandProbability = prediction.probability; // Update highest probability for brand
        } else if (classifiedTag.type === 'vehicleType' && prediction.probability > highestTypeProbability) {
          vehicleType = classifiedTag.value; // Update vehicle type with the highest probability
          highestTypeProbability = prediction.probability; // Update highest probability for vehicle type
        }
      }
    });

    // Send the results as JSON response
    if (brand && vehicleType) {
      res.json({ brand, vehicleType });
    } else {
      res.status(404).send('No predictions found.'); // Respond with error if no predictions are found
    }
  } catch (error) {
    console.error('Error:', error.message); 
    res.status(500).send('Error processing image file'); 
  }
});

// Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Mission1 backend running on port ${port}`);
});

