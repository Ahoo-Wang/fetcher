# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the Fetcher project.

## Workflows

### 1. CI Workflow (`ci.yml`)

- Runs on push and pull request to main branch
- Tests multiple Node.js versions (20, 22)
- Performs build, test, and lint checks

### 2. Integration Test Workflow (`integration-test.yml`)

- Runs on push and pull request to main and master branches
- Tests integration tests on Node.js versions 18.x and 20.x
- Ensures integration with external APIs works correctly

### 3. Release Workflow (`release.yml`)

- Automates the release process
- Creates GitHub releases and publishes packages

### 4. Codecov Workflow (`codecov.yml`)

- Uploads code coverage reports to Codecov
- Tracks test coverage over time

### 5. Gitee Sync Workflow (`gitee-sync.yml`)

- Synchronizes the repository with Gitee mirror
- Maintains consistency across code hosting platforms

## Usage

All workflows run automatically based on their triggers. To manually trigger a workflow:

1. Go to the "Actions" tab in the GitHub repository
2. Select the desired workflow
3. Click "Run workflow" and configure as needed

## Adding New Workflows

To add a new workflow:

1. Create a new `.yml` file in this directory
2. Define the workflow triggers and jobs
3. Follow the existing patterns for consistency
4. Test the workflow by pushing to a branch
