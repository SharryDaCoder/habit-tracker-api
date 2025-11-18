# Architecture Diagram  
![Architecture Diagram](HabitTracker.drawio.png) 

# Architecture Overview

This project uses a fully serverless architecture built on AWS. Users interact with the API through Amazon API Gateway, which serves as the entry point for all HTTP requests. API Gateway triggers an AWS Lambda function that contains the application’s logic for creating habits, recording daily progress, and retrieving habit status. The Lambda function reads and stores data in Amazon DynamoDB across two tables: Habits and HabitEntries. AWS IAM manages secure, least-privilege permissions for Lambda to access DynamoDB. All logs and metrics generated during execution are captured in Amazon CloudWatch for monitoring and troubleshooting.

# habit-tracker-api
A serverless API that allows users to create, track, and monitor their daily habits in a simple, consistent way. The API exposes endpoints for adding habits, recording daily progress, and retrieving the user’s completion status for the day.

# Problem Statement

Many people struggle to maintain consistent daily routines because they lack a simple and organized way to track habits and stay accountable. Existing habit-tracking apps often feel overwhelming, bloated, or paywalled. This project provides a minimal, distraction-free backend system that focuses on the fundamentals: logging habits, marking progress, and reviewing daily status. The lightweight API can integrate with personal tools, mobile apps, dashboards, or future frontend clients.

# User / Customer

This solution is designed for:

Individuals seeking to build consistency in personal routines (e.g., studying, exercising, reading).

Developers who want a ready-made backend for a habit-tracking feature in web or mobile applications.

Small teams or groups looking for simple daily accountability using different x-user-id identifiers.

# AWS Services used: 
| Function / Layer            | AWS Service               |
|-----------------------------|---------------------------|
| Frontend / Entry Point      | API Gateway (REST API)    |
| Compute / Logic Layer       | AWS Lambda                |
| Storage / Database          | Amazon DynamoDB           |
| Notifications / Messaging   | Amazon SNS or SES         |
| Security / IAM Roles        | AWS IAM                   |
| Monitoring / Logging        | Amazon CloudWatch         |

Why REST API (not HTTP API)?

REST API provides richer routing, request/response mapping, debugging options, and fine-grained control; all important when building a multi-endpoint serverless backend.
HTTP API is cheaper and faster, but offers fewer features and less visibility, making REST API a better fit for this project.
