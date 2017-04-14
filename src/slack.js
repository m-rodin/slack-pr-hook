import fetch from 'node-fetch';
import BitbucketClient from './bitbucket';

export default class SlackClient {

    constructor(hook) {
        this.hook = hook;
    }

    route(slackData) {
        let {name: action, value} = slackData.actions[0];

        if (action == 'makePR') {
            switch (value) {
                case 'yes_with_reviewers':
                    return this.makePullRequestAnswerYesWithReviewers;
                case 'yes':
                    return this.makePullRequestAnswerYes;
                case 'no':
                    return this.makePullRequestAnswerNo;
            }
        }
    }

    parseCallback(slackData) {
        return slackData.callback_id.split("_");
    }

    makePullRequestMessage({project, repo, ref, refFull}) {
        let action = 'makePR';
        var callbackId = action + "_" + project + "_" + repo + "_" + ref + "_" + refFull;

        fetch(this.hook, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "text": "Создать Pull Request для ветки *" + ref + "*?",
                "attachments": [
                    {
                        "text": "",
                        "fallback": "Создать Pull Request для ветки " + ref + "?",
                        "callback_id": callbackId,
                        "color": "#3AA3E3",
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": action,
                                "text": "Создать с ревьюерами",
                                "type": "button",
                                "value": "yes_with_reviewers"
                            },
                            {
                                "name": action,
                                "text": "Да, для меня",
                                "type": "button",
                                "value": "yes"
                            },
                            {
                                "name": action,
                                "text": "Нет, рано",
                                "style": "danger",
                                "type": "button",
                                "value": "no"
                            }
                        ]
                    }
                ]
            })
        });
    }

    makePullRequestAnswerYesWithReviewers({ action, project, repo, ref, refFull }, slackMessage) {

    }

    makePullRequestAnswerYes({ action, project, repo, ref, refFull }, slackMessage) {

    }

    makePullRequestAnswerNo({ action, project, repo, ref, refFull }, slackMessage) {
        request({
            url: slackMessage.response_url,
            method: 'POST',
            json: {
                "text": "Создать Pull Request для ветки *" + ref + "*?",
                "attachments": [
                    {
                        "text": "Нет, так нет",
                        "fallback": "Создать Pull Request для ветки " + ref + "?",
                        "callback_id": slackMessage.callback_id,
                        "color": "#3AA3E3",
                        "attachment_type": "default"
                    }
                ]
            }
        });
    }
}