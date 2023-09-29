import { Queue } from '@forge/events';
import Resolver from "@forge/resolver";
import { storage } from "@forge/api";
import openAiUtil from './openAiUtil';

// Set this to false if you with to make too many calls under to AI account.
export const mockAi = false;

export const testQueue = new Queue({ key: 'aiJobQueue' });

const buildPrompt = (issueData) => {
  const prompt = `The following is a JSON formatted list of open issues in a Jira backlog where the field "key" is a unique identifier of the issue and the field "summary" is the summary of the issue and the field "storypoints" is an estimate of the relative effort to implement the issue:

  ${JSON.stringify(issueData)}
  
  Return JSON formatted string representing an array of issue objects sorted such that issues that are dependend on other issues appear after their dependent issues. Each issue object contains a field named "key" identifying the issue key and a field named "summary" identifying the issue summary and a field named "storypoints" identifying the issue storypoints. Do not return any other text other than the JSON.`;
  return prompt;
}

const findIssueDataItemByKey = (issueKey, issueData) => {
  for (const issueDataItem of issueData) {
    if (issueDataItem.key === issueKey) {
      return issueDataItem;
    }
  }
  return undefined;
}

const buildSortedIssueData = (issueData, sortedIssues) => {
  const sortedIssueData = [];
  for (const issue of sortedIssues) {
    const issueKey = issue.key;
    const issueDataItem = findIssueDataItemByKey(issueKey, issueData);
    if (issueDataItem) {
      const item = {
        key: issueDataItem.key,
        summary: issueDataItem.summary,
        storypoints: issueDataItem.storypoints
      }
      sortedIssueData.push(item);
    } else {
      console.warn(`Unable to find issue data with key ${issueKey}.`);
    }
  }
  return sortedIssueData;
}

const fetchSortedIssues = async (issueData) => {
  const prompt = buildPrompt(issueData);
  const aiResult = await openAiUtil.postChatCompletion(prompt);
  console.log(` * aiResult.status: ${aiResult.status}`);
  const result = {
    status: aiResult.status
  }
  if (aiResult.status === 200) {
    console.log(` * aiResult.message: ${aiResult.message}`);
    try {
      const sortedIssues = JSON.parse(aiResult.message);
      result.sortedIssueData = buildSortedIssueData(issueData, sortedIssues);
    } catch (error) {
      aiResult.status = 500;
      aiResult.errorMessage = error;
      console.error(`Unable to parse AI response: ${aiResult.message}`);
    }
  } else {
    result.error = aiResult.message;
  }
  return result;
}

const MOCK_fetchSortedIssues = async (issueData) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const sortedIssuesJson = `[
        {
          "key": "PS-4",
          "summary": "Research what the main use cases are for the Pet Shop application"
        },
        {
          "key": "PS-3",
          "summary": "Research what type of database the Pet Shop application should use"
        },
        {
          "key": "PS-2",
          "summary": "Define the initial database schema"
        },
        {
          "key": "PS-1",
          "summary": "Form to capture new types of products"
        },
        {
          "key": "PS-7",
          "summary": "Create the API with a mock implementation"
        },
        {
          "key": "PS-6",
          "summary": "Replace the mock API implementation with a real implementation"
        },
        {
          "key": "PS-5",
          "summary": "Design the API for web client and server interactions"
        },
        {
          "key": "PS-9",
          "summary": "Design the home page"
        },
        {
          "key": "PS-8",
          "summary": "Implement the home page"
        },
        {
          "key": "PS-10",
          "summary": "Define the different kinds of user groups needed"
        }
      ]`;
      const sortedIssues = JSON.parse(sortedIssuesJson);
      // result.sortedIssueData = buildSortedIssueData(issueData, sortedIssues);

      const result = {
        status: 200,
        sortedIssueData: buildSortedIssueData(issueData, sortedIssues)
      }
      resolve(result);
    }, 5000)
  })
}

const testResolver = new Resolver();
testResolver.define("job-event-listener", async (queueItem) => {
  const job = queueItem.payload;
  const eventContext = queueItem.context;
  console.log(` * job: ${JSON.stringify(job)}`);
  console.log(` * context: ${JSON.stringify(eventContext)}`);
  const jobId = job.id;
  const result = mockAi ? await MOCK_fetchSortedIssues(job.issueData) : await fetchSortedIssues(job.issueData);
  console.log(` * storing result: ${JSON.stringify(result)}`);
  await storage.set(jobId, result);

});
export const aiJobHandler = testResolver.getDefinitions();
