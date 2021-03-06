/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
/* eslint-disable guard-for-in */

import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': process.env.NEXT_PUBLIC_OCR_KEY } }), process.env.NEXT_PUBLIC_OCR_ENDPOINT
);

const computerVision = async (imageUrl, capturedPhoto) => {
  const STATUS_SUCCEEDED = 'succeeded';

  function getTitles(result) {
    const allHeadings = result[0].lines;
    const shortlisted = [];

    allHeadings.map(item => {
      let sum = 0;
      const cords = item.boundingBox;
      for (let i = 0; i < 8; i += 2) {
        sum += cords[i] * cords[(i + 3) % 8]
                    - cords[i + 1] * cords[(i + 2) % 8];
      }

      const area = Math.abs(sum) * 0.5;

      if (area >= 2500) {
        shortlisted.push(item.text);
      }
    });
    return shortlisted;
  }

  function printReceivedResult(readResults) {
    // for (const title in readResults) {
    if (readResults.length > 1) {
      return readResults;
    }
    return ('No Title recoignized');
    // }
  }

  async function readTextFromURL(client, url) {
    let result = await client.read(url);
    const operation = result.operationLocation.split('/').slice(-1)[0];
    while (result.status !== STATUS_SUCCEEDED) {
      result = await client.getReadResult(operation);
    }
    return result.analyzeResult.readResults;
  }

  async function readTextFromFile(client, localImg) {
    // let result = await client.readInStream(() => createReadStream(localImg));
    let result = await client.readInStream(localImg);
    const operation = result.operationLocation.split('/').slice(-1)[0];
    while (result.status !== STATUS_SUCCEEDED) {
      result = await client.getReadResult(operation);
    }
    return getTitles(result.analyzeResult.readResults);
  }

  if (capturedPhoto) {
    // IF PHOTO
    const listOfTitles = await readTextFromFile(computerVisionClient, capturedPhoto);
    const printTitlesFromPhoto = printReceivedResult(listOfTitles);
    return printTitlesFromPhoto;
  }
  // IF IMAGE URL
  const printeTitlesFromImageUrl = await readTextFromURL(computerVisionClient, imageUrl);
  const getValue = printReceivedResult(printeTitlesFromImageUrl);
};

export default computerVision;
