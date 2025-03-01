'use strict';
const fs = require('node:fs');
const { addLabel, deleteLabel, getLabels, getGithub, addAssignees, addReviewer } = require('./common.js');

const possibleReviewers = ['ticaki', 'Armilar', 'TT-Tom17'];
const possibleAssignees = ['ticaki', 'Armilar', 'TT-Tom17'];

function getPullRequestNumber() {
    if (process.env.GITHUB_REF && process.env.GITHUB_REF.match(/refs\/pull\/\d+\/merge/)) {
        const result = /refs\/pull\/(\d+)\/merge/g.exec(process.env.GITHUB_REF);
        if (!result) {
            throw new Error('Reference not found.');
        }
        return result[1];
    }
    if (process.env.GITHUB_EVENT_PATH) {
        const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
        return event.pull_request ? event.pull_request.number : event.issue ? event.issue.number : '';
    }

    throw new Error('Reference not found. process.env.GITHUB_REF and process.env.GITHUB_EVENT_PATH are not set!');
}

async function addLabels(prID, labels) {
    for (let l = 0; l < labels.length; l++) {
        console.log(`adding label ${labels[l]}`);
        await addLabel(prID, [labels[l]]);
    }
}

async function delLabels(prID, labels) {
    const gl = await getLabels(prID);
    for (let l = 0; l < labels.length; l++) {
        for (let i = 0; i < gl.length; i++) {
            if (gl[i].name === labels[l]) {
                console.log(`deleting label ${labels[l]}`);
                await deleteLabel(prID, labels[l]);
            }
        }
    }
}

async function doIt() {
    const prID = getPullRequestNumber();

    console.log(`Process PR ${prID}`);

    if (!prID) {
        console.error('Cannot find PR');
        return 'done'; //Promise.reject('Cannot find PR');
    }

    const pr = await getGithub(
        `https://api.github.com/repos/ioBroker/ticaki/ioBroker.nspanel-lovelace-ui/pulls/${prID}`,
    );
    const sha = pr.head.sha;

    const actions = await getGithub(
        `https://api.github.com/repos/ioBroker/ticaki/ioBroker.nspanel-lovelace-ui/actions/workflows/test-and-release.yml/runs`,
        false,
        { head_sha: sha },
    );

    const creator = pr.user.login;
    const assignees = pr.assignees.map(a => a.login).length !== 0 ? possibleAssignees.filter(r => r !== creator) : [];
    const reviewers = pr.assignees.map(a => a.login).length !== 0 ? possibleReviewers.filter(r => creator !== r) : [];

    actions.workflow_runs.sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1));
    const runningActions = actions.workflow_runs.filter(a => a.status !== 'completed');
    console.log(`Found ${runningActions.length} running actions for PR ${prID}`);

    if (runningActions.length > 1) {
        console.log('    In Progress');
        await delLabels(prID, ['Complete', 'Ready for review']);
        await addLabels(prID, ['In progress']);
    } else if (runningActions.length === 0 && actions.workflow_runs.status === 'completed') {
        console.log('    Complete');
        await delLabels(prID, ['In progress']);
        await addLabels(prID, ['Complete', 'Ready for review']);
        await addAssignees(prID, assignees);
        await addReviewer(prID, reviewers);
    }

    return 'done';
}

// activate for debugging purposes
// process.env.GITHUB_REF = 'refs/pull/2348/merge';
// process.env.OWN_GITHUB_TOKEN = 'insert token';
// process.env.GITHUB_EVENT_PATH = __dirname + '/../event.json';

console.log(`process.env.GITHUB_REF        = ${process.env.GITHUB_REF}`);
console.log(`process.env.GITHUB_EVENT_PATH = ${process.env.GITHUB_EVENT_PATH}`);
console.log(`process.env.OWN_GITHUB_TOKEN  = ${(process.env.OWN_GITHUB_TOKEN || '').length}`);

doIt()
    .then(result => console.log(result))
    .catch(e => console.error(e));
