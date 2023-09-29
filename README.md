
# Forge AI Sprint Builder

This app demonstrates how to build a Forge apps that delegates AI processing to an asynchronous task such that it may be able to benefit from a longer runtime timeout and therefore be more resilient to expensive AI API requests.

If this is all a bit new to you, you may also like these other example apps and tutorials:
* [Getting started: creating a hello world app in Forge](https://developer.atlassian.com/platform/forge/getting-started/)
* [The basics of building a Forge AI app](https://blog.developer.atlassian.com/forge-ai-basics/)

## App overview

The app provides functionality to build sprints from the project's backlog.

The app uses the `jira:projectPage` extension point to render a user interface (UI) that allows the user to initiate the building of the sprints. The title of the project page is "AI Sprint Builder". The app uses AI to sort the issues into a logical execution order based on their summaries. The sorted issues are returned to the UI which renders them in order, grouping them into sprints.

The sorted issues are returned to the UI which then groups them into sprints and presents them. The UI also has a text field allowing ther user to change the maximum number of story points per sprint.

## Implementation overview

The UI is implemented with [Custom UI](https://developer.atlassian.com/platform/forge/custom-ui/iframe/). The UI sends a `buildSprintsFromBacklog` [invoke](https://developer.atlassian.com/platform/forge/custom-ui-bridge/invoke/#invoke) request to the backend to initiate the AI operation. This operation generates an ID to represent the job and delegates the job to another function using the [async event API](https://developer.atlassian.com/platform/forge/runtime-reference/async-events-api/#async-events-api). At this point, the job ID is returned to the UI and the function invocation ends. 

The asynchronous function invocation is where the AI call occurs. The result of the call is stored in [Forge Storage](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/#storage-api) in a record with a key based on the job ID.

Whilst the back end is waiting for the AI API to return a result, the app's front end periodically polls it's backend until the result is available. This is done by sending a `pollJobResult` [invoke](https://developer.atlassian.com/platform/forge/custom-ui-bridge/invoke/#invoke) request. The implementation of this request simply involves attempting to retrieve the result from [Forge Storage](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/#storage-api). The UI passes the job ID so the back end knows the key of the storage record to check. 

## Limitations and improvements

* The app doesn't actually create or modify sprints since it doesn't contribute to the goal of the app which is is to explain how to manage long running AI tasks.
* For simplicity, the app mainly implements "happy paths". A commercial quality app should ensure error conditions are properly handled.
* One particular known error condition involves the AI API returning a response that is not JSON formatted. This seems to occur from time to time and could be reduced by improving the prompt.
* The code is a mix of Typescript and Javascript. Converting some of the Javascript to Typescript would improve maintainability.
* The app has a hard coded value for the story points field (see `config.ts``), but it would be necessary to determine this dynamically.

## Setup

Run `forge variables set --encrypt OPEN_API_KEY {your-open-ai-key}` and deploy with `yarn deploy` before

## Prompt design

This section defines the prompt used to request the issue sorting. The prompt and the AI call is not the central learning point for this example app so little effort has been made to optimise it.

### Current prompt format

The following is a JSON formatted list of open issues in a Jira backlog where the field "key" is a unique identifier of the issue and the field "summary" is the summary of the issue and the field "storypoints" is an estimate of the relative effort to implement the issue:

[{
  "issuekey: "PS-1",
  "summary: "Form to capture new types of products",
  "storypoints": 3
}, {
  "issuekey: "PS-2",
  "summary: "Define the initial database schema",
  "storypoints": 5
}, {
  "issuekey: "PS-3",
  "summary: "Research what type of database the Pet Shop application should use",
  "storypoints": 1
}, {
  "issuekey: "PS-4",
  "summary: "Research what the main use cases are for the Pet Shop application",
  "storypoints": 3
}, {
  "issuekey: "PS-5",
  "summary: "Design the API for web client and server interactions",
  "storypoints": 5
}, {
  "issuekey: "PS-6",
  "summary: "Replace the mock API implementation with a real implementation",
  "storypoints": 3
}, {
  "issuekey: "PS-7",
  "summary: "Create the API with a mock implementation",
  "storypoints": 1
}, {
  "issuekey: "PS-8",
  "summary: "Implement the home page",
  "storypoints": 5
}, {
  "issuekey: "PS-9",
  "summary: "Design the home page",
  "storypoints": 3
}, {
  "issuekey: "PS-10",
  "summary: "Define the different kinds of user groups needed",
  "storypoints": 1
}, {
  "issuekey: "PS-11",
  "summary: "Add a search capability to the user experience",
  "storypoints": 3
}, {
  "issuekey: "PS-12",
  "summary: "Enhance the API with a search function",
  "storypoints": 3
}, {
  "issuekey: "PS-13",
  "summary: "Define the types of entities and the relationships between them that will need to be stored in the database",
  "storypoints": 1
}, {
  "issuekey: "PS-14",
  "summary: "Define the scopes required for the API",
  "storypoints": 5
}, {
  "issuekey: "PS-15",
  "summary: "Research whether REST or GraphQL would be a better fit for the type of API",
  "storypoints": 3
}, {
  "issuekey: "PS-16",
  "summary: "Create a regression test for the search functionality",
  "storypoints": 1
}, {
  "issuekey: "PS-17",
  "summary: "Demonstrate the API capabilities to stakeholders",
  "storypoints": 1
}, {
  "issuekey: "PS-18",
  "summary: "Demonstrate the initial user experience to stakeholders",
  "storypoints": 3
}]

Return JSON formatted string representing an array of issue objects sorted such that issues that are dependend on other issues appear after their dependent issues. Each issue object contains a field named "key" identifying the issue key. Do not return any other text other than the JSON.
