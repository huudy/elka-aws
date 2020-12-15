import * as azure from '@pulumi/azure';

export function createMongoDb(
  projectName: string,
  resourceGroup: azure.core.ResourceGroup
) {
  const cosmosdbAccount = new azure.cosmosdb.Account(`${projectName}-cdb`, {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    offerType: 'Standard',
    geoLocations: [{ location: resourceGroup.location, failoverPriority: 0 }],
    consistencyPolicy: {
      consistencyLevel: 'Session',
    },
    kind: 'MongoDB',
  });

  return cosmosdbAccount;
}

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const postgresql = new aws.rds.Cluster('postgresql', {
  availabilityZones: ['us-west-1a', 'us-west-1b', 'us-west-1c'],
  backupRetentionPeriod: 5,
  databaseName: 'mydb',
  engine: 'aurora-postgresql',
  masterPassword: 'bar',
  masterUsername: 'foo',
  preferredBackupWindow: '07:00-09:00',
});




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
