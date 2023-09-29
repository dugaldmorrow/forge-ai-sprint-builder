
/**
 * Set the OpenAPI API Key as follows:
 * forge variables set --encrypt OPEN_API_KEY your-key
 */
export const getOpenAPIKey = () => {
  return process.env.OPEN_API_KEY;
}

export const getOpenAPIModel = () => {
  return 'gpt-3.5-turbo';
  // return 'gpt-4';
}

/*
 * This is the custom field storing story point estimates. In a commercial app, this custom field
 * should be determined programmatically.
 */
export const getStoryPointsCustomFieldId = () => {
  return 'customfield_10016';
}

export const defaultStorypointsPerIssue = () => {
  return 5;
}
