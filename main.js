const { execSync } = require('child_process');
const core = require('@actions/core');

const AWS_ACCESS_KEY_ID = core.getInput('access-key-id', { required: true });
const AWS_SECRET_ACCESS_KEY = core.getInput('secret-access-key', { required: true });
const images = core.getInput('images', { required: true }).split(",");
const tag = core.getInput('tag') || "";
const awsRegion = core.getInput('region') || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const direction = core.getInput('direction') || 'push';

function run(cmd, options = {}) {
    if (!options.hide) {
        console.log(`$ ${cmd}`);
    }
    return execSync(cmd, {
        shell: '/bin/bash',
        encoding: 'utf-8',
        env: {
            ...process.env,
            AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY,
        },
    });
}

run(`$(aws ecr get-login --no-include-email --region ${awsRegion})`);

const accountData = run(`aws sts get-caller-identity --output json`);
const awsAccountId = JSON.parse(accountData).Account;

if (direction === 'push') {
    images.forEach((image) => {
        console.log(`Pushing local image ${image} to ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image}`);
        run(`docker tag ${image} ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image}`);
        run(`docker tag ${image} ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image}${tag}`);
        run(`docker push ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image}`);
    })
} else if (direction == 'pull') {
    images.forEach((image) => {
        console.log("Pulling ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image} to ${image}");
        run(`docker pull ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image}`);
        run(`docker tag ${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image} ${image} `);
    })
} else {
    throw new Error(`Unknown direction ${direction}`);
}
