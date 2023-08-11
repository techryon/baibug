const vscode = require("vscode");

class SidebarProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onFetchText": {
                    let editor = vscode.window.activeTextEditor;

                    if (editor === undefined) {
                        vscode.window.showErrorMessage('No active text editor');
                        return;
                    }

                    let text = editor.document.getText(editor.selection);
                    this._view?.webview.postMessage({ type: "onSelectedText", value: text });
                    break;
                }
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }

    revive(panel) {
        this._view = panel;
    }

    _getHtmlForWebview(webview) {
        /*html*/
        return `
          <!DOCTYPE html>
            <html lang="en">
            <head>
              <style>
                .bug_list > p {
                  font-weight: 600;
                  text-overflow: ellipsis;
                  overflow: hidden;
                  white-space: nowrap;
                  cursor: pointer;
                  text-decoration: underline;
                }
              </style>

              <script>
                function callOpenAi() {
                  var text = event.target.innerText;
                  var code = event.target.getAttribute("data-code");

                  var myHeaders = new Headers();
                  var token = "OPENAI_API_KEY";
                  myHeaders.append("Content-Type", "application/json");
                  myHeaders.append("Accept", "application/json");
                  myHeaders.append("Authorization", "Bearer " + token);

                  const raw = JSON.stringify(
                    {
                      "model": "gpt-3.5-turbo",
                      "messages": [
                        {
                          "role": "user",
                          "content": text
                        },
                        {
                          "role": "user",
                          "content": code
                        },
                        {
                          "role": "user",
                          "content": "look at the stack trace referenced in this message and respond in valid JSON where the first key is 'human_readable_error' and value is a human readable explanation of the error, and the second key is 'code_suggestion' and the value is valid Javascript that would fix the error without textual explanation, and a third key that is 'line_number' with the line number where the code suggestion should be"
                        },    
                      ],
                      "temperature": 0.5,
                      "top_p": 1,
                      "n": 1,
                      "stream": false,
                      "max_tokens": 350,
                      "presence_penalty": 0,
                      "frequency_penalty": 0
                    }
                  )

                  var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: raw,
                    redirect: 'manual'
                  };
                  
                  fetch("https://api.openai.com/v1/chat/completions", requestOptions)
                  .then(response => response.text())
                  .then(result => {
                    var json = JSON.parse(result);
                    var results = document.getElementById("results");
                    var resultsP = results.getElementsByTagName("p")[0];
                    var resultsCode = results.getElementsByTagName("code")[0];
                    var code = JSON.parse(json.choices[0].message.content);
                    resultsP.innerHTML = code.human_readable_error;
                    resultsCode.innerHTML = code.code_suggestion;
                  })
                  .catch(error => console.log('error', error));
                }
              </script>
            </head>
            <body>
                <div id="app">
                  <div class="bug_list">
                    <p onclick="callOpenAi()"
                       data-code="import React, { useState } from 'react';function BugComponent(){const [count, setCount] = useState;  const handleIncrement = () => {    setCount(count + 1);  };  return (    <div>      <h1>Buggy React Component</h1><p>Current count: {conut}</p><button onClick={handleIncrement}>Increment</button></div>);} export default BugComponent;">
                      Uncaught ReferenceError: setcount is not defined at handleIncrement (App.jsx:9:5) at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14) at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16) at invokeGuardedCallback (react-dom.development.js:4277:31) at invokeGuardedCallbackAndCatchFirstError (react-dom.development.js:4291:25) at executeDispatch (react-dom.development.js:9041:3) at processDispatchQueueItemsInOrder (react-dom.development.js:9073:7) at processDispatchQueue (react-dom.development.js:9086:5) at dispatchEventsForPlugins (react-dom.development.js:9097:3) at react-dom.development.js:9288:12
                    </p>
                  <div id="results">
                    <h2>Results</h2>
                    <p></p>
                    <code></code>
                  </div>
                </div>
                <script>

                </script>
            </body>
          </html>
        `;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

module.exports = SidebarProvider;
