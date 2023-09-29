import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import Textfield from '@atlaskit/textfield';
import { Label } from '@atlaskit/form';

const defaultMaxStorypointsPerSprint = 20;

function App() {
    const [maxStorypointsPerSprint, setMaxStorypointsPerSprint] = useState(defaultMaxStorypointsPerSprint);
    const [jobId, setJobId] = useState(null);
    const [result, setResult] = useState(null);
    const [buildingSprint, setBuildingSprint] = useState(null);

    let jobPollHandle = null;

    const pollForResult = async (jobId) => {
        console.log(`In pollForResult`);
        if (jobId) {
            const result = await invoke('pollJobResult', { jobId: jobId });
            console.log(`result = ${result ? JSON.stringify(result, null, 2) : 'null'}`);
            if (result && result.status !== 404) {
                setBuildingSprint(false);
                console.log(`Setting result to ${JSON.stringify(result)}...`);
                setResult(result);
                setJobId(null);
                if (jobPollHandle) {
                    console.log(`Clearing interval...`);
                    clearInterval(jobPollHandle);
                    jobPollHandle = null;
                } else {
                    console.log(`No interval handle to clear.`);
                }
            }
        }
    }

    const onMaxStorypointsPerSprintChange = (event) => {
        try {
            const max = parseInt(event.target.value);
            if (max > 0) {
                setMaxStorypointsPerSprint(max);
            } else {
            // TODO: report error
        }
        } catch (error) {
            // TODO: report error
        }
    }

    const onBuildSprintButtonClick = async () => {
        setBuildingSprint(true);
        const jobId = await invoke('buildSprintsFromBacklog', { maxStorypointsPerSprint: 10 });
        setJobId(jobId);
        jobPollHandle = setInterval(async () => {
            await pollForResult(jobId);
        }, 5000);    
    }

    const renderStorypoints = (storypoints) => {
        return <span style={{color: '#777', fontSize: '12px'}}> [{storypoints} storypoints]</span>
    }

    const renderSprintIssue = (issue) => {
        return (
            <div>
                {issue.key}: {issue.summary}
                {renderStorypoints(issue.storypoints)}
            </div>
        );
    }

    const renderSprint = (sprint) => {
        return (
            <div key={`sprint-${sprint.number}`} style={{marginTop: '10px'}}>
                <h3>Sprint {sprint.number} {renderStorypoints(sprint.storypointsTotal)}</h3>
                {sprint.issues.map(renderSprintIssue)}
            </div>
        );
    }

    const renderSprints = () => {
        if (result) {
            if (result.status === 200 && result.sortedIssueData) {
                const renderedSprints = [];
                let thisSprint = {
                    number: 1,
                    issues: [],
                    storypointsTotal: 0
                }
                for (const issue of result.sortedIssueData) {
                    const addIssueToThisSprint = thisSprint.issues.length === 0 || issue.storypoints + thisSprint.storypointsTotal < maxStorypointsPerSprint;
                    if (!addIssueToThisSprint) {
                        const renderedSprint = renderSprint(thisSprint);
                        renderedSprints.push(renderedSprint);
                        thisSprint = {
                            number: thisSprint.number + 1,
                            issues: [],
                            storypointsTotal: 0
                        }
                    }
                    thisSprint.issues.push(issue);
                    thisSprint.storypointsTotal += issue.storypoints;
                }
                return (
                    <div style={{marginTop: '20px'}}>
                        {renderedSprints}
                    </div>
                );
            } else {
                return (
                    <div style={{color: 'red'}}>Error: {result.errorMessage ?? '????'}</div>
                );
            }
        } else {
            return null;
        }
        if (result && result.sortedIssueData) {
            const renderedSprints = [];
            let thisSprint = {
                number: 1,
                issues: [],
                storypointsTotal: 0
            }
            for (const issue of result.sortedIssueData) {
                const addIssueToThisSprint = thisSprint.issues.length === 0 || issue.storypoints + thisSprint.storypointsTotal < maxStorypointsPerSprint;
                if (!addIssueToThisSprint) {
                    const renderedSprint = renderSprint(thisSprint);
                    renderedSprints.push(renderedSprint);
                    thisSprint = {
                        number: thisSprint.number + 1,
                        issues: [],
                        storypointsTotal: 0
                    }
                }
                thisSprint.issues.push(issue);
                thisSprint.storypointsTotal += issue.storypoints;
            }
            return (
                <div style={{marginTop: '20px'}}>
                    {renderedSprints}
                </div>
            );
        } else {
            return null;
        }
    }

    const renderResult = () => {
        if (result && result.sortedIssueData) {
            console.log(`rending sortedIssueData...`, result.sortedIssueData);
            const sortedIssueDataString = JSON.stringify(result.sortedIssueData, null, 2);
            return (
                <pre>{sortedIssueDataString}</pre>
            );
        } else {
            return null;
        }
    }

    const renderMaxStorypointsPerSprintTextField = () => {
        return (
          <>
            <Label htmlFor="max-sprint-storypoints">Maximum storypoints per sprint</Label>
            <Textfield
              id="max-sprint-storypoints"
              value={maxStorypointsPerSprint}
              defaultValue={defaultMaxStorypointsPerSprint}
              placeholder=""
              onChange={onMaxStorypointsPerSprintChange}
            />
          </>
        );
      }

    const renderButton = () => {
        return (
            <div>
                <Button
                    appearance="primary"
                    isDisabled={buildingSprint}
                    onClick={onBuildSprintButtonClick}
                >
                    Build sprint from backlog
                </Button>
            </div>
        );
    }

    return (
        <div>
            {renderButton()}
            {renderMaxStorypointsPerSprintTextField()}
            {buildingSprint ? <Spinner /> : null}
            {renderSprints()}
        </div>
    );
}

export default App;
