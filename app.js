import express from 'express';
import logfmt from 'logfmt';
import request from 'request';
import bodyParser from 'body-parser';

import config from './src/config';
import SlackClient from './src/slack';
import BitbucketClient from './src/bitbucket';
import JiraClient from './src/jira';

var app = express();
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Сюда приходит slack когда нажали кнопочку
app.post('/slack-callback', function (req, res) {
    var slackData = JSON.parse(req.body.payload);

    var slack = new SlackClient(config.slackHook);

    var actionData    = slack.parseCallback(slackData);
    var actionFuntion = slack.route(actionData);
    
    actionFuntion(actionData, slackData);

    res.status(200).end();
});

// Сюда приходит bitbucket когда что-то меняется в репозитории
app.post('/bitbucket-callback', function (req, res) {
    // отсекаем обновление тегов
    if (req.body.refFull.split("/")[1] !== "heads") {
        res.status(200).end();
        return;
    }

    // отсекаем не нужные экшены     
    if (!["UPDATE", "ADD"].includes(req.body.action)) {
        res.status(200).end();
        return;
    }
    
    let slack = new SlackClient(config.slackHook);
    let bitbucket = new BitbucketClient(config.bitbucket);
    let jira = new JiraClient(config.jira);

    let { project, repo, ref, refFull } = req.body;

    bitbucket.findPullRequest(project, repo, ref, refFull).then((prs) => {
        if (prs.length == 0) {
            slack.makePullRequestMessage(req.body);
        } else {
            // проверим на ревьюеров
        }
    });

    let issue = "JOB-25277";

    Promise.all([
            jira.getComponentByRepo(project, repo),
            jira.getIssue(issue)
        ]).then(results => {
            let component = results[0];
            let issueFields = results[1].fields;

            let newBranch = issueFields.customfield_10131 ? issueFields.customfield_10131 : ref;
            let newComponent = issueFields.components.length ? issueFields.components[0].name : component;

            return jira.updateIssue(issue, newComponent, newBranch);
        })
        .catch(data => console.log(data));

    res.status(200).end();
});

app.get('*', function (req, res) {
    res.send('It\'s work fine');
});

app.listen(5000, function () {
    let slack = new SlackClient(config.slackHook);
    let bitbucket = new BitbucketClient(config.bitbucket);
    let jira = new JiraClient(config.jira);

    let project = 'zp', repo = 'api', ref = 'feature-nearest-subway';

    Promise.all([
            jira.getComponentByRepo(project, repo),
            jira.getIssue("JOB-25277")
        ]).then(results => {
            let component = results[0];
            let issue = results[1].fields;

            let newBranch = issue.customfield_10131 ? issue.customfield_10131 : ref;
            let newComponent = issue.components.length ? issue.components[0].name : component;

            return jira.updateIssue("JOB-25277", component, ref);
        })
        .catch(data => console.log(data));
    
    console.log('BitBucket PR Hook bridge listening on:', 5000);
});
