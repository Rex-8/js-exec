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
    const MAX_EXECUTION_TIME = 5000;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

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

    function executeWithTimeout(code) {
      const timeoutId = setTimeout(() => {
        window.parent.postMessage({ type: 'stderr', data: 'Execution timeout: Code took longer than 5000ms' }, '*');
      }, MAX_EXECUTION_TIME);

      try {
        eval(code);
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        window.parent.postMessage({ type: 'stderr', data: error.message + (error.stack ? '\\n' + error.stack : '') }, '*');
      }
    }

    window.addEventListener('message', (event) => {
      if (event.data.type === 'EXECUTE_CODE') {
        executeWithTimeout(event.data.code);
      }
    });
  `;
};

JSExec.prototype.setupMessageListener = function() {
  window.addEventListener('message', (event) => {
    if (event.source === this.iframe?.contentWindow) {
      this.listeners.forEach(callback => callback(event.data));
    }
  });
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
};

// Export logic
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = JSExec;
} else {
  window.JSExec = JSExec;
}
