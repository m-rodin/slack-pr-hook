import fetch from 'node-fetch';

export default class JiraClient {

    constructor({ url, user, password }) {
        this.url = url;
        this.authHeader = "Basic " + new Buffer(user + ":" + password).toString("base64");
    }

    getIssue(issue) {
        return fetch(this.url + "/issue/" + issue, {
                headers: {"Authorization": this.authHeader}
            })
            .then(response => response.json());
    }

    updateIssue(issue, component, ref) {
        return fetch(this.url + "/issue/" + issue, {
            headers: {
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json'
            },
            method: 'PUT',
            body: JSON.stringify({
                "update": {
                    "components": [
                        {set: [{name: component}]}
                    ],
                    "customfield_10131": [
                        {set: ref}
                    ],
                }
            })
        });
    }

    getComponentByRepo(project, repo) {
        return fetch(this.url + "/project/JOB/components", {
                headers: {"Authorization": this.authHeader}
            })
            .then(response => response.json())
            .then(data => {
                for (var i in data) {
                    let description = "git:" + project + "/" + repo;

                    if (data[i].description == description.toLowerCase()) {
                        return data[i].name;
                    }
                }

                return undefined;
            });
    }
}