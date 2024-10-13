# Calendar Tasks Application Requirements

## Project Overview

The Calendar Tasks Application is a web-based tool designed to help users manage their tasks with an interactive calendar interface, which also integrates with their day-to-day tasks and meetings from their calendar. It allows users to manage and organize tasks and meetings across different time frames (month, week, day views) and provides a comprehensive task management system integrated with a calendar view.

## Feature Requirements

### 1. Calendar View
- Display a calendar with month, week, and day views. The views can be toggled between based on the value of a dropdown menu.
- Allow navigation between different time periods based on the view selected.
- Highlight the current day and selected day.
- Provide the option to integrate with Google Calendar. 

### 2. Task Management
- Add new tasks with the following details:
  - Task name
  - Description
  - Priority (Low, Medium, High)
  - Project name
  - Deadline
  - Time required
- Display tasks on the calendar based on the deadline date.
- Show a list of tasks in a table format based on the selected calendar view. If a user is looking at the day view, they see the tasks for that particular day, then the same logic for week, month.
- Allow filtering and sorting of tasks
- Allow choosing of projects from a dropdown menu if there are already available projects in the database for the particular user in question. If not, allow the user to add a new project to the database.

### 3. Authentication and integration with Google Calendar
- Use Firebase for authentication, prompting a 'sign in with Google' button on the main page
- Integrate with Google Calendar to fetch and display events

### 4. User Interface
- Implement a dark mode toggle
- Responsive design for various screen sizes
- Use a modern, clean UI with clear typography and intuitive controls

### 5. Data Persistence
- Store tasks in a MySQL database, credentials stored in .env file
- Use Prisma as an ORM for database operations

### 6. Recommendations section for tasks 
- Provide a AI chatbot widget which scans over the various tasks and projects in the table to create recommendations of tasks for each project, with suggested time durations, deadline dates and task descriptions. These suggestions should be able to be confirmed or rejected by the user.

### 6. Additional Features
- Display recommended actions based on task priority and deadlines
- Allow users to select projects from a list or add new projects

## Dependencies and Libraries

1. [Next.js](https://nextjs.org/) - React framework for building the application
2. [React](https://reactjs.org/) - JavaScript library for building user interfaces
3. [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript
4. [date-fns](https://date-fns.org/) - Modern JavaScript date utility library
5. [Lucide React](https://lucide.dev/) - Beautiful & consistent icon toolkit
6. [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
7. [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript
8. [shadcn/ui](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS

## Relevant docs

## File Structure
calendar_assistant_application/
├── .next/
├── app/
├── components/
├── hooks/
├── lib/
├── node_modules/
├── requirements/
│   └── frontend_requirements.md
├── .eslintrc.json
├── .gitignore
├── components.json
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
└── tsconfig.json

## Rules
- All new components should go in /components and be named like example-component.tsx unless otherwise specified
- All new pages go in /app