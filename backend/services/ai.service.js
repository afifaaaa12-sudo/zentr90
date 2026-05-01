import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateResult = async (prompt) => {
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    systemInstruction: `You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.
    
    CRITICAL: You must ALWAYS respond with a SINGLE valid JSON object. NEVER return an array. NEVER return plain text.
    Your JSON object MUST contain exactly these four keys: "text", "files", "buildCommand", "startCommand".
    
    The "text" field should be a short, professional summary of what you've created.
    
    The "files" field MUST be an array of objects, where each object has "filename" and "contents".
    Example: "files": [ { "filename": "index.html", "contents": "..." } ]

    The "actions" field is an optional array of objects for extra commands.
    To delete a file, use: "actions": [ { "type": "delete", "filename": "old-file.js" } ]

    IMPORTANT: YOU MUST GENERATE ALL NECESSARY FILES (index.html, styles.css, etc.) AND INCLUDE THEM IN THE "files" ARRAY. DO NOT LEAVE IT EMPTY.
    
    Examples: 
    <example>
    user:Remove index.html and create app.js
    response: {
        "text": "I've removed index.html and added app.js.",
        "files": [ { "filename": "app.js", "contents": "..." } ],
        "actions": [ { "type": "delete", "filename": "index.html" } ],
        "buildCommand": { "mainItem": "npm", "commands": ["install"] },
        "startCommand": { "mainItem": "node", "commands": ["app.js"] }
    }
    </example>

    <example>
    user:Create a landing page
    response: {
        "text": "I have created a modern landing page.",
        "files": [
            { "filename": "index.html", "contents": "..." },
            { "filename": "styles.css", "contents": "..." }
        ],
        "buildCommand": { "mainItem": "npm", "commands": ["install"] },
        "startCommand": { "mainItem": "npx", "commands": ["serve", "."] }
    }
    </example>

    <example>
    user:Create an express application 
    response: {
        "text": "this is your fileTree structure of the express server",
        "fileTree": {
            "app.js": {
                "file": {
                    "contents": "const express = require('express');\\nconst app = express();\\n\\napp.get('/', (req, res) => {\\n    res.send('Hello World!');\\n});\\n\\napp.listen(3000, () => {\\n    console.log('Server is running on port 3000');\\n});"
                }
            },
            "package.json": {
                "file": {
                    "contents": "{\\n    \\"name\\": \\"temp-server\\",\\n    \\"version\\": \\"1.0.0\\",\\n    \\"main\\": \\"index.js\\",\\n    \\"scripts\\": {\\n        \\"test\\": \\"echo \\\\\\"Error: no test specified\\\\\\" && exit 1\\"\\n    },\\n    \\"dependencies\\": {\\n        \\"express\\": \\"^4.21.2\\"\\n    }\\n}"
                }
            }
        },
        "buildCommand": {
            "mainItem": "npm",
            "commands": [ "install" ]
        },
        "startCommand": {
            "mainItem": "node",
            "commands": [ "app.js" ]
        }
    }
    </example>

    <example>
    user:Hello 
    response: {
        "text": "Hello, How can I help you today?"
    }
    </example>
    
    IMPORTANT : don't use file name like routes/index.js. Ensure the JSON is properly stringified, escaping newlines and quotes correctly.
    `,
    contents: prompt,
    generationConfig: {
      maxOutputTokens: 8192,
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "A professional summary."
          },
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                filename: { type: Type.STRING },
                contents: { type: Type.STRING }
              },
              required: ["filename", "contents"]
            },
            description: "Array of generated files. MUST NOT BE EMPTY."
          },
          buildCommand: {
            type: Type.OBJECT,
            properties: {
              mainItem: { type: Type.STRING, description: "Executable, e.g., 'npm'" },
              commands: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Arguments, e.g., ['install']" }
            },
            required: ["mainItem", "commands"]
          },
          startCommand: {
            type: Type.OBJECT,
            properties: {
              mainItem: { type: Type.STRING, description: "Executable, e.g., 'node'" },
              commands: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Arguments, e.g., ['index.js']" }
            },
            required: ["mainItem", "commands"]
          },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Action type, e.g., 'delete'" },
                filename: { type: Type.STRING, description: "Target filename" }
              },
              required: ["type", "filename"]
            },
            description: "Optional list of actions to perform (like deleting files)."
          }
        },
        required: ["text", "files", "buildCommand", "startCommand"]
      }
    },
  });

  return result.text;
};
