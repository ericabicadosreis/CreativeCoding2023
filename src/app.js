const outputElement = document.getElementById('output');
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

let imageDescriptions = []; // Array per mantenere le descrizioni
let capturedImages = []; // Array per mantenere le immagini catturate

//PARTE CAMERA

async function startCamera() {
    try {
        const constraints = {
            audio: false,
            video: {
                facingMode: "environment",
                width: 700, //larghezza ideale
                height: 700, //altezza ideale
                frameRate: { ideal: 10, max: 15 } 
            }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if ("srcObject" in video) {
		    video.srcObject = stream;
		  } else {
		    // Avoid using this in new browsers
		    video.src = window.URL.createObjectURL(stream);
		  }
        // video.onloadedmetadata = () => {
        //     video.play();
        // };
    } catch (error) {
        console.error('Error accessing camera:', error);
    }
}

//funzione per visualizzare l'immagine
function displayCapturedImage(imgId, imgSrc, descriptionText, captureDate) {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'image-container';

    const img = new Image();
    img.src = imgSrc;
    imgContainer.appendChild(img);

    const description = document.createElement('p');
    
    const formattedDate = formatDateTime(new Date(captureDate)); // Format the date
    description.textContent = `${formattedDate}`;
    
    imgContainer.appendChild(description);

    document.getElementById('imageContainer').prepend(imgContainer);

    // Salva la descrizione associata all'immagine nell'array
    imageDescriptions.push({ id: imgId, description: descriptionText, date: captureDate });
}

async function captureImage() {
    context.canvas.width = video.videoWidth;
    context.canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const imgSrc = canvas.toDataURL('image/png');
    const currentDate = new Date();
    const captureDate = currentDate.toISOString(); // Format the date as a string
   
    displayCapturedImage(capturedImages.length + 1, imgSrc, 'Description', captureDate);
    capturedImages.push({ id: capturedImages.length + 1, src: imgSrc, date: captureDate });
    await processImage(capturedImages.length);
}

async function processImage(imgId) {
    if (capturedImages.length === 0) {
        console.error('No images captured to process.');
        return;
    }
    const latestCapturedImage = capturedImages.find(img => img.id === imgId);
    const base64Image = latestCapturedImage.src.split(',')[1];
    const objectRecognized = await detectObjectsGoogleVision(base64Image);
    generateDescription(objectRecognized);
    updateOutput();
}

//funzione per la visualizzazione della data e dell'ora
function formatDateTime(date) {
    const options = {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
    };
    return date.toLocaleString('en-US', options).replace(',', ''); // Adjust locale as needed
}

function updateOutput() {
    const containers = document.querySelectorAll('.image-container');
    for (let i = 0; i < imageDescriptions.length; i++) {
        const description = containers[i].querySelector('p');
        const formattedDate = formatDateTime(new Date(imageDescriptions[i].date)); // Format the date
        description.textContent = `${formattedDate}`;
    }
}

outputElement.innerHTML

async function detectObjectsGoogleVision(base64Image) {
    const apiKey = 'AIzaSyConyle9qljRMYS9VwR4a8ZlUUEoY6aRwk';
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;


    const requestData = {
        requests: [
            {
                image: {
                    content: base64Image,
                },
                features: [
                    {
                        type: 'OBJECT_LOCALIZATION',
                        maxResults: 5,
                    },
                ],
            },
        ],
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        const data = await response.json();
        const objects = data.responses[0].localizedObjectAnnotations;

        if (objects.length > 0) {
            const objectNames = objects.map((obj) => obj.name).join(', ');
            return objectNames;
        } else {
            return 'Nessun oggetto riconosciuto';
        }
    } catch (error) {
        console.error('Errore nella richiesta Google Vision API:', error);
        return 'Errore nella rilevazione degli oggetti';
    }
}

async function getBase64Image(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result.split(',')[1]);
        };
        reader.readAsDataURL(file);
    });
}

async function generateDescription(objectRecognized) {
    let responseContainer = document.querySelector("#output")
    try {
        responseContainer.textContent = `Loading...`;
        const response = await fetch("https://api.cohere.ai/v1/chat", {
            method: "POST",
            headers: {
                Authorization: "Bearer x0OgpyIayfjTEiU7xWvKGJr0tBavinfLkmngNvct", // Replace with your actual API key
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "command",
                message: `describe the smell of these things: ${objectRecognized} in a funny way and do a text with max 100 tokens.`,
                max_tokens: 100
            }),
        });

        const data = await response.json();

        responseContainer.textContent = `${data.text}`; // Modify based on how the response is structured
    } catch (error) {
        responseContainer.textContent = `Error: ${error}`;
    }
}
//inizializza la fotocamera quando la pagina di carica
window.onload = startCamera;

console.log()