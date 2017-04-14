import fetch from 'node-fetch';

export default class BitbucketClient {

    constructor({ url, user, password }) {
        this.url = url;
        this.authHeader = "Basic " + new Buffer(user + ":" + password).toString("base64");
    }

    findPullRequest(project, repo, ref, refFull) {
        return fetch(this.url + "/projects/" + project + "/repos/" + repo + "/pull-requests?at=" + refFull, {
                headers: {"Authorization": this.authHeader}
            })
            .then(response => response.json())
            .then(data => data.values);
    }

    createPullRequest(project, repo, ref, refFull, reviewers = []) {
        return fetch(this.url + "/projects/" + project + "/repos/" + repo + "/pull-requests", {
            headers: {
                "Authorization": this.authHeader,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                "title": "Talking Nerdy",
                "description": "It’s a kludge, but put the tuple from the database in the cache.",
                "state": "OPEN",
                "open": true,
                "closed": false,
                "locked": false,
                "fromRef": {
                    "id": refFull,
                    "repository": {
                        "slug": repo,
                        "name": null,
                        "project": {
                            "key": project
                        }
                    }
                },
                "toRef": {
                    "id": "refs/heads/master",
                    "repository": {
                        "slug": repo,
                        "name": null,
                        "project": {
                            "key": project
                        }
                    }
                },
                "reviewers": reviewers.map(name => {
                    return {
                        user: {
                            name: name
                        }
                    };
                })
            })
        });
    }

    getCommitMessages(project, repo, ref, refFull) {
        return fetch(this.url + "/projects/" + project + "/repos/" + repo + "/commits?since=master&until=" + ref, {
                headers: {"Authorization": this.authHeader}
            })
            .then(response => response.json())
            .then(data => {
                return data.values.map(commit => commit.message)
            });
    }
}