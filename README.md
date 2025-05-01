<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# SWEAT API - Social Media Backend

A fully-featured social media backend API built with NestJS and PostgreSQL, offering robust features for social networking applications.

## Features

- **User Management**: Authentication, profiles, and settings
- **Social Graph**: Friend requests, connections, and mutual friend suggestions
- **Posts and Media**: Create, update, and delete posts with media attachments
- **Comments and Reactions**: Engage with posts through comments and reactions
- **Notifications**: Real-time notifications for social interactions
- **Media Storage**: AWS S3 integration for file storage
- **Authentication**: Firebase authentication integration

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: Firebase Auth
- **Media Storage**: AWS S3
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker/Docker Compose
- **CI/CD**: GitHub Actions

## Project Setup

### Prerequisites

- Node.js v18+
- PostgreSQL
- Firebase project (for auth)
- AWS account (for media storage)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/sweat-api.git
cd sweat-api
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from the example:

```bash
cp .env.example .env
```

4. Configure your environment variables in the `.env` file

### Database Setup

Initialize the database with migrations and seed data:

```bash
npm run init:db
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the server is running, you can access the Swagger API documentation at:

```
http://localhost:3000/docs
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

The application can be deployed using Docker:

```bash
# Build the Docker image
docker build -t sweat-api .

# Run the Docker container
docker run -p 3000:3000 --env-file .env sweat-api
```

The CI/CD pipeline automatically builds and deploys the application to the production environment when changes are pushed to the main branch.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

run all e2e test:
npm run test:e2e -- --runInBand --detectOpenHandles

run specific e2e test
