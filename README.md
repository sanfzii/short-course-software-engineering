# Task Management System - Starter Project

Welcome to the Software Engineering Shortcourse! This is your starter project that you'll build upon over the next 5 days.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

That's it! You should see a welcome page with the course outline.

## Project Structure

```
project/
├── package.json                       # Dependencies
├── server.js                          # Express server
├── requirements.md                    # User stories
├── src/
│   ├── models/
│   │   ├── User.js                    # User model
│   │   └── EnhancedTask.js            # Enhanced task model
│   ├── repositories/
│   │   ├── UserRepository.js          # User data access
│   │   └── TaskRepository.js          # Task data access
│   ├── controllers/
│   │   ├── UserController.js          # User operations
│   │   └── TaskController.js          # Task operations
│   ├── views/
│   │   └── TaskView.js                # UI management
│   ├── utils/
│   │   └── EnhancedStorageManager.js  # Storage management
│   └── app.js                         # Main application
└── public/
    ├── index.html                     # Enhanced UI
    └── styles.css                     # Responsive styles
```

## What You'll Build

Over the 5-day course, you'll transform this simple starter into a full-featured task management application:

- **Day 1:** Basic task management with MVC structure
- **Day 2:** Enhanced design patterns and requirements analysis
- **Day 3:** Comprehensive testing with Jest
- **Day 4:** Git workflow and collaboration features
- **Day 5:** Production deployment and best practices

## Available Scripts

- `npm start` - Start the development server
- `npm test` - Run tests (Day 3+)
- `npm run lint` - Check code quality (Day 3+)
- `npm run format` - Format code with Prettier (Day 3+)

## Getting Help

- Check the course materials for each day
- Ask your instructor if you get stuck
- Review the troubleshooting guides in the course documentation

## Next Steps

1. Make sure `npm start` works and you can see the welcome page
2. Familiarize yourself with the project structure
3. Wait for Day 1 materials to begin implementation

Happy coding! 🚀