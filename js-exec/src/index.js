// Modified index.js
console.log("js-exec script loaded!");

// Use function constructor instead of class
function JSExec(options) {
  console.log("=== DEBUG: JSExec function constructor called ===");
  console.log("Options:", options);

  options = options || {};

  try {
    console.log("=== DEBUG: Setting up properties ===");
    this.iframe = null;
    this.iframeOrigin = options.iframeOrigin || window.location.origin;
    this.listeners = new Set();
    this.isReady = false;
    this.pendingPrompts = new Map(); // Store pending prompt requests

    console.log("=== DEBUG: Properties set, about to setup message listener ===");
    this.setupMessageListener();
    console.log("=== DEBUG: Constructor completed successfully ===");

  } catch (error) {
    console.error("=== DEBUG: Error in JSExec constructor ===");
    console.error("Constructor error:", error);
    throw error;
  }
}

JSExec.prototype.executeCode = function(code) {
  if (!this.iframe) this.createIframe();
  if (!this.isReady) return setTimeout(() => this.executeCode(code), 100);
  this.iframe.contentWindow.postMessage({ type: 'EXECUTE_CODE', code }, '*');
};

JSExec.prototype.createIframe = function() {
  this.iframe = document.createElement('iframe');
  this.iframe.sandbox = 'allow-scripts allow-forms';
  this.iframe.style.display = 'none';
  this.iframe.srcdoc = this.getIframeContent();
  document.body.appendChild(this.iframe);
  this.iframe.onload = () => { this.isReady = true; };
};

JSExec.prototype.getIframeContent = function() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none';">
    </head>
    <body>
      <script>${this.getExecutorScript()}</script>
    </body>
    </html>
  `;
};

JSExec.prototype.getExecutorScript = function() {
  return `
    let promptCounter = 0;
    const pendingPrompts = new Map();

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalPrompt = window.prompt;

    console.log = (...args) => {
      window.parent.postMessage({ type: 'stdout', data: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') }, '*');
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      window.parent.postMessage({ type: 'stderr', data: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') }, '*');
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      window.parent.postMessage({ type: 'stderr', data: '[WARN] ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') }, '*');
      originalWarn.apply(console, args);
    };

    // Override prompt to use postMessage communication
    window.prompt = function(message, defaultValue) {
      const promptId = ++promptCounter;
      
      return new Promise((resolve) => {
        pendingPrompts.set(promptId, resolve);
        
        // Send awaiting-input message to parent
        window.parent.postMessage({
          type: 'awaiting-input',
          promptId: promptId,
          message: message || '',
          defaultValue: defaultValue || ''
        }, '*');
      });
    };

    function executeCode(code) {
      try {
        // Use async function to handle potential promises from prompt
        (async function() {
          try {
            await eval(\`(async function() { \${code} })()\`);
          } catch (error) {
            window.parent.postMessage({ type: 'stderr', data: error.message + (error.stack ? '\\n' + error.stack : '') }, '*');
          }
        })();
      } catch (error) {
        window.parent.postMessage({ type: 'stderr', data: error.message + (error.stack ? '\\n' + error.stack : '') }, '*');
      }
    }

    window.addEventListener('message', (event) => {
      if (event.data.type === 'EXECUTE_CODE') {
        executeCode(event.data.code);
      } else if (event.data.type === 'stdin') {
        // Handle stdin response from parent
        const { promptId, value } = event.data;
        const resolve = pendingPrompts.get(promptId);
        if (resolve) {
          pendingPrompts.delete(promptId);
          resolve(value);
        }
      }
    });
  `;
};

JSExec.prototype.setupMessageListener = function() {
  window.addEventListener('message', (event) => {
    if (event.source === this.iframe?.contentWindow) {
      if (event.data.type === 'awaiting-input') {
        this.handlePromptRequest(event.data);
      } else {
        this.listeners.forEach(callback => callback(event.data));
      }
    }
  });
};

JSExec.prototype.handlePromptRequest = function(promptData) {
  const { promptId, message, defaultValue } = promptData;
  
  // Notify listeners about the prompt request
  this.listeners.forEach(callback => callback({
    type: 'awaiting-input',
    promptId,
    message,
    defaultValue
  }));
};

JSExec.prototype.sendStdinResponse = function(promptId, value) {
  if (this.iframe && this.isReady) {
    this.iframe.contentWindow.postMessage({
      type: 'stdin',
      promptId,
      value
    }, '*');
  }
};

JSExec.prototype.onMessage = function(callback) {
  this.listeners.add(callback);
  return () => this.listeners.delete(callback);
};

JSExec.prototype.destroy = function() {
  if (this.iframe) {
    document.body.removeChild(this.iframe);
    this.iframe = null;
    this.isReady = false;
  }
  this.listeners.clear();
  this.pendingPrompts.clear();
};

// Export logic - make sure it works in all environments
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else {
    // Browser globals
    root.JSExec = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  return JSExec;
}));