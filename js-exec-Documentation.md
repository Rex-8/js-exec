# js-exec

A client-side JavaScript execution package with real-time output streaming. Execute JavaScript code safely in an isolated iframe sandbox with console output capture.

## Features

- **Safe Execution**: Runs JavaScript code in a sandboxed iframe
- **Real-time Output**: Captures `console.log()`, `console.error()`, and `console.warn()` in real-time
- **Timeout Protection**: Automatically terminates code execution after 5 seconds
- **Error Handling**: Catches and reports runtime errors with stack traces
- **Zero Dependencies**: Pure JavaScript, no external dependencies required

## Installation

### Option 1: Download and Include Directly

1. Download the `js-exec` package files
2. Build the package:
   ```bash
   cd js-exec
   npm install
   npm run build
   ```
3. Include the built file in your HTML:
   ```html
   <script src="path/to/js-exec/dist/index.js"></script>
   ```

### Option 2: Serve via Express (Recommended for Development)

```javascript
// server.js
const express = require('express');
const path = require('path');
const app = express();

// Serve js-exec package
app.use('/js-exec', express.static(path.join(__dirname, 'path/to/js-exec/dist')));

app.listen(3000);
```

Then include in your HTML:
```html
<script src="/js-exec/index.js"></script>
```

## Basic Usage

### 1. Create an Executor Instance

```javascript
// Create a new JSExec instance
const executor = new JSExec();

// Or with options (currently no options supported, reserved for future use)
const executor = new JSExec({
  // Future options will go here
});
```

### 2. Listen for Output

```javascript
// Listen for all output messages
executor.onMessage((message) => {
  if (message.type === 'stdout') {
    console.log('[STDOUT]', message.data);
  } else if (message.type === 'stderr') {
    console.error('[STDERR]', message.data);
  }
});
```

### 3. Execute Code

```javascript
// Execute JavaScript code
const code = `
  console.log("Hello, World!");
  console.log("2 + 2 =", 2 + 2);
  
  // This will be caught and reported
  throw new Error("This is a test error");
`;

executor.executeCode(code);
```

### 4. Clean Up (Optional)

```javascript
// Clean up when done
executor.destroy();
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>js-exec Example</title>
</head>
<body>
  <textarea id="codeInput" rows="10" cols="50">
console.log("Hello, World!");
console.log("Current time:", new Date().toLocaleTimeString());
console.error("This is an error message");
console.warn("This is a warning");

// Test arithmetic
const result = 5 + 3;
console.log("5 + 3 =", result);

// Test error handling
throw new Error("Sample error for testing");
  </textarea>
  <button onclick="runCode()">Execute Code</button>
  <button onclick="clearOutput()">Clear Output</button>
  
  <div id="output"></div>

  <script src="/js-exec/index.js"></script>
  <script>
    const outputDiv = document.getElementById('output');
    
    // Create executor
    const executor = new JSExec();
    
    // Listen for output
    executor.onMessage((message) => {
      const div = document.createElement('div');
      div.style.color = message.type === 'stdout' ? 'green' : 'red';
      div.textContent = `[${message.type.toUpperCase()}] ${message.data}`;
      outputDiv.appendChild(div);
      outputDiv.scrollTop = outputDiv.scrollHeight;
    });
    
    function runCode() {
      const code = document.getElementById('codeInput').value;
      executor.executeCode(code);
    }
    
    function clearOutput() {
      outputDiv.innerHTML = '';
    }
  </script>
</body>
</html>
```

## API Reference

### Constructor

#### `new JSExec(options?)`

Creates a new JSExec instance.

**Parameters:**
- `options` (Object, optional): Configuration options (currently unused, reserved for future features)

**Returns:** JSExec instance

### Methods

#### `executeCode(code)`

Executes JavaScript code in the sandbox.

**Parameters:**
- `code` (String): JavaScript code to execute

**Returns:** void

**Example:**
```javascript
executor.executeCode('console.log("Hello, World!");');
```

#### `onMessage(callback)`

Registers a callback to receive output messages.

**Parameters:**
- `callback` (Function): Callback function that receives message objects

**Returns:** Function - Unsubscribe function

**Message Object Structure:**
```javascript
{
  type: 'stdout' | 'stderr',
  data: string
}
```

**Example:**
```javascript
const unsubscribe = executor.onMessage((message) => {
  console.log(message.type, message.data);
});

// Later, to unsubscribe:
unsubscribe();
```

#### `destroy()`

Cleans up the executor and removes the iframe.

**Returns:** void

**Example:**
```javascript
executor.destroy();
```

## Security Features

- **Isolated Execution**: Code runs in a sandboxed iframe with restricted permissions
- **No Network Access**: `connect-src 'none'` CSP prevents network requests
- **Timeout Protection**: Code execution is automatically terminated after 5 seconds
- **Error Isolation**: Errors in executed code don't affect the parent page

## Limitations

- **Execution Time**: Code execution is limited to 5 seconds
- **No Network Requests**: Cannot make HTTP requests, WebSocket connections, etc.
- **No DOM Access**: Cannot access the parent page's DOM
- **No Local Storage**: Cannot access localStorage, sessionStorage, etc.
- **Single-threaded**: Code runs on the main thread (no Web Workers)

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (uses modern JavaScript features)

## Development Setup

1. **Install dependencies:**
   ```bash
   cd js-exec
   npm install
   ```

2. **Build for development:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Test the package:**
   ```bash
   cd test-app
   npm install
   npm start
   # Open http://localhost:3000
   ```

## Error Handling

The executor handles different types of errors:

### Runtime Errors
```javascript
executor.executeCode('throw new Error("Something went wrong");');
// Output: [STDERR] Something went wrong
//         Error stack trace...
```

### Syntax Errors
```javascript
executor.executeCode('console.log("unclosed string');
// Output: [STDERR] SyntaxError: Unterminated string literal
```

### Timeout Errors
```javascript
executor.executeCode('while(true) {}'); // Infinite loop
// Output: [STDERR] Execution timeout: Code took longer than 5000ms
```

## Advanced Usage

### Custom Output Formatting

```javascript
executor.onMessage((message) => {
  const timestamp = new Date().toLocaleTimeString();
  const formatted = `[${timestamp}] ${message.type.toUpperCase()}: ${message.data}`;
  
  if (message.type === 'stdout') {
    console.log('%c' + formatted, 'color: green');
  } else {
    console.error('%c' + formatted, 'color: red');
  }
});
```

### Multiple Executors

```javascript
const executor1 = new JSExec();
const executor2 = new JSExec();

executor1.onMessage(msg => console.log('Executor 1:', msg.data));
executor2.onMessage(msg => console.log('Executor 2:', msg.data));

executor1.executeCode('console.log("From executor 1");');
executor2.executeCode('console.log("From executor 2");');
```

## Troubleshooting

### JSExec is undefined
- Make sure the script is loaded: `<script src="/js-exec/index.js"></script>`
- Check browser console for loading errors
- Verify the file path is correct

### Code doesn't execute
- Check that you've called `onMessage()` to set up output handling
- Verify there are no syntax errors in your code
- Make sure the executor instance was created successfully

### No output appears
- Ensure you're handling both 'stdout' and 'stderr' message types
- Check that your output handling code is working
- Verify the code you're executing actually produces output

## License

MIT License - see LICENSE file for details