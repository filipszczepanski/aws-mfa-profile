# AWS MFA Profile Creator

#### What?

CLI Tool for creating a profile based on AWS STS Session Token

```bash
aws sts get-session-token ....
```

#### Why?

AWS CLI can not do that.

## Installation

Install my-project with npm

```bash
npm install --global @szczepanski/aws-mfa-profile
```

## Usage/Examples

```bash
aws-mfa-profile
# Enter AWS profile name "default"
# Enter AWS MFA profile name "default-mfa"
# Enter MFA token "1234"
```

## Requirements

- AWS CLI (version 2)
- Node.js
