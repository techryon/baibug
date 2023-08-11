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
            <script>
              function callOpenAi() {
                var myHeaders = new Headers();
                var token = "YOUR_TOKEN_HERE";
                myHeaders.append("Content-Type", "application/json");
                myHeaders.append("Accept", "application/json");
                myHeaders.append("Authorization", "Bearer " + token);

                const raw = JSON.stringify(
                  {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                      {
                        "role": "user",
                        "content": "Foobar"
                      },
                      {
                        "role": "user",
                        "content": "Foobar"
                      },
                      {
                        "role": "user",
                        "content": "Foobar"
                      },    
                    ],
                    "temperature": 0,
                    "max_tokens": 7
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
                .then(result => console.log(result))
                .catch(error => console.log('error', error));
              }
            </script>
            </head>
            <body>
                <div id="app">
                  <ul id="error_list">
                    <li>
                      <a class="test" onclick="callOpenAi()">
                        Foo
                      </a>
                    </li>
                  </ul>

                  <div id="results">
                    // Put results here
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
