import Resolver from '@forge/resolver';
import { testQueue } from './asyncEvents';
import { storage } from "@forge/api";
import api, { route } from "@forge/api";
import { getStoryPointsCustomFieldId, defaultStorypointsPerIssue } from './config';

const resolver = new Resolver();

const getBacklogIssueData = async (projectId) => {
    const maxIssues = 100;
    const storyPointsCustomFieldId = getStoryPointsCustomFieldId();
    const fieldsRequired = `key,summary,${storyPointsCustomFieldId}`;
    const response = await api.asUser().requestJira(route`/rest/api/3/search?maxResults=${maxIssues}&fields=${fieldsRequired}&jql=project=${projectId} and statusCategory != Done`, {
        headers: {
          'Accept': 'application/json'
        }
      });
    console.log(`response.status = ${response.status}`)
    if (response.status === 200) {
        const resultJson = await response.json();
        console.log(`resultJson = ${JSON.stringify(resultJson, null, 2)}`);
        const issueData = [];
        for (const issue of resultJson.issues) {
          issueData.push({
              key: issue.key,
              summary: issue.fields.summary,
              storypoints: issue.fields[storyPointsCustomFieldId] ?? defaultStorypointsPerIssue()
          });
        }
        console.log(`issueData = ${JSON.stringify(issueData, null, 2)}`);
        return issueData;
    } else {
        return undefined;
    }
}

resolver.define('buildSprintsFromBacklog', async (req) => {
  console.log(req);
  const projectId = req.context.extension.project.id;
  console.log(`projectId = ${projectId}`)
  const issueData = await getBacklogIssueData(projectId);
  if (issueData) {
    const jobId = `job-${new Date().getTime()}`;
    const job = {
      id: jobId,
      issueData: issueData
    }
    await testQueue.push(job);
    return jobId;  
  } else {
    return '';
  }
});

resolver.define('pollJobResult', async (req) => {
    console.log(req);
    const jobId = req.payload.jobId;
    console.log(`Getting job result with id ${jobId}...`);
    const maybeResult = await storage.get(jobId);
    if (maybeResult) {
      await storage.delete(jobId);
    }
    console.log(`maybeResult = ${maybeResult ? JSON.stringify(maybeResult, null, 2) : '[undefined]'}.`);
    const pollResult = {
      status: maybeResult ? maybeResult.status : 404,
      sortedIssueData: maybeResult ? maybeResult.sortedIssueData : undefined
    }
    return pollResult;
});

export const handler = resolver.getDefinitions();

