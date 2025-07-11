#!/bin/bash
cd /home/kavia/workspace/code-generation/training-enrollment-system-9237f961/training_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

