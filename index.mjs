#!/usr/bin/env node

import inquirer from 'inquirer';
import child_process from 'node:child_process';
import { promisify } from 'node:util';

async function execute(command) {
  const { stdout } = await promisify(child_process.exec)(command);

  return stdout;
}

async function getAWSProfileList() {
  return (await execute('aws configure list-profiles'))
    .split('\n')
    .filter(Boolean);
}

async function init() {
  const awsProfileList = await getAWSProfileList();

  try {
    const results = await inquirer.prompt([
      {
        type: 'list',
        name: 'profileName',
        message: 'Enter AWS profile name',
        choices: awsProfileList,
      },
      {
        type: 'input',
        name: 'mfaProfileName',
        message: 'Enter AWS MFA profile name',
        default: ({ profileName }) => `${profileName}-mfa`,
      },
      { type: 'input', name: 'mfaToken', message: 'Enter MFA token' },
    ]);

    const {
      profileName,
      mfaProfileName,
      mfaToken,
      sessionDuration = 43_200,
    } = results;

    const serialNumber = JSON.parse(
      await execute(
        `aws iam --profile ${profileName} list-mfa-devices --output json --query "MFADevices[0].SerialNumber"`
      )
    );

    if (!serialNumber) {
      throw new Error(
        'No mfa device on your account. Go to AWS console to create one'
      );
    }

    const credentialsResponse = await execute(
      `aws sts get-session-token --profile ${profileName} --serial-number ${serialNumber} --token-code ${mfaToken} --duration-second ${sessionDuration}`
    );

    const credentials = JSON.parse(credentialsResponse).Credentials;

    await execute(
      `aws configure --profile ${mfaProfileName} set aws_access_key_id ${credentials.AccessKeyId}`
    );
    await execute(
      `aws configure --profile ${mfaProfileName} set aws_secret_access_key ${credentials.SecretAccessKey}`
    );
    await execute(
      `aws configure --profile ${mfaProfileName} set aws_session_token ${credentials.SessionToken}`
    );
    await execute(
      `aws configure --profile ${mfaProfileName} set source_profile ${profileName}`
    );

    console.info(
      await execute(`aws configure --profile ${mfaProfileName} list`)
    );

    console.info(
      `🎉 Great! Your profile is ready to use: ${mfaProfileName}\n   E.g. 'aws s3 --profile ${mfaProfileName} ls'.`
    );
  } catch (error) {
    console.error(error);
  }
}

init();
