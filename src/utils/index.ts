export function convertToJsonString(inputString) {
  // Remove the markdown code block wrapper and newlines
  const cleanedString = inputString
    .replace(/^```json\n/, '') // Remove opening ```json\n
    .replace(/\n```$/, '') // Remove closing \n```
    .replace(/\n/g, ''); // Remove all remaining newlines

  // Parse the JSON to validate it, then stringify it
  try {
    const jsonObject = JSON.parse(cleanedString);
    return JSON.stringify(jsonObject);
  } catch (error) {
    throw new Error('Invalid JSON format: ' + error.message);
  }
}
