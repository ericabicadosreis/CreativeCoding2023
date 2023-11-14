const outputElement = document.getElementById('output');
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: 'environment', // Utilizza la fotocamera posteriore, se disponibile
                width: { ideal: 4096 },     // Imposta la larghezza ideale per il formato quadrato
                height: { ideal: 4096 }     // Imposta l'altezza ideale per il formato quadrato
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
    } catch (error) {
        console.error('Error accessing camera:', error);
    }
}

function stopCamera() {
    const stream = video.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => {
        track.stop();
    });

    video.srcObject = null;
}

async function captureImage() {
    context.canvas.width = video.videoWidth;
    context.canvas.height = video.videoWidth; // Imposta l'altezza uguale alla larghezza per un formato quadrato
    context.drawImage(video, 0, 0, video.videoWidth, video.videoWidth);
    stopCamera();
}

async function processImage() {
    context.canvas.width = video.videoWidth;
    context.canvas.height = video.videoWidth;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoWidth);

    const base64Image = canvas.toDataURL('image/png').split(',')[1];
    const objectRecognized = await detectObjectsGoogleVision(base64Image);
    const descriptions = await Promise.all(objectRecognized.split(',').map(generateDescription));

    outputElement.innerText = `Description: ${descriptions.join(', ')}, Objects: ${objectRecognized}`;
}

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
  const apiKey = 'XpbOCIAyMamtaOUQpFwk8UtlzXuLOK3KsHWVM925';  // API cohere
  const endpoint = 'https://api.cohere.ai/v1/generate';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: `descrivi l'odore di ${objectRecognized}`,
        max_tokens: 100,
      }),
    });

    const result = await response.json();
    const answer = result.generations[0].text;
    return answer;
  } catch (error) {
    console.error('Errore nella richiesta Cohere API:', error);
    return 'Errore nella generazione della descrizione';
  }
}
//inizializza la fotocamera quando la pagina di carica
window.onload = startCamera;



