# Setting Up CloudWatch Logs for Docker Containers

This document explains how to set up and view Docker logs in AWS CloudWatch for the Sweat API.

## Prerequisites

1. Your EC2 instance must have an IAM role with CloudWatch Logs permissions
2. Docker must be configured to use the AWS CloudWatch Logs driver
3. AWS CLI should be installed on the EC2 instance

## IAM Permissions Required

The EC2 instance needs the following permissions to write logs to CloudWatch:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": ["arn:aws:logs:*:*:*"]
    }
  ]
}
```

## How to Check/Set IAM Role for EC2

1. Go to the EC2 console
2. Select your instance (i-07ab8c99647799af5)
3. From the "Actions" menu, select "Security" > "Modify IAM role"
4. Verify if the instance has a role with CloudWatch Logs permissions
5. If not, create a new role with the required permissions and attach it to the instance

## Viewing Logs in CloudWatch

Once set up, you can view the logs in CloudWatch:

1. Go to the CloudWatch console
2. In the left navigation, select "Log groups"
3. Look for the log group `/sweat-api/docker-logs`
4. Click on the log group to see the log streams
5. The logs will be stored in the log group `/sweat-api/docker-logs`

## Troubleshooting

If logs aren't appearing in CloudWatch:

1. Check if the EC2 instance has the correct IAM role and permissions
2. Verify the Docker container is running with the awslogs driver
3. Check if there are any errors in the Docker daemon logs:
   ```
   sudo journalctl -u docker
   ```
4. Verify AWS region configuration matches in both the Docker run command and AWS credentials

## CLI Commands to View Logs

You can view logs using the AWS CLI:

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix /sweat-api

# List log streams
aws logs describe-log-streams --log-group-name /sweat-api/docker-logs

# Get log events (replace with your actual stream name)
aws logs get-log-events --log-group-name /sweat-api/docker-logs --log-stream-name sweat-api/container_id
```
