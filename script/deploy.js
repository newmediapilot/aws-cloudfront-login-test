import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { readdirSync, statSync, readFileSync } from "fs";
import { join, relative, sep } from "path";

const { S3_BUCKET, CLOUDFRONT_DISTRIBUTION_ID, AWS_REGION = "us-east-1" } = process.env;

if (!S3_BUCKET || !CLOUDFRONT_DISTRIBUTION_ID) {
  console.error("Missing S3_BUCKET or CLOUDFRONT_DISTRIBUTION_ID in env");
  process.exit(1);
}

const s3 = new S3Client({ region: AWS_REGION });
const cf = new CloudFrontClient({ region: AWS_REGION });

const BUILD_DIR = "dist";

function walk(dir) {
  const items = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      items.push(...walk(full));
    } else {
      items.push(full);
    }
  }
  return items;
}

function getContentType(key) {
  if (key.endsWith(".html")) return "text/html";
  if (key.endsWith(".css")) return "text/css";
  if (key.endsWith(".js")) return "application/javascript";
  if (key.endsWith(".json")) return "application/json";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function uploadFile(filePath) {
  const body = readFileSync(filePath);
  const key = relative(BUILD_DIR, filePath).split(sep).join("/");
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: getContentType(key),
  });
  await s3.send(command);
  console.log(`Uploaded ${key}`);
}

async function uploadAll() {
  const files = walk(BUILD_DIR);
  for (const file of files) {
    await uploadFile(file);
  }
}

async function invalidateCache() {
  const invalidation = new CreateInvalidationCommand({
    DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: `${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ["/*"],
      },
    },
  });
  const result = await cf.send(invalidation);
  console.log("Invalidation created:", result.Invalidation?.Id);
}

(async () => {
  try {
    await uploadAll();
    await invalidateCache();
    console.log("Deployment complete.");
  } catch (err) {
    console.error("Deployment failed:", err);
    process.exit(1);
  }
})();