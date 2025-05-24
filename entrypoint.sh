#!/bin/sh
set -xe

# Update package lists
apk update

# Install Git
apk add git

# Current working directory
pwd

# List files in the current directory
ls -lanh
yarn dbm:run
yarn dbs:run

pm2-runtime --json ./pm2-process.yml
