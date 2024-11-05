const { Kafka } = require('kafkajs');
const kafka = new Kafka({ clientId: 'data-preprocessor', brokers: ['localhost:9092'] });

const consumer = kafka.consumer({ groupId: 'preprocessing-group' });
const producer = kafka.producer();

// Configuration for scaling and imputation
const MIN_TEMPERATURE = 10;
const MAX_TEMPERATURE = 40;
const BASELINE_PRESSURE = 1013;

// Helper function to scale values to a 0-1 range
function scale(value, min, max) {
    return (value - min) / (max - min);
}

// Function to validate and clean data, handling missing values and outliers
function validateAndCleanData(parsedData) {
    parsedData.temperature = parsedData.temperature || MIN_TEMPERATURE;
    parsedData.humidity = parsedData.humidity || 50;
    parsedData.pressure = parsedData.pressure || BASELINE_PRESSURE;

    // Handle outliers by capping temperature
    if (parsedData.temperature < MIN_TEMPERATURE || parsedData.temperature > MAX_TEMPERATURE) {
        console.warn(`Temperature ${parsedData.temperature} out of range. Capping to min.`);
        parsedData.temperature = MIN_TEMPERATURE;
    }

    // Scale features to a normalized range
    parsedData.temperature = scale(parsedData.temperature, MIN_TEMPERATURE, MAX_TEMPERATURE);
    parsedData.humidity = scale(parsedData.humidity, 0, 100); // Assume 0-100 range for humidity
    parsedData.pressure = scale(parsedData.pressure, 900, 1100); // Assuming 900-1100 hPa for pressure

    return parsedData;
}

// Main preprocess function to handle data validation and transformation
function preprocess(data) {
    try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data; // Ensure data is parsed
        const validatedData = validateAndCleanData(parsedData);
        return validatedData;
    } catch (error) {
        console.error("Data preprocessing error:", error.message);
        return null;
    }
}

// Clean and preprocess a single data record
async function cleanData(data) {
    try {
        const validatedData = preprocess(data);
        
        // Ensure validatedData is a valid JSON object before converting to string
        if (validatedData && typeof validatedData === 'object') {
            return JSON.stringify(validatedData);
        } else {
            throw new Error("Preprocessed data is not a valid JSON object");
        }
    } catch (error) {
        console.error("Data processing error:", error.message);
        return null;
    }
}

// Main function to connect to Kafka, process messages, and send cleaned data
const runPreprocessor = async () => {
    try {
        await consumer.connect();
        await producer.connect();
        await consumer.subscribe({ topic: 'ml_insights_data', fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const cleanedData = await cleanData(message.value.toString());
                if (cleanedData) {
                    await producer.send({
                        topic: 'processed_ml_data',
                        messages: [{ value: cleanedData }],
                    });
                    console.log("Processed and sent data to 'processed_ml_data' topic");
                }
            },
        });
    } catch (error) {
        console.error("Error starting data preprocessor:", error);
    }
};

// Run the data preprocessor
runPreprocessor().catch(error => {
    console.error("Error in preprocessor runtime:", error);
});

module.exports = { preprocess };
