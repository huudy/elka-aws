import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
// import * as random from '@pulumi/random';
// import * as awsx from "@pulumi/awsx";
const stackConfig = new pulumi.Config();
const config = {
  // ===== DONT'T TOUCH THIS -> CONFIG REQUIRED BY nx-deploy-it ======
  projectName: stackConfig.get('projectName'),
  // ===== END ======
};
const projectName = config.projectName;
const stageName = pulumi.getStack().split('-')[0];
const region = aws.config.requireRegion();

///////////////////
// RDS DB cluster POSTGRES
///////////////////

// Construct a VPC
// const vpc = new awsx.ec2.Vpc("vpc");

// // Create an Aurora Serverless MySQL database
// const dbsubnet = new aws.rds.SubnetGroup("dbsubnet", {
//     subnetIds: vpc.privateSubnetIds,
// });
// const dbpassword = new random.RandomString("password", {
//   length: 20,
// });
// const elka_postgresql = new aws.rds.Cluster('elka-database-1', {
//   availabilityZones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
//   backupRetentionPeriod: 5,
//   databaseName: 'new_elka_schema',
//   engine: 'aurora-postgresql',
//   masterPassword: 'postgres',
//   masterUsername: 'CyberStuff',
//   applyImmediately: true,
//   skipFinalSnapshot: true, //this prevents 'RDS Cluster FinalSnapshotIdentifier is required when a final snapshot is required' and allows pulumi to delete later on
// });

// const first_instance = new aws.rds.ClusterInstance(`clusterInstances-1`, {
//   identifier: `aurora-cluster-demo-1`,
//   clusterIdentifier: elka_postgresql.id,
//   instanceClass: 'db.t3.medium',
//   engine: aws.rds.EngineType.AuroraPostgresql,
//   applyImmediately: true,
// });

///////////////////
// Lambda Function
///////////////////

const role = new aws.iam.Role(`${projectName}-lambda-role`, {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: 'lambda.amazonaws.com',
  }),
});

const policy = new aws.iam.RolePolicy(`${projectName}-lambda-policy`, {
  role,
  policy: pulumi.output({
    Version: '2012-10-17',
    Statement: [
      {
        Action: ['logs:*', 'cloudwatch:*'],
        Resource: '*',
        Effect: 'Allow',
      },
    ],
  }),
});

const lambda = new aws.lambda.Function(
  `${projectName}-function`,
  {
    vpcConfig: {
      securityGroupIds: ['sg-fe7b62b2'],
      subnetIds: ['subnet-700c6a2a', 'subnet-2545716d', 'subnet-a2dffac4'],
      // vpcId: 'vpc-e279919b',
    },
    memorySize: 128,
    code: new pulumi.asset.FileArchive('./functions/dist/main'),
    runtime: 'nodejs12.x',
    handler: 'index.handler',
    role: role.arn,
    environment: {
      variables: {
        POSTGRES_HOST: stackConfig.get('POSTGRES_HOST'),
        POSTGRES_PORT: stackConfig.get('POSTGRES_PORT'),
        POSTGRES_USER: stackConfig.get('POSTGRES_USER'),
        POSTGRES_PASSWORD: stackConfig.get('POSTGRES_PASSWORD'),
        POSTGRES_DB: stackConfig.get('POSTGRES_DB'),
        SYNC_DB: stackConfig.get('SYNC_DB'),
        PORT: stackConfig.get('PORT'),
        USE_SSL: stackConfig.get('USE_SSL'),
        JWT_ACCESS_TOKEN_SECRET: stackConfig.get('JWT_ACCESS_TOKEN_SECRET'),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: stackConfig.get(
          'JWT_ACCESS_TOKEN_EXPIRATION_TIME'
        ),
        JWT_REFRESH_TOKEN_SECRET: stackConfig.get('JWT_REFRESH_TOKEN_SECRET'),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: stackConfig.get(
          'JWT_REFRESH_TOKEN_EXPIRATION_TIME'
        ),
      },
    },
  },
  { dependsOn: [policy] }
);

///////////////////
// APIGateway RestAPI
///////////////////

function lambdaArn(arn: string) {
  return `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${arn}/invocations`;
}

// Create the API Gateway Rest API, using a swagger spec.
const restApi = new aws.apigateway.RestApi(
  `${projectName}-restapi`,
  {},
  { dependsOn: [lambda] }
);

const rootApigatewayMethod = new aws.apigateway.Method(
  `${projectName}-root-apigateway-method`,
  {
    restApi: restApi,
    resourceId: restApi.rootResourceId,
    httpMethod: 'ANY',
    authorization: 'NONE',
  }
);
const rootApigatewayIntegration = new aws.apigateway.Integration(
  `${projectName}-root-apigateway-integration`,
  {
    restApi,
    resourceId: restApi.rootResourceId,
    httpMethod: rootApigatewayMethod.httpMethod,
    integrationHttpMethod: 'POST',
    type: 'AWS_PROXY',
    uri: lambda.arn.apply(lambdaArn),
  }
);

const proxyResource = new aws.apigateway.Resource(
  `${projectName}-proxy-resource`,
  {
    restApi,
    parentId: restApi.rootResourceId,
    pathPart: '{proxy+}',
  }
);

const proxyMethod = new aws.apigateway.Method(`${projectName}-proxy-method`, {
  restApi: restApi,
  resourceId: proxyResource.id,
  httpMethod: 'ANY',
  authorization: 'NONE',
});

const proxyIntegration = new aws.apigateway.Integration(
  `${projectName}-proxy-integration`,
  {
    restApi,
    resourceId: proxyResource.id,
    httpMethod: proxyMethod.httpMethod,
    integrationHttpMethod: 'POST',
    type: 'AWS_PROXY',
    uri: lambda.arn.apply(lambdaArn),
  }
);

// Create a deployment of the Rest API.
const deployment = new aws.apigateway.Deployment(
  `${projectName}-restapi-deployment>`,
  {
    restApi: restApi,
    // Note: Set to empty to avoid creating an implicit stage, we'll create it explicitly below instead.
    stageName: '',
  },
  { dependsOn: [rootApigatewayIntegration, proxyIntegration] }
);

// Create a stage, which is an addressable instance of the Rest API. Set it to point at the latest deployment.
const stage = new aws.apigateway.Stage(`${projectName}-restapi-stage`, {
  restApi: restApi,
  deployment: deployment,
  stageName: stageName,
});

// Give permissions from API Gateway to invoke the Lambda
const invokePermission = new aws.lambda.Permission(
  `${projectName}-restapi-lambda-permission`,
  {
    action: 'lambda:invokeFunction',
    function: lambda,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${deployment.executionArn}*/*`,
  }
);

exports.endpoint = pulumi.interpolate`${deployment.invokeUrl}${stageName}`;
